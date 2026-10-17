from flask import Flask, request, jsonify
from sklearn.linear_model import LinearRegression
import numpy as np

app = Flask(__name__)

# Demo training data: daily sales, supplier lead time
X = np.array([
    [5, 2], [10, 3], [15, 4], [20, 5],
    [25, 3], [30, 4], [35, 6], [40, 5]
])

# Synthetic target: demand during lead time
y = X[:, 0] * X[:, 1]

model = LinearRegression()
model.fit(X, y)


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/predict")
def predict():
    data = request.get_json()

    try:
        sales = float(data["daily_sales"])
        lead = int(data["lead_time"])
        stock = int(data["current_stock"])
    except (KeyError, TypeError, ValueError):
        return jsonify({"error": "Invalid input"}), 400

    if sales < 0 or lead < 1 or stock < 0:
        return jsonify({"error": "Invalid values"}), 400

    demand = max(
        0, round(float(model.predict([[sales, lead]])[0]))
    )

    safety_stock = round(sales * 2)
    reorder_point = demand + safety_stock
    reorder_qty = max(0, reorder_point - stock)

    status = (
        "URGENT" if stock <= demand
        else "REORDER" if stock <= reorder_point
        else "SUFFICIENT"
    )

    return jsonify({
        "predicted_demand": demand,
        "safety_stock": safety_stock,
        "reorder_point": reorder_point,
        "reorder_quantity": reorder_qty,
        "status": status
    })


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)