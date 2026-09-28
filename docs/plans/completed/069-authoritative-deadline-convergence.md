# 069 — T1B.1: Authoritative Deadline Convergence

Status: complete.
Baseline: `7df22575d86bbc3c3aa790068ee78dbb2a18f235` (T1A.3B: command supervisor hardening).

## Objective

Converge overdue timed sessions through the existing frozen-workspace finality path while
preserving trusted pre-deadline manual submission admission and same-session FIFO ordering.

## Scope

- Bound command execution by exact remaining assessment milliseconds.
- Admit manual submission with a trusted server timestamp and immediate coordinator enqueue.
- Share one finalization engine for candidate submission and timeout closure.
- Sweep overdue `ACTIVE` timed sessions in the persistent single-process runtime.
- Retry already-paused finalization without unpausing.
- Preserve AI `session_ended`, evidence, cleanup, and failure semantics.
- Add deterministic race/failure tests plus real Docker boundary proofs.
- Update timing and sandbox architecture docs.

## Excluded

- Restart recovery and paused-sandbox rediscovery.
- Multi-process or serverless locking.
- Candidate timer, submission-review, completion, or evaluator UI.
- New durable lifecycle states.

## Implementation

1. **`SandboxAdapter` interface** (`sandbox.ts`):
   - Added `DEFAULT_COMMAND_TIMEOUT_MS = 30_000`.
   - Added `isFrozen(sessionId)` method to detect already-paused containers.
   - Made `captureFrozenEvidence` `baselineTree` parameter optional (recovery path has no baseline).

2. **`DockerSandboxAdapter`**:
   - Implemented `isFrozen()` via `docker inspect -f '{{.State.Paused}}'`.
   - Made `freeze()` idempotent — no-op when already paused.
   - `captureFrozenEvidence` falls back to empty baseline string when `baselineTree` is omitted.

3. **`MockSandboxAdapter`**:
   - Implemented `isFrozen()` from internal sandbox map.
   - Optional `baselineTree` falls back to stored `sandbox.baselineTree`.

4. **`SessionService`**:
   - `submit()` captures `admittedAt = this.now()` before the FIFO coordinator queue — trusts the pre-queue timestamp for deadline checking inside the lock body.
   - New private `finalizeByTokenHash(tokenHash, admittedAt, requestedClosureReason)` is the single finalization engine for both manual submission and timeout closure. Closure reason is determined inside the lock by comparing `admittedAt` to the session deadline.
   - `commandTimeoutMs` option (default `DEFAULT_COMMAND_TIMEOUT_MS`). `executeCommand` passes `min(commandTimeoutMs, deadline − now)` to the sandbox adapter.
   - `onSessionFinalized` hook replaces the `next/server after()` call in the submit route — ensures reconstruction runs after both manual and timeout closure.
   - New `finalizeTimedOutSession(sessionId, observedAt)` for sweeper delegation.
   - New `sweepTimedOutSessions(observedAt)` — filters overdue active timed sessions and finalizes each via the coordinator.
   - `getSessionService()` wires `onSessionFinalized` to `ensurePostSubmissionReconstruction`.

5. **`SqliteSessionStore`**:
   - Added `findActiveTimed()` — queries `ACTIVE` sessions with non-null `activated_at` and `duration_seconds`.

6. **`SessionTimeoutSweeper`** (new file):
   - `startSessionTimeoutSweeper()` registers a 1-second `setInterval` guarded by a `Symbol.for('hirearchy.sessionTimeoutSweeper')` global singleton key and a re-entrancy flag.
   - Timer is `unref()`'d so it does not keep the process alive.

7. **`apps/web/instrumentation.ts`** (new file):
   - Next.js `register()` hook — starts the sweeper once in the Node.js runtime on server startup.

8. **Submit route** (`submit/route.ts`):
   - Removed `after()` call and explicit `ensurePostSubmissionReconstruction` import; reconstruction is now handled by `SessionService.onSessionFinalized`.

9. **Test fixes** (three pre-existing tests broken by T1B.1 contract changes):
   - `request-bound-deadline-cutoff.test.ts` test 20: session now created with far-future deadline (real wall-clock compatible) so the route's real `Date.now()` sees it as pre-deadline.
   - `command-supervisor-hardening.test.ts`: `SessionService` constructed with `commandTimeoutMs: 400` to match adapter's `defaultTimeoutMs`.
   - `manual-demo.test.ts`: `SessionService` constructed with `commandTimeoutMs: 3000` to match adapter's `defaultTimeoutMs`.

10. **`docs/architecture/candidate-timing-contract.md`**:
    - Added section 11: Authoritative Deadline Convergence, documenting all T1B.1 mechanics.

## Verification

- New T1B.1 suite: 12/12 passed.
- T1A.2 regression: 22/22 passed.
- T1A.3A regression (Docker): 32/32 passed.
- T1A.3B regression (Docker): 17/17 passed.
- A1/A2, F03, S1 regressions: 46/46 passed.
- `npm run verify`: Prettier, ESLint, TypeScript, Vitest (489 passed, 6 skipped), Next.js production build — all passed.
