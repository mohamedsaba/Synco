import { describe, expect, it } from 'vitest';

import { sliceOneScenario } from '../../apps/web/src/scenarios/slice-one-scenario';
import {
  activateSession,
  type AssessmentSession,
  editSession,
  SessionError,
  submitSession,
} from '../../apps/web/src/sessions/session';

const createdSession: AssessmentSession = {
  id: 'session-1',
  candidateTokenHash: 'hash',
  scenario: sliceOneScenario,
  status: 'CREATED',
  workingContent: sliceOneScenario.originalContent,
  submittedContent: null,
  createdAt: '2026-09-14T12:00:00.000Z',
  activatedAt: null,
  submittedAt: null,
};

describe('session lifecycle', () => {
  it('moves CREATED to ACTIVE and allows edits only while active', () => {
    expect(() => editSession(createdSession, 'change')).toThrowError(
      new SessionError(
        'SESSION_NOT_ACTIVE',
        'Editing is allowed only while the session is active.',
      ),
    );

    const active = activateSession(createdSession, '2026-09-14T12:01:00.000Z');
    const edited = editSession(active, 'candidate change\n');

    expect(edited.status).toBe('ACTIVE');
    expect(edited.workingContent).toBe('candidate change\n');
  });

  it('freezes working content at submission and makes resubmission idempotent', () => {
    const active = activateSession(createdSession, '2026-09-14T12:01:00.000Z');
    const edited = editSession(active, 'candidate change\n');
    const submitted = submitSession(edited, '2026-09-14T12:02:00.000Z');
    const resubmitted = submitSession(submitted, '2026-09-14T13:00:00.000Z');

    expect(submitted).toMatchObject({
      status: 'SUBMITTED',
      submittedContent: 'candidate change\n',
      submittedAt: '2026-09-14T12:02:00.000Z',
    });
    expect(resubmitted).toEqual(submitted);
    expect(() => editSession(submitted, 'later mutation')).toThrowError(
      SessionError,
    );
  });
});
