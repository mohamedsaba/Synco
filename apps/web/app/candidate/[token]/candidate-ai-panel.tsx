'use client';

import { useState } from 'react';

import type { SessionStatus } from '../../../src/sessions/session';
import type { CandidateAiCapability } from '../../../src/sessions/candidate-session-view';
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
  type CandidateAiState,
  type ServerInteractionResponse,
} from './candidate-ai-state';

export type CandidateAiPanelProps = Readonly<{
  token: string;
  sessionStatus: SessionStatus;
  aiCapability: CandidateAiCapability | null;
  availableFiles?: readonly string[];
  onSubmissionChange?: (isSubmitting: boolean) => void;
  initialState?: CandidateAiState;
}>;

export const CandidateAiPanel = ({
  token,
  sessionStatus,
  aiCapability,
  availableFiles = [],
  onSubmissionChange,
  initialState = INITIAL_CANDIDATE_AI_STATE,
}: CandidateAiPanelProps) => {
  const [state, setState] = useState<CandidateAiState>(initialState);
  const [fileToAdd, setFileToAdd] = useState('');

  // Capability checks
  if (aiCapability === null) {
    return (
      <section className="candidate-ai-panel" aria-labelledby="ai-panel-title">
        <div className="ai-panel-header">
          <span className="file-kicker">Integrated capability</span>
          <h2 id="ai-panel-title">Engineering assistant</h2>
        </div>
        <div className="ai-notice-card" role="status">
          <p>Integrated AI assistance is unavailable for this assessment.</p>
        </div>
      </section>
    );
  }

  if (!aiCapability.enabled) {
    return (
      <section className="candidate-ai-panel" aria-labelledby="ai-panel-title">
        <div className="ai-panel-header">
          <span className="file-kicker">Integrated capability</span>
          <h2 id="ai-panel-title">Engineering assistant</h2>
        </div>
        <div className="ai-notice-card" role="status">
          <p>Integrated AI assistance is not enabled for this assessment.</p>
        </div>
      </section>
    );
  }

  if (sessionStatus === 'CREATED') {
    return (
      <section className="candidate-ai-panel" aria-labelledby="ai-panel-title">
        <div className="ai-panel-header">
          <span className="file-kicker">Integrated capability</span>
          <h2 id="ai-panel-title">Engineering assistant</h2>
        </div>
        <div className="ai-notice-card" role="status">
          <p>Start session to use integrated AI assistance.</p>
        </div>
      </section>
    );
  }

  if (sessionStatus === 'SUBMITTED' && !state.completedInteraction) {
    return (
      <section className="candidate-ai-panel" aria-labelledby="ai-panel-title">
        <div className="ai-panel-header">
          <span className="file-kicker">Integrated capability</span>
          <h2 id="ai-panel-title">Engineering assistant</h2>
        </div>
        <div className="ai-notice-card" role="status">
          <p>Assessment submitted. Integrated AI assistance is closed.</p>
        </div>
      </section>
    );
  }

  const isSubmitting = state.submissionState === 'submitting';

  const handleAddContext = () => {
    if (!fileToAdd) return;
    setState((prev) => addContextAttachment(prev, fileToAdd));
    setFileToAdd('');
  };

  const handleRemoveContext = (filePath: string) => {
    setState((prev) => removeContextAttachment(prev, filePath));
  };

  const handleStartNewRequest = () => {
    setState((prev) => startNewRequest(prev));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    const admission = beginSubmission(state);
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
            buildAiInteractionPayload(state, admission.requestId),
          ),
        },
      );

      const data = (await response
        .json()
        .catch(() => null)) as ServerInteractionResponse | null;
      setState((prev) => resolveSubmissionResult(prev, response.status, data));
    } catch {
      setState((prev) => resolveSubmissionNetworkError(prev));
    } finally {
      onSubmissionChange?.(false);
    }
  };

  const unselectedFiles = availableFiles.filter(
    (file) => !state.selectedContext.some((c) => c.filePath === file),
  );

  return (
    <section className="candidate-ai-panel" aria-labelledby="ai-panel-title">
      <div className="ai-panel-header">
        <span className="file-kicker">Integrated capability</span>
        <h2 id="ai-panel-title">Engineering assistant</h2>
      </div>

      {sessionStatus === 'SUBMITTED' && state.completedInteraction ? (
        <div className="ai-submitted-banner" role="status">
          <p>Assessment submitted. Integrated AI assistance is closed.</p>
        </div>
      ) : null}

      {/* Completed result presentation */}
      {state.submissionState === 'completed' && state.completedInteraction ? (
        <div className="ai-result-area" role="region" aria-label="AI response">
          <div className="ai-request-summary">
            <h3 className="ai-section-subtitle">Your request</h3>
            <pre className="activity-excerpt">
              {state.completedInteraction.prompt}
            </pre>
          </div>

          <div className="ai-response-summary">
            <h3 id="ai-response-heading" className="ai-section-subtitle">
              AI response
            </h3>
            <pre className="activity-excerpt ai-response-content">
              {state.completedInteraction.responseText}
            </pre>
          </div>

          {sessionStatus === 'ACTIVE' ? (
            <div className="ai-action-row">
              <button
                type="button"
                className="button button-secondary"
                onClick={handleStartNewRequest}
              >
                New request
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Failure / Timeout state */}
      {state.submissionState === 'failed' && state.errorMessage ? (
        <div role="alert" className="ai-error-state">
          <p className="ai-error-text">{state.errorMessage}</p>
          {sessionStatus === 'ACTIVE' ? (
            <div className="ai-action-row">
              <button
                type="button"
                className="button button-secondary"
                onClick={handleStartNewRequest}
              >
                Try new request
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Ambiguous dispatch state */}
      {state.submissionState === 'ambiguous' && state.errorMessage ? (
        <div role="alert" className="ai-error-state">
          <p className="ai-error-text">{state.errorMessage}</p>
          {sessionStatus === 'ACTIVE' ? (
            <div className="ai-action-row">
              <button
                type="button"
                className="button button-secondary"
                onClick={handleStartNewRequest}
              >
                Start new request
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Active composer (available when active and not showing completed response) */}
      {sessionStatus === 'ACTIVE' && state.submissionState !== 'completed' ? (
        <form className="ai-composer-form" onSubmit={handleSubmit}>
          {/* Workspace context selection */}
          <div className="ai-context-section">
            <span className="ai-field-label">Workspace context</span>

            {state.selectedContext.length > 0 ? (
              <div
                className="ai-context-list"
                aria-label="Selected workspace context"
              >
                {state.selectedContext.map((item) => (
                  <div key={item.filePath} className="ai-context-chip">
                    <span className="ai-context-label">
                      Context: {item.filePath}
                    </span>
                    <button
                      type="button"
                      className="ai-context-remove"
                      aria-label={`Remove context ${item.filePath}`}
                      onClick={() => handleRemoveContext(item.filePath)}
                      disabled={isSubmitting}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            {unselectedFiles.length > 0 ? (
              <div className="ai-context-picker">
                <select
                  aria-label="Select file context"
                  className="ai-context-select"
                  value={fileToAdd}
                  onChange={(e) => setFileToAdd(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="">Choose a workspace file…</option>
                  {unselectedFiles.map((file) => (
                    <option key={file} value={file}>
                      {file}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="button button-secondary ai-context-add-button"
                  onClick={handleAddContext}
                  disabled={!fileToAdd || isSubmitting}
                >
                  Add context
                </button>
              </div>
            ) : null}
          </div>

          {/* Prompt input */}
          <div className="ai-prompt-section">
            <label htmlFor="candidate-ai-prompt" className="ai-field-label">
              Request
            </label>
            <textarea
              id="candidate-ai-prompt"
              aria-label="Write a request for the AI assistant"
              className="ai-prompt-input"
              disabled={isSubmitting}
              maxLength={MAXIMUM_PROMPT_CHARS}
              onChange={(e) =>
                setState((prev) => setPromptText(prev, e.target.value))
              }
              placeholder="Ask questions about architecture, debugging, syntax, or test failures…"
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

          {/* Submit action */}
          <div className="ai-composer-footer">
            {isSubmitting ? (
              <div
                role="status"
                aria-live="polite"
                className="ai-submitting-status"
              >
                Waiting for AI response…
              </div>
            ) : null}

            <button
              type="submit"
              className="button button-primary ai-submit-button"
              disabled={isSubmitting || !state.prompt.trim()}
            >
              {isSubmitting ? 'Waiting for AI response…' : 'Submit request'}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
};
