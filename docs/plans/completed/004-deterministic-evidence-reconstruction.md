# Implementation Plan: Vertical Slice 4 — Deterministic Chronological Evidence Reconstruction

> **Document Target:** `docs/plans/completed/004-deterministic-evidence-reconstruction.md`
> **Status:** Completed & Accepted
> **Preceding Baseline Commit:** `14961716d99d7e59366496cd47b55ec7717ab692` (Slice 3 committed)

---

## 1. Foundational Product Invariant

> **Candidate-controlled state may be the subject of evidence, but it must never control the mechanism used to establish that evidence.**

This invariant governs the entire evidence architecture:

- Delimit never relies on candidate-controlled Git metadata (`/workspace/.git`).
- Delimit never relies on candidate-controlled ignore rules (`/workspace/.gitignore`).
- Delimit never leaves evidence indices, object stores, or platform bookkeeping in candidate-writable paths (`/tmp`, `/workspace`).
- Delimit derives all evidence from trusted platform-owned baselines, protected execution identities, and server-side monotonic sequence allocation.

---

## 2. Core Product Architecture

### Where does mutable Delimit evidence state live, who can access it, and what survives after the sandbox is destroyed?

| Lifecycle Phase     | State / Component                      | Storage Location                                                                                                                 | Access Control                                                                                                                                                                                                                                                            | Durability / Retention                                                                                                                                                                         |
| :------------------ | :------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Active Session**  | **Immutable Baseline Authority**       | `/opt/delimit/repo-template/.git` inside container                                                                               | Read-only Docker layer (`--read-only`), owned by root. Inaccessible to candidate modification.                                                                                                                                                                            | Survives indefinitely baked inside the Docker image (`delimit-scenario-001:latest`).                                                                                                           |
| **Active Session**  | **Platform-Owned Evidence Store**      | `/run/delimit-evidence/` inside container (tmpfs):<br>• `/run/delimit-evidence/objects`<br>• `/run/delimit-evidence/idx_${uuid}` | Mode `0700`, owned by `root:root` (UID 0). Accessible **only** to platform control-plane operations (`docker exec -u 0:0`). Candidate UID `1000:1000` cannot traverse, list, read, write, or delete evidence files.                                                       | Destroyed deterministically upon session submission / sandbox teardown (`docker rm -f`).                                                                                                       |
| **Active Session**  | **Candidate Workspace**                | `/workspace` (tmpfs 512MB)                                                                                                       | Owned by `delimit:delimit` (UID `1000:1000`). Candidate commands execute here.                                                                                                                                                                                            | Destroyed upon session submission / sandbox teardown.                                                                                                                                          |
| **Post-Submission** | **Authoritative Event Log**            | Host SQLite database (`.data/delimit.sqlite` → `session_events`)                                                                 | Server-side process only. Contains monotonic sequences, timestamps, `COMMAND_STARTED`, `COMMAND_FINISHED`, `WORKSPACE_CHANGED` (with `beforeTree`, `afterTree`, line stats, bounded patch previews, truncation metadata), and any `WORKSPACE_CAPTURE_FAILED` gap markers. | **Durable & Immutable.** Survives container teardown.                                                                                                                                          |
| **Post-Submission** | **Final Submitted Diff**               | Host SQLite database (`.data/delimit.sqlite` → `sessions.submitted_diff`)                                                        | Server-side process only. Captures complete, untruncated multi-file diff of candidate end state relative to baseline $T_0$.                                                                                                                                               | **Durable & Immutable.** Survives container teardown.                                                                                                                                          |
| **Post-Submission** | **Intermediate Git Tree/Blob Objects** | N/A (Option A retention)                                                                                                         | N/A                                                                                                                                                                                                                                                                       | **Destroyed with container.** Tree hashes in events serve as immutable cryptographic transition identifiers. UI explicitly notes intermediate full patches are not retrievable after teardown. |

---

## 3. Product Objective & Problem Statement

### 3.1 Objective

Slice 3 proved that Delimit can host a realistic multi-file engineering incident (Scenario 001) in an isolated sandbox and capture candidate commands and a final multi-file diff.

However, the evaluator experience remains fragmented: atomic `COMMAND_STARTED` / `COMMAND_FINISHED` events and a single cumulative submission diff do not reveal **how candidate work evolved over time**. The evaluator cannot tell what code changed between commands, whether a test failed before or after a fix, or what intermediate hypotheses the candidate explored.

