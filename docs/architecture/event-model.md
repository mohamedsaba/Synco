# Event model

Events are the primary record of observable session activity. Reconstruction and generated annotations are derived views. Events should be append-only after acceptance; corrections require explicit follow-up records rather than silent mutation.

Evaluator Candidate Work reconstruction is stored separately as a versioned derived artifact with generator/version and source-packet provenance. Records are unique by session and prompt/generator version, so current deterministic v3 presentation can coexist with immutable earlier experiment and deterministic versions. It is not appended to the candidate event stream and does not alter session state, event ordering, or authoritative evidence. The authoritative runtime artifact is constructed deterministically from typed facts; presentation labels do not become raw events. Provider/model fields remain compatible provenance columns for earlier and experimental artifacts. Evaluator APIs expose legacy provenance metadata without returning legacy prose as current Candidate Work.

## Taxonomy

```text
SESSION_STARTED

FILE_OPENED
FILE_CHANGED

COMMAND_STARTED
COMMAND_FINISHED

TEST_RUN

AI_REQUEST_STARTED
AI_RESPONSE_COMPLETED
AI_REQUEST_CANCELLED
AI_REQUEST_FAILED

SESSION_SUBMITTED
SESSION_EXPIRED

WORKSPACE_CHANGED
WORKSPACE_CAPTURE_FAILED
SANDBOX_CLEANUP_FAILED
```

The taxonomy grows only when a current scenario or slice needs a distinct observable fact. Event names describe observations, not interpretations.

## AI Event Types and Payloads (Slice 6B)

Candidate AI interactions emit immutable events capturing the boundaries and outcomes of candidate assistance requests:

1. **`AI_REQUEST_STARTED`**: Emitted atomically upon admission of a candidate AI request.
   - `interactionId`: Server-assigned unique identifier (`uuid`).
   - `clientRequestId`: Candidate-client idempotent request token.
   - `provider`: Provider name (`string`, e.g. `'mock-provider'`, `'anthropic'`, `'openai'`).
   - `model`: Model identifier (`string`, e.g. `'mock-model'`, `'claude-3-7-sonnet'`).
   - `prompt`: Candidate prompt string (bounded to 32,768 characters).
   - `candidateContext`: Attached candidate context items (open files, selection snippets, excerpts bounded to 500 chars).
   - `delimitContext`: Delimit system metadata (session id, scenario id, active file path).
   - `requestedAt`: ISO-8601 UTC timestamp of request submission.

2. **`AI_RESPONSE_COMPLETED`**: Emitted when the AI provider successfully delivers a response.
   - `interactionId`: Correlating interaction identifier.
   - `provider`: Serving provider identifier.
   - `model`: Serving model identifier.
   - `promptTokens`: Optional token count consumed by prompt.
   - `completionTokens`: Optional token count consumed by completion.
   - `durationMs`: Total duration from dispatch to completion in milliseconds.
   - `hasResponseText`: Boolean indicating if response text was returned.
   - `responseExcerpt`: Truncated response excerpt for quick review (up to 500 characters). Full response is preserved in `ai_interactions`.
   - `completedAt`: ISO-8601 UTC timestamp of completion.

3. **`AI_REQUEST_CANCELLED`**: Emitted when a candidate cancels an in-flight request.
   - `interactionId`: Correlating interaction identifier.
   - `reason`: Cancellation cause (`'user_cancelled' | 'session_closed' | 'timeout'`).
   - `cancelledAt`: ISO-8601 UTC timestamp of cancellation.

4. **`AI_REQUEST_FAILED`**: Emitted when request execution encounters an error.
   - `interactionId`: Correlating interaction identifier.
   - `errorCode`: Standardized error code (`'rate_limit' | 'provider_error' | 'context_length_exceeded' | 'network_error' | 'internal_error'`).
   - `errorMessage`: Safe, redacted error description.
   - `failedAt`: ISO-8601 UTC timestamp of failure.

## Event envelope

Every event minimally contains:

```text
id
sessionId
sequence
type
timestamp
source
payload
```

- `id` is a stable unique identifier used by evidence references.
- `sessionId` identifies the owning session.
- `sequence` is a server-assigned, strictly increasing integer within the session.
- `type` is a known event type.
- `timestamp` records accepted event time in UTC; it does not replace sequence ordering.
- `source` identifies the observable producer, such as workspace, terminal, AI, or session service.
- `payload` is a versioned, type-specific object containing the minimum evidence needed to interpret the event.

## Ordering and integrity

Sequence is the deterministic source of chronology. Client clocks and arrival timestamps may be retained as payload metadata but cannot decide order. Event acceptance should be idempotent where producers can retry. Large command output may eventually use referenced immutable storage, but the event must preserve its identity and integrity.

Sensitive values and secrets must be excluded or redacted at capture boundaries. Redaction itself must not create evaluative claims.

`SANDBOX_CLEANUP_FAILED` is a platform event emitted only after final evidence has been durably submitted. It reports failed infrastructure cleanup and does not reopen candidate mutation or weaken the immutable submission boundary.
