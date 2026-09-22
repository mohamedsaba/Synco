# 081 — Evaluator Review Entry & Discovery

## Delivered scope

E1 adds the smallest evaluator-only discovery path. `/evaluator` now authenticates
with the existing evaluator credential, loads submitted assessments, and links to
the existing session review route. Known session references remain a secondary
direct path. The dead "Request engineering review" control was removed because
there is no corresponding routing or review-request workflow.

## Existing authorization model

`DELIMIT_EVALUATOR_KEY` is one global credential. `POST /api/evaluator/access`
validates it and stores a SHA-256-derived `delimit_evaluator` value in an
HTTP-only, `SameSite=Strict` cookie. Every evaluator evidence route validates
that cookie against the configured credential. The repository has no evaluator
identity, organization, tenant, scenario, or session-specific authorization
scope. A valid cookie therefore already authorizes submitted evidence for every
session in this prototype.

## Discovery contract

`GET /api/evaluator/sessions` uses that existing server-side authorization guard
before performing or serializing the discovery query. It returns at most 50
reviewable sessions, ordered by `submittedAt DESC, id DESC`. The fixed cap is
the deliberately small current bound; pagination is deferred until actual review
volume needs access beyond one page.

A reviewable entry must be `SUBMITTED` with frozen submitted content, a
submission time, and a closure reason. `CREATED`, `ACTIVE`, and admitted-but-not-
finalized sessions are excluded. The response contains only:

- session reference;
- scenario title;
- submission time;
- recorded assessment duration; and
- closure reason.

It excludes candidate tokens and hashes, sandbox identifiers, raw evidence,
events, diffs, AI content, briefing payloads, and reconstruction records.

## Entry behavior

The queue uses semantic list and link markup, preserves inherited focus styling,
and wraps long session references and titles to avoid page overflow. Empty,
invalid-access, and discovery-service states are distinct. Queue links do not
prefetch evidence. Authorized direct routes at `/evaluator/sessions/[sessionId]`
continue to use their existing authorization guard.

## Product boundary

Discovery is workflow navigation only. It adds no candidate label, score,
quality judgment, assignment, review status, notification, ticket, email, or
engineering routing. Review guidance still states that technical judgment is a
human evaluator decision, but it no longer presents an action that the product
cannot perform.

## Deferred

E2 reconstruction hierarchy, E3 role-depth behavior, E4 engineer workspace,
and E6 evaluator visual polish remain untouched.

## Verification

- Focused discovery, entry rendering, review-guidance, and briefing tests passed:
  34 tests in 4 files.
- Evaluator regression passed: 51 tests in 6 files covering authorization,
  briefing/projection, reconstruction fixtures, and rendering.
- `npm run verify` ran three times. The first run stopped at a localized
  TypeScript name collision, which was fixed. The later runs passed formatting,
  linting, and typechecking but did not reach the build stage because
  Docker-backed integration tests could not use `/var/run/docker.sock` in this
  environment. No tests were skipped or weakened.
