"use strict";

(function () {
  const icons = {
    save: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 3h12l1 1v13H3V4l1-1zm3 2v2h6V5H7zm0 4v6h6V9H7z"></path></svg>',
    edit: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 14.5V17h2.5l7.1-7.1-2.5-2.5L3 14.5zm11.8-8.4c.3-.3.3-.8 0-1.1L13 3.2c-.3-.3-.8-.3-1.1 0l-1.3 1.3 2.5 2.5 1.3-1.3z"></path></svg>',
  };

  const setEditIcon = (btn, isLocked, labelText) => {
    if (!btn) return;
    const target = labelText || "entry";
    btn.innerHTML = isLocked ? icons.edit : icons.save;
    btn.setAttribute("aria-label", isLocked ? `Edit ${target}` : `Save ${target}`);
    btn.title = isLocked ? `Edit ${target}` : `Save ${target}`;
  };

  const initDynamicList = ({
    listId,
    templateId,
    labelSelector,
    namePrefix,
    labelText,
    idBase,
  }) => {
    const listEl = document.getElementById(listId);
    const templateEl = document.getElementById(templateId);
    if (!listEl || !templateEl) return;

    let entryCounter = 0;

    const lockEntry = (entry, shouldLock) => {
      entry.classList.toggle("is-locked", shouldLock);

      entry.querySelectorAll("select").forEach((select) => {
        select.disabled = shouldLock;
      });

      const nameInput = entry.querySelector('[data-role="vendorName"]');
      if (nameInput) {
        nameInput.readOnly = shouldLock;
      }

      const editBtn = entry.querySelector('[data-action="edit"]');
      setEditIcon(editBtn, shouldLock, labelText);
    };

    const createEntry = () => {
      const entry = templateEl.content.firstElementChild.cloneNode(true);
      const index = entryCounter++;
      entry.dataset.index = index;

      const identifierSelect = entry.querySelector('[data-role="identifierType"]');
      const entityTypeSelect = entry.querySelector('[data-role="entityType"]');
      const nameInput = entry.querySelector('[data-role="vendorName"]');

      if (identifierSelect) {
        identifierSelect.name = `${namePrefix}[${index}][identifierType]`;
      }
      if (entityTypeSelect) {
        entityTypeSelect.name = `${namePrefix}[${index}][entityType]`;
      }
      if (nameInput) {
        nameInput.name = `${namePrefix}[${index}][name]`;
        const base = idBase || `${namePrefix}Name`;
        nameInput.id = `${base}_${index}`;
      }

      return entry;
    };

    const addEntry = () => {
      const entry = createEntry();
      const nameInput = entry.querySelector('[data-role="vendorName"]');
      listEl.appendChild(entry);
      lockEntry(entry, false);

      if (listEl.children.length === 1 && labelSelector && nameInput) {
        const labelEl = document.querySelector(labelSelector);
        if (labelEl) {
          labelEl.setAttribute("for", nameInput.id);
        }
      }

      if (nameInput) {
        nameInput.focus({ preventScroll: true });
      }
    };

    const deleteEntry = (entry) => {
      entry.remove();
      if (!listEl.children.length) {
        addEntry();
      }
    };

    listEl.addEventListener("click", (event) => {
      const actionButton = event.target.closest("[data-action]");
      if (!actionButton) return;

      const entry = actionButton.closest(".srs-vendor-entry");
      if (!entry) return;

      const action = actionButton.dataset.action;

      if (action === "add") {
        addEntry();
      } else if (action === "delete") {
        deleteEntry(entry);
      } else if (action === "edit") {
        const isLocked = entry.classList.contains("is-locked");
        lockEntry(entry, !isLocked);

        if (isLocked === true) {
          const input = entry.querySelector('[data-role="vendorName"]');
          if (input) {
            input.focus({ preventScroll: true });
          }
        }
      }
    });

    addEntry();
  };

  initDynamicList({
    listId: "vendorList",
    templateId: "vendorEntryTemplate",
    labelSelector: ".srs-vendor-label",
    namePrefix: "vendorEntries",
    labelText: "vendor",
    idBase: "vendorName",
  });

  initDynamicList({
    listId: "purchaserList",
    templateId: "purchaserEntryTemplate",
    labelSelector: ".srs-purchaser-label",
    namePrefix: "purchaserEntries",
    labelText: "purchaser",
    idBase: "purchaserName",
  });

  const commissionTypeSelect = document.getElementById("commissionType");
  const commissionRateField = document.querySelector(".srs-commission-rate");
  const commissionAmountField = document.querySelector(".srs-commission-amount");
  const commissionRateInput = document.getElementById("commissionRate");
  const commissionAmountInput = document.getElementById("commissionAmount");

  if (commissionTypeSelect && commissionRateField && commissionAmountField) {
    const syncCommissionFields = () => {
      const type = commissionTypeSelect.value;

      if (type === "rate") {
        commissionRateField.hidden = false;
        commissionAmountField.hidden = true;
        if (commissionRateInput) commissionRateInput.disabled = false;
        if (commissionAmountInput) commissionAmountInput.disabled = true;
      } else {
        commissionRateField.hidden = true;
        commissionAmountField.hidden = false;
        if (commissionRateInput) commissionRateInput.disabled = true;
        if (commissionAmountInput) commissionAmountInput.disabled = false;
      }
    };

    commissionTypeSelect.addEventListener("change", syncCommissionFields);
    syncCommissionFields();
  }

  const initDepositRows = () => {
    const tbody = document.getElementById("depositRows");
    const template = document.getElementById("depositRowTemplate");
    if (!tbody || !template) return;

    let rowIndex = 0;

    const createRow = () => {
      const row = template.content.firstElementChild.cloneNode(true);
      const index = rowIndex++;
      row.dataset.index = index;

      row.querySelectorAll("[data-role]").forEach((el) => {
        const role = el.dataset.role;
        el.name = `deposits[${index}][${role}]`;
      });

      return row;
    };

    const addRowAfter = (refRow) => {
      const newRow = createRow();
      if (refRow && refRow.parentNode === tbody) {
        tbody.insertBefore(newRow, refRow.nextSibling);
      } else {
        tbody.appendChild(newRow);
      }
    };

    const deleteRow = (row) => {
      row.remove();
      if (!tbody.children.length) {
        addRowAfter(null);
      }
    };

    tbody.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-action]");
      if (!btn) return;

      const action = btn.dataset.action;
      const row = btn.closest(".srs-deposit-row");
      if (!row) return;

      if (action === "add-row") {
        addRowAfter(row);
      } else if (action === "delete-row") {
        deleteRow(row);
      }
    });

    addRowAfter(null);
  };

  initDepositRows();
})();