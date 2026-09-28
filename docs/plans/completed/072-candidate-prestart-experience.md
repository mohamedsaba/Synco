# Slice Plan 072 — Candidate Pre-Start / Orientation / Provisioning Experience (C2)

Status: COMPLETED
Slice: C2
Date: 2026-09-21
Baseline: `22c2af722258d999aedb6eb12025e5e0d0a52fb0`

## Goal

Implement the candidate pre-start, orientation, and provisioning experience, establishing procedural clarity and professional respect while guaranteeing that environment setup does not consume assessment time and preventing untimed scenario leakage before activation.

## Completed Changes

1. **Scenario Leakage Boundary Protection (`apps/web/src/sessions/candidate-session-view.ts`)**:
   - Redacted scenario-specific details (`brief`, `prompt`, `acceptanceCriteria`, `filePath`, `originalContent`) and `workingContent` from `toCandidateSessionView` when `session.status === 'CREATED'`.
   - Pre-active sessions expose only non-sensitive metadata: `id`, `title`, `version`, `durationSeconds`, `type`, and `aiCapability`.
   - Full scenario content and working files are delivered only once the session reaches `ACTIVE` or `SUBMITTED`.

2. **Pre-Start View Primitives (`apps/web/app/candidate/[token]/candidate-prestart.tsx`)**:
   - Implemented accessible, editorial-style pre-start view components matching Hirearchy Software product principles:
     - `ENTRY`: Initial landing screen presenting assessment identity, expected duration ("You'll have 60 minutes once the assessment begins"), neutral framing, and primary action to continue to orientation.
     - `ORIENTATION`: Single structured screen detailing the 7 core contracts:
       1. Assessment duration (factual duration, no countdown before activation)
       2. Available tools (file editor, terminal command console, integrated AI assistant, scenario brief)
       3. AI policy (permitted as part of the environment, candidate remains responsible, no surveillance talk)
       4. Observable activity recording (saved edits, commands, and AI prompts captured as technical evidence)
       5. Persistence (saved in environment, save failures surfaced immediately, Hirearchy Software manages infrastructure)
       6. Submission (candidate may submit at any time, submission is final, review step provided before confirmation)
       7. Time expiry (work stops automatically upon deadline, Hirearchy Software finalizes automatically)
     - `READY_TO_START`: Final confirmation screen stating duration and that timing begins only after successful workspace setup, with "Start Assessment" action and Back navigation.
     - `PROVISIONING`: Truthful platform state ("Preparing your assessment environment…") with `role="status"` and `aria-live="polite"`. No countdown timer.
     - `PROVISIONING_FAILURE`: Explicit platform failure presentation ("Environment Setup Incomplete") that never blames the candidate and provides safe retry.

3. **Candidate Workspace Orchestration (`apps/web/app/candidate/[token]/candidate-workspace.tsx`)**:
   - Conditional rendering: renders `CandidatePrestart` when `session.status === 'CREATED'`.
   - Ambiguous activation response reconciliation:
     - If the `/activate` HTTP request fails or drops, the client re-fetches `GET /api/candidate/sessions/[token]`.
     - If server reports `ACTIVE`: seamlessly transitions to `ACTIVE_WORKSPACE`.
     - If server reports `CREATED`: surfaces platform failure with safe retry.
   - Double-trigger prevention: in-flight activation disables start actions.
   - Accessible focus transition: on transitioning into `ACTIVE_WORKSPACE`, shifts focus to the primary workspace heading (`tabIndex={-1}`) for keyboard and screen reader accessibility.

4. **Styling Alignment (`apps/web/app/workspace.css`)**:
   - Added styles for `.prestart-card`, `.prestart-box`, `.orientation-grid`, and status badges.
   - Fully supports `prefers-reduced-motion`.

5. **Explicit Deferral**:
   - C3 workspace shell redesign, practice environment, command console redesign, and submission review screens remain explicitly deferred.

## Verification

- `tests/unit/candidate-prestart.test.tsx`: 10 focused unit tests verifying prestart rendering, leakage redaction, duration display, policy exposure, disabled in-flight actions, and accessibility semantics.
- `tests/integration/candidate-prestart-lifecycle.test.ts`: 16 comprehensive integration tests verifying the full lifecycle, scenario leakage boundaries across all candidate API routes, sandbox readiness ordering, idempotency, retry safety, ambiguous network recovery, and refresh behaviors.
- Candidate regressions: all 81 tests passing (`candidate-projection`, `candidate-ai-panel`, `candidate-save-integrity`, `candidate-work-presentation`, `candidate-ai-workspace`, `candidate-ai-api`, `session-activation`).
- Timing/finality regressions: all 89 tests passing (`authoritative-timing-foundation`, `request-bound-deadline-cutoff`, `authoritative-deadline-convergence`, `restart-reconciliation`, `frozen-workspace-finality`).
- Full verification: `npm run verify` passed completely.
