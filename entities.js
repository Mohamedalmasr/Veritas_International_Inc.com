(() => {
  "use strict";
  document.addEventListener("DOMContentLoaded", () => {
    
    // توجيه زر الإيديت للـ Organization
    const orgEditBtn = document.querySelector('[data-entity="organization"] .action-btn[data-action="edit"]');
    orgEditBtn?.addEventListener("click", () => {
      window.location.href = "add_organization.html";
    });

    // توجيه زر الإضافة للـ Individual
    const indAddBtn = document.querySelector('[data-entity="individual"] .action-btn[data-action="add"]');
    indAddBtn?.addEventListener("click", () => {
      window.location.href = "add_individual.html";
    });

    // توجيه زر الإيديت للـ Individual
    const indEditBtn = document.querySelector('[data-entity="individual"] .action-btn[data-action="edit"]');
    indEditBtn?.addEventListener("click", () => {
      window.location.href = "add_individual.html";
    });

  });
})();