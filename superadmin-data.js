const ONBOARDING_STORAGE_KEY = "onboardingOrganizations";
const SELECTED_ORG_KEY = "selectedOnboardingOrganization";

function wasPageReloaded() {
  try {
    const navEntries = performance.getEntriesByType("navigation");
    if (navEntries && navEntries.length > 0) {
      return navEntries[0].type === "reload";
    }

    if (performance.navigation) {
      return performance.navigation.type === 1;
    }
  } catch (error) {}

  return false;
}

function clearSuperAdminSessionOnReload() {
  if (!wasPageReloaded()) return;

  sessionStorage.removeItem(ONBOARDING_STORAGE_KEY);
  sessionStorage.removeItem(SELECTED_ORG_KEY);
  sessionStorage.removeItem("superAdminSelectedOrganizationId");
  sessionStorage.removeItem("superAdminFormMode");
  sessionStorage.removeItem("superAdminEditId");
  sessionStorage.removeItem("superAdminLastSavedAdminId");
  sessionStorage.removeItem("superAdminLastSavedOrganizationId");
}

function getOrganizationsFromOnboarding() {
  try {
    const raw = sessionStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((org) => ({
      ...org,
      name: org.organizationName || org.name || "",
      organizationName: org.organizationName || org.name || "",
      superAdmins: Array.isArray(org.superAdmins) ? org.superAdmins : []
    }));
  } catch (error) {
    return [];
  }
}

function saveOrganizationsToOnboarding(organizations) {
  sessionStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(organizations));
}

function initRuntimeOrganizations() {
  clearSuperAdminSessionOnReload();

  const organizations = getOrganizationsFromOnboarding();
  saveOrganizationsToOnboarding(organizations);
  return organizations;
}

function saveRuntimeOrganizations(data) {
  saveOrganizationsToOnboarding(data);
}

function getOrganizationById(organizations, id) {
  return organizations.find((org) => org.id === id) || null;
}

function getSuperAdminById(organization, superAdminId) {
  if (!organization || !Array.isArray(organization.superAdmins)) return null;
  return organization.superAdmins.find((admin) => admin.id === superAdminId) || null;
}

function getSelectedOrganizationFromSession() {
  try {
    const raw = sessionStorage.getItem(SELECTED_ORG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function updateSelectedOrganizationInSession(updatedOrganization) {
  sessionStorage.setItem(SELECTED_ORG_KEY, JSON.stringify(updatedOrganization));
}