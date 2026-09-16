# 005 — Deterministic Evidence Reconstruction for Non-Technical Evaluators

## Status

Complete and accepted on 2026-09-15. Deterministic v3 is the authoritative Candidate Work presentation contract. The runtime uses typed facts, deterministic selection and aggregation, and closed presentation mappings; no AI provider or key is required. The evaluator-only API, post-response opportunity, persistent lifecycle, retry behavior, Candidate Work UI, and inline evidence remain intact. Existing provider-generated `AVAILABLE` records remain immutable audit history, but their prose is withheld from the authoritative Candidate Work surface.

Baseline: `025d0dc`

The takeover audit and model-compliance sections below are retained as experiment history. Where the earlier proposed generative design conflicts with the deterministic decision and implementation record, the deterministic sections take precedence.

## Evaluator presentation pass — 2026-09-15

Independent architecture review accepted the deterministic evidence engine,
aggregation, parser, persistence, migration, and long-history behavior. The
remaining work is limited to Candidate Work presentation:

- replace shell-first primary copy with short, mechanically classified
  milestone copy;
- present authoritative pytest summaries as `Test run` milestones without
  moving exit status or raw output out of evidence expansion;
- distinguish ordinary changes, aggregated changes, reversions, unobserved
  changes, gaps, submission, and submitted state with evaluator-facing labels;
- keep commands without a safely classified semantic fact as neutral command
  milestones, with the exact command visible only under `View evidence`;
- verify fresh Scenarios A–D and an empty submitted session in the actual
  evaluator UI.

This pass did not change typed evidence authority, required coverage,
aggregation, evidence references, persistence, or provider independence. It
narrows optional command promotion to authoritative pytest summaries; all other
commands remain exhaustive in Technical Chronology unless an existing coverage
anchor requires a neutral Candidate Work milestone. Human product review
accepted the rendered hierarchy and wording as deterministic v3.

### Presentation verification result

- The standard gate passes formatting, linting, typechecking, 23 test files / 93
  tests, and the production build; four credential-gated live files are
  intentionally skipped.
- Fresh Docker-backed A–D acceptance passes with deterministic v3 presentation.
- Browser review of all four fresh sessions confirms the readable milestone
  layer, exact multi-reference expansion, and the separate exhaustive Technical
  Chronology. The long background shell command is absent from Candidate Work
  and present verbatim in Technical Chronology.
- Empty submission produces only `Submitted` / `Session submitted.` in focused
  deterministic coverage.

## Final closure outcome — 2026-09-15

Slice 5 is complete. Its history intentionally records the change in approach:

- the slice began with an AI-assisted reconstruction design and a bounded model
  compliance experiment;
- repeated model runs failed the clause-level evidence-entailment requirement,
  so free-form AI was rejected as authoritative Candidate Work;
- the runtime pivoted to typed facts, deterministic coverage selection,
  phase-bounded workspace aggregation, and closed statement templates;
- long histories are compressed only through exact consecutive workspace
  aggregation, while material integrity boundaries remain separate;
- pytest parsing is conservative and produces a test summary only from one
  complete, unambiguous passed/failed terminal-summary line;
- persistence is versioned by `(session_id, prompt_version)`, with a
  transactional migration that preserves legacy record content and provenance;
- deterministic v3 refined only evaluator presentation: Candidate Work is the
  bounded milestone layer, Technical Chronology is exhaustive evidence, and
  Final Submitted Diff is the exact submitted state; and
- architecture, code-quality, evidence-semantic, persistence, migration,
  evaluator-presentation, documentation, and adversarial acceptance gates all
  passed. The accepted runtime remains provider-independent, and provider
  adapters remain non-runtime experiment tooling.

## C4 blocker remediation — 2026-09-15

Antigravity accepted the deterministic evidence semantics on valid histories and
identified three focused inconsistencies. This remediation preserves the
existing pipeline and addresses them at their owning boundaries:

1. Replace per-transition workspace anchoring with deterministic phase
   aggregation. A maximal consecutive run of ordinary workspace transitions is
   one coverage unit with exact member references. Reversions, out-of-band
   changes, evidence gaps, unsuccessful commands before later work, the final
   command, submission, and final state remain independent boundaries. A
   renderer may combine only that homogeneous workspace group and must expose
   every member reference. The 12-statement readability limit remains; a
   history is genuinely unsatisfiable only when more than 12 non-coalescible
   material boundaries remain after this policy.
2. Replace broad pass/fail token scanning with recognition of one structurally
   valid pytest terminal-summary line after ANSI removal. Ambiguous, missing,
   or truncated summaries produce no test-summary fact; the command and exit
   status remain visible.
3. Migrate reconstruction persistence from one record per session to one record
   per `(session_id, prompt_version)`. Existing rows retain content and
   provenance unchanged. Runtime reads and creates the deterministic version;
   evaluator API responses expose only bounded legacy audit metadata, never
   legacy prose as current Candidate Work.

The existing cross-gap validator remains relevant because deterministic
workspace aggregation introduces intentional multi-reference statements. It is
retained as a guardrail, with aggregation constrained never to cross a command
or integrity boundary.

### C4 remediation verification

- The standard gate passes formatting, linting, typechecking, 22 test files / 85
  tests, and the production build; four credential-gated live files are
  intentionally skipped.
- Fresh Docker-backed deterministic acceptance passes Scenarios A–D. The new
  long-history integration suite proves safe aggregation across 15 consecutive
  saves, preservation of nonlinear integrity boundaries, and explicit failure
  when 13 material boundaries cannot fit 12 statements.
- Adversarial parser coverage rejects log prose, incomplete output, collection
  errors, unsupported pytest statuses, and multiple terminal summaries while
  accepting one complete ANSI-normalized passed/failed summary.
- Old-schema migration and version-coexistence coverage preserves legacy AI
  content and provenance while exposing deterministic v2 as the only current
  Candidate Work content.

## Takeover audit — 2026-09-15

The committed Slice 5 baseline was re-inspected before completion work. Two
concrete regressions require targeted correction before another live run:

- the generic reconstruction prompt still contains Scenario 001 solution
  vocabulary and domain-specific examples, which can prime unsupported clauses;
- the NVIDIA NIM adapter reads and logs raw HTTP failure bodies, while the
  existing provider test checks only the bounded thrown error.

The next implementation step is limited to removing that prompt priming,
adding a prompt regression, replacing raw provider logging with safe operational
metadata, and proving the raw body is neither consumed nor logged. After the
deterministic gate passes, live acceptance will restart with Scenario A only;
Sessions B–D will run sequentially only if A passes clause-level audit.

Final UI inspection also found that the deterministic integrity notice was
nested after the Candidate Work heading. It is moved ahead of Candidate Work to
restore the approved evaluator hierarchy without changing evidence semantics.

### Fresh live acceptance result

