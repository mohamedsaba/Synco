import type { AssessmentSession } from './session';
import { deriveSessionDeadline } from './session-timing';

export type CandidateAiCapability = Readonly<{
  enabled: boolean;
}>;

export const toCandidateSessionView = (
  session: AssessmentSession,
  serverTime?: string | null,
) => ({
  id: session.id,
  scenario: session.scenario,
  status: session.status,
  workingContent: session.workingContent,
  createdAt: session.createdAt,
  activatedAt: session.activatedAt,
  submittedAt: session.submittedAt,
  durationSeconds: session.durationSeconds,
  deadline: deriveSessionDeadline(session),
  serverTime: serverTime ?? null,
  closureReason: session.closureReason,
  scenarioType: session.scenarioType ?? session.scenario.type ?? 'single_file',
  aiCapability: session.aiCapabilitySnapshot
    ? ({
        enabled: Boolean(session.aiCapabilitySnapshot.enabled),
      } as const satisfies CandidateAiCapability)
    : null,
});
