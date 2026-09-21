# Slice Plan 071 — Candidate Projection / State Foundation (C1)

Status: COMPLETED
Slice: C1
Date: 2026-09-21
Baseline: `d5c844c33e8a719be4dd49405d45d8b7661005ca`

## Goal

Establish the candidate experience state classification and deterministic projection foundation without creating a mutable client-side finite-state machine that mirrors backend lifecycle, while calibrating browser time with authoritative server time and enforcing truth-preserving boundaries.

## Completed Changes

1. **Candidate State Classification (`apps/web/src/candidate/candidate-experience-state.ts`)**:
   - Explicitly categorized all state into three non-overlapping tiers:
     - **Server Authoritative**: `status`, `closureReason`, `durationSeconds`, `activatedAt`, `submittedAt`, `deadline`, `serverTime`, persisted save results, command results.
     - **Derived Client Projection**: `remainingMs`, `isDeadlineReached`, `completionVariant`, `completionMessage`, `capabilities`, `CandidateUxState`.
     - **Ephemeral UI State**: `uiMode` (`'entry' | 'orientation' | 'ready_to_start' | 'provisioning' | 'workspace' | 'submission_review'`), `finalizationState` (`'idle' | 'in_flight' | 'failed'`).

2. **Timing and Clock Calibration (`apps/web/src/candidate/candidate-timing.ts`)**:
   - Browser clock is never authority.
   - Clock offset calculated against authoritative `serverTime` via network midpoint calibration when timing metadata is available:
     $$\text{offsetMs} = \text{parsedServerTimeMs} - \left(\text{requestStartedAt} + \frac{\text{roundTripMs}}{2}\right)$$
   - Calibrated current time: $\text{calibratedNow} = \text{Date.now()} + \text{offsetMs}$.
   - Remaining time is ALWAYS derived from $\max(0, \text{deadline} - \text{calibratedNow})$, never decremented as a state counter.
   - Automatically resilient to tab backgrounding, sleep, and refresh.
   - Legacy untimed sessions (`durationSeconds = null`) safely return `remainingMs = null` without countdown fabrication.

3. **Deterministic Pure Projection (`apps/web/src/candidate/candidate-projection.ts`)**:
   - Implemented `projectCandidateExperience(input)` as a pure function:
     $$\text{Server Truth} + \text{Calibrated Time} + \text{Ephemeral UI Mode} = \text{Candidate UX State}$$
   - Mapped canonical UX states: `ENTRY`, `ORIENTATION`, `READY_TO_START`, `PROVISIONING`, `ACTIVE_WORKSPACE`, `SUBMISSION_REVIEW`, `TIME_LIMIT_REACHED`, `FINALIZING`, `COMPLETED`, and `UNKNOWN_OR_UNSUPPORTED`.
   - Never changes backend status locally; at deadline cutoff, reflects `TIME_LIMIT_REACHED` while backend status remains `ACTIVE` until sweeper/manual submission converges.
   - Local submit requests project `FINALIZING`, never optimistic `COMPLETED`.

4. **Synchronization Hook (`apps/web/src/candidate/use-candidate-session.ts`)**:
   - Provides clean React integration holding server snapshot, clock calibration, and ephemeral UI state without duplicating server lifecycle truth into independent state.

5. **Routine Candidate API Alignment**:
   - Updated `toCandidateSessionView` to expose `deadline` and `serverTime`.
   - Updated candidate API routes (`GET /sessions/[token]`, `POST /activate`, `POST /submit`, `PUT /file`, SSR `page.tsx`) to supply authoritative `serverService.now()`.

6. **Candidate Workspace Integration**:
   - Integrated `useCandidateSession` in `apps/web/app/candidate/[token]/candidate-workspace.tsx` to derive active editing capabilities and factual time-limit warnings directly from projection.

## Verification

- `tests/unit/candidate-projection.test.ts`: 18 focused unit tests proving all projection and timing contracts.
- Targeted candidate regressions: `tests/unit/candidate-ai-panel.test.tsx`, `tests/unit/session-timing.test.ts`, `tests/unit/candidate-save-integrity.test.ts`, `tests/unit/candidate-work-presentation.test.ts`, `tests/integration/candidate-ai-api.test.ts`, `tests/integration/candidate-ai-workspace.test.ts`, `tests/integration/candidate-save-integrity.test.ts`.
- Timing and recovery regressions: `tests/integration/authoritative-deadline-convergence.test.ts`, `tests/integration/restart-reconciliation.test.ts`.
- Full verification: `npm run verify` passed completely (formatting, linting, typechecking, 524 vitest tests, next build).
