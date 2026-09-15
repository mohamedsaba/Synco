import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

import type {
  EvidenceReconstructionContentV1,
  EvidenceReconstructionRecord,
  ReconstructionFailureCode,
  ReconstructionStatus,
} from './evidence-reconstruction';

type ReconstructionRow = Readonly<{
  id: string;
  session_id: string;
  status: ReconstructionStatus;
  schema_version: 1;
  prompt_version: string;
  packet_builder_version: string;
  provider_id: string | null;
  model_id: string | null;
  provider_request_id: string | null;
  source_first_sequence: number | null;
  source_last_sequence: number | null;
  source_event_count: number;
  source_packet_sha256: string | null;
  final_diff_sha256: string;
  final_diff_bytes: number;
  content_json: string | null;
  failure_code: ReconstructionFailureCode | null;
  failure_message: string | null;
  attempt_count: number;
  attempt_token: string;
  created_at: string;
  attempt_started_at: string;
  completed_at: string | null;
  updated_at: string;
}>;

type AttemptSource = Readonly<{
  id: string;
  sessionId: string;
  promptVersion: string;
  packetBuilderVersion: string;
  sourceFirstSequence: number | null;
  sourceLastSequence: number | null;
  sourceEventCount: number;
  finalDiffSha256: string;
  finalDiffBytes: number;
  attemptToken: string;
  now: string;
}>;

const schema = `
  CREATE TABLE IF NOT EXISTS evidence_reconstructions (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'AVAILABLE', 'FAILED')),
    schema_version INTEGER NOT NULL,
    prompt_version TEXT NOT NULL,
    packet_builder_version TEXT NOT NULL,
    provider_id TEXT,
    model_id TEXT,
    provider_request_id TEXT,
    source_first_sequence INTEGER,
    source_last_sequence INTEGER,
    source_event_count INTEGER NOT NULL,
    source_packet_sha256 TEXT,
    final_diff_sha256 TEXT NOT NULL,
    final_diff_bytes INTEGER NOT NULL,
    content_json TEXT,
    failure_code TEXT,
    failure_message TEXT,
    attempt_count INTEGER NOT NULL,
    attempt_token TEXT NOT NULL,
    created_at TEXT NOT NULL,
    attempt_started_at TEXT NOT NULL,
    completed_at TEXT,
    updated_at TEXT NOT NULL
  );
`;

const toRecord = (row: ReconstructionRow): EvidenceReconstructionRecord => ({
  id: row.id,
  sessionId: row.session_id,
  status: row.status,
  schemaVersion: row.schema_version,
  promptVersion: row.prompt_version,
  packetBuilderVersion: row.packet_builder_version,
  providerId: row.provider_id,
  modelId: row.model_id,
  providerRequestId: row.provider_request_id,
  sourceFirstSequence: row.source_first_sequence,
  sourceLastSequence: row.source_last_sequence,
  sourceEventCount: row.source_event_count,
  sourcePacketSha256: row.source_packet_sha256,
  finalDiffSha256: row.final_diff_sha256,
  finalDiffBytes: row.final_diff_bytes,
  content: row.content_json
    ? (JSON.parse(row.content_json) as EvidenceReconstructionContentV1)
    : null,
  failureCode: row.failure_code,
  failureMessage: row.failure_message,
  attemptCount: row.attempt_count,
  attemptToken: row.attempt_token,
  createdAt: row.created_at,
  attemptStartedAt: row.attempt_started_at,
  completedAt: row.completed_at,
  updatedAt: row.updated_at,
});

export class SqliteEvidenceReconstructionStore {
  constructor(private readonly databasePath: string) {}

  getBySessionId(sessionId: string) {
    return this.withDatabase((database) => this.find(database, sessionId));
  }

  beginFirstAttempt(source: AttemptSource) {
    return this.withDatabase((database) => {
      const transaction = database.transaction(() => {
        const result = database
          .prepare(
            `INSERT OR IGNORE INTO evidence_reconstructions (
              id, session_id, status, schema_version, prompt_version,
              packet_builder_version, source_first_sequence,
              source_last_sequence, source_event_count, final_diff_sha256,
              final_diff_bytes, attempt_count, attempt_token, created_at,
              attempt_started_at, updated_at
            ) VALUES (?, ?, 'PENDING', 1, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`,
          )
          .run(
            source.id,
            source.sessionId,
            source.promptVersion,
            source.packetBuilderVersion,
            source.sourceFirstSequence,
            source.sourceLastSequence,
            source.sourceEventCount,
            source.finalDiffSha256,
            source.finalDiffBytes,
            source.attemptToken,
            source.now,
            source.now,
            source.now,
          );
        return {
          claimed: result.changes === 1,
          record: this.requireRecord(database, source.sessionId),
        };
      });
      return transaction.immediate();
    });
  }

