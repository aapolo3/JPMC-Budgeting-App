// ---- Firebase (ES module, no-auth dev setup) ----
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
    getDatabase, ref, set, push, update, onValue, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

// ✅ DEFINE CONFIG BEFORE initializeApp
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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ---- DOM refs ----
const incomeEl = document.getElementById("income");
const calcBtn = document.getElementById("calculate");
const netAfterBillsEl = document.getElementById("net-after-bills");
const plannedSavingsEl = document.getElementById("planned-savings");
const leewayEl = document.getElementById("leeway");
const adviceEl = document.getElementById("advice");
const billForm = document.getElementById("bill-form");
const goalForm = document.getElementById("goal-form");

// ---- Helpers ----
const asNumber = (x) => Number.parseFloat(x) || 0;
const currency = (n) => n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const getSelectedFrequency = () => (document.querySelector('input[name="frequency"]:checked')?.value || "weekly");
const incomePerMonth = (income, freq) => (freq === "weekly" ? income * 52 / 12 : freq === "biweekly" ? income * 26 / 12 : income);

function collectRows(formEl) {
    const items = [];
    for (const row of formEl.querySelectorAll(".entry-row")) {
        const [sel, nameInput, amtInput] = row.querySelectorAll("select, input");
        const type = sel?.value || "";
        const name = (nameInput?.value || "").trim();
        const amount = asNumber(amtInput?.value || 0);
        if (!type && !name && !amount) continue;
        if (!type || !name) continue;
        items.push({ type, name, amount });
    }
    return items;
}

function computeAndRender({ income, frequency, bills, goals }) {
    const monthlyIncome = incomePerMonth(income, frequency);
    const billsTotal = bills.reduce((s, b) => s + asNumber(b.amount), 0);
    const goalsTotal = goals.reduce((s, g) => s + asNumber(g.amount), 0);
    const netAfterBills = monthlyIncome - billsTotal;
    const leeway = netAfterBills - goalsTotal;

    netAfterBillsEl.textContent = currency(netAfterBills);
    plannedSavingsEl.textContent = currency(goalsTotal);
    leewayEl.textContent = currency(leeway);
    adviceEl.textContent = (leeway >= 0) ? "Nice! You have room to save." : "You’re over target—trim entertainment or reduce goals.";

    return { monthlyIncome, billsTotal, goalsTotal, netAfterBills, leeway };
}

// ---- Pseudo user id (since we're not using Auth) ----
function getClientId() {
    let id = localStorage.getItem("clientId");
    if (!id) {
        id = (crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
        localStorage.setItem("clientId", id);
    }
    return id;
}
const uid = getClientId();

// ---- Load last saved ----
onValue(ref(db, `users/${uid}`), (snap) => {
    const val = snap.val() || {};
    const income = asNumber(val.income ?? 0);
    const frequency = val.frequency ?? "weekly";
    const bills = Object.values(val.bills ?? {});
    const goals = Object.values(val.goals ?? {});

    incomeEl.value = income || "";
    const freqEl = document.querySelector(`input[name="frequency"][value="${frequency}"]`);
    if (freqEl) freqEl.checked = true;

    computeAndRender({ income, frequency, bills, goals });
});

// ---- Calculate: compute + write (no auth gate) ----
calcBtn.addEventListener("click", async () => {
    const income = asNumber(incomeEl.value);
    const frequency = getSelectedFrequency();
    const bills = collectRows(billForm);
    const goals = collectRows(goalForm);

    const totals = computeAndRender({ income, frequency, bills, goals });

    const billsById = {}; bills.forEach((b, i) => billsById[`b${i + 1}`] = b);
    const goalsById = {}; goals.forEach((g, i) => goalsById[`g${i + 1}`] = g);

    await update(ref(db, `users/${uid}`), {
        income,
        frequency,
        bills: billsById,
        goals: goalsById
    });

    await set(push(ref(db, `users/${uid}/history`)), {
        income, frequency, bills, goals, summary: totals,
        createdAt: serverTimestamp()
    });

    console.info("Saved calculation without auth (dev rules required).");
});
