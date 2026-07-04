"use strict";

/* Short selectors */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const TOTAL_STEPS = 5;
const USER_NAME_DEFAULT = "Lenzi Aziz";

/* Money helpers */
const parseMoney = v =>
  Number(String(v || "").replace(/[^0-9.-]+/g, "")) || 0;
const fmtMoney = n =>
  n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
function formatMoneyInput(inp) {
  const raw = parseMoney(inp.value);
  if (inp.value.trim() !== "") inp.value = fmtMoney(raw);
}

/* Toasts */
function toastOK(msg) {
  const area = $("#toastArea");
  if (!area) return;
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  area.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}
function showPersistWarning(msg, onOk) {
  const area = $("#toastArea");
  if (!area) return;
  area.innerHTML = "";
  const box = document.createElement("div");
  box.className = "toast warn";
  box.innerHTML =
    '<div class="msg"></div><button class="btn-ok" type="button">OK</button>';
  box.querySelector(".msg").textContent = msg;
  area.appendChild(box);
  box.querySelector(".btn-ok").addEventListener("click", async () => {
    try {
      await onOk?.();
    } finally {
      box.remove();
    }
  });
}

/* Simple storage (best-effort) */
const DRAFT_KEY = "vitals.form.draft.v1";
const FINAL_KEY = "vitals.form.final.v1";
const getFormData = () =>
  Object.fromEntries(new FormData($("#projectForm")).entries());

function setFormData(data) {
  const form = $("#projectForm");
  if (!form || !data) return;
  Object.entries(data).forEach(([k, v]) => {
    const el = form.elements[k];
    if (!el) return;
    if (el instanceof RadioNodeList) {
      $$(`input[name="${k}"]`).forEach(r => {
        r.checked = r.value === v;
      });
    } else {
      el.value = v;
    }
  });
  $$(".money").forEach(formatMoneyInput);
}
const saveDraft = () => {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(getFormData()));
    toastOK("Draft saved.");
  } catch {}
};
const loadDraft = () => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    setFormData(JSON.parse(raw));
  } catch {}
};
const saveFinal = () => {
  try {
    localStorage.setItem(FINAL_KEY, JSON.stringify(getFormData()));
    toastOK("Saved.");
  } catch {}
};

/* Owned-by toggle */
function updateOwnedByField() {
  const sel = $("#ownedBy");
  const name = $("#ownedByName");
  if (!sel || !name) return;
  const v = sel.value;
  if (v === "organization") {
    name.placeholder = "Organization name";
    name.classList.add("show");
  } else if (v === "individual") {
    name.placeholder = "Individual name";
    name.classList.add("show");
  } else {
    name.value = "";
    name.classList.remove("show");
  }
}

/* Deposit allocation (for Deposit Amount vs cash/cheque/e-transfer) */
const methodLabel = { cash: "Cash", "e-transfer": "e-Transfer", cheque: "Cheque" };
function selectedMethods() {
  return $$(
    '.pay-method .seg input[type="checkbox"]:checked'
  ).map(c => c.value);
}
function refreshAllocUI(preserve) {
  const wrap = $("#allocWrap");
  if (!wrap) return;
  const methods = selectedMethods();
  const total = parseMoney($("#depositAmount")?.value);
  if (!methods.length || total <= 0) {
    wrap.innerHTML = "";
    wrap.hidden = true;
    return;
  }

  let prev = {};
  if (preserve) {
    $$(".alloc-item", wrap).forEach(it => {
      const key = it.dataset.key;
      const val = parseMoney(it.querySelector(".alloc-input")?.value);
      if (val > 0) prev[key] = val;
    });
  }

  wrap.hidden = false;
  wrap.innerHTML = methods
    .map(
      k => `
    <div class="alloc-item" data-key="${k}">
      <span class="tag">${methodLabel[k] || k}</span>
      <input type="text" class="alloc-input money" inputmode="decimal" aria-label="${methodLabel[k] ||
        k} amount"/>
    </div>`
    )
    .join("");

  let amounts = methods.map(k => prev[k] || 0);
  const prevSum = amounts.reduce((a, b) => a + b, 0);
  if (prevSum <= 0) {
    if (methods.length === 1) {
      amounts = [total];
    } else {
      const per = Math.floor((total * 100) / methods.length) / 100;
      amounts = methods.map((_, i) =>
        i < methods.length - 1
          ? per
          : Math.round((total - per * (methods.length - 1)) * 100) / 100
      );
    }
  }
  $$(".alloc-input", wrap).forEach((inp, i) => {
    inp.value = fmtMoney(amounts[i]);
    inp.addEventListener("blur", () => formatMoneyInput(inp));
  });
}

