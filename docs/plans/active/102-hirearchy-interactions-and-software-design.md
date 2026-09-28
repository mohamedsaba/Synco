# Marketing interaction finish and Software product design

User authorization: 2026-09-28. First fix the live marketing website, then design Candidate and Evaluator interfaces in Figma using the current product structure and the Hirearchy brand. Product implementation is not requested in this slice.

## Marketing changes

Remove the 1800px outer width cap so every section background fills the viewport. Replace generic hover underlines with a consistent capsule reveal for navigation, a brand-dot accent for wordmarks, and directional arrows / inset emphasis for product links. Preserve keyboard focus, reduced motion and the original section layout. Display headings, branding and interactive labels are not selectable; prose stays copyable with mint selection. Editing fields retain text cursors and selection; controls use pointer and disabled cursors. All selectors remain scoped to the marketing surface.

## Product design

Inspect current candidate lifecycle, code/editor/terminal/AI/save/submit states and evaluator access/queue/reconstruction/lenses/evidence/limitations. Preserve authoritative lifecycle and evidence distinctions. Design an approachable Candidate workbench and an editorial Evaluator evidence workspace with shared Software branding. No score, ranking, inferred intent or automated verdict. Reusable components, real states, accessible contrast, keyboard/focus behavior, and responsive adaptations belong in the design.

## Verification

Marketing implementation complete. `npm run verify` passed: 651 tests, 6 skipped, formatting/lint/typecheck/build successful. Targeted browser checks passed at 2560×1440, 1920×1080, 1440×900 and 390×844, including full-width bounds/no horizontal overflow, real drag-selection prevention on display text, link cursors, absence of hover underline, capsule/dot feedback, stationary product cards with directional arrows, editable/copyable form input, keyboard focus, reduced motion and zero contact-page axe violations. Evidence: `tests/browser/hirearchy-interactions.mjs` and `docs/design/screenshots/common-thread-interactions/`. Final focused formatting/lint also passed after adding the browser check.

Figma design creation is blocked: the read-only discovery call returned "You've reached the Figma MCP tool call limit on the Starter plan." No Figma write occurred. Prepared the source-grounded screen/component/state map in `docs/design/hirearchy-software-ui-brief.md`; it is explicitly preparation, not a finished design. Resume native Figma discovery/construction when tool access becomes available. No Candidate/Evaluator product code has changed. Existing unrelated dirty work and historical design artifacts are preserved.
