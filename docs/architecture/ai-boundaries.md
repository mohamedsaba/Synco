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

### Scope Boundaries and Deferred Features

Slice 6B implements the operational and event persistence foundation only. The following remain intentionally unimplemented:

- **Live Provider Integration**: Network dispatch to external LLM providers (Anthropic, OpenAI, NVIDIA NIM) is deferred to Slice 6C.
- **Candidate AI UI**: Editor sidecar, chat panels, and context selection affordances are deferred.
- **Streaming / SSE**: Server-sent events and incremental token delivery are deferred.
- **Evaluator Reconstruction Integration**: Candidate Work reconstruction and evaluator briefing projections are unchanged in Slice 6B; raw AI events are not yet synthesized into reconstruction milestones.
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