Two fresh Scenario A sessions were generated after removing generic
Scenario 001 solution examples. Both provider calls returned structurally valid
`AVAILABLE` artifacts, but both failed manual clause-level entailment review.
The latest output inferred purpose with “to confirm,” called values/entries
“stale” without comparison evidence attached to those statements, and omitted
the initial three-test failure. Provider latency was 36,608 ms for the first
run and 26,743 ms for the second. This repeatable semantic non-compliance is not
treated as application success. Sessions B–D were intentionally not run.

## Model compliance experiment — 2026-09-15

The next acceptance step is a bounded provider/model comparison, not another
prompt revision. The Scenario A evidence packet, prompt version, output schema,
temperature, output limit, and non-streaming mode will remain fixed across two
runs per candidate where quota permits. Exact model IDs and safe provenance will
be recorded for every run.

The initial candidate set is:

- direct NVIDIA NIM `nvidia/nemotron-3.5-lightning-30b-a3b`;
- OpenRouter `nvidia/nemotron-3.5-lightning:free` (explicit model routing; its
  current OpenRouter capability does not include schema-constrained response
  format, so strict JSON parsing remains the structural gate);
- OpenRouter `nvidia/nemotron-3-super-120b-a12b:free` (explicit model routing
  with JSON Schema response format and parameter-support routing required).

If those three produce no repeated semantic pass, the single optional fourth
candidate is OpenRouter `google/gemma-4-31b-it:free`, using the same JSON Schema
request and frozen packet.

### Experiment result

One fresh Scenario A packet (`eec23cbb4914edc4fbce7c4c05c83b58d01ec6e3be8f6531263f9ddac27af495`)
was reused for two calls to each of the four explicit models. The corrected
packet included the initial failed `pytest` command as an
`unsuccessful_command_before_further_work` anchor.

- Direct NVIDIA NIM returned schema-valid and coverage-complete output twice
  (22,509 ms and 31,734 ms), but both outputs contained unsupported clauses.
  Examples include “inventory quantity mismatches,” “deletion confirmed,”
  “stale inventory counts,” “confirming restock,” and “persistent stale
  inventory issue.”
- OpenRouter Nemotron Lightning free returned HTTP 200 twice (13,259 ms and
  33,184 ms), but both outputs failed the schema. The untrusted shapes also
  contained unsupported purpose/comparison language and one duplicate
  submission statement.
- OpenRouter Nemotron Super free returned an invalid response envelope once
  (482 ms) and schema-valid, coverage-complete output once (6,166 ms). The valid
  output relabelled `pytest` as “the verification suite,” so it failed semantic
  acceptance.
- OpenRouter Gemma 4 31B free was present in the contemporaneous model catalog
  but returned HTTP 404 twice (155 ms and 346 ms), so it failed operational
  acceptance and produced no output to audit.

No candidate demonstrated repeated Scenario A compliance. The application
default remains direct NVIDIA NIM solely as the unchanged pre-experiment
configuration, not as an accepted semantic winner. Sessions B–D were not run.
The next decision is architectural; additional prompt complexity or a larger
model sweep is outside this bounded experiment.

## Deterministic reconstruction decision — 2026-09-15

Free-form AI reconstruction is rejected for authoritative evaluator-facing
Candidate Work because the bounded model experiment could not reliably satisfy
clause-level evidence entailment. The next implementation replaces the runtime
generator with deterministic construction from typed evidence facts. This is an
invariant-enforcement decision, not a provider-availability workaround.

The existing chronology, evidence-reference catalog, packet bounds, coverage
anchors, reconstruction content schema, immutable SQLite record, evaluator API,
and `NOT_STARTED → PENDING → AVAILABLE` orchestration remain in place. Keeping
that lifecycle avoids a risky schema migration and preserves idempotence,
concurrency, retry, and already-available artifact semantics. Deterministic work
is expected to complete synchronously inside the existing claimed attempt, but
`PENDING` remains a truthful short-lived processing state.

The provider-neutral packet will expose a discriminated union of typed facts
derived only from Slice 1–4 evidence:

- activation and submission boundaries;
- command text, exit status or timeout, and conservative literal output facts;
- workspace origin and typed file added/modified/removed facts;
- deterministic tree reversion and out-of-band markers;
- evidence gaps; and
- non-empty submitted diff paths as final-state facts.

Candidate Work statements are emitted only by closed deterministic templates
over those facts. Atomic command and integrity statements normally own one
reference. A workspace-progression statement may own the exact references of a
maximal consecutive run of ordinary workspace transitions; its count, affected
paths, and membership are mechanically derived. Coverage units are selected
first; remaining command observations are added chronologically while output
bounds permit.

Scenario metadata does not currently contain a typed verification-command
field. The candidate brief mentions `pytest`, but prose is not authoritative
classification metadata. Therefore v1 renders `Ran \`pytest\`` plus literal
exit/output observations and never calls it a supplied verification command.
Adding typed scenario metadata is unnecessary for this focused slice.

NVIDIA and OpenRouter adapters remain explicit opt-in experiment tooling. They
are removed from primary runtime wiring, and neither API key is required for a
new deterministic `AVAILABLE` reconstruction. Optional atomic paraphrasing is
deferred until after deterministic A–D acceptance and is not part of Slice 5
completion.

The OpenRouter and NVIDIA adapters remain provider-specific implementations of
the existing generator interface for explicit synthetic experiments only. They
are not runtime routing or fallback. The corrected coverage rule anchors a
timed-out or non-zero command when a later command execution or workspace change
occurs before submission, without classifying the command's intent.

### Deterministic implementation and acceptance result

The runtime uses `delimit-deterministic` with version
`evaluator-reconstruction-deterministic-v2`. The pre-C4 Docker-backed A–D run
passed exact fact/reference validation and negative-language checks. Scenario D
retained its initial failure, partial change, continued failure, reversion,
out-of-band activity, later multi-file changes, later command outcomes,
submission, and final state, so it remains materially distinct from Scenario C.
Manual browser verification confirmed the evaluator hierarchy and inline raw
evidence expansion. The final `npm run verify` gate passes format, lint,
typecheck, 20 test files / 77 tests (four credential-gated live files skipped),
and the production build. The separate fresh deterministic A–D runner passes,
and the final Docker leak check reports zero `delimit-` containers.

## Product question

> Can a non-technical evaluator understand the important sequence of candidate work from concise deterministic statements, and inspect authoritative evidence whenever they want to verify a statement, without Delimit judging the candidate?

The implementation favors boring, mechanically grounded language. The product question is whether that compression makes Slice 4 evidence usable while preserving chronology, uncertainty, failed attempts, evidence gaps, and technical drill-down.

## Historical pre-implementation observations

