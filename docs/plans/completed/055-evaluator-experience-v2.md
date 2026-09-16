# Delimit Evaluator Experience v2 — Production Visual Implementation Plan

## Goal Description

Implement the production visual experience for the Delimit Evaluator Experience v2 on top of the completed, verified Evaluator Briefing Foundation and Presentation Refinement. The UI consumes the briefing data model and role projections (`GENERALIST_RECRUITER`, `TECHNICAL_RECRUITER`, `ENGINEER`, `ENGINEERING_MANAGER`) without creating a secondary interpretation engine, presenting a bright, calm, tactile, editorial product that carries technical complexity so the evaluator doesn't have to.

## User Review Required

> [!IMPORTANT]
> **Zero Duplicate Interpretation Engine**: All presentation semantics and copy are sourced strictly from `EvaluatorBriefing` / `ProjectedBriefing`. The React components render briefing truth; they do not derive new candidate judgments or interpretations from raw events or diffs.

> [!IMPORTANT]
> **Dual Compatibility**: The page supports both the refined Evaluator v2 experience across all four role lenses and preserves the standard section contract expected by existing gate fixture integration tests (`What this scenario examines`, `What happened`, `Recorded activity`, `Submitted changes`, `Open technical chronology`).

## Proposed Architecture & Components

```
                ┌──────────────────────────────────────────────┐
                │   apps/web/app/evaluator/sessions/           │
                │        [sessionId]/page.tsx                  │
                │         (Server Component)                   │
                └──────────────────────┬───────────────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        ▼                              ▼                              ▼
┌──────────────────┐         ┌────────────────────┐         ┌────────────────────┐
│ getAuthorized... │         │ buildEvaluator...  │         │ projectBriefing... │
│    (Evidence)    │         │    (Briefing)      │         │    (Projection)    │
└──────────────────┘         └────────────────────┘         └─────────┬──────────┘
                                                                      │
                                                                      ▼
                                                            ┌────────────────────┐
                                                            │   EvaluatorShell   │
                                                            └─────────┬──────────┘
                                                                      │
            ┌─────────────────────┬───────────────────┬───────────────┼───────────────┬─────────────────────┐
            ▼                     ▼                   ▼               ▼               ▼                     ▼
     <EvaluatorHeader>      <PlatformNotice>     <TaskBrief>   <RecordedActivity>  <VerificationSummary>  <SubmittedWork>
   (Identity, Duration,    (Attributed gaps &   (Context &      (Grouped or raw    (Neutral run facts,     (Diff viewer &
   RoleLensSwitcher)        limitations)         invariants)     chronology)        no scorecards)          file stats)
```

### Component Breakdown (`apps/web/app/evaluator/sessions/[sessionId]/`)

1. **`page.tsx`** [MODIFY]:
   - Server Component resolving `sessionId`, reading `evaluatorCookie`, fetching evidence and reconstruction, and generating `baseBriefing` and `projectedBriefing`.
   - Reads `depth` query param (defaulting to `GENERALIST_RECRUITER`), with client-side lens switching.
   - Passes briefing, projection, evidence catalog, and raw items down to client and server presentation components.

2. **`evaluator-shell.tsx`** [NEW]:
   - Cohesive responsive shell providing layout, visual rhythm, editorial typography, and lens state container.

3. **`evaluator-header.tsx`** [NEW]:
   - Editorial product header: Delimit wordmark, session reference, scenario title, submission status, deterministic session duration badge, and `<RoleLensSwitcher />`.

4. **`role-lens-switcher.tsx`** [NEW]:
   - Accessible role lens selector (`GENERALIST_RECRUITER`, `TECHNICAL_RECRUITER`, `ENGINEER`, `ENGINEERING_MANAGER`).
   - Supports keyboard navigation, ARIA attributes, and updates URL `?depth=<PROFILE>` without full page reload while updating view state instantly.

