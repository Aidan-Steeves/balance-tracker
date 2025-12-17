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
        borderColor: "#2ecc71", // default, segments override
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

// Event listeners for buttons
document.getElementById("earnBtn").onclick = () => {
  const val = prompt("Amount earned:");
  const num = parseFloat(val);
  if (!isNaN(num) && num > 0) addTransaction(num, "earn");
};

document.getElementById("spendBtn").onclick = () => {
  const val = prompt("Amount spent:");
  const num = parseFloat(val);
  if (!isNaN(num) && num > 0) addTransaction(-num, "spend");
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
    // Undo session data
    balances.pop();
    labels.pop();

    chart.data.labels = labels;
    chart.data.datasets[0].data = balances;
    chart.update();

    updateBalanceDisplay();
    saveData();

    // Undo permanent ledger entry
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