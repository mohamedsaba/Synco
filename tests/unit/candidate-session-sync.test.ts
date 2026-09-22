import { describe, expect, it } from 'vitest';

import { mergeCandidateTiming } from '../../apps/web/src/candidate/use-candidate-session';
import type { ServerAuthoritativeCandidateSession } from '../../apps/web/src/candidate/candidate-experience-state';
import type { CandidateTimingProjection } from '../../apps/web/src/sessions/session-timing';

const session: ServerAuthoritativeCandidateSession = {
  id: 'session-c8a',
  status: 'ACTIVE',
  closureReason: null,
  durationSeconds: 900,
  activatedAt: '2026-09-22T10:00:00.000Z',
  submittedAt: null,
  deadline: '2026-09-22T10:15:00.000Z',
  serverTime: '2026-09-22T10:01:00.000Z',
};

const timing = (
  overrides: Partial<CandidateTimingProjection>,
): CandidateTimingProjection => ({
  durationSeconds: 900,
  activatedAt: '2026-09-22T10:00:00.000Z',
  deadline: '2026-09-22T10:15:00.000Z',
  serverTime: '2026-09-22T10:02:00.000Z',
  status: 'ACTIVE',
  closureReason: null,
  ...overrides,
});

describe('C8A — candidate timing monotonicity', () => {
  it('does not regress local SUBMITTED from a stale ACTIVE response', () => {
    const previous = {
      ...session,
      status: 'SUBMITTED' as const,
      closureReason: 'candidate_submission' as const,
      submittedAt: '2026-09-22T10:01:30.000Z',
    };

    expect(mergeCandidateTiming(previous, timing({}))).toMatchObject({
      status: 'SUBMITTED',
      closureReason: 'candidate_submission',
      submittedAt: previous.submittedAt,
    });
  });

  it('does not erase a known closure reason with stale null', () => {
    expect(
      mergeCandidateTiming(
        { ...session, closureReason: 'candidate_submission' },
        timing({ closureReason: null }),
      ).closureReason,
    ).toBe('candidate_submission');
  });

  it('accepts legitimate ACTIVE to SUBMITTED progress', () => {
    expect(
      mergeCandidateTiming(
        session,
        timing({ status: 'SUBMITTED', closureReason: 'timeout' }),
      ),
    ).toMatchObject({ status: 'SUBMITTED', closureReason: 'timeout' });
  });

  it('accepts legitimate null to admitted closure progress without mutating inputs', () => {
    const next = timing({ closureReason: 'candidate_submission' });
    const previousSnapshot = { ...session };
    const nextSnapshot = { ...next };

    expect(mergeCandidateTiming(session, next)).toMatchObject({
      status: 'ACTIVE',
      closureReason: 'candidate_submission',
    });
    expect(session).toEqual(previousSnapshot);
    expect(next).toEqual(nextSnapshot);
  });
});
