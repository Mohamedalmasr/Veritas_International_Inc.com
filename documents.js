"use strict";

/* ===== DOM helpers ===== */
const $  = (s, r=document)=>r.querySelector(s);
const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));
const fmtSize = (n)=> n ? `${(n/1024).toFixed(1)} KB` : "—";
const fmtDate = (d)=> d ? new Date(d).toLocaleDateString() : "—";

/* ===== Toast ===== */
function toast(msg, ok=true){
  const area = $("#toastArea");
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = `<div>${msg}</div><button class="close" aria-label="Close">✕</button>`;
  t.querySelector(".close").addEventListener("click", ()=> t.remove());
  area.appendChild(t);
  setTimeout(()=>t.remove(), ok ? 2800 : 4000);
}

/* ===== LocalStorage keys ===== */
const LS_DEFAULTS = "DOCS_DEFAULTS_V1";
const LS_KEYWORDS = "DOCS_KEYWORDS_V1";
const LS_TREE     = "DOCS_TREE_V1";

/* ===== Defaults ===== */
function loadDefaults(){
  try{ return JSON.parse(localStorage.getItem(LS_DEFAULTS) || "{}"); }catch{ return {}; }
}
function saveDefaults(d){
  try{ localStorage.setItem(LS_DEFAULTS, JSON.stringify(d||{})); }catch{}
}

/* ===== Keywords ===== */
function loadKeywords(){
  try{ return JSON.parse(localStorage.getItem(LS_KEYWORDS) || "[]"); }catch{ return []; }
}
function saveKeywords(list){
  try{ localStorage.setItem(LS_KEYWORDS, JSON.stringify(list||[])); }catch{}
}

/* ===== Folder tree (demo) ===== */
function loadTree(){
  try{
    const raw = localStorage.getItem(LS_TREE);
    if (raw) return JSON.parse(raw);
  }catch{}
  return {
    name:"Root", children:[
      { name:"Contracts", children:[], files:[
        { name:"Master-Services-Agreement.pdf", type:"pdf", size:128330, updated: "2025-02-05" }
      ]},
      { name:"Vendors", children:[
        { name:"AR", children:[], files:[] },
        { name:"AP", children:[], files:[] }
      ], files:[]},
      { name:"Projects", children:[], files:[
        { name:"Project-Alpha-Brief.docx", type:"docx", size:80320, updated: "2025-01-11" }
      ]}
    ],
    files:[
      { name:"Welcome.pdf", type:"pdf", size:54300, updated:"2025-01-01" }
    ]
  };
}
function saveTree(tree){
  try{ localStorage.setItem(LS_TREE, JSON.stringify(tree||{})); }catch{}
}

let TREE = loadTree();
let currentPath = []; // indexes from root → selected folder

function getNodeByPath(path){
  let node = TREE;
  for (const idx of path) node = node.children[idx];
  return node;
}

/* ===== Icons ===== */
const svg = {
  chev: `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M9 6l6 6-6 6z"/></svg>`,
  folder: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M10 4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h6z" fill="#eaf2ff"/><path d="M4 6h6l2 2h8v8a2 2 0 01-2 2H4V6z" fill="#0b2e6f" fill-opacity=".1"/></svg>`,
  folderOpen: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M10 4l2 2h8a2 2 0 012 2v2H8l-2 2v6h14a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2H4a2 2 0 00-2 2v2" fill="#eaf2ff"/><path d="M6 10h16l-2 8H4l2-8z" fill="#0b2e6f" fill-opacity=".1"/></svg>`
};

