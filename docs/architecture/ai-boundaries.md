# AI boundaries

AI use is neutral and derived output is never authoritative evidence.

## Candidate AI

AI acts as an ordinary engineering tool available to the candidate during assessment. Hirearchy Software records observable prompts, responses, supplied context, timestamps, and explicit terminal states. It must not infer that manually typed code came from AI, treat the amount of AI use as competence, or penalize candidates for AI utilization.

### Operational State vs. Append-Only Event Evidence (Slice 6B)

Hirearchy Software strictly separates mutable operational lifecycle state from application-level append-only event evidence:

1. **Operational Interaction Store (`ai_interactions`)**:
   - Manages mutable execution state (`ADMITTED → DISPATCH_STARTED → COMPLETED | CANCELLED | FAILED`).
   - Guarantees durable session-scoped idempotent admission via `UNIQUE(session_id, client_request_id)`.
   - Stores full prompt text, context attachments, response text, token usage, duration, and error metadata.
   - Updates are executed atomically alongside event publication via `SqliteTransactionRunner`.

2. **Append-Only Event Store (`assessment_events`)**:
   - Records append-only milestone events (`AI_REQUEST_STARTED`, `AI_RESPONSE_COMPLETED`, `AI_REQUEST_CANCELLED`, `AI_REQUEST_FAILED`) through the application repository API.
   - Every event receives a strictly monotonic server-assigned `sequence` number.
   - Events are replayable in sequence order. The repository API provides no mutation or purge operation; direct SQLite modification is outside this guarantee.
   - Event payloads contain bounded excerpts and metadata; full operational payloads reside in `ai_interactions`.

### Immutable Per-Session Capability Snapshot

Each assessment session captures an `AiCapabilitySnapshot` at session creation time:

- Current implemented fields: `enabled`, `contractVersion`, `configuredProviderId`, `configuredModelId`, `configurationVersion`.
- Persisted immutably in `assessment_sessions.ai_capability_snapshot`.
- Subsequent changes to global or scenario AI configuration do not alter the rules or capabilities assigned to an existing session.
- Deferred capabilities: `streamingSupported`, `toolsSupported`, and per-assessment token budgeting (`maxTokens`) are explicitly deferred and not part of the active capability snapshot.
- Prompt length policy: The prompt length limit (`MAXIMUM_PROMPT_LENGTH = 32_768`) is a domain validation invariant and shared client contract, rather than a per-session configurable capability field.

### Provider Execution Lifecycle (Slice 6C)

Slice 6C implements the synchronous candidate AI provider execution lifecycle:

1. **Provider Abstraction (`AiProvider`)**:
   - Smallest interface required for normalized text completion: `execute(request: NormalizedAiRequest, options?: { signal?: AbortSignal }): Promise<NormalizedAiResult>`.
   - Distinct authorship boundaries preserved: candidate-authored input, candidate-selected context, and Hirearchy Software-supplied context remain separated without concatenation.
   - Deterministic in-process `MockAiProvider` for testing and local execution without external network dependencies.
   - Provider registry resolves provider solely from immutable `session.aiCapabilitySnapshot.configuredProviderId`. Candidate input cannot select or override provider, model, or parameters.

2. **Synchronous Candidate API Endpoint**:
   - `POST /api/candidate/sessions/[token]/ai/interactions`.
   - Candidate provides `clientRequestId`, prompt, and context attachments.
   - Context attachments are validated against path traversal (`..`), absolute paths, and invalid ranges.
   - Returns a normalized execution response with status, response text, model, terminal reason, and error message.

3. **Dispatch Ambiguity & Idempotency**:
   - `DISPATCH_STARTED` is persisted atomically BEFORE calling the provider.
   - `DISPATCH_STARTED` means only that Hirearchy Software initiated outbound dispatch; it does not prove the provider received or processed the request.
   - For duplicate requests where current status is `DISPATCH_STARTED`, Hirearchy Software does not automatically call the provider again, returning an explicit ambiguous non-replayable state.
   - Terminal states (`COMPLETED`, `FAILED`, `CANCELLED`) return existing results without re-invoking the provider.

