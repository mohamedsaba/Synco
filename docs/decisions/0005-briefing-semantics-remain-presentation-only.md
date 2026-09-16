# 0005 — Briefing semantics remain presentation-only

- Status: Accepted for the authorized Evaluator Briefing Foundation
- Date: 2026-09-17

## Decision

Extend decision 0004's presentation join with a separate versioned evaluator briefing. Keep task context, observations, verification, submitted state, evidence limitations, artifact availability, static review guidance and source evidence index distinct. Only candidate/activity claims use same-session authoritative evidence refs; context and guidance use immutable scenario field refs.

Scenario semantics enrich presentation only. They do not change evidence truth.
Evaluator briefings are decision-support artifacts, not candidate-quality judgments.

An optional semantic snapshot is frozen for newly created sessions. Existing sessions are not backfilled. Strict closed templates and conservative command bindings describe recorded operations and related code areas, never intent, competence, diagnosis, task success or a canonical solution. Unknown schemas, commands and ambiguous matches fall back explicitly.

Role depth changes default detail only; the same IDs, parameters, refs and caveats survive every projection. Authorization remains the existing evaluator credential boundary. Static review policy is guidance context, not routing or a verdict.

Deterministic v3, chronology, catalog, typed facts, coverage, submission and their provenance are unchanged. No briefing input flows upstream. Serialized output precedes any final UI work.

## Sources

- [Accepted final product specification](../product/evaluator-v2-design-specification.md)
- [Architecture feasibility audit](../audits/evaluator-v2-architecture-feasibility.md)
- [Foundation architecture](../architecture/evaluator-briefing.md)
- [Implementation plan](../plans/completed/053-evaluator-briefing-foundation.md)

Case D's accepted technical description is specific fixture evidence, not permission for a generic behavior classifier. Future request-review controls, layouts and manager notes do not expand the authorized foundation scope.
