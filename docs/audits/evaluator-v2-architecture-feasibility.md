# Hirearchy Software Evaluator Experience v2 — architecture feasibility audit

Date: 2026-09-16. Scope: repository-grounded analysis only. No product implementation, visual redesign, Slice 6, reconstruction changes, or test implementation.

## A. Executive result — PARTIALLY READY

The authoritative substrate and presentation-only fork/join boundary are ready foundations. Deterministic v3 already supports recorded verification counts, chronology, workspace changes, submission, final diff, and explicit workspace-capture limitations. The evaluator presentation already resolves exact source references.

The proposed information model is not yet fully supported: there is no typed scenario action mapper, behavior-change classifier, independent briefing contract, structured review-routing policy, or role-depth projection. Existing path selectors establish relatedness, not behavioral meaning. Current evidence cannot establish investigation intent, understanding, competence, or general task success.

Recommendation: preserve v3 and introduce a separately versioned, deterministic, presentation-only briefing projection with narrow semantic rules and generic fallbacks. Start with observed commands, edits to named system areas, recorded test results, submission, and capture limitations. Defer assertions that behavior changed unless a dedicated conservative classifier can establish that narrower claim.

This audit describes the current working tree, including uncommitted Slice 5.1/gate work. It does not assume those changes are committed. No live containers or fixture histories were rerun. Case C has source history and manifest evidence, but no committed frozen event/output snapshot; D and F do. Static feasibility is not a claim that current verification passes.

## B. Current architecture map

Paths below are relative to the repository root `/home/mohamedsaba/Synco`.

| Stage                        | Exact implementation / contracts                                                                                                                                                                                                                                                                            | Ownership and limits                                                                                                                                                                                                                                                 |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Capture and submission       | `apps/web/src/sessions/session-service.ts`: `SessionService`, `executeCommand`, `saveWorkspaceFile`, `submit`, `getSubmittedEvidence`; `apps/web/src/sandbox/docker-sandbox-adapter.ts`; `apps/web/src/sandbox/sandbox.ts`                                                                                  | Server captures accepted commands and workspace transitions. Submission freezes server-derived final evidence; candidate mutation closes.                                                                                                                            |
| Event authority              | `apps/web/src/events/session-event.ts`: `SessionEvent`, `SessionEventType`, command/workspace/gap payloads; `sqlite-event-store.ts`: `SqliteEventStore`                                                                                                                                                     | Server sequence determines order. Implemented event union has five types: command start/finish, workspace change, capture failure, cleanup failure. Documentation's broader initial taxonomy is not implemented telemetry.                                           |
| Session authority            | `apps/web/src/sessions/session.ts`: `AssessmentSession`; `sqlite-session-store.ts`: `SqliteSessionStore`; `scenarios/slice-one-scenario.ts`: `ScenarioSnapshot`                                                                                                                                             | Activation/submission boundaries come from session records, not standalone event types. Scenario/context snapshots are persisted at creation.                                                                                                                        |
| Chronology                   | `apps/web/src/evidence/chronological-reconstruction.ts`: `SessionReconstructionInput`, `ReconstructionItem`, `buildChronologicalReconstruction`                                                                                                                                                             | Joins command completion to start by command ID; middle items ordered by sequence; session boundaries surround them; cleanup follows submission. Start-only commands do not produce completed command items. Missing starts produce explicitly unknown command text. |
| Reference catalog            | `apps/web/src/reconstruction/evidence-reference-catalog.ts`: `EvidenceCatalogEntry`, `EvidenceReferenceCatalog`, `buildEvidenceReferenceCatalog`                                                                                                                                                            | Stable command/event/session refs; separates `chronology` from `final_state`. Cleanup remains in chronology but has no catalog entry. Catalog construction precedes typed facts.                                                                                     |
| Typed facts                  | `apps/web/src/reconstruction/typed-evidence-fact.ts`: `TypedEvidenceFact`, `CommandOutputFact`, `buildTypedEvidenceFact`, `parseCommandOutputFact`                                                                                                                                                          | Activation, submission, command execution, workspace change, evidence gap. Conservative complete pytest summaries and numeric stdout; arbitrary output is not promoted to factual prose. No database/cache inspection or code-behavior fact exists.                  |
| Packet and coverage          | `apps/web/src/reconstruction/evidence-packet.ts`: `ModelEvidenceItem`, `EvidencePacketV1`, `CoverageAnchor`, `buildEvidencePacket`, `digestEvidencePacket`                                                                                                                                                  | Bounds excerpts; anchors material boundaries, reversions, gaps, progression, final command/state. Candidate brief/title/criteria remain in packet; evaluation context does not. Packet digest therefore is not wholly scenario-metadata-independent.                 |
| Deterministic reconstruction | `deterministic-evidence-reconstruction-generator.ts`: `buildDeterministicReconstruction`, `DeterministicEvidenceReconstructionGenerator`; `deterministic-reconstruction-renderer.ts`: `DeterministicStatementTrace`, rendering functions                                                                    | Version `evaluator-reconstruction-deterministic-v3`; closed templates and phase-bounded aggregation. Does not read scenario semantics. Renderer derives final paths from bounded final-diff excerpt.                                                                 |
| Validation / persistence     | `reconstruction-output-validator.ts`: `validateReconstructionOutput`; `evidence-reconstruction.ts`: `ReconstructionStatement`, `EvidenceReconstructionContentV1`, `EvidenceReconstructionRecord`; `evidence-reconstruction-service.ts`: `EvidenceReconstructionService`; SQLite reconstruction store/schema | Validates structure, same-session references, claim basis, intervening gaps, coverage, order. Available artifacts immutable and versioned. Validator is not a general natural-language entailment checker; deterministic generation is essential.                    |
| Runtime / authorization      | `evidence-reconstruction-runtime.ts`: configured service, `buildReconstructionView`, authorized get/ensure; `access/evaluator-evidence.ts`                                                                                                                                                                  | Current runtime always deterministic. Legacy prose is excluded from current summary. Authorization remains outside presentation depth.                                                                                                                               |
| Scenario context             | `scenarios/scenario-evaluation-context.ts`: `ScenarioEvaluationContextSnapshot`, `ScenarioEvidenceArea`, `ScenarioEvidenceSelector`, clone; `scenarios/scenario-001.ts`                                                                                                                                     | Immutable contextual metadata: purpose, areas, invariants, `verificationTargets`, warnings, static review-policy strings. Not observed evidence.                                                                                                                     |
| Related evidence             | `evaluator/scenario-related-evidence.ts`: `ScenarioRelatedEvidenceArea`, `buildScenarioRelatedEvidence`                                                                                                                                                                                                     | Workspace/submitted path prefixes and any parsed test summary. Rebuilds typed facts from catalog items; establishes only a relation. Does not recognize inspection commands or verification relevance.                                                               |
| Presentation                 | `evaluator/evaluator-review-presentation.ts`: `EvaluatorReviewEvidence`, `ReconstructionViewInput`, `SummaryMilestone`, `EvaluatorReviewPresentation`, `buildEvaluatorReviewPresentation`                                                                                                                   | Only current join. Assigns neutral kinds/labels, elapsed time, verification display; supplies notices, chronology, catalog and final diff. Milestones follow reconstruction statements, not every fact. Notices currently have no refs.                              |
| Submitted diff               | `SessionService.submit/getSubmittedEvidence`; session store `submitted_diff`; `evidence/unified-diff.ts`; `evidence/submitted-diff-facts.ts`: `submittedDiffPaths`, `submittedEvidencePaths`                                                                                                                | Multi-file diff frozen at submission. Legacy single-file diff derived from frozen original/submitted content. Git path parser and single-file unified-header fallback differ. Path lists alone do not identify application files or behavior changes.                |
| React / drill-down           | `apps/web/app/evaluator/sessions/[sessionId]/page.tsx`; `reconstruction-panel.tsx`, `scenario-context.tsx`, `technical-record.tsx`, `evidence-disclosure.tsx`, `evidence-item-card.tsx`, `submitted-diff.tsx`, `raw-record-card.tsx`, `summary-lifecycle-control.tsx`                                       | Page obtains authorized evidence/reconstruction and builds model. Components disclose supporting commands/output/patches and final diff; raw envelopes remain separate. Truncation is shown independently for stdout/stderr.                                         |

