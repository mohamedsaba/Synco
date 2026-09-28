# Slice 4 baseline reconciliation

## Objective

Reconcile the committed Slice 4 implementation and documentation without adding product capabilities. Preserve the authoritative evidence boundary, make final workspace consistency enforceable, and make post-submission cleanup failures observable.

## Scope

- Update the handoff to the committed `b9dc54d66084c608dd688bb71a3e37f197cfc211` baseline.
- Replace the stale architecture delivery order with completed and not-yet-implemented sections.
- Require the final submitted tree to equal the last authoritative workspace tree after drift reconciliation. An unexplained mismatch records `WORKSPACE_CAPTURE_FAILED`, leaves the session `ACTIVE`, and prevents submission.
- Define `SUBMITTED` as a durable evidence-freeze boundary: final evidence has been captured and candidate mutation APIs reject further work. Sandbox destruction is subsequent infrastructure cleanup.
- Record a platform event when sandbox cleanup fails after submission; do not reopen or alter submitted evidence.
- Remove the unused `captureDiff` API and its candidate-controlled Git fallback.
- Add focused regression tests for tree mismatch and teardown failure.

## Constraints

- No new lifecycle state.
- No AI, PTY, scoring, semantic test recognition, or Slice 5 work.
- No attempt to make SQLite persistence and Docker teardown one transaction.
- Candidate-controlled Git must not participate in authoritative evidence capture.

## Verification

- `git diff --check` passes.
- `npm run verify` passes: 14 test suites / 41 tests, formatting, lint, typecheck, and production build.
- `apps/web/next-env.d.ts` has no generated drift.
- `docker ps -a --filter "name=hirearchy-"` reports no leaked containers.
- Final diff reviewed; reconciliation is awaiting human review before commit.
