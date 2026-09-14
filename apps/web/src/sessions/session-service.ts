import { createHash, randomBytes, randomUUID } from 'node:crypto';
import path from 'node:path';

import {
  createSubmittedDiff,
  normalizeLineEndings,
} from '../evidence/unified-diff';
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
}>;

export class SessionService {
  private readonly now: () => string;
  private readonly createId: () => string;
  private readonly createToken: () => string;

  constructor(
    private readonly store: SqliteSessionStore,
    options: SessionServiceOptions = {},
  ) {
    this.now = options.now ?? (() => new Date().toISOString());
    this.createId = options.createId ?? randomUUID;
    this.createToken =
      options.createToken ?? (() => randomBytes(32).toString('base64url'));
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

  activate(candidateToken: string) {
    return this.store.activate(hashCandidateToken(candidateToken), this.now());
  }

  save(candidateToken: string, content: string) {
    if (content.length > maximumContentLength) {
      throw new SessionError(
        'CONTENT_TOO_LARGE',
        'The file exceeds the 100 KB limit for this scenario.',
      );
    }

    return this.store.save(
      hashCandidateToken(candidateToken),
      normalizeLineEndings(content),
    );
  }

  submit(candidateToken: string) {
    return this.store.submit(hashCandidateToken(candidateToken), this.now());
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
    };
  }
}

export const getSessionService = () => {
  const databasePath =
    process.env.DELIMIT_DB_PATH ??
    path.join(process.cwd(), '.data/delimit.sqlite');

  return new SessionService(new SqliteSessionStore(databasePath));
};
