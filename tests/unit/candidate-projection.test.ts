import { describe, expect, it } from 'vitest';

import {
  calibrateClock,
  calculateRemainingMs,
  getCalibratedNow,
  isProjectedDeadlineReached,
  projectCandidateExperience,
  type ServerAuthoritativeCandidateSession,
} from '../../apps/web/src/candidate';

describe('C1 — Candidate Projection / State Foundation', () => {
  const baseSession: ServerAuthoritativeCandidateSession = {
    id: 'session-001',
    status: 'ACTIVE',
    closureReason: null,
    durationSeconds: 3600,
    activatedAt: '2026-09-21T10:00:00.000Z',
    submittedAt: null,
    deadline: '2026-09-21T11:00:00.000Z',
    serverTime: '2026-09-21T10:15:00.000Z',
  };

  // Requirement 1: CREATED projects to appropriate pre-active candidate state
  it('1. CREATED projects to appropriate pre-active candidate state (ENTRY, ORIENTATION, READY_TO_START, PROVISIONING)', () => {
    const createdSession: ServerAuthoritativeCandidateSession = {
      ...baseSession,
      status: 'CREATED',
      activatedAt: null,
      deadline: null,
      closureReason: null,
    };

    // Default CREATED -> ENTRY
    const entryProj = projectCandidateExperience({
      serverSession: createdSession,
      calibratedNowMs: Date.parse('2026-09-21T09:59:00.000Z'),
    });
    expect(entryProj.uxState).toBe('ENTRY');
    expect(entryProj.serverStatus).toBe('CREATED');
    expect(entryProj.capabilities.canActivate).toBe(true);
    expect(entryProj.capabilities.canEdit).toBe(false);
    expect(entryProj.capabilities.canRunCommands).toBe(false);
    expect(entryProj.capabilities.canUseAi).toBe(false);
    expect(entryProj.remainingMs).toBeNull();

    // With uiMode = 'orientation'
    const orientationProj = projectCandidateExperience({
      serverSession: createdSession,
      calibratedNowMs: Date.parse('2026-09-21T09:59:00.000Z'),
      uiMode: 'orientation',
    });
    expect(orientationProj.uxState).toBe('ORIENTATION');

    // With uiMode = 'ready_to_start'
    const readyProj = projectCandidateExperience({
      serverSession: createdSession,
      calibratedNowMs: Date.parse('2026-09-21T09:59:00.000Z'),
      uiMode: 'ready_to_start',
    });
    expect(readyProj.uxState).toBe('READY_TO_START');

    // With uiMode = 'provisioning'
    const provProj = projectCandidateExperience({
      serverSession: createdSession,
      calibratedNowMs: Date.parse('2026-09-21T09:59:00.000Z'),
      uiMode: 'provisioning',
    });
    expect(provProj.uxState).toBe('PROVISIONING');
    expect(provProj.capabilities.canActivate).toBe(false);
  });

  // Requirement 2: ACTIVE before deadline projects ACTIVE_WORKSPACE
  it('2. ACTIVE before deadline projects ACTIVE_WORKSPACE with full editing capabilities', () => {
    const beforeDeadlineMs = Date.parse('2026-09-21T10:30:00.000Z');
    const proj = projectCandidateExperience({
      serverSession: baseSession,
      calibratedNowMs: beforeDeadlineMs,
    });

    expect(proj.uxState).toBe('ACTIVE_WORKSPACE');
    expect(proj.serverStatus).toBe('ACTIVE');
    expect(proj.isDeadlineReached).toBe(false);
    expect(proj.remainingMs).toBe(30 * 60 * 1000); // 30 minutes remaining
    expect(proj.capabilities).toEqual({
      canEdit: true,
      canRunCommands: true,
      canUseAi: true,
      canSubmit: true,
      canActivate: false,
    });
  });

  // Requirement 3: ACTIVE + submission-review ephemeral mode projects SUBMISSION_REVIEW
  it('3. ACTIVE + submission-review ephemeral mode projects SUBMISSION_REVIEW', () => {
    const beforeDeadlineMs = Date.parse('2026-09-21T10:45:00.000Z');
    const proj = projectCandidateExperience({
      serverSession: baseSession,
      calibratedNowMs: beforeDeadlineMs,
      uiMode: 'submission_review',
    });

    expect(proj.uxState).toBe('SUBMISSION_REVIEW');
    expect(proj.serverStatus).toBe('ACTIVE');
    expect(proj.isDeadlineReached).toBe(false);
    expect(proj.capabilities.canEdit).toBe(false); // In review mode
    expect(proj.capabilities.canSubmit).toBe(true);
  });

  // Requirement 4: closing submission review returns ACTIVE_WORKSPACE if deadline has not passed
  it('4. closing submission review returns ACTIVE_WORKSPACE if deadline has not passed', () => {
    const beforeDeadlineMs = Date.parse('2026-09-21T10:45:00.000Z');

    // Review open
    const openProj = projectCandidateExperience({
      serverSession: baseSession,
      calibratedNowMs: beforeDeadlineMs,
      uiMode: 'submission_review',
    });
    expect(openProj.uxState).toBe('SUBMISSION_REVIEW');

    // Review closed (switched to workspace mode)
    const closedProj = projectCandidateExperience({
      serverSession: baseSession,
      calibratedNowMs: beforeDeadlineMs,
      uiMode: 'workspace',
    });
    expect(closedProj.uxState).toBe('ACTIVE_WORKSPACE');
    expect(closedProj.capabilities.canEdit).toBe(true);
  });

  // Requirement 5: ACTIVE at exact deadline projects TIME_LIMIT_REACHED
  it('5. ACTIVE at exact deadline projects TIME_LIMIT_REACHED', () => {
    const exactDeadlineMs = Date.parse('2026-09-21T11:00:00.000Z');
    const proj = projectCandidateExperience({
      serverSession: baseSession,
      calibratedNowMs: exactDeadlineMs,
    });

    expect(proj.uxState).toBe('TIME_LIMIT_REACHED');
    expect(proj.serverStatus).toBe('ACTIVE');
    expect(proj.isDeadlineReached).toBe(true);
    expect(proj.remainingMs).toBe(0);
    expect(proj.capabilities.canEdit).toBe(false);
    expect(proj.capabilities.canRunCommands).toBe(false);
    expect(proj.capabilities.canUseAi).toBe(false);
    expect(proj.capabilities.canSubmit).toBe(false);
  });

  // Requirement 6: ACTIVE after deadline projects TIME_LIMIT_REACHED
  it('6. ACTIVE after deadline projects TIME_LIMIT_REACHED', () => {
    const afterDeadlineMs = Date.parse('2026-09-21T11:05:00.000Z');
    const proj = projectCandidateExperience({
      serverSession: baseSession,
      calibratedNowMs: afterDeadlineMs,
    });

    expect(proj.uxState).toBe('TIME_LIMIT_REACHED');
    expect(proj.serverStatus).toBe('ACTIVE');
    expect(proj.isDeadlineReached).toBe(true);
    expect(proj.remainingMs).toBe(0);
  });

  // Requirement 7: deadline projection never changes durable backend status locally
  it('7. deadline projection never changes durable backend status locally', () => {
    const afterDeadlineMs = Date.parse('2026-09-21T11:15:00.000Z');
    const immutableSession = Object.freeze({ ...baseSession });

    const proj = projectCandidateExperience({
      serverSession: immutableSession,
      calibratedNowMs: afterDeadlineMs,
    });

    expect(proj.uxState).toBe('TIME_LIMIT_REACHED');
    expect(proj.serverStatus).toBe('ACTIVE'); // Server status remains ACTIVE
    expect(immutableSession.status).toBe('ACTIVE'); // Unmutated
  });

  // Requirement 8: SUBMITTED/candidate_submission projects COMPLETED manual variant
  it('8. SUBMITTED/candidate_submission projects COMPLETED manual variant', () => {
    const submittedSession: ServerAuthoritativeCandidateSession = {
      ...baseSession,
      status: 'SUBMITTED',
      closureReason: 'candidate_submission',
      submittedAt: '2026-09-21T10:45:00.000Z',
    };

    const proj = projectCandidateExperience({
      serverSession: submittedSession,
      calibratedNowMs: Date.parse('2026-09-21T10:46:00.000Z'),
    });

    expect(proj.uxState).toBe('COMPLETED');
    expect(proj.serverStatus).toBe('SUBMITTED');
    expect(proj.completionVariant).toBe('candidate_submission');
    expect(proj.completionMessage).toBe(
      'Your assessment has been submitted. Your work is final.',
    );
    expect(proj.capabilities.canEdit).toBe(false);
  });

  // Requirement 9: SUBMITTED/timeout projects COMPLETED timeout variant
  it('9. SUBMITTED/timeout projects COMPLETED timeout variant', () => {
    const timeoutSession: ServerAuthoritativeCandidateSession = {
      ...baseSession,
      status: 'SUBMITTED',
      closureReason: 'timeout',
      submittedAt: '2026-09-21T11:00:01.000Z',
    };

    const proj = projectCandidateExperience({
      serverSession: timeoutSession,
      calibratedNowMs: Date.parse('2026-09-21T11:00:05.000Z'),
    });

    expect(proj.uxState).toBe('COMPLETED');
    expect(proj.serverStatus).toBe('SUBMITTED');
    expect(proj.completionVariant).toBe('timeout');
    expect(proj.completionMessage).toBe(
      'Your assessment time ended. Your work was finalized automatically.',
    );
    expect(proj.capabilities.canEdit).toBe(false);
  });

  // Requirement 10: local "submit requested" alone cannot project COMPLETED
  it('10. local "submit requested" alone cannot project COMPLETED', () => {
    const proj = projectCandidateExperience({
      serverSession: baseSession, // status = ACTIVE
      calibratedNowMs: Date.parse('2026-09-21T10:50:00.000Z'),
      finalizationState: 'in_flight',
    });

    // In-flight finalization projects FINALIZING, never COMPLETED
    expect(proj.uxState).toBe('FINALIZING');
    expect(proj.serverStatus).toBe('ACTIVE');
    expect(proj.completionVariant).toBeNull();
    expect(proj.capabilities.canEdit).toBe(false);
  });

  it('projects durable ACTIVE finalization as FINALIZING with every capability disabled', () => {
    for (const closureReason of ['candidate_submission', 'timeout'] as const) {
      const proj = projectCandidateExperience({
        serverSession: { ...baseSession, closureReason },
        calibratedNowMs: Date.parse('2026-09-21T12:00:00.000Z'),
        uiMode: 'workspace',
      });

      expect(proj).toMatchObject({
        uxState: 'FINALIZING',
        serverStatus: 'ACTIVE',
        closureReason,
        completionVariant: null,
        capabilities: {
          canEdit: false,
          canRunCommands: false,
          canUseAi: false,
          canSubmit: false,
          canActivate: false,
        },
      });
    }
  });

  it('reconstructs durable ACTIVE finalization after refresh without local state', () => {
    const admitted = {
      ...baseSession,
      closureReason: 'candidate_submission' as const,
    };
    const first = projectCandidateExperience({
      serverSession: admitted,
      calibratedNowMs: Date.parse('2026-09-21T10:20:00.000Z'),
    });
    const refreshed = projectCandidateExperience({
      serverSession: JSON.parse(JSON.stringify(admitted)),
      calibratedNowMs: Date.parse('2026-09-21T10:20:00.000Z'),
    });

    expect(refreshed).toEqual(first);
    expect(refreshed.uxState).toBe('FINALIZING');
  });

  // Requirement 11: refresh reconstruction from same server snapshot yields same candidate projection
  it('11. refresh reconstruction from same server snapshot yields same candidate projection', () => {
    const fixedNowMs = Date.parse('2026-09-21T10:20:00.000Z');

    const firstRun = projectCandidateExperience({
      serverSession: baseSession,
      calibratedNowMs: fixedNowMs,
    });

    // Simulated refresh with newly parsed server response object
    const simulatedRefreshedSession: ServerAuthoritativeCandidateSession =
      JSON.parse(JSON.stringify(baseSession));

    const secondRun = projectCandidateExperience({
      serverSession: simulatedRefreshedSession,
      calibratedNowMs: fixedNowMs,
    });

    expect(secondRun).toEqual(firstRun);
  });

  // Requirement 12: remaining time derives from deadline rather than decrement counter
  it('12. remaining time derives from deadline rather than decrement counter', () => {
    const deadline = '2026-09-21T11:00:00.000Z';

    const t1 = Date.parse('2026-09-21T10:00:00.000Z');
    expect(calculateRemainingMs(deadline, t1)).toBe(3600 * 1000);

    const t2 = Date.parse('2026-09-21T10:17:42.000Z');
    const expectedMs = Date.parse(deadline) - t2;
    expect(calculateRemainingMs(deadline, t2)).toBe(expectedMs);
  });

  // Requirement 13: clock calibration uses serverTime
  it('13. clock calibration uses serverTime and calculates offset', () => {
    const serverTime = '2026-09-21T12:00:00.000Z'; // Server is 12:00
    const localNow = Date.parse('2026-09-21T11:58:00.000Z'); // Local clock is 2 minutes slow

    // Direct offset
    const cal = calibrateClock({
      serverTime,
      localReceiptTimeMs: localNow,
    });
    expect(cal.offsetMs).toBe(120_000); // +2 minutes

    // Calibrated now adjusts local time by offset
    expect(getCalibratedNow(cal, localNow)).toBe(Date.parse(serverTime));

    // Midpoint calibration with round-trip measurement
    const requestStartedAtMs = localNow;
    const responseReceivedAtMs = localNow + 200; // 200ms round trip
    const midpointCal = calibrateClock({
      serverTime,
      requestStartedAtMs,
      responseReceivedAtMs,
    });
    // Estimated local at response = localNow + 100
    expect(midpointCal.offsetMs).toBe(
      Date.parse(serverTime) - (localNow + 100),
    );
  });

  // Requirement 14: background/tab elapsed time is naturally accounted for when Date.now() advances
  it('14. background/tab elapsed time is naturally accounted for when Date.now() advances', () => {
    const deadline = '2026-09-21T11:00:00.000Z';
    const cal = { offsetMs: 0, lastCalibratedAtMs: 0 };

    // Initial check at 10:00
    const t0 = Date.parse('2026-09-21T10:00:00.000Z');
    expect(calculateRemainingMs(deadline, getCalibratedNow(cal, t0))).toBe(
      3600_000,
    );

    // Tab was hidden/throttled for 25 minutes; next tick evaluates at 10:25
    const tJump = Date.parse('2026-09-21T10:25:00.000Z');
    expect(calculateRemainingMs(deadline, getCalibratedNow(cal, tJump))).toBe(
      2100_000,
    );
  });

  // Requirement 15: remainingMs clamps at zero
  it('15. remainingMs clamps at zero', () => {
    const deadline = '2026-09-21T11:00:00.000Z';

    const pastMs = Date.parse('2026-09-21T11:05:00.000Z');
    expect(calculateRemainingMs(deadline, pastMs)).toBe(0);
    expect(isProjectedDeadlineReached(deadline, pastMs)).toBe(true);

    const farPastMs = Date.parse('2026-09-21T15:00:00.000Z');
    expect(calculateRemainingMs(deadline, farPastMs)).toBe(0);
  });

  // Requirement 16: legacy durationSeconds=null does not fabricate a countdown/deadline
  it('16. legacy durationSeconds=null does not fabricate a countdown/deadline', () => {
    const untimedSession: ServerAuthoritativeCandidateSession = {
      ...baseSession,
      durationSeconds: null,
      deadline: null,
    };

    const proj = projectCandidateExperience({
      serverSession: untimedSession,
      calibratedNowMs: Date.parse('2026-09-21T15:00:00.000Z'),
    });

    expect(proj.deadline).toBeNull();
    expect(proj.remainingMs).toBeNull();
    expect(proj.isDeadlineReached).toBe(false);
    expect(proj.uxState).toBe('ACTIVE_WORKSPACE');
    expect(proj.capabilities.canEdit).toBe(true);
  });

  // Requirement 17: client projected deadline does not override server mutation authority
  it('17. client projected deadline does not override server mutation authority', () => {
    // Client observes deadline reached
    const pastDeadlineMs = Date.parse('2026-09-21T11:00:01.000Z');
    const proj = projectCandidateExperience({
      serverSession: baseSession,
      calibratedNowMs: pastDeadlineMs,
    });

    // UX reflects factual state
    expect(proj.uxState).toBe('TIME_LIMIT_REACHED');
    expect(proj.capabilities.canEdit).toBe(false);

    // But serverStatus is still faithfully the server's ACTIVE status
    // Server remains sole authority to accept/deny mutations and finalize
    expect(proj.serverStatus).toBe('ACTIVE');
  });

  // Requirement 18: unknown/impossible server projection fails safely and visibly rather than inventing a state
  it('18. unknown/impossible server projection fails safely and visibly rather than inventing a state', () => {
    // Null session
    const nullProj = projectCandidateExperience({
      serverSession: null,
      calibratedNowMs: Date.now(),
    });
    expect(nullProj.uxState).toBe('UNKNOWN_OR_UNSUPPORTED');
    expect(nullProj.error).toContain('missing or invalid');
    expect(nullProj.capabilities.canEdit).toBe(false);

    // Corrupt / unsupported status
    const corruptProj = projectCandidateExperience({
      serverSession: {
        ...baseSession,
        status:
          'CORRUPTED_STATUS' as unknown as ServerAuthoritativeCandidateSession['status'],
      },
      calibratedNowMs: Date.now(),
    });
    expect(corruptProj.uxState).toBe('UNKNOWN_OR_UNSUPPORTED');
    expect(corruptProj.error).toContain('CORRUPTED_STATUS');
    expect(corruptProj.capabilities.canEdit).toBe(false);
  });
});
