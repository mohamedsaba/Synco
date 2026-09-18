# 057 — Delimit Slice 6B: Candidate AI Evidence Foundation

Status: completed.
Authorized: 2026-09-18.

## Context & Objective

Delimit Slice 6B implements the **Candidate AI Evidence Foundation** based on the frozen Slice 6A architecture.
The goal is to provide a rock-solid, transactional persistence model and immutable event evidence pipeline for candidate AI interactions, strictly maintaining the non-negotiable Delimit principles:

- Evidence precedes judgment.
- AI use is neutral (recorded as observable events, never scored or used to infer intent/competence).
- Evaluator owns the verdict.
- Modular monolith architecture.

## Implementation Scope

1. **Shared SQLite Transaction Runner (`SqliteTransactionRunner`)**:
   - Connection lifecycle management with WAL journal mode and busy timeout (5000ms).
   - Atomic multi-store writes via `database.transaction.immediate()` guaranteeing consistency between `ai_interactions` and `assessment_events`.
   - Shared schema bootstrap support.

2. **Foundational AI Session Event Types (`session-event.ts`)**:
   - `AI_REQUEST_STARTED`: Emitted on admission.
   - `AI_RESPONSE_COMPLETED`: Emitted on successful provider response.
   - `AI_REQUEST_CANCELLED`: Emitted on client cancellation or timeout.
   - `AI_REQUEST_FAILED`: Emitted on provider or system failure.
   - Strict typing, monotonic sequence numbering, append-only integrity.

3. **Operational Interaction Model & Store (`SqliteAiInteractionStore`)**:
   - Table `ai_interactions` with `UNIQUE(session_id, client_request_id)`.
   - Indexes on `session_id` and `(session_id, client_request_id)`.
   - State machine: `ADMITTED → DISPATCH_STARTED → COMPLETED | CANCELLED | FAILED`.
   - Methods: `createWithDatabase`, `updateStatusWithDatabase`, `updateStartedSequenceWithDatabase`, `findById`, `findByClientRequestId`, `findBySessionId`.

4. **Event Store Multi-Store Transaction Participation (`SqliteEventStore`)**:
   - Added `appendWithDatabase(database, event)` to participate in external transactions.
   - Added `SqliteEventStore.ensureSchema(database)`.

5. **Immutable Per-Session AI Capability Snapshot (`session.ts`, `sqlite-session-store.ts`, `session-service.ts`)**:
   - `AiCapabilitySnapshot` captured on `assessment_sessions` at creation time.
   - Backward-compatible schema migration via `PRAGMA table_info`.

6. **Interaction Service Orchestrator (`AiInteractionService`)**:
   - `admitInteraction`: Atomic admission creating `ai_interactions` row and appending `AI_REQUEST_STARTED`. Durable idempotency on duplicate `clientRequestId`.
   - `transitionToDispatchStarted`: State transition before provider dispatch.
   - `recordCompletion`: Atomic transition to `COMPLETED` and appending `AI_RESPONSE_COMPLETED`.
   - `recordCancellation`: Atomic transition to `CANCELLED` and appending `AI_REQUEST_CANCELLED`.
   - `recordFailure`: Atomic transition to `FAILED` and appending `AI_REQUEST_FAILED`.
   - Read methods: `getInteraction`, `getInteractionsForSession`.
   - Input validation: prompt bounded to 32,768 characters, excerpts bounded to 500 characters, active session validation, capability validation.

7. **Test Suite**:
   - `tests/unit/ai-interaction-store.test.ts`: 4 unit tests verifying table creation, unique constraint, index usage, and CRUD methods.
   - `tests/unit/ai-interaction-service.test.ts`: 24 unit tests covering complete test matrix (admission, idempotency, capability gating, state transitions, atomic rollbacks, excerpt bounds).