- The repository is clean on `main` at the stated baseline.
- Sessions currently use `CREATED → ACTIVE → SUBMITTED`; `SUBMITTED` means final evidence is frozen and candidate mutation APIs are closed.
- SQLite contains the authoritative session record, complete final diff, and append-only raw events. No reconstruction persistence exists.
- `buildChronologicalReconstruction` deterministically folds command pairs and interleaves workspace changes and evidence gaps. It is the required input boundary for Slice 5, not a view to replace.
- The evaluator page builds that projection during rendering and directly renders commands, output, patches, tree hashes, raw envelopes, and the final diff. It is technically inspectable but is a large server component and assumes engineering knowledge.
- Evaluator access is protected by a separate HTTP-only, `SameSite=Strict` cookie. Any generation mutation must use the same evaluator authorization boundary.
- No AI dependency, provider key, provider client, runtime schema library, queue, or background worker exists.
- Scenario snapshots contain only candidate-facing title, brief, acceptance criteria, and runtime configuration. Hidden scenario design documents and private validation tests are outside the session snapshot and must remain outside the model packet.
- Raw command output and intermediate patch previews are already bounded, but a complete session packet still needs aggregate bounds.
- The handoff still describes the pre-reconciliation commit as the current baseline, and the evaluator submission marker still claims teardown is deterministic even though cleanup failure is now separately observable. Both should be corrected during implementation documentation/UI work.

## Proposed Slice 5 boundary

Deliver one post-submission, evaluator-only reconstruction path for submitted Scenario 001 sessions:

1. Build a bounded, structured evidence packet from the submitted session and deterministic Slice 4 chronology.
2. Send it through one narrow reconstruction-generator interface.
3. Treat the returned value as untrusted and validate its structure, bounds, references, chronology, and coverage anchors.
4. Persist one stable reconstruction with generation provenance.
5. Present the human-readable statements first, with inline evidence expansion into the existing deterministic cards and raw evidence.
6. Preserve the complete deterministic chronology and final diff beneath that layer.
7. Persist and display generation failure without changing submission or hiding evidence.

The slice does not classify the task outcome, compare the candidate with an answer key, or determine whether acceptance criteria were met.

## Explicit non-goals

- Candidate AI, prompts, responses, insertion events, or autonomous coding.
- PTY, WebSockets, terminal emulation, or streaming shell I/O.
- Scores, rankings, confidence scores, competence labels, seniority labels, pass/reject, advance recommendations, or rubric engines.
- Test-command recognition or new `TEST_RUN` inference.
- Private scenario validation or intended-solution comparison in the model prompt.
- Live summaries during candidate work.
- Successful-reconstruction regeneration, prompt management UI, generic content blocks, provider routing, fallback-provider orchestration, tool calling, agent loops, or a generic AI platform.
- New session lifecycle states solely to mirror reconstruction progress.
- A second LLM that judges the first model's output.

## Reconstruction data model

Use a small versioned model owned by the reconstruction context:

```ts
type ReconstructionStatus =
  | 'NOT_STARTED' // derived when no row exists
  | 'PENDING'
  | 'AVAILABLE'
  | 'FAILED';

type EvidenceReconstructionContentV1 = Readonly<{
  schemaVersion: 1;
  statements: readonly ReconstructionStatement[];
}>;

type ReconstructionStatement = Readonly<{
  id: string; // assigned by Delimit after validation: stmt_001, stmt_002, ...
  text: string;
  detail?: string;
  claimBasis: 'chronology' | 'final_state';
  evidenceRefs: readonly string[];
  firstEvidenceOrder: number; // derived and assigned by Delimit; never model supplied
}>;
```

Persisted array order is chronology order. There is no free-floating title, conclusion, verdict, overall assessment, or Markdown field. `detail` is optional factual clarification supported by the same references as `text`.

The model supplies neither statement IDs nor ordering metadata. Delimit derives `firstEvidenceOrder`, stably sorts accepted statements by it, and then assigns deterministic IDs. This removes arbitrary IDs and model-generated chronology from the trust boundary. Persisted IDs must still be unique and persisted order must be nondecreasing.

Conservative initial bounds, to be calibrated during acceptance:

- 1–12 statements;
- `text`: 1–240 characters;
- `detail`: at most 480 characters;
- 1–6 evidence references per statement;
- validated normalized content JSON: at most 16 KiB.

Keep these values together in one reconstruction-specific server constant/object so packet construction, validation, and tests use the same limits. They are implementation-tunable guardrails, not permanent product constants or environment-wide configuration. Do not build a generic configuration system. Changes remain code-reviewed and the live Scenario 001 experiment determines whether the initial values preserve enough evidence.

## Evidence reference model

Build a session-scoped evidence catalog before generation. Every model-visible item receives an opaque, server-created reference:

- `session:<sessionId>:activated`
- `session:<sessionId>:submitted`
- `session:<sessionId>:final-diff`
- `command:<sessionId>:<commandId>` — resolves to the correlated start and finish events plus its deterministic command card.
- `event:<sessionId>:<eventId>` — resolves to a workspace change, evidence gap, or other supported deterministic item and its raw event.

Each catalog entry contains its evidence role (`chronology` or `final_state`), deterministic chronology ordinal when applicable, event sequence range when applicable, kind, and raw event IDs. References are not separate model-generated identities and need no new authoritative event type.

Validation accepts only exact references present in the packet's catalog. Session namespacing and catalog membership reject unknown and cross-session references. A command reference expands to both authoritative raw events; a session or final-diff reference resolves to the authoritative session record.

References may be reused across different statements when the same evidence genuinely supports both. Duplicate references inside one statement are rejected.

The resolver must rebuild the same catalog when rendering persisted content and fail closed if a stored reference no longer resolves.

### Deterministic chronology mapping

The evidence catalog assigns a zero-based `chronologyOrder` from the array produced by `buildChronologicalReconstruction`; timestamps and model output never decide order:

- activation receives the ordinal of `SESSION_ACTIVATED`, always before event-backed work;
- a command execution receives the ordinal of its folded `COMMAND_EXECUTION` item, whose current deterministic position is the `COMMAND_FINISHED` event sequence;
- a workspace change receives the ordinal of its `WORKSPACE_CHANGE` event item;
- an evidence gap receives the ordinal of its `WORKSPACE_GAP` event item;
- submission receives the ordinal of `SESSION_SUBMITTED`, after all pre-submission chronology items;
- a post-submission sandbox-cleanup failure retains its later deterministic ordinal if it is ever eligible for model citation;
- the final diff is `final_state` evidence with no independent chronology. For presentation ordering only, a statement supported solely by final-state evidence receives the submission ordinal. This does not convert the diff into proof of when a change occurred.

For each statement, the server derives `firstEvidenceOrder` as the minimum ordinal among its chronology references. Final-state-only statements use the submission ordinal. The server stably sorts statements by `(firstEvidenceOrder, modelArrayIndex)` before assigning IDs. Unknown model-supplied ordering fields are rejected. These ordinals are persistence/validation internals and are not displayed to evaluators.

A chronological-action claim must cite at least one `chronology` reference. A final-diff-only statement may describe the submitted repository state, but not when, why, or in response to what that state arose.

## Model input packet

Define `EvidencePacketV1` as a provider-neutral, JSON-serializable object built from `getSubmittedEvidence` plus `buildChronologicalReconstruction`:

