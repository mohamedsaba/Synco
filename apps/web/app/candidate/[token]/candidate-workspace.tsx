'use client';

import { useState } from 'react';

import type { toCandidateSessionView } from '../../../src/sessions/candidate-session-view';

type CandidateSessionView = ReturnType<typeof toCandidateSessionView>;

type CandidateWorkspaceProps = Readonly<{
  initialSession: CandidateSessionView;
  token: string;
}>;

type ApiError = Readonly<{
  error?: { message?: string };
}>;

export const CandidateWorkspace = ({
  initialSession,
  token,
}: CandidateWorkspaceProps) => {
  const [session, setSession] = useState(initialSession);
  const [content, setContent] = useState(initialSession.workingContent);
  const [notice, setNotice] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const request = async (path: string, init: RequestInit = {}) => {
    const response = await fetch(
      `/api/candidate/sessions/${token}${path}`,
      init,
    );
    if (!response.ok) {
      const result = (await response.json()) as ApiError;
      throw new Error(
        result.error?.message ?? 'The request could not be completed.',
      );
    }

    return (await response.json()) as CandidateSessionView;
  };

  const runAction = async (action: () => Promise<void>) => {
    setIsBusy(true);
    setNotice(null);
    try {
      await action();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'The request failed.');
    } finally {
      setIsBusy(false);
    }
  };

  const activate = () =>
    runAction(async () => {
      const nextSession = await request('/activate', { method: 'POST' });
      setSession(nextSession);
      setNotice('Session active. Editing is now enabled.');
    });

  const save = () =>
    runAction(async () => {
      const nextSession = await request('/file', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      setSession(nextSession);
      setIsDirty(false);
      setNotice('Saved to the server.');
    });

  const submit = () =>
    runAction(async () => {
      if (isDirty) {
        await request('/file', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
      }

      const nextSession = await request('/submit', { method: 'POST' });
      setSession(nextSession);
      setIsDirty(false);
      setNotice('Submitted. This file is now immutable.');
    });

  const isActive = session.status === 'ACTIVE';
  const isSubmitted = session.status === 'SUBMITTED';

  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <div>
          <p className="eyebrow">Candidate workspace</p>
          <p className="session-reference">Session {session.id}</p>
        </div>
        <span className={`status status-${session.status.toLowerCase()}`}>
          {session.status}
        </span>
      </header>

      <div className="workspace-grid">
        <section className="brief-panel" aria-labelledby="scenario-title">
          <p className="fixture-label">
            Slice 1 fixture · v{session.scenario.version}
          </p>
          <h1 id="scenario-title">{session.scenario.title}</h1>
          <p className="brief-copy">{session.scenario.brief}</p>

          <h2>Expected behavior</h2>
          <ul className="criteria-list">
            {session.scenario.acceptanceCriteria.map((criterion) => (
              <li key={criterion}>{criterion}</li>
            ))}
          </ul>

          <div className="capture-note">
            This slice records only saved file content and the submitted
            snapshot. It does not include terminal, AI, analytics, or device
            monitoring.
          </div>
        </section>

        <section className="editor-panel" aria-labelledby="file-name">
          <div className="file-bar">
            <div>
              <span className="file-kicker">Permitted file</span>
              <h2 id="file-name">{session.scenario.filePath}</h2>
            </div>
            {isDirty ? <span className="unsaved">Unsaved</span> : null}
          </div>

          <textarea
            aria-label={`Edit ${session.scenario.filePath}`}
            disabled={!isActive || isBusy}
            onChange={(event) => {
              setContent(event.target.value);
              setIsDirty(true);
              setNotice(null);
            }}
            spellCheck={false}
            value={content}
          />

          <div className="editor-footer">
            <p className="editor-message" aria-live="polite">
              {notice ??
                (session.status === 'CREATED'
                  ? 'Review the brief, then start when ready.'
                  : isSubmitted
                    ? `Submitted ${new Date(session.submittedAt ?? '').toLocaleString()}.`
                    : 'Edits persist only after Save or Submit.')}
            </p>
            <div className="button-row">
              {session.status === 'CREATED' ? (
                <button
                  className="button button-primary"
                  disabled={isBusy}
                  onClick={activate}
                  type="button"
                >
                  Start session
                </button>
              ) : null}
              {isActive ? (
                <>
                  <button
                    className="button button-secondary"
                    disabled={isBusy || !isDirty}
                    onClick={save}
                    type="button"
                  >
                    Save
                  </button>
                  <button
                    className="button button-primary"
                    disabled={isBusy}
                    onClick={submit}
                    type="button"
                  >
                    Submit final file
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};
