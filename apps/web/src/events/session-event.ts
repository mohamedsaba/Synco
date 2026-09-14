export type SessionEventType = 'COMMAND_STARTED' | 'COMMAND_FINISHED';

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

export type SessionEventPayload =
  CommandStartedPayload | CommandFinishedPayload;

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
