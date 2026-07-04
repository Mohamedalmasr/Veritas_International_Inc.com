/* =============================
   Sub-tabs handling
   ============================= */
function setupSubTabs(){
  const btns = Array.from(document.querySelectorAll('.subtab-btn'));
  const panels = Array.from(document.querySelectorAll('.subtab-panel'));

  btns.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const targetId = btn.getAttribute('aria-controls');
      // switch buttons
      btns.forEach(b=>{ b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
      btn.classList.add('active'); btn.setAttribute('aria-selected','true');
      // switch panels
      panels.forEach(p=>p.classList.remove('active'));
      const panel = document.getElementById(targetId);
      if(panel) panel.classList.add('active');
      // lazy init
      if (targetId === 'subtab-versions') initVersionsUI();
      if (targetId === 'subtab-document') initDocumentsUI();
    });
  });
}

/* =============================
   Journal table helpers
   ============================= */
const $  = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

function fmt2(n){
  const v = Number.isFinite(n) ? n : 0;
  return v.toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 });
}
function toNum(val){
  const n = parseFloat(String(val).replace(/,/g,''));
  return Number.isFinite(n) ? n : 0;
}

/* ---- number formatting ---- */
function sanitizeNumberString(s){
  s = String(s || '');
  const parts = s.replace(/[^\d.]/g,'').split('.');
  const intPart = parts[0].replace(/^0+(?=\d)/, '');
  const decPart = parts.slice(1).join('');
  return decPart.length ? `${intPart}.${decPart}` : intPart;
}
function addGrouping(s){
  if(!s) return '';
  const [i, d=''] = s.split('.');
  const g = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return d ? `${g}.${d}` : g;
}
function normalizeTwoDecimals(s){ return fmt2(toNum(s)); }
function formatMoneyOnInput(input){ input.value = addGrouping(sanitizeNumberString(input.value)); }
function formatMoneyOnBlur(input){ input.value = normalizeTwoDecimals(input.value); }

/* -------- DOM refs -------- */
const tbody      = $('#gjTbody');
const tfDebit    = $('#tfDebit');
const tfCredit   = $('#tfCredit');

/* -------- Builders -------- */
function buildMoneyCell(){
  const wrap = document.createElement('label');
  wrap.className = 'money-wrap';

  const prefix = document.createElement('span');
  prefix.className = 'money-prefix';
  prefix.textContent = '$';

  const inp = document.createElement('input');
  inp.type = 'text';
  inp.inputMode = 'decimal';
  inp.className = 'money-input';
  inp.value = '0.00';

  wrap.append(prefix, inp);
  return { wrap, inp };
}

