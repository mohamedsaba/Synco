# Candidate Timing Contract

Status: Authoritative Foundation (Slice T1A.1)

## 1. Core Principles

1. **Server-Authoritative Timing**:
   - Assessment timing is governed exclusively by the server service clock.
   - Client clocks, browser timestamps, and candidate devices are never trusted for session duration or deadline calculation.

2. **Immutable Duration Snapshot**:
   - Every candidate session snapshots an authoritative duration in integer seconds (`durationSeconds`) from the scenario definition at session creation time.
   - Subsequent changes to scenario definitions or global defaults do not alter the duration of already-created sessions.
   - If a scenario specification lacks a valid positive integer duration, session creation fails explicitly (`INVALID_SCENARIO_DURATION`). Defaults and fallbacks are prohibited.

3. **No Persisted `expiresAt` (Avoid Duplicate Truth)**:
   - The session deadline is strictly a derived property:
     $$\text{deadline} = \text{activatedAt} + \text{durationSeconds}$$
   - No separate `expiresAt` column or property is persisted in the database. Persisting both `activatedAt`, `durationSeconds`, and `expiresAt` introduces duplicate truth and synchronization hazards.

4. **Canonical Deadline Derivation (`deriveSessionDeadline`)**:
   - If `activatedAt === null` (e.g. `CREATED` session before candidate start), deadline is `null`.
   - If `durationSeconds === null` (legacy untimed session), deadline is `null`.
   - If `durationSeconds <= 0`, deadline is `null`.
   - Otherwise, deadline is returned as a canonical UTC ISO-8601 string.

5. **Durable Lifecycle Invariant**:
   - The durable lifecycle of candidate assessment sessions consists solely of:
     $$\text{CREATED} \longrightarrow \text{ACTIVE} \longrightarrow \text{SUBMITTED}$$
   - There is **NO** durable `EXPIRED`, `FINALIZING`, or `COMPLETED` session state.
   - Session completion and closure reasons are distinguished cleanly by `closureReason`:
     - Candidate manual submission: `status = SUBMITTED`, `closureReason = candidate_submission`
     - Assessment expiry/timeout: `status = SUBMITTED`, `closureReason = timeout`
   - Active and created sessions maintain `closureReason = null`.

6. **Legacy Untimed Compatibility**:
   - Historical sessions predating authoritative timing retain `duration_seconds = NULL`.
   - Historical sessions with `status = 'SUBMITTED'` and `closure_reason IS NULL` are backfilled to `closure_reason = 'candidate_submission'` because timeout closure did not exist historically.
   - Historical `ACTIVE` or `CREATED` sessions retain `closure_reason = NULL`.
   - Durations are never fabricated or backfilled for historical untimed sessions.

7. **Minimal Candidate Timing Projection**:
   - The candidate surface exposes only authoritative facts required for client timekeeping:
     ```ts
     {
       durationSeconds: number | null,
       activatedAt: string | null,
       deadline: string | null,
       serverTime: string,
       status: SessionStatus,
       closureReason: SessionClosureReason | null
     }
     ```
   - Derived or stale presentation values such as `isExpired`, `remainingSeconds`, `elapsedSeconds`, or `countdown` are strictly forbidden on server API boundaries. The candidate interface computes display values locally against `serverTime` and `deadline`.

## 8. T1A.1 Scope Boundary:

- T1A.1 established persistence schema, snapshot immutability, canonical derivation, and minimal projection.
- Request-bound mutation cutoff, background sweeping, and sandbox finalization were left for subsequent slices.

## 9. Request-Bound Deadline Cutoff (Slice T1A.2)

1. **Admission Boundary (`now >= deadline`)**:
   - Once the authoritative deadline has been reached or passed ($\text{serverNow} \ge \text{deadline}$), no NEW candidate engineering mutation is admitted.
   - Validated deterministically using server time inside the same-session operation coordinator / transaction serialization boundary.
   - Queue position does not preserve pre-deadline privilege: a request arriving at $\text{deadline} - 100\text{ms}$ that waits behind a prior operation and executes its lock body at $\text{deadline} + 50\text{ms}$ is strictly denied.

2. **Guarded Operations**:
   - **Single-File Save (`save`)**: Denied before mutating authoritative content or sandbox mirror; emits no `WORKSPACE_CHANGED` event.
   - **Multi-File Save (`saveWorkspaceFile`)**: Denied before writing to sandbox or drift capture; emits no `WORKSPACE_CHANGED` event.
   - **Command Admission (`executeCommand`)**: Denied before invoking `sandboxAdapter.exec`; emits neither `COMMAND_STARTED` nor `COMMAND_FINISHED` nor workspace diff capture events.
   - **New AI Interaction Admission (`admitInteraction`)**: Denied before creating an interaction row, `ADMITTED` state, `AI_REQUEST_STARTED` event, or provider call.

