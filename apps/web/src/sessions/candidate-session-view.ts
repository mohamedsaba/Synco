import type { AssessmentSession } from './session';

export const toCandidateSessionView = (session: AssessmentSession) => ({
  id: session.id,
  scenario: session.scenario,
  status: session.status,
  workingContent: session.workingContent,
  createdAt: session.createdAt,
  activatedAt: session.activatedAt,
  submittedAt: session.submittedAt,
  scenarioType: session.scenarioType ?? session.scenario.type ?? 'single_file',
});
