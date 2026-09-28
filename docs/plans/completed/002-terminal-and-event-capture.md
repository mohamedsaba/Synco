# 002 — Terminal and Command Event Capture

## Goal

Deliver the smallest next vertical slice after Slice 1: a candidate executes commands in an isolated session-scoped sandbox from a workspace command console, the server authoritatively captures `COMMAND_STARTED` and `COMMAND_FINISHED` events into an append-only event store with correlated command IDs and atomic sequence ordering, and an evaluator can inspect the chronological raw command evidence alongside the final diff.

## Why this slice exists

In Slice 1, Hirearchy Software proved that a candidate could edit a permitted file and produce a deterministic final diff. However, software engineering work is not merely a final file state; it is an active investigation process involving commands, exploration, and verification.

Slice 2 establishes the core boundary that makes candidate work observable:

1. Candidate execution is physically isolated from the platform via a hardened session-scoped container sandbox.
2. Candidate command activity is authoritatively captured as factual, append-only events by the server runtime, not self-reported by the browser.
3. Chronological raw command evidence is preserved and made legible to human evaluators without scoring, automated inference, or premature reconstruction prose.

## Evidence loop being proved

$$\text{Candidate runs shell command} \longrightarrow \text{Sandbox executes in isolated container} \longrightarrow \text{Server logs monotonic events} \longrightarrow \text{Evaluator inspects chronological raw command evidence}$$

This proves that candidate actions can be captured with strict provenance and sequence integrity before test detection, AI assistance, or reconstruction summaries are added.

## Relevant SRS requirements

- **FR-008 (Environment readiness):** The session transitions to `ACTIVE` and the candidate timer begins _only after_ the sandbox environment is created and passes a readiness check. If readiness fails, the session remains `CREATED` and the candidate timer does not start.
- **FR-015 (Terminal):** Partially advanced / deferred. Slice 2 introduces a server-mediated command-execution console connected to the session sandbox as an explicit precursor to an interactive terminal. The full interactive terminal connected to the sandbox remains deferred.
- **FR-016 (Command execution):** Satisfied for supported non-interactive commands within sandbox constraints.
- **FR-028 (Append-only event stream):** Persist session events in append-only form with stable ID, session ID, sequence number, timestamp, type, source, and payload.
- **FR-030 (Terminal events):** Server captures command lifecycle (`COMMAND_STARTED`, `COMMAND_FINISHED`), exit status, duration, and output without relying on client-side inference.
- **FR-034 (Clock ordering):** Server assigns a strictly monotonic sequence number per session within atomic transactions to guarantee deterministic chronology.
- **FR-035 (Event provenance):** Events declare provenance (`server` or `sandbox`).
- **FR-041 / FR-042 (Evaluator evidence access):** Authorized evaluator can inspect underlying command lines, durations, exit codes, and output as raw evidence.
- **SEC-001–SEC-010 (Security and sandbox):** Untrusted code execution isolated with non-root user, process limits, memory limits, CPU bounds, read-only root, network isolation, secret exclusion, and deterministic lifecycle teardown.

## Current system state

Vertical Slice 1 is committed (`4f8d709`) and fully verified:

- Web modular monolith on Next.js 16 (App Router) and TypeScript.
- SQLite database (`.data/hirearchy.sqlite`) stores `assessment_sessions` with statuses `CREATED`, `ACTIVE`, `SUBMITTED`.
- Candidate edits one file in a textarea (`/candidate/[token]`).
- Evaluator diff view (`/evaluator/sessions/[sessionId]`) displays unified diff derived from immutable original and submitted snapshots.
- No terminal, no container sandbox, and no event stream exist in code today.

## In scope

