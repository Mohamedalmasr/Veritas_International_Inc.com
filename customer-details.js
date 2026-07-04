"use strict";

/* ===== helpers ===== */
const $  = (s, r=document)=>r.querySelector(s);
const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));
const money = (n)=> (n??0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
const days  = (n)=> `${n} days`;

/* Parse query */
function qs(){
  const u = new URL(location.href);
  return {
    acc:  u.searchParams.get("acc") || "",
    name: u.searchParams.get("name") || ""
  };
}

/* Demo dataset (extra details per account) */
const EXTRA = {
  "100-200-001": {
    contact:"Tania Marshmellow", phone1:"(604) 555-9477", phone2:"", fax:"",
    taxId:"", email:"abercombie@bc.ca", web:"abercrombie.example.com",
    street1:"65 Arrow Street", street2:"", city:"Vancouver",
    prov:"British Columbia", postal:"V2P 3P3", country:"Canada",
    dept:"8000 Construction/Engineering", since:"Aug 09, 2017",
    creditLimit:94700, terms:"Net 45", avgDaysToPay:21, riskScore:82, openOrders:0,
    attachments:3, lastPurchase:"Sep 09, 2024",
    ytd:1200, ly:1200, payExcY1:6808.95, payExcY2:22499.30
  },
  "100-200-002": {
    contact:"Elaine Norris", phone1:"(416) 555-1029", phone2:"", fax:"",
    taxId:"", email:"acme@example.com", web:"acme.example.com",
    street1:"12 Elm Street", street2:"Suite 220", city:"Toronto",
    prov:"Ontario", postal:"M5V 2T6", country:"Canada",
    dept:"Retail", since:"Jan 12, 2019",
    creditLimit:15000, terms:"Net 30", avgDaysToPay:14, riskScore:25, openOrders:1,
    attachments:1, lastPurchase:"Jan 05, 2025",
    ytd:2004.95, ly:2440.10, payExcY1:2400.00, payExcY2:1980.25
  },
  "100-200-003": {
    contact:"Owen Black", phone1:"(604) 555-7780", phone2:"", fax:"",
    taxId:"", email:"blackwell@example.com", web:"blackwell.example.com",
    street1:"75 Burrard", street2:"", city:"Vancouver",
    prov:"British Columbia", postal:"V6Z 2K2", country:"Canada",
    dept:"Rentals", since:"May 22, 2020",
    creditLimit:40000, terms:"Net 30", avgDaysToPay:18, riskScore:44, openOrders:2,
    attachments:0, lastPurchase:"Dec 21, 2024",
    ytd:10175.85, ly:8700.15, payExcY1:9600.10, payExcY2:8650.25
  },
  // … (you can extend with the rest; unknown accounts will get sensible defaults)
};

/* Taxes (read-only table) */
const DEFAULT_TAX_ROWS = [
  { tax:"GST", exempt:false },
  { tax:"PST", exempt:false },
  { tax:"PST Customer ID", exempt:false },
  { tax:"HST", exempt:false }
];

/* ===== tabs ===== */
function activateTab(id){
  $$(".tab-btn").forEach(b=>{
    const on = b.getAttribute("aria-controls") === id;
    b.classList.toggle("active", on);
    b.setAttribute("aria-selected", on ? "true" : "false");
  });
  $$(".tab-panel").forEach(p=> p.classList.toggle("active", p.id === id));
}

function bindTabs(){
  $$(".tab-btn").forEach(btn=>{
    btn.addEventListener("click", ()=> activateTab(btn.getAttribute("aria-controls")));
    btn.addEventListener("keydown", (e)=>{
      if (e.key!=="ArrowLeft" && e.key!=="ArrowRight") return;
      const all = $$(".tab-btn");
      const i = all.indexOf(btn);
      const j = (e.key==="ArrowRight") ? (i+1)%all.length : (i-1+all.length)%all.length;
      all[j].focus(); all[j].click();
    });
  });
}

/* ===== hydrate page from dataset ===== */
function riskLabel(score){
  if (score >= 80) return `Medium (${score})`;
  if (score >= 50) return `Low (${score})`;
  return `Very Low (${score})`;
}

function fillSummary(baseAmount, ext){
  $("#sumBalance").textContent    = money(baseAmount);
  $("#sumLimit").textContent      = money(ext.creditLimit ?? 0);
  $("#sumTerms").textContent      = ext.terms || "—";
  $("#sumAvgDays").textContent    = ext.avgDaysToPay != null ? days(ext.avgDaysToPay) : "—";
  $("#sumRisk").textContent       = ext.riskScore != null ? riskLabel(ext.riskScore) : "—";
  $("#sumOpenOrders").textContent = ext.openOrders ?? 0;
  $("#sumAttach").textContent     = ext.attachments ?? 0;

  $("#barBal").textContent  = money(baseAmount);
  $("#barLast").textContent = ext.lastPurchase || "—";

  $("#statYTD").textContent   = money(ext.ytd ?? 0);
  $("#statLY").textContent    = money(ext.ly ?? 0);
  $("#payExcY1").textContent  = money(ext.payExcY1 ?? 0);
  $("#payExcY2").textContent  = money(ext.payExcY2 ?? 0);
  $("#payIncY1").textContent  = money((ext.payExcY1 ?? 0) * 1.05); // demo uplift with tax
  $("#payIncY2").textContent  = money((ext.payExcY2 ?? 0) * 1.05);
}

function fillAddress(ext){
  $("#fContact").value = ext.contact || "";
  $("#fPhone1").value  = ext.phone1 || "";
  $("#fPhone2").value  = ext.phone2 || "";
  $("#fFax").value     = ext.fax || "";
  $("#fTaxId").value   = ext.taxId || "";
  $("#fEmail").value   = ext.email || "";
  $("#fWeb").value     = ext.web || "";
  $("#fStreet1").value = ext.street1 || "";
  $("#fStreet2").value = ext.street2 || "";
  $("#fCity").value    = ext.city || "";
  $("#fProv").value    = ext.prov || "";
  $("#fPostal").value  = ext.postal || "";
  $("#fCountry").value = ext.country || "";
  $("#fDept").value    = ext.dept || "";
  $("#fSince").value   = ext.since || "";
  $("#fBN").value      = ext.taxId || "—";
}

function buildTaxes(ext){
  const tbody = $("#taxRows");
  tbody.innerHTML = "";
  (DEFAULT_TAX_ROWS).forEach(r=>{
    const tr = document.createElement("tr");
    const exempt = r.exempt ? "Yes" : "No";
    tr.innerHTML = `<td>${r.tax}</td><td>${exempt}</td>`;
    tbody.appendChild(tr);
  });
}

/* Source amounts for balance from known AR list (fallback) */
const AR_BALANCES = {
  "100-200-001": 6467.65,
  "100-200-002": 0.00,
  "100-200-003": 0.00,
  "100-200-004": 0.00,
  "100-200-005": 0.00,
  "100-200-006": 1403.46,
  "100-200-007": 0.00,
  "100-200-008": 0.00,
  "100-200-009": 415.58,
  "100-200-010": 8282.25,
  "100-200-011": 0.00,
  "100-200-012": 0.00,
  "100-200-013": 920.00,
  "100-200-014": 110.75,
  "100-200-015": 0.00
};

/* Boot */
window.addEventListener("DOMContentLoaded", ()=>{
  bindTabs();

  const { acc, name } = qs();
  const ext = EXTRA[acc] || {
    contact:"Accounts Payable", phone1:"", phone2:"", fax:"",
    taxId:"", email:"", web:"", street1:"", street2:"", city:"",
    prov:"", postal:"", country:"", dept:"", since:""
  };

  const pageName = name && name.trim() ? name.trim() : "Customer";
  document.title = pageName;
  $("#custName").textContent = pageName;
  $("#custAcc").textContent  = acc || "—";

  const bal = AR_BALANCES[acc] ?? 0;
  fillSummary(bal, ext);
  fillAddress(ext);
  buildTaxes(ext);
});
