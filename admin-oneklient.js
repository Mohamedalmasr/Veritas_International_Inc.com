"use strict";

/* Ensure toast area */
function ensureToastArea() {
  let area = document.getElementById("toastArea");
  if (!area) {
    area = document.createElement("div");
    area.id = "toastArea";
    area.className = "toast-area";
    document.body.appendChild(area);
  }
  return area;
}

/* Simple toast */
function showToast(message, type = "success", timeout = 2200) {
  if (!message) return;
  const area = ensureToastArea();
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="msg">${message}</div>
    <button class="close" type="button" aria-label="Close">✕</button>
  `;
  toast.querySelector(".close").addEventListener("click", () => toast.remove());
  area.appendChild(toast);
  if (timeout > 0) setTimeout(() => toast.remove(), timeout);
}

/* Info toast (navbar style) */
function showInfoToast(infoCode) {
  document.querySelectorAll(".info-toast").forEach((t) => t.remove());

  const toast = document.createElement("div");
  toast.className = "info-toast";
  toast.innerHTML = `
    <div class="toast-header">
      <div class="toast-title">${infoCode}</div>
      <button class="close-btn" aria-label="Close">&times;</button>
    </div>
  `;

  const closeToast = () => {
    toast.style.animation = "slideDown 0.3s ease forwards";
    setTimeout(() => toast.remove(), 300);
  };

  toast.querySelector(".close-btn").addEventListener("click", closeToast);
  document.body.appendChild(toast);
  setTimeout(() => { if (toast.parentNode) closeToast(); }, 5000);
}

/* Wire events */
document.addEventListener("DOMContentLoaded", () => {
  const onboardBtn       = document.getElementById("onboardBtn");
  const addSuperAdminBtn = document.getElementById("addSuperAdminBtn");
  const statusInfoBtn    = document.getElementById("statusInfoBtn");
  const notTrustedInfoBtn = document.getElementById("notTrustedInfoBtn");

  if (onboardBtn) {
    onboardBtn.addEventListener("click", () => showToast("Opening onboarding flow...", "success"));
  }

  if (addSuperAdminBtn) {
    addSuperAdminBtn.addEventListener("click", () => showToast("Opening add new super admin page...", "success"));
  }

  if (statusInfoBtn) {
    statusInfoBtn.addEventListener("click", () => {
      const code = statusInfoBtn.getAttribute("data-code") || "1000100";
      showInfoToast(code);
    });
  }

  if (notTrustedInfoBtn) {
    notTrustedInfoBtn.addEventListener("click", () => {
      const code = notTrustedInfoBtn.getAttribute("data-code") || "1000200";
      showInfoToast(code);
    });
  }
});