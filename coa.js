/* =========================================================
   COA page logic + Sidebar dropdowns + Group focus
   + Add item modal + Edit item modal + Drag & Drop
========================================================= */

/* ---------- الداتا (وهمية) ---------- */
const DATA = {
  assets: {
    name: "Assets",
    subs: [
      {
        id: "current",
        name: "Current Assets",
        groups: [
          { name: "Cash", items: ["Cash on Hand", "Petty Cash Box"] },
          { name: "Bank", items: ["RBC - Operating", "CIBC - Payroll", "TD - Savings"] },
          { name: "Accounts Receivable", items: ["AR - Domestic", "AR - Export"] },
          { name: "Marketable Securities", items: ["Mutual Fund A", "Treasury Bills"] },
        ],
      },
      {
        id: "inventory",
        name: "Inventory Assets",
        groups: [
          { name: "Raw Materials", items: ["Steel", "Plastic", "Electronics Parts"] },
          { name: "Work in Progress", items: ["Batch #102", "Batch #103"] },
          { name: "Finished Goods", items: ["Model A", "Model B"] },
        ],
      },
      {
        id: "capital",
        name: "Capital Assets",
        groups: [
          { name: "Machinery & Equipment", items: ["CNC Machine 1", "Forklift"] },
          { name: "Furniture & Fixtures", items: ["Desks", "Chairs", "Shelving"] },
          { name: "Vehicles", items: ["Truck #1", "Van #3"] },
          { name: "Buildings", items: ["Warehouse A", "Office HQ"] },
        ],
      },
      {
        id: "noncurrent",
        name: "Other Non-Current Assets",
        groups: [
          { name: "Intangibles", items: ["Patent X", "Trademark Y"] },
          { name: "Long-term Investments", items: ["Bond 2030", "Equity Stake Z"] },
        ],
      },
    ],
  },

  liabilities: {
    name: "Liabilities",
    groups: [
      { name: "Current Liabilities", items: ["Accounts Payable", "Accrued Expenses", "Short-Term Loans"] },
      { name: "Taxes Payable", items: ["Income Tax Payable", "Sales Tax Payable"] },
      { name: "Long-term Liabilities", items: ["Bank Loan - 5y", "Lease Obligation"] },
    ],
  },

  equity: {
    name: "Equity",
    groups: [
      { name: "Owner's Equity", items: ["Owner Capital", "Owner Drawings"] },
      { name: "Share Capital", items: ["Common Shares", "Preferred Shares"] },
      { name: "Retained Earnings", items: ["Retained Earnings"] },
    ],
  },

  revenue: {
    name: "Revenue",
    groups: [
      { name: "Sales Revenue", items: ["Product Sales", "Online Sales"] },
      { name: "Service Revenue", items: ["Installation Fees", "Consulting Fees"] },
      { name: "Other Income", items: ["Interest Income", "Rental Income"] },
    ],
  },

  expenses: {
    name: "Expenses",
    groups: [
      { name: "Cost of Goods Sold", items: ["Raw Materials", "Direct Labor", "Manufacturing Overhead"] },
      { name: "Operating Expenses", items: ["Rent", "Utilities", "Insurance", "Office Supplies"] },
      { name: "Sales & Marketing", items: ["Ads", "Promotions", "Commissions"] },
      { name: "General & Admin", items: ["Salaries", "Legal Fees", "Accounting Fees"] },
    ],
  },
};

/* ---------- DOM ---------- */
const leftList   = document.getElementById("leftList");
const btnAll     = document.getElementById("btn-all");
const titleEl    = document.getElementById("rightTitle");
const contentBox = document.getElementById("rightBox");
const backBtn    = document.getElementById("backBtn");

/* Focus bar */
const focusBar     = document.getElementById("focusBar");
const exitFocusBtn = document.getElementById("exitFocusBtn");
const focusCrumbs  = document.getElementById("focusCrumbs");

