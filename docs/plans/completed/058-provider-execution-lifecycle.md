# 058 — Delimit Slice 6C: Provider Execution Lifecycle

Status: completed.
Authorized: 2026-09-18.

## Context & Objective

Delimit Slice 6C builds directly on the accepted Slice 6B foundation (`4197f007040145f4d86dd7397f1edf0cf85c8797`).
The objective is to implement the synchronous candidate AI provider execution lifecycle while preserving core Delimit principles:

- Evidence precedes judgment;
- AI use is neutral (observable interactions recorded without inferring competence or causality);
- Evaluator owns the verdict;
- Minimal modular monolith architecture with no speculative microservices, streaming, or queue dependencies.

## Implementation Scope

1. **Minimal Provider Abstraction (`apps/web/src/ai/ai-provider.ts`)**:
   - Smallest interface required for normalized text completion:
     - `AiProvider`: `readonly providerId: string; execute(request: NormalizedAiRequest, options?: { signal?: AbortSignal }): Promise<NormalizedAiResult>;`
     - `NormalizedAiRequest`: configured model ID, candidate input, candidate context attachments, Delimit context metadata.
     - `NormalizedAiResult`: response text, reported model ID, provider request ID, finish reason, token usage.
   - Preserves authorship boundaries: candidate prompt, candidate-selected context, and Delimit scenario context are kept distinct.
   - `AiProviderRegistry` and `DefaultAiProviderRegistry` for resolving providers by ID.

2. **Deterministic In-Process Mock Provider (`apps/web/src/ai/mock-ai-provider.ts`)**:
   - `MockAiProvider implements AiProvider`:
     - Provider ID: `'mock-ai'` (aligning with `defaultAiCapabilitySnapshot`).
     - Supports deterministic response generation, custom responder functions, simulated provider errors, delay, and abort signal handling.
     - Generic deterministic double without test-fixture-specific couplings.

3. **Context Security & Bounding (`apps/web/src/ai/ai-interaction.ts`)**:
   - `validateCandidateContextAttachments`: rejects path traversal (`..`), absolute paths, backslashes, and invalid line ranges.
   - `MAXIMUM_RESPONSE_LENGTH = 65_536` (64 KiB) protects against unbounded provider output.
   - Domain errors: `PROVIDER_NOT_CONFIGURED`, `PLATFORM_PERSISTENCE_FAILED`, `AMBIGUOUS_DISPATCH`.

4. **Synchronous Execution Lifecycle (`apps/web/src/ai/ai-interaction-service.ts`)**:
   - `executeInteraction`:
     - Validates active session and enabled capability.
     - Resolves provider solely from immutable `session.aiCapabilitySnapshot.configuredProviderId`.
     - Validates input and context attachments.
     - Performs Slice 6B atomic admission.
     - Enforces dispatch ambiguity: persists `DISPATCH_STARTED` BEFORE calling provider.
     - On duplicate `DISPATCH_STARTED`, returns explicit non-replayable state and does not replay provider.
     - Calls provider with `AbortController` timeout timer.
     - On provider success: bounds response, atomically persists `COMPLETED`, appends `AI_RESPONSE_COMPLETED`.
     - On provider failure / timeout: records `FAILED` with `TIMEOUT` or `PROVIDER_ERROR` terminal reason, appends `AI_REQUEST_FAILED`. Timeout never emits `CANCELLED`.
     - Surfaces `PLATFORM_PERSISTENCE_FAILED` if terminal write fails; never reports false success to caller.

5. **Candidate API Endpoint (`apps/web/app/api/candidate/sessions/[token]/ai/interactions/route.ts`)**:
   - `POST /api/candidate/sessions/[token]/ai/interactions`.
   - Authenticates session via token, verifies `ACTIVE` status.
   - Extracts clientRequestId, candidate prompt, context attachments; ignores any client-supplied provider/model/apiKey.
   - Assembles Delimit context from authoritative session.
   - Returns normalized execution response via HTTP 200 or handles domain errors via `errorResponse`.

6. **Error Response Integration (`apps/web/src/http/error-response.ts`)**:
   - Integrated `AiInteractionError` with status codes (400 for `INVALID_INPUT`, 409 for `SESSION_NOT_ACTIVE`/`AI_NOT_ENABLED`/`AMBIGUOUS_DISPATCH`, 413 for `INPUT_TOO_LARGE`, 500 for `PROVIDER_NOT_CONFIGURED`/`PLATFORM_PERSISTENCE_FAILED`).

7. **Verification & Tests**:
   - `tests/unit/mock-ai-provider.test.ts`: 5 unit tests for mock provider capabilities.
   - `tests/unit/ai-execution-lifecycle.test.ts`: 13 unit tests covering complete test matrix.
   - `tests/integration/candidate-ai-api.test.ts`: 7 integration tests for HTTP endpoint.
   - Full regression pass over Slice 6B and existing test suites.
