# 077 — Candidate timer / deadline UX

## Delivered

C7 presents the existing C1 server-calibrated `remainingMs` projection in the persistent workspace bar. A local 1-second tick only requests a React re-render; it never decrements time. Returning to a visible tab immediately recalculates from calibrated time and refreshes the server timing projection.

The display uses ceiling rounding: positive authoritative remaining time displays at least one second, while exact/past deadline displays `00:00`. Sessions configured for an hour or more use stable `H:MM:SS`; shorter sessions use `MM:SS`. The only visual thresholds are `ATTENTION` at 5 minutes or less and `URGENT` at 1 minute or less, each with visible text.

## Deadline boundary

At `TIME_LIMIT_REACHED`, the UI says “Time limit reached. New work is no longer accepted.” with one polite status announcement. The countdown is never live-announced per tick and receives no focus. C7 relies on canonical C1 capabilities, so save, commands, AI, and submission controls are no longer offered while existing editor content, command history, and AI conversation stay mounted.

The client does not change durable session status or claim submission. Server timing, request-bound cutoff, timeout convergence, frozen-workspace finality, refresh reconstruction, and reconnect calibration remain authoritative.

## Verification

- Focused C7/C1 tests — 28 passed across 3 files.
- Candidate and timing regressions — 134 passed across 10 non-Docker files; frozen finality — 32 passed with Docker.
- Full suite — 559 passed, 6 skipped across 62 files.
- Format check, lint, typecheck, and production build — passed.

## Deferred

C8 submission/completion UX, C9 broad accessibility hardening, C10 polish, and all backend/API timing work remain out of scope.
