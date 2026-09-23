# 087 — Global Token Normalization (G1)

## Scope

G1 applies the Global Consolidation & Architecture Audit's F-05 token-only cleanup. It introduces no shared component layer, React changes, API changes, or CSS restructuring.

## Token audit

- Removed dead declarations: `--muted-light`, `--shadow-md`, and `--status-danger-background`. Each had zero runtime consumers.
- Removed forwarding aliases: `--status-success-background`, `--status-warning-background`, `--notice-background`, and `--danger`.
- Replaced consumers with existing canonical tokens: `--status-success-bg`, `--status-warning-bg`, `--notice-bg`, and `--status-danger-text`.
- Token values did not change. Every replacement is a direct equivalent of its former alias value, so Candidate and Evaluator visual behavior remains unchanged.

## Verification

- Focused Candidate and Evaluator visual/style coverage: 4 test files, 53 tests passed.
- `npm run format:check`, `npm run lint`, and `npm run typecheck` passed before full verification.
- `npm run verify` ran once. Format, lint, and typecheck passed; its test phase was blocked by Docker socket permission, so the remaining test and production-build phases did not run.

## Boundaries

No shared React components, Candidate/Evaluator layout changes, dead CSS pruning beyond tokens, or E6 specificity work were introduced. G2 remains separate work.
