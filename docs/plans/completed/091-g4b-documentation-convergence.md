# 091 — G4B Architecture Documentation Convergence

## Baseline

Accepted implementation baseline: `0d876863cff64c8006ef0b872496f7945c5d7b69` (`fix(candidate): remove scenario-specific fallback`). The worktree was clean before this documentation-only slice.

## Updated authoritative documentation

- `ARCHITECTURE.md` is now the concise architecture entry point for the modular monolith, candidate finality and workspace/AI model, evaluator reconstruction and role-depth model, epistemic boundary, surface separation, and accepted delivery state.
- `docs/architecture/system-overview.md` now describes the accepted Candidate, Evaluator, timing/finality, authorization, and consolidation state without stale implementation claims.
- `docs/handoff/current-state.md` is now the operational snapshot for the accepted implementation baseline and the next independent review phase.

## Corrected drift

- Removed the stale assertion that Candidate AI is not implemented.
- Replaced historical Slice 1/5/6 completion narration as current state with accepted T1A/T1B, C1–C10, E1–E6, and G1–G4A state.
- Recorded `closureReason` finality admission and the distinction between durable lifecycle and candidate UX projection.
- Recorded evaluator cookie scope, role/depth presentation-only behavior, the epistemic boundary, and Candidate/Evaluator separation.
- Recorded G4A deterministic workspace-file selection and removed obsolete pending-consolidation framing.

## Validation

- Confirmed the three authoritative documents agree on lifecycle, finality, Candidate AI, evaluator roles and access, epistemic boundary, surface separation, delivery state, and next phase.
- No production behavior or tests changed.
- `git diff --check` and authoritative-doc stale-phrase searches passed.
- `npm run format:check`, `npm run lint`, and `npm run typecheck` passed.
- Implementation-agent verification: `npm run verify` ran once. Its format, lint, and typecheck phases passed; Docker-backed Vitest integration tests could not access `/var/run/docker.sock`, so the chained production build did not run. This is an environment block, not a product assertion failure.
- Independent acceptance verification: Docker access was available and the full repository verification completed with 627 passed, 6 skipped, 0 failures, a passing production build, and exit code 0.

## Next phase

After G4B acceptance: repository-wide adversarial architecture, security, and code-quality review. This slice does not begin that review. G4B is fully verified and ready for commit and that audit.