```ts
type EvidencePacketV1 = Readonly<{
  schemaVersion: 1;
  scenario: {
    title: string;
    candidateBrief: string;
    candidateAcceptanceCriteria: readonly string[];
  };
  session: {
    activatedAt: string | null;
    submittedAt: string;
  };
  evidenceItems: readonly ModelEvidenceItem[];
  finalDiff: {
    evidenceRef: string;
    excerpt: string;
    excerptBytes: number;
    totalBytes: number;
    truncated: boolean;
    sha256: string;
  };
  integrity: {
    workspaceGapRefs: readonly string[];
    outOfBandChangeRefs: readonly string[];
    truncatedEvidenceRefs: readonly string[];
  };
  coverageAnchors: readonly CoverageAnchor[];
}>;
```

Model evidence items retain chronology and factual distinctions:

- activation and submission boundaries;
- command text, exit code or timeout, duration, bounded stdout/stderr excerpts, original byte counts, and truncation flags;
- workspace origin, paths, statuses, additions/deletions, and bounded patch excerpts;
- explicit workspace-gap items using neutral platform-authored language;
- out-of-band items labelled only as “workspace changed between recorded actions.”

The packet must not contain candidate identity, evaluator decisions, hidden root-cause notes, private scenario validation, intended fixes, or platform secrets. Candidate-authored commands, output, filenames, and patches are untrusted data, not instructions.

Apply deterministic packet bounds before the provider call:

- at most 250 chronology items for this prototype;
- at most 4 KiB per stdout/stderr excerpt;
- at most 8 KiB per intermediate file patch excerpt;
- at most 16 KiB of final-diff excerpt;
- at most 256 KiB canonical packet JSON.

Every excerpt truncation is explicit. If item count or total packet size still exceeds the aggregate limit, fail generation with `INPUT_TOO_LARGE`; do not silently omit chronology items. The deterministic evaluator view remains available.

## Coverage-anchor policy

Grounding protects against fabrication. Coverage protects against selective storytelling.

`CoverageAnchor` is a deterministic packet instruction, not a judgment and not a new authoritative event. Each anchor has a server-assigned ID, a neutral kind, and one or more exact catalog references. V1 creates required anchors for:

- the submission boundary;
- every `WORKSPACE_CAPTURE_FAILED` item;
- every `out_of_band` workspace change;
- every maximal consecutive ordinary workspace progression, with exact member references;
- every transition whose `afterTree` returns to an earlier observed tree as a separate deterministic reversion marker;
- every timed-out or non-zero command followed by a later observed command execution or workspace transition, described only as an observed command outcome before further work;
- the last completed command before submission, described only as the final observed command outcome; and
- a non-empty final diff, as final-state evidence only.

This deliberately does not infer that a command is a test or verification command. The current event model has no authoritative “supplied verification” designation, so V1 cannot truthfully create that specific anchor. It instead anchors an unsuccessful command when later observable work establishes that the history continued, plus the final observed command outcome. Adding semantic test recognition or a new event merely to satisfy reconstruction is out of scope.

The model output does not repeat anchor IDs. Coverage is checked through evidence references: the union of all accepted statement references must contain every required anchor reference. One statement may cover several related anchors when its bounds allow, and no statement is required per command. Gap notices remain deterministically visible even if generation fails, but a reconstruction cannot become `AVAILABLE` while required gap anchors are absent from its statements.

If required anchor references cannot fit within the statement/reference/output bounds, packet construction fails with `COVERAGE_UNSATISFIABLE`; it must not silently relax or sample anchors. The bounds may be recalibrated from the four-session experiment only through plan review.

```ts
type CoverageAnchor = Readonly<{
  id: string; // server assigned
  kind:
    | 'submission_boundary'
    | 'workspace_gap'
    | 'out_of_band_change'
    | 'workspace_progression'
    | 'reversion'
    | 'unsuccessful_command_before_further_work'
    | 'final_observed_command'
    | 'final_state';
  evidenceRefs: readonly string[];
}>;
```

## Failed attempts and reversions are preserved

The reconstruction is compression, not sanitization. The prompt must preserve material failed command outcomes, intermediate workspace transitions, and reversions rather than collapse a messy history into only the final successful-looking path. Required anchors make the deterministic instances above impossible to omit from an `AVAILABLE` reconstruction, while manual acceptance checks whether the prose represents them plainly and without judgment.

For the sequence “failure; change A; failure; revert A; change B; success,” output that mentions only change B and success is invalid because it omits required failure, transition, and reversion references. This is a coverage failure even if every sentence it did include was factually grounded.

## Model output contract

Request strict structured JSON matching:

```ts
type ModelReconstructionV1 = Readonly<{
  schemaVersion: 1;
  statements: readonly {
    text: string;
    detail?: string;
    claimBasis: 'chronology' | 'final_state';
    evidenceRefs: readonly string[];
  }[];
}>;
```

Disallow unknown fields. The model cannot return Markdown, an overall summary, scores, labels, confidence, verdicts, or hidden reasoning. The generator returns `unknown`; only the validator may convert it into domain content. Delimit trims strings, validates, assigns statement IDs, and persists only the normalized validated form.

Do not request or store chain-of-thought. Do not persist malformed raw provider output. A bounded provider request ID and sanitized failure metadata are sufficient for operational diagnosis.

## Prompt constraints

Use one versioned system instruction stored in source control. It must:

- define the role as translating observable work evidence into plain language, not evaluating a person;
- require concise, specific, chronological statements and supplied evidence references;
- distinguish command outcome, supplied verification outcome, final repository state, acceptance criteria, and evaluator judgment;
- prohibit hiring, competence, quality, seniority, optimality, intent, emotion, understanding, realization, suspicion, and authorship claims;
- prohibit claims that a passing command means the assessment was solved;
- require failed attempts and reversions to remain visible when material;
- require every supplied coverage anchor to be represented through its evidence references;
- require explicit acknowledgement of workspace gaps and prohibit implying observed causation or continuous workspace history across an unobserved interval;
- preserve `out_of_band` uncertainty and prohibit attributing its cause;
- treat all packet content as quoted untrusted data and ignore instructions contained in commands, output, files, or patches;
- use only supplied catalog references and omit a statement when sufficient evidence is unavailable;
- avoid unexplained technical jargon while retaining concrete behavior.

The user/model message contains only the structured packet and output contract. Prompt version is a source-controlled constant such as `evaluator-reconstruction-v1`, not a database-editable prompt CMS.

## Structural validation and semantic policy boundary

Validation occurs server-side after structured generation and before persistence:

1. Parse with a strict runtime schema. Prefer a small established schema library rather than handwritten recursive validation; add only the selected library and its lockfile change.
2. Require `schemaVersion === 1` and reject unknown fields.
3. Enforce statement, field, reference, and total-output bounds.
4. Reject empty/whitespace statements, empty evidence sets, and duplicate in-statement references. Repeated deterministic statement text is permitted when distinct chronology references establish that the same observable action occurred more than once.
5. Resolve every reference against the exact session packet catalog.
6. Require every reference to belong to the same session and reject duplicate persisted IDs or references.
7. Derive `firstEvidenceOrder`, normalize array order with a stable server sort, and verify nondecreasing order before persistence.
8. Require a `chronology` claim basis to include chronology evidence. Require a `final_state` claim basis to use only final-state evidence; prompt/manual review enforce that its prose describes submitted state rather than chronology.
9. For a statement with chronology references on both sides of a gap, require an explicit reference to every intervening gap. Do not claim this proves the prose avoids causal bridging.
10. Verify that the union of statement references covers every required coverage-anchor reference.
11. Assign deterministic unique statement IDs only after all checks pass.
12. Deterministically reject any forbidden structural field, including a score, verdict, recommendation, confidence, competence, or hidden-reasoning field, if it somehow appears despite the strict schema.