  retryFailed(sessionId: string, attemptToken: string, now: string) {
    return this.reclaim(sessionId, "status = 'FAILED'", [], attemptToken, now);
  }

  reclaimStale(
    sessionId: string,
    staleBefore: string,
    attemptToken: string,
    now: string,
  ) {
    return this.reclaim(
      sessionId,
      "status = 'PENDING' AND attempt_started_at < ?",
      [staleBefore],
      attemptToken,
      now,
    );
  }

  completeAvailable(
    input: Readonly<{
      sessionId: string;
      attemptCount: number;
      attemptToken: string;
      providerId: string;
      modelId: string;
      providerRequestId?: string;
      sourcePacketSha256: string;
      content: EvidenceReconstructionContentV1;
      now: string;
    }>,
  ) {
    return this.complete(
      input.sessionId,
      input.attemptCount,
      input.attemptToken,
      `status = 'AVAILABLE', provider_id = ?, model_id = ?,
       provider_request_id = ?, source_packet_sha256 = ?, content_json = ?,
       failure_code = NULL, failure_message = NULL, completed_at = ?, updated_at = ?`,
      [
        input.providerId.slice(0, 100),
        input.modelId.slice(0, 100),
        input.providerRequestId?.slice(0, 200) ?? null,
        input.sourcePacketSha256,
        JSON.stringify(input.content),
        input.now,
        input.now,
      ],
    );
  }

  completeFailed(
    input: Readonly<{
      sessionId: string;
      attemptCount: number;
      attemptToken: string;
      failureCode: ReconstructionFailureCode;
      failureMessage: string;
      sourcePacketSha256?: string;
      providerId?: string;
      modelId?: string;
      providerRequestId?: string;
      now: string;
    }>,
  ) {
    return this.complete(
      input.sessionId,
      input.attemptCount,
      input.attemptToken,
      `status = 'FAILED', provider_id = ?, model_id = ?,
       provider_request_id = ?, source_packet_sha256 = ?, content_json = NULL,
       failure_code = ?, failure_message = ?, completed_at = ?, updated_at = ?`,
      [
        input.providerId?.slice(0, 100) ?? null,
        input.modelId?.slice(0, 100) ?? null,
        input.providerRequestId?.slice(0, 200) ?? null,
        input.sourcePacketSha256 ?? null,
        input.failureCode,
        input.failureMessage.slice(0, 500),
        input.now,
        input.now,
      ],
    );
  }

  private reclaim(
    sessionId: string,
    predicate: string,
    predicateValues: readonly unknown[],
    attemptToken: string,
    now: string,
  ) {
    return this.withDatabase((database) => {
      const transaction = database.transaction(() => {
        const result = database
          .prepare(
            `UPDATE evidence_reconstructions SET
              status = 'PENDING', attempt_count = attempt_count + 1,
              attempt_token = ?, attempt_started_at = ?, completed_at = NULL,
              failure_code = NULL, failure_message = NULL, updated_at = ?
            WHERE session_id = ? AND ${predicate}`,
          )
          .run(attemptToken, now, now, sessionId, ...predicateValues);
        return {
          claimed: result.changes === 1,
          record: this.requireRecord(database, sessionId),
        };
      });
      return transaction.immediate();
    });
  }

  private complete(
    sessionId: string,
    attemptCount: number,
    attemptToken: string,
    assignments: string,
    values: readonly unknown[],
  ) {
    return this.withDatabase((database) => {
      const result = database
        .prepare(
          `UPDATE evidence_reconstructions SET ${assignments}
           WHERE session_id = ? AND status = 'PENDING'
             AND attempt_count = ? AND attempt_token = ?`,
        )
        .run(...values, sessionId, attemptCount, attemptToken);
      return {
        completed: result.changes === 1,
        record: this.requireRecord(database, sessionId),
      };
    });
  }

  private find(database: Database.Database, sessionId: string) {
    const row = database
      .prepare('SELECT * FROM evidence_reconstructions WHERE session_id = ?')
      .get(sessionId) as ReconstructionRow | undefined;
    return row ? toRecord(row) : null;
  }

  private requireRecord(database: Database.Database, sessionId: string) {
    const record = this.find(database, sessionId);
    if (!record) throw new Error('The reconstruction row was not found.');
    return record;
  }

  private withDatabase<T>(operation: (database: Database.Database) => T): T {
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