/* Step navigation */
const STEP_TITLES = {
  1: "Parties & Property",
  2: "Deposit Details & Trust",
  3: "Cancellation",
  4: "Solicitors",
  5: "Notes & Certification"
};
let currentStep = 1;

const stepStickyLabel = $("#stepStickyLabel");
const stepStickyProg = $("#stepStickyProg");

function updateStepUI() {
  if (stepStickyLabel) {
    stepStickyLabel.textContent = `Step ${currentStep} of ${TOTAL_STEPS} — ${
      STEP_TITLES[currentStep] || ""
    }`;
  }
  if (stepStickyProg) {
    stepStickyProg.style.width = `${(currentStep / TOTAL_STEPS) * 100}%`;
  }
  const boxes = $$(".step-box");
  boxes.forEach(box => {
    const s = Number(box.dataset.step);
    box.classList.remove("is-current", "is-done");
    if (s < currentStep) box.classList.add("is-done");
    else if (s === currentStep) box.classList.add("is-current");
  });
}

function showStep(n) {
  if (n < 1 || n > TOTAL_STEPS) return;
  currentStep = n;
  $$(".form-step").forEach(sec => {
    const s = Number(sec.dataset.step);
    sec.setAttribute("data-active", s === currentStep ? "true" : "false");
  });
  updateStepUI();
  const active = $(`.form-step[data-step="${currentStep}"]`);
  if (active) {
    const y = active.getBoundingClientRect().top + window.scrollY - 60;
    window.scrollTo({ top: y, behavior: "smooth" });
  }
}

/* Picker (example data) */
const INDIVIDUALS = [
  {
    ip: "192.168.1.20",
    first: "Ahmed",
    last: "Kamel",
    phone: "+20 100 111 2222",
    email: "ahmed.kamel@example.com",
    address: "12 Nile St, Cairo"
  },
  {
    ip: "172.16.2.5",
    first: "Ahmed",
    last: "Samir",
    phone: "+20 100 222 3333",
    email: "ahmed.samir@example.com",
    address: "22 Ramses, Cairo"
  },
  {
    ip: "192.168.1.55",
    first: "Ahmad",
    last: "Zaki",
    phone: "+20 100 333 4444",
    email: "ahmad.zaki@example.com",
    address: "5 Tahrir Sq, Cairo"
  },
  {
    ip: "192.168.1.21",
    first: "Ahmed",
    last: "Gamal",
    phone: "+966 55 123 4567",
    email: "ahmed.gamal@example.com",
    address: "13 King Rd, Riyadh"
  },
  {
    ip: "10.0.0.44",
    first: "Hassan",
    last: "Ibrahim",
    phone: "+971 50 987 6543",
    email: "hassan.ibrahim@example.com",
    address: "3 Bay St, Dubai"
  },
  {
    ip: "192.168.0.8",
    first: "Kareem",
    last: "Adel",
    phone: "+20 100 555 6666",
    email: "kareem.adel@example.com",
    address: "10 Smart Village, Giza"
  },
  {
    ip: "192.1682.33",
    first: "Mona",
    last: "Aly",
    phone: "+20 100 777 8888",
    email: "mona.aly@example.com",
    address: "7 Zamalek, Cairo"
  },
  {
    ip: "10.10.10.10",
    first: "Sara",
    last: "Nader",
    phone: "+966 53 100 1000",
    email: "sara.nader@example.com",
    address: "4 Prince Rd, Riyadh"
  }
];

const picker = {
  sheet: $("#pickerSheet"),
  closeBtn: $("#pickerClose"),
  form: $("#pickerForm"),
  q: $("#pickerQ"),
  results: $("#pickerResults"),
  bySel: $("#bySelect"),
  targetInput: null,
  role: "p",
  byKey: "first"
};

