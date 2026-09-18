# 061 — Delimit Slice 6F: Candidate Integrated AI Surface

Status: completed.
Authorized: 2026-09-18.
Baseline: `6473c9768fafa535c9ce52280764a80605bd3933` (origin/main).

## Objective

Implement the candidate-facing integrated AI interaction surface for Delimit:

- Engineering assistant panel embedded in the candidate assessment workspace.
- Prompt composer with multiline text input and native submit action.
- Workspace context selection (file-level references, never file contents).
- Synchronous submit flow consuming the Slice 6C API contract (`POST /api/candidate/sessions/[token]/ai/interactions`).
- Client-side idempotency with stable `clientRequestId` and safe explicit-only new-attempt flows.
- Truthful capability states (enabled, disabled, legacy/unavailable, inactive, submitted).
- Truthful result states (response rendering, provider failure, timeout, ambiguous 409).
- Epistemic invariants strictly preserved: no causal UI, no auto-apply, no AI-authored claims, no candidate control of provider/model, no locks on editor/terminal during AI submission.
- Full accessibility, security, client logging hygiene, comprehensive tests, and documentation.

## Canonical Architectural Boundaries

1. **Server Remains Authoritative**:
   - Provider resolution, model selection, prompt injection, and telemetry remain exclusively with the server capability snapshot.
   - The client never provides or overrides `providerId`, `modelId`, or API keys.
   - The client never sends file body contents; only workspace-relative paths.
   - Server response is authoritative for status, durations, and terminal reasons.

2. **Idempotency & Retry Discipline**:
   - Each distinct candidate submission receives one stable `clientRequestId`.
   - Accidental UI rerenders or delayed responses maintain the same `clientRequestId`.
   - Never automatically retry provider failures, timeouts, or ambiguous dispatches.
   - Genuinely new submissions explicitly initiated by the candidate generate a new `clientRequestId`.
   - Ambiguous dispatch (HTTP 409 or `AMBIGUOUS_DISPATCH`) prompts an explicit new request.

3. **Workspace Invariants**:
   - The editor textarea and terminal command console remain fully active while AI is in flight. Delimit explicitly captures observable candidate work occurring concurrently with AI execution.
   - Assessment submission is permitted while an AI request is in flight according to server rules; UI tolerates session transition without throwing unhandled exceptions.

4. **Zero Causal Language**:
   - Strictly forbidden terms and concepts: "applied", "copied", "AI-authored", "generated change", "accepted suggestion".
   - Response presentation is purely informative technical text.

## Implementation Details

1. **Session View (`apps/web/src/sessions/candidate-session-view.ts`)**:
   - Expose `aiCapability: { enabled: boolean } | null` derived from `session.aiCapabilitySnapshot`.

2. **Candidate AI Panel Component (`apps/web/app/candidate/[token]/candidate-ai-panel.tsx`)**:
   - Compact side panel embedded in the candidate workspace.
   - State machine: `idle` | `submitting` | `completed` | `failed` | `ambiguous` with helper functions in `candidate-ai-state.ts`.
   - Context selector with removable chips (`Context: path`).
   - Accessible multiline composer with native button and polite live region.
   - Truthful error copy matching specification.

3. **Workspace Layout (`apps/web/app/candidate/[token]/candidate-workspace.tsx` & `workspace.css`)**:
   - Docked inside the workspace panel without obscuring editor or terminal controls.
   - Styled using established design tokens and honoring reduced motion.

4. **Tests & Verification**:
   - `tests/unit/candidate-ai-panel.test.tsx` covering all matrix requirements (capability states, idempotency, prompt submission, error copies, context manipulation, absence of causal language, accessibility).
   - `tests/integration/candidate-ai-workspace.test.ts` covering end-to-end integration across activation, interaction, and submission.
   - Full `npm run verify` passes.
