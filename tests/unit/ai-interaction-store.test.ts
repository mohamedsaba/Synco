import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  type AiInteraction,
  defaultAiCapabilitySnapshot,
} from '../../apps/web/src/ai/ai-interaction';
import { SqliteAiInteractionStore } from '../../apps/web/src/ai/sqlite-ai-interaction-store';
import { SqliteTransactionRunner } from '../../apps/web/src/database/sqlite-transaction-runner';

describe('SqliteAiInteractionStore', () => {
  const createDbPath = () =>
    path.join(tmpdir(), `test-ai-store-${randomUUID()}.sqlite`);

  it('initializes schema and creates interaction row', () => {
    const dbPath = createDbPath();
    const store = new SqliteAiInteractionStore(dbPath);

    const interaction: AiInteraction = {
      id: 'ai_int_1',
      sessionId: 'session_1',
      clientRequestId: 'req_1',
      status: 'ADMITTED',
      configuredProviderId: defaultAiCapabilitySnapshot.configuredProviderId,
      configuredModelId: defaultAiCapabilitySnapshot.configuredModelId,
      candidatePromptText: 'Explain the bug in the greeting formatter.',
      candidateContext: [{ filePath: 'src/format-greeting.ts' }],
      hirearchyContext: {
        scenarioId: 'slice-1-greeting-format',
        scenarioVersion: '1.0.0',
        configurationVersion: '1.0.0',
      },
      createdAt: new Date().toISOString(),
    };

    const created = store.create(interaction);
    expect(created.id).toBe('ai_int_1');

    const found = store.findById('ai_int_1');
    expect(found).not.toBeNull();
    expect(found?.id).toBe('ai_int_1');
    expect(found?.sessionId).toBe('session_1');
    expect(found?.clientRequestId).toBe('req_1');
    expect(found?.status).toBe('ADMITTED');
    expect(found?.candidatePromptText).toBe(
      'Explain the bug in the greeting formatter.',
    );
    expect(found?.candidateContext).toEqual([
      { filePath: 'src/format-greeting.ts' },
    ]);
    expect(found?.hirearchyContext?.scenarioId).toBe('slice-1-greeting-format');
  });

  it('enforces UNIQUE(session_id, client_request_id)', () => {
    const dbPath = createDbPath();
    const store = new SqliteAiInteractionStore(dbPath);

    const interaction1: AiInteraction = {
      id: 'ai_int_1',
      sessionId: 'session_1',
      clientRequestId: 'duplicate_req',
      status: 'ADMITTED',
      configuredProviderId: 'mock-ai',
      configuredModelId: 'mock-chat-v1',
      candidatePromptText: 'First try',
      createdAt: new Date().toISOString(),
    };

    const interaction2: AiInteraction = {
      id: 'ai_int_2',
      sessionId: 'session_1',
      clientRequestId: 'duplicate_req',
      status: 'ADMITTED',
      configuredProviderId: 'mock-ai',
      configuredModelId: 'mock-chat-v1',
      candidatePromptText: 'Second try',
      createdAt: new Date().toISOString(),
    };

    store.create(interaction1);

    expect(() => store.create(interaction2)).toThrow(
      /UNIQUE constraint failed/,
    );
  });

  it('allows identical client_request_id in different sessions', () => {
    const dbPath = createDbPath();
    const store = new SqliteAiInteractionStore(dbPath);

    const interaction1: AiInteraction = {
      id: 'ai_int_1',
      sessionId: 'session_A',
      clientRequestId: 'same_req_id',
      status: 'ADMITTED',
      configuredProviderId: 'mock-ai',
      configuredModelId: 'mock-chat-v1',
      candidatePromptText: 'First session',
      createdAt: new Date().toISOString(),
    };

    const interaction2: AiInteraction = {
      id: 'ai_int_2',
      sessionId: 'session_B',
      clientRequestId: 'same_req_id',
      status: 'ADMITTED',
      configuredProviderId: 'mock-ai',
      configuredModelId: 'mock-chat-v1',
      candidatePromptText: 'Second session',
      createdAt: new Date().toISOString(),
    };

    store.create(interaction1);
    store.create(interaction2);

    expect(store.findByClientRequestId('session_A', 'same_req_id')?.id).toBe(
      'ai_int_1',
    );
    expect(store.findByClientRequestId('session_B', 'same_req_id')?.id).toBe(
      'ai_int_2',
    );
  });

  it('updates status and terminal sequences correctly', () => {
    const dbPath = createDbPath();
    const store = new SqliteAiInteractionStore(dbPath);
    const runner = new SqliteTransactionRunner(dbPath);
    runner.registerInitializer(SqliteAiInteractionStore.ensureSchema);

    const interaction: AiInteraction = {
      id: 'ai_int_terminal',
      sessionId: 'session_1',
      clientRequestId: 'req_term',
      status: 'ADMITTED',
      configuredProviderId: 'mock-ai',
      configuredModelId: 'mock-chat-v1',
      candidatePromptText: 'Test terminal transitions',
      createdAt: new Date().toISOString(),
    };

    runner.run((database) => {
      store.createWithDatabase(database, interaction);
      store.updateStartedSequenceWithDatabase(database, 'ai_int_terminal', 10);
    });

    let row = store.findById('ai_int_terminal');
    expect(row?.startedSequence).toBe(10);
    expect(row?.status).toBe('ADMITTED');

    runner.run((database) => {
      store.updateStatusWithDatabase(database, {
        id: 'ai_int_terminal',
        status: 'COMPLETED',
        capturedResponseText: 'Here is the completed response.',
        durationMs: 1250,
        terminalAt: new Date().toISOString(),
        terminalSequence: 15,
      });
    });

    row = store.findById('ai_int_terminal');
    expect(row?.status).toBe('COMPLETED');
    expect(row?.capturedResponseText).toBe('Here is the completed response.');
    expect(row?.durationMs).toBe(1250);
    expect(row?.terminalSequence).toBe(15);
  });
});
