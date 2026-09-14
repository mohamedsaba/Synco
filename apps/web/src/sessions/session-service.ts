import { createHash, randomBytes, randomUUID } from 'node:crypto';
import path from 'node:path';

import {
  createSubmittedDiff,
  normalizeLineEndings,
} from '../evidence/unified-diff';
import { SqliteEventStore } from '../events/sqlite-event-store';
import { DockerSandboxAdapter } from '../sandbox/docker-sandbox-adapter';
import {
  type CommandExecResult,
  type SandboxAdapter,
  SandboxError,
} from '../sandbox/sandbox';
import { sliceOneScenario } from '../scenarios/slice-one-scenario';
import {
  type AssessmentSession,
  requireSubmittedSession,
  SessionError,
} from './session';
import { SqliteSessionStore } from './sqlite-session-store';

const maximumContentLength = 100_000;

const hashCandidateToken = (candidateToken: string) =>
  createHash('sha256').update(candidateToken).digest('hex');

export type SessionServiceOptions = Readonly<{
  now?: () => string;
  createId?: () => string;
  createToken?: () => string;
  eventStore?: SqliteEventStore;
  sandboxAdapter?: SandboxAdapter;
}>;

export class SessionService {
  private readonly now: () => string;
  private readonly createId: () => string;
  private readonly createToken: () => string;
  private readonly eventStore?: SqliteEventStore;
  private readonly sandboxAdapter?: SandboxAdapter;

  constructor(
    private readonly store: SqliteSessionStore,
    options: SessionServiceOptions = {},
  ) {
    this.now = options.now ?? (() => new Date().toISOString());
    this.createId = options.createId ?? randomUUID;
    this.createToken =
      options.createToken ?? (() => randomBytes(32).toString('base64url'));
    this.eventStore = options.eventStore;
    this.sandboxAdapter = options.sandboxAdapter;
  }

  createSession() {
    const candidateToken = this.createToken();
    const originalContent = normalizeLineEndings(
      sliceOneScenario.originalContent,
    );
    const session: AssessmentSession = {
      id: this.createId(),
      candidateTokenHash: hashCandidateToken(candidateToken),
      scenario: { ...sliceOneScenario, originalContent },
      status: 'CREATED',
      workingContent: originalContent,
      submittedContent: null,
      createdAt: this.now(),
      activatedAt: null,
      submittedAt: null,
    };

    this.store.create(session);
    return { candidateToken, session };
  }

  getCandidateSession(candidateToken: string) {
    const session = this.store.findByCandidateTokenHash(
      hashCandidateToken(candidateToken),
    );

    if (!session) {
      throw new SessionError(
        'SESSION_NOT_FOUND',
        'The candidate session was not found.',
      );
    }

    return session;
  }

  async activate(candidateToken: string) {
    const tokenHash = hashCandidateToken(candidateToken);
    const session = this.store.findByCandidateTokenHash(tokenHash);

    if (!session) {
      throw new SessionError(
        'SESSION_NOT_FOUND',
        'The candidate session was not found.',
      );
    }

    if (session.status === 'ACTIVE') {
      return session;
    }

    if (session.status !== 'CREATED') {
      throw new SessionError(
        'SESSION_NOT_ACTIVE',
        'A submitted session cannot be activated.',
      );
    }

    // Readiness gate: Sandbox must be created and verified before session transitions to ACTIVE
    if (this.sandboxAdapter) {
      await this.sandboxAdapter.createAndVerify(session.id, {
        [session.scenario.filePath]: session.workingContent,
      });
    }

    // Only after readiness succeeds, transition to ACTIVE and record activatedAt
    return this.store.activate(tokenHash, this.now());
  }

  async save(candidateToken: string, content: string) {
    if (content.length > maximumContentLength) {
      throw new SessionError(
        'CONTENT_TOO_LARGE',
        'The file exceeds the 100 KB limit for this scenario.',
      );
    }

    const tokenHash = hashCandidateToken(candidateToken);
    const normalized = normalizeLineEndings(content);
    const session = this.store.save(tokenHash, normalized);

    if (this.sandboxAdapter && session.status === 'ACTIVE') {
      await this.sandboxAdapter
        .writeFile(session.id, session.scenario.filePath, normalized)
        .catch((err) => {
          console.warn('Could not sync working content to active sandbox', err);
        });
    }

    return session;
  }