**Slice 4 Objective:** Build a deterministic, factual evidence reconstruction engine that captures in-workspace file mutations across both browser saves and terminal commands, chains them via immutable Git tree hashes, and projects the event stream into **one continuous chronological work history** for the human evaluator.

### 3.2 Core Product Question

> **Can Delimit turn raw candidate workspace activity into an authoritative chronological evidence object that a human evaluator can understand efficiently without relying on AI interpretation?**

If yes, hiring clarity is achieved through factual observability alone. Future AI assistance then becomes an optional compression and citation layer rather than an indispensable prosthetic for incomplete evidence.

---

## 4. Scope

1. **Delimit-Owned Immutable Git Baseline & Alternate Object Store:**
   - Reference baseline commit ($T_0$) from `/opt/delimit/repo-template/.git`.
   - Store newly generated intermediate evidence objects in protected `/run/delimit-evidence/objects`.
   - Candidate manipulation or deletion of `/workspace/.git` has zero effect on Delimit evidence capture.
2. **Ephemeral Evidence Scratch Isolation:**
   - Execute tree captures using strictly ephemeral temporary indices (`GIT_INDEX_FILE=/run/delimit-evidence/idx_${uuid}`).
   - Temporary indices are created, evaluated, and trap-unlinked within protected storage.
   - Zero platform evidence state is ever placed in candidate-accessible `/tmp` or `/workspace`.
3. **Delimit-Owned Exclusion Policy (Immune to Candidate `.gitignore`):**
   - Force-add all candidate files (`git add -f -A`) while applying an explicit Delimit-owned recursive pathspec exclusion policy.
   - Candidate `.gitignore` edits cannot suppress candidate files from evidence.
   - True platform/runtime noise (`.git`, `__pycache__`, `.pytest_cache`, logs) is strictly excluded.
4. **Authoritative `WORKSPACE_CHANGED` Event with Tree Chaining:**
   - Emit `WORKSPACE_CHANGED` recording `beforeTree`, `afterTree`, `origin` (`browser_save` vs `command_execution`), correlated `commandId` (when applicable), line stats, and bounded patch preview with explicit truncation metadata.
   - Single unified Git tree comparison model used for both browser saves and command executions.
5. **Universal Session Workspace Serialization:**
   - Single per-session execution queue covering browser saves, command executions (with pre/post capture), and final submission (with final capture and container teardown).
   - Lifecycle state checked and transitioned atomically _inside_ the lock.
6. **Explicit Platform Failure Semantics:**
   - Pre-command capture failure: abort command execution before candidate code runs; return HTTP 500 `PLATFORM_CAPTURE_FAILED`.
   - Post-command capture failure: record command execution and append explicit `WORKSPACE_CAPTURE_FAILED` event documenting the gap. Never fabricate "no change".
   - Browser save post-write capture failure: append `WORKSPACE_CAPTURE_FAILED` (`phase: 'browser_save'`) and return platform error.
   - Submission capture failure: preserve session in `ACTIVE`, do not destroy sandbox, append `WORKSPACE_CAPTURE_FAILED` (`phase: 'submission'`), allowing retry.
7. **Tree Object Retention (Option A):**
   - Hashes serve as cryptographic integrity identifiers.
   - Events store bounded previews (up to 64 KB) with total byte counts.
   - UI explicitly discloses when previews are truncated and clarifies intermediate full patches are not retrievable after sandbox teardown.
8. **Deterministic Evaluator Reconstruction Timeline:**
   - Project raw events into a single chronological timeline:
     - Boundary markers derived from session lifecycle (`SESSION_ACTIVATED`, `SESSION_SUBMITTED`).
     - Folded `CommandExecutionItem`s combining correlated STARTED/FINISHED events into single execution cards.
     - `WorkspaceChangeItem`s with changed files, `+N / -M`, and expandable patch previews.
     - Final cumulative submission diff.
   - Expandable drill-down to raw underlying event envelopes (`evt_...`, monotonic sequence, raw payload).

---

## 5. Non-Goals

- **NO AI/LLM integration:** Zero LLM calls, zero AI-generated prose, zero synthesized summaries.
- **NO intent or competence inference:** No claims of candidate realization, understanding, or quality.
- **NO candidate scoring or ranking:** Evaluator owns all hiring evaluation.
- **NO test semantic recognition:** Do not parse `pytest` output into pass/fail counters or structured test events.
- **NO interactive PTY / WebSockets / xterm.js:** Keep the existing robust HTTP command console.
- **NO candidate file-open tracking:** `WORKSPACE_FILE_OPENED` remains deferred to avoid client-side noise.
- **NO keystroke tracking or video playback.**
- **NO generic analytics dashboards, heatmaps, or filtering DSLs.**