/* ---------- Modal Refs (Edit Item) ---------- */
const editModal     = document.getElementById("editModal");
const modalCrumbs   = document.getElementById("modalCrumbs");
const mInput        = document.getElementById("editInput");
const mLevel        = document.getElementById("levelSelect");
const tangibleTgl   = document.getElementById("tangibleToggle");
const amortFlag     = document.querySelector(".amort-flag");
const amortizeCbx   = document.getElementById("amortize");
const amortFields   = document.getElementById("amortFields");
const btnSave       = document.getElementById("modalSave");
const btnCancel     = document.getElementById("modalCancel");

/* ---------- Modal Refs (Add Item) ---------- */
const addModal   = document.getElementById("addModal");
const addCrumbs  = document.getElementById("addCrumbs");
const addInput   = document.getElementById("addInput");
const addCancel  = document.getElementById("addCancel");
const addConfirm = document.getElementById("addConfirm");

let editingLI = null;
let addTargetUL = null;

/* --------- سياق العرض الحالي --------- */
let context = {
  mode: "all",          // "all" | "cat" | "assets-sub" | "group-only"
  cat: null,            // assets | liabilities | ...
  subId: null,          // للـ assets فقط
  groupName: null       // عند التركيز على جروب
};

/* Helpers */
function escapeHtml(str){ return (str || "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function clearNode(el){ while(el.firstChild) el.removeChild(el.firstChild); }
function getGroupRef(catKey, subId, groupName){
  if (catKey === "assets") {
    const sub = DATA.assets.subs.find(s=>s.id===subId);
    if(!sub) return null;
    return sub.groups.find(g=>g.name===groupName) || null;
  } else {
    const cat = DATA[catKey];
    if(!cat) return null;
    return cat.groups.find(g=>g.name===groupName) || null;
  }
}
function syncListToData(ul){
  const cat  = ul.dataset.cat;
  const sub  = ul.dataset.sub || null;
  const g    = ul.dataset.group;
  const items = Array.from(ul.querySelectorAll("li .li-text")).map(s=>s.textContent.trim());
  const grp = getGroupRef(cat, sub, g);
  if (grp) grp.items = items;
}

/* Sidebar builder */
function buildSidebar(){
  clearNode(leftList);
  const defs = [
    { key:"assets",      label:"ASSETS",      hasSub:true  },
    { key:"liabilities", label:"LIABILITIES", hasSub:true  },
    { key:"equity",      label:"EQUITY",      hasSub:true  },
    { key:"revenue",     label:"REVENUE",     hasSub:true  },
    { key:"expenses",    label:"EXPENSES",    hasSub:true  },
  ];

  defs.forEach(def=>{
    const a = document.createElement("a");
    a.href = "#";
    a.className = "coa-btn has-sub";
    a.dataset.key = def.key;
    a.setAttribute("role","button");
    a.setAttribute("aria-expanded","false");
    a.setAttribute("aria-selected","false");
    a.textContent = def.label;
    leftList.appendChild(a);

    const subWrap = document.createElement("div");
    subWrap.className = "coa-sublist";
    subWrap.id = `${def.key}-sublist`;
    leftList.appendChild(subWrap);

    if (def.key === "assets"){
      DATA.assets.subs.forEach(s=>{
        const sb = document.createElement("a");
        sb.href="#"; sb.className="coa-subbtn"; sb.setAttribute("role","button");
        sb.dataset.sub = s.id; sb.textContent = s.name;
        subWrap.appendChild(sb);
      });
    } else {
      const groups = DATA[def.key]?.groups || [];
      groups.forEach(g=>{
        const sb = document.createElement("a");
        sb.href="#"; sb.className="coa-subbtn"; sb.setAttribute("role","button");
        sb.dataset.group = g.name; sb.textContent = g.name;
        subWrap.appendChild(sb);
      });
    }
  });
}

/* Renderers */
function groupBlockHTML(catKey, subId, group){
  const ulAttrs = `class="plain-list" data-sortable="1" data-cat="${catKey}" ${subId?`data-sub="${subId}"`:""} data-group="${escapeHtml(group.name)}"`;
  const lis = group.items.map(it => `
    <li draggable="true">
      <span class="li-text">${escapeHtml(it)}</span>
      <span class="li-actions">
        <button type="button" class="icon-btn" data-edit="1" aria-label="Edit">✏️</button>
      </span>
    </li>
  `).join("");

  /* مفيش قلم في هيدر الجروب — فقط زر + */
  return `
    <div class="group-block" data-cat="${catKey}" ${subId?`data-sub="${subId}"`:""} data-group="${escapeHtml(group.name)}">
      <div class="group-head">
        <button class="group-tag" type="button" title="Focus '${escapeHtml(group.name)}'">${escapeHtml(group.name)}</button>
        <div class="group-actions">
          <button class="icon-btn add-item" type="button" title="Add item" aria-label="Add item">＋</button>
        </div>
      </div>
      <ul ${ulAttrs}>${lis}</ul>
    </div>
  `;
}

function htmlForSub(sub){
  if(!sub || !sub.groups?.length) return `<p class="muted">No items in this section yet.</p>`;
  return sub.groups.map(g => groupBlockHTML("assets", sub.id, g)).join("");
}
function htmlForCategory(catKey){
  if (catKey === "assets"){
    return DATA.assets.subs.map(sub => `
      <h3 class="cat-title">${escapeHtml(sub.name)}</h3>
      ${htmlForSub(sub)}
    `).join("");
  } else {
    const cat = DATA[catKey];
    if (!cat || !cat.groups?.length) return `<p class="muted">No items in ${escapeHtml(cat?.name||"")} yet.</p>`;
    return `
      <h3 class="cat-title">${escapeHtml(cat.name)}</h3>
      ${cat.groups.map(g => groupBlockHTML(catKey, null, g)).join("")}
    `;
  }
}
function renderAllCategories(){
  titleEl.textContent = "All Accounts";
  focusBar.classList.add("hidden");
  contentBox.innerHTML = ["assets","liabilities","equity","revenue","expenses"].map(k => htmlForCategory(k)).join("");
  context = { mode:"all", cat:null, subId:null, groupName:null };
}
function renderAssetsAll(){
  titleEl.textContent = "Assets";
  focusBar.classList.add("hidden");
  contentBox.innerHTML = htmlForCategory("assets");
  context = { mode:"cat", cat:"assets", subId:null, groupName:null };
}
function renderAssetsSub(subId){
  const sub = DATA.assets.subs.find(s=>s.id === subId);
  titleEl.textContent = sub ? sub.name : "Assets";
  focusBar.classList.add("hidden");
  contentBox.innerHTML = sub ? htmlForSub(sub) : `<p class="muted">Choose a subcategory.</p>`;
  context = { mode:"assets-sub", cat:"assets", subId: sub ? sub.id : null, groupName:null };
}
function renderCategoryOnly(catKey){
  const cat = DATA[catKey];
  titleEl.textContent = cat ? cat.name : "Select a category";
  focusBar.classList.add("hidden");
  contentBox.innerHTML = htmlForCategory(catKey);
  context = { mode:"cat", cat:catKey, subId:null, groupName:null };
}
function renderGroupOnly(catKey, subId, groupName){
  const grp = getGroupRef(catKey, subId, groupName);
  if (!grp) return;

  const where = [];
  if (catKey === "assets"){
    const sub = DATA.assets.subs.find(s=>s.id===subId);
    where.push("Assets");
    if (sub) where.push(sub.name);
  } else {
    where.push(DATA[catKey].name);
  }
  where.push(groupName);

  titleEl.textContent = groupName;
  focusBar.classList.remove("hidden");
  focusCrumbs.textContent = where.join(" • ");
  contentBox.innerHTML = groupBlockHTML(catKey, subId, grp);
  context = { mode:"group-only", cat:catKey, subId, groupName };
}

/* Sidebar interactions */
function markActiveMain(btn){
  document.querySelectorAll(".coa-btn").forEach(b=>{
    b.classList.remove("is-active");
    b.setAttribute("aria-selected","false");
  });
  btn?.classList.add("is-active");
  btn?.setAttribute("aria-selected","true");
  btnAll.setAttribute("aria-selected", btn ? "false":"true");
}
function clearActiveSubs(){
  document.querySelectorAll(".coa-subbtn").forEach(s=>{
    s.classList.remove("is-active");
    s.setAttribute("aria-selected","false");
  });
}

/* Modals: Edit */
function openEditModal(li){
  editingLI = li;

  const groupBlock = li.closest(".group-block");
  const cat = groupBlock?.dataset.cat || "";
  const sub = groupBlock?.dataset.sub || null;
  const groupName = groupBlock?.dataset.group || "";
  const itemName = li.querySelector(".li-text")?.textContent?.trim() || "";

  modalCrumbs.innerHTML = `
    <span class="crumb">Chart of Account</span>
    <span class="crumb">${escapeHtml(cat === "assets" ? "Assets" : DATA[cat]?.name || cat)}</span>
    ${sub ? `<span class="crumb">${escapeHtml(DATA.assets.subs.find(s=>s.id===sub)?.name || sub)}</span>` : ""}
    <span class="crumb">${escapeHtml(groupName)}</span>
  `;

  mInput.value = itemName;
  mLevel.value = "Detailed";

  tangibleTgl.checked = false;
  amortizeCbx.checked = false;
  amortFlag.classList.add("hidden");
  amortFields.classList.add("hidden");

  editModal.classList.remove("hidden");
  mInput.focus(); mInput.select();
}
function closeEditModal(){ editModal.classList.add("hidden"); editingLI = null; }
btnSave.addEventListener("click", ()=>{
  if(!editingLI) return;
  const span = editingLI.querySelector(".li-text");
  const newVal = mInput.value.trim();
  if (newVal) span.textContent = newVal;
  const ul = editingLI.closest("ul.plain-list");
  if (ul) syncListToData(ul);
  closeEditModal();
});
btnCancel.addEventListener("click", closeEditModal);
editModal.addEventListener("click", (e)=>{ if(e.target.dataset.close === "1") closeEditModal(); });

/* Modals: Add */
function openAddModal(ul){
  addTargetUL = ul;

  const cat = ul.dataset.cat;
  const sub = ul.dataset.sub || null;
  const groupName = ul.dataset.group;

  addCrumbs.innerHTML = `
    <span class="crumb">Chart of Account</span>
    <span class="crumb">${escapeHtml(cat === "assets" ? "Assets" : DATA[cat]?.name || cat)}</span>
    ${sub ? `<span class="crumb">${escapeHtml(DATA.assets.subs.find(s=>s.id===sub)?.name || sub)}</span>` : ""}
    <span class="crumb">${escapeHtml(groupName)}</span>
  `;

  addInput.value = "";
  addModal.classList.remove("hidden");
  addInput.focus();
}
function closeAddModal(){ addModal.classList.add("hidden"); addTargetUL = null; }
addConfirm.addEventListener("click", ()=>{
  if(!addTargetUL) return;
  const name = addInput.value.trim();
  if(!name) return;

  const li = document.createElement("li");
  li.setAttribute("draggable","true");
  li.innerHTML = `
    <span class="li-text"></span>
    <span class="li-actions">
      <button type="button" class="icon-btn" data-edit="1" aria-label="Edit">✏️</button>
    </span>
  `;
  li.querySelector(".li-text").textContent = name;
  addTargetUL.appendChild(li);

  syncListToData(addTargetUL);
  closeAddModal();
});
addCancel.addEventListener("click", closeAddModal);
addModal.addEventListener("click", (e)=>{ if(e.target.dataset.close === "1") closeAddModal(); });

/* Right-side interactions */
contentBox.addEventListener("click", (e)=>{
  // Edit item
  const editBtn = e.target.closest('[data-edit="1"]');
  if(editBtn){
    const li = editBtn.closest("li");
    if(li) openEditModal(li);
    return;
  }

  // Add item (+)
  const addBtn = e.target.closest('.add-item');
  if(addBtn){
    const groupBlock = addBtn.closest(".group-block");
    const ul = groupBlock?.querySelector("ul.plain-list");
    if(ul) openAddModal(ul);
    return;
  }

  // Focus group
  const tagBtn = e.target.closest('.group-tag');
  if(tagBtn){
    const groupBlock = tagBtn.closest(".group-block");
    const cat = groupBlock?.dataset.cat;
    const sub = groupBlock?.dataset.sub || null;
    const group = groupBlock?.dataset.group;
    if(cat && group) renderGroupOnly(cat, sub, group);
    return;
  }
});

/* Exit focus */
exitFocusBtn.addEventListener("click", ()=>{
  if (context.cat === "assets" && context.subId){
    renderAssetsSub(context.subId);
  } else if (context.cat){
    renderCategoryOnly(context.cat);
  } else {
    renderAllCategories();
  }
});

/* Drag & Drop */
let draggingLi = null;
function getDragAfterElement(ul, y){
  const els = [...ul.querySelectorAll("li:not(.dragging)")];
  return els.reduce((closest, child)=>{
    const box = child.getBoundingClientRect();
    const offset = y - (box.top + box.height/2);
    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
}
contentBox.addEventListener("dragstart", (e)=>{
  const li = e.target.closest("li");
  if(!li) return;
  draggingLi = li;
  li.classList.add("dragging");
});
contentBox.addEventListener("dragend", (e)=>{
  const li = e.target.closest("li");
  if(!li) return;
  li.classList.remove("dragging");
  const ul = li.closest("ul.plain-list");
  if (ul) syncListToData(ul);
  draggingLi = null;
});
contentBox.addEventListener("dragover", (e)=>{
  if(!draggingLi) return;
  const ul = e.target.closest("ul.plain-list");
  if(!ul) return;
  e.preventDefault();
  const afterEl = getDragAfterElement(ul, e.clientY);
  if (afterEl == null){
    ul.appendChild(draggingLi);
  } else {
    ul.insertBefore(draggingLi, afterEl);
  }
});

/* Sidebar events */
function wireSidebar(){
  // زر "All"
  btnAll.addEventListener("click", ()=>{
    document.querySelectorAll(".coa-btn").forEach(b=>{
      b.classList.remove("is-active");
      b.setAttribute("aria-selected","false");
      b.setAttribute("aria-expanded","false");
    });
    btnAll.setAttribute("aria-selected","true");
    clearActiveSubs();
    renderAllCategories();
  });

  // الأزرار الرئيسية
  leftList.addEventListener("click", (e)=>{
    const main = e.target.closest(".coa-btn");
    if(!main) return;
    e.preventDefault();

    const key = main.dataset.key;
    const isOpen = main.getAttribute('aria-expanded') === 'true';
    document.querySelectorAll(".coa-btn").forEach(b=>{
      if (b !== main) b.setAttribute("aria-expanded","false");
    });
    main.setAttribute('aria-expanded', isOpen ? 'false' : 'true');

    markActiveMain(main);
    clearActiveSubs();

    if (key === "assets"){
      renderAssetsAll();
    } else {
      renderCategoryOnly(key);
    }
  });

  // الأزرار الفرعية
  leftList.addEventListener("click", (e)=>{
    const subBtn = e.target.closest(".coa-subbtn");
    if(!subBtn) return;
    e.preventDefault();

    clearActiveSubs();
    subBtn.classList.add("is-active");
    subBtn.setAttribute("aria-selected","true");

    const parentBtn = subBtn.previousElementSibling?.classList.contains("coa-btn")
      ? subBtn.previousElementSibling
      : subBtn.parentElement?.previousElementSibling;

    const parentKey = parentBtn?.dataset.key;

    if (parentKey === "assets" && subBtn.dataset.sub){
      const subId = subBtn.dataset.sub;
      renderAssetsSub(subId);
    } else {
      const groupName = subBtn.dataset.group;
      if (DATA[parentKey]){
        renderGroupOnly(parentKey, null, groupName);
      }
    }
  });
}

/* Init */
function init(){
  buildSidebar();
  wireSidebar();
  document.addEventListener("keydown", (e)=>{
    if(e.key === "Escape"){
      if(!editModal.classList.contains("hidden")) closeEditModal();
      if(!addModal.classList.contains("hidden")) closeAddModal();
    }
  });
  backBtn?.addEventListener("click", ()=> history.back());
  renderAllCategories();
}
init();
