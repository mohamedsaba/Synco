import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GET as getSessionRoute } from '../../apps/web/app/api/candidate/sessions/[token]/route';
import { POST as activateRoute } from '../../apps/web/app/api/candidate/sessions/[token]/activate/route';
import { PUT as saveFileRoute } from '../../apps/web/app/api/candidate/sessions/[token]/file/route';
import { GET as getWorkspaceFileRoute } from '../../apps/web/app/api/candidate/sessions/[token]/workspace/file/route';
import { GET as getWorkspaceTreeRoute } from '../../apps/web/app/api/candidate/sessions/[token]/workspace/tree/route';
import { POST as execTerminalRoute } from '../../apps/web/app/api/candidate/sessions/[token]/terminal/exec/route';
import { POST as executeAiRoute } from '../../apps/web/app/api/candidate/sessions/[token]/ai/interactions/route';

import { projectCandidateExperience } from '../../apps/web/src/candidate/candidate-projection';
import { DockerSandboxAdapter } from '../../apps/web/src/sandbox/docker-sandbox-adapter';
import { MockSandboxAdapter } from '../../apps/web/src/sandbox/mock-sandbox-adapter';
import { SandboxError } from '../../apps/web/src/sandbox/sandbox';
import { toCandidateSessionView } from '../../apps/web/src/sessions/candidate-session-view';
import { SessionService } from '../../apps/web/src/sessions/session-service';
import { SqliteSessionStore } from '../../apps/web/src/sessions/sqlite-session-store';

