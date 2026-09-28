# 003 — Scenario 001 Multi-File Incident Environment

## 1. Objective

Deliver the first realistic engineering assessment scenario in Hirearchy Software: **Scenario 001 (Stale storefront inventory after warehouse restock)**.

Transition Hirearchy Software from a synthetic single-file toy fixture to an authentic multi-file Python service backed by local PostgreSQL and Redis instances inside Hirearchy Software's hardened session-scoped sandbox. Enable candidates to browse files, edit multiple files in a multi-file workspace, investigate live services and execute tests via the command console, and submit their work. Capture multi-file git diffs from the authoritative container filesystem and factual chronological command events for evaluator review.

---

## 2. Product Question

> **Can Hirearchy Software host a realistic engineering incident that produces meaningfully different, inspectable candidate work histories?**

This slice tests whether an authentic production defect—with competing hypotheses, a tempting shallow mitigation (TTL reduction), a root invalidation defect, and a subtle key-normalization bug—elicits distinguishable problem-solving paths from candidates, and whether Hirearchy Software's command-and-diff evidence model makes those paths legible to a human evaluator without scoring, candidate classification, or synthetic reconstruction prose.

---

## 3. Scope

1. **Scenario 001 Container Environment (`hirearchy-scenario-001`):**
   - Single session-scoped Docker container with Python 3.11/3.12, Flask, PostgreSQL, Redis, and `pytest`.
   - Strict network isolation (`--network none`). All inter-process communication runs over local Unix sockets or loopback (`127.0.0.1`).
   - Hardened isolation: unprivileged execution (`1000:1000`), read-only root, dedicated writable tmpfs directories for `/workspace`, `/tmp`, PostgreSQL socket/data, and Redis data.
   - Pre-baked Git baseline: Git repository initialized and baseline commit created during `docker build`. Containers start from that exact immutable committed repository state.
   - Service startup and readiness: startup script launches local PostgreSQL and Redis, seeds initial inventory data, and verifies service responsiveness before transitioning the session to `ACTIVE`.
2. **Deterministic Seed State & Bug Mechanics:**
   - Seeded warehouse inventory in PostgreSQL and pre-cached storefront reads in Redis.
   - Deterministic reproduction of stale inventory: restock endpoint commits to PostgreSQL but fails to invalidate or update the cached storefront count in Redis.
   - Warehouse-ID normalization mismatch: storefront reads format warehouse identifiers differently from the restock write path (e.g. `wh-01` vs `WH_01`), creating separate cache keys even when invalidation is attempted.
3. **Multi-File Workspace & Navigation:**
   - Candidate workspace UI with repository file navigation (file tree/list) and editor tabs.
   - Ability to read all repository files (code, tests, brief, README).
   - Ability to edit and save permitted files (application and test files).
   - Traversal protection and path validation.
4. **Authoritative Filesystem & Multi-File Diff Capture:**
   - Sandbox `/workspace` filesystem is the single source of truth: edits made via web editor or CLI commands (`sed`, `cat`, scripts) mutate the same files.
   - Submission executes authoritative `git diff HEAD` inside the container to capture a unified multi-file diff, staging untracked files (`git add -N .`) and excluding runtime artifacts (`.pytest_cache`, `__pycache__`, local DB files, logs).
5. **Evaluator Multi-File Evidence Review:**
   - Chronological raw command evidence view (commands, exit codes, durations, stdout/stderr previews, truncation flags).
   - Multi-file unified diff display showing all modified files with syntax highlighting and file path headers.
6. **Live Product Preview During Implementation:**
   - Real web application kept runnable across 6 defined milestones for interactive manual testing.

---

## 4. Explicit Non-Goals

- **NO Generic Scenario Engine or Plugin System:** Build only what is required to provision and run Scenario 001. No scenario marketplace, dynamic runtime loaders, or abstract scenario manifests.
- **NO Interactive Terminal (PTY / WebSockets / xterm.js):** The HTTP command console remains the sole command interface. Candidates run non-interactive CLI commands (`pytest`, `python`, `curl`, `psql`, `redis-cli`, `git`).
- **NO Test Run Recognition / Inference (`TEST_RUN` events):** Command stdout/stderr and exit codes remain raw evidence. No regex/heuristic parsers converting `pytest` output into synthetic events.
- **NO Candidate AI Assistant:** AI interaction logging is deferred until human baseline problem-solving is observed.
- **NO Evaluator AI Reconstruction / Summarization:** Raw chronological events and multi-file diffs remain the primary evaluation object. No LLM-generated prose summaries.
- **NO Automated Candidate Scoring, Rankings, or Verdicts:** The human evaluator owns the evaluation decision.
- **NO Candidate Path Classification:** Scenario paths (e.g. TTL vs invalidation vs normalization) are scenario validation criteria, never candidate scores, labels, or evaluative categories.
- **NO Docker Compose or Kubernetes:** Single container encapsulation only.

