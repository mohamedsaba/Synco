# C8A — Finality recovery projection correction

## Goal

Make `ACTIVE + closureReason != null` the durable, irreversible finalization-admission state without changing the `CREATED -> ACTIVE -> SUBMITTED` lifecycle or database schema.

## Delivered

- Persist the first closure reason after successful pre-freeze drift capture and before workspace freeze.
- Resume admitted finalization during reconciliation while preserving manual versus timeout intent and existing fail-closed resource checks.
- Reject candidate save, command, duplicate finalization work, and new AI mutations from durable session truth.
- Project admitted ACTIVE sessions as readonly `FINALIZING` and merge timing responses monotonically.
- Preserve existing-session AI replay before the new-interaction admission guard.
- Keep `closureReason` first-writer-wins under concurrent manual and timeout admission.

## Compatibility boundaries

- No durable status, schema column, migration, C8 review UI, C9, or C10.
- No Docker-state authorization and no client-only finality flag.
- Existing mismatch recovery remains fail closed.
- Legacy `ACTIVE + closureReason == null`, `CREATED`, and `SUBMITTED` rows retain their prior behavior.

## Verification

- Focused non-Docker C8A proof: 105/105 passed.
- Docker-backed finality and restart proof: 46/46 passed.
- Required 22-suite regression chain: 245/245 passed.
- Corrected stale workspace-evidence assertion: 11/11 passed in the directly affected file.
- Final repository gate: formatting, lint, typecheck, 580 tests passed, 6 skipped, and production build passed.

## Deferred

C8, C9, and C10 remain outside this slice.
