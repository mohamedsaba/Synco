# 056 — Remove Raw Diff Interpretation from Role Projection

Status: completed.
Authorized: 2026-09-17.
Resolution to Jules Acceptance Audit finding on commit `91e6c64432f415cf0d7e3c006dcfa552b3517eb3`.

## Context & Finding

An independent acceptance audit of Delimit Evaluator Experience V2 identified ONE blocking architecture violation:
In `apps/web/src/evaluator/project-evaluator-briefing.ts`, `projectSubmittedStateForRole` was inspecting raw diff text (`diff.includes('set_cached_stock') && submittedState.changedPaths.includes('inventory/service.py')`) to assign synthetic semantic wording (`write_through_service_update`) to the `ENGINEER` role projection on Case D.

This violated Delimit's core architecture:

- Evidence precedes judgment.
- Role projection must consume already-established reconstruction/briefing truth; it must never parse raw diffs, commands, stdout/stderr, filenames, or scenario magic strings to synthesize semantic meaning.
- Case D must remain neutral without synthetic editorializing or unmodeled semantic claims.

## Architectural Decision (Option 3)

Under the preferred order for handling unmodeled semantic distinctions:

1. Use existing upstream structured facts if present and sufficient.
2. If an upstream structured concept belongs in the architecture, model it properly in the upstream authoritative layer (never in the projection layer).
3. If there is no defensible structured basis for special wording, REMOVE the special wording and drop back to neutral, factual, evidence-grounded copy.

Delimit does not possess an upstream code-analysis or AST diff classifier that models cache strategies ("write-through Redis updates" vs "cache invalidation"). Fabricating a fake upstream classifier solely to preserve arbitrary copy would violate the constitution. Option 3 was applied: the synthetic wording (`write_through_service_update`) was removed, and role projection falls back strictly to the grounded, neutral summary (`"The submission includes changes to 1 file."`).

Role differentiation for submission scope is preserved via `defaultDepth.conciseSubmissionScope` (`false` for Engineer and Technical Recruiter, `true` for Generalist Recruiter and Engineering Manager).

## Changes

1. `apps/web/src/evaluator/project-evaluator-briefing.ts`:
   - Removed `projectSubmittedStateForRole`.
   - Removed raw diff extraction (`diffEntry` and `rawDiff`) from `projectBriefing`.
   - Assigned `submittedState: briefing.submittedState` directly.
2. `apps/web/src/evaluator/briefing-wording.ts`:
   - Removed `write_through_service_update` from `BriefingWording` union and `literalTemplates`.
3. `tests/unit/evaluator-briefing.test.ts`:
   - Updated Case D test to verify neutrality across all 4 role projections.
   - Added regression guard proving that tampering with raw diff content in `evidenceIndex` does not affect role projection output.
4. `docs/artifacts/evaluator-briefing/D.json` & `D.md`:
   - Re-serialized using the standard test suite to reflect the neutral submittedState copy.
