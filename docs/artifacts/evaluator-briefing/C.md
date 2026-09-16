# Case C — serialized briefing review

This artifact is generated from recorded evidence. It is not a candidate-quality judgment.

Full base and all four projections: [C.json](C.json).

## Base briefing

### Task context

- task_brief: attributed scenario data at `scenario:1891b6c6-2441-45ee-96c2-ff737272f682:brief` (version 1.0.0).

```json
"Warehouse staff recently restocked units of product PROD-1001 into warehouse WH-EAST-01. The database reflects the restocked quantity, but customers on the storefront are still seeing the item as out of stock.\n\nExpected Behavior:\nAfter stock is updated in the warehouse, subsequent reads from the storefront must reflect the current inventory without serving stale cached counts.\n\nEnvironment & Tools:\n- The inventory service is in /workspace (Flask app backed by PostgreSQL and Redis).\n- Tests can be run from the command console: pytest\n- PostgreSQL CLI: psql -h 127.0.0.1 -U delimit inventory\n- Redis CLI: redis-cli\n\nYour Task:\n1. Investigate the cause of the discrepancy.\n2. Implement an appropriate fix in the codebase.\n3. Verify that your change corrects the issue and does not introduce regressions.\n4. Submit your work when finished."
```

- system_invariant: attributed scenario data at `scenario:1891b6c6-2441-45ee-96c2-ff737272f682:evaluationContext.systemInvariants[0]` (version 1.0.0).

```json
"PostgreSQL is the source of truth for inventory quantity."
```

- system_invariant: attributed scenario data at `scenario:1891b6c6-2441-45ee-96c2-ff737272f682:evaluationContext.systemInvariants[1]` (version 1.0.0).

```json
"Storefront reads may use cached values, so submitted changes should be reviewed in the context of cache behavior."
```

- verification_area: attributed scenario data at `scenario:1891b6c6-2441-45ee-96c2-ff737272f682:evaluationContext.verificationTargets[0]` (version 1.0.0).

```json
"Whether recorded verification addresses recent inventory updates."
```

- verification_area: attributed scenario data at `scenario:1891b6c6-2441-45ee-96c2-ff737272f682:evaluationContext.verificationTargets[1]` (version 1.0.0).

```json
"Whether recorded verification includes equivalent valid warehouse identifiers where evidence is available."
```

- verification_area: attributed scenario data at `scenario:1891b6c6-2441-45ee-96c2-ff737272f682:evaluationContext.verificationTargets[2]` (version 1.0.0).

```json
"Whether existing inventory reads remain represented in the recorded verification evidence."
```

- interpretation_warning: attributed scenario data at `scenario:1891b6c6-2441-45ee-96c2-ff737272f682:evaluationContext.interpretationWarnings[0]` (version 1.0.0).

```json
"Related evidence identifies recorded activity associated with a scenario area; it does not establish task success or candidate competence."
```

- interpretation_warning: attributed scenario data at `scenario:1891b6c6-2441-45ee-96c2-ff737272f682:evaluationContext.interpretationWarnings[1]` (version 1.0.0).

```json
"A failing test or command can be valid investigative activity and is not a candidate verdict."
```

- interpretation_warning: attributed scenario data at `scenario:1891b6c6-2441-45ee-96c2-ff737272f682:evaluationContext.interpretationWarnings[2]` (version 1.0.0).

```json
"Not observed means Delimit recorded no evidence of that activity in the captured assessment environment. It does not mean the candidate lacks the underlying capability."
```

### Observed activity

- A test execution was recorded.
  - Statement ID: `observation:command:1891b6c6-2441-45ee-96c2-ff737272f682:cmd_81cdae66-8c85-4227-8833-f74765da596e`; source: `command:1891b6c6-2441-45ee-96c2-ff737272f682:cmd_81cdae66-8c85-4227-8833-f74765da596e`.
  - Scope: `recorded_execution`; mapping: `generic`.

