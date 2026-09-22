'use client';

import { useEffect, useRef, useState } from 'react';

import type {
  CommandExecResult,
  WorkspaceFileInfo,
} from '../../../src/sandbox/sandbox';
import type { CandidateSessionView } from '../../../src/sessions/candidate-session-view';
import { useCandidateSession } from '../../../src/candidate/use-candidate-session';
import { CandidateAiPanel } from './candidate-ai-panel';
import { CandidatePrestart } from './candidate-prestart';
import {
  deriveEditorPersistenceState,
  editorPersistenceMessage,
} from './editor-persistence';
import {
  executeFileSwitch,
  executeSubmitAssessment,
  formatSaveFailureBeforeSubmit,
  formatSaveFailureBeforeSwitch,
} from './candidate-workspace-actions';

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

type WorkspacePanel = 'scenario' | 'files' | 'editor' | 'commands' | 'ai';

const formatRemainingTime = (remainingMs: number | null): string => {
  if (remainingMs === null) return 'Untimed';

  const remainingSeconds = Math.floor(remainingMs / 1_000);
  const hours = Math.floor(remainingSeconds / 3_600);
  const minutes = Math.floor((remainingSeconds % 3_600) / 60);
  const seconds = remainingSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
};

export const CandidateWorkspace = ({
  initialSession,
  token,
}: CandidateWorkspaceProps) => {
  const {
    serverSession: session,
    projection,
    updateServerSession: setSession,
    uiMode,
    setUiMode,
  } = useCandidateSession({
    initialSession,
    token,
  });
  const isMultiFile =
    session.scenarioType === 'multi_file' ||
    session.scenario.type === 'multi_file';

  const [workspaceFiles, setWorkspaceFiles] = useState<
    readonly WorkspaceFileInfo[]
  >([]);
  const [selectedFile, setSelectedFile] = useState<string>(
    session.scenario.filePath || 'inventory/service.py',
  );

  const availableFiles = Array.from(
    new Set(
      [
        ...workspaceFiles.map((f) => f.path),
        selectedFile,
        session.scenario.filePath,
      ].filter((p): p is string => Boolean(p && typeof p === 'string')),
    ),
  );

  const [content, setContent] = useState(initialSession.workingContent);
  const [persistedContent, setPersistedContent] = useState(
    initialSession.workingContent,
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFailure, setSaveFailure] = useState<Error | null>(null);
  const [activeWorkspacePanel, setActiveWorkspacePanel] =
    useState<WorkspacePanel>('editor');

  // Command console state
  const [commandInput, setCommandInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [commandHistory, setCommandHistory] = useState<ExecutedCommand[]>([]);

  // Pre-start / Activation state
  const [isActivating, setIsActivating] = useState(false);
  const [provisioningError, setProvisioningError] = useState<string | null>(
    null,
  );
  const workspaceHeadingRef = useRef<HTMLHeadingElement>(null);
  const workspacePanelRefs = useRef<
    Partial<Record<WorkspacePanel, HTMLElement>>
  >({});
  const prevUxStateRef = useRef(projection.uxState);
  const contentRef = useRef(content);
  const selectedFileRef = useRef(selectedFile);
  const saveInFlightRef = useRef<Promise<boolean> | null>(null);

  const replaceEditorContent = (nextContent: string) => {
    contentRef.current = nextContent;
    setContent(nextContent);
    setPersistedContent(nextContent);
    setSaveFailure(null);
  };

  const updateEditorContent = (nextContent: string) => {
    contentRef.current = nextContent;
    setContent(nextContent);
  };

  const updateSelectedFile = (nextFile: string) => {
    selectedFileRef.current = nextFile;
    setSelectedFile(nextFile);
  };

  const persistenceState = deriveEditorPersistenceState({
    content,
    persistedContent,
    isSaving,
    saveFailed: saveFailure !== null,
  });
  const isDirty = content !== persistedContent;

  // Focus management: shift focus to workspace heading upon entering ACTIVE_WORKSPACE
  useEffect(() => {
    if (
      prevUxStateRef.current !== 'ACTIVE_WORKSPACE' &&
      projection.uxState === 'ACTIVE_WORKSPACE'
    ) {
      workspaceHeadingRef.current?.focus();
    }
    prevUxStateRef.current = projection.uxState;
  }, [projection.uxState]);

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

  const fetchAndDisplayFile = async (filePath: string) => {
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
    replaceEditorContent(data.content);
    updateSelectedFile(data.path);
  };

  const loadFile = async (filePath: string) => {
    setIsBusy(true);
    setNotice(null);
    try {
      await fetchAndDisplayFile(filePath);
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
    const initialContent = contentRef.current;
    const initialFile = selectedFileRef.current;
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
            `/api/candidate/sessions/${token}/workspace/file?path=${encodeURIComponent(initialFile)}`,
          );
          if (
            fileRes.ok &&
            active &&
            selectedFileRef.current === initialFile &&
            contentRef.current === initialContent
          ) {
            const fileData = (await fileRes.json()) as {
              path: string;
              content: string;
            };
            replaceEditorContent(fileData.content);
          }
        } catch {
          // Ignore background fetch error
        }
      })();
    }
    return () => {
      active = false;
    };
  }, [session.status, isMultiFile, token]);

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

  const saveCurrentFile = (): Promise<boolean> => {
    if (saveInFlightRef.current) return saveInFlightRef.current;

    const savedContent = contentRef.current;
    const savedFile = selectedFileRef.current;
    setIsSaving(true);
    setSaveFailure(null);

    const saveAttempt = (async () => {
      try {
        let serverContent: string;
        if (isMultiFile) {
          const res = await fetch(
            `/api/candidate/sessions/${token}/workspace/file`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path: savedFile, content: savedContent }),
            },
          );
          if (!res.ok) {
            const err = (await res.json()) as ApiError;
            throw new Error(err.error?.message ?? 'Failed to save file.');
          }
          serverContent = ((await res.json()) as { content: string }).content;
          await refreshFiles();
        } else {
          const nextSession = await request('/file', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: savedContent }),
          });
          setSession(nextSession);
          serverContent = nextSession.workingContent;
        }

        setPersistedContent(serverContent);
        const stillCurrent =
          contentRef.current === savedContent &&
          selectedFileRef.current === savedFile;
        if (stillCurrent) updateEditorContent(serverContent);
        return stillCurrent;
      } catch (error) {
        const failure =
          error instanceof Error
            ? error
            : new Error('The save request failed.');
        setSaveFailure(failure);
        throw failure;
      } finally {
        setIsSaving(false);
        saveInFlightRef.current = null;
      }
    })();
    saveInFlightRef.current = saveAttempt;
    return saveAttempt;
  };

  const handleSelectFile = async (filePath: string) => {
    if (filePath === selectedFile || isBusy) return;
    setIsBusy(true);
    setNotice(null);
    try {
      await executeFileSwitch({
        currentFile: selectedFile,
        targetFile: filePath,
        content,
        isDirty,
        isBusy: false,
        saveCurrentFile,
        loadTargetFile: async (path) => {
          const response = await fetch(
            `/api/candidate/sessions/${token}/workspace/file?path=${encodeURIComponent(path)}`,
          );
          if (!response.ok) {
            const err = (await response.json()) as ApiError;
            throw new Error(err.error?.message ?? `Could not read ${path}`);
          }
          return (await response.json()) as { path: string; content: string };
        },
        onSaveFailure: () => {
          setNotice(formatSaveFailureBeforeSwitch(selectedFile));
        },
        onSwitchSuccess: (loaded) => {
          replaceEditorContent(loaded.content);
          updateSelectedFile(loaded.path);
        },
        onLoadFailure: (error) => {
          setNotice(error.message);
        },
        onSaveIncomplete: () => {
          setNotice(
            'Your newer edits are still unsaved. Save again before switching files.',
          );
        },
      });
    } finally {
      setIsBusy(false);
    }
  };

  const runAction = async (action: () => Promise<void>) => {
    if (isBusy) return;
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

  const handleStartAssessment = async () => {
    if (isActivating || session.status !== 'CREATED') return;
    setIsActivating(true);
    setProvisioningError(null);
    setUiMode('provisioning');

    try {
      const nextSession = await request('/activate', { method: 'POST' });
      setSession(nextSession);
      replaceEditorContent(nextSession.workingContent);
      if (nextSession.scenario?.filePath) {
        updateSelectedFile(nextSession.scenario.filePath);
      }
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
    } catch (activateError) {
      // Ambiguous network failure recovery:
      // Re-fetch canonical candidate session projection before assuming state
      try {
        const checkRes = await fetch(`/api/candidate/sessions/${token}`);
        if (checkRes.ok) {
          const freshSession = (await checkRes.json()) as CandidateSessionView;
          if (freshSession.status === 'ACTIVE') {
            setSession(freshSession);
            replaceEditorContent(freshSession.workingContent);
            if (freshSession.scenario?.filePath) {
              updateSelectedFile(freshSession.scenario.filePath);
            }
            setNotice(
              'Session active. Sandbox is ready and editing is enabled.',
            );
            if (
              freshSession.scenarioType === 'multi_file' ||
              freshSession.scenario.type === 'multi_file'
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
                  freshSession.scenario.filePath ||
                  nonDirs[0]?.path ||
                  'inventory/service.py';
                await loadFile(initialPath);
              }
            }
            return;
          }
        }
      } catch {
        // Fall through to error state
      }

      const message =
        activateError instanceof Error
          ? activateError.message
          : 'Failed to prepare assessment environment. Please try again.';
      setProvisioningError(message);
    } finally {
      setIsActivating(false);
    }
  };

  const handleRetryProvisioning = () => {
    setProvisioningError(null);
    void handleStartAssessment();
  };

  const save = () =>
    runAction(async () => {
      const savedCurrentContent = await saveCurrentFile();
      setNotice(
        savedCurrentContent
          ? isMultiFile
            ? `Saved ${selectedFile} to container.`
            : 'Saved to the server.'
          : 'Your newer edits are still unsaved. Save again when ready.',
      );
    });

  const submit = () =>
    runAction(async () => {
      let saveFailedError: Error | null = null;
      let saveIncomplete = false;
      let submitFailedError: Error | null = null;
      const success = await executeSubmitAssessment({
        isDirty,
        isBusy: false,
        saveCurrentFile,
        submitAssessment: async () => {
          const nextSession = await request('/submit', { method: 'POST' });
          setSession(nextSession);
        },
        onSaveFailure: (error) => {
          saveFailedError = error;
        },
        onSubmitSuccess: () => {
          setNotice(
            'Submitted. Sandbox terminated and files are now immutable.',
          );
        },
        onSubmitFailure: (error) => {
          submitFailedError = error;
        },
        onSaveIncomplete: () => {
          saveIncomplete = true;
        },
      });

      if (!success) {
        if (saveFailedError) {
          throw new Error(formatSaveFailureBeforeSubmit());
        }
        if (saveIncomplete) {
          throw new Error(
            'Your newer edits are still unsaved. The assessment was not submitted.',
          );
        }
        if (submitFailedError) {
          throw submitFailedError;
        }
      }
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

  const isActive =
    session.status === 'ACTIVE' && projection.capabilities.canEdit;
  const isSubmitted = session.status === 'SUBMITTED';
  const selectWorkspacePanel = (panel: WorkspacePanel) => {
    setActiveWorkspacePanel(panel);
    requestAnimationFrame(() => {
      workspacePanelRefs.current[panel]?.focus({ preventScroll: true });
      workspacePanelRefs.current[panel]?.scrollIntoView({ block: 'start' });
    });
  };

  if (session.status === 'CREATED') {
    return (
      <CandidatePrestart
        session={session}
        uiMode={uiMode}
        setUiMode={setUiMode}
        onStartAssessment={handleStartAssessment}
        isActivating={isActivating}
        provisioningError={provisioningError}
        onRetryProvisioning={handleRetryProvisioning}
      />
    );
  }

  return (
    <main
      className={`workspace-shell ${projection.uxState === 'ACTIVE_WORKSPACE' ? 'workspace-shell-active' : 'workspace-shell-readonly'}`}
      data-workspace-state={projection.uxState}
    >
      <header className="workspace-header">
        <div>
          <p className="eyebrow">Candidate workspace</p>
          <p className="session-reference">Session {session.id}</p>
        </div>
        <div className="workspace-session-actions">
          <p className="workspace-timer">
            <span>Time remaining</span>
            <strong>{formatRemainingTime(projection.remainingMs)}</strong>
          </p>
          {isActive ? (
            <button
              className="button button-primary"
              disabled={isBusy}
              onClick={submit}
              type="button"
            >
              Submit assessment
            </button>
          ) : null}
          <span
            className={`status status-${projection.uxState === 'TIME_LIMIT_REACHED' ? 'timeout' : session.status.toLowerCase()}`}
          >
            {projection.uxState === 'TIME_LIMIT_REACHED'
              ? 'Time limit reached'
              : session.status}
          </span>
        </div>
      </header>

      {isActive ? (
        <nav className="workspace-navigation" aria-label="Workspace navigation">
          {(
            [
              ['scenario', 'Scenario'],
              ['files', 'Files'],
              ['editor', 'Editor'],
              ['commands', 'Commands'],
              ['ai', 'AI'],
            ] as const
          ).map(([panel, label]) => (
            <button
              aria-pressed={activeWorkspacePanel === panel}
              className="workspace-navigation-button"
              key={panel}
              onClick={() => selectWorkspacePanel(panel)}
              type="button"
            >
              {label}
            </button>
          ))}
        </nav>
      ) : null}

      <div className={`workspace-grid workspace-view-${activeWorkspacePanel}`}>
        <section
          className="brief-panel"
          aria-labelledby="scenario-title"
          ref={(element) => {
            workspacePanelRefs.current.scenario = element ?? undefined;
          }}
          tabIndex={-1}
        >
          <p className="fixture-label">
            {isMultiFile ? 'Scenario 001 fixture' : 'Slice 2 fixture'} · v
            {session.scenario.version}
          </p>
          <h1 id="scenario-title" tabIndex={-1} ref={workspaceHeadingRef}>
            {session.scenario.title}
          </h1>
          <p className="brief-copy">{session.scenario.brief}</p>

          <h2>Expected behavior</h2>
          <ul className="criteria-list">
            {(session.scenario.acceptanceCriteria ?? []).map((criterion) => (
              <li key={criterion}>{criterion}</li>
            ))}
          </ul>

          <div className="capture-note">
            This scenario records saved workspace file mutations, authoritative
            command lifecycle events, and integrated AI interactions inside an
            isolated multi-service sandbox container. It does not include
            automated candidate evaluation.
          </div>
        </section>

        <section
          className="editor-panel"
          aria-labelledby="file-name"
          ref={(element) => {
            workspacePanelRefs.current.editor = element ?? undefined;
            workspacePanelRefs.current.files = element ?? undefined;
          }}
          tabIndex={-1}
        >
          <div className="file-bar">
            <div>
              <span className="file-kicker">
                {isMultiFile ? 'Workspace file' : 'Permitted file'}
              </span>
              <h2 id="file-name">
                {isMultiFile ? selectedFile : session.scenario.filePath}
              </h2>
            </div>
            <span
              className={`editor-persistence editor-persistence-${persistenceState.toLowerCase()}`}
              role="status"
              aria-live="polite"
            >
              {editorPersistenceMessage(
                persistenceState,
                isSaving && content !== persistedContent,
              )}
            </span>
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
            disabled={!isActive || (isBusy && !isSaving)}
            onChange={(event) => {
              updateEditorContent(event.target.value);
              setNotice(null);
            }}
            spellCheck={false}
            value={content}
          />

          <div className="editor-footer">
            {saveFailure ? (
              <p className="editor-message save-failure" role="alert">
                We could not save your changes. Your edits are still here. Try
                saving again.
              </p>
            ) : (
              <p className="editor-message" aria-live="polite">
                {notice ??
                  (projection.uxState === 'TIME_LIMIT_REACHED'
                    ? 'The assessment time limit has been reached. New modifications are no longer permitted.'
                    : isSubmitted
                      ? (projection.completionMessage ??
                        `Submitted ${new Date(session.submittedAt ?? '').toLocaleString()}.`)
                      : 'Edits persist only after Save or Submit.')}
              </p>
            )}
            <div className="button-row">
              {isActive ? (
                <>
                  <button
                    className="button button-secondary"
                    disabled={isBusy || isSaving || !isDirty}
                    onClick={save}
                    type="button"
                  >
                    Save
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </section>

        <aside className="workspace-auxiliary" aria-label="Workspace tools">
          <section
            className="terminal-panel"
            aria-labelledby="terminal-title"
            ref={(element) => {
              workspacePanelRefs.current.commands = element ?? undefined;
            }}
            tabIndex={-1}
          >
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
          </section>

          <div
            className="workspace-ai"
            ref={(element) => {
              workspacePanelRefs.current.ai = element ?? undefined;
            }}
            tabIndex={-1}
          >
            <CandidateAiPanel
              token={token}
              sessionStatus={session.status}
              aiCapability={session.aiCapability}
              availableFiles={availableFiles}
            />
          </div>
        </aside>
      </div>
    </main>
  );
};
