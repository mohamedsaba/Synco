import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { POST as executeAiInteraction } from '../../apps/web/app/api/candidate/sessions/[token]/ai/interactions/route';
import { POST as activateSession } from '../../apps/web/app/api/candidate/sessions/[token]/activate/route';

import {
  defaultAiCapabilitySnapshot,
  disabledAiCapabilitySnapshot,
} from '../../apps/web/src/ai/ai-interaction';
import { toCandidateSessionView } from '../../apps/web/src/sessions/candidate-session-view';
import { SessionService } from '../../apps/web/src/sessions/session-service';
import { SqliteSessionStore } from '../../apps/web/src/sessions/sqlite-session-store';

describe('Candidate AI Workspace End-to-End Integration', () => {
  let directory: string;
  let databasePath: string;
  let originalDbPath: string | undefined;

  beforeEach(() => {
    directory = mkdtempSync(path.join(tmpdir(), 'delimit-candidate-ai-ws-'));
    databasePath = path.join(directory, 'ws-test.sqlite');
    originalDbPath = process.env.DELIMIT_DB_PATH;
    process.env.DELIMIT_DB_PATH = databasePath;
  });

  afterEach(() => {
    if (originalDbPath !== undefined) {
      process.env.DELIMIT_DB_PATH = originalDbPath;
    } else {
      delete process.env.DELIMIT_DB_PATH;
    }
    rmSync(directory, { recursive: true, force: true });
  });

  const createRequest = (url: string, body?: Record<string, unknown>) =>
    new Request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });

  it('verifies complete lifecycle: capability projection, activation, interaction, and session submission', async () => {
    const sessionStore = new SqliteSessionStore(databasePath);
    const sessionService = new SessionService(sessionStore);

    // 1. Session created with AI capability enabled
    const { candidateToken, session } = sessionService.createSession({
      aiCapability: defaultAiCapabilitySnapshot,
    });

    const initialView = toCandidateSessionView(session);
    expect(initialView.status).toBe('CREATED');
    expect(initialView.aiCapability).toEqual({ enabled: true });

    // 2. Candidate activates session
    const activateReq = createRequest(
      `http://localhost:3000/api/candidate/sessions/${candidateToken}/activate`,
    );
    const activateRes = await activateSession(activateReq, {
      params: Promise.resolve({ token: candidateToken }),
    });
    expect(activateRes.status).toBe(200);
    const activeSessionData = await activateRes.json();
    expect(activeSessionData.status).toBe('ACTIVE');
    expect(activeSessionData.aiCapability).toEqual({ enabled: true });

    // 3. Candidate dispatches AI interaction with context reference
    const aiReq = createRequest(
      `http://localhost:3000/api/candidate/sessions/${candidateToken}/ai/interactions`,
      {
        clientRequestId: 'client_req_ws_1',
        candidatePromptText: 'Explain the cache invalidation contract.',
        candidateContext: [{ filePath: 'inventory/cache.py' }],
      },
    );
    const aiRes = await executeAiInteraction(aiReq, {
      params: Promise.resolve({ token: candidateToken }),
    });

    expect(aiRes.status).toBe(200);
    const aiData = await aiRes.json();
    expect(aiData.status).toBe('COMPLETED');
    expect(aiData.responseText).toContain(
      'Mock response for: Explain the cache invalidation contract.',
    );
    expect(aiData.configuredModelId).toBe('mock-chat-v1');

    // 4. Candidate submits the assessment
    const submittedSession = await sessionService.submit(candidateToken);
    expect(submittedSession.status).toBe('SUBMITTED');
    const submittedView = toCandidateSessionView(submittedSession);
    expect(submittedView.status).toBe('SUBMITTED');
    expect(submittedView.aiCapability).toEqual({ enabled: true });

    // 5. Subsequent AI interactions on submitted session are rejected with 409
    const postSubmitAiReq = createRequest(
      `http://localhost:3000/api/candidate/sessions/${candidateToken}/ai/interactions`,
      {
        clientRequestId: 'client_req_ws_2',
        candidatePromptText: 'Can I ask after submission?',
      },
    );
    const postSubmitAiRes = await executeAiInteraction(postSubmitAiReq, {
      params: Promise.resolve({ token: candidateToken }),
    });
    expect(postSubmitAiRes.status).toBe(409);
    const postSubmitAiData = await postSubmitAiRes.json();
    expect(postSubmitAiData.error?.code).toBe('SESSION_NOT_ACTIVE');
  });

  it('projects disabled capability accurately through session service and route', async () => {
    const sessionStore = new SqliteSessionStore(databasePath);
    const sessionService = new SessionService(sessionStore);

    const { candidateToken } = sessionService.createSession({
      aiCapability: disabledAiCapabilitySnapshot,
    });

    const activateReq = createRequest(
      `http://localhost:3000/api/candidate/sessions/${candidateToken}/activate`,
    );
    const activateRes = await activateSession(activateReq, {
      params: Promise.resolve({ token: candidateToken }),
    });
    expect(activateRes.status).toBe(200);
    const activeData = await activateRes.json();
    expect(activeData.aiCapability).toEqual({ enabled: false });

    // Attempting interaction fails with 409 AI_NOT_ENABLED
    const aiReq = createRequest(
      `http://localhost:3000/api/candidate/sessions/${candidateToken}/ai/interactions`,
      {
        clientRequestId: 'client_req_disabled',
        candidatePromptText: 'Attempting with disabled AI',
      },
    );
    const aiRes = await executeAiInteraction(aiReq, {
      params: Promise.resolve({ token: candidateToken }),
    });
    expect(aiRes.status).toBe(409);
    const aiData = await aiRes.json();
    expect(aiData.error?.code).toBe('AI_NOT_ENABLED');
  });
});
