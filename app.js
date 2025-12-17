// Load saved balances or start with 0
let balances = JSON.parse(localStorage.getItem("balances")) || [0];
let labels = balances.map((_, i) => i + 1);
let ledger = JSON.parse(localStorage.getItem("ledger")) || [];

const balanceEl = document.getElementById("balance");
const lastEntryEl = document.getElementById("lastEntry");

// Helper to get current balance
function currentBalance() {
  return balances[balances.length - 1];
}

// Update balance display above chart
function updateBalanceDisplay() {
  const bal = currentBalance();
  balanceEl.textContent = `$${bal.toFixed(2)}`;
  balanceEl.style.color = bal >= 0 ? "#2ecc71" : "#e74c3c";
}

// Chart.js setup
const ctx = document.getElementById("balanceChart");

const chart = new Chart(ctx, {
  type: "line",
  data: {
    labels: labels,
    datasets: [
      {
        label: "Balance",
        data: balances,
        borderColor: "#2ecc71",
        segment: {
          borderColor: ctx =>
            ctx.p0.parsed.y < 0 || ctx.p1.parsed.y < 0 ? "#e74c3c" : "#2ecc71"
        },
        tension: 0.3,
        fill: false,
        pointRadius: 5,
        pointBackgroundColor: ctx =>
          ctx.raw >= 0 ? "#2ecc71" : "#e74c3c"
      }
    ]
  },
  options: {
    plugins: { legend: { display: false } },
    scales: {
      y: {
        grid: {
          color: ctx => (ctx.tick.value === 0 ? "#000" : "#ddd")
        }
      }
    }
  }
});

// Save data to localStorage
function saveData() {
  localStorage.setItem("balances", JSON.stringify(balances));
}

// Add a transaction and update everything
function addTransaction(amount, type) {
  const newBalance = currentBalance() + amount;
  balances.push(newBalance);
  labels.push(labels.length + 1);

  chart.data.labels = labels;
  chart.data.datasets[0].data = balances;
  chart.update();

  updateBalanceDisplay();
  saveData();

  ledger.push({
    amount: amount,
    type: type,
    date: new Date().toISOString().split("T")[0]
  });

  localStorage.setItem("ledger", JSON.stringify(ledger));

  lastEntryEl.textContent =
    type === "earn"
      ? `+ $${amount.toFixed(2)} earned`
      : `− $${Math.abs(amount).toFixed(2)} spent`;
}

// Custom modal input
function showAmountModal(type) {
  // Create modal overlay
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  
  // Create modal content
  const modal = document.createElement("div");
  modal.className = "modal";
  
  const title = document.createElement("h3");
  title.textContent = type === "earn" ? "Amount Earned" : "Amount Spent";
  title.style.color = type === "earn" ? "#2ecc71" : "#e74c3c";
  
  const input = document.createElement("input");
  input.type = "number";
  input.inputMode = "decimal";
  input.placeholder = "0.00";
  input.className = "modal-input";
  
  const buttonContainer = document.createElement("div");
  buttonContainer.className = "modal-buttons";
  
  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.className = "modal-btn cancel";
  
  const confirmBtn = document.createElement("button");
  confirmBtn.textContent = "Confirm";
  confirmBtn.className = "modal-btn confirm";
  confirmBtn.style.background = type === "earn" ? "#2ecc71" : "#e74c3c";
  
  buttonContainer.appendChild(cancelBtn);
  buttonContainer.appendChild(confirmBtn);
  
  modal.appendChild(title);
  modal.appendChild(input);
  modal.appendChild(buttonContainer);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Focus input and show keyboard
  setTimeout(() => {
    input.focus();
  }, 100);
  
  // Handle confirm
  confirmBtn.onclick = () => {
    const num = parseFloat(input.value);
    if (!isNaN(num) && num > 0) {
      addTransaction(type === "earn" ? num : -num, type);
    }
    document.body.removeChild(overlay);
  };
  
  // Handle cancel
  cancelBtn.onclick = () => {
    document.body.removeChild(overlay);
  };
  
  // Handle overlay click (close modal)
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  };
  
  // Handle Enter key
  input.onkeypress = (e) => {
    if (e.key === "Enter") {
      confirmBtn.click();
    }
  };
}

// Event listeners for buttons
document.getElementById("earnBtn").onclick = () => {
  showAmountModal("earn");
};

document.getElementById("spendBtn").onclick = () => {
  showAmountModal("spend");
};

// Reset all data
document.getElementById("resetBtn").onclick = () => {
  if (confirm("Are you sure you want to delete all data?")) {
    balances = [0];
    labels = [1];
    chart.data.labels = labels;
    chart.data.datasets[0].data = balances;
    chart.update();
    updateBalanceDisplay();
    lastEntryEl.textContent = "";
    localStorage.removeItem("balances");
  }
};

// Undo last entry
document.getElementById("undoBtn").onclick = () => {
  if (balances.length > 1) {
    balances.pop();
    labels.pop();

    chart.data.labels = labels;
    chart.data.datasets[0].data = balances;
    chart.update();

    updateBalanceDisplay();
    saveData();

    if (ledger.length > 0) {
      ledger.pop();
      localStorage.setItem("ledger", JSON.stringify(ledger));
    }

    lastEntryEl.textContent = "Last entry undone";
  } else {
    alert("Nothing to undo");
  }
};

// Navigate to data page
document.getElementById("dataBtn").onclick = () => {
  window.location.href = "data.html";
};

// Initialize display
updateBalanceDisplay();