import { createHash } from 'node:crypto';
import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AiInteractionService } from '../../apps/web/src/ai/ai-interaction-service';
import { SqliteAiInteractionStore } from '../../apps/web/src/ai/sqlite-ai-interaction-store';
import { SqliteTransactionRunner } from '../../apps/web/src/database/sqlite-transaction-runner';
import { SqliteEventStore } from '../../apps/web/src/events/sqlite-event-store';
import { MockSandboxAdapter } from '../../apps/web/src/sandbox/mock-sandbox-adapter';
import type { CommandExecResult } from '../../apps/web/src/sandbox/sandbox';
import { scenario001 } from '../../apps/web/src/scenarios/scenario-001';
import { SessionOperationCoordinator } from '../../apps/web/src/sessions/session-operation-coordinator';
import { SessionService } from '../../apps/web/src/sessions/session-service';
import { SqliteSessionStore } from '../../apps/web/src/sessions/sqlite-session-store';

const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

const commandResult = (commandId: string): CommandExecResult => ({
  commandId,
  exitCode: 0,
  timedOut: false,
  durationMs: 1,
  stdoutPreview: '',
  stdoutBytes: 0,
  stdoutTruncated: false,
  stderrPreview: '',
  stderrBytes: 0,
  stderrTruncated: false,
});

