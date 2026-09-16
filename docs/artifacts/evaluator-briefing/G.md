# Case G — serialized briefing review

This artifact is generated from recorded evidence. It is not a candidate-quality judgment.

Full base and all four projections: [G.json](G.json).

## Base briefing

### Task context

- task_brief: attributed scenario data at `scenario:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:brief` (version 1.0.0).

```json
"Warehouse staff recently restocked units of product PROD-1001 into warehouse WH-EAST-01. The database reflects the restocked quantity, but customers on the storefront are still seeing the item as out of stock.\n\nExpected Behavior:\nAfter stock is updated in the warehouse, subsequent reads from the storefront must reflect the current inventory without serving stale cached counts.\n\nEnvironment & Tools:\n- The inventory service is in /workspace (Flask app backed by PostgreSQL and Redis).\n- Tests can be run from the command console: pytest\n- PostgreSQL CLI: psql -h 127.0.0.1 -U delimit inventory\n- Redis CLI: redis-cli\n\nYour Task:\n1. Investigate the cause of the discrepancy.\n2. Implement an appropriate fix in the codebase.\n3. Verify that your change corrects the issue and does not introduce regressions.\n4. Submit your work when finished."
```

### Observed activity

- A command execution was recorded.
  - Statement ID: `observation:command:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:cmd_712eada6-6068-492a-b157-0a7a7e1b2c2d`; source: `command:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:cmd_712eada6-6068-492a-b157-0a7a7e1b2c2d`.
  - Scope: `recorded_execution`; mapping: `generic`.

- A command execution was recorded.
  - Statement ID: `observation:command:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:cmd_5c001d3f-034e-4465-b428-d3eff7399fea`; source: `command:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:cmd_5c001d3f-034e-4465-b428-d3eff7399fea`.
  - Scope: `recorded_execution`; mapping: `generic`.

- A workspace edit was recorded.
  - Statement ID: `observation:event:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:evt_52b356c2-7928-4e35-8513-106b70342f4a`; source: `event:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:evt_52b356c2-7928-4e35-8513-106b70342f4a`.
  - Scope: `recorded_workspace_transition`; mapping: `generic`.

- A command execution was recorded.
  - Statement ID: `observation:command:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:cmd_b8ce8da6-91dd-45ab-8f14-3c9955c41846`; source: `command:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:cmd_b8ce8da6-91dd-45ab-8f14-3c9955c41846`.
  - Scope: `recorded_execution`; mapping: `generic`.

- Submission was recorded.
  - Statement ID: `observation:session:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:submitted`; source: `session:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:submitted`.
  - Scope: `submission_boundary`; mapping: `generic`.

### Recorded verification

No recognized recorded test executions appear in this bounded record. This does not establish absence of other verification.

### Submitted state

The frozen submission diff contains changes to 1 file.

Source: `session:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:final-diff`. Additions: 1; deletions: 0. Paths are evidence data:

```json
["inventory/service.py"]
```

### Evidence limitations

- Scenario evaluation context is unavailable for this session.
  - Authority: metadata; source: `scenario:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:evaluationContext`.

- Scenario semantic metadata is absent; generic evidence wording is used.
  - Authority: metadata; source: `scenario:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:semanticSnapshot`.

- This recorded command has no supported semantic read mapping; generic wording is used.
  - Authority: evidence; source: `command:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:cmd_712eada6-6068-492a-b157-0a7a7e1b2c2d`.

- This recorded command has no supported semantic read mapping; generic wording is used.
  - Authority: evidence; source: `command:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:cmd_5c001d3f-034e-4465-b428-d3eff7399fea`.

- This recorded command has no supported semantic read mapping; generic wording is used.
  - Authority: evidence; source: `command:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:cmd_b8ce8da6-91dd-45ab-8f14-3c9955c41846`.

### Artifact availability

```json
{
  "reconstruction": "AVAILABLE",
  "briefing": "available",
  "submittedDiff": {
    "status": "available",
    "evidenceRefs": ["session:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:final-diff"]
  },
  "context": "absent",
  "semantics": "absent",
  "source": {
    "authority": "artifact_status",
    "fieldRef": "reconstruction:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:evaluator-reconstruction-deterministic-v3:status",
    "version": "evaluator-reconstruction-deterministic-v3"
  }
}
```

### Review guidance

No static policy context is available for this session.

### Evidence index

