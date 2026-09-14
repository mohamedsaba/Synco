import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SqliteEventStore } from '../../apps/web/src/events/sqlite-event-store';
import { DockerSandboxAdapter } from '../../apps/web/src/sandbox/docker-sandbox-adapter';
import { SessionError } from '../../apps/web/src/sessions/session';
import { SessionService } from '../../apps/web/src/sessions/session-service';
import { SqliteSessionStore } from '../../apps/web/src/sessions/sqlite-session-store';

describe('Manual End-to-End Acceptance Demo (17 steps)', () => {
  let directory: string;
  let databasePath: string;

  beforeEach(() => {
    directory = mkdtempSync(path.join(tmpdir(), 'delimit-demo-'));
    databasePath = path.join(directory, 'demo.sqlite');
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  it('verifies all 17 steps of the candidate command execution and evaluator evidence lifecycle', async () => {
    const eventStore = new SqliteEventStore(databasePath);
    const sessionStore = new SqliteSessionStore(databasePath);
    const sandboxAdapter = new DockerSandboxAdapter({ defaultTimeoutMs: 3000 });

    const service = new SessionService(sessionStore, {
      eventStore,
      sandboxAdapter,
    });

    // 1. create/load assessment
    const { candidateToken, session } = service.createSession();
    expect(session.id).toBeDefined();
    expect(session.status).toBe('CREATED');

    // 3. confirm readiness before ACTIVE (container does NOT exist yet, session is CREATED)
    const containerName = sandboxAdapter.getContainerName(session.id);
    const inspectPre = spawnSync('docker', ['inspect', containerName]);
    expect(inspectPre.status).not.toBe(0);

    // 2. activate session (readiness gate runs: creates container, checks readiness, then transitions to ACTIVE)
    const activated = await service.activate(candidateToken);
    expect(activated.status).toBe('ACTIVE');
    expect(activated.activatedAt).toBeDefined();

    const inspectPost = spawnSync('docker', ['inspect', containerName]);
    expect(inspectPost.status).toBe(0);

    // 4. execute successful command
    const resSuccess = await service.executeCommand(candidateToken, 'pwd');
    expect(resSuccess.exitCode).toBe(0);
    expect(resSuccess.timedOut).toBe(false);
    expect(resSuccess.stdoutPreview.trim()).toBe('/workspace');

    // 5. execute failing command (candidate error, not platform error)
    const resFail = await service.executeCommand(
      candidateToken,
      'sh -c "exit 7"',
    );
    expect(resFail.exitCode).toBe(7);
    expect(resFail.timedOut).toBe(false);

    // 6. modify a file through command execution
    const resMod = await service.executeCommand(
      candidateToken,
      'echo "persistent state" > /workspace/demo_state.txt',
    );
    expect(resMod.exitCode).toBe(0);

    // 7. execute another command and prove filesystem persistence
    const resCat = await service.executeCommand(
      candidateToken,
      'cat /workspace/demo_state.txt',
    );
    expect(resCat.exitCode).toBe(0);
    expect(resCat.stdoutPreview).toBe('persistent state\n');

    // 8. produce stdout
    const resStdout = await service.executeCommand(
      candidateToken,
      'echo "stdout demo message"',
    );
    expect(resStdout.stdoutPreview).toBe('stdout demo message\n');
    expect(resStdout.stdoutBytes).toBe(20);
    expect(resStdout.stdoutTruncated).toBe(false);

    // 9. produce stderr
    const resStderr = await service.executeCommand(
      candidateToken,
      'sh -c "echo stderr warning message >&2"',
    );
    expect(resStderr.stderrPreview).toBe('stderr warning message\n');
    expect(resStderr.stderrBytes).toBe(23);
    expect(resStderr.stderrTruncated).toBe(false);

    // 10. produce output above preview limit and inspect truncation
    const resTrunc = await service.executeCommand(
      candidateToken,
      'head -c 80000 /dev/zero | tr "\\0" "A"',
    );
    expect(resTrunc.stdoutBytes).toBe(80000);
    expect(resTrunc.stdoutTruncated).toBe(true);
    expect(resTrunc.stdoutPreview.length).toBeLessThanOrEqual(64 * 1024);

    // 11. execute timeout case with descendants
    const resTimeout = await service.executeCommand(
      candidateToken,
      'sh -c "(while true; do echo leak >> /workspace/leak.txt; sleep 0.05; done) & sleep 10"',
    );
    expect(resTimeout.timedOut).toBe(true);
    expect(resTimeout.exitCode).toBe(null);

    // Prove background loop stopped executing
    const read1 = await service.executeCommand(
      candidateToken,
      'wc -l < /workspace/leak.txt',
    );
    const count1 = read1.stdoutPreview.trim();
    await new Promise((r) => setTimeout(r, 200));
    const read2 = await service.executeCommand(
      candidateToken,
      'wc -l < /workspace/leak.txt',
    );
    const count2 = read2.stdoutPreview.trim();
    expect(count2).toBe(count1);

    // 12. inspect evaluator chronological events
    const preSubmitEvents = eventStore.getEvents(session.id);
    expect(preSubmitEvents.length).toBeGreaterThan(10);
    // Every command produced a pair: STARTED followed by FINISHED
    for (let i = 0; i < preSubmitEvents.length; i += 2) {
      expect(preSubmitEvents[i].type).toBe('COMMAND_STARTED');
      expect(preSubmitEvents[i + 1].type).toBe('COMMAND_FINISHED');
      expect(
        (preSubmitEvents[i].payload as { commandId: string }).commandId,
      ).toBe(
        (preSubmitEvents[i + 1].payload as { commandId: string }).commandId,
      );
      expect(preSubmitEvents[i].sequence).toBe(i + 1);
      expect(preSubmitEvents[i + 1].sequence).toBe(i + 2);
    }

    // 13. save candidate file
    const saved = await service.save(
      candidateToken,
      'export function formatGreeting(name: string): string {\n  return `Hello, ${name.trim()}!`;\n}\n',
    );
    expect(saved.workingContent).toContain('name.trim()');

    // 14. submit
    const submitted = await service.submit(candidateToken);
    expect(submitted.status).toBe('SUBMITTED');
    expect(submitted.submittedAt).toBeDefined();

    // 15. verify container teardown
    const inspectTeardown = spawnSync('docker', ['inspect', containerName]);
    expect(inspectTeardown.status).not.toBe(0);

    // 16. attempt post-submission command and verify rejection
    await expect(
      service.executeCommand(candidateToken, 'pwd'),
    ).rejects.toThrowError(SessionError);

    // 17. reopen evaluator and verify
    const evidence = service.getSubmittedEvidence(session.id);
    expect(evidence.diff).toContain('+  return `Hello, ${name.trim()}!`;');
    expect(evidence.events.length).toBe(preSubmitEvents.length);

    // Check last command in evidence (the timeout command)
    const timeoutEvent = evidence.events.find(
      (e) =>
        e.type === 'COMMAND_FINISHED' &&
        (e.payload as { timedOut?: boolean }).timedOut === true,
    );
    expect(timeoutEvent).toBeDefined();
    expect((timeoutEvent?.payload as { exitCode: null }).exitCode).toBe(null);
  }, 60_000);
});
