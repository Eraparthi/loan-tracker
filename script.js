/* 🔐 PIN LOCK */
const lockScreen = document.getElementById("lockScreen");
const appContent = document.getElementById("appContent");
const lockTitle = document.getElementById("lockTitle");
const pinInput = document.getElementById("pinInput");
const pinMsg = document.getElementById("pinMsg");

const storedPin = localStorage.getItem("loanAppPin");

lockScreen.style.display = "flex";
appContent.style.display = "none";
lockTitle.textContent = storedPin ? "Enter PIN" : "Set PIN";

function handlePin() {
  const pin = pinInput.value.trim();
  if (!/^\d{4}$/.test(pin)) {
    pinMsg.textContent = "Enter valid 4-digit PIN";
    return;
  }
  if (!storedPin) {
    localStorage.setItem("loanAppPin", pin);
    unlock();
  } else if (pin === storedPin) {
    unlock();
  } else {
    pinMsg.textContent = "Incorrect PIN";
  }
}

function unlock() {
  lockScreen.style.display = "none";
  appContent.style.display = "block";
}

/* APP LOGIC */
let loans = JSON.parse(localStorage.getItem("loans")) || [];
let emiChartInstance, outstandingChartInstance;

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
    paid: 0,
    emi: calcEMI(principal.value, interest.value, tenure.value),
    nextEmi: nextEmiDate(emiDay.value)
  };
  loans.push(loan);
  save();
  loanForm.reset();
});

function calcEMI(P, R, N) {
  const r = R / 1200;
  return Math.round((P * r * Math.pow(1 + r, N)) / (Math.pow(1 + r, N) - 1));
}

function nextEmiDate(day) {
  const d = new Date();
  let n = new Date(d.getFullYear(), d.getMonth(), day);
  if (n < d) n.setMonth(n.getMonth() + 1);
  return n.toISOString().split("T")[0];
}

function save() {
  localStorage.setItem("loans", JSON.stringify(loans));
  render();
}

function render() {
  loanList.innerHTML = "";
  totalLoans.textContent = loans.length;
  totalEmi.textContent = "₹" + loans.reduce((s, l) => s + l.emi, 0);
  totalOutstanding.textContent = "₹" + loans.reduce((s, l) => s + l.emi * (l.tenure - l.paid), 0);

  loans.forEach(l => {
    loanList.innerHTML += `
      <div class="loan-card">
        <h3>${l.name}</h3>
        <p>EMI: ₹${l.emi}</p>
        <p>Next EMI: ${l.nextEmi}</p>
        <button onclick="pay(${l.id})">Pay EMI</button>
      </div>`;
  });

  charts();
}

function pay(id) {
  const l = loans.find(x => x.id === id);
  if (!l || l.paid >= l.tenure) return;
  l.paid++;
  const d = new Date(l.nextEmi);
  d.setMonth(d.getMonth() + 1);
  l.nextEmi = d.toISOString().split("T")[0];
  save();
}

function charts() {
  const labels = loans.map(l => l.name);
  if (emiChartInstance) emiChartInstance.destroy();
  if (outstandingChartInstance) outstandingChartInstance.destroy();

  emiChartInstance = new Chart(emiChart, {
    type: "bar",
    data: { labels, datasets: [{ label: "EMI", data: loans.map(l => l.emi) }] }
  });

  outstandingChartInstance = new Chart(outstandingChart, {
    type: "bar",
    data: { labels, datasets: [{ label: "Outstanding", data: loans.map(l => l.emi * (l.tenure - l.paid)) }] }
  });
}

function exportToCSV() {
  let csv = "Loan,EMI,Outstanding\n";
  loans.forEach(l => csv += `${l.name},${l.emi},${l.emi * (l.tenure - l.paid)}\n`);
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "loans.csv";
  a.click();
}

render();