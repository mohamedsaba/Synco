# Evaluator Briefing Foundation — serialized review

These artifacts prove the data/presentation boundary before final visual UI work. The [accepted product specification](../../product/evaluator-v2-design-specification.md), [architecture audit](../../audits/evaluator-v2-architecture-feasibility.md), and [briefing contract](../../architecture/evaluator-briefing.md) govern this slice.

Each JSON contains `baseBriefing` and all four complete depth projections with exact evidence refs. Each readable Markdown output shows the eight source categories, common copy, role defaults, refs and provenance. All roles retain the same facts and limitations; no candidate-quality judgment is generated.

| Case | Readable base and role views | Full serialized data | Source                                                                                     |
| ---- | ---------------------------- | -------------------- | ------------------------------------------------------------------------------------------ |
| C    | [C.md](C.md)                 | [C.json](C.json)     | Preserved original gate-C / acceptance-B record; manifest-checked events and frozen diff   |
| D    | [D.md](D.md)                 | [D.json](D.json)     | Existing gate D snapshot; service-only write-through submitted operation stays inspectable |
| F    | [F.md](F.md)                 | [F.json](F.json)     | Existing gate F snapshot; explicit historic capture gap survives later recorded state      |
| G    | [G.md](G.md)                 | [G.json](G.json)     | Existing gate G snapshot; absent context/semantics retain generic legacy fallback          |

No historical record is enriched with today's semantic snapshot. New-session mappings are exercised in tests. C has no historical evaluation context: its guidance remains unavailable rather than silently adopting current scenario policy.

To regenerate derived outputs from these preserved sources:

```sh
DELIMIT_WRITE_BRIEFING_ARTIFACTS=1 npm test -- tests/integration/evaluator-briefing-artifacts.test.ts
```

The original one-time C capture is opt-in (`DELIMIT_CAPTURE_BRIEFING_C=1`) and requires the original acceptance database. Normal verification uses the preserved portable C fixture; it never fabricates C events or needs that temporary database.

Current tests compare JSON meaning. Markdown layout may be normalized; it is a readable view of the same data, not an additional evidence source. The original gate snapshots/histories and submitted-diff hashes are unchanged.
