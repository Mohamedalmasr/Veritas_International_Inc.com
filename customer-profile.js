(() => {
  "use strict";

  /* ===== Utils ===== */
  const norm = (s) => (s || "").toString().trim();
  const titleCase = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "");
  const getParam = (...keys) => {
    const q = new URLSearchParams(location.search);
    for (const k of keys) { const v = q.get(k); if (v != null && v !== "") return v; }
    return "";
  };
  const typeToCode = (t) => {
    const v = (t || "").toLowerCase();
    if (v === "payroll")    return "PR";
    if (v === "receivable") return "AR";
    if (v === "payable")    return "AP";
    return "";
  };
  const decodeJSONArray = (val) => {
    if (!val) return [];
    let s = val;
    try { s = decodeURIComponent(s); } catch(_) {}
    try { s = decodeURIComponent(s); } catch(_) {}
    try { const arr = JSON.parse(s); return Array.isArray(arr) ? arr : []; } catch(_) { return []; }
  };

  /* ===== Read URL ===== */
  const accTypeRaw = (getParam("accType","type","t") || "").toLowerCase();
  const accTypeLbl = titleCase(accTypeRaw);
  const ownersArr  = decodeJSONArray(getParam("owners"));
  const authArr    = decodeJSONArray(getParam("auth") || getParam("authorized"));

  /* ===== Elements ===== */
  const pageTitle   = document.getElementById("pageTitle");
  const ownersList  = document.getElementById("ownersList");
  const authCard    = document.getElementById("authCard");
  const authList    = document.getElementById("authList");
  const detailsCard = document.getElementById("detailsCard");
  const pageActions = document.getElementById("pageActions");
  const btnProcess  = document.getElementById("btnProcess");
  const btnDelete   = document.getElementById("btnDelete");
  const btnCreate   = document.getElementById("btnCreate");
  const toastArea   = document.getElementById("toastArea");

  /* Payable (DD) */
  const payableCard = document.getElementById("payableCard");
  const allowDD     = document.getElementById("allowDD");
  const ddFields    = document.getElementById("ddFields");
  const ddHelp      = document.getElementById("ddHelp");

  /* ===== Toast ===== */
  function showToast(message, {type="error", timeout} = {}){
    if (!toastArea) return;
    if (type === "success" && (timeout === undefined || timeout === null)) timeout = 0;
    if (type !== "success" && (timeout === undefined || timeout === null)) timeout = 2500;
    const t = document.createElement("div");
    t.className = `toast ${type === "success" ? "success" : ""}`;
    t.innerHTML = `
      <div class="msg">${message}</div>
      <button class="close" type="button" aria-label="Close">✕</button>
    `;
    toastArea.appendChild(t);
    const close = () => t.remove();
    t.querySelector(".close").addEventListener("click", close);
    if (timeout) setTimeout(close, timeout);
  }

  /* ===== Title ===== */
  function setTopTitle(){
    const code = typeToCode(accTypeLbl);
    if (pageTitle) pageTitle.textContent = accTypeLbl ? `${accTypeLbl}${code ? ` (${code})` : ""}` : "—";
  }

  /* ===== Render ===== */
  const nameText = (o) => `${o.first || ""} ${o.last || ""}`.trim();
  function renderPeople(listEl, arr, withRole = false){
    if (!arr || !arr.length){ listEl.innerHTML = ""; return; }
    listEl.innerHTML = arr.map(o => {
      const ipHtml   = o.ip   ? `<span class="pill">${o.ip}</span>` : ``;
      const roleLbl  = (o.role || "").toString().trim();
      const roleHtml = withRole && roleLbl ? `<span class="pill">${roleLbl}</span>` : ``;
      return `
        <section class="owner-row" aria-label="Person">
          <div class="owner-name">${nameText(o) || "—"}</div>
          <div class="owner-right">${ipHtml}${roleHtml ? ` ${roleHtml}` : ""}</div>
        </section>
      `;
    }).join("");
  }
  function renderOwners(){
    if (!ownersArr.length){
      ownersList.innerHTML = `<div style="color:#64748b;font-weight:700;">No owners provided.</div>`;
      return;
    }
    renderPeople(ownersList, ownersArr, false);
  }
  function renderAuthorized(){
    if (authArr.length){
      authCard.hidden = false;
      renderPeople(authList, authArr, true);
    } else {
      authCard.hidden = true;
      authList.innerHTML = "";
    }
  }

  /* ===== Validation ===== */
  const visible = (el) => !!(el && el.offsetParent !== null);
  function requiredFields(){
    if (!detailsCard) return [];
    const nodes = detailsCard.querySelectorAll('input[type="text"], textarea');
    return Array.from(nodes).filter(el => visible(el.closest(".block")));
  }
  const isFilled = (el) => norm(el.value) !== "";
  const allVisibleFilled = () => requiredFields().every(isFilled);
  const updateCreateState = () => { if (btnCreate) btnCreate.disabled = !allVisibleFilled(); };

  /* ===== Create → Return Home (demo) ===== */
  function goHomeAndNotify(msg){
    const TOP = (window.top && window.top !== window) ? window.top : window;
    try { TOP.postMessage({ type:"go-home", flash_ok: msg }, "*"); } catch {}
    try { TOP.location.hash = "flash_ok=" + encodeURIComponent(msg) + "&t=" + Date.now(); } catch {}
    try {
      if (TOP === window) {
        const u = new URL("home1.html", location.href);
        u.hash = "flash_ok=" + encodeURIComponent(msg);
        location.assign(u.toString());
      }
    } catch {}
  }

  /* ===== Init ===== */
  document.addEventListener("DOMContentLoaded", () => {
    setTopTitle();
    renderOwners();
    renderAuthorized();

    const isAR = accTypeRaw === "receivable" || accTypeRaw === "ar";
    const isAP = accTypeRaw === "payable"    || accTypeRaw === "ap";

    const accNoBlock   = document.getElementById("accNo")?.closest(".block");
    const creditBlock  = document.getElementById("creditLimit")?.closest(".block");
    const termsBlock   = document.getElementById("termsTxt")?.closest(".block");
    const noteBlock    = document.getElementById("noteTxt")?.closest(".block");

    if (detailsCard) { detailsCard.hidden = false; detailsCard.style.display = ""; }

    /* ===== AR view كما هو ===== */
    if (isAR) {
      [creditBlock, termsBlock, noteBlock].forEach(b => { if (b){ b.hidden = false; b.style.display = ""; } });
      if (pageActions){ pageActions.hidden = false; pageActions.style.display = "flex"; }

      const creditInput = document.getElementById("creditLimit");
      const termsInput  = document.getElementById("termsTxt");
      if (creditInput){
        if (!creditInput.value) creditInput.value = "50,000";
        creditInput.readOnly = true; creditInput.setAttribute("aria-readonly","true");
      }
      if (termsInput){
        if (!termsInput.value) termsInput.value = "Net 30";
        termsInput.readOnly = true; termsInput.setAttribute("aria-readonly","true");
      }
    } else {
      if (accNoBlock) accNoBlock.classList.add("full-span");
      [creditBlock, termsBlock, noteBlock].forEach(b => { if (b){ b.hidden = true; b.style.display = "none"; } });
      if (pageActions){ pageActions.hidden = true; pageActions.style.display = "none"; }
    }

    /* ===== AP view (Expense Account + Direct Deposit) ===== */
    if (isAP) {
      if (payableCard){ payableCard.hidden = false; payableCard.style.display = ""; }

      // فتح/قفل مجموعة حقول البنك بناءً على التشيك بوكس
      if (allowDD && ddFields){
        const sync = () => {
          const on = !!allowDD.checked;
          ddFields.disabled = !on;
          ddFields.setAttribute("aria-disabled", String(!on));
        };
        allowDD.addEventListener("change", sync);
        sync();
      }
    } else {
      if (payableCard){ payableCard.hidden = true; payableCard.style.display = "none"; }
    }

    // زر المساعدة ( ? )
    if (ddHelp){
      ddHelp.addEventListener("click", () => {
        showToast("Direct Deposit lets you pay suppliers directly to their bank account.", { type: "success", timeout: 3000 });
      });
    }

    /* Actions (demo) */
    if (isAR) {
      btnProcess?.addEventListener("click", () => alert("Processing (demo)..."));
      btnDelete?.addEventListener("click",  () => alert("Deleting (demo)..."));
    }

    // Uploader (مختصر)
    (function initUploader(){
      const dropZone  = document.getElementById("dropZone");
      const browseBtn = document.getElementById("browseBtn");
      const fileInput = document.getElementById("docInput");
      const fileList  = document.getElementById("fileList");
      if (!dropZone || !browseBtn || !fileInput || !fileList) return;

      const MAX_SIZE  = 25 * 1024 * 1024;
      const uploads   = [];

      const humanSize = (bytes)=>{ if (bytes===0) return "0 B";
        if (!bytes && bytes !== 0) return "";
        const units=["B","KB","MB","GB"]; let i=0, num=bytes;
        while (num>=1024 && i<units.length-1){ num/=1024; i++; }
        return `${num.toFixed(num >= 100 ? 0 : 1)} ${units[i]}`;
      };
      const extFromName = (name="")=> (name.toLowerCase().match(/\.([a-z0-9]+)$/) || [,""])[1];
      const fileKind = (file)=>{
        const t=(file.type||"").toLowerCase(), e=extFromName(file.name);
        if (t.startsWith("image/")) return "IMG";
        if (t==="application/pdf" || e==="pdf") return "PDF";
        if (/(msword|officedocument\.word)/.test(t) || /docx?$/.test(e)) return "DOC";
        if (/(spreadsheet|excel)/.test(t) || /xlsx?$/.test(e) || /csv$/.test(e)) return "XLS";
        if (/zip|x-7z|x-rar|x-tar/.test(t) || /(zip|7z|rar|tar|gz)$/i.test(e)) return "ZIP";
        return (e || "FILE").toUpperCase();
      };

      function renderFiles(){
        fileList.innerHTML = uploads.map(({id, file}) => `
          <div class="file-item" data-id="${id}">
            <div class="file-ico" title="${fileKind(file)}">${fileKind(file)}</div>
            <div class="file-main">
              <div class="file-name" title="${file.name}">${file.name}</div>
              <div class="file-meta">${humanSize(file.size)}</div>
            </div>
            <button class="file-remove" type="button" aria-label="Remove">✕</button>
          </div>
        `).join("");
      }
      function addFile(file){
        if (file.size > MAX_SIZE){ alert(`File too large (max 25MB): ${file.name}`); return; }
        const id  = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now() + Math.random());
        const url = URL.createObjectURL(file);
        uploads.push({ id, file, url });
        renderFiles();
      }
      function removeFile(id){
        const idx = uploads.findIndex(x => x.id === id);
        if (idx >= 0){ try{ URL.revokeObjectURL(uploads[idx].url); }catch{} uploads.splice(idx,1); renderFiles(); }
      }

      browseBtn.addEventListener("click", () => fileInput.click());
      fileInput.addEventListener("change", (e) => { Array.from(e.target.files||[]).forEach(addFile); fileInput.value = ""; });

      ["dragenter","dragover"].forEach(ev => dropZone.addEventListener(ev, (e)=>{ e.preventDefault(); e.stopPropagation(); dropZone.classList.add("is-drag"); }));
      ["dragleave","drop"].forEach(ev => dropZone.addEventListener(ev, (e)=>{ e.preventDefault(); e.stopPropagation(); dropZone.classList.remove("is-drag"); }));
      dropZone.addEventListener("drop", (e)=>{ Array.from(e.dataTransfer?.files||[]).forEach(addFile); });

      fileList.addEventListener("click", (e)=>{ const btn=e.target.closest(".file-remove"); if(!btn) return;
        const item=btn.closest(".file-item"); if(!item) return; removeFile(item.getAttribute("data-id")); });
    })();

    requiredFields().forEach(el => { el.addEventListener("input", updateCreateState); el.addEventListener("change", updateCreateState); });
    updateCreateState();

    if (btnCreate) {
      btnCreate.addEventListener("click", () => {
        if (!allVisibleFilled()){
          showToast("Please fill in all required fields.", {type:"error"});
          return;
        }
        goHomeAndNotify("Account created successfully. Welcome home!");
      });
    }
  });
})();
