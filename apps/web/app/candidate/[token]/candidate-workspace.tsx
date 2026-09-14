'use client';

import { useState } from 'react';

import type { CommandExecResult } from '../../../src/sandbox/sandbox';
import type { toCandidateSessionView } from '../../../src/sessions/candidate-session-view';

type CandidateSessionView = ReturnType<typeof toCandidateSessionView>;

type CandidateWorkspaceProps = Readonly<{
  initialSession: CandidateSessionView;
  token: string;
}>;

type ApiError = Readonly<{
  error?: { message?: string };
}>;

type ExecutedCommand = Readonly<{
  command: string;
  result: CommandExecResult;
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

  // Command console state
  const [commandInput, setCommandInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [commandHistory, setCommandHistory] = useState<ExecutedCommand[]>([]);

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
      setNotice('Session active. Sandbox is ready and editing is enabled.');
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
      setNotice('Submitted. Sandbox terminated and file is now immutable.');
    });

  const executeCommand = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cmd = commandInput.trim();
    if (!cmd || isExecuting || session.status !== 'ACTIVE') return;

    setIsExecuting(true);
    setNotice(null);
    try {
      const response = await fetch(
        `/api/candidate/sessions/${token}/terminal/exec`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: cmd }),
        },
      );

      if (!response.ok) {
        const errorJson = (await response.json()) as ApiError;
        throw new Error(
          errorJson.error?.message ?? 'Command execution failed.',
        );
      }

      const result = (await response.json()) as CommandExecResult;
      setCommandHistory((prev) => [...prev, { command: cmd, result }]);
      setCommandInput('');
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : 'Command execution failed.',
      );
    } finally {
      setIsExecuting(false);
    }
  };

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
            Slice 2 fixture · v{session.scenario.version}
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
            This slice records saved file snapshots and authoritative command
            lifecycle events inside an isolated sandbox container. It does not
            include AI assistance or automated candidate evaluation.
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

          {/* Sandbox command console */}
          <div className="terminal-panel" aria-labelledby="terminal-title">
            <div className="terminal-header">
              <h3 id="terminal-title">Sandbox command console</h3>
              <span className="file-kicker">
                {isActive
                  ? 'Isolated sandbox active (--network none)'
                  : isSubmitted
                    ? 'Sandbox terminated'
                    : 'Sandbox inactive'}
              </span>
            </div>

            <form className="terminal-form" onSubmit={executeCommand}>
              <span className="terminal-prompt">$</span>
              <input
                aria-label="Sandbox shell command"
                className="terminal-input"
                disabled={!isActive || isExecuting}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder={
                  isActive
                    ? 'e.g. ls -la, pwd, cat src/format-greeting.ts'
                    : 'Start session to execute commands'
                }
                type="text"
                value={commandInput}
              />
              <button
                className="terminal-button"
                disabled={!isActive || isExecuting || !commandInput.trim()}
                type="submit"
              >
                {isExecuting ? 'Running…' : 'Run'}
              </button>
            </form>

            {commandHistory.length > 0 ? (
              <div className="terminal-log" role="log">
                {commandHistory.map((item, idx) => (
                  <div
                    className="command-entry"
                    key={item.result.commandId ?? idx}
                  >
                    <div className="command-meta">
                      <span className="command-text">$ {item.command}</span>
                      {item.result.timedOut ? (
                        <span className="badge badge-timeout">Timed out</span>
                      ) : item.result.exitCode === 0 ? (
                        <span className="badge badge-success">Exit 0</span>
                      ) : (
                        <span className="badge badge-error">
                          Exit {item.result.exitCode}
                        </span>
                      )}
                      <span>{item.result.durationMs}ms</span>
                      {item.result.stdoutTruncated ? (
                        <span className="badge badge-truncated">
                          stdout truncated ({item.result.stdoutBytes} B)
                        </span>
                      ) : null}
                      {item.result.stderrTruncated ? (
                        <span className="badge badge-truncated">
                          stderr truncated ({item.result.stderrBytes} B)
                        </span>
                      ) : null}
                    </div>

                    {item.result.stdoutPreview ? (
                      <pre className="command-output">
                        {item.result.stdoutPreview}
                      </pre>
                    ) : null}

                    {item.result.stderrPreview ? (
                      <pre className="command-output stderr">
                        {item.result.stderrPreview}
                      </pre>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
};
