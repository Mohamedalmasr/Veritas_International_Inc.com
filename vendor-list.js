/* ===== Utilities ===== */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const fmtMoney = (n) =>
  (n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const parseNum = (v) => Number(v || 0);

/* ===== Storage Keys ===== */
const LS_KEY = "AR_CUSTOMER_STATUS_V1";

/* ===== Seed Data ===== */
const BASE = [
  { name: "Abercombe Hardware Inc.",  accountNumber: "100-200-001", balanceOwing: 6467.65, salesYTD: 11528.42, salesQTD: 3120.11, status: "COMPLIANT" },
  { name: "ACME Novelty Ltd.",        accountNumber: "100-200-002", balanceOwing:    0.00, salesYTD:  2004.95, salesQTD:  415.00, status: "COMPLIANT" },
  { name: "Blackwell Rentals Inc.",   accountNumber: "100-200-003", balanceOwing:    0.00, salesYTD: 10175.85, salesQTD: 1280.45, status: "COMPLIANT" },
  { name: "Canadian Financial Funds", accountNumber: "100-200-004", balanceOwing:    0.00, salesYTD:  1200.00, salesQTD:  120.00, status: "COMPLIANT" },
  { name: "Catanach, Douglas",        accountNumber: "100-200-005", balanceOwing:    0.00, salesYTD:  6522.36, salesQTD:  980.00, status: "OVERDUE" },
  { name: "Cheshire Development",     accountNumber: "100-200-006", balanceOwing: 1403.46, salesYTD:  9281.37, salesQTD:  310.25, status: "OVERDUE" },
  { name: "Classic Catering",         accountNumber: "100-200-007", balanceOwing:    0.00, salesYTD:     0.00, salesQTD:    0.00, status: "COMPLIANT" },
  { name: "Dextor, Drew & Angus",     accountNumber: "100-200-008", balanceOwing:    0.00, salesYTD: 25540.97, salesQTD: 5250.10, status: "COMPLIANT" },
  { name: "Dunwoody Wire & Cable",    accountNumber: "100-200-009", balanceOwing:  415.58, salesYTD: 78996.34, salesQTD: 9211.00, status: "OVERDUE" },
  { name: "Eagleridge Excavating Co.",accountNumber: "100-200-010", balanceOwing: 8282.25, salesYTD: 29769.85, salesQTD: 3870.90, status: "OVERDUE" },
  { name: "Farwest Telephone Corp.",  accountNumber: "100-200-011", balanceOwing:    0.00, salesYTD: 17860.31, salesQTD:  990.00, status: "COMPLIANT" },
  { name: "Gibson Heating Equipment", accountNumber: "100-200-012", balanceOwing:    0.00, salesYTD:  1435.67, salesQTD:  250.00, status: "COMPLIANT" },
  { name: "Horizon Auto Parts",       accountNumber: "100-200-013", balanceOwing:  920.00, salesYTD:  8350.00, salesQTD:  900.00, status: "OVERDUE" },
  { name: "Inverness Foods",          accountNumber: "100-200-014", balanceOwing:  110.75, salesYTD:  5400.00, salesQTD:  420.00, status: "COMPLIANT" },
  { name: "Jupiter Construction",     accountNumber: "100-200-015", balanceOwing:    0.00, salesYTD: 22500.00, salesQTD: 3100.00, status: "COMPLIANT" }
];

function loadStatusOverrides(){
  try{ return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); }catch{ return {}; }
}
function saveStatusOverrides(map){
  try{ localStorage.setItem(LS_KEY, JSON.stringify(map || {})); }catch{}
}

function buildData(){
  const ov = loadStatusOverrides();
  return BASE.map(r => ov[r.accountNumber] ? { ...r, status: ov[r.accountNumber] } : r);
}

let CUSTOMERS = buildData();
let state = { rows: [...CUSTOMERS], sort: { key: null, dir: 1 } };

/* ===== Render ===== */
function statusSelect(r){
  const ok = r.status === "COMPLIANT";
  return `
    <div class="status-cell">
      <select class="status-select ${ok ? "ok" : "late"}" data-account="${r.accountNumber}">
        <option value="COMPLIANT" ${ok ? "selected" : ""}>In Compliance</option>
        <option value="OVERDUE" ${!ok ? "selected" : ""}>Overdue</option>
      </select>
    </div>
  `;
}
function actionsCell(r){
  return `
    <td class="actions-cell">
      <button type="button" class="edit-btn" data-account="${r.accountNumber}">Edit</button>
    </td>
  `;
}

