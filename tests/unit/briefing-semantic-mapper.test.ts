import { describe, expect, it } from 'vitest';
import { buildEvaluatorBriefing } from '../../apps/web/src/evaluator/build-evaluator-briefing';
import {
  readScenarioSemanticSnapshot,
  scenario001SemanticSnapshot,
} from '../../apps/web/src/scenarios/scenario-semantic-snapshot';
import {
  commandEvents,
  noReconstruction,
  testEvidence,
} from '../support/briefing-test-evidence';

const read = 'redis-cli GET "stock:wh-east-01:PROD-1001"';
const observe = (command: string, result = {}) =>
  buildEvaluatorBriefing(
    testEvidence(commandEvents(command, result)),
    noReconstruction,
  ).observedActivity[0];

describe('constrained semantic command mapping', () => {
  it('binds the exact storefront read target and retains command evidence', () => {
    expect(observe(read)).toMatchObject({
      kind: 'recorded_read_command',
      text: 'A recorded command read the storefront cache.',
      evidenceRefs: ['command:briefing-test:cmd-test'],
      mapping: { ruleId: 'storefront-stock-read', subjectId: 'cache' },
    });
  });
  it('binds a conservative database SELECT and never a write query', () => {
    const binding = scenario001SemanticSnapshot.commandBindings[1];
    const command = binding.argv
      .map((value) => (value.includes(' ') ? `"${value}"` : value))
      .join(' ');
    expect(observe(command).kind).toBe('recorded_read_command');
    expect(observe(command.replace('SELECT quantity', 'DELETE')).kind).toBe(
      'recorded_command',
    );
  });
  it.each([
    'redis-cli DEL "stock:wh-east-01:PROD-1001"',
    'redis-cli flushall',
    'redis-cli GET "stock:wh-east-01:PROD-9999"',
    'env redis-cli GET stock:wh-east-01:PROD-1001',
    "sh -c 'redis-cli GET stock:wh-east-01:PROD-1001'",
    'redis-cli GET stock:wh-east-01:PROD-1001; echo passed',
    'redis-cli GET "$(echo stock:wh-east-01:PROD-1001)"',
    'alias-read',
    'python3 inspect.py',
    'redis-cli GET stock:wh-east-01:PROD-1001\necho passed',
  ])(
    'keeps mutation, unknown target or unsupported syntax generic: %s',
    (command) => {
      expect(observe(command).kind).toBe('recorded_command');
    },
  );
  it.each([
    { exitCode: 1 },
    { timedOut: true },
    { stdoutTruncated: true },
    { stderrTruncated: true },
    { stdoutPreview: '' },
    {
      stdoutPreview:
        'WRONGTYPE Operation against a key holding the wrong kind of value',
    },
  ])('keeps unsuccessful or incomplete reads generic: %j', (result) =>
    expect(observe(read, result).kind).toBe('recorded_command'),
  );
  it('falls back when two valid bindings match without treating absence as candidate weakness', () => {
    const evidence = testEvidence(commandEvents(read));
    const snapshot = structuredClone(scenario001SemanticSnapshot);
    snapshot.commandBindings.push({
      ...snapshot.commandBindings[0],
      id: 'duplicate-observation',
    });
    evidence.scenario = { ...evidence.scenario, semanticSnapshot: snapshot };
    const briefing = buildEvaluatorBriefing(evidence, noReconstruction);
    expect(briefing.observedActivity[0].kind).toBe('recorded_command');
    expect(
      briefing.evidenceLimitations.some(
        (entry) => entry.kind === 'unsupported_semantic_mapping',
      ),
    ).toBe(true);
  });
  it('does not recognize execution without its recorded start', () => {
    expect(
      buildEvaluatorBriefing(
        testEvidence(commandEvents(read).slice(1)),
        noReconstruction,
      ).observedActivity[0].kind,
    ).toBe('recorded_command');
  });
  it('rejects authored mutations masquerading as reads and forbidden semantic fields', () => {
    const snapshot = structuredClone(scenario001SemanticSnapshot);
    snapshot.commandBindings[0].argv[1] = 'del';
    expect(readScenarioSemanticSnapshot(snapshot).status).toBe('unsupported');
    expect(
      readScenarioSemanticSnapshot({
        ...scenario001SemanticSnapshot,
        scores: [10],
        requiredFiles: ['inventory/cache.py'],
      }).status,
    ).toBe('unsupported');
  });
});