Actual order is **authority → chronology → catalog → typed facts/packet → reconstruction → presentation → React**, with context/relations joining at presentation. It is not events → typed facts → chronology.

Authoritative boundaries: [reconstruction architecture](../architecture/reconstruction.md), [decision 0004](../decisions/0004-scenario-context-joins-at-presentation.md), [product principles](../product/product-principles.md), [scenario constitution](../scenarios/constitution.md). No services, external models, or new dependencies are necessary for this proposal.

## C. Statement-support matrix

Classification concerns the exact sentence, with the conditions stated. “Supported” does not mean the UI emits it today.

| Example                                                             | Classification                                | Evidence and safe boundary                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| The candidate checked the affected system state.                    | SUPPORTED WITH DETERMINISTIC SEMANTIC MAPPING | Only for a narrowly recognized completed read command, known target, and usable result. Say “A recorded command read inventory state” to avoid implying comprehension or comprehensive checking. Current mapper does not do this.                                                                                  |
| The candidate checked the storefront's cached inventory.            | REQUIRES NEW SCENARIO SEMANTIC DATA           | Need immutable identity binding between a Redis key/target and storefront inventory plus conservative command recognition. Existing `redis-cli get` command evidence is available; numeric output alone does not identify cache content.                                                                           |
| The candidate changed the inventory-update behavior.                | UNSAFE / TOO INTERPRETIVE                     | Editing `service.py` or even `update_stock` does not establish changed runtime behavior. Comments, dead code and reformatting are counterexamples. Narrow fallback: edited code associated with inventory updates. A future syntactic classifier could describe specific changed operations, not certify behavior. |
| The candidate changed how updated inventory reaches the storefront. | UNSAFE / TOO INTERPRETIVE                     | Asserts a system-level causal effect. Area metadata does not prove it. Prefer “Submitted changes affect code used for inventory updates/storefront reads,” with adequately localized diff evidence.                                                                                                                |
| The candidate ran verification again.                               | SUPPORTED WITH DETERMINISTIC SEMANTIC MAPPING | At least two ordered recognized verification executions; current parsed pytest facts support the narrow form “A second pytest run was recorded.” Mere repeated arbitrary commands do not.                                                                                                                          |
| 3 recorded checks were failing at the start.                        | UNSAFE / TOO INTERPRETIVE                     | First test run does not establish state at session start. Safe replacement: “The first recorded test run reported 3 failures.” That replacement is SUPPORTED DIRECTLY by complete parsed summary.                                                                                                                  |
| 3 recorded checks passed before submission.                         | SUPPORTED DIRECTLY                            | Complete parsed pytest summary ordered before submission. Does not mean checks covered all requirements or ran against final submitted state. Prefer “A recorded test run reported 3 passes before submission.”                                                                                                    |
| The final submission changed 2 application files.                   | REQUIRES NEW SCENARIO SEMANTIC DATA           | Full authoritative diff supports distinct changed-file count; “application” needs versioned file classification. Do not count from truncated excerpt or infer runtime impact.                                                                                                                                      |
| Part of the activity record is incomplete.                          | SUPPORTED DIRECTLY                            | Explicit workspace-gap refs. Wording should retain scope: “Part of the workspace activity record is incomplete.” Does not imply terminal evidence was lost.                                                                                                                                                        |
| The recorded verification remained unresolved.                      | UNSAFE / TOO INTERPRETIVE                     | “Unresolved” is undefined and can imply task failure. Safe fact: “The final recorded test run still reported 3 failures.” A separately defined review state may say verification requires review, never issue/candidate unresolved.                                                                                |

