import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/server', () => ({
  after: vi.fn(),
}));

import { SqliteEventStore } from '../../apps/web/src/events/sqlite-event-store';
import { DockerSandboxAdapter } from '../../apps/web/src/sandbox/docker-sandbox-adapter';
import { MockSandboxAdapter } from '../../apps/web/src/sandbox/mock-sandbox-adapter';
import { SandboxError } from '../../apps/web/src/sandbox/sandbox';
import { scenario001 } from '../../apps/web/src/scenarios/scenario-001';
import { SqliteTransactionRunner } from '../../apps/web/src/database/sqlite-transaction-runner';
import { SessionService } from '../../apps/web/src/sessions/session-service';
import { SqliteSessionStore } from '../../apps/web/src/sessions/sqlite-session-store';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const volumeExists = (name: string): boolean =>
  spawnSync('docker', ['volume', 'inspect', name]).status === 0;

const containerPaused = (name: string): boolean => {
  const r = spawnSync('docker', ['inspect', '-f', '{{.State.Paused}}', name]);
  return r.status === 0 && r.stdout.toString().trim() === 'true';
};

const containerExists = (name: string): boolean =>
  spawnSync('docker', ['inspect', name]).status === 0;

const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

// ---------------------------------------------------------------------------
// SUITE A: Volume Lifecycle
// ---------------------------------------------------------------------------

describe('T1A.3A — Volume Lifecycle', () => {
  const adapter = new DockerSandboxAdapter({ defaultTimeoutMs: 30_000 });

  it('V-01: creates named volume on sandbox creation', async () => {
    const sessionId = `v01-${Date.now()}`;
    const volName = adapter.getVolumeName(sessionId);
    try {
      expect(volumeExists(volName)).toBe(false);
      await adapter.createAndVerify(sessionId, { 'hello.txt': 'world\n' });
      expect(volumeExists(volName)).toBe(true);
    } finally {
      await adapter.teardown(sessionId).catch(() => {});
    }
  }, 30_000);

  it('V-02: workspace volume is rw for primary sandbox', async () => {
    const sessionId = `v02-${Date.now()}`;
    try {
      await adapter.createAndVerify(sessionId, {});
      const res = await adapter.exec(
        sessionId,
        'cmd-write',
        'echo hello > /workspace/f.txt && cat /workspace/f.txt',
      );
      expect(res.exitCode).toBe(0);
      expect(res.stdoutPreview).toContain('hello');
    } finally {
      await adapter.teardown(sessionId).catch(() => {});
    }
  }, 30_000);

  it('V-03: two sessions have distinct volume names', () => {
    const vol1 = adapter.getVolumeName(`v03a-${Date.now()}`);
    const vol2 = adapter.getVolumeName(`v03b-${Date.now()}`);
    expect(vol1).not.toBe(vol2);
    expect(vol1).toMatch(/^delimit-ws-/);
    expect(vol2).toMatch(/^delimit-ws-/);
  });

  it('V-04: teardown removes container and volume', async () => {
    const sessionId = `v04-${Date.now()}`;
    const container = adapter.getContainerName(sessionId);
    const vol = adapter.getVolumeName(sessionId);
    await adapter.createAndVerify(sessionId, {});
    expect(containerExists(container)).toBe(true);
    expect(volumeExists(vol)).toBe(true);
    await adapter.teardown(sessionId);
    expect(containerExists(container)).toBe(false);
    expect(volumeExists(vol)).toBe(false);
  }, 30_000);

  it('V-05: repeated teardown is idempotent', async () => {
    const sessionId = `v05-${Date.now()}`;
    await adapter.createAndVerify(sessionId, {});
    await adapter.teardown(sessionId);
    await expect(adapter.teardown(sessionId)).resolves.not.toThrow();
  }, 30_000);

  it('V-06: volume name sanitizes special characters', () => {
    const vol = adapter.getVolumeName('ses:sion/with#special@chars!');
    expect(vol).toMatch(/^delimit-ws-[a-zA-Z0-9_-]+$/);
  });

  it('V-07: partial creation failure removes container and volume', async () => {
    const sessionId = `v07-${Date.now()}`;
    const container = adapter.getContainerName(sessionId);
    const volume = adapter.getVolumeName(sessionId);

    await expect(
      adapter.createAndVerify(sessionId, { '../forbidden': 'nope' }),
    ).rejects.toBeDefined();
    expect(containerExists(container)).toBe(false);
    expect(volumeExists(volume)).toBe(false);
  }, 30_000);
});

