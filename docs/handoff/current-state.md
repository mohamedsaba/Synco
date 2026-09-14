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
- SQLite via `better-sqlite3` is used as the local transactional session store and append-only event store (`.data/delimit.sqlite`), satisfying reload persistence without external database services.
- Sessions follow an explicit lifecycle (`CREATED → ACTIVE → SUBMITTED`) with SHA-256 hashed candidate access tokens and separate HTTP-only evaluator credential cookies derived from `DELIMIT_EVALUATOR_KEY`.
- In-memory per-session async mutex (`SessionService.withSessionLock`) serializes all candidate browser saves, terminal command executions, and submissions to guarantee strict chronological event sequencing and prevent race conditions.
- Evidence boundary is completely independent of candidate-controlled Git:
  - **Immutable baseline:** Read-only baseline commit and tree stored in `/opt/delimit/repo-template/.git` outside the candidate-writable workspace.
  - **Protected evidence object store:** In-container dedicated scratch directory `/run/delimit-evidence` (with alternate object database `/run/delimit-evidence/objects`) owned by Delimit.
  - Candidate modifications to `/workspace/.git`, `.gitignore`, or candidate Git config have zero effect on platform tree capture or diff calculation.
- Evidence events:
  - `COMMAND_STARTED` and `COMMAND_FINISHED` with correlated `commandId`, execution duration, exit code, and bounded output accumulator.
  - `WORKSPACE_CHANGED` capturing deterministic snapshot diffs across browser saves (`origin: 'browser_save'`), command executions (`origin: 'command_execution'`), or background processes (`origin: 'out_of_band'`).
  - `WORKSPACE_CAPTURE_FAILED` preserving chronological awareness if capture fails during pre-command, post-command, browser-save, or submission phases without corrupting subsequent events.
  - `SANDBOX_CLEANUP_FAILED` recording infrastructure cleanup failure after submitted evidence has already been durably frozen.
- Evaluator experience is a unified, chronological timeline reconstructing candidate actions from activation to submission, with expandable per-step diffs and a complete final submission diff.

## Implemented today

- **Baseline infrastructure:** Next.js application scaffold, health endpoint (`GET /api/health`), Prettier, ESLint, TypeScript configuration, Vitest test runner, and GitHub Actions CI workflow.
- **Vertical Slice 1 (committed in `4f8d709`):**
  - Fixture scenario `slice-1-greeting-format` (name trimming in `src/format-greeting.ts`).
  - Session domain model (`session.ts`) enforcing `CREATED → ACTIVE → SUBMITTED` transitions and immutable submission.
  - SQLite persistence layer (`SqliteSessionStore`) with WAL mode.
  - Candidate session API routes (`activate`, `file`, `submit`) and workspace UI (`/candidate/[token]`).
  - Evaluator authentication (`isEvaluatorCredentialValid`, `evaluatorCookieName`) and diff review UI (`/evaluator`, `/evaluator/sessions/[sessionId]`).
  - Unit and integration tests covering diff generation, lifecycle transitions, persistence reload, and authorization.
- **Vertical Slice 2 (committed in `fd841c6`):**
  - Hardened session-scoped Docker sandbox (`DockerSandboxAdapter`): Alpine base container, unprivileged non-root user (`1000:1000`), network isolation (`--network none`), read-only root filesystem, tmpfs for `/workspace` and `/tmp`, strict resource limits (1 CPU, 512MB RAM, 64 PIDs).
  - Readiness-gated activation: Transition `CREATED → ACTIVE` and assessment timer initialization only occur after sandbox creation and readiness check pass.
  - Memory-bounded stream accumulation (`BoundedStreamAccumulator`): Cap live buffers at 64 KB preview while tracking exact total byte counts and explicit truncation flags.
  - Authoritative append-only event store (`SqliteEventStore`): Monotonic sequence numbers, timestamps, exit codes, durations, truncated output previews, and correlated `commandId`.
  - Process-group timeout termination: Commands timed out at 30s have their process groups and orphaned child processes terminated.
  - Candidate command console and evaluator raw command evidence.
- **Vertical Slice 3 (committed in `1496171`):**
  - Hardened Scenario 001 multi-service image (`delimit-scenario-001:latest`): Ubuntu 24.04-based container packaging Python 3.12, PostgreSQL 16, Redis 7, and Flask storefront inventory service. Runs under `--network none`, `--read-only`, unprivileged non-root user `1000:1000`, tmpfs for `/workspace` (512MB) and `/tmp` (256MB).
  - Multi-service readiness probing & daemon protection: `DockerSandboxAdapter` polls for `/tmp/scenario_ready`, `pg_isready`, and `redis-cli ping` before activation.
  - Multi-file workspace APIs & candidate UI: Endpoints `workspace/tree` and `workspace/file` (GET/PUT) allow candidates to browse files, switch editor tabs with auto-save, and edit repository files in the container filesystem.
  - Authoritative in-container Git diff capture on submission.
