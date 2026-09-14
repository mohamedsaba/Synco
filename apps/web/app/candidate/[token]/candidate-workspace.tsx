'use client';

import { useEffect, useState } from 'react';

import type {
  CommandExecResult,
  WorkspaceFileInfo,
} from '../../../src/sandbox/sandbox';
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
  const isMultiFile =
    session.scenarioType === 'multi_file' ||
    session.scenario.type === 'multi_file';

  const [workspaceFiles, setWorkspaceFiles] = useState<
    readonly WorkspaceFileInfo[]
  >([]);
  const [selectedFile, setSelectedFile] = useState<string>(
    session.scenario.filePath || 'inventory/service.py',
  );

  const [content, setContent] = useState(initialSession.workingContent);
  const [notice, setNotice] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Command console state
  const [commandInput, setCommandInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [commandHistory, setCommandHistory] = useState<ExecutedCommand[]>([]);

  const refreshFiles = async () => {
    try {
      const response = await fetch(
        `/api/candidate/sessions/${token}/workspace/tree`,
      );
      if (response.ok) {
        const data = (await response.json()) as {
          files: WorkspaceFileInfo[];
        };
        setWorkspaceFiles(data.files.filter((f) => !f.isDirectory));
      }
    } catch {
      // Ignore background refresh failure
    }
  };

  const loadFile = async (filePath: string) => {
    setIsBusy(true);
    setNotice(null);
    try {
      const response = await fetch(
        `/api/candidate/sessions/${token}/workspace/file?path=${encodeURIComponent(filePath)}`,
      );
      if (!response.ok) {
        const err = (await response.json()) as ApiError;
        throw new Error(err.error?.message ?? `Could not read ${filePath}`);
      }
      const data = (await response.json()) as {
        path: string;
        content: string;
      };
      setContent(data.content);
      setSelectedFile(data.path);
      setIsDirty(false);
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : `Failed to load ${filePath}`,
      );
    } finally {
      setIsBusy(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (session.status === 'ACTIVE' && isMultiFile) {
      void (async () => {
        try {
          const treeRes = await fetch(
            `/api/candidate/sessions/${token}/workspace/tree`,
          );
          if (treeRes.ok && active) {
            const treeData = (await treeRes.json()) as {
              files: WorkspaceFileInfo[];
            };
            const nonDirs = treeData.files.filter((f) => !f.isDirectory);
            setWorkspaceFiles(nonDirs);
          }

          const fileRes = await fetch(
            `/api/candidate/sessions/${token}/workspace/file?path=${encodeURIComponent(selectedFile)}`,
          );
          if (fileRes.ok && active) {
            const fileData = (await fileRes.json()) as {
              path: string;
              content: string;
            };
            setContent(fileData.content);
          }
        } catch {
          // Ignore background fetch error
        }
      })();
    }
    return () => {
      active = false;
    };
  }, [session.status, isMultiFile, token, selectedFile]);

  const handleSelectFile = async (filePath: string) => {
    if (filePath === selectedFile) return;
    if (isDirty) {
      // Auto-save current file before switching
      try {
        await fetch(`/api/candidate/sessions/${token}/workspace/file`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: selectedFile, content }),
        });
      } catch {
        // Continue switching even if auto-save fails
      }
    }
    await loadFile(filePath);
  };

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
      if (
        nextSession.scenarioType === 'multi_file' ||
        nextSession.scenario.type === 'multi_file'
      ) {
        const treeRes = await fetch(
          `/api/candidate/sessions/${token}/workspace/tree`,
        );
        if (treeRes.ok) {
          const treeData = (await treeRes.json()) as {
            files: WorkspaceFileInfo[];
          };
          const nonDirs = treeData.files.filter((f) => !f.isDirectory);
          setWorkspaceFiles(nonDirs);
          const initialPath =
            nextSession.scenario.filePath ||
            nonDirs[0]?.path ||
            'inventory/service.py';
          await loadFile(initialPath);
        }
      }
    });

  const save = () =>
    runAction(async () => {
      if (isMultiFile) {
        const res = await fetch(
          `/api/candidate/sessions/${token}/workspace/file`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: selectedFile, content }),
          },
        );
        if (!res.ok) {
          const err = (await res.json()) as ApiError;
          throw new Error(err.error?.message ?? 'Failed to save file.');
        }
        setIsDirty(false);
        setNotice(`Saved ${selectedFile} to container.`);
        await refreshFiles();
      } else {
        const nextSession = await request('/file', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
        setSession(nextSession);
        setIsDirty(false);
        setNotice('Saved to the server.');
      }
    });

  const submit = () =>
    runAction(async () => {
      if (isDirty) {
        if (isMultiFile) {
          await fetch(`/api/candidate/sessions/${token}/workspace/file`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: selectedFile, content }),
          });
        } else {
          await request('/file', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content }),
          });
        }
      }

      const nextSession = await request('/submit', { method: 'POST' });
      setSession(nextSession);
      setIsDirty(false);
      setNotice('Submitted. Sandbox terminated and files are now immutable.');
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
            {isMultiFile ? 'Scenario 001 fixture' : 'Slice 2 fixture'} · v
            {session.scenario.version}
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
            This scenario records saved workspace file mutations and
            authoritative command lifecycle events inside an isolated
            multi-service sandbox container. It does not include AI assistance
            or automated candidate evaluation.
          </div>
        </section>

        <section className="editor-panel" aria-labelledby="file-name">
          <div className="file-bar">
            <div>
              <span className="file-kicker">
                {isMultiFile ? 'Workspace file' : 'Permitted file'}
              </span>
              <h2 id="file-name">
                {isMultiFile ? selectedFile : session.scenario.filePath}
              </h2>
            </div>
            {isDirty ? <span className="unsaved">Unsaved</span> : null}
          </div>

          {isMultiFile && isActive && workspaceFiles.length > 0 ? (
            <div
              className="workspace-file-selector"
              role="tablist"
              aria-label="Workspace files"
            >
              {workspaceFiles.map((file) => (
                <button
                  key={file.path}
                  type="button"
                  role="tab"
                  aria-selected={file.path === selectedFile}
                  className={`file-tab ${file.path === selectedFile ? 'file-tab-active' : ''}`}
                  onClick={() => handleSelectFile(file.path)}
                  disabled={!isActive || isBusy}
                >
                  {file.path}
                </button>
              ))}
            </div>
          ) : null}

          <textarea
            aria-label={`Edit ${isMultiFile ? selectedFile : session.scenario.filePath}`}
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
                    {isMultiFile ? 'Submit assessment' : 'Submit final file'}
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
