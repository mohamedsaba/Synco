# Preserved briefing source evidence

`C.json` preserves the original existing gate-C (acceptance history B) record from `/tmp/hirearchy-deterministic-acceptance/acceptance.sqlite`. It contains actual SessionService evidence and the existing deterministic-v3 consumer reconstruction view, without candidate credentials or attempt tokens.

A read-only source connection created a temporary consistent SQLite backup. Extraction checked event IDs/order/types and frozen submitted-diff SHA-256 against `tests/fixtures/evaluator-gate/manifest.json`, plus generator version. No commands were replayed, test output invented, historical scenario semantics backfilled, or original database mutated.

Gate C: first pytest reports 3 failed → recorded service edit → final pytest reports 3 failed. The unchanged history remains `tests/live/scenario-acceptance-histories.ts` history B. D/F/G use their unchanged gate snapshots rather than duplicates here.

Capture is reproducible only while the original source database exists; normal static verification no longer depends on it. A different rerun's session identity is not interchangeable with this original record.
