(() => {
"use strict";

const FORM_ID = "portalForm";
const PORTAL_ID = "portal";
const PORTAL_ERROR_ID = "portalError";

const STATUS_FIELD_ID = "statusField";
const STATUS_SELECT_ID = "statusSelect";
const STATUS_ERROR_ID = "statusError";

const DESTINATIONS = {
onboarding: "index.html",
client: "home1.html",
mri: "Real Estate Brokerage.html"
};

const TEAM_DESTINATIONS = {
new: "admin-oneklient.html",
init: "signin_init.html"
};

const SECTION2_DESTINATIONS = {
tourism: "tourism_website/tourism_website.html",
transtario: "transtario-redesign-site/index.html",
genesis: "genesis_bus_line_site/index.html"
};

const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", () => {
const form = $(FORM_ID);
const portalSelect = $(PORTAL_ID);
const portalError = $(PORTAL_ERROR_ID);


const statusField = $(STATUS_FIELD_ID);
const statusSelect = $(STATUS_SELECT_ID);
const statusError = $(STATUS_ERROR_ID);

const section2Select = $("section2");
const clearPortalBtn = $("clearPortal");
const clearSection2Btn = $("clearSection2");

if (!form || !portalSelect || !statusField || !statusSelect) return;

function showPortalError(message = "Please select an option.") {
  portalSelect.classList.add("is-invalid");

  if (portalError) {
    portalError.textContent = message;
    portalError.classList.add("show");
  }

  portalSelect.focus();
}

function clearPortalError() {
  portalSelect.classList.remove("is-invalid");

  if (portalError) {
    portalError.classList.remove("show");
  }
}

function showStatusError(message = "Please select status.") {
  statusSelect.classList.add("is-invalid");

  if (statusError) {
    statusError.textContent = message;
    statusError.classList.add("show");
  }

  statusSelect.focus();
}

function clearStatusError() {
  statusSelect.classList.remove("is-invalid");

  if (statusError) {
    statusError.classList.remove("show");
  }
}

function updateSectionLocks() {
  if (!section2Select) return;

  if (portalSelect.value) {
    section2Select.disabled = true;

    if (clearPortalBtn) {
      clearPortalBtn.style.display = "block";
    }
  } else {
    section2Select.disabled = false;

    if (clearPortalBtn) {
      clearPortalBtn.style.display = "none";
    }
  }

  if (section2Select.value) {
    portalSelect.disabled = true;

    if (clearSection2Btn) {
      clearSection2Btn.style.display = "block";
    }
  } else {
    portalSelect.disabled = false;

    if (clearSection2Btn) {
      clearSection2Btn.style.display = "none";
    }
  }
}

function updateStatusVisibility() {
  const selectedPortal = portalSelect.value;

  clearPortalError();
  clearStatusError();

  if (selectedPortal === "team") {
    statusField.classList.remove("hidden-field");
  } else {
    statusField.classList.add("hidden-field");
    statusSelect.selectedIndex = 0;
  }

  updateSectionLocks();
}

portalSelect.addEventListener("change", updateStatusVisibility);
statusSelect.addEventListener("change", clearStatusError);

if (section2Select) {
  section2Select.addEventListener("change", updateSectionLocks);
}

if (clearPortalBtn) {
  clearPortalBtn.addEventListener("click", () => {
    portalSelect.value = "";
    statusSelect.selectedIndex = 0;
    statusField.classList.add("hidden-field");
    updateSectionLocks();
  });
}

if (clearSection2Btn) {
  clearSection2Btn.addEventListener("click", () => {
    section2Select.value = "";
    updateSectionLocks();
  });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  clearPortalError();
  clearStatusError();

  const selectedPortal = portalSelect.value;
  const selectedStatus = statusSelect.value;

  if (
    !selectedPortal &&
    (!section2Select || !section2Select.value)
  ) {
    showPortalError();
    return;
  }

  if (section2Select && section2Select.value) {
    const section2Target =
      SECTION2_DESTINATIONS[section2Select.value];

    if (section2Target) {
      window.location.href = section2Target;
    }

    return;
  }

  if (selectedPortal === "team") {
    if (!selectedStatus) {
      showStatusError();
      return;
    }

    const teamTarget = TEAM_DESTINATIONS[selectedStatus];

    if (teamTarget) {
      window.location.href = teamTarget;
    }

    return;
  }

  const target = DESTINATIONS[selectedPortal];

  if (target) {
    window.location.href = target;
  }
});

updateStatusVisibility();
updateSectionLocks();


});
})();
