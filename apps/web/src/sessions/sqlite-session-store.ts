import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

import {
  activateSession,
  type AssessmentSession,
  editSession,
  SessionError,
  submitSession,
  type SubmittedSession,
} from './session';

type SessionRow = Readonly<{
  id: string;
  candidate_token_hash: string;
  scenario_id: string;
  scenario_version: string;
  scenario_title: string;
  scenario_brief: string;
  acceptance_criteria: string;
  file_path: string;
  original_content: string;
  status: AssessmentSession['status'];
  working_content: string;
  submitted_content: string | null;
  created_at: string;
  activated_at: string | null;
  submitted_at: string | null;
}>;

const schema = `
  CREATE TABLE IF NOT EXISTS assessment_sessions (
    id TEXT PRIMARY KEY,
    candidate_token_hash TEXT NOT NULL UNIQUE,
    scenario_id TEXT NOT NULL,
    scenario_version TEXT NOT NULL,
    scenario_title TEXT NOT NULL,
    scenario_brief TEXT NOT NULL,
    acceptance_criteria TEXT NOT NULL,
    file_path TEXT NOT NULL,
    original_content TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('CREATED', 'ACTIVE', 'SUBMITTED')),
    working_content TEXT NOT NULL,
    submitted_content TEXT,
    created_at TEXT NOT NULL,
    activated_at TEXT,
    submitted_at TEXT
  );
`;

const toSession = (row: SessionRow): AssessmentSession => ({
  id: row.id,
  candidateTokenHash: row.candidate_token_hash,
  scenario: {
    id: row.scenario_id,
    version: row.scenario_version,
    title: row.scenario_title,
    brief: row.scenario_brief,
    acceptanceCriteria: JSON.parse(row.acceptance_criteria) as string[],
    filePath: row.file_path,
    originalContent: row.original_content,
  },
  status: row.status,
  workingContent: row.working_content,
  submittedContent: row.submitted_content,
  createdAt: row.created_at,
  activatedAt: row.activated_at,
  submittedAt: row.submitted_at,
});

export class SqliteSessionStore {
  constructor(private readonly databasePath: string) {}

  create(session: AssessmentSession) {
    return this.withDatabase((database) => {
      database
        .prepare(
          `INSERT INTO assessment_sessions (
            id, candidate_token_hash, scenario_id, scenario_version,
            scenario_title, scenario_brief, acceptance_criteria, file_path,
            original_content, status, working_content, submitted_content,
            created_at, activated_at, submitted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          session.id,
          session.candidateTokenHash,
          session.scenario.id,
          session.scenario.version,
          session.scenario.title,
          session.scenario.brief,
          JSON.stringify(session.scenario.acceptanceCriteria),
          session.scenario.filePath,
          session.scenario.originalContent,
          session.status,
          session.workingContent,
          session.submittedContent,
          session.createdAt,
          session.activatedAt,
          session.submittedAt,
        );

      return session;
    });
  }

  findByCandidateTokenHash(candidateTokenHash: string) {
    return this.withDatabase((database) =>
      this.findByToken(database, candidateTokenHash),
    );
  }

  findById(id: string) {
    return this.withDatabase((database) => {
      const row = database
        .prepare('SELECT * FROM assessment_sessions WHERE id = ?')
        .get(id) as SessionRow | undefined;

      return row ? toSession(row) : null;
    });
  }

  activate(candidateTokenHash: string, activatedAt: string) {
    return this.mutate(candidateTokenHash, (session) =>
      activateSession(session, activatedAt),
    );
  }

  save(candidateTokenHash: string, content: string) {
    return this.mutate(candidateTokenHash, (session) =>
      editSession(session, content),
    );
  }

  submit(candidateTokenHash: string, submittedAt: string) {
    return this.mutate(candidateTokenHash, (session) =>
      submitSession(session, submittedAt),
    ) as SubmittedSession;
  }

  private mutate(
    candidateTokenHash: string,
    change: (session: AssessmentSession) => AssessmentSession,
  ) {
    return this.withDatabase((database) => {
      const transaction = database.transaction(() => {
        const current = this.findByToken(database, candidateTokenHash);
        if (!current) {
          throw new SessionError(
            'SESSION_NOT_FOUND',
            'The candidate session was not found.',
          );
        }

        const updated = change(current);
        database
          .prepare(
            `UPDATE assessment_sessions SET
              status = ?, working_content = ?, submitted_content = ?,
              activated_at = ?, submitted_at = ?
            WHERE id = ?`,
          )
          .run(
            updated.status,
            updated.workingContent,
            updated.submittedContent,
            updated.activatedAt,
            updated.submittedAt,
            updated.id,
          );

        return updated;
      });

      return transaction();
    });
  }

  private findByToken(database: Database.Database, candidateTokenHash: string) {
    const row = database
      .prepare(
        'SELECT * FROM assessment_sessions WHERE candidate_token_hash = ?',
      )
      .get(candidateTokenHash) as SessionRow | undefined;

    return row ? toSession(row) : null;
  }

  private withDatabase<T>(operation: (database: Database.Database) => T) {
    if (this.databasePath !== ':memory:') {
      mkdirSync(path.dirname(this.databasePath), { recursive: true });
    }

    const database = new Database(this.databasePath);
    database.pragma('journal_mode = WAL');
    database.pragma('busy_timeout = 5000');
    database.exec(schema);

    try {
      return operation(database);
    } finally {
      database.close();
    }
  }
}