---

## 5. Current Architecture Changes Required

| Component                | Current State (Slice 2)                                                                  | Required State (Slice 3)                                                                                                                                                           | Justification                                                                                             |
| :----------------------- | :--------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------- |
| **Session Domain Model** | Single file strings: `filePath`, `workingContent`, `originalContent`, `submittedContent` | Multi-file repository representation. Working state resides authoritatively in container `/workspace`; session tracks scenario ID, baseline commit, and submitted multi-file diff. | Scenario 001 has 6+ files across directories; single-string fields cannot represent a repository.         |
| **Sandbox Adapter**      | Hardcoded `alpine:3.20`, single file injected via `cat > /workspace/filePath`            | Scenario-specific container image (`hirearchy-scenario-001`), pre-baked git repo in image, multi-service startup.                                                                  | Scenario 001 requires Python, Flask, Postgres, Redis, and pytest pre-installed with zero internet access. |
| **Readiness Check**      | Simple `echo ready` in shell                                                             | Multi-service readiness probe: PostgreSQL responds (`pg_isready`), Redis responds (`redis-cli ping`), seed data confirmed.                                                         | Guarantees the assessment timer starts only when database, cache, and code are ready for candidate work.  |
| **Submission Model**     | Takes single-file string from SQLite store and calls `diff.createTwoFilesPatch`          | Extracts `git diff HEAD` from sandbox `/workspace` before teardown, filtering out runtime junk.                                                                                    | Captures modifications across any permitted files, including changes made via shell scripts or editor.    |
| **Candidate UI**         | Single `<textarea>` editing one hardcoded file                                           | File tree/list navigator + multi-file editor allowing candidate to view any file and edit relevant code.                                                                           | Engineers must inspect tests, app configuration, and multiple modules to diagnose a caching bug.          |
| **Evaluator UI**         | Renders single-file patch from string                                                    | Renders multi-file unified diff with file navigation headers alongside chronological command cards.                                                                                | Evaluators must see changes across `inventory/service.py`, `inventory/cache.py`, and test additions.      |

---

## 6. Scenario Repository Design

The Scenario 001 repository is placed under `scenarios/001-cache-staleness/repository/`:

```
/workspace/
├── README.md                     # Architecture overview, service ports, and CLI access details
├── requirements.txt              # Pinned Python dependencies
├── app.py                        # Minimal Flask app wiring routes to inventory service
├── inventory/
│   ├── __init__.py
│   ├── db.py                     # PostgreSQL connection pool and query helpers
│   ├── cache.py                  # Redis client, key formatting, cache read/write logic
│   └── service.py                # Business logic: get_product_stock() and update_stock()
├── scripts/
│   ├── seed_data.py              # Idempotent database and cache seeding script
│   └── start_services.sh         # Internal script to start PostgreSQL and Redis
└── tests/
    ├── __init__.py
    ├── conftest.py               # Test fixtures (test client, db clean, redis flush)
    └── test_inventory.py         # Baseline behavioral tests
```

### Purpose of Key Files:

- `README.md`: Explains service architecture, local endpoints, how to run tests (`pytest`), and CLI connections (`psql -h 127.0.0.1 -U hirearchy software inventory`, `redis-cli`). Contains no spoilers or debugging hints.
- `inventory/db.py`: PostgreSQL queries using `psycopg2-binary`.
- `inventory/cache.py`: Manages Redis connection and cache keys (`stock:{warehouse_id}:{product_id}`).
- `inventory/service.py`: Implements `get_product_stock()` and `update_stock()`. Contains the missing cache invalidation defect.
- `tests/test_inventory.py`: Behavioral tests verifying inventory reads and restock updates. Includes a test that reproduces the stale cache defect on baseline.

---

## 7. Scenario Runtime & Container Architecture

### 7.1 Single-Container Multi-Service Encapsulation

To preserve `--network none` without external networks or host port conflicts:

- Base image: `python:3.11-slim` with `postgresql` and `redis-server` installed.
- Writable tmpfs directories with `1000:1000` ownership:
  - `/workspace`: tmpfs mounted with `exec` permissions for candidate code.
  - `/tmp`: tmpfs mounted for Unix domain sockets and PID files.
  - `/var/lib/postgresql/data`: tmpfs for PostgreSQL database cluster.
  - `/var/lib/redis`: tmpfs for Redis ephemeral state.
