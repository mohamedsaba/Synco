# C5 Candidate Commands UX

## Scope

Replace the command-console presentation only. Preserve the existing
single-request API and authoritative session, deadline, sandbox, and editor
persistence boundaries.

## Plan

1. Model each locally displayed command as one chronological entry.
2. Render running, completed, timed-out, and platform-error outcomes without
   treating a non-zero exit as a platform failure.
3. Add focused state-model tests, retain existing backend contract tests, then
   run C3/C4/candidate/timing regressions and the full verification gate.

## Non-goals

No PTY, streaming, persistent browser history, rerun controls, API redesign,
or C6-C10 work.

## Delivered behavior

- Commands presents the existing request/response command runner, not a shell
  or interactive terminal.
- A local entry starts before the request and remains in chronological position.
  One in-flight guard blocks duplicate submission. Completion updates only its
  own entry.
- Success, non-zero completion, timeout, and platform errors have separate
  textual states. Stdout, stderr, duration, and server truncation facts remain
  attached to the matching command.
- ACTIVE and deadline admission remain server-enforced. The client disables
  command admission from its existing capability projection and shows rejected
  commands as platform errors. Command state does not affect C4 editor state.
- History remains mounted while C3 navigation changes panels but is not retained
  across refresh. Rerun is not implemented.

## Verification

- Focused C5 state and workspace markup tests.
- Existing command, candidate projection/prestart/C3/C4/AI/submission, and
  timing/finality regressions.
- `npm run verify`.
