"use strict";

function ready(fn) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn);
  } else {
    fn();
  }
}

function $(selector) {
  return document.querySelector(selector);
}

function showToast(msg, type = "success", timeout = 2200) {
  let area = document.getElementById("toastAreaRight");
  if (!area) {
    area = document.createElement("div");
    area.id = "toastAreaRight";
    area.className = "toast-area right";
    document.body.appendChild(area);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="msg">${msg}</div>
    <button class="close" type="button" aria-label="Close">✕</button>
  `;

  const closeBtn = toast.querySelector(".close");
  closeBtn.addEventListener("click", () => toast.remove());

  area.appendChild(toast);

  if (timeout > 0) {
    setTimeout(() => {
      toast.remove();
    }, timeout);
  }
}

function generateId() {
  return "sa_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
}

function getOrganizations() {
  try {
    const raw = sessionStorage.getItem("onboardingOrganizations");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveOrganizations(organizations) {
  sessionStorage.setItem("onboardingOrganizations", JSON.stringify(organizations));
}

function getSelectedOrganizationId() {
  const directId = sessionStorage.getItem("superAdminSelectedOrganizationId");
  if (directId) return directId;
  try {
    const raw = sessionStorage.getItem("selectedOnboardingOrganization");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.id || null;
  } catch (error) {
    return null;
  }
}

function getOrganizationById(organizations, id) {
  return organizations.find((org) => org.id === id) || null;
}

// دالات مصنع لإنشاء أسطر المدخلات ديناميكياً بتناسق مع الـ Theme الجديد لزر الحذف الأحمر
function createPhoneRow() {
  const div = document.createElement("div");
  div.className = "line phone-line";
  div.innerHTML = `
    <label class="field compact">
      <span class="meta-title">Type</span>
      <select class="phone-type" required>
        <option value="">Select…</option>
        <option>Phone</option>
        <option>Fax</option>
        <option>Mobile</option>
      </select>
    </label>
    <label class="field grow">
      <span class="meta-title">Phone Number</span>
      <input class="phone-input" type="tel" placeholder="(506) 452-1342" required />
    </label>
    <label class="field compact ext-col">
      <span class="meta-title">Ext</span>
      <input class="ext-input" type="text" placeholder="Ext" maxlength="7" />
    </label>
    <button type="button" class="icon-btn remove-line" aria-label="Remove phone">✕</button>
  `;
  div.querySelector(".remove-line").addEventListener("click", () => div.remove());
  return div;
}

function createEmailRow() {
  const div = document.createElement("div");
  div.className = "line email-line";
  div.innerHTML = `
    <label class="field compact">
      <span class="meta-title">Type</span>
      <select class="email-type" required>
        <option value="">Select…</option>
        <option>Office</option>
        <option>Home</option>
        <option>School</option>
      </select>
    </label>
    <label class="field grow">
      <span class="meta-title">Email</span>
      <input class="email-input" type="email" placeholder="name@example.com" required />
    </label>
    <button type="button" class="icon-btn remove-line" aria-label="Remove email">✕</button>
  `;
  div.querySelector(".remove-line").addEventListener("click", () => div.remove());
  return div;
}

function createUrlRow() {
  const div = document.createElement("div");
  div.className = "line url-line";
  div.innerHTML = `
    <label class="field grow">
      <span class="meta-title">URL</span>
      <input class="url-input" type="url" placeholder="https://example.com" />
    </label>
    <button type="button" class="icon-btn remove-line" aria-label="Remove URL">✕</button>
  `;
  div.querySelector(".remove-line").addEventListener("click", () => div.remove());
  return div;
}

function clearDynamicLines(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const lines = container.querySelectorAll(".line");
  lines.forEach((line) => {
    if (!line.hasAttribute("data-root")) {
      line.remove();
    }
  });
}

ready(() => {
  const form = $("#superAdminForm");
  const organizationNameView = $("#organizationNameView");
  const pwToggle = $("#pwToggle");
  const pwInput = $("#ipPassword");
  const backBtn = $(".back-btn");

  if (backBtn) {
    backBtn.setAttribute("href", "entities.html");
  }

  const mode = sessionStorage.getItem("superAdminFormMode") || "add";
  const editId = sessionStorage.getItem("superAdminEditId");

  let organizations = getOrganizations();
  const selectedOrganizationId = getSelectedOrganizationId();
  const organization = getOrganizationById(organizations, selectedOrganizationId);

  if (organization) {
    if (!Array.isArray(organization.superAdmins)) organization.superAdmins = [];
    organizationNameView.value = organization.organizationName || organization.name || "";
  }

  const pageTitle = $("#ip-title");
  if (pageTitle) {
    pageTitle.textContent = mode === "edit" ? "Edit SuperAdmin" : "Add New SuperAdmin";
  }

  pwToggle?.addEventListener("click", () => {
    const isHidden = pwInput.type === "password";
    pwInput.type = isHidden ? "text" : "password";
    pwToggle.classList.toggle("eye-off", !isHidden);
  });

  // تفعيل أحداث أزرار الإضافة للأسطر
  document.querySelectorAll(".add-line-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const container = document.getElementById(targetId);
      const type = btn.getAttribute("data-type");

      if (type === "phone") container.appendChild(createPhoneRow());
      if (type === "email") container.appendChild(createEmailRow());
      if (type === "url") container.appendChild(createUrlRow());
    });
  });

  // تفعيل حدث الحذف لأسطر الحذف الابتدائية إن وجدت (غير الـ root)
  document.querySelectorAll(".line:not([data-root='true']) .remove-line").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.target.closest(".line").remove();
    });
  });

  let currentAdmin = null;
  if (mode === "edit" && editId && organization) {
    currentAdmin = organization.superAdmins.find((admin) => admin.id === editId) || null;
    if (currentAdmin) fillForm(currentAdmin);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!organization) {
      showToast("No organization context found.", "error");
      return;
    }

    const title = $("#indTitle").value.trim();
    const first = $("#indFirst").value.trim();
    const last = $("#indLast").value.trim();
    const password = $("#ipPassword").value.trim();

    const phoneLines = document.querySelectorAll("#indPhones .line");
    const phonesPayload = Array.from(phoneLines).map((line) => ({
      type: line.querySelector(".phone-type")?.value || "",
      number: line.querySelector(".phone-input")?.value.trim() || "",
      ext: line.querySelector(".ext-input")?.value || ""
    }));

    const emailLines = document.querySelectorAll("#indEmails .line");
    const emailsPayload = Array.from(emailLines).map((line) => ({
      type: line.querySelector(".email-type")?.value || "",
      email: line.querySelector(".email-input")?.value.trim() || ""
    }));

    const urlLines = document.querySelectorAll("#indUrls .line");
    const urlsPayload = Array.from(urlLines)
      .map((line) => line.querySelector(".url-input")?.value.trim() || "")
      .filter((url) => url !== "");

    const firstPhoneNumber = phonesPayload[0]?.number;
    const firstEmailValue = emailsPayload[0]?.email;

    if (!title || !first || !last || !firstPhoneNumber || !firstEmailValue || !password) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    const adminPayload = {
      id: currentAdmin?.id || generateId(),
      role: "SuperAdmin",
      organizationId: organization.id,
      title,
      first,
      middle: $("#indMiddle").value.trim(),
      last,
      phones: phonesPayload,
      emails: emailsPayload,
      urls: urlsPayload,
      address: {
        streetNo: $("#addrStreetNo").value.trim(),
        unit: $("#addrUnit").value.trim(),
        streetName: $("#addrStreetName").value.trim(),
        dir: $("#addrDirection").value.trim(),
        city: $("#addrCity").value.trim(),
        province: $("#addrProvince").value.trim(),
        postal: $("#addrPostal").value.trim(),
        country: $("#addrCountry").value.trim()
      },
      password,
      updatedAt: new Date().toISOString()
    };

    const orgIndex = organizations.findIndex((org) => org.id === organization.id);
    if (mode === "edit" && currentAdmin) {
      const adminIndex = organizations[orgIndex].superAdmins.findIndex((a) => a.id === currentAdmin.id);
      organizations[orgIndex].superAdmins[adminIndex] = adminPayload;
    } else {
      organizations[orgIndex].superAdmins.push(adminPayload);
    }

    saveOrganizations(organizations);
    showToast(mode === "edit" ? "SuperAdmin updated!" : "SuperAdmin added!");
  });

  function fillForm(admin) {
    $("#indTitle").value = admin.title || "";
    $("#indFirst").value = admin.first || "";
    $("#indMiddle").value = admin.middle || "";
    $("#indLast").value = admin.last || "";
    $("#indDob").value = admin.dob || "";
    $("#indSin").value = admin.sin || "";

    clearDynamicLines("indPhones");
    clearDynamicLines("indEmails");
    clearDynamicLines("indUrls");

    if (Array.isArray(admin.phones) && admin.phones.length > 0) {
      admin.phones.forEach((phone, idx) => {
        if (idx === 0) {
          const root = document.querySelector("#indPhones .line[data-root='true']");
          if (root) {
            root.querySelector(".phone-type").value = phone.type || "";
            root.querySelector(".phone-input").value = phone.number || "";
            root.querySelector(".ext-input").value = phone.ext || "";
          }
        } else {
          const container = document.getElementById("indPhones");
          const row = createPhoneRow();
          row.querySelector(".phone-type").value = phone.type || "";
          row.querySelector(".phone-input").value = phone.number || "";
          row.querySelector(".ext-input").value = phone.ext || "";
          container.appendChild(row);
        }
      });
    }

    if (Array.isArray(admin.emails) && admin.emails.length > 0) {
      admin.emails.forEach((email, idx) => {
        if (idx === 0) {
          const root = document.querySelector("#indEmails .line[data-root='true']");
          if (root) {
            root.querySelector(".email-type").value = email.type || "";
            root.querySelector(".email-input").value = email.email || "";
          }
        } else {
          const container = document.getElementById("indEmails");
          const row = createEmailRow();
          row.querySelector(".email-type").value = email.type || "";
          row.querySelector(".email-input").value = email.email || "";
          container.appendChild(row);
        }
      });
    }

    if (Array.isArray(admin.urls) && admin.urls.length > 0) {
      admin.urls.forEach((url, idx) => {
        if (idx === 0) {
          const root = document.querySelector("#indUrls .line[data-root='true']");
          if (root) {
            root.querySelector(".url-input").value = url || "";
          }
        } else {
          const container = document.getElementById("indUrls");
          const row = createUrlRow();
          row.querySelector(".url-input").value = url || "";
          container.appendChild(row);
        }
      });
    }

    $("#addrStreetNo").value = admin.address?.streetNo || "";
    $("#addrUnit").value = admin.address?.unit || "";
    $("#addrStreetName").value = admin.address?.streetName || "";
    $("#addrDirection").value = admin.address?.dir || "";
    $("#addrCity").value = admin.address?.city || "";
    $("#addrProvince").value = admin.address?.province || "";
    $("#addrPostal").value = admin.address?.postal || "";
    $("#addrCountry").value = admin.address?.country || "";
    $("#ipPassword").value = admin.password || "";
  }
});