No semantic metadata alone upgrades behavioral claims to truth. If the exact intended wording must be retained, behavior classifiers and the meaning of “checked” require explicit product decisions and validation first.

## D. Proposed scenario-semantic layer and invariant

Use three distinct objects:

1. **Author-authored definition:** a constrained `ScenarioSemanticDefinition` containing schema/content versions, neutral entity vocabulary, observable target bindings, file/region classifications, approved phrase keys, and declarative selectors. This lives with the scenario definition and is reviewed under the constitution.
2. **Immutable session binding:** optional `ScenarioSemanticSnapshot`, frozen at creation alongside evaluation context. Keep v1 evaluation context intact; do not silently change existing selector meanings. A separate optional snapshot cleanly distinguishes neutral context from executable presentation rules.
3. **Derived annotations:** a versioned `ScenarioObservationMapping` in the evaluator module, containing mapping rule IDs, exact fact/catalog refs, subject IDs, observation kinds, claim basis, bounded scope, and mapping diagnostics. Never events, typed-fact mutations, or reconstruction statements.

Prefer generic observation kinds: `recorded_read_command`, `recorded_verification_execution`, `recorded_verification_result`, `recorded_workspace_edit`, `recorded_return_to_prior_tree`, `recorded_submission`, `workspace_capture_gap`. Bind optional scenario subjects such as inventory database, storefront cache, inventory update code, storefront read code. Avoid `CHANGED_*_BEHAVIOR` initially. Verification failures/passes are result parameters, not outcome labels.

Rules must match already observed facts, not expected sequences. Inspection recognition needs executable/subcommand/target recognition, paired completion, and explicit result conditions; command text is candidate-controlled and commands may use aliases, wrappers or arbitrary scripts. Unknown, ambiguous, truncated or unsupported commands retain generic descriptions. Never execute source code to discover meaning. Never classify all `redis-cli` commands as cache inspection: `del` and `flushall` mutate state.

Path selectors remain relation-only. Region-aware classification, if later justified, must distinguish added/removed executable operations from comments and unrelated edits; deleted/unparseable code and incomplete patches fall back. A final diff can support a final-state observation, never assign action timing. For tree reversions retain the existing bounded return-to-recorded-state meaning; do not infer a changed strategy or reconstruct missing intermediate edits.

All mappings retain exact evidence refs AND semantic-snapshot/rule provenance. Multiple valid subjects may match. No match means “unclassified by these rules,” not absent capability. Conflicts degrade to generic copy with visible technical diagnostics. Do not use probabilistic confidence scores to authorize stronger wording.

Trade-offs: definition-only semantics would drift for old sessions; snapshot-only semantics need an authoring source; derived-only rules without versioned bindings lose reproducibility. Typed mapping plus frozen bindings costs modest validation/versioning work but isolates presentation and makes source lineage auditable. It fits the modular monolith; a generic rules engine is unnecessary.

Proposed boundary:

```text
immutable events + session boundaries + frozen submitted diff
                  |
            chronology → catalog → typed facts
                  |                    |
                  |                packet / coverage
                  |                    |
                  |             deterministic v3 → validation → stored reconstruction
                  |                    |                              |
                  +--------------------+------------------------------+
                                       |
                            evaluator presentation boundary
                                       |
immutable semantic snapshot → constrained mapper → semantic annotations
immutable evaluation context --------------------→ briefing assembler
organization routing policy ---------------------→ separate review guidance
                                       |
                           one versioned evaluator briefing
                                       |
                          depth projection → eventual UI

No arrow returns from semantics, briefing, roles or policy into facts,
chronology, catalog, coverage, reconstruction, submission or outcome facts.
```

