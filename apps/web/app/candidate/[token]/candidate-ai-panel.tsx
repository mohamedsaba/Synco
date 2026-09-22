'use client';

import { useState } from 'react';

import type { SessionStatus } from '../../../src/sessions/session';
import type { CandidateAiCapability } from '../../../src/sessions/candidate-session-view';
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
  type CandidateAiState,
  type ServerInteractionResponse,
} from './candidate-ai-state';

export type CandidateAiPanelProps = Readonly<{
  token: string;
  sessionStatus: SessionStatus;
  aiCapability: CandidateAiCapability | null;
  activeFilePath?: string;
  canUseAi?: boolean;
  unavailableMessage?: string;
  onSubmissionChange?: (isSubmitting: boolean) => void;
  initialState?: CandidateAiState;
}>;

export const CandidateAiPanel = ({
  token,
  sessionStatus,
  aiCapability,
  activeFilePath,
  canUseAi = sessionStatus === 'ACTIVE',
  unavailableMessage,
  onSubmissionChange,
  initialState = INITIAL_CANDIDATE_AI_STATE,
}: CandidateAiPanelProps) => {
  const [state, setState] = useState<CandidateAiState>(initialState);
  const isSubmitting = state.submissionState === 'submitting';
  const context = activeFilePath ? [{ filePath: activeFilePath }] : [];

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!canUseAi || isSubmitting) return;

    const admission = beginSubmission(state, context);
    if (!admission) return;

    setState(admission.nextState);
    onSubmissionChange?.(true);

    try {
      const response = await fetch(
        `/api/candidate/sessions/${token}/ai/interactions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            buildAiInteractionPayload(state, admission.requestId, context),
          ),
        },
      );
      const data = (await response
        .json()
        .catch(() => null)) as ServerInteractionResponse | null;
      setState((previous) =>
        resolveSubmissionResult(previous, response.status, data),
      );
    } catch {
      setState((previous) => resolveSubmissionNetworkError(previous));
    } finally {
      onSubmissionChange?.(false);
    }
  };

  const availabilityMessage = !aiCapability
    ? 'Integrated AI assistance is unavailable for this assessment.'
    : !aiCapability.enabled
      ? 'Integrated AI assistance is not enabled for this assessment.'
      : sessionStatus === 'CREATED'
        ? 'Start the assessment to use integrated AI assistance.'
        : sessionStatus === 'SUBMITTED'
          ? 'Assessment submitted. Integrated AI assistance is closed.'
          : (unavailableMessage ??
            'AI is unavailable while the assessment is not active.');

  const showComposer = aiCapability?.enabled && canUseAi;

  return (
    <section className="candidate-ai-panel" aria-labelledby="ai-panel-title">
      <div className="ai-panel-header">
        <span className="file-kicker">Integrated tool</span>
        <h2 id="ai-panel-title">Engineering assistant</h2>
        <p className="ai-panel-description">
          AI is part of the working environment. You remain responsible for
          submitted work.
        </p>
      </div>

      {state.conversation.length > 0 ? (
        <ol className="ai-conversation" aria-label="AI conversation">
          {state.conversation.map((entry) => (
            <li className="ai-conversation-entry" key={entry.requestId}>
              <section aria-label="Your request">
                <h3 className="ai-section-subtitle">Your request</h3>
                <pre className="activity-excerpt">{entry.prompt}</pre>
                <p className="ai-context-summary">
                  {entry.context.length > 0
                    ? `Included context: ${entry.context.map((item) => item.filePath).join(', ')}. File references only; unsaved editor edits are not included.`
                    : 'Included context: none.'}
                  {
                    ' Delimit also includes assessment metadata for this request.'
                  }
                </p>
              </section>

              {entry.status === 'submitting' ? (
                <p className="ai-submitting-status" role="status">
                  AI is preparing a response for this request.
                </p>
              ) : null}

              {entry.status === 'completed' ? (
                <section aria-label="AI response">
                  <h3 className="ai-section-subtitle">AI response</h3>
                  <pre className="activity-excerpt ai-response-content">
                    {entry.responseText}
                  </pre>
                </section>
              ) : null}

              {entry.status === 'failed' || entry.status === 'ambiguous' ? (
                <p className="ai-error-text" role="alert">
                  {entry.errorMessage}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}

      {!showComposer ? (
        <div className="ai-notice-card" role="status">
          <p>{availabilityMessage}</p>
        </div>
      ) : null}

      {showComposer && state.submissionState === 'completed' ? (
        <div className="ai-action-row">
          <button
            className="button button-secondary"
            onClick={() => setState((previous) => startNewRequest(previous))}
            type="button"
          >
            New request
          </button>
        </div>
      ) : null}

      {showComposer &&
      (state.submissionState === 'failed' ||
        state.submissionState === 'ambiguous') ? (
        <div className="ai-action-row">
          <button
            className="button button-secondary"
            onClick={() => setState((previous) => retryRequest(previous))}
            type="button"
          >
            Retry request
          </button>
        </div>
      ) : null}

      {showComposer &&
      state.submissionState !== 'completed' &&
      state.submissionState !== 'failed' &&
      state.submissionState !== 'ambiguous' ? (
        <form className="ai-composer-form" onSubmit={handleSubmit}>
          <div className="ai-context-section" id="candidate-ai-context">
            <span className="ai-field-label">Included context</span>
            <p className="ai-context-summary">
              {activeFilePath
                ? `Current file: ${activeFilePath}. File reference only; unsaved editor edits are not included.`
                : 'No active file is included.'}
              {' Delimit also includes assessment metadata for this request.'}
            </p>
          </div>

          <div className="ai-prompt-section">
            <label htmlFor="candidate-ai-prompt" className="ai-field-label">
              Request
            </label>
            <textarea
              aria-describedby="candidate-ai-context"
              className="ai-prompt-input"
              disabled={isSubmitting}
              id="candidate-ai-prompt"
              maxLength={MAXIMUM_PROMPT_CHARS}
              onChange={(event) =>
                setState((previous) =>
                  setPromptText(previous, event.target.value),
                )
              }
              placeholder="Ask about the work in this assessment…"
              rows={4}
              value={state.prompt}
            />
            {state.prompt.length > 28_000 ? (
              <span className="ai-char-counter">
                {state.prompt.length.toLocaleString()} /{' '}
                {MAXIMUM_PROMPT_CHARS.toLocaleString()} characters
              </span>
            ) : null}
          </div>

          <div className="ai-composer-footer">
            <button
              className="button button-primary ai-submit-button"
              disabled={isSubmitting || !state.prompt.trim()}
              type="submit"
            >
              {isSubmitting ? 'Preparing response…' : 'Send request'}
            </button>
          </div>
        </form>
      ) : null}

      {showComposer ? (
        <p className="ai-local-notice">
          Conversation history stays in this browser while this page remains
          open. Refreshing does not restore it.
        </p>
      ) : null}
    </section>
  );
};
