import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import type { SessionEvent } from '../../apps/web/src/events/session-event';
import { DeterministicEvidenceReconstructionGenerator } from '../../apps/web/src/reconstruction/deterministic-evidence-reconstruction-generator';
import { EvidenceReconstructionService } from '../../apps/web/src/reconstruction/evidence-reconstruction-service';
import { SqliteEvidenceReconstructionStore } from '../../apps/web/src/reconstruction/sqlite-evidence-reconstruction-store';

const sessionId = 'long-history';

const historyBuilder = () => {
  const events: SessionEvent[] = [];
  let sequence = 0;
  const timestamp = () =>
    new Date(Date.UTC(2026, 8, 15, 10, 0, sequence)).toISOString();
  const command = (id: string, exitCode: number, summary: string) => {
    events.push({
      id: `${id}-start`,
      sessionId,
      sequence: ++sequence,
      type: 'COMMAND_STARTED',
      timestamp: timestamp(),
      source: 'server',
      payload: { commandId: id, command: 'pytest', cwd: '/workspace' },
    });
    events.push({
      id: `${id}-finish`,
      sessionId,
      sequence: ++sequence,
      type: 'COMMAND_FINISHED',
      timestamp: timestamp(),
      source: 'server',
      payload: {
        commandId: id,
        exitCode,
        timedOut: false,
        durationMs: 50,
        stdoutPreview: summary,
        stdoutBytes: Buffer.byteLength(summary),
        stdoutTruncated: false,
        stderrPreview: '',
        stderrBytes: 0,
        stderrTruncated: false,
      },
    });
  };
  const change = (
    id: string,
    beforeTree: string,
    afterTree: string,
    origin: 'browser_save' | 'command_execution' | 'out_of_band',
    pathName = 'inventory/service.py',
  ) => {
    events.push({
      id,
      sessionId,
      sequence: ++sequence,
      type: 'WORKSPACE_CHANGED',
      timestamp: timestamp(),
      source: 'server',
      payload: {
        changeId: id,
        origin,
        beforeTree,
        afterTree,
        files: [
          {
            path: pathName,
            status: 'modified',
            additions: 1,
            deletions: 1,
            patchPreview: 'patch',
            patchPreviewBytes: 5,
            patchBytes: 5,
            patchTruncated: false,
          },
        ],
        totalAdditions: 1,
        totalDeletions: 1,
      },
    });
  };
  const gap = (id: string) => {
    events.push({
      id,
      sessionId,
      sequence: ++sequence,
      type: 'WORKSPACE_CAPTURE_FAILED',
      timestamp: timestamp(),
      source: 'server',
      payload: { phase: 'pre_command', errorMessage: 'capture unavailable' },
    });
  };
  return { events, command, change, gap };
};

describe('deterministic long-history acceptance', () => {
  let directory: string | undefined;

  afterEach(() => {
    if (directory) rmSync(directory, { recursive: true, force: true });
  });

  const reconstruct = async (events: readonly SessionEvent[], diff = '') => {
    directory = mkdtempSync(path.join(tmpdir(), 'delimit-long-history-'));
    const service = new EvidenceReconstructionService(
      new SqliteEvidenceReconstructionStore(
        path.join(directory, 'delimit.sqlite'),
      ),
      new DeterministicEvidenceReconstructionGenerator(),
      () => ({
        sessionId,
        scenario: { title: 'Scenario', brief: 'Brief', acceptanceCriteria: [] },
        activatedAt: '2026-09-15T10:00:00.000Z',
        submittedAt: '2026-09-15T11:00:00.000Z',
        diff,
        events,
      }),
    );
    return service.ensure(sessionId);
  };

  it('coalesces 15 consecutive saves and remains available and bounded', async () => {
    const history = historyBuilder();
    history.command('first', 1, '========== 3 failed in 0.1s ==========');
    for (let index = 0; index < 15; index += 1) {
      history.change(
        `save-${index}`,
        `tree-${index}`,
        `tree-${index + 1}`,
        'browser_save',
      );
    }
    history.command('last', 0, '========== 3 passed in 0.1s ==========');

    const result = await reconstruct(history.events);
    const aggregate = result.content?.statements.find((statement) =>
      statement.text.startsWith('15 recorded workspace changes'),
    );
    expect(result.status).toBe('AVAILABLE');
    expect(result.content?.statements.length).toBeLessThanOrEqual(12);
    expect(aggregate?.evidenceRefs).toHaveLength(15);
    expect(
      result.content?.statements.map((statement) => statement.text),
    ).toEqual(
      expect.arrayContaining(['3 tests failed.', 'Session submitted.']),
    );
  });

  it('preserves failures, reversion, out-of-band activity, and later work', async () => {
    const history = historyBuilder();
    history.command('first', 1, '========== 3 failed in 0.1s ==========');
    for (let index = 0; index < 8; index += 1) {
      history.change(
        `early-${index}`,
        `tree-${index}`,
        `tree-${index + 1}`,
        'browser_save',
      );
    }
    history.command('second', 1, '========== 2 failed in 0.1s ==========');
    history.change('reversion', 'tree-8', 'tree-0', 'browser_save');
    history.change('oob', 'tree-0', 'tree-oob', 'out_of_band', 'notes.txt');
    for (let index = 0; index < 5; index += 1) {
      history.change(
        `later-${index}`,
        index === 0 ? 'tree-oob' : `later-${index}`,
        `later-${index + 1}`,
        'browser_save',
      );
    }
    history.command('last', 0, '========== 3 passed in 0.1s ==========');

    const result = await reconstruct(history.events, 'diff --git a/a b/a');
    const prose = result.content?.statements.map((statement) => statement.text);
    expect(result.status).toBe('AVAILABLE');
    expect(prose).toContain(
      'The workspace returned to a previously recorded state.',
    );
    expect(prose).toContain('`notes.txt` changed between recorded actions.');
    expect(prose).toContain(
      '8 recorded workspace changes affected `inventory/service.py`.',
    );
    expect(prose).toContain(
      '5 recorded workspace changes affected `inventory/service.py`.',
    );
    expect(prose).toEqual(
      expect.arrayContaining([
        '3 tests failed.',
        '2 tests failed.',
        '3 tests passed.',
      ]),
    );
  });

  it('fails explicitly when distinct integrity boundaries cannot fit', async () => {
    const history = historyBuilder();
    for (let index = 0; index < 12; index += 1) history.gap(`gap-${index}`);

    const result = await reconstruct(history.events);
    expect(result).toMatchObject({
      status: 'FAILED',
      failureCode: 'COVERAGE_UNSATISFIABLE',
    });
    expect(result.content).toBeNull();
  });
});
