export type CommandExecResult = Readonly<{
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

export class SandboxError extends Error {
  constructor(
    readonly code:
      | 'SANDBOX_CREATION_FAILED'
      | 'SANDBOX_READINESS_FAILED'
      | 'SANDBOX_NOT_FOUND'
      | 'SANDBOX_EXECUTION_FAILED',
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'SandboxError';
  }
}

export interface SandboxAdapter {
  createAndVerify(
    sessionId: string,
    initialFiles?: Readonly<Record<string, string>>,
  ): Promise<void>;

  exec(
    sessionId: string,
    commandId: string,
    command: string,
    cwd?: string,
    timeoutMs?: number,
  ): Promise<CommandExecResult>;

  writeFile(
    sessionId: string,
    filePath: string,
    content: string,
  ): Promise<void>;

  teardown(sessionId: string): Promise<void>;
}
