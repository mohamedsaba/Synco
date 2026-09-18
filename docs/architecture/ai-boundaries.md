# AI boundaries

AI use is neutral and derived output is never authoritative evidence.

## Candidate AI

AI acts as an ordinary engineering tool available to the candidate during assessment. Delimit records observable prompts, responses, supplied context, timestamps, and explicit terminal states. It must not infer that manually typed code came from AI, treat the amount of AI use as competence, or penalize candidates for AI utilization.

### Operational State vs. Append-Only Event Evidence (Slice 6B)

Delimit strictly separates mutable operational lifecycle state from immutable event evidence:

1. **Operational Interaction Store (`ai_interactions`)**:
   - Manages mutable execution state (`ADMITTED → DISPATCH_STARTED → COMPLETED | CANCELLED | FAILED`).
   - Guarantees durable session-scoped idempotent admission via `UNIQUE(session_id, client_request_id)`.
   - Stores full prompt text, context attachments, response text, token usage, duration, and error metadata.
   - Updates are executed atomically alongside event publication via `SqliteTransactionRunner`.

2. **Append-Only Event Store (`assessment_events`)**:
   - Records immutable milestone events (`AI_REQUEST_STARTED`, `AI_RESPONSE_COMPLETED`, `AI_REQUEST_CANCELLED`, `AI_REQUEST_FAILED`).
   - Every event receives a strictly monotonic server-assigned `sequence` number.
   - Events are replayable and cannot be mutated or purged once committed.
   - Event payloads contain bounded excerpts and metadata; full operational payloads reside in `ai_interactions`.

### Immutable Per-Session Capability Snapshot

Each assessment session captures an `AiCapabilitySnapshot` at session creation time:

- Fields: `enabled`, `provider`, `model`, `streamingSupported`, `toolsSupported`, `maxPromptLength`, `maxTokens`.
- Persisted immutably in `assessment_sessions.ai_capability_snapshot`.
- Subsequent changes to global or scenario AI configuration do not alter the rules or capabilities assigned to an existing session.

### Provider Execution Lifecycle (Slice 6C)

Slice 6C implements the synchronous candidate AI provider execution lifecycle:

1. **Provider Abstraction (`AiProvider`)**:
   - Smallest interface required for normalized text completion: `execute(request: NormalizedAiRequest, options?: { signal?: AbortSignal }): Promise<NormalizedAiResult>`.
   - Distinct authorship boundaries preserved: candidate-authored input, candidate-selected context, and Delimit-supplied context remain separated without concatenation.
   - Deterministic in-process `MockAiProvider` for testing and local execution without external network dependencies.
   - Provider registry resolves provider solely from immutable `session.aiCapabilitySnapshot.configuredProviderId`. Candidate input cannot select or override provider, model, or parameters.

2. **Synchronous Candidate API Endpoint**:
   - `POST /api/candidate/sessions/[token]/ai/interactions`.
   - Candidate provides `clientRequestId`, prompt, and context attachments.
   - Context attachments are validated against path traversal (`..`), absolute paths, and invalid ranges.
   - Returns a normalized execution response with status, response text, model, terminal reason, and error message.

3. **Dispatch Ambiguity & Idempotency**:
   - `DISPATCH_STARTED` is persisted atomically BEFORE calling the provider.
   - `DISPATCH_STARTED` means only that Delimit initiated outbound dispatch; it does not prove the provider received or processed the request.
   - For duplicate requests where current status is `DISPATCH_STARTED`, Delimit does not automatically call the provider again, returning an explicit ambiguous non-replayable state.
   - Terminal states (`COMPLETED`, `FAILED`, `CANCELLED`) return existing results without re-invoking the provider.

4. **Failure & Timeout Semantics**:
   - Timeout aborts provider execution via `AbortController` and records `FAILED` with `TIMEOUT` terminal reason (never `CANCELLED`).
   - Provider errors transition to `FAILED` with `PROVIDER_ERROR` and append `AI_REQUEST_FAILED`.
   - If terminal persistence fails after provider returns, Delimit throws a platform persistence error and never reports false success to the client.

### Scope Boundaries and Deferred Features

The following remain intentionally unimplemented:

- **Streaming / SSE**: Server-sent events, token streaming, and chunk persistence are deferred.
- **Candidate AI UI**: Editor sidecars, chat panels, and context selection affordances are deferred.
- **Commercial Network Providers**: Real network adapters (Anthropic, OpenAI) are deferred.
- **Evaluator AI Integration**: AI scoring, quality metrics, prompt grades, and reconstruction synthesis remain deferred.
- **Patch Application**: Diff parsing and patch application (`WORKSPACE_CHANGED` correlation) remain deferred.

## Authoritative evaluator reconstruction

Slice 5 Candidate Work does not use AI. Free-form AI reconstruction was rejected after the bounded Scenario A experiment because none of the tested models repeatedly satisfied the invariant that every factual clause be entailed by the references attached to that statement.

The application runtime uses typed facts, deterministic workspace aggregation, closed templates, and a small deterministic evaluator-language mapping. Presentation can shorten a command to a neutral milestone or label an authoritative pytest summary as a Test run, but cannot add purpose, causality, correctness, or intent. Exact technical evidence remains under `View evidence` and in Technical Chronology. No `NVIDIA_API_KEY`, `OPENROUTER_KEY`, external request, prompt, or model response is required for a reconstruction to become `AVAILABLE`. Earlier provider artifacts remain immutable versioned audit records; the evaluator API does not return their prose as current Candidate Work.

Optional AI paraphrasing is not implemented. If evaluated later, it may operate only on one deterministic atomic fact at a time, may not add factual content, and may not replace authoritative deterministic Candidate Work unless meaning preservation is mechanically enforced.

## Experimental provider code

The NVIDIA NIM and OpenRouter adapters remain explicit opt-in experiment tooling and are excluded from runtime wiring. They preserve the completed model-compliance experiment and may support future research. Their prompts, schema validation, provider-specific settings, and server-only keys do not define the production Candidate Work path.

When those tools are deliberately run, candidate-controlled commands, output, code, filenames, and patches are untrusted data. Provider output is also untrusted and must pass structural, reference, chronology, gap, and coverage validation. Keys remain server-only and ignored by Git; safe error handling must not log raw provider bodies or secrets. Experiment use remains restricted to synthetic data until a separate privacy/provider review approves otherwise.

## Prohibited uses

AI and deterministic reconstruction may not:

- rank or score candidates;
- judge competence, personality, intent, trust, or understanding;
- automatically pass, reject, or recommend a hiring decision;
- convert command or test outcomes into an evaluator verdict;
- claim manually entered code was copied from AI; or
- produce unsupported reconstruction statements.

The human evaluator owns every judgment.
