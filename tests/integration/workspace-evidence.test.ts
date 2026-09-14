import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import type { WorkspaceChangedPayload } from '../../apps/web/src/events/session-event';
import { SqliteEventStore } from '../../apps/web/src/events/sqlite-event-store';
import { buildChronologicalReconstruction } from '../../apps/web/src/evidence/chronological-reconstruction';
import { DockerSandboxAdapter } from '../../apps/web/src/sandbox/docker-sandbox-adapter';
import { scenario001 } from '../../apps/web/src/scenarios/scenario-001';
import { SessionService } from '../../apps/web/src/sessions/session-service';
import { SqliteSessionStore } from '../../apps/web/src/sessions/sqlite-session-store';

describe('Workspace Evidence & Threat Invariants Integration', () => {
  it('enforces immutable baseline, scratch isolation, git tampering resilience, and deterministic reconstruction', async () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), 'delimit-evidence-test-'));
    const dbPath = path.join(tempDir, 'test.sqlite');
    const store = new SqliteSessionStore(dbPath);
    const eventStore = new SqliteEventStore(dbPath);
    const sandbox = new DockerSandboxAdapter({ defaultTimeoutMs: 30_000 });
    const service = new SessionService(store, {
      eventStore,
      sandboxAdapter: sandbox,
    });

    let candidateToken = '';
    let sessionId = '';
    let containerName = '';

    try {
      // 1. Create and activate Scenario 001 session
      const created = service.createSession({ scenarioId: scenario001.id });
      candidateToken = created.candidateToken;
      sessionId = created.session.id;
      containerName = sandbox.getContainerName(sessionId);

      await service.activate(candidateToken);

      // Invariant 1: Candidate cannot write to /opt/delimit/repo-template (Read-only filesystem)
      const tamperBaseline = await service.executeCommand(
        candidateToken,
        'touch /opt/delimit/repo-template/evil.txt',
      );
      expect(tamperBaseline.exitCode).not.toBe(0);
      expect(tamperBaseline.stderrPreview).toMatch(
        /Read-only file system|Permission denied/,
      );

      // Invariant 2: Candidate (UID 1000) cannot access /run/delimit-evidence (mode 0700 root:root)
      const inspectEvidenceStore = await service.executeCommand(
        candidateToken,
        'ls -la /run/delimit-evidence',
      );
      expect(inspectEvidenceStore.exitCode).not.toBe(0);
      expect(inspectEvidenceStore.stderrPreview).toMatch(/Permission denied/);

      // Invariant 3: Candidate background process running in candidate /tmp does not disrupt evidence
      await service.executeCommand(
        candidateToken,
        "python3 -c 'import time; time.sleep(5)' >/dev/null 2>&1 &",
      );

      // Invariant 4: Candidate destroys /workspace/.git
      const destroyGit = await service.executeCommand(
        candidateToken,
        'rm -rf /workspace/.git',
      );
      expect(destroyGit.exitCode).toBe(0);

      // Verify /workspace/.git is truly gone
      const checkGitGone = await service.executeCommand(
        candidateToken,
        'ls -d /workspace/.git',
      );
      expect(checkGitGone.exitCode).not.toBe(0);

      // Invariant 5: Browser file save still captures WORKSPACE_CHANGED despite missing .git
      const originalServicePy = await service.readWorkspaceFile(
        candidateToken,
        'inventory/service.py',
      );
      const modifiedServicePy =
        originalServicePy + '\n# Modified during test\n';

      const saveRes = await service.saveWorkspaceFile(
        candidateToken,
        'inventory/service.py',
        modifiedServicePy,
      );
      expect(saveRes.ok).toBe(true);

      // Check that WORKSPACE_CHANGED event was recorded with valid trees
      const eventsAfterSave = service.getSessionEvents(candidateToken);
      const saveEvent = eventsAfterSave.find(
        (e) =>
          e.type === 'WORKSPACE_CHANGED' &&
          (e.payload as WorkspaceChangedPayload).origin === 'browser_save',
      );
      expect(saveEvent).toBeDefined();
      const savePayload = saveEvent!.payload as WorkspaceChangedPayload;
      expect(savePayload.beforeTree).toMatch(/^[a-f0-9]{40}$/);
      expect(savePayload.afterTree).toMatch(/^[a-f0-9]{40}$/);
      expect(savePayload.beforeTree).not.toBe(savePayload.afterTree);
      expect(savePayload.files).toHaveLength(1);
      expect(savePayload.files[0]?.path).toBe('inventory/service.py');
      expect(savePayload.files[0]?.status).toBe('modified');

      // Invariant 6: Command-caused mutations are captured with correlated commandId
      const commandMutation = await service.executeCommand(
        candidateToken,
        "echo 'NEW_SETTING = True' >> inventory/cache.py",
      );
      expect(commandMutation.exitCode).toBe(0);

      const eventsAfterCmd = service.getSessionEvents(candidateToken);
      const cmdEvent = eventsAfterCmd.find(
        (e) =>
          e.type === 'WORKSPACE_CHANGED' &&
          (e.payload as WorkspaceChangedPayload).origin === 'command_execution',
      );
      expect(cmdEvent).toBeDefined();
      const cmdPayload = cmdEvent!.payload as WorkspaceChangedPayload;
      expect(cmdPayload.commandId).toBe(commandMutation.commandId);
      expect(cmdPayload.files).toHaveLength(1);
      expect(cmdPayload.files[0]?.path).toBe('inventory/cache.py');

      // Invariant 7: Candidate .gitignore suppression attempt cannot hide candidate code
      const gitignoreAttempt = await service.executeCommand(
        candidateToken,
        "echo 'inventory/**' >> /workspace/.gitignore && echo 'secret = 42' > /workspace/inventory/custom.py",
      );
      expect(gitignoreAttempt.exitCode).toBe(0);

      const eventsAfterIgnore = service.getSessionEvents(candidateToken);
      const ignoreChangedEvent =
        eventsAfterIgnore[eventsAfterIgnore.length - 1];
      expect(ignoreChangedEvent?.type).toBe('WORKSPACE_CHANGED');
      const ignorePayload =
        ignoreChangedEvent?.payload as WorkspaceChangedPayload;
      const pathsChanged = ignorePayload.files.map((f) => f.path);
      // Delimit-owned force-add captured inventory/custom.py and .gitignore!
      expect(pathsChanged).toContain('inventory/custom.py');
      expect(pathsChanged).toContain('.gitignore');

      // Invariant 8: No ephemeral index files linger in /run/delimit-evidence
      const checkIndices = spawnSync('docker', [
        'exec',
        '-u',
        '0:0',
        containerName,
        'sh',
        '-c',
        'ls -1 /run/delimit-evidence/idx_* 2>/dev/null || true',
      ]);
      expect(checkIndices.stdout.toString().trim()).toBe('');

      // Invariant 9: Submission succeeds and captures full multi-file diff relative to immutable baseline
      const submitted = await service.submit(candidateToken);
      expect(submitted.status).toBe('SUBMITTED');
      expect(submitted.submittedDiff).toContain(
        'diff --git a/inventory/cache.py',
      );
      expect(submitted.submittedDiff).toContain(
        'diff --git a/inventory/service.py',
      );
      expect(submitted.submittedDiff).toContain(
        'diff --git a/inventory/custom.py',
      );

      // Container is deterministically torn down
      const checkRunning = spawnSync('docker', [
        'inspect',
        '-f',
        '{{.State.Running}}',
        containerName,
      ]);
      expect(checkRunning.stdout.toString().trim()).not.toBe('true');

      // Invariant 10: Evaluator chronological reconstruction projection
      const evidence = service.getSubmittedEvidence(sessionId);
      const reconstruction = buildChronologicalReconstruction(
        {
          activatedAt: evidence.activatedAt,
          submittedAt: evidence.submittedAt,
          submittedDiff: evidence.diff,
        },
        evidence.events,
      );

      // Verify sequence starts with activation and ends with submission
      expect(reconstruction[0].kind).toBe('SESSION_ACTIVATED');
      expect(reconstruction[reconstruction.length - 1].kind).toBe(
        'SESSION_SUBMITTED',
      );

      // Verify all command executions and workspace changes are present in order
      const kinds = reconstruction.map((r) => r.kind);
      expect(kinds).toContain('COMMAND_EXECUTION');
      expect(kinds).toContain('WORKSPACE_CHANGE');
    } finally {
      spawnSync('docker', ['rm', '-f', containerName]);
      rmSync(tempDir, { recursive: true, force: true });
    }
  }, 60_000);

  it('captures candidate out-of-band background mutations without falsely attributing them to subsequent commands', async () => {
    const tempDir = mkdtempSync(
      path.join(tmpdir(), 'delimit-oob-evidence-test-'),
    );
    const dbPath = path.join(tempDir, 'test.sqlite');
    const store = new SqliteSessionStore(dbPath);
    const eventStore = new SqliteEventStore(dbPath);
    const sandbox = new DockerSandboxAdapter({ defaultTimeoutMs: 30_000 });
    const service = new SessionService(store, {
      eventStore,
      sandboxAdapter: sandbox,
    });

    let candidateToken = '';
    let sessionId = '';
    let containerName = '';

    try {
      // 1. Create and activate Scenario 001 session
      const created = service.createSession({ scenarioId: scenario001.id });
      candidateToken = created.candidateToken;
      sessionId = created.session.id;
      containerName = sandbox.getContainerName(sessionId);

      await service.activate(candidateToken);

      // 2. Run a command that spawns a delayed background writer and returns immediately
      const spawnCmd = await service.executeCommand(
        candidateToken,
        'python3 -c \'import time; time.sleep(1); open("inventory/cache.py", "a").write("# async out-of-band mutation\\n")\' >/dev/null 2>&1 &',
      );
      expect(spawnCmd.exitCode).toBe(0);

      // 3. Confirm first command completed, and no workspace change was logged during it
      const eventsAfterCmd1 = service.getSessionEvents(candidateToken);
      const changesAfterCmd1 = eventsAfterCmd1.filter(
        (e) => e.type === 'WORKSPACE_CHANGED',
      );
      expect(changesAfterCmd1).toHaveLength(0);

      // 4. Wait for delayed writer to mutate inventory/cache.py
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 5. Run a second, completely unrelated read command (e.g. pwd)
      const secondCmd = await service.executeCommand(candidateToken, 'pwd');
      expect(secondCmd.exitCode).toBe(0);

      // 6. Verify chronological events:
      // - cmd1 (COMMAND_STARTED, COMMAND_FINISHED)
      // - WORKSPACE_CHANGED with origin: 'out_of_band', commandId: undefined
      // - cmd2 (COMMAND_STARTED, COMMAND_FINISHED)
      // - NO WORKSPACE_CHANGED for cmd2!
      const allEvents = service.getSessionEvents(candidateToken);
      const workspaceChanges = allEvents.filter(
        (e) => e.type === 'WORKSPACE_CHANGED',
      );
      expect(workspaceChanges).toHaveLength(1);

      const oobChange = workspaceChanges[0].payload as WorkspaceChangedPayload;
      expect(oobChange.origin).toBe('out_of_band');
      expect(oobChange.commandId).toBeUndefined();
      expect(oobChange.files.map((f) => f.path)).toContain(
        'inventory/cache.py',
      );

      // The mutation was NOT attributed to secondCmd!
      expect(oobChange.commandId).not.toBe(secondCmd.commandId);

      // 7. Verify chronological ordering in sequence
      const cmd1FinishIndex = allEvents.findIndex(
        (e) =>
          e.type === 'COMMAND_FINISHED' &&
          (e.payload as { commandId?: string }).commandId ===
            spawnCmd.commandId,
      );
      const oobChangeIndex = allEvents.findIndex(
        (e) => e.type === 'WORKSPACE_CHANGED',
      );
      const cmd2StartIndex = allEvents.findIndex(
        (e) =>
          e.type === 'COMMAND_STARTED' &&
          (e.payload as { commandId?: string }).commandId ===
            secondCmd.commandId,
      );

      expect(cmd1FinishIndex).toBeGreaterThan(-1);
      expect(oobChangeIndex).toBeGreaterThan(cmd1FinishIndex);
      expect(cmd2StartIndex).toBeGreaterThan(oobChangeIndex);

      // 8. Submit session and verify reconstruction
      const submitted = await service.submit(candidateToken);
      expect(submitted.status).toBe('SUBMITTED');
      expect(submitted.submittedDiff).toContain('inventory/cache.py');
      expect(submitted.submittedDiff).toContain('# async out-of-band mutation');

      const evidence = service.getSubmittedEvidence(sessionId);
      const reconstruction = buildChronologicalReconstruction(
        {
          activatedAt: evidence.activatedAt,
          submittedAt: evidence.submittedAt,
          submittedDiff: evidence.diff,
        },
        evidence.events,
      );

      // Find kinds in reconstruction timeline
      const reconKinds = reconstruction.map((r) => r.kind);
      expect(reconKinds).toEqual([
        'SESSION_ACTIVATED',
        'COMMAND_EXECUTION',
        'WORKSPACE_CHANGE',
        'COMMAND_EXECUTION',
        'SESSION_SUBMITTED',
      ]);

      const reconOob = reconstruction[2] as {
        kind: 'WORKSPACE_CHANGE';
        origin: string;
      };
      expect(reconOob.origin).toBe('out_of_band');
    } finally {
      spawnSync('docker', ['rm', '-f', containerName]);
      rmSync(tempDir, { recursive: true, force: true });
    }
  }, 60_000);
});
