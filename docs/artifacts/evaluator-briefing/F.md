# Case F — serialized briefing review

This artifact is generated from recorded evidence. It is not a candidate-quality judgment.

Full base and all four projections: [F.json](F.json).

## Base briefing

### Session duration

- 1s (status: available, elapsed ms: 1550).

### Task context

- task_brief: attributed scenario data at `scenario:72b2de14-8035-4df2-a3cc-1457cfe07811:brief` (version 1.0.0).

```json
"Warehouse staff recently restocked units of product PROD-1001 into warehouse WH-EAST-01. The database reflects the restocked quantity, but customers on the storefront are still seeing the item as out of stock.\n\nExpected Behavior:\nAfter stock is updated in the warehouse, subsequent reads from the storefront must reflect the current inventory without serving stale cached counts.\n\nEnvironment & Tools:\n- The inventory service is in /workspace (Flask app backed by PostgreSQL and Redis).\n- Tests can be run from the command console: pytest\n- PostgreSQL CLI: psql -h 127.0.0.1 -U hirearchy inventory\n- Redis CLI: redis-cli\n\nYour Task:\n1. Investigate the cause of the discrepancy.\n2. Implement an appropriate fix in the codebase.\n3. Verify that your change corrects the issue and does not introduce regressions.\n4. Submit your work when finished."
```

- system_invariant: attributed scenario data at `scenario:72b2de14-8035-4df2-a3cc-1457cfe07811:evaluationContext.systemInvariants[0]` (version 1.0.0).

```json
"PostgreSQL is the source of truth for inventory quantity."
```

- system_invariant: attributed scenario data at `scenario:72b2de14-8035-4df2-a3cc-1457cfe07811:evaluationContext.systemInvariants[1]` (version 1.0.0).

```json
"Storefront reads may use cached values, so submitted changes should be reviewed in the context of cache behavior."
```

- verification_area: attributed scenario data at `scenario:72b2de14-8035-4df2-a3cc-1457cfe07811:evaluationContext.verificationTargets[0]` (version 1.0.0).

```json
"Whether recorded verification addresses recent inventory updates."
```

- verification_area: attributed scenario data at `scenario:72b2de14-8035-4df2-a3cc-1457cfe07811:evaluationContext.verificationTargets[1]` (version 1.0.0).

```json
"Whether recorded verification includes equivalent valid warehouse identifiers where evidence is available."
```

- verification_area: attributed scenario data at `scenario:72b2de14-8035-4df2-a3cc-1457cfe07811:evaluationContext.verificationTargets[2]` (version 1.0.0).

```json
"Whether existing inventory reads remain represented in the recorded verification evidence."
```

- interpretation_warning: attributed scenario data at `scenario:72b2de14-8035-4df2-a3cc-1457cfe07811:evaluationContext.interpretationWarnings[0]` (version 1.0.0).

```json
"Related evidence identifies recorded activity associated with a scenario area; it does not establish task success or candidate competence."
```

- interpretation_warning: attributed scenario data at `scenario:72b2de14-8035-4df2-a3cc-1457cfe07811:evaluationContext.interpretationWarnings[1]` (version 1.0.0).

```json
"A failing test or command can be valid investigative activity and is not a candidate verdict."
```

- interpretation_warning: attributed scenario data at `scenario:72b2de14-8035-4df2-a3cc-1457cfe07811:evaluationContext.interpretationWarnings[2]` (version 1.0.0).

```json
"Not observed means Hirearchy Software recorded no evidence of that activity in the captured assessment environment. It does not mean the candidate lacks the underlying capability."
```

### Observed activity

- A command execution was recorded.
  - Statement ID: `observation:command:72b2de14-8035-4df2-a3cc-1457cfe07811:cmd_53fb7ecc-aa9c-419e-89f3-9393ed9ec81e`; source: `command:72b2de14-8035-4df2-a3cc-1457cfe07811:cmd_53fb7ecc-aa9c-419e-89f3-9393ed9ec81e`.
  - Scope: `recorded_execution`; mapping: `generic`.

