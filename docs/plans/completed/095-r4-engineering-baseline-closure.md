# 095 — R4: Engineering baseline closure

## Baseline

R4 began from clean HEAD `4a7c9cdbc342130eeb7c29f3374a96fdbbaf4739` after accepted R1 workspace File API containment, R2 explicit public scenario issuance, and R3 authoritative AI capability configuration.

## Reconciliation

- R1 containment remains at the Docker sandbox File API boundary, including traversal and escaping-symlink rejection, internal-link reads, and leaf-link write rejection.
- R2 public issuance remains registry-only. Unsupported IDs reject before persistence or provisioning; `execLegacy` remains test/internal-fixture compatibility only.
- R3 Scenario 001 capability remains registry-owned, enabled, cloned into an immutable session snapshot, and consumed by candidate AI admission. The runtime remains intentionally `MockAiProvider`.
- Candidate lifecycle remains `CREATED → ACTIVE → SUBMITTED`; timeout finalization remains `SUBMITTED` plus `closureReason = timeout`, and admission remains irreversible.
- Evaluator reconstruction remains evidence, not interpretation or a verdict.

## Documentation convergence

- Removed `SESSION_EXPIRED` from current event/state documentation and clarified that it is candidate timer presentation, not durable session status or an event-union member.
- Replaced unsupported SQLite event-log immutability claims with the supported application-level append-only, per-session sequence-numbered, ordered repository-interface guarantee; direct SQLite modification, cryptographic tamper detection, signatures, and external anchors are not claimed.
- Updated architecture and handoff documentation to the R1–R3 baseline and its next phase.

## Deferred non-blocking work

Evaluator tenant/identity/assignment architecture, SQLite migration/connection lifecycle cleanup, `execLegacy` test/internal compatibility, real AI provider configuration, and CSS/visual cleanup remain intentionally deferred. They are not blockers for Hirearchy product/visual design.

## Verification and handoff

R4 runs documentation checks, format, lint, typecheck, and exactly one Docker-gated full verification before its documentation-only commit. The engineering baseline then freezes for Hirearchy Brand & Product Design Foundation, followed by Hirearchy Software visual/UI redesign.
