# 067 — T1A.3A: Frozen Workspace Finality Foundation

Status: completed.
Baseline: `1dd5d0fcf57c39dff3af172049b4b2f9af5b0dab` (feat(timing): enforce request-bound deadline cutoff).

## Objective

Establish the frozen workspace finality foundation for manual multi-file candidate submission:

> Freeze the primary sandbox, capture authoritative workspace evidence from a read-only helper against a named session volume, then commit durable `SUBMITTED` / `candidate_submission` closure before teardown.

This slice does **not** add automatic timeout finalization, durable `EXPIRED`/`FINALIZING`/`COMPLETED` states, a sweeper, candidate timer UI, or root-subreaper command supervision (T1A.3B / T1B).

## Delivered Guarantees

1. **Named session workspace volume**
   - `/workspace` uses one dedicated Docker named volume per session: `hirearchy-ws-<sanitized-session-id>`.
   - Volume replaces `/workspace` tmpfs so evidence remains addressable after `docker pause`.
   - Volume is created before container start; create failure cleans orphan volumes; final volume removal happens only after durable SQLite closure (or create-time orphan cleanup).

2. **Whole-container freeze**
   - Manual multi-file submission freezes the primary via `docker pause` and confirms `State.Paused == true`.
   - Primary is never unpaused after finalization begins.
   - Freeze failure leaves `status = ACTIVE`, `closureReason = null`, infrastructure preserved.

3. **Read-only helper capture**
   - Trusted ephemeral helper mounts the workspace volume `:ro` while primary remains paused.
   - Helper constraints: `--rm`, `--network none`, `--read-only`, bounded memory/CPU/PIDs and runtime, `--cap-drop=ALL`, `no-new-privileges`, no Docker socket.
   - Helper image identity is restart-recoverable from the primary container via `docker inspect Config.Image` (no in-memory-only map as sole source of truth).

4. **Manual submission ordering**
   - Pre-finality drift handling → freeze → verify paused → frozen capture → atomic SQLite submit (`SUBMITTED` / `candidate_submission`, AI session-end cancellation preserved) → teardown container + volume.
   - Submission is never committed before successful frozen evidence capture.
   - Volume is never removed before durable DB closure.

5. **Failure semantics**
   - Freeze failure: ACTIVE, no fake submission, volume preserved.
   - Frozen capture failure: primary remains PAUSED, volume intact, ACTIVE, no fabricated diff, no unpause-to-retry.
   - DB finalization failure after freeze: PAUSED + volume intact, ACTIVE, no resume.
   - Teardown failure after successful DB closure: remains SUBMITTED; truthful `SANDBOX_CLEANUP_FAILED`; session not reopened.

6. **Recovery compatibility (T1B readiness)**
   - ACTIVE + paused primary + named volume survive application restart.
   - Helper image can be re-derived without process memory.
   - Root subreaper remains T1A.3B; restart reconciler remains T1B.

## Verification

Targeted suite: `tests/integration/frozen-workspace-finality.test.ts` passed 32 tests, including Docker-backed volume/freeze/capture/pause-containment and mock orchestration failure paths.

Relevant F01/F02, F03, S1, T1A.1, and T1A.2 regressions passed 144 tests. Full `npm run verify` passed formatting, lint, typechecking, 460 tests with 6 existing opt-in tests skipped, and the production build.
