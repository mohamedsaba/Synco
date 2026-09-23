# Reconstruction

The evaluator's primary object is one chronological reconstruction of the work. Commands, file activity, evidence gaps, and submitted-state context are levels of detail within that history, not separate analytics dashboards.

Raw application-recorded append-only events and the server-derived final diff are authoritative. Candidate Work is a derived navigation layer and never replaces them.

## Deterministic Candidate Work

Free-form AI reconstruction was rejected for authoritative evaluator-facing Candidate Work because the bounded model experiment could not reliably satisfy clause-level evidence entailment. This was an invariant-enforcement decision, not a response to provider availability.

The runtime pipeline is:

```text
authoritative events
  → evidence-reference catalog
  → deterministic typed facts
  → deterministic selection and aggregation
  → deterministic Candidate Work presentation
  → human evaluator
```

Typed facts are limited to distinctions already established by Slice 1–4 evidence: activation and submission boundaries; command text, working directory, completion status, timeout, and bounded output; workspace origin, tree transition, and typed file changes; evidence gaps; and submitted diff paths. Arbitrary command output remains evidence but is not copied into Candidate Work. The only output interpretations are complete numeric-only stdout and a conservative pytest summary; truncated output is never semantically parsed.

Pytest counts are accepted only from one complete terminal-summary line bounded by pytest's `==== … in 0.04s ====` structure after ANSI removal. The status segment may contain only comma-separated `passed` and `failed` counts. Truncated output, collection errors, multiple candidate summaries, unrelated log phrases, skipped/xfailed/warning summaries, and any uncertain shape produce no test-summary fact. The safe Candidate Work fallback is a neutral command milestone when coverage requires it; the exact command and exit status remain in evidence expansion and Technical Chronology.

An authoritative `test_summary` fact is presented as a `Test run` milestone with only its exact passed/failed counts. Without that fact, command naming alone cannot produce a test label or test result. Command names do not establish intent.

Every statement is constructed by Delimit from typed data and carries the exact evidence references that produced that fact. Candidate Work presents short milestone copy; exact commands, output, exit status, tree hashes, sequences, and patches stay in evidence expansion. A multi-reference statement is permitted only for one maximal consecutive run of ordinary workspace transitions; its count, affected paths, and membership are deterministic, and evidence expansion exposes every contributing reference. Aggregation never crosses a command, reversion, out-of-band change, or evidence gap. There is no entry point for arbitrary factual prose. Repeated template text is valid when distinct references record repeated actions.

### Candidate AI Evidence Reconstruction Integration (Slice 6D)

Slice 6D integrates candidate AI interaction events into the evidence reconstruction layer:

- **Distinct Chronological Milestones**: Start (`AI_REQUEST_STARTED`) and terminal (`AI_RESPONSE_COMPLETED`, `AI_REQUEST_CANCELLED`, `AI_REQUEST_FAILED`) events are preserved as separate milestones ordered strictly by `assessment_events.sequence`. Start and completion are never collapsed into a single milestone. Unterminated requests are tolerated without synthesizing missing terminal events.
- **Evidence Reference Catalog**: Deterministic canonical references retain raw event provenance:
  - `ai_request:${sessionId}:${interactionId}:started`
  - `ai_response:${sessionId}:${interactionId}:completed`
  - `ai_request:${sessionId}:${interactionId}:cancelled`
  - `ai_request:${sessionId}:${interactionId}:failed`
- **Typed Evidence Facts**: Narrow, factual representations (`ai_request_started`, `ai_response_completed`, `ai_request_cancelled`, `ai_request_failed`) capturing configured provider/model, bounded excerpts, durations, token usage, and terminal reasons. Evaluative, psychological, or reliance fields are strictly prohibited.
- **Neutral Deterministic Rendering**: Statements use neutral templates ending with terminal punctuation. Cancellation wording distinguishes explicit candidate cancellation (`candidate_requested_cancel`) from platform or session closure cancellation (`session_ended`). Temporal adjacency between an AI response and a subsequent workspace change establishes order only, never causality, suggestion application, or code copying.
- **Coverage Policy**: AI events are available as typed facts in `evidenceItems` without automatically becoming mandatory un-droppable coverage anchors, preventing high-frequency AI calls from displacing critical workspace and command evidence.
- **Scope Boundary**: Evaluator React components, role projections, candidate UI, streaming, Apply button workflows, and AI judgment/quality metrics remain deferred.

