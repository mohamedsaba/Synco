# Evaluator gate validation surface

Validation IDs A–G are independent of the older acceptance-history labels.
`manifest.json` records the captured session identity, authoritative event order,
submitted diff SHA-256, generator version, rendered sections, test summaries, and
intentional limitations. Snapshots A/D/F/G contain real SessionService evidence,
server-frozen submitted diffs, current reconstructions, and stored session rows.
They contain no candidate tokens. B/C/E reuse existing histories, not new histories.

| Validation | Authoritative repository source                                          | Frozen result                                                                   |
| ---------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| A          | `tests/live/evaluator-gate-fixtures.test.ts`, complete-fix/reset helpers | One passing pytest run; no initial failed run                                   |
| B          | `tests/live/scenario-acceptance-histories.ts`, acceptance C              | Initial failure, service/cache revisions, final pass                            |
| C          | Same file, acceptance B                                                  | Initial **0 passed / 3 failed**, final **0 passed / 3 failed**                  |
| D          | `tests/live/evaluator-gate-fixtures.test.ts`, write-through alternative  | Supplied suite passes twice; additional invariant checks pass                   |
| E          | `tests/live/scenario-acceptance-histories.ts`, acceptance D              | Partial edit, reversion, note capture/removal, different approach, final pass   |
| F          | `tests/live/evaluator-gate-fixtures.test.ts`, GapSandbox                 | Explicit injected diff-capture outage; recovered capture; submitted note change |
| G          | Same runner, isolated pre-context schema migration                       | Context absent; nonempty terminal/workspace evidence; submitted note change     |

## Reproduce route-ready sessions

Requires Docker and the real `delimit-scenario-001:latest` image. The existing
acceptance runner prepares the prerequisite records. The gate runner reuses
acceptance C/B/D as validation B/C/E, captures only missing A/D/F/G, and writes
`/tmp/delimit-evaluator-gate/gate.sqlite`, snapshots, and a fresh manifest.
Session IDs, timestamps, and elapsed times vary across runs. Semantic progression
and submitted diffs are checked; this is not byte-identical telemetry replay.
Validation E's background note uses timing, so a fresh run must inspect its capture.

```sh
DELIMIT_DETERMINISTIC_ACCEPTANCE=1 npm test -- tests/live/deterministic-reconstruction-acceptance.test.ts
DELIMIT_GATE_FIXTURES=1 npm test -- tests/live/evaluator-gate-fixtures.test.ts
DELIMIT_DB_PATH=/tmp/delimit-evaluator-gate/gate.sqlite npm run dev
```

Use the existing evaluator access flow, then the session references in the fresh
manifest. Existing reconstruction is available without provider configuration.
Do not run the acceptance runner concurrently with fixture capture. The gate
runner overwrites its output database; keep it separate from candidate databases.

Committed A/D/F/G snapshots are rehydrated through the real stores by
`tests/integration/evaluator-gate-fixtures.test.tsx`. G recreates the old schema
without the context column and exercises the additive store migration. It does
not backfill today's context. F's outage is controlled fault injection in the
capture adapter, not an invented event or natural outage claim. Command outputs
come from the real container, not mocked pytest results. F/G are evidence-state
controls and do not claim a successful task fix.

The committed manifest's B/C/E identities refer to the original acceptance
artifact at `/tmp/delimit-deterministic-acceptance/acceptance.sqlite`; they are
not portable frozen snapshots. A fresh run creates a new manifest for all seven
sessions. The source histories remain in the repository.

## Alternative solution review (D)

The canonical fix normalizes identifiers in the service and repairs cache
invalidation in `cache.py`. D changes only `service.py`: it reuses the existing
storefront normalization helper for database identity and writes the new quantity
to the storefront cache after the database operation commits. It never calls the
broken restock-key invalidator. This is a materially different cache consistency
policy, explicitly allowed by the scenario document's update-cache approach.

Source review: PostgreSQL remains authoritative on a cache miss; parameterized
queries are retained; cache publication follows the committed write; aliases
normalize identically on reads and writes; zero remains a cached value; products
retain separate keys; missing inventory returns zero. No supplied tests or
baseline scenario files were changed. Additional captured checks exercise these
observable invariants against PostgreSQL and Redis. The real supplied suite
passes before and after those checks.

Validity is established for the scenario's supplied functional requirements and
serial operations with available Redis. Concurrent cache-fill races, independent
database writers, Redis failures, and production performance were not validated.
The canonical path also does not establish those stronger guarantees. This is a
valid alternative fixture, not an automatic competence or hiring conclusion.

## Truthful presentation

An empty related-evidence area means only that the current relation linked no
activity; relevant inspection may remain in technical chronology. Terminal
truncation is disclosed independently for standard output and standard error.
Raw records remain a separate disclosure. No persona validation is performed by
these runners or tests.
