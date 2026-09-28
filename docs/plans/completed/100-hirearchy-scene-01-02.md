# 100 — Hirearchy Scene 01 + Scene 02 opening

Status: `OPENING_EXPERIENCE_COMPLETE`. Scope stops before Scene 03. No commit, push, or merge.

## Baseline and authority

Worktree: `.worktrees/d1b-frontend-craft`, branch `feature/d1b-frontend-craft`, HEAD `c069e11c40dabc2b9748d52f48119639f926468d`.
Pre-existing Scene 01/02 implementation and untracked design/spec assets are
preserved as input. Read the supplied brief, required design package, product
principles, architecture gates, masterboard, and every production-used image.
The current task supersedes 099's full-site sequence and stops before Scene 03.
Its Product Truth & Architecture Gate overrides conflicting older copy.

## Implementation decisions

- Replace the mounted old homepage with only header, Hero, and Scene 02 opening.
  Keep unmounted later-scene source files untouched.
- Use the approved PNG bytes, served through Next Image. No generated artwork,
  dependency, product route reuse, or product API access.
- Embed the supplied horizontal SVG markup verbatim, with CSS overflow visible:
  its intrinsic viewBox clips the last letter when rendered as an image. Do not
  alter mark geometry, text, or font. Test exact source correspondence.
- Replace the rejected monolithic-raster camera path with the required discrete
  stack: approved plane kit, approved repository panel, native sanitized Attempt
  workbench, approved connector spine, and four approved evidence cards. The
  resolved Hero PNG remains a visual/reduced-motion reference, never the primary
  animated desktop object.
- Native sticky positioning supplies scroll travel. One presentational client
  island updates layer-specific CSS variables on demand, pauses offscreen, and
  owns only scroll/replay/card-selection state. No continuous idle render loop.
  Copy, assets, and scene semantics remain server-rendered.
- Replay sequence controls the same evidence phases without moving page scroll.
  Pointer, keyboard, and tap selection use native buttons and highlight the same
  connector/workbench relationship.
- Platform / Explore Work anchor to Scene 01; Evidence opens the illustration's
  semantic description; Philosophy anchors to Scene 02. No fabricated public
  product walkthrough or unauthorized active session is implied.
- Use exact approved Scene 01 and Scene 02 copy. Scene 02 receives surgical
  refinement around the mandatory impressions asset and a structural overlap
  that flattens Scene 01's dense relationships into three isolated plates.
- Mobile uses normal document flow and a deliberately simplified resolved stack
  with direct evidence-card taps. Reduced motion disables sticky scroll and all
  spatial displacement while keeping every card visible and operable.

## Validation

- Focused homepage unit suite: 9/9 passed.
- Chromium browser gate: 1440×900, 1280×800, 390×844, and reduced motion;
  all six evidence phases, pointer/keyboard/tap relationships, native replay,
  no horizontal overflow, no-JS fallback, contrast, and axe WCAG 2.2 AA passed.
- Visual inspection compared Hero, handoff, Scene 02, mobile, and reduced motion
  directly with the masterboard. Corrected desktop card clipping and workbench
  text contrast after the first render.
- Final `npm run verify` passed with Docker access: formatting, lint, generated
  route types, TypeScript, 649 tests passed with 6 skipped, and production build.
- Scene 03 was not implemented.
