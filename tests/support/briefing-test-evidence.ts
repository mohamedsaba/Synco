import type {
  SessionEvent,
  CommandFinishedPayload,
} from '../../apps/web/src/events/session-event';
import type {
  BriefingEvidenceInput as EvaluatorReviewEvidence,
  BriefingReconstructionInput as ReconstructionViewInput,
} from '../../apps/web/src/evaluator/evaluator-briefing';
import { scenario001 } from '../../apps/web/src/scenarios/scenario-001';

export const noReconstruction: ReconstructionViewInput = {
  status: 'NOT_STARTED',
  record: null,
  legacyArtifacts: [],
};
export const commandEvents = (
  command: string,
  result: Partial<CommandFinishedPayload> = {},
): SessionEvent[] => [
  {
    id: 'start',
    sessionId: 'briefing-test',
    sequence: 1,
    type: 'COMMAND_STARTED',
    timestamp: '2026-09-17T00:01:00Z',
    source: 'server',
    payload: { commandId: 'cmd-test', command, cwd: '/workspace' },
  },
  {
    id: 'finish',
    sessionId: 'briefing-test',
    sequence: 2,
    type: 'COMMAND_FINISHED',
    timestamp: '2026-09-17T00:01:01Z',
    source: 'server',
    payload: {
      commandId: 'cmd-test',
      exitCode: 0,
      timedOut: false,
      durationMs: 1000,
      stdoutPreview: '0\n',
      stdoutBytes: 2,
      stdoutTruncated: false,
      stderrPreview: '',
      stderrBytes: 0,
      stderrTruncated: false,
      ...result,
    },
  },
];
export const testEvidence = (
  events: readonly SessionEvent[] = commandEvents('pytest', {
    stdoutPreview: '===== 3 passed in 0.1s =====',
  }),
): EvaluatorReviewEvidence => ({
  sessionId: 'briefing-test',
  activatedAt: '2026-09-17T00:00:00Z',
  submittedAt: '2026-09-17T00:02:00Z',
  events,
  diff: '',
  scenario: structuredClone(scenario001),
});
