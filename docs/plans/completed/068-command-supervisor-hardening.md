# 068 — T1A.3B: Command Supervisor Hardening

Status: complete.
Baseline: `76e10d0cf19dc26420d9a4991658511bd167b19a` (`feat(sandbox): add frozen workspace finality`).

## Objective

Contain an ordinary timed-out candidate command and every structurally owned descendant without stopping PostgreSQL, Redis, the scenario application, or the active session.

## Boundaries

- Keep T1A.3A whole-container freeze unchanged for submission and assessment finality.
- Keep existing command result and evidence contracts.
- Do not add T1B deadline convergence, new session states, UI, or evaluator behavior.

## Implementation

1. Build a small static Linux supervisor into the scenario image.
2. Run it as trusted root with only `SETUID` and `SETGID`; pre-open the trusted status destination and set subreaper mode, then permanently drop the supervisor's supplementary groups, real/effective/saved UID/GID, and capability sets before it forks.
3. On its internal command deadline, use ordinary same-UID signals on the supervisor-owned process tree to kill, reap, and verify every command descendant. Record the trusted outcome through the pre-opened root-owned descriptor.
4. Make `DockerSandboxAdapter.exec` invoke the supervisor and return `timedOut=true` only after its trusted containment result is read.
5. Add Docker tests for identity, output, detached descendants, races, pre-existing processes, scenario services, session state, and subsequent commands.

## Verification

- Focused supervisor suite: 17/17 passed.
- Command/S1/F01/F02/F03/T1A.1/T1A.2/T1A.3A regression chain: 115/115 passed.
- `npm run verify`: format, lint, typecheck, 477 tests passed with 6 skipped, and production build passed.
