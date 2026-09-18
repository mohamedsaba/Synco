# Current project state

## Product boundary

Delimit is Synco's engineering-evaluation prototype. A candidate works in a controlled environment, Delimit records observable events, and a human evaluator reviews a chronological account with expandable source evidence. Evidence precedes judgment: the product does not score, rank, infer competence or intent, or make hiring decisions.

The application remains a Next.js/React/TypeScript modular monolith with SQLite persistence and a Docker boundary around candidate execution.

## Slice 5.1 completion state

Slice 5.1 — Evaluator Experience Reconciliation is complete on the working tree. It preserves the Slice 5 evidence and reconstruction engine and adds the following post-reconstruction architecture:

```text
authoritative evidence
  ├─→ chronology / evidence catalog → typed facts → grounded reconstruction ─┐
  └─→ immutable scenario evaluation context → related-evidence index ────────┤
                                                                              ↓
                                                               presentation model
                                                                              ↓
                                                                    evaluator UI
```

Scenario evaluation context is context, not evidence. New sessions snapshot a separately typed and versioned context. Deterministic typed-fact selectors can relate evidence to neutral scenario areas, but the context cannot alter chronology, catalog construction, coverage, reconstruction wording, grounding, or candidate outcome facts. Legacy sessions without context remain readable and explicitly show that context is unavailable.

The evaluator presentation model is the only join. It provides factual session context, relative chronology, neutral verification progression, capture notices, direct supporting-evidence references, submitted state, and safe lifecycle copy. React components render this model rather than deriving facts locally.

## Evaluator experience

The default review now follows this hierarchy:

1. factual assessment, scenario, status, duration, submission, and session context;
2. **What this scenario examines**, including neutral related-evidence areas and static review policy;
3. incomplete-capture notices where present;
4. **What happened**, with grounded milestones and one-click human-readable supporting activity;
5. **Submitted changes**, promoted before the technical record and rendered with accessible Git-style diff semantics;
6. complete technical chronology and separate **Inspect raw records** audit disclosure.

Telemetry counters, provider identity, attempt state, event IDs, tree hashes, raw enums, and JSON are absent from the default review. Verification results are factual and visually neutral. Reversions and incomplete capture use non-inferential language. Summary preparation and failure never block deterministic evidence; failed summaries expose safe copy and a retry action.

Native disclosures, semantic headings and controls, visible focus, live status/alert regions, text-plus-color diff semantics, reduced-motion behavior, scrollable code regions, and narrow-width layouts establish the Slice 5.1 WCAG 2.2 AA interaction contract.

The final post-implementation acceptance patch adds explicit rotating disclosure chevrons with restrained hover feedback, while retaining native `details`/`summary` keyboard behavior and reduced-motion handling. Evaluator copy now presents persisted `verificationTargets` as **Relevant verification areas** with an explicit non-checklist clarification. Truncated supporting diffs link directly to the stable `#submitted-changes` section anchor. No reconstruction, evidence mapping, page order, or workflow-sharing behavior changed.

Scenario-linked process evidence is an experimental decision-support mechanism whose incremental validity has not yet been established.

## Persistence and compatibility

- `assessment_sessions.scenario_evaluation_context` is a nullable JSON column added through the existing SQLite compatibility migration pattern.
- New sessions persist the exact scenario evaluation snapshot; old rows remain `NULL` and are not backfilled from mutable current metadata.
- Reconstruction content schema v1, canonical evidence references, coverage rules, lifecycle, compare-and-set recovery, and immutable version records are unchanged.
- SQLite retains the `prompt_version` column. Consumer-facing current and legacy reconstruction views expose the value as `generatorVersion`.
- Existing candidate and evaluator authorization behavior is unchanged.
- The former Candidate Work presentation helper and its badge-driven UI mapping were removed; generator wording remains in the reconstruction renderer and evaluator-only translation lives in the presentation model.

## Verification evidence

The final `npm run verify` gate passed on 16 September 2026 with Docker access:

- Prettier: passed.
- ESLint: passed with no warnings.
- Next route type generation and TypeScript no-emit: passed.
- Vitest: 24 files and 99 tests passed; four credential-gated live experiment files were skipped as designed.
- Production Next.js build: passed, including the dynamic evaluator session route.

Focused Slice 5.1 coverage includes immutable scenario snapshots, scenario/reconstruction isolation, deterministic relation mapping, empty areas, review DTO behavior, generator-version compatibility, failure-with-evidence behavior, direct traceability, disclosure nesting, summary states, semantic diff rendering, focus/reduced-motion/responsive CSS contracts, and existing evaluator authorization/lifecycle coverage.

## Evaluator Experience v2 Completion State

Evaluator Experience v2 — Production Visual Experience is complete on the working tree. It implements the refined, accessible production presentation layer on top of the Evaluator Briefing Foundation:

```text
authoritative evidence
  ├─→ chronology / evidence catalog → typed facts → grounded reconstruction
  ├─→ immutable scenario evaluation context → semantic briefing
  └─→ pure role projection (4 profiles)
                               ↓
                   Evaluator Experience v2 UI
```

Key completed capabilities:

