# 0001 — No candidate scoring

- **Status:** Accepted
- **Date:** 2026-09-14

## Context

The prototype captures engineering activity, but no validated model connects those observations to a precise measure of candidate competence.

## Decision

The MVP will not produce automated competence scores, rankings, percentages, or score-derived pass/reject outcomes.

## Rationale

No validated basis exists. Numeric output would create fake precision and could silently collapse evidence, task outcome, and human judgment into one unsupported claim.

## Consequences

Interfaces and schemas preserve evidence and human-recorded decisions separately. Future scoring would require new validation and a superseding decision; it is not an incremental UI feature.
