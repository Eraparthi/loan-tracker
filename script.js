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
    startDate: startDate.value,
    emi: calculateEMI(principal.value, interest.value, tenure.value),
    paid: 0
  };

  loans.push(loan);
  updateApp();
  loanForm.reset();
});

function calculateEMI(P, R, N) {
  const r = R / 12 / 100;
  return Math.round((P * r * Math.pow(1 + r, N)) / (Math.pow(1 + r, N) - 1));
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

  loans.forEach(l => {
    const div = document.createElement("div");
    div.className = "loan-card";
    div.innerHTML = `
      <h3>${l.name}</h3>
      <div class="loan-meta">
        EMI: ₹${l.emi} <br>
        Paid: ${l.paid}/${l.tenure} months
      </div>
      <div class="actions">
        <button onclick="payEmi(${l.id})">Pay EMI</button>
        <button class="delete" onclick="deleteLoan(${l.id})">Delete</button>
      </div>
    `;
    loanList.appendChild(div);
  });
}

function payEmi(id) {
  const loan = loans.find(l => l.id === id);
  if (loan.paid < loan.tenure) loan.paid++;
  updateApp();
}

function deleteLoan(id) {
  loans = loans.filter(l => l.id !== id);
  updateApp();
}

updateApp();
