"use strict";

/* ========= Toast helpers ========= */
function __ensureToastArea(){
  let area = document.getElementById("toastArea");
  if (!area) {
    area = document.createElement("div");
    area.id = "toastArea";
    area.className = "toast-area";
    Object.assign(area.style, {
      position:"fixed",
      right:"16px",
      bottom:"16px",
      zIndex:"2147483647",
      display:"flex",
      flexDirection:"column",
      gap:"10px"
    });
    document.body.appendChild(area);
  }
  return area;
}

function showSuccessToast(msg, timeout = 0){
  if (!msg) return;
  const area = __ensureToastArea();
  const t = document.createElement("div");
  t.className = "toast success";
  Object.assign(t.style, {
    minWidth:"240px",
    maxWidth:"360px",
    border:"1px solid #bbf7d0",
    background:"#ecfdf5",
    color:"#065f46",
    borderRadius:"10px",
    padding:"8px 10px",
    display:"grid",
    gridTemplateColumns:"1fr auto",
    gap:"8px",
    boxShadow:"0 10px 30px rgba(15,23,42,.18),0 2px 8px rgba(0,0,0,.06)",
    pointerEvents:"auto"
  });
  t.innerHTML = `<div class="msg">${msg}</div><button class="close" type="button" aria-label="Close">✕</button>`;
  t.querySelector(".close").addEventListener("click", () => t.remove());
  area.appendChild(t);
  if (timeout && Number(timeout) > 0) setTimeout(() => t.remove(), Number(timeout));
}
window.showSuccessToast = showSuccessToast;

/* ========= Tabs core ========= */
const tabsBar   = document.getElementById("tabsBar");
const tabsViews = document.getElementById("tabsViews");

/* ========= Tabs map ========= */
const TAB_MAP = {
  home:            { title: "Home",                  href: "home1.html",                    navHref: "home1.html" },
  crm:             { title: "CRM",                   href: "crm.html",                      navHref: "crm.html" },
  accounting:      { title: "Accounting",            href: "accounting.html",               navHref: "accounting.html" },
  documents:       { title: "Documents",             href: "documents.html",                navHref: "documents.html" },

  // Real Estate Brokerage tab (was Services)
  services:        { title: "Real Estate Brokerage", href: "Real Estate Brokerage.html",    navHref: null },

  // Project tab config → opens project.html
  project:         { title: "Project",               href: "project.html",                  navHref: null },

  // Extra known pages
  "group-mgmt":    { title: "Group Mgmt",            href: "group1.html",                   navHref: null },
  "role-mgmt":     { title: "Role Mgmt",             href: "roles1.html",                   navHref: null },
  "add-ip":        { title: "Add an IP",             href: "ip.html",                       navHref: null },
  "coa":           { title: "Chart of Account",      href: "coa.html",                      navHref: null },
  "journal":       { title: "General Journal",       href: "journal.html",                  navHref: null },
  "payables":      { title: "Payables",              href: "payables.html",                 navHref: null },
  "receivables":   { title: "Receivables",           href: "receivables.html",              navHref: null },
  "bank-statement":{ title: "Bank statement",        href: "bank-statement.html",           navHref: null },

  // Optional: Vitals page
  Vitals:          { title: "Sales Record Form",     href: "Sales_Record_Sheet_Template.html", navHref: null }
};

/* Auto-size iframes to fit content */
function autoSizeIframe(iframe){
  if(!iframe) return;
  const fit = () => {
    try{
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return;
      const h = Math.max(
        doc.body?.scrollHeight || 0,
        doc.documentElement?.scrollHeight || 0
      );
      if (h) iframe.style.height = h + 'px';
    }catch(e){}
  };
  iframe.addEventListener('load', () => {
    fit();
    const win = iframe.contentWindow;
    try{
      if (win && 'ResizeObserver' in win) {
        const ro = new win.ResizeObserver(fit);
        ro.observe(win.document.documentElement);
      } else if ('ResizeObserver' in window && iframe.contentDocument) {
        const ro = new ResizeObserver(fit);
        ro.observe(iframe.contentDocument.documentElement);
      } else {
        const id = setInterval(() => {
          if (!iframe.isConnected) { clearInterval(id); return; }
          fit();
        }, 300);
      }
    }catch(_){}
  });
}

