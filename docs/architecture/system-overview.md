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

## Delivery strategy

Build vertically: final-diff flow, terminal and events, candidate AI and explicit insertion, reconstruction, then the real cache-staleness scenario. Each slice must be demoable and must not pre-build later infrastructure.

No production-scale orchestration, distributed event bus, analytics warehouse, or service split is justified at this stage.
