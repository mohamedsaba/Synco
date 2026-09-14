# Architecture map

Delimit begins as a modular monolith: one web application owns the candidate and evaluator experiences and an ordinary API coordinates sessions, scenarios, immutable events, AI interactions, reconstruction, persistence, and isolated candidate environments. Boundaries are conceptual until implementation pressure justifies packages or processes.

The implemented runtime is one Next.js application. Vertical Slice 1 adds a fixed scenario fixture, the `CREATED → ACTIVE → SUBMITTED` session domain, file-backed SQLite persistence, candidate-token access, separate evaluator credential access, and server-generated final diffs. Sandbox execution, event capture, AI, and reconstruction remain documented targets rather than completed systems.

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
