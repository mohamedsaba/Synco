import { spawn } from 'node:child_process';

import { BoundedStreamAccumulator } from './bounded-stream-accumulator';
import {
  type CommandExecResult,
  type SandboxAdapter,
  SandboxError,
} from './sandbox';

export type DockerSandboxOptions = Readonly<{
  imageName?: string;
  defaultTimeoutMs?: number;
}>;

export class DockerSandboxAdapter implements SandboxAdapter {
  private readonly imageName: string;
  private readonly defaultTimeoutMs: number;

  constructor(options: DockerSandboxOptions = {}) {
    this.imageName = options.imageName ?? 'alpine:3.20';
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? 30_000;
  }

  getContainerName(sessionId: string): string {
    const sanitized = sessionId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `delimit-sandbox-${sanitized}`;
  }

  async createAndVerify(
    sessionId: string,
    initialFiles: Readonly<Record<string, string>> = {},
  ): Promise<void> {
    const containerName = this.getContainerName(sessionId);

    // Clean up any stale container with the same name first
    await this.runProcess('docker', ['rm', '-f', containerName]).catch(
      () => {},
    );

    // Run container with strict security bounds:
    // - read-only root
    // - tmpfs /tmp (noexec, nosuid)
    // - tmpfs /workspace (owned by user 1000)
    // - network none
    // - memory 512m, cpu 1.0, pids 64
    // - dropped capabilities, no privilege escalation
    // - non-root user (1000:1000)
    try {
      await this.runProcess('docker', [
        'run',
        '-d',
        '--name',
        containerName,
        '--read-only',
        '--tmpfs',
        '/tmp:rw,noexec,nosuid,size=64m',
        '--tmpfs',
        '/workspace:rw,exec,nosuid,size=256m,uid=1000,gid=1000',
        '--network',
        'none',
        '--memory=512m',
        '--cpus=1.0',
        '--pids-limit=64',
        '--cap-drop=ALL',
        '--security-opt=no-new-privileges:true',
        '--user',
        '1000:1000',
        '-w',
        '/workspace',
        this.imageName,
        'sleep',
        'infinity',
      ]);
    } catch (error) {
      throw new SandboxError(
        'SANDBOX_CREATION_FAILED',
        `Failed to create sandbox container: ${error instanceof Error ? error.message : String(error)}`,
        error,
      );
    }

    // Populate initial files
    try {
      for (const [filePath, content] of Object.entries(initialFiles)) {
        const dir = filePath.includes('/')
          ? filePath.slice(0, filePath.lastIndexOf('/'))
          : '';
        if (dir) {
          await this.runProcess('docker', [
            'exec',
            containerName,
            'mkdir',
            '-p',
            `/workspace/${dir}`,
          ]);
        }

        await this.runProcessWithInput(
          'docker',
          [
            'exec',
            '-i',
            containerName,
            'sh',
            '-c',
            `cat > "/workspace/${filePath}"`,
          ],
          content,
        );
      }

      // Readiness check
      const readyCheck = await this.runProcess('docker', [
        'exec',
        containerName,
        'sh',
        '-c',
        'echo delimit-ready',
      ]);

      if (!readyCheck.stdout.includes('delimit-ready')) {
        throw new Error(
          `Readiness probe returned unexpected output: ${readyCheck.stdout}`,
        );
      }
    } catch (error) {
      await this.teardown(sessionId).catch(() => {});
      throw new SandboxError(
        'SANDBOX_READINESS_FAILED',
        `Sandbox readiness check failed: ${error instanceof Error ? error.message : String(error)}`,
        error,
      );
    }
  }

