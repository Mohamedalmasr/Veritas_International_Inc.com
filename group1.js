/* ===== بيانات مبدئية ===== */
const groups = [
  {
    id: "G1",
    code: "FIN",
    name: "Finance",
    desc: "Handles billing and company finances.",
    leaders: ["Mona Ali"],
    members: ["Omar Saeed", "Sara Nabil", "Youssef Adel", "Laila Kamal"]
  }
];

// أشخاص غير منتمين
const pool = [
  "Abdul Rahman","Amina Yusuf","Ben Carter","Chloe Park",
  "Diego Lopez","Emily Chen","Fatima Ali","George Brown"
];

/* ===== DOM ===== */
const groupsToggle = document.getElementById("groupsToggle");
const groupsPanel  = document.getElementById("groupsPanel");
const currentGroupLabel = document.getElementById("currentGroupLabel");

const unassignedList = document.getElementById("unassignedList");
const toGroupBtn = document.getElementById("toGroupBtn");
const toPoolBtn  = document.getElementById("toPoolBtn");

const groupRoster = document.getElementById("groupRoster");

const groupCodeNameEl = document.getElementById("groupCodeName");
const groupDescEl = document.getElementById("groupDesc");

/* مودال الإضافة */
const addGroupBtn    = document.getElementById("addGroupBtn");
const addGroupModal  = document.getElementById("addGroupModal");
const addGroupClose  = document.getElementById("addGroupClose");
const addGroupCancel = document.getElementById("addGroupCancel");
const addGroupForm   = document.getElementById("addGroupForm");
const addGroupErr    = document.getElementById("addGroupErr");
const newGroupCode   = document.getElementById("newGroupCode");
const newGroupName   = document.getElementById("newGroupName");
const newGroupDesc   = document.getElementById("newGroupDesc");

/* لا يوجد اختيار افتراضي */
let currentIndex = null;

/* ===== Utils ===== */
function uniquePush(arr, val){ if(!arr.includes(val)) arr.push(val); }
function removeFrom(arr, val){ const i = arr.indexOf(val); if(i>-1) arr.splice(i,1); }

/* ===== الأسهم ===== */
function updateArrowsState(){
  const noGroup = currentIndex === null;
  const rightSelCount = [...unassignedList.selectedOptions].length; // يمين
  const leftSelCount  = groupRoster.querySelectorAll('input[type="checkbox"]:checked').length; // شمال

  // ← يحرك من اليمين للشمال
  toGroupBtn.disabled = noGroup || rightSelCount === 0;
  // → يحرك من الشمال لليمين
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

/* ===== Render: Pool (يمين) ===== */
function renderPool(){
  unassignedList.innerHTML = "";
  pool.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name; opt.textContent = name;
    unassignedList.appendChild(opt);
  });
  updateArrowsState();
}

/* ===== Render: Roster (شمال) ===== */
function renderRoster(){
  groupRoster.innerHTML = "";
  if(currentIndex===null){ updateArrowsState(); renderMeta(); return; }

  const g = groups[currentIndex];

  const persons = [
    ...g.leaders.map(n => ({name:n, leader:true})),
    ...g.members.map(n => ({name:n, leader:false}))
  ].filter((p, idx, arr) => idx === arr.findIndex(x => x.name===p.name));

  persons.forEach(p => {
    const row = document.createElement("div");
    row.className = "roster-row";
    row.dataset.name = p.name;

    const pickWrap = document.createElement("label");
    pickWrap.className = "pick";
    pickWrap.title = "Select to remove";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.addEventListener("change", updateArrowsState);
    pickWrap.appendChild(cb);

    const nameEl = document.createElement("span");
    nameEl.className = "name";
    nameEl.textContent = p.name;

    const badge = document.createElement("button");
    badge.type = "button";
    badge.className = "leader-badge";
    badge.setAttribute("aria-pressed", p.leader ? "true" : "false");
    badge.title = p.leader ? "Leader (click to make member)" : "Member (click to make leader)";
    badge.innerHTML = `<span class="dot"></span>`;
    badge.addEventListener("click", () => toggleLeader(p.name));

    row.append(pickWrap, nameEl, badge);
    groupRoster.appendChild(row);
  });

  renderMeta();
  updateArrowsState();
}

/* ===== Render: Meta ===== */
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
function toggleLeader(name){
  if(currentIndex===null) return;
  const g = groups[currentIndex];

  const isLeader = g.leaders.includes(name);
  if(isLeader){
    removeFrom(g.leaders, name);
    uniquePush(g.members, name);
  }else{
    removeFrom(g.members, name);
    uniquePush(g.leaders, name);
  }
  renderRoster();
}

/* ← أضف المختارين من اليمين (Unassigned) إلى الجروب */
toGroupBtn.addEventListener("click", () => {
  if(currentIndex===null) return;
  const selected = [...unassignedList.selectedOptions].map(o => o.value);
  if(!selected.length) return;

  const g = groups[currentIndex];
  selected.forEach(n => {
    removeFrom(pool, n);
    if(!g.leaders.includes(n) && !g.members.includes(n)) g.members.push(n);
  });

  renderPool();
  renderRoster();
  unassignedList.selectedIndex = -1;
  updateArrowsState();
});

/* → رجّع المختارين من الجروب للـ Unassigned */
toPoolBtn.addEventListener("click", () => {
  if(currentIndex===null) return;

  const g = groups[currentIndex];
  const picked = [...groupRoster.querySelectorAll('input[type="checkbox"]:checked')]
    .map(cb => cb.closest(".roster-row")?.dataset.name)
    .filter(Boolean);

  if(!picked.length) return;

  picked.forEach(n => {
    removeFrom(g.leaders, n);
    removeFrom(g.members, n);
    uniquePush(pool, n);
  });

  renderPool();
  renderRoster();
});

/* دبل-كليك لإضافة سريعة من يمين لشمال */
unassignedList.addEventListener("dblclick", () => {
  if(!toGroupBtn.disabled) toGroupBtn.click();
});
unassignedList.addEventListener("change", updateArrowsState);

/* ===== Modal add group ===== */
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

  // فاليديشن بسيط
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

  const newGroup = {
    id: `G${Date.now()}`,
    code, name, desc,
    leaders: [],
    members: []
  };
  groups.push(newGroup);
  currentIndex = groups.length - 1;

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