- A command execution was recorded.
  - Statement ID: `observation:command:72b2de14-8035-4df2-a3cc-1457cfe07811:cmd_2cadd252-5b46-490f-a2e1-b8c3ee29f193`; source: `command:72b2de14-8035-4df2-a3cc-1457cfe07811:cmd_2cadd252-5b46-490f-a2e1-b8c3ee29f193`.
  - Scope: `recorded_execution`; mapping: `generic`.

- Hirearchy Software did not capture part of the workspace history during this interval. Later recorded activity and the frozen submitted diff remain available.
  - Statement ID: `observation:event:72b2de14-8035-4df2-a3cc-1457cfe07811:evt_a0773275-493b-4e34-a9f6-78bec0eef6ad`; source: `event:72b2de14-8035-4df2-a3cc-1457cfe07811:evt_a0773275-493b-4e34-a9f6-78bec0eef6ad`.
  - Scope: `workspace_interval`; mapping: `generic`.

- Code was modified in inventory/service.py.
  - Statement ID: `observation:event:72b2de14-8035-4df2-a3cc-1457cfe07811:evt_99e460b1-a0af-4d9d-a59b-6410e6db18e0`; source: `event:72b2de14-8035-4df2-a3cc-1457cfe07811:evt_99e460b1-a0af-4d9d-a59b-6410e6db18e0`.
  - Scope: `recorded_workspace_transition`; mapping: `generic`.

- A command execution was recorded.
  - Statement ID: `observation:command:72b2de14-8035-4df2-a3cc-1457cfe07811:cmd_d2526894-3a50-417c-a151-efe482474915`; source: `command:72b2de14-8035-4df2-a3cc-1457cfe07811:cmd_d2526894-3a50-417c-a151-efe482474915`.
  - Scope: `recorded_execution`; mapping: `generic`.

- The work was submitted.
  - Statement ID: `observation:session:72b2de14-8035-4df2-a3cc-1457cfe07811:submitted`; source: `session:72b2de14-8035-4df2-a3cc-1457cfe07811:submitted`.
  - Scope: `submission_boundary`; mapping: `generic`.

### Recorded verification

No recognized recorded test executions appear in this bounded record. This does not establish absence of other verification.

### Submitted state

The submission includes changes to 1 file.

Source: `session:72b2de14-8035-4df2-a3cc-1457cfe07811:final-diff`. Additions: 1; deletions: 0. Paths are evidence data:

```json
["inventory/service.py"]
```

### Evidence limitations

- Scenario-specific descriptions are not configured for this session. Standard activity records remain available.
  - Authority: metadata; source: `scenario:72b2de14-8035-4df2-a3cc-1457cfe07811:semanticSnapshot`.

- Hirearchy Software did not capture part of the workspace history during this interval. Later recorded activity and the frozen submitted diff remain available.
  - Authority: evidence; source: `event:72b2de14-8035-4df2-a3cc-1457cfe07811:evt_a0773275-493b-4e34-a9f6-78bec0eef6ad`.

- Some recorded commands do not have scenario-specific descriptions. Their exact technical records remain available.
  - Authority: evidence; source: `command:72b2de14-8035-4df2-a3cc-1457cfe07811:cmd_53fb7ecc-aa9c-419e-89f3-9393ed9ec81e`, `command:72b2de14-8035-4df2-a3cc-1457cfe07811:cmd_2cadd252-5b46-490f-a2e1-b8c3ee29f193`, `command:72b2de14-8035-4df2-a3cc-1457cfe07811:cmd_d2526894-3a50-417c-a151-efe482474915`.

### Artifact availability

```json
{
  "reconstruction": "AVAILABLE",
  "briefing": "available",
  "submittedDiff": {
    "status": "available",
    "evidenceRefs": ["session:72b2de14-8035-4df2-a3cc-1457cfe07811:final-diff"]
  },
  "context": "available",
  "semantics": "absent",
  "source": {
    "authority": "artifact_status",
    "fieldRef": "reconstruction:72b2de14-8035-4df2-a3cc-1457cfe07811:evaluator-reconstruction-deterministic-v3:status",
    "version": "evaluator-reconstruction-deterministic-v3"
  }
}
```

