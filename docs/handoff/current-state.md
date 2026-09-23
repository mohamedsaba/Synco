# Current project state

## Accepted implementation baseline

`0d876863cff64c8006ef0b872496f7945c5d7b69` — `fix(candidate): remove scenario-specific fallback`

This is the accepted implementation baseline before G4B. G4B is documentation convergence only; its commit records current architecture documentation and does not change product behavior.

## Current phase

Candidate and evaluator delivery, timing/finality, and consolidation are accepted through T1A/T1B, C1–C10, E1–E6, G1, G2, G3/G3A, and G4A. The application remains a Next.js/React/TypeScript modular monolith with SQLite persistence and Docker-isolated candidate execution.

## Frozen architecture

- Durable candidate lifecycle: `CREATED → ACTIVE → SUBMITTED`.
- Candidate UX is server truth + server-calibrated time + small ephemeral UI state. UI phases, including finalizing, are not durable lifecycle states.
- `closureReason` is finality admission: `ACTIVE` plus null is mutable; `ACTIVE` plus a non-null reason is admitted and closed to mutation, commands, and new AI admission; `SUBMITTED` plus a non-null reason is terminal. Recovery cannot reopen admitted finality. Existing AI request replay remains idempotent where implemented.
- Candidate AI is implemented permitted tooling with observable evidence. It neither judges the candidate nor creates a hiring result.
- Candidate workspace selection uses `scenario.filePath` only when it identifies an existing non-directory file; otherwise it chooses a deterministic existing file and invents none for an empty workspace.
- Evaluator review is read-only and separate from the active candidate workspace. Its path is authorized submitted evidence → chronological reconstruction/evidence catalog/typed facts → `buildEvaluatorBriefing` and deterministic grounding → `projectBriefing` → evaluator page and `EvaluatorExperience`.
- Evaluator authentication is the HTTP-only evaluator cookie. Its current scope permits submitted-review discovery and direct submitted-evidence review; no organization, tenant, assignment, identity, or granular RBAC model exists.
- The four evaluator presentation roles are `GENERALIST_RECRUITER`, `TECHNICAL_RECRUITER`, `ENGINEER`, and `ENGINEERING_MANAGER`. `?depth=` is primary and legacy `?role=` remains compatible. Roles affect presentation only, never evidence, authorization, or backend evidence access.
- Evidence is not interpretation: the UI does not infer intent, competence, quality, score, rank, pass/fail, recommendation, or hiring verdict. Human evaluators own judgment.
- No broad shared Candidate/Evaluator UI system is intended. Safe sharing remains global tokens, generic primitives, accessibility/reduced-motion behavior, and generic test fixtures.

## Consolidation state

- G1 normalized shared design tokens without visual behavior change.
- G2 removed dead legacy evaluator components and CSS.
- G3/G3A reconciled evaluator cascade and specificity debt while preserving accepted E6 visuals.
- G4A removed the Scenario 001-specific candidate fallback, made file selection deterministic, and removed stale homepage "Vertical Slice 3" copy.

## Verification state

The accepted G4A baseline recorded passing format, lint, typecheck, focused Candidate regression, and a separate production build. Its one full verification reached Docker-backed tests but could not access `/var/run/docker.sock`, so the chained build phase did not run. This is an environment limitation, not a product passing result or a product assertion failure.

G4B implementation-agent verification passed static checks, but its full verification attempt could not access `/var/run/docker.sock`, so its chained production build did not run. Subsequent independent acceptance verification had Docker access and completed the full repository verification: 627 passed, 6 skipped, 0 failures, production build passed, exit code 0. G4B is fully verified and ready for commit and the repository-wide adversarial audit.

## Next work

After G4B acceptance, the next activity is an independent repository-wide adversarial review of architecture/module boundaries, SOLID/design quality, authorization, candidate timing/finality, evaluator epistemic boundaries, evidence provenance, AI interaction semantics, idempotency/recovery, test quality, security, dependency/secret hygiene, docs parity, stale/dead architecture, and cheap-tape fixes.

Status: `READY_FOR_REPOSITORY_WIDE_ADVERSARIAL_AUDIT`.
