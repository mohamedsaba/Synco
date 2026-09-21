import {
  cloneScenarioSemanticSnapshot,
  decodeStoredSemanticSnapshot,
} from '../scenarios/scenario-semantic-snapshot';
import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

import {
  activateSession,
  type AssessmentSession,
  editSession,
  type SessionClosureReason,
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
  duration_seconds: number | null;
  closure_reason: AssessmentSession['closureReason'];
  scenario_type: 'single_file' | 'multi_file' | null;
  submitted_diff: string | null;
  scenario_evaluation_context: string | null;
  scenario_semantic_snapshot: string | null;
  ai_capability_snapshot: string | null;
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
    submitted_at TEXT,
    duration_seconds INTEGER CHECK (duration_seconds IS NULL OR (duration_seconds > 0 AND duration_seconds = CAST(duration_seconds AS INTEGER))),
    closure_reason TEXT CHECK (closure_reason IS NULL OR closure_reason IN ('candidate_submission', 'timeout')),
    scenario_type TEXT DEFAULT 'single_file',
    submitted_diff TEXT,
    scenario_evaluation_context TEXT,
    scenario_semantic_snapshot TEXT,
    ai_capability_snapshot TEXT
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
    ...(row.duration_seconds !== null && row.duration_seconds !== undefined
      ? { durationSeconds: row.duration_seconds }
      : {}),
    ...(row.scenario_semantic_snapshot
      ? {
          semanticSnapshot: decodeStoredSemanticSnapshot(
            row.scenario_semantic_snapshot,
          ),
        }
      : {}),
    type: row.scenario_type ?? 'single_file',
    ...(row.scenario_evaluation_context
      ? {
          evaluationContext: JSON.parse(
            row.scenario_evaluation_context,
          ) as AssessmentSession['scenario']['evaluationContext'],
        }
      : {}),
  },
  status: row.status,
  workingContent: row.working_content,
  submittedContent: row.submitted_content,
  createdAt: row.created_at,
  activatedAt: row.activated_at,
  submittedAt: row.submitted_at,
  durationSeconds: row.duration_seconds,
  closureReason: row.closure_reason,
  scenarioType: row.scenario_type ?? 'single_file',
  submittedDiff: row.submitted_diff,
  aiCapabilitySnapshot: row.ai_capability_snapshot
    ? (JSON.parse(
        row.ai_capability_snapshot,
      ) as AssessmentSession['aiCapabilitySnapshot'])
    : null,
});

export class SqliteSessionStore {
  constructor(public readonly databasePath: string) {}

  static ensureSchema(database: Database.Database): void {
    const migrate = database.transaction(() => {
      database.exec(schema);
      const columns = database
        .prepare('PRAGMA table_info(assessment_sessions)')
        .all() as Array<{ name: string }>;
      const additions = [
        [
          'duration_seconds',
          'INTEGER CHECK (duration_seconds IS NULL OR (duration_seconds > 0 AND duration_seconds = CAST(duration_seconds AS INTEGER)))',
        ],
        [
          'closure_reason',
          "TEXT CHECK (closure_reason IS NULL OR closure_reason IN ('candidate_submission', 'timeout'))",
        ],
        ['scenario_type', "TEXT DEFAULT 'single_file'"],
        ['submitted_diff', 'TEXT'],
        ['scenario_evaluation_context', 'TEXT'],
        ['scenario_semantic_snapshot', 'TEXT'],
        ['ai_capability_snapshot', 'TEXT'],
      ] as const;
      for (const [name, definition] of additions) {
        if (!columns.some((column) => column.name === name)) {
          database.exec(
            `ALTER TABLE assessment_sessions ADD COLUMN ${name} ${definition}`,
          );
        }
      }

      database.exec(`
        UPDATE assessment_sessions
        SET closure_reason = 'candidate_submission'
        WHERE status = 'SUBMITTED' AND closure_reason IS NULL;
      `);
    });
    migrate.immediate();
  }

