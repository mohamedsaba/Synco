import os
import psycopg2
import redis

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_NAME = os.getenv("DB_NAME", "inventory")
DB_USER = os.getenv("DB_USER", "delimit")
DB_PASS = os.getenv("DB_PASS", "")

REDIS_HOST = os.getenv("REDIS_HOST", "127.0.0.1")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))

def init_db():
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS
    )
    with conn.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS inventory (
                warehouse_id TEXT NOT NULL,
                product_id TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                PRIMARY KEY (warehouse_id, product_id)
            );
        """)
        # Seed record: Product PROD-1001 was restocked with 150 units in WH-EAST-01
        cur.execute("""
            INSERT INTO inventory (warehouse_id, product_id, quantity, updated_at)
            VALUES ('WH-EAST-01', 'PROD-1001', 150, NOW())
            ON CONFLICT (warehouse_id, product_id)
            DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = NOW();
        """)
    conn.commit()
    conn.close()
    print("PostgreSQL initialized and seeded: WH-EAST-01 PROD-1001 quantity=150")

def init_redis():
    client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
    # Pre-restock state: storefront previously cached product as 0 (out of stock)
    client.set("stock:wh-east-01:PROD-1001", "0", ex=3600)
    print("Redis seeded: stock:wh-east-01:PROD-1001 -> 0")

if __name__ == "__main__":
    init_db()
    init_redis()
