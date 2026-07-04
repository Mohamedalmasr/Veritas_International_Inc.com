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
    alert("Defaults: pick an item from the left list to view & edit its details.");
  });
})();

const parentsData = [
  ["1","SYSTRST","System Trust","","1","0","0","0","0","1","1"],
  ["2","SYSSTS","System Status","NULL","1","0","0","0","1","NULL","1"],
  ["3","SYSCRD","System Credentials","NULL","0","0","0","0","NULL","3","1"],
  ["5","NTBDTS","Notable","No","0","0","0","0","0","4","1"],
  ["6","PWDDYS","","0001","NULL","NULL","NULL","NULL","NULL","NULL","1"],
  ["7","RDYDT","","0001","NULL","NULL","NULL","NULL","NULL","NULL","1"],
  ["8","ACTDT","","0001","NULL","NULL","NULL","NULL","NULL","NULL","1"],
  ["12","Date Frmt","Date Formt","NULL","NULL","1","1","0","NULL","NULL","1"],
  ["13","Time Fmt","Time Format","NULL","NULL","NULL","NULL","NULL","NULL","NULL","NULL"],
  ["20","ORGTP","","0001","NULL","NULL","NULL","NULL","NULL","NULL","1"],
  ["30","TXORG","Tax Jurisdiction","","0","0","0","0","NULL","NULL","1"],
  ["32","SLTN","Salutation","NULL","NULL","NULL","NULL","NULL","NULL","NULL","1"],
  ["52","MDUMP","Medium","NULL","NULL","1","1","1","1","NULL","1"],
  ["54","EML","Email","NULL","NULL","1","1","1","1","NULL","1"],
  ["56","URL","website","website","NULL","1","1","1","1","NULL","1"]
];

const childData = [
  ["1","1","NOTRST","System is not Trusted","System is not Trusted","NULL","1","1","1","1"],
  ["2","1","TRST","System is trusted","System is trusted","NULL","1","0","2","1"],
  ["3","2","NEW","New","System just delivered, unused, and contains no user-entered data.","NULL","1","1","1","1"],
  ["4","2","INI","Initalization","Initalization","NULL","1","0","2","1"],
  ["5","2","RDY","Ready","Ready","NULL","1","0","3","1"],
  ["6","2","ACT","Active","Active","NULL","1","0","4","1"],
  ["7","2","GRC","Grace","Grace","NULL","1","0","5","1"],
  ["8","2","SUS","SUS","Suspended","NULL","1","0","6","1"],
  ["10","2","DEL","Deleted","Deleted","NULL","1","0","7","1"],
  ["11","2","MNT","Maintaince","system is undergoing maintainance","NULL","NULL","NULL","NULL","NULL"],
  ["12","2","CRT","Critical Error","Critical Error","NULL","1","0","8","1"],
  ["15","2","FATAL","FATAL","FATAL ERROR","NULL","NULL","NULL","NULL","NULL"],
  ["18","3","MNTEND","Maintaince","Maintaince supose","","NULL","NULL","NULL","NULL"],
  ["20","5","GRCPER","Grace period","Grace period number of days","30","NULL","NULL","0","1"],
  ["22","5","GRCEND","Grace End","Grace period end on","","NULL","NULL","0","1"],
  ["24","5","SUSPER","Suspense","Suspense period","180","1","1","0","1"],
  ["26","5","SUSEND","Suspense ends on","Suspense period end on","","1","1","0","1"],
  ["28","5","DELPER","Deleted period","Deleted period number of days","367","1","1","0","1"],
  ["30","5","DELON","Delete Date","System will be purged on","","1","1","0","1"],
  ["50","3","ACTNUM","Account Number","Account Number","NULL","1","0","NULL","1"],
  ["52","3","LICNUM","License Number","License Number","NULL","NULL","NULL","NULL","1"],
  ["54","3","KYCD","Key Code","Key Code","30","1","1","0","1"],
  ["520","52","MOB","Mobile","Mobile","NULL","1","1","1","1"],
  ["522","52","TEL","Telephone","Telephone","NULL","1","1","2","1"],
  ["524","52","FAX","Fax","Fax","NULL","1","1","3","1"],
  ["540","54","Email","Email","Email","NULL","1","1","1","1"],
  ["542","54","HEMAIL","hemail","Home Email","NULL","1","1","1","1"],
  ["560","56","URL","Web","Website","NULL","1","1","1","1"]
];

