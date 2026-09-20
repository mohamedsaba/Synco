# 066 — T1A.2: Request-Bound Deadline Cutoff

Status: completed.
Baseline: `db23c6593aa7571a92c452c98f54d58d5963a3b3` (feat(timing): add authoritative session timing foundation).

## Objective

Enforce the authoritative request-bound admission deadline cutoff:

> Once the authoritative deadline has passed (`now >= deadline`), no NEW candidate engineering mutation may be admitted.

This slice guarantees server-authoritative cutoff across all candidate mutation pathways without introducing premature auto-finalization, durable expiry states, or complex sweeper infrastructure.

## Delivered Slices & Guarantees

1. **Deterministic Deadline Comparison**:
   - Compares server time against derived deadline using canonical helper `isDeadlineExceeded(deadline, now)`.
   - Rejects admission at boundary condition `now >= deadline` (both at exact zero and post-zero).
   - Clock injected via service `now: () => string` for determinism in production and tests.

2. **Single-File and Multi-File Save Cutoff**:
   - Evaluated inside the same-session operation coordinator lock (`withSessionLock`) before any persistent store update or sandbox filesystem write.
   - On rejection: throws `SessionError('SESSION_DEADLINE_EXCEEDED')`, authoritative content remains unchanged, sandbox mirror remains unchanged, and zero workspace evidence events (`WORKSPACE_CHANGED`) are emitted.

3. **Command Admission Cutoff**:
   - Evaluated inside `withSessionLock` before pre-command drift capture, `COMMAND_STARTED` event emission, or invocation of `sandboxAdapter.exec`.
   - On rejection: `sandboxAdapter.exec` is never invoked, and no command evidence (`COMMAND_STARTED`, `COMMAND_FINISHED`) or workspace diff events are recorded.

4. **AI Interaction Admission Cutoff & Idempotent Replay**:
   - Checks existing `(sessionId, clientRequestId)` in `admitInteraction` transaction _before_ deadline evaluation.
   - If interaction exists, idempotent replay is returned without deadline rejection.
   - Only for new `clientRequestId`: evaluated against deadline. If exceeded, throws `AiInteractionError('SESSION_DEADLINE_EXCEEDED')`.
   - On rejection: no AI interaction row is created, no `AI_REQUEST_STARTED` event is appended, and no provider dispatch occurs.
   - In-flight provider requests admitted prior to deadline are not aborted merely by deadline passage.

5. **Concurrency & Queueing Semantics**:
   - Validated at the exact point of execution under the same-session serialization lock.
   - Queue position preserves no pre-deadline privilege: a request queued prior to zero that begins lock execution after zero is strictly rejected.

6. **Canonical Domain Error & HTTP Mapping**:
   - `SESSION_DEADLINE_EXCEEDED` mapped to HTTP `409 Conflict`.
   - Truthful and neutral public message: `"The assessment time limit has been reached. New modifications are no longer permitted."`

7. **Legacy Untimed Sessions Compatibility**:
   - Sessions with `durationSeconds = null` (deadline `null`) continue normal ACTIVE-state admission without synthetic deadlines or false rejections.

8. **Candidate Closure Reason Security Check**:
   - Candidate submission endpoint (`POST /api/candidate/sessions/[token]/submit`) ignores request payload and parameters, ensuring `closureReason` cannot be manipulated to `'timeout'` and is always recorded as `'candidate_submission'`.

9. **Intermediate State Integrity**:
   - Overdue sessions remain `status = 'ACTIVE'` and `closureReason = null`.
   - No durable `EXPIRED` status is created; automatic timeout submission is deferred to subsequent finalization slices.

10. **In-Flight Command Hard Termination Explicitly Deferred**:
    - Current slice bounds command _admission_. Hard termination of processes executing prior to zero is deferred to T1A.3 (sandbox finality/hardening).
