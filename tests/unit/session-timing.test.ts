import { describe, expect, it } from 'vitest';

import { sliceOneScenario } from '../../apps/web/src/scenarios/slice-one-scenario';
import type { AssessmentSession } from '../../apps/web/src/sessions/session';
import {
  deriveSessionDeadline,
  isDeadlineExceeded,
  toCandidateTimingProjection,
} from '../../apps/web/src/sessions/session-timing';

describe('canonical deadline derivation', () => {
  it('derives exact UTC ISO deadline for ACTIVE timed session', () => {
    const session: Pick<AssessmentSession, 'activatedAt' | 'durationSeconds'> =
      {
        activatedAt: '2026-09-20T10:00:00.000Z',
        durationSeconds: 3600,
      };

    expect(deriveSessionDeadline(session)).toBe('2026-09-20T11:00:00.000Z');
  });

  it('returns null deadline for CREATED session where activatedAt is null', () => {
    const session: Pick<AssessmentSession, 'activatedAt' | 'durationSeconds'> =
      {
        activatedAt: null,
        durationSeconds: 3600,
      };

    expect(deriveSessionDeadline(session)).toBeNull();
  });

  it('returns null deadline for legacy session where durationSeconds is null', () => {
    const session: Pick<AssessmentSession, 'activatedAt' | 'durationSeconds'> =
      {
        activatedAt: '2026-09-20T10:00:00.000Z',
        durationSeconds: null,
      };

    expect(deriveSessionDeadline(session)).toBeNull();
  });

  it('returns null deadline for non-positive durationSeconds', () => {
    expect(
      deriveSessionDeadline({
        activatedAt: '2026-09-20T10:00:00.000Z',
        durationSeconds: 0,
      }),
    ).toBeNull();

    expect(
      deriveSessionDeadline({
        activatedAt: '2026-09-20T10:00:00.000Z',
        durationSeconds: -100,
      }),
    ).toBeNull();
  });
});

describe('candidate timing projection', () => {
  it('projects minimal timing fields and avoids derived or stale countdowns', () => {
    const session: AssessmentSession = {
      id: 'session-timed-1',
      candidateTokenHash: 'hash-1',
      scenario: sliceOneScenario,
      status: 'ACTIVE',
      workingContent: '',
      submittedContent: null,
      createdAt: '2026-09-20T09:59:00.000Z',
      activatedAt: '2026-09-20T10:00:00.000Z',
      submittedAt: null,
      durationSeconds: 900,
      closureReason: null,
    };

    const serverTime = '2026-09-20T10:05:00.000Z';
    const projection = toCandidateTimingProjection(session, serverTime);

    expect(projection).toEqual({
      durationSeconds: 900,
      activatedAt: '2026-09-20T10:00:00.000Z',
      deadline: '2026-09-20T10:15:00.000Z',
      serverTime: '2026-09-20T10:05:00.000Z',
      status: 'ACTIVE',
      closureReason: null,
    });

    expect(projection).not.toHaveProperty('isExpired');
    expect(projection).not.toHaveProperty('remainingSeconds');
    expect(projection).not.toHaveProperty('elapsedSeconds');
    expect(projection).not.toHaveProperty('countdown');
  });

  it('projects null duration and null deadline for legacy session with final closureReason', () => {
    const legacySubmittedSession: AssessmentSession = {
      id: 'legacy-submitted-1',
      candidateTokenHash: 'hash-legacy',
      scenario: sliceOneScenario,
      status: 'SUBMITTED',
      workingContent: 'done',
      submittedContent: 'done',
      createdAt: '2026-09-20T09:00:00.000Z',
      activatedAt: '2026-09-20T09:01:00.000Z',
      submittedAt: '2026-09-20T09:30:00.000Z',
      durationSeconds: null,
      closureReason: 'candidate_submission',
    };

    const serverTime = '2026-09-20T10:00:00.000Z';
    const projection = toCandidateTimingProjection(
      legacySubmittedSession,
      serverTime,
    );

    expect(projection).toEqual({
      durationSeconds: null,
      activatedAt: '2026-09-20T09:01:00.000Z',
      deadline: null,
      serverTime: '2026-09-20T10:00:00.000Z',
      status: 'SUBMITTED',
      closureReason: 'candidate_submission',
    });
  });
});

describe('isDeadlineExceeded', () => {
  it('returns false when deadline is null', () => {
    expect(isDeadlineExceeded(null, '2026-09-20T10:15:00.000Z')).toBe(false);
  });

  it('returns false when now is strictly before deadline', () => {
    expect(
      isDeadlineExceeded(
        '2026-09-20T10:15:00.000Z',
        '2026-09-20T10:14:59.999Z',
      ),
    ).toBe(false);
  });

  it('returns true when now is exactly equal to deadline (boundary cutoff)', () => {
    expect(
      isDeadlineExceeded(
        '2026-09-20T10:15:00.000Z',
        '2026-09-20T10:15:00.000Z',
      ),
    ).toBe(true);
  });

  it('returns true when now is strictly after deadline', () => {
    expect(
      isDeadlineExceeded(
        '2026-09-20T10:15:00.000Z',
        '2026-09-20T10:15:00.001Z',
      ),
    ).toBe(true);
  });

  it('returns false when now or deadline is not parseable', () => {
    expect(isDeadlineExceeded('invalid', '2026-09-20T10:15:00.000Z')).toBe(
      false,
    );
    expect(isDeadlineExceeded('2026-09-20T10:15:00.000Z', 'invalid')).toBe(
      false,
    );
  });
});
