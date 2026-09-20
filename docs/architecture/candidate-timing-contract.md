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