---

## 6. Threat Model & Sandboxing Architecture

### 6.1 Candidate Background Processes & Filesystem Isolation

- **Threat:** A candidate command may spawn a background process (e.g. `python watcher.py &` or shell daemon) that continues running after the command returns. If evidence capture uses candidate-accessible paths like `/tmp` or `/workspace`, background processes could monitor, corrupt, or race evidence capture.
- **Defense:**
  - The container provisions a dedicated tmpfs mount `/run/delimit-evidence` (size 64MB) with mode `0700`, owned by `root:root` (UID 0).
  - Candidate commands and descendant background processes execute under unprivileged user `delimit` (UID `1000:1000`).
  - UID 1000 cannot traverse, list contents, read, write, or delete files inside `/run/delimit-evidence`.
  - Platform evidence capture executes via `docker exec -u 0:0` (control plane), which has exclusive access to `/run/delimit-evidence`.

### 6.2 Immutable Baseline & Alternate Object Directory

- **Threat:** `git write-tree` requires writing tree and blob objects, but `/opt/delimit/repo-template/.git` is mounted read-only (`--read-only`).
- **Defense:**
  - Delimit configures Git plumbing to read baseline objects from the immutable baseline while writing new evidence objects to the protected evidence store:
    ```sh
    GIT_DIR=/opt/delimit/repo-template/.git
    GIT_WORK_TREE=/workspace
    GIT_OBJECT_DIRECTORY=/run/delimit-evidence/objects
    GIT_ALTERNATE_OBJECT_DIRECTORIES=/opt/delimit/repo-template/.git/objects
    ```
  - Unchanged files are referenced from the read-only baseline; new intermediate blobs/trees are written to `/run/delimit-evidence/objects`.
  - The baseline repository is never modified.

### 6.3 Delimit-Owned Recursive Exclusions vs Candidate `.gitignore`

- **Threat:** A candidate adds `inventory/**` or `tests/**` to `/workspace/.gitignore` to conceal modifications or trick diffing tools.
- **Defense:**
  - Delimit uses force-add with explicit recursive pathspec exclusions:
    ```sh
    git add -f -A -- . \
      ':(exclude,top).git' \
      ':(exclude)**/__pycache__/**' \
      ':(exclude)__pycache__/**' \
      ':(exclude)**/*.pyc' \
      ':(exclude)*.pyc' \
      ':(exclude)**/.pytest_cache/**' \
      ':(exclude).pytest_cache/**' \
      ':(exclude)**/*.log' \
      ':(exclude)*.log'
    ```
  - `git add -f -A` overrides any `.gitignore` file present in the worktree.
  - Candidate source code (e.g. `inventory/new_logic.py`) is unconditionally indexed even if `.gitignore` contains `inventory/**`.
  - The candidate's `.gitignore` file itself is tracked as candidate source work and will appear in diffs if modified.
  - True platform noise (nested `__pycache__`, `.pytest_cache`, logs) is strictly filtered out.

---

## 7. Event Model & Taxonomy

Update `apps/web/src/events/session-event.ts`:

```typescript
export type SessionEventType =
  | 'COMMAND_STARTED'
  | 'COMMAND_FINISHED'
  | 'WORKSPACE_CHANGED'
  | 'WORKSPACE_CAPTURE_FAILED';

export type WorkspaceFileChange = Readonly<{
  path: string;
  status: 'modified' | 'added' | 'deleted';
  additions: number;
  deletions: number;
  patchPreview: string;
  patchPreviewBytes: number;
  patchBytes: number;
  patchTruncated: boolean;
}>;

export type WorkspaceChangedPayload = Readonly<{
  changeId: string;
  origin: 'browser_save' | 'command_execution';
  commandId?: string; // present when origin is command_execution
  beforeTree: string; // 40-character Git tree SHA
  afterTree: string; // 40-character Git tree SHA
  files: readonly WorkspaceFileChange[];
  totalAdditions: number;
  totalDeletions: number;
}>;

export type WorkspaceCaptureFailedPayload = Readonly<{
  commandId?: string;
  phase: 'pre_command' | 'post_command' | 'browser_save' | 'submission';
  beforeTree: string | null;
  errorMessage: string;
}>;

export type SessionEventPayload =
  | CommandStartedPayload
  | CommandFinishedPayload
  | WorkspaceChangedPayload
  | WorkspaceCaptureFailedPayload;
```