- A workspace edit was recorded.
  - Statement ID: `observation:event:1891b6c6-2441-45ee-96c2-ff737272f682:evt_6a56a1ea-0d70-4cf3-b9c8-55abc60337a1`; source: `event:1891b6c6-2441-45ee-96c2-ff737272f682:evt_6a56a1ea-0d70-4cf3-b9c8-55abc60337a1`.
  - Scope: `recorded_workspace_transition`; mapping: `generic`.

- A test execution was recorded.
  - Statement ID: `observation:command:1891b6c6-2441-45ee-96c2-ff737272f682:cmd_6c6051ac-050c-472c-adfc-a7f03f723d95`; source: `command:1891b6c6-2441-45ee-96c2-ff737272f682:cmd_6c6051ac-050c-472c-adfc-a7f03f723d95`.
  - Scope: `recorded_execution`; mapping: `generic`.

- Submission was recorded.
  - Statement ID: `observation:session:1891b6c6-2441-45ee-96c2-ff737272f682:submitted`; source: `session:1891b6c6-2441-45ee-96c2-ff737272f682:submitted`.
  - Scope: `submission_boundary`; mapping: `generic`.

### Recorded verification

- The first recorded test run reported 3 failures.
  - Source: `command:1891b6c6-2441-45ee-96c2-ff737272f682:cmd_81cdae66-8c85-4227-8833-f74765da596e`; exit status: 1; timeout: false; test identity: unknown.
  - Later workspace edits: true; later capture gaps: false.

- The final recorded test run reported 3 failures.
  - Source: `command:1891b6c6-2441-45ee-96c2-ff737272f682:cmd_6c6051ac-050c-472c-adfc-a7f03f723d95`; exit status: 1; timeout: false; test identity: unknown.
  - Later workspace edits: false; later capture gaps: false.

### Submitted state

The frozen submission diff contains changes to 1 file.

Source: `session:1891b6c6-2441-45ee-96c2-ff737272f682:final-diff`. Additions: 1; deletions: 0. Paths are evidence data:

```json
["inventory/service.py"]
```

### Evidence limitations

- Scenario semantic metadata is absent; generic evidence wording is used.
  - Authority: metadata; source: `scenario:1891b6c6-2441-45ee-96c2-ff737272f682:semanticSnapshot`.

### Artifact availability

```json
{
  "reconstruction": "AVAILABLE",
  "briefing": "available",
  "submittedDiff": {
    "status": "available",
    "evidenceRefs": ["session:1891b6c6-2441-45ee-96c2-ff737272f682:final-diff"]
  },
  "context": "available",
  "semantics": "absent",
  "source": {
    "authority": "artifact_status",
    "fieldRef": "reconstruction:1891b6c6-2441-45ee-96c2-ff737272f682:evaluator-reconstruction-deterministic-v3:status",
    "version": "evaluator-reconstruction-deterministic-v3"
  }
}
```

### Review guidance

Attributed static policy context: `scenario:1891b6c6-2441-45ee-96c2-ff737272f682:evaluationContext.reviewPolicy[0]` (version 1.0.0).

```json
"Final automated verification alone is not a hiring decision for this assessment. Engineering review is required before technical rejection."
```

### Evidence index

- `session:1891b6c6-2441-45ee-96c2-ff737272f682:activated` — activation, chronology; raw IDs: session/artifact reference.
- `command:1891b6c6-2441-45ee-96c2-ff737272f682:cmd_81cdae66-8c85-4227-8833-f74765da596e` — command_execution, chronology; raw IDs: `evt_ff602f96-3cf3-4121-a871-a15bba6a19f1`, `evt_7a492a83-d4e0-4fb9-aa0b-e2bcece3e731`.
- `event:1891b6c6-2441-45ee-96c2-ff737272f682:evt_6a56a1ea-0d70-4cf3-b9c8-55abc60337a1` — workspace_change, chronology; raw IDs: `evt_6a56a1ea-0d70-4cf3-b9c8-55abc60337a1`.
- `command:1891b6c6-2441-45ee-96c2-ff737272f682:cmd_6c6051ac-050c-472c-adfc-a7f03f723d95` — command_execution, chronology; raw IDs: `evt_cc4bc3fe-737b-4461-a892-a14cbc138e71`, `evt_a7cbdda1-1089-410c-96f3-fb91fb5e1e3c`.
- `session:1891b6c6-2441-45ee-96c2-ff737272f682:submitted` — submission, chronology; raw IDs: session/artifact reference.
- `session:1891b6c6-2441-45ee-96c2-ff737272f682:final-diff` — final_diff, final_state; raw IDs: session/artifact reference.