/* Mark active nav link based on iframe/page href */
function setNavActiveByHref(href){
  const navLinks = [...document.querySelectorAll(".app-nav .nav-link")];
  navLinks.forEach(a => {
    a.classList.remove("active");
    a.removeAttribute("aria-current");
  });
  if (!href) return;
  const link = navLinks.find(
    a => (a.getAttribute("href") || "").replace(/[?#].*$/,"") === href
  );
  if (link) {
    link.classList.add("active");
    link.setAttribute("aria-current","page");
  }
}

/* Switch active tab and view */
function activateTab(key){
  if (!tabsBar || !tabsViews) return;
  tabsBar.querySelectorAll(".tab").forEach(t => {
    const on = t.dataset.key === key;
    t.classList.toggle("active", on);
    if (on) t.setAttribute("aria-selected","true");
    else t.removeAttribute("aria-selected");
  });
  tabsViews.querySelectorAll(".tab-view").forEach(v => {
    v.classList.toggle("active", v.dataset.key === key);
  });
  const conf = TAB_MAP[key] || {};
  setNavActiveByHref(conf.navHref);
}
window.activateTab = activateTab;

/* Ensure pinned Home tab works */
const homePinnedTab = document.getElementById('tab-home');
if (homePinnedTab) {
  homePinnedTab.addEventListener('click', () => activateTab('home'));
}

/* Handle clicks on the tabs bar (switch / close) */
if (tabsBar) {
  tabsBar.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab');
    if (!btn) return;
    const key = btn.dataset.key;
    if (e.target.closest('.close')) {
      e.stopPropagation();
      closeTab(key);
    } else {
      activateTab(key);
    }
  });
}

/* Create a new tab + view with iframe */
function createTab(key, title, href){
  if (!tabsBar || !tabsViews) return;

  const tab = document.createElement("button");
  tab.className = "tab";
  tab.type = "button";
  tab.dataset.key = key;
  tab.role = "tab";
  tab.innerHTML =
    `<span class="label">${title}</span>` +
    `<span class="close" aria-label="Close">×</span>`;
  tabsBar.appendChild(tab);

  const view = document.createElement("section");
  view.className = "tab-view";
  view.dataset.key = key;
  view.role = "tabpanel";

  const iframe = document.createElement("iframe");
  iframe.className = "tab-iframe";
  iframe.src = href;
  iframe.setAttribute("title", title);
  iframe.loading = "lazy";
  iframe.style.width = '100%';
  iframe.style.border = '0';
  iframe.style.height = 'auto';
  autoSizeIframe(iframe);

  view.appendChild(iframe);
  tabsViews.appendChild(view);
}

/* Open (or focus) a tab by key */
function openTab(key, title, href){
  if (!tabsBar || !tabsViews) return;
  if (key === "home") { activateTab("home"); return; }

  const existing = tabsBar.querySelector(`.tab[data-key="${key}"]`);
  if (existing) {
    activateTab(key);
    if (href) {
      const frame = tabsViews.querySelector(`.tab-view[data-key="${key}"] iframe`);
      if (frame && frame.src !== href) {
        frame.src = href;
        autoSizeIframe(frame);
      }
    }
    return;
  }
  const conf = TAB_MAP[key] || { title, href, navHref: null };
  createTab(
    key,
    conf.title || title || key,
    conf.href  || href  || "#"
  );
  activateTab(key);
}

/* Close a tab (not Home) */
function closeTab(key){
  if (!tabsBar || !tabsViews) return;
  if (key === "home") return;
  const tab  = tabsBar.querySelector(`.tab[data-key="${key}"]`);
  const view = tabsViews.querySelector(`.tab-view[data-key="${key}"]`);
  if (tab) tab.remove();
  if (view) view.remove();
  const active = tabsBar.querySelector(".tab.active");
  if (active) {
    activateTab(active.dataset.key);
  } else {
    const last = [...tabsBar.querySelectorAll(".tab")].pop();
    activateTab(last ? last.dataset.key : "home");
  }
}

/* Make Home active on first load */
activateTab("home");

