# T1B.2 — Restart / Reconciliation

## Goal

Implement a robust, deterministic reconciliation pass at server startup to safely align the authoritative SQLite session state with external Docker state, specifically targeting crash recovery scenarios where timers drop and resources leak.

## Scope

- Added `findAllActiveAndSubmitted()` to `sqlite-session-store.ts`.
- Added `inspectResources(sessionId)` to `SandboxAdapter`.
- Added `reconcileSessions(observedAt)` to `SessionService` to evaluate conditions R1 through R7.
- Hooked reconciliation to execute reliably exactly once per startup via `startSessionTimeoutSweeper`.
- Wrote deterministic tests for all paths including failure boundaries when resources are partially missing to prevent fabricated empty submissions.
- Updated `docs/architecture/candidate-timing-contract.md` and `docs/architecture/sandbox.md` to reflect these boundaries.

## Rules Enforced

- Evidence precedes judgment: R3 (missing container, existing volume) and R4 (existing container, missing volume) explicitly fail closed and capture WORKSPACE_CAPTURE_FAILED rather than faking an empty submission or destroying recoverable data.
- Fix root causes: Reconciled based on authoritative state rather than inventing intermediary crash flags.
- Immutable Duration Snapshot: Untimed sessions and non-finalized states behave exactly as prescribed.
- Crash point handling:
  - Freeze failure -> session remains ACTIVE, container untouched (verified in T1B.1).
  - Capture failure -> session remains ACTIVE, primary container remains frozen/paused without unpausing (verified in T1B.1).
  - DB commit failure -> session remains ACTIVE, container remains frozen/paused (verified in T1B.1).
  - Teardown failure -> session stays SUBMITTED, resources cleaned up idempotently on next reconciliation (verified in T1B.1 & T1B.2 R5).

## Definition of Done

- `npm run verify` passes completely.
- 11 focused integration tests passing in `tests/integration/restart-reconciliation.test.ts`.
- Architectural decisions explicitly documented in canonical contract files.
