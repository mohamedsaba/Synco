import { randomUUID } from 'node:crypto';
import path from 'node:path';

import { SqliteTransactionRunner } from '../database/sqlite-transaction-runner';
import { SqliteEventStore } from '../events/sqlite-event-store';
import { SqliteSessionStore } from '../sessions/sqlite-session-store';
import {
  type AiInteraction,
  AiInteractionError,
  boundExcerpt,
  type CandidateContextAttachment,
  type DelimitContextMetadata,
  isValidAiInteractionTransition,
  MAXIMUM_PROMPT_LENGTH,
} from './ai-interaction';
import { SqliteAiInteractionStore } from './sqlite-ai-interaction-store';

export type AdmitAiInteractionParams = Readonly<{
  clientRequestId: string;
  candidatePromptText: string;
  candidateContext?: readonly CandidateContextAttachment[];
  delimitContext?: DelimitContextMetadata;
}>;

export type CompleteAiInteractionParams = Readonly<{
  responseText: string;
  durationMs: number;
  reportedModelId: string;
  providerRequestId?: string;
  finishReason?: string;
  tokenUsage?: Readonly<{
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  }>;
}>;

export type CancelAiInteractionParams = Readonly<{
  durationMs: number;
  cancelReason:
    | 'candidate_requested_cancel'
    | 'session_ended'
    | 'platform_policy_abort'
    | string;
}>;

export type FailAiInteractionParams = Readonly<{
  durationMs: number;
  failureReason:
    | 'provider_error'
    | 'provider_disconnected'
    | 'server_timeout'
    | 'server_error'
    | string;
  errorMessage: string;
}>;

export type AiInteractionServiceOptions = Readonly<{
  sessionStore: SqliteSessionStore;
  eventStore: SqliteEventStore;
  aiInteractionStore: SqliteAiInteractionStore;
  transactionRunner: SqliteTransactionRunner;
  createId?: () => string;
  now?: () => string;
}>;

export class AiInteractionService {
  private readonly sessionStore: SqliteSessionStore;
  private readonly eventStore: SqliteEventStore;
  private readonly aiInteractionStore: SqliteAiInteractionStore;
  private readonly transactionRunner: SqliteTransactionRunner;
  private readonly createId: () => string;
  private readonly now: () => string;

  constructor(options: AiInteractionServiceOptions) {
    this.sessionStore = options.sessionStore;
    this.eventStore = options.eventStore;
    this.aiInteractionStore = options.aiInteractionStore;
    this.transactionRunner = options.transactionRunner;
    this.createId = options.createId ?? randomUUID;
    this.now = options.now ?? (() => new Date().toISOString());
  }