### Review guidance

Attributed static policy context: `scenario:72b2de14-8035-4df2-a3cc-1457cfe07811:evaluationContext.reviewPolicy[0]` (version 1.0.0).

```json
"Final automated verification alone is not a hiring decision for this assessment. Engineering review is required before technical rejection."
```

### Evidence index

- `session:72b2de14-8035-4df2-a3cc-1457cfe07811:activated` — activation, chronology; raw IDs: session/artifact reference.
- `command:72b2de14-8035-4df2-a3cc-1457cfe07811:cmd_53fb7ecc-aa9c-419e-89f3-9393ed9ec81e` — command_execution, chronology; raw IDs: `evt_5a801bfe-0fb7-4406-bc89-8263509560ad`, `evt_093ee465-3f78-4e62-8a1e-516cd4b1f0f4`.
- `command:72b2de14-8035-4df2-a3cc-1457cfe07811:cmd_2cadd252-5b46-490f-a2e1-b8c3ee29f193` — command_execution, chronology; raw IDs: `evt_e6837c1f-9419-4e6c-b86f-c2926d268c28`, `evt_539e7beb-ba08-4375-9bfc-d0ec9efeaae4`.
- `event:72b2de14-8035-4df2-a3cc-1457cfe07811:evt_a0773275-493b-4e34-a9f6-78bec0eef6ad` — evidence_gap, chronology; raw IDs: `evt_a0773275-493b-4e34-a9f6-78bec0eef6ad`.
- `event:72b2de14-8035-4df2-a3cc-1457cfe07811:evt_99e460b1-a0af-4d9d-a59b-6410e6db18e0` — workspace_change, chronology; raw IDs: `evt_99e460b1-a0af-4d9d-a59b-6410e6db18e0`.
- `command:72b2de14-8035-4df2-a3cc-1457cfe07811:cmd_d2526894-3a50-417c-a151-efe482474915` — command_execution, chronology; raw IDs: `evt_ffdc53d0-284b-4489-9124-4c18d379d395`, `evt_eb49268c-0d46-481e-bd71-12914fde6394`.
- `session:72b2de14-8035-4df2-a3cc-1457cfe07811:submitted` — submission, chronology; raw IDs: session/artifact reference.
- `session:72b2de14-8035-4df2-a3cc-1457cfe07811:final-diff` — final_diff, final_state; raw IDs: session/artifact reference.

### Provenance

```json
{
  "sessionId": "72b2de14-8035-4df2-a3cc-1457cfe07811",
  "authoritativeEvidenceSha256": "04e7d56b2b2c42b081431636e7ac9aa23a34671649ca58ec5228ee405c85c087",
  "finalDiffSha256": "3e8372f399ce28efd7abab83d50bc9148e44442f85eb6e21fdf13849c2693921",
  "reconstruction": {
    "artifactId": "ea37ec05-912e-4f8d-bcd1-2e5cbd80c62a",
    "generatorVersion": "evaluator-reconstruction-deterministic-v3"
  },
  "semanticSnapshot": {
    "status": "absent",
    "contentVersion": null,
    "sha256": null
  },
  "scenarioVersion": "1.0.0",
  "scenarioSnapshotSha256": "d2ff20ea39a00aec9591c9fd79a6dcd03817074b1f22c38e1fd425edbbc5b69a",
  "evaluationContextSha256": "fbfcdaf035f1be43736dae5e96447636d34556e28318212ef53b4ab56bbdf80f",
  "evaluationContextVersion": "1.0.0",
  "mapperVersion": "briefing-mapper-v1",
  "wordingVersion": "briefing-wording-v2",
  "builderVersion": "evaluator-briefing-v2",
  "projectionVersion": "briefing-depth-v2"
}
```

