import { deriveSessionDeadline } from '../sessions/session-timing';
import type {
  CandidateEphemeralUiMode,
  CandidateExperienceCapabilities,
  CandidateExperienceProjection,
  CandidateFinalizationState,
  ServerAuthoritativeCandidateSession,
} from './candidate-experience-state';
import {
  calculateRemainingMs,
  isProjectedDeadlineReached,
} from './candidate-timing';

/**
 * ============================================================================
 * CANDIDATE EXPERIENCE PROJECTION (C1 PURE FUNCTION)
 * ============================================================================
 *
 * Deterministic projection mapping:
 *   SERVER TRUTH + CALIBRATED TIME + EPHEMERAL UI MODE = CANDIDATE UX STATE
 *
 * Principles:
 * 1. Pure function: no side effects, no React state, no persistent client FSM.
 * 2. Never mutates server truth or changes durable backend status locally.
 * 3. Never projects COMPLETED without authoritative server status = SUBMITTED.
 * 4. At now >= deadline, ACTIVE transitions to TIME_LIMIT_REACHED.
 * 5. Unknown or impossible server states fail safely and visibly.
 */

export type CandidateExperienceInput = Readonly<{
  serverSession: ServerAuthoritativeCandidateSession | null | undefined;
  calibratedNowMs: number;
  uiMode?: CandidateEphemeralUiMode;
  finalizationState?: CandidateFinalizationState;
}>;

const ALL_CAPABILITIES_DISABLED: CandidateExperienceCapabilities = {
  canEdit: false,
  canRunCommands: false,
  canUseAi: false,
  canSubmit: false,
  canActivate: false,
};

export const projectCandidateExperience = (
  input: CandidateExperienceInput,
): CandidateExperienceProjection => {
  const { serverSession, calibratedNowMs } = input;
  const uiMode = input.uiMode ?? 'entry';
  const finalizationState = input.finalizationState ?? 'idle';

  // 1. Validate serverSession
  if (!serverSession || typeof serverSession.status !== 'string') {
    return {
      uxState: 'UNKNOWN_OR_UNSUPPORTED',
      serverStatus: 'UNKNOWN',
      closureReason: null,
      deadline: null,
      remainingMs: null,
      isDeadlineReached: false,
      completionVariant: null,
      completionMessage: null,
      capabilities: ALL_CAPABILITIES_DISABLED,
      error: 'Session data is missing or invalid.',
    };
  }

  // 2. Validate known durable session statuses
  if (
    serverSession.status !== 'CREATED' &&
    serverSession.status !== 'ACTIVE' &&
    serverSession.status !== 'SUBMITTED'
  ) {
    return {
      uxState: 'UNKNOWN_OR_UNSUPPORTED',
      serverStatus: 'UNKNOWN',
      closureReason: serverSession.closureReason,
      deadline: null,
      remainingMs: null,
      isDeadlineReached: false,
      completionVariant: null,
      completionMessage: null,
      capabilities: ALL_CAPABILITIES_DISABLED,
      error: `Unrecognized server session status: "${serverSession.status}"`,
    };
  }

  // 3. Resolve authoritative deadline
  const deadline =
    serverSession.deadline ?? deriveSessionDeadline(serverSession);

  // 4. Evaluate CREATED state
  if (serverSession.status === 'CREATED') {
    let uxState: CandidateExperienceProjection['uxState'] = 'ENTRY';

    if (finalizationState === 'in_flight' || uiMode === 'provisioning') {
      uxState = 'PROVISIONING';
    } else if (uiMode === 'ready_to_start') {
      uxState = 'READY_TO_START';
    } else if (uiMode === 'orientation') {
      uxState = 'ORIENTATION';
    } else {
      uxState = 'ENTRY';
    }

    return {
      uxState,
      serverStatus: 'CREATED',
      closureReason: null,
      deadline: null,
      remainingMs: null,
      isDeadlineReached: false,
      completionVariant: null,
      completionMessage: null,
      capabilities: {
        canEdit: false,
        canRunCommands: false,
        canUseAi: false,
        canSubmit: false,
        canActivate: uxState !== 'PROVISIONING',
      },
      error: null,
    };
  }

  // 5. Evaluate ACTIVE state
  if (serverSession.status === 'ACTIVE') {
    const remainingMs = calculateRemainingMs(deadline, calibratedNowMs);
    const isDeadlineReached = isProjectedDeadlineReached(
      deadline,
      calibratedNowMs,
    );

    // Durable admission survives refresh; local in-flight state covers only the
    // request window before the authoritative response arrives.
    if (
      serverSession.closureReason !== null ||
      finalizationState === 'in_flight'
    ) {
      return {
        uxState: 'FINALIZING',
        serverStatus: 'ACTIVE',
        closureReason: serverSession.closureReason,
        deadline,
        remainingMs,
        isDeadlineReached,
        completionVariant: null,
        completionMessage: null,
        capabilities: ALL_CAPABILITIES_DISABLED,
        error: null,
      };
    }

    // Time limit reached
    if (isDeadlineReached) {
      return {
        uxState: 'TIME_LIMIT_REACHED',
        serverStatus: 'ACTIVE',
        closureReason: null,
        deadline,
        remainingMs: 0,
        isDeadlineReached: true,
        completionVariant: null,
        completionMessage: null,
        capabilities: ALL_CAPABILITIES_DISABLED,
        error: null,
      };
    }

    // Ephemeral submission review
    if (uiMode === 'submission_review') {
      return {
        uxState: 'SUBMISSION_REVIEW',
        serverStatus: 'ACTIVE',
        closureReason: null,
        deadline,
        remainingMs,
        isDeadlineReached: false,
        completionVariant: null,
        completionMessage: null,
        capabilities: {
          canEdit: false,
          canRunCommands: false,
          canUseAi: false,
          canSubmit: true,
          canActivate: false,
        },
        error: null,
      };
    }

    // Standard active working state
    return {
      uxState: 'ACTIVE_WORKSPACE',
      serverStatus: 'ACTIVE',
      closureReason: null,
      deadline,
      remainingMs,
      isDeadlineReached: false,
      completionVariant: null,
      completionMessage: null,
      capabilities: {
        canEdit: true,
        canRunCommands: true,
        canUseAi: true,
        canSubmit: true,
        canActivate: false,
      },
      error: null,
    };
  }

  // 6. Evaluate SUBMITTED state
  const isTimeout = serverSession.closureReason === 'timeout';
  const completionVariant = isTimeout ? 'timeout' : 'candidate_submission';
  const completionMessage = isTimeout
    ? 'Your assessment time ended. Your work was finalized automatically.'
    : 'Your assessment has been submitted. Your work is final.';

  return {
    uxState: 'COMPLETED',
    serverStatus: 'SUBMITTED',
    closureReason: serverSession.closureReason,
    deadline,
    remainingMs: deadline !== null ? 0 : null,
    isDeadlineReached: deadline !== null,
    completionVariant,
    completionMessage,
    capabilities: ALL_CAPABILITIES_DISABLED,
    error: null,
  };
};
