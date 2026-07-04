"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const tabsBar = document.getElementById("tabsBar");
  const tabsViews = document.getElementById("tabsViews");

  if (!tabsBar || !tabsViews) return;

  function activateTab(key) {
    tabsBar.querySelectorAll(".srt-tab").forEach((tab) => {
      const isActive = tab.dataset.key === key;
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    tabsViews.querySelectorAll(".srt-tab-view").forEach((view) => {
      view.classList.toggle("active", view.dataset.key === key);
    });
  }

  tabsBar.addEventListener("click", (e) => {
    const tab = e.target.closest(".srt-tab");
    if (!tab) return;

    const key = tab.dataset.key;
    activateTab(key);
  });
});