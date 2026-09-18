import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  type AiCapabilitySnapshot,
  defaultAiCapabilitySnapshot,
  disabledAiCapabilitySnapshot,
} from '../../apps/web/src/ai/ai-interaction';
import { AiInteractionService } from '../../apps/web/src/ai/ai-interaction-service';
import {
  type AiProvider,
  DefaultAiProviderRegistry,
  type NormalizedAiRequest,
} from '../../apps/web/src/ai/ai-provider';
import { MockAiProvider } from '../../apps/web/src/ai/mock-ai-provider';
import { SqliteAiInteractionStore } from '../../apps/web/src/ai/sqlite-ai-interaction-store';
import { SqliteTransactionRunner } from '../../apps/web/src/database/sqlite-transaction-runner';
import { SqliteEventStore } from '../../apps/web/src/events/sqlite-event-store';
import { SessionService } from '../../apps/web/src/sessions/session-service';
import { SqliteSessionStore } from '../../apps/web/src/sessions/sqlite-session-store';

describe('AiInteractionService Provider Execution Lifecycle (Slice 6C)', () => {
  const createTestRig = (options?: {
    aiCapability?: AiCapabilitySnapshot | null;
    mockProvider?: MockAiProvider;
    customProviders?: AiProvider[];
    timeoutMs?: number;
  }) => {
    const dbPath = path.join(tmpdir(), `test-ai-exec-${randomUUID()}.sqlite`);
    const sessionStore = new SqliteSessionStore(dbPath);
    const eventStore = new SqliteEventStore(dbPath);
    const aiInteractionStore = new SqliteAiInteractionStore(dbPath);
    const runner = new SqliteTransactionRunner(dbPath);
    runner.registerInitializer(SqliteEventStore.ensureSchema);
    runner.registerInitializer(SqliteAiInteractionStore.ensureSchema);

    const mock = options?.mockProvider ?? new MockAiProvider();
    const registry = new DefaultAiProviderRegistry([
      mock,
      ...(options?.customProviders ?? []),
    ]);

    const sessionService = new SessionService(sessionStore, { eventStore });
    const aiService = new AiInteractionService({
      sessionStore,
      eventStore,
      aiInteractionStore,
      transactionRunner: runner,
      providerRegistry: registry,
      timeoutMs: options?.timeoutMs ?? 2000,
    });

    const capability =
      options?.aiCapability !== undefined
        ? options.aiCapability
        : defaultAiCapabilitySnapshot;

    const { candidateToken, session } = sessionService.createSession({
      aiCapability: capability,
    });

    const activateSession = () => {
      sessionStore.activate(
        session.candidateTokenHash,
        new Date().toISOString(),
      );
    };

    const submitSession = () => {
      activateSession();
      sessionStore.submit(
        session.candidateTokenHash,
        new Date().toISOString(),
        null,
      );
    };

    return {
      sessionStore,
      eventStore,
      aiInteractionStore,
      sessionService,
      aiService,
      mockProvider: mock,
      candidateToken,
      session,
      activateSession,
      submitSession,
    };
  };

  it('1. Success: executes full synchronous lifecycle and persists evidence atomically', async () => {
    const {
      aiService,
      session,
      activateSession,
      eventStore,
      aiInteractionStore,
    } = createTestRig();
    activateSession();

    const result = await aiService.executeInteraction(session.id, {
      clientRequestId: 'req_success_1',
      candidatePromptText: 'What is wrong with cache staleness?',
      candidateContext: [
        { filePath: 'inventory/cache.py', startLine: 10, endLine: 20 },
      ],
    });

    expect(result.status).toBe('COMPLETED');
    expect(result.responseText).toContain(
      'Mock response for: What is wrong with cache staleness?',
    );
    expect(result.configuredModelId).toBe('mock-chat-v1');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.errorMessage).toBeNull();
    expect(result.terminalReason).toBeNull();

    // Verify interaction row in DB
    const stored = aiInteractionStore.findById(result.interactionId);
    expect(stored).not.toBeNull();
    expect(stored?.status).toBe('COMPLETED');
    expect(stored?.capturedResponseText).toBe(result.responseText);
    expect(stored?.terminalSequence).toBeDefined();

    // Verify events emitted
    const events = eventStore.getEvents(session.id);
    expect(events).toHaveLength(2);
    expect(events[0].type).toBe('AI_REQUEST_STARTED');
    expect(events[1].type).toBe('AI_RESPONSE_COMPLETED');
    expect(events[1].sequence).toBeGreaterThan(events[0].sequence);
  });

  it('2. Duplicate before dispatch: returns existing interaction and does not dispatch provider twice', async () => {
    let callCount = 0;
    const mock = new MockAiProvider({
      responder: () => {
        callCount++;
        return { responseText: `Call count: ${callCount}` };
      },
    });

    const { aiService, session, activateSession } = createTestRig({
      mockProvider: mock,
    });
    activateSession();

    // Pre-admit an interaction without dispatching
    const admission = aiService.admitInteraction(session.id, {
      clientRequestId: 'req_pre_admitted',
      candidatePromptText: 'First prompt',
    });
    expect(admission.wasAdmitted).toBe(true);
    expect(admission.interaction.status).toBe('ADMITTED');

    // Duplicate call before dispatch
    const result = await aiService.executeInteraction(session.id, {
      clientRequestId: 'req_pre_admitted',
      candidatePromptText: 'Duplicate prompt before dispatch',
    });

    // Should return existing ADMITTED interaction without invoking provider
    expect(result.interactionId).toBe(admission.interaction.id);
    expect(callCount).toBe(0);
  });

  it('3. Duplicate completed: returns terminal result and does not replay provider', async () => {
    let callCount = 0;
    const mock = new MockAiProvider({
      responder: () => {
        callCount++;
        return { responseText: 'First and only completion' };
      },
    });

    const { aiService, session, activateSession } = createTestRig({
      mockProvider: mock,
    });
    activateSession();

    const first = await aiService.executeInteraction(session.id, {
      clientRequestId: 'req_idempotent_1',
      candidatePromptText: 'Initial execution',
    });
    expect(first.status).toBe('COMPLETED');
    expect(callCount).toBe(1);

    const second = await aiService.executeInteraction(session.id, {
      clientRequestId: 'req_idempotent_1',
      candidatePromptText: 'Retry execution',
    });
    expect(second.status).toBe('COMPLETED');
    expect(second.interactionId).toBe(first.interactionId);
    expect(second.responseText).toBe(first.responseText);
    // Provider MUST NOT have been called a second time
    expect(callCount).toBe(1);
  });

  it('4. Duplicate DISPATCH_STARTED: returns ambiguous non-replayable state without replaying provider', async () => {
    let callCount = 0;
    const mock = new MockAiProvider({
      responder: () => {
        callCount++;
        return { responseText: 'Dispatched response' };
      },
    });

    const { aiService, session, activateSession } = createTestRig({
      mockProvider: mock,
    });
    activateSession();

    // Admit and transition to DISPATCH_STARTED manually (simulating in-flight or crashed dispatch)
    const admission = aiService.admitInteraction(session.id, {
      clientRequestId: 'req_in_flight',
      candidatePromptText: 'In flight prompt',
    });
    aiService.transitionToDispatchStarted(admission.interaction.id);

    // Call executeInteraction with identical clientRequestId
    const duplicate = await aiService.executeInteraction(session.id, {
      clientRequestId: 'req_in_flight',
      candidatePromptText: 'Duplicate prompt while in-flight',
    });

    expect(duplicate.status).toBe('DISPATCH_STARTED');
    expect(duplicate.terminalReason).toBe('AMBIGUOUS_DISPATCH');
    expect(duplicate.errorMessage).toContain(
      'cannot be replayed automatically',
    );
    expect(duplicate.responseText).toBeNull();
    // Provider MUST NOT be called
    expect(callCount).toBe(0);
  });

  it('5. Provider error: transitions to FAILED and appends AI_REQUEST_FAILED with sanitized error', async () => {
    const mock = new MockAiProvider({
      simulatedError: new Error('Rate limit exceeded (HTTP 429)'),
    });

    const {
      aiService,
      session,
      activateSession,
      eventStore,
      aiInteractionStore,
    } = createTestRig({ mockProvider: mock });
    activateSession();

    const result = await aiService.executeInteraction(session.id, {
      clientRequestId: 'req_err_1',
      candidatePromptText: 'Trigger provider error',
    });

    expect(result.status).toBe('FAILED');
    expect(result.terminalReason).toBe('PROVIDER_ERROR');
    expect(result.errorMessage).toBe('Rate limit exceeded (HTTP 429)');
    expect(result.responseText).toBeNull();

    // Verify DB row
    const stored = aiInteractionStore.findById(result.interactionId);
    expect(stored?.status).toBe('FAILED');
    expect(stored?.terminalReason).toBe('PROVIDER_ERROR');
    expect(stored?.errorMessage).toBe('Rate limit exceeded (HTTP 429)');

    // Verify events: AI_REQUEST_STARTED -> AI_REQUEST_FAILED
    const events = eventStore.getEvents(session.id);
    expect(events).toHaveLength(2);
    expect(events[0].type).toBe('AI_REQUEST_STARTED');
    expect(events[1].type).toBe('AI_REQUEST_FAILED');
  });

  it('6. Timeout: transitions to FAILED with TIMEOUT reason and does NOT emit CANCELLED', async () => {
    const mock = new MockAiProvider({
      delayMs: 500, // delays longer than the 100ms timeout
    });

    const {
      aiService,
      session,
      activateSession,
      eventStore,
      aiInteractionStore,
    } = createTestRig({
      mockProvider: mock,
      timeoutMs: 100,
    });
    activateSession();

    const result = await aiService.executeInteraction(session.id, {
      clientRequestId: 'req_timeout_1',
      candidatePromptText: 'Trigger timeout',
    });

    expect(result.status).toBe('FAILED');
    expect(result.terminalReason).toBe('TIMEOUT');
    expect(result.errorMessage).toBe('The AI request timed out.');

    // Ensure database recorded FAILED, NOT CANCELLED
    const stored = aiInteractionStore.findById(result.interactionId);
    expect(stored?.status).toBe('FAILED');
    expect(stored?.terminalReason).toBe('TIMEOUT');

    // Ensure event is AI_REQUEST_FAILED, NOT AI_REQUEST_CANCELLED
    const events = eventStore.getEvents(session.id);
    expect(events).toHaveLength(2);
    expect(events[0].type).toBe('AI_REQUEST_STARTED');
    expect(events[1].type).toBe('AI_REQUEST_FAILED');
  });

  it('7. Unknown provider: fails safely with PROVIDER_NOT_CONFIGURED platform error without silent fallback', async () => {
    const customCapability: AiCapabilitySnapshot = {
      enabled: true,
      contractVersion: 'slice-6b-v1',
      configuredProviderId: 'unregistered-ai-vendor',
      configuredModelId: 'vendor-model-x',
      configurationVersion: '1.0.0',
    };

    const { aiService, session, activateSession } = createTestRig({
      aiCapability: customCapability,
    });
    activateSession();

    await expect(
      aiService.executeInteraction(session.id, {
        clientRequestId: 'req_unknown_provider',
        candidatePromptText: 'Test unknown provider',
      }),
    ).rejects.toThrowError(
      expect.objectContaining({
        code: 'PROVIDER_NOT_CONFIGURED',
      }),
    );
  });

  it('8. Persistence failure before dispatch: provider is never called', async () => {
    let providerCalled = false;
    const mock = new MockAiProvider({
      responder: () => {
        providerCalled = true;
        return { responseText: 'Should not run' };
      },
    });

    const { aiService, session, activateSession, aiInteractionStore } =
      createTestRig({ mockProvider: mock });
    activateSession();

    // Sabotage store createWithDatabase to simulate SQLite disk / table lock failure
    const originalCreate =
      aiInteractionStore.createWithDatabase.bind(aiInteractionStore);
    aiInteractionStore.createWithDatabase = () => {
      throw new Error('Disk I/O error');
    };

    await expect(
      aiService.executeInteraction(session.id, {
        clientRequestId: 'req_persist_fail_pre',
        candidatePromptText: 'Pre-dispatch failure',
      }),
    ).rejects.toThrow('Disk I/O error');

    expect(providerCalled).toBe(false);
    aiInteractionStore.createWithDatabase = originalCreate;
  });

  it('9. Persistence failure after provider response: surfaces error and does not report false success', async () => {
    const mock = new MockAiProvider({
      responder: () => ({ responseText: 'Provider succeeded' }),
    });

    const { aiService, session, activateSession, eventStore } = createTestRig({
      mockProvider: mock,
    });
    activateSession();

    // Sabotage eventStore appendWithDatabase on the second call (completion event)
    let appendCount = 0;
    const originalAppend = eventStore.appendWithDatabase.bind(eventStore);
    eventStore.appendWithDatabase = (db, event) => {
      appendCount++;
      if (appendCount === 2) {
        throw new Error('Database locked during completion commit');
      }
      return originalAppend(db, event);
    };

    await expect(
      aiService.executeInteraction(session.id, {
        clientRequestId: 'req_persist_fail_post',
        candidatePromptText: 'Post-dispatch failure',
      }),
    ).rejects.toThrowError(
      expect.objectContaining({
        code: 'PLATFORM_PERSISTENCE_FAILED',
      }),
    );

    // Verify events in database: MUST NOT contain AI_RESPONSE_COMPLETED
    const events = eventStore.getEvents(session.id);
    expect(events.some((e) => e.type === 'AI_RESPONSE_COMPLETED')).toBe(false);

    eventStore.appendWithDatabase = originalAppend;
  });

  it('10. Invalid session state: rejects CREATED, SUBMITTED, and AI-disabled sessions', async () => {
    // A. CREATED session
    const rig1 = createTestRig();
    await expect(
      rig1.aiService.executeInteraction(rig1.session.id, {
        clientRequestId: 'req_created',
        candidatePromptText: 'Prompt on CREATED',
      }),
    ).rejects.toThrowError(
      expect.objectContaining({ code: 'SESSION_NOT_ACTIVE' }),
    );

    // B. SUBMITTED session
    const rig2 = createTestRig();
    rig2.submitSession();
    await expect(
      rig2.aiService.executeInteraction(rig2.session.id, {
        clientRequestId: 'req_submitted',
        candidatePromptText: 'Prompt on SUBMITTED',
      }),
    ).rejects.toThrowError(
      expect.objectContaining({ code: 'SESSION_NOT_ACTIVE' }),
    );

    // C. AI-disabled session
    const rig3 = createTestRig({ aiCapability: disabledAiCapabilitySnapshot });
    rig3.activateSession();
    await expect(
      rig3.aiService.executeInteraction(rig3.session.id, {
        clientRequestId: 'req_disabled',
        candidatePromptText: 'Prompt on disabled',
      }),
    ).rejects.toThrowError(expect.objectContaining({ code: 'AI_NOT_ENABLED' }));
  });

  it('11. Candidate provider/model injection: configuration comes strictly from session snapshot', async () => {
    let capturedRequest: NormalizedAiRequest | null = null;
    const mock = new MockAiProvider({
      responder: (req) => {
        capturedRequest = req;
        return { responseText: 'Config preserved' };
      },
    });

    const { aiService, session, activateSession } = createTestRig({
      mockProvider: mock,
    });
    activateSession();

    await aiService.executeInteraction(session.id, {
      clientRequestId: 'req_injection_check',
      candidatePromptText: 'Check model injection',
    });

    expect(capturedRequest).not.toBeNull();
    // Confirms configuredModelId is from snapshot, not client override
    expect(capturedRequest?.configuredModelId).toBe(
      session.aiCapabilitySnapshot?.configuredModelId,
    );
  });

  it('12. Context path escape: rejects invalid or path traversal attachments', async () => {
    const { aiService, session, activateSession } = createTestRig();
    activateSession();

    // Path traversal
    await expect(
      aiService.executeInteraction(session.id, {
        clientRequestId: 'req_traversal',
        candidatePromptText: 'Traversal check',
        candidateContext: [{ filePath: '../../etc/passwd' }],
      }),
    ).rejects.toThrowError(expect.objectContaining({ code: 'INVALID_INPUT' }));

    // Absolute path
    await expect(
      aiService.executeInteraction(session.id, {
        clientRequestId: 'req_absolute',
        candidatePromptText: 'Absolute path check',
        candidateContext: [{ filePath: '/etc/hosts' }],
      }),
    ).rejects.toThrowError(expect.objectContaining({ code: 'INVALID_INPUT' }));

    // Invalid line ranges
    await expect(
      aiService.executeInteraction(session.id, {
        clientRequestId: 'req_bad_lines',
        candidatePromptText: 'Line check',
        candidateContext: [{ filePath: 'file.py', startLine: 50, endLine: 10 }],
      }),
    ).rejects.toThrowError(expect.objectContaining({ code: 'INVALID_INPUT' }));
  });

  it('13. Concurrency: concurrent executions with identical clientRequestId execute provider at most once', async () => {
    let executions = 0;
    const mock = new MockAiProvider({
      delayMs: 50,
      responder: async () => {
        executions++;
        return { responseText: 'Concurrent single execution' };
      },
    });

    const { aiService, session, activateSession } = createTestRig({
      mockProvider: mock,
    });
    activateSession();

    const [first, second] = await Promise.all([
      aiService.executeInteraction(session.id, {
        clientRequestId: 'req_concurrent_1',
        candidatePromptText: 'Concurrent call 1',
      }),
      aiService.executeInteraction(session.id, {
        clientRequestId: 'req_concurrent_1',
        candidatePromptText: 'Concurrent call 2',
      }),
    ]);

    // Exactly one provider execution occurs
    expect(executions).toBe(1);
    expect(first.interactionId).toBe(second.interactionId);
  });
});
