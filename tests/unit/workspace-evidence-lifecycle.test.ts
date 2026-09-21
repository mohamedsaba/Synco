import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type {
  SessionEvent,
  WorkspaceCaptureFailedPayload,
  WorkspaceChangedPayload,
} from '../../apps/web/src/events/session-event';
import { SqliteEventStore } from '../../apps/web/src/events/sqlite-event-store';
import { MockSandboxAdapter } from '../../apps/web/src/sandbox/mock-sandbox-adapter';
import { SessionService } from '../../apps/web/src/sessions/session-service';
import { SqliteSessionStore } from '../../apps/web/src/sessions/sqlite-session-store';

class InconsistentSubmissionEventStore extends SqliteEventStore {
  private readCount = 0;

  override getEvents(sessionId: string): readonly SessionEvent[] {
    const events = super.getEvents(sessionId);
    this.readCount += 1;
    if (this.readCount !== 3) {
      return events;
    }

    const lastWorkspaceEventIndex = events.findLastIndex(
      (event) => event.type === 'WORKSPACE_CHANGED',
    );
    return events.map((event, index) => {
      if (index !== lastWorkspaceEventIndex) {
        return event;
      }

      return {
        ...event,
        payload: {
          ...(event.payload as WorkspaceChangedPayload),
          afterTree: '0000000000000000000000000000000000000000',
        },
      };
    });
  }
}

