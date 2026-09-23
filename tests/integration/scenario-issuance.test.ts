import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '../../apps/web/app/api/sessions/route';
import { DockerSandboxAdapter } from '../../apps/web/src/sandbox/docker-sandbox-adapter';
import { MockSandboxAdapter } from '../../apps/web/src/sandbox/mock-sandbox-adapter';
import { SessionService } from '../../apps/web/src/sessions/session-service';
import { SqliteSessionStore } from '../../apps/web/src/sessions/sqlite-session-store';

describe('R2 — public scenario issuance', () => {
  let directory: string;
  let databasePath: string;
  let originalDbPath: string | undefined;

  beforeEach(() => {
    directory = mkdtempSync(path.join(tmpdir(), 'delimit-scenario-issuance-'));
    databasePath = path.join(directory, 'sessions.sqlite');
    originalDbPath = process.env.DELIMIT_DB_PATH;
    process.env.DELIMIT_DB_PATH = databasePath;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalDbPath === undefined) delete process.env.DELIMIT_DB_PATH;
    else process.env.DELIMIT_DB_PATH = originalDbPath;
    rmSync(directory, { recursive: true, force: true });
  });

  const request = (body: unknown) =>
    new Request('http://localhost/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('issues only the registered product scenario', async () => {
    const response = await POST(
      request({ scenarioId: 'scenario-001-cache-staleness' }),
    );

    expect(response.status).toBe(201);
    const result = await response.json();
    expect(result.scenarioId).toBe('scenario-001-cache-staleness');

    const store = new SqliteSessionStore(databasePath);
    const stored = store.findById(result.sessionId);
    expect(stored).toMatchObject({
      scenario: {
        id: 'scenario-001-cache-staleness',
        type: 'multi_file',
        version: '1.0.0',
        durationSeconds: 3600,
      },
      scenarioType: 'multi_file',
    });

    const sandbox = new MockSandboxAdapter();
    const createAndVerify = vi.spyOn(sandbox, 'createAndVerify');
    await new SessionService(store, { sandboxAdapter: sandbox }).activate(
      result.candidatePath.split('/').at(-1)!,
    );
    expect(createAndVerify).toHaveBeenCalledWith(result.sessionId, {
      imageName: 'delimit-scenario-001:latest',
      scenarioType: 'multi_file',
    });
  });

  it('rejects malformed JSON before creating a session', async () => {
    const response = await POST(
      new Request('http://localhost/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{',
      }),
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe('INVALID_SESSION_REQUEST');
    expect(existsSync(databasePath)).toBe(false);
  });

  it.each([
    [{}, 'MISSING_SCENARIO_ID', 400],
    [{ scenarioId: '' }, 'MISSING_SCENARIO_ID', 400],
    [{ scenarioId: '  ' }, 'INVALID_SCENARIO_ID', 400],
    [
      { scenarioId: ['scenario-001-cache-staleness'] },
      'INVALID_SCENARIO_ID',
      400,
    ],
    [{ scenarioId: 'scenario-001' }, 'UNSUPPORTED_SCENARIO', 404],
    [{ scenarioId: 'slice-1-greeting-format' }, 'UNSUPPORTED_SCENARIO', 404],
    [{ scenarioId: 'not-a-scenario' }, 'UNSUPPORTED_SCENARIO', 404],
  ])('rejects non-issuable input %#', async (body, code, status) => {
    const createAndVerify = vi.spyOn(
      DockerSandboxAdapter.prototype,
      'createAndVerify',
    );
    const response = await POST(request(body));

    expect(response.status).toBe(status);
    expect((await response.json()).error.code).toBe(code);
    expect(existsSync(databasePath)).toBe(false);
    expect(createAndVerify).not.toHaveBeenCalled();
  });
});
