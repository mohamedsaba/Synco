# Delimit Evaluator Experience v2: Final Reconciled Specification

---

## Part 1: Corrected Sections

### Correction 1 (Session Activity Phrasing)

- **Replaced:** `"The session began with an initial automated test run."`
- **Corrected:** `"The first recorded test run reported 3 failures."`

### Correction 2 (Removal of Purpose Language in Commands)

- **Replaced:** `"commands recorded inspecting container environment and logs"`
- **Corrected:** `"Recorded commands included cat /var/log/inventory.log, psql, and redis-cli."`

### Correction 3 (Case C Phrasing)

- **Replaced:** `"Automated verification remained unresolved at submission..."` and `"diagnostic approach"`
- **Corrected:**
  > _"The final recorded test run reported 3 failures. A failing test run does not establish candidate incompetence or failure. Engineering review is required to evaluate the submitted implementation and supporting technical evidence."_

### Correction 4 & 5 (Case D Neutrality & Invariant Precision)

- **Replaced:** References to _"canonical solution"_, _"reference solution"_, _"The candidate adopted a write-through approach"_, and generalized _"Invariant verification confirmed PostgreSQL remains authoritative"_.
- **Corrected:**
  > _"The submitted diff implements a write-through cache update in inventory/service.py by writing the updated quantity to the storefront Redis key following the database commit. Supplied pytest runs and recorded scenario checks reported passing outcomes before submission."_

### Correction 6 (Case F Bounded Capture Language)

- **Replaced:** `"fully captured"`
- **Corrected:**
  > _"Later workspace activity was recorded, and the frozen submitted diff is available. This limitation reflects an internal platform recording interruption and must not be treated as candidate omission or misconduct."_

### Correction 7 (Source Category Grounding Invariant)

- **Replaced:** `"Every statement in Layer 1 maps 1:1 to a typed record..."`
- **Corrected:**
  > _"Every factual candidate/activity statement maps to authoritative evidence._  
  > _Task context maps to an immutable scenario snapshot._  
  > _Review guidance maps to a versioned policy source._  
  > _Platform availability/limitation statements map to system state._  
  > _These source categories must remain visibly and architecturally distinct."_

### Correction 8 (Compatibility Claim Verification Boundary)

- **Replaced:** `"Fully compatible with Scenario 001, Validation Cases A–G..."`
- **Corrected:**
  > _"Designed to preserve compatibility with Scenario 001, Validation Cases A–G, and deterministic v3 reconstruction."_

---

## Part 2: Final Consolidated Evaluator-v2 Design Specification

### 1. Design Thesis

**"Delimit carries the technical complexity so the evaluator doesn’t have to—without stating or implying anything that exceeds observable evidence."**

Evaluator v2 decouples high-fidelity technical evidence from presentation complexity while strictly preserving epistemic boundaries:

1. **Observable Action vs. Inferred Mind:** Telemetry records commands, file edits, exit codes, and timestamps. It does not record diagnosis, intent, hypotheses, strategies, competence, or understanding.
2. **Recorded Verification vs. Production Correctness:** An automated test run reporting passes reflects only the execution of that specific test suite in that environment at that recorded timestamp. It does not establish overall production correctness or task success.
3. **Neutrality of Outcome:** Failing test runs do not establish candidate incompetence. Passing test runs do not establish candidate quality. The human evaluator owns all judgment and verdicts.
4. **Platform Honesty:** Recording interruptions belong strictly to the platform as explicit telemetry limitations. They are never framed as candidate omissions or suspicious behavior.

---

### 2. Information Architecture & The Three Layers

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                      SESSION INFORMATION ARCHITECTURE                         │
├───────────────────────────────────────────────────────────────────────────────┤
│ LAYER 1: UNDERSTANDING (Plain English, Role-Appropriate Depth)                │
│  ├── The Task (Contextual problem statement from scenario snapshot)           │
│  ├── Summary of Recorded Activity (Factual observed actions)                  │
│  ├── Recorded Verification (First and final recorded test runs)               │
│  └── Review Guidance (Authoritative scenario policy)                          │
├───────────────────────────────────────────────────────────────────────────────┤
│ LAYER 2: STRUCTURED EVIDENCE (Progressive Disclosure)                         │
│  ├── Recorded Activity Sequence (Timestamps, commands, edits)                 │
│  ├── File Delta Summary (Files modified, line counts)                         │
│  └── Recorded Test Summaries (Pass/fail counts, exit codes)                   │
├───────────────────────────────────────────────────────────────────────────────┤
│ LAYER 3: TECHNICAL RECORD (Unabridged Proof)                                  │
│  ├── Submitted Diff Viewer (Authoritative baseline diff)                      │
│  ├── Process I/O Streams (Stdout/stderr with truncation limits)               │
│  └── Raw Event Store (application-recorded append-only JSON event records)   │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

### 3. Role-Lens Views

#### Generalist Recruiter View

1. **The Task:** Plain-language statement of the problem from the immutable scenario snapshot.
2. **What Was Recorded:**
   - _"The first recorded test run reported 3 failures."_
   - _"Code edits were recorded across 2 files associated with the inventory service."_
   - _"A recorded test run reported 3 passes before submission."_
3. **Verification Summary:** Factual counts of initial and final recorded test runs (e.g., initial: 3 failures; submission: 3 passes).
4. **Submitted Changes Summary:** File count and net line delta with an expandable link to the diff.
5. **Review Guidance:** Clear notice that automated checks do not establish overall code quality or competence, and that policy requires engineering review.
6. **Action:** `[ Request Engineering Review ]`.

#### Technical Recruiter View

