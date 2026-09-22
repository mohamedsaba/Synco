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