- **Vertical Slice 4 (completed):**
  - **Deterministic Chronological Evidence Reconstruction:** Replaces fragmented evidence views with a single, ordered chronological timeline (`chronological-reconstruction.ts`) unifying activation, command executions, file saves, out-of-band changes, capture failures, and final submission.
  - **Platform-Owned Evidence Boundary:** Evidence tree capture (`delimit-capture-tree.sh`, `delimit-diff-trees.sh`, `delimit-baseline-tree.sh`) uses immutable baseline `/opt/delimit/repo-template/.git` and alternate object database `/run/delimit-evidence/objects`. Candidate `.git` tampering, branch switching, index manipulation, or `.gitignore` entries cannot obscure candidate edits or disrupt evidence capture.
  - **`WORKSPACE_CHANGED` & `WORKSPACE_CAPTURE_FAILED` Events:**
    - Recorded across browser saves (`origin: 'browser_save'`) and command boundaries (`origin: 'command_execution'`, with temporal `commandId` correlation).
    - If capture fails, `WORKSPACE_CAPTURE_FAILED` is recorded into the audit trail, maintaining chronological transparency without corrupting session state.
  - **Out-of-Band Workspace Drift Detection:**
    - Before every command, browser save, or submission, `SessionService` compares `currentTree` against `lastKnownTree`.
    - If background processes (e.g. `python3 ... &`) mutate files outside active requests, an out-of-band `WORKSPACE_CHANGED` (`origin: 'out_of_band'`) event is recorded before the next operation, preventing false causal attribution.
    - Presented neutrally in the Evaluator UI as _"Workspace changed between recorded actions"_.
  - **Strict Concurrency Serialization:** In-memory per-session lock serializes saves, command runs, and submissions.
  - **Submission Evidence Boundary:** Submission reconciles drift, captures the final tree and diff, and requires the captured tree to match the last authoritative workspace transition. A mismatch records an evidence gap and leaves the session `ACTIVE` for recovery.
  - **Cleanup Semantics:** `SUBMITTED` means final evidence is durable and candidate mutation APIs are closed. Sandbox teardown follows as infrastructure cleanup; a failure is recorded without reopening or changing submitted evidence.
  - **Bounded Intermediate Evidence & Full Final Diff:** Intermediate change patches are capped at 64 KB with explicit truncation indicators (`isTruncated: true`, `totalBytes`), while the final submission diff remains complete.
  - **Evaluator UI Reconstruction View:** Chronological narrative with step counters, duration badges, execution status, and expandable unified diffs with line-level change summaries.
  - **Full Automated Verification:** The committed Slice 4 baseline passed 14 test suites / 38 tests. The reconciliation adds three focused regressions and passes 14 suites / 41 tests, plus format, lint, typecheck, and the Next.js production build.

## Product question evaluated by Slice 4

> Can a human evaluator understand how candidate work evolved from factual chronological evidence without AI interpretation?

_(The product value of this question will be observed through real evaluator usage rather than speculative assumption.)_

## Explicitly not implemented

- Candidate AI assistant chat and AI interaction logging.
- Platform AI reconstruction service, automated summaries, or evidence citation generation.
- Full interactive PTY / WebSocket terminal streaming (commands remain discrete HTTP execs).
- Automated test run heuristics (`TEST_RUN` event inference).
- Generic scenario plugin / marketplace architectures.
- Candidate scoring, ranking, ATS integrations, or multi-tenant SaaS features.

## Current active plan

None. Vertical Slice 4 implementation is complete; plan preserved in `docs/plans/completed/004-deterministic-evidence-reconstruction.md`.

## Current Git state

- Branch: `main`
- Committed Slice 4 baseline: `b9dc54d66084c608dd688bb71a3e37f197cfc211`
- Commit: `feat: add deterministic evidence reconstruction`
- Committed verification state: 14 test files / 38 tests, with formatting, lint, typecheck, and production build passing.
- A focused Slice 4 baseline reconciliation is awaiting human review before any Slice 5 planning.
- Remotes: None configured.

## Verification commands

- `npm run format:check` — Prettier formatting check
- `npm run lint` — ESLint validation
- `npm run typecheck` — Next route typegen + TypeScript typecheck (`tsc --noEmit`)
- `npm run test` — Vitest unit and integration test suite (currently 14 test suites, 41 tests)
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
- `docs/plans/completed/003-scenario-001-multifile-incident.md` (precedence 9)
- `docs/plans/completed/004-deterministic-evidence-reconstruction.md` (precedence 10)
- `AGENTS.md` (operating guide and agent rules)

## Known risks

- **Docker socket availability in CI:** Docker daemon must be available in environments running integration tests that instantiate real containers (e.g. GitHub Actions runner). Fast mock adapter is available for environments without Docker.
- **Image pre-requisite:** Running Scenario 001 with the real Docker adapter requires the pre-built `delimit-scenario-001:latest` image (`docker build -t delimit-scenario-001:latest scenarios/001-cache-staleness`).

## Next safe action

Review and commit the Slice 4 baseline reconciliation. Do not begin Slice 5 until the reconciled baseline is accepted.