Do not build a keyword or regex censorship engine and call it semantic validation. No-competence-judgment, no inferred mental state, no hiring recommendation, no “good/bad reasoning,” causal restraint, and outcome separation are primarily generation-policy constraints backed by prompt design, traceability, and manual acceptance review. Obvious forbidden structural fields are rejected; free prose is not treated as semantically proven by a word list.

**Structural validation does not prove semantic correctness.** It proves shape, bounds, reference integrity, same-session ownership, deterministic ordering, gap-reference inclusion, and minimum coverage. Whether cited evidence entails the wording remains a human-audited risk contained by visible citations, derived-state labelling, deterministic fallback, and the live acceptance experiment—not a second model.

## Persistence and provenance

Add a dedicated `SqliteEvidenceReconstructionStore`; do not add generated prose to `assessment_events` or the session row.

Persist one row per session containing:

- reconstruction ID and session ID;
- `PENDING | AVAILABLE | FAILED` status;
- schema version and prompt version;
- packet-builder version;
- provider and model identifiers;
- optional bounded provider request ID;
- source event first/last sequence and event count;
- SHA-256 of canonical `EvidencePacketV1`;
- SHA-256 and byte count of the complete final diff;
- validated content JSON only when available;
- bounded failure code and sanitized failure message only when failed;
- attempt count, created time, attempt-started time, and completed/updated time.

The source digest ties wording to the exact packet. Raw events and submitted diff remain authoritative and reconstruct the packet; generated text remains derived and non-authoritative. Each `(session_id, prompt_version)` record is immutable once `AVAILABLE`; a later generator version creates a separate record. Page refreshes read the current deterministic version and never invoke a generator for that version once available.

## Reconstruction trigger and lifecycle

Domain eligibility, generation execution, and evaluator rendering are separate concerns:

- **Eligibility:** a session becomes reconstruction-eligible when it is durably `SUBMITTED` and its immutable evidence can be retrieved consistently. Eligibility is derived from authoritative session/evidence state; it does not depend on a reconstruction row, packet size, provider availability, or page visitation. Submission remains completely independent of AI.
- **Execution:** the application may opportunistically claim and run generation for an eligible session. The primary trigger is a Next.js `after()` task registered by the successful submission route only after `SessionService.submit()` has returned. It runs after the HTTP response, so neither the domain service nor submission response waits for a model. A later application observation of eligible `NOT_STARTED` or stale `PENDING` state may invoke the same idempotent ensure operation as recovery. No queue, worker, polling daemon, or fire-and-forget promise is introduced.
- **Rendering:** evaluator page/server rendering only reads authoritative evidence and current reconstruction state. It never calls the provider. A small authorized client action may request the idempotent ensure operation after the page has rendered an eligible ungenerated state, but “HR opened the page” is an execution opportunity, not a lifecycle transition or prerequisite. Deterministic chronology is rendered in every state.

Exact state/claim semantics:

1. No row plus eligible session is the derived `NOT_STARTED` state. No row plus an unsubmitted or inconsistent session is ineligible, not pending.
2. The executor uses an immediate transaction to insert the session/version row as `PENDING` with `attempt_count = 1`, an attempt token, immutable source event/final-diff identity, and `attempt_started_at`. Only the request that inserts that versioned row owns the attempt. Packet-build failures complete it as `FAILED` rather than causing an endless unclaimed loop.
3. A fresh `PENDING` row means one attempt is claimed and may be in flight. Other callers return the existing state and must not call the generator.
4. `AVAILABLE` means the owning attempt returned structurally valid, coverage-complete content and atomically completed the row with validated JSON and provenance. That version is immutable; an upgraded generator uses a new `prompt_version` row.
5. `FAILED` means the owning attempt ended without available content. It stores only a bounded failure code/message and provenance; it does not change session state or evidence. Ordinary `FAILED` rows are never automatically retried.
6. An evaluator's explicit retry action may conditionally change `FAILED → PENDING`, increment `attempt_count`, issue a new attempt token, and clear prior bounded failure details. No other failed retry is legal.
7. A `PENDING` row older than the configured provider timeout plus grace period is stale. The next eligible ensure operation may conditionally reclaim it as `PENDING`, increment `attempt_count`, issue a new token, and record a new start time. This is crash recovery, not a retry of `FAILED`.
8. Completion is compare-and-set on `(session_id, prompt_version, status = PENDING, attempt_count, attempt_token)`. A timed-out former owner cannot overwrite a reclaimed or completed attempt. Exactly one concurrent claimant may invoke the generator for a versioned attempt; losers return current state.

`after()` is best-effort execution, not durable scheduling. If the process ends before it runs, the session remains eligible/`NOT_STARTED`; later observation recovers it. Durability belongs to the frozen evidence and reconstruction claim/result, not to a queue that this slice does not need.

## SRS `COMPLETED_RECONSTRUCTION` resolution

Human product decision: `COMPLETED_RECONSTRUCTION` is not a candidate-session lifecycle state. FR-003 was stale and has been deliberately amended in `docs/product/srs.md`; this is not a silent reinterpretation.

Candidate-session state remains independent of reconstruction. The currently implemented successful path is `CREATED → ACTIVE → SUBMITTED`; `SUBMITTED` means authoritative final evidence is durably frozen, candidate mutation is closed, and candidate-session submission is complete. The SRS retains its unrelated planned readiness/timeout/failure states, but none represents reconstruction progress.

The separate derived reconstruction lifecycle is:

- eligible with no row: `NOT_STARTED` (derived, not persisted);
- claimed attempt: `PENDING`;
- successful immutable artifact: `AVAILABLE`; or
- unsuccessful attempt: `FAILED`, with explicit retry returning it to `PENDING`.

Reconstruction failure, retry, or availability never changes or reopens the `SUBMITTED` candidate session. This resolves the implementation architecture; no lifecycle decision remains open.

## Failure semantics

Use explicit bounded failure codes such as:

- `PROVIDER_NOT_CONFIGURED`
- `PROVIDER_UNAVAILABLE`
- `PROVIDER_TIMEOUT`
- `PROVIDER_RATE_LIMITED`
- `MALFORMED_OUTPUT`
- `FORBIDDEN_OUTPUT_FIELD`
- `INVALID_EVIDENCE_REFERENCE`
- `INPUT_TOO_LARGE`
- `COVERAGE_UNSATISFIABLE`
- `INTERNAL_GENERATION_ERROR`

Any failure updates only the reconstruction row. It never changes `SUBMITTED`, raw events, final diff, or deterministic chronology.