function buildBySelect() {
  if (!picker.bySel) return;
  const opts = [
    { key: "first", label: "First Name" },
    { key: "last", label: "Last Name" },
    { key: "ip", label: "IP" }
  ];
  picker.bySel.innerHTML = opts
    .map(o => `<option value="${o.key}">${o.label}</option>`)
    .join("");
  picker.byKey = "first";
}
function updatePickerPlaceholder() {
  if (!picker.q) return;
  if (picker.byKey === "ip") picker.q.placeholder = "e.g. 192.168.1.20";
  else if (picker.byKey === "first") picker.q.placeholder = "e.g. Ahmed";
  else picker.q.placeholder = "e.g. Kamel";
}
function openPicker(targetInput, role) {
  picker.targetInput = targetInput;
  picker.role = role || "p";
  buildBySelect();
  updatePickerPlaceholder();
  if (picker.q) picker.q.value = "";
  if (picker.results) picker.results.innerHTML = "";
  picker.sheet?.setAttribute("data-open", "true");
  setTimeout(() => picker.q?.focus(), 30);
}
function closePicker() {
  picker.sheet?.removeAttribute("data-open");
  picker.targetInput = null;
}
function filterItems(by, q) {
  const v = (q || "").toString().trim().toLowerCase();
  if (!v) return [];
  if (by === "first")
    return INDIVIDUALS.filter(p => (p.first || "").toLowerCase().includes(v));
  if (by === "last")
    return INDIVIDUALS.filter(p => (p.last || "").toLowerCase().includes(v));
  return INDIVIDUALS.filter(p => (p.ip || "").toLowerCase().includes(v));
}
function renderPicker(items) {
  if (!picker.results) return;
  picker.results.setAttribute("aria-busy", "true");
  picker.results.innerHTML = items.length
    ? items
        .map(
          x => `
    <div class="res-item" data-ip="${x.ip}">
      <strong>${x.first} ${x.last}</strong>
      <small>${x.ip}</small>
      <button class="pick-select" type="button"
              data-name="${x.first} ${x.last}"
              data-phone="${x.phone}"
              data-email="${x.email}"
              data-address="${x.address}">Select</button>
    </div>`
        )
        .join("")
    : `<div style="padding:12px;">No results.</div>`;
  picker.results.removeAttribute("aria-busy");
}

/* Notes */
function initNotes() {
  const noteInput = $("#memoText");
  const notesArea = $("#notesArea");
  const addBtn = $("#btnAddNote");
  const clearBtn = $("#btnClearNote");
  if (!notesArea || !addBtn || !clearBtn) return;

  addBtn.addEventListener("click", () => {
    const txt = (noteInput?.value || "").trim();
    if (!txt) {
      toastOK("Write a note first.");
      return;
    }
    const stamp = new Date().toLocaleString();
    const author = $("#reportOfName")?.value || USER_NAME_DEFAULT;
    const card = document.createElement("div");
    card.className = "note-card";
    card.innerHTML = `<div class="note-head">${author} wrote on ${stamp}:</div>
      <div class="note-body">${txt
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}</div>`;
    notesArea.appendChild(card);
    if (noteInput) noteInput.value = "";
  });

  clearBtn.addEventListener("click", () => {
    if (noteInput) noteInput.value = "";
    notesArea.innerHTML = "";
  });
}

/* Deposit Details behaviour (multiple forms, per-form edit) */
function initDepositDetails() {
  const groupsWrap = $("#depGroups");
  const addBtn = $("#depAdd");
  const actions = $("#depEditActions");
  const saveBtn = $("#depSave");
  const cancelBtn = $("#depCancel");
  if (!groupsWrap || !addBtn || !actions || !saveBtn || !cancelBtn) return;

  let currentEditing = null;
  let editSnapshot = null;
  let depCounter = $$("#depGroups .dep-group").length || 0;

  function captureGroupValues(group) {
    const fields = $$("input[name^='dep'], select[name^='dep']", group);
    return fields.map(el => ({ name: el.name, value: el.value }));
  }

  function restoreGroupValues(group, snapshot) {
    if (!snapshot) return;
    const map = new Map(snapshot.map(x => [x.name, x.value]));
    $$("input[name^='dep'], select[name^='dep']", group).forEach(el => {
      if (map.has(el.name)) el.value = map.get(el.name);
    });
  }

  function lockAllGroups() {
    $$("#depGroups .dep-group").forEach(g => {
      g.classList.add("locked");
      g.classList.remove("is-editing");
    });
  }

  function enterEdit(group) {
    if (!group) return;
    if (currentEditing === group) return;

    lockAllGroups();
    currentEditing = group;
    editSnapshot = captureGroupValues(group);

    group.classList.remove("locked");
    group.classList.add("is-editing");

    addBtn.hidden = true;
    actions.hidden = false;
    // show Save/Cancel when entering edit
    saveBtn.hidden = false;
    cancelBtn.hidden = false;
  }

  function exitEdit(applyChanges) {
    if (!currentEditing) return;
    if (!applyChanges) {
      restoreGroupValues(currentEditing, editSnapshot);
    }
    currentEditing.classList.remove("is-editing");
    currentEditing.classList.add("locked");
    currentEditing = null;
    editSnapshot = null;

    actions.hidden = true;
    addBtn.hidden = false;
    // hide Save/Cancel when leaving edit
    saveBtn.hidden = true;
    cancelBtn.hidden = true;
  }

  /* Start in locked mode */
  lockAllGroups();

  /* Pencil click (delegated) */
  groupsWrap.addEventListener("click", e => {
    const btn = e.target.closest(".dep-edit");
    if (!btn) return;
    const group = btn.closest(".dep-group");
    if (!group) return;
    enterEdit(group);
  });

  /* Add: clone last group, clear values, lock it */
  addBtn.addEventListener("click", () => {
    if (currentEditing) return;
    const last = groupsWrap.querySelector(".dep-group:last-of-type");
    if (!last) return;
    depCounter += 1;
    const clone = last.cloneNode(true);
    clone.dataset.group = String(depCounter);
    const title = $(".dep-group-title", clone);
    if (title) title.textContent = `Deposit ${depCounter}`;

    $$("input[name^='dep'], select[name^='dep']", clone).forEach(el => {
      if (el.tagName === "SELECT") {
        el.value = "";
      } else {
        el.value = "";
      }
    });

    clone.classList.remove("is-editing");
    clone.classList.add("locked");
    groupsWrap.appendChild(clone);
  });

  saveBtn.addEventListener("click", () => {
    exitEdit(true);
  });
  cancelBtn.addEventListener("click", () => {
    exitEdit(false);
  });
}