The briefing assembler is an expanded presentation join, not a new upstream reconstruction stage. Its inputs are read-only. Engineering sees the unchanged audit artifact alongside briefing. Changing semantics may change derived briefing wording but cannot change any evidentiary value, order or membership. Retain original refs and expose both mapping and source evidence. Test evaluation-context isolation separately from the existing packet's candidate brief/criteria fields and digest.

## E. Proposed evaluator briefing model

Illustrative contracts only; not implemented product types:

```ts
interface EvaluatorBriefing {
  schemaVersion: 1;
  sessionId: string;
  provenance: BriefingProvenance; // evidence digest, v3 artifact ID/version,
  // semantic snapshot version/digest, mapper, templates, builder versions
  taskContext: ContextEntry[];
  activity: ObservedStatement[];
  verification: RecordedVerification;
  submission: SubmittedStateSummary;
  limitations: EvidenceLimitation[];
  availability: ArtifactAvailability;
  reviewGuidance: PolicyGuidance[];
  evidenceIndex: EvidenceReferenceIndex;
}
interface ObservedStatement {
  id: string;
  observationKind: string; // closed, schema-validated vocabulary
  basis: 'chronology' | 'final_state';
  factRefs: string[];
  evidenceRefs: [string, ...string[]];
  semanticRuleRef?: string;
  subjectRef?: string;
  scope: ObservationScope;
  wordingKey: string;
  wordingParameters: ValidatedParameters;
  technicalDetailRefs: string[];
}
```

Use discriminated entries for **context**, **observation**, **availability**, and **policy guidance**. The latter three are not interchangeable. A scenario task description and an organization instruction cannot truthfully be given event refs as if observed. Require appropriate source refs for every entry and nonempty same-session evidence refs for every candidate/activity/result/limitation statement. `factRefs` are stable derived identifiers, not substitutes for evidence refs. All supporting types are proposed, including an index resolving existing catalog refs; no new truth store is implied.

| Field            | Source / determinism / refs                                                                                                                                        | Visibility / wording / prohibited implication                                                                                                                                                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `taskContext`    | Frozen brief/context and semantic vocabulary; deterministic selection; snapshot field refs required, event refs not required                                       | All roles, with technical context expandable. Scenario-authored, optionally closed plain-language templates. Describes assignment, never candidate accomplishment.                                                                                                                    |
| `activity`       | Catalog-backed typed facts and constrained mappings; deterministic; evidence refs, fact refs, rule refs where mapped                                               | All roles share identical statements; details deepen by role. Closed generated templates with reviewed vocabulary. Never purpose, diagnosis, understanding, competence, canonical-path compliance.                                                                                    |
| `verification`   | All eligible catalog facts, not just compressed v3 milestones; deterministic ordered run records, parsed counts, commands, truncation/timeout status; refs per run | All see bounded first/latest results and caveats; technical roles see exact run scopes/results. Generated templates. Never “fix verified,” all requirements satisfied, identical tests across runs without identity evidence, or final submission verified when later edits occurred. |
| `submission`     | Frozen full diff + session submission; deterministic distinct paths and optional classified subsets; final-diff/submission refs                                    | All see submitted state; engineers see exact diff. Generated copy. Never action timing, executable behavior, correctness, authorship during gaps, or competence from count.                                                                                                           |
| `limitations`    | Explicit gaps, truncation and mapping limitations; deterministic; gap/output refs, or explicit metadata/rule refs for missing semantics                            | All roles keep material caveats. Closed templates. Never misconduct, entire session lost, or historical gap repaired by later capture. Distinguish capture loss from unsupported semantic mapping.                                                                                    |
| `availability`   | Session/reconstruction status and optional briefing status; deterministic; artifact/status refs                                                                    | All roles. Generated lifecycle copy. Never candidate outcome or unseen hiring decision. Missing context is different from missing activity.                                                                                                                                           |
| `reviewGuidance` | Structured policy plus bounded evidence conditions; deterministic given policy version; policy ref and condition evidence refs, human-action refs when applicable  | All roles see applicable routing; decision owner sees provenance. Policy-authored instruction/closed template. Never advance/reject, ranking or automatic quality recommendation.                                                                                                     |
| `evidenceIndex`  | Existing catalog, chronology, frozen diff; deterministic; resolves all cited refs within same session                                                              | Accessible drill-down for authorized evaluators; depth defaults differ. Exact evidence labels. Never separate evidence truth per role or silently missing sources.                                                                                                                    |

Avoid a single free-text `attentionItems` list: it mixes platform limitations with policy and interpretive warnings. Avoid a single overloaded `workflowState`: submission, artifact availability, verification observations and human review progress are independent axes.

## F. Role-specific presentation architecture

Produce one briefing first, then a pure `projectBriefing(briefing, depthProfile)` selects default depth and resolves approved wording/detail variants by statement ID. Roles do not run different classifiers. Core claims, ordering, refs, qualification and limitations are identical across projections.