/* Top navbar links → open modules as tabs instead of page navigation */
[...document.querySelectorAll(".app-nav .nav-link")].forEach(a => {
  a.addEventListener("click", (e) => {
    const hrefRaw = a.getAttribute("href") || "";
    const href = hrefRaw.replace(/[?#].*$/,"");
    const label = (a.textContent || "").trim().toLowerCase();
    e.preventDefault();
    if (label === "home" || /home1\.html$/i.test(href)) {
      activateTab("home");
      return;
    }
    const key  = label;
    const conf = TAB_MAP[key] || { title: a.textContent.trim(), href: href };
    openTab(key, conf.title, conf.href);
  });
});

/* Generic opener for [data-tab] triggers anywhere in the app */
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-tab]");
  if (!el) return;
  const keyAttr = (el.dataset.tab || "").trim();
  if (!keyAttr) return;

  if (keyAttr.toLowerCase() === "home") {
    e.preventDefault();
    activateTab("home");
    return;
  }
  if (el.tagName === "A" || el.tagName === "BUTTON") e.stopPropagation();

  const conf = TAB_MAP[keyAttr] || {
    title: (el.textContent || keyAttr).trim(),
    href:  (el.getAttribute("href") || el.dataset.href || "#").replace(/#.*$/,"")
  };
  e.preventDefault();
  openTab(keyAttr, conf.title, conf.href);
});

/* ========= Flash via URL hash (success messages) ========= */
function takeFlashFromHash(removeAfter = true){
  try {
    const hash = location.hash.startsWith("#")
      ? location.hash.slice(1)
      : location.hash;
    if (!hash) return null;
    const params = new URLSearchParams(hash);
    const v = params.get("flash_ok");
    if (v && removeAfter) {
      params.delete("flash_ok");
      const newHash = params.toString();
      const newUrl =
        location.pathname +
        location.search +
        (newHash ? "#" + newHash : "");
      history.replaceState(null, "", newUrl);
    }
    return v ? decodeURIComponent(v) : null;
  } catch {
    return null;
  }
}

/* React to postMessage events from iframes (open tab / go home) */
window.addEventListener("message", (event) => {
  const d = event.data;
  if (!d || !d.type) return;
  if (d.type === "go-home") {
    activateTab("home");
    if (d.flash_ok && String(d.flash_ok).trim())
      showSuccessToast(String(d.flash_ok), 0);
    return;
  }
  if (d.type === "open-tab") {
    const key   = d.key;
    const title = d.title || (TAB_MAP[key]?.title) || key;
    const href  = d.href  || (TAB_MAP[key]?.href)  || '#';
    openTab(key, title, href);
  }
});

/* Handle URL hash changes for flash messages */
window.addEventListener("hashchange", () => {
  const m = takeFlashFromHash(false);
  if (m) {
    activateTab("home");
    showSuccessToast(m, 0);
  }
});