---

## 8. Ephemeral Evidence Capture Scripts

### 8.1 In-Container Script: `delimit-capture-tree.sh`

Installed at `/usr/local/bin/delimit-capture-tree.sh` (owned by root, mode `0755`):

```bash
#!/bin/sh
set -e

EVIDENCE_DIR="/run/delimit-evidence"
INDEX_FILE="${EVIDENCE_DIR}/idx_$(python3 -c 'import uuid; print(uuid.uuid4().hex)')"

# Exception-safe cleanup: remove ephemeral index on exit, error, or signal
cleanup() {
    rm -f "${INDEX_FILE}"
}
trap cleanup EXIT INT TERM HUP

export GIT_DIR="/opt/delimit/repo-template/.git"
export GIT_WORK_TREE="/workspace"
export GIT_OBJECT_DIRECTORY="${EVIDENCE_DIR}/objects"
export GIT_ALTERNATE_OBJECT_DIRECTORIES="/opt/delimit/repo-template/.git/objects"
export GIT_INDEX_FILE="${INDEX_FILE}"

mkdir -p "${EVIDENCE_DIR}/objects"

# Force-index workspace while respecting only Delimit-owned recursive exclusion pathspecs
git add -f -A -- . \
  ':(exclude,top).git' \
  ':(exclude)**/__pycache__/**' \
  ':(exclude)__pycache__/**' \
  ':(exclude)**/*.pyc' \
  ':(exclude)*.pyc' \
  ':(exclude)**/.pytest_cache/**' \
  ':(exclude).pytest_cache/**' \
  ':(exclude)**/*.log' \
  ':(exclude)*.log'

# Write tree to evidence object directory and output hash
TREE_HASH=$(git write-tree)

echo "${TREE_HASH}"
```

### 8.2 In-Container Script: `delimit-diff-trees.sh`

Installed at `/usr/local/bin/delimit-diff-trees.sh` (owned by root, mode `0755`):

```bash
#!/bin/sh
set -e

BEFORE_TREE="$1"
AFTER_TREE="$2"

EVIDENCE_DIR="/run/delimit-evidence"

export GIT_DIR="/opt/delimit/repo-template/.git"
export GIT_WORK_TREE="/workspace"
export GIT_OBJECT_DIRECTORY="${EVIDENCE_DIR}/objects"
export GIT_ALTERNATE_OBJECT_DIRECTORIES="/opt/delimit/repo-template/.git/objects"

# Output numstat and raw patch between two tree hashes
git diff --numstat "${BEFORE_TREE}" "${AFTER_TREE}"
echo "---DELIMIT_DIFF_BOUNDARY---"
git diff "${BEFORE_TREE}" "${AFTER_TREE}"
```

---

## 9. Universal Concurrency & Serialization Model

To eliminate race conditions between browser saves, command executions, and session submission, `SessionService` implements an in-memory asynchronous mutex per session:

```typescript
private sessionQueues: Map<string, Promise<void>> = new Map();

private async withSessionLock<T>(sessionId: string, fn: () => Promise<T>): Promise<T> {
  const prev = this.sessionQueues.get(sessionId) ?? Promise.resolve();
  let release: () => void;
  const next = new Promise<void>((res) => { release = res; });
  this.sessionQueues.set(sessionId, next);

  await prev;
  try {
    return await fn();
  } finally {
    release!();
  }
}
```

### Coverage & Lifecycle Invariant

The lock strictly encloses:

1. `saveWorkspaceFile`:
   - Check `session.status === 'ACTIVE'`.
   - Pre-save drift detection: compare current tree against `lastKnownTree`. If drift exists, append out-of-band `WORKSPACE_CHANGED` (`origin: 'out_of_band'`).
   - Use current tree as `beforeTree`. If pre-save capture fails: abort write, return HTTP 500 `PLATFORM_CAPTURE_FAILED`.
   - Write file to `/workspace`. If write fails: propagate write error, emit no event.
   - Post-write tree capture. If fails: **append `WORKSPACE_CAPTURE_FAILED` (`phase: 'browser_save'`)** and return HTTP 500.
   - If `beforeTree !== afterTree`: diff and append `WORKSPACE_CHANGED` (`origin: 'browser_save'`).