## Lifecycles and persistence

Candidate-session state and reconstruction state remain separate. A successful candidate session follows `CREATED → ACTIVE → SUBMITTED`; submission freezes final evidence and closes candidate mutation.

Reconstruction retains `NOT_STARTED → PENDING → AVAILABLE`, with `FAILED` and explicit retry behavior. `PENDING` is short-lived for deterministic generation, but retaining the transactional claim and compare-and-set lifecycle preserves concurrency, crash-recovery, and idempotence behavior.

An `AVAILABLE` record is immutable. Persistence is versioned by `(session_id, prompt_version)`, and the existing one-record-per-session table is migrated transactionally without changing legacy row content or provenance. Current records store `delimit-deterministic` and `evaluator-reconstruction-deterministic-v3`; v3 identifies the evaluator-language presentation contract. Earlier AI and deterministic artifacts remain immutable audit versions while the same session can obtain current Candidate Work. Evaluator API responses expose only bounded legacy provenance metadata, never legacy prose as the current reconstruction.

## Chronology, final state, and coverage

Chronology references establish observable ordering. Final-state references establish only what the submitted repository contains. A final diff cannot establish when, why, or in response to what a change occurred.

Coverage anchors preserve the material shape of work without requiring every command or save. They include submission, each evidence gap, each out-of-band change, each deterministic reversion, each maximal ordinary workspace progression, a timed-out or non-zero command followed by later command or workspace activity, the final observed command, and a non-empty final diff. Anchor units are selected first. Among non-anchor commands, only commands with an authoritative pytest summary are eligible for Candidate Work; unclassified and numeric-only commands remain in Technical Chronology. A required command anchor is always retained and rendered neutrally when it lacks a safe human-facing classification.

Candidate Work remains limited to 12 statements for readability. One aggregate may cite up to the 250-item bounded chronology, and aggregate output remains subject to the 16 KiB content limit. A history is `COVERAGE_UNSATISFIABLE` only when more than 12 non-coalescible material boundaries remain after safe aggregation, or when exact references cannot fit the declared content bounds. Delimit fails visibly rather than dropping evidence or weakening coverage; the complete technical chronology remains available.

Evidence gaps are epistemic boundaries. Candidate Work labels them `Evidence gap` and states that recorded workspace evidence is incomplete. An out-of-band transition is an `Unobserved workspace change`; a tree returning to a recorded state is a `Workspace reversion`. File paths and exact actions are included only when mechanically available. None attributes cause or intent.

## Workspace mutation capture

Workspace modifications remain authoritative Git tree transitions (`beforeTree → afterTree`) captured at browser saves, command boundaries, and out-of-band reconciliation. A command-correlated transition is temporal correlation, not exclusive causation. Submission reconciles drift, captures the final tree and complete baseline diff, and refuses to submit an inconsistent evidence chain.

After durable submission, sandbox cleanup is infrastructure work. Cleanup failure does not reopen the session or alter its evidence.

## Evaluator boundary

The evaluator sees scenario context, evidence-integrity notices, Candidate Work, inline evidence expansion, the complete technical chronology, and the final submitted diff. Candidate Work is the readable milestone layer; Technical Chronology is the exhaustive shell/event layer; Final Submitted Diff is the exact submitted state. Reconstruction may report observable outcomes such as a command exit status or parsed test counts. It must not score, rank, declare competence, infer motivation or hidden reasoning, or automatically pass or reject a candidate.