The evaluator sees a neutral reconstruction-unavailable state and immediate access to the technical chronology. Experimental provider failures must not expose secrets, raw malformed output, stack traces, or sensitive internal errors.

Do not automatically retry failed generations. Show a retry action only for `FAILED`; it claims one new bounded attempt. `AVAILABLE` has no regenerate action in Slice 5.

## Provider boundary

Define one narrow interface:

```ts
interface EvidenceReconstructionGenerator {
  generate(
    packet: EvidencePacketV1,
    options: { signal: AbortSignal },
  ): Promise<{
    output: unknown;
    providerId: string;
    modelId: string;
    requestId?: string;
  }>;
}
```

Provide one fake implementation for automated tests and one real server-only implementation after provider/model approval. The approved provider/model must offer reliable strict structured output, sufficient context/output limits for the bounded packet, server-side official SDK support, acceptable evidence-processing/privacy terms, and predictable timeout/rate-limit/production behavior. The real adapter must use a single non-streaming request, no tools, no agent behavior, and an abortable timeout.

Do not create a generic AI gateway until candidate AI or another real consumer establishes shared requirements. Provider credentials remain server-only and are never sent to the browser or sandbox.

## Evaluator UX

Keep one page and one evidence object with progressive disclosure:

1. Existing scenario/session context.
2. Deterministic evidence-integrity notices, if any.
3. **Candidate work** — ordered AI-assisted statement cards as the primary reading surface, explicitly labelled “AI-assisted explanation; verify with cited evidence.”
4. Inline `View evidence` disclosure for each statement.
5. **Technical chronology** — the complete Slice 4 timeline, initially collapsed but fully available.
6. **Final submitted diff** — initially collapsed and directly accessible.

Extract the current timeline cards into focused server components so the same command/change/gap rendering is reused in inline evidence and the full chronology. Do not maintain two independent evidence renderers.

States:

- `NOT_STARTED/PENDING`: show generation progress and keep technical evidence available.
- `AVAILABLE`: show persisted statements first.
- `FAILED`: show a concise failure notice, a retry action, and technical evidence.

Technical evaluators retain every existing command, output, patch, tree, raw envelope, and final diff.

## Evidence drill-down

`View evidence` expands in place beneath a statement; it does not navigate to a disconnected screen. Resolve each `evidenceRef` to the existing deterministic item and render:

- the combined command card for command references;
- workspace change or gap card for event references;
- activation/submission boundary for session references;
- final diff disclosure for the final-diff reference.

Raw events remain a nested disclosure inside deterministic cards. Display the cited reference beside the evidence so the relationship remains explicit. Preserve catalog order and deduplicate repeated cards for display without changing stored references.

## Evidence-gap behavior

Continue generation when useful, but preserve this invariant:

> AI must never imply an observed causal or continuous workspace history across an evidence gap.

Safeguards are layered:

- The packet contains explicit gap items and references.
- The prompt requires gap acknowledgement and prohibits causal or continuity claims across unobserved intervals.
- The validator derives every gap between a statement's earliest and latest chronology references and requires the statement to cite every such gap.
- A factual cross-gap statement is therefore structurally allowed only when the gap is itself evidence—for example, a command outcome before and another after a period of incomplete workspace evidence.
- Citation of the gap does not prove that the prose avoided a causal implication. That semantic boundary is enforced by generation policy, visible evidence, and manual acceptance testing, not a keyword engine.
- The evaluator page deterministically renders a prominent integrity notice for every `WORKSPACE_CAPTURE_FAILED`, independent of model output.
- The complete gap card remains in technical chronology and citation drill-down.

If the packet cannot be built consistently or submission itself was not successful, generation refuses. Ordinary recorded intermediate gaps do not make all other evidence unusable.

## Out-of-band behavior

The packet exposes only the observed fact, origin, affected files, time/sequence, and patch evidence for `out_of_band` changes. It supplies no causal field.

The prompt requires “workspace changed between recorded actions” semantics and forbids attributing the change to a background process, command, or person without direct evidence. The evidence drill-down reuses the neutral Slice 4 card.

Automated tests verify that the packet contains no inferred cause and that the out-of-band reference is covered. They do not claim to validate the semantics of arbitrary causal prose. Live acceptance is responsible for detecting attribution overreach.

## Security / trust boundaries

- Raw events, submitted diff, and session lifecycle remain authoritative.
- Deterministic chronology remains a trusted server projection of authoritative evidence.
- Evidence packet is a bounded derived representation.
- Provider output is untrusted until validated and remains non-authoritative afterward.
- Candidate-authored repository content, commands, and output may contain prompt injection. Delimit serializes them strictly as data, uses no provider tools, and never lets them alter the system instruction or output schema.
- The generation route requires evaluator authorization and accepts only a session ID plus a narrow failed-retry flag; clients cannot supply evidence packets, prompts, model IDs, or evidence references.
- Provider key and configuration are read server-side, excluded from client bundles, logs, events, and candidate containers.
- Failure messages and provider request IDs are bounded before persistence or display.
- No candidate identity is sent because it is unnecessary for reconstructing work.
- Provider data-retention and processing terms must be approved before live candidate evidence is transmitted. Candidate/evaluator privacy notice implications must be reviewed during implementation.

## Database changes

Add one SQLite table, created by the dedicated store using the repository's existing local schema-on-open approach:

```sql
CREATE TABLE evidence_reconstructions (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'AVAILABLE', 'FAILED')),
  schema_version INTEGER NOT NULL,
  prompt_version TEXT NOT NULL,
  packet_builder_version TEXT NOT NULL,
  provider_id TEXT,
  model_id TEXT,
  provider_request_id TEXT,
  source_first_sequence INTEGER,
  source_last_sequence INTEGER,
  source_event_count INTEGER NOT NULL,
  source_packet_sha256 TEXT,
  final_diff_sha256 TEXT NOT NULL,
  final_diff_bytes INTEGER NOT NULL,
  content_json TEXT,
  failure_code TEXT,
  failure_message TEXT,
  attempt_count INTEGER NOT NULL,
  attempt_token TEXT NOT NULL,
  created_at TEXT NOT NULL,
  attempt_started_at TEXT NOT NULL,
  completed_at TEXT,
  updated_at TEXT NOT NULL
);
```

Store methods should express legal transitions rather than expose generic updates: `getBySessionId`, `beginFirstAttempt`, `retryFailedAttempt`, `reclaimStaleAttempt`, `completeAvailable`, and `completeFailed`. Use immediate SQLite transactions and compare status, attempt count, and attempt token so concurrent requests cannot both claim an attempt or an obsolete owner complete a reclaimed attempt.

Do not add reconstruction fields to `assessment_sessions` and do not append generated text to `assessment_events`.

## API / service changes

- Add `EvidenceReconstructionService` responsible for submitted-session checks, packet construction, attempt claiming, provider invocation, validation, and persistence.
- Keep `SessionService.submit` unchanged; submission does not call AI. The submission route registers the post-response `after()` opportunity only after that service succeeds.
- Extend the evaluator evidence composition to return reconstruction status/content/provenance and a resolved evidence catalog, without exposing provider credentials or raw malformed output.
- Add authenticated `POST /api/evaluator/sessions/[sessionId]/reconstruction`:
  - no body for first generation;
  - `{ retryFailed: true }` only for an explicit failed retry;
  - return `202` for an existing active attempt, `200` for available/completed, and a bounded failure response for failed generation.
