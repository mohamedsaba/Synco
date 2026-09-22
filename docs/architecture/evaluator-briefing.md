# Evaluator briefing foundation

## Authority and scope

- [Final reconciled product/experience specification](../product/evaluator-v2-design-specification.md)
- [Architecture source of truth](../audits/evaluator-v2-architecture-feasibility.md)
- [Existing evaluator architecture](evaluator-experience.md)
- [Reconstruction architecture](reconstruction.md)
- [Presentation boundary decision](../decisions/0005-briefing-semantics-remain-presentation-only.md)
- [Completed foundation plan](../plans/completed/053-evaluator-briefing-foundation.md)

Scenario semantics enrich presentation only. They do not change evidence truth.
Evaluator briefings are decision-support artifacts, not candidate-quality judgments.

The detailed foundation implementation request bounds this slice. Final visual design, review-action controls, manager notes and organization workflow are deferred. The product specification's Case D describes exact fixture evidence; it does not authorize a generic behavior classifier. Static review guidance retains its original scenario-source wording and scope.

## Boundary

```text
immutable evidence → chronology → catalog → typed facts → unchanged v3 reconstruction
                                    |                         |
optional immutable semantic snapshot → constrained mapper    |
                                    |                         |
                               briefing assembler ←-----------+
                                    |
                             pure depth projection
                                    |
                         serialized authorized read output
```

No semantics, role, briefing or guidance input flows back into evidence, reconstruction, coverage or submission. Task context and static policy are separately attributed authored data; they are not generated observations.

## Domain and provenance

`apps/web/src/evaluator/evaluator-briefing.ts` defines schema v1 with eight independent categories:

| Category              | Source                                                                              | Grounding / wording                                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Task context          | Frozen scenario brief and evaluation-context invariants/verification areas/warnings | Attributed authored text and versioned snapshot field refs, never observed accomplishment                                           |
| Observed activity     | Catalog-backed typed facts                                                          | Stable observation IDs, exact same-session evidence refs, chronology scope, closed templates and optional mapping rule/subject      |
| Recorded verification | All conservatively recognized catalog command executions                            | Ordered runs, existing parsed counts or null, exit/timeout/truncation, unknown test identity, later edit/gap flags                  |
| Submitted state       | Full frozen diff                                                                    | Distinct paths/counts, safe hunk additions/deletions, optional authored path classification, final-state ref only                   |
| Evidence limitations  | Capture/stream/patch evidence; separately metadata/artifact status                  | Evidence refs for capture limits; metadata field/status refs for absent/unsupported context/semantics or unavailable reconstruction |
| Artifact availability | Reconstruction status and frozen-diff availability                                  | Status-source provenance; no verdict or evidence-loss inference                                                                     |
| Review guidance       | Frozen `reviewPolicy` strings                                                       | Attributed static policy context with exact field/version; no machine routing                                                       |
| Evidence index        | Existing catalog, facts and technical source items/full diff                        | Every profile retains direct authorized source locators, exact raw IDs and inspectable source data                                  |

Provenance identifies the session, authoritative evidence SHA-256, full diff SHA-256, optional v3 artifact/version, scenario snapshot digest/version, evaluation-context digest/version, semantic digest/status/version, mapper, templates, builder and projection versions. Canonical SHA-256 uses recursively sorted object keys and sequence-ordered events. Authoritative evidence identity excludes scenario/context/semantics, roles and policy. Briefing versions never reuse `prompt_version`.

The builder validates index membership, same-session grounding, claim basis and exact deterministic wording. This is structural validation, not general natural-language entailment. Entailment comes from the closed producer rules. Context/guidance are discriminated types and cannot satisfy factual refs.

## Semantic snapshot

`ScenarioSnapshot.semanticSnapshot` is an optional separately typed boundary accepting unknown stored versions. Supported authoring schema is `ScenarioSemanticSnapshot` in `apps/web/src/scenarios/scenario-semantic-snapshot.ts`. Strict schema v1 has `contentVersion`, closed neutral subjects, path classifications, exact argv/working-directory read bindings and approved wording keys. Undeclared fields, missing subject identities, duplicate rule IDs, unsafe path traversal, mutation bindings and mismatched read subjects are rejected. Two different valid bindings matching the same observation deliberately fall back as ambiguous.

Scenario 001 authors a new-session snapshot with inventory service code, inventory database and storefront cache subjects. This authoring addition is not a required candidate path. No empty-area penalty or solution recognizer exists. Path matches establish relatedness only, including when the recorded edit is a comment. File counts cannot establish behavior or candidate quality.

Session creation clones/validates the snapshot. SQLite adds nullable `scenario_semantic_snapshot TEXT` and writes it only on creation. Normal lifecycle updates never update that column or the existing evaluation-context column. Migration checks column existence transactionally, with no swallowed migration errors and no backfill. Old sessions remain null. Unsupported/malformed stored semantics are retained as explicit unsupported presentation metadata, with generic wording and original evidence still usable. Existing `ScenarioEvaluationContextSnapshot` is unchanged.