3. **Canonical Domain Error (`SESSION_DEADLINE_EXCEEDED`)**:
   - Rejections return canonical domain error `SESSION_DEADLINE_EXCEEDED` mapped to HTTP `409 Conflict`.
   - Message: `"The assessment time limit has been reached. New modifications are no longer permitted."` (truthful, neutral, free of blame or completion assertions).

4. **AI Idempotent Replay Preservation**:
   - Resolution of existing `(sessionId, clientRequestId)` interactions occurs _before_ deadline evaluation.
   - Replay of previously admitted/completed interactions remains available after deadline.

5. **Legacy Untimed Sessions Compatibility**:
   - Sessions with `durationSeconds = null` (and therefore `deadline = null`) never reject mutations via the deadline cutoff; they remain governed by existing `ACTIVE`-state rules.

6. **Intermediate State & No Durable Expiry State**:
   - Denied requests do **not** alter session status or closure reason. The overdue session remains `status = ACTIVE` and `closureReason = null`.
   - No automatic timeout submission, sweeper finalization, or transition to `SUBMITTED` occurs during T1A.2.

7. **In-Flight Command Hard Termination Explicitly Deferred**:
   - T1A.2 guarantees only that no NEW command begins after zero.
   - Safely terminating or killing commands already executing before zero is explicitly deferred to subsequent sandbox hardening/finality slices (T1A.3). Command timeouts remain governed by existing per-command execution limits.

## 10. Session Finality Boundary (Slice T1A.3A)

T1A.3A establishes the frozen workspace finality foundation for manual candidate submissions:

1. **Named Session Workspace Volume**:
   - Each sandbox uses a dedicated Docker named volume `delimit-ws-<sanitized-session-id>` for `/workspace` instead of a tmpfs mount.
   - Named volumes survive independently of the container lifecycle; they are addressable by trusted helpers without the primary container being running.
   - Volume is created before container start; removed only after successful SQLite finalization (teardown phase).
   - Volume name uses the same sanitization as the container name: `sessionId.replace(/[^a-zA-Z0-9_-]/g, '_')`.

2. **Whole-Container Freeze (docker pause)**:
   - On candidate manual submission, the primary sandbox is frozen via `docker pause` (the Linux cgroup freezer), not merely by process termination.
   - Scenario services may continue async work outside the terminal process tree; process-level kill alone is insufficient.
   - Freeze is verified by `docker inspect State.Paused === true` before any evidence is captured.
   - The sandbox is never unpaused after finalization starts.

3. **Frozen Evidence Capture**:
   - Evidence is captured by an ephemeral trusted helper container that mounts the workspace volume read-only while the primary remains paused.
   - Helper security constraints: `--rm`, `--network none`, `--read-only`, `--mount … readonly`, `--cap-drop ALL`, `--security-opt=no-new-privileges:true`, runs as root (uid 0) for evidence script access only.
   - Tree capture and baseline diff run in a single helper invocation so ephemeral evidence objects remain available for diffing.
   - Uses the same image as the primary (contains `/usr/local/bin/delimit-capture-tree.sh` and `/usr/local/bin/delimit-diff-trees.sh`), resolved via `docker inspect Config.Image`.
   - The helper has no access to the host Docker socket, no host bind mounts, and no writable rootfs.

4. **Manual Submission Finality Sequence**:
   - Pre-freeze drift detection (preserves audit trail of prior mutations)
   - Freeze primary sandbox → verify via inspect
   - Capture frozen evidence via helper (currentTree + rawDiff)
   - Atomic SQLite finalization (`status = SUBMITTED`, `closureReason = candidate_submission`)
   - Teardown (container then volume)

5. **Failure Semantics (strict)**:
   - Freeze fails → session stays `ACTIVE`, no submission committed, no teardown, `WORKSPACE_CAPTURE_FAILED` event appended (`phase = submission_freeze`).
   - Capture fails after freeze → session stays `ACTIVE`, primary remains paused, no submission, no teardown, `WORKSPACE_CAPTURE_FAILED` event (`phase = submission_frozen_capture`).
   - SQLite commit fails after freeze/capture → session stays `ACTIVE`, primary remains paused, volume intact. No unpause. Frozen sandbox and volume are discoverable for T1B recovery.
   - Teardown fails after successful commit → session is `SUBMITTED`, error logged, `SANDBOX_CLEANUP_FAILED` event appended. Session closure is not reopened.

6. **Closure Reason**:
   - Manual submission always sets `closureReason = candidate_submission`.
   - The candidate request cannot influence `closureReason`.

7. **Recovery Compatibility (T1B)**:
   - A paused sandbox + named volume survive application restart.
   - The volume is not automatically destroyed before T1B recovery is implemented.
   - Helper image identity is restart-recoverable: `captureFrozenEvidence` resolves the helper image from the existing primary container via `docker inspect Config.Image`. No in-process image map is required as the authoritative source of truth.
   - Future T1B restart reconciliation must recover `ACTIVE` + paused primary + named workspace volume using Docker state plus durable session rows — without relying on process memory.

