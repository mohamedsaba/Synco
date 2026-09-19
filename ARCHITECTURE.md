# Architecture map

Delimit begins as a modular monolith: one web application owns the candidate and evaluator experiences and an ordinary API coordinates sessions, scenarios, immutable events, AI interactions, reconstruction, persistence, and isolated candidate environments. Boundaries are conceptual until implementation pressure justifies packages or processes.

The implemented runtime is one Next.js application. Slices 1–5 established the `CREATED → ACTIVE → SUBMITTED` session lifecycle, file-backed SQLite persistence, Docker sandbox isolation, candidate-token access, evaluator credential access, append-only event capture, deterministic evidence reconstruction, and multi-profile evaluator briefing.

Slice 6B introduces the Candidate AI Evidence Foundation:

- **`SqliteTransactionRunner`**: Provides atomic multi-store SQLite transactions (`BEGIN IMMEDIATE`) with WAL mode and busy timeout management, guaranteeing consistency between the operational interaction store and the immutable event store.
- **`SqliteAiInteractionStore`**: Persists mutable operational interaction records (`ai_interactions`) with durable session-scoped idempotent admission (`UNIQUE(session_id, client_request_id)`).
- **`AiInteractionService`**: Orchestrates interaction admission and state transitions (`ADMITTED → DISPATCH_STARTED → COMPLETED | CANCELLED | FAILED`). Admission atomically creates the interaction record and appends `AI_REQUEST_STARTED` to `assessment_events`. Terminal transitions atomically update interaction status, error metadata, usage tokens, and timestamps while appending the corresponding terminal event (`AI_RESPONSE_COMPLETED`, `AI_REQUEST_CANCELLED`, or `AI_REQUEST_FAILED`).
- **Immutable AI Capability Snapshot**: Each session snapshots its AI capabilities (`enabled`, `contractVersion`, `configuredProviderId`, `configuredModelId`, `configurationVersion`) at session creation time, ensuring that runtime configuration changes never alter the terms under which an evaluation took place. Capabilities such as streaming, tool execution, and per-assessment token budgeting are explicitly deferred; prompt length policy (`MAXIMUM_PROMPT_LENGTH = 32_768`) is governed by domain validation rather than per-session capability state.

Architecture Corrections A1/A2 harden same-session coordination and submission evidence closure:

- **`SessionOperationCoordinator`**: Serializes mutating operations (`activate`, `save`, `saveWorkspaceFile`, `executeCommand`, `submit`) per assessment session via a FIFO queue across request boundaries. Process-wide singleton storage (`Symbol.for('delimit.sessionOperationCoordinator')`) preserves serialization across independent `SessionService` instances within the supported single-process monolith topology. Multi-process clustering requires distributed coordination before deployment. AI provider execution is never held under the session operation lock.
- **Submission Evidence Closure**: Candidate session submission atomically transitions the session to `SUBMITTED` and cancels all open AI interactions (`ADMITTED`, `DISPATCH_STARTED`) as `CANCELLED / session_ended`, appending `AI_REQUEST_CANCELLED` events with deterministic ordering and local durations within a single `BEGIN IMMEDIATE` SQLite transaction.
- **Existing-ID Replay vs. New Admission**: Replays of an existing `(sessionId, clientRequestId)` are resolved idempotently before session status checks or validation, returning persisted results (`COMPLETED`, `FAILED`, `CANCELLED / session_ended`, or ambiguous `DISPATCH_STARTED`) with HTTP 200 without redispatch. New request IDs on closed sessions are rejected with HTTP 409 `SESSION_NOT_ACTIVE` with zero database modifications.
- **Late Provider Output Isolation**: In-flight provider completions, errors, or timeouts that settle after submission closure are safely dropped and cannot overwrite the terminal `CANCELLED / session_ended` status, append events, or alter candidate evidence, while legitimate platform and operational evidence may still be recorded afterward.

Architecture Correction F03 hardens candidate save integrity across editing transitions:

- **Candidate Save Contract**: A save operation is successful only when all required authoritative and mirror persistence targets have completed. In single-file scenarios, `SessionService.save` requires both SQLite persistence and container mirror synchronization; if the sandbox write fails, SQLite is rolled back to the pre-save state (`workingContent`), an explicit error is returned, and stale container content is never acknowledged as synchronized. In multi-file scenarios, container persistence and tree diff capture remain authoritative.
- **File Switching & Submission Gating**: The candidate workspace gates file switching and assessment submission on successful save of dirty editor buffers. If save fails, the candidate remains on the current file, the destination file is not rendered, submission is blocked, session remains `ACTIVE`, the unsaved editor text is preserved, and a factual error notice prompts explicit retry.

## Source documents

- [System overview](docs/architecture/system-overview.md)
- [Event model](docs/architecture/event-model.md)
- [Sandbox boundary](docs/architecture/sandbox.md)
- [Reconstruction](docs/architecture/reconstruction.md)
- [AI boundaries](docs/architecture/ai-boundaries.md)
- [Architecture decisions](docs/decisions/README.md)

## Architectural priorities

Optimize for scenario validation, inspectability, correctness, and iteration speed. Build demoable vertical slices. Keep event evidence immutable and replayable, preserve deterministic chronology, and keep generated prose downstream of source events. Do not introduce a package, service, queue, or infrastructure component before a current slice needs it.

For Slice 1, original scenario content is snapshotted with the session. Edits are normalized to LF and persisted while the session is active. Submission atomically copies working content into immutable submitted content; evaluator diff output is regenerated from the original and submitted snapshots.