1. **Session-Scoped Sandbox Lifecycle & Readiness (`ACTIVE` = Sandbox-Ready):**
   - Narrow `SandboxAdapter` interface:
     - `createAndVerify(sessionId, workingContent): Promise<SandboxHandle>`
     - `exec(sessionId, commandId, command, cwd, timeoutMs): Promise<CommandExecResult>`
     - `teardown(sessionId): Promise<void>`
   - Local Docker implementation (`DockerSandboxAdapter`) using a lightweight, versioned base container (e.g. Alpine/Node).
   - Atomic activation semantics:
     $$\text{Candidate requests activation} \longrightarrow \text{Create sandbox} \longrightarrow \text{Readiness check succeeds} \longrightarrow \text{Atomically transition to ACTIVE with startedAt}$$
   - Single container per ACTIVE session: created upon activation, shared across all commands run during that session, preserving working changes and command side-effects in `/workspace`.
   - Teardown on session submission, timeout, or terminal session failure.
2. **Hardened Local Container Boundary:**
   - Unprivileged non-root user (`USER hirearchy software`).
   - `--network none` (isolated from internal host networks and the public Internet).
   - Strict resource limits: 1.0 CPU (`--cpus=1.0`), 512MB RAM (`--memory=512m`), 64 PIDs (`--pids-limit=64`).
   - Read-only root filesystem (`--read-only`), with a dedicated writable volume mounted at `/workspace` and a bounded tmpfs mounted at `/tmp`.
   - Dropped Linux capabilities (`--cap-drop=ALL`), no privilege escalation (`--security-opt=no-new-privileges:true`).
   - Host secrets and platform environment variables excluded.
3. **Candidate Command Console Interface & Streaming Bounded Capture:**
   - A command-execution console component in the candidate workspace (`/candidate/[token]`).
   - Server-owned command execution API (`POST /api/candidate/sessions/[token]/terminal/exec`).
   - Streaming bounded output capture: stdout and stderr are consumed in chunks, total bytes are counted incrementally, only up to 64 KB preview is retained in memory, and truncation is explicitly flagged. Unlimited command output cannot exhaust host memory.
4. **Command Process Timeout & Process Group Termination:**
   - Server enforces a 30-second timeout per command.
   - On timeout, the server forcefully terminates the command and its process group inside the sandbox container.
   - The timeout outcome is recorded factually in the event stream (`timedOut: true`, `exitCode: null`), and the sandbox remains in a known usable state.
5. **Append-Only Event Persistence with Correlated Lifecycle:**
   - New `assessment_events` table in SQLite (`.data/hirearchy.sqlite`).
   - Server-assigned strictly monotonic sequence counter per session allocated inside an immediate write transaction.
   - Stable `commandId` explicitly correlating `COMMAND_STARTED` and `COMMAND_FINISHED` lifecycle pairs.
6. **Distinction Between Candidate Command Failure and Platform Failure:**
   - Command exit codes (e.g. `exitCode: 1`) are recorded factually as candidate-work evidence; they do not fail the session.
   - Platform/infrastructure failures (e.g. Docker unavailable, transport dropped, container crash) return explicit HTTP 500/503 errors and do not record artificial candidate failures.
7. **Evaluator Chronological Raw Evidence Inspection:**
   - Evaluator review page (`/evaluator/sessions/[sessionId]`) expanded to display chronological raw command evidence (sequence, timestamp, commandId, command, duration, exitCode, timedOut, stdout/stderr with truncation indicators and byte counts) alongside the final diff.
8. **Testing & Verification:**
   - Comprehensive test suite covering domain state machines, concurrency, sandbox execution, streaming output truncation, process termination, and lifecycle invariants.

## Explicitly out of scope

- **Full interactive terminal (PTY / WebSocket):** Interactive terminal emulation (e.g. xterm.js, raw PTY stream) is deferred to a subsequent slice.
- **Test recognition heuristic (`TEST_RUN`):** Distinguishing test commands from general terminal commands belongs in Slice 3. All commands are recorded factually as command events.
- **Candidate AI assistant:** No AI chat, prompt logging, or token integration.
- **Event reconstruction AI:** No automated narrative summaries or interpretive prose; raw chronological evidence is sufficient.
- **File watching daemon:** No filesystem inotify streaming for background edits.
- **Scenario 001 complex stack:** Retain a single-stack fixture rather than introducing the multi-container PostgreSQL/Redis stack.
- **Distributed infrastructure:** No Kafka, RabbitMQ, Redis, or microservices.

