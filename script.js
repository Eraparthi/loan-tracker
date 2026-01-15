/* PIN */
const lock = document.getElementById("lock");
const app = document.getElementById("app");
const pinStored = localStorage.getItem("pin");
lockTitle.textContent = pinStored ? "Enter PIN" : "Set PIN";

function unlock() {
  const p = pinInput.value;
  if (!/^\d{4}$/.test(p)) return pinMsg.textContent = "Invalid PIN";
  if (!pinStored) localStorage.setItem("pin", p);
  else if (p !== pinStored) return pinMsg.textContent = "Wrong PIN";
  lock.style.display = "none";
  app.style.display = "block";
  render();
}

/* DATA */
let loans = JSON.parse(localStorage.getItem("loans") || "[]");

loanForm.onsubmit = e => {
  e.preventDefault();
  const id = editId.value || Date.now();

  const loan = {
    id,
    name: loanName.value,
    type: loanType.value || "General",
    principal: +principal.value || 0,
    interest: +interest.value || 0,
    tenure: +tenure.value || 0,
    emiAmount: +emiAmount.value || 0,
    emiDay: +emiDay.value,
    paid: editId.value ? loans.find(l => l.id == id).paid : 0
  };

  loans = editId.value
    ? loans.map(l => l.id == id ? loan : l)
    : [...loans, loan];

  loanForm.reset();
  editId.value = "";
  formTitle.textContent = "Add Loan";
  save();
};

function calcEMI(l) {
  if (l.emiAmount > 0) return l.emiAmount;
  const r = l.interest / 1200;
  return Math.round((l.principal * r * Math.pow(1 + r, l.tenure)) /
         (Math.pow(1 + r, l.tenure) - 1));
}

function nextEmiDate(day) {
  const t = new Date();
  let d = new Date(t.getFullYear(), t.getMonth(), day);
  if (d < t) d.setMonth(d.getMonth() + 1);
  return d;
}

function save() {
  localStorage.setItem("loans", JSON.stringify(loans));
  render();
}

function render() {
  loanList.innerHTML = "";
  let totalE = 0, totalO = 0, overdueCount = 0;

  loans.sort((a,b) => nextEmiDate(a.emiDay) - nextEmiDate(b.emiDay));

  loans.forEach(l => {
    const e = calcEMI(l);
    const out = e * (l.tenure - l.paid);
    totalE += e;
    totalO += out;

    const due = nextEmiDate(l.emiDay);
    const daysLeft = Math.ceil((due - new Date()) / 86400000);

    let status = "upcoming";
    if (l.paid >= l.tenure) status = "completed";
    else if (due < new Date()) { status = "overdue"; overdueCount++; }

    loanList.innerHTML += `
      <div class="loan">
        <h3>${l.name} <small>(${l.type})</small></h3>
        <span class="badge ${status}">${status}</span>
        <p>EMI: ₹${e}</p>
        <p>Remaining: ₹${out}</p>
        <p>${status === "upcoming" ? daysLeft + " days left" : ""}</p>
        <button onclick="pay(${l.id})">Pay EMI</button>
        <button onclick="undo(${l.id})">Undo</button>
        <button onclick="editLoan(${l.id})">Edit</button>
        <button class="danger" onclick="removeLoan(${l.id})">Delete</button>
      </div>`;
  });

  totalLoans.textContent = loans.length;
  totalEmi.textContent = "₹" + totalE;
  totalOutstanding.textContent = "₹" + totalO;

  healthScore.textContent = Math.max(0, 100 - overdueCount * 15);

  drawCharts();
}

function pay(id) {
  const l = loans.find(x => x.id === id);
  if (l && l.paid < l.tenure) l.paid++;
  save();
}

function undo(id) {
  const l = loans.find(x => x.id === id);
  if (l && l.paid > 0) l.paid--;
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
  formTitle.textContent = "Edit Loan";
}

function removeLoan(id) {
  if (confirm("Delete this loan?")) {
    loans = loans.filter(l => l.id !== id);
    save();
  }
}

function exportCSV() {
  let csv = "Loan,Type,EMI,Outstanding\n";
  loans.forEach(l => {
    const e = calcEMI(l);
    csv += `${l.name},${l.type},${e},${e * (l.tenure - l.paid)}\n`;
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv]));
  a.download = "loans.csv";
  a.click();
}

function clearAll() {
  if (confirm("Clear all data?")) {
    localStorage.clear();
    location.reload();
  }
}

function drawCharts() {
  if (window.c1) c1.destroy();
  if (window.c2) c2.destroy();

  c1 = new Chart(emiChart, {
    type: "bar",
    data: { labels: loans.map(l => l.name),
      datasets: [{ label: "EMI", data: loans.map(calcEMI) }] }
  });

  c2 = new Chart(outstandingChart, {
    type: "line",
    data: { labels: loans.map(l => l.name),
      datasets: [{ label: "Outstanding",
        data: loans.map(l => calcEMI(l) * (l.tenure - l.paid)) }] }
  });
}