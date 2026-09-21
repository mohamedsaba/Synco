# Sandbox boundary

Candidate-controlled code and commands are untrusted. The sandbox is a security boundary, not merely a development environment.

Each active session receives one isolated environment with:

- CPU, memory, and process limits;
- filesystem isolation from the host, other sessions, platform code, and secrets;
- network access denied by default and explicitly allowlisted only when the scenario requires it;
- no platform credentials or unrelated environment variables;
- a maximum session lifetime and command timeouts;
- deterministic teardown attempts after submission, expiration, failure, or cancellation.

For submission, evidence durability and resource cleanup are deliberately separate. `SUBMITTED` closes candidate mutation after final evidence is captured. Container removal follows as infrastructure cleanup; failure is recorded as `SANDBOX_CLEANUP_FAILED` and never reopens submitted evidence.

Scenario images and fixtures should be versioned so a session can be explained and reproduced. The control plane must treat all sandbox output as untrusted data and bound output size:

- Host-side control-plane subprocesses have bounded execution timeouts and bounded stdout/stderr streams to prevent host memory exhaustion and indefinitely pending operations.
- Authoritative capture operations (workspace tree, diff, file reading, file listing) never silently truncate output; exceeding bounds produces an explicit platform capture failure to maintain deterministic evidence truth.
- Workspace file editor operations enforce a bounded file size limit (100 KB) across both read and write paths.
- Workspace file paths are passed as literal data arguments rather than interpolated into shell script source.
- Public HTTP responses sanitize infrastructure failures, redacting raw Docker command lines, container names, internal paths, and raw stderr while returning stable public error codes and concise factual safe messages.

## Workspace storage and frozen finality (T1A.3A)

Each session's `/workspace` is backed by a dedicated Docker named volume (`delimit-ws-<sanitized-session-id>`) rather than a tmpfs mount. Named volumes are independently addressable: a trusted ephemeral helper container can mount the workspace read-only even while the primary sandbox is paused.

**Freeze mechanism:** On candidate manual submission, the primary sandbox is frozen with `docker pause` (the Linux cgroup freezer) and verified via `docker inspect State.Paused`. Whole-container freeze is required because scenario services continue async work outside the terminal process tree; process-level kill alone is insufficient to guarantee an immutable workspace.

**Frozen capture:** An ephemeral helper container mounts the workspace volume read-only and runs the authoritative `delimit-capture-tree.sh` and `delimit-diff-trees.sh` scripts. The helper is isolated: `--rm`, `--network none`, `--read-only`, bounded memory/CPU/PIDs, `--cap-drop ALL`, `--security-opt=no-new-privileges:true`. Its deterministic name permits forced cleanup after a bounded subprocess failure. The primary remains paused throughout.

**Volume lifecycle:** Volume created before container start. Removed only after successful SQLite finalization — never destroyed before finalization. On freeze/capture/commit failure the volume and paused container remain intact and are recoverable (T1B).

**Recovery compatibility:** A paused sandbox + named volume survive application restart. They must not be automatically destroyed before T1B recovery is implemented. Helper image selection for frozen capture is restart-recoverable via `docker inspect Config.Image` on the primary container — not an in-process map. Root subreaper / command-supervisor hardening remains T1A.3B.
