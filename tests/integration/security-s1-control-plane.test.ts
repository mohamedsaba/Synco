import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { POST as terminalExecRoute } from '../../apps/web/app/api/candidate/sessions/[token]/terminal/exec/route';
import { GET as workspaceFileGetRoute } from '../../apps/web/app/api/candidate/sessions/[token]/workspace/file/route';
import { errorResponse } from '../../apps/web/src/http/error-response';
import { DockerSandboxAdapter } from '../../apps/web/src/sandbox/docker-sandbox-adapter';
import {
  MAX_COMMAND_LENGTH,
  MAX_WORKSPACE_FILE_READ_BYTES,
  SandboxError,
} from '../../apps/web/src/sandbox/sandbox';
import { SessionError } from '../../apps/web/src/sessions/session';
import { SessionService } from '../../apps/web/src/sessions/session-service';
import { SqliteSessionStore } from '../../apps/web/src/sessions/sqlite-session-store';

describe('Security Correction S1 — Control-Plane Hardening', () => {
  let tempDir: string;
  let dbPath: string;
  let adapter: DockerSandboxAdapter;
  let sessionStore: SqliteSessionStore;
  let sessionService: SessionService;
  const sessionId = `sec-s1-${Date.now()}`;
  let candidateToken: string;
  let originalDbPath: string | undefined;

  beforeAll(async () => {
    tempDir = mkdtempSync(path.join(tmpdir(), 'hirearchy-sec-s1-'));
    dbPath = path.join(tempDir, 'test.sqlite');
    originalDbPath = process.env.HIREARCHY_DB_PATH;
    process.env.HIREARCHY_DB_PATH = dbPath;

    adapter = new DockerSandboxAdapter({ defaultTimeoutMs: 15_000 });
    sessionStore = new SqliteSessionStore(dbPath);
    sessionService = new SessionService(sessionStore, {
      sandboxAdapter: adapter,
    });

    const sessionData = sessionService.createSession({
      scenarioId: 'scenario-001',
    });
    candidateToken = sessionData.candidateToken;
    await sessionService.activate(candidateToken);
  }, 45_000);

  afterAll(async () => {
    try {
      await adapter.teardown(sessionId).catch(() => {});
      const session = sessionStore.findByCandidateTokenHash(
        // @ts-expect-error accessing internal or session id
        sessionService.getCandidateSession(candidateToken).candidateTokenHash,
      );
      if (session) {
        await adapter.teardown(session.id).catch(() => {});
      }
    } finally {
      if (originalDbPath !== undefined) {
        process.env.HIREARCHY_DB_PATH = originalDbPath;
      } else {
        delete process.env.HIREARCHY_DB_PATH;
      }
      rmSync(tempDir, { recursive: true, force: true });
    }
  }, 30_000);

  // S1: Path-as-data shell syntax safety
  it('S1: treats filenames containing shell syntax such as $() as literal data and does NOT execute command substitution in writeFile', async () => {
    const session = sessionService.getCandidateSession(candidateToken);
    const targetFile = 'payload-$(touch /tmp/s1_injected).txt';

    await adapter.writeFile(session.id, targetFile, 'safe content');

    // Verify injected file was NOT created inside the container
    const checkInjected = await adapter.exec(
      session.id,
      'check-s1-injected',
      'test -f /tmp/s1_injected && echo "EXISTS" || echo "NOT_FOUND"',
    );
    expect(checkInjected.stdoutPreview.trim()).toBe('NOT_FOUND');

    // Verify the literal file was created and can be read back
    const readBack = await adapter.readFile(session.id, targetFile);
    expect(readBack).toBe('safe content');
  });

  // S2: Normal workspace save succeeds
  it('S2: normal workspace save still succeeds', async () => {
    const session = sessionService.getCandidateSession(candidateToken);
    const normalPath = 'src/normal-test.txt';

    await adapter.writeFile(
      session.id,
      normalPath,
      'hello hirearchy software\n',
    );
    const read = await adapter.readFile(session.id, normalPath);
    expect(read).toBe('hello hirearchy software\n');
  });

  // S3: runProcess rejects when stdout exceeds configured safe bound
  it('S3: runProcess rejects when stdout exceeds configured safe bound', async () => {
    await expect(
      adapter.runProcess(
        'sh',
        ['-c', 'head -c 20000 /dev/zero | tr "\\0" "a"'],
        {
          maxStdoutBytes: 500,
        },
      ),
    ).rejects.toThrowError(/Subprocess stdout exceeded limit of 500 bytes/);
  });

  // S4: runProcess rejects when stderr exceeds configured safe bound
  it('S4: runProcess rejects when stderr exceeds configured safe bound', async () => {
    await expect(
      adapter.runProcess(
        'sh',
        ['-c', 'head -c 20000 /dev/zero | tr "\\0" "e" >&2'],
        {
          maxStderrBytes: 500,
        },
      ),
    ).rejects.toThrowError(/Subprocess stderr exceeded limit of 500 bytes/);
  });

  // S5: runProcess rejects when operation exceeds configured timeout
  it('S5: runProcess rejects when operation exceeds configured timeout', async () => {
    const startTime = Date.now();
    await expect(
      adapter.runProcess('sh', ['-c', 'sleep 10'], {
        timeoutMs: 150,
      }),
    ).rejects.toThrowError(/Subprocess timed out after 150ms/);
    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(5000);
  });

  // S6: Output-bound failure is explicit and does not return a successful truncated authoritative result
  it('S6: authoritative capture operations fail explicitly upon output overflow without returning partial truncated data', async () => {
    const session = sessionService.getCandidateSession(candidateToken);

    // Calling runProcess on an authoritative command with very low stdout bound must throw, not return truncated data
    let thrownError: unknown;
    try {
      await adapter.runProcess(
        'docker',
        [
          'exec',
          adapter.getContainerName(session.id),
          'sh',
          '-c',
          'seq 1 10000',
        ],
        { maxStdoutBytes: 100 },
      );
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).toBeInstanceOf(SandboxError);
    expect((thrownError as SandboxError).code).toBe('SANDBOX_EXECUTION_FAILED');
    expect((thrownError as SandboxError).message).toContain(
      'stdout exceeded limit',
    );
  });

  // S7: Workspace file read exceeding editor/read limit fails explicitly
  it('S7: workspace file read exceeding 100 KB limit fails explicitly rather than returning partial content', async () => {
    expect(MAX_WORKSPACE_FILE_READ_BYTES).toBe(100_000);
    const session = sessionService.getCandidateSession(candidateToken);

    // Create a 120 KB file inside the container
    await adapter.exec(
      session.id,
      'create-large-file',
      'head -c 120000 /dev/zero | tr "\\0" "x" > /workspace/large-file.bin',
    );

    // 1. Adapter readFile rejects explicitly
    await expect(
      adapter.readFile(session.id, 'large-file.bin'),
    ).rejects.toThrowError(/exceeds the maximum supported read size of 100 KB/);

    // 2. SessionService readWorkspaceFile throws SessionError with CONTENT_TOO_LARGE
    await expect(
      sessionService.readWorkspaceFile(candidateToken, 'large-file.bin'),
    ).rejects.toMatchObject({
      name: 'SessionError',
      code: 'CONTENT_TOO_LARGE',
    });

    // 3. HTTP GET endpoint returns HTTP 413 CONTENT_TOO_LARGE
    const req = new Request(
      `http://localhost:3000/api/candidate/sessions/${candidateToken}/workspace/file?path=large-file.bin`,
    );
    const res = await workspaceFileGetRoute(req, {
      params: Promise.resolve({ token: candidateToken }),
    });
    expect(res.status).toBe(413);
    const body = await res.json();
    expect(body).toEqual({
      error: {
        code: 'CONTENT_TOO_LARGE',
        message: 'The file exceeds the 100 KB limit for this scenario.',
      },
    });
  });

  // S8: Existing ordinary workspace reads still succeed
  it('S8: existing ordinary workspace reads under 100 KB succeed completely', async () => {
    const session = sessionService.getCandidateSession(candidateToken);
    await adapter.writeFile(session.id, 'readable.txt', 'exact file content');

    const content = await sessionService.readWorkspaceFile(
      candidateToken,
      'readable.txt',
    );
    expect(content).toBe('exact file content');

    const req = new Request(
      `http://localhost:3000/api/candidate/sessions/${candidateToken}/workspace/file?path=readable.txt`,
    );
    const res = await workspaceFileGetRoute(req, {
      params: Promise.resolve({ token: candidateToken }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      path: 'readable.txt',
      content: 'exact file content',
    });
  });

  // S9: Candidate terminal execution behavior remains intact
  it('S9: candidate terminal execution preserves arbitrary shell syntax, command timeouts, and bounded preview', async () => {
    const session = sessionService.getCandidateSession(candidateToken);

    // Arbitrary shell syntax (pipes, loops, environment variables)
    const shellRes = await adapter.exec(
      session.id,
      'cmd-shell-syntax',
      'VAL="hirearchy"; echo "start-$VAL" | tr "a-z" "A-Z"',
    );
    expect(shellRes.exitCode).toBe(0);
    expect(shellRes.stdoutPreview.trim()).toBe('START-HIREARCHY');

    // Command timeout terminates and reports timedOut: true
    const timeoutRes = await adapter.exec(
      session.id,
      'cmd-timeout-test',
      'sleep 5',
      '/workspace',
      200,
    );
    expect(timeoutRes.timedOut).toBe(true);
    expect(timeoutRes.exitCode).toBeNull();

    // Bounded preview truncates cleanly at accumulator threshold
    const floodRes = await adapter.exec(
      session.id,
      'cmd-flood-test',
      'head -c 70000 /dev/zero | tr "\\0" "k"',
    );
    expect(floodRes.stdoutTruncated).toBe(true);
    expect(floodRes.stdoutBytes).toBe(70000);
    expect(floodRes.stdoutPreview.length).toBeLessThanOrEqual(64 * 1024);
  });

  // S10 & S11: HTTP error redaction of infrastructure details
  it('S10 & S11: sandbox infrastructure errors over HTTP do NOT contain Docker invocation strings, container names, internal paths, or raw stderr', async () => {
    const leakySandboxError = new SandboxError(
      'SANDBOX_EXECUTION_FAILED',
      "Command 'docker exec -u 0:0 hirearchy-sandbox-test_123 /usr/local/bin/hirearchy-capture-tree.sh' exited with code 1: cat: can't open '/workspace/secret': No such file or directory",
    );

    const res = errorResponse(leakySandboxError);
    expect(res.status).toBe(503);
    const body = await res.json();

    // S10: Verify sensitive diagnostics are redacted
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain('docker');
    expect(serialized).not.toContain('hirearchy-sandbox');
    expect(serialized).not.toContain('/usr/local/bin');
    expect(serialized).not.toContain("can't open");

    // S11: Verify stable safe public code and message
    expect(body).toEqual({
      error: {
        code: 'SANDBOX_EXECUTION_FAILED',
        message: 'Sandbox execution failed.',
      },
    });

    // Also verify PLATFORM_CAPTURE_FAILED redaction
    const leakyPlatformError = new SessionError(
      'PLATFORM_CAPTURE_FAILED',
      "Pre-command workspace capture failed: Command 'docker exec hirearchy-sandbox-456 /usr/local/bin/hirearchy-baseline-tree.sh' exited with code 1: fatal: not a git repo",
    );
    const platformRes = errorResponse(leakyPlatformError);
    expect(platformRes.status).toBe(500);
    const platformBody = await platformRes.json();
    const platformSerialized = JSON.stringify(platformBody);
    expect(platformSerialized).not.toContain('docker');
    expect(platformSerialized).not.toContain('hirearchy-sandbox');
    expect(platformSerialized).not.toContain('/usr/local/bin');
    expect(platformBody).toEqual({
      error: {
        code: 'PLATFORM_CAPTURE_FAILED',
        message: 'Workspace capture failed.',
      },
    });
  });

  // S12: Oversized terminal command input is rejected
  it('S12: oversized terminal command input is rejected at both route and domain layer', async () => {
    const oversizedCommand = 'echo ' + 'x'.repeat(MAX_COMMAND_LENGTH + 10);

    // 1. Domain service rejection
    await expect(
      sessionService.executeCommand(candidateToken, oversizedCommand),
    ).rejects.toMatchObject({
      name: 'SessionError',
      code: 'COMMAND_TOO_LARGE',
    });

    // 2. HTTP route rejection
    const req = new Request(
      `http://localhost:3000/api/candidate/sessions/${candidateToken}/terminal/exec`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: oversizedCommand }),
      },
    );
    const res = await terminalExecRoute(req, {
      params: Promise.resolve({ token: candidateToken }),
    });
    expect(res.status).toBe(413);
    const body = await res.json();
    expect(body).toEqual({
      error: {
        code: 'COMMAND_TOO_LARGE',
        message: `Command exceeds the maximum limit of ${MAX_COMMAND_LENGTH} characters.`,
      },
    });
  });

  // S13: Normal terminal command input remains accepted
  it('S13: normal terminal command input remains accepted and executes', async () => {
    const req = new Request(
      `http://localhost:3000/api/candidate/sessions/${candidateToken}/terminal/exec`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'echo "normal command"' }),
      },
    );
    const res = await terminalExecRoute(req, {
      params: Promise.resolve({ token: candidateToken }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stdoutPreview.trim()).toBe('normal command');
    expect(body.exitCode).toBe(0);
  });
});