  async executeCommand(
    candidateToken: string,
    command: string,
  ): Promise<CommandExecResult> {
    const tokenHash = hashCandidateToken(candidateToken);
    const session = this.store.findByCandidateTokenHash(tokenHash);

    if (!session) {
      throw new SessionError(
        'SESSION_NOT_FOUND',
        'The candidate session was not found.',
      );
    }

    if (session.status !== 'ACTIVE') {
      throw new SessionError(
        'SESSION_NOT_ACTIVE',
        'Commands can be executed only while the session is active.',
      );
    }

    if (!this.sandboxAdapter) {
      throw new SandboxError(
        'SANDBOX_NOT_FOUND',
        'No sandbox runtime is configured for this environment.',
      );
    }

    const commandId = `cmd_${randomUUID()}`;

    // 1. Authoritatively record COMMAND_STARTED
    if (this.eventStore) {
      this.eventStore.append({
        id: `evt_${randomUUID()}`,
        sessionId: session.id,
        type: 'COMMAND_STARTED',
        timestamp: this.now(),
        source: 'server',
        payload: {
          commandId,
          command,
          cwd: '/workspace',
        },
      });
    }

    // 2. Execute command in sandbox
    const result = await this.sandboxAdapter.exec(
      session.id,
      commandId,
      command,
      '/workspace',
    );

    // 3. Authoritatively record COMMAND_FINISHED
    if (this.eventStore) {
      this.eventStore.append({
        id: `evt_${randomUUID()}`,
        sessionId: session.id,
        type: 'COMMAND_FINISHED',
        timestamp: this.now(),
        source: 'server',
        payload: {
          commandId,
          exitCode: result.exitCode,
          timedOut: result.timedOut,
          durationMs: result.durationMs,
          stdoutPreview: result.stdoutPreview,
          stdoutBytes: result.stdoutBytes,
          stdoutTruncated: result.stdoutTruncated,
          stderrPreview: result.stderrPreview,
          stderrBytes: result.stderrBytes,
          stderrTruncated: result.stderrTruncated,
        },
      });
    }

    return result;
  }

  async submit(candidateToken: string) {
    const tokenHash = hashCandidateToken(candidateToken);
    const session = this.store.findByCandidateTokenHash(tokenHash);

    if (!session) {
      throw new SessionError(
        'SESSION_NOT_FOUND',
        'The candidate session was not found.',
      );
    }

    const submitted = this.store.submit(tokenHash, this.now());

    // Deterministic sandbox teardown on submission
    if (this.sandboxAdapter) {
      await this.sandboxAdapter.teardown(session.id).catch((err) => {
        console.warn('Error during sandbox teardown on submission', err);
      });
    }

    return submitted;
  }

  getSubmittedEvidence(sessionId: string) {
    const session = this.store.findById(sessionId);
    if (!session) {
      throw new SessionError(
        'SESSION_NOT_FOUND',
        'The evaluator session was not found.',
      );
    }

    const submitted = requireSubmittedSession(session);
    const events = this.eventStore ? this.eventStore.getEvents(sessionId) : [];

    return {
      sessionId: submitted.id,
      scenario: submitted.scenario,
      submittedAt: submitted.submittedAt,
      originalContent: submitted.scenario.originalContent,
      submittedContent: submitted.submittedContent,
      diff: createSubmittedDiff(
        submitted.scenario.filePath,
        submitted.scenario.originalContent,
        submitted.submittedContent,
      ),
      events,
    };
  }

  getSessionEvents(candidateToken: string) {
    const session = this.getCandidateSession(candidateToken);
    return this.eventStore ? this.eventStore.getEvents(session.id) : [];
  }
}

export const getSessionService = () => {
  const databasePath =
    process.env.DELIMIT_DB_PATH ??
    path.join(process.cwd(), '.data/delimit.sqlite');

  const store = new SqliteSessionStore(databasePath);
  const eventStore = new SqliteEventStore(databasePath);
  const sandboxAdapter = new DockerSandboxAdapter();

  return new SessionService(store, { eventStore, sandboxAdapter });
};
