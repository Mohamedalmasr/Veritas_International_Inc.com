"use strict";

let organizations = [];
let selectedOrganizationId = null;
let pendingDelete = null;
let searchValue = "";

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

function showSuccessToast(message, timeout = 2200) {
  const area = ensureToastArea();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
    <div>${message}</div>
    <button class="close" type="button" aria-label="Close">✕</button>
  `;

  toast.querySelector(".close").addEventListener("click", () => toast.remove());
  area.appendChild(toast);

  if (timeout > 0) {
    setTimeout(() => toast.remove(), timeout);
  }
}

function getOrganizationDisplayName(organization) {
  return organization.organizationName || organization.name || "Unnamed Organization";
}

function getOrganizationTypeLabel(organization) {
  return organization.organizationType || "No type";
}

function getOrganizationClientCard(organization) {
  return organization.clientCardNumber || "No client card";
}

function normalizeOrganizations(list) {
  return (Array.isArray(list) ? list : []).map((organization) => ({
    ...organization,
    name: organization.organizationName || organization.name || "Unnamed Organization",
    organizationName: organization.organizationName || organization.name || "Unnamed Organization",
    superAdmins: Array.isArray(organization.superAdmins) ? organization.superAdmins : []
  }));
}

function saveOrganizationsState() {
  saveRuntimeOrganizations(organizations);
}

function openDeleteModal(organizationId, adminId, adminName) {
  const modal = document.getElementById("deleteModal");
  const modalText = document.getElementById("deleteModalText");

  pendingDelete = { organizationId, adminId };
  modalText.textContent = `Are you sure you want to delete ${adminName}?`;
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}

function closeDeleteModal() {
  const modal = document.getElementById("deleteModal");
  pendingDelete = null;
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
}

function confirmDelete() {
  if (!pendingDelete) return;

  const { organizationId, adminId } = pendingDelete;
  const organization = getOrganizationById(organizations, organizationId);

  if (!organization) {
    closeDeleteModal();
    return;
  }

  organization.superAdmins = organization.superAdmins.filter((item) => item.id !== adminId);

  saveOrganizationsState();
  updateSelectedOrganizationInSession(organization);
  renderOrganizations();
  renderSelectedOrganizationDetails();
  closeDeleteModal();
  showSuccessToast("SuperAdmin deleted successfully.");
}

function setSelectedOrganization(organizationId) {
  selectedOrganizationId = organizationId;
  sessionStorage.setItem("superAdminSelectedOrganizationId", organizationId);

  const organization = getOrganizationById(organizations, organizationId);
  if (organization) {
    updateSelectedOrganizationInSession(organization);
  }

  renderOrganizations();
  renderSelectedOrganizationDetails();
}

function getFilteredOrganizations() {
  const value = searchValue.trim().toLowerCase();

  if (!value) return organizations;

  return organizations.filter((organization) =>
    getOrganizationDisplayName(organization).toLowerCase().includes(value)
  );
}

function renderOrganizations() {
  const organizationList = document.getElementById("organizationList");
  const filteredOrganizations = getFilteredOrganizations();

  organizationList.innerHTML = "";

  if (!filteredOrganizations.length) {
    organizationList.innerHTML = `<div class="empty-state">No organization found.</div>`;
    return;
  }

  filteredOrganizations.forEach((organization) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className =
      "organization-card" + (organization.id === selectedOrganizationId ? " active" : "");

    card.innerHTML = `
      <div class="organization-name">${getOrganizationDisplayName(organization)}</div>
      <div class="organization-meta">${getOrganizationTypeLabel(organization)} • ${organization.superAdmins.length} SuperAdmins</div>
    `;

    card.addEventListener("click", () => setSelectedOrganization(organization.id));
    organizationList.appendChild(card);
  });
}

function formatGroups(groups) {
  if (!groups || !groups.length) return "—";
  return groups.map((group) => `${group.name} (${group.role})`).join(", ");
}

function renderSelectedOrganizationDetails() {
  const organizationName = document.getElementById("selectedOrganizationName");
  const organizationMeta = document.getElementById("selectedOrganizationMeta");
  const adminsContainer = document.getElementById("adminsContainer");
  const addBtn = document.getElementById("addSuperAdminBtn");

  const organization = getOrganizationById(organizations, selectedOrganizationId);

  if (!organization) {
    organizationName.textContent = "Select an organization";
    organizationMeta.textContent = "Choose an organization from the left side";
    adminsContainer.innerHTML = `
      <div class="empty-state">
        Select an organization from the left side to view its SuperAdmins.
      </div>
    `;
    addBtn.disabled = true;
    return;
  }

  organizationName.textContent = getOrganizationDisplayName(organization);
  organizationMeta.textContent = `${getOrganizationTypeLabel(organization)} • Client Card: ${getOrganizationClientCard(organization)} • Current SuperAdmins: ${organization.superAdmins.length}`;
  addBtn.disabled = false;

  adminsContainer.innerHTML = "";

  if (!organization.superAdmins.length) {
    adminsContainer.innerHTML = `
      <div class="empty-state">
        This organization has no SuperAdmins yet. Click "Add New SuperAdmin" to add the first one.
      </div>
    `;
    return;
  }

  organization.superAdmins.forEach((admin, index) => {
    const phoneValue = admin.phones?.[0]?.number || "—";
    const emailValue = admin.emails?.[0]?.email || "—";

    const card = document.createElement("div");
    card.className = "superadmin-card";

    card.innerHTML = `
      <div class="superadmin-top">
        <div>
          <h3 class="superadmin-name">${admin.title || ""} ${admin.first || ""} ${admin.middle || ""} ${admin.last || ""}</h3>
          <span class="superadmin-role">SuperAdmin ${index + 1}</span>
        </div>

        <div class="superadmin-actions">
          <button
            class="icon-action-btn icon-edit-btn edit-btn"
            type="button"
            title="Edit"
            aria-label="Edit"
            data-organization="${organization.id}"
            data-admin="${admin.id}">
            <span class="icon-pencil">✏️</span>
          </button>

          <button
            class="icon-action-btn icon-delete-btn delete-btn"
            type="button"
            title="Delete"
            aria-label="Delete"
            data-organization="${organization.id}"
            data-admin="${admin.id}"
            data-name="${admin.first || ""} ${admin.last || ""}">
            <span class="icon-cross">✕</span>
          </button>
        </div>
      </div>

      <div class="superadmin-grid">
        <div class="info-box">
          <div class="info-label">Email</div>
          <div class="info-value">${emailValue}</div>
        </div>

        <div class="info-box">
          <div class="info-label">Phone</div>
          <div class="info-value">${phoneValue}</div>
        </div>

        <div class="info-box">
          <div class="info-label">SIN</div>
          <div class="info-value">${admin.sin || "—"}</div>
        </div>

        <div class="info-box">
          <div class="info-label">City</div>
          <div class="info-value">${admin.address?.city || "—"}</div>
        </div>

        <div class="info-box">
          <div class="info-label">Province</div>
          <div class="info-value">${admin.address?.province || "—"}</div>
        </div>

        <div class="info-box">
          <div class="info-label">Groups</div>
          <div class="info-value">${formatGroups(admin.groups)}</div>
        </div>
      </div>
    `;

    adminsContainer.appendChild(card);
  });

  bindAdminActions();
}

function bindAdminActions() {
  document.querySelectorAll(".edit-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const organizationId = button.dataset.organization;
      const adminId = button.dataset.admin;

      sessionStorage.setItem("superAdminFormMode", "edit");
      sessionStorage.setItem("superAdminSelectedOrganizationId", organizationId);
      sessionStorage.setItem("superAdminEditId", adminId);

      window.location.href = "add-superadmin.html";
    });
  });

  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const organizationId = button.dataset.organization;
      const adminId = button.dataset.admin;
      const adminName = button.dataset.name || "this SuperAdmin";
      openDeleteModal(organizationId, adminId, adminName);
    });
  });
}

function pickInitialOrganizationId() {
  const savedSelectedOrganizationId = sessionStorage.getItem("superAdminSelectedOrganizationId");
  if (savedSelectedOrganizationId && getOrganizationById(organizations, savedSelectedOrganizationId)) {
    return savedSelectedOrganizationId;
  }

  const selectedOnboardingOrganization = getSelectedOrganizationFromSession();
  if (selectedOnboardingOrganization?.id && getOrganizationById(organizations, selectedOnboardingOrganization.id)) {
    return selectedOnboardingOrganization.id;
  }

  return organizations[0]?.id || null;
}

document.addEventListener("DOMContentLoaded", () => {
  organizations = normalizeOrganizations(initRuntimeOrganizations());
  selectedOrganizationId = pickInitialOrganizationId();

  renderOrganizations();
  renderSelectedOrganizationDetails();

  const searchInput = document.getElementById("organizationSearch");
  searchInput.addEventListener("input", () => {
    searchValue = searchInput.value || "";
    renderOrganizations();
  });

  const addBtn = document.getElementById("addSuperAdminBtn");
  addBtn.addEventListener("click", () => {
    if (!selectedOrganizationId) return;

    sessionStorage.setItem("superAdminFormMode", "add");
    sessionStorage.setItem("superAdminSelectedOrganizationId", selectedOrganizationId);
    sessionStorage.removeItem("superAdminEditId");

    window.location.href = "add-superadmin.html";
  });

  document.getElementById("deleteCancelBtn")?.addEventListener("click", closeDeleteModal);
  document.getElementById("deleteConfirmBtn")?.addEventListener("click", confirmDelete);

  document.getElementById("deleteModal")?.addEventListener("click", (e) => {
    if (e.target.id === "deleteModal") {
      closeDeleteModal();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeDeleteModal();
    }
  });
});