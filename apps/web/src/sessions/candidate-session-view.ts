import type { AssessmentSession } from './session';
import { deriveSessionDeadline } from './session-timing';

export type CandidateAiCapability = Readonly<{
  enabled: boolean;
}>;

export type CandidateScenarioView = Readonly<{
  id: string;
  title: string;
  version: string;
  durationSeconds?: number;
  type?: 'single_file' | 'multi_file';
  brief?: string;
  prompt?: string;
  acceptanceCriteria?: readonly string[];
  filePath?: string;
  originalContent?: string;
  imageName?: string;
}>;

export type CandidateSessionView = Readonly<{
  id: string;
  scenario: CandidateScenarioView;
  status: AssessmentSession['status'];
  workingContent: string;
  createdAt: string;
  activatedAt: string | null;
  submittedAt: string | null;
  durationSeconds: number | null;
  deadline: string | null;
  serverTime: string | null;
  closureReason: AssessmentSession['closureReason'];
  scenarioType: 'single_file' | 'multi_file';
  aiCapability: CandidateAiCapability | null;
}>;

export const toCandidateSessionView = (
  session: AssessmentSession,
  serverTime?: string | null,
): CandidateSessionView => {
  const isPreActive = session.status === 'CREATED';

  const scenario: CandidateScenarioView = isPreActive
    ? {
        id: session.scenario.id,
        title: session.scenario.title,
        version: session.scenario.version,
        durationSeconds: session.scenario.durationSeconds,
        type: session.scenario.type ?? session.scenarioType ?? 'single_file',
      }
    : session.scenario;

  return {
    id: session.id,
    scenario,
    status: session.status,
    workingContent: isPreActive ? '' : session.workingContent,
    createdAt: session.createdAt,
    activatedAt: session.activatedAt,
    submittedAt: session.submittedAt,
    durationSeconds: session.durationSeconds,
    deadline: deriveSessionDeadline(session),
    serverTime: serverTime ?? null,
    closureReason: session.closureReason,
    scenarioType:
      session.scenarioType ?? session.scenario.type ?? 'single_file',
    aiCapability: session.aiCapabilitySnapshot
      ? ({
          enabled: Boolean(session.aiCapabilitySnapshot.enabled),
        } as const satisfies CandidateAiCapability)
      : null,
  };
};