- **Generalist recruiter:** assignment in plain language, observed edits/commands, bounded recorded results, capture caveats, policy next step; sources remain expandable.
- **Technical recruiter:** same core plus system-area names, verification scopes when known, changed-path grouping and recording limitations.
- **Engineer / technical interviewer:** same core plus exact commands/results, source chronology, diffs, mapping lineage, scenario invariants as separate context.
- **Engineering manager / decision owner:** same core plus human review status and policy routing where actually recorded; access to full evidence. No inferred decision readiness or competence label.

Depth is a presentation preference, not an authorization system. Existing evaluator cookie protection remains. No enterprise RBAC, dashboards, or separate role truth is warranted. Do not reorder observations to invent a better narrative or hide failed runs/gaps for recruiters. Test common statement IDs and parameter equality, not just similar text.

## G. Workflow-state model

Evidence alone supports independent observations: submitted/not available for submitted review; explicit capture limitation present; reconstruction preparing/available/unavailable; latest recorded run has failures, passes, timeout or no interpretable summary; context absent; changes recorded after latest verification. These say what the record contains, not what a hiring team should do.

“Evidence incomplete” must identify which evidence: workspace interval, terminal output, context, or unavailable derived artifact. No recorded tests means no parsed test summary was found, not no verification happened. A passing latest run does not resolve capture gaps.

“Engineering review needed” requires review policy or an explicit human assignment. Scenario 001 currently has a frozen policy string requiring engineering review before technical rejection; it does not require identical routing for every session and does not record review completion. Current strings are displayable context, not machine-readable organization rules.

Propose a separate minimal `ReviewRoutingPolicySnapshot` with version, source organization/policy identity, applicability, allowed evidence predicates, neutral routing action and rationale. Scenario may declare a review caveat; organization policy owns team workflow. Snapshot effective policy for reproducibility rather than silently apply today's policy retroactively. Authoring/admin UI is outside the next slice.

Review progress such as requested/completed needs explicit human records. Do not infer completion from opening evidence. Keep technical findings and human verdict separate. Prohibit candidate scores, pass/reject and advance instructions in this guidance schema. Apply review requirements neutrally across passing/failing records where policy says so; never make green counts a concealed approval.

## H. Grounded Case C / D / F examples

Each level below includes the common lower-depth statements. Source labels are expanded here so every sentence has an inspectable basis. Semantic phrasing is proposed unless identified as already factual. Fixture-author validity judgments are not candidate briefing facts.

### Case C — gate C is acceptance history B

Sources: `tests/live/scenario-acceptance-histories.ts`, history B; `tests/live/nvidia-nim-acceptance-fixtures.ts`, `applyPartialFix`; `tests/fixtures/evaluator-gate/manifest.json`, C. Recorded session `1891b6c6-2441-45ee-96c2-ff737272f682`.

- **Recruiter:** “The first and final recorded test runs each reported 3 failures.” Source: manifest C `testSummaries`, command event pairs sequences 1–2 and 4–5. “A code edit was recorded between those runs.” Source: history B ordering and manifest workspace event sequence 3.
- **Technical recruiter:** “The recorded edit was to the inventory service.” Source: `applyPartialFix` saves `inventory/service.py`; sequence 3 event `evt_6a56a1ea-0d70-4cf3-b9c8-55abc60337a1`. “Verification was run again after that edit.” Source: history B second `pytest`, manifest sequences 4–5.
- **Engineer:** “The fixture's edit adds `invalidate_cached_stock(warehouse_id, product_id)` after the database update call.” Source: exact replacement in `applyPartialFix`; this is source-history analysis, not a presently portable diff citation. “The gate manifest records failure summaries for both pytest executions.” Source: manifest and history B. Do not claim the same three individual tests failed without full identity/output evidence.

Manifest raw finished IDs: `evt_7a492a83-d4e0-4fb9-aa0b-e2bcece3e731`, `evt_a7cbdda1-1089-410c-96f3-fb91fb5e1e3c`. The repository has no `C.json`; its manifest refers to the original temporary acceptance database. Therefore these are grounded repository audit examples, not a full frozen-output replay or resolved command-ref list. Rehydrate/reproduce separately before making a portable exact-output gate. Do not say diagnosed, improved, fixed, or rejected. “Engineering review needed” can be an instruction only under applicable policy.

### Case D — alternative write-through implementation

Source: `tests/fixtures/evaluator-gate/D.json`. Session `ddd5ad93-4144-407e-a11f-5934044ebcfa`. Define refs:

- D-edit = `event:ddd5ad93-4144-407e-a11f-5934044ebcfa:evt_fcab2b93-951a-4b6e-8605-adb2d2c77ae2`.
- D-first = `command:ddd5ad93-4144-407e-a11f-5934044ebcfa:cmd_3fbd7bc8-e1b7-4eb7-a510-8b3d2cd925e2`.
- D-extra = `command:ddd5ad93-4144-407e-a11f-5934044ebcfa:cmd_e90a3088-118f-4395-9788-66efb6c80702`.
- D-last = `command:ddd5ad93-4144-407e-a11f-5934044ebcfa:cmd_69d583f5-e67b-4ce8-885f-b0408d1fe252`.
- D-final = `session:ddd5ad93-4144-407e-a11f-5934044ebcfa:final-diff`.

