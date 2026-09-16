import { describe, expect, it } from 'vitest';

import {
  presentCandidateWorkStatement,
  unobservedWorkspaceReversionText,
  workspaceReversionText,
} from '../../apps/web/src/reconstruction/candidate-work-presentation';
import type { EvidenceCatalogEntry } from '../../apps/web/src/reconstruction/evidence-reference-catalog';
import type { ReconstructionStatement } from '../../apps/web/src/reconstruction/evidence-reconstruction';
import type { SessionEvent } from '../../apps/web/src/events/session-event';

const statement = (
  text: string,
  claimBasis: ReconstructionStatement['claimBasis'] = 'chronology',
): ReconstructionStatement => ({
  id: 'statement-1',
  text,
  claimBasis,
  evidenceRefs: ['evidence-1'],
  firstEvidenceOrder: 1,
});

const commandEntry = (
  command: string,
  output: string,
  truncated = false,
): EvidenceCatalogEntry => {
  const finishedEvent: SessionEvent = {
    id: 'finished-1',
    sessionId: 'session-1',
    sequence: 2,
    type: 'COMMAND_FINISHED',
    timestamp: '2026-09-15T10:00:01.000Z',
    source: 'sandbox',
    payload: {
      commandId: 'command-1',
      exitCode: output.includes('failed') ? 1 : 0,
      timedOut: false,
      durationMs: 10,
      stdoutPreview: output,
      stdoutBytes: Buffer.byteLength(output),
      stdoutTruncated: truncated,
      stderrPreview: '',
      stderrBytes: 0,
      stderrTruncated: false,
    },
  };
  return {
    evidenceRef: 'evidence-1',
    sessionId: 'session-1',
    role: 'chronology',
    kind: 'command_execution',
    chronologyOrder: 1,
    firstSequence: 1,
    lastSequence: 2,
    rawEventIds: ['started-1', 'finished-1'],
    item: {
      kind: 'COMMAND_EXECUTION',
      commandId: 'command-1',
      command,
      cwd: '/workspace',
      startedAt: '2026-09-15T10:00:00.000Z',
      finishedAt: '2026-09-15T10:00:01.000Z',
      durationMs: 10,
      exitCode: output.includes('failed') ? 1 : 0,
      timedOut: false,
      stdoutPreview: output,
      stderrPreview: '',
      rawStartedEventId: 'started-1',
      rawFinishedEventId: 'finished-1',
      sequence: 2,
      rawFinishedEvent: finishedEvent,
    },
  };
};

const entry = (
  kind: EvidenceCatalogEntry['kind'],
  origin: 'browser_save' | 'out_of_band' = 'browser_save',
  fileCount = 1,
): EvidenceCatalogEntry => ({
  evidenceRef: 'evidence-1',
  sessionId: 'session-1',
  role: kind === 'final_diff' ? 'final_state' : 'chronology',
  kind,
  chronologyOrder: kind === 'final_diff' ? null : 1,
  firstSequence: kind === 'final_diff' ? null : 1,
  lastSequence: kind === 'final_diff' ? null : 1,
  rawEventIds: [],
  item:
    kind === 'workspace_change'
      ? {
          kind: 'WORKSPACE_CHANGE',
          changeId: 'change-1',
          origin,
          timestamp: '2026-09-15T10:00:00.000Z',
          beforeTree: 'before',
          afterTree: 'after',
          files: Array.from({ length: fileCount }, (_, index) => ({
            path: `file-${index}.ts`,
            status: 'modified' as const,
            additions: 1,
            deletions: 0,
            patchPreview: '',
            patchPreviewBytes: 0,
            patchBytes: 0,
            patchTruncated: false,
          })),
          totalAdditions: fileCount,
          totalDeletions: 0,
          rawEventId: 'event-1',
          sequence: 1,
          rawEvent: {
            id: 'event-1',
            sessionId: 'session-1',
            sequence: 1,
            type: 'WORKSPACE_CHANGED',
            timestamp: '2026-09-15T10:00:00.000Z',
            source: 'server',
            payload: {
              changeId: 'change-1',
              origin,
              beforeTree: 'before',
              afterTree: 'after',
              files: [],
              totalAdditions: fileCount,
              totalDeletions: 0,
            },
          },
        }
      : null,
});

describe('Candidate Work presentation', () => {
  it.each([
    ['========== 3 failed in 0.1s ==========', '3 tests failed.'],
    ['========== 2 passed, 1 failed in 0.1s ==========', '2 passed, 1 failed.'],
    ['========== 3 passed in 0.1s ==========', '3 tests passed.'],
  ])('labels an authoritative pytest summary as a Test run', (output, text) => {
    expect(
      presentCandidateWorkStatement(statement(text), [
        commandEntry('pytest', output),
      ]).label,
    ).toBe('Test run');
  });

  it('does not label uncertain pytest output as a Test run', () => {
    expect(
      presentCandidateWorkStatement(statement('A recorded command exited.'), [
        commandEntry('pytest', '3 passed', true),
      ]).label,
    ).toBe('Command executed');
  });

  it('distinguishes code changes, reversions, unobserved changes, and gaps', () => {
    expect(
      presentCandidateWorkStatement(statement('Modified `file-0.ts`.'), [
        entry('workspace_change'),
      ]).label,
    ).toBe('Code change');
    expect(
      presentCandidateWorkStatement(statement('2 files changed.'), [
        entry('workspace_change', 'browser_save', 2),
      ]).label,
    ).toBe('Code changes');
    expect(
      presentCandidateWorkStatement(statement(workspaceReversionText), [
        entry('workspace_change'),
      ]).label,
    ).toBe('Workspace reversion');
    expect(
      presentCandidateWorkStatement(
        statement(unobservedWorkspaceReversionText),
        [entry('workspace_change', 'out_of_band')],
      ).label,
    ).toBe('Workspace reversion');
    expect(
      presentCandidateWorkStatement(statement('Changed between actions.'), [
        entry('workspace_change', 'out_of_band'),
      ]).label,
    ).toBe('Unobserved workspace change');
    expect(
      presentCandidateWorkStatement(statement('Evidence is incomplete.'), [
        entry('evidence_gap'),
      ]).label,
    ).toBe('Evidence gap');
  });

  it('keeps a long exact command in evidence while presenting it neutrally', () => {
    const exactCommand = `python3 -c '${'x'.repeat(300)}' >/dev/null 2>&1 &`;
    const evidence = commandEntry(exactCommand, 'ordinary output');
    const category = presentCandidateWorkStatement(
      statement('A recorded command exited with status 0.'),
      [evidence],
    );

    expect(category.label).toBe('Command executed');
    expect(category.label).not.toContain(exactCommand);
    expect(evidence.item?.kind).toBe('COMMAND_EXECUTION');
    if (evidence.item?.kind === 'COMMAND_EXECUTION') {
      expect(evidence.item.command).toBe(exactCommand);
    }
  });
});
