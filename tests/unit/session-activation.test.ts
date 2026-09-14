import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { MockSandboxAdapter } from '../../apps/web/src/sandbox/mock-sandbox-adapter';
import { SandboxError } from '../../apps/web/src/sandbox/sandbox';
import { SessionService } from '../../apps/web/src/sessions/session-service';
import { SqliteSessionStore } from '../../apps/web/src/sessions/sqlite-session-store';

describe('session activation readiness gate', () => {
  let directory: string;
  let databasePath: string;

  beforeEach(() => {
    directory = mkdtempSync(path.join(tmpdir(), 'delimit-activation-test-'));
    databasePath = path.join(directory, 'sessions.sqlite');
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  it('keeps session in CREATED status if sandbox readiness fails, leaving timer unstarted', async () => {
    const sandboxAdapter = new MockSandboxAdapter();
    const service = new SessionService(new SqliteSessionStore(databasePath), {
      sandboxAdapter,
    });

    const { candidateToken, session } = service.createSession();
    expect(session.status).toBe('CREATED');
    expect(session.activatedAt).toBeNull();

    // Trigger failure for this session
    sandboxAdapter.failCreationForSessionId = session.id;

    // Activation attempt fails
    await expect(service.activate(candidateToken)).rejects.toThrowError(
      SandboxError,
    );

    // Verify session remains CREATED and activatedAt is still null
    const retrieved = service.getCandidateSession(candidateToken);
    expect(retrieved.status).toBe('CREATED');
    expect(retrieved.activatedAt).toBeNull();

    // Candidate can retry activation after transient platform issue is resolved
    sandboxAdapter.failCreationForSessionId = null;
    const activated = await service.activate(candidateToken);
    expect(activated.status).toBe('ACTIVE');
    expect(activated.activatedAt).toBeTruthy();
  });
});