2. `executeCommand`:
   - Check `session.status === 'ACTIVE'`.
   - Pre-command drift detection: compare current tree against `lastKnownTree`. If drift exists, append out-of-band `WORKSPACE_CHANGED` (`origin: 'out_of_band'`).
   - Use current tree as `beforeTree`. If pre-command capture fails: abort command execution before running; return HTTP 500.
   - Append `COMMAND_STARTED`.
   - Execute command in sandbox (as UID `1000:1000`).
   - Append `COMMAND_FINISHED`.
   - Post-command tree capture. If fails: **append `WORKSPACE_CAPTURE_FAILED` (`phase: 'post_command'`)**.
   - If `beforeTree !== afterTree`: diff and append `WORKSPACE_CHANGED` (`origin: 'command_execution'`).
     _(Note: `commandId` on this event represents temporal correlation across the command execution boundary, not an exclusive causal assertion if candidate background processes were concurrently alive)._
3. `submit`:
   - Check `session.status === 'ACTIVE'`.
   - Pre-submit drift detection: compare current tree against `lastKnownTree`. If drift exists, append out-of-band `WORKSPACE_CHANGED` (`origin: 'out_of_band'`).
   - Capture `submittedTree` (= current tree).
   - Capture final diff against baseline $T_0$.
   - If final tree capture or final diff capture fails:
     - **Do NOT transition to `SUBMITTED`.**
     - **Do NOT destroy sandbox.**
     - Append `WORKSPACE_CAPTURE_FAILED` (`phase: 'submission'`).
     - Return HTTP 500 `PLATFORM_CAPTURE_FAILED`, keeping session `ACTIVE` for retry.
   - Only after successful tree & diff capture:
     - Verify tree consistency: `submittedTree === lastWorkspaceEvent.afterTree`.
     - Teardown sandbox container.
     - Transition session state to `SUBMITTED`.

Status checks are evaluated **inside** the lock, preventing mutations from slipping in after submission has started.

---

## 10. Platform Failure Semantics

Delimit explicitly accounts for potential capture failures without fabricating state or hiding evidence gaps:

1. **Pre-Command Capture Failure:**
   - If `delimit-capture-tree.sh` fails before a candidate command runs:
   - **Action:** Abort immediately. Do **not** execute candidate code.
   - **Response:** Return HTTP 500 `PLATFORM_CAPTURE_FAILED`.
2. **Post-Command Capture Failure:**
   - If candidate command executed, but post-command tree capture fails:
   - **Action:** Preserve the command evidence (`COMMAND_STARTED` + `COMMAND_FINISHED`).
   - **Evidence Event:** Append `WORKSPACE_CAPTURE_FAILED` with `phase: 'post_command'`, `commandId`, `beforeTree`, and `errorMessage`.
   - **UI Rendering:** Evaluator timeline displays a high-contrast **Workspace Gap Card** stating that filesystem changes following the command could not be captured.
3. **Browser Save Post-Write Capture Failure:**
   - If file was written to disk but post-write capture fails:
   - **Evidence Event:** Append `WORKSPACE_CAPTURE_FAILED` (`phase: 'browser_save'`) recording `beforeTree` and error.
   - **Response:** Return HTTP 500 to candidate.
4. **Submission Capture Failure:**
   - If final tree or diff capture fails:
   - **Session State:** Session remains `ACTIVE`; container remains running.
   - **Evidence Event:** Append `WORKSPACE_CAPTURE_FAILED` (`phase: 'submission'`).
   - **Response:** Return HTTP 500, allowing candidate to retry submission.

---

## 11. Bounded Patch Previews & Raw Evidence Semantics (Option A)

### Retention Model: Option A (Hashes as Integrity Identifiers)

- Intermediate full patches are not guaranteed to be reconstructable after sandbox teardown because `/run/delimit-evidence/objects` is destroyed with the container.
- The stored event preserves:
  - `beforeTree`: 40-character SHA.
  - `afterTree`: 40-character SHA.
  - `patchPreview`: Stored diff slice (up to 64 KB).
  - `patchPreviewBytes`: Length of preview.
  - `patchBytes`: Total byte length of full diff.
  - `patchTruncated: boolean`.