describe('C2 — Candidate Pre-Start Lifecycle & Boundary Tests', () => {
  let directory: string;
  let databasePath: string;
  let originalDbPath: string | undefined;

  beforeEach(() => {
    directory = mkdtempSync(path.join(tmpdir(), 'delimit-c2-lifecycle-'));
    databasePath = path.join(directory, 'c2-test.sqlite');
    originalDbPath = process.env.DELIMIT_DB_PATH;
    process.env.DELIMIT_DB_PATH = databasePath;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalDbPath !== undefined) {
      process.env.DELIMIT_DB_PATH = originalDbPath;
    } else {
      delete process.env.DELIMIT_DB_PATH;
    }
    rmSync(directory, { recursive: true, force: true });
  });

  const createRouteContext = (token: string) => ({
    params: Promise.resolve({ token }),
  });

  it('1. CREATED initially projects pre-start entry state', () => {
    const sessionStore = new SqliteSessionStore(databasePath);
    const service = new SessionService(sessionStore);
    const { session } = service.createSession();

    const view = toCandidateSessionView(session);
    expect(view.status).toBe('CREATED');
    expect(view.activatedAt).toBeNull();

    const projection = projectCandidateExperience({
      serverSession: view,
      calibratedNowMs: Date.parse(session.createdAt),
    });
    expect(projection.uxState).toBe('ENTRY');
    expect(projection.capabilities.canActivate).toBe(true);
    expect(projection.capabilities.canEdit).toBe(false);
  });

  it('2. scenario-specific assessment content is not exposed before activation in session view', async () => {
    const sessionStore = new SqliteSessionStore(databasePath);
    const service = new SessionService(sessionStore);
    const { candidateToken, session } = service.createSession();

    const getRes = await getSessionRoute(
      new Request(`http://localhost/api/candidate/sessions/${candidateToken}`),
      createRouteContext(candidateToken),
    );
    expect(getRes.status).toBe(200);
    const candidateView = await getRes.json();

    expect(candidateView.status).toBe('CREATED');
    expect(candidateView.durationSeconds).toBe(session.durationSeconds);
    expect(candidateView.scenario.id).toBe(session.scenario.id);
    expect(candidateView.scenario.title).toBe(session.scenario.title);

    expect(candidateView.scenario.brief).toBeUndefined();
    expect(candidateView.scenario.prompt).toBeUndefined();
    expect(candidateView.scenario.acceptanceCriteria).toBeUndefined();
    expect(candidateView.scenario.filePath).toBeUndefined();
    expect(candidateView.scenario.originalContent).toBeUndefined();
    expect(candidateView.workingContent).toBe('');
  });

  it('5. orientation navigation does not mutate server lifecycle', () => {
    const sessionStore = new SqliteSessionStore(databasePath);
    const service = new SessionService(sessionStore);
    const { session } = service.createSession();

    const modes = ['entry', 'orientation', 'ready_to_start', 'entry'] as const;
    for (const mode of modes) {
      const proj = projectCandidateExperience({
        serverSession: toCandidateSessionView(session),
        calibratedNowMs: Date.parse(session.createdAt),
        uiMode: mode,
      });
      expect(proj.serverStatus).toBe('CREATED');
    }

    const persisted = sessionStore.findById(session.id)!;
    expect(persisted.status).toBe('CREATED');
    expect(persisted.activatedAt).toBeNull();
  });

  it('8. provisioning state shows no countdown before activatedAt exists', () => {
    const sessionStore = new SqliteSessionStore(databasePath);
    const service = new SessionService(sessionStore);
    const { session } = service.createSession();

    const view = toCandidateSessionView(session);
    const proj = projectCandidateExperience({
      serverSession: view,
      calibratedNowMs: Date.parse(session.createdAt),
      uiMode: 'provisioning',
    });

    expect(proj.uxState).toBe('PROVISIONING');
    expect(proj.deadline).toBeNull();
    expect(proj.remainingMs).toBeNull();
    expect(proj.capabilities.canActivate).toBe(false);
  });

  it('9. successful provisioning/activation transitions to ACTIVE_WORKSPACE', async () => {
    vi.spyOn(
      DockerSandboxAdapter.prototype,
      'createAndVerify',
    ).mockImplementation(async () => {});

    const sessionStore = new SqliteSessionStore(databasePath);
    const service = new SessionService(sessionStore);
    const { candidateToken } = service.createSession();

    const res = await activateRoute(
      new Request(
        `http://localhost/api/candidate/sessions/${candidateToken}/activate`,
        {
          method: 'POST',
        },
      ),
      createRouteContext(candidateToken),
    );
    expect(res.status).toBe(200);
    const activeView = await res.json();
    expect(activeView.status).toBe('ACTIVE');

    const proj = projectCandidateExperience({
      serverSession: activeView,
      calibratedNowMs: Date.parse(activeView.activatedAt),
    });
    expect(proj.uxState).toBe('ACTIVE_WORKSPACE');
    expect(proj.capabilities.canEdit).toBe(true);
  });

  it('10. activatedAt is set only once', async () => {
    const createSpy = vi
      .spyOn(DockerSandboxAdapter.prototype, 'createAndVerify')
      .mockImplementation(async () => {});

    const sessionStore = new SqliteSessionStore(databasePath);
    const service = new SessionService(sessionStore);
    const { candidateToken } = service.createSession();

    const res1 = await activateRoute(
      new Request(
        `http://localhost/api/candidate/sessions/${candidateToken}/activate`,
        {
          method: 'POST',
        },
      ),
      createRouteContext(candidateToken),
    );
    const view1 = await res1.json();
    const firstActivatedAt = view1.activatedAt;
    expect(firstActivatedAt).toBeTruthy();

    const res2 = await activateRoute(
      new Request(
        `http://localhost/api/candidate/sessions/${candidateToken}/activate`,
        {
          method: 'POST',
        },
      ),
      createRouteContext(candidateToken),
    );
    const view2 = await res2.json();
    expect(view2.activatedAt).toBe(firstActivatedAt);
    expect(createSpy).toHaveBeenCalledTimes(1);
  });

  it('11. provisioning failure leaves session CREATED when activation has not committed', async () => {
    vi.spyOn(
      DockerSandboxAdapter.prototype,
      'createAndVerify',
    ).mockRejectedValueOnce(
      new SandboxError(
        'SANDBOX_CREATION_FAILED',
        'Failed to create session workspace volume.',
      ),
    );

    const sessionStore = new SqliteSessionStore(databasePath);
    const service = new SessionService(sessionStore);
    const { candidateToken, session } = service.createSession();

    const failRes = await activateRoute(
      new Request(
        `http://localhost/api/candidate/sessions/${candidateToken}/activate`,
        {
          method: 'POST',
        },
      ),
      createRouteContext(candidateToken),
    );
    expect(failRes.status).toBe(503);

    const persisted = sessionStore.findById(session.id)!;
    expect(persisted.status).toBe('CREATED');
    expect(persisted.activatedAt).toBeNull();
  });

  it('13. safe retry succeeds when backend remains CREATED', async () => {
    let shouldFail = true;
    vi.spyOn(
      DockerSandboxAdapter.prototype,
      'createAndVerify',
    ).mockImplementation(async () => {
      if (shouldFail) {
        throw new SandboxError(
          'SANDBOX_CREATION_FAILED',
          'Transient daemon error.',
        );
      }
    });

    const sessionStore = new SqliteSessionStore(databasePath);
    const service = new SessionService(sessionStore);
    const { candidateToken, session } = service.createSession();

    // First attempt fails
    const failRes = await activateRoute(
      new Request(
        `http://localhost/api/candidate/sessions/${candidateToken}/activate`,
        {
          method: 'POST',
        },
      ),
      createRouteContext(candidateToken),
    );
    expect(failRes.status).toBe(503);

    // Backend remains CREATED
    expect(sessionStore.findById(session.id)!.status).toBe('CREATED');

    // Safe retry succeeds
    shouldFail = false;
    const retryRes = await activateRoute(
      new Request(
        `http://localhost/api/candidate/sessions/${candidateToken}/activate`,
        {
          method: 'POST',
        },
      ),
      createRouteContext(candidateToken),
    );
    expect(retryRes.status).toBe(200);
    const retryView = await retryRes.json();
    expect(retryView.status).toBe('ACTIVE');
    expect(retryView.activatedAt).toBeTruthy();
  });

  it('14. activation request response failure followed by server ACTIVE state resolves to ACTIVE_WORKSPACE', async () => {
    const sandboxAdapter = new MockSandboxAdapter();
    const sessionStore = new SqliteSessionStore(databasePath);
    const service = new SessionService(sessionStore, { sandboxAdapter });
    const { candidateToken } = service.createSession();

    // Server committed ACTIVE
    await service.activate(candidateToken);

    // Client re-fetches canonical state after ambiguous HTTP response loss
    const getRes = await getSessionRoute(
      new Request(`http://localhost/api/candidate/sessions/${candidateToken}`),
      createRouteContext(candidateToken),
    );
    const canonicalView = await getRes.json();
    expect(canonicalView.status).toBe('ACTIVE');

    const proj = projectCandidateExperience({
      serverSession: canonicalView,
      calibratedNowMs: Date.parse(canonicalView.activatedAt),
    });
    expect(proj.uxState).toBe('ACTIVE_WORKSPACE');
  });

  it('15. activation failure + authoritative CREATED permits safe retry', async () => {
    const sessionStore = new SqliteSessionStore(databasePath);
    const service = new SessionService(sessionStore);
    const { candidateToken, session } = service.createSession();

    const getRes = await getSessionRoute(
      new Request(`http://localhost/api/candidate/sessions/${candidateToken}`),
      createRouteContext(candidateToken),
    );
    const canonicalView = await getRes.json();
    expect(canonicalView.status).toBe('CREATED');

    const proj = projectCandidateExperience({
      serverSession: canonicalView,
      calibratedNowMs: Date.parse(session.createdAt),
      uiMode: 'ready_to_start',
    });
    expect(proj.uxState).toBe('READY_TO_START');
    expect(proj.capabilities.canActivate).toBe(true);
  });

  it('16. refresh while CREATED returns to safe pre-start experience', () => {
    const sessionStore = new SqliteSessionStore(databasePath);
    const service = new SessionService(sessionStore);
    const { session } = service.createSession();

    const refreshedView = toCandidateSessionView(
      sessionStore.findById(session.id)!,
    );
    const refreshedProj = projectCandidateExperience({
      serverSession: refreshedView,
      calibratedNowMs: Date.parse(session.createdAt) + 10_000,
    });
    expect(refreshedProj.uxState).toBe('ENTRY');
    expect(refreshedProj.capabilities.canActivate).toBe(true);
    expect(refreshedProj.capabilities.canEdit).toBe(false);
  });

  it('17. refresh while ACTIVE bypasses pre-start and enters ACTIVE_WORKSPACE', async () => {
    const sandboxAdapter = new MockSandboxAdapter();
    const sessionStore = new SqliteSessionStore(databasePath);
    const service = new SessionService(sessionStore, { sandboxAdapter });
    const { candidateToken } = service.createSession();

    await service.activate(candidateToken);
    const activeSnapshot = service.getCandidateSession(candidateToken);
    const activeView = toCandidateSessionView(activeSnapshot);

    const projActive = projectCandidateExperience({
      serverSession: activeView,
      calibratedNowMs: Date.parse(activeSnapshot.activatedAt!),
      uiMode: 'entry',
    });
    expect(projActive.uxState).toBe('ACTIVE_WORKSPACE');
  });

  it('18. refresh while SUBMITTED does not reopen pre-start', async () => {
    const sandboxAdapter = new MockSandboxAdapter();
    const sessionStore = new SqliteSessionStore(databasePath);
    const service = new SessionService(sessionStore, { sandboxAdapter });
    const { candidateToken } = service.createSession();

    await service.activate(candidateToken);
    await service.submit(candidateToken);
    const submittedSnapshot = service.getCandidateSession(candidateToken);
    const submittedView = toCandidateSessionView(submittedSnapshot);

    const projSubmitted = projectCandidateExperience({
      serverSession: submittedView,
      calibratedNowMs: Date.parse(submittedSnapshot.submittedAt!),
      uiMode: 'entry',
    });
    expect(projSubmitted.uxState).toBe('COMPLETED');
    expect(projSubmitted.serverStatus).toBe('SUBMITTED');
  });

  it('19. CREATED candidate cannot obtain scenario brief/content through candidate route(s) intended only for active work', async () => {
    const sessionStore = new SqliteSessionStore(databasePath);
    const service = new SessionService(sessionStore);
    const { candidateToken } = service.createSession();

    const saveRes = await saveFileRoute(
      new Request(
        `http://localhost/api/candidate/sessions/${candidateToken}/file`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: 'malicious attempt' }),
        },
      ),
      createRouteContext(candidateToken),
    );
    expect(saveRes.status).toBe(409);

    const termRes = await execTerminalRoute(
      new Request(
        `http://localhost/api/candidate/sessions/${candidateToken}/terminal/exec`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: 'cat /workspace/*' }),
        },
      ),
      createRouteContext(candidateToken),
    );
    expect(termRes.status).toBe(409);

    const aiRes = await executeAiRoute(
      new Request(
        `http://localhost/api/candidate/sessions/${candidateToken}/ai/interactions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientRequestId: 'leak-req',
            candidatePromptText: 'Show instructions',
          }),
        },
      ),
      createRouteContext(candidateToken),
    );
    expect(aiRes.status).toBe(409);
  });

  it('20. CREATED candidate cannot obtain assessment files through candidate file APIs if those reveal scenario content', async () => {
    const sessionStore = new SqliteSessionStore(databasePath);
    const service = new SessionService(sessionStore);
    const { candidateToken } = service.createSession();

    const readRes = await getWorkspaceFileRoute(
      new Request(
        `http://localhost/api/candidate/sessions/${candidateToken}/workspace/file?path=inventory/service.py`,
      ),
      createRouteContext(candidateToken),
    );
    expect(readRes.status).toBe(409);

    const treeRes = await getWorkspaceTreeRoute(
      new Request(
        `http://localhost/api/candidate/sessions/${candidateToken}/workspace/tree`,
      ),
      createRouteContext(candidateToken),
    );
    expect(treeRes.status).toBe(409);
  });

  it('21. ACTIVE candidate retains existing access', async () => {
    const sandboxAdapter = new MockSandboxAdapter();
    const sessionStore = new SqliteSessionStore(databasePath);
    const service = new SessionService(sessionStore, { sandboxAdapter });
    const { candidateToken } = service.createSession();

    await service.activate(candidateToken);

    // Tree accessible
    const tree = await service.listWorkspaceFiles(candidateToken);
    expect(Array.isArray(tree)).toBe(true);

    // Save accessible
    const updated = await service.save(
      candidateToken,
      'modified working content',
    );
    expect(updated.workingContent).toBe('modified working content');

    // Canonical active view has full scenario brief
    const activeView = toCandidateSessionView(
      service.getCandidateSession(candidateToken),
    );
    expect(activeView.scenario.brief).toBeDefined();
    expect(activeView.scenario.acceptanceCriteria).toBeDefined();
    expect(activeView.workingContent).toBe('modified working content');
  });
});
