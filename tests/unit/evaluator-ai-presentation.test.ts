import { describe, expect, it } from 'vitest';
import { buildEvaluatorBriefing } from '../../apps/web/src/evaluator/build-evaluator-briefing';
import {
  briefingDepthProfiles,
  projectBriefing,
} from '../../apps/web/src/evaluator/project-evaluator-briefing';
import {
  noReconstruction,
  testEvidence,
} from '../support/briefing-test-evidence';
import type { SessionEvent } from '../../apps/web/src/events/session-event';
import type { AiCapabilitySnapshot } from '../../apps/web/src/ai/ai-interaction';

const activeSnapshot: AiCapabilitySnapshot = {
  enabled: true,
  contractVersion: '1.0',
  configurationVersion: '1.0',
  configuredProviderId: 'mock-provider',
  configuredModelId: 'claude-3-5-sonnet',
};

const createAiStartEvent = (
  id: string,
  interactionId: string,
  sequence: number,
  timestamp: string,
  prompt = 'Help me fix cache staleness',
  attachmentsCount = 1,
): SessionEvent => ({
  id,
  sessionId: 'briefing-test',
  sequence,
  type: 'AI_REQUEST_STARTED',
  timestamp,
  source: 'server',
  payload: {
    interactionId,
    configuredProviderId: 'mock-provider',
    configuredModelId: 'claude-3-5-sonnet',
    candidateInputExcerpt: prompt,
    candidateInputBytes: Buffer.byteLength(prompt, 'utf8'),
    contextAttachmentsCount: attachmentsCount,
  },
});

const createAiCompleteEvent = (
  id: string,
  interactionId: string,
  sequence: number,
  timestamp: string,
  response = 'Here is the fix for cache staleness',
  durationMs = 1500,
  tokenUsage = { promptTokens: 30, completionTokens: 50, totalTokens: 80 },
): SessionEvent => ({
  id,
  sessionId: 'briefing-test',
  sequence,
  type: 'AI_RESPONSE_COMPLETED',
  timestamp,
  source: 'server',
  payload: {
    interactionId,
    reportedModelId: 'claude-3-5-sonnet',
    responseExcerpt: response,
    responseBytes: Buffer.byteLength(response, 'utf8'),
    durationMs,
    tokenUsage,
  },
});

const createAiCancelEvent = (
  id: string,
  interactionId: string,
  sequence: number,
  timestamp: string,
  cancelReason = 'candidate_requested_cancel',
  durationMs = 800,
): SessionEvent => ({
  id,
  sessionId: 'briefing-test',
  sequence,
  type: 'AI_REQUEST_CANCELLED',
  timestamp,
  source: 'server',
  payload: {
    interactionId,
    durationMs,
    cancelReason,
  },
});

const createAiFailEvent = (
  id: string,
  interactionId: string,
  sequence: number,
  timestamp: string,
  failureReason = 'provider_error',
  errorMessage = 'Provider timed out or unavailable',
  durationMs = 30000,
): SessionEvent => ({
  id,
  sessionId: 'briefing-test',
  sequence,
  type: 'AI_REQUEST_FAILED',
  timestamp,
  source: 'server',
  payload: {
    interactionId,
    durationMs,
    failureReason,
    errorMessageExcerpt: errorMessage,
  },
});

const createWorkspaceChangeEvent = (
  id: string,
  sequence: number,
  timestamp: string,
  path = 'inventory/service.py',
): SessionEvent => ({
  id,
  sessionId: 'briefing-test',
  sequence,
  type: 'WORKSPACE_CHANGED',
  timestamp,
  source: 'server',
  payload: {
    changeId: `change-${id}`,
    origin: 'browser_save',
    beforeTree: 'tree-before-' + id,
    afterTree: 'tree-after-' + id,
    files: [
      {
        path,
        status: 'modified',
        additions: 3,
        deletions: 1,
        patchPreview: '+ invalidate_cached_stock(product_id)',
        patchBytes: 40,
        patchTruncated: false,
      },
    ],
  },
});

