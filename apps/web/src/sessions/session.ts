import type { ScenarioSnapshot } from '../scenarios/slice-one-scenario';

export type SessionStatus = 'CREATED' | 'ACTIVE' | 'SUBMITTED';

export type AssessmentSession = Readonly<{
  id: string;
  candidateTokenHash: string;
  scenario: ScenarioSnapshot;
  status: SessionStatus;
  workingContent: string;
  submittedContent: string | null;
  createdAt: string;
  activatedAt: string | null;
  submittedAt: string | null;
}>;

export type SubmittedSession = AssessmentSession &
  Readonly<{
    status: 'SUBMITTED';
    submittedContent: string;
    submittedAt: string;
  }>;

export class SessionError extends Error {
  constructor(
    readonly code:
      | 'SESSION_NOT_FOUND'
      | 'SESSION_NOT_ACTIVE'
      | 'EVIDENCE_NOT_READY'
      | 'CONTENT_TOO_LARGE',
    message: string,
  ) {
    super(message);
    this.name = 'SessionError';
  }
}

export const activateSession = (
  session: AssessmentSession,
  activatedAt: string,
): AssessmentSession => {
  if (session.status === 'ACTIVE') {
    return session;
  }

  if (session.status !== 'CREATED') {
    throw new SessionError(
      'SESSION_NOT_ACTIVE',
      'A submitted session cannot be activated.',
    );
  }

  return { ...session, status: 'ACTIVE', activatedAt };
};

export const editSession = (
  session: AssessmentSession,
  workingContent: string,
): AssessmentSession => {
  if (session.status !== 'ACTIVE') {
    throw new SessionError(
      'SESSION_NOT_ACTIVE',
      'Editing is allowed only while the session is active.',
    );
  }

  return { ...session, workingContent };
};

export const submitSession = (
  session: AssessmentSession,
  submittedAt: string,
): SubmittedSession => {
  if (session.status === 'SUBMITTED') {
    return session as SubmittedSession;
  }

  if (session.status !== 'ACTIVE') {
    throw new SessionError(
      'SESSION_NOT_ACTIVE',
      'The session must be active before it can be submitted.',
    );
  }

  return {
    ...session,
    status: 'SUBMITTED',
    submittedContent: session.workingContent,
    submittedAt,
  };
};

export const requireSubmittedSession = (
  session: AssessmentSession,
): SubmittedSession => {
  if (
    session.status !== 'SUBMITTED' ||
    session.submittedContent === null ||
    session.submittedAt === null
  ) {
    throw new SessionError(
      'EVIDENCE_NOT_READY',
      'Evidence is available only after submission.',
    );
  }

  return session as SubmittedSession;
};
