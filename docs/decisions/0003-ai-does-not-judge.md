# 0003 — AI does not judge

- **Status:** Accepted
- **Date:** 2026-09-14

## Context

AI can make long event streams easier to read, but candidate competence and hiring suitability are not validated inference targets.

## Decision

AI may summarize evidence and generate annotations grounded in event IDs. It will not produce competence labels, rankings, scores, or candidate verdicts.

## Rationale

Summarization can be checked against source events. Competence judgment is not yet validated and belongs to the human evaluator.

## Consequences

Generated text carries evidence references and remains replaceable. Unsupported claims are omitted, and evaluator decisions are stored as explicit human actions rather than reconstruction output.