**Recruiter:** “The submission contains changes to one file.” [D-final] “Two recorded test runs each reported 3 passes.” [D-first, D-last] No initial failure exists in this case.

**Technical recruiter:** “The changed file is the inventory service.” [D-edit, D-final; scenario subject mapping proposed] “An additional recorded Python command completed with exit status 0 between the two test runs.” [D-extra, D-first, D-last] Do not convert its arbitrary printed message into a typed test-summary fact.

**Engineer:** “The submitted diff adds warehouse normalization in `get_stock` and `update_stock`, and adds `set_cached_stock(..., new_quantity)` after `execute(...)` in `update_stock`.” [D-final, exact diff; this is technical source description, not automatic current briefing output] “The intervening Python command contains assertions covering identifier aliases, cached zero, distinct products, missing inventory and database quantity; it exited 0.” [D-extra, exact command and completion] “The first passing pytest run follows recorded Redis reset, seeding and key deletion.” [D-first plus command refs for `cmd_217db507-e43f-4529-97d9-734799ee3e73`, `cmd_6436a739-0222-4269-92f5-6a78c1ae06ed`, `cmd_a1e76b49-3d93-47b3-b0ca-f9d97e930277`, same session]

The fixture README explains scenario-valid alternative behavior and limits: serial operations/available Redis, no validated concurrent cache-fill races, external writers, Redis failure or production performance. That is fixture-review context, not an automatic guarantee or competence fact. Mapper must not require `cache.py` edits or invalidation calls. Keep neutral fallback for other valid solutions.

### Case F — historical capture gap, later state capture

Source: `tests/fixtures/evaluator-gate/F.json`. Session `72b2de14-8035-4df2-a3cc-1457cfe07811`.

- F-gap = `event:72b2de14-8035-4df2-a3cc-1457cfe07811:evt_a0773275-493b-4e34-a9f6-78bec0eef6ad` (sequence 5, post-command).
- F-later = `event:72b2de14-8035-4df2-a3cc-1457cfe07811:evt_99e460b1-a0af-4d9d-a59b-6410e6db18e0` (sequence 6, out-of-band).
- F-read = `command:72b2de14-8035-4df2-a3cc-1457cfe07811:cmd_d2526894-3a50-417c-a151-efe482474915`.
- F-write-command = `command:72b2de14-8035-4df2-a3cc-1457cfe07811:cmd_2cadd252-5b46-490f-a2e1-b8c3ee29f193`.
- F-final = `session:72b2de14-8035-4df2-a3cc-1457cfe07811:final-diff`.

**Recruiter:** “Part of the workspace activity record is incomplete.” [F-gap] “Later workspace changes and the submitted changes are available.” [F-later, F-final] “The submitted change adds a comment.” [F-final; exact patch source, future classifier if generated]

**Technical recruiter:** “The submitted comment is in the inventory service file.” [F-final] “The later recorded workspace transition was captured between actions.” [F-later] “No parsed test-summary facts appear in this record.” [all command entries in F.json, bounded record-level negative; do not say verification never occurred]

**Engineer:** “The recorded append-comment command completed, but its post-command workspace capture failed.” [F-write-command, F-gap] “The following out-of-band transition records the comment addition; a later `cat inventory/service.py` output includes it.” [F-later, F-read] “The frozen diff adds `# evaluator gate fixture note`.” [F-final]

Later capture establishes later state, not complete intermediate history or recovered action attribution. The outage was injected by `GapSandbox` in the live fixture runner, not evidence of candidate misconduct or a natural production outage. A comment in `service.py` must never trigger “changed inventory-update behavior.”

## I. Copy safety matrix

| Copy                                                 | Classification                   | Exact reason / permitted replacement                                                                                                                                                                          |
| ---------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The candidate investigated the issue.                | TOO INTERPRETIVE                 | Assigns purpose and a coherent investigation to activity. List observed reads/commands instead.                                                                                                               |
| The candidate checked the cache.                     | SAFE ONLY WITH SPECIFIC EVIDENCE | Recognized completed cache read and bound target/result; preferably “A recorded command read the storefront cache.” No comprehension claim.                                                                   |
| The candidate diagnosed the root cause.              | UNSAFE                           | Hidden understanding/diagnosis cannot be established by changes or tests. A captured candidate explanation is an attributed statement, not certified diagnosis.                                               |
| The candidate fixed the issue.                       | UNSAFE                           | General issue resolution exceeds supplied run results and diff. State recorded passes and submitted changes separately.                                                                                       |
| The candidate changed the inventory update behavior. | SAFE ONLY WITH SPECIFIC EVIDENCE | Requires evidence establishing a particular behavior difference; path-only selectors do not qualify. Currently unsupported as generic automatic copy. Describe added operation or edited update code instead. |
| The candidate verified the fix.                      | TOO INTERPRETIVE                 | Presupposes a fix and sufficient verification. “A recorded test run reported…”                                                                                                                                |
| The candidate ran verification.                      | SAFE ONLY WITH SPECIFIC EVIDENCE | Recognized verification command/result; invocation alone permits only command invocation, not completion or success. Narrow pytest execution is directly factual.                                             |
| The candidate tried another approach.                | TOO INTERPRETIVE                 | Reversion/subsequent edits do not establish intent or a changed strategy. Describe ordered changes.                                                                                                           |
| The candidate reverted an earlier change.            | SAFE ONLY WITH SPECIFIC EVIDENCE | Need observed return to a prior tree plus adequate action attribution. Current safe automatic sentence is “The workspace returned to a previously recorded state,” especially for out-of-band changes.        |

