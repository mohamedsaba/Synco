import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  type AiCapabilitySnapshot,
  defaultAiCapabilitySnapshot,
  disabledAiCapabilitySnapshot,
  isValidAiInteractionTransition,
} from '../../apps/web/src/ai/ai-interaction';
import {
  AiInteractionService,
  getAiInteractionService,
} from '../../apps/web/src/ai/ai-interaction-service';
import { SqliteAiInteractionStore } from '../../apps/web/src/ai/sqlite-ai-interaction-store';
import { SqliteTransactionRunner } from '../../apps/web/src/database/sqlite-transaction-runner';
import { SqliteEventStore } from '../../apps/web/src/events/sqlite-event-store';
import { SessionService } from '../../apps/web/src/sessions/session-service';
import { SqliteSessionStore } from '../../apps/web/src/sessions/sqlite-session-store';

describe('AiInteractionService (Slice 6B Foundation)', () => {
  const createTestContext = (aiCapability?: AiCapabilitySnapshot | null) => {
    const dbPath = path.join(
      tmpdir(),
      `test-ai-service-${randomUUID()}.sqlite`,
    );
    const sessionStore = new SqliteSessionStore(dbPath);
    const eventStore = new SqliteEventStore(dbPath);
    const aiInteractionStore = new SqliteAiInteractionStore(dbPath);
    const runner = new SqliteTransactionRunner(dbPath);
    runner.registerInitializer(SqliteEventStore.ensureSchema);
    runner.registerInitializer(SqliteAiInteractionStore.ensureSchema);

    const sessionService = new SessionService(sessionStore, { eventStore });
    const aiService = new AiInteractionService({
      sessionStore,
      eventStore,
      aiInteractionStore,
      transactionRunner: runner,
    });

    const { candidateToken, session } = sessionService.createSession({
      aiCapability,
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
      dbPath,
      sessionStore,
      eventStore,
      aiInteractionStore,
      runner,
      sessionService,
      aiService,
      candidateToken,
      session,
      activateSession,
      submitSession,
    };
  };

  describe('1. Admission', () => {
    it('admits an AI interaction for an ACTIVE session with enabled capability', () => {
      const { aiService, session, activateSession } = createTestContext();

      // Activate session
      activateSession();

      const result = aiService.admitInteraction(session.id, {
        clientRequestId: 'req_001',
        candidatePromptText: 'How do I strip whitespace in formatGreeting?',
        candidateContext: [{ filePath: 'src/format-greeting.ts' }],
        delimitContext: {
          scenarioId: session.scenario.id,
          scenarioVersion: session.scenario.version,
          configurationVersion: '1.0.0',
        },
      });

      expect(result.wasAdmitted).toBe(true);
      expect(result.interaction.status).toBe('ADMITTED');
      expect(result.interaction.clientRequestId).toBe('req_001');
      expect(result.interaction.configuredProviderId).toBe(
        defaultAiCapabilitySnapshot.configuredProviderId,
      );
      expect(result.interaction.configuredModelId).toBe(
        defaultAiCapabilitySnapshot.configuredModelId,
      );
      expect(result.interaction.startedSequence).toBe(1);

      // Verify the AI_REQUEST_STARTED event was appended
      const events = aiService['eventStore'].getEvents(session.id);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('AI_REQUEST_STARTED');
      expect(events[0].sequence).toBe(1);
      expect(events[0].payload).toMatchObject({
        interactionId: result.interaction.id,
        clientRequestId: 'req_001',
        configuredProviderId: defaultAiCapabilitySnapshot.configuredProviderId,
        configuredModelId: defaultAiCapabilitySnapshot.configuredModelId,
        candidateInputExcerpt: 'How do I strip whitespace in formatGreeting?',
      });
    });

    it('rejects admission if session is in CREATED status', () => {
      const { aiService, session } = createTestContext();

      expect(() =>
        aiService.admitInteraction(session.id, {
          clientRequestId: 'req_created',
          candidatePromptText: 'Should fail',
        }),
      ).toThrowError(
        expect.objectContaining({
          code: 'SESSION_NOT_ACTIVE',
        }),
      );
    });

    it('rejects admission if session is in SUBMITTED status', () => {
      const { aiService, session, submitSession } = createTestContext();

      submitSession();

      expect(() =>
        aiService.admitInteraction(session.id, {
          clientRequestId: 'req_submitted',
          candidatePromptText: 'Should fail on submitted session',
        }),
      ).toThrowError(
        expect.objectContaining({
          code: 'SESSION_NOT_ACTIVE',
        }),
      );
    });

    it('rejects admission if AI capability is disabled for the session', () => {
      const { aiService, session, activateSession } = createTestContext(
        disabledAiCapabilitySnapshot,
      );

      activateSession();

      expect(() =>
        aiService.admitInteraction(session.id, {
          clientRequestId: 'req_disabled',
          candidatePromptText: 'Should fail because AI is disabled',
        }),
      ).toThrowError(
        expect.objectContaining({
          code: 'AI_NOT_ENABLED',
        }),
      );
    });

    it('rejects admission for empty candidate prompt', () => {
      const { aiService, session, activateSession } = createTestContext();

      activateSession();

      expect(() =>
        aiService.admitInteraction(session.id, {
          clientRequestId: 'req_empty',
          candidatePromptText: '   \n  \t  ',
        }),
      ).toThrowError(
        expect.objectContaining({
          code: 'INVALID_INPUT',
        }),
      );
    });

    it('rejects admission when candidate prompt exceeds maximum bounds', () => {
      const { aiService, session, activateSession } = createTestContext();

      activateSession();

      const hugePrompt = 'x'.repeat(33_000); // Exceeds 32 KiB
      expect(() =>
        aiService.admitInteraction(session.id, {
          clientRequestId: 'req_oversized',
          candidatePromptText: hugePrompt,
        }),
      ).toThrowError(
        expect.objectContaining({
          code: 'INPUT_TOO_LARGE',
        }),
      );
    });

    it('candidate cannot override configured provider or model', () => {
      const customCapability: AiCapabilitySnapshot = {
        enabled: true,
        contractVersion: 'slice-6b-v1',
        configuredProviderId: 'authoritative-provider',
        configuredModelId: 'authoritative-model',
        configurationVersion: '2.0.0',
      };

      const { aiService, session, activateSession } =
        createTestContext(customCapability);

      activateSession();

      const result = aiService.admitInteraction(session.id, {
        clientRequestId: 'req_configured_test',
        candidatePromptText: 'Test model allocation',
      });

      // Assert interaction received the server configured values
      expect(result.interaction.configuredProviderId).toBe(
        'authoritative-provider',
      );
      expect(result.interaction.configuredModelId).toBe('authoritative-model');
    });
  });

  describe('2. Atomicity Under Failure', () => {
    it('rolls back both interaction row and event if event append fails during admission', () => {
      const {
        sessionStore,
        eventStore,
        aiInteractionStore,
        runner,
        session,
        activateSession,
      } = createTestContext();

      activateSession();

      // Create a broken event store that fails during appendWithDatabase
      const brokenEventStore = {
        ...eventStore,
        appendWithDatabase: () => {
          throw new Error('Simulated event store failure during append');
        },
      } as unknown as SqliteEventStore;

      const failingAiService = new AiInteractionService({
        sessionStore,
        eventStore: brokenEventStore,
        aiInteractionStore,
        transactionRunner: runner,
      });

      expect(() =>
        failingAiService.admitInteraction(session.id, {
          clientRequestId: 'req_fail_admission',
          candidatePromptText: 'Should roll back atomically',
        }),
      ).toThrow('Simulated event store failure during append');

      // Assert NEITHER the interaction row nor the event exists in the database
      const row = aiInteractionStore.findByClientRequestId(
        session.id,
        'req_fail_admission',
      );
      expect(row).toBeNull();

      const events = eventStore.getEvents(session.id);
      expect(events).toHaveLength(0);
    });

    it('rolls back terminal state transition if event append fails during completion', () => {
      const {
        sessionStore,
        eventStore,
        aiInteractionStore,
        runner,
        aiService,
        session,
        activateSession,
      } = createTestContext();

      activateSession();

      const { interaction } = aiService.admitInteraction(session.id, {
        clientRequestId: 'req_complete_fail',
        candidatePromptText: 'Testing terminal atomicity',
      });
      aiService.transitionToDispatchStarted(interaction.id);

      // Create a service with an eventStore that throws during completion append
      const brokenEventStore = {
        ...eventStore,
        appendWithDatabase: () => {
          throw new Error('Simulated event store append failure on completion');
        },
      } as unknown as SqliteEventStore;

      const failingAiService = new AiInteractionService({
        sessionStore,
        eventStore: brokenEventStore,
        aiInteractionStore,
        transactionRunner: runner,
      });

      expect(() =>
        failingAiService.recordCompletion(interaction.id, {
          responseText: 'Completed answer',
          durationMs: 500,
          reportedModelId: 'mock-model',
        }),
      ).toThrow('Simulated event store append failure on completion');

      // Assert status remains DISPATCH_STARTED and no response is recorded
      const row = aiInteractionStore.findById(interaction.id);
      expect(row?.status).toBe('DISPATCH_STARTED');
      expect(row?.capturedResponseText).toBeNull();

      // Assert only the initial AI_REQUEST_STARTED event exists
      const events = eventStore.getEvents(session.id);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('AI_REQUEST_STARTED');
    });
  });

  describe('3. Idempotency (Sequential & Concurrent)', () => {
    it('returns the existing interaction deterministically on sequential duplicate clientRequestId', () => {
      const { aiService, session, activateSession } = createTestContext();

      activateSession();

      const first = aiService.admitInteraction(session.id, {
        clientRequestId: 'req_idempotent_seq',
        candidatePromptText: 'First invocation',
      });
      expect(first.wasAdmitted).toBe(true);

      const second = aiService.admitInteraction(session.id, {
        clientRequestId: 'req_idempotent_seq',
        candidatePromptText: 'Second invocation with identical clientRequestId',
      });

      expect(second.wasAdmitted).toBe(false);
      expect(second.interaction.id).toBe(first.interaction.id);
      expect(second.interaction.candidatePromptText).toBe('First invocation');

      // Assert exactly one start event was appended
      const events = aiService['eventStore'].getEvents(session.id);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('AI_REQUEST_STARTED');
    });

    it('resolves concurrent identical clientRequestIds to one interaction and one event', async () => {
      const { aiService, session, activateSession } = createTestContext();

      activateSession();

      const promises = [
        Promise.resolve().then(() =>
          aiService.admitInteraction(session.id, {
            clientRequestId: 'req_idempotent_concurrent',
            candidatePromptText: 'Concurrent attempt A',
          }),
        ),
        Promise.resolve().then(() =>
          aiService.admitInteraction(session.id, {
            clientRequestId: 'req_idempotent_concurrent',
            candidatePromptText: 'Concurrent attempt B',
          }),
        ),
      ];

      const [resA, resB] = await Promise.all(promises);

      expect(resA.interaction.id).toBe(resB.interaction.id);
      const admittedCount =
        (resA.wasAdmitted ? 1 : 0) + (resB.wasAdmitted ? 1 : 0);
      expect(admittedCount).toBe(1);

      // Exactly one event in the event store
      const events = aiService['eventStore'].getEvents(session.id);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('AI_REQUEST_STARTED');
    });
  });

  describe('4. Chronology & Monotonic Sequence Assignment', () => {
    it('receives normal authoritative sequence from event store and preserves ordering', () => {
      const { aiService, session, activateSession } = createTestContext();

      activateSession();

      // Event 1: AI_REQUEST_STARTED
      const { interaction } = aiService.admitInteraction(session.id, {
        clientRequestId: 'req_chronology',
        candidatePromptText: 'What does this function do?',
      });
      expect(interaction.startedSequence).toBe(1);

      // Event 2: AI_RESPONSE_COMPLETED
      aiService.transitionToDispatchStarted(interaction.id);
      const completed = aiService.recordCompletion(interaction.id, {
        responseText: 'It formats customer greetings.',
        durationMs: 800,
        reportedModelId: 'mock-model',
      });
      expect(completed.terminalSequence).toBe(2);

      const events = aiService['eventStore'].getEvents(session.id);
      expect(events).toHaveLength(2);
      expect(events[0].sequence).toBe(1);
      expect(events[0].type).toBe('AI_REQUEST_STARTED');
      expect(events[1].sequence).toBe(2);
      expect(events[1].type).toBe('AI_RESPONSE_COMPLETED');
    });
  });

  describe('5. Status Model & State Transitions', () => {
    it('allows valid transitions: ADMITTED -> DISPATCH_STARTED -> COMPLETED', () => {
      const { aiService, session, activateSession } = createTestContext();

      activateSession();

      const { interaction } = aiService.admitInteraction(session.id, {
        clientRequestId: 'req_status_1',
        candidatePromptText: 'Test status transitions',
      });
      expect(interaction.status).toBe('ADMITTED');

      const dispatched = aiService.transitionToDispatchStarted(interaction.id);
      expect(dispatched.status).toBe('DISPATCH_STARTED');

      const completed = aiService.recordCompletion(interaction.id, {
        responseText: 'All done',
        durationMs: 600,
        reportedModelId: 'mock-model',
      });
      expect(completed.status).toBe('COMPLETED');
    });

    it('rejects invalid transitions out of terminal states (COMPLETED -> FAILED)', () => {
      const { aiService, session, activateSession } = createTestContext();

      activateSession();

      const { interaction } = aiService.admitInteraction(session.id, {
        clientRequestId: 'req_status_invalid_1',
        candidatePromptText: 'Testing invalid transitions',
      });
      aiService.transitionToDispatchStarted(interaction.id);
      aiService.recordCompletion(interaction.id, {
        responseText: 'Success',
        durationMs: 300,
        reportedModelId: 'mock-model',
      });

      expect(() =>
        aiService.recordFailure(interaction.id, {
          durationMs: 400,
          failureReason: 'server_error',
          errorMessage: 'Should be rejected',
        }),
      ).toThrowError(
        expect.objectContaining({
          code: 'INVALID_STATE_TRANSITION',
        }),
      );
    });

    it('rejects transition from terminal to DISPATCH_STARTED', () => {
      const { aiService, session, activateSession } = createTestContext();

      activateSession();

      const { interaction } = aiService.admitInteraction(session.id, {
        clientRequestId: 'req_status_invalid_2',
        candidatePromptText: 'Testing terminal -> DISPATCH_STARTED',
      });
      aiService.recordCancellation(interaction.id, {
        durationMs: 100,
        cancelReason: 'candidate_requested_cancel',
      });

      expect(() =>
        aiService.transitionToDispatchStarted(interaction.id),
      ).toThrowError(
        expect.objectContaining({
          code: 'INVALID_STATE_TRANSITION',
        }),
      );
    });

    it('verifies isValidAiInteractionTransition pure function table', () => {
      expect(
        isValidAiInteractionTransition('ADMITTED', 'DISPATCH_STARTED'),
      ).toBe(true);
      expect(isValidAiInteractionTransition('ADMITTED', 'CANCELLED')).toBe(
        true,
      );
      expect(isValidAiInteractionTransition('ADMITTED', 'FAILED')).toBe(true);
      expect(isValidAiInteractionTransition('ADMITTED', 'COMPLETED')).toBe(
        false,
      );

      expect(
        isValidAiInteractionTransition('DISPATCH_STARTED', 'COMPLETED'),
      ).toBe(true);
      expect(
        isValidAiInteractionTransition('DISPATCH_STARTED', 'CANCELLED'),
      ).toBe(true);
      expect(isValidAiInteractionTransition('DISPATCH_STARTED', 'FAILED')).toBe(
        true,
      );
      expect(
        isValidAiInteractionTransition('DISPATCH_STARTED', 'ADMITTED'),
      ).toBe(false);

      expect(isValidAiInteractionTransition('COMPLETED', 'FAILED')).toBe(false);
      expect(isValidAiInteractionTransition('CANCELLED', 'COMPLETED')).toBe(
        false,
      );
      expect(isValidAiInteractionTransition('FAILED', 'COMPLETED')).toBe(false);
    });
  });

  describe('6. Crash / Retry Semantics (DISPATCH_STARTED)', () => {
    it('returns existing DISPATCH_STARTED interaction without duplicate dispatch or fake completion', () => {
      const { aiService, session, activateSession } = createTestContext();

      activateSession();

      const { interaction } = aiService.admitInteraction(session.id, {
        clientRequestId: 'req_crash_recovery',
        candidatePromptText: 'Prompt before crash',
      });

      aiService.transitionToDispatchStarted(interaction.id);

      // Simulate a client retry with the same clientRequestId after network interruption
      const retryResult = aiService.admitInteraction(session.id, {
        clientRequestId: 'req_crash_recovery',
        candidatePromptText: 'Prompt before crash',
      });

      expect(retryResult.wasAdmitted).toBe(false);
      expect(retryResult.interaction.id).toBe(interaction.id);
      expect(retryResult.interaction.status).toBe('DISPATCH_STARTED');
      expect(retryResult.interaction.capturedResponseText).toBeNull();

      // Assert only 1 event exists
      const events = aiService['eventStore'].getEvents(session.id);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('AI_REQUEST_STARTED');
    });
  });

  describe('7. Capability Snapshot Immutability & Legacy Compatibility', () => {
    it('persists immutable capability snapshot with session', () => {
      const customCapability: AiCapabilitySnapshot = {
        enabled: true,
        contractVersion: 'slice-6b-v1',
        configuredProviderId: 'custom-provider',
        configuredModelId: 'custom-model-v2',
        configurationVersion: '9.9.9',
      };

      const { sessionService, candidateToken } =
        createTestContext(customCapability);

      const session = sessionService.getCandidateSession(candidateToken);
      expect(session.aiCapabilitySnapshot).toEqual(customCapability);
    });

    it('handles legacy sessions predating AI capability (null snapshot)', () => {
      const {
        sessionService,
        aiService,
        candidateToken,
        session,
        activateSession,
      } = createTestContext(null);

      activateSession();

      const loaded = sessionService.getCandidateSession(candidateToken);
      expect(loaded.aiCapabilitySnapshot).toBeNull();

      // Attempting to admit interaction for a legacy session must be rejected with AI_NOT_ENABLED
      expect(() =>
        aiService.admitInteraction(session.id, {
          clientRequestId: 'req_legacy',
          candidatePromptText: 'Legacy attempt',
        }),
      ).toThrowError(
        expect.objectContaining({
          code: 'AI_NOT_ENABLED',
        }),
      );
    });
  });

  describe('8. Input & Context Authorship Separation', () => {
    it('stores candidate input separately from Delimit context without concatenation', () => {
      const { aiService, session, activateSession } = createTestContext();

      activateSession();

      const candidatePromptText = 'How do I run pytest?';
      const delimitContext = {
        scenarioId: 'scenario-001',
        scenarioVersion: '1.0.0',
        configurationVersion: '1.0.0',
        injectedBriefingIncluded: true,
      };

      const { interaction } = aiService.admitInteraction(session.id, {
        clientRequestId: 'req_authorship',
        candidatePromptText,
        delimitContext,
      });

      // Assert interaction stores prompt strictly as candidate text
      expect(interaction.candidatePromptText).toBe(candidatePromptText);
      expect(interaction.delimitContext).toEqual(delimitContext);

      // Verify DB row
      const row = aiService.getInteraction(interaction.id);
      expect(row?.candidatePromptText).toBe(candidatePromptText);
      expect(row?.delimitContext).toEqual(delimitContext);
      expect(row?.candidatePromptText).not.toContain('scenario-001');
    });
  });

  describe('9. Terminal Taxonomy', () => {
    it('completion creates only AI_RESPONSE_COMPLETED event', () => {
      const { aiService, session, activateSession } = createTestContext();

      activateSession();

      const { interaction } = aiService.admitInteraction(session.id, {
        clientRequestId: 'req_tax_complete',
        candidatePromptText: 'Taxonomy test complete',
      });
      aiService.transitionToDispatchStarted(interaction.id);

      aiService.recordCompletion(interaction.id, {
        responseText: 'Complete answer',
        durationMs: 450,
        reportedModelId: 'mock-model',
      });

      const events = aiService['eventStore'].getEvents(session.id);
      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('AI_REQUEST_STARTED');
      expect(events[1].type).toBe('AI_RESPONSE_COMPLETED');
    });

    it('cancellation creates only AI_REQUEST_CANCELLED event', () => {
      const { aiService, session, activateSession } = createTestContext();

      activateSession();

      const { interaction } = aiService.admitInteraction(session.id, {
        clientRequestId: 'req_tax_cancel',
        candidatePromptText: 'Taxonomy test cancel',
      });
      aiService.transitionToDispatchStarted(interaction.id);

      aiService.recordCancellation(interaction.id, {
        durationMs: 250,
        cancelReason: 'candidate_requested_cancel',
      });

      const events = aiService['eventStore'].getEvents(session.id);
      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('AI_REQUEST_STARTED');
      expect(events[1].type).toBe('AI_REQUEST_CANCELLED');
    });

    it('failure creates only AI_REQUEST_FAILED event', () => {
      const { aiService, session, activateSession } = createTestContext();

      activateSession();

      const { interaction } = aiService.admitInteraction(session.id, {
        clientRequestId: 'req_tax_fail',
        candidatePromptText: 'Taxonomy test fail',
      });
      aiService.transitionToDispatchStarted(interaction.id);

      aiService.recordFailure(interaction.id, {
        durationMs: 1500,
        failureReason: 'provider_error',
        errorMessage: 'Upstream gateway 502 Bad Gateway',
      });

      const events = aiService['eventStore'].getEvents(session.id);
      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('AI_REQUEST_STARTED');
      expect(events[1].type).toBe('AI_REQUEST_FAILED');
    });
  });

  describe('10. getAiInteractionService factory', () => {
    it('constructs working service from factory', () => {
      const dbPath = path.join(
        tmpdir(),
        `test-ai-factory-${randomUUID()}.sqlite`,
      );
      const service = getAiInteractionService(dbPath);
      expect(service).toBeInstanceOf(AiInteractionService);
    });
  });
});
