let loans = JSON.parse(localStorage.getItem("loans")) || [];

let emiChartInstance = null;
let outstandingChartInstance = null;

const loanForm = document.getElementById("loanForm");
const loanList = document.getElementById("loanList");

loanForm.addEventListener("submit", e => {
  e.preventDefault();

  const loan = {
    id: Date.now(),
    name: loanName.value,
    principal: +principal.value,
    interest: +interest.value,
    tenure: +tenure.value,
    emiDay: +emiDay.value,
    startDate: startDate.value,
    emi: calculateEMI(principal.value, interest.value, tenure.value),
    paid: 0,
    nextEmi: getNextEmiDate(startDate.value, +emiDay.value)
  };

  loans.push(loan);
  updateApp();
  loanForm.reset();
});

function calculateEMI(P, R, N) {
  const r = R / 12 / 100;
  return Math.round((P * r * Math.pow(1 + r, N)) / (Math.pow(1 + r, N) - 1));
}

function getNextEmiDate(startDate, emiDay) {
  const today = new Date();
  let date = new Date(today.getFullYear(), today.getMonth(), emiDay);
  if (date < today) date.setMonth(date.getMonth() + 1);
  return date.toISOString().split("T")[0];
}

function updateApp() {
  localStorage.setItem("loans", JSON.stringify(loans));
  renderDashboard();
  renderLoans();
  renderCharts();
}

function renderDashboard() {
  totalLoans.textContent = loans.length;

  const emiSum = loans.reduce((s, l) => s + l.emi, 0);
  totalEmi.textContent = `₹${emiSum}`;

  const outstanding = loans.reduce(
    (s, l) => s + l.emi * (l.tenure - l.paid), 0
  );
  totalOutstanding.textContent = `₹${outstanding}`;
}

function renderLoans() {
  loanList.innerHTML = "";
  const today = new Date();

  loans.forEach(l => {
    const dueDate = new Date(l.nextEmi);
    let status = "Upcoming";
    let cls = "upcoming";

    if (l.paid >= l.tenure) {
      status = "Completed";
      cls = "completed";
    } else if (dueDate < today) {
      status = "Overdue";
      cls = "overdue";
    }

    const div = document.createElement("div");
    div.className = "loan-card";
    div.innerHTML = `
      <h3>${l.name}</h3>
      <p>EMI: ₹${l.emi}</p>
      <p>Next EMI: ${l.nextEmi}</p>
      <p class="status ${cls}">${status}</p>
      <div class="actions">
        <button onclick="payEmi(${l.id})">Pay EMI</button>
        <button onclick="deleteLoan(${l.id})">Delete</button>
      </div>
    `;
    loanList.appendChild(div);
  });
}

function payEmi(id) {
  const loan = loans.find(l => l.id === id);
  if (!loan || loan.paid >= loan.tenure) return;

  loan.paid++;
  const next = new Date(loan.nextEmi);
  next.setMonth(next.getMonth() + 1);
  loan.nextEmi = next.toISOString().split("T")[0];

  updateApp();
}

function deleteLoan(id) {
  loans = loans.filter(l => l.id !== id);
  updateApp();
}

function renderCharts() {
  const labels = loans.map(l => l.name);
  const emiData = loans.map(l => l.emi);
  const outstandingData = loans.map(
    l => l.emi * (l.tenure - l.paid)
  );

  if (emiChartInstance) emiChartInstance.destroy();
  if (outstandingChartInstance) outstandingChartInstance.destroy();

  emiChartInstance = new Chart(
    document.getElementById("emiChart"),
    {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Monthly EMI",
          data: emiData
        }]
      }
    }
  );

  outstandingChartInstance = new Chart(
    document.getElementById("outstandingChart"),
    {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Outstanding Amount",
          data: outstandingData
        }]
      }
    }
  );
}

/* =======================
   PHASE 3: CSV EXPORT
======================= */
function exportToCSV() {
  if (loans.length === 0) {
    alert("No loans to export");
    return;
  }

  let csv = [
    [
      "Loan Name",
      "Principal",
      "Interest %",
      "EMI",
      "EMI Day",
      "Paid Months",
      "Remaining Months",
      "Next EMI Date",
      "Outstanding Amount"
    ].join(",")
  ];

  loans.forEach(l => {
    csv.push([
      l.name,
      l.principal,
      l.interest,
      l.emi,
      l.emiDay,
      l.paid,
      l.tenure - l.paid,
      l.nextEmi,
      l.emi * (l.tenure - l.paid)
    ].join(","));
  });

  const blob = new Blob([csv.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "loan-tracker-data.csv";
  a.click();

  URL.revokeObjectURL(url);
}

updateApp();