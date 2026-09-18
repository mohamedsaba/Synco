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

  it('places sandbox cleanup failure after the durable submission boundary', () => {
    const items = buildChronologicalReconstruction(
      {
        activatedAt: '2026-09-14T10:00:00.000Z',
        submittedAt: '2026-09-14T10:05:00.000Z',
        submittedDiff: '',
      },
      [
        {
          id: 'evt_cleanup',
          sessionId: 'sess_1',
          sequence: 1,
          type: 'SANDBOX_CLEANUP_FAILED',
          timestamp: '2026-09-14T10:05:01.000Z',
          source: 'server',
          payload: {
            phase: 'submission',
            errorMessage: 'Docker daemon unavailable',
          },
        },
      ],
    );

    expect(items.map((item) => item.kind)).toEqual([
      'SESSION_ACTIVATED',
      'SESSION_SUBMITTED',
      'SANDBOX_CLEANUP_FAILURE',
    ]);
  });

  describe('Slice 6D — Candidate AI Chronological Reconstruction', () => {
    const baseSession = {
      activatedAt: '2026-09-18T10:00:00.000Z',
      submittedAt: '2026-09-18T10:10:00.000Z',
      submittedDiff: '--- diff ---',
    };

    it('Matrix A: preserves normal start and completion as distinct chronological milestones', () => {
      const events: SessionEvent[] = [
        {
          id: 'evt_ai_start',
          sessionId: 'sess_ai',
          sequence: 10,
          type: 'AI_REQUEST_STARTED',
          timestamp: '2026-09-18T10:01:00.000Z',
          source: 'server',
          payload: {
            interactionId: 'inter_1',
            clientRequestId: 'client_req_1',
            configuredProviderId: 'mock-ai',
            configuredModelId: 'mock-model',
            candidateInputExcerpt: 'How do I resolve the cache key?',
            candidateInputBytes: 32,
            candidateContext: [{ filePath: 'inventory/service.py' }],
          },
        },
        {
          id: 'evt_ai_complete',
          sessionId: 'sess_ai',
          sequence: 11,
          type: 'AI_RESPONSE_COMPLETED',
          timestamp: '2026-09-18T10:01:03.000Z',
          source: 'server',
          payload: {
            interactionId: 'inter_1',
            durationMs: 3000,
            reportedModelId: 'mock-model',
            responseExcerpt: 'Check the key prefix normalization.',
            responseBytes: 35,
            tokenUsage: {
              promptTokens: 10,
              completionTokens: 15,
              totalTokens: 25,
            },
          },
        },
      ];

      const items = buildChronologicalReconstruction(baseSession, events);

      expect(items.map((i) => i.kind)).toEqual([
        'SESSION_ACTIVATED',
        'AI_REQUEST_STARTED',
        'AI_RESPONSE_COMPLETED',
        'SESSION_SUBMITTED',
      ]);

      const start = items[1];
      if (start.kind !== 'AI_REQUEST_STARTED')
        throw new Error('Expected AI_REQUEST_STARTED');
      expect(start.interactionId).toBe('inter_1');
      expect(start.configuredProviderId).toBe('mock-ai');
      expect(start.configuredModelId).toBe('mock-model');
      expect(start.candidateInputExcerpt).toBe(
        'How do I resolve the cache key?',
      );
      expect(start.contextAttachmentsCount).toBe(1);
      expect(start.sequence).toBe(10);
      expect(start.rawEventId).toBe('evt_ai_start');

      const complete = items[2];
      if (complete.kind !== 'AI_RESPONSE_COMPLETED')
        throw new Error('Expected AI_RESPONSE_COMPLETED');
      expect(complete.interactionId).toBe('inter_1');
      expect(complete.durationMs).toBe(3000);
      expect(complete.reportedModelId).toBe('mock-model');
      expect(complete.responseExcerpt).toBe(
        'Check the key prefix normalization.',
      );
      expect(complete.tokenUsage?.totalTokens).toBe(25);
      expect(complete.sequence).toBe(11);
      expect(complete.rawEventId).toBe('evt_ai_complete');
    });

    it('Matrix B & Case 10: preserves in-flight boundaries with workspace change and command interleaving', () => {
      const events: SessionEvent[] = [
        {
          id: 'evt_ai_start',
          sessionId: 'sess_ai',
          sequence: 41,
          type: 'AI_REQUEST_STARTED',
          timestamp: '2026-09-18T10:01:00.000Z',
          source: 'server',
          payload: {
            interactionId: 'inter_41',
            clientRequestId: 'req_41',
            configuredProviderId: 'mock-ai',
            configuredModelId: 'mock-model',
            candidateInputExcerpt: 'Find the bug',
            candidateInputBytes: 12,
          },
        },
        {
          id: 'evt_ws',
          sessionId: 'sess_ai',
          sequence: 42,
          type: 'WORKSPACE_CHANGED',
          timestamp: '2026-09-18T10:01:01.000Z',
          source: 'server',
          payload: {
            changeId: 'chg_42',
            origin: 'browser_save',
            beforeTree: 'tree_a',
            afterTree: 'tree_b',
            files: [
              {
                path: 'service.py',
                status: 'modified',
                additions: 1,
                deletions: 0,
                patchPreview: 'patch',
                patchPreviewBytes: 5,
                patchBytes: 5,
                patchTruncated: false,
              },
            ],
            totalAdditions: 1,
            totalDeletions: 0,
          },
        },
        {
          id: 'evt_cmd_start',
          sessionId: 'sess_ai',
          sequence: 43,
          type: 'COMMAND_STARTED',
          timestamp: '2026-09-18T10:01:02.000Z',
          source: 'server',
          payload: {
            commandId: 'cmd_43',
            command: 'pytest',
            cwd: '/workspace',
          },
        },
        {
          id: 'evt_cmd_finish',
          sessionId: 'sess_ai',
          sequence: 44,
          type: 'COMMAND_FINISHED',
          timestamp: '2026-09-18T10:01:03.000Z',
          source: 'server',
          payload: {
            commandId: 'cmd_43',
            exitCode: 0,
            timedOut: false,
            durationMs: 1000,
            stdoutPreview: '1 passed',
            stdoutBytes: 8,
            stdoutTruncated: false,
            stderrPreview: '',
            stderrBytes: 0,
            stderrTruncated: false,
          },
        },
        {
          id: 'evt_ai_complete',
          sessionId: 'sess_ai',
          sequence: 45,
          type: 'AI_RESPONSE_COMPLETED',
          timestamp: '2026-09-18T10:01:04.000Z',
          source: 'server',
          payload: {
            interactionId: 'inter_41',
            durationMs: 4000,
            reportedModelId: 'mock-model',
            responseExcerpt: 'Found potential deadlock.',
            responseBytes: 25,
          },
        },
      ];

      const items = buildChronologicalReconstruction(baseSession, events);

      expect(items.map((i) => i.kind)).toEqual([
        'SESSION_ACTIVATED',
        'AI_REQUEST_STARTED',
        'WORKSPACE_CHANGE',
        'COMMAND_EXECUTION',
        'AI_RESPONSE_COMPLETED',
        'SESSION_SUBMITTED',
      ]);

      expect(items[1].sequence).toBe(41);
      expect(items[2].sequence).toBe(42);
      expect(items[3].sequence).toBe(44);
      expect(items[4].sequence).toBe(45);
    });

    it('Matrix D & Case 11: preserves start and failure with factual reason and no negative candidate judgment', () => {
      const events: SessionEvent[] = [
        {
          id: 'evt_ai_start',
          sessionId: 'sess_ai',
          sequence: 1,
          type: 'AI_REQUEST_STARTED',
          timestamp: '2026-09-18T10:01:00.000Z',
          source: 'server',
          payload: {
            interactionId: 'inter_fail',
            clientRequestId: 'req_fail',
            configuredProviderId: 'mock-ai',
            configuredModelId: 'mock-model',
            candidateInputExcerpt: 'Help with test',
            candidateInputBytes: 14,
          },
        },
        {
          id: 'evt_ai_failed',
          sessionId: 'sess_ai',
          sequence: 2,
          type: 'AI_REQUEST_FAILED',
          timestamp: '2026-09-18T10:01:05.000Z',
          source: 'server',
          payload: {
            interactionId: 'inter_fail',
            durationMs: 5000,
            failureReason: 'provider_error',
            errorMessageExcerpt: 'Upstream rate limit exceeded.',
          },
        },
      ];

      const items = buildChronologicalReconstruction(baseSession, events);

      expect(items.map((i) => i.kind)).toEqual([
        'SESSION_ACTIVATED',
        'AI_REQUEST_STARTED',
        'AI_REQUEST_FAILED',
        'SESSION_SUBMITTED',
      ]);

      const failedItem = items[2];
      if (failedItem.kind !== 'AI_REQUEST_FAILED')
        throw new Error('Expected AI_REQUEST_FAILED');
      expect(failedItem.failureReason).toBe('provider_error');
      expect(failedItem.errorMessageExcerpt).toBe(
        'Upstream rate limit exceeded.',
      );
      expect(failedItem.durationMs).toBe(5000);
      expect(failedItem.sequence).toBe(2);
    });

    it('Matrix E & Case 12A: preserves candidate-requested cancellation with explicit reason', () => {
      const events: SessionEvent[] = [
        {
          id: 'evt_ai_start',
          sessionId: 'sess_ai',
          sequence: 1,
          type: 'AI_REQUEST_STARTED',
          timestamp: '2026-09-18T10:01:00.000Z',
          source: 'server',
          payload: {
            interactionId: 'inter_cancel',
            clientRequestId: 'req_cancel',
            configuredProviderId: 'mock-ai',
            configuredModelId: 'mock-model',
            candidateInputExcerpt: 'Cancel me',
            candidateInputBytes: 9,
          },
        },
        {
          id: 'evt_ai_cancel',
          sessionId: 'sess_ai',
          sequence: 2,
          type: 'AI_REQUEST_CANCELLED',
          timestamp: '2026-09-18T10:01:02.000Z',
          source: 'server',
          payload: {
            interactionId: 'inter_cancel',
            durationMs: 2000,
            cancelReason: 'candidate_requested_cancel',
          },
        },
      ];

      const items = buildChronologicalReconstruction(baseSession, events);

      expect(items.map((i) => i.kind)).toEqual([
        'SESSION_ACTIVATED',
        'AI_REQUEST_STARTED',
        'AI_REQUEST_CANCELLED',
        'SESSION_SUBMITTED',
      ]);

      const cancelItem = items[2];
      if (cancelItem.kind !== 'AI_REQUEST_CANCELLED')
        throw new Error('Expected AI_REQUEST_CANCELLED');
      expect(cancelItem.cancelReason).toBe('candidate_requested_cancel');
    });

    it('Matrix F & Case 12B: preserves session closure cancellation without candidate attribution', () => {
      const events: SessionEvent[] = [
        {
          id: 'evt_ai_start',
          sessionId: 'sess_ai',
          sequence: 1,
          type: 'AI_REQUEST_STARTED',
          timestamp: '2026-09-18T10:01:00.000Z',
          source: 'server',
          payload: {
            interactionId: 'inter_sess_cancel',
            clientRequestId: 'req_sess_cancel',
            configuredProviderId: 'mock-ai',
            configuredModelId: 'mock-model',
            candidateInputExcerpt: 'In flight on close',
            candidateInputBytes: 18,
          },
        },
        {
          id: 'evt_ai_cancel',
          sessionId: 'sess_ai',
          sequence: 2,
          type: 'AI_REQUEST_CANCELLED',
          timestamp: '2026-09-18T10:01:02.000Z',
          source: 'server',
          payload: {
            interactionId: 'inter_sess_cancel',
            durationMs: 2000,
            cancelReason: 'session_ended',
          },
        },
      ];

      const items = buildChronologicalReconstruction(baseSession, events);

      const cancelItem = items[2];
      if (cancelItem.kind !== 'AI_REQUEST_CANCELLED')
        throw new Error('Expected AI_REQUEST_CANCELLED');
      expect(cancelItem.cancelReason).toBe('session_ended');
    });

    it('Matrix G & Case 14: tolerates unterminated start without synthesizing false terminal state', () => {
      const events: SessionEvent[] = [
        {
          id: 'evt_ai_start',
          sessionId: 'sess_ai',
          sequence: 1,
          type: 'AI_REQUEST_STARTED',
          timestamp: '2026-09-18T10:01:00.000Z',
          source: 'server',
          payload: {
            interactionId: 'inter_unterminated',
            clientRequestId: 'req_unterminated',
            configuredProviderId: 'mock-ai',
            configuredModelId: 'mock-model',
            candidateInputExcerpt: 'Never completed',
            candidateInputBytes: 15,
          },
        },
      ];

      const items = buildChronologicalReconstruction(baseSession, events);

      expect(items.map((i) => i.kind)).toEqual([
        'SESSION_ACTIVATED',
        'AI_REQUEST_STARTED',
        'SESSION_SUBMITTED',
      ]);
      expect(items.some((i) => i.kind === 'AI_RESPONSE_COMPLETED')).toBe(false);
      expect(items.some((i) => i.kind === 'AI_REQUEST_FAILED')).toBe(false);
      expect(items.some((i) => i.kind === 'AI_REQUEST_CANCELLED')).toBe(false);
    });

    it('Matrix H & Case 13: legacy sessions with zero AI events reconstruct without invented milestones', () => {
      const legacyEvents: SessionEvent[] = [
        {
          id: 'evt_cmd_start',
          sessionId: 'sess_legacy',
          sequence: 1,
          type: 'COMMAND_STARTED',
          timestamp: '2026-09-14T10:01:00.000Z',
          source: 'server',
          payload: {
            commandId: 'cmd_1',
            command: 'git status',
            cwd: '/workspace',
          },
        },
        {
          id: 'evt_cmd_finish',
          sessionId: 'sess_legacy',
          sequence: 2,
          type: 'COMMAND_FINISHED',
          timestamp: '2026-09-14T10:01:01.000Z',
          source: 'server',
          payload: {
            commandId: 'cmd_1',
            exitCode: 0,
            timedOut: false,
            durationMs: 1000,
            stdoutPreview: 'clean',
            stdoutBytes: 5,
            stdoutTruncated: false,
            stderrPreview: '',
            stderrBytes: 0,
            stderrTruncated: false,
          },
        },
      ];

      const items = buildChronologicalReconstruction(baseSession, legacyEvents);

      expect(items.map((i) => i.kind)).toEqual([
        'SESSION_ACTIVATED',
        'COMMAND_EXECUTION',
        'SESSION_SUBMITTED',
      ]);
      const json = JSON.stringify(items);
      expect(json).not.toContain('AI');
      expect(json).not.toContain('did not use AI');
    });

    it('Matrix I: interleaves multiple AI interactions and preserves strict sequence order', () => {
      const events: SessionEvent[] = [
        {
          id: 'evt_1',
          sessionId: 'sess_multi',
          sequence: 1,
          type: 'AI_REQUEST_STARTED',
          timestamp: '2026-09-18T10:01:00.000Z',
          source: 'server',
          payload: {
            interactionId: 'inter_1',
            clientRequestId: 'req_1',
            configuredProviderId: 'mock-ai',
            configuredModelId: 'mock-model',
            candidateInputExcerpt: 'Q1',
            candidateInputBytes: 2,
          },
        },
        {
          id: 'evt_2',
          sessionId: 'sess_multi',
          sequence: 2,
          type: 'WORKSPACE_CHANGED',
          timestamp: '2026-09-18T10:02:00.000Z',
          source: 'server',
          payload: {
            changeId: 'chg_1',
            origin: 'browser_save',
            beforeTree: 'tree_1',
            afterTree: 'tree_2',
            files: [
              {
                path: 'a.py',
                status: 'modified',
                additions: 1,
                deletions: 0,
                patchPreview: '',
                patchPreviewBytes: 0,
                patchBytes: 0,
                patchTruncated: false,
              },
            ],
            totalAdditions: 1,
            totalDeletions: 0,
          },
        },
        {
          id: 'evt_3',
          sessionId: 'sess_multi',
          sequence: 3,
          type: 'AI_RESPONSE_COMPLETED',
          timestamp: '2026-09-18T10:03:00.000Z',
          source: 'server',
          payload: {
            interactionId: 'inter_1',
            durationMs: 2000,
            reportedModelId: 'mock-model',
            responseExcerpt: 'A1',
            responseBytes: 2,
          },
        },
        {
          id: 'evt_4',
          sessionId: 'sess_multi',
          sequence: 4,
          type: 'AI_REQUEST_STARTED',
          timestamp: '2026-09-18T10:04:00.000Z',
          source: 'server',
          payload: {
            interactionId: 'inter_2',
            clientRequestId: 'req_2',
            configuredProviderId: 'mock-ai',
            configuredModelId: 'mock-model',
            candidateInputExcerpt: 'Q2',
            candidateInputBytes: 2,
          },
        },
        {
          id: 'evt_5',
          sessionId: 'sess_multi',
          sequence: 5,
          type: 'AI_REQUEST_FAILED',
          timestamp: '2026-09-18T10:05:00.000Z',
          source: 'server',
          payload: {
            interactionId: 'inter_2',
            durationMs: 1000,
            failureReason: 'server_timeout',
            errorMessageExcerpt: 'Gateway timeout',
          },
        },
      ];

      const items = buildChronologicalReconstruction(baseSession, events);

      expect(items.map((i) => i.kind)).toEqual([
        'SESSION_ACTIVATED',
        'AI_REQUEST_STARTED',
        'WORKSPACE_CHANGE',
        'AI_RESPONSE_COMPLETED',
        'AI_REQUEST_STARTED',
        'AI_REQUEST_FAILED',
        'SESSION_SUBMITTED',
      ]);
      expect(items[1].sequence).toBe(1);
      expect(items[2].sequence).toBe(2);
      expect(items[3].sequence).toBe(3);
      expect(items[4].sequence).toBe(4);
      expect(items[5].sequence).toBe(5);
    });
  });
});
