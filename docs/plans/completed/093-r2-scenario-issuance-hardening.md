# 093 — R2: Scenario issuance hardening

Status: completed with Docker verification blocked by environment access.

## Validated F-04 root cause

`POST /api/sessions` passed an optional ID to `SessionService.createSession`. Any value other than Scenario 001, including missing, malformed, or unknown IDs, selected the Slice 1 single-file fixture. That fixture uses the default Alpine image; absence of `delimit-exec-supervisor` causes Docker execution to select `execLegacy`.

## Issuance contract

The server-side `issuable-scenarios` registry contains only Scenario 001. Public creation requires the canonical `scenario-001-cache-staleness` ID. Malformed JSON and non-object requests return `INVALID_SESSION_REQUEST` (400); missing IDs return `MISSING_SCENARIO_ID` (400); invalid ID types or whitespace return `INVALID_SCENARIO_ID` (400); aliases, fixtures, and unknown IDs return `UNSUPPORTED_SCENARIO` (404). Rejections occur before session persistence or sandbox provisioning.

The homepage sends the canonical Scenario 001 ID and no longer exposes the Slice 1 fixture. Lifecycle, timing, finality, evidence, AI, evaluator, and sandbox behavior are unchanged.

## Legacy fixture and execLegacy reachability

Slice 1 is a documented development and verification fixture. Its direct service/test use and the historical `scenario-001` alias remain compatible, but neither is publicly issuable.

- Public production reachable: **NO** — the only public scenario is Scenario 001, whose image includes `delimit-exec-supervisor`.
- Test reachable: **YES** — direct Slice 1 fixtures and legacy compatibility tests may retain their existing legacy execution behavior.
- Internal fixture reachable: **YES** — Slice 1 remains an internal development fixture.

`execLegacy` was intentionally retained: it is not a host escape, and deleting it would alter existing fixture and compatibility behavior outside R2.

## Verification

- `npm test -- tests/integration/scenario-issuance.test.ts tests/unit/create-session-button.test.tsx tests/integration/authoritative-timing-foundation.test.ts tests/integration/session-service.test.ts`: passed (25 tests), covering canonical issuance, persisted metadata, multi-file image selection, homepage issuance, malformed/missing/invalid/unknown IDs, no persistence or provisioning on rejected input, and fixture/timing compatibility.
- `npm run format`, `npm run lint`, and `npm run typecheck`: passed.
- `docker info`: Docker socket access is denied at `/var/run/docker.sock`.
- `npm run verify`: ran once before the Docker availability check; format, lint, and typecheck passed, then Docker-backed integration tests failed only on that socket denial. The chained production build did not run.