- `session:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:activated` — activation, chronology; raw IDs: session/artifact reference.
- `command:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:cmd_712eada6-6068-492a-b157-0a7a7e1b2c2d` — command_execution, chronology; raw IDs: `evt_4f9787b9-6a77-4313-b938-e0b14eeff4ea`, `evt_ac2b3f4c-2f62-4403-8107-21df20217156`.
- `command:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:cmd_5c001d3f-034e-4465-b428-d3eff7399fea` — command_execution, chronology; raw IDs: `evt_0bf835f0-c4c4-4760-b5b7-ec627a9c76a8`, `evt_db0d87f1-7f72-47b1-aa4e-c17d5bb4a3a4`.
- `event:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:evt_52b356c2-7928-4e35-8513-106b70342f4a` — workspace_change, chronology; raw IDs: `evt_52b356c2-7928-4e35-8513-106b70342f4a`.
- `command:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:cmd_b8ce8da6-91dd-45ab-8f14-3c9955c41846` — command_execution, chronology; raw IDs: `evt_00aae675-cdac-4d16-86ec-cf26abf86c63`, `evt_5c259c70-f39d-432f-a6ba-acccef9630f0`.
- `session:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:submitted` — submission, chronology; raw IDs: session/artifact reference.
- `session:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:final-diff` — final_diff, final_state; raw IDs: session/artifact reference.

### Provenance

```json
{
  "sessionId": "a18cdd2c-2374-4f92-8158-95a2fe7fcfdb",
  "authoritativeEvidenceSha256": "dbedfffa6e1caecb3e9cf314772c2c671ad9554744e65cdd005124ae84e1ace9",
  "finalDiffSha256": "3e8372f399ce28efd7abab83d50bc9148e44442f85eb6e21fdf13849c2693921",
  "reconstruction": {
    "artifactId": "405c1ad8-b260-435f-88b3-f861521d908d",
    "generatorVersion": "evaluator-reconstruction-deterministic-v3"
  },
  "semanticSnapshot": {
    "status": "absent",
    "contentVersion": null,
    "sha256": null
  },
  "scenarioVersion": "1.0.0",
  "scenarioSnapshotSha256": "e0db2410ae5078ef086ff19cac54d8d4fffac7393d41063c39f747d44e33274b",
  "evaluationContextSha256": null,
  "evaluationContextVersion": null,
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

- A command execution was recorded. Source: `command:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:cmd_712eada6-6068-492a-b157-0a7a7e1b2c2d`.
- A command execution was recorded. Source: `command:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:cmd_5c001d3f-034e-4465-b428-d3eff7399fea`.
- A workspace edit was recorded. Source: `event:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:evt_52b356c2-7928-4e35-8513-106b70342f4a`.
- A command execution was recorded. Source: `command:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:cmd_b8ce8da6-91dd-45ab-8f14-3c9955c41846`.
- Submission was recorded. Source: `session:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:submitted`.

All 7 source entries remain accessible. Material limitations and attributed guidance remain identical to the base briefing.

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

- A command execution was recorded. Source: `command:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:cmd_712eada6-6068-492a-b157-0a7a7e1b2c2d`.
- A command execution was recorded. Source: `command:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:cmd_5c001d3f-034e-4465-b428-d3eff7399fea`.
- A workspace edit was recorded. Source: `event:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:evt_52b356c2-7928-4e35-8513-106b70342f4a`.
- A command execution was recorded. Source: `command:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:cmd_b8ce8da6-91dd-45ab-8f14-3c9955c41846`.
- Submission was recorded. Source: `session:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:submitted`.

All 7 source entries remain accessible. Material limitations and attributed guidance remain identical to the base briefing.

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

- A command execution was recorded. Source: `command:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:cmd_712eada6-6068-492a-b157-0a7a7e1b2c2d`.
- A command execution was recorded. Source: `command:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:cmd_5c001d3f-034e-4465-b428-d3eff7399fea`.
- A workspace edit was recorded. Source: `event:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:evt_52b356c2-7928-4e35-8513-106b70342f4a`.
- A command execution was recorded. Source: `command:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:cmd_b8ce8da6-91dd-45ab-8f14-3c9955c41846`.
- Submission was recorded. Source: `session:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:submitted`.

All 7 source entries remain accessible. Material limitations and attributed guidance remain identical to the base briefing.

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

- A command execution was recorded. Source: `command:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:cmd_712eada6-6068-492a-b157-0a7a7e1b2c2d`.
- A command execution was recorded. Source: `command:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:cmd_5c001d3f-034e-4465-b428-d3eff7399fea`.
- A workspace edit was recorded. Source: `event:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:evt_52b356c2-7928-4e35-8513-106b70342f4a`.
- A command execution was recorded. Source: `command:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:cmd_b8ce8da6-91dd-45ab-8f14-3c9955c41846`.
- Submission was recorded. Source: `session:a18cdd2c-2374-4f92-8158-95a2fe7fcfdb:submitted`.

All 7 source entries remain accessible. Material limitations and attributed guidance remain identical to the base briefing.
