import type { SessionService } from '../../apps/web/src/sessions/session-service';

export const completeServiceContent = `from inventory.db import query_one, execute
from inventory.cache import get_cached_stock, set_cached_stock, invalidate_cached_stock

def normalize_warehouse(warehouse_id: str) -> str:
    return warehouse_id.strip().upper().replace("_", "-")

def get_stock(warehouse_id: str, product_id: str) -> int:
    norm_wh = normalize_warehouse(warehouse_id)
    cached = get_cached_stock(norm_wh, product_id)
    if cached is not None:
        return cached
    row = query_one(
        "SELECT quantity FROM inventory WHERE warehouse_id = %s AND product_id = %s",
        (norm_wh, product_id)
    )
    if not row:
        return 0
    quantity = int(row["quantity"])
    set_cached_stock(norm_wh, product_id, quantity)
    return quantity

def update_stock(warehouse_id: str, product_id: str, new_quantity: int) -> None:
    norm_wh = normalize_warehouse(warehouse_id)
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

export const applyPartialFix = async (
  service: SessionService,
  candidateToken: string,
) => {
  const original = await service.readWorkspaceFile(
    candidateToken,
    'inventory/service.py',
  );
  const partial = original.replace(
    '(warehouse_id, product_id, new_quantity)\n    )',
    '(warehouse_id, product_id, new_quantity)\n    )\n    invalidate_cached_stock(warehouse_id, product_id)',
  );
  await service.saveWorkspaceFile(
    candidateToken,
    'inventory/service.py',
    partial,
  );
  return original;
};

export const applyCompleteFix = async (
  service: SessionService,
  candidateToken: string,
) => {
  await service.saveWorkspaceFile(
    candidateToken,
    'inventory/service.py',
    completeServiceContent,
  );
  const cache = await service.readWorkspaceFile(
    candidateToken,
    'inventory/cache.py',
  );
  await service.saveWorkspaceFile(
    candidateToken,
    'inventory/cache.py',
    cache.replace(
      'key = make_restock_cache_key(warehouse_id, product_id)',
      'key = make_storefront_cache_key(warehouse_id, product_id)',
    ),
  );
};

export const resetAndVerify = async (
  service: SessionService,
  candidateToken: string,
) => {
  await service.executeCommand(candidateToken, 'redis-cli flushall');
  await service.executeCommand(
    candidateToken,
    'python3 /workspace/scripts/seed_data.py',
  );
  await service.executeCommand(
    candidateToken,
    'redis-cli del "stock:wh-east-01:PROD-1001"',
  );
  return service.executeCommand(candidateToken, 'pytest');
};