function makeRow(){
  const tr = document.createElement('tr');

  const tdAcc = document.createElement('td');
  const accInput = document.createElement('input');
  accInput.className = 'cell-input';
  accInput.placeholder = 'Account name or number…';
  accInput.autocomplete = 'off';
  tdAcc.appendChild(accInput);

  const tdDeb = document.createElement('td');
  const deb = buildMoneyCell();
  tdDeb.appendChild(deb.wrap);

  const tdCre = document.createElement('td');
  const cre = buildMoneyCell();
  tdCre.appendChild(cre.wrap);

  const tdCom = document.createElement('td');
  const comInput = document.createElement('textarea');
  comInput.className = 'cell-textarea';
  comInput.placeholder = 'Line comment…';
  tdCom.appendChild(comInput);

  const tdAllo = document.createElement('td');
  tdAllo.className = 'cell-allo';
  const allo = document.createElement('input');
  allo.type = 'checkbox';
  allo.setAttribute('aria-label','Allow allocation');

  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.className = 'del-row';
  delBtn.textContent = '×';

  tdAllo.append(allo, delBtn);
  tr.append(tdAcc, tdDeb, tdCre, tdCom, tdAllo);

  tr.addEventListener('click', () => {
    const selected = document.querySelector('.row-selected');
    if(selected) selected.classList.remove('row-selected');
    tr.classList.add('row-selected');
  });

  function onInput(e){
    const el = e.currentTarget;
    formatMoneyOnInput(el);
    if(el === deb.inp && toNum(deb.inp.value) > 0){ cre.inp.value = '0.00'; }
    if(el === cre.inp && toNum(cre.inp.value) > 0){ deb.inp.value = '0.00'; }
    updateTotals();
    maybeAddNextRow(tr);
  }
  function onBlur(e){
    formatMoneyOnBlur(e.currentTarget);
    updateTotals();
  }
  [deb.inp, cre.inp].forEach(inp=>{
    inp.addEventListener('input', onInput);
    inp.addEventListener('blur', onBlur);
  });

  accInput.addEventListener('input', ()=> maybeAddNextRow(tr));
  comInput.addEventListener('input', ()=> maybeAddNextRow(tr));

  [accInput, deb.inp, cre.inp].forEach((inp, idx, arr)=>{
    inp.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter'){
        e.preventDefault();
        if(idx < arr.length-1) arr[idx+1].focus();
        else comInput.focus();
      }
    });
  });
  comInput.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter' && !e.shiftKey){
      e.preventDefault();
      maybeAddNextRow(tr, true);
    }
  });

  delBtn.addEventListener('click', ()=>{
    if (tr === tbody.firstElementChild) return;
    tr.remove();
    updateTotals();
  });

  return tr;
}

function isRowComplete(tr){
  const acc = tr.children[0].querySelector('input').value.trim();
  const deb = toNum(tr.children[1].querySelector('.money-input').value);
  const cre = toNum(tr.children[2].querySelector('.money-input').value);
  const com = tr.children[3].querySelector('textarea').value.trim();
  return !!acc && ((deb > 0) ^ (cre > 0)) && !!com;
}
function maybeAddNextRow(tr, focus=false){
  if(tr !== tbody.lastElementChild) return;
  if(isRowComplete(tr)){
    const newRow = addRow();
    if(focus) newRow.querySelector('input,textarea').focus();
  }
}
function addRow(){
  const tr = makeRow();
  tbody.appendChild(tr);
  if (tbody.children.length === 1) {
    const firstDel = tr.querySelector('.del-row');
    if (firstDel) firstDel.style.visibility = 'hidden';
  }
  // sync currency symbol on new rows
  applyCurrencySymbols();
  updateTotals();
  return tr;
}

/* ---- totals ---- */
function updateTotals(){
  let d=0, c=0;
  $$('#gjTbody tr').forEach(tr=>{
    d += toNum(tr.children[1].querySelector('.money-input').value);
    c += toNum(tr.children[2].querySelector('.money-input').value);
  });
  $('#tfDebit').textContent  = fmt2(d);
  $('#tfCredit').textContent = fmt2(c);

  const balanced = Math.abs(d - c) < 0.005 && d > 0;
  $('#processBtn').disabled = !balanced;
}

/* ---- init (Journal) ---- */
(function initJournal(){
  const d = new Date();
  const iso = new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,10);
  const dateInp = $('#gjDate');
  if (dateInp) dateInp.value = iso;
  if (tbody) addRow(); // first fixed row
})();

/* =============================
   Versions UI
   ============================= */
