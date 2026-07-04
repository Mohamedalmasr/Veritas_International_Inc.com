(() => {
  // 1. Live Server Clock (New York)
  function updateNYCTime() {
    const timeEl = document.getElementById("nycTime");
    if (!timeEl) return;

    const options = {
      timeZone: "America/New_York",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    };

    const formatter = new Intl.DateTimeFormat("en-US", options);
    timeEl.textContent = formatter.format(new Date());
  }

  // 2. Function to show Info Toast 
  function showNavbarHelpToast(infoCode) {
    // إزالة أي توستات قديمة لمنع التراكم
    document.querySelectorAll(".info-toast").forEach((toast) => toast.remove());

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

    // قفل تلقائي بعد 4 ثوانٍ
    setTimeout(() => {
      if (toast.parentNode) {
        closeToast();
      }
    }, 4000);
  }

  // 3. Inject Navbar HTML & Bind Events
  document.addEventListener("DOMContentLoaded", () => {
    const headerContainer = document.getElementById("global-header");
    if (headerContainer) {
      headerContainer.innerHTML = `
        <header class="app-header" role="navigation" aria-label="Primary">
          <div class="app-brand">
            <span class="logo" aria-hidden="true"></span>
            <span class="brand-name">Veritas International Inc.</span>
            
            <div id="statusArea" class="status-area">
              <span id="statusChip" class="status-chip">INT</span>
            </div>

            <button id="helpBtn" class="question-icon" type="button" title="Help">?</button>
          </div>

          <div class="header-right">
            <div class="server-time-box">
              <span class="time-label">Server Time:</span>
              <span id="nycTime" class="time-value">--:--:--</span>
            </div>

            <div class="user-profile">
              <span class="user-name">Jonathan Yousry</span>
            </div>
            
            <div class="nav-actions">
              <button class="action-trigger" aria-label="Messages">
                <svg viewBox="0 0 24 24" class="action-icon">
                  <path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <span class="badge">1</span>
              </button>
              
              <button class="action-trigger" aria-label="Notifications">
                <svg viewBox="0 0 24 24" class="action-icon">
                  <path fill="currentColor" d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1-1.5-1s-1.5.17-1.5 1v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                </svg>
                <span class="badge">2</span>
              </button>
            </div>
          </div>
        </header>
      `;

      // ربط كليك علامة الاستفهام بالتوست الأزرق
      const help = document.getElementById("helpBtn");
      help?.addEventListener("click", () => {
        showNavbarHelpToast("1000020");
      });

      // تشغيل الساعة الحية
      updateNYCTime();
      setInterval(updateNYCTime, 1000);
    }
  });
})();