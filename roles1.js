/* ===== بيانات مبدئية: جروب FIN + أدوار ===== */
const groups = [
  {
    id: "G1",
    code: "FIN",
    name: "Finance",
    desc: "Handles billing and company finances.",
    roles: ["Billing Admin", "Approver"]
  }
];

// أدوار عامة غير معيّنة لأي جروب
const poolRoles = [
  "Viewer","Editor","Approver","Billing Admin",
  "Support Agent","Owner","Auditor","Reporter"
];

/* ===== عناصر DOM ===== */
const groupsToggle = document.getElementById("groupsToggle");
const groupsPanel  = document.getElementById("groupsPanel");
const currentGroupLabel = document.getElementById("currentGroupLabel");

const unassignedList = document.getElementById("unassignedList");
const toGroupBtn = document.getElementById("toGroupBtn");
const toPoolBtn  = document.getElementById("toPoolBtn");

const groupRoster = document.getElementById("groupRoster");

const groupCodeNameEl = document.getElementById("groupCodeName");
const groupDescEl = document.getElementById("groupDesc");

/* مودال إضافة جروب */
const addGroupBtn    = document.getElementById("addGroupBtn");
const addGroupModal  = document.getElementById("addGroupModal");
const addGroupClose  = document.getElementById("addGroupClose");
const addGroupCancel = document.getElementById("addGroupCancel");
const addGroupForm   = document.getElementById("addGroupForm");
const addGroupErr    = document.getElementById("addGroupErr");
const newGroupCode   = document.getElementById("newGroupCode");
const newGroupName   = document.getElementById("newGroupName");
const newGroupDesc   = document.getElementById("newGroupDesc");

/* مفيش اختيار افتراضي */
let currentIndex = null;

/* ===== Utils ===== */
function uniquePush(arr, val){ if(!arr.includes(val)) arr.push(val); }
function removeFrom(arr, val){ const i = arr.indexOf(val); if(i>-1) arr.splice(i,1); }

/* تفعيل/تعطيل الأسهم (يسار/يمين) */
function updateArrowsState(){
  const noGroup = currentIndex === null;
  const rightSelCount = [...unassignedList.selectedOptions].length; // يمين
  const leftSelCount  = groupRoster.querySelectorAll('input[type="checkbox"]:checked').length; // شمال

  // ← يضيف من اليمين (Unassigned) للجروب
  toGroupBtn.disabled = noGroup || rightSelCount === 0;
  // → يرجّع من الجروب لليمين
  toPoolBtn.disabled  = noGroup || leftSelCount  === 0;
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

/* ===== Render: قائمة الجروبات ===== */
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

  // الأدوار المستخدمة في كل الجروبات
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

/* ===== Render: Roster (أدوار الجروب الحالي) ===== */
function renderRoster(){
  groupRoster.innerHTML = "";
  if(currentIndex===null){ updateArrowsState(); renderMeta(); return; }

  const g = groups[currentIndex];

  g.roles.forEach(roleName => {
    const row = document.createElement("div");
    row.className = "roster-row";
    row.dataset.name = roleName;

    // اختيار للحذف
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

/* ===== Render: Meta (Code+Name inline + Description) ===== */
function renderMeta(){
  if(currentIndex===null){
    groupCodeNameEl.value = "";
    groupDescEl.value = "";
    return;
  }
  const g = groups[currentIndex];
  groupCodeNameEl.value = `${g.code ?? ""} : ${g.name ?? ""}`;
  groupDescEl.value = g.desc ?? "";
}

/* ===== Actions ===== */

/* ← عيّن أدوار مختارة من اليمين إلى الجروب */
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

/* → أزل الأدوار المختارة من الجروب */
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

/* ===== Modal: Add Group ===== */
function openAddModal(){
  addGroupErr.hidden = true;
  addGroupErr.textContent = "";
  addGroupModal.hidden = false;
  requestAnimationFrame(()=> newGroupCode?.focus());
}
function closeAddModal(){
  addGroupModal.hidden = true;
  addGroupForm.reset();
}

addGroupBtn.addEventListener("click", openAddModal);
addGroupClose.addEventListener("click", closeAddModal);
addGroupCancel.addEventListener("click", closeAddModal);
addGroupModal.addEventListener("click", (e)=>{ if(e.target === addGroupModal) closeAddModal(); });
document.addEventListener("keydown", (e)=>{ if(!addGroupModal.hidden && e.key === "Escape") closeAddModal(); });

addGroupForm.addEventListener("submit", (e)=>{
  e.preventDefault();
  const code = newGroupCode.value.trim();
  const name = newGroupName.value.trim();
  const desc = newGroupDesc.value.trim();

  if(!code || !name){
    addGroupErr.textContent = "Code and Name are required.";
    addGroupErr.hidden = false;
    return;
  }
  const exists = groups.some(g => g.code.toLowerCase() === code.toLowerCase());
  if(exists){
    addGroupErr.textContent = "A group with this code already exists.";
    addGroupErr.hidden = false;
    return;
  }

  const newGroup = { id:`G${Date.now()}`, code, name, desc, roles: [] };
  groups.push(newGroup);
  currentIndex = groups.length - 1;       // اختاره تلقائيًا
  closeAddModal();
  renderAll();
});

/* ===== Render All ===== */
function renderAll(){
  renderGroupsList();
  renderPool();
  renderRoster();
}

/* Init */
renderAll();
