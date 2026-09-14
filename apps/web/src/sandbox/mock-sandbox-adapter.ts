import { BoundedStreamAccumulator } from './bounded-stream-accumulator';
import {
  type CommandExecResult,
  type SandboxAdapter,
  SandboxError,
} from './sandbox';

export type MockExecHandler = (
  command: string,
  state: {
    files: Map<string, string>;
    cwd: string;
  },
) => {
  exitCode?: number | null;
  timedOut?: boolean;
  stdout?: string;
  stderr?: string;
  durationMs?: number;
};

export class MockSandboxAdapter implements SandboxAdapter {
  private readonly activeSandboxes = new Map<
    string,
    {
      files: Map<string, string>;
      cwd: string;
    }
  >();

  public failCreationForSessionId: string | null = null;
  public customExecHandler: MockExecHandler | null = null;
  public defaultTimeoutMs = 30_000;

  async createAndVerify(
    sessionId: string,
    initialFiles: Readonly<Record<string, string>> = {},
  ): Promise<void> {
    if (this.failCreationForSessionId === sessionId) {
      throw new SandboxError(
        'SANDBOX_READINESS_FAILED',
        `Mock sandbox readiness failed for session ${sessionId}`,
      );
    }

    const files = new Map<string, string>();
    for (const [path, content] of Object.entries(initialFiles)) {
      files.set(path, content);
    }

    this.activeSandboxes.set(sessionId, {
      files,
      cwd: '/workspace',
    });
  }

  async exec(
    sessionId: string,
    commandId: string,
    command: string,
    cwd = '/workspace',
    timeoutMs = this.defaultTimeoutMs,
  ): Promise<CommandExecResult> {
    const sandbox = this.activeSandboxes.get(sessionId);
    if (!sandbox) {
      throw new SandboxError(
        'SANDBOX_NOT_FOUND',
        `No active sandbox found for session ${sessionId}`,
      );
    }

    if (this.customExecHandler) {
      const handled = this.customExecHandler(command, sandbox);
      const stdoutAccumulator = new BoundedStreamAccumulator();
      const stderrAccumulator = new BoundedStreamAccumulator();
      if (handled.stdout) stdoutAccumulator.append(handled.stdout);
      if (handled.stderr) stderrAccumulator.append(handled.stderr);

      const stdoutRes = stdoutAccumulator.result;
      const stderrRes = stderrAccumulator.result;

      return {
        commandId,
        exitCode: handled.timedOut ? null : (handled.exitCode ?? 0),
        timedOut: handled.timedOut ?? false,
        durationMs: handled.durationMs ?? 10,
        stdoutPreview: stdoutRes.preview,
        stdoutBytes: stdoutRes.bytes,
        stdoutTruncated: stdoutRes.truncated,
        stderrPreview: stderrRes.preview,
        stderrBytes: stderrRes.bytes,
        stderrTruncated: stderrRes.truncated,
      };
    }

    // Default built-in command simulation
    const stdoutAccumulator = new BoundedStreamAccumulator();
    const stderrAccumulator = new BoundedStreamAccumulator();
    let exitCode: number | null = 0;
    let timedOut = false;
    let durationMs = 5;

    if (command.startsWith('sleep') && timeoutMs <= 100) {
      timedOut = true;
      exitCode = null;
      durationMs = timeoutMs;
    } else if (command === 'false') {
      exitCode = 1;
    } else if (command === 'pwd') {
      stdoutAccumulator.append(`${cwd}\n`);
    } else if (command.startsWith('echo ') && command.includes(' > ')) {
      const match = command.match(/^echo\s+["']?(.*?)["']?\s*>\s*(.+)$/);
      if (match) {
        const [, text, targetPath] = match;
        const normalizedPath = targetPath.trim().replace(/^\/workspace\/?/, '');
        sandbox.files.set(normalizedPath, `${text}\n`);
      }
    } else if (command.startsWith('cat ')) {
      const targetPath = command
        .slice(4)
        .trim()
        .replace(/^\/workspace\/?/, '');
      if (sandbox.files.has(targetPath)) {
        stdoutAccumulator.append(sandbox.files.get(targetPath)!);
      } else {
        exitCode = 1;
        stderrAccumulator.append(
          `cat: can't open '${targetPath}': No such file or directory\n`,
        );
      }
    } else {
      stdoutAccumulator.append(`executed: ${command}\n`);
    }

    const stdoutRes = stdoutAccumulator.result;
    const stderrRes = stderrAccumulator.result;

    return {
      commandId,
      exitCode,
      timedOut,
      durationMs,
      stdoutPreview: stdoutRes.preview,
      stdoutBytes: stdoutRes.bytes,
      stdoutTruncated: stdoutRes.truncated,
      stderrPreview: stderrRes.preview,
      stderrBytes: stderrRes.bytes,
      stderrTruncated: stderrRes.truncated,
    };
  }

  async writeFile(
    sessionId: string,
    filePath: string,
    content: string,
  ): Promise<void> {
    const sandbox = this.activeSandboxes.get(sessionId);
    if (!sandbox) {
      throw new SandboxError(
        'SANDBOX_NOT_FOUND',
        `No active sandbox found for session ${sessionId}`,
      );
    }
    const normalized = filePath.replace(/^\/workspace\/?/, '');
    sandbox.files.set(normalized, content);
  }

  async teardown(sessionId: string): Promise<void> {
    this.activeSandboxes.delete(sessionId);
  }

  hasSandbox(sessionId: string): boolean {
    return this.activeSandboxes.has(sessionId);
  }

  getSandboxFiles(sessionId: string): Map<string, string> | undefined {
    return this.activeSandboxes.get(sessionId)?.files;
  }
}
