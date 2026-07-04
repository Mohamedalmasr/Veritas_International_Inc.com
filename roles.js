/* ===== بيانات مبدئية: جروب FIN + أدوار ===== */
const groups = [
  {
    id: "G1",
    code: "FIN",
    name: "Finance",
    desc: "Handles billing and company finances.",
    roles: ["Billing Admin", "Approver"] // أدوار معيّنة للجروب
  }
];

// أدوار عامة غير معيّنة لأي جروب
const poolRoles = [
  "Viewer",
  "Editor",
  "Approver",
  "Billing Admin",
  "Support Agent",
  "Owner",
  "Auditor",
  "Reporter"
];

/* ===== عناصر DOM ===== */
const groupsToggle = document.getElementById("groupsToggle");
const groupsPanel  = document.getElementById("groupsPanel");
const currentGroupLabel = document.getElementById("currentGroupLabel");

const unassignedList = document.getElementById("unassignedList");
const toGroupBtn = document.getElementById("toGroupBtn");
const toPoolBtn  = document.getElementById("toPoolBtn");

const groupRoster = document.getElementById("groupRoster");

const groupCodeEl = document.getElementById("groupCode");
const groupNameEl = document.getElementById("groupName");
const groupDescEl = document.getElementById("groupDesc");

/* ===== Brand Status (New / INI) — نفس اللي في الهوم/جروب ===== */
(function brandStatus(){
  const area = document.getElementById("statusArea");
  const chip = document.getElementById("statusChip");
  const help = document.getElementById("helpBtn");

  let statusText = "";
  try {
    const org  = sessionStorage.getItem("orgid");
    const lic  = sessionStorage.getItem("license");
    const ok   = sessionStorage.getItem("ok_auth") === "true";
    if (ok && org === "19" && lic === "19") statusText = "New";
    else if (ok && org === "15" && lic === "15") statusText = "INI";
  } catch (_) {}

  if (statusText && area && chip) {
    chip.textContent = statusText;
    area.hidden = false;
  } else if (area) {
    area.hidden = true;
  }

  help?.addEventListener("click", () => {
    alert("This page lets you manage Roles assigned to a selected group.");
  });
})();

/* مفيش اختيار افتراضي */
let currentIndex = null;

/* ===== Utils ===== */
function uniquePush(arr, val){ if(!arr.includes(val)) arr.push(val); }
function removeFrom(arr, val){ const i = arr.indexOf(val); if(i>-1) arr.splice(i,1); }

/* تفعيل/تعطيل الأسهم */
function updateArrowsState(){
  const noGroup = currentIndex === null;
  const leftSelCount = [...unassignedList.selectedOptions].length;
  const rightSelCount = groupRoster.querySelectorAll('input[type="checkbox"]:checked').length;

  toGroupBtn.disabled = noGroup || leftSelCount === 0;
  toPoolBtn.disabled  = noGroup || rightSelCount === 0;
}

/* ===== Dropdown الجروبات ===== */
groupsToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  const expanded = groupsToggle.getAttribute("aria-expanded") === "true";
  groupsToggle.setAttribute("aria-expanded", expanded ? "false" : "true");
  groupsPanel.classList.toggle("collapsed", expanded);
});
document.addEventListener("click", (e) => {
  const isInside = groupsToggle.contains(e.target) || groupsPanel.contains(e.target);
  if (!isInside && groupsToggle.getAttribute("aria-expanded") === "true") {
    groupsToggle.setAttribute("aria-expanded", "false");
    groupsPanel.classList.add("collapsed");
  }
});

/* ===== Render: قائمة الجروبات (FIN فقط) ===== */
function renderGroupsList(){
  groupsPanel.innerHTML = "";

  groups.forEach((g, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "item" + (i === currentIndex ? " active" : "");
    btn.setAttribute("role", "option");
    btn.innerHTML = `<span class="code">${g.code}</span><span class="name">${g.name}</span>`;
    btn.addEventListener("click", () => {
      currentIndex = i;
      currentGroupLabel.textContent = g.name;
      groupsToggle.setAttribute("aria-expanded", "false");
      groupsPanel.classList.add("collapsed");
      renderAll();
    });
    groupsPanel.appendChild(btn);
  });

  currentGroupLabel.textContent =
    currentIndex===null ? "Select group…" : (groups[currentIndex]?.name ?? "Select group…");
}

/* ===== Render: Pool (الأدوار غير المعيّنة) ===== */
function renderPool(){
  unassignedList.innerHTML = "";

  // الأدوار اللي مش موجودة داخل الجروب المختار
  const used = new Set();
  groups.forEach(g => g.roles.forEach(r => used.add(r)));

  poolRoles
    .filter(r => !used.has(r))
    .forEach(role => {
      const opt = document.createElement("option");
      opt.value = role; opt.textContent = role;
      unassignedList.appendChild(opt);
    });

  updateArrowsState();
}

/* ===== Render: Roster (أدوار الجروب) ===== */
function renderRoster(){
  groupRoster.innerHTML = "";
  if(currentIndex===null){ updateArrowsState(); renderMeta(); return; }

  const g = groups[currentIndex];

  g.roles.forEach(roleName => {
    const row = document.createElement("div");
    row.className = "roster-row";
    row.dataset.name = roleName;

    const pickWrap = document.createElement("label");
    pickWrap.className = "pick";
    pickWrap.title = "Select to remove";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.addEventListener("change", updateArrowsState);
    pickWrap.appendChild(cb);

    const nameEl = document.createElement("span");
    nameEl.className = "name";
    nameEl.textContent = roleName;

    row.append(pickWrap, nameEl);
    groupRoster.appendChild(row);
  });

  renderMeta();
  updateArrowsState();
}

/* ===== Render: Meta (Code / Name / Description) ===== */
function renderMeta(){
  if(currentIndex===null){
    groupCodeEl.value = "";
    groupNameEl.value = "";
    groupDescEl.value = "";
    return;
  }
  const g = groups[currentIndex];
  groupCodeEl.value = g.code ?? "";
  groupNameEl.value = g.name ?? "";
  groupDescEl.value = g.desc ?? "";
}

/* ===== Actions ===== */
toGroupBtn.addEventListener("click", () => {
  if(currentIndex===null) return;

  const selected = [...unassignedList.selectedOptions].map(o => o.value);
  if(!selected.length) return;

  const g = groups[currentIndex];
  selected.forEach(role => uniquePush(g.roles, role));

  renderPool();
  renderRoster();

  unassignedList.selectedIndex = -1;
  updateArrowsState();
});

toPoolBtn.addEventListener("click", () => {
  if(currentIndex===null) return;

  const g = groups[currentIndex];
  const picked = [...groupRoster.querySelectorAll('input[type="checkbox"]:checked')]
    .map(cb => cb.closest(".roster-row")?.dataset.name)
    .filter(Boolean);

  if(!picked.length) return;

  picked.forEach(role => removeFrom(g.roles, role));

  renderPool();
  renderRoster();
});

/* دبل-كليك للإضافة السريعة */
unassignedList.addEventListener("dblclick", () => {
  if(!toGroupBtn.disabled) toGroupBtn.click();
});
unassignedList.addEventListener("change", updateArrowsState);

/* ===== Render All / Init ===== */
function renderAll(){
  renderGroupsList();
  renderPool();
  renderRoster();
}
renderAll();
