# 096 — D1 Hirearchy masterbrand foundation and homepage

## Boundary

Replace only the public homepage and root metadata with the Hirearchy
masterbrand foundation. Preserve Candidate, Evaluator, API, session, evidence,
and domain behavior. Reuse the existing real session creation and evaluator
entry controls; add no dependencies.

## Design contract

- Express progressive clarity through an adaptive rectangular frame, sparse
  editorial evidence fragments, and one chronological evidence narrative.
- Keep the page bright, warm, typographic, human, and non-judgmental.
- Give the eight homepage sections distinct adjacent motion primitives:
  organize, reframe, unfold, prioritize, adapt, enter, contrast, settle.
- Keep the static composition complete without animation; use native CSS motion
  only as progressive enhancement and disable it for reduced motion.
- Present Hirearchy Software as current and IT/Marketing as future concepts.

## Implementation

1. Build the semantic server-rendered homepage from small section components and
   one reusable adaptive-frame primitive.
2. Add a homepage-scoped responsive visual system without changing product UI
   styling or client/server boundaries.
3. Update root metadata and add a focused rendering contract test.
4. Inspect desktop, tablet, mobile, and reduced-motion states; correct overflow,
   rhythm, clipping, and hierarchy issues.
5. Run targeted tests, format, lint, typecheck, then `npm run verify` exactly once.
   Review the full diff, record results here, move this note to `completed`, stage
   explicit files, and commit with the required message.

## Deliberate exclusions

No Candidate or Evaluator redesign, product-UI design system migration, new
vertical implementation, backend/domain change, analytics, scoring, decorative
network graph, fake dashboard, image generation, or motion dependency.

## Completion

### Brand and visual grammar

- Progressive clarity begins with independent evidence fragments and moves
  through sequence, hierarchy, product family, and a human decision boundary.
- The Adaptive Frame is one rectangular spatial grammar that divides, focuses,
  and changes density across hero, product-family, and software contexts.
- The Signal Field is sparse and semantic: only attempt, verification, revision,
  chronology, submitted work, source evidence, and known limits are related.
- The Evidence Narrative uses one evolving sequence rather than timeline cards
  or analytics. Future verticals are explicitly labeled as future directions.

### Motion and homepage choreography

The eight adjacent primitives are `organize → reframe → unfold → prioritize →
adapt → enter → contrast → settle`. CSS view timelines progressively enhance a
complete static composition. Motion is restrained on mobile where the hero's
spatial transform would reduce legibility, and the reduced-motion preference
removes decorative motion.

### Accessibility and performance

The page is server-rendered except for the existing session-creation control,
adds no dependency or image payload, uses semantic sections and heading labels,
retains keyboard focus treatment, and has no horizontal overflow at the tested
widths. Live contrast checks measured 14.88:1 for ink, 5.48:1 for muted text,
and 5.51:1 for accent text against the brand paper.

### Responsive and visual QA

Inspected at 1440×1000, 1280×900, 820×980, and 390×844, plus a 390×844
Chromium render with reduced motion forced. The pass covered typography,
section rhythm, clipping, horizontal overflow, semantic motion resolution,
focus, CTA visibility, and browser console output. Mobile hero motion was
removed after it caused fragment overlap; a legacy generic CSS class collision
was removed by brand-scoping the homepage section-heading primitive. No generic
AI/SaaS dashboard, card grid, neon, glass, fake analytics, or decorative graph
remains.

### Tests and verification

- `tests/unit/hirearchy-homepage.test.tsx` protects masterbrand language, the
  human-decision boundary, future-vertical honesty, section semantics, distinct
  motion order, real destinations, and reduced-motion CSS.
- Focused regression: 2 files, 5 tests passed.
- `npm run format`, `npm run lint`, and `npm run typecheck` passed before the
  final full gate.
- `npm run verify` ran exactly once and exited 1 in the test phase: 59 files and
  578 tests passed; 10 files and 37 Docker-dependent tests failed; 5 files and
  35 tests were skipped. Every failure traces to permission denied for
  `/var/run/docker.sock`, not a product assertion. The chained build did not run.
- A separate `npm run build` passed, including TypeScript, static generation,
  and the optimized production build.

### Files changed

- `apps/web/app/page.tsx`
- `apps/web/app/home.css`
- `apps/web/app/layout.tsx`
- `apps/web/app/create-session-button.tsx`
- `tests/unit/hirearchy-homepage.test.tsx`
- `docs/plans/completed/096-d1-hirearchy-masterbrand-homepage.md`

### Deferred

Candidate and Evaluator visual redesign, broader product token inheritance,
additional vertical products, production webfont assets, and richer motion
instrumentation remain outside D1.
