# System overview

Delimit is a Next.js modular monolith with SQLite persistence and a Docker isolation boundary for candidate execution.

```text
Browser
├── Candidate workspace: server truth + calibrated time + ephemeral UI state
├── Evaluator: read-only evidence reconstruction and presentation
└── HTTP API
    ├── sessions, scenarios, timing, finalization, commands, and AI
    ├── append-only events and reconstruction
    ├── SQLite
    └── Docker candidate environment
```

The API owns lifecycle, authorization, event order, timing, and sandbox state. Browser state is never authoritative for those concerns. The application may retain these modules without becoming separate services.

## Candidate lifecycle and workspace

The only durable lifecycle is `CREATED → ACTIVE → SUBMITTED`. Candidate UX phases are projections, not additional lifecycle states. Server-calibrated timing and persisted `closureReason` protect finality: null on `ACTIVE` is mutable, a non-null value admits irreversible finalization and closes mutations, commands, and new AI admission, and submitted sessions are terminal. Recovery preserves admitted finality; existing AI request replay remains idempotent where supported.

Candidate AI is implemented and integrated as permitted tooling. Its requests and outcomes are observable evidence, not a judgment of candidate quality. The active workspace is server-authoritative; its File API enforces workspace-relative containment inside the sandbox, rejecting traversal and escaping symlinks while preserving contained regular files and internal symlink reads. Local UI state is limited to presentation concerns such as editor buffers, selection, command/AI history, focus, and timing display. In a multi-file workspace, the scenario path is selected only if it is an existing file; otherwise selection is deterministic among existing files, with no fabricated path for an empty workspace.

Public issuance resolves only explicitly registered scenarios. Scenario 001 is the only public entry; unsupported IDs are rejected before session persistence or sandbox provisioning. Its enabled AI capability travels from the server-side registry into an immutable session snapshot, which candidate AI admission reads. Browser input cannot change the capability. The prototype currently registers `MockAiProvider`; capability policy and provider runtime are separate concerns.

## Evaluator reconstruction

Evaluator review is a distinct, read-only surface. Submitted evidence is authorized by the evaluator HTTP-only cookie, then flows through chronological reconstruction, the evidence catalog and typed facts, `buildEvaluatorBriefing`, deterministic grounding, `projectBriefing`, and the evaluator page/UI. The queue exposes submitted review entries, and direct review exposes submitted evidence within that same current evaluator scope; the prototype has no tenant, organization, assignment, evaluator identity, or granular-RBAC model.

The four presentation depths are `GENERALIST_RECRUITER`, `TECHNICAL_RECRUITER`, `ENGINEER`, and `ENGINEERING_MANAGER`. `?depth=` selects a valid role and legacy `?role=` remains accepted; missing or invalid input resolves to the generalist profile. Roles change only presentation and never authorization, evidence truth, or backend evidence access.

Evidence is distinct from interpretation. The system renders factual chronology, provenance, capture limitations, and recorded outcomes; it does not infer intent, competence, quality, score, rank, pass/fail, recommendation, or hiring verdict. Human evaluators decide what evidence means.

## Delivery state

The accepted engineering baseline is `4a7c9cdbc342130eeb7c29f3374a96fdbbaf4739` (`fix(ai): wire authoritative session capability`). It includes T1A/T1B timing and finality, Candidate Experience C1–C10, Evaluator Experience E1–E6, consolidation G1–G4A, R1 workspace containment, R2 explicit public scenario issuance, and R3 authoritative AI capability configuration.

- G1 normalized shared design tokens without visual behavior change.
- G2 removed dead legacy evaluator code and CSS.
- G3/G3A reconciled live evaluator cascade/specificity debt while preserving accepted E6 behavior.
- G4A removed the Scenario 001-specific candidate fallback and stale homepage slice copy.

These are corrections and consolidation, not a shared-UI or service architecture redesign. Candidate and evaluator views should remain separate; safe sharing is limited to global tokens, generic primitives, accessibility/reduced-motion behavior, and truly generic test fixtures.

The baseline is frozen for Hirearchy Brand & Product Design Foundation, followed by Hirearchy Software visual/UI redesign—not another candidate or evaluator feature slice or an architecture refactor.
