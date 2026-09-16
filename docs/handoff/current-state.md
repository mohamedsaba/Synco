# Current Project State

## Product boundary

Delimit is Synco's engineering-evaluation prototype. A candidate works in a controlled environment, Delimit records observable events, and a human evaluator reviews a chronological reconstruction with expandable source evidence. Evidence precedes judgment: the product does not score, rank, infer competence or intent, or make hiring decisions.

The application remains a Next.js/React/TypeScript modular monolith with SQLite persistence and a Docker boundary around candidate execution.

## Preserved authoritative architecture

- Sessions use `CREATED → ACTIVE → SUBMITTED`; submission freezes the server-owned final state and closes candidate mutation.
- Candidate tokens are hashed and session-scoped. Evaluator access uses a separate HTTP-only credential cookie derived from `DELIMIT_EVALUATOR_KEY`.
- SQLite stores the authoritative session record, complete final diff, append-only raw events, and derived reconstruction records.
- Command start/finish events retain command text, working directory, completion status, duration, and bounded output.
- Platform-owned Git tree capture records browser-save, command-boundary, and out-of-band workspace transitions independently of candidate-controlled Git.
- `WORKSPACE_CAPTURE_FAILED` records evidence gaps. Submission reconciles drift and refuses to freeze an inconsistent tree chain.
- `buildChronologicalReconstruction` remains the deterministic Slice 4 projection used for evaluator chronology and Slice 5 fact derivation.

## Slice 5 completion state

Slice 5 is complete. Free-form model compliance experiments with direct NVIDIA NIM and three OpenRouter model configurations did not demonstrate repeated clause-level evidence entailment on frozen Scenario A evidence. The experiment history and provider adapters remain in the repository, but the result rejected free-form AI for authoritative evaluator-facing Candidate Work.

Deterministic v3 (`evaluator-reconstruction-deterministic-v3`) is the authoritative presentation contract. The application runtime constructs Candidate Work through:

```text
authoritative events
  → session-scoped evidence references
  → typed evidence facts
  → deterministic selection and aggregation
  → deterministic Candidate Work presentation
  → evaluator
```

Typed facts cover activation/submission, command execution and completion, bounded literal output observations, workspace changes with typed paths, deterministic reversion, out-of-band transitions, evidence gaps, and final submitted diff paths. Arbitrary stdout/stderr is not rendered as factual prose. Pytest counts require one complete ANSI-normalized terminal-summary line containing only passed/failed counts; uncertain or truncated output cannot produce a Test run result and falls back to a neutral command milestone when coverage requires it.

Every Candidate Work statement is constructed from typed facts and retains exact evidence references. Consecutive ordinary workspace transitions are one deterministic aggregate with exact membership and affected paths; aggregation stops at commands, reversions, out-of-band changes, and gaps. Those integrity boundaries, non-zero or timed-out commands followed by later work, final command, submission, and final state remain separate.

Candidate Work is now explicitly the readable milestone layer. It uses labels such as Test run, Code change, Workspace reversion, Unobserved workspace change, Evidence gap, and Submitted. Exact shell syntax, output, exit status, sequence IDs, hashes, and patches remain under `View evidence` and in Technical Chronology. Non-anchor commands are included only when they have an authoritative pytest summary; required command anchors remain neutral and exact evidence-backed.

Reconstruction retains the independent `NOT_STARTED → PENDING → AVAILABLE` lifecycle, plus `FAILED` and explicit retry. Persistence permits one immutable record per `(session_id, prompt_version)`. The old one-row-per-session schema migrates transactionally, preserving legacy content and provenance. Current records use `delimit-deterministic` / `evaluator-reconstruction-deterministic-v3`; evaluator APIs expose only earlier-version audit metadata, never earlier prose as current Candidate Work.

The 12-statement readability limit remains. Aggregated statements may cite every member of the 250-item bounded chronology and remain subject to the 16 KiB output limit. `COVERAGE_UNSATISFIABLE` now means more than 12 distinct material boundaries remain after safe aggregation, or exact references cannot fit; evidence is never silently dropped.

NVIDIA and OpenRouter adapters are explicit credential-gated synthetic experiment tooling only. They are not runtime wiring or fallbacks. No AI provider key, model request, or model response participates in production reconstruction.

## Current acceptance evidence

A fresh Docker-backed deterministic run passed all four synthetic histories:

- Scenario A reads as `3 tests failed` → `1 passed, 2 failed` → submission; context-free numeric commands remain in Technical Chronology.
- Scenario B reads as failure → one code change → continued failure → submission and one-file submitted state, so its partial shape is explicit.
- Scenario C reads linearly as failure → two-file change progression → three tests passed → submission and two-file submitted state.
- Scenario D reads nonlinearly as failure → service change → continued failure → reversion → unobserved `notes.txt` appearance → reversion/removal → later two-file changes → mixed test result → three tests passed → submission and submitted state.

Manual browser verification opened fresh A–D through evaluator authentication. It confirmed the Candidate Work/Technical Chronology/Final Submitted Diff hierarchy, all requested evaluator-facing labels, two separate evidence disclosures for the aggregated C and D changes, exact pytest command/output after evidence expansion, and the long background shell command only inside Technical Chronology.

The live artifact is written outside the repository at `/tmp/delimit-deterministic-acceptance/results.json` and is reproducible with `DELIMIT_DETERMINISTIC_ACCEPTANCE=1`.

The final closure gate passes formatting, linting, typechecking, 23 test files / 93 tests, and the production build; four credential-gated live files remain intentionally skipped. Focused coverage includes labels/copy, optional-command selection, long-command disclosure, uncertain pytest output, and empty-session behavior. The separate fresh Docker-backed A–D deterministic acceptance also passes (1 file / 1 test).

## Current working state

- Branch: `review/slice5-c4-remediated`
- Reviewed baseline: `b39310d review: snapshot Slice 5 C4 remediated state`
- Deterministic v3 presentation and final closure changes are prepared but uncommitted by instruction.
- Completed plan: `docs/plans/completed/005-ai-assisted-evidence-reconstruction.md`

Run the standard gate with:

```bash
npm run verify
```

Run the Docker-backed acceptance separately with:

```bash
DELIMIT_DETERMINISTIC_ACCEPTANCE=1 npm exec vitest run -- tests/live/deterministic-reconstruction-acceptance.test.ts
```

## Accepted limitations

- Candidate Work is bounded to 12 statements, 250 chronology items per aggregate, and 16 KiB of normalized content. Histories that cannot preserve material boundaries within those limits fail visibly.
- Pytest interpretation is deliberately limited to one complete, unambiguous passed/failed terminal summary. Other command semantics remain technical evidence rather than inferred milestones.
- Unclassified commands remain in Technical Chronology unless a coverage anchor requires a neutral Candidate Work milestone.
- Optional one-fact-at-a-time AI paraphrasing is not implemented and cannot replace authoritative deterministic Candidate Work without mechanically enforced meaning preservation.
- Candidate AI interaction capture and a full interactive PTY remain unimplemented.
- Experimental provider use remains restricted to synthetic data pending a separate privacy/provider review.

## Next expected workstream

The next logical vertical slice is candidate AI interaction capture, including observable prompt, response, explicit context, and explicit insertion evidence without inferring adoption or authorship. It requires a new active plan and separate acceptance criteria. A full interactive PTY and other later MVP capabilities remain deferred. Do not begin that work as part of Slice 5 closure.