const listEl = document.getElementById("defaultsList");
const filterInput = document.getElementById("filterInput");
const detailCol1 = document.getElementById("detailCol1");
const detailCol2 = document.getElementById("detailCol2");
const detailCol4 = document.getElementById("detailCol4");
const detailEditBtn = document.getElementById("detailEditBtn");
const detailSaveBtn = document.getElementById("detailSaveBtn");
const detailCancelBtn = document.getElementById("detailCancelBtn");
const childrenContainer = document.getElementById("childrenContainer");

let currentParentIndex = null;
let currentShowPencil = false;
let currentParentAllowsEdit = false;
let currentParentAllowsAdd = false;
let detailSnapshot = "";

function removeExistingToasts() {
  document.querySelectorAll(".info-toast").forEach((t) => t.remove());
}

function closeToast(toast) {
  toast.style.animation = "slideDown 0.3s ease";
  setTimeout(() => toast.remove(), 300);
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

function renderList(items) {
  listEl.innerHTML = "";

  items.forEach((row, localIdx) => {
    const absoluteIdx = parentsData.indexOf(row);
    const idx = absoluteIdx !== -1 ? absoluteIdx : localIdx;

    const code = row[1] || "—";
    const name = row[2] || "NULL";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "defaults-item";
    btn.innerHTML = `
      <span class="code">${code}</span>
      <span class="name">${name}</span>
    `;
    btn.addEventListener("click", () => openParent(idx, btn));
    listEl.appendChild(btn);
  });
}

function openParent(index, btn) {
  currentParentIndex = index;
  [...listEl.children].forEach(el => el.classList.remove("active"));
  btn?.classList.add("active");
  loadDetailData(index);
  resetDetailEditState();
}

function loadDetailData(index){
  const p = parentsData[index];

  const flagCanEdit   = (p[4] === "1");
  const flagCanDelete = (p[5] === "1");
  const flagCanAdd    = (p[6] === "1");

  currentShowPencil       = flagCanEdit;
  currentParentAllowsEdit = flagCanDelete;
  currentParentAllowsAdd  = flagCanAdd;

  detailCol1.value = p[0] || "NULL";
  detailCol2.value = p[1] || "NULL";
  detailCol4.value = p[3] || "NULL";

  const pid = (p[0] || "").toString().trim();
  const kids = childData.filter(ch => (ch[1] || "").toString().trim() === pid);

  childrenContainer.innerHTML = "";

  if (kids.length){
    const head = document.createElement("div");
    head.className = "child-row child-header";
    head.innerHTML = `
      <div></div>
      <div>Code</div>
      <div>Name</div>
      <div>Description</div>
      <div></div>
    `;
    childrenContainer.appendChild(head);
  }

  kids.forEach((ch) => {
    const isRed = (ch[7] === "1" || ch[7] === 1);
    createChildRow(ch, {
      parentAllowsEdit: currentParentAllowsEdit,
      isRed,
      showPencil: currentShowPencil,
      currentPid: pid
    });
  });

  if (currentParentAllowsAdd) {
    renderAddChildButton(pid, currentParentAllowsEdit, currentShowPencil);
  }
}

function renderAddChildButton(parentId, parentAllowsEdit, showPencil){
  const addWrap = document.createElement("div");
  addWrap.style.marginTop = "10px";

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "add-child-btn";
  addBtn.textContent = "+ Add Child";
  addWrap.appendChild(addBtn);

  childrenContainer.appendChild(addWrap);

  addBtn.addEventListener("click", ()=>{
    if (addWrap.querySelector(".new-child-container")) return;

    const form = document.createElement("div");
    form.className = "new-child-container";
    form.style.display = "grid";
    form.style.gridTemplateColumns = "1fr";
    form.style.gap = "8px";
    form.style.marginTop = "8px";

    const inParent = inputBlock("Parent ID", parentId, true);
    const inCode   = inputBlock("Code", "");
    const inName   = inputBlock("Name", "");
    const inDesc   = inputBlock("Description", "");

    const btns = document.createElement("div");
    btns.className = "new-child-buttons";

    const save = document.createElement("button");
    save.type = "button";
    save.className = "btn btn-primary";
    save.textContent = "Save";

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "btn btn-secondary";
    cancel.textContent = "Cancel";

    btns.append(save, cancel);
    form.append(inParent.wrap, inCode.wrap, inName.wrap, inDesc.wrap, btns);
    addWrap.appendChild(form);

    save.addEventListener("click", ()=>{
      const code = inCode.input.value.trim();
      const name = inName.input.value.trim();
      const desc = inDesc.input.value.trim();

      if (!code || !name){
        alert("Code and Name are required.");
        return;
      }

      const newId = getNextChildId();
      const pid = inParent.input.value.trim() || "NULL";

      const newRow = [
        String(newId), String(pid), code, name, desc || "NULL",
        "NULL", "1", "0", "0", "1"
      ];
      childData.push(newRow);

      createChildRow(newRow, {
        parentAllowsEdit,
        isRed: false,
        showPencil,
        currentPid: parentId
      });

      form.remove();
    });

    cancel.addEventListener("click", ()=>{
      form.remove();
    });
  });

  function inputBlock(label, value, disabled=false){
    const wrap = document.createElement("div");
    const lab = document.createElement("label");
    lab.textContent = label;
    lab.style.fontWeight = "700";
    lab.style.opacity = ".9";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "new-child-input";
    input.value = value ?? "";
    input.disabled = disabled;

    wrap.append(lab, input);
    return { wrap, input };
  }
}

function createChildRow(child, opts){
  const { parentAllowsEdit = false, isRed = false, showPencil = false, currentPid = null } = opts || {};

  const row = document.createElement("div");
  row.className = "child-row";
  row.dataset.childId = (child[0]||"").toString();

  const c2 = mkSmall(child[1], true, 60);
  const c3 = mkSmall(child[2], true, 80);
  const c4 = mkSmall(child[3], true, 120);
  const c5 = mkSmall(child[4], true);

  if (isRed){
    row.classList.add("red");
    [c2,c3,c4,c5].forEach(el => {
      el.style.backgroundColor = "#ff4d4d";
      el.style.color = "#fff";
    });
  }

  row.append(c2,c3,c4,c5);

  if (parentAllowsEdit || showPencil){
    const actions = document.createElement("div");
    actions.className = "child-actions";

    if (showPencil){
      const edit = ic("✏", "row-icon-btn row-edit-btn");
      const info = ic("?", "row-icon-btn row-help-btn");
      const save = ic("✔", "row-icon-btn row-save-btn");
      const cancel = ic("✕", "row-icon-btn row-cancel-btn");

      save.style.display = "none";
      cancel.style.display = "none";

      const snap = { col2:c2.value, col3:c3.value, col4:c4.value, col5:c5.value };

      info.title = "Click for more info";
      info.onclick = () => {
        showInfoToast(child[2] || child[0] || "No code");
      };

      edit.onclick = ()=>{
        if (isRed){
          [c2,c3,c4,c5].forEach(x => x.disabled = false);
        } else {
          [c3,c4,c5].forEach(x => x.disabled = false);
        }
        c5.focus();
        edit.style.display = "none";
        info.style.display = "none";
        save.style.display = "inline-flex";
        cancel.style.display = "inline-flex";
      };

      save.onclick = ()=>{
        [c2,c3,c4,c5].forEach(x => x.disabled = true);
        edit.style.display = "inline-flex";
        info.style.display = "inline-flex";
        save.style.display = "none";
        cancel.style.display = "none";

        const id = row.dataset.childId;
        for (let i=0;i<childData.length;i++){
          if ((childData[i][0]||"").toString()===id){
            if (isRed){ childData[i][1] = c2.value; }
            childData[i][2] = c3.value;
            childData[i][3] = c4.value;
            childData[i][4] = c5.value;
            break;
          }
        }

        if (isRed && currentPid && c2.value.trim() !== currentPid){
          row.remove();
        }

        snap.col2 = c2.value;
        snap.col3 = c3.value;
        snap.col4 = c4.value;
        snap.col5 = c5.value;
      };

      cancel.onclick = ()=>{
        c2.value = snap.col2;
        c3.value = snap.col3;
        c4.value = snap.col4;
        c5.value = snap.col5;
        [c2,c3,c4,c5].forEach(x => x.disabled = true);
        edit.style.display = "inline-flex";
        info.style.display = "inline-flex";
        save.style.display = "none";
        cancel.style.display = "none";
      };

      actions.append(edit, info, save, cancel);
    }

    if (parentAllowsEdit){
      const delBtn = ic("✕", "row-icon-btn row-delete-btn");
      delBtn.title = "Delete";
      delBtn.onclick = ()=>{
        const id = row.dataset.childId;
        if (!confirm("Do you want to delete this row?")) return;
        const idx = childData.findIndex(ch => (ch[0]||"").toString() === id);
        if (idx > -1){ childData.splice(idx,1); }
        row.remove();
      };
      actions.append(delBtn);
    }

    row.appendChild(actions);
  }

  childrenContainer.appendChild(row);

  function mkSmall(val, dis=true, min=80){
    const i = document.createElement("input");
    i.type = "text";
    i.value = (val==null || val==="") ? "NULL" : val;
    i.disabled = dis;
    i.className = "small-child-input";
    i.style.minWidth = `${min}px`;
    return i;
  }

  function ic(txt, className){
    const s = document.createElement("button");
    s.type = "button";
    s.textContent = txt;
    s.className = className;
    return s;
  }
}

function getNextChildId(){
  let maxId = 0;
  for (const row of childData){
    const n = parseInt(row[0],10);
    if (!isNaN(n) && n > maxId) maxId = n;
  }
  return maxId + 1;
}

/* ===== Detail Edit Button Fix ===== */
function resetDetailEditState() {
  detailCol4.disabled = true;
  detailSaveBtn.style.display = "none";
  detailCancelBtn.style.display = "none";
  detailEditBtn.style.display = "inline-flex";
}

detailEditBtn?.addEventListener("click", () => {
  if (currentParentIndex === null) return;
  detailSnapshot = detailCol4.value;
  detailCol4.disabled = false;
  detailCol4.focus();
  detailEditBtn.style.display = "none";
  detailSaveBtn.style.display = "inline-flex";
  detailCancelBtn.style.display = "inline-flex";
});

detailSaveBtn?.addEventListener("click", () => {
  if (currentParentIndex === null) return;
  parentsData[currentParentIndex][3] = detailCol4.value;
  resetDetailEditState();
});

detailCancelBtn?.addEventListener("click", () => {
  detailCol4.value = detailSnapshot;
  resetDetailEditState();
});

filterInput?.addEventListener("input", ()=>{
  const q = filterInput.value.toLowerCase().trim();
  const filtered = parentsData.filter(r =>
    (r[1]||"").toLowerCase().includes(q) ||
    (r[2]||"").toLowerCase().includes(q)
  );
  renderList(filtered);
});

renderList(parentsData);
const first = listEl.querySelector(".defaults-item");
if(first){ first.click(); }

(function(){
  const root = document.documentElement;
  const sidebar = document.getElementById("defaultsSidebar");
  const handle = document.getElementById("sidebarResizer");
  if (!sidebar || !handle) return;

  const minW = 220;
  const saved = localStorage.getItem("defaultsSidebarW");

  if (saved) {
    const w = Math.max(minW, parseInt(saved, 10) || minW);
    root.style.setProperty("--sidebar-w", `${w}px`);
  } else {
    root.style.setProperty("--sidebar-w", `${minW}px`);
  }

  let dragging = false;

  handle.addEventListener("mousedown", (e) => {
    e.preventDefault();
    dragging = true;
    document.body.style.cursor = "col-resize";
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const rect = sidebar.getBoundingClientRect();
    let newW = e.clientX - rect.left;
    newW = Math.max(minW, Math.round(newW));
    const maxW = Math.round(window.innerWidth * 0.6);
    if (newW > maxW) newW = maxW;
    root.style.setProperty("--sidebar-w", `${newW}px`);
  });

  window.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false;
    document.body.style.cursor = "";
    const current = getComputedStyle(root).getPropertyValue("--sidebar-w").trim();
    const num = parseInt(current, 10);
    if (!Number.isNaN(num) && num >= minW) {
      localStorage.setItem("defaultsSidebarW", String(num));
    }
  });

  window.addEventListener("resize", () => {
    const current = parseInt(getComputedStyle(root).getPropertyValue("--sidebar-w"), 10) || minW;
    const maxW = Math.round(window.innerWidth * 0.6);
    if (current > maxW) {
      root.style.setProperty("--sidebar-w", `${Math.max(minW, maxW)}px`);
    }
  });
})();