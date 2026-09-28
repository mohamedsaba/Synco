# 076 — Candidate integrated AI experience

## Delivered

C6 changes only the candidate AI projection. The existing `POST /api/candidate/sessions/[token]/ai/interactions` contract remains `clientRequestId`, `candidatePromptText`, and optional `candidateContext` path references. No provider, model, persistence, streaming, or finality API changed.

The panel is a local chronological conversation. A send appends a stable request-ID entry before dispatch; its completion, failure, timeout, ambiguity, or session-ended result updates that same entry. Browser UI permits one request at a time. Explicit retry keeps the prompt but creates a new request ID. Completed entries remain visible. History and draft survive C3 panel navigation because the workspace keeps the panel mounted, but disappear on refresh; server evidence remains separate and durable.

## Context truth

Each request sends only the current active file's relative-path reference as candidate context. It sends neither persisted file content nor the editor's unsaved buffer. The panel shows the exact path captured for each request and says that content boundary plainly. The route separately supplies scenario ID, scenario version, and AI configuration version as Hirearchy Software metadata; no evaluator context, secret, provider choice, model choice, or hidden conversation history is sent from the browser.

## Lifecycle and safety

C1 projected `canUseAi` gates the composer, including a client-projected deadline. The server still independently admits only ACTIVE, pre-deadline sessions. Submission atomically cancels open interactions; late provider completion is dropped by the existing service. A response which completes before canonical submission closure remains an existing server behavior.

Responses use React text rendering in `<pre>`; no raw HTML rendering is introduced. Conversation itself has no live region. The single pending status uses `role="status"`; per-entry errors use `role="alert"`.

## Verification

- `npm run typecheck`
- Focused C6/candidate/API suite: 72 passed across 7 files.
- The existing workspace integration test's two activation paths require Docker access and were blocked here by Docker socket permission; unchanged tests expecting activation received HTTP 503.

## Deferred

C7-C10, conversation persistence, file-content inclusion, streaming, provider/model selection, and automated AI judgment remain out of scope.