- Reuse the existing evaluator session GET/page for reads; server rendering and successful page refreshes never directly generate. The evaluator-only POST is also the fallback ensure/retry entry point.
- Add reconstruction-specific typed errors and HTTP mappings rather than reusing candidate session errors.
- Centralize application construction enough that the page, GET route, and POST route share the same database path and reconstruction store, without introducing a dependency-injection framework.

## Test strategy

Add deterministic unit and integration coverage without asserting exact model prose.

### Packet and reference tests

- Packet contains only candidate-facing scenario context and Slice 4 evidence.
- Hidden scenario design/private validation is absent.
- Valid references resolve to the correct deterministic/raw evidence.
- Unknown and cross-session references are rejected.
- Empty evidence sets and duplicate in-statement references are rejected.
- Packet excerpts and total size are bounded with explicit truncation.
- Oversized aggregate input fails rather than silently dropping chronology.

### Schema and policy tests

- Valid structured output is accepted and receives deterministic statement IDs.
- Malformed JSON/object shape, unknown fields, wrong version, excessive statement count, excessive lengths, and excessive total output are rejected.
- Model order is ignored: statements are stably normalized by server-derived `firstEvidenceOrder` and receive IDs afterward.
- Unknown ordering fields and forbidden score/verdict/recommendation/confidence fields are rejected structurally.
- `chronology` claims require chronology evidence; `final_state` claims may not structurally cite chronology evidence.
- Semantic-policy fixtures are reviewed in prompt/live acceptance tests; automated validation tests do not claim that keyword matching proves semantic correctness.

### Gap and uncertainty tests

- Every workspace gap produces a deterministic evaluator integrity notice even if the model omits it.
- A cross-gap statement missing any intervening gap reference is rejected; one citing the gap may pass structural validation.
- Out-of-band packet items expose no cause.
- Live acceptance rejects outputs that imply unsupported cause or continuous history across a gap.

### Coverage and history-preservation tests

- Required anchors include submission, gaps, out-of-band changes, non-empty workspace transitions, detected reversions, unsuccessful/timed-out commands followed by further work, the last observed command result, and non-empty final state.
- Missing any required anchor reference rejects the complete output.
- Anchor sets that cannot fit declared output bounds fail explicitly rather than being sampled.
- A fixture with failure, change A, failure, reversion of A, change B, success cannot validate if its failure/change/reversion anchors are omitted.
- No fixture or product label converts command exit status into good/bad reasoning, task success, or a verification classification.

### Lifecycle and persistence tests

- Generation is rejected before submission.
- Submission succeeds unchanged when provider configuration is absent or the provider fails.
- Successful submission makes the session eligible and schedules post-response execution without waiting for it.
- Losing the post-response task leaves recoverable `NOT_STARTED` eligibility.
- First eligible generation claims one attempt; concurrent requests call the generator once.
- Valid output persists as `AVAILABLE` and is reused across service/page reloads.
- Page refresh does not regenerate an available reconstruction.
- Failed generation persists as `FAILED`; technical evidence remains accessible.
- Only an explicit failed retry creates another attempt.
- Available reconstruction cannot be regenerated.
- Stale `PENDING` can be reclaimed; a fresh `PENDING` cannot.
- A former attempt owner cannot complete after its stale claim is reclaimed.
- Persisted refs are re-resolved on read and invalid content fails closed.

### API and authorization tests

- Candidate token and missing/invalid evaluator cookie cannot start generation or read reconstruction content.
- Client cannot supply prompt, packet, provider, model, or references.
- Failure responses do not leak provider details or malformed output.

### Regression gate

- Existing 14 suites / 41 tests continue to pass.
- `npm run verify` passes.
- Docker-backed evidence tests leave zero Delimit containers.

## Live acceptance experiment

Run one real approved provider/model against four separately submitted Scenario 001 sessions produced through the actual sandbox and event pipeline:

- **Session A — shallow path:** reproduce, apply or perform a cache-clearing/TTL mitigation, stop, submit.
- **Session B — partial path:** reproduce, change invalidation behavior, verify, leave identifier behavior unresolved, submit.
- **Session C — complete path:** reproduce, inspect multiple evidence sources, change invalidation and identifier handling, verify broadly, submit.
- **Session D — messy complete path:** false starts, failing edits, reversions, subsequent complete changes, verification, submit.

These are test personas, never product labels. Preserve the four frozen sessions and their generated reconstructions for the review session.

For each reconstruction, have representative non-technical evaluators answer the incident sequence in their own words using the AI layer first, then use `View evidence` to verify selected statements. Record qualitative observations outside candidate scoring:

- Was the important sequence understandable without technical assistance?
- Was chronology preserved?
- Were failures, reversions, and incomplete attempts retained?
- Did any statement infer intent, understanding, quality, or correctness?
- Did any statement overstate a successful command as assessment success?
- Were gaps and out-of-band uncertainty visible?
- Did each important statement have useful supporting evidence?
- Was jargon reduced without becoming vague?
- Did the four work histories remain meaningfully distinguishable?

Acceptance requires manual review of actual model outputs; the test is not part of normal CI and requires an explicitly configured live-provider credential. Record provider/model/prompt versions and packet digests. Do not commit credentials or candidate-identifying data.

## Files expected to change

Likely additions:

- `apps/web/src/reconstruction/evidence-reconstruction.ts`
- `apps/web/src/reconstruction/evidence-packet.ts`
- `apps/web/src/reconstruction/evidence-reference-catalog.ts`
- `apps/web/src/reconstruction/reconstruction-output-validator.ts`
- `apps/web/src/reconstruction/evidence-reconstruction-generator.ts`
- `apps/web/src/reconstruction/evidence-reconstruction-service.ts`
- `apps/web/src/reconstruction/sqlite-evidence-reconstruction-store.ts`
- one provider-specific server adapter after provider approval;
- `apps/web/app/api/evaluator/sessions/[sessionId]/reconstruction/route.ts`
- focused evaluator components under `apps/web/app/evaluator/sessions/[sessionId]/` for reconstruction state, statements, evidence cards, and technical chronology;
- unit/integration tests matching the strategy above;
- an explicitly gated live-provider acceptance test or script.

Likely modifications:

- `apps/web/src/access/evaluator-evidence.ts`
- `apps/web/app/api/candidate/sessions/[token]/submit/route.ts` to register post-response execution after successful submission;
- `apps/web/app/api/evaluator/sessions/[sessionId]/route.ts`
- `apps/web/app/evaluator/sessions/[sessionId]/page.tsx`
- `apps/web/app/workspace.css`
- application construction near `getSessionService` or a small reconstruction-specific factory;
- `package.json` and `package-lock.json` for the selected official provider SDK and runtime schema validation library;
- `.env.example` for server-only provider configuration, using placeholders only.

