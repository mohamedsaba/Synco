# 082 — Evaluator Reconstruction-First Hierarchy

## Delivered

The evaluator now presents one reconstruction-first hierarchy:

1. Overview: factual session orientation, closure condition, scenario context,
   and material platform limitations.
2. Reconstruction: the primary ordered surface for typed activity.
3. Final submitted state: the authoritative submitted diff after chronology.
4. Source evidence: Engineer depth retains the complete technical record and
   raw records.

The local evidence navigation uses semantic anchors. The chronology is a native
ordered list. Existing disclosure controls retain keyboard access to source
evidence.

## Ownership and boundaries

`getAuthorizedEvidence` remains the authorization boundary. The established
chronology, evidence catalog, typed facts, briefing, and role projection remain
authoritative. The client does not sort activity, parse raw diff/output/prompt
text, infer causality or intent, or create a second chronology model.

Recognized verification results are attached to their existing evidence
references within the ordered activity feed. Exit status remains factual and is
not presented as correctness. Commands, file changes, AI activity, provider
failures, capture gaps, and final submission retain their existing typed and
source-backed treatment. AI remains neutral; capture limitations remain
platform limitations.

The existing submitted `closureReason` is shown as either “Submitted by
candidate” or “Assessment time ended.” This is an existing session fact, not an
outcome judgment.

## Deferred

E3 owns role/depth contract changes. E4 owns the Engineer split workspace. E5
owns a full accessibility and responsive audit. E6 owns visual polish. No
backend, reconstruction, authorization, or role-policy behavior changed.

## Verification

- Focused evaluator tests: 79 tests in 5 files passed.
- Evaluator regression: 147 tests in 10 files passed.
- `npm run verify` ran once. Formatting, lint, and typechecking passed. The
  global test phase could not access `/var/run/docker.sock`; Docker-backed
  integration tests failed or skipped, and the command did not reach build.