// ---------------------------------------------------------------------------
// SUITE B: Freeze Primitive
// ---------------------------------------------------------------------------

describe('T1A.3A — Freeze Primitive', () => {
  const adapter = new DockerSandboxAdapter({ defaultTimeoutMs: 30_000 });

  it('F-01: freeze() pauses sandbox; docker inspect confirms Paused=true', async () => {
    const sessionId = `f01-${Date.now()}`;
    const container = adapter.getContainerName(sessionId);
    try {
      await adapter.createAndVerify(sessionId, {});
      expect(containerPaused(container)).toBe(false);
      await adapter.freeze(sessionId);
      expect(containerPaused(container)).toBe(true);
    } finally {
      await adapter.teardown(sessionId).catch(() => {});
    }
  }, 30_000);

  it('F-02: freeze() on non-existent container throws SANDBOX_FREEZE_FAILED', async () => {
    const a = new DockerSandboxAdapter({ defaultTimeoutMs: 10_000 });
    const err = await a.freeze('nonexistent-xyz-99999').catch((e) => e);
    expect(err).toBeInstanceOf(SandboxError);
    expect((err as SandboxError).code).toBe('SANDBOX_FREEZE_FAILED');
  }, 20_000);

  it('F-03: primary container remains paused after short delay', async () => {
    const sessionId = `f03-${Date.now()}`;
    const container = adapter.getContainerName(sessionId);
    try {
      await adapter.createAndVerify(sessionId, {});
      await adapter.freeze(sessionId);
      await new Promise((r) => setTimeout(r, 500));
      expect(containerPaused(container)).toBe(true);
    } finally {
      await adapter.teardown(sessionId).catch(() => {});
    }
  }, 30_000);
});

// ---------------------------------------------------------------------------
// SUITE C: Frozen Evidence Capture (scenario-001)
// ---------------------------------------------------------------------------

