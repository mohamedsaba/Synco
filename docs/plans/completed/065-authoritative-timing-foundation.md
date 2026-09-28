# 065 — T1A.1: Authoritative Timing Foundation

Status: completed.
Baseline: `bc44c75c328ef7f8a7e0f2d80dcfb677a28e9fd2` (security/s1-control-plane-hardening).

## Objective

Establish the authoritative timing and lifecycle persistence foundation for Hirearchy Software candidate sessions:

- Explicit duration snapshotting from scenario definitions onto sessions.
- Backward-compatible SQLite schema migration preserving historical untimed sessions (`duration_seconds = NULL`) while backfilling historical submitted sessions to `closure_reason = 'candidate_submission'`.
- Canonical pure deadline derivation (`deriveSessionDeadline`).
- Minimal candidate timing projection (`CandidateTimingProjection`).
- Documented distinctions between calibrated assessment limits (Scenario 001 = 3600s) and development fixture limits (Slice 1 = 900s).
- Clarification that durable session lifecycle is strictly `CREATED -> ACTIVE -> SUBMITTED` with no durable `EXPIRED` state.

## Delivered Slices & Guarantees

1. **Persistence Schema & SQLite Migration**:
   - `assessment_sessions` adds `duration_seconds INTEGER CHECK (duration_seconds IS NULL OR (duration_seconds > 0 AND duration_seconds = CAST(duration_seconds AS INTEGER)))`.
   - `assessment_sessions` adds `closure_reason TEXT CHECK (closure_reason IS NULL OR closure_reason IN ('candidate_submission', 'timeout'))`.
   - Migration idempotent and safe for legacy DBs: historical untimed sessions keep `duration_seconds = NULL`; historical `SUBMITTED` rows backfill to `closure_reason = 'candidate_submission'`; historical `ACTIVE`/`CREATED` rows retain `closure_reason = NULL`.

2. **Domain Model & Snapshot Immutability**:
   - `AssessmentSession` and `SubmittedSession` truthfully model `durationSeconds: number | null` and `closureReason: SessionClosureReason | null`.
   - `ScenarioSnapshot` supplies `durationSeconds?: number`.
   - Session creation validates that scenario duration is a positive integer (`INVALID_SCENARIO_DURATION`).
   - The session snapshots the duration immutably at creation; subsequent mutations to scenario configuration objects do not alter already-created sessions.

3. **Canonical Deadline Derivation**:
   - `deriveSessionDeadline(session)` derives deadline as $\text{activatedAt} + \text{durationSeconds}$ (UTC ISO-8601).
   - Returns `null` if session is not activated (`activatedAt === null`) or is an untimed legacy session (`durationSeconds === null`).
   - No separate `expiresAt` column is persisted to avoid duplicate truth.

4. **Minimal Candidate Timing Projection**:
   - `toCandidateTimingProjection` exposes `{ durationSeconds, activatedAt, deadline, serverTime, status, closureReason }`.
   - Strictly omits countdowns, elapsed seconds, remaining seconds, or expired flags on server contracts.
   - Exposed via `service.getCandidateTiming(candidateToken)` and route `GET /api/candidate/sessions/[token]/timing`.

5. **Scenario Timing & Calibration**:
   - `scenario-001-cache-staleness`: Authoritative hard limit is 60 minutes (`durationSeconds = 3600`), distinguished from calibration range (45–75 minutes).
   - `slice-1-greeting-format`: Development fixture duration is 15 minutes (`durationSeconds = 900`), explicitly noted as non-calibrated.

6. **Durable Lifecycle Invariant**:
   - Durable lifecycle is strictly `CREATED -> ACTIVE -> SUBMITTED`.
   - No durable `EXPIRED` status; timeout is represented as `status = 'SUBMITTED'`, `closureReason = 'timeout'`.
