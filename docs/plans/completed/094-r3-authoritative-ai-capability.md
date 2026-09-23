# 094 — R3: Authoritative AI capability configuration

Status: completed pending Docker-backed verification environment access.

## Validated F-01 root cause

Candidate AI, its API, interaction persistence, and evidence reconstruction already existed. `POST /api/sessions` resolved the public Scenario 001 definition but did not supply an AI capability to `SessionService.createSession`. The service intentionally defaults omitted capabilities to the disabled snapshot for direct internal callers, so normal public sessions were created with AI disabled.

## Authority chain and Scenario 001 policy

Scenario 001 declares the product AI capability beside its definition. The existing issuable-scenarios registry carries that declaration with the publicly issuable scenario. The public creation route resolves that registry entry and passes its capability explicitly to session creation:

`Scenario 001 product configuration -> issuable registry -> POST /api/sessions -> immutable session snapshot -> candidate API and UI projection -> recorded evidence`

Scenario 001 uses the existing enabled mock-provider capability. Internal callers that omit a capability keep the disabled default, and explicitly disabled test sessions remain supported.

## Session and trust-boundary behavior

`SessionService.createSession` copies any supplied capability before persistence. The exact copy is written to `assessment_sessions.ai_capability_snapshot`; later configuration changes cannot mutate the returned or persisted session snapshot. The public route does not read an `aiCapability` request field, so browser input cannot enable or disable the assessment capability.

Capability remains product/session policy. Provider credentials or runtime provider failures retain their existing provider-error behavior and do not rewrite the session snapshot as disabled.

## Candidate, evidence, and finality behavior

The existing candidate projection exposes only the persisted `enabled` flag, so an active public Scenario 001 session enables the existing AI panel without a UI redesign. `AiInteractionService` continues to admit new interactions only when the persisted snapshot is enabled and the session is active without finalization admission. Existing AI lifecycle records and neutral event evidence remain unchanged; no scoring, quality, reliance, or hiring inference was added.

R2 registry validation is still the public issuance boundary. Unknown scenarios remain rejected before creation, while evaluator authorization, SQLite lifecycle, sandbox behavior, workspace containment, timing, and finality semantics are unchanged.

## Tests and verification

- Extended public Scenario 001 issuance coverage verifies the explicit registry policy, forged client override rejection-by-ignorance, persisted snapshot, candidate projection, active AI admission, and recorded AI start/completion evidence.
- Added a snapshot-copy regression proving a later source-configuration mutation cannot alter an issued session.
- Existing AI-disabled, replay/idempotency, lifecycle/finality, candidate-panel, homepage-request, session-persistence, and R2 issuance tests remain in the focused regression set.
- `npm run format` passed.
- `npm run test -- tests/integration/scenario-issuance.test.ts` passed (11 tests).
- The broader focused regression run passed 80 tests; 2 candidate-workspace activation tests were blocked by denied Docker socket access, not product assertions.
- `npm run lint` and `npm run typecheck` passed.
- `docker info` was blocked by denied access to `/var/run/docker.sock`; `npm run verify` was not run.
