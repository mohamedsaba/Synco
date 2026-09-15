# AI boundaries

AI has two permitted roles in the prototype.

## Candidate AI

AI may act as a normal engineering tool. The system may record the prompt, response, supplied context, timestamps, and explicit insertion actions. Usage is neutral. The system must not infer that manually typed code came from AI or interpret amount of use as competence.

## Reconstruction AI

AI may summarize an event log, compress evidence, and generate factual annotations grounded in specific event IDs. Generated text remains derived and replaceable; raw events remain authoritative.

## Prohibited uses

AI may not:

- rank or score candidates;
- judge or label competence, personality, intent, trust, or understanding;
- automatically pass, reject, or recommend a hiring decision;
- convert task or test outcomes into an evaluator verdict;
- claim manually entered code was copied from AI;
- produce unsupported reconstruction statements.

If a generated statement cannot point to sufficient observable events, it does not belong in the reconstruction.

## Slice 5 provider and trust boundary

Slice 5 uses one server-only NVIDIA NIM hosted inference adapter, with the exact model identifier `nvidia/nemotron-3.5-lightning-30b-a3b` via endpoint `https://integrate.api.nvidia.com/v1/chat/completions`. It makes one bounded, non-streaming structured-output request using JSON Schema. Tools, function calling, code execution, conversation state, and agent workflows are not enabled.

Candidate-authored commands, output, code, comments, filenames, and patches are serialized as untrusted evidence data. They never become system instructions. The provider is required to return JSON matching a narrow schema, but its response remains untrusted: Delimit reparses it, applies strict Zod and domain bounds, resolves every session-scoped evidence reference, checks coverage and gap constraints, derives chronology, and only then persists normalized content. These layers reduce prompt-injection and fabrication risk; they do not make prompt injection or semantic overreach impossible.

The API key is read only from server-side `NVIDIA_API_KEY`. The evaluator generation API accepts only a session ID and an optional failed-retry boolean. Candidate credentials cannot read or start reconstruction. Provider errors are converted to bounded failure metadata; raw malformed output, provider error detail, secrets, and stack traces are not persisted or returned.

## Current prototype operational limitation

The current configuration is approved only for synthetic/test Scenario 001 evidence. It must not be described as zero-retention, enterprise-private, or approved for production applicant data without a formal provider and privacy review.

A separate provider and privacy review is required before processing real applicant evidence.
