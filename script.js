document.addEventListener("submit", (e) => e.preventDefault());

["bill-form", "goal-form"].forEach((formId) => {
  const form = document.getElementById(formId);

  form.addEventListener("click", (e) => {
    const addBtn = e.target.closest(".add-line");
    const removeBtn = e.target.closest(".remove-line");

    if (addBtn) {
      const row = addBtn.closest(".entry-row");
      const clone = row.cloneNode(true);

      clone.querySelectorAll("input").forEach((i) => (i.value = ""));
      const sel = clone.querySelector("select");
      if (sel) sel.selectedIndex = 0;

      const rem = clone.querySelector(".remove-line");
      if (rem) rem.style.display = "";
      row.after(clone);
      (clone.querySelector("select, input") || clone).focus();
    }

    if (removeBtn) {
      const rows = form.querySelectorAll(".entry-row");
      if (rows.length > 1) {
        removeBtn.closest(".entry-row").remove();
      }
    }
  });
});
