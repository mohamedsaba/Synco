import { describe, expect, it } from 'vitest';

import { buildChronologicalReconstruction } from '../../apps/web/src/evidence/chronological-reconstruction';
import type { SessionEvent } from '../../apps/web/src/events/session-event';
import { buildEvidencePacket } from '../../apps/web/src/reconstruction/evidence-packet';
import { buildEvidenceReferenceCatalog } from '../../apps/web/src/reconstruction/evidence-reference-catalog';
import { parseCommandOutputFact } from '../../apps/web/src/reconstruction/typed-evidence-fact';

describe('typed evidence facts', () => {
  it('parses structurally valid pytest terminal summaries', () => {
    expect(
      parseCommandOutputFact(
        'pytest -q',
        '================ 3 failed in 0.2s ================',
        '',
      ),
    ).toEqual({ kind: 'test_summary', passed: 0, failed: 3 });
    expect(
      parseCommandOutputFact(
        'pytest',
        '=========== 1 passed, 2 failed in 0.2s ===========',
        '',
      ),
    ).toEqual({ kind: 'test_summary', passed: 1, failed: 2 });
    expect(
      parseCommandOutputFact(
        'pytest',
        '================= 3 passed in 0.04s =================',
        '',
      ),
    ).toEqual({ kind: 'test_summary', passed: 3, failed: 0 });
  });

  it('does not mix application-log counts into pytest results', () => {
    expect(
      parseCommandOutputFact(
        'pytest',
        '[INFO] Handled 2 failed connection attempts.\n================= 3 passed in 0.04s =================',
        '',
      ),
    ).toEqual({ kind: 'test_summary', passed: 3, failed: 0 });
    expect(
      parseCommandOutputFact(
        'pytest',
        'worker passed 12 messages\n================= 2 failed in 0.04s =================',
        '',
      ),
    ).toEqual({ kind: 'test_summary', passed: 0, failed: 2 });
  });

  it('strips ANSI before recognizing one pytest summary line', () => {
    expect(
      parseCommandOutputFact(
        'pytest',
        '\u001b[32m================= 3 passed in 0.04s =================\u001b[0m',
        '',
      ),
    ).toEqual({ kind: 'test_summary', passed: 3, failed: 0 });
  });

  it('falls back when collection fails or output is incomplete', () => {
    expect(
      parseCommandOutputFact(
        'pytest',
        '================ ERRORS ================\nERROR collecting tests/test_app.py\n!!!!!!!! Interrupted: 1 error during collection !!!!!!!!',
        '',
      ),
    ).toBeNull();
    expect(
      parseCommandOutputFact(
        'pytest',
        'application output without a retained terminal summary\n'.repeat(200),
        '',
        false,
      ),
    ).toBeNull();
    expect(
      parseCommandOutputFact(
        'pytest',
        '========== 1 failed in 0.1s ==========\n========== 3 passed in 0.1s ==========',
        '',
      ),
    ).toBeNull();
  });

  it('keeps non-pytest output interpretation literal and narrow', () => {
    expect(parseCommandOutputFact('psql query', '150\n', '')).toEqual({
      kind: 'numeric_stdout',
      value: '150',
    });
    expect(parseCommandOutputFact('psql query', '150', '', false)).toBeNull();
    expect(
      parseCommandOutputFact(
        'echo text',
        'stale because the issue was solved',
        '',
      ),
    ).toBeNull();
  });

  it('derives the closed fact set from chronological evidence', () => {
    const sessionId = 'typed-session';
    const events: SessionEvent[] = [
      {
        id: 'start',
        sessionId,
        sequence: 1,
        type: 'COMMAND_STARTED',
        timestamp: '2026-09-15T10:01:00.000Z',
        source: 'server',
        payload: {
          commandId: 'command-1',
          command: 'pytest',
          cwd: '/workspace',
        },
      },
      {
        id: 'finish',
        sessionId,
        sequence: 2,
        type: 'COMMAND_FINISHED',
        timestamp: '2026-09-15T10:01:01.000Z',
        source: 'server',
        payload: {
          commandId: 'command-1',
          exitCode: 1,
          timedOut: false,
          durationMs: 1000,
          stdoutPreview: '================ 3 failed in 0.2s ================',
          stdoutBytes: 49,
          stdoutTruncated: false,
          stderrPreview: '',
          stderrBytes: 0,
          stderrTruncated: false,
        },
      },
      {
        id: 'change',
        sessionId,
        sequence: 3,
        type: 'WORKSPACE_CHANGED',
        timestamp: '2026-09-15T10:02:00.000Z',
        source: 'server',
        payload: {
          changeId: 'change-1',
          origin: 'browser_save',
          beforeTree: 'tree-a',
          afterTree: 'tree-b',
          files: [
            {
              path: 'service.py',
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
      },
      {
        id: 'gap',
        sessionId,
        sequence: 4,
        type: 'WORKSPACE_CAPTURE_FAILED',
        timestamp: '2026-09-15T10:03:00.000Z',
        source: 'server',
        payload: {
          phase: 'post_command',
          beforeTree: 'tree-b',
          errorMessage: 'not model visible',
        },
      },
    ];
    const source = {
      scenario: { title: 'Scenario', brief: 'Brief', acceptanceCriteria: [] },
      activatedAt: '2026-09-15T10:00:00.000Z',
      submittedAt: '2026-09-15T10:04:00.000Z',
      diff: 'diff --git a/service.py b/service.py',
    };
    const chronology = buildChronologicalReconstruction(
      {
        activatedAt: source.activatedAt,
        submittedAt: source.submittedAt,
        submittedDiff: source.diff,
      },
      events,
    );
    const packet = buildEvidencePacket(
      source,
      buildEvidenceReferenceCatalog(sessionId, chronology),
    );

    expect(packet.evidenceItems.map((item) => item.fact.kind)).toEqual([
      'activation',
      'command_execution',
      'workspace_change',
      'evidence_gap',
      'submission',
    ]);
    expect(packet.evidenceItems[1].fact).toMatchObject({
      kind: 'command_execution',
      command: 'pytest',
      exitCode: 1,
      output: { kind: 'test_summary', passed: 0, failed: 3 },
    });
    expect(packet.evidenceItems[2].fact).toMatchObject({
      kind: 'workspace_change',
      files: [{ path: 'service.py', status: 'modified' }],
    });
    expect(packet.evidenceItems[3].fact).toEqual({
      kind: 'evidence_gap',
      phase: 'post_command',
    });
  });
});
