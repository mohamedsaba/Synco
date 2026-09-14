from flask import Flask, jsonify, request
from inventory.service import get_stock, update_stock

app = Flask(__name__)

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy"}), 200

@app.route("/storefront/stock/<warehouse_id>/<product_id>", methods=["GET"])
def storefront_stock(warehouse_id: str, product_id: str):
    quantity = get_stock(warehouse_id, product_id)
    return jsonify({
        "warehouse_id": warehouse_id,
        "product_id": product_id,
        "quantity": quantity
    }), 200

@app.route("/admin/restock", methods=["POST"])
def admin_restock():
    data = request.get_json() or {}
    warehouse_id = data.get("warehouse_id")
    product_id = data.get("product_id")
    quantity = data.get("quantity")

    if not warehouse_id or not product_id or quantity is None:
        return jsonify({"error": "Missing required fields"}), 400

    update_stock(warehouse_id, product_id, int(quantity))
    return jsonify({
        "status": "success",
        "warehouse_id": warehouse_id,
        "product_id": product_id,
        "quantity": quantity
    }), 200

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8000)
