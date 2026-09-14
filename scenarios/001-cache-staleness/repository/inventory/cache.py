import os
import redis

REDIS_HOST = os.getenv("REDIS_HOST", "127.0.0.1")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
DEFAULT_TTL = 3600  # 1 hour

def get_redis_client():
    return redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

def normalize_storefront_warehouse(warehouse_id: str) -> str:
    return warehouse_id.strip().lower().replace("_", "-")

def normalize_warehouse_id(warehouse_id: str) -> str:
    return warehouse_id.strip().lower().replace("-", "_")

def make_storefront_cache_key(warehouse_id: str, product_id: str) -> str:
    norm_wh = normalize_storefront_warehouse(warehouse_id)
    return f"stock:{norm_wh}:{product_id}"

def make_restock_cache_key(warehouse_id: str, product_id: str) -> str:
    norm_wh = normalize_warehouse_id(warehouse_id)
    return f"stock:{norm_wh}:{product_id}"

def get_cached_stock(warehouse_id: str, product_id: str):
    client = get_redis_client()
    key = make_storefront_cache_key(warehouse_id, product_id)
    val = client.get(key)
    if val is not None:
        return int(val)
    return None

def set_cached_stock(warehouse_id: str, product_id: str, quantity: int, ttl: int = DEFAULT_TTL):
    client = get_redis_client()
    key = make_storefront_cache_key(warehouse_id, product_id)
    client.set(key, str(quantity), ex=ttl)

def invalidate_cached_stock(warehouse_id: str, product_id: str):
    client = get_redis_client()
    key = make_restock_cache_key(warehouse_id, product_id)
    client.delete(key)
