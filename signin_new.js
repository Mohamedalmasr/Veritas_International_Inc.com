document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signinForm");
  const backBtn = document.getElementById("backBtn");
  const helpIcon = document.getElementById("signin-help-icon");

  const passkeyInput = document.getElementById("passkey");
  const clientCardInput = document.getElementById("client-card-number");
  const keyCodeInput = document.getElementById("key-code");
  const licenseNumberInput = document.getElementById("license-number");

  function removeExistingToasts() {
    document.querySelectorAll(".error-toast, .success-toast, .info-toast").forEach((toast) => toast.remove());
  }

  function closeToast(toast) {
    toast.style.animation = "slideDown 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }

  function showErrorToast(missingFields) {
    removeExistingToasts();

    const toast = document.createElement("div");
    toast.className = "error-toast";

    let listHTML = "<ul>";
    missingFields.forEach((field) => {
      listHTML += `<li>${field}</li>`;
    });
    listHTML += "</ul>";

    toast.innerHTML = `
      <div class="toast-header">
        <div class="toast-title">Please fill all required fields:</div>
        <button class="close-btn" aria-label="Close">&times;</button>
      </div>
      ${listHTML}
    `;

    toast.querySelector(".close-btn").addEventListener("click", () => closeToast(toast));
    document.body.appendChild(toast);
  }

  function showSuccessToast(message) {
    removeExistingToasts();

    const toast = document.createElement("div");
    toast.className = "success-toast";
    toast.innerHTML = `
      <div class="toast-header">
        <div class="toast-title">${message}</div>
        <button class="close-btn" aria-label="Close">&times;</button>
      </div>
    `;

    toast.querySelector(".close-btn").addEventListener("click", () => closeToast(toast));
    document.body.appendChild(toast);
  }

  function showInfoToast(infoCode) {
    removeExistingToasts();

    const toast = document.createElement("div");
    toast.className = "info-toast";
    toast.innerHTML = `
      <div class="toast-header">
        <div class="toast-title">${infoCode}</div>
        <button class="close-btn" aria-label="Close">&times;</button>
      </div>
    `;

    toast.querySelector(".close-btn").addEventListener("click", () => closeToast(toast));
    document.body.appendChild(toast);
  }

  function validateForm() {
    const fields = [
      { el: passkeyInput, name: "PassKey" },
      { el: clientCardInput, name: "Client Card Number" },
      { el: keyCodeInput, name: "Key Code" },
      { el: licenseNumberInput, name: "License Number" }
    ];

    const missing = [];

    fields.forEach((field) => {
      if (!field.el.value.trim()) {
        missing.push(field.name);
        field.el.style.borderColor = "#ef4444";
      } else {
        field.el.style.borderColor = "";
      }
    });

    if (missing.length > 0) {
      showErrorToast(missing);
      return false;
    }

    return true;
  }

  function handleHelpClick() {
    const infoCode = helpIcon.getAttribute("data-code") || "1000000";
    showInfoToast(infoCode);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    sessionStorage.setItem("signinPassKey", passkeyInput.value.trim());
    sessionStorage.setItem("signinClientCardNumber", clientCardInput.value.trim());
    sessionStorage.setItem("signinKeyCode", keyCodeInput.value.trim());
    sessionStorage.setItem("signinLicenseNumber", licenseNumberInput.value.trim());

    showSuccessToast("Signed in successfully. Redirecting...");

    setTimeout(() => {
      window.location.href = "admin-oneklient.html";
    }, 800);
  });

  backBtn.addEventListener("click", () => {
    window.location.href = "admin-oneklient.html";
  });

  helpIcon.addEventListener("click", handleHelpClick);

  helpIcon.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleHelpClick();
    }
  });
});