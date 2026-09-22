# Evaluator experience

Slice 5.1 presents an evidence-first review rather than an analytics dashboard.

## Review entry and discovery

`/evaluator` is the evaluator entry point. The existing single global
`DELIMIT_EVALUATOR_KEY` produces the HTTP-only `delimit_evaluator` cookie; a
valid cookie is the complete current evaluator authorization scope. There is no
evaluator identity, organization, tenant, or session-specific grant.

After that same server-side authorization check, `GET /api/evaluator/sessions`
returns at most 50 reviewable submitted sessions in `submittedAt DESC, id DESC`
order. A queue item contains only session reference, scenario title, submission
time, assessment duration, and closure reason. It never returns candidate
tokens, raw evidence, diffs, events, AI content, or reconstruction payloads.
The queue includes only final `SUBMITTED` sessions with frozen submitted content,
submission timestamp, and closure reason. Direct authorized links to
`/evaluator/sessions/[sessionId]` remain valid.

The entry UI distinguishes an empty queue from invalid evaluator access and a
discovery service failure. Discovery is navigation only: it adds no assignment,
ranking, reviewer routing, notification, or evaluator verdict.

## Default hierarchy

1. Factual session context: assessment, scenario, submitted status, duration, submission time, and session reference.
2. **What this scenario examines:** immutable scenario context and neutral evidence areas.
3. Platform notices, including incomplete activity capture where present.
4. **What happened:** grounded summary milestones with direct supporting activity.
5. **Submitted changes:** the authoritative final diff against the scenario baseline.
6. **Technical record:** complete chronology and separate raw-record inspection.

Telemetry counters, provider metadata, attempt identifiers, tree hashes, raw event IDs, and domain enum names are not default evaluator content. No activity-balance, cadence, AI-use, file-count, or test-count KPI is produced.

## Language rules

- Verification progression is factual and neutral: initial, later, and final recorded verification.
- Failing tests and non-zero commands do not receive candidate-quality styling.
- Reversion is described as “Changes reverted” and as a return to a previously recorded state; purpose is not inferred.
- Incomplete capture is a platform limitation, not candidate misconduct.
- Empty related-evidence areas establish only an empty relation, not global absence; useful activity may remain elsewhere in chronology.
- Truncated terminal streams visibly identify captured previews and omitted output, independently for standard output and standard error.
- Automated verification is not a hiring decision; scenario policy may require engineering review.

## State behavior

While reconstruction is pending, the page says “Preparing the session summary…” and leaves scenario context, linked evidence, and submitted changes available. On failure it says the summary is unavailable, confirms that recorded activity and submitted changes remain available, and offers `Try again`. Provider names, codes, stack traces, and attempt state are never exposed.

## Accessibility and responsive behavior

The evaluator route targets WCAG 2.2 AA. Its structure uses landmarks and ordered headings; controls are native links, buttons, and `details`/`summary` disclosures; live preparation state uses `role=status`; unavailable state uses `role=alert`; focus is visibly tokenized; and native disclosures expose their expanded state and support Enter/Space without custom keyboard code.

Diff meaning is available through text, literal `+`/`-` prefixes, and screen-reader labels, not color alone. Code and diff surfaces scroll horizontally instead of forcing page overflow. Layouts collapse from multi-column to a single reading column at narrow widths. Motion is enabled only when the user has not requested reduced motion.

## Validation status

Scenario-linked process evidence is an experimental decision-support mechanism whose incremental validity has not yet been established.

The mechanism organizes inspectable evidence; it is not a validated competency measure. Product research must separately establish whether it improves evaluator decisions beyond final-state review, and any such claim is outside Slice 5.1.

## Evaluator Briefing Foundation & Visual Experience v2

The [accepted final v2 specification](../product/evaluator-v2-design-specification.md) governs the experience; the [architecture audit](../audits/evaluator-v2-architecture-feasibility.md) governs the briefing foundation and role projections.

The production visual experience implements the complete Evaluator Experience v2 across four audience depth profiles:

- `GENERALIST_RECRUITER`: 10–20s executive summary, plain-English activity grouping, neutral verification progression, and no cryptographic hashes or raw event IDs.
- `TECHNICAL_RECRUITER`: Technical footprint, recorded tooling, chronological progression, and direct evidence disclosures.
- `ENGINEER`: Full technical workspace, authoritative diff viewer, raw command lines, execution logs, and cryptographic SHA-256 provenance.
- `ENGINEERING_MANAGER`: High-level synthesis, concise submission scope, platform limitation notices, and evaluation policy guidance.

### UI Data Flow & Epistemic Boundaries

```
AUTHORITATIVE EVIDENCE -> DETERMINISTIC RECONSTRUCTION -> SEMANTIC BRIEFING -> SERVER-FIRST ROLE PROJECTION -> FINAL UI
```

The route server component projects the requested role (`?depth=...`), passing only the single projected briefing into the UI. The React UI (`apps/web/app/evaluator/sessions/[sessionId]/`) contains zero secondary interpretation engine. All textual summaries, counts, and disclosures are pre-computed in the typed briefing model (`EvaluatorBriefing` and `projectBriefing`). No raw diff or command parsing exists in UI components.

Key architectural components:

1. `EvaluatorHeader`: Delimit branding, session reference, scenario title, submitted status badge, deterministic elapsed duration, and `RoleLensSwitcher`.
2. `RoleLensSwitcher`: Accessible server-rendered role-depth navigation (`<nav aria-label="Evaluator perspective">`) with native links and query-param preservation (`?depth=...`).
3. `PlatformNotice`: Non-alarmist callouts for platform-owned limitations (such as `workspace_capture_gap`).
4. `TaskBrief`: Immutable scenario brief, system invariants, and verification targets, with graceful fallback for legacy sessions lacking evaluation context.
5. `VerificationSummary`: Factual progression of recorded test runs without scorecards or verdict badges.
6. `RecordedActivity`: Factual activity timeline with inline evidence disclosures.
7. `SubmittedWork`: Authoritative diff viewer with line modification statistics and anchor navigation.
8. `ReviewGuidance`: Evaluation policy constraints that retain human evaluator
   ownership without offering a non-functional routing action.
9. `ArtifactAvailabilityCard`: Clean integrity indicators for recruiters and EM; cryptographic SHA-256 and generator versions for engineers.

Scenario semantics enrich presentation only. They do not change evidence truth.
Evaluator briefings are decision-support artifacts, not candidate-quality judgments.