Do not modify candidate workspace routes, sandbox behavior, Scenario 001 candidate repository, or session submission semantics.

## Documentation updates

During implementation:

- Update `docs/handoff/current-state.md` to the actual baseline and then to implemented Slice 5 behavior, verification, configuration, and failure semantics.
- Update `docs/architecture/reconstruction.md` with the packet, grounding, persistence, provenance, and drill-down layers.
- Update `docs/architecture/ai-boundaries.md` with prompt-injection and provider-output trust boundaries.
- Update `docs/architecture/system-overview.md` when Slice 5 is actually implemented.
- Update `docs/architecture/event-model.md` only to clarify that generated reconstruction is separate derived persistence; do not invent raw candidate events.
- Update `.env.example` and `README.md` with provider setup and the current implemented slices.
- Preserve this plan under `docs/plans/completed/` only after implementation and verification.
- FR-003 and AC-006 were narrowly corrected during the approved product-decision pass. Do not make further SRS lifecycle changes during implementation without a new explicit product decision.

## Risks

- **Semantic overreach:** Valid citations do not prove that prose is entailed. Contain through prompt policy, strict structural checks, visible evidence, and live acceptance.
- **Prompt injection:** Candidate-controlled commands and files may instruct the model. Treat all evidence as data, use no tools, and validate output.
- **Jargon versus vagueness:** The model may preserve too much technical language or erase meaning. The four-session acceptance experiment must calibrate prompt and bounds.
- **Selective omission:** Compression may hide failed attempts or reversions. Required coverage references prevent deterministic anchor omission; acceptance still compares prose against full chronology.
- **Evidence gaps:** The model may write across unknown periods. Deterministic notices and mandatory intervening-gap references do not depend on prose compliance; semantic causal restraint still requires prompt/manual review.
- **Causal overclaiming:** Command correlation and out-of-band changes do not prove exclusive cause. Packet fields and prompt language must preserve those limits.
- **Outcome collapse:** Passing `pytest` may be described as solving the scenario. Prompt/policy must keep command results distinct from task outcome and verdict.
- **Stable but flawed prose:** Generate-once persistence preserves auditability but also preserves a poor accepted summary. Slice 5 intentionally favors stability; correction/regeneration policy is deferred.
- **Provider availability/cost:** Post-response or recovery execution may fail. Bounded calls and deterministic fallback keep evidence usable without delaying submission.
- **Pending recovery:** A process crash can strand an attempt. Conditional stale-attempt reclaim must prevent both permanent pending and duplicate concurrent calls.
- **External data processing:** Repository content and command output leave the application boundary. Provider retention/privacy terms and notices require explicit approval.
- **SQLite concurrency:** Attempt claims must use immediate transactions and conditional status transitions.
- **UI duplication:** Inline evidence and full chronology can diverge unless they reuse one deterministic card renderer.
- **Current documentation drift:** Handoff baseline metadata and README are stale and must be reconciled during implementation.

## Resolved implementation decisions (superseded where noted)

1. **Runtime generator:** deterministic typed facts, phase-bounded workspace aggregation, closed templates, and evaluator-readable milestone presentation, with current provenance `delimit-deterministic` / `evaluator-reconstruction-deterministic-v3`. Deterministic v2 remains immutable audit history.
2. **Provider experiments:** NVIDIA NIM and OpenRouter remain explicit synthetic tooling only; real applicant use still requires a separate privacy/provider review.
3. **Initial numeric bounds:** the centrally defined packet and output limits remain implemented. Coverage cannot be silently weakened to fit them.

ADR 0003 already authorizes evidence-grounded AI explanation and prohibits judgment, so no new ADR is needed unless one of these decisions changes that boundary.

## Historical generative verification record

- Exact provider model: `nvidia/nemotron-3.5-lightning-30b-a3b` through NVIDIA NIM hosted inference OpenAI-compatible chat completions API with strict JSON Schema.
- Generation parameters: 2,048 max output tokens, temperature 0.2, thinking disabled (`chat_template_kwargs: { enable_thinking: false }`).
- Automated gate: `npm run verify` passes on the review worktree: format,
  lint, typecheck, 18 test files / 68 tests passed with three opt-in live files
  skipped, and the production build completed.
- Synthetic evaluator SSR checks: the authenticated missing-provider state rendered successfully; a separately persisted fake `AVAILABLE` artifact rendered Candidate Work statement text, inline `View evidence`, technical chronology, and final submitted diff without contacting provider.
- Runtime cleanup: zero containers matching `delimit-` remained after Docker-backed verification.
- Frozen-packet Scenario A comparison: eight calls across four exact models are
  recorded above. No candidate passed the repeated semantic and operational
  gate; Sessions B–D were not run and the runtime provider did not change.
- Runtime cleanup: zero containers matching `delimit-`; `.env` remains ignored,
  `apps/web/next-env.d.ts` has no diff, and no active Gemini provider references
  remain.

## Live/debug tooling disposition

- Retain `nvidia-nim-acceptance-fixtures.ts` as the shared synthetic history
  fixture.
- Retain `single-acceptance.test.ts` as the intentional A-first runner required
  before the sequential gate.
- Retain `nvidia-nim-acceptance.test.ts` as the final sequential A–D runner.
- Remove `smoke.test.ts`; its Session B path duplicates the single-session and
  final A–D runners without unique acceptance coverage.

The deterministic runner is
`tests/live/deterministic-reconstruction-acceptance.test.ts`; all four histories
share `tests/live/scenario-acceptance-histories.ts`. Provider runners remain
credential-gated experiment tools and are not runtime acceptance gates.

## Historical implementation sequence (completed or superseded)

1. Resolve the three remaining implementation gates: provider/model, external evidence processing/privacy, and initial numeric bounds.
2. Add reconstruction domain types, evidence-reference catalog, packet builder, bounds, and deterministic tests using existing submitted evidence.
3. Add strict model-output structural validation with grounding, server-derived chronology, gap-reference, coverage, and out-of-band tests; keep semantic policy in prompt/manual acceptance.
4. Add the SQLite reconstruction store and transactional attempt lifecycle tests.
5. Add the narrow generator interface, fake generator, service orchestration, timeout/failure mapping, and persistence tests.
6. Add the single approved provider adapter and server-only configuration.
7. Add post-response submission-route execution and the authenticated evaluator ensure/retry endpoint with authorization/concurrency tests; leave `SessionService.submit` unchanged.
8. Refactor evaluator timeline cards for reuse, then add reconstruction states, statement cards, inline evidence drill-down, collapsed technical chronology, and final diff.
9. Run automated failure, persistence, refresh, and regression tests plus `npm run verify`; confirm no leaked containers or generated-file drift.
10. Produce the four real Scenario 001 sessions and run the live-provider/non-technical-evaluator acceptance experiment.
11. Review actual model failures and refine only prompt, explicit bounds, or validation rules justified by evidence from the experiment.
12. Update handoff, architecture, README/configuration docs, and preserve this plan under `completed/` after human acceptance.
