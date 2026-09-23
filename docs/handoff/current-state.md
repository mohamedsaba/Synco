# Current project state

## Accepted implementation baseline

`4a7c9cdbc342130eeb7c29f3374a96fdbbaf4739` — `fix(ai): wire authoritative session capability`

This is the accepted, frozen engineering baseline after R1–R4. R4 is documentation convergence only; it records current architecture truth and does not change product behavior.

## Current phase

Candidate and evaluator delivery, timing/finality, and consolidation are accepted through T1A/T1B, C1–C10, E1–E6, G1–G4A, and R1–R3. The application remains a Next.js/React/TypeScript modular monolith with SQLite persistence and Docker-isolated candidate execution.

## Frozen architecture

- Durable candidate lifecycle: `CREATED → ACTIVE → SUBMITTED`.
- Candidate UX is server truth + server-calibrated time + small ephemeral UI state. UI phases, including finalizing, are not durable lifecycle states.
- `closureReason` is finality admission: `ACTIVE` plus null is mutable; `ACTIVE` plus a non-null reason is admitted and closed to mutation, commands, and new AI admission; `SUBMITTED` plus a non-null reason is terminal. Recovery cannot reopen admitted finality. Existing AI request replay remains idempotent where implemented.
- Candidate AI is implemented permitted tooling with observable evidence. It neither judges the candidate nor creates a hiring result.
- The R1 workspace File API boundary rejects traversal and symlink escapes inside the sandbox while preserving contained regular-file behavior and internal symlink reads.
- The R2 public issuance boundary permits only registered Scenario 001. Unsupported IDs are rejected before persistence and provisioning; `execLegacy` is retained only for test/internal fixture compatibility and is not publicly reachable in production.
- The R3 Scenario 001 policy enables candidate AI through an immutable session capability snapshot. Browser input cannot override it. The current prototype runtime is intentionally `MockAiProvider`; provider registration and capability authority remain separate.
- Candidate workspace selection uses `scenario.filePath` only when it identifies an existing non-directory file; otherwise it chooses a deterministic existing file and invents none for an empty workspace.
- Evaluator review is read-only and separate from the active candidate workspace. Its path is authorized submitted evidence → chronological reconstruction/evidence catalog/typed facts → `buildEvaluatorBriefing` and deterministic grounding → `projectBriefing` → evaluator page and `EvaluatorExperience`.
- Evaluator authentication is the HTTP-only evaluator cookie. Its current scope permits submitted-review discovery and direct submitted-evidence review; no organization, tenant, assignment, identity, or granular RBAC model exists.
- The four evaluator presentation roles are `GENERALIST_RECRUITER`, `TECHNICAL_RECRUITER`, `ENGINEER`, and `ENGINEERING_MANAGER`. `?depth=` is primary and legacy `?role=` remains compatible. Roles affect presentation only, never evidence, authorization, or backend evidence access.
- Evidence is not interpretation: the UI does not infer intent, competence, quality, score, rank, pass/fail, recommendation, or hiring verdict. Human evaluators own judgment.
- No broad shared Candidate/Evaluator UI system is intended. Safe sharing remains global tokens, generic primitives, accessibility/reduced-motion behavior, and generic test fixtures.

## Closed engineering blockers

- G1 normalized shared design tokens without visual behavior change.
- G2 removed dead legacy evaluator components and CSS.
- G3/G3A reconciled evaluator cascade and specificity debt while preserving accepted E6 visuals.
- G4A removed the Scenario 001-specific candidate fallback, made file selection deterministic, and removed stale homepage "Vertical Slice 3" copy.
- R1 closed workspace File API containment at the sandbox/filesystem boundary.
- R2 closed public scenario issuance and legacy execution reachability.
- R3 closed authoritative public AI capability configuration.
- R4 reconciled the accepted implementation, corrected lifecycle and event-integrity documentation, and converged current architecture documentation.

## Verification state

R1 independently completed Docker-backed verification and a full repository verification after its hygiene correction. R2 and R3 were independently accepted. R4 records its own final format, lint, typecheck, and Docker-gated full verification result with the closure commit.

## Non-blocking deferred engineering work

- Evaluator identity, organization, tenant, assignment, and granular-RBAC architecture: the prototype intentionally has one global evaluator trust domain. This is future production hardening/product work, not a current IDOR finding.
- SQLite migration and connection lifecycle cleanup: repeated schema/migration work exists, but no correctness failure is established.
- `execLegacy`: retained for tests/internal fixture compatibility; public production reachability is no.
- Mock candidate AI provider: intentional prototype runtime; real-provider work is later provider registration/configuration infrastructure.
- CSS modularization and visual cleanup: deferred to Hirearchy product/visual redesign unless a correctness issue is found.

## Next phase

The frozen engineering baseline is ready for Hirearchy Brand & Product Design Foundation, followed by Hirearchy Software visual/UI redesign. Hirearchy is the umbrella brand; naming migration, product features, evaluator multi-tenancy, SQLite lifecycle refactoring, CSS modularization, and provider replacement are not part of this handoff.

Status: `READY_FOR_HIREARCHY_PRODUCT_DESIGN_FOUNDATION`.