- Hardened flags preserved:
  - `--user 1000:1000`
  - `--network none`
  - `--read-only` root filesystem
  - `--memory=1024m`
  - `--cpus=1.0`
  - `--pids-limit=128`
  - `--cap-drop=ALL`
  - `--security-opt=no-new-privileges:true`

### 7.2 Pre-Baked Git Baseline

During image build (`Dockerfile`):

- Repository files are copied into `/opt/hirearchy/repo-template`.
- A Git repository is initialized with `git init`.
- User config set: `Candidate <candidate@hirearchy.local>`.
- Initial commit created: `git commit -m "baseline scenario state"`.
  At container startup, the template is synced to `/workspace` tmpfs, ensuring every session starts with an identical, clean Git baseline commit.

### 7.3 Service Startup & Readiness Gate

Container initialization script `/usr/local/bin/hirearchy-scenario-init.sh`:

1. Initializes PostgreSQL database cluster in `/var/lib/postgresql/data` as user `1000:1000`.
2. Starts PostgreSQL on local socket `/tmp` and `127.0.0.1:5432`.
3. Starts Redis on local socket `/tmp/redis.sock` and `127.0.0.1:6379`.
4. Runs `python3 /workspace/scripts/seed_data.py` to create schema and insert seed records.
5. Executes `sleep infinity` as PID 1 to keep the container running.

The readiness probe verifies:

```sh
pg_isready -h 127.0.0.1 -p 5432 -q && \
redis-cli ping | grep -q PONG && \
python3 -c "from inventory.db import get_connection; get_connection().close()" && \
echo "SCENARIO_001_READY"
```

Session only transitions to `ACTIVE` and begins the timer once readiness succeeds.

---

## 8. Seed Data & Bug Mechanics

### 8.1 Seed State

- **Warehouses:**
  - `WH-EAST-01` (primary distribution center)
  - `WH-WEST-02` (regional warehouse)
- **Product:**
  - `PROD-1001` (Wireless Noise-Canceling Headphones)
- **Initial Database Record (PostgreSQL):**
  - Restocked quantity: `150` units in `WH-EAST-01`.
- **Initial Cache Record (Redis):**
  - Key: `stock:wh_east_01:PROD-1001`
  - Value: `0` (out of stock, cached prior to restock with 1-hour TTL).

### 8.2 The Defects

1. **Defect 1 (Missing Cache Invalidation):**
   `update_stock()` updates the quantity in PostgreSQL but fails to invalidate or update the Redis cache entry.
2. **Defect 2 (Warehouse Identifier Normalization Mismatch):**
   Storefront read path normalizes warehouse IDs with lowercase and hyphens (`wh-east-01`), while restock write path normalizes with underscores (`wh_east_01`). Simple cache deletion using raw or mismatched keys deletes the wrong key.

### 8.3 Scenario Validation Matrix (Platform Regression Tests)

- **Baseline Test:** Running `pytest` on the untouched repository reproduces the stale cache defect.
- **TTL Mitigation Regression Test:** Lowering TTL to 1 second hides the symptom on delayed reads but fails the immediate consistency test contract.
- **Incomplete Invalidation Regression Test:** Adding cache invalidation without key normalization fixes single-format calls but fails warehouse identifier normalization tests.
- **Full Behavioral Test:** Complete invalidation and normalized key construction passes all scenario acceptance tests.

_Note: These tests are platform regression tests to guarantee scenario depth; they are not candidate grading scripts._

---

## 9. Multi-File Workspace Model

- **File Exploration:** Candidate can inspect any file under `/workspace` via file navigator.
- **File Editing:** Candidate can open and edit any source or test file.
- **Path Validation:** All paths are resolved against `/workspace` with traversal prevention (`assertWithinWorkspace(path)`). Any path attempting `..` escapes or symlink breakouts returns HTTP 400 `INVALID_PATH`.
- **Authoritative Filesystem:** Edits saved via web editor write directly to `/workspace`. Edits made via command console (`sed`, `cat`, python) mutate `/workspace`. Browser file reloading fetches fresh container filesystem state.

---

## 10. Submission Snapshot & Multi-File Diff

Upon candidate submission:

1. Candidate clicks Submit in workspace UI.
2. Server runs `git -C /workspace add -N .` inside the container to stage any untracked new files.
3. Server executes `git -C /workspace diff HEAD` to capture the unified multi-file diff.
4. Clean `.gitignore` ensures build/runtime artifacts (`__pycache__`, `.pytest_cache`, logs, local DB files) are excluded from the diff.
5. Diff string is stored in `assessment_sessions.submitted_diff`.
6. Container is destroyed (`docker rm -f`).
7. Subsequent command execution or file saves are rejected with `SESSION_NOT_ACTIVE`.

---

## 11. Persistence Schema Updates

```sql
ALTER TABLE assessment_sessions ADD COLUMN scenario_type TEXT DEFAULT 'single_file';
ALTER TABLE assessment_sessions ADD COLUMN submitted_diff TEXT;
```

Backward compatibility preserved for legacy single-file sessions.

---

## 12. Candidate Task Brief

> **Incident: Stale storefront inventory after warehouse restock**
>
> **Context:**
> Warehouse staff recently restocked units of product `PROD-1001` into warehouse `WH-EAST-01`. The database reflects the restocked quantity, but customers on the storefront are still seeing the item as out of stock.
>
> **Expected Behavior:**
> After stock is updated in the warehouse, subsequent reads from the storefront must reflect the current inventory without serving stale cached counts.
>
> **Environment & Tools:**
>
> - The inventory service is in `/workspace` (Flask app backed by PostgreSQL and Redis).
> - Tests can be run from the command console: `pytest`
> - PostgreSQL CLI: `psql -h 127.0.0.1 -U hirearchy software inventory`
> - Redis CLI: `redis-cli`
>
> **Your Task:**
>
> 1. Investigate the cause of the discrepancy.
> 2. Implement an appropriate fix in the codebase.
> 3. Verify that your change corrects the issue and does not introduce regressions.
> 4. Submit your work when finished.

---

## 13. Evaluator Experience Design

- Evaluator reviews session at `/evaluator/sessions/[sessionId]`.
- Top: Session metadata, activated at, submitted at, duration.
- Main View:
  - Multi-file unified diff viewer with file headers and syntax additions/deletions.
  - Chronological command cards: command line, exit code, duration, stdout/stderr previews, and truncation indicators.

---

## 14. Live Product Preview Checkpoints

During implementation, the web application will be kept continuously running and accessible for manual browser testing at 6 mandatory milestones:

### Checkpoint 1: Scenario 001 Sandbox Activation

- **Milestone:** Scenario 001 Docker image builds, runs PostgreSQL/Redis under `--network none`, passes readiness probe, and transitions session to `ACTIVE`.
- **Preview Report:** App URL, session creation, Docker container inspection.

### Checkpoint 2: Multi-File Repository Browser

- **Milestone:** Candidate UI displays file tree of `/workspace` and renders file contents in read-only mode.
- **Preview Report:** Candidate workspace URL, browsing files (`app.py`, `inventory/service.py`, `README.md`).

### Checkpoint 3: Multi-File Editing & Saving

- **Milestone:** Candidate can edit files in the web editor, save them, and verify that changes synchronize directly to `/workspace`.
- **Preview Report:** Candidate workspace URL, saving changes, verifying persistence across file switches.

### Checkpoint 4: Command Console Investigation of Live Services

- **Milestone:** Candidate command console executes queries against PostgreSQL and Redis, and runs `pytest` reproducing the baseline bug.
- **Preview Report:** Sample commands (`pytest`, `redis-cli keys "*"`, `psql -c "SELECT * FROM inventory;"`).

### Checkpoint 5: Submission & Multi-File Diff Capture

- **Milestone:** Submission executes `git diff HEAD` inside the container, captures multi-file diff, tears down sandbox, and rejects subsequent commands.
- **Preview Report:** Submission verification, container teardown confirmation, stored diff inspection.

### Checkpoint 6: Evaluator Multi-File Evidence Review

- **Milestone:** Evaluator interface displays the complete multi-file diff alongside the chronological command cards.
- **Preview Report:** Evaluator review URL (`/evaluator/sessions/[sessionId]`), inspecting multi-file diff and command stream.

---

## 15. Implementation Sequence

### Phase 1: Scenario 001 Codebase, Image & Activation

1. Create `scenarios/001-cache-staleness/repository/` with Flask, Postgres DB, Redis cache, service logic, and pytest suite.
2. Author `Dockerfile` and `start_services.sh` with unprivileged execution, pre-baked git baseline, and local socket/loopback services.
3. Build image: `docker build -t hirearchy-scenario-001:latest scenarios/001-cache-staleness`.
4. Update `DockerSandboxAdapter` to support Scenario 001 image and multi-service readiness check.
5. **>> LIVE PREVIEW CHECKPOINT 1: Scenario 001 Sandbox Activation <<**

