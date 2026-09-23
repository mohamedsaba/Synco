import {
  defaultAiCapabilitySnapshot,
  type AiCapabilitySnapshot,
} from '../ai/ai-interaction';
import { scenario001SemanticSnapshot } from './scenario-semantic-snapshot';
import type { ScenarioSnapshot } from './slice-one-scenario';

export const scenario001AiCapability: AiCapabilitySnapshot = {
  ...defaultAiCapabilitySnapshot,
};

export const scenario001: ScenarioSnapshot = {
  id: 'scenario-001-cache-staleness',
  version: '1.0.0',
  // Authoritative hard assessment limit: 60 minutes (3600 seconds).
  durationSeconds: 3600,
  title: 'Stale storefront inventory after warehouse restock',
  brief: [
    'Warehouse staff recently restocked units of product PROD-1001 into warehouse WH-EAST-01. The database reflects the restocked quantity, but customers on the storefront are still seeing the item as out of stock.',
    '',
    'Expected Behavior:',
    'After stock is updated in the warehouse, subsequent reads from the storefront must reflect the current inventory without serving stale cached counts.',
    '',
    'Environment & Tools:',
    '- The inventory service is in /workspace (Flask app backed by PostgreSQL and Redis).',
    '- Tests can be run from the command console: pytest',
    '- PostgreSQL CLI: psql -h 127.0.0.1 -U delimit inventory',
    '- Redis CLI: redis-cli',
    '',
    'Your Task:',
    '1. Investigate the cause of the discrepancy.',
    '2. Implement an appropriate fix in the codebase.',
    '3. Verify that your change corrects the issue and does not introduce regressions.',
    '4. Submit your work when finished.',
  ].join('\n'),
  acceptanceCriteria: [
    'Storefront inventory reflects completed restocks immediately.',
    'Equivalent valid warehouse identifiers return consistent inventory.',
    'Existing inventory reads continue to work.',
    'Supplied verification suite passes cleanly.',
  ],
  filePath: 'inventory/service.py',
  originalContent: '',
  type: 'multi_file',
  imageName: 'delimit-scenario-001:latest',
  semanticSnapshot: scenario001SemanticSnapshot,
  evaluationContext: {
    schemaVersion: 1,
    version: '1.0.0',
    purpose:
      'Examine recorded work around a stale storefront inventory incident while keeping investigation path, task outcome, and evaluator judgment separate.',
    evidenceAreas: [
      {
        id: 'inventory-behavior',
        title: 'Inventory behavior and submitted changes',
        description:
          'Recorded workspace and submitted-state evidence related to the inventory service and its behavior.',
        selectors: [
          {
            kind: 'workspace_path_prefix',
            prefixes: ['inventory/', 'tests/'],
          },
          {
            kind: 'submitted_path_prefix',
            prefixes: ['inventory/', 'tests/'],
          },
        ],
      },
      {
        id: 'recorded-verification',
        title: 'Recorded verification progression',
        description:
          'Authoritative test summaries recorded at different points in the assessment.',
        selectors: [{ kind: 'verification_result' }],
      },
    ],
    systemInvariants: [
      'PostgreSQL is the source of truth for inventory quantity.',
      'Storefront reads may use cached values, so submitted changes should be reviewed in the context of cache behavior.',
    ],
    verificationTargets: [
      'Whether recorded verification addresses recent inventory updates.',
      'Whether recorded verification includes equivalent valid warehouse identifiers where evidence is available.',
      'Whether existing inventory reads remain represented in the recorded verification evidence.',
    ],
    interpretationWarnings: [
      'Related evidence identifies recorded activity associated with a scenario area; it does not establish task success or candidate competence.',
      'A failing test or command can be valid investigative activity and is not a candidate verdict.',
      'Not observed means Delimit recorded no evidence of that activity in the captured assessment environment. It does not mean the candidate lacks the underlying capability.',
    ],
    reviewPolicy: [
      'Final automated verification alone is not a hiring decision for this assessment. Engineering review is required before technical rejection.',
    ],
  },
};
