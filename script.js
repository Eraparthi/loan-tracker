/* ---------- PIN SYSTEM ---------- */
const lockScreen = document.getElementById("lockScreen");
const app = document.getElementById("app");

function getPin() {
  return localStorage.getItem("loan_pin");
}

lockTitle.textContent = getPin() ? "Enter PIN" : "Set PIN";

function handlePin() {
  const pin = pinInput.value.trim();

  if (!/^\d{4}$/.test(pin)) {
    pinMsg.textContent = "Enter 4 digits";
    return;
  }

  if (!getPin()) {
    localStorage.setItem("loan_pin", pin);
    openApp();
  } else if (pin === getPin()) {
    openApp();
  } else {
    pinMsg.textContent = "Incorrect PIN";
  }

  pinInput.value = "";
}

function openApp() {
  lockScreen.style.display = "none";
  app.style.display = "block";
  render();
}

function lockApp() {
  app.style.display = "none";
  lockScreen.style.display = "flex";
  pinMsg.textContent = "";
}

/* ---------- DATA ---------- */
let loans = JSON.parse(localStorage.getItem("loans") || "[]");

loanForm.onsubmit = e => {
  e.preventDefault();

  const loan = {
    id: editId.value || Date.now(),
    name: loanName.value,
    type: loanType.value || "General",
    principal: +principal.value || 0,
    interest: +interest.value || 0,
    tenure: +tenure.value,
    emiAmount: +emiAmount.value || 0,
    emiDay: +emiDay.value,
    paid: editId.value ? loans.find(l=>l.id==editId.value).paid : 0
  };

  loans = editId.value
    ? loans.map(l => l.id == loan.id ? loan : l)
    : [...loans, loan];

  loanForm.reset();
  editId.value = "";
  save();
};

function calcEMI(l) {
  if (l.emiAmount) return l.emiAmount;
  const r = l.interest / 1200;
  return Math.round((l.principal * r * Math.pow(1+r,l.tenure)) /
    (Math.pow(1+r,l.tenure)-1));
}

function save() {
  localStorage.setItem("loans", JSON.stringify(loans));
  render();
}

function render() {
  loanList.innerHTML = "";
  suggestions.innerHTML = "";

  let totalE = 0, totalO = 0, overdue = 0;

  loans.forEach(l => {
    const emi = calcEMI(l);
    const remaining = emi * (l.tenure - l.paid);
    totalE += emi;
    totalO += remaining;

    const due = new Date();
    due.setDate(l.emiDay);
    if (due < new Date()) overdue++;

    loanList.innerHTML += `
      <div class="loan">
        <h3>${l.name} (${l.type})</h3>
        <p>EMI: ₹${emi}</p>
        <p>Remaining: ₹${remaining}</p>
        <button onclick="pay(${l.id})">Pay EMI</button>
        <button onclick="editLoan(${l.id})">Edit</button>
        <button class="danger" onclick="removeLoan(${l.id})">Delete</button>
      </div>`;
  });

  if (overdue > 0) {
    suggestions.innerHTML += `<li>⚠️ ${overdue} loan(s) have EMI due</li>`;
  }
  if (loans.length > 0) {
    suggestions.innerHTML += `<li>💡 Consider prepaying high-interest loans first</li>`;
  }

  totalLoans.textContent = loans.length;
  totalEmi.textContent = "₹" + totalE;
  totalOutstanding.textContent = "₹" + totalO;
  healthScore.textContent = Math.max(0, 100 - overdue * 15);

  drawCharts();
}

function pay(id) {
  const l = loans.find(x => x.id === id);
  if (l && l.paid < l.tenure) l.paid++;
  save();
}

function editLoan(id) {
  const l = loans.find(x => x.id === id);
  editId.value = l.id;
  loanName.value = l.name;
  loanType.value = l.type;
  principal.value = l.principal;
  interest.value = l.interest;
  tenure.value = l.tenure;
  emiAmount.value = l.emiAmount;
  emiDay.value = l.emiDay;
}

function removeLoan(id) {
  if (confirm("Delete loan?")) {
    loans = loans.filter(l => l.id !== id);
    save();
  }
}

function exportCSV() {
  let csv = "Loan,EMI,Remaining\n";
  loans.forEach(l => {
    const e = calcEMI(l);
    csv += `${l.name},${e},${e*(l.tenure-l.paid)}\n`;
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv]));
  a.download = "loans.csv";
  a.click();
}

function resetApp() {
  if (confirm("Reset everything?")) {
    localStorage.clear();
    location.reload();
  }
}

function drawCharts() {
  if (window.c1) c1.destroy();
  if (window.c2) c2.destroy();

  c1 = new Chart(emiChart, {
    type: "bar",
    data: {
      labels: loans.map(l => l.name),
      datasets: [{ label: "EMI", data: loans.map(calcEMI) }]
    }
  });

  c2 = new Chart(outstandingChart, {
    type: "line",
    data: {
      labels: loans.map(l => l.name),
      datasets: [{ label: "Outstanding", data: loans.map(l => calcEMI(l)*(l.tenure-l.paid)) }]
    }
  });
}