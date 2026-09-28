import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  DeterministicEvidenceReconstructionGenerator,
  deterministicReconstructionVersion,
} from '../../apps/web/src/reconstruction/deterministic-evidence-reconstruction-generator';
import { buildReconstructionView } from '../../apps/web/src/reconstruction/evidence-reconstruction-runtime';
import { EvidenceReconstructionService } from '../../apps/web/src/reconstruction/evidence-reconstruction-service';
import { SqliteEvidenceReconstructionStore } from '../../apps/web/src/reconstruction/sqlite-evidence-reconstruction-store';

const sessionId = 'legacy-session';
const legacyContent = JSON.stringify({
  schemaVersion: 1,
  statements: [
    {
      id: 'stmt_001',
      text: 'Legacy unsupported prose.',
      claimBasis: 'chronology',
      evidenceRefs: [`session:${sessionId}:submitted`],
      firstEvidenceOrder: 0,
    },
  ],
});

const createLegacyDatabase = (databasePath: string) => {
  const database = new Database(databasePath);
  database.exec(`CREATE TABLE evidence_reconstructions (
    id TEXT PRIMARY KEY, session_id TEXT NOT NULL UNIQUE, status TEXT NOT NULL,
    schema_version INTEGER NOT NULL, prompt_version TEXT NOT NULL,
    packet_builder_version TEXT NOT NULL, provider_id TEXT, model_id TEXT,
    provider_request_id TEXT, source_first_sequence INTEGER,
    source_last_sequence INTEGER, source_event_count INTEGER NOT NULL,
    source_packet_sha256 TEXT, final_diff_sha256 TEXT NOT NULL,
    final_diff_bytes INTEGER NOT NULL, content_json TEXT, failure_code TEXT,
    failure_message TEXT, attempt_count INTEGER NOT NULL,
    attempt_token TEXT NOT NULL, created_at TEXT NOT NULL,
    attempt_started_at TEXT NOT NULL, completed_at TEXT, updated_at TEXT NOT NULL
  )`);
  database
    .prepare(
      `INSERT INTO evidence_reconstructions VALUES
       (?, ?, 'AVAILABLE', 1, 'legacy-ai-v1', 'packet-v1', 'nvidia',
        'legacy-model', NULL, NULL, NULL, 0, 'packet-digest', 'diff-digest',
        0, ?, NULL, NULL, 1, 'legacy-attempt', ?, ?, ?, ?)`,
    )
    .run(
      'legacy-record',
      sessionId,
      legacyContent,
      '2026-09-15T10:00:00.000Z',
      '2026-09-15T10:00:00.000Z',
      '2026-09-15T10:01:00.000Z',
      '2026-09-15T10:01:00.000Z',
    );
  database.close();
};

describe('legacy reconstruction upgrade', () => {
  let directory: string | undefined;

  afterEach(() => {
    if (directory) rmSync(directory, { recursive: true, force: true });
  });

  it('preserves the legacy artifact and creates a separate deterministic version', async () => {
    directory = mkdtempSync(path.join(tmpdir(), 'hirearchy-upgrade-'));
    const databasePath = path.join(directory, 'hirearchy.sqlite');
    createLegacyDatabase(databasePath);
    const store = new SqliteEvidenceReconstructionStore(databasePath);

    expect(store.getAllBySessionId(sessionId)[0]).toMatchObject({
      id: 'legacy-record',
      promptVersion: 'legacy-ai-v1',
      content: JSON.parse(legacyContent),
    });
    const beforeUpgrade = buildReconstructionView(store, sessionId);
    expect(beforeUpgrade).toMatchObject({
      status: 'NOT_STARTED',
      record: null,
      legacyArtifacts: [expect.objectContaining({ id: 'legacy-record' })],
    });
    expect(JSON.stringify(beforeUpgrade)).not.toContain(
      'Legacy unsupported prose',
    );

    const service = new EvidenceReconstructionService(
      store,
      new DeterministicEvidenceReconstructionGenerator(),
      () => ({
        sessionId,
        scenario: { title: 'Scenario', brief: 'Brief', acceptanceCriteria: [] },
        activatedAt: null,
        submittedAt: '2026-09-15T10:02:00.000Z',
        diff: '',
        events: [],
      }),
      {
        createId: () => 'deterministic-record',
        createAttemptToken: () => 'deterministic-attempt',
      },
    );

    expect(await service.ensure(sessionId)).toMatchObject({
      status: 'AVAILABLE',
      promptVersion: deterministicReconstructionVersion,
    });
    expect(store.getAllBySessionId(sessionId)).toHaveLength(2);
    expect(store.getBySessionId(sessionId, 'legacy-ai-v1')?.content).toEqual(
      JSON.parse(legacyContent),
    );

    const apiView = buildReconstructionView(store, sessionId);
    expect(apiView.record?.promptVersion).toBe(
      deterministicReconstructionVersion,
    );
    expect(apiView.legacyArtifacts).toEqual([
      expect.objectContaining({
        id: 'legacy-record',
        promptVersion: 'legacy-ai-v1',
        providerId: 'nvidia',
      }),
    ]);
    expect(JSON.stringify(apiView)).not.toContain('Legacy unsupported prose');
  });
});