1. **Four Audience Depth Profiles**:
   - `GENERALIST_RECRUITER`: Fast executive summary, plain-English activity grouping, neutral verification facts, zero cryptographic hashes or raw event IDs.
   - `TECHNICAL_RECRUITER`: Technical footprint, recorded tooling, chronological progression, and direct evidence links.
   - `ENGINEER`: Full technical workspace, authoritative diff viewer, command lines, execution logs, and cryptographic SHA-256 provenance.
   - `ENGINEERING_MANAGER`: High-level synthesis, concise submission scope, platform limitation notices, and evaluation policy guidance.
2. **Accessible Role Lens Switcher**:
   - Server-rendered role-depth navigation, semantic HTML (`<nav aria-label="Evaluator perspective">` with Next.js `<Link>`), `aria-current="page"`, live description updates, and query-param preservation (`?depth=...`).
3. **Editorial Visual Design**:
   - Bright, calm, tactile, restrained aesthetic in `apps/web/app/workspace.css`. No dark hacker terminals, glowing AI effects, or generic analytics dashboards.
4. **Epistemic Invariants Strictly Preserved**:
   - Factual verification progression without scorecards or verdict badges (Case C: 0 passed, 3 failed -> edit -> 0 passed, 3 failed).
   - Authoritative diff viewer with line modification statistics and anchor navigation (`#submitted-changes`).
   - Platform notices for telemetry gaps (`Activity capture incomplete`) without blaming the candidate (Case F).
   - Graceful fallback for legacy sessions lacking evaluation context (Case G).
   - Non-operational handoff affordance: `[ Request engineering review ]`.

## Verification evidence

## Slice 6B completion state

Slice 6B — Candidate AI Evidence Foundation is complete on the working tree. It implements the transactional persistence model and immutable event evidence pipeline for candidate AI interactions:

```text
candidate AI request
       │
       ▼
AiInteractionService.admitInteraction()
       │
       ▼ (atomic SQLite transaction via SqliteTransactionRunner)
┌──────────────────────────────────────┬──────────────────────────────────────┐
│  ai_interactions table               │  assessment_events table             │
│  - status: 'ADMITTED'                │  - type: 'AI_REQUEST_STARTED'        │
│  - UNIQUE(session_id, client_req_id) │  - monotonically increasing sequence │
└──────────────────────────────────────┴──────────────────────────────────────┘
       │
       ▼ (dispatch transition)
status: 'DISPATCH_STARTED'
       │
       ├───────────────────────────────┬───────────────────────────────┐
       ▼                               ▼                               ▼
recordCompletion()              recordCancellation()            recordFailure()
       │                               │                               │
       ▼ (atomic transaction)          ▼ (atomic transaction)          ▼ (atomic transaction)
┌─────────────────────────────┐ ┌─────────────────────────────┐ ┌─────────────────────────────┐
│ ai_interactions: COMPLETED  │ │ ai_interactions: CANCELLED  │ │ ai_interactions: FAILED     │
│ events:                     │ │ events:                     │ │ events:                     │
│  AI_RESPONSE_COMPLETED      │ │  AI_REQUEST_CANCELLED       │ │  AI_REQUEST_FAILED          │
└─────────────────────────────┘ └─────────────────────────────┘ └─────────────────────────────┘
```

Key completed capabilities:

1. **`SqliteTransactionRunner`**:
   - Manages SQLite connection lifecycle, WAL journal mode, 5000ms busy timeout, and atomic multi-store transactions via `database.transaction.immediate()`.
2. **Operational `ai_interactions` Store**:
   - Schema enforcing `UNIQUE(session_id, client_request_id)`, indexes on `session_id` and `(session_id, client_request_id)`, storing full prompts, context attachments, response texts, token usage, durations, and error metadata.
   - Strict state machine: `ADMITTED → DISPATCH_STARTED → COMPLETED | CANCELLED | FAILED`.
3. **Immutable Event Evidence**:
   - Append-only event store integration via `appendWithDatabase`, assigning monotonic server sequences within the session for `AI_REQUEST_STARTED`, `AI_RESPONSE_COMPLETED`, `AI_REQUEST_CANCELLED`, and `AI_REQUEST_FAILED`.
4. **Immutable Per-Session AI Capability Snapshot**:
   - Persisted in `assessment_sessions.ai_capability_snapshot` at session creation time, ensuring capability configuration is frozen for the duration of the evaluation.
5. **Atomic Operations in `AiInteractionService`**:
   - Admission atomically writes `ai_interactions` and `AI_REQUEST_STARTED`.
   - Completion, cancellation, and failure atomically update interaction status and append their corresponding terminal events.
   - Comprehensive validation: active session enforcement, capability checks, prompt/excerpt length caps, and idempotency guarantees.

## Verification evidence

The `npm run verify` pipeline passed on 18 September 2026:

- Prettier (`format:check`): passed.
- ESLint (`lint`): passed with 0 errors and 0 warnings.
- TypeScript (`typecheck`): passed with 0 errors.
- Vitest (`test`): 32 test files and 226 tests passed; 5 live LLM integration test files skipped as designed.
- Next.js production build (`build`): passed, optimizing all static routes and dynamic session routes.

## Accepted limitations and next work

- Evaluator briefings are decision-support artifacts; the human evaluator owns the evaluation verdict.
- Slice 6B implements the persistence, transaction, and event foundation only.
- Live provider dispatch (Anthropic, OpenAI, NVIDIA NIM), candidate editor sidecar UI, streaming/SSE, patch application, and reconstruction integration remain deferred to Slice 6C.
