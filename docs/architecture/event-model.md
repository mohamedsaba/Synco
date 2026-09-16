# Event model

Events are the primary record of observable session activity. Reconstruction and generated annotations are derived views. Events should be append-only after acceptance; corrections require explicit follow-up records rather than silent mutation.

Evaluator Candidate Work reconstruction is stored separately as a versioned derived artifact with generator/version and source-packet provenance. Records are unique by session and prompt/generator version, so current deterministic v3 presentation can coexist with immutable earlier experiment and deterministic versions. It is not appended to the candidate event stream and does not alter session state, event ordering, or authoritative evidence. The authoritative runtime artifact is constructed deterministically from typed facts; presentation labels do not become raw events. Provider/model fields remain compatible provenance columns for earlier and experimental artifacts. Evaluator APIs expose legacy provenance metadata without returning legacy prose as current Candidate Work.

## Initial taxonomy

```text
SESSION_STARTED

FILE_OPENED
FILE_CHANGED

COMMAND_STARTED
COMMAND_FINISHED

TEST_RUN

AI_PROMPT_SENT
AI_RESPONSE_RECEIVED
AI_CONTENT_INSERTED

SESSION_SUBMITTED
SESSION_EXPIRED

WORKSPACE_CHANGED
WORKSPACE_CAPTURE_FAILED
SANDBOX_CLEANUP_FAILED
```

The taxonomy should grow only when a current scenario needs a distinct observable fact. Event names describe observations, not interpretations.

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
