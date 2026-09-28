# Architecture map

Hirearchy Software is a modular monolith: one Next.js application owns the candidate and evaluator experiences, ordinary HTTP APIs, SQLite persistence, application-level append-only event capture, deterministic reconstruction, and the Docker boundary around candidate execution. These are conceptual module boundaries, not separate services.

## Candidate architecture

The durable assessment lifecycle is `CREATED → ACTIVE → SUBMITTED`. Candidate UX is a projection of server truth, server-calibrated time, and small ephemeral UI state; entry, orientation, provisioning, active-workspace, submission-review, time-limit, finalizing, and completion views are not durable backend states.

`closureReason` is the irreversible finality-admission marker. `ACTIVE` with a null reason remains mutable; `ACTIVE` with a non-null reason is admitted to finalization and closed to mutations, commands, and new AI admission; `SUBMITTED` with a non-null reason is terminal. Reconciliation cannot regress admitted finality. Existing AI requests retain their implemented idempotent/replay behavior, while new admission is rejected after finalization begins.

The active workspace is server-authoritative. Its File API enforces workspace-relative paths at the sandbox boundary: traversal and escaping symlink targets are rejected, contained regular files work normally, and contained symlink reads remain supported while leaf-symlink writes are rejected. Candidate UI preserves local editor, command, AI, focus, and timing presentation state around that authority. Candidate AI is implemented as permitted tooling with application-recorded observable interaction evidence; it does not assess the candidate or make decisions. For multi-file selection, `scenario.filePath` is used only when it names an existing non-directory workspace file; otherwise the UI selects the deterministic first existing file, and selects none when no file exists.

Public session issuance resolves an explicit server-side registry. Scenario 001 is the sole registered public scenario; malformed, missing, unknown, alias, and fixture IDs are rejected before persistence or provisioning. The same registry carries Scenario 001's enabled AI capability into an immutable per-session snapshot. Browser input cannot override that policy. The prototype runtime resolves its configured provider from the snapshot and currently registers `MockAiProvider`; provider runtime and capability authority remain separate.

## Evaluator architecture

Evaluator review is read-only reconstruction, separate from the candidate's active workspace. Submitted evidence flows through `getAuthorizedEvidence`, chronological reconstruction and the evidence catalog/typed facts, `buildEvaluatorBriefing`, deterministic grounding, `projectBriefing`, the session page, and `EvaluatorExperience`. The presentation must not derive semantics from raw payload strings.

The evaluator cookie grants the current evaluator review scope: discovery lists submitted review entries and direct review reads submitted evidence. There is no organization, tenant, assignment, identity, or granular-RBAC model documented or implemented here.

`GENERALIST_RECRUITER`, `TECHNICAL_RECRUITER`, `ENGINEER`, and `ENGINEERING_MANAGER` are role-sensitive presentation depths. `?depth=` selects a valid depth; legacy `?role=` remains compatible. Invalid or absent values resolve to the generalist profile. Depth changes neither evidence truth nor authorization, and grants no additional backend evidence.

Evidence is not interpretation. Chronology, provenance, and recorded outcomes are factual; the product does not infer hidden intent, competence, quality, a score, rank, pass/fail result, recommendation, or hiring verdict. A human evaluator owns that judgment.

Candidate and evaluator surfaces intentionally do not share a broad UI component system. Safe shared presentation infrastructure is limited to global design tokens, generic button/link primitives, accessibility and reduced-motion behavior, and genuinely generic test fixtures.

## Delivery state

Accepted engineering baseline: `4a7c9cdbc342130eeb7c29f3374a96fdbbaf4739` (`fix(ai): wire authoritative session capability`). It includes authoritative T1A/T1B timing and finality work; Candidate Experience C1–C10; Evaluator Experience E1–E6; G1–G4A consolidation; R1 workspace File API containment; R2 explicit public scenario issuance; and R3 authoritative Scenario 001 AI capability snapshots.

G1–G4A and R1–R3 were consolidation, correction, and boundary-hardening slices, not an architectural redesign. The engineering baseline is frozen for the next phase: Hirearchy Brand & Product Design Foundation, followed by Hirearchy Software visual/UI redesign. No product renaming or visual design is part of this baseline.

## Source documents

- [System overview](docs/architecture/system-overview.md)
- [Event model](docs/architecture/event-model.md)
- [Sandbox boundary](docs/architecture/sandbox.md)
- [Reconstruction](docs/architecture/reconstruction.md)
- [AI boundaries](docs/architecture/ai-boundaries.md)
- [Architecture decisions](docs/decisions/README.md)

## Architectural priorities

Optimize for scenario validation, inspectability, correctness, and iteration speed. Keep application-level event capture append-only and replayable, chronology deterministic, generated prose downstream of source evidence, and the human evaluator responsible for judgment. Do not add a package, service, queue, or infrastructure component without a current requirement.