## Proposed architecture

```text
Browser (Candidate)                       Hirearchy Software Web Application (Server)                 Docker Runtime (Sandbox)
        │                                                │                                             │
        ├─── POST .../activate ─────────────────────────>│── 1. Create container hirearchy-<sessionId> ─>│
        │                                                │── 2. Run readiness probe (echo/ping) ──────>│
        │                                                │<── 3. Readiness OK ─────────────────────────┤
        │                                                │── 4. Atomically set status=ACTIVE, startedAt
        │<── { status: 'ACTIVE', ... } ──────────────────│
        │
        ├─── POST .../terminal/exec { command } ────────>│
        │                                                │── 1. Allocate commandId (cmd_<uuid>)
        │                                                │── 2. Tx: Append COMMAND_STARTED (seq N)
        │                                                │── 3. docker exec process group in sandbox ─>│
        │                                                │<── 4. Stream stdout/stderr (bounded chunking)
        │                                                │       (If timeout: SIGKILL process group)
        │                                                │── 5. Measure duration & evaluate truncation
        │                                                │── 6. Tx: Append COMMAND_FINISHED (seq N+1)
        │<── { commandId, exitCode, timedOut, ... } ─────│
        │
        ├─── POST .../submit ───────────────────────────>│── 1. Atomically set status=SUBMITTED
        │                                                │── 2. docker rm -f hirearchy-<sessionId> ─────>│
        │<── { status: 'SUBMITTED' } ────────────────────│
        │
Browser (Evaluator)
        │
        └─── GET .../evaluator/sessions/[id] ───────────>│── Fetch submitted diff + raw events (by seq)
         <── Render diff & chronological raw command log ┘
```

## Sandbox boundary

- **Session-Scoped Lifetime:** Exactly one container per `ACTIVE` session (`hirearchy-sandbox-<sessionId>`).
  - Container is started and verified before session status becomes `ACTIVE`.
  - Multiple successive commands execute inside this same container via `docker exec`. Any filesystem edits, installed local dependencies, or environment changes made by a command in `/workspace` persist across commands while the session is ACTIVE.
  - Container is stopped and removed (`docker rm -f`) atomically on session submission, timeout, or terminal session failure.
  - Persisted events and session metadata remain permanently in SQLite after the sandbox container is destroyed.
- **Hardened Container Configuration:**
  - Non-root user: container runs as unprivileged user `hirearchy software` (UID 1000).
  - Network isolation: `--network none`.
  - Resource bounds: `--memory=512m --cpus=1.0 --pids-limit=64`.
  - Filesystem: root is read-only (`--read-only`), session workspace mounted at `/workspace` (writable), bounded tmpfs at `/tmp` (`--tmpfs /tmp:rw,noexec,nosuid,size=64m`).
  - Capabilities: `--cap-drop=ALL --security-opt=no-new-privileges:true`.
  - Secrets: Zero platform secrets or environment variables injected into the container.
- **Timeout and Process Termination:**
  - Commands execute wrapped in a process session/group (`setsid` or shell process group).
  - If execution exceeds 30,000 ms, the server kills the entire process group (`kill -KILL -<pgid>`), ensuring that runaway child processes do not continue running in the background.

## Terminal communication

- Candidate workspace renders a command console component.
- Execution uses `POST /api/candidate/sessions/[token]/terminal/exec` with `{ command: string }`.
- Server validates session is `ACTIVE`, allocates `commandId`, emits `COMMAND_STARTED`, invokes sandbox execution with streaming capture, emits `COMMAND_FINISHED`, and returns the command result.

## Event model for this slice

Events follow the documented schema in `docs/architecture/event-model.md`:

```typescript
export type SessionEventType = 'COMMAND_STARTED' | 'COMMAND_FINISHED';

export type SessionEvent = Readonly<{
  id: string; // evt_<uuid>
  sessionId: string;
  sequence: number; // Strictly monotonic integer per session (1, 2, 3...)
  type: SessionEventType;
  timestamp: string; // ISO 8601 UTC
  source: 'server' | 'sandbox';
  payload: CommandStartedPayload | CommandFinishedPayload;
}>;

export type CommandStartedPayload = Readonly<{
  commandId: string; // Stable correlation ID matching COMMAND_FINISHED
  command: string;
  cwd: string;
}>;

export type CommandFinishedPayload = Readonly<{
  commandId: string; // Stable correlation ID matching COMMAND_STARTED
  exitCode: number | null; // null if timedOut is true
  timedOut: boolean; // Factual timeout indicator (no invented exit codes)
  durationMs: number;
  stdoutPreview: string; // Up to 64 KB max
  stdoutBytes: number; // Exact total raw stdout byte count
  stdoutTruncated: boolean; // Explicit truncation flag
  stderrPreview: string; // Up to 64 KB max
  stderrBytes: number; // Exact total raw stderr byte count
  stderrTruncated: boolean; // Explicit truncation flag
}>;
```

**Factual Integrity:**

- A timed-out command is recorded factually with `timedOut: true` and `exitCode: null`. No arbitrary exit code is invented.
- Output truncation is explicitly recorded with actual byte counts. Partial output is never presented as complete output.
- `sequence` establishes chronological order across the session; `commandId` explicitly correlates the start and finish events of a single command.

## Memory-bounded output capture

To prevent denial-of-service from commands producing infinite output (`yes`, `cat /dev/urandom`), capture streams incrementally:

```typescript
class BoundedStreamAccumulator {
  private readonly maxBytes = 64 * 1024;
  private totalBytes = 0;
  private buffer = '';

  append(chunk: Buffer | string) {
    const str = typeof chunk === 'string' ? chunk : chunk.toString('utf8');
    const chunkBytes = Buffer.byteLength(str, 'utf8');
    this.totalBytes += chunkBytes;

    if (Buffer.byteLength(this.buffer, 'utf8') < this.maxBytes) {
      const remaining = this.maxBytes - Buffer.byteLength(this.buffer, 'utf8');
      this.buffer += str.slice(0, remaining);
    }
  }

  get result() {
    return {
      preview: this.buffer,
      bytes: this.totalBytes,
      truncated: this.totalBytes > this.maxBytes,
    };
  }
}
```

Host memory usage is bounded to $O(1)$ regardless of output length.

## Persistence changes

Add an `assessment_events` table to `.data/hirearchy.sqlite`:

```sql
CREATE TABLE IF NOT EXISTS assessment_events (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  type TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  source TEXT NOT NULL,
  payload TEXT NOT NULL,
  FOREIGN KEY(session_id) REFERENCES assessment_sessions(id),
  UNIQUE(session_id, sequence)
);

CREATE INDEX IF NOT EXISTS idx_events_session_sequence
  ON assessment_events(session_id, sequence);
```

### Atomic Sequence Allocation Under Concurrency

1. Sequence allocation and insertion execute inside `database.transaction(...)` with `BEGIN IMMEDIATE` semantics, acquiring SQLite's exclusive write lock.
2. The query `SELECT COALESCE(MAX(sequence), 0) + 1 FROM assessment_events WHERE session_id = ?` computes the next contiguous sequence number.
3. The event is inserted with that sequence number.
4. The `UNIQUE(session_id, sequence)` constraint guarantees that concurrent requests cannot produce duplicate sequence numbers.

## Failure handling and error boundaries

