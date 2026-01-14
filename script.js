/* =======================
   PHASE 4: PIN LOCK
======================= */
const storedPin = localStorage.getItem("loanAppPin");
const lockScreen = document.getElementById("lockScreen");
const appContent = document.getElementById("appContent");
const lockTitle = document.getElementById("lockTitle");
const pinMsg = document.getElementById("pinMsg");

if (storedPin) {
  lockTitle.textContent = "Enter PIN";
} else {
  lockTitle.textContent = "Set PIN";
}

function handlePin() {
  const pin = pinInput.value;

  if (pin.length !== 4 || isNaN(pin)) {
    pinMsg.textContent = "Enter a valid 4-digit PIN";
    return;
  }

  if (!storedPin) {
    localStorage.setItem("loanAppPin", pin);
    unlockApp();
  } else if (pin === storedPin) {
    unlockApp();
  } else {
    pinMsg.textContent = "Incorrect PIN";
  }
}

function unlockApp() {
  lockScreen.style.display = "none";
  appContent.classList.remove("hidden");
}

/* =======================
   EXISTING APP LOGIC
======================= */
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
  totalEmi.textContent = `₹${loans.reduce((s, l) => s + l.emi, 0)}`;
  totalOutstanding.textContent = `₹${loans.reduce(
    (s, l) => s + l.emi * (l.tenure - l.paid), 0
  )}`;
}

function renderLoans() {
  loanList.innerHTML = "";
  const today = new Date();

  loans.forEach(l => {
    const due = new Date(l.nextEmi);
    let status = "Upcoming";
    let cls = "upcoming";

    if (l.paid >= l.tenure) {
      status = "Completed";
      cls = "completed";
    } else if (due < today) {
      status = "Overdue";
      cls = "overdue";
    }

    loanList.innerHTML += `
      <div class="loan-card">
        <h3>${l.name}</h3>
        <p>EMI: ₹${l.emi}</p>
        <p>Next EMI: ${l.nextEmi}</p>
        <p class="status ${cls}">${status}</p>
        <div class="actions">
          <button onclick="payEmi(${l.id})">Pay EMI</button>
          <button onclick="deleteLoan(${l.id})">Delete</button>
        </div>
      </div>`;
  });
}

function payEmi(id) {
  const l = loans.find(x => x.id === id);
  if (!l || l.paid >= l.tenure) return;
  l.paid++;
  const d = new Date(l.nextEmi);
  d.setMonth(d.getMonth() + 1);
  l.nextEmi = d.toISOString().split("T")[0];
  updateApp();
}

function deleteLoan(id) {
  loans = loans.filter(l => l.id !== id);
  updateApp();
}

function renderCharts() {
  const labels = loans.map(l => l.name);
  const emiData = loans.map(l => l.emi);
  const outstandingData = loans.map(l => l.emi * (l.tenure - l.paid));

  if (emiChartInstance) emiChartInstance.destroy();
  if (outstandingChartInstance) outstandingChartInstance.destroy();

  emiChartInstance = new Chart(emiChart, {
    type: "bar",
    data: { labels, datasets: [{ label: "Monthly EMI", data: emiData }] }
  });

  outstandingChartInstance = new Chart(outstandingChart, {
    type: "bar",
    data: { labels, datasets: [{ label: "Outstanding", data: outstandingData }] }
  });
}

function exportToCSV() {
  let csv = [
    ["Loan Name","Principal","Interest","EMI","EMI Day","Paid","Remaining","Next EMI","Outstanding"].join(",")
  ];
  loans.forEach(l => {
    csv.push([
      l.name,l.principal,l.interest,l.emi,l.emiDay,
      l.paid,l.tenure-l.paid,l.nextEmi,l.emi*(l.tenure-l.paid)
    ].join(","));
  });
  const blob = new Blob([csv.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "loan-tracker.csv";
  a.click();
}

updateApp();