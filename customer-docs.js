(() => {
  "use strict";

  /* ===== Helpers ===== */
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const qs = new URLSearchParams(location.search);
  const getJSONParam = (key) => {
    const raw = qs.get(key);
    if (!raw) return null;
    try {
      const s = decodeURIComponent(decodeURIComponent(raw));
      return JSON.parse(s);
    } catch {
      try { return JSON.parse(raw); }
      catch { return null; }
    }
  };
  const humanSize = (bytes)=>{
    if (!bytes && bytes !== 0) return "";
    const units = ["B","KB","MB","GB"]; let i=0, num=bytes;
    while (num >= 1024 && i < units.length-1){ num/=1024; i++; }
    return `${num.toFixed(num >= 100 ? 0 : 1)} ${units[i]}`;
  };
  const extFromName = (name="")=>{
    const m = name.toLowerCase().match(/\.([a-z0-9]+)$/); return m ? m[1] : "";
  };
  const fileKind = (file)=>{
    const t = (file.type||"").toLowerCase(), e = extFromName(file.name||"");
    if (t.startsWith("image/")) return "IMG";
    if (t === "application/pdf" || e === "pdf") return "PDF";
    if (/(msword|officedocument\.word)/.test(t) || /docx?$/.test(e)) return "DOC";
    if (/(spreadsheet|excel)/.test(t) || /xlsx?$/.test(e) || /csv$/.test(e)) return "XLS";
    if (/zip|x-7z|x-rar|x-tar/.test(t) || /(zip|7z|rar|tar|gz)$/i.test(e)) return "ZIP";
    return (e || "FILE").toUpperCase();
  };

  /* ===== Demo / Data ===== */
  // Expected shape:
  // [{ name, ip, type:"AR|AP|PR", files:[{name,size,type}, ...] }, ...]
  const demo = [
    {
      name: "Ali Hassan",
      ip: "10.0.0.5",
      type: "AR",
      files: [
        { name: "ID.pdf", size: 234_567, type: "application/pdf" },
        { name: "contract.docx", size: 1_450_000, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }
      ]
    },
    {
      name: "Mona Adel",
      ip: "10.0.0.18",
      type: "AP",
      files: [
        { name: "invoice-2025-01.pdf", size: 980_123, type: "application/pdf" },
        { name: "bank-statement.zip", size: 5_600_000, type: "application/zip" }
      ]
    },
    {
      name: "Omar Samir",
      ip: "10.0.0.42",
      type: "PR",
      files: []
    },
    {
      name: "Sarah Naguib",
      ip: "10.0.1.7",
      type: "AR",
      files: [
        { name: "passport.png", size: 840_000, type: "image/png" }
      ]
    }
  ];

  const people = Array.isArray(getJSONParam("people")) ? getJSONParam("people") : demo;

  /* ===== UI Elements ===== */
  const tbody   = $("#peopleTbody");
  const totals  = $("#totalsLbl");
  const search  = $("#searchInput");
  const typeSel = $("#typeSelect");
  const onlyBtn = $("#withFilesBtn");
  const table   = $("#peopleTable");

  /* ===== State ===== */
  let state = {
    search: "",
    type: "",
    onlyWithFiles: false,
    sortKey: "name",
    sortDir: "asc",
  };

  /* ===== Render ===== */
  function filtered(){
    const q = state.search.trim().toLowerCase();
    return people
      .map(p => ({...p, filesCount: (p.files||[]).length}))
      .filter(p => !state.type || p.type === state.type)
      .filter(p => !state.onlyWithFiles || p.filesCount > 0)
      .filter(p => {
        if (!q) return true;
        return (p.name||"").toLowerCase().includes(q) || (p.ip||"").toLowerCase().includes(q);
      });
  }

  function sortData(arr){
    const { sortKey, sortDir } = state;
    const mul = sortDir === "asc" ? 1 : -1;
    return arr.sort((a,b)=>{
      let va = a[sortKey], vb = b[sortKey];
      if (sortKey === "filesCount"){ return (va - vb) * mul; }
      va = (va ?? "").toString().toLowerCase();
      vb = (vb ?? "").toString().toLowerCase();
      if (va < vb) return -1*mul;
      if (va > vb) return  1*mul;
      return 0;
    });
  }

  function fileRow(file){
    const kind = fileKind(file);
    const size = typeof file.size === "number" ? humanSize(file.size) : "";
    return `
      <div class="file-item">
        <div class="file-ico" title="${kind}">${kind}</div>
        <div class="file-name" title="${file.name||""}">${file.name||"—"}</div>
        <div class="file-meta">${size}</div>
      </div>
    `;
  }

  function rowHTML(p, i){
    const filesCount = (p.files||[]).length;
    const badge = `<span class="badge" title="${p.type}">${p.type || "—"}</span>`;
    const viewBtn = `<button class="icon-btn view-btn" data-index="${i}" title="Toggle files" aria-label="Toggle files">▼</button>`;
    return `
      <tr class="main" data-index="${i}">
        <td>${p.name||"—"}</td>
        <td>${p.ip||"—"}</td>
        <td>${badge}</td>
        <td class="num">${filesCount}</td>
        <td class="row-actions">${viewBtn}</td>
      </tr>
      <tr class="expand"><td colspan="5">
        <div class="files-wrap" ${filesCount? "": 'style="display:none"'} >
          <div class="files-list">
            ${(p.files||[]).map(fileRow).join("") || `<div class="file-meta" style="padding:4px 2px">No files.</div>`}
          </div>
        </div>
      </td></tr>
    `;
  }

  function render(){
    const list = sortData(filtered());
    tbody.innerHTML = list.map((p,i)=>rowHTML(p, i)).join("");

    const totalFiles = list.reduce((acc,p)=>acc + (p.files?.length||0), 0);
    totals.textContent = `${list.length} people • ${totalFiles} files`;

    // update header sort classes
    $$(".sortable", table).forEach(th => th.classList.remove("asc","desc"));
    const th = $(`th.sortable[data-key="${state.sortKey}"]`, table);
    if (th) th.classList.add(state.sortDir);
  }

  /* ===== Events ===== */
  search.addEventListener("input", () => { state.search = search.value; render(); });
  typeSel.addEventListener("change", () => { state.type = typeSel.value; render(); });
  onlyBtn.addEventListener("click", () => {
    const v = onlyBtn.getAttribute("aria-pressed") === "true";
    onlyBtn.setAttribute("aria-pressed", String(!v));
    state.onlyWithFiles = !v;
    render();
  });

  // sorting
  $$(".sortable", table).forEach(th => {
    th.addEventListener("click", () => {
      const key = th.getAttribute("data-key");
      if (!key) return;
      if (state.sortKey === key){
        state.sortDir = (state.sortDir === "asc") ? "desc" : "asc";
      } else {
        state.sortKey = key;
        state.sortDir = "asc";
      }
      render();
    });
  });

  // expand / collapse files
  tbody.addEventListener("click", (e)=>{
    const mainRow = e.target.closest("tr.main");
    const viewBtn = e.target.closest(".view-btn");
    const targetRow = mainRow || (viewBtn && viewBtn.closest("tr.main"));
    if (!targetRow) return;

    const next = targetRow.nextElementSibling;
    if (!next || !next.classList.contains("expand")) return;

    const isOpen = targetRow.classList.contains("expanded");
    targetRow.classList.toggle("expanded", !isOpen);

    const btn = $(".view-btn", targetRow);
    if (btn) btn.textContent = isOpen ? "▼" : "▲";
  });

  /* ===== Init ===== */
  document.addEventListener("DOMContentLoaded", render);
})();
