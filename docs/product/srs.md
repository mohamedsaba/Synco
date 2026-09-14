# Software requirements baseline

This is the requirements baseline for the prototype. It records product invariants without pretending the full implementation is designed.

## Actors and objective

- A **candidate** receives a comprehensible engineering scenario and works in a controlled workspace with a brief, editor, terminal, tests, and optional AI assistant.
- An **evaluator** inspects one chronological reconstruction with expandable source evidence and records any decision themselves.
- A **scenario author** supplies a realistic, validated environment and expected behavior without prescribing a workflow.

## Required capabilities

The product should eventually:

1. load a versioned scenario and create an isolated session;
2. expose the task and engineering tools needed by that scenario;
3. capture supported observable activity as ordered, immutable events;
4. preserve terminal results, test results, AI exchanges, explicit AI insertions, file changes, timestamps, submission, and final diff where applicable;
5. reconstruct a session chronologically from source events;
6. attach evidence event IDs to generated annotations;
7. allow an evaluator to expand reconstruction items into raw evidence;
8. preserve task outcomes separately from any human evaluator decision;
9. regenerate reconstruction from immutable event data;
10. isolate untrusted candidate execution and clean it up deterministically.

## Product constraints

- The system must not automatically rank, score, pass, reject, or label candidate competence.
- It must not infer hidden intent, understanding, trust, or whether manually typed code originated from AI.
- AI support is optional and neutral; only observable interactions and explicit insertion actions are recorded.
- Chronology must be deterministic within a session.
- A scenario must follow the scenario constitution and validation process before candidate use.
- The prototype remains a modular monolith unless a current technical boundary requires otherwise.

## Quality attributes

- **Inspectability:** evidence and generated claims are traceable.
- **Correctness:** captured order, payloads, and outcomes are not silently conflated.
- **Security:** candidate execution is treated as untrusted.
- **Simplicity:** current validation needs outweigh hypothetical scale.
- **Reproducibility:** a versioned scenario and event stream can explain what the evaluator saw.

## MVP validation objective

The central experiment is whether realistic scenarios produce useful, distinguishable work histories. Feature work that does not strengthen or test that loop needs separate justification.
