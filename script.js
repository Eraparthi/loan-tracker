/* PIN */
const pinStored = localStorage.getItem("pin");
const lockScreen = document.getElementById("lockScreen");
const app = document.getElementById("app");
const pinInput = document.getElementById("pinInput");
const pinMsg = document.getElementById("pinMsg");
const lockTitle = document.getElementById("lockTitle");

lockTitle.textContent = pinStored ? "Enter PIN" : "Set PIN";

function unlockApp() {
  const p = pinInput.value;
  if (!/^\d{4}$/.test(p)) {
    pinMsg.textContent = "Invalid PIN";
    return;
  }
  if (!pinStored) {
    localStorage.setItem("pin", p);
  } else if (p !== pinStored) {
    pinMsg.textContent = "Wrong PIN";
    return;
  }
  lockScreen.style.display = "none";
  app.style.display = "block";
  render();
}

/* DATA */
let loans = JSON.parse(localStorage.getItem("loans") || "[]");

const loanForm = document.getElementById("loanForm");

loanForm.onsubmit = e => {
  e.preventDefault();
  const id = editId.value;
  const loan = {
    id: id || Date.now(),
    name: loanName.value,
    principal: +principal.value,
    interest: +interest.value,
    tenure: +tenure.value,
    emiDay: +emiDay.value,
    startDate: startDate.value,
    paid: 0
  };
  if (id) loans = loans.map(l => l.id == id ? loan : l);
  else loans.push(loan);
  save();
  loanForm.reset();
};

function emi(p, r, n) {
  r = r / 1200;
  return Math.round((p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
}

function nextDate(day) {
  const d = new Date();
  let n = new Date(d.getFullYear(), d.getMonth(), day);
  if (n < d) n.setMonth(n.getMonth() + 1);
  return n;
}

function render() {
  localStorage.setItem("loans", JSON.stringify(loans));
  loanList.innerHTML = "";
  let totalEmiVal = 0;
  let totalOut = 0;

  loans.forEach(l => {
    const e = emi(l.principal, l.interest, l.tenure);
    const out = e * (l.tenure - l.paid);
    totalEmiVal += e;
    totalOut += out;

    const due = nextDate(l.emiDay);
    const status = l.paid >= l.tenure ? "completed" :
      due < new Date() ? "overdue" : "upcoming";

    loanList.innerHTML += `
      <div class="loan">
        <h3>${l.name}</h3>
        <span class="badge ${status}">${status}</span>
        <p>EMI: ₹${e}</p>
        <p>Remaining: ₹${out}</p>
        <div class="actions">
          <button onclick="pay(${l.id})">Pay EMI</button>
          <button onclick="editLoan(${l.id})">Edit</button>
          <button class="danger" onclick="remove(${l.id})">Delete</button>
        </div>
      </div>`;
  });

  totalLoans.textContent = loans.length;
  totalEmi.textContent = "₹" + totalEmiVal;
  totalOutstanding.textContent = "₹" + totalOut;

  drawCharts();
}

function pay(id) {
  const l = loans.find(x => x.id === id);
  if (l && l.paid < l.tenure) l.paid++;
  render();
}

function editLoan(id) {
  const l = loans.find(x => x.id === id);
  editId.value = l.id;
  loanName.value = l.name;
  principal.value = l.principal;
  interest.value = l.interest;
  tenure.value = l.tenure;
  emiDay.value = l.emiDay;
  startDate.value = l.startDate;
}

function remove(id) {
  if (confirm("Delete this loan?")) {
    loans = loans.filter(l => l.id !== id);
    render();
  }
}

function exportCSV() {
  let csv = "Name,EMI,Outstanding\n";
  loans.forEach(l => {
    const e = emi(l.principal, l.interest, l.tenure);
    csv += `${l.name},${e},${e * (l.tenure - l.paid)}\n`;
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
      datasets: [{ label: "EMI", data: loans.map(l => emi(l.principal, l.interest, l.tenure)) }] }
  });

  c2 = new Chart(outstandingChart, {
    type: "line",
    data: { labels: loans.map(l => l.name),
      datasets: [{ label: "Outstanding", data: loans.map(l => emi(l.principal, l.interest, l.tenure) * (l.tenure - l.paid)) }] }
  });
}