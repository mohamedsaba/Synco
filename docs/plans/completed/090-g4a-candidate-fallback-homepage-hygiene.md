# G4A — Candidate fallback and homepage hygiene

## Baseline

`15373d1085351a8d01dc6df94ebf921382b627d5` (`fix(evaluator): preserve role
lens typography`), clean before work.

## F-04 root cause and contract

The Candidate component fabricated `inventory/service.py` in its initial state
and both multi-file activation paths. The scenario view's `filePath` is
optional because it is redacted before activation; the active multi-file
workspace tree is the authoritative collection and contains both directories
and files.

Initial multi-file selection now prefers `scenario.filePath` only when that
path exists as a non-directory workspace file. Otherwise it selects the
lexically first existing non-directory path. With no file, the UI selects no
path, labels the unavailable editor plainly, and disables editing and saving.
No Scenario 001 path is fabricated.

## F-06

The visible homepage eyebrow changed from `Synco / Delimit · Vertical Slice 3`
to `Synco / Delimit · Candidate + Evaluator Experience`. No homepage rendering
test existed, and static copy alone did not justify one.

## Tests and verification

- Added focused selection proof for authoritative-path preference,
  deterministic fallback across directories/files, and no-file selection.
- Added no-file presentation coverage; existing shell and interaction tests
  continue to cover editor, navigation, commands, AI, timing, and submission.
- Targeted Candidate regression: 7 files, 66 tests passed.
- `npm run format:check`, `npm run lint`, and `npm run typecheck` passed.
- `npm run verify` ran once: format, lint, and typecheck passed; Docker-backed
  integration tests could not connect to `/var/run/docker.sock`, so its chained
  production build did not run. A separate `npm run build` passed.

G4B architecture-document convergence remains pending.
