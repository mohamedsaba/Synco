# 064 — Delimit Security Correction S1: Control-Plane Hardening

Status: completed.
Baseline: `286c45a54e708c65c80416d4a3b9901fb438255d` (correction/f03).

## Objective

Implement the bounded security correction set produced by the completed Security & Privacy Hardening Gate:

- **SEC-003**: Host-side control-plane subprocess helpers lack timeout and output bounds.
- **SEC-001**: Workspace file path interpolated into shell source in `writeFile`.
- **SEC-004**: Raw Docker and sandbox diagnostics exposed to public HTTP clients.
- **SEC-005**: Terminal command HTTP input lacking reasonable explicit size bound.
- **SEC-007**: Procedural repository safety rules committed to `AGENTS.md`.

Strictly deferred / out of scope:

- **SEC-002**: Symlink rejection, VFS abstractions, realpath containment (non-issue for current container threat model).
- **SEC-006**: Session expiry, background container reapers, container leases, lifecycle schedulers (deferred to Operational Readiness).
- General security refactoring, multi-tenancy, rate limiting, and OAuth.

## Architectural Boundaries & Invariants

1. **Subprocess Execution Bounds (SEC-003)**:
   - Host-side subprocesses spawned by `DockerSandboxAdapter` (`runProcess` and `runProcessWithInput`) enforce explicit timeout and stream accumulation bounds (`maxStdoutBytes`, `maxStderrBytes`, `timeoutMs`).
   - If any bound is exceeded, the host child process is immediately terminated via `SIGKILL`, any open stdin is destroyed, and the operation fails explicitly with typed `SandboxError('SANDBOX_EXECUTION_FAILED', ...)`.
   - **Evidence Integrity**: Authoritative evidence operations (`captureWorkspaceTree`, `captureTreeDiff`, `readFile`, `listFiles`) NEVER silently truncate output and pretend the operation succeeded. Exceeding safety bounds causes an explicit platform failure.

2. **File Path as Data (SEC-001)**:
   - `writeFile` and container initialization pass normalized paths as positional parameters (`cat > "$1"`) rather than interpolating path text into shell script source.
   - Filenames containing shell syntax such as `$()` or backticks are treated as literal data values and do not execute command substitution.

3. **Workspace File Read Safety**:
   - Workspace file reads are bounded by `MAX_WORKSPACE_FILE_READ_BYTES = 100_000` (100 KB), matching the existing 100 KB save limit.
   - Files exceeding this limit fail explicitly with typed domain errors (`CONTENT_TOO_LARGE` / HTTP 413) rather than returning truncated partial content.

4. **Public Error Sanitization (SEC-004)**:
   - `errorResponse` sanitizes infrastructure exceptions, ensuring client responses never expose raw Docker command lines, container names (`delimit-sandbox-*`), internal script paths, or raw stderr.
   - Client responses return stable error codes and concise factual safe messages; detailed diagnostics remain in server-side logging.

5. **Terminal Command Size Bounds (SEC-005)**:
   - Candidate terminal commands enforce `MAX_COMMAND_LENGTH = 4096` at both the HTTP route and domain service layers.
   - Oversized commands are rejected deterministically with HTTP 413 (`COMMAND_TOO_LARGE`).
   - Arbitrary shell syntax and candidate command execution behavior remain fully preserved without command filtering or allowlists.

6. **Repository Safety (SEC-007)**:
   - `AGENTS.md` explicitly prohibits destructive operations against developer work (`git reset --hard`, `git clean -fd`, `git restore` over dirty files, unapproved `stash`, `worktree remove --force`, force push, destructive cleanup of primary checkout) and mandates inspecting `git status` and using isolated worktrees.