/* ===== Render: crumbs, tree, files ===== */
function renderCrumbs(){
  const wrap = $("#crumbs");
  wrap.innerHTML = "";
  const parts = [];

  // Root
  const aRoot = document.createElement("a");
  aRoot.href="#"; aRoot.textContent="Root";
  aRoot.addEventListener("click", (e)=>{ e.preventDefault(); currentPath=[]; refreshFolder(); });
  parts.push(aRoot);

  // Each path segment
  let acc = [];
  currentPath.forEach((idx, i)=>{
    acc = currentPath.slice(0, i+1);
    const node = getNodeByPath(acc);
    const a = document.createElement("a");
    a.href="#"; a.textContent=node.name;
    a.addEventListener("click", (e)=>{ e.preventDefault(); currentPath = acc; refreshFolder(); });
    parts.push(a);
  });

  parts.forEach((el, i)=>{
    if (i>0){ const sep=document.createElement("span"); sep.className="sep"; sep.textContent="›"; wrap.appendChild(sep); }
    wrap.appendChild(el);
  });
}

function renderTree(){
  const rootUL = $("#tree");
  rootUL.innerHTML = "";

  const build = (node, path=[])=>{
    const li = document.createElement("li");
    li.className = "node";
    const hasChildren = (node.children && node.children.length>0);

    // row button
    const row = document.createElement("button");
    row.type = "button";
    row.className = "row";
    row.setAttribute("aria-label", node.name);
    if (hasChildren) row.setAttribute("aria-expanded", String(isOpen(path)));

    const chev = document.createElement("span"); chev.className = "chev";  chev.innerHTML = svg.chev;
    const icon = document.createElement("span"); icon.className = "icon";  icon.innerHTML = isOpen(path) ? svg.folderOpen : svg.folder;
    const text = document.createElement("span"); text.className = "label"; text.textContent = node.name;

    row.appendChild(chev); row.appendChild(icon); row.appendChild(text);
    li.appendChild(row);

    // class flags
    li.classList.toggle("leaf", !hasChildren);
    li.classList.toggle("open", isOpen(path));
    if (isSelected(path)) row.classList.add("selected");

    // interactions
    chev.addEventListener("click", (e)=>{
      e.stopPropagation();
      // toggle open without changing selection
      li.classList.toggle("open");
      row.setAttribute("aria-expanded", String(li.classList.contains("open")));
      icon.innerHTML = li.classList.contains("open") ? svg.folderOpen : svg.folder;
    });

    row.addEventListener("click", ()=>{
      currentPath = path.slice();
      refreshFolder();
    });

    // children
    if (hasChildren){
      const ul = document.createElement("ul");
      node.children.forEach((child, idx)=>{
        ul.appendChild(build(child, path.concat(idx)));
      });
      li.appendChild(ul);
    }
    return li;
  };

  rootUL.appendChild(build(TREE, []));
}

function isSelected(path){ return JSON.stringify(path) === JSON.stringify(currentPath); }
function isOpen(path){
  // a node is "open" if it is ancestor of currentPath (prefix)
  return path.every((v,i)=> currentPath[i] === v);
}

function renderFiles(){
  const tbody = $("#filesBody");
  const empty = $("#emptyState");
  const node = getNodeByPath(currentPath);
  const files = node.files || [];

  tbody.innerHTML = files.map(f=>`
    <tr>
      <td>${f.name}</td>
      <td>${(f.type||"file").toUpperCase()}</td>
      <td class="num">${fmtSize(f.size)}</td>
      <td class="num">${fmtDate(f.updated)}</td>
    </tr>
  `).join("");

  empty.hidden = files.length > 0;
}

/* ===== Actions ===== */
function newFolder(){
  const name = prompt("Folder name:");
  if (!name || !name.trim()) return;
  const node = getNodeByPath(currentPath);
  node.children = node.children || [];
  node.children.push({ name: name.trim(), children:[], files:[] });
  saveTree(TREE);
  renderTree();
  toast(`Folder “${name.trim()}” created.`);
}