- **Candidate Command Failure vs. Platform Failure:**
  - When a candidate command exits with a non-zero code (`exitCode: 1`), this is candidate evidence. It is captured in `COMMAND_FINISHED` with the exit code. The session remains `ACTIVE`.
  - When the execution transport, Docker daemon, or readiness check fails, this is a platform failure. The API returns `503 Service Unavailable` with a structured `PLATFORM_ERROR` code. It is never converted into a candidate command failure event.
- **Activation Failure:** If the sandbox fails to start or fails readiness, the session remains in status `CREATED`. No `startedAt` is set, the timer does not start, and the candidate may retry activation.
- **Command Timeout:** The server kills the process group in the sandbox after 30 seconds and logs `COMMAND_FINISHED` with `timedOut: true, exitCode: null`. The sandbox remains in a known usable state for subsequent commands.
- **Post-Submission Rejection:** Any command execution attempt after submission returns HTTP `409 Conflict` (`SESSION_NOT_ACTIVE`).

## Security constraints

- **Untrusted code execution:** Runs exclusively inside Docker as non-root user `hirearchy software`.
- **Read-only root & minimal capabilities:** `--read-only`, `--cap-drop=ALL`, `--security-opt=no-new-privileges:true`.
- **No network:** `--network none`.
- **No host leakage:** Zero host application secrets, no Docker socket mounted inside the container.
- **Evaluator display sanitization:** Outputs rendered as plain text in preformatted elements to prevent XSS.

## Expected files to change

- `apps/web/src/sandbox/`: Sandbox interface (`SandboxAdapter`), Docker implementation (`DockerSandboxAdapter`), mock adapter (`MockSandboxAdapter`), and `BoundedStreamAccumulator`.
- `apps/web/src/events/`: Event models, payload schemas, and SQLite event store (`SqliteEventStore`).
- `apps/web/src/sessions/`: Updating session service for readiness-checked activation, command execution, and teardown on submission.
- `apps/web/app/api/candidate/sessions/[token]/terminal/exec/route.ts`: Command execution route.
- `apps/web/app/candidate/[token]/candidate-workspace.tsx`: Command execution console UI.
- `apps/web/app/evaluator/sessions/[sessionId]/page.tsx`: Displaying chronological raw command evidence.
- `tests/unit/`:
  - `tests/unit/event-store.test.ts` (concurrency, ordering, atomic sequence numbers)
  - `tests/unit/bounded-accumulator.test.ts` (memory bounds, truncation flags, byte counts)
  - `tests/unit/session-activation.test.ts` (readiness gate, failed startup keeps `CREATED`)
- `tests/integration/`:
  - `tests/integration/command-execution.test.ts` (session-scoped sandbox, command persistence, submission teardown, platform failure distinction, timeout handling)

## Tests to be implemented

1. **Activation & Readiness Gate:**
   - Failed sandbox startup leaves session in `CREATED` status without starting the timer (`activatedAt` remains null).
   - Successful sandbox startup and readiness probe atomically transitions session to `ACTIVE` and sets `activatedAt`.
2. **Session-Scoped Persistence & State:**
   - Multiple commands execute within the same container instance.
   - Files created in `/workspace` by command 1 are observable and editable by command 2.
3. **Command Lifecycle & Correlation:**
   - Executing a command produces correlated `COMMAND_STARTED` and `COMMAND_FINISHED` events referencing the same `commandId`.
   - Candidate command failure (e.g. exit code 1) produces a valid `COMMAND_FINISHED` event and leaves the session `ACTIVE`.
4. **Timeout & Process Group Termination:**
   - A command sleeping longer than the timeout is forcefully terminated (process group killed).
   - `COMMAND_FINISHED` records `timedOut: true` and `exitCode: null`.
5. **Streaming Output Bounds & Memory Safety:**
   - Streaming 100 KB of output retains $\le 64\text{ KB}$ preview, records exact `stdoutBytes`, and sets `stdoutTruncated: true`.
   - Host memory consumption remains bounded during output generation.
6. **Concurrency & Sequence Monotonicity:**
   - Concurrent command events for the same session receive strictly increasing, unique sequence numbers $(1, 2, 3, \dots)$ without gaps or duplicates.