- **Evaluator UI Contract:**
  - If truncated, the UI displays:
    `Patch preview truncated — 65,536 of 184,220 bytes retained. Intermediate full patch not retained after session teardown.`
  - The UI does not claim the complete intermediate patch can be retrieved.
- **Final Submitted Diff:** The final submission diff ($T_0 \to \text{submittedTree}$) is complete, durable, and permanently stored in SQLite.

---

## 12. Evaluator Reconstruction Projection

### 12.1 Projection Model

A pure deterministic function `buildChronologicalReconstruction(session, events)` transforms flat events into a unified work history without AI interpretation:

```typescript
export type ReconstructionItem =
  | {
      kind: 'SESSION_ACTIVATED';
      timestamp: string; // derived from session.activatedAt
    }
  | {
      kind: 'COMMAND_EXECUTION';
      commandId: string;
      command: string;
      cwd: string;
      startedAt: string;
      finishedAt: string;
      durationMs: number;
      exitCode: number | null;
      timedOut: boolean;
      stdoutPreview: string;
      stderrPreview: string;
      rawStartedEventId: string;
      rawFinishedEventId: string;
      sequence: number; // sequence of COMMAND_FINISHED
    }
  | {
      kind: 'WORKSPACE_CHANGE';
      changeId: string;
      origin: 'browser_save' | 'command_execution';
      commandId?: string;
      timestamp: string;
      beforeTree: string;
      afterTree: string;
      files: readonly WorkspaceFileChange[];
      totalAdditions: number;
      totalDeletions: number;
      rawEventId: string;
      sequence: number;
    }
  | {
      kind: 'WORKSPACE_GAP';
      timestamp: string;
      commandId?: string;
      phase: string;
      errorMessage: string;
      rawEventId: string;
      sequence: number;
    }
  | {
      kind: 'SESSION_SUBMITTED';
      timestamp: string; // derived from session.submittedAt
      submittedDiff: string;
    };
```

### 12.2 Evaluator Page Structure (`/evaluator/sessions/[sessionId]`)

1. **Header & Metadata Strip:** Session ID, scenario title, submitted timestamp, total events count, total commands executed, total workspace mutations.
2. **Section 01: Chronological Work History (Timeline):**
   - Single linear vertical sequence.
   - **Command execution cards:** Combined started/finished card with status badge (`Exit 0`, `Exit 1`, `Timed out`), duration, command line (`$ pytest`), and expandable stdout/stderr block.
   - **Workspace change cards:** Inline diff summary (`inventory/service.py +4 -1`), origin tag (`browser save` or `command: sed ...`), and expandable unified diff block.
   - **Workspace gap cards:** High-contrast alert marking any platform capture failure, ensuring evidence gaps are immediately visible to human evaluators.
   - **Raw Evidence Toggle:** Every card features a discrete toggle to view the raw stored event envelope (`evt_...`, monotonic sequence, server timestamp, raw JSON payload).
3. **Section 02: Deterministic Unified Diff:**
   - Full final cumulative diff against baseline commit $T_0$.

---

## 13. Test Strategy & Acceptance Cases

### 13.1 Mandatory Acceptance Cases

1. **Immutable Baseline Integrity:**
   - Verify `/opt/delimit/repo-template/.git` is mounted read-only.
   - Verify candidate attempts to write to it fail with `Read-only file system`.
2. **Candidate `.git` Destruction:**
   - Candidate executes `rm -rf /workspace/.git`.
   - Subsequent browser saves and terminal commands still capture `WORKSPACE_CHANGED` events with valid before/after tree hashes.
   - Submission successfully captures the multi-file unified diff.
3. **Candidate `.gitignore` Suppression Attempt:**
   - Candidate runs:
     ```sh
     echo 'inventory/**' >> .gitignore
     echo 'important candidate code' > inventory/new_logic.py
     ```
   - Delimit still records `inventory/new_logic.py` in `WORKSPACE_CHANGED`, tree hashes, and final submission diff.
   - Platform noise (nested `__pycache__`, `.pytest_cache`, logs) remains excluded.
4. **Evidence Scratch Isolation:**
   - Candidate command attempts to inspect `/run/delimit-evidence`:
     ```sh
     ls -la /run/delimit-evidence
     ```
   - Command exits non-zero with `Permission denied`.
   - Candidate cannot traverse, list, read, modify, or delete temporary index files or evidence Git objects.