/* Init */
window.addEventListener("DOMContentLoaded", () => {
  /* Money formatting */
  $$(".money").forEach(inp =>
    inp.addEventListener("blur", () => formatMoneyInput(inp))
  );

  /* Owned by */
  $("#ownedBy")?.addEventListener("change", updateOwnedByField);
  updateOwnedByField();

  /* Deposit allocation */
  $("#depositAmount")?.addEventListener("blur", () => {
    formatMoneyInput($("#depositAmount"));
    refreshAllocUI(false);
  });
  $$('.pay-method .seg input[type="checkbox"]').forEach(cb =>
    cb.addEventListener("change", () => refreshAllocUI(true))
  );

  /* Load draft if exists */
  loadDraft();

  /* Step actions */
  document.addEventListener("click", e => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.getAttribute("data-action");
    if (action === "next") {
      saveDraft();
      showStep(currentStep + 1);
    } else if (action === "back") {
      showStep(currentStep - 1);
    } else if (action === "save-exit") {
      showPersistWarning(
        "Your Trade Report will be deleted after 30 days if there is no activity.",
        () => {
          saveDraft();
          try {
            window.parent?.postMessage({ type: "go-home" }, "*");
          } catch {
            location.href = "home1.html";
          }
        }
      );
    } else if (action === "save-draft") {
      saveDraft();
    }
  });

  /* Step boxes click */
  $$(".step-box").forEach(box => {
    box.addEventListener("click", () => {
      const s = Number(box.dataset.step);
      if (!Number.isNaN(s)) showStep(s);
    });
  });

  /* Save final */
  $("#saveFinal")?.addEventListener("click", () => saveFinal());

  /* Picker wiring */
  if (picker.closeBtn) picker.closeBtn.addEventListener("click", closePicker);
  if (picker.bySel)
    picker.bySel.addEventListener("change", () => {
      picker.byKey = picker.bySel.value;
      updatePickerPlaceholder();
    });
  if (picker.form)
    picker.form.addEventListener("submit", e => {
      e.preventDefault();
      renderPicker(filterItems(picker.byKey, picker.q?.value || ""));
    });
  if (picker.results)
    picker.results.addEventListener("click", e => {
      const btn = e.target.closest(".pick-select");
      if (!btn || !picker.targetInput) return;
      const name = btn.getAttribute("data-name") || "";
      picker.targetInput.value = name;
      const phone = btn.getAttribute("data-phone") || "";
      const email = btn.getAttribute("data-email") || "";
      const address = btn.getAttribute("data-address") || "";
      if (picker.role === "p") {
        $("#pSolicitorPhone").value = phone;
        $("#pSolicitorEmail").value = email;
        $("#pSolicitorAddress").value = address;
      } else {
        $("#vSolicitorPhone").value = phone;
        $("#vSolicitorEmail").value = email;
        $("#vSolicitorAddress").value = address;
      }
      toastOK(`Selected person: ${name}`);
      closePicker();
    });

  document.addEventListener("click", e => {
    const b = e.target.closest("[data-picker='individual'][data-target]");
    if (!b) return;
    const target = $(b.getAttribute("data-target"));
    const role = b.getAttribute("data-role") || "p";
    if (target) openPicker(target, role);
  });

  /* Notes + Deposit Details */
  initNotes();
  initDepositDetails();

  /* Start on step 1 */
  showStep(1);
});