function pad(n){ return String(n).padStart(2,'0'); }
function fmtDateTime(d){
  const y = d.getFullYear();
  const m = pad(d.getMonth()+1);
  const day = pad(d.getDate());
  let h = d.getHours();
  const min = pad(d.getMinutes());
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${y}-${m}-${day} ${h}:${min} ${ampm}`;
}
function relativeTime(d){
  const diffMs = Date.now() - d.getTime();
  const sec = Math.max(0, Math.round(diffMs/1000));
  if (sec < 60)  return `${sec}s ago`;
  const min = Math.round(sec/60);
  if (min < 60)  return `${min}m ago`;
  const hr  = Math.round(min/60);
  if (hr  < 24)  return `${hr}h ago`;
  const day = Math.round(hr/24);
  return `${day}d ago`;
}
function initials(name){
  return name.split(/\s+/).slice(0,2).map(p=>p[0]||'').join('').toUpperCase();
}

// seed data
const seedVersions = [
  { txnId:'123456', type:'VER', version:4, ts: new Date('2025-04-12T12:04:00'), author:'Hoshea Rennech' },
  { txnId:'123456', type:'VER', version:3, ts: new Date('2025-04-12T12:02:00'), author:'Clint Austin' },
  { txnId:'123456', type:'VER', version:2, ts: new Date('2025-04-12T11:40:00'), author:'Mariam Youssef' },
  { txnId:'654321', type:'VER', version:1, ts: new Date('2025-03-28T09:15:00'), author:'Omar Saad' },
  { txnId:'777888', type:'VER', version:5, ts: new Date('2025-05-01T16:22:00'), author:'Lina Farouk' },
  { txnId:'990011', type:'VER', version:7, ts: new Date(Date.now() - 2*60*1000), author:'Youssef Adel' },
];

let versionsData = [...seedVersions];

function renderVersions(list){
  const root = $('#versionsList');
  if (!root) return;
  root.innerHTML = '';
  if (!list.length){
    const empty = document.createElement('div');
    empty.className = 'placeholder';
    empty.textContent = 'No versions yet.';
    root.appendChild(empty);
    return;
  }
  list.forEach(v=>{
    const card = document.createElement('article');
    card.className = 'version-card';

    const left = document.createElement('div');
    left.className = 'v-left';
    const badge = document.createElement('span');
    badge.className = 'badge ver-badge';
    badge.textContent = v.type;
    const txn = document.createElement('div');
    txn.className = 'txn';
    const txnId = document.createElement('div');
    txnId.className = 'txn-id';
    txnId.textContent = v.txnId;
    const txnSub = document.createElement('div');
    txnSub.className = 'txn-sub';
    txnSub.textContent = 'Transaction';
    txn.append(txnId, txnSub);
    left.append(badge, txn);

    const middle = document.createElement('div');
    middle.className = 'v-middle';
    const ver = document.createElement('span');
    ver.className = 'version-num';
    ver.textContent = `VER #${v.version}`;
    const t = document.createElement('span');
    t.className = 'timestamp';
    t.textContent = fmtDateTime(v.ts);
    const when = document.createElement('span');
    when.className = 'when';
    when.textContent = `• ${relativeTime(v.ts)}`;
    middle.append(ver, t, when);

    const right = document.createElement('div');
    right.className = 'v-right';
    const chip = document.createElement('span');
    chip.className = 'user-chip';
    const init = document.createElement('span');
    init.className = 'user-initial';
    init.textContent = initials(v.author);
    const name = document.createElement('span');
    name.textContent = v.author;
    chip.append(init, name);
    right.append(chip);

    card.append(left, middle, right);
    root.appendChild(card);
  });
}

function sortVersions(list, mode){
  const copy = [...list];
  if (mode === 'oldest') copy.sort((a,b)=>a.ts-b.ts);
  else if (mode === 'version') copy.sort((a,b)=>b.version-a.version || b.ts-a.ts);
  else copy.sort((a,b)=>b.ts-a.ts); // newest
  return copy;
}
function filterVersions(list, q){
  if (!q) return list;
  const s = q.toLowerCase();
  return list.filter(v =>
    v.txnId.toLowerCase().includes(s) ||
    v.author.toLowerCase().includes(s) ||
    String(v.version).includes(s)
  );
}

function initVersionsUI(){
  if (initVersionsUI._done) return;
  const search = $('#vSearch');
  const sortSel = $('#vSort');
  if (!search || !sortSel) return;

  function rerender(){
    const filtered = filterVersions(versionsData, search.value.trim());
    const sorted = sortVersions(filtered, sortSel.value);
    renderVersions(sorted);
  }

  search.addEventListener('input', rerender);
  sortSel.addEventListener('change', rerender);

  initVersionsUI._done = true;
  rerender();
}