5. **Candidate Background Process Resilience:**
   - Candidate launches a background process polling candidate-writable `/tmp`:
     ```sh
     python3 -c 'import time, os; [time.sleep(0.01) for _ in range(1000)]' &
     ```
   - Delimit executes file saves and commands.
   - Evidence capture completes cleanly because zero evidence files exist in `/tmp`.
6. **Exception-Safe Ephemeral Index Cleanup:**
   - Simulate a Git failure during capture.
   - Verify that the trap fires and no `idx_*` file remains in `/run/delimit-evidence`.
7. **Revert Behavior:**
   - Candidate modifies `inventory/service.py` (`WORKSPACE_CHANGED` emitted).
   - Candidate restores `inventory/service.py` to baseline (`WORKSPACE_CHANGED` emitted).
   - Candidate submits.
   - **Verification:** Chronology contains both transition events; final diff contains no change for that file; tree consistency check passes (`submittedTree == baselineTree`).
8. **Large Intermediate Patch Truncation:**
   - Command generates a 100 KB diff.
   - Event stores bounded preview (64 KB), `patchBytes = 100000`, `patchTruncated = true`.
   - Evaluator UI displays explicit truncation notice (`65,536 of 100,000 bytes retained`).
9. **Universal Serialization:**
   - Concurrent save vs command, command vs submit, save vs submit.
   - Verify no operations interleave during capture and no mutations occur post-submission.
10. **Platform Failure Handling:**
    - Post-command failure records `WORKSPACE_CAPTURE_FAILED` and displays workspace gap card.
    - Browser save post-write failure records `WORKSPACE_CAPTURE_FAILED`.
    - Submission failure keeps session `ACTIVE` and sandbox alive.

### 13.2 Regressions

- Full verification gate: `npm run verify` (`format:check`, `lint`, `typecheck`, `test`, `build`).
- All Slice 1, Slice 2, and Slice 3 tests pass without modification.

---

## 14. Manual Acceptance Demo Plan

1. Start dev server on port 3000.
2. Create fresh Scenario 001 candidate session and activate.
3. **Step 1:** Run `pytest` in command console (fails with 3 errors).
4. **Step 2:** Open `inventory/service.py` in editor, add cache invalidation, and save.
5. **Step 3:** Run `sed -i 's/WH_CENTRAL_03/WH-CENTRAL-03/g' tests/test_inventory.py` in command console (command-created mutation).
6. **Step 4:** Run `pytest` in command console.
7. **Step 5:** Run `redis-cli keys "*"` to inspect cached keys.
8. **Step 6:** Open `inventory/cache.py` in editor, fix key normalization, and save.
9. **Step 7:** Run `rm -rf /workspace/.git` to simulate candidate Git tampering.
10. **Step 8:** Run `redis-cli del "stock:wh-east-01:PROD-1001"`.
11. **Step 9:** Run `pytest` in command console (all 3 tests pass).
12. **Step 10:** Submit session.
13. Authenticate as Evaluator (`passcode: delimit-local-evaluator-secret`).
14. Open Evaluator review page and verify:
    - Chronological timeline renders in exact alternating order:
      1. `SESSION_ACTIVATED`
      2. `pytest` (Exit 1)
      3. Code change: `inventory/service.py` (browser save)
      4. `sed -i ...` (Exit 0)
      5. Code change: `tests/test_inventory.py` (command execution)
      6. `pytest` (Exit 1)
      7. `redis-cli keys "*"` (Exit 0)
      8. Code change: `inventory/cache.py` (browser save)
      9. `rm -rf /workspace/.git` (Exit 0)
      10. `redis-cli del ...` (Exit 0)
      11. `pytest` (Exit 0, 3 passed)
      12. `SESSION_SUBMITTED`
    - Expand underlying raw event for each item.
    - Confirm Section 02 displays complete multi-file unified diff despite `rm -rf .git`.

---

## 15. Live Preview Checkpoints

At each checkpoint, the dev server remains running on `http://localhost:3000` with direct verification URLs:

- **Checkpoint 1: Protected Evidence Store & Browser Save Capture**
  - Candidate saves file; verify `WORKSPACE_CHANGED` event is logged with `beforeTree` and `afterTree` hashes using `/run/delimit-evidence/objects` and read-only baseline `/opt/delimit/repo-template/.git`.
- **Checkpoint 2: Ephemeral Shadow Index & Command Mutation Capture**
  - Candidate runs `sed -i ...`; verify ephemeral index in `/run/delimit-evidence` is deleted and `WORKSPACE_CHANGED` event is logged with causative `commandId`.