/* Initialize any flash message present on load */
(function bootFlash(){
  function boot(){
    const m = takeFlashFromHash(true);
    if (m) {
      activateTab("home");
      showSuccessToast(m, 0);
    }
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
  else
    boot();
})();

/* ========= Lock home tiles order & disable drag-and-drop logic ========= */
(function lockHomeTilesOrder() {
  const grid = document.getElementById('homeGrid');
  if (!grid) return;

  // Fixed order by data-id (first row 4 tiles, second row 3 tiles)
  const order = ['crm', 'accounting', 'documents', 'teams', 'services', 'project-mgmt', 'property-mgmt'];

  // Index elements by data-id
  const map = {};
  grid.querySelectorAll('.home-tile, .service-tile').forEach(el => {
    if (!el.dataset.id) return;
    map[el.dataset.id] = el;
    // Disable drag behavior at DOM level
    el.setAttribute('draggable', 'false');
    el.removeAttribute('aria-grabbed');
  });

  // Re-append in exact order
  order.forEach(id => { if (map[id]) grid.appendChild(map[id]); });

  // Clear any saved custom order
  try { localStorage.removeItem('home.inlineTiles.order.v3'); } catch (e) {}

  // Prevent DnD initialization elsewhere
  window.HOME_TILES_LOCKED = true;
})();

/* Wire Real Estate Brokerage tile → open Real Estate tab */
(function wireServiceTile(){
  const tile = document.querySelector('#homeGrid [data-id="services"]');
  if (!tile) return;
  tile.addEventListener('click', (e) => {
    e.preventDefault();
    const conf = TAB_MAP['services'] || { title: 'Real Estate Brokerage', href: 'services2.html' };
    openTab('services', conf.title, conf.href);
  });
})();

/* Wire Project Management tile → open Project tab */
(function wireProjectTile(){
  const tile = document.querySelector('#homeGrid [data-id="project-mgmt"]');
  if (!tile) return;
  tile.addEventListener('click', (e) => {
    e.preventDefault();
    const conf = TAB_MAP['project'] || { title: 'Project', href: 'project.html' };
    openTab('project', conf.title, conf.href);
  });
})();

/* ========= Legacy Drag & Drop logic (kept for reference, disabled by flag) ========= */
function initInlineTiles(containerId, storageKey){
  if (window.HOME_TILES_LOCKED) return;

  const grid = document.getElementById(containerId);
  if (!grid) return;

  const loadOrder = () => {
    try { return JSON.parse(localStorage.getItem(storageKey) || "[]"); }
    catch { return []; }
  };

  const saveOrder = () => {
    const ids = [...grid.querySelectorAll(".draggable-tile")].map(el => el.dataset.id);
    try { localStorage.setItem(storageKey, JSON.stringify(ids)); } catch {}
  };

  const applyOrder = () => {
    const order = loadOrder();
    if (!order.length) return;
    const map = {};
    [...grid.querySelectorAll(".draggable-tile")].forEach(el => {
      map[el.dataset.id] = el;
    });
    order.forEach(id => {
      const el = map[id];
      if (el) grid.appendChild(el);
    });
  };

  applyOrder();

  let draggingEl = null;
  let justDraggedAt = 0;

  grid.addEventListener("dragstart", (e) => {
    const item = e.target.closest(".draggable-tile");
    if (!item) return;
    draggingEl = item;
    item.classList.add("dragging");
    item.setAttribute("aria-grabbed","true");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", item.dataset.id || "drag");
  });

  grid.addEventListener("dragover", (e) => {
    e.preventDefault();
    if (!draggingEl) return;

    const under = document.elementFromPoint(e.clientX, e.clientY);
    const target = under && under.closest("#"+containerId+" .draggable-tile");
    if (!target || target === draggingEl) return;

    const rect = target.getBoundingClientRect();
    const before = (e.clientY < rect.top + rect.height / 2);
    if (before) grid.insertBefore(draggingEl, target);
    else grid.insertBefore(draggingEl, target.nextSibling);
  });

  grid.addEventListener("drop", (e) => { e.preventDefault(); });

  grid.addEventListener("dragend", () => {
    if (draggingEl) draggingEl.classList.remove("dragging");
    if (draggingEl) draggingEl.setAttribute("aria-grabbed","false");
    draggingEl = null;
    justDraggedAt = Date.now();
    saveOrder();
  });

  grid.addEventListener("click", (e) => {
    const a = e.target.closest("a.draggable-tile");
    if (!a) return;
    if (Date.now() - justDraggedAt < 300) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  grid.addEventListener("keydown", (e) => {
    const item = e.target.closest(".draggable-tile");
    if (!item) return;
    if (!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)) return;

    const tiles = [...grid.querySelectorAll(".draggable-tile")];
    const idx = tiles.indexOf(item);
    if (idx < 0) return;

    e.preventDefault();
    let swapWith = idx;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp")   swapWith = Math.max(0, idx - 1);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") swapWith = Math.min(tiles.length - 1, idx + 1);

    if (swapWith !== idx) {
      const ref = tiles[swapWith];
      if (swapWith > idx) grid.insertBefore(item, ref.nextSibling);
      else grid.insertBefore(item, ref);
      item.focus();
      saveOrder();
    }
  });
}

/* Do NOT run legacy DnD because layout is locked */
(function bootTiles(){
  if (window.HOME_TILES_LOCKED) return;
  const start = () => initInlineTiles("homeGrid", "home.inlineTiles.order.v3");
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", start);
  else
    start();
})();
