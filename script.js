let loans = JSON.parse(localStorage.getItem("loans")) || [];

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

  if (date < today) {
    date.setMonth(date.getMonth() + 1);
  }
  return date.toISOString().split("T")[0];
}

function updateApp() {
  localStorage.setItem("loans", JSON.stringify(loans));
  renderDashboard();
  renderLoans();
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
    let statusClass = "upcoming";
    let statusText = "Upcoming";

    if (l.paid >= l.tenure) {
      statusClass = "completed";
      statusText = "Completed";
    } else if (dueDate < today) {
      statusClass = "overdue";
      statusText = "Overdue";
    }

    const div = document.createElement("div");
    div.className = "loan-card";
    div.innerHTML = `
      <h3>${l.name}</h3>
      <p>EMI: ₹${l.emi}</p>
      <p>Next EMI: ${l.nextEmi}</p>
      <p class="status ${statusClass}">${statusText}</p>
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

updateApp();