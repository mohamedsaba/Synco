export type SessionEventType =
  | 'COMMAND_STARTED'
  | 'COMMAND_FINISHED'
  | 'WORKSPACE_CHANGED'
  | 'WORKSPACE_CAPTURE_FAILED';

export type CommandStartedPayload = Readonly<{
  commandId: string;
  command: string;
  cwd: string;
}>;

export type CommandFinishedPayload = Readonly<{
  commandId: string;
  exitCode: number | null;
  timedOut: boolean;
  durationMs: number;
  stdoutPreview: string;
  stdoutBytes: number;
  stdoutTruncated: boolean;
  stderrPreview: string;
  stderrBytes: number;
  stderrTruncated: boolean;
}>;

export type WorkspaceFileChange = Readonly<{
  path: string;
  status: 'modified' | 'added' | 'deleted';
  additions: number;
  deletions: number;
  patchPreview: string;
  patchPreviewBytes: number;
  patchBytes: number;
  patchTruncated: boolean;
}>;

export type WorkspaceChangedPayload = Readonly<{
  changeId: string;
  origin: 'browser_save' | 'command_execution' | 'out_of_band';
  commandId?: string;
  beforeTree: string;
  afterTree: string;
  files: readonly WorkspaceFileChange[];
  totalAdditions: number;
  totalDeletions: number;
}>;

export type WorkspaceCaptureFailedPayload = Readonly<{
  commandId?: string;
  phase: 'pre_command' | 'post_command' | 'browser_save' | 'submission';
  beforeTree: string | null;
  errorMessage: string;
}>;

export type SessionEventPayload =
  | CommandStartedPayload
  | CommandFinishedPayload
  | WorkspaceChangedPayload
  | WorkspaceCaptureFailedPayload;

export type SessionEvent = Readonly<{
  id: string;
  sessionId: string;
  sequence: number;
  type: SessionEventType;
  timestamp: string;
  source: 'server' | 'sandbox';
  payload: SessionEventPayload;
}>;

export type NewSessionEvent = Readonly<{
  id: string;
  sessionId: string;
  type: SessionEventType;
  timestamp: string;
  source: 'server' | 'sandbox';
  payload: SessionEventPayload;
}>;
