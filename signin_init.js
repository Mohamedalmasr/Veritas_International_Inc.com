document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signinForm");
  const backBtn = document.getElementById("backBtn");
  const helpIcon = document.getElementById("signin-help-icon");

  const organizationClientCardInput = document.getElementById("organization-client-card");
  const superAdminClientCardInput = document.getElementById("superadmin-client-card");
  const passwordInput = document.getElementById("password");

  function removeExistingToasts() {
    document.querySelectorAll(".error-toast, .success-toast, .info-toast").forEach((toast) => {
      toast.remove();
    });
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
      {
        el: organizationClientCardInput,
        name: "Organization Client Card"
      },
      {
        el: superAdminClientCardInput,
        name: "SuperAdmin Client Card"
      },
      {
        el: passwordInput,
        name: "Password"
      }
    ];

    const missing = [];

    fields.forEach((field) => {
      if (!field.el || !field.el.value.trim()) {
        missing.push(field.name);

        if (field.el) {
          field.el.style.borderColor = "#ef4444";
        }
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
    if (!helpIcon) return;

    const infoCode = helpIcon.getAttribute("data-code") || "1000000";
    showInfoToast(infoCode);
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      if (!validateForm()) return;

      sessionStorage.setItem(
        "signinOrganizationClientCard",
        organizationClientCardInput.value.trim()
      );

      sessionStorage.setItem(
        "signinSuperAdminClientCard",
        superAdminClientCardInput.value.trim()
      );

      sessionStorage.setItem(
        "signinPassword",
        passwordInput.value.trim()
      );

      showSuccessToast("Signed in successfully. Redirecting...");

      // التعديل هنا: التوجيه مباشرة لصفحة home.html
      setTimeout(() => {
        window.location.href = "home.html";
      }, 800);
    });
  }

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.history.back();
    });
  }

  if (helpIcon) {
    helpIcon.addEventListener("click", handleHelpClick);

    helpIcon.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleHelpClick();
      }
    });
  }
});