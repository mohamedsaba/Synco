# System overview

The intended prototype is a modular monolith with an explicit security boundary around candidate execution.

```text
Browser
│
├── Candidate workspace
│   ├── task brief
│   ├── editor
│   ├── terminal
│   ├── AI chat
│   └── event instrumentation
│
├── Evaluator reconstruction
│
└── API
    │
    ├── sessions
    ├── scenarios
    ├── events
    ├── AI
    └── reconstruction
         │
         ├── database
         └── sandbox manager
                  │
                  └── isolated candidate environment
```

The web application may contain these modules without turning them into independent services. The API owns authorization and lifecycle rules; the browser cannot authoritatively assign event order or sandbox state. Ordinary HTTP is preferred, with WebSockets only for interactions that genuinely need streaming, such as terminal I/O or AI output.

## Implemented Slice 1 boundary

Slice 1 uses a file-backed SQLite database because one local transactional store satisfies reload/restart persistence and shared candidate/evaluator authority without a separately operated database. It is an implementation choice for the prototype slice, not a permanent production database decision.

Sessions snapshot the fixed fixture version, brief, acceptance criteria, permitted path, and original content. The only lifecycle states are `CREATED`, `ACTIVE`, and `SUBMITTED`. A random candidate token is stored only as a hash and resolves exactly one session. Evaluator pages and evidence APIs require a separate HTTP-only credential cookie derived from `DELIMIT_EVALUATOR_KEY`.

Candidate edits are normalized from CRLF or bare CR to LF before persistence. Submission atomically freezes the current working content. The evaluator's unified diff is generated server-side from immutable original and submitted content; no client-produced diff is accepted as evidence.

## Delivery state

Completed vertical slices:

- **Slice 1 — Final-state evidence:** session lifecycle, browser editing, immutable submission, evaluator access, and deterministic final diff.
- **Slice 2 — Command evidence:** readiness-gated sandbox execution and authoritative command lifecycle events.
- **Slice 3 — Realistic Scenario 001:** a multi-file Flask, PostgreSQL, Redis, and pytest incident environment.
- **Slice 4 — Deterministic workspace/evidence reconstruction:** trusted workspace tree transitions, explicit evidence gaps, out-of-band drift reconciliation, and one chronological evaluator history.
- **Slice 5 — AI-assisted evidence reconstruction (awaiting live acceptance):** bounded NVIDIA NIM structured output, strict server validation, immutable reconstruction persistence, evaluator-only ensure/retry API, and a primary Candidate Work view with inline evidence drill-down.

Not yet implemented:

- candidate AI and explicit insertion evidence;
- a full interactive PTY;
- other later MVP capabilities that have not earned a focused vertical slice.

Future work must continue vertically and must not pre-build later infrastructure. No production-scale orchestration, distributed event bus, analytics warehouse, or service split is justified at this stage.