### Provenance

```json
{
  "sessionId": "1891b6c6-2441-45ee-96c2-ff737272f682",
  "authoritativeEvidenceSha256": "d00ef781814d4a31ebdce91253e0dad01dedbd0184ec02b681cd62a459a71b45",
  "finalDiffSha256": "aa3ef7e4199eab809137b22dcb80117abd72db5d4ceef223dd13f4a1851bc4a8",
  "reconstruction": {
    "artifactId": "3ed9104f-55fc-4526-8265-d6a72aedaee2",
    "generatorVersion": "evaluator-reconstruction-deterministic-v3"
  },
  "semanticSnapshot": {
    "status": "absent",
    "contentVersion": null,
    "sha256": null
  },
  "scenarioVersion": "1.0.0",
  "scenarioSnapshotSha256": "11ff1d62775f353a72c97f14aaa29f1c92dc576d6ede95275a42fd9a2d257566",
  "evaluationContextSha256": "3c8973524a187ac1af2f77a8a9b49f2559edb25ef3f9c8c322ca3a2b777eb005",
  "evaluationContextVersion": "1.0.0",
  "mapperVersion": "briefing-mapper-v1",
  "wordingVersion": "briefing-wording-v1",
  "builderVersion": "evaluator-briefing-v1",
  "projectionVersion": "briefing-depth-v1"
}
```

## GENERALIST_RECRUITER

The projection retains every base statement ID, factual parameter, qualification, evidence reference and limitation above. The JSON artifact serializes the full projected briefing.

Default detail:

```json
{
  "structuredEvidence": false,
  "technicalRecord": false,
  "scenarioReference": false
}
```

Core recorded activity and verification copy:

- A test execution was recorded. Source: `command:1891b6c6-2441-45ee-96c2-ff737272f682:cmd_81cdae66-8c85-4227-8833-f74765da596e`.
- A workspace edit was recorded. Source: `event:1891b6c6-2441-45ee-96c2-ff737272f682:evt_6a56a1ea-0d70-4cf3-b9c8-55abc60337a1`.
- A test execution was recorded. Source: `command:1891b6c6-2441-45ee-96c2-ff737272f682:cmd_6c6051ac-050c-472c-adfc-a7f03f723d95`.
- Submission was recorded. Source: `session:1891b6c6-2441-45ee-96c2-ff737272f682:submitted`.
- The first recorded test run reported 3 failures. Source: `command:1891b6c6-2441-45ee-96c2-ff737272f682:cmd_81cdae66-8c85-4227-8833-f74765da596e`.
- The final recorded test run reported 3 failures. Source: `command:1891b6c6-2441-45ee-96c2-ff737272f682:cmd_6c6051ac-050c-472c-adfc-a7f03f723d95`.

All 6 source entries remain accessible. Material limitations and attributed guidance remain identical to the base briefing.

## TECHNICAL_RECRUITER

The projection retains every base statement ID, factual parameter, qualification, evidence reference and limitation above. The JSON artifact serializes the full projected briefing.

Default detail:

```json
{
  "structuredEvidence": true,
  "technicalRecord": false,
  "scenarioReference": true
}
```

Core recorded activity and verification copy:

- A test execution was recorded. Source: `command:1891b6c6-2441-45ee-96c2-ff737272f682:cmd_81cdae66-8c85-4227-8833-f74765da596e`.
- A workspace edit was recorded. Source: `event:1891b6c6-2441-45ee-96c2-ff737272f682:evt_6a56a1ea-0d70-4cf3-b9c8-55abc60337a1`.
- A test execution was recorded. Source: `command:1891b6c6-2441-45ee-96c2-ff737272f682:cmd_6c6051ac-050c-472c-adfc-a7f03f723d95`.
- Submission was recorded. Source: `session:1891b6c6-2441-45ee-96c2-ff737272f682:submitted`.
- The first recorded test run reported 3 failures. Source: `command:1891b6c6-2441-45ee-96c2-ff737272f682:cmd_81cdae66-8c85-4227-8833-f74765da596e`.
- The final recorded test run reported 3 failures. Source: `command:1891b6c6-2441-45ee-96c2-ff737272f682:cmd_6c6051ac-050c-472c-adfc-a7f03f723d95`.

All 6 source entries remain accessible. Material limitations and attributed guidance remain identical to the base briefing.

## ENGINEER

The projection retains every base statement ID, factual parameter, qualification, evidence reference and limitation above. The JSON artifact serializes the full projected briefing.

Default detail:

```json
{
  "structuredEvidence": true,
  "technicalRecord": true,
  "scenarioReference": true
}
```

Core recorded activity and verification copy:

- A test execution was recorded. Source: `command:1891b6c6-2441-45ee-96c2-ff737272f682:cmd_81cdae66-8c85-4227-8833-f74765da596e`.
- A workspace edit was recorded. Source: `event:1891b6c6-2441-45ee-96c2-ff737272f682:evt_6a56a1ea-0d70-4cf3-b9c8-55abc60337a1`.
- A test execution was recorded. Source: `command:1891b6c6-2441-45ee-96c2-ff737272f682:cmd_6c6051ac-050c-472c-adfc-a7f03f723d95`.
- Submission was recorded. Source: `session:1891b6c6-2441-45ee-96c2-ff737272f682:submitted`.
- The first recorded test run reported 3 failures. Source: `command:1891b6c6-2441-45ee-96c2-ff737272f682:cmd_81cdae66-8c85-4227-8833-f74765da596e`.
- The final recorded test run reported 3 failures. Source: `command:1891b6c6-2441-45ee-96c2-ff737272f682:cmd_6c6051ac-050c-472c-adfc-a7f03f723d95`.

All 6 source entries remain accessible. Material limitations and attributed guidance remain identical to the base briefing.

## ENGINEERING_MANAGER

The projection retains every base statement ID, factual parameter, qualification, evidence reference and limitation above. The JSON artifact serializes the full projected briefing.

Default detail:

```json
{
  "structuredEvidence": true,
  "technicalRecord": false,
  "scenarioReference": true
}
```

Core recorded activity and verification copy:

- A test execution was recorded. Source: `command:1891b6c6-2441-45ee-96c2-ff737272f682:cmd_81cdae66-8c85-4227-8833-f74765da596e`.
- A workspace edit was recorded. Source: `event:1891b6c6-2441-45ee-96c2-ff737272f682:evt_6a56a1ea-0d70-4cf3-b9c8-55abc60337a1`.
- A test execution was recorded. Source: `command:1891b6c6-2441-45ee-96c2-ff737272f682:cmd_6c6051ac-050c-472c-adfc-a7f03f723d95`.
- Submission was recorded. Source: `session:1891b6c6-2441-45ee-96c2-ff737272f682:submitted`.
- The first recorded test run reported 3 failures. Source: `command:1891b6c6-2441-45ee-96c2-ff737272f682:cmd_81cdae66-8c85-4227-8833-f74765da596e`.
- The final recorded test run reported 3 failures. Source: `command:1891b6c6-2441-45ee-96c2-ff737272f682:cmd_6c6051ac-050c-472c-adfc-a7f03f723d95`.

All 6 source entries remain accessible. Material limitations and attributed guidance remain identical to the base briefing.
