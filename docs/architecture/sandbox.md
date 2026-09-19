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

The prototype should begin with a container-backed local adapter behind a narrow lifecycle interface only when the first workspace slice needs it. Production orchestration, multi-region scheduling, Kubernetes, image fleets, and generalized multi-stack support are deliberately deferred. Security review is required before exposing candidate execution beyond controlled prototype use.
