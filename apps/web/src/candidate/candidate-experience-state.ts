import type { SessionClosureReason, SessionStatus } from '../sessions/session';

/**
 * ============================================================================
 * CANDIDATE STATE CLASSIFICATION (C1 ARCHITECTURE CONTRACT)
 * ============================================================================
 *
 * All candidate state is divided into three non-overlapping tiers:
 *
 * 1. SERVER AUTHORITATIVE
 *    - Persisted truth from the backend domain.
 *    - Examples: status, closureReason, durationSeconds, activatedAt,
 *      submittedAt, deadline, serverTime, persisted save results, command results.
 *    - NEVER duplicated into mutable client-side mirror stores.
 *
 * 2. DERIVED CLIENT PROJECTION
 *    - Deterministically derived from (Server Truth + Calibrated Time + Ephemeral UI Mode).
 *    - Examples: remainingMs, deadlineReached, completionVariant, candidate UX state.
 *    - Must be a pure projection, not independently mutable truth.
 *
 * 3. EPHEMERAL UI STATE
 *    - Transient presentation modes owned strictly by local React UI.
 *    - Examples: active orientation page, submission-review modal open/closed,
 *      panel collapse state, local unsaved editor buffer, temporary in-flight state.
 */

// --- 1. SERVER AUTHORITATIVE CONTRACTS ---

export type ServerAuthoritativeCandidateSession = Readonly<{
  id: string;
  status: SessionStatus;
  closureReason: SessionClosureReason | null;
  durationSeconds: number | null;
  activatedAt: string | null;
  submittedAt: string | null;
  deadline?: string | null;
  serverTime?: string | null;
  workingContent?: string;
  scenarioType?: 'single_file' | 'multi_file';
}>;

// --- 2. DERIVED CLIENT PROJECTION CONTRACTS ---

export type CandidateUxState =
  | 'ENTRY'
  | 'ORIENTATION'
  | 'READY_TO_START'
  | 'PROVISIONING'
  | 'ACTIVE_WORKSPACE'
  | 'SUBMISSION_REVIEW'
  | 'TIME_LIMIT_REACHED'
  | 'FINALIZING'
  | 'COMPLETED'
  | 'UNKNOWN_OR_UNSUPPORTED';

export type CandidateCompletionVariant =
  'candidate_submission' | 'timeout' | null;

export type CandidateExperienceCapabilities = Readonly<{
  canEdit: boolean;
  canRunCommands: boolean;
  canUseAi: boolean;
  canSubmit: boolean;
  canActivate: boolean;
}>;

export type CandidateExperienceProjection = Readonly<{
  uxState: CandidateUxState;
  serverStatus: SessionStatus | 'UNKNOWN';
  closureReason: SessionClosureReason | null;
  deadline: string | null;
  remainingMs: number | null;
  isDeadlineReached: boolean;
  completionVariant: CandidateCompletionVariant;
  completionMessage: string | null;
  capabilities: CandidateExperienceCapabilities;
  error: string | null;
}>;

// --- 3. EPHEMERAL UI STATE CONTRACTS ---

export type CandidateEphemeralUiMode =
  | 'entry'
  | 'orientation'
  | 'ready_to_start'
  | 'provisioning'
  | 'workspace'
  | 'submission_review';

export type CandidateFinalizationState = 'idle' | 'in_flight' | 'failed';