  async exec(
    sessionId: string,
    commandId: string,
    command: string,
    cwd = '/workspace',
    timeoutMs = this.defaultTimeoutMs,
  ): Promise<CommandExecResult> {
    const containerName = this.getContainerName(sessionId);

    // Verify container exists and is running
    try {
      const inspect = await this.runProcess('docker', [
        'inspect',
        '-f',
        '{{.State.Running}}',
        containerName,
      ]);
      if (inspect.stdout.trim() !== 'true') {
        throw new SandboxError(
          'SANDBOX_NOT_FOUND',
          `Sandbox container ${containerName} is not running.`,
        );
      }
    } catch (error) {
      if (error instanceof SandboxError) throw error;
      throw new SandboxError(
        'SANDBOX_NOT_FOUND',
        `Sandbox container ${containerName} was not found.`,
        error,
      );
    }

    const stdoutAccumulator = new BoundedStreamAccumulator();
    const stderrAccumulator = new BoundedStreamAccumulator();
    const startTime = Date.now();

    return new Promise<CommandExecResult>((resolve, reject) => {
      let timedOut = false;
      let timeoutTimer: NodeJS.Timeout | null = null;
      let processSettled = false;

      // Wrap command inside container to record pgid and cleanly cleanup
      const wrapperScript = [
        'echo $$ > "/tmp/cmd_$1.pgid"',
        'cd "$2"',
        'eval "$3"',
        'code=$?',
        'rm -f "/tmp/cmd_$1.pgid"',
        'exit $code',
      ].join('\n');

      const child = spawn('docker', [
        'exec',
        containerName,
        'sh',
        '-c',
        wrapperScript,
        'delimit-exec',
        commandId,
        cwd,
        command,
      ]);

      child.stdout.on('data', (chunk: Buffer) => {
        stdoutAccumulator.append(chunk);
      });

      child.stderr.on('data', (chunk: Buffer) => {
        stderrAccumulator.append(chunk);
      });

      const killDescendantsInsideContainer = async () => {
        // Kill process group and any lingering non-PID-1 processes in the container
        const killCmd = [
          `pgid=$(cat "/tmp/cmd_${commandId}.pgid" 2>/dev/null)`,
          `if [ -n "$pgid" ]; then kill -KILL -$pgid 2>/dev/null; rm -f "/tmp/cmd_${commandId}.pgid"; fi`,
          `for dir in /proc/[0-9]*; do`,
          `  p=\${dir##*/}`,
          `  if [ "$p" != "1" ] && [ "$p" != "$$" ]; then kill -9 "$p" 2>/dev/null; fi`,
          `done`,
          `sleep 0.1`,
        ].join('\n');

        await this.runProcess('docker', [
          'exec',
          containerName,
          'sh',
          '-c',
          killCmd,
        ]).catch(() => {});
      };

      if (timeoutMs > 0) {
        timeoutTimer = setTimeout(async () => {
          if (processSettled) return;
          timedOut = true;
          try {
            await killDescendantsInsideContainer();
          } finally {
            child.kill('SIGKILL');
          }
        }, timeoutMs);
      }

      child.on('error', (err) => {
        if (processSettled) return;
        processSettled = true;
        if (timeoutTimer) clearTimeout(timeoutTimer);
        reject(
          new SandboxError(
            'SANDBOX_EXECUTION_FAILED',
            `Execution transport error: ${err.message}`,
            err,
          ),
        );
      });

      child.on('close', (code) => {
        if (processSettled) return;
        processSettled = true;
        if (timeoutTimer) clearTimeout(timeoutTimer);

        const durationMs = Date.now() - startTime;
        const stdoutRes = stdoutAccumulator.result;
        const stderrRes = stderrAccumulator.result;

        resolve({
          commandId,
          exitCode: timedOut ? null : (code ?? 0),
          timedOut,
          durationMs,
          stdoutPreview: stdoutRes.preview,
          stdoutBytes: stdoutRes.bytes,
          stdoutTruncated: stdoutRes.truncated,
          stderrPreview: stderrRes.preview,
          stderrBytes: stderrRes.bytes,
          stderrTruncated: stderrRes.truncated,
        });
      });
    });
  }

  async writeFile(
    sessionId: string,
    filePath: string,
    content: string,
  ): Promise<void> {
    const containerName = this.getContainerName(sessionId);
    const normalized = filePath.replace(/^\/workspace\/?/, '');
    const dir = normalized.includes('/')
      ? normalized.slice(0, normalized.lastIndexOf('/'))
      : '';

    if (dir) {
      await this.runProcess('docker', [
        'exec',
        containerName,
        'mkdir',
        '-p',
        `/workspace/${dir}`,
      ]).catch(() => {});
    }

    await this.runProcessWithInput(
      'docker',
      [
        'exec',
        '-i',
        containerName,
        'sh',
        '-c',
        `cat > "/workspace/${normalized}"`,
      ],
      content,
    );
  }

  async teardown(sessionId: string): Promise<void> {
    const containerName = this.getContainerName(sessionId);
    await this.runProcess('docker', ['rm', '-f', containerName]).catch(
      () => {},
    );
  }

  private runProcess(
    command: string,
    args: string[],
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args);
      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (d: Buffer) => {
        stdout += d.toString('utf8');
      });

      child.stderr.on('data', (d: Buffer) => {
        stderr += d.toString('utf8');
      });

      child.on('error', reject);

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, exitCode: 0 });
        } else {
          reject(
            new Error(
              `Command '${command} ${args.join(' ')}' exited with code ${code}: ${stderr}`,
            ),
          );
        }
      });
    });
  }

  private runProcessWithInput(
    command: string,
    args: string[],
    input: string,
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args);
      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (d: Buffer) => {
        stdout += d.toString('utf8');
      });

      child.stderr.on('data', (d: Buffer) => {
        stderr += d.toString('utf8');
      });

      child.on('error', reject);

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, exitCode: 0 });
        } else {
          reject(
            new Error(
              `Command '${command} ${args.join(' ')}' exited with code ${code}: ${stderr}`,
            ),
          );
        }
      });

      child.stdin.write(input);
      child.stdin.end();
    });
  }
}
