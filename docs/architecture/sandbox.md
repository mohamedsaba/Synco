# Sandbox boundary

Candidate-controlled code and commands are untrusted. The sandbox is a security boundary, not merely a development environment.

Each active session receives one isolated environment with:

- CPU, memory, and process limits;
- filesystem isolation from the host, other sessions, platform code, and secrets;
- network access denied by default and explicitly allowlisted only when the scenario requires it;
- no platform credentials or unrelated environment variables;
- a maximum session lifetime and command timeouts;
- deterministic teardown after submission, expiration, failure, or cancellation.

Scenario images and fixtures should be versioned so a session can be explained and reproduced. The control plane must treat all sandbox output as untrusted data and bound output size.

The prototype should begin with a container-backed local adapter behind a narrow lifecycle interface only when the first workspace slice needs it. Production orchestration, multi-region scheduling, Kubernetes, image fleets, and generalized multi-stack support are deliberately deferred. Security review is required before exposing candidate execution beyond controlled prototype use.
