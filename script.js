// Prevent any form submit (we're only duplicating rows)
document.addEventListener("submit", (e) => e.preventDefault());

// Delegate clicks for both Bills and Goals containers
["bill-form", "goal-form"].forEach((formId) => {
  const form = document.getElementById(formId);

  form.addEventListener("click", (e) => {
    const addBtn = e.target.closest(".add-line");
    const removeBtn = e.target.closest(".remove-line");

    // Add = clone the entire entry-row
    if (addBtn) {
      const row = addBtn.closest(".entry-row");
      const clone = row.cloneNode(true);

      // clear inputs in clone
      clone.querySelectorAll("input").forEach((i) => (i.value = ""));
      const sel = clone.querySelector("select");
      if (sel) sel.selectedIndex = 0;

      // show remove on clone
      const rem = clone.querySelector(".remove-line");
      if (rem) rem.style.display = "";

      // insert after the current row
      row.after(clone);

      // focus first control in the new row
      (clone.querySelector("select, input") || clone).focus();
    }

    // Remove a row (keep at least one)
    if (removeBtn) {
      const rows = form.querySelectorAll(".entry-row");
      if (rows.length > 1) {
        removeBtn.closest(".entry-row").remove();
      }
    }
  });
});
