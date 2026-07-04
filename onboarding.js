document.addEventListener("DOMContentLoaded", () => {
  const mainSection = document.querySelector('.form-section[data-step="1"]');

  if (!mainSection) return;

  const STORAGE_KEY = "onboardingOrganizations";
  const SELECTED_ORG_KEY = "selectedOnboardingOrganization";

  function padStep(num) {
    return String(num).padStart(3, "0");
  }

  function populateFiscalDays(selectEl) {
    if (!selectEl) return;

    selectEl.innerHTML = '<option value="">Day</option>';

    for (let i = 1; i <= 31; i++) {
      const opt = document.createElement("option");
      const val = i < 10 ? "0" + i : String(i);

      opt.value = val;
      opt.textContent = val;
      selectEl.appendChild(opt);
    }
  }

  function populateAllFiscalDays() {
    document.querySelectorAll(".fiscal-day").forEach(populateFiscalDays);
  }

  function getSectionButtons(section) {
    return {
      saveSubmit: section.querySelector(".save-submit-btn"),
      saveExit: section.querySelector(".save-exit-btn"),
      edit: section.querySelector(".edit-btn"),
      cancel: section.querySelector(".cancel-btn")
    };
  }

  function getRequiredFieldsForSection(section) {
    return [
      { el: section.querySelector("#client-card"), name: "Client Card Number" },
      { el: section.querySelector("#organization-name"), name: "Organization Name" },
      { el: section.querySelector("#legal-structure"), name: "Legal Structure" },
      { el: section.querySelector("#organization-legal-status"), name: "Legal Status" },
      { el: section.querySelector("#sector"), name: "Sector" },
      { el: section.querySelector("#organization-type"), name: "Organization Type" },
      { el: section.querySelector("#country-prov"), name: "Country" },
      { el: section.querySelector("#prov"), name: "Prov" }
    ];
  }

  function createContactRow() {
    const row = document.createElement("div");
    row.className = "contact-row";

    row.innerHTML = `
      <select class="contact-type-label">
        <option>Home...</option>
      </select>

      <select class="contact-method">
        <option value="Phone">Phone</option>
        <option value="Cell">Cell</option>
        <option value="Mobile">Mobile</option>
        <option value="Email">Email</option>
        <option value="Url">Url</option>
      </select>

      <input type="text" placeholder="Enter contact information" class="contact-input" />

      <button type="button" class="remove-contact-btn" aria-label="Remove contact row">&times;</button>
    `;

    return row;
  }

  function setupContactList(section) {
    const contactList = section.querySelector(".contact-list");
    const addBtn = section.querySelector(".add-contact-btn-header");

    if (!contactList || !addBtn) return;

    addBtn.addEventListener("click", () => {
      if (section.dataset.locked === "true") return;
      contactList.appendChild(createContactRow());
    });

    contactList.addEventListener("click", (e) => {
      const removeBtn = e.target.closest(".remove-contact-btn");

      if (!removeBtn) return;
      if (section.dataset.locked === "true") return;

      const rows = contactList.querySelectorAll(".contact-row");

      if (rows.length <= 1) {
        const input = rows[0].querySelector(".contact-input");
        if (input) input.value = "";
        return;
      }

      const row = removeBtn.closest(".contact-row");
      if (row) row.remove();
    });
  }

  function validateContactRows(section, sectionLabel, missing) {
    const contactRows = section.querySelectorAll(".contact-list .contact-row");
    let hasAtLeastOneFilledRow = false;

    contactRows.forEach((row) => {
      const input = row.querySelector(".contact-input");

      if (input && input.value.trim() !== "") {
        hasAtLeastOneFilledRow = true;
      }
    });

    if (!hasAtLeastOneFilledRow) {
      missing.push(`${sectionLabel} - Contact Information`);

      const firstInput = section.querySelector(".contact-list .contact-input");
      if (firstInput) firstInput.style.borderColor = "#ef4444";
    } else {
      section.querySelectorAll(".contact-list .contact-input").forEach((input) => {
        input.style.borderColor = "";
      });
    }
  }

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

    missingFields.forEach((item) => {
      listHTML += `<li>${item}</li>`;
    });

    listHTML += "</ul>";

    toast.innerHTML = `
      <div class="toast-header">
        <div class="toast-title">Please fill all required fields marked with red asterisk (*):</div>
        <button class="close-btn" aria-label="Close">&times;</button>
      </div>
      ${listHTML}
    `;

    toast.querySelector(".close-btn").addEventListener("click", () => closeToast(toast));
    document.body.appendChild(toast);
  }

  function showSuccessToast(message, code) {
    removeExistingToasts();

    const toast = document.createElement("div");
    toast.className = "success-toast";
    toast.dataset.code = code;

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

  function setupQuestionIcons(container = document) {
    container.querySelectorAll(".question-icon").forEach((icon) => {
      if (icon.dataset.bound === "true") return;

      icon.dataset.bound = "true";

      icon.addEventListener("click", () => {
        const infoCode = icon.getAttribute("data-code") || "No code";
        showInfoToast(infoCode);
      });
    });
  }

  function validateSection(section) {
    const missing = [];
    const sectionNumber = padStep(Number(section.dataset.step));
    const sectionLabel = `Section ${sectionNumber}`;
    const requiredFields = getRequiredFieldsForSection(section);

    requiredFields.forEach((field) => {
      if (!field.el) return;

      if (field.el.value.trim() === "") {
        missing.push(`${sectionLabel} - ${field.name}`);
        field.el.style.borderColor = "#ef4444";
      } else {
        field.el.style.borderColor = "";
      }
    });

    validateContactRows(section, sectionLabel, missing);

    if (missing.length > 0) {
      showErrorToast(missing);
      return false;
    }

    return true;
  }

  function lockSection(section) {
    section.classList.add("locked-section");
    section.dataset.locked = "true";

    section.querySelectorAll("input, select, .add-contact-btn-header, .remove-contact-btn").forEach((el) => {
      el.disabled = true;
    });

    const buttons = getSectionButtons(section);

    if (buttons.saveSubmit) {
      buttons.saveSubmit.disabled = true;
      buttons.saveSubmit.classList.add("hidden");
    }

    if (buttons.saveExit) {
      buttons.saveExit.disabled = true;
      buttons.saveExit.classList.add("hidden");
    }

    if (buttons.cancel) {
      buttons.cancel.disabled = true;
      buttons.cancel.classList.add("hidden");
    }

    if (buttons.edit) {
      buttons.edit.disabled = false;
      buttons.edit.classList.remove("hidden");
    }
  }

  function unlockSection(section) {
    section.classList.remove("locked-section");
    section.dataset.locked = "false";

    section.querySelectorAll("input, select, .add-contact-btn-header, .remove-contact-btn").forEach((el) => {
      el.disabled = false;
    });

    const buttons = getSectionButtons(section);

    if (buttons.saveSubmit) {
      buttons.saveSubmit.disabled = false;
      buttons.saveSubmit.classList.remove("hidden");
    }

    if (buttons.saveExit) {
      buttons.saveExit.disabled = false;
      buttons.saveExit.classList.remove("hidden");
    }

    if (buttons.cancel) {
      buttons.cancel.disabled = false;
      buttons.cancel.classList.remove("hidden");
    }

    if (buttons.edit) {
      buttons.edit.disabled = false;
      buttons.edit.classList.add("hidden");
    }
  }

  function getStoredOrganizations() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      return [];
    }
  }

  function saveStoredOrganizations(orgs) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(orgs));
  }

  function buildOrganizationData(section) {
    const clientCardNumber = section.querySelector("#client-card")?.value.trim() || "";
    const organizationName = section.querySelector("#organization-name")?.value.trim() || "";
    const tradeName = section.querySelector("#trade-name")?.value.trim() || "";
    const legalStructure = section.querySelector("#legal-structure")?.value || "";
    const organizationLegalStatus = section.querySelector("#organization-legal-status")?.value || "";
    const sector = section.querySelector("#sector")?.value || "";
    const organizationType = section.querySelector("#organization-type")?.value || "";
    const country = section.querySelector("#country-prov")?.value || "";
    const prov = section.querySelector("#prov")?.value || "";
    const legalDoc = section.querySelector(".field-legal-doc input")?.value.trim() || "";
    const dateEstablished = section.querySelector("#date-established")?.value || "";
    const fiscalMonth = section.querySelector(".fiscal-month")?.value || "";
    const fiscalDay = section.querySelector(".fiscal-day")?.value || "";
    const dateDissolved = section.querySelector("#date-dissolved")?.value || "";
    const businessNumber = section.querySelector(".field-business-number input")?.value.trim() || "";
    const hstGst = section.querySelector(".field-hst input")?.value.trim() || "";
    const payroll = section.querySelector(".field-payroll input")?.value.trim() || "";

    const legalAddressInputs = section.querySelectorAll(".address-grid .form-group input");

    const legalAddress = {
      unitApt: legalAddressInputs[0]?.value.trim() || "",
      streetNumber: legalAddressInputs[1]?.value.trim() || "",
      direction: legalAddressInputs[2]?.value.trim() || "",
      streetName: legalAddressInputs[3]?.value.trim() || "",
      city: legalAddressInputs[4]?.value.trim() || "",
      province: legalAddressInputs[5]?.value.trim() || ""
    };

    const contacts = Array.from(section.querySelectorAll(".contact-list .contact-row"))
      .map((row) => ({
        label: row.querySelector(".contact-type-label")?.value || "",
        method: row.querySelector(".contact-method")?.value || "",
        value: row.querySelector(".contact-input")?.value.trim() || ""
      }))
      .filter((item) => item.value !== "");

    return {
      id: `org_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      clientCardNumber,
      organizationName,
      tradeName,
      legalStructure,
      organizationLegalStatus,
      sector,
      organizationType,
      country,
      prov,
      legalDoc,
      dateEstablished,
      fiscalYearEnd: {
        month: fiscalMonth,
        day: fiscalDay
      },
      dateDissolved,
      businessNumber,
      hstGst,
      payroll,
      legalAddress,
      contacts,
      superAdmins: [],
      createdAt: new Date().toISOString()
    };
  }

  function saveOrganizationAndRedirect(section, successCode, successMessage) {
    const newOrganization = buildOrganizationData(section);
    const organizations = getStoredOrganizations();

    organizations.push(newOrganization);
    saveStoredOrganizations(organizations);
    sessionStorage.setItem(SELECTED_ORG_KEY, JSON.stringify(newOrganization));

    showSuccessToast(successMessage, successCode);

    setTimeout(() => {
      window.location.href = "admin-oneklient.html";
    }, 700);
  }

  function setupSectionButtons(section) {
    const buttons = getSectionButtons(section);

    if (buttons.saveSubmit) {
      buttons.saveSubmit.addEventListener("click", () => {
        if (!validateSection(section)) return;

        lockSection(section);

        saveOrganizationAndRedirect(
          section,
          "3000000",
          "Organization saved successfully! Redirecting..."
        );
      });
    }

    if (buttons.saveExit) {
      buttons.saveExit.addEventListener("click", () => {
        if (!validateSection(section)) return;

        saveOrganizationAndRedirect(
          section,
          "3000001",
          "Organization saved successfully! Redirecting..."
        );
      });
    }

    if (buttons.edit) {
      buttons.edit.addEventListener("click", () => {
        unlockSection(section);
      });
    }

    if (buttons.cancel) {
      buttons.cancel.addEventListener("click", () => {
        if (confirm("Are you sure you want to cancel?")) {
          removeExistingToasts();
        }
      });
    }
  }

  setupContactList(mainSection);
  setupSectionButtons(mainSection);
  setupQuestionIcons(document);
  populateAllFiscalDays();
});