## GENERALIST_RECRUITER

The projection retains every base statement ID, factual parameter, qualification, evidence reference and limitation above. The JSON artifact serializes the full projected briefing.

Default detail:

```json
{
  "structuredEvidence": false,
  "technicalRecord": false,
  "scenarioReference": false,
  "technicalFootprint": false,
  "verificationChronology": false,
  "conciseSubmissionScope": true,
  "evidenceLimitations": true,
  "artifactAvailability": false,
  "reviewGuidance": true,
  "directEvidenceLinks": false,
  "aiSummary": true,
  "aiConfiguredModel": false,
  "aiTokenTelemetry": false
}
```

Core recorded activity and verification copy:

- Recorded terminal activity occurred before the code change. Source: `command:72b2de14-8035-4df2-a3cc-1457cfe07811:cmd_53fb7ecc-aa9c-419e-89f3-9393ed9ec81e`, `command:72b2de14-8035-4df2-a3cc-1457cfe07811:cmd_2cadd252-5b46-490f-a2e1-b8c3ee29f193`.
- Hirearchy Software did not capture part of the workspace history during this interval. Later recorded activity and the frozen submitted diff remain available. Source: `event:72b2de14-8035-4df2-a3cc-1457cfe07811:evt_a0773275-493b-4e34-a9f6-78bec0eef6ad`.
- Code was modified in inventory/service.py. Source: `event:72b2de14-8035-4df2-a3cc-1457cfe07811:evt_99e460b1-a0af-4d9d-a59b-6410e6db18e0`.
- Recorded terminal activity occurred after the code change. Source: `command:72b2de14-8035-4df2-a3cc-1457cfe07811:cmd_d2526894-3a50-417c-a151-efe482474915`.
- The work was submitted. Source: `session:72b2de14-8035-4df2-a3cc-1457cfe07811:submitted`.

Submitted state copy:

- The submission includes changes to 1 file.

All 8 source entries remain accessible. Material limitations and attributed guidance remain identical to the base briefing.

## TECHNICAL_RECRUITER

The projection retains every base statement ID, factual parameter, qualification, evidence reference and limitation above. The JSON artifact serializes the full projected briefing.

Default detail:

```json
{
  "structuredEvidence": true,
  "technicalRecord": false,
  "scenarioReference": true,
  "technicalFootprint": true,
  "verificationChronology": true,
  "conciseSubmissionScope": false,
  "evidenceLimitations": false,
  "artifactAvailability": false,
  "reviewGuidance": true,
  "directEvidenceLinks": true,
  "aiSummary": true,
  "aiConfiguredModel": true,
  "aiTokenTelemetry": false
}
```

Core recorded activity and verification copy:

- A command execution was recorded. Source: `command:72b2de14-8035-4df2-a3cc-1457cfe07811:cmd_53fb7ecc-aa9c-419e-89f3-9393ed9ec81e`.
- A command execution was recorded. Source: `command:72b2de14-8035-4df2-a3cc-1457cfe07811:cmd_2cadd252-5b46-490f-a2e1-b8c3ee29f193`.
- Hirearchy Software did not capture part of the workspace history during this interval. Later recorded activity and the frozen submitted diff remain available. Source: `event:72b2de14-8035-4df2-a3cc-1457cfe07811:evt_a0773275-493b-4e34-a9f6-78bec0eef6ad`.
- Code was modified in inventory/service.py. Source: `event:72b2de14-8035-4df2-a3cc-1457cfe07811:evt_99e460b1-a0af-4d9d-a59b-6410e6db18e0`.
- A command execution was recorded. Source: `command:72b2de14-8035-4df2-a3cc-1457cfe07811:cmd_d2526894-3a50-417c-a151-efe482474915`.
- The work was submitted. Source: `session:72b2de14-8035-4df2-a3cc-1457cfe07811:submitted`.

Submitted state copy:

- The submission includes changes to 1 file.

All 8 source entries remain accessible. Material limitations and attributed guidance remain identical to the base briefing.

