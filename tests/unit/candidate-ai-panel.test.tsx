import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { CandidateAiPanel } from '../../apps/web/app/candidate/[token]/candidate-ai-panel';
import {
  addContextAttachment,
  beginSubmission,
  buildAiInteractionPayload,
  INITIAL_CANDIDATE_AI_STATE,
  MAXIMUM_PROMPT_CHARS,
  removeContextAttachment,
  resolveSubmissionNetworkError,
  resolveSubmissionResult,
  setPromptText,
  startNewRequest,
} from '../../apps/web/app/candidate/[token]/candidate-ai-state';
import { MAXIMUM_PROMPT_LENGTH } from '../../apps/web/src/ai/ai-interaction';
import { toCandidateSessionView } from '../../apps/web/src/sessions/candidate-session-view';
import type { AssessmentSession } from '../../apps/web/src/sessions/session';

describe('Slice 6F — Candidate Integrated AI Surface', () => {
  const dummyScenario = {
    id: 'scenario-001',
    title: 'Multi-Service Cache Staleness',
    version: '1.0.0',
    brief: 'Fix cache invalidation bug.',
    acceptanceCriteria: ['Pass unit tests'],
    filePath: 'inventory/cache.py',
    type: 'single_file' as const,
  };

  const createDummySession = (
    aiSnapshot: AssessmentSession['aiCapabilitySnapshot'],
  ): AssessmentSession => ({
    id: 'session-123',
    candidateTokenHash: 'hash-123',
    scenario: dummyScenario,
    status: 'ACTIVE',
    workingContent: 'print("hello")',
    submittedContent: null,
    createdAt: '2026-09-18T10:00:00.000Z',
    activatedAt: '2026-09-18T10:01:00.000Z',
    submittedAt: null,
    aiCapabilitySnapshot: aiSnapshot,
  });

  describe('Session View Capability Projection', () => {
    it('projects enabled capability accurately', () => {
      const session = createDummySession({
        enabled: true,
        contractVersion: 'slice-6b-v1',
        configuredProviderId: 'mock-ai',
        configuredModelId: 'mock-chat-v1',
        configurationVersion: '1.0.0',
      });

      const view = toCandidateSessionView(session);
      expect(view.aiCapability).toEqual({ enabled: true });
    });

    it('projects disabled capability accurately', () => {
      const session = createDummySession({
        enabled: false,
        contractVersion: 'slice-6b-v1',
        configuredProviderId: 'none',
        configuredModelId: 'none',
        configurationVersion: '1.0.0',
      });

      const view = toCandidateSessionView(session);
      expect(view.aiCapability).toEqual({ enabled: false });
    });

    it('projects null for legacy session missing capability snapshot', () => {
      const session = createDummySession(null);
      const view = toCandidateSessionView(session);
      expect(view.aiCapability).toBeNull();
    });
  });

  describe('CandidateAiPanel Rendered Markup & Capability States', () => {
    it('renders composer when capability is enabled and session is active', () => {
      const html = renderToStaticMarkup(
        <CandidateAiPanel
          token="test-token"
          sessionStatus="ACTIVE"
          aiCapability={{ enabled: true }}
          availableFiles={['inventory/cache.py', 'inventory/service.py']}
        />,
      );

      expect(html).toContain('Engineering assistant');
      expect(html).toContain('Integrated capability');
      expect(html).toContain('id="candidate-ai-prompt"');
      expect(html).toContain('Submit request');
      expect(html).toContain('Workspace context');
      expect(html).toContain('Choose a workspace file…');
    });

    it('renders factual disabled state without composer when capability is disabled', () => {
      const html = renderToStaticMarkup(
        <CandidateAiPanel
          token="test-token"
          sessionStatus="ACTIVE"
          aiCapability={{ enabled: false }}
        />,
      );

      expect(html).toContain(
        'Integrated AI assistance is not enabled for this assessment.',
      );
      expect(html).not.toContain('id="candidate-ai-prompt"');
      expect(html).not.toContain('Submit request');
    });

    it('renders factual unavailable state without composer when capability is null (legacy)', () => {
      const html = renderToStaticMarkup(
        <CandidateAiPanel
          token="test-token"
          sessionStatus="ACTIVE"
          aiCapability={null}
        />,
      );

      expect(html).toContain(
        'Integrated AI assistance is unavailable for this assessment.',
      );
      expect(html).not.toContain('id="candidate-ai-prompt"');
    });

    it('renders start session notice when session is CREATED', () => {
      const html = renderToStaticMarkup(
        <CandidateAiPanel
          token="test-token"
          sessionStatus="CREATED"
          aiCapability={{ enabled: true }}
        />,
      );

      expect(html).toContain('Start session to use integrated AI assistance.');
      expect(html).not.toContain('id="candidate-ai-prompt"');
    });

    it('renders closed notice when session is SUBMITTED and no prior response exists', () => {
      const html = renderToStaticMarkup(
        <CandidateAiPanel
          token="test-token"
          sessionStatus="SUBMITTED"
          aiCapability={{ enabled: true }}
        />,
      );

      expect(html).toContain(
        'Assessment submitted. Integrated AI assistance is closed.',
      );
      expect(html).not.toContain('id="candidate-ai-prompt"');
    });

    it('preserves completed response view when session transitions to SUBMITTED', () => {
      const stateWithResponse = {
        ...INITIAL_CANDIDATE_AI_STATE,
        submissionState: 'completed' as const,
        completedInteraction: {
          prompt: 'How to fix bug?',
          responseText: 'Inspect the cache TTL in cache.py.',
        },
      };

      const html = renderToStaticMarkup(
        <CandidateAiPanel
          token="test-token"
          sessionStatus="SUBMITTED"
          aiCapability={{ enabled: true }}
          initialState={stateWithResponse}
        />,
      );

      expect(html).toContain(
        'Assessment submitted. Integrated AI assistance is closed.',
      );
      expect(html).toContain('How to fix bug?');
      expect(html).toContain('Inspect the cache TTL in cache.py.');
      // When submitted, no new request button is presented
      expect(html).not.toContain('New request');
    });
  });

  describe('Prompt Submission & Idempotency State Machine', () => {
    it('constructs submission payload with clientRequestId, prompt, and context refs without provider/model', () => {
      let state = INITIAL_CANDIDATE_AI_STATE;
      state = setPromptText(state, 'How should I fix the cache staleness bug?');
      state = addContextAttachment(state, 'inventory/cache.py');
      state = addContextAttachment(state, 'inventory/models.py');

      const admission = beginSubmission(state, 'client_req_fixed_123');
      expect(admission).not.toBeNull();
      expect(admission!.requestId).toBe('client_req_fixed_123');
      expect(admission!.nextState.submissionState).toBe('submitting');
      expect(admission!.nextState.clientRequestId).toBe('client_req_fixed_123');

      const payload = buildAiInteractionPayload(state, admission!.requestId);

      // Verify payload structure strictly
      expect(payload).toEqual({
        clientRequestId: 'client_req_fixed_123',
        candidatePromptText: 'How should I fix the cache staleness bug?',
        candidateContext: [
          { filePath: 'inventory/cache.py' },
          { filePath: 'inventory/models.py' },
        ],
      });

      // Strictly verify no provider, model, or secret override fields exist
      expect(payload).not.toHaveProperty('provider');
      expect(payload).not.toHaveProperty('providerId');
      expect(payload).not.toHaveProperty('model');
      expect(payload).not.toHaveProperty('modelId');
      expect(payload).not.toHaveProperty('apiKey');
    });

    it('guards against double-click by rejecting submission when already submitting', () => {
      let state = INITIAL_CANDIDATE_AI_STATE;
      state = setPromptText(state, 'Double click test');

      const firstAdmission = beginSubmission(state);
      expect(firstAdmission).not.toBeNull();

      // Second click while in submitting state returns null (blocked)
      const secondAdmission = beginSubmission(firstAdmission!.nextState);
      expect(secondAdmission).toBeNull();
    });

    it('rejects empty or whitespace-only prompt', () => {
      let state = INITIAL_CANDIDATE_AI_STATE;
      state = setPromptText(state, '   \n  ');

      const admission = beginSubmission(state);
      expect(admission).toBeNull();
    });

    it('keeps clientRequestId stable across accidental rerenders during submission', () => {
      let state = INITIAL_CANDIDATE_AI_STATE;
      state = setPromptText(state, 'Stable request test');

      const firstAdmission = beginSubmission(state);
      const stableId = firstAdmission!.requestId;

      // Component re-renders with the same state: clientRequestId remains identical
      expect(firstAdmission!.nextState.clientRequestId).toBe(stableId);

      // If an accidental retry occurs using the in-progress state, it reuses the stable ID
      const retryAdmission = beginSubmission({
        ...firstAdmission!.nextState,
        submissionState: 'idle',
      });
      expect(retryAdmission!.requestId).toBe(stableId);
    });

    it('generates a fresh clientRequestId on explicit new request', () => {
      let state = INITIAL_CANDIDATE_AI_STATE;
      state = setPromptText(state, 'First attempt');

      const firstAdmission = beginSubmission(state);
      const firstId = firstAdmission!.requestId;

      // Request fails
      const failedState = resolveSubmissionResult(
        firstAdmission!.nextState,
        500,
        null,
      );
      expect(failedState.submissionState).toBe('failed');

      // Candidate clicks "Try new request"
      const resetState = startNewRequest(failedState);
      expect(resetState.submissionState).toBe('idle');
      expect(resetState.clientRequestId).toBeNull();
      // Prompt is preserved for candidate convenience
      expect(resetState.prompt).toBe('First attempt');

      // Second explicit submission receives a brand new ID
      const secondAdmission = beginSubmission(resetState);
      expect(secondAdmission).not.toBeNull();
      expect(secondAdmission!.requestId).not.toBe(firstId);
    });
  });

  describe('Server Response Mapping & Error Copy Truth', () => {
    it('transitions to completed on 200 with status COMPLETED', () => {
      let state = INITIAL_CANDIDATE_AI_STATE;
      state = setPromptText(state, 'What is the root cause?');
      const admission = beginSubmission(state)!;

      const completedState = resolveSubmissionResult(admission.nextState, 200, {
        status: 'COMPLETED',
        responseText: 'The cache invalidation event was omitted.',
        configuredModelId: 'mock-chat-v1',
      });

      expect(completedState.submissionState).toBe('completed');
      expect(completedState.completedInteraction).toEqual({
        prompt: 'What is the root cause?',
        responseText: 'The cache invalidation event was omitted.',
      });
      expect(completedState.errorMessage).toBeNull();
    });

    it('transitions to failed with factual timeout copy when terminalReason is TIMEOUT', () => {
      let state = INITIAL_CANDIDATE_AI_STATE;
      state = setPromptText(state, 'Query that times out');
      const admission = beginSubmission(state)!;

      const timeoutState = resolveSubmissionResult(admission.nextState, 200, {
        status: 'FAILED',
        terminalReason: 'TIMEOUT',
        errorMessage: 'Timed out',
      });

      expect(timeoutState.submissionState).toBe('failed');
      expect(timeoutState.errorMessage).toBe('The AI request timed out.');
    });

    it('transitions to failed with factual provider error copy when provider fails', () => {
      let state = INITIAL_CANDIDATE_AI_STATE;
      state = setPromptText(state, 'Failing query');
      const admission = beginSubmission(state)!;

      const providerFailState = resolveSubmissionResult(
        admission.nextState,
        200,
        {
          status: 'FAILED',
          terminalReason: 'PROVIDER_ERROR',
          errorMessage: 'Internal upstream error',
        },
      );

      expect(providerFailState.submissionState).toBe('failed');
      expect(providerFailState.errorMessage).toBe(
        'The AI provider returned an error.',
      );
    });

    it('transitions to ambiguous on 409 AMBIGUOUS_DISPATCH and does not auto-replay', () => {
      let state = INITIAL_CANDIDATE_AI_STATE;
      state = setPromptText(state, 'Ambiguous dispatch query');
      const admission = beginSubmission(state)!;

      const ambiguousState = resolveSubmissionResult(admission.nextState, 409, {
        error: { code: 'AMBIGUOUS_DISPATCH', message: 'In flight' },
      });

      expect(ambiguousState.submissionState).toBe('ambiguous');
      expect(ambiguousState.errorMessage).toBe(
        'This request was already submitted, but Delimit cannot safely determine whether the provider completed it. Start a new request if you want to try again.',
      );

      // Verify explicit new request resets state cleanly
      const resetState = startNewRequest(ambiguousState);
      expect(resetState.submissionState).toBe('idle');
      expect(resetState.clientRequestId).toBeNull();
    });

    it('handles network error safely with factual error copy', () => {
      let state = INITIAL_CANDIDATE_AI_STATE;
      state = setPromptText(state, 'Network test');
      const admission = beginSubmission(state)!;

      const networkErrorState = resolveSubmissionNetworkError(
        admission.nextState,
      );
      expect(networkErrorState.submissionState).toBe('failed');
      expect(networkErrorState.errorMessage).toBe(
        'The AI provider returned an error.',
      );
    });
  });

  describe('Workspace Context Management', () => {
    it('attaches and removes workspace context references', () => {
      let state = INITIAL_CANDIDATE_AI_STATE;
      state = addContextAttachment(state, 'inventory/service.py');
      state = addContextAttachment(state, 'inventory/cache.py');

      expect(state.selectedContext).toEqual([
        { filePath: 'inventory/service.py' },
        { filePath: 'inventory/cache.py' },
      ]);

      // Adding duplicate is a no-op
      state = addContextAttachment(state, 'inventory/service.py');
      expect(state.selectedContext).toHaveLength(2);

      // Remove attachment
      state = removeContextAttachment(state, 'inventory/service.py');
      expect(state.selectedContext).toEqual([
        { filePath: 'inventory/cache.py' },
      ]);
    });

    it('does not allow context removal while in flight', () => {
      let state = INITIAL_CANDIDATE_AI_STATE;
      state = setPromptText(state, 'Prompt');
      state = addContextAttachment(state, 'inventory/cache.py');

      const admission = beginSubmission(state)!;
      expect(admission.nextState.submissionState).toBe('submitting');

      const attemptRemove = removeContextAttachment(
        admission.nextState,
        'inventory/cache.py',
      );
      expect(attemptRemove.selectedContext).toHaveLength(1);
    });
  });

  describe('Absence of Causal Language', () => {
    it('ensures rendered UI does not contain forbidden causal terms', () => {
      const activeStateWithResponse = {
        ...INITIAL_CANDIDATE_AI_STATE,
        submissionState: 'completed' as const,
        completedInteraction: {
          prompt: 'How do I fix cache invalidation?',
          responseText: 'Add an invalidate call after database write.',
        },
      };

      const html = renderToStaticMarkup(
        <CandidateAiPanel
          token="test-token"
          sessionStatus="ACTIVE"
          aiCapability={{ enabled: true }}
          initialState={activeStateWithResponse}
        />,
      );

      const forbiddenWords = [
        'applied',
        'apply suggestion',
        'copied',
        'ai-authored',
        'generated change',
        'accepted suggestion',
      ];

      for (const word of forbiddenWords) {
        expect(html.toLowerCase()).not.toContain(word);
      }
    });
  });

  describe('Accessibility & Native Controls', () => {
    it('provides proper labels, semantic regions, and polite live status', () => {
      const submittingState = {
        ...INITIAL_CANDIDATE_AI_STATE,
        prompt: 'Active query',
        submissionState: 'submitting' as const,
      };

      const html = renderToStaticMarkup(
        <CandidateAiPanel
          token="test-token"
          sessionStatus="ACTIVE"
          aiCapability={{ enabled: true }}
          initialState={submittingState}
        />,
      );

      // Accessible label for prompt textarea
      expect(html).toContain('for="candidate-ai-prompt"');
      expect(html).toContain(
        'aria-label="Write a request for the AI assistant"',
      );

      // Native submit button disabled with loading text
      expect(html).toContain('disabled=""');
      expect(html).toContain('Waiting for AI response…');

      // Polite live region for screen readers
      expect(html).toContain('role="status"');
      expect(html).toContain('aria-live="polite"');
    });

    it('renders error states with alert role', () => {
      const failedState = {
        ...INITIAL_CANDIDATE_AI_STATE,
        submissionState: 'failed' as const,
        errorMessage: 'The AI provider returned an error.',
      };

      const html = renderToStaticMarkup(
        <CandidateAiPanel
          token="test-token"
          sessionStatus="ACTIVE"
          aiCapability={{ enabled: true }}
          initialState={failedState}
        />,
      );

      expect(html).toContain('role="alert"');
      expect(html).toContain('The AI provider returned an error.');
      expect(html).toContain('Try new request');
    });
  });

  describe('Prompt Length Contract & Single Source of Truth', () => {
    it('uses the authoritative domain MAXIMUM_PROMPT_LENGTH as the single source of truth', () => {
      // The UI state constant must strictly derive from the domain module constant
      expect(MAXIMUM_PROMPT_CHARS).toBe(MAXIMUM_PROMPT_LENGTH);
      expect(MAXIMUM_PROMPT_CHARS).toBe(32_768);
    });

    it('binds candidate textarea maxLength directly to the authoritative boundary', () => {
      const html = renderToStaticMarkup(
        <CandidateAiPanel
          token="test-token"
          sessionStatus="ACTIVE"
          aiCapability={{ enabled: true }}
        />,
      );

      // Verify the textarea has maxLength matching authoritative domain boundary
      expect(html).toContain(`maxLength="${MAXIMUM_PROMPT_LENGTH}"`);
    });
  });
});
