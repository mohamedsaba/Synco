# Reconstruction

The evaluator's primary object is one chronological reconstruction of the work. Tests, commands, AI interactions, file activity, and diff context are levels of detail within that same history, not disconnected dashboards.

Raw immutable events are the primary source. Reconstruction can be regenerated from them. Deterministic formatting should create the timeline structure before optional AI prose is added.

AI prose is compression and connective tissue. Every generated annotation should cite the event IDs that support it:

```json
{
  "text": "Candidate continued investigating after the test passed.",
  "evidence": ["evt_31", "evt_38"]
}
```

An evaluator must be able to expand an item to inspect its source evidence. Unsupported annotations are rejected or omitted. Regeneration should retain provenance, model/configuration metadata where relevant, and the underlying events so prose changes cannot rewrite history.

Reconstruction may state observable outcomes such as a test passing or a file changing. It must not score, rank, declare competence, infer hidden mental states, or automatically pass or reject a candidate. A separately recorded human decision is not a derived task outcome.

## Workspace Mutation Capture Boundaries & Out-Of-Band Drift

Workspace file modifications are captured through deterministic Git tree transitions (`beforeTree` → `afterTree`):

1. **Browser Saves (`origin: 'browser_save'`)**:
   Occurs when a candidate saves a file through the browser editor. The transition captures the specific diff across that save operation.

2. **Command Boundaries (`origin: 'command_execution'`)**:
   Reflects the delta between the pre-command tree and the post-command tree. The associated `commandId` indicates temporal correlation across the command boundary, not an exclusive causal assertion. If candidate processes were active simultaneously, Delimit reports the net observable change across that execution window without speculating on which process produced which byte.

3. **Out-of-Band Mutations (`origin: 'out_of_band'`)**:
   Delimit compares the workspace state before every serialized operation against the last known authoritative tree. When candidate background processes or daemons mutate files outside of an active command or save window, Delimit detects the drift and records an out-of-band `WORKSPACE_CHANGED` event before processing the new operation. Evaluator presentation factually states: _"Workspace changed between recorded actions"_ without speculating on the causal process.

## Submission and Cleanup Invariants

Submission first reconciles out-of-band drift and captures a fresh final tree and complete baseline diff. The final tree must equal the `afterTree` of the last authoritative workspace transition, or the immutable baseline when no transition exists. A mismatch is an unexplained evidence-chain failure: Delimit records `WORKSPACE_CAPTURE_FAILED`, keeps the session `ACTIVE`, preserves the sandbox, and does not freeze an inconsistent chronology.

After evidence capture succeeds, the durable transition to `SUBMITTED` freezes that evidence and closes all candidate mutation APIs. Sandbox destruction is subsequent infrastructure cleanup rather than part of the SQLite state transition. If cleanup fails, the session remains `SUBMITTED`, its evidence remains immutable, and `SANDBOX_CLEANUP_FAILED` makes the operational failure visible after the submission boundary.
