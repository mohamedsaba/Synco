import { buildEvaluatorReviewPresentation } from '../../apps/web/src/evaluator/evaluator-review-presentation';
import { buildReconstructionView } from '../../apps/web/src/reconstruction/evidence-reconstruction-runtime';
import Database from 'better-sqlite3';
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { SqliteEventStore } from '../../apps/web/src/events/sqlite-event-store';
import { DockerSandboxAdapter } from '../../apps/web/src/sandbox/docker-sandbox-adapter';
import { SessionService } from '../../apps/web/src/sessions/session-service';
import { SqliteSessionStore } from '../../apps/web/src/sessions/sqlite-session-store';
import { EvidenceReconstructionService } from '../../apps/web/src/reconstruction/evidence-reconstruction-service';
import { SqliteEvidenceReconstructionStore } from '../../apps/web/src/reconstruction/sqlite-evidence-reconstruction-store';
import { DeterministicEvidenceReconstructionGenerator } from '../../apps/web/src/reconstruction/deterministic-evidence-reconstruction-generator';
import {
  applyCompleteFix,
  resetAndVerify,
} from './nvidia-nim-acceptance-fixtures';

// Write-through uses the existing cache normalization helper, never the broken
// restock-key invalidator. PostgreSQL commits before the cache is updated.
const alternative = `from inventory.db import query_one, execute
from inventory.cache import get_cached_stock, set_cached_stock, normalize_storefront_warehouse

def get_stock(warehouse_id: str, product_id: str) -> int:
    warehouse_id = normalize_storefront_warehouse(warehouse_id).upper()
    cached = get_cached_stock(warehouse_id, product_id)
    if cached is not None:
        return cached
    row = query_one(
        "SELECT quantity FROM inventory WHERE warehouse_id = %s AND product_id = %s",
        (warehouse_id, product_id)
    )
    if not row:
        return 0
    quantity = int(row["quantity"])
    set_cached_stock(warehouse_id, product_id, quantity)
    return quantity

def update_stock(warehouse_id: str, product_id: str, new_quantity: int) -> None:
    warehouse_id = normalize_storefront_warehouse(warehouse_id).upper()
    execute(
        """
        INSERT INTO inventory (warehouse_id, product_id, quantity, updated_at)
        VALUES (%s, %s, %s, NOW())
        ON CONFLICT (warehouse_id, product_id)
        DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = EXCLUDED.updated_at
        """,
        (warehouse_id, product_id, new_quantity)
    )
    set_cached_stock(warehouse_id, product_id, new_quantity)
`;

class GapSandbox extends DockerSandboxAdapter {
  failNextDiff = false;
  override async captureTreeDiff(
    sessionId: string,
    before: string,
    after: string,
  ) {
    if (this.failNextDiff) {
      this.failNextDiff = false;
      throw new Error(
        'Validation fixture: injected workspace diff capture outage',
      );
    }
    return super.captureTreeDiff(sessionId, before, after);
  }
}

