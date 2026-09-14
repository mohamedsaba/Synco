import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

import { SqliteEventStore } from '../../apps/web/src/events/sqlite-event-store';
import { DockerSandboxAdapter } from '../../apps/web/src/sandbox/docker-sandbox-adapter';
import { scenario001 } from '../../apps/web/src/scenarios/scenario-001';
import { SessionService } from '../../apps/web/src/sessions/session-service';
import { SqliteSessionStore } from '../../apps/web/src/sessions/sqlite-session-store';

describe('Scenario 001 Integration & Lifecycle', () => {
  it('runs full Scenario 001 incident lifecycle: seed verification, reproduction, fix, verification, and diff capture', async () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), 'delimit-scenario001-'));
    const dbPath = path.join(tempDir, 'test.sqlite');
    const store = new SqliteSessionStore(dbPath);
    const eventStore = new SqliteEventStore(dbPath);
    const sandbox = new DockerSandboxAdapter({ defaultTimeoutMs: 30_000 });
    const service = new SessionService(store, {
      eventStore,
      sandboxAdapter: sandbox,
    });
    let candidateToken = '';
    let sessionId = '';
    let containerName = '';

    try {
      // 1. Create session with Scenario 001
      const created = service.createSession({ scenarioId: scenario001.id });
      candidateToken = created.candidateToken;
      sessionId = created.session.id;
      containerName = sandbox.getContainerName(sessionId);

      expect(created.session.status).toBe('CREATED');
      expect(created.session.scenario.id).toBe('scenario-001-cache-staleness');
      expect(created.session.scenarioType).toBe('multi_file');

      // 2. Activate session (readiness gate for multi-service container)
      const active = await service.activate(candidateToken);
      expect(active.status).toBe('ACTIVE');
      expect(active.activatedAt).toBeDefined();

      // Verify container is running
      const inspect = spawnSync('docker', [
        'inspect',
        '-f',
        '{{.State.Running}}',
        containerName,
      ]);
      expect(inspect.stdout.toString().trim()).toBe('true');

      // 3. Inspect multi-file workspace via adapter
      const files = await service.listWorkspaceFiles(candidateToken);
      const paths = files.map((f) => f.path);
      expect(paths).toContain('app.py');
      expect(paths).toContain('inventory/service.py');
      expect(paths).toContain('inventory/cache.py');
      expect(paths).toContain('inventory/db.py');
      expect(paths).toContain('tests/test_inventory.py');

      // 4. Verify seed data state in live services
      // PostgreSQL has quantity = 150
      const dbCheck = await service.executeCommand(
        candidateToken,
        "psql -h 127.0.0.1 -U delimit -d inventory -t -A -c \"SELECT quantity FROM inventory WHERE warehouse_id='WH-EAST-01' AND product_id='PROD-1001';\"",
      );
      expect(dbCheck.exitCode).toBe(0);
      expect(dbCheck.stdoutPreview.trim()).toBe('150');

      // Redis has quantity = 0 (stale cache from before restock)
      const redisCheck = await service.executeCommand(
        candidateToken,
        'redis-cli get "stock:wh-east-01:PROD-1001"',
      );
      expect(redisCheck.exitCode).toBe(0);
      expect(redisCheck.stdoutPreview.trim()).toBe('0');

      // 5. Run pytest: reproducing the baseline stale cache failure
      const baselinePytest = await service.executeCommand(
        candidateToken,
        'pytest',
      );
      expect(baselinePytest.exitCode).not.toBe(0);
      expect(baselinePytest.stdoutPreview).toContain('FAILED');

      // 6. SIMULATION A (Shallow mitigation):
      // Candidate flushes the stale Redis key once without code fixes
      await service.executeCommand(
        candidateToken,
        'redis-cli del "stock:wh-east-01:PROD-1001"',
      );
      const shallowPytest = await service.executeCommand(
        candidateToken,
        'pytest',
      );
      // test_storefront_reflects_current_inventory passes, but restock tests still fail
      expect(shallowPytest.exitCode).not.toBe(0);
      expect(shallowPytest.stdoutPreview).toContain(
        'FAILED tests/test_inventory.py::test_restock_updates_storefront_immediately',
      );

      // 7. SIMULATION B (Invalidation-only fix):
      // Candidate adds cache invalidation in update_stock, but leaves cache key normalization inconsistent
      const originalServiceContent = await service.readWorkspaceFile(
        candidateToken,
        'inventory/service.py',
      );
      const invalidationOnlyService = originalServiceContent.replace(
        '(warehouse_id, product_id, new_quantity)\n    )',
        '(warehouse_id, product_id, new_quantity)\n    )\n    invalidate_cached_stock(warehouse_id, product_id)',
      );
      await service.saveWorkspaceFile(
        candidateToken,
        'inventory/service.py',
        invalidationOnlyService,
      );

      const invalidationPytest = await service.executeCommand(
        candidateToken,
        'pytest',
      );
      // Fails because invalidate_cached_stock uses make_restock_cache_key (underscores)
      // while storefront reads make_storefront_cache_key (hyphens)
      expect(invalidationPytest.exitCode).not.toBe(0);
      expect(invalidationPytest.stdoutPreview).toContain(
        'FAILED tests/test_inventory.py::test_restock_updates_storefront_immediately',
      );

      // 8. SIMULATION C (Complete behavioral fix):
      // Candidate resolves both stale caching and identifier normalization
      const fixedServiceContent = `from inventory.db import query_one, execute
from inventory.cache import get_cached_stock, set_cached_stock, invalidate_cached_stock

def normalize_warehouse(warehouse_id: str) -> str:
    return warehouse_id.strip().upper().replace("_", "-")

def get_stock(warehouse_id: str, product_id: str) -> int:
    norm_wh = normalize_warehouse(warehouse_id)
    # 1. Check storefront cache
    cached = get_cached_stock(norm_wh, product_id)
    if cached is not None:
        return cached

    # 2. Cache miss -> query authoritative database
    row = query_one(
        "SELECT quantity FROM inventory WHERE warehouse_id = %s AND product_id = %s",
        (norm_wh, product_id)
    )
    if not row:
        return 0

    quantity = int(row["quantity"])
    # 3. Cache for subsequent reads
    set_cached_stock(norm_wh, product_id, quantity)
    return quantity

def update_stock(warehouse_id: str, product_id: str, new_quantity: int) -> None:
    norm_wh = normalize_warehouse(warehouse_id)
    # Update authoritative database record
    execute(
        """
        INSERT INTO inventory (warehouse_id, product_id, quantity, updated_at)
        VALUES (%s, %s, %s, NOW())
        ON CONFLICT (warehouse_id, product_id)
        DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = EXCLUDED.updated_at
        """,
        (norm_wh, product_id, new_quantity)
    )
    invalidate_cached_stock(norm_wh, product_id)
`;
      await service.saveWorkspaceFile(
        candidateToken,
        'inventory/service.py',
        fixedServiceContent,
      );

      const originalCacheContent = await service.readWorkspaceFile(
        candidateToken,
        'inventory/cache.py',
      );
      const fixedCacheContent = originalCacheContent.replace(
        'key = make_restock_cache_key(warehouse_id, product_id)',
        'key = make_storefront_cache_key(warehouse_id, product_id)',
      );
      await service.saveWorkspaceFile(
        candidateToken,
        'inventory/cache.py',
        fixedCacheContent,
      );

      // Flush leftover test keys before final verification
      await service.executeCommand(candidateToken, 'redis-cli flushall');
      // Re-seed the initial DB inventory state for PROD-1001
      await service.executeCommand(
        candidateToken,
        'python3 /workspace/scripts/seed_data.py',
      );
      // And clear the seeded stale key
      await service.executeCommand(
        candidateToken,
        'redis-cli del "stock:wh-east-01:PROD-1001"',
      );

      // Re-run pytest: all behavioral tests now pass
      const completePytest = await service.executeCommand(
        candidateToken,
        'pytest',
      );
      expect(completePytest.exitCode).toBe(0);
      expect(completePytest.stdoutPreview).toContain('3 passed');

      // 9. Submit session
      const submitted = await service.submit(candidateToken);
      expect(submitted.status).toBe('SUBMITTED');

      // 10. Verify container was torn down deterministically
      const postInspect = spawnSync('docker', ['inspect', containerName]);
      expect(postInspect.status).not.toBe(0);

      // 11. Verify evaluator evidence has multi-file diff and events
      const evidence = service.getSubmittedEvidence(sessionId);
      expect(evidence.diff).toContain(
        'diff --git a/inventory/service.py b/inventory/service.py',
      );
      expect(evidence.diff).toContain(
        '+    invalidate_cached_stock(norm_wh, product_id)',
      );
      expect(evidence.diff).toContain(
        'diff --git a/inventory/cache.py b/inventory/cache.py',
      );
      expect(evidence.events.length).toBeGreaterThan(0);
    } finally {
      if (sessionId) {
        await sandbox.teardown(sessionId).catch(() => {});
      }
      rmSync(tempDir, { recursive: true, force: true });
    }
  }, 60_000);
});
