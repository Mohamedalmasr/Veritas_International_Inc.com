"use strict";

/* ================================
   Money helpers (for Budget only)
   ================================ */
function parseMoney(v){ return Number(String(v||"").replace(/[^0-9.-]+/g,"")) || 0; }
function fmtMoney(n){ return n.toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2}); }
function formatMoneyInput(inp){
  const raw = parseMoney(inp.value);
  if (inp.value.trim() !== "") inp.value = fmtMoney(raw);
}

/* ================================
   Tiny toast helper
   ================================ */
function toastOK(msg){
  const area = document.getElementById("toastArea");
  if (!area) return;
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  area.appendChild(t);
  setTimeout(()=> t.remove(), 3000);
}

/* ================================
   Wire up interactions
   ================================ */
window.addEventListener("DOMContentLoaded", () => {
  // Format Budget on blur
  const budget = document.getElementById("budget");
  if (budget){
    budget.addEventListener("blur", () => formatMoneyInput(budget));
  }

  // Mock actions for the documents buttons
  const loadBtn = document.getElementById("btnLoadDocs");
  const linkBtn = document.getElementById("btnLinkDocs");

  loadBtn?.addEventListener("click", () => toastOK("Opening file picker for project documents…"));
  linkBtn?.addEventListener("click", () => toastOK("Linking to existing documents…"));
});
