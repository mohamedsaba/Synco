import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SqliteEventStore } from '../../apps/web/src/events/sqlite-event-store';
import { MockSandboxAdapter } from '../../apps/web/src/sandbox/mock-sandbox-adapter';
import { SandboxError } from '../../apps/web/src/sandbox/sandbox';
import { SessionError } from '../../apps/web/src/sessions/session';
import { SessionService } from '../../apps/web/src/sessions/session-service';
import { SqliteSessionStore } from '../../apps/web/src/sessions/sqlite-session-store';

describe('command execution and event capture integration', () => {
  let directory: string;
  let databasePath: string;

  beforeEach(() => {
    directory = mkdtempSync(path.join(tmpdir(), 'delimit-command-test-'));
    databasePath = path.join(directory, 'test.sqlite');
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  it('records correlated COMMAND_STARTED and COMMAND_FINISHED events and preserves state across commands', async () => {
    const sandboxAdapter = new MockSandboxAdapter();
    const eventStore = new SqliteEventStore(databasePath);
    const sessionStore = new SqliteSessionStore(databasePath);

    const service = new SessionService(sessionStore, {
      eventStore,
      sandboxAdapter,
    });

    const { candidateToken, session } = service.createSession();

    // 1. Cannot execute commands before activation
    await expect(
      service.executeCommand(candidateToken, 'pwd'),
    ).rejects.toThrowError(SessionError);

    // 2. Activate session (creates sandbox)
    await service.activate(candidateToken);
    expect(sandboxAdapter.hasSandbox(session.id)).toBe(true);

    // 3. Execute command 1: write a file in /workspace
    const res1 = await service.executeCommand(
      candidateToken,
      'echo "persistent state" > /workspace/shared.txt',
    );
    expect(res1.exitCode).toBe(0);
    expect(res1.commandId).toMatch(/^cmd_/);

    // 4. Execute command 2: read that file back (proves session-scoped persistence)
    const res2 = await service.executeCommand(
      candidateToken,
      'cat /workspace/shared.txt',
    );
    expect(res2.exitCode).toBe(0);
    expect(res2.stdoutPreview).toBe('persistent state\n');

    // 5. Execute command 3: failing command (exitCode 1) is captured as factual evidence
    const res3 = await service.executeCommand(candidateToken, 'false');
    expect(res3.exitCode).toBe(1);
    expect(res3.timedOut).toBe(false);

    // 6. Submit session
    await service.submit(candidateToken);

    // Sandbox is torn down upon submission
    expect(sandboxAdapter.hasSandbox(session.id)).toBe(false);

    // Commands after submission are rejected
    await expect(
      service.executeCommand(candidateToken, 'pwd'),
    ).rejects.toThrowError(SessionError);

    // 7. Evaluator retrieves submitted evidence including chronological raw command events
    const evidence = service.getSubmittedEvidence(session.id);
    expect(evidence.diff).toBeDefined();
    expect(evidence.events).toHaveLength(6); // 3 commands * 2 events each (STARTED + FINISHED)

    // Check sequence numbers and correlation
    const [start1, finish1, start2, finish2, start3, finish3] = evidence.events;

    expect(start1.sequence).toBe(1);
    expect(start1.type).toBe('COMMAND_STARTED');
    expect(start1.payload).toMatchObject({
      commandId: res1.commandId,
      command: 'echo "persistent state" > /workspace/shared.txt',
    });

    expect(finish1.sequence).toBe(2);
    expect(finish1.type).toBe('COMMAND_FINISHED');
    expect(finish1.payload).toMatchObject({
      commandId: res1.commandId,
      exitCode: 0,
    });

    expect(start2.sequence).toBe(3);
    expect(finish2.sequence).toBe(4);
    expect(start3.sequence).toBe(5);
    expect(finish3.sequence).toBe(6);
    expect(finish3.payload).toMatchObject({
      commandId: res3.commandId,
      exitCode: 1,
    });
  });

  it('distinguishes candidate command failure from platform infrastructure failure', async () => {
    const sandboxAdapter = new MockSandboxAdapter();
    const eventStore = new SqliteEventStore(databasePath);
    const sessionStore = new SqliteSessionStore(databasePath);

    const service = new SessionService(sessionStore, {
      eventStore,
      sandboxAdapter,
    });

    const { candidateToken, session } = service.createSession();
    await service.activate(candidateToken);

    // 1. Candidate command failure (e.g. exit 7)
    // Should finish normally, record exitCode: 7, timedOut: false, and log COMMAND_FINISHED
    sandboxAdapter.customExecHandler = (cmd) => {
      if (cmd === 'exit 7') {
        return { exitCode: 7, stderr: 'Command failed with code 7\n' };
      }
      return { exitCode: 0 };
    };

    const resFail = await service.executeCommand(candidateToken, 'exit 7');
    expect(resFail.exitCode).toBe(7);
    expect(resFail.timedOut).toBe(false);

    const eventsAfterCandidateFail = eventStore.getEvents(session.id);
    expect(eventsAfterCandidateFail).toHaveLength(2); // STARTED + FINISHED
    expect(eventsAfterCandidateFail[1].type).toBe('COMMAND_FINISHED');
    expect(eventsAfterCandidateFail[1].payload).toMatchObject({
      commandId: resFail.commandId,
      exitCode: 7,
      timedOut: false,
    });

    // 2. Platform infrastructure failure (e.g. container crash / transport breakdown)
    // Should NOT record candidate exitCode, should NOT record COMMAND_FINISHED, must throw SandboxError
    sandboxAdapter.customExecHandler = () => {
      throw new SandboxError(
        'SANDBOX_EXECUTION_FAILED',
        'Simulated Docker transport crash',
      );
    };

    await expect(
      service.executeCommand(candidateToken, 'ls -la'),
    ).rejects.toThrowError(SandboxError);

    // Verify events: COMMAND_STARTED was logged, but COMMAND_FINISHED was NOT logged!
    // No fake candidate evidence is fabricated.
    const eventsAfterPlatformFail = eventStore.getEvents(session.id);
    expect(eventsAfterPlatformFail).toHaveLength(3); // 2 from previous + 1 STARTED for ls -la
    expect(eventsAfterPlatformFail[2].type).toBe('COMMAND_STARTED');
  });

  it('proves submission teardown is idempotent and permanently rejects subsequent commands', async () => {
    const sandboxAdapter = new MockSandboxAdapter();
    const eventStore = new SqliteEventStore(databasePath);
    const sessionStore = new SqliteSessionStore(databasePath);

    const service = new SessionService(sessionStore, {
      eventStore,
      sandboxAdapter,
    });

    const { candidateToken, session } = service.createSession();
    await service.activate(candidateToken);
    expect(sandboxAdapter.hasSandbox(session.id)).toBe(true);

    // First submission tears down sandbox
    const sub1 = await service.submit(candidateToken);
    expect(sub1.status).toBe('SUBMITTED');
    expect(sandboxAdapter.hasSandbox(session.id)).toBe(false);

    // Second submission is idempotent
    const sub2 = await service.submit(candidateToken);
    expect(sub2.status).toBe('SUBMITTED');
    expect(sandboxAdapter.hasSandbox(session.id)).toBe(false);

    // Commands after submission are strictly rejected without creating events or starting containers
    await expect(
      service.executeCommand(candidateToken, 'echo "forbidden"'),
    ).rejects.toThrowError(SessionError);

    expect(sandboxAdapter.hasSandbox(session.id)).toBe(false);
    expect(eventStore.getEvents(session.id)).toHaveLength(0);
  });
});
