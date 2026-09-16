# 053 — Evaluator Briefing Foundation

Status: active. Authorized 2026-09-17. Not Slice 6 or visual redesign.

## Contract and sources

The user's implementation request authorizes the briefing foundation. `docs/audits/evaluator-v2-architecture-feasibility.md` is the architecture source of truth. Product principles, scenario constitution and decision 0004 remain binding. The [final reconciled specification](../../product/evaluator-v2-design-specification.md) is the product/experience source of truth. The detailed implementation request bounds this foundation slice; visual layout, review actions and manager notes remain deferred. [Boundary decision](../../decisions/0005-briefing-semantics-remain-presentation-only.md) and [briefing architecture](../../architecture/evaluator-briefing.md) govern implementation.

Scenario semantics enrich presentation only. They do not change evidence truth.
Evaluator briefings are decision-support artifacts, not candidate-quality judgments.

## Proposed implementation decisions

- Keep eight categories separate, with evidence, scenario context, artifact status and static policy as distinct authorities.
- Add an optional immutable semantic snapshot column; no evaluation-context contract mutation or historical backfill. Strict supported schema and explicit unknown-version fallback.
- Constrained exact direct-command bindings, closed subject vocabulary and wording keys. Reads require paired successful completion, complete output and exact target binding. Unknown wrappers, mutations and ambiguous matches stay generic.
- Verification uses catalog-backed facts with conservative direct pytest recognition; counts use the existing parser only. No prose-derived facts.
- Full frozen diff supplies paths/counts and validated hunk counts where supported. No behavior classification.
- One briefing, pure default-depth profiles, unchanged observation IDs/refs/meaning/caveats. Existing authorization guards a serialized briefing API; no visual UI changes.
- Static review policy is attributed context only. No workflow/human-review subsystem.
- C output is a manifest/source support record when the original acceptance database is unavailable, not invented events. D/F/G outputs use unchanged committed snapshots without injecting historical semantics.

## Work and verification

1. Domain/schema, additive migration and new-session snapshot.
2. Mapper, templates, verification/submitted-state/limitations builder and grounding validation.
3. Depth projection, authorized serialized read endpoint, fixture review outputs.
4. Substantive unit/integration tests and isolation/legacy regressions.
5. Documentation and full `npm run verify`; inspect scoped diff and record completion/commit.

## Existing work

Working tree already contains uncommitted Slice 5.1, gate fixtures and architecture audit. Preserve all pre-existing edits. Record baseline copies of shared files for distinguishing this slice; do not silently commit unrelated work.
