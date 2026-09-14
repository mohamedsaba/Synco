import { describe, expect, it } from 'vitest';

import { buildChronologicalReconstruction } from '../../apps/web/src/evidence/chronological-reconstruction';
import type { SessionEvent } from '../../apps/web/src/events/session-event';

describe('buildChronologicalReconstruction', () => {
  it('projects empty session into boundary markers', () => {
    const session = {
      activatedAt: '2026-09-14T10:00:00.000Z',
      submittedAt: '2026-09-14T10:05:00.000Z',
      submittedDiff: '--- a/file\n+++ b/file\n',
    };

    const items = buildChronologicalReconstruction(session, []);
    expect(items).toHaveLength(2);
    expect(items[0].kind).toBe('SESSION_ACTIVATED');
    expect(items[1].kind).toBe('SESSION_SUBMITTED');
  });

  it('folds COMMAND_STARTED and COMMAND_FINISHED and interleave workspace mutations deterministically', () => {
    const session = {
      activatedAt: '2026-09-14T10:00:00.000Z',
      submittedAt: '2026-09-14T10:10:00.000Z',
      submittedDiff: '--- diff ---',
    };

    const events: SessionEvent[] = [
      {
        id: 'evt_1',
        sessionId: 'sess_1',
        sequence: 1,
        type: 'COMMAND_STARTED',
        timestamp: '2026-09-14T10:01:00.000Z',
        source: 'server',
        payload: {
          commandId: 'cmd_1',
          command: 'pytest',
          cwd: '/workspace',
        },
      },
      {
        id: 'evt_2',
        sessionId: 'sess_1',
        sequence: 2,
        type: 'COMMAND_FINISHED',
        timestamp: '2026-09-14T10:01:02.000Z',
        source: 'server',
        payload: {
          commandId: 'cmd_1',
          exitCode: 1,
          timedOut: false,
          durationMs: 2000,
          stdoutPreview: 'FAILED 1 test',
          stdoutBytes: 13,
          stdoutTruncated: false,
          stderrPreview: '',
          stderrBytes: 0,
          stderrTruncated: false,
        },
      },
      {
        id: 'evt_3',
        sessionId: 'sess_1',
        sequence: 3,
        type: 'WORKSPACE_CHANGED',
        timestamp: '2026-09-14T10:02:00.000Z',
        source: 'server',
        payload: {
          changeId: 'chg_1',
          origin: 'browser_save',
          beforeTree: 'aaaa111122223333444455556666777788889999',
          afterTree: 'bbbb111122223333444455556666777788889999',
          files: [
            {
              path: 'inventory/service.py',
              status: 'modified',
              additions: 3,
              deletions: 1,
              patchPreview: 'diff --git a/inventory/service.py...',
              patchPreviewBytes: 35,
              patchBytes: 35,
              patchTruncated: false,
            },
          ],
          totalAdditions: 3,
          totalDeletions: 1,
        },
      },
      {
        id: 'evt_4',
        sessionId: 'sess_1',
        sequence: 4,
        type: 'WORKSPACE_CAPTURE_FAILED',
        timestamp: '2026-09-14T10:03:00.000Z',
        source: 'server',
        payload: {
          commandId: 'cmd_2',
          phase: 'post_command',
          beforeTree: 'bbbb111122223333444455556666777788889999',
          errorMessage: 'Disk error during post-capture',
        },
      },
    ];

    const items = buildChronologicalReconstruction(session, events);

    expect(items.map((i) => i.kind)).toEqual([
      'SESSION_ACTIVATED',
      'COMMAND_EXECUTION',
      'WORKSPACE_CHANGE',
      'WORKSPACE_GAP',
      'SESSION_SUBMITTED',
    ]);

    const cmd = items[1];
    if (cmd.kind !== 'COMMAND_EXECUTION')
      throw new Error('Expected COMMAND_EXECUTION');
    expect(cmd.command).toBe('pytest');
    expect(cmd.exitCode).toBe(1);
    expect(cmd.durationMs).toBe(2000);
    expect(cmd.rawStartedEventId).toBe('evt_1');
    expect(cmd.rawFinishedEventId).toBe('evt_2');

    const change = items[2];
    if (change.kind !== 'WORKSPACE_CHANGE')
      throw new Error('Expected WORKSPACE_CHANGE');
    expect(change.origin).toBe('browser_save');
    expect(change.files[0]?.path).toBe('inventory/service.py');
    expect(change.totalAdditions).toBe(3);

    const gap = items[3];
    if (gap.kind !== 'WORKSPACE_GAP') throw new Error('Expected WORKSPACE_GAP');
    expect(gap.phase).toBe('post_command');
    expect(gap.errorMessage).toBe('Disk error during post-capture');
  });
});
