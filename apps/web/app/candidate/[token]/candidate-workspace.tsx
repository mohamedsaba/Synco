'use client';

import { useEffect, useRef, useState } from 'react';

import type { WorkspaceFileInfo } from '../../../src/sandbox/sandbox';
import type { CandidateSessionView } from '../../../src/sessions/candidate-session-view';
import { useCandidateSession } from '../../../src/candidate/use-candidate-session';
import { presentCandidateTimer } from '../../../src/candidate/candidate-timer';
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
  reconcileSubmissionResponse,
} from './candidate-workspace-actions';
import {
  beginCommand,
  canBeginCommand,
  commandPlatformError,
  completeCommand,
  failCommand,
  generateCommandEntryId,
  isCommandExecResult,
  type CommandHistoryEntry,
} from './candidate-command-state';

type CandidateWorkspaceProps = Readonly<{
  initialSession: CandidateSessionView;
  token: string;
}>;

type ApiError = Readonly<{
  error?: { code?: string; message?: string };
}>;

type WorkspacePanel = 'scenario' | 'files' | 'editor' | 'commands' | 'ai';

export const selectInitialWorkspaceFile = (
  files: readonly WorkspaceFileInfo[],
  scenarioFilePath?: string,
) => {
  const filePaths = files
    .filter((file) => !file.isDirectory)
    .map((file) => file.path)
    .sort((left, right) => left.localeCompare(right));

  return scenarioFilePath && filePaths.includes(scenarioFilePath)
    ? scenarioFilePath
    : filePaths[0];
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
    finalizationState,
    setFinalizationState,
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
    session.scenario.filePath ?? '',
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
  const [commandHistory, setCommandHistory] = useState<
    readonly CommandHistoryEntry[]
  >([]);

  // Pre-start / Activation state
  const [isActivating, setIsActivating] = useState(false);
  const [provisioningError, setProvisioningError] = useState<string | null>(
    null,
  );
  const workspaceHeadingRef = useRef<HTMLHeadingElement>(null);
  const reviewHeadingRef = useRef<HTMLHeadingElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const terminalHeadingRef = useRef<HTMLHeadingElement>(null);
  const workspacePanelRefs = useRef<
    Partial<Record<WorkspacePanel, HTMLElement>>
  >({});
  const prevUxStateRef = useRef(projection.uxState);
  const focusedTerminalStateRef = useRef<string | null>(null);
  const contentRef = useRef(content);
  const selectedFileRef = useRef(selectedFile);
  const saveInFlightRef = useRef<Promise<boolean> | null>(null);
  const commandInFlightRef = useRef(false);

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

  useEffect(() => {
    if (projection.uxState === 'SUBMISSION_REVIEW') {
      reviewHeadingRef.current?.focus();
    }
  }, [projection.uxState]);

  useEffect(() => {
    if (
      (projection.uxState === 'FINALIZING' ||
        projection.uxState === 'COMPLETED') &&
      focusedTerminalStateRef.current !== projection.uxState
    ) {
      terminalHeadingRef.current?.focus();
      focusedTerminalStateRef.current = projection.uxState;
    }
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
            const initialPath = selectInitialWorkspaceFile(
              treeData.files,
              session.scenario.filePath,
            );
            updateSelectedFile(initialPath ?? '');

            if (!initialPath) return;

            const fileRes = await fetch(
              `/api/candidate/sessions/${token}/workspace/file?path=${encodeURIComponent(initialPath)}`,
            );
            if (
              fileRes.ok &&
              active &&
              selectedFileRef.current === initialPath &&
              contentRef.current === initialContent
            ) {
              const fileData = (await fileRes.json()) as {
                path: string;
                content: string;
              };
              replaceEditorContent(fileData.content);
            }
          }
        } catch {
          // Ignore background fetch error
        }
      })();
    }
    return () => {
      active = false;
    };
  }, [session.status, session.scenario.filePath, isMultiFile, token]);

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
          const initialPath = selectInitialWorkspaceFile(
            treeData.files,
            nextSession.scenario.filePath,
          );
          updateSelectedFile(initialPath ?? '');
          if (initialPath) await loadFile(initialPath);
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
                const initialPath = selectInitialWorkspaceFile(
                  treeData.files,
                  freshSession.scenario.filePath,
                );
                updateSelectedFile(initialPath ?? '');
                if (initialPath) await loadFile(initialPath);
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

  const submit = async () => {
    if (
      isBusy ||
      isSaving ||
      isExecuting ||
      finalizationState === 'in_flight' ||
      !projection.capabilities.canSubmit
    ) {
      return;
    }

    setIsBusy(true);
    setNotice(null);
    try {
      await executeSubmitAssessment({
        isDirty,
        isBusy: false,
        saveCurrentFile,
        submitAssessment: async () => {
          setFinalizationState('in_flight');
          try {
            const nextSession = await request('/submit', { method: 'POST' });
            setSession(nextSession);
          } catch {
            try {
              const response = await fetch(`/api/candidate/sessions/${token}`);
              if (!response.ok) throw new Error('Session refresh failed.');
              const nextSession =
                (await response.json()) as CandidateSessionView;
              setSession(nextSession);
              if (reconcileSubmissionResponse(nextSession) === 'resume') {
                setFinalizationState('idle');
                setUiMode('workspace');
                setNotice(
                  'Submission was not admitted. Check the current assessment status.',
                );
              }
            } catch {
              setNotice("We're checking your submission status.");
            }
          }
        },
        onSaveFailure: () => setNotice(formatSaveFailureBeforeSubmit()),
        onSaveIncomplete: () =>
          setNotice(
            'Your newer edits are still unsaved. The assessment was not submitted.',
          ),
        onSubmitSuccess: () => {},
        onSubmitFailure: () => {},
      });
    } finally {
      setIsBusy(false);
    }
  };

  const executeCommand = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cmd = commandInput.trim();
    if (
      !canBeginCommand(
        cmd,
        commandInFlightRef.current,
        projection.capabilities.canRunCommands,
      )
    ) {
      return;
    }

    const entryId = generateCommandEntryId();
    commandInFlightRef.current = true;
    setIsExecuting(true);
    setCommandHistory((history) => beginCommand(history, entryId, cmd));
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
        const errorJson = (await response
          .json()
          .catch(() => null)) as ApiError | null;
        setCommandHistory((history) =>
          failCommand(
            history,
            entryId,
            commandPlatformError(
              response.status,
              errorJson?.error?.code,
              errorJson?.error?.message,
            ),
          ),
        );
        return;
      }

      const result = (await response.json()) as unknown;
      if (!isCommandExecResult(result)) {
        setCommandHistory((history) =>
          failCommand(
            history,
            entryId,
            'Hirearchy Software returned an incomplete command result. Try again.',
          ),
        );
        return;
      }

      setCommandHistory((history) => completeCommand(history, entryId, result));
      setCommandInput('');
    } catch {
      setCommandHistory((history) =>
        failCommand(
          history,
          entryId,
          commandPlatformError(null, undefined, undefined),
        ),
      );
    } finally {
      commandInFlightRef.current = false;
      setIsExecuting(false);
    }
  };

  const isActive =
    session.status === 'ACTIVE' && projection.capabilities.canEdit;
  const canRunCommands = projection.capabilities.canRunCommands;
  const isSubmitted = session.status === 'SUBMITTED';
  const activeFilePath = isMultiFile ? selectedFile : session.scenario.filePath;
  const hasSelectedFile = Boolean(activeFilePath);
  const timer =
    session.status === 'ACTIVE' && session.closureReason === null
      ? presentCandidateTimer(projection.remainingMs, session.durationSeconds)
      : null;
  const selectWorkspacePanel = (panel: WorkspacePanel) => {
    setActiveWorkspacePanel(panel);
    requestAnimationFrame(() => {
      workspacePanelRefs.current[panel]?.scrollIntoView({ block: 'start' });
    });
  };

  const closeSubmissionReview = () => {
    setUiMode('workspace');
    requestAnimationFrame(() => submitButtonRef.current?.focus());
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

  if (projection.uxState === 'FINALIZING') {
    return (
      <main className="workspace-shell terminal-candidate-state">
        <section
          className="prestart-card"
          aria-labelledby="finalizing-title"
          role="status"
        >
          <p className="eyebrow">Assessment</p>
          <h1 id="finalizing-title" ref={terminalHeadingRef} tabIndex={-1}>
            Finalizing your assessment…
          </h1>
          <p className="summary">
            Submission has begun. No more changes can be accepted while
            finalization is underway.
          </p>
        </section>
      </main>
    );
  }

  if (projection.uxState === 'COMPLETED') {
    const isTimeout = projection.completionVariant === 'timeout';
    return (
      <main className="workspace-shell terminal-candidate-state">
        <section className="prestart-card" aria-labelledby="completion-title">
          <p className="eyebrow">Assessment complete</p>
          <h1 id="completion-title" ref={terminalHeadingRef} tabIndex={-1}>
            {isTimeout ? 'Assessment time ended' : 'Assessment submitted'}
          </h1>
          <p className="summary">
            {projection.completionMessage} No more changes can be made.
          </p>
        </section>
      </main>
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
          {timer ? (
            <p
              className={`workspace-timer workspace-timer-${timer.state.toLowerCase()}`}
              aria-label={`Time remaining: ${timer.display}`}
            >
              <span>Time remaining</span>
              <strong>{timer.display}</strong>
              {timer.statusText && timer.state !== 'NORMAL' ? (
                <span className="workspace-timer-status">
                  {timer.statusText}
                </span>
              ) : null}
            </p>
          ) : null}
          {isActive ? (
            <button
              className="button button-primary"
              disabled={isBusy}
              onClick={() => setUiMode('submission_review')}
              ref={submitButtonRef}
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

      {projection.uxState === 'TIME_LIMIT_REACHED' ? (
        <p className="deadline-reached-notice" role="status" aria-live="polite">
          Time limit reached. New work is no longer accepted.
        </p>
      ) : null}

      {projection.uxState === 'SUBMISSION_REVIEW' ? (
        <section
          className="submission-review"
          aria-labelledby="submission-review-title"
        >
          <p className="eyebrow">Submission review</p>
          <h1 id="submission-review-title" ref={reviewHeadingRef} tabIndex={-1}>
            Review your submission
          </h1>
          <p>
            Submitting is final. Further editing ends once submission is
            admitted.
          </p>
          <p className="submission-review-persistence" role="status">
            Editor status: {editorPersistenceMessage(persistenceState, isDirty)}
            .
            {persistenceState === 'SAVED'
              ? ' Your current editor work is ready for final submission.'
              : ' Current editor work must be saved before final submission.'}
          </p>
          <div className="button-row">
            <button
              className="button button-secondary"
              disabled={isBusy || finalizationState === 'in_flight'}
              onClick={closeSubmissionReview}
              type="button"
            >
              Back
            </button>
            <button
              className="button button-primary"
              disabled={
                isBusy ||
                isSaving ||
                isExecuting ||
                finalizationState === 'in_flight' ||
                !projection.capabilities.canSubmit
              }
              onClick={() => void submit()}
              type="button"
            >
              Submit Assessment
            </button>
          </div>
          {notice ? (
            <p className="editor-message" role="status">
              {notice}
            </p>
          ) : null}
        </section>
      ) : null}

      <div
        aria-hidden={projection.uxState === 'SUBMISSION_REVIEW' || undefined}
        inert={projection.uxState === 'SUBMISSION_REVIEW'}
      >
        {isActive ? (
          <nav
            className="workspace-navigation"
            aria-label="Workspace navigation"
          >
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
                aria-controls={
                  panel === 'files' ? 'workspace-editor' : `workspace-${panel}`
                }
                aria-current={
                  activeWorkspacePanel === panel ? 'page' : undefined
                }
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

        <div
          className={`workspace-grid workspace-view-${activeWorkspacePanel}`}
        >
          <section
            id="workspace-scenario"
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
              This scenario records saved workspace file mutations,
              authoritative command lifecycle events, and integrated AI
              interactions inside an isolated multi-service sandbox container.
              It does not include automated candidate evaluation.
            </div>
          </section>

          <section
            id="workspace-editor"
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
                  {activeFilePath || 'No workspace file available'}
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
              <nav
                className="workspace-file-selector"
                aria-label="Workspace files"
              >
                {workspaceFiles.map((file) => (
                  <button
                    key={file.path}
                    type="button"
                    aria-current={
                      file.path === selectedFile ? 'page' : undefined
                    }
                    className={`file-tab ${file.path === selectedFile ? 'file-tab-active' : ''}`}
                    onClick={() => handleSelectFile(file.path)}
                    disabled={!isActive || isBusy}
                  >
                    {file.path}
                  </button>
                ))}
              </nav>
            ) : null}

            <textarea
              aria-label={`Edit ${activeFilePath || 'No workspace file available'}`}
              disabled={!isActive || !hasSelectedFile || (isBusy && !isSaving)}
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
                {isActive && hasSelectedFile ? (
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
              id="workspace-commands"
              className="terminal-panel"
              aria-labelledby="terminal-title"
              ref={(element) => {
                workspacePanelRefs.current.commands = element ?? undefined;
              }}
              tabIndex={-1}
            >
              <div className="terminal-header">
                <div>
                  <h3 id="terminal-title">Commands</h3>
                  <p className="command-description">
                    Run commands and tests inside the assessment environment.
                  </p>
                </div>
                <span className="file-kicker">
                  {canRunCommands
                    ? 'Available'
                    : projection.uxState === 'TIME_LIMIT_REACHED'
                      ? 'Unavailable: time limit reached'
                      : isSubmitted
                        ? 'Unavailable: assessment submitted'
                        : 'Unavailable: assessment inactive'}
                </span>
              </div>

              <form className="terminal-form" onSubmit={executeCommand}>
                <input
                  aria-label="Command"
                  className="terminal-input"
                  disabled={!canRunCommands || isExecuting}
                  onChange={(e) => setCommandInput(e.target.value)}
                  placeholder={
                    canRunCommands
                      ? 'Example: npm test'
                      : 'Commands are unavailable'
                  }
                  type="text"
                  value={commandInput}
                />
                <button
                  className="terminal-button"
                  disabled={
                    !canRunCommands || isExecuting || !commandInput.trim()
                  }
                  type="submit"
                >
                  {isExecuting ? 'Running…' : 'Run'}
                </button>
              </form>

              {commandHistory.length > 0 ? (
                <ol className="terminal-log" aria-label="Command history">
                  {commandHistory.map((item) => (
                    <li className="command-entry" key={item.id}>
                      <div className="command-meta">
                        <code className="command-text">{item.command}</code>
                        {item.state === 'RUNNING' ? (
                          <span className="badge badge-running" role="status">
                            Command running
                          </span>
                        ) : item.state === 'TIMED_OUT' ? (
                          <span className="badge badge-timeout">
                            Command timed out
                          </span>
                        ) : item.state === 'COMPLETED_SUCCESS' ? (
                          <span className="badge badge-success">
                            Completed: exit 0
                          </span>
                        ) : item.state === 'COMPLETED_FAILURE' ? (
                          <span className="badge badge-error">
                            {item.result?.exitCode === null
                              ? 'Completed without an exit code'
                              : `Completed: non-zero exit ${item.result?.exitCode}`}
                          </span>
                        ) : (
                          <span className="badge badge-error">
                            Hirearchy Software could not run command
                          </span>
                        )}
                        {item.result ? (
                          <span>{item.result.durationMs}ms</span>
                        ) : null}
                        {item.result?.stdoutTruncated ? (
                          <span className="badge badge-truncated">
                            Standard output truncated ({item.result.stdoutBytes}{' '}
                            B)
                          </span>
                        ) : null}
                        {item.result?.stderrTruncated ? (
                          <span className="badge badge-truncated">
                            Standard error truncated ({item.result.stderrBytes}{' '}
                            B)
                          </span>
                        ) : null}
                      </div>

                      {item.platformError ? (
                        <p className="command-platform-error" role="alert">
                          {item.platformError}
                        </p>
                      ) : null}

                      {item.result?.stdoutPreview ? (
                        <section aria-label="Standard output">
                          <p className="command-output-label">
                            Standard output
                          </p>
                          <pre className="command-output">
                            {item.result.stdoutPreview}
                          </pre>
                        </section>
                      ) : null}

                      {item.result?.stderrPreview ? (
                        <section aria-label="Standard error">
                          <p className="command-output-label">Standard error</p>
                          <pre className="command-output stderr">
                            {item.result.stderrPreview}
                          </pre>
                        </section>
                      ) : null}
                    </li>
                  ))}
                </ol>
              ) : null}
            </section>

            <div
              className="workspace-ai"
              id="workspace-ai"
              ref={(element) => {
                workspacePanelRefs.current.ai = element ?? undefined;
              }}
              tabIndex={-1}
            >
              <CandidateAiPanel
                token={token}
                sessionStatus={session.status}
                aiCapability={session.aiCapability}
                activeFilePath={activeFilePath ?? ''}
                canUseAi={projection.capabilities.canUseAi}
                unavailableMessage={
                  projection.uxState === 'TIME_LIMIT_REACHED'
                    ? 'The assessment time limit has been reached. AI is unavailable.'
                    : undefined
                }
              />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};
