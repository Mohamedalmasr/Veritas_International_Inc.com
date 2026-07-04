"use strict";

/* ===== Basic helpers (English-only comments) ===== */
function keyFromHref(hrefRaw){
  const file = (hrefRaw || "").toLowerCase().replace(/[?#].*$/,"");
  if (!file) return "page";
  const base = file.replace(/^.*\//,"");
  return (base.endsWith(".html") ? base.replace(/\.html$/,"") : base)
    .replace(/[^a-z0-9-]/g,"-") || "page";
}
function slugFromLabel(label){
  return String(label || "item")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/&/g,"and")
    .replace(/[^a-z0-9]+/g,"-")
    .replace(/^-+|-+$/g,"")
    || "item";
}

/* Icon set (navy) */
const I = {
  book:`<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M6 2h11a2 2 0 0 1 2 2v15a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3zm0 2a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V4H6z"/></svg>`,
  list:`<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>`,
  pencil:`<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0  0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`,
  clock:`<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 1a11 11 0 1 0 11 11A11 11 0 0 0 12 1Zm1 12h5v-2h-2V8h-2z"/></svg>`,
  chart:`<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M3 3h2v18H3zM19 21h2V8h-2zM11 21h2V12h-2zM7 21h2V4H7zM15 21h2V2h-2z"/></svg>`,
  bank:`<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 3 2 9v2h20V9L12 3zm-7 8v7H3v2h18v-2h-2v-7H5zm2 0h10v7H7z"/></svg>`,
  warn:`<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2V9h2v5z"/></svg>`,
  user:`<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 12a5 5 0  1 0-5-5 5 5 0  0 0 5 5zm0 2c-5 0-9 2.5-9 5v3h18v-3c0-2.5-4-5-9-5z"/></svg>`,
  cart:`<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M7 18a2 2 0 1 0 2 2 2 2 0  0 0-2-2zm10 0a2 2 0 1 0 2 2 2 2 0  0 0-2-2zM7.2 14h9.9a2 2 0 0 0 2-1.6l1.4-7H6.1L5.7 3H2v2h2l2.2 9z"/></svg>`,
  doc:`<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 8V2l6 6zM8 13h8v2H8zm0 4h8v2H8zM8 9h4v2H8z"/></svg>`,
  coins:`<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 3C7 3 3 4.79 3 7s4 4 9 4 9-1.79 9-4-4-4-9-4zm0 6c-5 0-7-1.34-7-2s2-2 7-2 7 1.34 7 2-2 2-7 2zM3 12c0 2.21 4 4 9 4s9-1.79 9-4v3c0 2.21-4 4-9 4s-9-1.79-9-4z"/></svg>`,
  check:`<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>`,
  upload:`<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M5 20h14v-2H5m14-9h-4V3H9v6H5l7 7 7-7z"/></svg>`,
  import:`<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 12l-7 7-7-7h4V3h6v9h4z"/></svg>`,
  gear:`<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm8.94 3a8 8 0  0 0-.65-1.57l1.39-2.41-2.12-2.12-2.41 1.39A8 8 0  0 0 15 3.06V1h-6v2.06A8 8 0  0 0 7.45 4.3L5.04 2.91 2.91 5.03 4.3 7.45A8 8 0 0 0 3.06 9H1v6h2.06a8 8 0 0 0 1.24 2.55l-1.39 2.41 2.12 2.12 2.41-1.39A8 8 0 0 0 9 20.94V23h6v-2.06a8 8 0  0 0 2.55-1.24l2.41 1.39 2.12-2.12-1.39-2.41A8 8 0 0 0 20.94 15H23V9h-2.06z"/></svg>`,
  percent:`<svg viewBox="0 0 24 24" width="18" height="18"><g fill="none" stroke="currentColor" stroke-width="2"><path d="M19 5L5 19"/><circle cx="7" cy="7" r="2"/><circle cx="17" cy="17" r="2"/></g></svg>`
};

function getIcon(name){
  const icons = {
    income:`<svg viewBox="0 0 24 24"><path fill="currentColor" d="M11 3h2v10h3l-4 4-4-4h3zM5 19h14v2H5z"/></svg>`,
    cashflow:`<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 18h7v-2H6.41L19 3.41 17.59 2 5 14.59V10H3v8h8z"/></svg>`,
    aging:`<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 3h18v2H3zM3 7h10v2H3zM3 11h14v2H3zM3 15h6v2H3zM3 19h18v2H3z"/></svg>`,
    bank:I.bank, checklist:I.check, invoice:I.book, bill:I.list, receive:I.upload,
    pay:I.import, journal:I.pencil, recon:I.clock, overdue:I.warn, weekdue:I.clock,
    unposted:I.list, failed:I.warn, tax:I.chart,
    book:I.book, coins:I.coins, cart:I.cart, doc:I.doc, list:I.list, chart:I.chart, gear:I.gear, warn:I.warn, user:I.user, percent:I.percent, clock:I.clock
  };
  return icons[name] || I.list;
}

function shortLabel(label){
  let s = String(label);
  // Abbreviate text inside parentheses like (A/B/C)
  s = s.replace(/\(([^)]+)\)/g, (_, inner)=> '(' + inner.split('/').map(p=>p.trim().split(/\s+/).map(w=>w[0]).join('').toUpperCase()).join('/') + ')');
  s = s.replace(/\b(and|&)\b/gi,'&').replace(/\s{2,}/g,' ').trim();
  if (s.length>28) s = s.slice(0,27)+'…';
  return s;
}

function tileHTML(label, iconName, href){
  const short = shortLabel(label);
  const hrefAttr = href ? ` data-href="${href}"` : "";
  return `
    <button class="tile" type="button"${hrefAttr}
            aria-label="${label}" title="${label}" data-title-short="${short}">
      <span class="tile-icon" title="${label}">${getIcon(iconName)}</span>
      <span class="tile-label" aria-hidden="true">${short}</span>
    </button>
  `;
}

function showToast(msg, type='info'){
  let stack=document.querySelector('.toast-stack');
  if(!stack){ stack=document.createElement('div'); stack.className='toast-stack'; document.body.appendChild(stack); }
  const t=document.createElement('div');
  t.className=`toast ${type==='error'?'error':''}`;
  t.innerHTML=`<div class="toast-content">${msg}</div><button class="toast-close" type="button" aria-label="Close">×</button>`;
  t.querySelector('.toast-close').addEventListener('click',()=>t.remove());
  stack.appendChild(t);
}

/* DOM getters (for fallback inline view) */
const area = ()=>document.getElementById('contentArea');
const titleEl = ()=>document.getElementById('paneTitle');
const homeBtn = ()=>document.getElementById('homeBtn');

function setTitle(t){
  const el = titleEl();
  if (el) el.textContent = t || 'Dashboard';
  const hb = homeBtn();
  if (hb) hb.hidden = (t||'Dashboard')==='Dashboard';
}

/* ===== Open target inside Home top tabs (preferred) or inline fallback ===== */
function openInTopTabs(key, title, href){
  if (!href || href === "#"){
    showToast('No page linked yet.', 'error');
    return;
  }
  if (window.parent && window.parent !== window){
    try{
      window.parent.postMessage({ type: 'open-tab', key, title, href }, '*');
      return;
    }catch(_){}
  }
  openInline(href, title);
}
function openInline(href, pageTitle){
  setTitle(pageTitle || 'Page');
  const a = area();
  if (!a){ window.location.href = href; return; }
  a.innerHTML = `<iframe src="${href}" title="${pageTitle||'Page'}"
      style="width:100%;height:68vh;border:1px solid var(--border);border-radius:12px;background:#fff;"></iframe>`;
}

/* ===== Catalog: inner contents of all modules only (no module cards) ===== */
function modulesCatalog(){
  return [
    // GL
    { label:'Chart of Account', href:'coa.html', icon:'book' },
    { label:'General Journal', href:'general-journal.html', icon:'pencil' },

    // AR
    { label:'Customer List', href:'customer-list.html', icon:'invoice' },
    { label:'Invoice', href:'purchase-invoice.html', icon:'invoice' },

    // AP
    { label:'Vendor List', href:'vendor-list.html', icon:'bill' },

    // Bank & Cash
    { label:'Add/Edit/Deactivate', href:'#', icon:'bank' },
    { label:'Opening Balances', href:'#', icon:'clock' },
    { label:'Signatories & Controls', href:'#', icon:'check' },

    // Fixed Assets
    { label:'Asset Categories (Useful Life/Method/Accounts)', href:'#', icon:'invoice' },
    { label:'Depreciation Methods (SL/DB/Units)', href:'#', icon:'clock' },
    { label:'Thresholds & Capitalization Rules', href:'#', icon:'gear' },

    // Inventory & Cost
    { label:'Methods (FIFO/LIFO/Weighted/Standard)', href:'#', icon:'bill' },
    { label:'Item Cost Cards', href:'#', icon:'invoice' },
    { label:'Cost Revaluation', href:'#', icon:'pencil' },

    // Payroll
    { label:'Journal Template Mapping', href:'#', icon:'upload' },
    { label:'Import Runs', href:'#', icon:'upload' },
    { label:'Error Resolution', href:'#', icon:'warn' },

    // Taxation
    { label:'Tax Codes & Rates (GST/HST/PST/VAT/Sales Tax)', href:'#', icon:'check' },
    { label:'Nexus/Jurisdictions', href:'#', icon:'gear' },
    { label:'Reverse Charge/Withholding Rules', href:'#', icon:'invoice' },
    { label:'Tax Groups on Items/Customers/Vendors', href:'#', icon:'doc' },

    // Reporting & Analysis
    { label:'Profit & Loss (Single/Multiple Period, Comparative)', href:'#', icon:'doc' },
    { label:'Balance Sheet (Classified/Consolidated)', href:'#', icon:'doc' },
    { label:'Cash Flow (Indirect/Direct)', href:'#', icon:'doc' },

    // Budgeting & Forecasting
    { label:'Create/Import Budgets (Account/Dept/Project)', href:'#', icon:'doc' },
    { label:'Versions (Original/Rev1/Rev2)', href:'#', icon:'list' },
    { label:'Approvals', href:'#', icon:'check' },

    // Projects & Cost Centers
    { label:'Projects (Status/Manager/Budget)', href:'#', icon:'book' },
    { label:'Cost Centers (Hierarchy)', href:'#', icon:'list' },

    // Compliance
    { label:'User Activity by Module', href:'#', icon:'doc' },
    { label:'Document History (Create/Edit/Post/Unpost)', href:'#', icon:'doc' },

    // Administration
    { label:'Legal Entities / Branches', href:'#', icon:'book' },
    { label:'Fiscal Calendar', href:'#', icon:'book' },
    { label:'Multi-Currency & FX Rates', href:'#', icon:'list' },
    { label:'Consolidation Rules', href:'#', icon:'gear' },

    // Utilities
    { label:'Search (Global/Advanced)', href:'#', icon:'list' },
    { label:'Attachments & Document Store', href:'#', icon:'doc' },
    { label:'Notes & Mentions', href:'#', icon:'pencil' },
    { label:'Scheduler (Recurring Jobs)', href:'#', icon:'clock' },
    { label:'Error Console (Failed Jobs/Imports)', href:'#', icon:'warn' },
    { label:'Sandbox Tools (Test Posting, Mock Data)', href:'#', icon:'gear' },

    // Help
    { label:'Guided Tours (per module)', href:'#', icon:'list' },
    { label:'How-To Library', href:'#', icon:'book' },
    { label:'Accounting Policies (org-specific)', href:'#', icon:'doc' },
    { label:"Release Notes / What's New", href:'#', icon:'chart' }
  ];
}

/* ===== Persisted order helpers for Drag & Drop ===== */
const ORDER_KEY = "accounting.dashboard.order.v1";

function loadOrder(){
  try { return JSON.parse(localStorage.getItem(ORDER_KEY) || "[]"); } catch { return []; }
}
function saveOrder(ids){
  try { localStorage.setItem(ORDER_KEY, JSON.stringify(ids)); } catch {}
}
function sortItemsBySavedOrder(items){
  const order = loadOrder();
  if (!order.length) return items;
  const pos = new Map(order.map((id, i) => [id, i]));
  return items
    .map((it, idx) => ({ it, idx, rank: pos.has(it.id) ? pos.get(it.id) : 9_000_000 + idx }))
    .sort((a,b)=> a.rank - b.rank || a.idx - b.idx)
    .map(x => x.it);
}

/* ===== Drag & Drop setup ===== */
function initGridDragDrop(grid){
  if (!grid) return;

  grid.querySelectorAll(".tile-wrap").forEach(w => w.setAttribute("draggable","true"));

  let draggingEl = null;
  let justDraggedAt = 0;

  grid.addEventListener("dragstart", (e) => {
    const wrap = e.target.closest(".tile-wrap");
    if (!wrap) return;
    draggingEl = wrap;
    wrap.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", wrap.dataset.id || "drag");
  });

  grid.addEventListener("dragover", (e) => {
    e.preventDefault();
    const target = e.target.closest(".tile-wrap");
    if (!draggingEl || !target || target === draggingEl) return;

    const rect = target.getBoundingClientRect();
    const before = e.clientY < rect.top + rect.height / 2 || e.clientX < rect.left + rect.width / 2;
    if (before) grid.insertBefore(draggingEl, target);
    else grid.insertBefore(draggingEl, target.nextSibling);
  });

  function persist(){
    const ids = [...grid.querySelectorAll(".tile-wrap")].map(w => w.dataset.id);
    saveOrder(ids);
  }

  grid.addEventListener("drop", (e) => { e.preventDefault(); });

  grid.addEventListener("dragend", () => {
    if (draggingEl) draggingEl.classList.remove("dragging");
    draggingEl = null;
    justDraggedAt = Date.now();
    persist();
  });

  // Prevent accidental click right after a drag
  grid.addEventListener("click", (e) => {
    if (Date.now() - justDraggedAt < 250) {
      e.preventDefault();
      e.stopPropagation();
    }
  });
}

/* ===== Dashboard: single flat grid (no titles, no groups) ===== */
function renderDashboard(){
  setTitle('Dashboard');

  // Build items with stable IDs
  const baseItems = modulesCatalog();
  const itemsWithId = baseItems.map(it => {
    let id = keyFromHref(it.href);
    if (id === "page" || !it.href || it.href === "#") id = slugFromLabel(it.label);
    return { ...it, id };
  });

  // Apply saved order
  const items = sortItemsBySavedOrder(itemsWithId);

  const host = area();
  if (!host) return;

  const tilesHTML = items.map(it =>
    `<div class="tile-wrap" draggable="true" data-id="${it.id}">${tileHTML(it.label, it.icon, it.href)}</div>`
  ).join('');

  host.innerHTML = `
    <div class="dash-wrap">
      <div class="tile-grid" id="accDashGrid">
        ${tilesHTML}
      </div>
    </div>
  `;

  // Open handlers
  const grid = host.querySelector('#accDashGrid');
  grid.querySelectorAll('.tile[data-href]').forEach(el=>{
    const label = el.getAttribute('aria-label') || 'Page';
    const href  = el.getAttribute('data-href') || '';
    const key   = keyFromHref(href) || slugFromLabel(label);
    const open = ()=> openInTopTabs(key, label, href);
    el.addEventListener('click', open);
    el.addEventListener('keydown', e=>{
      if(e.key==='Enter'||e.key===' '){ e.preventDefault(); open(); }
    });
  });

  // Enable Drag & Drop (persisting order)
  initGridDragDrop(grid);
}

/* ===== Clicking "Home" in this page switches parent to Home tab ===== */
function hookHomeNavToTabs(){
  document.addEventListener('click', (e)=>{
    const a = e.target.closest('a');
    if (!a) return;
    const href = (a.getAttribute('href')||'').replace(/[?#].*$/,'').toLowerCase();
    const txt  = (a.textContent||'').trim().toLowerCase();
    const isHome = txt === 'home' || /home1\.html$/.test(href) || href === '' || href === '#home';
    if (!isHome) return;

    e.preventDefault();
    // Prefer telling the parent to activate Home tab
    if (window.parent && window.parent !== window){
      try { window.parent.postMessage({ type:'go-home' }, '*'); return; } catch(_){}
    }
    // Fallback: navigate directly
    window.location.href = 'home1.html';
  }, { capture:true });
}

/* ===== Init ===== */
document.addEventListener('DOMContentLoaded', ()=>{
  renderDashboard();
  hookHomeNavToTabs();
  const hb = homeBtn();
  if (hb) hb.addEventListener('click', ()=> renderDashboard());
});