function renderTable(){
  const body = $("#tblBody");
  body.innerHTML = state.rows.map(r => `
    <tr>
      <td>${r.name}</td>
      <td><code>${r.accountNumber}</code></td>
      <td class="num">${fmtMoney(r.balanceOwing)}</td>
      <td class="num">${fmtMoney(r.salesYTD)}</td>
      <td class="num">${fmtMoney(r.salesQTD)}</td>
      <td>${statusSelect(r)}</td>
      ${actionsCell(r)}
    </tr>
  `).join("");

  const sum = (k) => state.rows.reduce((a,c)=> a + parseNum(c[k]), 0);
  $("#totalBalance").textContent = fmtMoney(sum("balanceOwing"));
  $("#totalYTD").textContent     = fmtMoney(sum("salesYTD"));
  $("#totalQTD").textContent     = fmtMoney(sum("salesQTD"));

  // تأكد إن زرار Edit موجود حتى لو كان فيه كود قديم
  ensureActionsCells();
}

/* ===== Filters ===== */
function applyFilters(){
  const q = $("#searchInput").value.trim().toLowerCase();
  const f = $("#statusFilter").value;

  state.rows = CUSTOMERS.filter(r => {
    const hit = !q || r.name.toLowerCase().includes(q) || r.accountNumber.toLowerCase().includes(q);
    const ok  = (f === "ALL") || (f === r.status);
    return hit && ok;
  });

  if (state.sort.key) sortBy(state.sort.key, false);
  renderTable();
}

/* ===== Sorting ===== */
function setCaret(key, dir){
  $$("thead th.sortable").forEach(th => th.classList.remove("asc","desc"));
  const th = $(`thead th[data-key="${key}"]`);
  if (!th) return;
  th.classList.add(dir === 1 ? "asc" : "desc");
  if (!th.querySelector(".caret")) {
    const c = document.createElement("span");
    c.className = "caret";
    th.appendChild(c);
  }
}
function sortBy(key, toggle=true){
  if (toggle){
    if (state.sort.key === key) state.sort.dir *= -1;
    else { state.sort.key = key; state.sort.dir = 1; }
  }
  const dir = state.sort.dir;

  state.rows.sort((a,b)=>{
    const va = a[key], vb = b[key];
    if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
    return String(va).localeCompare(String(vb)) * dir;
  });

  setCaret(key, dir);
  renderTable();
}