  create(session: AssessmentSession) {
    return this.withDatabase((database) => {
      database
        .prepare(
          `INSERT INTO assessment_sessions (
            id, candidate_token_hash, scenario_id, scenario_version,
            scenario_title, scenario_brief, acceptance_criteria, file_path,
            original_content, status, working_content, submitted_content,
            created_at, activated_at, submitted_at, duration_seconds,
            closure_reason, scenario_type, submitted_diff,
            scenario_evaluation_context, scenario_semantic_snapshot,
            ai_capability_snapshot
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          session.durationSeconds,
          session.closureReason,
          session.scenarioType ?? session.scenario.type ?? 'single_file',
          session.submittedDiff ?? null,
          session.scenario.evaluationContext
            ? JSON.stringify(session.scenario.evaluationContext)
            : null,
          session.scenario.semanticSnapshot === undefined
            ? null
            : JSON.stringify(
                cloneScenarioSemanticSnapshot(
                  session.scenario.semanticSnapshot,
                ),
              ),
          session.aiCapabilitySnapshot
            ? JSON.stringify(session.aiCapabilitySnapshot)
            : null,
        );

      return session;
    });
  }

  findByCandidateTokenHash(candidateTokenHash: string) {
    return this.withDatabase((database) =>
      this.findByToken(database, candidateTokenHash),
    );
  }

  findByIdWithDatabase(
    database: Database.Database,
    id: string,
  ): AssessmentSession | null {
    const row = database
      .prepare('SELECT * FROM assessment_sessions WHERE id = ?')
      .get(id) as SessionRow | undefined;

    return row ? toSession(row) : null;
  }

  findById(id: string) {
    return this.withDatabase((database) =>
      this.findByIdWithDatabase(database, id),
    );
  }

  findActiveTimed() {
    return this.withDatabase((database) => {
      const rows = database
        .prepare(
          `SELECT * FROM assessment_sessions
           WHERE status = 'ACTIVE'
             AND activated_at IS NOT NULL
             AND duration_seconds IS NOT NULL`,
        )
        .all() as SessionRow[];
      return rows.map(toSession);
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

  submitWithDatabase(
    database: Database.Database,
    sessionId: string,
    submittedAt: string,
    submittedDiff?: string | null,
    closureReason: SessionClosureReason = 'candidate_submission',
  ): SubmittedSession {
    const current = this.findByIdWithDatabase(database, sessionId);
    if (!current) {
      throw new SessionError(
        'SESSION_NOT_FOUND',
        'The candidate session was not found.',
      );
    }

    const updated = submitSession(
      current,
      submittedAt,
      submittedDiff,
      closureReason,
    );
    database
      .prepare(
        `UPDATE assessment_sessions SET
          status = ?, working_content = ?, submitted_content = ?,
          activated_at = ?, submitted_at = ?, submitted_diff = ?,
          closure_reason = ?
        WHERE id = ?`,
      )
      .run(
        updated.status,
        updated.workingContent,
        updated.submittedContent,
        updated.activatedAt,
        updated.submittedAt,
        updated.submittedDiff ?? null,
        updated.closureReason,
        updated.id,
      );

    return updated as SubmittedSession;
  }

  submit(
    candidateTokenHash: string,
    submittedAt: string,
    submittedDiff?: string | null,
    closureReason: SessionClosureReason = 'candidate_submission',
  ) {
    return this.mutate(candidateTokenHash, (session) =>
      submitSession(session, submittedAt, submittedDiff, closureReason),
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
              activated_at = ?, submitted_at = ?, submitted_diff = ?,
              closure_reason = ?
            WHERE id = ?`,
          )
          .run(
            updated.status,
            updated.workingContent,
            updated.submittedContent,
            updated.activatedAt,
            updated.submittedAt,
            updated.submittedDiff ?? null,
            updated.closureReason ?? null,
            updated.id,
          );

        return updated;
      });

      return transaction.immediate();
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
    try {
      SqliteSessionStore.ensureSchema(database);
      return operation(database);
    } finally {
      database.close();
    }
  }
}
