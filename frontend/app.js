const API = "http://localhost:8080/api/products";

const form = document.getElementById("productForm");
const table = document.getElementById("products");
const message = document.getElementById("message");

async function apiRequest(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const product = {
    name: document.getElementById("name").value.trim(),
    currentStock: Number(document.getElementById("stock").value),
    dailySales: Number(document.getElementById("sales").value),
    leadTime: Number(document.getElementById("lead").value)
  };

  try {
    await apiRequest(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product)
    });

    message.textContent = "Product added successfully!";
    form.reset();
    await loadProducts();
  } catch (error) {
    message.textContent =
      "Failed to add product. Check Spring Boot and MySQL.";
  }
});

async function loadProducts() {
  table.replaceChildren();

  try {
    const products = await apiRequest(API);

    if (products.length === 0) {
      const row = table.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 6;
      cell.textContent = "No products available.";
      return;
    }

    for (const product of products) {
      const row = table.insertRow();

      [
        product.name,
        product.currentStock,
        product.dailySales,
        product.leadTime + " days"
      ].forEach(value => {
        row.insertCell().textContent = value;
      });

      const predictionCell = row.insertCell();
      const predictButton = document.createElement("button");
      predictButton.textContent = "Predict";

      predictButton.onclick = async () => {
        predictionCell.textContent = "Predicting...";

        try {
          const result = await apiRequest(
            `${API}/${product.id}/prediction`
          );

          predictionCell.textContent =
            `${result.status} | Demand: ${result.predicted_demand}` +
            ` | Reorder: ${result.reorder_quantity}`;
        } catch (error) {
          predictionCell.textContent = "Prediction unavailable";
        }
      };

      predictionCell.appendChild(predictButton);

      const actionCell = row.insertCell();
      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete";

      deleteButton.onclick = async () => {
        if (!confirm(`Delete ${product.name}?`)) return;

        try {
          await apiRequest(`${API}/${product.id}`, {
            method: "DELETE"
          });
          await loadProducts();
        } catch (error) {
          message.textContent = "Delete failed.";
        }
      };

      actionCell.appendChild(deleteButton);
    }
  } catch (error) {
    message.textContent =
      "Cannot connect to Spring Boot. Check port 8080.";
  }
}

document.getElementById("refreshBtn")
  .addEventListener("click", loadProducts);

loadProducts();