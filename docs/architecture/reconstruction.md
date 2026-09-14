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