A SAFE FACTUAL baseline is “A recorded pytest run reported 3 failures” or “The submitted diff includes changes to one file,” when their complete source conditions hold. None of the broad candidate-intent examples is universally safe without evidence conditions. Preserve modality and scope in every role variant.

## J. Data gaps

| Category                           | Missing support / bounded response                                                                                                                                                                                                                                                                    |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Captured, not semantically modeled | Database/cache read command meaning; target identities; exact changed operations/regions; command scope and setup/reset context; ordering of all verification runs versus later edits; explicit separate truncation/gap annotations in briefing. Reuse existing data; do not change typed-fact truth. |
| Scenario metadata                  | Frozen plain-language task summary, system vocabulary, target bindings, application/test/document classifications, neutral verification-scope bindings, approved phrases. Metadata identifies referents, not task success.                                                                            |
| Evidence classification            | Conservative read/verification recognizers; executable-edit versus comment classification; test case identity and per-run comparability; interpreter/wrapper handling; named assertion scopes. General arbitrary scripts and outputs remain unsupported.                                              |
| Product policy                     | Meaning of “checked,” “behavior changed,” “unresolved”; role depth defaults; applicable organization routing; how human reviews are requested/completed; whether/how briefings are persisted/exported; acceptable legacy semantic enrichment. Proposals here are not silently adopted rules.          |
| Truly unobservable                 | Intent, reasoning, root-cause understanding, competence, external activity, manually typed code origin, unrecorded AI use, missing intermediate history, production correctness outside exercised conditions. Do not collect surveillance to fill these gaps.                                         |

Runtime does not capture candidate AI/file-open/read events simply because documentation mentions them. A supported terminal read is an observed command; file contents being opened in the editor are not currently an observable reading/understanding fact. Existing v3 summaries are bounded, so derive verification inventories from catalog facts, not from summary prose. Start-only commands remain inspectable raw records but not completed executions.

## K. Compatibility / migration plan

1. Leave deterministic v3 generator/version, packet, validator, stores, coverage and APIs' existing reconstruction meanings intact. Never rewrite available artifacts or frozen submitted diffs.
2. Add optional semantic snapshot only for newly created sessions through an additive migration. Validate schema at ingestion/loading in future implementation. Continue loading v1 context unchanged; unknown semantic versions yield explicit generic fallback, not guessed interpretation.
3. Existing sessions with context but no semantic snapshot receive generic evidence briefing. Legacy sessions without context retain explicit context-unavailable messaging and full existing evidence. Do not backfill today's scenario semantics as historical author context.
4. If retrospective enrichment is later approved, record it as separately versioned present-day presentation enrichment with its own provenance; do not alter historical scenario snapshots. This is not required for the first slice.
5. Keep briefing version separate from reconstruction `prompt_version`/consumer `generatorVersion`. Briefing provenance includes authoritative evidence digest, full final-diff hash, source v3 artifact ID/version, semantic snapshot digest/version, mapper/template/builder versions, and applicable policy version. Existing packet digest includes candidate context, so it is not the sole evidence identity.
6. Initially derive briefing on authorized read; no second durable truth store or separate generation lifecycle is necessary. If cached/exported later, use immutable derived versions keyed by all source/version inputs. Preserve historical exports.
7. Missing/failed briefing leaves reconstruction, chronology, direct disclosures and submitted diff usable. No raw source is replaced by paraphrase. When v3 is pending/failed, return explicit partial availability with source-backed independent context/diff facts rather than claim a complete briefing.
8. Preserve A–G fixtures and D's alternative validity. Add new assertions later, never rewrite golden evidence to improve stories. C's portability limitation remains explicit until a separately authorized capture is made.

## L. Proposed test plan — no tests implemented

