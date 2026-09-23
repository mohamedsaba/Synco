# Architecture map

Delimit is a modular monolith: one Next.js application owns the candidate and evaluator experiences, ordinary HTTP APIs, SQLite persistence, immutable event capture, deterministic reconstruction, and the Docker boundary around candidate execution. These are conceptual module boundaries, not separate services.

## Candidate architecture

The durable assessment lifecycle is `CREATED → ACTIVE → SUBMITTED`. Candidate UX is a projection of server truth, server-calibrated time, and small ephemeral UI state; entry, orientation, provisioning, active-workspace, submission-review, time-limit, finalizing, and completion views are not durable backend states.

`closureReason` is the irreversible finality-admission marker. `ACTIVE` with a null reason remains mutable; `ACTIVE` with a non-null reason is admitted to finalization and closed to mutations, commands, and new AI admission; `SUBMITTED` with a non-null reason is terminal. Reconciliation cannot regress admitted finality. Existing AI requests retain their implemented idempotent/replay behavior, while new admission is rejected after finalization begins.

The active workspace is server-authoritative. Candidate UI preserves local editor, command, AI, focus, and timing presentation state around that authority. Candidate AI is implemented as permitted tooling with immutable observable interaction evidence; it does not assess the candidate or make decisions. For multi-file selection, `scenario.filePath` is used only when it names an existing non-directory workspace file; otherwise the UI selects the deterministic first existing file, and selects none when no file exists.

## Evaluator architecture

Evaluator review is read-only reconstruction, separate from the candidate's active workspace. Submitted evidence flows through `getAuthorizedEvidence`, chronological reconstruction and the evidence catalog/typed facts, `buildEvaluatorBriefing`, deterministic grounding, `projectBriefing`, the session page, and `EvaluatorExperience`. The presentation must not derive semantics from raw payload strings.

The evaluator cookie grants the current evaluator review scope: discovery lists submitted review entries and direct review reads submitted evidence. There is no organization, tenant, assignment, identity, or granular-RBAC model documented or implemented here.

`GENERALIST_RECRUITER`, `TECHNICAL_RECRUITER`, `ENGINEER`, and `ENGINEERING_MANAGER` are role-sensitive presentation depths. `?depth=` selects a valid depth; legacy `?role=` remains compatible. Invalid or absent values resolve to the generalist profile. Depth changes neither evidence truth nor authorization, and grants no additional backend evidence.

Evidence is not interpretation. Chronology, provenance, and recorded outcomes are factual; the product does not infer hidden intent, competence, quality, a score, rank, pass/fail result, recommendation, or hiring verdict. A human evaluator owns that judgment.

Candidate and evaluator surfaces intentionally do not share a broad UI component system. Safe shared presentation infrastructure is limited to global design tokens, generic button/link primitives, accessibility and reduced-motion behavior, and genuinely generic test fixtures.

## Delivery state

Accepted implementation baseline: `0d876863cff64c8006ef0b872496f7945c5d7b69` (`fix(candidate): remove scenario-specific fallback`). It includes authoritative T1A/T1B timing and finality work; Candidate Experience C1–C10; Evaluator Experience E1–E6; G1 token normalization; G2 dead evaluator code/CSS pruning; G3/G3A evaluator cascade reconciliation; and G4A deterministic candidate workspace-file fallback plus homepage hygiene.

G1–G4A were consolidation and correction slices, not an architectural redesign: tokens were normalized without visual behavior change, dead evaluator code/CSS was removed, the live evaluator cascade was reconciled while preserving accepted E6 behavior, and the Scenario 001-specific fallback was removed.

## Source documents

- [System overview](docs/architecture/system-overview.md)
- [Event model](docs/architecture/event-model.md)
- [Sandbox boundary](docs/architecture/sandbox.md)
- [Reconstruction](docs/architecture/reconstruction.md)
- [AI boundaries](docs/architecture/ai-boundaries.md)
- [Architecture decisions](docs/decisions/README.md)

## Architectural priorities

Optimize for scenario validation, inspectability, correctness, and iteration speed. Keep evidence immutable and replayable, chronology deterministic, generated prose downstream of source evidence, and the human evaluator responsible for judgment. Do not add a package, service, queue, or infrastructure component without a current requirement.
