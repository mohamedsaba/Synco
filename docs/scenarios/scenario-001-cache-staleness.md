# Scenario 001: Cache staleness after restock

## Scenario name

Stale storefront inventory after warehouse restock.

## Target role

Backend or full-stack engineer comfortable debugging a small web service.

## Scenario family

Production incident investigation and corrective change.

## Candidate brief

Warehouse staff restocked a product, but the storefront still shows it as out of stock. PostgreSQL contains the new quantity. Investigate the discrepancy, make the storefront reflect recent restocks correctly, and verify the change.

## Expected behavior

After a valid stock update, subsequent storefront reads return the current quantity without waiting for stale cached data to expire.

## Observed behavior

The inventory write succeeds in PostgreSQL while storefront reads may continue returning the older cached quantity.

## Environment

A deliberately small Flask inventory service backed by PostgreSQL and Redis, with focused tests and ordinary editor, terminal, and AI access. Exact versions and fixture data remain implementation decisions.

## Initial evidence

- a reproducible product that remains out of stock after restock;
- the updated quantity visible in PostgreSQL;
- a task brief describing the symptom and expected behavior;
- runnable service and test instructions.

## Actual root cause

`update_stock()` writes PostgreSQL but does not invalidate or update the corresponding cache entry. A deeper risk is inconsistent warehouse-ID normalization between read and write paths, which can produce different cache keys.

## Plausible hypotheses

Database transaction visibility, replica lag, wrong product or warehouse identity, stale Redis data, cache-key mismatch, response caching, or an unsuccessful background refresh.

## Natural shallow solution

Reduce the cache TTL. This can shorten or hide the symptom but does not establish correct invalidation and may leave key-normalization defects intact.

## Valid solution approaches

Candidates may trace reads from the storefront, trace the restock write, inspect Redis keys, add targeted tests, invalidate the correct key after a successful write, update the cached value, or centralize key construction. No investigation order is required.

## Deeper edge cases

Warehouse-ID normalization, invalidation only after a committed write, and behavior when cache operations fail are relevant but should not inflate the initial brief.

## AI interaction surface

AI can help enumerate stale-data causes, locate cache paths, explain invalidation strategies, propose tests, or review a change when supplied with evidence.

## Possible AI weakness

With weak context, AI may recommend only a shorter TTL, add broad cache bypasses, or miss differing cache-key normalization.

## Observable forks

- inspect PostgreSQL, Redis, code, or tests first;
- stop after a visible test passes or continue examining the caching path;
- change TTL, invalidate on write, update on write, or address key construction;
- verify narrowly or across related warehouse-ID cases.

## Verification opportunities

Reproduce before changing code, run a focused regression test, inspect cache state, run the full relevant suite, test normalized warehouse IDs, and confirm the final diff is limited to the diagnosed cause.

## Fairness review

The symptom and expected behavior are explicit. The repository must be small, setup documented, and failures reproducible. Cache behavior should be realistic; no decoy exists solely to mislead, and multiple sound fixes remain possible.

## Assessment duration and calibration

- **Authoritative hard assessment limit**: 60 minutes (`durationSeconds = 3600`). This is the authoritative maximum session limit snapshot into the candidate assessment session.
- **Estimated completion range**: 45–75 minutes, retained as calibration context to be evaluated through comprehension tests and pilots.

## Reconstruction expectation

Histories should distinguish, factually, between TTL-only work, direct invalidation, key-normalization investigation, different hypothesis paths, and different verification depth. Reconstruction must not label one history as proof of competence.
