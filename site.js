/* =========================
   ONEklient – Global Script
   ========================= */

/* -------- Helpers -------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* -------- AOS -------- */
document.addEventListener("DOMContentLoaded", () => {
  if (window.AOS && typeof AOS.init === "function") {
    AOS.init({ offset: 0 });
  }
});

/* -------- Mobile Nav (hamburger / dropdown) -------- */
(() => {
  const dropdown = $(".dropdown");
  const openBtn = $(".hamburg");
  const closeBtn = $(".cancel");

  function openMenu() {
    if (!dropdown) return;
    dropdown.style.transform = "translateY(0)";
    document.body.style.overflow = "hidden";
  }
  function closeMenu() {
    if (!dropdown) return;
    dropdown.style.transform = "translateY(-500px)";
    document.body.style.overflow = "";
  }

  openBtn?.addEventListener("click", openMenu);
  closeBtn?.addEventListener("click", closeMenu);
  dropdown?.addEventListener("click", (e) => {
    if (e.target.tagName === "A") closeMenu();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  // Backwards compatibility
  window.hamburg = openMenu;
  window.cancel = closeMenu;
})();

/* -------- Theme Toggle (Light/Dark) -------- */
(() => {
  const STORAGE_KEY = "oneklient_theme";
  const btn = $(".theme-toggle");

  function applyTheme(theme) {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(STORAGE_KEY, theme);
    if (btn) {
      const icon = btn.querySelector("i");
      if (icon) icon.className = theme === "dark" ? "fa-solid fa-moon" : "fa-solid fa-sun";
      btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
      btn.title = theme === "dark" ? "Switch to Light" : "Switch to Dark";
    }
  }

  const saved = localStorage.getItem(STORAGE_KEY);
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "dark" : "light"));

  btn?.addEventListener("click", () => {
    const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
    applyTheme(next);
  });
})();

/* -------- Toasts (Right bottom) -------- */
const Toasts = (() => {
  let container = null;
  function ensureContainer() {
    if (!container) {
      container = document.getElementById("toast-container");
      if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        document.body.appendChild(container);
      }
    }
    return container;
  }
  function show(message, type = "error", duration = 3000) {
    const parent = ensureContainer();
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.textContent = message;
    parent.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 400);
    }, duration);
  }
  return { show };
})();

/* -------- Login Page (redirect to a blank hub) -------- */
(() => {
  const form = document.getElementById("loginForm");
  if (!form) return;

  const getVal   = (id) => (document.getElementById(id)?.value || "").trim();
  const pwdWrap  = document.getElementById("passwordField");
  const pwdInput = document.getElementById("pwd");

  const ccnWrap  = document.getElementById("clientCardField");
  const ccnInput = document.getElementById("ccn");

  function show15Extras() {
    if (ccnWrap) ccnWrap.classList.remove("hidden");
    if (pwdWrap) pwdWrap.classList.remove("hidden");
    ccnInput?.focus();
  }
  function hide15Extras() {
    if (ccnWrap) { ccnWrap.classList.add("hidden"); if (ccnInput) ccnInput.value = ""; }
    if (pwdWrap) { pwdWrap.classList.add("hidden"); if (pwdInput) pwdInput.value = ""; }
  }

  document.getElementById("orgid")?.focus();

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const orgid   = getVal("orgid");
    const license = getVal("license");
    const key     = getVal("key");

    // Basic fill check (من غير الحقول الإضافية لو لسه مخفية)
    if (!orgid || !license || !key) {
      Toasts.show("Please fill all fields", "error");
      return;
    }

    // ✅ حالة الدخول الفوري — لو كله 19
    if (orgid === "19" && license === "19" && key === "19") {
      hide15Extras();
      try {
        sessionStorage.setItem("orgid", orgid);
        sessionStorage.setItem("license", license);
        sessionStorage.setItem("ok_auth", "true");
      } catch (_) {}
      window.location.href = "home.html";
      return;
    }

    // 🔒 حالة 15: نُظهر Client Card Number + Password معًا
    if (orgid === "15" && license === "15" && key === "15") {
      // أول ضغطة → بس نعرض الحقول
      if (ccnWrap?.classList.contains("hidden") || pwdWrap?.classList.contains("hidden")) {
        show15Extras();
        Toasts.show("Please enter Client Card Number and Password", "success", 2200);
        return;
      }

      // المحاولة الثانية → نتحقق من القيم
      const ccn = (ccnInput?.value || "").trim();
      const pwd = (pwdInput?.value || "").trim();

      if (!ccn || !pwd) {
        Toasts.show("Please complete the extra fields", "error");
        return;
      }
      if (ccn === "15" && pwd === "15") {
        try {
          sessionStorage.setItem("orgid", orgid);
          sessionStorage.setItem("license", license);
          sessionStorage.setItem("ok_auth", "true");
        } catch (_) {}
        window.location.href = "home.html";
        return;
      } else {
        Toasts.show("Incorrect Client Card Number or Password", "error");
        return;
      }
    }

    // أي بيانات تانية → مرفوض
    Toasts.show("Invalid credentials", "error");
  });
})();

/* -------- Welcome Page (Next button) -------- */
(() => {
  const nextBtn = document.getElementById("nextBtn");
  if (!nextBtn) return;
  nextBtn.addEventListener("click", () => {
    window.location.href = "steps.html";
  });
})();

/* -------- Contact Page: services options toggle -------- */
(() => {
  const grid = document.querySelector(".services-grid, .services-options");
  if (!grid) return;

  grid.addEventListener("click", (e) => {
    const label = e.target.closest("label.service-option, label.service-tile");
    if (!label) return;
    const cb = label.querySelector('input[type="checkbox"]');
    if (!cb) return;
    if (e.target !== cb) {
      cb.checked = !cb.checked;
      cb.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
})();

/* -------- Steps Page (left menu toggle + status badge + preview) -------- */
(() => {
  const toggleBtn = document.getElementById("sideToggle");
  const panel = document.getElementById("sidePanel");

  if (toggleBtn && panel) {
    toggleBtn.addEventListener("click", () => {
      const expanded = toggleBtn.getAttribute("aria-expanded") === "true";
      toggleBtn.setAttribute("aria-expanded", expanded ? "false" : "true");
      panel.classList.toggle("show", !expanded);
    });
  }

  const statusSelect = document.getElementById("statusSelect");
  const badge = document.getElementById("statusBadge");

  function applyBadge(v) {
    if (!badge) return;
    badge.classList.remove("is-white", "is-yellow", "is-green");
    if (v === "3") {
      badge.classList.add("is-green");
      badge.textContent = "Green";
    } else if (v === "2") {
      badge.classList.add("is-yellow");
      badge.textContent = "Yellow";
    } else {
      badge.classList.add("is-white");
      badge.textContent = "White";
    }
  }

  statusSelect?.addEventListener("change", (e) => applyBadge(e.target.value));
  if (statusSelect) applyBadge(statusSelect.value);

  const goBtn = document.getElementById("goBtn");
  const stateCard = document.getElementById("stateCard");

  goBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    if (!statusSelect || !stateCard) return;
    const v = statusSelect.value;

    let title = "Not started";
    let desc = "This state has not been started yet.";
    if (v === "2") {
      title = "In progress";
      desc = "Work is currently in progress.";
    } else if (v === "3") {
      title = "Completed";
      desc = "This state is done.";
    }

    stateCard.innerHTML = `
      <h3>${title}</h3>
      <p>${desc}</p>
    `;
  });
})();