5. **`task-brief.tsx`** [NEW]:
   - Renders "What this scenario examines": scenario brief, system invariants, verification targets, and interpretation warnings according to role depth.
   - Graceful fallback for Case G (legacy session without evaluation context).

6. **`platform-notice.tsx`** [NEW]:
   - Calm, non-alarmist platform alerts for material limitations (e.g. Case F workspace capture gap explicitly attributed to Delimit; Case G legacy metadata notice).

7. **`recorded-activity.tsx`** [NEW]:
   - "Recorded activity" section:
     - In `GENERALIST_RECRUITER`: renders chronological grouped narrative statements with suppressed compiler noise.
     - In `TECHNICAL_RECRUITER` / `ENGINEER`: renders structured statements with direct evidence inspection triggers.
     - Inline evidence disclosure for every statement showing source type, timestamp, and human-readable evidence.

8. **`verification-summary.tsx`** [NEW]:
   - Factual comparison of recorded test runs (e.g. First recorded run: 3 failures; Final recorded run: 3 failures).
   - Zero score-like visual treatment (no green/red scorecard, no FAIL→PASS badges).

9. **`submitted-work.tsx`** & **`submitted-diff-viewer.tsx`** [NEW / REFACTOR]:
   - "Submitted changes" (`id="submitted-changes"`):
     - Scope summary: changed file count, additions (+), deletions (−).
     - Full diff viewer with accessible line numbers, addition/deletion indicators (+/−), and syntax-aware formatting.
     - Case D: Engineer view highlights write-through Redis cache update; other roles maintain neutral scope.

10. **`review-guidance.tsx`** [NEW]:
    - Calm policy notice (e.g. engineering review required before technical rejection) and handoff affordance (`Request engineering review`).

11. **`technical-chronology.tsx`** [NEW]:
    - "Open technical chronology" disclosure: exact commands, exit codes, timestamps, durations, and stdout/stderr previews with truncation indicators.

12. **`evidence-reference-drawer.tsx`** [NEW]:
    - Interactive progressive disclosure panel allowing drill-down from briefing statement → structured evidence → exact raw record.

13. **`apps/web/app/workspace.css`** [MODIFY]:
    - Styles for Evaluator v2: editorial typography, warm neutral surfaces, tactile borders, responsive layout, accessible diff colors, print/reduced-motion rules.

## Verification Plan

### Automated Tests

1. **New UI Component & Role Lens Tests**:
   - `tests/unit/evaluator-v2-rendering.test.tsx`:
     - Test Generalist Recruiter view: no SHA hashes, no raw event IDs, grouped activity, neutral verification facts.
     - Test Technical Recruiter view: technical footprint, verification chronology, tooling, evidence links.
     - Test Engineer view: split/expanded layout, technical chronology, stdout preview, diff viewer, Case D write-through copy.
     - Test Engineering Manager view: synthesis, limitations, review guidance, no fake scores.
     - Test Case C: 0 passed, 3 failed → edit → 0 passed, 3 failed without verdict language.
     - Test Case D: write-through cache diff without canonical warning.
     - Test Case F: platform-owned capture gap notice.
     - Test Case G: legacy context graceful fallback.
     - Test Accessibility: role lens keyboard navigation, ARIA attributes, disclosure semantics.
2. **Integration Verification**:
   - Run existing gate fixture tests: `npm test -- tests/integration/evaluator-gate-fixtures.test.tsx`
   - Run existing briefing suites: `npm test -- tests/unit/evaluator-briefing.test.ts tests/integration/evaluator-briefing.test.ts tests/integration/evaluator-briefing-artifacts.test.ts`
   - Full repository verification: `npm run verify` (`format:check`, `lint`, `typecheck`, `test`, `build`).

### Manual Product & Visual Review

- Inspect all four cases (C, D, F, G) across all four role lenses (`GENERALIST_RECRUITER`, `TECHNICAL_RECRUITER`, `ENGINEER`, `ENGINEERING_MANAGER`) in the browser.
- Verify responsive layout across desktop, tablet, and mobile widths.