/* =============================
   Document tab (PDFs)
   ============================= */
const DOCS = [
  {
    name: 'Development Standards & Guidelines (Postgres Enhanced)',
    file: 'Development_Standards_Postgres_Enhanced.pdf',
    docDate: '2025-04-10',
    loadedOn: '2025-04-12 12:05 PM',
    size: '1.3 MB'
  },
  {
    name: 'Chart of Accounts',
    file: 'Chart of Accounts.pdf',
    docDate: '2025-04-12',
    loadedOn: '2025-04-12 12:06 PM',
    size: '850 KB'
  },
  {
    name: 'Chart of Accounts (copy)',
    file: 'Chart_of_Accounts_copy.pdf',
    docDate: '2025-04-12',
    loadedOn: '2025-04-12 12:07 PM',
    size: '850 KB'
  }
];

function docUrl(file){
  const base = './docs/';
  return base + encodeURI(file);
}

function renderDocuments(){
  const root = $('#docsList');
  if(!root) return;
  root.innerHTML = '';

  DOCS.forEach(d=>{
    const card = document.createElement('article');
    card.className = 'doc-card';

    const meta = document.createElement('div');
    meta.className = 'doc-meta';

    const fields = [
      { label:'Document Name', value:d.name },
      { label:'Document Date', value:d.docDate },
      { label:'Loaded on',     value:d.loadedOn },
      { label:'Size',          value:d.size },
    ];
    fields.forEach(f=>{
      const row = document.createElement('div');
      row.className = 'doc-field';

      const l = document.createElement('div');
      l.className = 'doc-label';
      l.textContent = f.label;

      const v = document.createElement('div');
      v.className = 'doc-val';
      v.textContent = f.value;

      row.append(l, v);
      meta.appendChild(row);
    });

    const actions = document.createElement('div');
    actions.className = 'doc-actions';

    const openBtn = document.createElement('a');
    openBtn.className = 'btn primary';
    openBtn.textContent = 'Open';
    openBtn.href = docUrl(d.file);
    openBtn.target = '_blank';
    openBtn.rel = 'noopener';
    openBtn.setAttribute('aria-label', `Open ${d.name} in a new tab`);

    actions.appendChild(openBtn);

    card.append(meta, actions);
    root.appendChild(card);
  });
}

function initDocumentsUI(){
  if (initDocumentsUI._done) return;
  renderDocuments();
  initDocumentsUI._done = true;
}

/* =============================
   Currency (native select) logic
   ============================= */
const CUR_KEY = 'gj_currency';

function currentCurrencySymbol(){
  const sel = document.getElementById('gjCurrency');
  if(!sel) return '$';
  const opt = sel.selectedOptions[0];
  return opt ? (opt.dataset.symbol || '$') : '$';
}
function applyCurrencySymbols(){
  document.querySelectorAll('.money-prefix').forEach(el=>{
    el.textContent = currentCurrencySymbol();
  });
}
function setupCurrencyDropdown(){
  const sel = document.getElementById('gjCurrency');
  if(!sel) return;

  // init from localStorage (default CAD)
  const saved = localStorage.getItem(CUR_KEY) || 'CAD';
  if ([...sel.options].some(o=>o.value===saved)) sel.value = saved;

  // apply symbol initially
  applyCurrencySymbols();

  // on change: save + update symbols
  sel.addEventListener('change', ()=>{
    localStorage.setItem(CUR_KEY, sel.value);
    applyCurrencySymbols();
  });
}

/* =============================
   Boot
   ============================= */
document.addEventListener('DOMContentLoaded', ()=>{
  setupSubTabs();
  setupCurrencyDropdown();

  // If the active panel on load is versions/documents, init them
  const activePanel = document.querySelector('.subtab-panel.active');
  if (activePanel && activePanel.id === 'subtab-versions') initVersionsUI();
  if (activePanel && activePanel.id === 'subtab-document') initDocumentsUI();
});