describe('T1A.3A — Frozen Evidence Capture', () => {
  const adapter = new DockerSandboxAdapter({
    defaultTimeoutMs: 30_000,
    imageName: 'delimit-scenario-001:latest',
  });

  it('C-01: captureFrozenEvidence returns non-empty currentTree', async () => {
    const sessionId = `c01-${Date.now()}`;
    try {
      await adapter.createAndVerify(sessionId, { scenarioType: 'multi_file' });
      const baseline = await adapter.getBaselineTree(sessionId);
      await adapter.freeze(sessionId);
      const { currentTree } = await adapter.captureFrozenEvidence(
        sessionId,
        baseline,
      );
      expect(currentTree).toBeTruthy();
      expect(typeof currentTree).toBe('string');
    } finally {
      await adapter.teardown(sessionId).catch(() => {});
    }
  }, 120_000);

  it('C-02: two frozen captures of same frozen state return identical currentTree', async () => {
    const sessionId = `c02-${Date.now()}`;
    try {
      await adapter.createAndVerify(sessionId, { scenarioType: 'multi_file' });
      const baseline = await adapter.getBaselineTree(sessionId);
      await adapter.freeze(sessionId);
      const { currentTree: t1 } = await adapter.captureFrozenEvidence(
        sessionId,
        baseline,
      );
      const { currentTree: t2 } = await adapter.captureFrozenEvidence(
        sessionId,
        baseline,
      );
      expect(t1).toBe(t2);
    } finally {
      await adapter.teardown(sessionId).catch(() => {});
    }
  }, 150_000);

  it('C-03: primary remains paused after capture', async () => {
    const sessionId = `c03-${Date.now()}`;
    const container = adapter.getContainerName(sessionId);
    try {
      await adapter.createAndVerify(sessionId, { scenarioType: 'multi_file' });
      const baseline = await adapter.getBaselineTree(sessionId);
      await adapter.freeze(sessionId);
      await adapter.captureFrozenEvidence(sessionId, baseline);
      expect(containerPaused(container)).toBe(true);
      expect(containerExists(`${container}-frozen-capture`)).toBe(false);
    } finally {
      await adapter.teardown(sessionId).catch(() => {});
    }
  }, 120_000);

  it('C-04: captureFrozenEvidence without prior freeze throws SANDBOX_FREEZE_FAILED', async () => {
    const sessionId = `c04-${Date.now()}`;
    try {
      await adapter.createAndVerify(sessionId, { scenarioType: 'multi_file' });
      const baseline = await adapter.getBaselineTree(sessionId);
      const err = await adapter
        .captureFrozenEvidence(sessionId, baseline)
        .catch((e) => e);
      expect(err).toBeInstanceOf(SandboxError);
      expect((err as SandboxError).code).toBe('SANDBOX_FREEZE_FAILED');
    } finally {
      await adapter.teardown(sessionId).catch(() => {});
    }
  }, 30_000);

  it('C-05: diff output captures mutations made before freeze', async () => {
    const sessionId = `c05-${Date.now()}`;
    try {
      await adapter.createAndVerify(sessionId, { scenarioType: 'multi_file' });
      const baseline = await adapter.getBaselineTree(sessionId);
      await adapter.writeFile(
        sessionId,
        'inventory/service.py',
        '# CANDIDATE_MUTATION\n',
      );
      await adapter.freeze(sessionId);
      const { rawDiff } = await adapter.captureFrozenEvidence(
        sessionId,
        baseline,
      );
      expect(rawDiff).toContain('CANDIDATE_MUTATION');
    } finally {
      await adapter.teardown(sessionId).catch(() => {});
    }
  }, 120_000);

  it('C-06: helper image identity is recoverable without process memory', async () => {
    // Create with adapter A, then capture with a fresh adapter B that has
    // no in-process session state — proves Config.Image inspect recovery.
    const sessionId = `c06-${Date.now()}`;
    const creator = new DockerSandboxAdapter({
      defaultTimeoutMs: 30_000,
      imageName: 'delimit-scenario-001:latest',
    });
    const recoverer = new DockerSandboxAdapter({
      defaultTimeoutMs: 30_000,
      // Deliberately different default so process memory cannot be the source.
      imageName: 'alpine:3.20',
    });
    try {
      await creator.createAndVerify(sessionId, { scenarioType: 'multi_file' });
      const baseline = await creator.getBaselineTree(sessionId);
      await creator.freeze(sessionId);
      const { currentTree } = await recoverer.captureFrozenEvidence(
        sessionId,
        baseline,
      );
      expect(currentTree).toBeTruthy();
      expect(containerPaused(creator.getContainerName(sessionId))).toBe(true);
    } finally {
      await creator.teardown(sessionId).catch(() => {});
    }
  }, 120_000);

  it('C-07: helper cannot modify workspace volume (readonly mount)', async () => {
    const sessionId = `c07-${Date.now()}`;
    const volumeName = adapter.getVolumeName(sessionId);
    try {
      await adapter.createAndVerify(sessionId, { scenarioType: 'multi_file' });
      await adapter.writeFile(
        sessionId,
        'inventory/service.py',
        '# BEFORE_HELPER\n',
      );
      await adapter.freeze(sessionId);

      const writeAttempt = spawnSync(
        'docker',
        [
          'run',
          '--rm',
          '--network',
          'none',
          '--read-only',
          '--mount',
          `type=volume,source=${volumeName},target=/workspace,readonly`,
          '--cap-drop=ALL',
          '--security-opt=no-new-privileges:true',
          'delimit-scenario-001:latest',
          'sh',
          '-c',
          'echo MUTATED > /workspace/inventory/service.py',
        ],
        { encoding: 'utf8' },
      );
      expect(writeAttempt.status).not.toBe(0);

      // Primary remains paused; read content via a fresh RO helper mount.
      const readBack = spawnSync(
        'docker',
        [
          'run',
          '--rm',
          '--network',
          'none',
          '--read-only',
          '--mount',
          `type=volume,source=${volumeName},target=/workspace,readonly`,
          '--cap-drop=ALL',
          'delimit-scenario-001:latest',
          'cat',
          '/workspace/inventory/service.py',
        ],
        { encoding: 'utf8' },
      );
      expect(readBack.status).toBe(0);
      expect(readBack.stdout).toContain('BEFORE_HELPER');
      expect(readBack.stdout).not.toContain('MUTATED');
      expect(containerPaused(adapter.getContainerName(sessionId))).toBe(true);
    } finally {
      await adapter.teardown(sessionId).catch(() => {});
    }
  }, 120_000);
});