## Constrained observations and copy contract

The mapper emits recorded command, read command, verification execution, workspace edit, return-to-prior-tree, submission and workspace-gap observations. Verification results have their own typed result kind. Exact source IDs remain stable regardless of semantic mapping. No generic behavior-change classifier is implemented.

Read bindings recognize only direct `redis-cli GET` of an exact configured stock key or the configured parameterized-target `psql` SELECT argv. The SQL binding is an exact recorded query, not inferred query intent. A read observation requires a paired start/finish, matching `/workspace`, exit 0, no timeout, complete bounded stdout/stderr, and an existing numeric stdout fact representing an integer quantity. Wrong targets, DEL/FLUSHALL, failed reads, error messages, wrappers, aliases, scripts, shell expansion/compound syntax, empty/truncated output and ambiguous bindings stay generic. Unknown mapping has its own evidence-scoped limitation; it is not a capability conclusion.

Recognized verification is direct `pytest` with the narrow supported flags/path argument grammar. Existing typed-fact parser conditions exclusively authorize counts; arbitrary output saying “passed” never does. Runs with unknown output remain executions with null counts and visible status/limits. Counts do not establish identical test identities, task success or submitted-state correctness. Later edits/gaps are represented explicitly. First observed run is never called session start.

All generated factual copy goes through `briefing-wording.ts`: closed keys, validated counts and allowlisted subject labels. Candidate commands, output, patches and paths are never interpolated into narrative. They remain separate inspectable evidence data, safely serialized as JSON. Consumers must render authored context and source data as text, never HTML. There is no LLM call, psychological inference, quality score or hiring label.

The full diff parser uses the existing `diff` dependency; it validates hunk counts and handles legacy unified diffs/deleted files. Binary, quoted-path, rename/copy-only and malformed formats yield an explicit unsupported summary with null counts and accessible full diff. No diff truncation is used to compute file counts. Final-state summaries do not attribute authorship or timing.

## Depth and authorized output

`projectBriefing` is a pure wrapper around the same base briefing. Profiles are `GENERALIST_RECRUITER`, `TECHNICAL_RECRUITER`, `ENGINEER`, `ENGINEERING_MANAGER`. Default structured/technical/scenario-reference depth changes, with engineer source entries marked expanded. Every profile retains source references, verification, limitations, submitted state, and grounded factual content; each profile's explicit presentation flags determine its rendered density and source affordances. Depth is not authorization.

`GET /api/evaluator/sessions/{sessionId}/briefing` returns the base. Optional `?depth=ENGINEER` (or another supported profile) returns the projection. It uses existing evaluator-cookie evidence/reconstruction guards, exposes no attempt token or candidate credential, performs no reconstruction ensure/retry or evidence mutation, and sends private/no-store successful responses. Invalid depth returns 400; unauthorized requests retain 401. No evaluator React page or final visual design is changed.

Briefings are derived on read. No new persistent briefing truth store, generation lifecycle or workflow engine is introduced. A pending/failed v3 artifact gets an explicit availability limitation while catalog evidence and frozen diff remain accessible. Legacy provider prose never supplies verification or narrative.

## Compatibility and review artifacts

Historical C/D/F/G snapshots have no semantic metadata; their review artifacts therefore remain generic. New-session semantics are tested independently. G has neither evaluation context nor semantics: context and guidance are unavailable rather than backfilled. Missing review policy never triggers inferred organization guidance.

C's original acceptance database was available during this slice. Its existing gate-manifest event identities and diff hash were checked, and its original evidence/v3 artifact preserved in `tests/fixtures/evaluator-briefing/C.json` without rerunning history or modifying the original database. This resolves the audit's portability limitation for future static tests, without changing the older gate manifest/history. The capture procedure uses a read-only source connection and a temporary consistent SQLite backup.

[Serialized review index](../artifacts/evaluator-briefing/README.md) links C/D/F/G base models, all four complete projections, readable copy and exact refs. D exposes the exact submitted write-through operation in technical evidence without a solution classifier. F retains its historical workspace gap after later capture. Fixture-author validation is not a briefing fact. Static policy is guidance only; human review notes/status and routing remain deferred.

Targeted mapping/briefing/artifact/store/API suites test entailment conditions, source isolation, unconventional-solution neutrality, copy safety, role consistency and legacy/gap behavior. Artifact-generation flags are opt-in; normal tests compare saved output instead of overwriting it.

The foundation input contract is independent of the existing evaluator visual presentation model. It accepts the existing v3 generator metadata as either consumer `generatorVersion` or legacy storage/consumer `promptVersion`, checks the exact deterministic-v3 identity, and records it only as source provenance. This does not rewrite reconstruction or reuse its version as the briefing version.