### Phase 2: Multi-File Workspace API & Navigation UI

1. Implement workspace tree, read, and write API endpoints with path traversal validation.
2. Build file navigator (tree/list) and editor tab switching in candidate UI.
3. **>> LIVE PREVIEW CHECKPOINT 2: Multi-File Repository Browser <<**
4. Connect editor saving to container filesystem via PUT API.
5. **>> LIVE PREVIEW CHECKPOINT 3: Multi-File Editing & Saving <<**

### Phase 3: Service Investigation & Command Console

1. Verify command console operates against Scenario 001 environment.
2. Validate CLI tools in container (`psql`, `redis-cli`, `pytest`, `python`).
3. Verify state persistence between editor saves and command-line execution.
4. **>> LIVE PREVIEW CHECKPOINT 4: Command Console Investigation of Live Services <<**

### Phase 4: Submission & Multi-File Diff Capture

1. Implement in-container git diff extraction in `DockerSandboxAdapter.captureDiff(sessionId)`.
2. Stage untracked files (`git add -N .`) to include new candidate files.
3. Update `SessionService.submit` to capture and store multi-file diff.
4. Verify sandbox teardown destroys Postgres and Redis cleanly.
5. **>> LIVE PREVIEW CHECKPOINT 5: Submission & Multi-File Diff Capture <<**

### Phase 5: Evaluator Evidence Presentation & Verification

1. Update evaluator UI to render multi-file diffs cleanly with file path headers.
2. Verify chronological command events render alongside multi-file diffs.
3. **>> LIVE PREVIEW CHECKPOINT 6: Evaluator Multi-File Evidence Review <<**
4. Run full test suite (`npm run verify`) and author comprehensive integration tests.

---

## 16. Test Strategy

1. **Scenario Environment Integration Tests (`tests/integration/scenario-001-environment.test.ts`):**
   - Spins up `hirearchy-scenario-001` container.
   - Verifies PostgreSQL is listening and seeded with `PROD-1001` quantity `150`.
   - Verifies Redis is listening and pre-cached with stale value `0`.
   - Verifies baseline `pytest` runs and fails with expected stale cache assertion.
2. **Multi-File Workspace Tests (`tests/unit/workspace-paths.test.ts` & integration):**
   - Path traversal attempts (`../../etc/passwd`, `/etc/shadow`) are rejected with 400 `INVALID_PATH`.
   - Reading and writing nested files (`inventory/service.py`) works and updates container filesystem.
   - Editing a file via CLI (`echo "# test" >> inventory/cache.py`) is reflected in subsequent file read API call.
3. **Submission & Multi-File Diff Tests (`tests/integration/scenario-001-submission.test.ts`):**
   - Modifying two files + creating one new file produces a clean 3-file git diff.
   - Runtime junk (`__pycache__`, `.pytest_cache`) is strictly excluded from the submitted diff.
   - Post-submission commands are rejected, and the container is completely destroyed.
4. **Scenario Validation Tests (Depth Verification):**
   - Verify baseline exhibits stale cache defect.
   - Verify TTL reduction fails immediate consistency requirement.
   - Verify invalidation without key normalization fails warehouse identifier test.
   - Verify complete invalidation + normalization fix passes full test suite.
5. **Regression Verification:**
   - Legacy Slice 1 & Slice 2 tests continue to pass.
   - `npm run verify` passes with 0 lint, 0 typecheck, and 0 test failures.

---

## 17. Definition of Done

1. Scenario 001 container image (`hirearchy-scenario-001:latest`) builds deterministically and starts under `--network none` with unprivileged execution.
2. Candidate can activate a Scenario 001 session, browse the multi-file codebase, view README/brief, edit multiple files, and save changes.
3. Candidate can execute commands in the console (`pytest`, `psql`, `redis-cli`, `python`) against the running services, observing authentic outputs.
4. Both Scenario 001 defects (missing invalidation and key normalization) are faithfully reproducible on baseline.
5. Candidate submission captures an authoritative multi-file git diff from the container filesystem and tears down all container processes.
6. Evaluator view presents the complete chronological command stream and multi-file diff without scoring or automated inference.
7. All 6 Live Preview Checkpoints have been demonstrated and verified on the running development server.
8. Comprehensive automated tests pass and `npm run verify` exits with code 0.