// ---------------------------------------------------------------------------
// SUITE C2: Pause containment against delayed in-sandbox writers
// ---------------------------------------------------------------------------

describe('T1A.3A — Pause Containment (Docker)', () => {
  const adapter = new DockerSandboxAdapter({
    defaultTimeoutMs: 30_000,
    imageName: 'delimit-scenario-001:latest',
  });

  it('P-01: delayed in-sandbox write cannot mutate /workspace after confirmed pause', async () => {
    const sessionId = `p01-${Date.now()}`;
    const container = adapter.getContainerName(sessionId);
    try {
      await adapter.createAndVerify(sessionId, { scenarioType: 'multi_file' });
      await adapter.writeFile(sessionId, 'freeze-marker.txt', 'PRE_FREEZE\n');

      // Start a delayed writer inside the primary sandbox before freeze.
      // After pause, the sleep/write must not complete against /workspace.
      const delayed = spawnSync(
        'docker',
        [
          'exec',
          '-d',
          container,
          'sh',
          '-c',
          'sleep 2; echo POST_PAUSE_MUTATION > /workspace/freeze-marker.txt',
        ],
        { encoding: 'utf8' },
      );
      expect(delayed.status).toBe(0);

      await adapter.freeze(sessionId);
      expect(containerPaused(container)).toBe(true);

      // Wait longer than the delayed writer's sleep.
      await new Promise((r) => setTimeout(r, 3500));
      expect(containerPaused(container)).toBe(true);

      // Authoritative check via RO helper on the named volume (primary stays paused).
      const vol = adapter.getVolumeName(sessionId);
      const readBack = spawnSync(
        'docker',
        [
          'run',
          '--rm',
          '--network',
          'none',
          '--read-only',
          '--mount',
          `type=volume,source=${vol},target=/workspace,readonly`,
          'delimit-scenario-001:latest',
          'cat',
          '/workspace/freeze-marker.txt',
        ],
        { encoding: 'utf8' },
      );
      expect(readBack.status).toBe(0);
      expect(readBack.stdout).toContain('PRE_FREEZE');
      expect(readBack.stdout).not.toContain('POST_PAUSE_MUTATION');
    } finally {
      await adapter.teardown(sessionId).catch(() => {});
    }
  }, 60_000);
});

// ---------------------------------------------------------------------------
// SUITE D: Manual Submission (MockSandboxAdapter — fast, tests logic)
// ---------------------------------------------------------------------------

