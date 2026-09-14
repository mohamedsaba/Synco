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
- **Vertical Slice 1 (committed in `4f8d709`):**
  - Fixture scenario `slice-1-greeting-format` (name trimming in `src/format-greeting.ts`).
  - Session domain model (`session.ts`) enforcing `CREATED → ACTIVE → SUBMITTED` transitions and immutable submission.
  - SQLite persistence layer (`SqliteSessionStore`) with WAL mode.
  - Candidate session API routes (`activate`, `file`, `submit`) and workspace UI (`/candidate/[token]`).
  - Evaluator authentication (`isEvaluatorCredentialValid`, `evaluatorCookieName`) and diff review UI (`/evaluator`, `/evaluator/sessions/[sessionId]`).
  - Unit and integration tests covering diff generation, lifecycle transitions, persistence reload, and authorization.
- Vertical Slice 2 (committed in `fd841c6`):
  - Hardened session-scoped Docker sandbox (`DockerSandboxAdapter`): Alpine 3.20 base container, unprivileged non-root user (`1000:1000`), network isolation (`--network none`), read-only root filesystem, tmpfs for `/workspace` and `/tmp`, strict resource limits (1 CPU, 512MB RAM, 64 PIDs).
  - Readiness-gated activation: Transition `CREATED → ACTIVE` and assessment timer initialization only occur after sandbox creation and readiness check pass.
  - Memory-bounded stream accumulation (`BoundedStreamAccumulator`): Cap live buffers at 64 KB preview while tracking exact total byte counts and explicit truncation flags.
  - Authoritative append-only event store (`SqliteEventStore`): Monotonic sequence numbers, timestamps, exit codes, durations, truncated output previews, and correlated `commandId`.
  - Process-group timeout termination: Commands timed out at 30s have their process groups and orphaned child processes terminated.
  - Candidate command console and evaluator raw command evidence.
- **Vertical Slice 3 (working tree):**
  - **Hardened Scenario 001 multi-service image (`delimit-scenario-001:latest`):** Ubuntu 24.04-based container packaging Python 3.12, PostgreSQL 16, Redis 7, and Flask storefront inventory service. Runs under `--network none`, `--read-only`, unprivileged non-root user `1000:1000`, tmpfs for `/workspace` (512MB) and `/tmp` (256MB). Startup script backgrounds PostgreSQL and Redis, seeds initial incident data deterministically, marks `/tmp/scenario_ready`, and maintains a clean Git baseline in `/workspace`.
  - **Multi-service readiness probing & daemon protection:** `DockerSandboxAdapter` polls for `/tmp/scenario_ready`, `pg_isready`, and `redis-cli ping` before declaring the sandbox ready and transitioning `CREATED → ACTIVE`. Protects in-container daemons (`postgres`, `redis-server`) from command timeout kills.
  - **Multi-file workspace APIs & candidate UI:** Endpoints `workspace/tree` and `workspace/file` (GET/PUT) allow candidates to browse files, switch editor tabs with auto-save, and edit repository files in the container filesystem.
  - **Authoritative in-container Git diff capture:** On submission, the server executes `git -C /workspace add -N . && git -C /workspace diff HEAD` inside the container before teardown, capturing a deterministic multi-file unified diff.
  - **Evaluator multi-file evidence view:** Displays the multi-file unified diff alongside factual chronological command execution cards, conditionally suppressing single-file source panels for multi-file incident environments.
  - **Comprehensive automated regression & integration tests:** `tests/integration/scenario-001.test.ts` validates the end-to-end incident lifecycle: seed data verification, incident reproduction (`pytest` fails with stale storefront stock), candidate two-file behavioral fix + cache key invalidation, verification (`pytest` passes all 3 tests), submission, container teardown, and evaluator diff capture.

## Explicitly not implemented

- Full interactive PTY / WebSocket terminal streaming (FR-015 is partially advanced via HTTP command console; interactive terminal is deferred).
- Automated test run heuristics (`TEST_RUN` event inference).
- Candidate AI assistant chat and AI interaction logging.
- AI reconstruction service and evidence citation generation.
- Generic scenario plugin / marketplace architectures (kept scenario loading minimal and specific to Scenario 001).
- Candidate scoring, ranking, ATS integrations, or multi-tenant SaaS features.

## Current active plan

None. Vertical Slice 3 implementation is complete; plan preserved in `docs/plans/completed/003-scenario-001-multifile-incident.md`.

## Current Git state

- Branch: `main`
- Commit: `feat: add Scenario 001 multi-file incident environment`
- Status: Working tree is clean.
- Remotes: None configured.

## Verification commands

- `npm run format:check` — Prettier formatting check
- `npm run lint` — ESLint validation
- `npm run typecheck` — Next route typegen + TypeScript typecheck (`tsc --noEmit`)
- `npm run test` — Vitest unit and integration test suite (11 test suites, 25 tests)
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
- `docs/plans/completed/002-terminal-and-event-capture.md` (precedence 8)
- `docs/plans/active/003-scenario-001-multifile-incident.md` (precedence 9)
- `AGENTS.md` (operating guide and agent rules)

## Known risks

- **Docker socket availability in CI:** Docker daemon must be available in environments running integration tests that instantiate real containers (e.g. GitHub Actions runner). Fast mock adapter is available for environments without Docker.
- **Image pre-requisite:** Running Scenario 001 with the real Docker adapter requires the pre-built `delimit-scenario-001:latest` image (`docker build -t delimit-scenario-001:latest scenarios/001-stale-storefront-inventory`).

## Next safe action

Present the completed 6-checkpoint walkthrough of Vertical Slice 3 to the user and wait for human approval before committing.