/* ===== CSV ===== */
function downloadCSV(filename, rows){
  const header = ["Customer","Account Number","Balance Owing","Sales YTD","Sales QTD","Status"];
  const lines = [header.join(",")];
  for (const r of rows){
    lines.push([
      `"${String(r.name).replace(/"/g,'""')}"`,
      `"${r.accountNumber}"`,
      r.balanceOwing,
      r.salesYTD,
      r.salesQTD,
      r.status === "COMPLIANT" ? "In Compliance" : "Overdue"
    ].join(","));
  }
  const blob = new Blob([lines.join("\n")], { type:"text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

/* ===== Toast ===== */
function toast(msg, ms=2500){
  const area = $("#toastArea");
  if (!area) return alert(msg);
  const el = document.createElement("div");
  el.className = "toast";
  el.style.cssText = "position:fixed;right:16px;bottom:16px;background:#0b2e6f;color:#fff;padding:10px 12px;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.18);font-weight:800";
  el.innerHTML = `<div>${msg}</div>`;
  area.appendChild(el);
  setTimeout(()=> el.remove(), ms);
}

/* ===== Modal Logic ===== */
const modal = {
  root: $("#editModal"),
  name: $("#mName"),
  acc: $("#mAccount"),
  bal: $("#mBalance"),
  ytd: $("#mYTD"),
  qtd: $("#mQTD"),
  status: $("#mStatus"),
  saveBtn: $("#modalSave"),
  cancelBtn: $("#modalCancel"),
  closeBtn: $(".modal-close"),
  record: null
};

function openEditModal(accNumber){
  const rec = CUSTOMERS.find(r => r.accountNumber === accNumber);
  if (!rec) return;

  modal.record = rec;
  modal.name.value = rec.name;
  modal.acc.value  = rec.accountNumber; // readonly
  modal.bal.value  = rec.balanceOwing;
  modal.ytd.value  = rec.salesYTD;
  modal.qtd.value  = rec.salesQTD;
  modal.status.value = rec.status;

  // لون الاستاتس داخل المودال
  modal.status.classList.toggle("ok",   modal.status.value === "COMPLIANT");
  modal.status.classList.toggle("late", modal.status.value === "OVERDUE");

  modal.root.hidden = false;
  // فوكس أول حقل
  setTimeout(()=> modal.name.focus(), 10);
}
function closeEditModal(){
  modal.record = null;
  modal.root.hidden = true;
}

function saveEditModal(){
  if (!modal.record) return;

  // تحديث القيم
  modal.record.name         = String(modal.name.value || "").trim();
  modal.record.balanceOwing = Number(modal.bal.value || 0);
  modal.record.salesYTD     = Number(modal.ytd.value || 0);
  modal.record.salesQTD     = Number(modal.qtd.value || 0);
  modal.record.status       = modal.status.value === "OVERDUE" ? "OVERDUE" : "COMPLIANT";

  // حفظ Override للاستاتس فقط
  const map = loadStatusOverrides();
  map[modal.record.accountNumber] = modal.record.status;
  saveStatusOverrides(map);

  applyFilters();
  toast("Saved.");
  closeEditModal();
}

/* ===== HOTFIX: inject Edit button if actions cell is missing ===== */
function ensureActionsCells(){
  const body = document.getElementById("tblBody");
  if(!body) return;
  Array.from(body.querySelectorAll("tr")).forEach(tr=>{
    if(!tr.querySelector(".actions-cell")){
      const accCode = tr.children[1]?.querySelector("code")?.textContent?.trim() || "";
      const td = document.createElement("td");
      td.className = "actions-cell";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "edit-btn";
      btn.textContent = "Edit";
      if(accCode) btn.dataset.account = accCode;
      td.appendChild(btn);
      tr.appendChild(td);
    }
  });
}

/* ===== Init ===== */
window.addEventListener("DOMContentLoaded", ()=>{
  // add caret placeholders once to avoid any layout shift
  $$("thead th.sortable").forEach(th=>{
    const c = document.createElement("span");
    c.className = "caret";
    th.appendChild(c);
    th.addEventListener("click", ()=> sortBy(th.getAttribute("data-key")));
  });

  $("#searchInput").addEventListener("input", applyFilters);
  $("#statusFilter").addEventListener("change", applyFilters);
  $("#exportBtn").addEventListener("click", ()=>{
    if (!state.rows.length) { toast("No rows to export."); return; }
    downloadCSV("ar_customer_list.csv", state.rows);
  });

  // change status (delegation)
  $("#tblBody").addEventListener("change", (e)=>{
    const sel = e.target.closest(".status-select");
    if (!sel) return;
    const acc = sel.getAttribute("data-account");
    const val = sel.value === "COMPLIANT" ? "COMPLIANT" : "OVERDUE";

    const row = CUSTOMERS.find(r => r.accountNumber === acc);
    if (row) row.status = val;

    const map = loadStatusOverrides();
    map[acc] = val; saveStatusOverrides(map);

    sel.classList.toggle("ok",   val === "COMPLIANT");
    sel.classList.toggle("late", val === "OVERDUE");

    applyFilters(); // keep toolbar filter consistent
  });

  // open modal (delegation على جسم الجدول)
  $("#tblBody").addEventListener("click", (e)=>{
    const btn = e.target.closest(".edit-btn");
    if (!btn) return;
    const acc = btn.dataset.account || btn.closest("tr")?.children?.[1]?.querySelector("code")?.textContent?.trim();
    if (acc) openEditModal(acc);
  });

  // modal buttons
  modal.cancelBtn.addEventListener("click", closeEditModal);
  modal.closeBtn.addEventListener("click", closeEditModal);
  modal.saveBtn.addEventListener("click", saveEditModal);

  // Esc + click-outside
  modal.root.addEventListener("click", (e)=>{
    if (e.target === modal.root) closeEditModal();
  });
  document.addEventListener("keydown", (e)=>{
    if (e.key === "Escape" && !modal.root.hidden) closeEditModal();
  });

  // راقب أي إعادة رسم للجدول وحقن العمود لو ناقص
  const body = document.getElementById("tblBody");
  const _obs = new MutationObserver(()=> ensureActionsCells());
  if(body){ _obs.observe(body, { childList: true, subtree: true }); }

  applyFilters();
});