describe('T1A.3A — Manual Submission (Mock)', () => {
  let tempDir: string;
  let store: SqliteSessionStore;
  let eventStore: SqliteEventStore;
  let sandbox: MockSandboxAdapter;
  let service: SessionService;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(tmpdir(), 'delimit-mock-sub-'));
    const dbPath = path.join(tempDir, 'test.sqlite');
    store = new SqliteSessionStore(dbPath);
    eventStore = new SqliteEventStore(dbPath);
    sandbox = new MockSandboxAdapter();
    // Let SessionService auto-create AiInteractionService with default options
    service = new SessionService(store, {
      eventStore,
      sandboxAdapter: sandbox,
    });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
    sandbox.failFreeze = false;
    sandbox.failCaptureFrozenEvidence = false;
    sandbox.failTeardown = false;
  });

  it('S-01: submit returns SUBMITTED with closureReason=candidate_submission', async () => {
    const { candidateToken } = service.createSession({
      scenarioId: scenario001.id,
    });
    await service.activate(candidateToken);
    const s = await service.submit(candidateToken);
    expect(s.status).toBe('SUBMITTED');
    expect(s.closureReason).toBe('candidate_submission');
  });

  it('S-02: sandbox torn down after successful submit', async () => {
    const { candidateToken, session } = service.createSession({
      scenarioId: scenario001.id,
    });
    await service.activate(candidateToken);
    expect(sandbox.hasSandbox(session.id)).toBe(true);
    await service.submit(candidateToken);
    expect(sandbox.hasSandbox(session.id)).toBe(false);
  });

  it('S-03: submit is idempotent on already-SUBMITTED session', async () => {
    const { candidateToken } = service.createSession({
      scenarioId: scenario001.id,
    });
    await service.activate(candidateToken);
    const first = await service.submit(candidateToken);
    const second = await service.submit(candidateToken);
    expect(first.status).toBe('SUBMITTED');
    expect(second.id).toBe(first.id);
  });

  it('S-04: freeze failure — session stays ACTIVE; sandbox not torn down', async () => {
    const { candidateToken, session } = service.createSession({
      scenarioId: scenario001.id,
    });
    await service.activate(candidateToken);
    sandbox.failFreeze = true;

    await expect(service.submit(candidateToken)).rejects.toMatchObject({
      code: 'PLATFORM_CAPTURE_FAILED',
    });

    expect(
      store.findByCandidateTokenHash(hashToken(candidateToken)),
    ).toMatchObject({
      status: 'ACTIVE',
      closureReason: 'candidate_submission',
    });
    expect(sandbox.hasSandbox(session.id)).toBe(true);
  });

  it('S-05: capture failure after freeze — session ACTIVE; sandbox frozen and preserved', async () => {
    const { candidateToken, session } = service.createSession({
      scenarioId: scenario001.id,
    });
    await service.activate(candidateToken);
    sandbox.failCaptureFrozenEvidence = true;

    await expect(service.submit(candidateToken)).rejects.toMatchObject({
      code: 'PLATFORM_CAPTURE_FAILED',
    });

    expect(
      store.findByCandidateTokenHash(hashToken(candidateToken)),
    ).toMatchObject({
      status: 'ACTIVE',
      closureReason: 'candidate_submission',
    });
    expect(sandbox.hasSandbox(session.id)).toBe(true);
    expect(sandbox.isFrozen(session.id)).toBe(true);
  });

  it('S-06: teardown failure — session stays SUBMITTED; error does not propagate', async () => {
    const { candidateToken } = service.createSession({
      scenarioId: scenario001.id,
    });
    await service.activate(candidateToken);
    sandbox.failTeardown = true;
    const s = await service.submit(candidateToken);
    expect(s.status).toBe('SUBMITTED');
  });

  it('S-07: teardown failure records SANDBOX_CLEANUP_FAILED event', async () => {
    const { candidateToken, session } = service.createSession({
      scenarioId: scenario001.id,
    });
    await service.activate(candidateToken);
    sandbox.failTeardown = true;
    await service.submit(candidateToken);
    const events = eventStore.getEvents(session.id);
    expect(events.some((e) => e.type === 'SANDBOX_CLEANUP_FAILED')).toBe(true);
  });

  it('S-08: freeze failure records WORKSPACE_CAPTURE_FAILED with phase=submission_freeze', async () => {
    const { candidateToken, session } = service.createSession({
      scenarioId: scenario001.id,
    });
    await service.activate(candidateToken);
    sandbox.failFreeze = true;
    await expect(service.submit(candidateToken)).rejects.toBeDefined();
    const events = eventStore.getEvents(session.id);
    const ev = events.find(
      (e) =>
        e.type === 'WORKSPACE_CAPTURE_FAILED' &&
        (e.payload as { phase: string }).phase === 'submission_freeze',
    );
    expect(ev).toBeDefined();
  });

  it('S-09: capture failure records WORKSPACE_CAPTURE_FAILED with phase=submission_frozen_capture', async () => {
    const { candidateToken, session } = service.createSession({
      scenarioId: scenario001.id,
    });
    await service.activate(candidateToken);
    sandbox.failCaptureFrozenEvidence = true;
    await expect(service.submit(candidateToken)).rejects.toBeDefined();
    const events = eventStore.getEvents(session.id);
    const ev = events.find(
      (e) =>
        e.type === 'WORKSPACE_CAPTURE_FAILED' &&
        (e.payload as { phase: string }).phase === 'submission_frozen_capture',
    );
    expect(ev).toBeDefined();
  });

  it('S-10: capture precedes DB closure and teardown follows it', async () => {
    const { candidateToken, session } = service.createSession({
      scenarioId: scenario001.id,
    });
    await service.activate(candidateToken);

    const capture = sandbox.captureFrozenEvidence.bind(sandbox);
    sandbox.captureFrozenEvidence = async (...args) => {
      expect(store.findById(session.id)).toMatchObject({
        status: 'ACTIVE',
        closureReason: 'candidate_submission',
      });
      return capture(...args);
    };
    const teardown = sandbox.teardown.bind(sandbox);
    sandbox.teardown = async (...args) => {
      expect(store.findById(session.id)?.status).toBe('SUBMITTED');
      return teardown(...args);
    };

    await service.submit(candidateToken);
  });

  it('S-11: DB finalization failure preserves frozen active workspace', async () => {
    const transactionRunner = new SqliteTransactionRunner(store.databasePath);
    const failingService = new SessionService(store, {
      eventStore,
      sandboxAdapter: sandbox,
      transactionRunner,
    });
    const { candidateToken, session } = failingService.createSession({
      scenarioId: scenario001.id,
    });
    await failingService.activate(candidateToken);
    vi.spyOn(transactionRunner, 'run').mockImplementation(() => {
      throw new Error('simulated finalization failure');
    });

    await expect(failingService.submit(candidateToken)).rejects.toThrow(
      'simulated finalization failure',
    );
    expect(store.findById(session.id)).toMatchObject({
      status: 'ACTIVE',
      closureReason: 'candidate_submission',
    });
    expect(sandbox.hasSandbox(session.id)).toBe(true);
    expect(sandbox.isFrozen(session.id)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// SUITE E: Full Submission Integration (Docker, scenario-001)
// ---------------------------------------------------------------------------

describe('T1A.3A — Full Submission Integration', () => {
  let tempDir: string;
  let sandbox: DockerSandboxAdapter;
  let service: SessionService;
  let store: SqliteSessionStore;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(tmpdir(), 'delimit-full-sub-'));
    const dbPath = path.join(tempDir, 'test.sqlite');
    store = new SqliteSessionStore(dbPath);
    const eventStore = new SqliteEventStore(dbPath);
    sandbox = new DockerSandboxAdapter({ defaultTimeoutMs: 30_000 });
    service = new SessionService(store, {
      eventStore,
      sandboxAdapter: sandbox,
    });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('E-01: full multi-file submit with Docker returns SUBMITTED with submittedDiff containing mutations', async () => {
    const { candidateToken, session } = service.createSession({
      scenarioId: scenario001.id,
    });
    const container = sandbox.getContainerName(session.id);
    const vol = sandbox.getVolumeName(session.id);
    try {
      await service.activate(candidateToken);
      await service.saveWorkspaceFile(
        candidateToken,
        'inventory/service.py',
        '# CANDIDATE_CHANGE\n',
      );
      const submitted = await service.submit(candidateToken);
      expect(submitted.status).toBe('SUBMITTED');
      expect(submitted.closureReason).toBe('candidate_submission');
      expect(submitted.submittedDiff).toContain('CANDIDATE_CHANGE');
      expect(containerExists(container)).toBe(false);
      expect(volumeExists(vol)).toBe(false);
    } catch (e) {
      await sandbox.teardown(session.id).catch(() => {});
      throw e;
    }
  }, 240_000);

  it('E-02: volume removed only after SQLite commit (absent after submit returns)', async () => {
    const { candidateToken, session } = service.createSession({
      scenarioId: scenario001.id,
    });
    const vol = sandbox.getVolumeName(session.id);
    try {
      await service.activate(candidateToken);
      expect(volumeExists(vol)).toBe(true);
      await service.submit(candidateToken);
      expect(volumeExists(vol)).toBe(false);
    } catch (e) {
      await sandbox.teardown(session.id).catch(() => {});
      throw e;
    }
  }, 240_000);
});

describe('T1A.3A — Single-File Regression', () => {
  it('R-01: activation, save, and submit work on the named volume', async () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), 'delimit-single-file-'));
    const store = new SqliteSessionStore(path.join(tempDir, 'test.sqlite'));
    const sandbox = new DockerSandboxAdapter({ defaultTimeoutMs: 30_000 });
    const service = new SessionService(store, { sandboxAdapter: sandbox });
    const { candidateToken, session } = service.createSession();

    try {
      await service.activate(candidateToken);
      const content = 'export const changed = true;\n';
      await service.save(candidateToken, content);
      const submitted = await service.submit(candidateToken);
      expect(submitted.status).toBe('SUBMITTED');
      expect(submitted.submittedContent).toBe(content);
      expect(submitted.closureReason).toBe('candidate_submission');
    } finally {
      await sandbox.teardown(session.id).catch(() => {});
      rmSync(tempDir, { recursive: true, force: true });
    }
  }, 30_000);
});