- **Mapping correctness:** exact supported commands/targets, successful versus failed read, null/timeout results, Redis read versus mutation, quoted targets, prefix boundaries, unknown wrappers/scripts, ambiguous mappings. Reject accidental broad matches; retain generic fallback.
- **Semantic source integrity:** every observation resolves nonempty same-session evidence refs, valid rule/snapshot lineage and proper chronology/final-state basis; reject foreign/dangling refs and context used as observed proof.
- **Isolation:** mutate/remove context, semantic definitions, role profile and policy. Chronology/catalog/facts/v3 text/coverage/submission/diff stay identical. Candidate brief changes may change packet digest; do not write a misleading whole-packet equality test.
- **No preferred path:** D stays neutral with no `cache.py` edit/invalidation; unchanged areas produce no missing-capability item. Include unknown yet valid approach falling back generically. Test behavior descriptions by evidence, not matching canonical patch.
- **Wording grounding:** pair each supported template and parameter set with the exact entailment conditions. F comment-only edit never becomes behavior change; failures never become task failure. Unknown/truncated summaries create no counts. Plain-language variants keep “recorded” and temporal scope.
- **No psychological/quality inference:** schema denies intent/competence/verdict fields; reviewed template allowlist plus adversarial candidate filenames, command output and comments containing flattering/derogatory text. Forbidden-word scans alone are insufficient.
- **Verification chronology:** first observed run is not session start; counts do not imply identical test identities; later edits invalidate any “verified submitted state” phrase; reset/reseed remains available; arbitrary printed “passed” is not a test fact.
- **Role consistency:** core IDs, parameters, refs, basis/order and material caveats agree across all profiles. All profiles can reach source evidence; difference is default detail only.
- **Gaps:** F retains historic limitation after later capture; no inferred lost duration/count/action origin; stdout/stderr truncation is independent from workspace gaps; aggregation never hides intervening gaps.
- **Legacy:** G absent context, old single-file unified diff, missing semantic snapshot, unknown semantic schema, earlier experimental reconstruction versions, pending/failed v3. Preserve current fallback/access rules and never substitute legacy prose.
- **Workflow:** evidence conditions produce observations only; engineering routing requires applicable versioned policy; human completion requires human record; both passing/failing cases retain identical policy semantics where applicable. No auto advance/reject.
- **Integration/regression:** extend existing `tests/unit/evaluator-review-presentation.test.ts`, typed-fact/chronology/reconstruction suites, legacy upgrade and `tests/integration/evaluator-gate-fixtures.test.tsx`; add pure mapper/briefing/projection suites when implementation is authorized. Run `npm run verify` and relevant integration checks for that future slice. Live gate capture is separate from static snapshot checks.

## M. Risks / open questions

1. **Terminology inflation:** “changed code” becoming “changed behavior,” then “fixed.” Proposed first-slice vocabulary intentionally stays weaker.
2. **Authored-text authority:** scenario labels can smuggle judgment despite deterministic selection. Require neutral vocabulary/schema review; no free-form generated summaries.
3. **False negatives / unconventional approaches:** narrow mapping misses useful work. Explicit generic fallbacks and no missing-area verdict are essential.
4. **Compression:** v3 does not include every command/test run. Briefing must use catalog-backed facts and preserve required limitations, not infer absence from omitted milestones.
5. **Target spoofing / uncertain execution:** command text/output are candidate-controlled. Recognition describes recorded operation/results, not certified environmental truth or all commands in a compound script.
6. **Policy drift:** routing can become rejection by another name. Keep policy separate, visible, versioned and bounded to review actions.
7. **Historical gaps:** later final state does not recover action sequence. F is a mandatory regression counterexample.
8. **Current boundaries:** candidate context is in packet; cleanup lacks catalog refs; notices lack refs; broad scenario `inventory/`/`tests/` selectors do not distinguish meanings. These are implementation limits, not permission to weaken constraints.
9. **Unresolved decisions:** approve exact “checked” wording; whether to permit any behavior-level generated assertions; where effective routing policy is frozen; whether role profiles are preferences only; persistence/export needs; reviewer usability validation. No persona validation exists in gate fixtures.

## N. Exact recommendation for the next implementation slice

Propose **Evaluator briefing foundation**, separately authorized and explicitly not Slice 6. Before implementation, document acceptance of the expanded presentation-only join and the conservative vocabulary in a decision/active plan; this report is a proposal, not an accepted policy change.

Smallest coherent deliverable: pure briefing contract/builder and depth projection, optional immutable semantic snapshot for future sessions, constrained recognition of supported recorded reads/pytest executions, scenario subjects for neutral edited-code areas, complete evidence lineage, capture limitations, and generic legacy fallback. Keep technical v3 audit artifact untouched. Demonstrate model output for C/D/F/G using existing evidence, without a visual redesign. A reviewable serialized briefing is sufficient for the first foundation slice.

Include substantive mapping/isolation/grounding/role/gap/legacy tests and required repository verification. Do not add organization workflow storage, human verdicts, AI paraphrasing, canonical solution recognizers, broad code-behavior inference, new telemetry, RBAC, dependencies or infrastructure. Show existing static review-policy text as context; machine-generated routing remains deferred until a policy decision is approved.

Acceptance: same v3 reconstruction and source refs; C says recorded failures, D remains equally expressible without canonical edits, F never says behavior changed or gap repaired, G remains readable without invented historical context; every factual briefing observation has exact source refs and every role retains its meaning and caveats.

**Stop here. No implementation is authorized by this audit.**

## Accepted implementation references

- [Final reconciled product/experience specification](../product/evaluator-v2-design-specification.md)
- [Briefing foundation architecture](../architecture/evaluator-briefing.md)
- [Presentation boundary decision](../decisions/0005-briefing-semantics-remain-presentation-only.md)
- [Implementation plan](../plans/completed/053-evaluator-briefing-foundation.md)

The audit above remains the architecture source of truth; its original analysis-only scope does not override the later explicit foundation implementation authorization.