8. **T1A.3A Scope Boundary**:
   - Automatic timeout submission, background sweeper finalization, and persistent recovery orchestration are T1B scope.
   - Root subreaper / in-flight command supervisor hardening remains T1A.3B.

## 11. Authoritative Deadline Convergence (Slice T1B.1)

T1B.1 converges overdue timed sessions through the frozen-workspace finality path while preserving trusted pre-deadline manual submission admission and same-session FIFO ordering.

1. **Shared Finalization Engine**:
   - `SessionService.finalizeByTokenHash` is the single finalization function for both manual candidate submission and timeout closure.
   - The `closureReason` (`candidate_submission` or `timeout`) is determined inside the FIFO lock body, not by the caller.
   - The candidate HTTP request body cannot influence `closureReason`.

2. **Trusted Admission Timestamp**:
   - `submit(candidateToken)` captures `admittedAt = this.now()` **before** entering the session operation coordinator queue.
   - The deadline check inside the lock body uses `admittedAt`, not the time at lock acquisition.
   - A submit admitted before the deadline that waits behind a prior operation retains its pre-deadline privilege: `closureReason = candidate_submission`.
   - A submit admitted at or after the deadline is routed through timeout closure: `closureReason = timeout`.

3. **Remaining Command Time Bound**:
   - `executeCommand` bounds each invocation to `min(commandTimeoutMs, deadline − now)` remaining milliseconds.
   - Commands admitted at or after the deadline are rejected with `SESSION_DEADLINE_EXCEEDED` before invoking `sandboxAdapter.exec`.
   - Legacy untimed sessions use the full `commandTimeoutMs` bound (unchanged behavior).

4. **Background Sweeper (`SessionTimeoutSweeper`)**:
   - Registered once via `apps/web/instrumentation.ts` at Next.js server startup using a `Symbol.for('delimit.sessionTimeoutSweeper')` global guard to prevent duplicate intervals.
   - Runs `SessionService.sweepTimedOutSessions()` on a 1-second interval using a re-entrancy guard.
   - `sweepTimedOutSessions` queries all `ACTIVE` timed sessions with a non-null `activated_at` and non-null `duration_seconds`, filters those whose deadline has been reached, and calls `finalizeTimedOutSession` for each.
   - `finalizeTimedOutSession` resolves the session token hash and delegates to `finalizeByTokenHash` with `closureReason = timeout`.
   - FIFO ordering: the sweeper enqueues through the same per-session coordinator as manual submissions. FIFO order determines which operation wins when both are in flight for the same session.

5. **Already-Paused State Retry (freeze-then-capture recovery)**:
   - If `freeze()` had already succeeded in a prior attempt (detected via `isFrozen()`), the finalization engine skips the freeze and drift-detection steps and proceeds directly to `captureFrozenEvidence`.
   - `captureFrozenEvidence` accepts an optional `baselineTree`; when called in the recovery path, it captures the current state without a pre-freeze baseline tree.
   - This enables in-process retry of finalization that previously failed at the SQLite commit step without requiring a new durable lifecycle state.
   - Out-of-process restart recovery (rediscovering paused containers across process restarts) remains deferred.

6. **Teardown Durability**:
   - Teardown failures after a successful SQLite commit do not reopen or alter session closure. The session remains `SUBMITTED`.
   - A `SANDBOX_CLEANUP_FAILED` event is appended; the error is logged but not propagated to the sweeper or the route caller.

7. **Legacy Untimed Compatibility**:
   - Sessions with `durationSeconds = null` are never swept; `findActiveTimed()` filters on `duration_seconds IS NOT NULL`.
   - Such sessions remain eligible for manual candidate submission with `closureReason = candidate_submission`.

8. **AI Interaction Closure**:
   - Timeout finalization cancels all open AI interactions (`ADMITTED`, `DISPATCH_STARTED`) as `CANCELLED / session_ended`, consistent with the manual submission path.

9. **Post-Finalization Reconstruction**:
   - After successful SQLite finalization in both the submit route and the sweeper path, `onSessionFinalized` is called to trigger `ensurePostSubmissionReconstruction`.
   - The reconstruction call is non-blocking; failures are logged without affecting the session's finalized state.
   - The previous `next/server after()` call in the submit route was replaced by `onSessionFinalized` on `SessionService` so that timeout closure also triggers reconstruction.

10. **T1B.1 Scope Boundary**:
    - Restart recovery and paused-sandbox rediscovery across process restarts remain deferred.
    - Multi-process or serverless distributed locking are explicitly excluded.
    - Candidate timer UI, submission-review UI, completion UI, and evaluator UI changes are deferred.
    - No new durable lifecycle states were introduced.
