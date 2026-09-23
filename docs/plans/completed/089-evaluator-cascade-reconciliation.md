# G3 — Evaluator cascade reconciliation

## Scope

Reconcile the live E6 evaluator polish overrides in `apps/web/app/workspace.css`
without changing computed evaluator or Candidate behavior. No React, token, API, or
domain changes are permitted.

## Plan

1. Map E6 overrides against their earlier live rules and fold only the final values
   into evaluator-only canonical selectors.
2. Keep Candidate-shared selectors evaluator-scoped and preserve E5 breakpoints,
   focus rules, and Engineer inspection behavior unchanged.
3. Update the focused stylesheet contract, compare computed CSS before and after,
   run targeted tests and the required quality gates, then move this plan to
   `completed/` with the final map and results.

## Override map

All prior entries below were `SAFE_TO_FOLD` unless marked otherwise. “Base”
means the corresponding live evaluator rule in `workspace.css`; “E6” means the
former final block at the end of that file. The listed final values are the
accepted E6 values now held by the base rule.

| Selector family                | Earlier rule                                                                                                        | E6 final properties                                 | Result                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| review shell                   | `.evaluator-review-shell`                                                                                           | width, padding                                      | Folded into base                                                                          |
| entry card                     | `.evaluator-entry-card`                                                                                             | border, background, shadow                          | Folded into base                                                                          |
| entry link/title               | `.evaluator-review-link`, `.evaluator-review-title`                                                                 | layout, border, type, hover                         | Folded into base                                                                          |
| evaluator container/header     | `.evaluator-v2-container`, `.evaluator-v2-header`                                                                   | gaps, padding, border                               | Folded into base                                                                          |
| branding/metadata/status/title | `.evaluator-brand`, `.title-metadata-pill`, `.status-indicator`, `.duration-indicator`, `.evaluator-scenario-title` | type, color, radius, dimensions                     | Folded into base                                                                          |
| role lens                      | `.role-lens-nav`, `.role-lens-switcher`, `.lens-tab`, active/first-child states                                     | spacing, borders, targets, selection, font-size     | Folded into base; accepted E6 font size is 0.78rem                                        |
| hierarchy navigation           | `.evidence-hierarchy-nav`, link/hover                                                                               | border, spacing, type, hover                        | Folded into base                                                                          |
| layout/notices                 | `.evaluator-main-layout`, `.platform-notice-card`, `.platform-notice-info`, `.platform-notice-gap`                  | gap, card geometry, colors                          | Folded into base; gap width retained at final 3px                                         |
| scenario/guidance              | `.scenario-reference-grid`, `.guidance-card`                                                                        | surface/background                                  | Folded into base                                                                          |
| chronology activity            | `.activity-content`, `.activity-marker`, `.activity-text`, `.activity-verification-result`                          | rhythm, marker geometry, type, verification callout | Folded into base                                                                          |
| evidence controls              | `.evidence-toggle-button`, `.submitted-diff-toggle`, hover                                                          | colors/background/border                            | Folded into base                                                                          |
| Engineer workspace             | `.engineer-evidence-workspace`, `.engineer-inspection-panel`, `.engineer-evidence-provenance`                       | gap, panel geometry, provenance framing             | Folded into base; sticky media rule unchanged                                             |
| drawers/artifacts/submission   | `.activity-evidence-drawer`, `.artifact-provenance-details`, `.submitted-summary-card`, `.submitted-diff-container` | surfaces and borders                                | Folded into base                                                                          |
| evaluator code surfaces        | `.submitted-diff`, `.activity-output pre`                                                                           | scrollbar colors                                    | Folded into base                                                                          |
| evaluator AI status            | cancelled/failed/timeout `.activity-status-tag` rules                                                               | notice colors                                       | Folded into base                                                                          |
| narrow role/navigation         | `@media (max-width: 34rem)` evaluator lens/hierarchy rules                                                          | 50% lens basis, border, link padding                | **KEEP_LAYERED** media behavior, relocated beside E5 responsive rules                     |
| shared AI excerpt              | `.activity-excerpt`, `.activity-excerpt.error-excerpt`                                                              | evaluator scrollbar/error colors                    | **KEEP_LAYERED** under `.evaluator-v2-container` so Candidate rendering remains unchanged |

## Preservation decisions

- E5 focus-visible styles, control targets, `70rem` Engineer grid/sticky rule,
  bounded inspector height, local overflow, and existing media breakpoints were
  retained. The obsolete `60rem` header gap lost to E6 specificity was removed,
  leaving its accepted 1.35rem final value at every viewport.
- Candidate uses `.activity-excerpt`; its unscoped base and error rules were not
  changed. Evaluator-only scrollbar and notice-error values remain container
  scoped.
- No React, markup, token, backend, API, or domain files changed. No visual
  redesign was made.

## Parity and verification

- The CSS source audit compared the accepted HEAD E6 block with each canonical
  destination. It retired 93 E6 declaration positions and reduced the stylesheet
  from 2,950 to 2,781 lines (169 lines net).
- No browser executable was available to the validation shell, so authenticated
  rendered browser comparison could not run.
- Focused evaluator and Candidate tests: 11 files, 117 tests passed.
- Pre-final gate passed: `npm run format:check`, `npm run lint`, and `npm run
typecheck`.
- `npm run verify` ran once. Format, lint, and typecheck passed; its all-test
  phase failed in three Docker-backed integration tests before build. `docker
version` confirmed Docker socket access was denied at
  `unix:///var/run/docker.sock`.