describe('T1B.1 — Authoritative Deadline Convergence', () => {
  let tempDir: string;
  let databasePath: string;
  let now: string;
  let store: SqliteSessionStore;
  let eventStore: SqliteEventStore;
  let sandbox: MockSandboxAdapter;
  let coordinator: SessionOperationCoordinator;
  let transactionRunner: SqliteTransactionRunner;
  let service: SessionService;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(tmpdir(), 'delimit-t1b1-'));
    databasePath = path.join(tempDir, 'test.sqlite');
    now = '2026-09-21T10:00:00.000Z';
    store = new SqliteSessionStore(databasePath);
    eventStore = new SqliteEventStore(databasePath);
    sandbox = new MockSandboxAdapter();
    coordinator = new SessionOperationCoordinator();
    transactionRunner = new SqliteTransactionRunner(databasePath);
    service = new SessionService(store, {
      now: () => now,
      eventStore,
      sandboxAdapter: sandbox,
      coordinator,
      transactionRunner,
      commandTimeoutMs: 1_000,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    rmSync(tempDir, { recursive: true, force: true });
  });

  const createActive = async () => {
    const created = service.createSession({
      scenario: { ...scenario001, durationSeconds: 10 },
    });
    await service.activate(created.candidateToken);
    return created;
  };

  it('bounds commands by normal timeout, exact remaining milliseconds, and the deadline', async () => {
    const { candidateToken } = await createActive();
    const exec = vi.spyOn(sandbox, 'exec');

    now = '2026-09-21T10:00:01.000Z';
    await service.executeCommand(candidateToken, 'pwd');
    expect(exec.mock.calls[0]?.[4]).toBe(1_000);

    now = '2026-09-21T10:00:09.750Z';
    await service.executeCommand(candidateToken, 'sleep 2');
    expect(exec.mock.calls[1]?.[4]).toBe(250);

    now = '2026-09-21T10:00:10.000Z';
    await expect(
      service.executeCommand(candidateToken, 'pwd'),
    ).rejects.toMatchObject({ code: 'SESSION_DEADLINE_EXCEEDED' });
    expect(exec).toHaveBeenCalledTimes(2);
  });

  it('keeps the normal command bound for legacy untimed sessions', async () => {
    const { candidateToken } = await createActive();
    const database = new Database(databasePath);
    database
      .prepare('UPDATE assessment_sessions SET duration_seconds = NULL')
      .run();
    database.close();
    const exec = vi.spyOn(sandbox, 'exec');
    now = '2030-01-01T00:00:00.000Z';

    await service.executeCommand(candidateToken, 'pwd');
    expect(exec.mock.calls[0]?.[4]).toBe(1_000);
  });

  it('preserves trusted pre-deadline submit admission across the FIFO wait', async () => {
    const { candidateToken, session } = await createActive();
    const gate = deferred();
    const blocker = coordinator.run(session.id, () => gate.promise);
    now = '2026-09-21T10:00:09.950Z';
    const submission = service.submit(candidateToken);
    now = '2026-09-21T10:00:11.000Z';
    gate.resolve();
    await blocker;

    expect((await submission).closureReason).toBe('candidate_submission');
  });

  it('converges exact-deadline and post-deadline manual submits through timeout closure', async () => {
    const exact = await createActive();
    now = '2026-09-21T10:00:10.000Z';
    expect((await service.submit(exact.candidateToken)).closureReason).toBe(
      'timeout',
    );

    now = '2026-09-21T11:00:00.000Z';
    const late = await createActive();
    now = '2026-09-21T11:00:11.000Z';
    expect((await service.submit(late.candidateToken)).closureReason).toBe(
      'timeout',
    );
  });

  it('does not grant queued engineering mutations submit privilege', async () => {
    const { candidateToken, session } = await createActive();
    const gate = deferred();
    const blocker = coordinator.run(session.id, () => gate.promise);
    now = '2026-09-21T10:00:09.950Z';
    const save = service.saveWorkspaceFile(
      candidateToken,
      'inventory/service.py',
      '# late\n',
    );
    now = '2026-09-21T10:00:10.001Z';
    gate.resolve();
    await blocker;

    await expect(save).rejects.toMatchObject({
      code: 'SESSION_DEADLINE_EXCEEDED',
    });
  });

  it('keeps a pre-deadline submit behind a long command as candidate_submission', async () => {
    const { candidateToken } = await createActive();
    const entered = deferred();
    const release = deferred();
    vi.spyOn(sandbox, 'exec').mockImplementation(
      async (_sessionId, commandId) => {
        entered.resolve();
        await release.promise;
        return commandResult(commandId);
      },
    );
    now = '2026-09-21T10:00:09.900Z';
    const command = service.executeCommand(candidateToken, 'sleep 20');
    await entered.promise;
    const submission = service.submit(candidateToken);
    now = '2026-09-21T10:00:10.500Z';
    release.resolve();
    await command;

    expect((await submission).closureReason).toBe('candidate_submission');
  });

  it('orders submit and timeout finalization by same-session FIFO', async () => {
    const first = await createActive();
    const firstGate = deferred();
    const firstBlocker = coordinator.run(
      first.session.id,
      () => firstGate.promise,
    );
    now = '2026-09-21T10:00:09.950Z';
    const timelySubmit = service.submit(first.candidateToken);
    now = '2026-09-21T10:00:10.005Z';
    const laterSweep = service.sweepTimedOutSessions();
    firstGate.resolve();
    await firstBlocker;
    expect((await timelySubmit).closureReason).toBe('candidate_submission');
    await laterSweep;

    now = '2026-09-21T11:00:00.000Z';
    const second = await createActive();
    const secondGate = deferred();
    const secondBlocker = coordinator.run(
      second.session.id,
      () => secondGate.promise,
    );
    now = '2026-09-21T11:00:10.005Z';
    const firstSweep = service.sweepTimedOutSessions();
    const lateSubmit = service.submit(second.candidateToken);
    secondGate.resolve();
    await secondBlocker;
    await firstSweep;
    expect((await lateSubmit).closureReason).toBe('timeout');
  });

  it('makes repeated candidate and timeout finalization idempotent', async () => {
    const timely = await createActive();
    now = '2026-09-21T10:00:09.000Z';
    await service.submit(timely.candidateToken);
    now = '2026-09-21T10:00:20.000Z';
    await service.sweepTimedOutSessions();
    expect(store.findById(timely.session.id)?.closureReason).toBe(
      'candidate_submission',
    );

    now = '2026-09-21T11:00:00.000Z';
    const overdue = await createActive();
    now = '2026-09-21T11:00:20.000Z';
    await service.sweepTimedOutSessions();
    await service.sweepTimedOutSessions();
    expect(store.findById(overdue.session.id)?.closureReason).toBe('timeout');
  });

  it('freezes, captures, commits timeout, tears down, and triggers reconstruction in order', async () => {
    const order: string[] = [];
    const reconstruct = vi.fn(async () => {
      order.push('reconstruct');
    });
    service = new SessionService(store, {
      now: () => now,
      eventStore,
      sandboxAdapter: sandbox,
      coordinator,
      transactionRunner,
      onSessionFinalized: reconstruct,
    });
    const { session } = await createActive();
    for (const method of [
      'freeze',
      'captureFrozenEvidence',
      'teardown',
    ] as const) {
      const original = sandbox[method].bind(sandbox);
      vi.spyOn(sandbox, method).mockImplementation(async (...args: never[]) => {
        order.push(method);
        return original(...args);
      });
    }
    now = '2026-09-21T10:00:11.000Z';
    await service.sweepTimedOutSessions();

    expect(store.findById(session.id)).toMatchObject({
      status: 'SUBMITTED',
      closureReason: 'timeout',
      submittedAt: '2026-09-21T10:00:11.000Z',
    });
    expect(order).toEqual([
      'freeze',
      'captureFrozenEvidence',
      'teardown',
      'reconstruct',
    ]);
  });

  it('cancels open AI interactions with session_ended during timeout closure', async () => {
    const aiStore = new SqliteAiInteractionStore(databasePath);
    const aiService = new AiInteractionService({
      sessionStore: store,
      eventStore,
      aiInteractionStore: aiStore,
      transactionRunner,
      now: () => now,
    });
    service = new SessionService(store, {
      now: () => now,
      eventStore,
      sandboxAdapter: sandbox,
      coordinator,
      transactionRunner,
      aiInteractionService: aiService,
    });
    const { session } = service.createSession({
      scenario: { ...scenario001, durationSeconds: 10 },
      aiCapability: {
        enabled: true,
        configuredProviderId: 'mock',
        configuredModelId: 'mock-model',
      },
    });
    const token = 'known-token';
    const database = new Database(databasePath);
    database
      .prepare(
        'UPDATE assessment_sessions SET candidate_token_hash = ? WHERE id = ?',
      )
      .run(hashToken(token), session.id);
    database.close();
    await service.activate(token);
    const admitted = aiService.admitInteraction(session.id, {
      clientRequestId: 'request-1',
      candidatePromptText: 'inspect this',
    });
    now = '2026-09-21T10:00:11.000Z';
    await service.sweepTimedOutSessions();

    expect(aiStore.findById(admitted.interaction.id)).toMatchObject({
      status: 'CANCELLED',
      terminalReason: 'session_ended',
    });
  });

  it('preserves retryable state for freeze, capture, and DB failures, then retries paused state', async () => {
    const freezeFailure = await createActive();
    sandbox.failFreeze = true;
    now = '2026-09-21T10:00:11.000Z';
    await service.sweepTimedOutSessions();
    expect(store.findById(freezeFailure.session.id)?.status).toBe('ACTIVE');
    expect(sandbox.hasSandbox(freezeFailure.session.id)).toBe(true);
    sandbox.failFreeze = false;

    now = '2026-09-21T11:00:00.000Z';
    const captureFailure = await createActive();
    sandbox.failCaptureFrozenEvidence = true;
    now = '2026-09-21T11:00:11.000Z';
    await service.sweepTimedOutSessions();
    expect(store.findById(captureFailure.session.id)?.status).toBe('ACTIVE');
    expect(sandbox.isFrozen(captureFailure.session.id)).toBe(true);
    sandbox.failCaptureFrozenEvidence = false;
    await service.sweepTimedOutSessions();
    expect(store.findById(captureFailure.session.id)?.closureReason).toBe(
      'timeout',
    );

    now = '2026-09-21T12:00:00.000Z';
    const databaseFailure = await createActive();
    vi.spyOn(transactionRunner, 'run').mockImplementationOnce(() => {
      throw new Error('simulated DB failure');
    });
    now = '2026-09-21T12:00:11.000Z';
    await service.sweepTimedOutSessions();
    expect(store.findById(databaseFailure.session.id)?.status).toBe('ACTIVE');
    expect(sandbox.isFrozen(databaseFailure.session.id)).toBe(true);
    await service.sweepTimedOutSessions();
    expect(store.findById(databaseFailure.session.id)?.closureReason).toBe(
      'timeout',
    );
  });

  it('keeps durable timeout closure when teardown fails and ignores legacy untimed sessions', async () => {
    const timed = await createActive();
    sandbox.failTeardown = true;
    now = '2026-09-21T10:00:11.000Z';
    await service.sweepTimedOutSessions();
    expect(store.findById(timed.session.id)).toMatchObject({
      status: 'SUBMITTED',
      closureReason: 'timeout',
    });

    sandbox.failTeardown = false;
    now = '2026-09-21T11:00:00.000Z';
    const legacy = await createActive();
    const database = new Database(databasePath);
    database
      .prepare(
        'UPDATE assessment_sessions SET duration_seconds = NULL WHERE id = ?',
      )
      .run(legacy.session.id);
    database.close();
    now = '2030-01-01T00:00:00.000Z';
    await service.sweepTimedOutSessions();
    expect(store.findById(legacy.session.id)?.status).toBe('ACTIVE');
  });
});
