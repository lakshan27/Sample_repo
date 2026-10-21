const STORAGE_KEY = "orderPriorityPlanner";

const form = document.getElementById("productForm");
const table = document.getElementById("products");
const message = document.getElementById("message");
const refreshBtn = document.getElementById("refreshBtn");


function getOrders() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}


function saveOrders(orders) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}


function predictOrder(order) {
  const predictedDemand = order.dailySales * order.leadTime;
  const reorderQuantity = Math.max(
    0,
    predictedDemand - order.currentStock
  );

  let priority;
  let status;

  if (order.currentStock <= 0) {
    priority = 1;
    status = "Critical";
  } else if (order.currentStock <= predictedDemand * 0.5) {
    priority = 1;
    status = "High";
  } else if (order.currentStock <= predictedDemand) {
    priority = 2;
    status = "Medium";
  } else {
    priority = 3;
    status = "Low";
  }

  return {
    predictedDemand,
    reorderQuantity,
    priority,
    status
  };
}


form.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const currentStock = Number(
    document.getElementById("stock").value
  );
  const dailySales = Number(
    document.getElementById("sales").value
  );
  const leadTime = Number(
    document.getElementById("lead").value
  );

  if (
    !name ||
    !Number.isFinite(currentStock) ||
    !Number.isFinite(dailySales) ||
    !Number.isFinite(leadTime) ||
    currentStock < 0 ||
    dailySales < 0 ||
    leadTime <= 0
  ) {
    message.textContent =
      "Enter a name, non-negative stock and sales, and a positive lead time.";
    return;
  }

  const orders = getOrders();

  const order = {
    id: crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`,
    name,
    orderDate: new Date().toLocaleDateString(),
    currentStock,
    dailySales,
    leadTime,
    createdAt: Date.now()
  };

  orders.push(order);
  saveOrders(orders);

  message.textContent = "Order added successfully!";
  form.reset();

  loadOrders();
});


function loadOrders() {
  table.replaceChildren();

  const orders = getOrders();

  orders.sort((a, b) => {
    const priorityA = predictOrder(a).priority;
    const priorityB = predictOrder(b).priority;

    return priorityA - priorityB ||
      a.createdAt - b.createdAt;
  });

  if (orders.length === 0) {
    const row = table.insertRow();
    const cell = row.insertCell();

    cell.colSpan = 7;
    cell.textContent = "No orders available.";
    return;
  }

  for (const order of orders) {
    const prediction = predictOrder(order);
    const row = table.insertRow();

    [
      order.name,
      order.orderDate,
      order.currentStock,
      order.dailySales,
      `${order.leadTime} days`,
      prediction.status
    ].forEach((value) => {
      row.insertCell().textContent = value;
    });

    const actionCell = row.insertCell();

    const predictButton = document.createElement("button");
    predictButton.textContent = "View Prediction";

    predictButton.addEventListener("click", () => {
      alert(
        `Order: ${order.name}\n` +
        `Priority: ${prediction.status}\n` +
        `Predicted Demand: ${prediction.predictedDemand}\n` +
        `Reorder Quantity: ${prediction.reorderQuantity}`
      );
    });

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", () => {
      if (!confirm(`Delete order "${order.name}"?`)) {
        return;
      }

      saveOrders(
        getOrders().filter((item) => item.id !== order.id)
      );

      message.textContent = "Order deleted successfully.";
      loadOrders();
    });

    actionCell.append(predictButton, deleteButton);
  }
}


refreshBtn.addEventListener("click", loadOrders);

loadOrders();
