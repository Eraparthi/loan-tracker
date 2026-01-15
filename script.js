/* ---------- SECURITY ---------- */
const lockScreen = document.getElementById("lockScreen");
const app = document.getElementById("app");
const pinStored = localStorage.getItem("pin");

lockTitle.textContent = pinStored ? "Enter PIN" : "Set PIN";

function unlockApp() {
  const p = pinInput.value;
  if (!/^\d{4}$/.test(p)) return pinMsg.textContent = "Invalid PIN";
  if (!pinStored) localStorage.setItem("pin", p);
  else if (p !== pinStored) return pinMsg.textContent = "Wrong PIN";
  lockScreen.style.display = "none";
  app.style.display = "block";
  render();
}

function lockNow() {
  app.style.display = "none";
  lockScreen.style.display = "flex";
}

/* ---------- DATA ---------- */
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
    tenure: +tenure.value,
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
  return Math.round((l.principal * r * Math.pow(1+r,l.tenure)) /
    (Math.pow(1+r,l.tenure)-1));
}

function nextEmiDate(day) {
  const now = new Date();
  let d = new Date(now.getFullYear(), now.getMonth(), day);
  if (d < now) d.setMonth(d.getMonth()+1);
  return d;
}

function save() {
  localStorage.setItem("loans", JSON.stringify(loans));
  render();
}

function render() {
  loanList.innerHTML = "";
  let totalE=0, totalO=0, overdue=0;

  loans.forEach(l => {
    const emi = calcEMI(l);
    const remaining = emi * (l.tenure - l.paid);
    totalE += emi;
    totalO += remaining;

    const due = nextEmiDate(l.emiDay);
    let status = "upcoming";
    if (l.paid >= l.tenure) status = "completed";
    else if (due < new Date()) { status = "overdue"; overdue++; }

    loanList.innerHTML += `
      <div class="loan">
        <h3>${l.name} (${l.type})</h3>
        <span class="badge ${status}">${status}</span>
        <p>EMI: ₹${emi}</p>
        <p>Remaining: ₹${remaining}</p>
        <button onclick="pay(${l.id})">Pay EMI</button>
        <button onclick="undo(${l.id})">Undo</button>
        <button onclick="editLoan(${l.id})">Edit</button>
        <button class="danger" onclick="removeLoan(${l.id})">Delete</button>
      </div>`;
  });

  totalLoans.textContent = loans.length;
  totalEmi.textContent = "₹"+totalE;
  totalOutstanding.textContent = "₹"+totalO;
  healthScore.textContent = Math.max(0,100-overdue*15);

  drawCharts();
}

function pay(id){ const l=loans.find(x=>x.id===id); if(l&&l.paid<l.tenure)l.paid++; save(); }
function undo(id){ const l=loans.find(x=>x.id===id); if(l&&l.paid>0)l.paid--; save(); }

function editLoan(id){
  const l=loans.find(x=>x.id===id);
  editId.value=l.id;
  loanName.value=l.name;
  loanType.value=l.type;
  principal.value=l.principal;
  interest.value=l.interest;
  tenure.value=l.tenure;
  emiAmount.value=l.emiAmount;
  emiDay.value=l.emiDay;
  formTitle.textContent="Edit Loan";
}

function removeLoan(id){
  if(confirm("Delete loan?")){
    loans=loans.filter(l=>l.id!==id);
    save();
  }
}

function exportCSV(){
  let csv="Loan,Type,EMI,Outstanding\n";
  loans.forEach(l=>{
    const e=calcEMI(l);
    csv+=`${l.name},${l.type},${e},${e*(l.tenure-l.paid)}\n`;
  });
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([csv]));
  a.download="loans.csv";
  a.click();
}

function clearAll(){
  if(confirm("Clear all data?")){
    localStorage.clear();
    location.reload();
  }
}

function