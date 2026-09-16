# 0004 — Scenario context joins at presentation

- **Status:** Accepted
- **Date:** 2026-09-16

## Context

Evaluators need scenario-specific orientation, but allowing scenario metadata into evidence reconstruction would risk preferred-path bias and would make factual output depend on author expectations.

## Decision

Persist an immutable, versioned scenario evaluation snapshot with each session. Build scenario-linked evidence deterministically from typed facts after the chronology and evidence catalog exist. Join this index with grounded reconstruction only in the evaluator presentation model.

Scenario evaluation context is context, not evidence. It cannot alter chronology, evidence catalog construction, typed facts, coverage, reconstruction wording, grounding, or candidate outcome facts.

## Consequences

- Scenario authors may define neutral purpose, evidence areas, system invariants, relevant verification areas, interpretation warnings, and static review policy. The persisted v1 property remains `verificationTargets` for compatibility; the evaluator-facing concept is not a pass/fail checklist.
- They may not define a preferred action/command/file sequence, expected attempts or duration, scoring, trait mappings, or expected AI use.
- Empty related-evidence areas remain visible as an absence of recorded evidence, not a competence claim.
- Older sessions remain compatible without backfilling context.
- A future change that allows scenario context to influence reconstruction would supersede this decision and require explicit product review.
