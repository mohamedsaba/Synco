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

Candidate AI is implemented and integrated as permitted tooling. Its requests and outcomes are observable evidence, not a judgment of candidate quality. The active workspace is server-authoritative; local UI state is limited to presentation concerns such as editor buffers, selection, command/AI history, focus, and timing display. In a multi-file workspace, the scenario path is selected only if it is an existing file; otherwise selection is deterministic among existing files, with no fabricated path for an empty workspace.

## Evaluator reconstruction

Evaluator review is a distinct, read-only surface. Submitted evidence is authorized by the evaluator HTTP-only cookie, then flows through chronological reconstruction, the evidence catalog and typed facts, `buildEvaluatorBriefing`, deterministic grounding, `projectBriefing`, and the evaluator page/UI. The queue exposes submitted review entries, and direct review exposes submitted evidence within that same current evaluator scope; the prototype has no tenant, organization, assignment, evaluator identity, or granular-RBAC model.

The four presentation depths are `GENERALIST_RECRUITER`, `TECHNICAL_RECRUITER`, `ENGINEER`, and `ENGINEERING_MANAGER`. `?depth=` selects a valid role and legacy `?role=` remains accepted; missing or invalid input resolves to the generalist profile. Roles change only presentation and never authorization, evidence truth, or backend evidence access.

Evidence is distinct from interpretation. The system renders factual chronology, provenance, capture limitations, and recorded outcomes; it does not infer intent, competence, quality, score, rank, pass/fail, recommendation, or hiring verdict. Human evaluators decide what evidence means.

## Delivery state

The accepted implementation baseline is `0d876863cff64c8006ef0b872496f7945c5d7b69` (`fix(candidate): remove scenario-specific fallback`). It includes T1A/T1B timing and finality, Candidate Experience C1–C10, Evaluator Experience E1–E6, and consolidation G1–G4A.

- G1 normalized shared design tokens without visual behavior change.
- G2 removed dead legacy evaluator code and CSS.
- G3/G3A reconciled live evaluator cascade/specificity debt while preserving accepted E6 behavior.
- G4A removed the Scenario 001-specific candidate fallback and stale homepage slice copy.

These are corrections and consolidation, not a shared-UI or service architecture redesign. Candidate and evaluator views should remain separate; safe sharing is limited to global tokens, generic primitives, accessibility/reduced-motion behavior, and truly generic test fixtures.

The next activity after documentation convergence is an independent repository-wide adversarial architecture, security, and code-quality review—not another candidate or evaluator feature slice.
