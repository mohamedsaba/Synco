from inventory.db import query_one, execute
from inventory.cache import get_cached_stock, set_cached_stock, invalidate_cached_stock

def get_stock(warehouse_id: str, product_id: str) -> int:
    # 1. Check storefront cache
    cached = get_cached_stock(warehouse_id, product_id)
    if cached is not None:
        return cached

    # 2. Cache miss -> query authoritative database
    row = query_one(
        "SELECT quantity FROM inventory WHERE warehouse_id = %s AND product_id = %s",
        (warehouse_id, product_id)
    )
    if not row:
        return 0

    quantity = int(row["quantity"])
    # 3. Cache for subsequent reads
    set_cached_stock(warehouse_id, product_id, quantity)
    return quantity

def update_stock(warehouse_id: str, product_id: str, new_quantity: int) -> None:
    # Update authoritative database record
    execute(
        """
        INSERT INTO inventory (warehouse_id, product_id, quantity, updated_at)
        VALUES (%s, %s, %s, NOW())
        ON CONFLICT (warehouse_id, product_id)
        DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = EXCLUDED.updated_at
        """,
        (warehouse_id, product_id, new_quantity)
    )
