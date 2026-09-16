# Evaluator briefing foundation

## Authority and scope

- [Final reconciled product/experience specification](../product/evaluator-v2-design-specification.md)
- [Architecture source of truth](../audits/evaluator-v2-architecture-feasibility.md)
- [Existing evaluator architecture](evaluator-experience.md)
- [Reconstruction architecture](reconstruction.md)
- [Presentation boundary decision](../decisions/0005-briefing-semantics-remain-presentation-only.md)
- [Active foundation plan](../plans/active/053-evaluator-briefing-foundation.md)

Scenario semantics enrich presentation only. They do not change evidence truth.
Evaluator briefings are decision-support artifacts, not candidate-quality judgments.

The detailed foundation implementation request bounds this slice. Final visual design, review-action controls, manager notes and organization workflow are deferred. The product specification's Case D describes exact fixture evidence; it does not authorize a generic behavior classifier. Static review guidance retains its original scenario-source wording and scope.

## Boundary

```text
immutable evidence → chronology → catalog → typed facts → unchanged v3 reconstruction
                                    |                         |
optional immutable semantic snapshot → constrained mapper    |
                                    |                         |
                               briefing assembler ←-----------+
                                    |
                             pure depth projection
                                    |
                         serialized authorized read output
```

No semantics, role, briefing or guidance input flows back into evidence, reconstruction, coverage or submission. Task context and static policy are separately attributed authored data; they are not generated observations.
