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

  describe('Slice 6D — AI Evidence Facts & References', () => {
    it('Matrix J: generates inspectable references and resolves raw event IDs for all AI milestones', () => {
      const sessionId = 'ai-catalog-session';
      const events: SessionEvent[] = [
        {
          id: 'evt_start_1',
          sessionId,
          sequence: 1,
          type: 'AI_REQUEST_STARTED',
          timestamp: '2026-09-18T10:00:01.000Z',
          source: 'server',
          payload: {
            interactionId: 'interaction-1',
            clientRequestId: 'req-1',
            configuredProviderId: 'mock-ai',
            configuredModelId: 'mock-model',
            candidateInputExcerpt: 'How do I run pytest?',
            candidateInputBytes: 20,
            candidateContext: [
              { filePath: 'tests/app.py', startLine: 1, endLine: 10 },
            ],
          },
        },
        {
          id: 'evt_complete_1',
          sessionId,
          sequence: 2,
          type: 'AI_RESPONSE_COMPLETED',
          timestamp: '2026-09-18T10:00:03.000Z',
          source: 'server',
          payload: {
            interactionId: 'interaction-1',
            durationMs: 2000,
            reportedModelId: 'mock-model',
            responseExcerpt: 'Run pytest in terminal.',
            responseBytes: 23,
            tokenUsage: {
              promptTokens: 10,
              completionTokens: 12,
              totalTokens: 22,
            },
          },
        },
        {
          id: 'evt_start_2',
          sessionId,
          sequence: 3,
          type: 'AI_REQUEST_STARTED',
          timestamp: '2026-09-18T10:00:04.000Z',
          source: 'server',
          payload: {
            interactionId: 'interaction-2',
            clientRequestId: 'req-2',
            configuredProviderId: 'mock-ai',
            configuredModelId: 'mock-model',
            candidateInputExcerpt: 'Cancelled request',
            candidateInputBytes: 17,
          },
        },
        {
          id: 'evt_cancel_2',
          sessionId,
          sequence: 4,
          type: 'AI_REQUEST_CANCELLED',
          timestamp: '2026-09-18T10:00:05.000Z',
          source: 'server',
          payload: {
            interactionId: 'interaction-2',
            durationMs: 1000,
            cancelReason: 'candidate_requested_cancel',
          },
        },
        {
          id: 'evt_start_3',
          sessionId,
          sequence: 5,
          type: 'AI_REQUEST_STARTED',
          timestamp: '2026-09-18T10:00:06.000Z',
          source: 'server',
          payload: {
            interactionId: 'interaction-3',
            clientRequestId: 'req-3',
            configuredProviderId: 'mock-ai',
            configuredModelId: 'mock-model',
            candidateInputExcerpt: 'Failed request',
            candidateInputBytes: 14,
          },
        },
        {
          id: 'evt_fail_3',
          sessionId,
          sequence: 6,
          type: 'AI_REQUEST_FAILED',
          timestamp: '2026-09-18T10:00:07.000Z',
          source: 'server',
          payload: {
            interactionId: 'interaction-3',
            durationMs: 1000,
            failureReason: 'provider_error',
            errorMessageExcerpt: 'Connection refused',
          },
        },
      ];

      const chronology = buildChronologicalReconstruction(
        {
          activatedAt: '2026-09-18T10:00:00.000Z',
          submittedAt: '2026-09-18T10:00:10.000Z',
          submittedDiff: '',
        },
        events,
      );
      const catalog = buildEvidenceReferenceCatalog(sessionId, chronology);

      const startRef1 = `ai_request:${sessionId}:interaction-1:started`;
      const completeRef1 = `ai_response:${sessionId}:interaction-1:completed`;
      const cancelRef2 = `ai_request:${sessionId}:interaction-2:cancelled`;
      const failRef3 = `ai_request:${sessionId}:interaction-3:failed`;

      expect(catalog.byReference.has(startRef1)).toBe(true);
      expect(catalog.byReference.has(completeRef1)).toBe(true);
      expect(catalog.byReference.has(cancelRef2)).toBe(true);
      expect(catalog.byReference.has(failRef3)).toBe(true);

      expect(catalog.byReference.get(startRef1)).toMatchObject({
        evidenceRef: startRef1,
        sessionId,
        role: 'chronology',
        kind: 'ai_request_started',
        rawEventIds: ['evt_start_1'],
        firstSequence: 1,
        lastSequence: 1,
      });

      expect(catalog.byReference.get(completeRef1)).toMatchObject({
        evidenceRef: completeRef1,
        sessionId,
        role: 'chronology',
        kind: 'ai_response_completed',
        rawEventIds: ['evt_complete_1'],
        firstSequence: 2,
        lastSequence: 2,
      });

      expect(catalog.byReference.get(cancelRef2)).toMatchObject({
        evidenceRef: cancelRef2,
        sessionId,
        role: 'chronology',
        kind: 'ai_request_cancelled',
        rawEventIds: ['evt_cancel_2'],
        firstSequence: 4,
        lastSequence: 4,
      });

      expect(catalog.byReference.get(failRef3)).toMatchObject({
        evidenceRef: failRef3,
        sessionId,
        role: 'chronology',
        kind: 'ai_request_failed',
        rawEventIds: ['evt_fail_3'],
        firstSequence: 6,
        lastSequence: 6,
      });

      const packet = buildEvidencePacket(
        {
          scenario: { title: 'T', brief: 'B', acceptanceCriteria: [] },
          activatedAt: '2026-09-18T10:00:00.000Z',
          submittedAt: '2026-09-18T10:00:10.000Z',
          diff: '',
        },
        catalog,
      );

      const kinds = packet.evidenceItems.map((item) => item.fact.kind);
      expect(kinds).toContain('ai_request_started');
      expect(kinds).toContain('ai_response_completed');
      expect(kinds).toContain('ai_request_cancelled');
      expect(kinds).toContain('ai_request_failed');
    });

    it('Matrix K: bounds long AI excerpts and flags truncation', () => {
      const sessionId = 'truncation-session';
      const longInput = 'x'.repeat(10_000);
      const longResponse = 'y'.repeat(10_000);
      const events: SessionEvent[] = [
        {
          id: 'evt_start_trunc',
          sessionId,
          sequence: 1,
          type: 'AI_REQUEST_STARTED',
          timestamp: '2026-09-18T10:00:01.000Z',
          source: 'server',
          payload: {
            interactionId: 'inter_trunc',
            clientRequestId: 'req_trunc',
            configuredProviderId: 'mock-ai',
            configuredModelId: 'mock-model',
            candidateInputExcerpt: longInput,
            candidateInputBytes: 10_000,
          },
        },
        {
          id: 'evt_complete_trunc',
          sessionId,
          sequence: 2,
          type: 'AI_RESPONSE_COMPLETED',
          timestamp: '2026-09-18T10:00:03.000Z',
          source: 'server',
          payload: {
            interactionId: 'inter_trunc',
            durationMs: 2000,
            reportedModelId: 'mock-model',
            responseExcerpt: longResponse,
            responseBytes: 10_000,
          },
        },
      ];

      const chronology = buildChronologicalReconstruction(
        {
          activatedAt: '2026-09-18T10:00:00.000Z',
          submittedAt: '2026-09-18T10:00:10.000Z',
          submittedDiff: '',
        },
        events,
      );
      const catalog = buildEvidenceReferenceCatalog(sessionId, chronology);
      const customLimits = {
        maximumEvidenceItems: 250,
        maximumCommandOutputBytes: 100, // strictly bound to 100 bytes
        maximumPatchBytes: 100,
        maximumFinalDiffBytes: 100,
        maximumPacketBytes: 65536,
        maximumStatements: 12,
        maximumStatementTextLength: 280,
        maximumStatementDetailLength: 480,
        maximumReferencesPerStatement: 250,
        maximumOutputBytes: 16384,
      };

      const packet = buildEvidencePacket(
        {
          scenario: { title: 'T', brief: 'B', acceptanceCriteria: [] },
          activatedAt: '2026-09-18T10:00:00.000Z',
          submittedAt: '2026-09-18T10:00:10.000Z',
          diff: '',
        },
        catalog,
        customLimits,
      );

      const startFact = packet.evidenceItems.find(
        (i) => i.fact.kind === 'ai_request_started',
      )?.fact;
      if (!startFact || startFact.kind !== 'ai_request_started') {
        throw new Error('Expected ai_request_started fact');
      }
      expect(startFact.promptExcerpt.length).toBeLessThanOrEqual(100);
      expect(startFact.promptTruncated).toBe(true);

      const completeFact = packet.evidenceItems.find(
        (i) => i.fact.kind === 'ai_response_completed',
      )?.fact;
      if (!completeFact || completeFact.kind !== 'ai_response_completed') {
        throw new Error('Expected ai_response_completed fact');
      }
      expect(completeFact.responseExcerpt.length).toBeLessThanOrEqual(100);
      expect(completeFact.responseTruncated).toBe(true);

      expect(packet.integrity.truncatedEvidenceRefs).toContain(
        `ai_request:${sessionId}:inter_trunc:started`,
      );
      expect(packet.integrity.truncatedEvidenceRefs).toContain(
        `ai_response:${sessionId}:inter_trunc:completed`,
      );
    });

    it('enforces epistemic neutrality: no evaluative or psychological properties exist on AI facts', () => {
      const sessionId = 'neutrality-session';
      const events: SessionEvent[] = [
        {
          id: 'evt_start',
          sessionId,
          sequence: 1,
          type: 'AI_REQUEST_STARTED',
          timestamp: '2026-09-18T10:00:01.000Z',
          source: 'server',
          payload: {
            interactionId: 'inter_neutral',
            clientRequestId: 'req_neutral',
            configuredProviderId: 'mock-ai',
            configuredModelId: 'mock-model',
            candidateInputExcerpt: 'input',
            candidateInputBytes: 5,
          },
        },
        {
          id: 'evt_complete',
          sessionId,
          sequence: 2,
          type: 'AI_RESPONSE_COMPLETED',
          timestamp: '2026-09-18T10:00:02.000Z',
          source: 'server',
          payload: {
            interactionId: 'inter_neutral',
            durationMs: 1000,
            reportedModelId: 'mock-model',
            responseExcerpt: 'response',
            responseBytes: 8,
          },
        },
      ];

      const chronology = buildChronologicalReconstruction(
        {
          activatedAt: '2026-09-18T10:00:00.000Z',
          submittedAt: '2026-09-18T10:00:10.000Z',
          submittedDiff: '',
        },
        events,
      );
      const catalog = buildEvidenceReferenceCatalog(sessionId, chronology);
      const packet = buildEvidencePacket(
        {
          scenario: { title: 'T', brief: 'B', acceptanceCriteria: [] },
          activatedAt: '2026-09-18T10:00:00.000Z',
          submittedAt: '2026-09-18T10:00:10.000Z',
          diff: '',
        },
        catalog,
      );

      const serialized = JSON.stringify(packet.evidenceItems);
      const forbiddenKeywords = [
        'ai_dependency',
        'ai_quality',
        'prompt_skill',
        'verification_quality',
        'candidate_understanding',
        'authorship_confidence',
        'ai_influence_score',
        'competence',
        'reliance',
      ];
      for (const keyword of forbiddenKeywords) {
        expect(serialized).not.toContain(keyword);
      }
    });
  });
});