describe('Workspace Evidence Lifecycle & Edge Cases (Mock)', () => {
  let tempDir: string;
  let dbPath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(tmpdir(), 'delimit-mock-test-'));
    dbPath = path.join(tempDir, 'test.sqlite');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('handles revert behavior: emits change events for both edits and shows clean final diff', async () => {
    const store = new SqliteSessionStore(dbPath);
    const eventStore = new SqliteEventStore(dbPath);
    const mockSandbox = new MockSandboxAdapter();

    const service = new SessionService(store, {
      eventStore,
      sandboxAdapter: mockSandbox,
    });

    const { candidateToken } = service.createSession({
      scenarioId: 'scenario-001',
    });
    await service.activate(candidateToken);

    // Initial state: inventory/service.py exists
    // Edit 1: change inventory/service.py
    await service.saveWorkspaceFile(
      candidateToken,
      'inventory/service.py',
      '# modified inventory service\n',
    );

    // Edit 2: revert back to original content
    await service.saveWorkspaceFile(
      candidateToken,
      'inventory/service.py',
      '# inventory service\n',
    );

    const events = service.getSessionEvents(candidateToken);
    const workspaceEvents = events.filter(
      (e) => e.type === 'WORKSPACE_CHANGED',
    );
    expect(workspaceEvents).toHaveLength(2);

    // Submit session: submittedDiff should show no diff relative to baseline
    const submitted = await service.submit(candidateToken);
    expect(submitted.status).toBe('SUBMITTED');
    expect(submitted.submittedDiff).toBe('');
  });

  it('handles pre-command capture failure: aborts execution and throws PLATFORM_CAPTURE_FAILED', async () => {
    const store = new SqliteSessionStore(dbPath);
    const eventStore = new SqliteEventStore(dbPath);
    const mockSandbox = new MockSandboxAdapter();

    const service = new SessionService(store, {
      eventStore,
      sandboxAdapter: mockSandbox,
    });

    const { candidateToken } = service.createSession({
      scenarioId: 'scenario-001',
    });
    await service.activate(candidateToken);

    mockSandbox.failCaptureTree = true;

    await expect(
      service.executeCommand(candidateToken, 'pytest'),
    ).rejects.toThrow(/Pre-command workspace capture failed/);

    // No command event should have been recorded because execution aborted before running
    const events = service.getSessionEvents(candidateToken);
    expect(events.filter((e) => e.type === 'COMMAND_STARTED')).toHaveLength(0);
  });

  it('handles post-command capture failure: records COMMAND events and appends WORKSPACE_CAPTURE_FAILED', async () => {
    const store = new SqliteSessionStore(dbPath);
    const eventStore = new SqliteEventStore(dbPath);
    const mockSandbox = new MockSandboxAdapter();

    const service = new SessionService(store, {
      eventStore,
      sandboxAdapter: mockSandbox,
    });

    const { candidateToken } = service.createSession({
      scenarioId: 'scenario-001',
    });
    await service.activate(candidateToken);

    // First command succeeds normally
    await service.executeCommand(candidateToken, 'pwd');

    // Make post-command capture fail on tree diff
    mockSandbox.failCaptureDiff = true;

    // Command should succeed and return command output
    const res = await service.executeCommand(
      candidateToken,
      'echo changed > /workspace/app.py',
    );
    expect(res.commandId).toBeDefined();

    const events = service.getSessionEvents(candidateToken);
    const failedEvent = events.find(
      (e) => e.type === 'WORKSPACE_CAPTURE_FAILED',
    );
    expect(failedEvent).toBeDefined();
    expect((failedEvent!.payload as WorkspaceCaptureFailedPayload).phase).toBe(
      'post_command',
    );
  });

  it('handles browser save post-write capture failure: appends WORKSPACE_CAPTURE_FAILED and rejects save', async () => {
    const store = new SqliteSessionStore(dbPath);
    const eventStore = new SqliteEventStore(dbPath);
    const mockSandbox = new MockSandboxAdapter();

    const service = new SessionService(store, {
      eventStore,
      sandboxAdapter: mockSandbox,
    });

    const { candidateToken } = service.createSession({
      scenarioId: 'scenario-001',
    });
    await service.activate(candidateToken);

    // Cause diff to fail during post-write
    mockSandbox.failCaptureDiff = true;

    await expect(
      service.saveWorkspaceFile(candidateToken, 'app.py', 'mutation'),
    ).rejects.toThrow(/diff capture failed/);

    const events = service.getSessionEvents(candidateToken);
    const failedEvent = events.find(
      (e) => e.type === 'WORKSPACE_CAPTURE_FAILED',
    );
    expect(failedEvent).toBeDefined();
    expect((failedEvent!.payload as WorkspaceCaptureFailedPayload).phase).toBe(
      'browser_save',
    );
  });

  it('handles submission capture failure: preserves ACTIVE session and sandbox', async () => {
    const store = new SqliteSessionStore(dbPath);
    const eventStore = new SqliteEventStore(dbPath);
    const mockSandbox = new MockSandboxAdapter();

    const service = new SessionService(store, {
      eventStore,
      sandboxAdapter: mockSandbox,
    });

    const { candidateToken, session } = service.createSession({
      scenarioId: 'scenario-001',
    });
    await service.activate(candidateToken);

    mockSandbox.failCaptureFrozenEvidence = true;

    await expect(service.submit(candidateToken)).rejects.toThrow(
      /Failed to capture frozen workspace evidence.*Session remains active/,
    );

    // Session remains ACTIVE in database
    const sessionAfter = service.getCandidateSession(candidateToken);
    expect(sessionAfter.status).toBe('ACTIVE');

    // Sandbox container is NOT torn down
    expect(mockSandbox.hasSandbox(session.id)).toBe(true);
    expect(mockSandbox.isFrozen(session.id)).toBe(true);

    // WORKSPACE_CAPTURE_FAILED event is recorded
    const events = service.getSessionEvents(candidateToken);
    const submissionFailedEvent = events.find(
      (e) => e.type === 'WORKSPACE_CAPTURE_FAILED',
    );
    expect(submissionFailedEvent).toBeDefined();
    expect(
      (submissionFailedEvent!.payload as WorkspaceCaptureFailedPayload).phase,
    ).toBe('submission_frozen_capture');
  });

  it('rejects submission when the final tree does not match the last authoritative workspace state', async () => {
    const store = new SqliteSessionStore(dbPath);
    const eventStore = new InconsistentSubmissionEventStore(dbPath);
    const mockSandbox = new MockSandboxAdapter();
    const service = new SessionService(store, {
      eventStore,
      sandboxAdapter: mockSandbox,
    });

    const { candidateToken, session } = service.createSession({
      scenarioId: 'scenario-001',
    });
    await service.activate(candidateToken);
    await service.saveWorkspaceFile(
      candidateToken,
      'inventory/service.py',
      '# captured change\n',
    );

    await expect(service.submit(candidateToken)).rejects.toThrow(
      /does not match the last authoritative workspace tree/,
    );

    expect(service.getCandidateSession(candidateToken).status).toBe('ACTIVE');
    expect(mockSandbox.hasSandbox(session.id)).toBe(true);
    expect(mockSandbox.isFrozen(session.id)).toBe(true);
    const events = eventStore.getEvents(session.id);
    expect(events.at(-1)?.type).toBe('WORKSPACE_CAPTURE_FAILED');
    expect(events.at(-1)?.payload).toMatchObject({
      phase: 'submission_frozen_capture',
    });
  });

  it('keeps submitted evidence frozen and records sandbox teardown failure', async () => {
    const store = new SqliteSessionStore(dbPath);
    const eventStore = new SqliteEventStore(dbPath);
    const mockSandbox = new MockSandboxAdapter();
    const service = new SessionService(store, {
      eventStore,
      sandboxAdapter: mockSandbox,
    });

    const { candidateToken, session } = service.createSession({
      scenarioId: 'scenario-001',
    });
    await service.activate(candidateToken);
    mockSandbox.failTeardown = true;

    const submitted = await service.submit(candidateToken);

    expect(submitted.status).toBe('SUBMITTED');
    expect(service.getCandidateSession(candidateToken).status).toBe(
      'SUBMITTED',
    );
    expect(mockSandbox.hasSandbox(session.id)).toBe(true);
    expect(eventStore.getEvents(session.id).at(-1)).toMatchObject({
      type: 'SANDBOX_CLEANUP_FAILED',
      payload: {
        phase: 'submission',
      },
    });
    await expect(service.executeCommand(candidateToken, 'pwd')).rejects.toThrow(
      /only while the session is active/,
    );
    await expect(
      service.saveWorkspaceFile(candidateToken, 'app.py', 'forbidden'),
    ).rejects.toThrow(/only be edited during active sessions/);
  });

  it('handles universal serialization: serializes save and command concurrently', async () => {
    const store = new SqliteSessionStore(dbPath);
    const eventStore = new SqliteEventStore(dbPath);
    const mockSandbox = new MockSandboxAdapter();

    const service = new SessionService(store, {
      eventStore,
      sandboxAdapter: mockSandbox,
    });

    const { candidateToken } = service.createSession({
      scenarioId: 'scenario-001',
    });
    await service.activate(candidateToken);

    // Launch concurrent save and command
    const [saveRes, cmdRes] = await Promise.all([
      service.saveWorkspaceFile(candidateToken, 'app.py', 'concurrent edit'),
      service.executeCommand(candidateToken, 'pwd'),
    ]);

    expect(saveRes.ok).toBe(true);
    expect(cmdRes.commandId).toBeDefined();

    const events = service.getSessionEvents(candidateToken);
    expect(events.length).toBeGreaterThanOrEqual(3);
  });

  it('handles out-of-band drift before browser save: emits out_of_band change first, then browser_save change', async () => {
    const store = new SqliteSessionStore(dbPath);
    const eventStore = new SqliteEventStore(dbPath);
    const mockSandbox = new MockSandboxAdapter();

    const service = new SessionService(store, {
      eventStore,
      sandboxAdapter: mockSandbox,
    });

    const { candidateToken, session } = service.createSession({
      scenarioId: 'scenario-001',
    });
    await service.activate(candidateToken);

    // 1. Simulate out-of-band mutation (e.g. background worker modifying cache.py)
    await mockSandbox.writeFile(
      session.id,
      'inventory/cache.py',
      '# out of band async mutation\n',
    );

    // 2. Candidate saves another file (service.py) via browser
    await service.saveWorkspaceFile(
      candidateToken,
      'inventory/service.py',
      '# candidate edited service\n',
    );

    const events = service.getSessionEvents(candidateToken);
    const workspaceEvents = events.filter(
      (e) => e.type === 'WORKSPACE_CHANGED',
    );

    expect(workspaceEvents).toHaveLength(2);

    // First event must be out_of_band
    const firstChange = workspaceEvents[0].payload as WorkspaceChangedPayload;
    expect(firstChange.origin).toBe('out_of_band');
    expect(firstChange.commandId).toBeUndefined();
    expect(firstChange.files.map((f) => f.path)).toContain(
      'inventory/cache.py',
    );

    // Second event must be browser_save
    const secondChange = workspaceEvents[1].payload as WorkspaceChangedPayload;
    expect(secondChange.origin).toBe('browser_save');
    expect(secondChange.files.map((f) => f.path)).toContain(
      'inventory/service.py',
    );
    expect(secondChange.beforeTree).toBe(firstChange.afterTree);
  });

  it('handles out-of-band drift immediately before submission: records out_of_band change and includes in final diff', async () => {
    const store = new SqliteSessionStore(dbPath);
    const eventStore = new SqliteEventStore(dbPath);
    const mockSandbox = new MockSandboxAdapter();

    const service = new SessionService(store, {
      eventStore,
      sandboxAdapter: mockSandbox,
    });

    const { candidateToken, session } = service.createSession({
      scenarioId: 'scenario-001',
    });
    await service.activate(candidateToken);

    // Normal command
    await service.executeCommand(candidateToken, 'pwd');

    // Simulate trailing out-of-band mutation before submission
    await mockSandbox.writeFile(
      session.id,
      'inventory/cache.py',
      '# trailing async mutation\n',
    );

    // Candidate submits
    const submitted = await service.submit(candidateToken);
    expect(submitted.status).toBe('SUBMITTED');
    expect(submitted.submittedDiff).toContain('inventory/cache.py');

    const events = service.getSessionEvents(candidateToken);
    const workspaceEvents = events.filter(
      (e) => e.type === 'WORKSPACE_CHANGED',
    );
    expect(workspaceEvents).toHaveLength(1);
    const outOfBandEvent = workspaceEvents[0]
      .payload as WorkspaceChangedPayload;
    expect(outOfBandEvent.origin).toBe('out_of_band');
    expect(outOfBandEvent.commandId).toBeUndefined();
    expect(outOfBandEvent.files.map((f) => f.path)).toContain(
      'inventory/cache.py',
    );
  });

  it('does not emit spurious out_of_band events during normal command sequence', async () => {
    const store = new SqliteSessionStore(dbPath);
    const eventStore = new SqliteEventStore(dbPath);
    const mockSandbox = new MockSandboxAdapter();

    const service = new SessionService(store, {
      eventStore,
      sandboxAdapter: mockSandbox,
    });

    const { candidateToken } = service.createSession({
      scenarioId: 'scenario-001',
    });
    await service.activate(candidateToken);

    await service.executeCommand(candidateToken, 'echo 1');
    await service.executeCommand(candidateToken, 'echo 2');
    await service.executeCommand(candidateToken, 'echo 3');

    const events = service.getSessionEvents(candidateToken);
    const outOfBandEvents = events.filter(
      (e) =>
        e.type === 'WORKSPACE_CHANGED' &&
        (e.payload as WorkspaceChangedPayload).origin === 'out_of_band',
    );
    expect(outOfBandEvents).toHaveLength(0);
  });
});
