# Reconstruction

The evaluator's primary object is one chronological reconstruction of the work. Tests, commands, AI interactions, file activity, and diff context are levels of detail within that same history, not disconnected dashboards.

Raw immutable events are the primary source. Reconstruction can be regenerated from them. Deterministic formatting should create the timeline structure before optional AI prose is added.

## Candidate Session and Reconstruction Lifecycles

Candidate-session state and AI reconstruction status are separate. On the successful path, `CREATED → ACTIVE → SUBMITTED`; `SUBMITTED` means final evidence is frozen, candidate mutation is closed, and candidate-session submission is complete. Successful submission makes that immutable evidence eligible for reconstruction, but neither the submission service nor response waits for AI.

Reconstruction is a derived evaluator artifact with its own lifecycle: an eligible session with no row is not started, an execution attempt claims `PENDING`, valid persisted output becomes `AVAILABLE`, and an unsuccessful attempt becomes `FAILED`. A failed reconstruction may be retried without changing or reopening the submitted candidate session. Generation execution may begin after submission or recover later; evaluator page rendering is not the domain event that creates eligibility.

AI prose is compression and connective tissue. Every generated annotation should cite the event IDs that support it:

```json
{
  "text": "Candidate continued investigating after the test passed.",
  "evidence": ["evt_31", "evt_38"]
}
```

An evaluator must be able to expand an item to inspect its source evidence. Unsupported annotations are rejected or omitted. Regeneration should retain provenance, model/configuration metadata where relevant, and the underlying events so prose changes cannot rewrite history.

Reconstruction may state observable outcomes such as a test passing or a file changing. It must not score, rank, declare competence, infer hidden mental states, or automatically pass or reject a candidate. A separately recorded human decision is not a derived task outcome.

## Chronology Evidence, Final-State Evidence, and Coverage

Evidence references have distinct roles:

- **Chronology evidence** establishes observable ordering: what occurred before or after another recorded item and which workspace transitions were observed during iterative work.
- **Final-state evidence** establishes what exists in the submitted repository. The final diff is authoritative for submitted state but does not establish when, why, or in response to what a change occurred.

A claim such as “X changed after command Y failed” requires chronology evidence; the final diff alone can support only a submitted-state claim such as “the submitted repository contains changes to X.” Generated statement order is derived by the server from cited chronology evidence rather than trusted from model output.

Grounding protects against fabrication. Coverage protects against selective storytelling. Reconstruction is compression, not sanitization: it need not repeat every command, but required deterministic anchors preserve the shape of material workspace transitions, unsuccessful observed outcomes followed by later work, meaningful reversions, evidence gaps, out-of-band changes, the final observed command outcome, final submitted state, and the submission boundary. These facts are not labeled good or bad.

Evidence gaps are epistemic boundaries. A statement may refer to evidence on both sides only when it also makes the missing interval visible; it must not imply that continuous or causal workspace history was observed across the gap. Structural validation can require citations and coverage, but it cannot prove semantic correctness or fully determine causal meaning.

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