7. **Submission & Teardown:**
   - Submitting the session terminates and cleans up the sandbox container.
   - Post-submission command execution is rejected with `SESSION_NOT_ACTIVE`.
8. **Platform Failure Distinction:**
   - Sandbox daemon crash / unavailability returns an explicit infrastructure error response and is not recorded as a candidate command exit code.

## Manual verification

1. Start application (`npm run dev`) with `.env.local` configured.
2. Create candidate session from `/`.
3. Open candidate URL, verify workspace displays brief and command console in `CREATED` state.
4. Click "Start Session":
   - Verify sandbox container starts (`docker ps` shows `hirearchy-sandbox-<sessionId>`).
   - Verify session transitions to `ACTIVE` with timer running.
5. In command console:
   - Run `echo "hello" > /workspace/shared.txt` $\rightarrow$ verify exit code 0.
   - Run `cat /workspace/shared.txt` $\rightarrow$ verify output `hello` (verifies session-scoped persistence).
   - Run `false` $\rightarrow$ verify exit code 1 is recorded as candidate evidence without crashing the session.
   - Run `sleep 35` $\rightarrow$ verify process terminates at 30 seconds, `timedOut: true`, and container remains responsive afterward.
   - Run network command `ping 8.8.8.8` $\rightarrow$ verify network failure due to `--network none`.
   - Run output flood `head -c 100000 /dev/zero | tr '\0' 'a'` $\rightarrow$ verify output preview is capped at 64 KB with `stdoutTruncated: true` and byte count $\approx 100{,}000$.
6. Click "Submit":
   - Verify session transitions to `SUBMITTED`.
   - Verify sandbox container is removed (`docker ps` does not show container).
7. Open evaluator URL with credential, navigate to session:
   - Verify unified diff is displayed.
   - Verify chronological raw command evidence displays every command, exact sequence order, matching `commandId`, elapsed duration, exit code or timeout indicator, stdout/stderr previews, truncation badges, and byte counts.

## Risks

- **Host Docker dependency in automated pipelines:** Running Docker in CI may require Docker-in-Docker or socket access. Mitigation: Core unit and integration tests use `MockSandboxAdapter`; Docker tests run conditionally when a Docker daemon is detected.
- **Non-interactive limitations:** Commands expecting interactive stdin (e.g. `read`, `sudo`, `vi`) will block until the 30-second timeout occurs. Mitigation: Brief explicitly instructs non-interactive CLI commands.

## Deferred decisions

1. **Interactive PTY vs. Command Console:** Whether future slices require a full WebSocket-based PTY (xterm.js) or if command-based interaction is sufficient.
2. **Multi-container environments:** Scenario 001 requires PostgreSQL + Redis. Multi-container orchestration without Kubernetes is deferred to the Scenario 001 implementation plan.
3. **Blob Artifact Storage:** Offloading output exceeding 64 KB to external storage is deferred until log volumes justify it.

## Definition of done

- `ACTIVE` strictly implies sandbox-ready: sandbox is created and verified before session status becomes `ACTIVE` and timer starts.
- Exactly one Docker sandbox container is created per `ACTIVE` session and terminated upon submission.
- Candidate commands execute in the sandbox with changes persisting across commands.
- Command timeouts terminate the process group and record `timedOut: true, exitCode: null`.
- Streaming output capture enforces $O(1)$ memory limits with explicit truncation flags and byte counts.
- Authoritative events `COMMAND_STARTED` and `COMMAND_FINISHED` are recorded in SQLite with strictly increasing sequence numbers and matching `commandId`.
- Candidate command failure is factually captured and kept distinct from platform failure.
- Evaluator at `/evaluator/sessions/[sessionId]` views the chronological raw command evidence with full metadata.
- All unit and integration tests pass; `npm run verify` passes.
- No AI, no reconstruction scoring, and no test recognition heuristics are added.