4. **Failure & Timeout Semantics**:
   - Timeout aborts provider execution via `AbortController` and records `FAILED` with `TIMEOUT` terminal reason (never `CANCELLED`).
   - Provider errors transition to `FAILED` with `PROVIDER_ERROR` and append `AI_REQUEST_FAILED`.
   - If terminal persistence fails after provider returns, Hirearchy Software throws a platform persistence error and never reports false success to the client.

### Same-Session Coordination & Submission Evidence Closure (Architecture Corrections A1/A2)

1. **Same-Session Operation Serialization**:
   - Mutating session operations (`activate`, `save`, `saveWorkspaceFile`, `executeCommand`, `submit`) are serialized per assessment session by `SessionOperationCoordinator` using an in-memory FIFO queue across request boundaries.
   - Singleton coordination is anchored across independent `SessionService` instances via process-wide storage (`Symbol.for('hirearchy.sessionOperationCoordinator')`).
   - Topology boundary: In-memory coordination is valid and supported only for the single-process monolith deployment topology. Multi-process clustering requires external distributed coordination before deployment.
   - Concurrency invariant: External AI provider requests are NEVER executed under the `SessionOperationCoordinator` lock, ensuring slow providers cannot starve workspace operations or assessment submission.

2. **Submission Evidence Closure**:
   - When a candidate submits an assessment, `SessionService.submit` acquires the session lock, inspects workspace drift, and enters an atomic multi-store SQLite transaction (`BEGIN IMMEDIATE`).
   - Within this transaction, all open AI interactions (`ADMITTED`, `DISPATCH_STARTED`) are transitioned to `CANCELLED` with `terminalReason: 'session_ended'` and appended with `AI_REQUEST_CANCELLED` events with deterministic ordering (`started_sequence ASC, id ASC`) and local durations.
   - In the same transaction, the session status transitions to `SUBMITTED`.
   - If the final transaction fails, AI closure rolls back atomically while the session remains `ACTIVE` with its previously admitted `closureReason`; open interactions remain uncancelled and teardown is not performed. Recovery retries the same final transaction.

3. **Existing-ID Replay vs. New Admission**:
   - When an AI request arrives, `admitInteraction` immediately queries for an existing record by `(sessionId, clientRequestId)` inside a `BEGIN IMMEDIATE` transaction.
   - If an existing interaction is found, it is returned immediately without re-checking session active status, capability flags, prompt length, or context attachment validity. `executeInteraction` maps this to an idempotent HTTP 200 response without redispatching to the provider.
   - If no existing interaction is found, the session MUST be mutable `ACTIVE + closureReason = null`. New request IDs arriving after finalization admission are rejected with HTTP 409 `SESSION_FINALIZATION_STARTED`; requests after durable submission remain `SESSION_NOT_ACTIVE`. Both produce zero database rows, zero events, and zero provider dispatches.

4. **Late Provider Output Isolation & Evidence Stability**:
   - If an in-flight AI provider call settles (success, error, or timeout) after the interaction has been closed as `CANCELLED / session_ended` by submission, `recordCompletion` and `recordFailure` detect the terminal state and drop the late result.
   - Late provider text is never written to `ai_interactions`, no `AI_RESPONSE_COMPLETED` or `AI_REQUEST_FAILED` event is emitted, and `executeInteraction` returns the normalized `CANCELLED / session_ended` outcome.
   - The submitted candidate-evidence frontier is closed at the submission boundary; subsequent provider resolutions cannot alter candidate evidence, while legitimate platform and operational evidence may still be appended afterward.

### AI Evidence Reconstruction Integration (Slice 6D)

Slice 6D integrates candidate AI events into chronological reconstruction:

- Distinct start and terminal milestones preserve exact order based on server-assigned sequences.
- Canonical evidence references retain provenance to raw event IDs without collapsing interactions.
- Typed facts extract bounded excerpts and mechanical metadata without psychological, evaluative, or reliance fields.
- Deterministic statements use neutral, non-inferential templates. Temporal adjacency between an AI response and subsequent code modifications never implies causality or suggestion application.

