document.addEventListener("submit", (e) => e.preventDefault());

["bill-form", "goal-form"].forEach((formId) => {
  const form = document.getElementById(formId);

  form.addEventListener("click", (e) => {
    const addBtn = e.target.closest(".add-line");
    const removeBtn = e.target.closest(".remove-line");

    if (addBtn) {
      const row = addBtn.closest(".entry-row");
      const clone = row.cloneNode(true);
    }
    if (removeBtn) {
      const rows = form.querySelectorAll(".entry-row");
      if (rows.length > 1) {
        removeBtn.closest(".entry-row").remove();
      }
    }
  });
});
