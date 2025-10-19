function addBillOnClick() {
  const typeEl = document.getElementById("bill-type");
  const nameEl = document.getElementById("bill-name");
  const amountEl = document.getElementById("bill-amount");
  const listEl = document.getElementById("bill-list");

  const type = typeEl.value;
  const name = nameEl.value.trim();
  const amount = parseFloat(amountEl.value || "0");

  if (!type || !name || !(amount > 0)) return; // simple guard

  const li = document.createElement("li");
  li.textContent = `${name} — $${amount.toFixed(2)} (${type})`;
  listEl.appendChild(li);

  nameEl.value = "";
  amountEl.value = "";
}

function addGoalOnClick() {
  const typeEl = document.getElementById("goal-type");
  const nameEl = document.getElementById("goal-name");
  const amountEl = document.getElementById("goal-amount");
  const listEl = document.getElementById("goal-list");

  const type = typeEl.value;
  const name = nameEl.value.trim();
  const amount = parseFloat(amountEl.value || "0");

  if (!type || !name || !(amount > 0)) return; // simple guard

  const li = document.createElement("li");
  li.textContent = `${name} — $${amount.toFixed(2)} (${type})`;
  listEl.appendChild(li);

  nameEl.value = "";
  amountEl.value = "";
}