### Evaluator AI Evidence Presentation (Slice 6E)

Slice 6E implements the frozen presentation architecture for candidate AI evidence in the Evaluator V2 experience:

- Compact AI Summary card within Observed Activity displaying status, interaction counts, configured model, and burst notices.
- Chronological milestone cards interleaved with workspace and command activity.
- Progressive disclosure: Level 0 Overview -> Level 1 Interaction Details -> Level 2 Technical Details -> Level 3 Technical Record. Prompt and response excerpts remain collapsed by default across all role profiles.
- Presentation-only burst grouping for 3+ consecutive successful interactions, expandable to full chronological order.
- Epistemic invariants strictly preserved: no candidate scores, rankings, or competence inferences.

### Candidate Integrated AI Surface (C6)

Slice 6F implements the candidate-facing integrated AI interaction surface within the active assessment workspace:

1. **Engineering Assistant Surface**:
   - Compact side panel docked in the candidate workspace.
   - Available during ACTIVE assessment without obscuring the editor, file selector, or terminal console.
   - Preserves candidate workspace concurrency: in-flight AI requests do not lock the editor or command console.
   - Factual capability states: handles enabled, disabled, legacy/missing capability, inactive (CREATED), and submitted states without fabricating availability.

2. **Prompt Composer & Context**:
   - Accessible multiline textarea with native submit button and polite screen reader announcements.
   - Each request captures the currently active workspace file as one path reference. The browser never reads or sends persisted file content or unsaved editor content to the AI endpoint.
   - Hirearchy Software metadata contains scenario ID/version and configuration version only. It is separate from candidate input; no evaluator context, provider secret, model selection, or hidden browser history is sent.
   - Candidate-authored prompts only: no templates, suggestions, auto-complete, or prompt scoring.

3. **Client Idempotency & Error Handling**:
   - Each candidate submission receives a stable `clientRequestId`; a local chronological entry captures its prompt and context before dispatch, then only that entry receives its terminal result.
   - Server remains authoritative for duplicate handling and provider dispatch.
   - Truthful terminal mapping: completed responses, provider errors, timeouts, and ambiguous dispatches (HTTP 409) are presented factually.
   - Browser UI allows one in-flight request. Strictly no automatic retries: explicit retry preserves the prompt but generates a fresh `clientRequestId`.

4. **Local Conversation Boundary**:
   - Conversation and draft are local UI state, kept across C3 panel navigation but not a browser refresh. Server-persisted interaction/evidence records remain distinct from the candidate's rendered history.
   - Responses render as escaped React text. The conversation is not a live region; only current pending status and errors announce.

5. **Epistemic Invariants & Zero Causal Claims**:
   - Strictly forbidden terms and concepts: "applied", "copied", "AI-authored", "generated change", "accepted suggestion".
   - AI response is presented purely as readable technical text; manual code editing remains manual workspace activity.

### Scope Boundaries and Deferred Features

The following remain intentionally unimplemented:

- **Commercial Network Providers**: Real network adapters (Anthropic, OpenAI) are deferred; mock provider remains authoritative.
- **Streaming / SSE**: Server-sent events, token streaming, and chunk persistence are deferred.
- **Apply Workflow / Patch Auto-Application**: Direct patch application, diff merging, and automated code mutation remain deferred.
- **Multi-Turn Memory**: Conversational memory subsystems and automatic multi-turn context accumulation are deferred.
- **Autonomous Agents & Tooling**: Subagents, autonomous tool invocation, and recursive agent loops are deferred.
- **Voice & Multimodal**: Voice input, audio transcription, and image generation are deferred.
- **Candidate Provider/Model Selection**: Candidate model pickers, provider selectors, API key inputs, and hyperparameter controls are strictly prohibited.
- **AI Scoring & Competence Metrics**: Scoring, quality grading, prompt evaluation, reliance measurement, and authorship inference are strictly prohibited and deferred.

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
