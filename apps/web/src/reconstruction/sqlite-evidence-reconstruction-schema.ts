import Database from 'better-sqlite3';

const schema = `
  CREATE TABLE IF NOT EXISTS evidence_reconstructions (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
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
    updated_at TEXT NOT NULL,
    UNIQUE(session_id, prompt_version)
  );
`;

export const ensureVersionedReconstructionSchema = (
  database: Database.Database,
) => {
  const migrate = database.transaction(() => {
    const existing = database
      .prepare(
        `SELECT sql FROM sqlite_master
         WHERE type = 'table' AND name = 'evidence_reconstructions'`,
      )
      .get() as { sql: string } | undefined;
    if (!existing) {
      database.exec(schema);
      return;
    }
    if (!existing.sql.includes('session_id TEXT NOT NULL UNIQUE')) return;

    database.exec(
      'ALTER TABLE evidence_reconstructions RENAME TO evidence_reconstructions_single_version',
    );
    database.exec(schema);
    database.exec(
      `INSERT INTO evidence_reconstructions
       SELECT * FROM evidence_reconstructions_single_version`,
    );
    database.exec('DROP TABLE evidence_reconstructions_single_version');
  });
  migrate.immediate();
};
