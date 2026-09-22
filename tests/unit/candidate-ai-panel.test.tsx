import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { CandidateAiPanel } from '../../apps/web/app/candidate/[token]/candidate-ai-panel';
import {
  beginSubmission,
  buildAiInteractionPayload,
  INITIAL_CANDIDATE_AI_STATE,
  MAXIMUM_PROMPT_CHARS,
  resolveSubmissionNetworkError,
  resolveSubmissionResult,
  retryRequest,
  setPromptText,
  startNewRequest,
} from '../../apps/web/app/candidate/[token]/candidate-ai-state';
import { MAXIMUM_PROMPT_LENGTH } from '../../apps/web/src/ai/ai-interaction';

const activePanel = (initialState = INITIAL_CANDIDATE_AI_STATE) =>
  renderToStaticMarkup(
    <CandidateAiPanel
      activeFilePath="inventory/cache.py"
      aiCapability={{ enabled: true }}
      initialState={initialState}
      sessionStatus="ACTIVE"
      token="test-token"
    />,
  );

describe('C6 candidate integrated AI experience', () => {
  it('renders neutral permitted-tool framing and accessible controls', () => {
    const html = activePanel();

    expect(html).toContain('AI is part of the working environment.');
    expect(html).toContain('for="candidate-ai-prompt"');
    expect(html).toContain('>Send request</button>');
    expect(html).toContain('aria-describedby="candidate-ai-context"');
    expect(html).not.toContain('score');
    expect(html).not.toContain('cheat');
  });

  it('shows actual active-file context and unsaved-buffer boundary', () => {
    const html = activePanel();

    expect(html).toContain('Current file: inventory/cache.py.');
    expect(html).toContain(
      'File reference only; unsaved editor edits are not included.',
    );
  });

  it('shows no context when no active file exists', () => {
    const html = renderToStaticMarkup(
      <CandidateAiPanel
        aiCapability={{ enabled: true }}
        sessionStatus="ACTIVE"
        token="test-token"
      />,
    );

    expect(html).toContain('No active file is included.');
  });

  it('does not expose a composer when projected AI capability is unavailable', () => {
    const html = renderToStaticMarkup(
      <CandidateAiPanel
        activeFilePath="inventory/cache.py"
        aiCapability={{ enabled: true }}
        canUseAi={false}
        sessionStatus="ACTIVE"
        token="test-token"
      />,
    );

    expect(html).toContain(
      'AI is unavailable while the assessment is not active.',
    );
    expect(html).not.toContain('id="candidate-ai-prompt"');
  });

  it('shows the projected deadline reason without changing server session truth', () => {
    const html = renderToStaticMarkup(
      <CandidateAiPanel
        aiCapability={{ enabled: true }}
        canUseAi={false}
        sessionStatus="ACTIVE"
        token="test-token"
        unavailableMessage="The assessment time limit has been reached. AI is unavailable."
      />,
    );

    expect(html).toContain(
      'The assessment time limit has been reached. AI is unavailable.',
    );
  });

  it('renders session-finality state truthfully', () => {
    const html = renderToStaticMarkup(
      <CandidateAiPanel
        aiCapability={{ enabled: true }}
        sessionStatus="SUBMITTED"
        token="test-token"
      />,
    );

    expect(html).toContain(
      'Assessment submitted. Integrated AI assistance is closed.',
    );
    expect(html).not.toContain('id="candidate-ai-prompt"');
  });

  it('rejects an empty prompt before request admission', () => {
    expect(beginSubmission(INITIAL_CANDIDATE_AI_STATE, [])).toBeNull();
    expect(
      beginSubmission(setPromptText(INITIAL_CANDIDATE_AI_STATE, '  '), []),
    ).toBeNull();
  });

  it('captures prompt and active-file context under one stable request identity', () => {
    const state = setPromptText(
      INITIAL_CANDIDATE_AI_STATE,
      'Inspect cache behavior',
    );
    const admission = beginSubmission(
      state,
      [{ filePath: 'inventory/cache.py' }],
      'client_req_1',
    );

    expect(admission?.nextState.conversation).toEqual([
      {
        requestId: 'client_req_1',
        prompt: 'Inspect cache behavior',
        context: [{ filePath: 'inventory/cache.py' }],
        status: 'submitting',
      },
    ]);
    expect(
      buildAiInteractionPayload(state, 'client_req_1', [
        { filePath: 'inventory/cache.py' },
      ]),
    ).toEqual({
      clientRequestId: 'client_req_1',
      candidatePromptText: 'Inspect cache behavior',
      candidateContext: [{ filePath: 'inventory/cache.py' }],
    });
  });

  it('prevents duplicate admission while a request is in flight', () => {
    const submitted = beginSubmission(
      setPromptText(INITIAL_CANDIDATE_AI_STATE, 'One request'),
      [],
      'client_req_1',
    )?.nextState;

    expect(submitted).toBeDefined();
    expect(beginSubmission(submitted!, [])).toBeNull();
  });

  it('associates response with its own prompt and preserves prior history', () => {
    const first = beginSubmission(
      setPromptText(INITIAL_CANDIDATE_AI_STATE, 'First prompt'),
      [{ filePath: 'one.ts' }],
      'client_req_1',
    )!;
    const firstDone = resolveSubmissionResult(first.nextState, 200, {
      status: 'COMPLETED',
      responseText: 'First answer',
    });
    const second = beginSubmission(
      setPromptText(startNewRequest(firstDone), 'Second prompt'),
      [{ filePath: 'two.ts' }],
      'client_req_2',
    )!;
    const secondDone = resolveSubmissionResult(second.nextState, 200, {
      status: 'COMPLETED',
      responseText: 'Second answer',
    });

    expect(secondDone.conversation).toEqual([
      expect.objectContaining({
        prompt: 'First prompt',
        responseText: 'First answer',
      }),
      expect.objectContaining({
        prompt: 'Second prompt',
        responseText: 'Second answer',
      }),
    ]);
  });

  it('keeps prompt and conversation after provider or network failures', () => {
    const admitted = beginSubmission(
      setPromptText(INITIAL_CANDIDATE_AI_STATE, 'Preserve this prompt'),
      [],
      'client_req_1',
    )!;
    const providerFailure = resolveSubmissionResult(
      admitted.nextState,
      500,
      null,
    );
    const networkFailure = resolveSubmissionNetworkError(admitted.nextState);

    expect(providerFailure.prompt).toBe('Preserve this prompt');
    expect(providerFailure.conversation[0]).toMatchObject({ status: 'failed' });
    expect(networkFailure.errorMessage).toBe(
      'Delimit could not reach AI. Try again.',
    );
  });

  it('treats a completed response without text as a platform failure', () => {
    const admitted = beginSubmission(
      setPromptText(INITIAL_CANDIDATE_AI_STATE, 'Malformed result'),
      [],
    )!;
    const state = resolveSubmissionResult(admitted.nextState, 200, {
      status: 'COMPLETED',
    });

    expect(state.errorMessage).toBe(
      'Delimit received an incomplete AI result. Try again.',
    );
  });

  it('maps deadline, inactive-session, and cancelled responses truthfully', () => {
    const admitted = beginSubmission(
      setPromptText(INITIAL_CANDIDATE_AI_STATE, 'Finality'),
      [],
    )!;

    expect(
      resolveSubmissionResult(admitted.nextState, 409, {
        error: { code: 'SESSION_DEADLINE_EXCEEDED' },
      }).errorMessage,
    ).toContain('time limit');
    expect(
      resolveSubmissionResult(admitted.nextState, 409, {
        error: { code: 'SESSION_NOT_ACTIVE' },
      }).errorMessage,
    ).toContain('no longer active');
    expect(
      resolveSubmissionResult(admitted.nextState, 409, {
        error: { code: 'SESSION_FINALIZATION_STARTED' },
      }).errorMessage,
    ).toContain('finalization has started');
    expect(
      resolveSubmissionResult(admitted.nextState, 200, {
        status: 'CANCELLED',
        terminalReason: 'session_ended',
      }).errorMessage,
    ).toContain('no longer active');
  });

  it('uses a fresh identity only after explicit retry', () => {
    const admitted = beginSubmission(
      setPromptText(INITIAL_CANDIDATE_AI_STATE, 'Retry prompt'),
      [],
      'client_req_1',
    )!;
    const failed = resolveSubmissionResult(admitted.nextState, 500, null);
    const retried = retryRequest(failed);
    const retry = beginSubmission(retried, [], 'client_req_2');

    expect(retried.prompt).toBe('Retry prompt');
    expect(retry?.requestId).toBe('client_req_2');
    expect(retry?.nextState.conversation).toHaveLength(2);
  });

  it('renders response text safely and avoids noisy live conversation semantics', () => {
    const html = activePanel({
      ...INITIAL_CANDIDATE_AI_STATE,
      conversation: [
        {
          requestId: 'client_req_1',
          prompt: '<img src=x>',
          context: [],
          status: 'completed',
          responseText: '<script>alert(1)</script>',
        },
      ],
      submissionState: 'completed',
    });

    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('aria-label="AI conversation"');
    expect(html).not.toContain('aria-live=');
  });

  it('keeps the local-only refresh boundary and source prompt limit visible', () => {
    const html = activePanel();

    expect(html).toContain('Refreshing does not restore it.');
    expect(MAXIMUM_PROMPT_CHARS).toBe(MAXIMUM_PROMPT_LENGTH);
    expect(html).toContain(`maxLength="${MAXIMUM_PROMPT_LENGTH}"`);
  });
});
