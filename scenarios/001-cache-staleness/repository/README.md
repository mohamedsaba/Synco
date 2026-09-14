# Storefront Inventory Service

This repository contains the inventory and storefront service for product stock tracking.

## Architecture

- **Web Framework:** Flask application (`app.py`).
- **Database:** PostgreSQL storing authoritative product inventory (`inventory/db.py`).
- **Cache:** Redis caching frequent storefront stock lookups (`inventory/cache.py`).
- **Core Logic:** Inventory read and write handlers (`inventory/service.py`).

## Endpoints

- `GET /health` — Service health check.
- `GET /storefront/stock/<warehouse_id>/<product_id>` — Returns current storefront stock level.
- `POST /admin/restock` — JSON payload `{"warehouse_id": "...", "product_id": "...", "quantity": ...}`.

## Available Tools & Commands

- Run test suite:
  ```sh
  pytest
  ```
- Run a specific test:
  ```sh
  pytest tests/test_inventory.py
  ```
- Inspect PostgreSQL database:
  ```sh
  psql -h 127.0.0.1 -p 5432 -U delimit -d inventory
  # Or run a single query:
  psql -h 127.0.0.1 -p 5432 -U delimit -d inventory -c "SELECT * FROM inventory;"
  ```
- Inspect Redis:
  ```sh
  redis-cli ping
  redis-cli keys "*"
  ```
