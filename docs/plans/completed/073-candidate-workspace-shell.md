# 073 — Candidate Workspace Shell / Navigation (C3)

Status: completed
Baseline: `1b1f85c5ac127a33c1cdcabc9130ff39e2633a0d`

## Goal

Build the `ACTIVE_WORKSPACE` shell around existing brief, file editor, Commands,
and integrated AI surfaces without changing their domain behavior.

## Completed Changes

- Added active-only workspace navigation and a stable session bar with the
  existing projection-derived timer and submit entry point.
- Kept Scenario, Editor (including Files), Commands, and AI mounted while
  navigation only changes presentation. File selection, unsaved editor content,
  command history, AI conversation state, and timer calibration stay intact.
- On desktop, the shell presents Scenario, Editor, and workspace tools in three
  columns. On narrow layouts, navigation exposes each core surface; Files uses
  the existing Editor/File-selector surface.
- Navigation uses native buttons with an explicit label and pressed state.
  Selected panels receive focus; the countdown is readable without announcing
  every tick.
- This composes the C1/C2 authoritative candidate projection and existing
  activation, timer, save, command, AI, and submit behavior. It adds no client
  lifecycle or finalization state.

## Boundaries

- No lifecycle, activation, timing authority, save semantics, command behavior,
  AI behavior, or submission-flow changes.
- C4 save/editor persistence UX, C5 Commands redesign, C6 AI redesign, C7
  timer/deadline redesign, C8 completion/finalization, C9 accessibility and
  responsive hardening, and C10 visual polish remain deferred.

## Verification

- Focused C3 shell tests: 3 passed.
- Candidate regression tests: 110 passed.
- `npm run lint`, `npm run typecheck`, and `npm run build`: passed.
- Full `npm run verify`: `format:check`, lint, and typecheck passed; Docker
  integration tests could not run because Docker socket access was denied
  (`permission denied while trying to connect to the docker API at
unix:///var/run/docker.sock`). The test stage therefore failed before build.