  admitInteraction(
    sessionId: string,
    params: AdmitAiInteractionParams,
  ): { interaction: AiInteraction; wasAdmitted: boolean } {
    const session = this.sessionStore.findById(sessionId);
    if (!session) {
      throw new AiInteractionError(
        'SESSION_NOT_FOUND',
        `Session ${sessionId} was not found.`,
      );
    }

    if (session.status !== 'ACTIVE') {
      throw new AiInteractionError(
        'SESSION_NOT_ACTIVE',
        `AI interactions can only be admitted for active sessions. Current status: ${session.status}.`,
      );
    }

    const snapshot = session.aiCapabilitySnapshot;
    if (!snapshot || !snapshot.enabled) {
      throw new AiInteractionError(
        'AI_NOT_ENABLED',
        'AI capability is not enabled for this session.',
      );
    }

    if (
      !params.candidatePromptText ||
      params.candidatePromptText.trim().length === 0
    ) {
      throw new AiInteractionError(
        'INVALID_INPUT',
        'Candidate prompt cannot be empty.',
      );
    }

    const inputBytes = Buffer.byteLength(params.candidatePromptText, 'utf8');
    if (inputBytes > MAXIMUM_PROMPT_LENGTH) {
      throw new AiInteractionError(
        'INPUT_TOO_LARGE',
        `The prompt exceeds the maximum allowed length of ${MAXIMUM_PROMPT_LENGTH} bytes.`,
      );
    }

    const interactionId = `ai_int_${this.createId()}`;
    const createdAt = this.now();

    try {
      return this.transactionRunner.run((database) => {
        const existing =
          this.aiInteractionStore.findByClientRequestIdWithDatabase(
            database,
            sessionId,
            params.clientRequestId,
          );

        if (existing) {
          return {
            interaction: existing,
            wasAdmitted: false,
          };
        }

        const interaction: AiInteraction = {
          id: interactionId,
          sessionId,
          clientRequestId: params.clientRequestId,
          status: 'ADMITTED',
          configuredProviderId: snapshot.configuredProviderId,
          configuredModelId: snapshot.configuredModelId,
          candidatePromptText: params.candidatePromptText,
          candidateContext: params.candidateContext,
          delimitContext: params.delimitContext,
          createdAt,
        };

        this.aiInteractionStore.createWithDatabase(database, interaction);

        const event = this.eventStore.appendWithDatabase(database, {
          id: `evt_${this.createId()}`,
          sessionId,
          type: 'AI_REQUEST_STARTED',
          timestamp: createdAt,
          source: 'server',
          payload: {
            interactionId,
            clientRequestId: params.clientRequestId,
            configuredProviderId: snapshot.configuredProviderId,
            configuredModelId: snapshot.configuredModelId,
            candidateInputExcerpt: boundExcerpt(params.candidatePromptText),
            candidateInputBytes: inputBytes,
            candidateContext: params.candidateContext,
            delimitContext: params.delimitContext,
          },
        });

        this.aiInteractionStore.updateStartedSequenceWithDatabase(
          database,
          interactionId,
          event.sequence,
        );

        return {
          interaction: {
            ...interaction,
            startedSequence: event.sequence,
          },
          wasAdmitted: true,
        };
      });
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        (error.message.includes('UNIQUE constraint failed') ||
          error.message.includes('SQLITE_CONSTRAINT'))
      ) {
        const existing = this.aiInteractionStore.findByClientRequestId(
          sessionId,
          params.clientRequestId,
        );
        if (existing) {
          return {
            interaction: existing,
            wasAdmitted: false,
          };
        }
      }
      throw error;
    }
  }

  transitionToDispatchStarted(interactionId: string): AiInteraction {
    return this.transactionRunner.run((database) => {
      const current = this.aiInteractionStore.findByIdWithDatabase(
        database,
        interactionId,
      );
      if (!current) {
        throw new AiInteractionError(
          'INTERACTION_NOT_FOUND',
          `AI interaction ${interactionId} was not found.`,
        );
      }

      if (!isValidAiInteractionTransition(current.status, 'DISPATCH_STARTED')) {
        throw new AiInteractionError(
          'INVALID_STATE_TRANSITION',
          `Cannot transition AI interaction from ${current.status} to DISPATCH_STARTED.`,
        );
      }

      return this.aiInteractionStore.updateStatusWithDatabase(database, {
        id: interactionId,
        status: 'DISPATCH_STARTED',
      });
    });
  }

  recordCompletion(
    interactionId: string,
    params: CompleteAiInteractionParams,
  ): AiInteraction {
    return this.transactionRunner.run((database) => {
      const current = this.aiInteractionStore.findByIdWithDatabase(
        database,
        interactionId,
      );
      if (!current) {
        throw new AiInteractionError(
          'INTERACTION_NOT_FOUND',
          `AI interaction ${interactionId} was not found.`,
        );
      }

      if (!isValidAiInteractionTransition(current.status, 'COMPLETED')) {
        throw new AiInteractionError(
          'INVALID_STATE_TRANSITION',
          `Cannot transition AI interaction from ${current.status} to COMPLETED.`,
        );
      }

      const terminalAt = this.now();
      const responseBytes = Buffer.byteLength(params.responseText, 'utf8');

      const event = this.eventStore.appendWithDatabase(database, {
        id: `evt_${this.createId()}`,
        sessionId: current.sessionId,
        type: 'AI_RESPONSE_COMPLETED',
        timestamp: terminalAt,
        source: 'server',
        payload: {
          interactionId: current.id,
          durationMs: params.durationMs,
          reportedModelId: params.reportedModelId,
          providerRequestId: params.providerRequestId,
          responseExcerpt: boundExcerpt(params.responseText),
          responseBytes,
          finishReason: params.finishReason,
          tokenUsage: params.tokenUsage,
        },
      });

      return this.aiInteractionStore.updateStatusWithDatabase(database, {
        id: interactionId,
        status: 'COMPLETED',
        capturedResponseText: params.responseText,
        durationMs: params.durationMs,
        terminalAt,
        terminalSequence: event.sequence,
      });
    });
  }

  recordCancellation(
    interactionId: string,
    params: CancelAiInteractionParams,
  ): AiInteraction {
    return this.transactionRunner.run((database) => {
      const current = this.aiInteractionStore.findByIdWithDatabase(
        database,
        interactionId,
      );
      if (!current) {
        throw new AiInteractionError(
          'INTERACTION_NOT_FOUND',
          `AI interaction ${interactionId} was not found.`,
        );
      }

      if (!isValidAiInteractionTransition(current.status, 'CANCELLED')) {
        throw new AiInteractionError(
          'INVALID_STATE_TRANSITION',
          `Cannot transition AI interaction from ${current.status} to CANCELLED.`,
        );
      }

      const terminalAt = this.now();

      const event = this.eventStore.appendWithDatabase(database, {
        id: `evt_${this.createId()}`,
        sessionId: current.sessionId,
        type: 'AI_REQUEST_CANCELLED',
        timestamp: terminalAt,
        source: 'server',
        payload: {
          interactionId: current.id,
          durationMs: params.durationMs,
          cancelReason: params.cancelReason,
        },
      });

      return this.aiInteractionStore.updateStatusWithDatabase(database, {
        id: interactionId,
        status: 'CANCELLED',
        terminalReason: params.cancelReason,
        durationMs: params.durationMs,
        terminalAt,
        terminalSequence: event.sequence,
      });
    });
  }

  recordFailure(
    interactionId: string,
    params: FailAiInteractionParams,
  ): AiInteraction {
    return this.transactionRunner.run((database) => {
      const current = this.aiInteractionStore.findByIdWithDatabase(
        database,
        interactionId,
      );
      if (!current) {
        throw new AiInteractionError(
          'INTERACTION_NOT_FOUND',
          `AI interaction ${interactionId} was not found.`,
        );
      }

      if (!isValidAiInteractionTransition(current.status, 'FAILED')) {
        throw new AiInteractionError(
          'INVALID_STATE_TRANSITION',
          `Cannot transition AI interaction from ${current.status} to FAILED.`,
        );
      }

      const terminalAt = this.now();

      const event = this.eventStore.appendWithDatabase(database, {
        id: `evt_${this.createId()}`,
        sessionId: current.sessionId,
        type: 'AI_REQUEST_FAILED',
        timestamp: terminalAt,
        source: 'server',
        payload: {
          interactionId: current.id,
          durationMs: params.durationMs,
          failureReason: params.failureReason,
          errorMessageExcerpt: boundExcerpt(params.errorMessage),
        },
      });

      return this.aiInteractionStore.updateStatusWithDatabase(database, {
        id: interactionId,
        status: 'FAILED',
        terminalReason: params.failureReason,
        errorMessage: params.errorMessage,
        durationMs: params.durationMs,
        terminalAt,
        terminalSequence: event.sequence,
      });
    });
  }

  getInteraction(interactionId: string): AiInteraction | null {
    return this.aiInteractionStore.findById(interactionId);
  }

  getInteractionsForSession(sessionId: string): readonly AiInteraction[] {
    return this.aiInteractionStore.findBySessionId(sessionId);
  }
}

export const getAiInteractionService = (databasePath?: string) => {
  const resolvedPath =
    databasePath ??
    process.env.DELIMIT_DB_PATH ??
    path.join(process.cwd(), '.data/delimit.sqlite');

  const sessionStore = new SqliteSessionStore(resolvedPath);
  const eventStore = new SqliteEventStore(resolvedPath);
  const aiInteractionStore = new SqliteAiInteractionStore(resolvedPath);
  const runner = new SqliteTransactionRunner(resolvedPath);
  runner.registerInitializer(SqliteEventStore.ensureSchema);
  runner.registerInitializer(SqliteAiInteractionStore.ensureSchema);

  return new AiInteractionService({
    sessionStore,
    eventStore,
    aiInteractionStore,
    transactionRunner: runner,
  });
};
