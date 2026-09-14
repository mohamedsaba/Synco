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

The web application may contain these modules without turning them into independent services. The API owns authorization and lifecycle rules; the browser cannot authoritatively assign event order or sandbox state. PostgreSQL is the likely system of record when persistence is introduced. Ordinary HTTP is preferred, with WebSockets only for interactions that genuinely need streaming, such as terminal I/O or AI output.

## Delivery strategy

Build vertically: final-diff flow, terminal and events, candidate AI and explicit insertion, reconstruction, then the real cache-staleness scenario. Each slice must be demoable and must not pre-build later infrastructure.

No production-scale orchestration, distributed event bus, analytics warehouse, or service split is justified at this stage.
