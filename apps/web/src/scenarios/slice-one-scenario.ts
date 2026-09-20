import type { ScenarioEvaluationContextSnapshot } from './scenario-evaluation-context';

export type ScenarioSnapshot = Readonly<{
  id: string;
  version: string;
  title: string;
  brief: string;
  acceptanceCriteria: readonly string[];
  filePath: string;
  originalContent: string;
  durationSeconds?: number;
  type?: 'single_file' | 'multi_file';
  imageName?: string;
  evaluationContext?: ScenarioEvaluationContextSnapshot;
  // Unknown persisted versions are retained for explicit generic fallback.
  semanticSnapshot?: unknown;
}>;

export const sliceOneScenario: ScenarioSnapshot = {
  id: 'slice-1-greeting-format',
  version: '1.0.0',
  // Development fixture duration: 15 minutes (900 seconds). Not a calibrated hiring-assessment recommendation.
  durationSeconds: 900,
  title: 'Trim customer names in greetings',
  brief:
    'Customer names copied from an import can contain surrounding whitespace. The greeting formatter currently preserves it, producing visibly uneven messages. Update the formatter so greetings use the customer name without surrounding whitespace.',
  acceptanceCriteria: [
    'Remove whitespace before and after the customer name.',
    'Preserve characters and whitespace inside the customer name.',
    'Keep the existing “Hello …” greeting format.',
  ],
  filePath: 'src/format-greeting.ts',
  originalContent: [
    'export const formatGreeting = (name: string) => {',
    '  return `Hello ${name}`;',
    '};',
    '',
  ].join('\n'),
  evaluationContext: {
    schemaVersion: 1,
    version: '1.0.0',
    purpose:
      'Examine how recorded engineering activity relates to a small, bounded formatting change and its verification.',
    evidenceAreas: [
      {
        id: 'formatting-change',
        title: 'Submitted formatting change',
        description:
          'Recorded changes and submitted-state evidence concerning the greeting formatter.',
        selectors: [
          {
            kind: 'workspace_path_prefix',
            prefixes: ['src/format-greeting.ts'],
          },
          {
            kind: 'submitted_path_prefix',
            prefixes: ['src/format-greeting.ts'],
          },
        ],
      },
      {
        id: 'recorded-verification',
        title: 'Recorded verification',
        description:
          'Authoritative test summaries recorded in the assessment environment.',
        selectors: [{ kind: 'verification_result' }],
      },
    ],
    systemInvariants: [
      'The greeting format remains separate from evaluator judgment.',
    ],
    verificationTargets: [
      'Recorded verification may help an evaluator inspect the submitted behavior.',
    ],
    interpretationWarnings: [
      'Related evidence shows only what Delimit recorded in the captured assessment environment.',
      'An activity that was not observed is not evidence that the candidate lacks the underlying capability.',
    ],
    reviewPolicy: [
      'Final automated verification alone is not a hiring decision for this assessment. Engineering review is required before technical rejection.',
    ],
  },
};