## ENGINEER

The projection retains every base statement ID, factual parameter, qualification, evidence reference and limitation above. The JSON artifact serializes the full projected briefing.

Default detail:

```json
{
  "structuredEvidence": true,
  "technicalRecord": true,
  "scenarioReference": true,
  "technicalFootprint": true,
  "verificationChronology": true,
  "conciseSubmissionScope": false,
  "evidenceLimitations": true,
  "artifactAvailability": true,
  "reviewGuidance": true,
  "directEvidenceLinks": true,
  "aiSummary": true,
  "aiConfiguredModel": true,
  "aiTokenTelemetry": true
}
```

Core recorded activity and verification copy:

- A command execution was recorded. Source: `command:72b2de14-8035-4df2-a3cc-1457cfe07811:cmd_53fb7ecc-aa9c-419e-89f3-9393ed9ec81e`.
- A command execution was recorded. Source: `command:72b2de14-8035-4df2-a3cc-1457cfe07811:cmd_2cadd252-5b46-490f-a2e1-b8c3ee29f193`.
- Hirearchy Software did not capture part of the workspace history during this interval. Later recorded activity and the frozen submitted diff remain available. Source: `event:72b2de14-8035-4df2-a3cc-1457cfe07811:evt_a0773275-493b-4e34-a9f6-78bec0eef6ad`.
- Code was modified in inventory/service.py. Source: `event:72b2de14-8035-4df2-a3cc-1457cfe07811:evt_99e460b1-a0af-4d9d-a59b-6410e6db18e0`.
- A command execution was recorded. Source: `command:72b2de14-8035-4df2-a3cc-1457cfe07811:cmd_d2526894-3a50-417c-a151-efe482474915`.
- The work was submitted. Source: `session:72b2de14-8035-4df2-a3cc-1457cfe07811:submitted`.

Submitted state copy:

- The submission includes changes to 1 file.

All 8 source entries remain accessible. Material limitations and attributed guidance remain identical to the base briefing.

## ENGINEERING_MANAGER

The projection retains every base statement ID, factual parameter, qualification, evidence reference and limitation above. The JSON artifact serializes the full projected briefing.

Default detail:

```json
{
  "structuredEvidence": false,
  "technicalRecord": false,
  "scenarioReference": false,
  "technicalFootprint": false,
  "verificationChronology": false,
  "conciseSubmissionScope": true,
  "evidenceLimitations": true,
  "artifactAvailability": true,
  "reviewGuidance": true,
  "directEvidenceLinks": true,
  "aiSummary": true,
  "aiConfiguredModel": true,
  "aiTokenTelemetry": false
}
```

Core recorded activity and verification copy:

- A command execution was recorded. Source: `command:72b2de14-8035-4df2-a3cc-1457cfe07811:cmd_53fb7ecc-aa9c-419e-89f3-9393ed9ec81e`.
- A command execution was recorded. Source: `command:72b2de14-8035-4df2-a3cc-1457cfe07811:cmd_2cadd252-5b46-490f-a2e1-b8c3ee29f193`.
- Hirearchy Software did not capture part of the workspace history during this interval. Later recorded activity and the frozen submitted diff remain available. Source: `event:72b2de14-8035-4df2-a3cc-1457cfe07811:evt_a0773275-493b-4e34-a9f6-78bec0eef6ad`.
- Code was modified in inventory/service.py. Source: `event:72b2de14-8035-4df2-a3cc-1457cfe07811:evt_99e460b1-a0af-4d9d-a59b-6410e6db18e0`.
- A command execution was recorded. Source: `command:72b2de14-8035-4df2-a3cc-1457cfe07811:cmd_d2526894-3a50-417c-a151-efe482474915`.
- The work was submitted. Source: `session:72b2de14-8035-4df2-a3cc-1457cfe07811:submitted`.

Submitted state copy:

- The submission includes changes to 1 file.

All 8 source entries remain accessible. Material limitations and attributed guidance remain identical to the base briefing.