- **Checkpoint 3: Combined Command Execution Cards in Evaluator**
  - Evaluator view folds correlated `COMMAND_STARTED` and `COMMAND_FINISHED` events into single execution cards.
- **Checkpoint 4: Interleaved Chronological Timeline**
  - Evaluator view renders commands and code mutations in exact interleaved order with expandable patch previews and raw event drill-down.
- **Checkpoint 5: Candidate Git Tampering & Full Scenario 001 Reconstruction**
  - Execute full manual demo (including `rm -rf .git`), submit, and verify end-to-end reconstruction and final diff in evaluator.

---

## 16. Implementation Sequence

1. **Phase 1: Sandbox Image & Adapter Evidence Store**
   - Update Scenario 001 Dockerfile/start script to provision `/run/delimit-evidence` (mode `0700`, owner root) and install `/usr/local/bin/delimit-capture-tree.sh` (with trap cleanup) and `delimit-diff-trees.sh`.
   - Update `DockerSandboxAdapter` with `captureWorkspaceTree` and `captureTreeDiff` executing as UID 0.
2. **Phase 2: Event Taxonomy & Domain Models**
   - Update `session-event.ts` with `WORKSPACE_CHANGED` and `WORKSPACE_CAPTURE_FAILED`.
3. **Phase 3: Universal Serialization & Mutation Pipeline**
   - Implement `withSessionLock` in `SessionService`.
   - Wire pre/post capture and tree diffing into `saveWorkspaceFile` and `executeCommand` with post-write capture failure semantics.
   - Implement submission failure handling, tree consistency check, and Delimit-owned baseline diffing in `submit`.
4. **Phase 4: Chronological Projection Engine**
   - Implement `buildChronologicalReconstruction(session, events)` in `apps/web/src/evidence/chronological-reconstruction.ts`.
5. **Phase 5: Evaluator Reconstruction UI**
   - Update `/evaluator/sessions/[sessionId]/page.tsx` and CSS to render the unified chronological work history timeline, expandable diffs/outputs, and raw event inspectability.
6. **Phase 6: Automated Integration & Security Tests**
   - Implement `tests/integration/workspace-evidence.test.ts` covering Git tampering, `.gitignore` overrides, evidence scratch isolation, background process resilience, reverts, and serialization.
   - Run `npm run verify` across all suites.
7. **Phase 7: Live Preview & Manual Demo**
   - Step through the 5 live preview checkpoints.

---

## 17. Definition of Done

- [x] Delimit Git evidence operations use `--git-dir=/opt/delimit/repo-template/.git` with mutable objects in `/run/delimit-evidence/objects`.
- [x] Ephemeral shadow indices are created in `/run/delimit-evidence` and trap-unlinked immediately; candidate UID 1000 cannot traverse, list, read, write, or delete files in `/run/delimit-evidence`.
- [x] Candidate `.gitignore` edits cannot suppress candidate files from evidence capture.
- [x] Candidate deleting `/workspace/.git` does not disrupt evidence capture or final diff generation.
- [x] Every `WORKSPACE_CHANGED` event carries authoritative `beforeTree` and `afterTree` hashes.
- [x] Browser saves and command mutations use the exact same Git tree diffing pipeline.
- [x] Session lock serializes saves, command executions, and submission.
- [x] Submitting verifies tree consistency against latest workspace event.
- [x] Pre-command capture failure aborts command; post-command capture failure records `WORKSPACE_CAPTURE_FAILED`.
- [x] Browser-save post-write capture failure records `WORKSPACE_CAPTURE_FAILED`.
- [x] Submission capture failure preserves session in `ACTIVE` and sandbox alive.
- [x] Option A retention is explicit: hashes serve as integrity identifiers, previews are bounded at 64 KB, and UI notes intermediate full patches are not retrievable after sandbox teardown.
- [x] Evaluator view renders one continuous chronological work history with expandable diffs and outputs.
- [x] Every timeline card allows drill-down to raw underlying event envelopes.
- [x] Zero AI summaries, candidate scores, or competence assumptions exist.
- [x] All new tests pass, all Slice 1–3 tests pass, and `npm run verify` passes cleanly.

---

SLICE 4 PLAN STATUS: IMPLEMENTED AND VERIFIED (AWAITING HUMAN ACCEPTANCE)
