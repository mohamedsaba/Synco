import type {
  AssessmentSession,
  SessionClosureReason,
  SessionStatus,
} from './session';

export type CandidateTimingProjection = Readonly<{
  durationSeconds: number | null;
  activatedAt: string | null;
  deadline: string | null;
  serverTime: string;
  status: SessionStatus;
  closureReason: SessionClosureReason | null;
}>;

/**
 * Derives the session deadline from activatedAt and durationSeconds.
 *
 * Rules:
 * - If activatedAt is null (e.g. CREATED status), deadline is null.
 * - If durationSeconds is null or undefined (legacy untimed session), deadline is null.
 * - If durationSeconds is non-positive, deadline is null.
 * - Otherwise: deadline = activatedAt + durationSeconds (UTC ISO string).
 *
 * No separate expiresAt is persisted; activatedAt + durationSeconds is the sole source of truth.
 */
export const deriveSessionDeadline = (
  session: Pick<AssessmentSession, 'activatedAt' | 'durationSeconds'>,
): string | null => {
  if (
    session.activatedAt === null ||
    session.durationSeconds === null ||
    session.durationSeconds === undefined ||
    session.durationSeconds <= 0
  ) {
    return null;
  }

  const activatedMs = Date.parse(session.activatedAt);
  if (Number.isNaN(activatedMs)) {
    return null;
  }

  return new Date(activatedMs + session.durationSeconds * 1000).toISOString();
};

/**
 * Minimal candidate timing projection exposed for candidate UX.
 *
 * Does not expose derived/stale presentation values such as isExpired,
 * remainingSeconds, elapsedSeconds, or countdown.
 */
export const toCandidateTimingProjection = (
  session: AssessmentSession,
  serverTime: string,
): CandidateTimingProjection => ({
  durationSeconds: session.durationSeconds,
  activatedAt: session.activatedAt,
  deadline: deriveSessionDeadline(session),
  serverTime,
  status: session.status,
  closureReason: session.closureReason,
});
