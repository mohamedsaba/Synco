# Architecture map

Delimit begins as a modular monolith: one web application owns the candidate and evaluator experiences and an ordinary API coordinates sessions, scenarios, immutable events, AI interactions, reconstruction, persistence, and isolated candidate environments. Boundaries are conceptual until implementation pressure justifies packages or processes.

The implemented runtime is one Next.js application. Slices 1–5 established the `CREATED → ACTIVE → SUBMITTED` session lifecycle, file-backed SQLite persistence, Docker sandbox isolation, candidate-token access, evaluator credential access, append-only event capture, deterministic evidence reconstruction, and multi-profile evaluator briefing.

Slice 6B introduces the Candidate AI Evidence Foundation:

- **`SqliteTransactionRunner`**: Provides atomic multi-store SQLite transactions (`BEGIN IMMEDIATE`) with WAL mode and busy timeout management, guaranteeing consistency between the operational interaction store and the immutable event store.
- **`SqliteAiInteractionStore`**: Persists mutable operational interaction records (`ai_interactions`) with durable session-scoped idempotent admission (`UNIQUE(session_id, client_request_id)`).
- **`AiInteractionService`**: Orchestrates interaction admission and state transitions (`ADMITTED → DISPATCH_STARTED → COMPLETED | CANCELLED | FAILED`). Admission atomically creates the interaction record and appends `AI_REQUEST_STARTED` to `assessment_events`. Terminal transitions atomically update interaction status, error metadata, usage tokens, and timestamps while appending the corresponding terminal event (`AI_RESPONSE_COMPLETED`, `AI_REQUEST_CANCELLED`, or `AI_REQUEST_FAILED`).
- **Immutable AI Capability Snapshot**: Each session snapshots its AI capabilities (`enabled`, `contractVersion`, `configuredProviderId`, `configuredModelId`, `configurationVersion`) at session creation time, ensuring that runtime configuration changes never alter the terms under which an evaluation took place. Capabilities such as streaming, tool execution, and per-assessment token budgeting are explicitly deferred; prompt length policy (`MAXIMUM_PROMPT_LENGTH = 32_768`) is governed by domain validation rather than per-session capability state.

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
