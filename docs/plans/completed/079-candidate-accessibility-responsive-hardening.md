# C9 — Candidate Accessibility / Responsive Hardening

## Delivered

- Preserved C1–C8 server truth, projection, persistence, command, AI, timer,
  finalization, and submission behavior. No backend or API changes.
- Replaced workspace and file pseudo-tab semantics with native navigation
  buttons. Current destination/file is exposed with `aria-current`.
- Kept workspace panels mounted during responsive panel changes. Navigation
  reveals the target without stealing focus from its activated control.
- Review focuses its heading, makes background workspace inert, and restores
  focus to Submit assessment on Back. Finalizing and completion retain one-time
  heading focus; deadline does not move focus.
- Preserved concise status/alert use: timer is non-live, command/AI history is
  non-live, and action errors remain textual and associated with their surface.
- Switched the single-panel breakpoint to `72rem` before three columns become
  cramped; narrow header/action rows stack, navigation scrolls locally, and
  command controls retain usable width and touch height.
- Removed the file-selector transition. Existing candidate motion remains gated
  by `prefers-reduced-motion: no-preference`.

## Verification

- Focused candidate UI tests: 33 passing.
- Typecheck: passing.
- Final repository verification: ran once. Format, lint, and typecheck passed;
  Docker-backed integration tests could not access `/var/run/docker.sock`, so
  the test stage failed before build.

## Deferred

C10 visual polish only: no brand, typography, decorative motion, or product
behavior redesign was added.

## C9A — Interactive Navigation and Focus Test Correction

- Chosen DOM test environment: `happy-dom` (v20.x, dev dependency).
- Selection rationale: Minimal footprint (7 packages added, no binary/native
  addons, no runtime bundle impact), seamless Vitest 5 file-level environment
  integration (`// @vitest-environment happy-dom`), and zero config churn.
- Real click behavior tested: Direct DOM click interactions on navigation buttons
  ('Scenario', 'Files', 'Editor', 'Commands', 'AI') update active panel state,
  shift `aria-current="page"` to the activated button, remove `aria-current` from
  inactive buttons, and apply `workspace-view-${panel}` class to the workspace grid.
- Real keyboard behavior tested: Native `<button>` keyboard activation via `Enter`
  and `Space` keys activates focused navigation buttons without unexpectedly moving
  focus to unrelated controls.
- Real focus behavior tested: Navigation buttons receive DOM focus (`document.activeElement`);
  opening submission review shifts focus to the review heading (`#submission-review-title`);
  closing submission review via Back button restores focus to the primary Submit
  assessment button. Entering finalizing terminal state shifts focus to the
  terminal heading.
- Mount preservation tested: Stateful DOM surfaces remain mounted and retain identity
  and state across navigation panel switching. Concrete proof verifies that
  modifications in the editor textarea, command input, and AI prompt retain both
  exact DOM node identity (`toBe(originalNode)`) and uncommitted values after cycling
  through all navigation surfaces.
- Responsive structure tested: Verified the JavaScript class contract (`workspace-view-${panel}`)
  that coordinates responsive CSS hiding.
- Limitations: DOM emulation (`happy-dom`) does not evaluate real CSS media queries,
  stylesheet cascading, or computed layout geometry (`display: none` layout suppression).
  True viewport rendering and pixel-level layout behavior remain CSS and manual-review
  responsibilities; tests do not claim full browser E2E coverage or WCAG certification.