const enabled = process.env.HIREARCHY_GATE_FIXTURES === '1';
describe.skipIf(!enabled)('real evaluator gate fixture capture', () => {
  it('captures only missing A/D/F/G and manifests existing B/C/E without relabeling', async () => {
    const directory =
      process.env.HIREARCHY_GATE_OUTPUT ?? '/tmp/hirearchy-evaluator-gate';
    mkdirSync(directory, { recursive: true });
    const dbPath = path.join(directory, 'gate.sqlite');
    copyFileSync(
      '/tmp/hirearchy-deterministic-acceptance/acceptance.sqlite',
      dbPath,
    );
    const sandbox = new GapSandbox();
    const sessions = new SessionService(new SqliteSessionStore(dbPath), {
      eventStore: new SqliteEventStore(dbPath),
      sandboxAdapter: sandbox,
    });
    const reconstructions = new EvidenceReconstructionService(
      new SqliteEvidenceReconstructionStore(dbPath),
      new DeterministicEvidenceReconstructionGenerator(),
      (id) => sessions.getSubmittedEvidence(id),
    );
    const existing = JSON.parse(
      readFileSync(
        '/tmp/hirearchy-deterministic-acceptance/results.json',
        'utf8',
      ),
    ) as { label: string; sessionId: string }[];
    const existingId = (label: string) => {
      const result = existing.find((entry) => entry.label === label);
      if (!result) throw new Error(`Missing prerequisite acceptance ${label}`);
      return result.sessionId;
    };
    const ids: Record<string, string> = {
      B: existingId('C'),
      C: existingId('B'),
      E: existingId('D'),
    };
    for (const caseId of ['D', 'A', 'F', 'G']) {
      const created = sessions.createSession({
        scenarioId: 'scenario-001-cache-staleness',
      });
      ids[caseId] = created.session.id;
      try {
        await sessions.activate(created.candidateToken);
        if (caseId === 'D') {
          await sessions.saveWorkspaceFile(
            created.candidateToken,
            'inventory/service.py',
            alternative,
          );
          const result = await resetAndVerify(sessions, created.candidateToken);
          expect(result.exitCode).toBe(0);
          expect(result.stdoutPreview).toContain('3 passed');
          // Additional real checks: aliases, repeated writes, product isolation,
          // zero quantities, cache value, committed DB value, missing inventory.
          const review = await sessions.executeCommand(
            created.candidateToken,
            `python3 -c 'from inventory.service import get_stock, update_stock; from inventory.cache import get_cached_stock; from inventory.db import query_one; update_stock("  wh_gate_01  ", "GATE-A", 17); assert get_stock("WH-GATE-01", "GATE-A") == 17; update_stock("wh-gate-01", "GATE-A", 0); assert get_stock("WH_GATE_01", "GATE-A") == 0; assert get_cached_stock("WH-GATE-01", "GATE-A") == 0; update_stock("WH-GATE-01", "GATE-B", 29); assert get_stock("WH-GATE-01", "GATE-A") == 0; assert get_stock("WH-GATE-01", "GATE-B") == 29; assert get_stock("WH-GATE-01", "MISSING") == 0; assert query_one("SELECT quantity FROM inventory WHERE warehouse_id = %s AND product_id = %s", ("WH-GATE-01", "GATE-B"))["quantity"] == 29; print("Additional invariant checks passed")'`,
          );
          expect(review.exitCode).toBe(0);
          expect(
            (await sessions.executeCommand(created.candidateToken, 'pytest'))
              .exitCode,
          ).toBe(0);
        } else if (caseId === 'A') {
          await applyCompleteFix(sessions, created.candidateToken);
          expect(
            (await resetAndVerify(sessions, created.candidateToken)).exitCode,
          ).toBe(0);
        } else {
          await sessions.executeCommand(created.candidateToken, 'pwd');
          if (caseId === 'F') sandbox.failNextDiff = true;
          await sessions.executeCommand(
            created.candidateToken,
            'echo "# evaluator gate fixture note" >> inventory/service.py',
          );
          await sessions.executeCommand(
            created.candidateToken,
            'cat inventory/service.py',
          );
        }
        await sessions.submit(created.candidateToken);
      } finally {
        await sandbox.teardown(created.session.id);
      }
      if (caseId === 'G') {
        // Recreate the pre-context storage schema, then exercise actual migration.
        const legacyPath = path.join(directory, 'legacy.sqlite');
        copyFileSync(dbPath, legacyPath);
        const legacy = new Database(legacyPath);
        legacy.exec(
          'ALTER TABLE assessment_sessions DROP COLUMN scenario_evaluation_context',
        );
        legacy.close();
        const migrated = new SessionService(
          new SqliteSessionStore(legacyPath),
          { eventStore: new SqliteEventStore(legacyPath) },
        );
        expect(
          migrated.getSubmittedEvidence(ids.G).scenario.evaluationContext,
        ).toBeUndefined();
        const modern = new Database(dbPath);
        modern
          .prepare(
            'UPDATE assessment_sessions SET scenario_evaluation_context = NULL WHERE id = ?',
          )
          .run(ids.G);
        modern.close();
      }
    }
    const manifest = [];
    for (const caseId of ['A', 'B', 'C', 'D', 'E', 'F', 'G']) {
      const evidence = sessions.getSubmittedEvidence(ids[caseId]);
      const record = await reconstructions.ensure(ids[caseId]);
      expect(record.status).toBe('AVAILABLE');
      const review = buildEvaluatorReviewPresentation(
        evidence,
        buildReconstructionView(
          new SqliteEvidenceReconstructionStore(dbPath),
          ids[caseId],
        ),
      );
      expect(review.submittedDiff).toBe(evidence.diff);
      expect(review.summary.status).toBe('available');
      expect(
        review.summary.milestones.every((m) =>
          m.evidenceRefs.every((ref) =>
            review.evidenceEntries.some((e) => e.evidenceRef === ref),
          ),
        ),
      ).toBe(true);
      const tests = evidence.events
        .filter(
          (e) =>
            e.type === 'COMMAND_FINISHED' &&
            String(
              (e.payload as { stdoutPreview?: string }).stdoutPreview,
            ).includes('test session starts'),
        )
        .map(
          (e) =>
            String(
              (e.payload as { stdoutPreview?: string }).stdoutPreview,
            ).match(
              /^=+ (\d+ (?:passed|failed)(?:, \d+ (?:passed|failed))?) in .* =+$/m,
            )?.[1],
        );
      if (caseId === 'C') expect(tests).toEqual(['3 failed', '3 failed']);
      if (caseId === 'F')
        expect(
          evidence.events.some((e) => e.type === 'WORKSPACE_CAPTURE_FAILED'),
        ).toBe(true);
      if (['A', 'D', 'F', 'G'].includes(caseId))
        writeFileSync(
          path.join(directory, `${caseId}.json`),
          JSON.stringify(
            {
              caseId,
              evidence,
              record,
              sessionRow: (() => {
                const db = new Database(dbPath, { readonly: true });
                try {
                  return db
                    .prepare('SELECT * FROM assessment_sessions WHERE id = ?')
                    .get(evidence.sessionId);
                } finally {
                  db.close();
                }
              })(),
            },
            null,
            2,
          ),
        );
      manifest.push({
        caseId,
        sessionId: ids[caseId],
        source: (
          {
            A: 'evaluator-gate-fixtures.test.ts: applyCompleteFix/resetAndVerify',
            B: 'scenario-acceptance-histories.ts: C',
            C: 'scenario-acceptance-histories.ts: B',
            D: 'evaluator-gate-fixtures.test.ts: write-through alternative',
            E: 'scenario-acceptance-histories.ts: D',
            F: 'evaluator-gate-fixtures.test.ts: injected adapter outage',
            G: 'evaluator-gate-fixtures.test.ts: legacy schema migration',
          } as Record<string, string>
        )[caseId],
        authoritativeEvents: evidence.events.map((e) => ({
          sequence: e.sequence,
          id: e.id,
          type: e.type,
        })),
        submittedDiffSha256: createHash('sha256')
          .update(evidence.diff)
          .digest('hex'),
        generatorVersion: record.promptVersion,
        testSummaries: tests,
        expectedSections: [
          'What this scenario examines',
          'What happened',
          'Submitted changes',
          'Recorded activity',
        ],
        limitations:
          caseId === 'F'
            ? [
                'Explicit test adapter outage; intermediate workspace capture incomplete; no task fix',
              ]
            : caseId === 'G'
              ? ['Legacy context intentionally absent; no task fix']
              : caseId === 'D'
                ? [
                    'Write-through assumes available Redis and serial operations; concurrent stale refill and external DB writers not validated',
                  ]
                : caseId === 'C'
                  ? [
                      'No test-count improvement; partial invalidation remains unresolved',
                    ]
                  : ['A', 'B', 'E'].includes(caseId)
                    ? [
                        'Final passing verification follows the existing explicit Redis reset/reseed helper; it does not establish a hiring verdict.',
                      ]
                    : [],
      });
    }
    writeFileSync(
      path.join(directory, 'manifest.json'),
      JSON.stringify(manifest, null, 2),
    );
  }, 600_000);
});
