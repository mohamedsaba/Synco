# 062 — Delimit Architecture Correction A1/A2: Same-Session Coordination + Submission Evidence Closure

Status: completed.
Baseline: `4b44690e2e88a26c66c24b80ee4351969df8f264` (origin/main).

## Objective

Correct architectural findings F01 and F02:

- **F01**: Same-session operation serialization does not survive request boundaries.
- **F02**: Submission does not close AI evidence.

Strictly out of scope: F03 through F16.

## Architectural Boundaries

1. **Shared Same-Session Coordinator (`SessionOperationCoordinator`)**:
   - Process-wide singleton per deployment via a named `globalThis` slot (`Symbol.for('delimit.sessionOperationCoordinator')`).
   - FIFO serialization per session; different sessions remain concurrent.
   - Non-reentrant / non-recursive acquisition enforced via `AsyncLocalStorage`.
   - Queue released in `finally`; idle entries evicted from internal map.
   - Coordinated operations: activation, single-file save, multi-file save, command execution, submission.
   - Supported topology: single long-lived application process mutating a session.

2. **Submission Evidence Closure & Invariant**:
   - Candidate token resolved to session ID before coordinator acquisition.
   - Inside coordinator: re-read session; preserve repeated submission idempotency (return immediately if already `SUBMITTED`).
   - For `ACTIVE` sessions: final workspace capture and diff computation occur outside SQLite.
   - Atomic SQLite transaction:
     - Transactionally re-read session and assert `ACTIVE`.
     - Deterministically query open interactions (`ADMITTED`, `DISPATCH_STARTED`) ordered by `started_sequence ASC, id ASC`.
     - Transactionally cancel each interaction: append `AI_REQUEST_CANCELLED` with `terminalReason = 'session_ended'` and mark interaction `CANCELLED`.
     - Persist frozen submitted content/diff and transition session to `SUBMITTED` using one shared closure timestamp.
   - If any closure write fails, the entire transaction rolls back; session remains `ACTIVE`, interactions stay open, and sandbox teardown is skipped.
   - Outside SQLite: attempt sandbox teardown; preserve post-submission reconstruction scheduling.

3. **No Coordinator Held Across AI Provider**:
   - `SessionOperationCoordinator` is never held across external AI provider requests.
   - Submission closes pending AI requests without waiting for the provider.
   - SQLite `BEGIN IMMEDIATE` transactions govern AI admission, dispatch claim, and terminal transitions.

4. **Admission & Idempotency Reordering**:
   - Inside `BEGIN IMMEDIATE` transaction, look up `(sessionId, clientRequestId)` first.
   - If existing interaction found: return persisted result directly (HTTP 200), bypassing active status, capability, provider, and input validations. Zero writes, zero events, zero provider calls.
   - If interaction does not exist: assert session is `ACTIVE`, validate capability, validate prompt and context, insert `ADMITTED` interaction, and append `AI_REQUEST_STARTED` (configured provider is confirmed upon subsequent dispatch claim).
   - Brand-new request against a closed/submitted session returns 409 `SESSION_NOT_ACTIVE`.

5. **Dispatch Claim & Late Provider Results**:
   - Transactional dispatch claim asserts interaction is still `ADMITTED` and owning session is `ACTIVE`. If interaction was closed as `CANCELLED/session_ended` during submission, dispatch is aborted and provider call count is 0.
   - Late provider completions, failures, or timeouts check interaction status inside their terminal transaction; if already `CANCELLED/session_ended`, the cancellation is preserved untouched, no late events are appended, and the in-flight HTTP request resolves with normalized cancellation (HTTP 200).

6. **Candidate Presentation**:
   - Factual candidate wording for `CANCELLED / session_ended`:
     `Delimit closed this AI interaction because the assessment session ended.`
   - No causal attribution or claim of candidate cancellation / provider failure.
