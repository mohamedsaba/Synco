import pytest
from app import app
from inventory.service import get_stock, update_stock

def test_storefront_reflects_current_inventory(client):
    """
    Verifies that the storefront endpoint returns the current inventory quantity
    for an existing item in the catalog.
    """
    res = client.get("/storefront/stock/WH-EAST-01/PROD-1001")
    assert res.status_code == 200
    data = res.get_json()
    assert data["quantity"] == 150, f"Expected 150 units, got {data['quantity']}"

def test_restock_updates_storefront_immediately(client):
    """
    Verifies that after restocking an item, subsequent storefront reads
    reflect the updated inventory without returning stale counts.
    """
    wh = "WH-WEST-02"
    prod = "PROD-2002"

    # Initial restock to establish stock
    update_stock(wh, prod, 20)
    res1 = client.get(f"/storefront/stock/{wh}/{prod}")
    assert res1.get_json()["quantity"] == 20

    # Secondary restock
    update_stock(wh, prod, 75)
    res2 = client.get(f"/storefront/stock/{wh}/{prod}")
    assert res2.get_json()["quantity"] == 75, f"Expected 75 units, got {res2.get_json()['quantity']}"

def test_storefront_stock_for_valid_warehouse_requests(client):
    """
    Verifies that storefront inventory remains consistent for valid
    warehouse requests following stock updates.
    """
    wh_write = "WH_CENTRAL_03"
    wh_read = "WH-CENTRAL-03"
    prod = "PROD-3003"

    update_stock(wh_write, prod, 10)
    res1 = client.get(f"/storefront/stock/{wh_read}/{prod}")
    assert res1.get_json()["quantity"] == 10

    update_stock(wh_write, prod, 40)
    res2 = client.get(f"/storefront/stock/{wh_read}/{prod}")
    assert res2.get_json()["quantity"] == 40, f"Expected 40 units after restock, got {res2.get_json()['quantity']}"