1. **Technical Footprint:** Specific files modified (`inventory/service.py`, `inventory/cache.py`) and net line changes.
2. **Tooling Recorded:** Specific commands executed (e.g., `pytest`, `psql`, `redis-cli`).
3. **Verification Chronology:** Sequence of test executions with timestamps, test suite identifiers, and pass/fail counts.
4. **Review Guidance:** Technical context notes from the scenario specification to assist in technical phone screen preparation.
5. **Evidence Links:** Direct controls to inspect the submitted diff and terminal activity log.

#### Engineering Evaluator View

1. **Split-Screen Layout:** Chronological activity feed on the left; syntax-highlighted submitted diff on the right.
2. **Activity Chronology:** Pure observable events (`CMD`, `EDIT`, `OUTPUT`) with exact timestamps and durations.
3. **Terminal Output Inspector:** Standard output and standard error previews with explicit truncation indicators where applicable.
4. **Scenario Guidance:** Immutable scenario invariants and verification areas displayed as non-prescriptive reference context.

#### Engineering Manager View

1. **Submission Synthesis:** Scenario metadata, elapsed time, and artifact availability confirmation.
2. **Outcomes Summary:** Factual test summary results and total modified code surface.
3. **Evidence Limitations:** Explicit disclosures of any platform recording limits or untested environmental assumptions.
4. **Handoff:** Central link to review engineering evaluation notes and inspect technical records.

---

### 4. Component System Aligned to Data Model

```
┌───────────────────────────────┬────────────────────────────────────────┐
│ Semantic Data Category        │ UI Component Implementation            │
├───────────────────────────────┼────────────────────────────────────────┤
│ 1. Task Context               │ <TaskBriefBanner />                    │
│ 2. Observed Activity          │ <ChronologicalActivityFeed />          │
│ 3. Recorded Verification      │ <VerificationRunCard />                │
│ 4. Submitted State            │ <AuthoritativeDiffViewer />            │
│ 5. Evidence Limitations       │ <PlatformLimitationAlert />            │
│ 6. Artifact Availability      │ <ArtifactStatusHeader />               │
│ 7. Review Guidance            │ <ScenarioPolicyNotice />               │
│ 8. Evidence Index             │ <EvidenceReferenceDrawer />            │
└────────────────────────────────┴────────────────────────────────────────┘
```

---

### 5. Grounded Case Walkthroughs

#### Case C: Unresolved Verification

- **Repository Evidence:** Initial test run reported 3 failures; code edit recorded in `inventory/service.py`; final test run reported 3 failures.
- **UI Presentation:**
  - Summary: _"The first recorded test run reported 3 failures. A code edit was recorded in inventory/service.py. The final recorded test run reported 3 failures."_
  - Review Guidance: _"The final recorded test run reported 3 failures. A failing test run does not establish candidate incompetence or failure. Engineering review is required to evaluate the submitted implementation and supporting technical evidence."_

#### Case D: Valid Alternative Implementation (Write-Through Cache)

- **Repository Evidence:** Edits recorded only in `inventory/service.py` (updating Redis storefront key on PostgreSQL commit). `inventory/cache.py` untouched. Supplied pytest runs reported 3 passes.
- **UI Presentation:**
  - Summary: _"The submitted diff implements a write-through cache update in inventory/service.py by writing the updated quantity to the storefront Redis key following the database commit. Supplied pytest runs and recorded scenario checks reported passing outcomes before submission."_
  - Review Guidance: _"Review the submitted implementation to evaluate the concurrency and operational characteristics of write-through caching in this service architecture."_

#### Case F: Incomplete Workspace Capture

- **Repository Evidence:** Test adapter recorded `WORKSPACE_CAPTURE_FAILED`. Later workspace edit and terminal command recorded. Final submission diff exists and is frozen.
- **UI Presentation:**
  - Platform Alert: _"Platform notice: An intermediate workspace capture failure was recorded by the platform during this session. Later workspace activity was recorded, and the frozen submitted diff is available. This limitation reflects an internal platform recording interruption and must not be treated as candidate omission or misconduct."_

---

### 6. Epistemic Architecture Invariants

1. **Category Separation:**
   - Every factual candidate/activity statement maps to authoritative evidence.
   - Task context maps to an immutable scenario snapshot.
   - Review guidance maps to a versioned policy source.
   - Platform availability/limitation statements map to system state.
   - These source categories must remain visibly and architecturally distinct.
2. **Compatibility Target:**
   - Designed to preserve compatibility with Scenario 001, Validation Cases A–G, and deterministic v3 reconstruction.
3. **Visual & Interaction Contract:**
   - Bright, calm, tactile editorial presentation.
   - No candidate scoring, letter grades, percentile ranks, or automated pass/fail badges.
   - Progressive disclosure from Layer 1 understanding down to Layer 3 raw records on demand.

---

## Part 3: Confirmation of Scope

No new features, speculative workflows, code implementations, or scope expansions were added. All edits strictly reconciled phrasing, epistemic boundaries, and component-to-data-model mappings against the authoritative repository evidence model.

---

## Repository cross-references

The accepted specification above is preserved from the supplied final reconciled document. These links are repository navigation, not additional product requirements.

- [Architecture source of truth](../audits/evaluator-v2-architecture-feasibility.md)
- [Evaluator architecture](../architecture/evaluator-experience.md)
- [Briefing foundation architecture](../architecture/evaluator-briefing.md)
- [Presentation boundary decision](../decisions/0005-briefing-semantics-remain-presentation-only.md)
- [Foundation implementation plan](../plans/completed/053-evaluator-briefing-foundation.md)
