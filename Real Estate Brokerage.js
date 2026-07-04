"use strict";

function openInParentOrHere({ key, title, href }) {
  try {
    if (window.parent && window.parent !== window && window.parent.postMessage) {
      window.parent.postMessage({ type: "open-tab", key, title, href }, "*");
      return;
    }
  } catch (_) {
  }

  if (href) {
    window.location.href = href;
  }
}

document.addEventListener("click", (e) => {
  const a = e.target.closest("a.home-tile");
  if (!a) return;

  e.preventDefault();

  if (a.id === "svc-trade") {
    openInParentOrHere({
      key: "Sales Record Form",
      title: "Sales Record Form",
      href: "sales-record-tabs.html"
    });
    return;
  }

  if (a.id === "svc-trade-record") {
    openInParentOrHere({
      key: "TradeRecord",
      title: "TradeRecord",
      href: "TradeRecord.html"
    });
    return;
  }

  if (a.id === "svc-monthly-checklist") {
    openInParentOrHere({
      key: "Monthly_Trust_Account_Checklist_MonthEndCutOff",
      title: "Monthly_Trust_Account_Checklist_MonthEndCutOff",
      href: "Monthly_Trust_Account_Checklist_MonthEndCutOff.html"
    });
    return;
  }

  const href = a.getAttribute("href");
  if (href) {
    window.location.href = href;
  }
});