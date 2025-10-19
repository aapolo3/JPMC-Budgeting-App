// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBXOBd8Ma1s4c7ExCs5S5s2DmIXMDKkFmk",
    authDomain: "jmpc-budget-app.firebaseapp.com",
    databaseURL: "https://jmpc-budget-app-default-rtdb.firebaseio.com",
    projectId: "jmpc-budget-app",
    storageBucket: "jmpc-budget-app.firebasestorage.app",
    messagingSenderId: "22875604693",
    appId: "1:22875604693:web:5b04ebc99e34bad6ef045c",
    measurementId: "G-VW59F692RW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// --- Init ---
const db = getDatabase(app);

// --- DOM refs (match the HTML I gave you earlier) ---
const incomeEl = document.getElementById("income");
const segRadios = [...document.querySelectorAll('input[name="frequency"]')];

const billForm = document.getElementById("bill-form");
const billType = document.getElementById("bill-type");
const billName = document.getElementById("bill-name");
const billAmount = document.getElementById("bill-amount");
const billList = document.getElementById("bill-list");

const goalForm = document.getElementById("goal-form");
const goalType = document.getElementById("goal-type");
const goalName = document.getElementById("goal-name");
const goalAmount = document.getElementById("goal-amount");
const goalList = document.getElementById("goal-list");

const netAfterBillsEl = document.getElementById("net-after-bills");
const plannedSavingsEl = document.getElementById("planned-savings");
const leewayEl = document.getElementById("leeway");
const adviceEl = document.getElementById("advice");

// --- State ---
let uid = null;
let state = {
    income: 0,
    frequency: "weekly",
    bills: {},   // id -> {type, name, amount}
    goals: {}    // id -> {type, name, amount}
};

// --- Auth then subscribe to DB ---
signInAnonymously(auth).catch(console.error);

onAuthStateChanged(auth, (user) => {
    if (!user) return;
    uid = user.uid;

    // Subscribe to all data for this user
    onValue(ref(db, `users/${uid}`), (snap) => {
        const val = snap.val() || {};
        state.income = Number(val.income ?? 0);
        state.frequency = val.frequency ?? "weekly";
        state.bills = val.bills ?? {};
        state.goals = val.goals ?? {};

        renderFromState();
    });
});

// --- Helpers ---
function asNumber(x) { return Number.parseFloat(x) || 0; }

function incomePerMonth(income, freq) {
    if (freq === "weekly") return income * 52 / 12;
    if (freq === "biweekly") return income * 26 / 12;
    return income; // monthly
}

function totals() {
    const billsTotal = Object.values(state.bills).reduce((s, b) => s + asNumber(b.amount), 0);
    const goalsTotal = Object.values(state.goals).reduce((s, g) => s + asNumber(g.amount), 0);
    const monthlyIncome = incomePerMonth(state.income, state.frequency);
    const netAfterBills = monthlyIncome - billsTotal;
    const leeway = netAfterBills - goalsTotal;
    return { billsTotal, goalsTotal, monthlyIncome, netAfterBills, leeway };
}

function currency(n) {
    return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

function setChipSelection(freq) {
    segRadios.forEach(r => r.checked = (r.value === freq));
}

// --- Render ---
function renderFromState() {
    incomeEl.value = state.income ? state.income : "";
    setChipSelection(state.frequency);

    // Bills
    billList.innerHTML = "";
    Object.entries(state.bills).forEach(([id, b]) => {
        const li = document.createElement("li");
        li.innerHTML = `
      <span><strong>${b.name}</strong> — ${currency(asNumber(b.amount))}</span>
      <span class="badge">${b.type}</span>
      <button class="icon-btn" aria-label="Delete bill">✕</button>
    `;
        li.querySelector("button").addEventListener("click", () => {
            remove(ref(db, `users/${uid}/bills/${id}`));
        });
        billList.appendChild(li);
    });

    // Goals
    goalList.innerHTML = "";
    Object.entries(state.goals).forEach(([id, g]) => {
        const li = document.createElement("li");
        li.innerHTML = `
      <span><strong>${g.name}</strong> — ${currency(asNumber(g.amount))}</span>
      <span class="badge">${g.type}</span>
      <button class="icon-btn" aria-label="Delete goal">✕</button>
    `;
        li.querySelector("button").addEventListener("click", () => {
            remove(ref(db, `users/${uid}/goals/${id}`));
        });
        goalList.appendChild(li);
    });

    const t = totals();
    netAfterBillsEl.textContent = currency(t.netAfterBills);
    plannedSavingsEl.textContent = currency(t.goalsTotal);
    leewayEl.textContent = currency(t.leeway);
    adviceEl.textContent = (t.leeway >= 0)
        ? "Nice! You have room to save."
        : "You’re over target—trim entertainment or reduce goals.";
}

// --- Write handlers ---
// Income
incomeEl.addEventListener("change", (e) => {
    const v = asNumber(e.target.value);
    update(ref(db, `users/${uid}`), { income: v });
});

// Frequency
segRadios.forEach(r => {
    r.addEventListener("change", () => {
        if (!r.checked) return;
        update(ref(db, `users/${uid}`), { frequency: r.value });
    });
});

// Add bill
billForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const payload = {
        type: billType.value,
        name: billName.value.trim(),
        amount: asNumber(billAmount.value)
    };
    if (!payload.type || !payload.name) return;
    const idRef = push(ref(db, `users/${uid}/bills`));
    set(idRef, payload);
    billForm.reset();
});

// Add goal
goalForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const payload = {
        type: goalType.value,
        name: goalName.value.trim(),
        amount: asNumber(goalAmount.value)
    };
    if (!payload.type || !payload.name) return;
    const idRef = push(ref(db, `users/${uid}/goals`));
    set(idRef, payload);
    goalForm.reset();
});