function addFilesToCurrent(fileList){
  const node = getNodeByPath(currentPath);
  node.files = node.files || [];

  const list = $("#uploadList");
  for (const f of fileList){
    const row = document.createElement("div");
    row.className = "up-item";
    row.innerHTML = `<div class="up-name">${f.name}</div>
      <div class="up-bar"><span></span></div>`;
    list.appendChild(row);

    const bar = row.querySelector("span");
    let p = 0;
    const id = setInterval(()=>{
      p = Math.min(100, p + Math.random()*30);
      bar.style.width = `${p}%`;
      if (p >= 100){
        clearInterval(id);
        node.files.push({
          name: f.webkitRelativePath ? f.webkitRelativePath.split("/").pop() : f.name,
          type: (f.type || "file").split("/").pop() || "file",
          size: f.size || 0,
          updated: new Date().toISOString().slice(0,10)
        });
        saveTree(TREE);
        renderFiles();
        setTimeout(()=> row.remove(), 600);
      }
    }, 120);
  }
  toast(`${fileList.length} item(s) queued for upload.`);
}

/* Drag & drop */
function bindDropZone(){
  const dz = $("#dropZone");
  ;["dragenter","dragover"].forEach(ev=> dz.addEventListener(ev, (e)=>{ e.preventDefault(); dz.classList.add("on"); }));
  ;["dragleave","drop"].forEach(ev=> dz.addEventListener(ev, (e)=>{ e.preventDefault(); dz.classList.remove("on"); }));
  dz.addEventListener("drop", (e)=>{
    const items = e.dataTransfer?.files;
    if (!items || !items.length){ toast("No files dropped.", false); return; }
    addFilesToCurrent(items);
  });
}

/* ===== Keywords UI ===== */
function renderKeywords(){
  const list = $("#kwList");
  const kws = loadKeywords();
  list.innerHTML = "";
  kws.forEach((k, i)=>{
    const el = document.createElement("span");
    el.className = "kw";
    el.innerHTML = `<span>${k}</span><button class="x" aria-label="Remove ${k}">×</button>`;
    el.querySelector(".x").addEventListener("click", ()=>{
      const arr = loadKeywords().filter((_, idx)=> idx !== i);
      saveKeywords(arr); renderKeywords();
    });
    list.appendChild(el);
  });
}
function addKeyword(){
  const inp = $("#kwInput");
  const v = (inp.value||"").trim();
  if (!v) return;
  const arr = loadKeywords();
  if (arr.includes(v)){ toast("Keyword already exists.", false); return; }
  arr.push(v); saveKeywords(arr); renderKeywords(); inp.value="";
  toast(`Keyword “${v}” added.`);
}

/* ===== Defaults UI ===== */
function hydrateDefaults(){
  const d = loadDefaults();
  $("#defLibrary").value  = d.library || "Company Drive";
  $("#defTemplate").value = d.template || "";
  $("#defRetention").value = d.retention || "None";
  $("#defRequireKW").checked = !!d.requireKW;
}
function saveDefaultsUI(){
  const d = {
    library: $("#defLibrary").value,
    template: $("#defTemplate").value.trim(),
    retention: $("#defRetention").value,
    requireKW: $("#defRequireKW").checked
  };
  saveDefaults(d);
  toast("Defaults saved.");
}

/* ===== File inputs ===== */
function bindUploads(){
  $("#fileInput").addEventListener("change", (e)=>{
    const files = e.target.files;
    if (files && files.length) addFilesToCurrent(files);
    e.target.value = "";
  });
  $("#folderInput").addEventListener("change", (e)=>{
    const files = e.target.files;
    if (files && files.length) addFilesToCurrent(files);
    e.target.value = "";
  });
}

/* ===== Refresh folder widgets ===== */
function refreshFolder(){
  renderCrumbs();
  renderTree();
  renderFiles();
}

/* ===== Boot ===== */
window.addEventListener("DOMContentLoaded", ()=>{
  // Defaults
  hydrateDefaults();
  $("#saveDefaultsBtn").addEventListener("click", saveDefaultsUI);

  // Keywords
  renderKeywords();
  $("#addKwBtn").addEventListener("click", addKeyword);
  $("#kwInput").addEventListener("keydown", (e)=>{ if (e.key==="Enter"){ e.preventDefault(); addKeyword(); } });

  // Folder browser
  refreshFolder();
  $("#newFolderBtn").addEventListener("click", newFolder);

  // Uploads
  bindUploads();
  bindDropZone();
});
