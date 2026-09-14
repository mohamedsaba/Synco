# 001 — First vertical slice

## Goal

Deliver the smallest end-to-end proof: a scenario loads, a candidate sees its task, edits one permitted file, submits, and an evaluator sees the resulting final diff.

## Why it exists

This tests the shortest scenario-to-evidence loop before terminal capture, AI, event reconstruction, or production sandbox orchestration are introduced.

## Relevant product requirements

- Present a comprehensible, versioned scenario and expected behavior.
- Preserve observable work as evidence without scoring or judging the candidate.
- Keep task outcome and evaluator decision separate.
- Build a demoable vertical slice in a modular monolith.
- Treat eventual candidate execution as untrusted, even though this slice does not run commands.

## In scope

- one fixed development scenario fixture suitable for the slice, clearly marked as a fixture if it is not Scenario 001;
- session creation and scenario loading through the application;
- candidate task view and a single-file text editor;
- server-side persistence of the original and submitted file contents;
- submission lifecycle rules;
- deterministic final unified diff generation;
- evaluator view of session metadata and final diff;
- authorization adequate for a controlled prototype;
- unit and integration tests for lifecycle, loading, submission, and diff behavior.

## Out of scope

- terminal or arbitrary code execution;
- event timeline and reconstruction AI;
- candidate AI chat;
- automated tests inside the candidate environment;
- scores, labels, rankings, pass/reject behavior, evaluator analytics, and generic SaaS administration;
- production container orchestration, WebSockets, Redis, queues, and multi-stack scenarios.

## Current system state

The repository contains a Next.js TypeScript shell, health endpoint, documentation baseline, and verification tooling. There is no database schema, domain implementation, authentication, editor, or product workflow.

## Proposed implementation

1. Define the smallest domain vocabulary: scenario version, session state, editable file snapshot, submission, and final diff.
2. Choose a simple persistence mechanism after confirming local/deployment constraints; PostgreSQL plus a small ORM is the default, but an in-process adapter may be used only for isolated domain tests.
3. Add server-side use cases for creating a session, loading its scenario, saving permitted file content, and submitting once.
4. Add thin HTTP boundaries and two focused pages: candidate workspace and evaluator reconstruction placeholder containing the final diff.
5. Use a maintained editor component only if a plain text area cannot validate the interaction; avoid configuring Monaco beyond the slice's needs.
6. Record enough provenance to reproduce the diff: scenario version, original content, submitted content, session identity, and submission time.
7. Test invariants at the domain level and the complete API/persistence path at the integration level.

No general event framework should be introduced merely to describe this slice. If submission events are required by a concrete reconstruction need, update this plan and the event-model document first.

## Files expected to change

- `apps/web/` for candidate and evaluator routes, UI, and server boundaries;
- a domain-specific module under `apps/web/src/` unless a second real consumer justifies a package;
- persistence configuration and migrations if PostgreSQL is selected;
- `tests/` for unit and integration coverage;
- `README.md`, architecture docs, and this plan as implemented behavior becomes concrete.

## Risks

- Treating an editable browser buffer as authoritative could lose or misattribute evidence; persistence and submission must be server-owned.
- Introducing sandbox or event abstractions early could obscure the actual slice.
- A diff library choice must preserve deterministic output and handle line endings explicitly.
- Even a controlled prototype needs a clear separation between candidate and evaluator access.

## Verification

- A fresh scenario session displays the correct task and original file.
- An allowed edit persists and survives reload.
- Submission is idempotent or explicitly rejects a second mutation.
- The evaluator sees an exact deterministic diff from original to submitted content.
- No UI or API turns the diff into a candidate verdict.
- Unit and integration tests pass, followed by `npm run verify` and a manual end-to-end demonstration.

## Open questions

No product decision currently blocks planning. Persistence and editor library selection should be resolved during implementation from deployment constraints and the smallest demonstrable need.
