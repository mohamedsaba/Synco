# Current Project State

## Product in one paragraph

Delimit (by Synco) is an engineering-assessment platform designed to observe realistic software work in a controlled environment. Rather than computing proxy scores or automated rankings, the system captures observable in-workspace events (commands, tests, edits, AI interactions) and reconstructs them into an auditable, continuous chronological reconstruction with expandable source evidence. A human evaluator—not the platform—reviews this evidence and owns the hiring decision.

## Non-negotiable rules

- **Evidence before judgment:** Ground all claims in observable facts; keep acceptance criteria, test outcomes, task outcomes, candidate competence, and evaluator decisions strictly separated.
- **The evaluator owns the verdict:** The system must never emit automated candidate scores, rankings, competence labels, or pass/reject decisions.
- **AI use is neutral:** Candidate AI interaction is neither inherently positive nor negative; the system records observable prompts, responses, and explicit insertions without inferring invisible mental states or attributing manually written code to AI.
- **Reconstruction, not dashboard:** The primary evaluator interface is a single chronological reconstruction with expandable underlying evidence, not fragmented analytics widgets.
- **Modular monolith:** Retain a single web application with candidate/evaluator routes; avoid premature microservices, message queues, or unnecessary infrastructure.
- **Fix root causes:** No exception suppression, test weakening, auth bypasses, or speculative abstractions.

## Current architecture

- Modular monolith built on Next.js 16 (App Router), React 19, and TypeScript.
- SQLite via `better-sqlite3` is used as the local transactional session store (`.data/delimit.sqlite`), satisfying reload persistence without external database services.
- Sessions follow an explicit lifecycle (`CREATED → ACTIVE → SUBMITTED`) with SHA-256 hashed candidate access tokens and separate HTTP-only evaluator credential cookies derived from `DELIMIT_EVALUATOR_KEY`.
- Line endings are normalized to LF (`\n`) before storage and server-side unified diff generation via `diff`.
- Evaluator diffs are generated on the server directly from immutable original and submitted snapshots; client-submitted diffs are never accepted.

## Implemented today

- **Baseline infrastructure:** Next.js application scaffold, health endpoint (`GET /api/health`), Prettier, ESLint, TypeScript configuration, Vitest test runner, and GitHub Actions CI workflow.
- **Vertical Slice 1 (working tree):**
  - Fixture scenario `slice-1-greeting-format` (name trimming in `src/format-greeting.ts`).
  - Session domain model (`session.ts`) enforcing `CREATED → ACTIVE → SUBMITTED` transitions and immutable submission.
  - SQLite persistence layer (`SqliteSessionStore`) with WAL mode.
  - Candidate session API routes (`activate`, `file`, `submit`) and workspace UI (`/candidate/[token]`).
  - Evaluator authentication (`isEvaluatorCredentialValid`, `evaluatorCookieName`) and diff review UI (`/evaluator`, `/evaluator/sessions/[sessionId]`).
  - Unit and integration tests covering diff generation, lifecycle transitions, persistence reload, and authorization.

## Explicitly not implemented

- Terminal execution, interactive shells, and sandbox process isolation.
- Raw event stream ingestion, storage, and sequence ordering (`EventStore`).
- Automated in-sandbox test execution and test event capture.
- Candidate AI assistant chat and AI interaction logging.
- AI reconstruction service and evidence citation generation.
- Production Scenario 001 (PostgreSQL/Redis cache-staleness incident).
- Candidate scoring, ranking, ATS integrations, or multi-tenant SaaS features.

## Current active plan

None. The initial plan `001-first-vertical-slice.md` was completed and moved to `docs/plans/completed/001-first-vertical-slice.md`. Before commencing the next phase of work (Vertical Slice 2), a new plan must be authored under `docs/plans/active/`.

## Current Git state

- Branch: `main`
- Commit: `feat: complete first vertical slice` (following baseline `3c5c2ff`)
- Status: Clean working tree at completion of Vertical Slice 1.
- Remotes: None configured.

## Verification commands

- `npm run format:check` — Prettier formatting check
- `npm run lint` — ESLint validation
- `npm run typecheck` — Next route typegen + TypeScript typecheck (`tsc --noEmit`)
- `npm run test` — Vitest unit and integration test suite
- `npm run build` — Next.js production build
- `npm run verify` — Full pipeline verification (all checks above)

## Important source-of-truth files

- `docs/product/srs.md` (precedence 1)
- `docs/decisions/` (0001, 0002, 0003) (precedence 2)
- `docs/product/product-principles.md` (precedence 3)
- `docs/product/product-thesis.md` (precedence 4)
- `docs/scenarios/constitution.md` (precedence 5)
- `docs/architecture/` (`system-overview.md`, `event-model.md`, `sandbox.md`, `reconstruction.md`, `ai-boundaries.md`) (precedence 6)
- `docs/plans/completed/001-first-vertical-slice.md` (precedence 7)
- `AGENTS.md` (operating guide and agent rules)

## Known risks

- **Working tree uncommitted:** Vertical Slice 1 changes are in the working tree and not yet committed to Git history.
- **Scenario quality risk:** The current fixture is a minimal interaction test; production assessment validity rests heavily on realistic, deep scenarios like Scenario 001.
- **Sandbox security boundary:** Future candidate execution requires a genuine, isolated execution boundary (resource limits, network constraints, filesystem sandboxing) before untrusted code is executed.
- **Evaluator cognitive load:** Chronological reconstructions must compress events effectively without discarding crucial evidence or substituting AI judgment for human review.

## Genuine unresolved decisions

1. **Working tree commit:** Whether to commit the completed Vertical Slice 1 implementation and full SRS expansion before drafting the next active plan.
2. **Next slice definition:** Prioritization for Vertical Slice 2—specifically whether to introduce containerized sandbox execution and terminal capture next, or candidate AI interaction and event streaming.

## Next safe action

Confirm with the user whether to commit the working tree containing the Vertical Slice 1 implementation, then draft the next active plan (`docs/plans/active/002-*.md`) for the agreed vertical slice before writing any new code.