describe('Slice 6E — Evaluator AI Evidence Presentation', () => {
  it('preserves truth invariance across all four role-depth profiles', () => {
    const events: SessionEvent[] = [
      createAiStartEvent('evt-1', 'int-1', 1, '2026-09-17T00:01:00Z'),
      createAiCompleteEvent('evt-2', 'int-1', 2, '2026-09-17T00:01:02Z'),
      createAiStartEvent('evt-3', 'int-2', 3, '2026-09-17T00:01:10Z'),
      createAiCancelEvent('evt-4', 'int-2', 4, '2026-09-17T00:01:11Z'),
      createAiStartEvent('evt-5', 'int-3', 5, '2026-09-17T00:01:20Z'),
      createAiFailEvent('evt-6', 'int-3', 6, '2026-09-17T00:01:50Z'),
    ];

    const evidence = testEvidence(events);
    evidence.aiCapabilitySnapshot = activeSnapshot;

    const briefing = buildEvaluatorBriefing(evidence, noReconstruction);

    expect(briefing.aiSummary.totalInteractions).toBe(3);
    expect(briefing.aiSummary.completedCount).toBe(1);
    expect(briefing.aiSummary.cancelledCount).toBe(1);
    expect(briefing.aiSummary.failedCount).toBe(1);

    for (const role of briefingDepthProfiles) {
      const projected = projectBriefing(briefing, role);
      // Truth invariance
      expect(projected.briefing.aiSummary.totalInteractions).toBe(3);
      expect(projected.briefing.aiSummary.completedCount).toBe(1);
      expect(projected.briefing.aiSummary.cancelledCount).toBe(1);
      expect(projected.briefing.aiSummary.failedCount).toBe(1);
      expect(projected.briefing.aiSummary.summaryText).toBe(
        '3 recorded AI interactions · 1 completed · 1 cancelled · 1 failed',
      );
      // Chronology invariance
      expect(projected.briefing.observedActivity.length).toBe(
        briefing.observedActivity.length,
      );
      const aiMilestones = projected.briefing.observedActivity.filter((a) =>
        a.kind.startsWith('recorded_ai_'),
      );
      expect(aiMilestones.length).toBe(6);
    }
  });

  it('configures role depth presentation defaults correctly across roles', () => {
    const events: SessionEvent[] = [
      createAiStartEvent('evt-1', 'int-1', 1, '2026-09-17T00:01:00Z'),
      createAiCompleteEvent('evt-2', 'int-1', 2, '2026-09-17T00:01:02Z'),
    ];
    const evidence = testEvidence(events);
    evidence.aiCapabilitySnapshot = activeSnapshot;
    const briefing = buildEvaluatorBriefing(evidence, noReconstruction);

    // GENERALIST_RECRUITER
    const generalist = projectBriefing(briefing, 'GENERALIST_RECRUITER');
    expect(generalist.defaultDepth.aiSummary).toBe(true);
    expect(generalist.defaultDepth.aiConfiguredModel).toBe(false);
    expect(generalist.defaultDepth.aiTokenTelemetry).toBe(false);
    expect(generalist.briefing.aiSummary.configuredModelId).toBeNull();
    expect(generalist.briefing.aiSummary.configuredProviderId).toBeNull();

    // TECHNICAL_RECRUITER
    const techRecruiter = projectBriefing(briefing, 'TECHNICAL_RECRUITER');
    expect(techRecruiter.defaultDepth.aiSummary).toBe(true);
    expect(techRecruiter.defaultDepth.aiConfiguredModel).toBe(true);
    expect(techRecruiter.defaultDepth.aiTokenTelemetry).toBe(false);
    expect(techRecruiter.briefing.aiSummary.configuredModelId).toBe(
      'claude-3-5-sonnet',
    );
    expect(techRecruiter.briefing.aiSummary.configuredProviderId).toBeNull();

    // ENGINEER
    const engineer = projectBriefing(briefing, 'ENGINEER');
    expect(engineer.defaultDepth.aiSummary).toBe(true);
    expect(engineer.defaultDepth.aiConfiguredModel).toBe(true);
    expect(engineer.defaultDepth.aiTokenTelemetry).toBe(true);
    expect(engineer.briefing.aiSummary.configuredModelId).toBe(
      'claude-3-5-sonnet',
    );
    expect(engineer.briefing.aiSummary.configuredProviderId).toBe(
      'mock-provider',
    );

    // ENGINEERING_MANAGER
    const engManager = projectBriefing(briefing, 'ENGINEERING_MANAGER');
    expect(engManager.defaultDepth.aiSummary).toBe(true);
    expect(engManager.defaultDepth.aiConfiguredModel).toBe(true);
    expect(engManager.defaultDepth.aiTokenTelemetry).toBe(false);
    expect(engManager.briefing.aiSummary.configuredModelId).toBe(
      'claude-3-5-sonnet',
    );
  });

  it('renders neutral deterministic statements and enforces temporal non-causality', () => {
    const events: SessionEvent[] = [
      createAiStartEvent('evt-1', 'int-1', 1, '2026-09-17T00:01:00Z'),
      createAiCompleteEvent('evt-2', 'int-1', 2, '2026-09-17T00:01:02Z'),
      createWorkspaceChangeEvent('evt-3', 3, '2026-09-17T00:01:05Z'),
    ];
    const evidence = testEvidence(events);
    evidence.aiCapabilitySnapshot = activeSnapshot;
    const briefing = buildEvaluatorBriefing(evidence, noReconstruction);

    const observed = briefing.observedActivity;
    expect(observed[0].text).toBe('An AI request was recorded.');
    expect(observed[1].text).toBe('An AI response was recorded.');
    expect(observed[2].text).toContain('inventory');

    // Non-causality contract: no inference of copying or AI application
    const allText = observed.map((o) => o.text).join(' ');
    const forbidden = [
      'copied',
      'applied',
      'caused',
      'derived',
      'relied',
      'assisted',
      'prompted by',
    ];
    for (const term of forbidden) {
      expect(allText.toLowerCase()).not.toContain(term);
    }
  });

  it('handles AI enabled with zero recorded interactions', () => {
    const evidence = testEvidence([]);
    evidence.aiCapabilitySnapshot = activeSnapshot;
    const briefing = buildEvaluatorBriefing(evidence, noReconstruction);

    expect(briefing.aiSummary.capabilityState).toBe('active');
    expect(briefing.aiSummary.totalInteractions).toBe(0);
    expect(briefing.aiSummary.summaryText).toBe(
      'AI capability was active for this assessment. No integrated AI interactions were recorded.',
    );
    expect(briefing.aiSummary.summaryText).not.toContain(
      'Candidate did not use AI',
    );
    expect(briefing.aiSummary.summaryText).not.toContain('chose not to');
  });

  it('handles AI disabled assessment configuration', () => {
    const evidence = testEvidence([]);
    evidence.aiCapabilitySnapshot = {
      enabled: false,
      contractVersion: '1.0',
      configurationVersion: '1.0',
      configuredProviderId: 'mock-provider',
      configuredModelId: 'claude-3-5-sonnet',
    };
    const briefing = buildEvaluatorBriefing(evidence, noReconstruction);

    expect(briefing.aiSummary.capabilityState).toBe('disabled');
    expect(briefing.aiSummary.totalInteractions).toBe(0);
    expect(briefing.aiSummary.summaryText).toBe(
      'Integrated AI capability was disabled for this assessment.',
    );
  });

  it('handles legacy session with no snapshot', () => {
    const evidence = testEvidence([]);
    evidence.aiCapabilitySnapshot = null;
    const briefing = buildEvaluatorBriefing(evidence, noReconstruction);

    expect(briefing.aiSummary.capabilityState).toBe('legacy');
    expect(briefing.aiSummary.totalInteractions).toBe(0);
    expect(briefing.aiSummary.summaryText).toBe(
      'AI capture was not available for this session version.',
    );
    expect(
      briefing.observedActivity.some((a) => a.kind.startsWith('recorded_ai_')),
    ).toBe(false);
  });

  it('surfaces provider failures and timeouts with platform attribution', () => {
    const events: SessionEvent[] = [
      createAiStartEvent('evt-1', 'int-1', 1, '2026-09-17T00:01:00Z'),
      createAiFailEvent(
        'evt-2',
        'int-1',
        2,
        '2026-09-17T00:01:05Z',
        'provider_error',
      ),
      createAiStartEvent('evt-3', 'int-2', 3, '2026-09-17T00:01:10Z'),
      createAiFailEvent('evt-4', 'int-2', 4, '2026-09-17T00:01:40Z', 'timeout'),
    ];
    const evidence = testEvidence(events);
    evidence.aiCapabilitySnapshot = activeSnapshot;
    const briefing = buildEvaluatorBriefing(evidence, noReconstruction);

    expect(briefing.aiSummary.failedCount).toBe(2);
    expect(briefing.aiSummary.providerInterruptionNotice).toBe(
      'An external AI provider error was recorded during this session.',
    );

    const fail1 = briefing.observedActivity.find((a) =>
      a.factRef.includes('int-1:failed'),
    );
    expect(fail1?.text).toBe('An AI request ended with a provider error.');

    const fail2 = briefing.observedActivity.find((a) =>
      a.factRef.includes('int-2:failed'),
    );
    expect(fail2?.text).toBe('An AI request timed out.');
  });

  it('differentiates candidate cancellation from session-ended cancellation', () => {
    const events: SessionEvent[] = [
      createAiStartEvent('evt-1', 'int-1', 1, '2026-09-17T00:01:00Z'),
      createAiCancelEvent(
        'evt-2',
        'int-1',
        2,
        '2026-09-17T00:01:02Z',
        'candidate_requested_cancel',
      ),
      createAiStartEvent('evt-3', 'int-2', 3, '2026-09-17T00:01:10Z'),
      createAiCancelEvent(
        'evt-4',
        'int-2',
        4,
        '2026-09-17T00:01:12Z',
        'session_ended',
      ),
    ];
    const evidence = testEvidence(events);
    evidence.aiCapabilitySnapshot = activeSnapshot;
    const briefing = buildEvaluatorBriefing(evidence, noReconstruction);

    const cancel1 = briefing.observedActivity.find((a) =>
      a.factRef.includes('int-1:cancelled'),
    );
    expect(cancel1?.text).toBe(
      'Candidate requested cancellation of the AI request.',
    );

    const cancel2 = briefing.observedActivity.find((a) =>
      a.factRef.includes('int-2:cancelled'),
    );
    expect(cancel2?.text).toBe(
      'An AI request was cancelled when the session ended.',
    );
  });

  it('detects interleaving when AI activity is mixed with workspace changes', () => {
    const events: SessionEvent[] = [
      createAiStartEvent('evt-1', 'int-1', 1, '2026-09-17T00:01:00Z'),
      createAiCompleteEvent('evt-2', 'int-1', 2, '2026-09-17T00:01:02Z'),
      createWorkspaceChangeEvent('evt-3', 3, '2026-09-17T00:01:05Z'),
      createAiStartEvent('evt-4', 'int-2', 4, '2026-09-17T00:01:10Z'),
      createAiCompleteEvent('evt-5', 'int-2', 5, '2026-09-17T00:01:12Z'),
    ];
    const evidence = testEvidence(events);
    evidence.aiCapabilitySnapshot = activeSnapshot;
    const briefing = buildEvaluatorBriefing(evidence, noReconstruction);

    expect(briefing.aiSummary.interleaved).toBe(true);
  });
});
