"use strict";

/* ===== Utilities ===== */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const fmtMoney = (n) =>
  (n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const parseNum = (v) => Number(v || 0);

/* ===== Seed Data (read-only statuses) ===== */
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

let CUSTOMERS = [...BASE];
let state = { rows: [...CUSTOMERS], sort: { key: null, dir: 1 } };

/* ===== Render ===== */
function statusBadge(r){
  const ok = r.status === "COMPLIANT";
  const label = ok ? "In Compliance" : "Overdue";
  const cls = ok ? "ok" : "late";
  return `<span class="status-badge ${cls}">${label}</span>`;
}
function detailsBtn(r){
  const aria = `Open details for ${r.name}`;
  return `
    <button class="row-open-btn" type="button"
            data-account="${r.accountNumber}" data-name="${r.name}"
            title="${aria}" aria-label="${aria}">
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path fill="currentColor" d="M10 17l5-5-5-5v10zM5 19h14v2H5z"/>
      </svg>
    </button>
  `;
}
function renderTable(){
  const body = $("#tblBody");
  body.innerHTML = state.rows.map(r => `
    <tr>
      <td class="action-cell">${detailsBtn(r)}</td>
      <td>${r.name}</td>
      <td><code>${r.accountNumber}</code></td>
      <td class="num">${fmtMoney(r.balanceOwing)}</td>
      <td class="num">${fmtMoney(r.salesYTD)}</td>
      <td class="num">${fmtMoney(r.salesQTD)}</td>
      <td>${statusBadge(r)}</td>
    </tr>
  `).join("");

  const sum = (k) => state.rows.reduce((a,c)=> a + parseNum(c[k]), 0);
  $("#totalBalance").textContent = fmtMoney(sum("balanceOwing"));
  $("#totalYTD").textContent     = fmtMoney(sum("salesYTD"));
  $("#totalQTD").textContent     = fmtMoney(sum("salesQTD"));
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

/* ===== Sorting (no layout shift) ===== */
function ensureCaret(th){
  if (!th.querySelector(".caret")) {
    const c = document.createElement("span");
    c.className = "caret";
    th.appendChild(c);
  }
}
function setCaret(key, dir){
  $$("thead th.sortable").forEach(th => th.classList.remove("asc","desc"));
  const th = $(`thead th[data-key="${key}"]`);
  if (!th) return;
  th.classList.add(dir === 1 ? "asc" : "desc");
  ensureCaret(th);
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
function toast(msg, ms=3500){
  const area = $("#toastArea");
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `<div>${msg}</div><button class="close" aria-label="Close">✕</button>`;
  area.appendChild(el);
  const close = () => el.remove();
  el.querySelector(".close").addEventListener("click", close);
  setTimeout(close, ms);
}

/* ===== Tabs: open details in top tabs with unique key per customer ===== */
function tabKeyForCustomer(acc){
  return `cust-${String(acc || "").toLowerCase().replace(/[^a-z0-9]+/g,'-')}`;
}
function openCustomerTab(acc, name){
  const href  = `customer-details.html?acc=${encodeURIComponent(acc)}&name=${encodeURIComponent(name||"")}`;
  const title = (name || "Customer").trim();          // tab title = customer name only
  const key   = tabKeyForCustomer(acc);               // unique key → new tab per customer

  if (window.parent && window.parent !== window){
    try {
      window.parent.postMessage({ type: "open-tab", key, title, href }, "*");
      return;
    } catch (_) {}
  }
  // Fallback (no parent tabs)
  window.location.href = href;
}

/* ===== Init ===== */
window.addEventListener("DOMContentLoaded", ()=>{
  // Prepare sort carets and handlers
  $$("thead th.sortable").forEach(th=>{
    ensureCaret(th);
    th.addEventListener("click", ()=> sortBy(th.getAttribute("data-key")));
  });

  $("#searchInput").addEventListener("input", applyFilters);
  $("#statusFilter").addEventListener("change", applyFilters);
  $("#exportBtn").addEventListener("click", ()=>{
    if (!state.rows.length) { toast("No rows to export."); return; }
    downloadCSV("ar_customer_list.csv", state.rows);
  });

  // Row action: open details in a dedicated tab per customer
  $("#tblBody").addEventListener("click", (e)=>{
    const btn = e.target.closest(".row-open-btn");
    if (!btn) return;
    const acc  = btn.getAttribute("data-account");
    const name = btn.getAttribute("data-name");
    openCustomerTab(acc, name);
  });

  applyFilters();
});
