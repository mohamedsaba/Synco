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

export type WorkspaceFileInfo = Readonly<{
  path: string;
  size: number;
  isDirectory: boolean;
}>;

export type SandboxCreateOptions = Readonly<{
  imageName?: string;
  initialFiles?: Readonly<Record<string, string>>;
  scenarioType?: 'single_file' | 'multi_file';
}>;

import type { WorkspaceFileChange } from '../events/session-event';

export type TreeDiffResult = Readonly<{
  files: readonly WorkspaceFileChange[];
  totalAdditions: number;
  totalDeletions: number;
  rawDiff: string;
}>;

export interface SandboxAdapter {
  createAndVerify(
    sessionId: string,
    options?: SandboxCreateOptions | Readonly<Record<string, string>>,
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

  readFile(sessionId: string, filePath: string): Promise<string>;

  listFiles(sessionId: string): Promise<readonly WorkspaceFileInfo[]>;

  captureWorkspaceTree(sessionId: string): Promise<string>;

  captureTreeDiff(
    sessionId: string,
    beforeTree: string,
    afterTree: string,
  ): Promise<TreeDiffResult>;

  getBaselineTree(sessionId: string): Promise<string>;

  teardown(sessionId: string): Promise<void>;
}
