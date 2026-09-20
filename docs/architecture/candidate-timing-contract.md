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

8. **T1A.1 Scope Boundary**:
   - T1A.1 establishes persistence schema, snapshot immutability, canonical derivation, and minimal projection.
   - T1A.1 does **not** enforce request-bound mutation cutoff, background sweeping, or sandbox finalization; these enforcement mechanisms are implemented in subsequent slices (T1A.2+).
