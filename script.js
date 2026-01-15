/* ========= PIN SYSTEM ========= */
const lockScreen = document.getElementById("lockScreen");
const app = document.getElementById("app");
const pinInput = document.getElementById("pinInput");
const pinMsg = document.getElementById("pinMsg");
const lockTitle = document.getElementById("lockTitle");

function storedPin() {
  return localStorage.getItem("loan_pin");
}

function handlePin() {
  const pin = pinInput.value.trim();

  if (!/^\d{4}$/.test(pin)) {
    pinMsg.textContent = "Enter 4 digits";
    return;
  }

  if (!storedPin()) {
    localStorage.setItem("loan_pin", pin);
    openApp();
  } else if (pin === storedPin()) {
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
  lockTitle.textContent = "Enter PIN";
}

/* ========= LOAN LOGIC ========= */
let loans = JSON.parse(localStorage.getItem("loans") || "[]");

loanForm.onsubmit = e => {
  e.preventDefault();
  const loan = {
    id: Date.now(),
    name: loanName.value,
    type: loanType.value || "General",
    principal: +principal.value || 0,
    interest: +interest.value || 0,
    tenure: +tenure.value,
    emiAmount: +emiAmount.value || 0,
    emiDay: +emiDay.value,
    paid: 0
  };
  loans.push(loan);
  save();
  loanForm.reset();
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
  let totalE=0, totalO=0;

  loans.forEach(l => {
    const emi = calcEMI(l);
    totalE += emi;
    totalO += emi * (l.tenure - l.paid);

    loanList.innerHTML += `
      <div class="loan">
        <h3>${l.name}</h3>
        <p>EMI: ₹${emi}</p>
        <button onclick="pay(${l.id})">Pay EMI</button>
      </div>`;
  });

  totalLoans.textContent = loans.length;
  totalEmi.textContent = "₹"+totalE;
  totalOutstanding.textContent = "₹"+totalO;
}

function pay(id) {
  const l = loans.find(x => x.id === id);
  if (l && l.paid < l.tenure) l.paid++;
  save();
}

function exportCSV() {
  let csv = "Loan,EMI\n";
  loans.forEach(l => csv += `${l.name},${calcEMI(l)}\n`);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv]));
  a.download = "loans.csv";
  a.click();
}