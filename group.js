/* ===== بيانات مبدئية: FIN فقط ===== */
const groups = [
  {
    id: "G1",
    code: "FIN",
    name: "Finance",
    desc: "Handles billing and company finances.",
    status: "active",
    leaders: ["Mona Ali"],
    members: ["Omar Saeed", "Sara Nabil", "Youssef Adel", "Laila Kamal"]
  }
];

// ناس مش في أي جروب
const pool = [
  "Abdul Rahman","Amina Yusuf","Ben Carter","Chloe Park",
  "Diego Lopez","Emily Chen","Fatima Ali","George Brown"
];

/* ===== عناصر DOM ===== */
const groupsToggle = document.getElementById("groupsToggle");
const groupsPanel  = document.getElementById("groupsPanel");
const currentGroupLabel = document.getElementById("currentGroupLabel");

const unassignedList = document.getElementById("unassignedList");
const toGroupBtn = document.getElementById("toGroupBtn");
const toPoolBtn  = document.getElementById("toPoolBtn");

const groupRoster = document.getElementById("groupRoster");

/* Meta */
const metaCodeEl = document.getElementById("metaCode");
const metaNameEl = document.getElementById("metaName");
const groupDescEl = document.getElementById("groupDesc");
const groupStatusSel = document.getElementById("groupStatus");

/* Modal refs */
const addGroupBtn = document.getElementById("addGroupBtn");
const modal = document.getElementById("addGroupModal");
const confirmAddGroup = document.getElementById("confirmAddGroup");
const cancelAddGroup = document.getElementById("cancelAddGroup");
const newGroupCode = document.getElementById("newGroupCode");
const newGroupName = document.getElementById("newGroupName");
const newGroupDesc = document.getElementById("newGroupDesc");
const newGroupStatus = document.getElementById("newGroupStatus");

/* ===== Brand Status (New / INI) ===== */
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
    alert("This page lets you manage Groups, leaders, and roster members.");
  });
})();

/* لا يوجد اختيار افتراضي */
let currentIndex = null;

/* ===== Utils ===== */
function uniquePush(arr, val){ if(!arr.includes(val)) arr.push(val); }
function removeFrom(arr, val){ const i = arr.indexOf(val); if(i>-1) arr.splice(i,1); }
function openModal(){ modal.classList.remove("hidden"); newGroupCode.focus(); }
function closeModal(){ modal.classList.add("hidden"); clearModal(); }
function clearModal(){
  newGroupCode.value = "";
  newGroupName.value = "";
  newGroupDesc.value = "";
  newGroupStatus.value = "active";
}

/* ===== Modal events ===== */
addGroupBtn.addEventListener("click", openModal);
cancelAddGroup.addEventListener("click", closeModal);
modal.addEventListener("click", (e)=>{
  if (e.target?.dataset?.close === "true") closeModal();
});
document.addEventListener("keydown", (e)=>{
  if (!modal.classList.contains("hidden") && e.key === "Escape") closeModal();
});

confirmAddGroup.addEventListener("click", () => {
  const code = newGroupCode.value.trim().toUpperCase();
  const name = newGroupName.value.trim();
  const desc = newGroupDesc.value.trim();
  const status = newGroupStatus.value; // new | active | inactive

  if (!code || !name){
    alert("Group Code and Group Name are required.");
    return;
  }
  if (groups.some(g => (g.code || "").toUpperCase() === code)){
    alert("This Group Code already exists.");
    return;
  }

  const newGroup = {
    id: "G" + Date.now(),
    code,
    name,
    desc,
    status,
    leaders: [],
    members: []
  };
  groups.push(newGroup);
  currentIndex = groups.length - 1;  // اختار الجروب الجديد مباشرة
  renderAll();
  closeModal();
});

/* الأسهم تفعيلات */
function updateArrowsState(){
  const noGroup = currentIndex === null;
  const leftSelCount = [...unassignedList.selectedOptions].length;
  const rightSelCount = groupRoster.querySelectorAll('input[type="checkbox"]:checked').length;

  toGroupBtn.disabled = noGroup || leftSelCount === 0;
  toPoolBtn.disabled  = noGroup || rightSelCount === 0;
}

/* ===== فتح/غلق ليست الجروبات ===== */
groupsToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  const expanded = groupsToggle.getAttribute("aria-expanded") === "true";
  groupsToggle.setAttribute("aria-expanded", expanded ? "false" : "true");
  groupsPanel.classList.toggle("collapsed", expanded);
});

/* اغلاق عند الضغط خارجها */
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

/* ===== Render: Pool ===== */
function renderPool(){
  unassignedList.innerHTML = "";
  pool.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name; opt.textContent = name;
    unassignedList.appendChild(opt);
  });
  updateArrowsState();
}

/* ===== Render: Roster ===== */
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
    metaCodeEl.textContent = "";
    metaNameEl.textContent = "";
    groupDescEl.value = "";
    if (!["active","inactive"].includes(groupStatusSel.value)) {
      groupStatusSel.value = "active";
    }
    return;
  }

  const g = groups[currentIndex];
  metaCodeEl.textContent = g.code ?? "";
  metaNameEl.textContent = g.name ?? "";
  groupDescEl.value = g.desc ?? "";

  if (!["active","inactive"].includes(groupStatusSel.value)) {
    groupStatusSel.value = "active";
  }
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

/* دبل-كليك للإضافة السريعة */
unassignedList.addEventListener("dblclick", () => {
  if(!toGroupBtn.disabled) toGroupBtn.click();
});
unassignedList.addEventListener("change", updateArrowsState);

/* ===== Init ===== */
function renderAll(){
  renderGroupsList();
  renderPool();
  renderRoster();  // يفرّغ FIN/Finance لحدّ ما تختار جروب
}
renderAll();
