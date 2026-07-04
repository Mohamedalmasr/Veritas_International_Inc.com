(() => {
  "use strict";

  /* ===== Mock Data (Demo) ===== */
  const DATA = [
    { first:'Ahmed',  last:'Kamel',   ip:'192.168.1.20' },
    { first:'Ahmed',  last:'Samir',   ip:'172.16.2.5'   },
    { first:'Ahmad',  last:'Zaki',    ip:'192.168.1.55' },
    { first:'Ahmed',  last:'Gamal',   ip:'192.168.1.21' },
    { first:'Hassan', last:'Ibrahim', ip:'10.0.0.44'    },
    { first:'Kareem', last:'Adel',    ip:'192.168.0.8'  },
    { first:'Mona',   last:'Aly',     ip:'192.168.2.33' },
    { first:'Sara',   last:'Nader',   ip:'10.10.10.10'  },
    { first:'Omar',   last:'Khaled',  ip:'172.16.0.12'  },
    { first:'Laila',  last:'Saad',    ip:'192.168.1.77' },
    { first:'Ali',    last:'Hassan',  ip:'10.0.0.22'    }
  ];

  /* ===== Elements ===== */
  const typeHint      = document.getElementById('typeHint');
  const accTypeSel    = document.getElementById('accType');

  const ownersCard    = document.getElementById('ownersCard');
  const ownersList    = document.getElementById('ownersList');
  const savedOwnersEl = document.getElementById('savedOwners');
  const ownerSearch   = document.getElementById('ownerSearchBlock');
  const ownerForm     = document.getElementById('ownersSearchForm');
  const ownerBySel    = document.getElementById('ownerBy');
  const ownerQ        = document.getElementById('ownerQ');
  const ownerHint     = document.getElementById('ownerSelectHint');
  const ownerSelText  = document.getElementById('ownerSelText');
  const ownerConfirm  = document.getElementById('confirmOwner');

  const authCard      = document.getElementById('authCard');
  const authTypeSel   = document.getElementById('authTypeSel'); // يحتوي Tenant / Gurantor
  const savedAuthEl   = document.getElementById('savedAuth');
  const authSearch    = document.getElementById('authSearchBlock');
  const authForm      = document.getElementById('authSearchForm');
  const authBySel     = document.getElementById('authBy');
  const authQ         = document.getElementById('authQ');
  const authHint      = document.getElementById('authSelectHint');
  const authSelText   = document.getElementById('authSelText');
  const authConfirm   = document.getElementById('confirmAuth');

  const wizardFooter  = document.getElementById('wizardFooter');
  const btnNext       = document.getElementById('btnNext');
  const wrapAddCo     = document.getElementById('wrapAddCo');
  const wrapAddAuth   = document.getElementById('wrapAddAuth');
  const btnAddCoOwner = document.getElementById('btnAddCoOwner');
  const btnAddAuth    = document.getElementById('btnAddAuthorized');

  const sheet     = document.getElementById('resultsSheet');
  const resultsEl = document.getElementById('results');
  const closeBt   = document.getElementById('closeSheet');

  /* ===== State ===== */
  let MAX_OWNERS = 0;               // set when type selected
  const savedOwners = new Map();    // key: first|last
  const savedAuth   = new Map();    // key: first|last
  const nameKey = o => `${(o.first||'').toLowerCase()}|${(o.last||'').toLowerCase()}`;
  const norm    = s => (s||'').toString().trim();

  /* ===== Generic helpers ===== */
  const openSheet  = () => sheet.setAttribute('data-open','true');
  const closeSheet = () => sheet.removeAttribute('data-open');
  closeBt.addEventListener('click', closeSheet);

  function ensureToastArea(){
    let el = document.getElementById('toastArea');
    if(!el){
      el = document.createElement('div');
      el.id = 'toastArea';
      el.className = 'toast-area';
      el.setAttribute('aria-live','assertive');
      el.setAttribute('aria-atomic','true');
      document.body.appendChild(el);
    }
    // fallback inline position
    el.style.position = 'fixed';
    el.style.right = '16px';
    el.style.bottom = '16px';
    el.style.zIndex = '2147483647';
    return el;
  }
  function showErrorToast(message){
    const host = ensureToastArea();
    host.innerHTML = `
      <div class="toast" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="msg">${message}</div>
        <button class="close" type="button" aria-label="Close">×</button>
      </div>
    `;
    host.querySelector('.close')?.addEventListener('click',()=>{ host.innerHTML=''; });
  }

  function filterBy(by, q){
    const query = norm(q).toLowerCase();
    if(!query) return [];
    if(by === 'ip')    return DATA.filter(x => (x.ip    || '').toLowerCase().includes(query));
    if(by === 'first') return DATA.filter(x => (x.first || '').toLowerCase().includes(query));
    return DATA.filter(x => (x.last  || '').toLowerCase().includes(query));
  }

  function renderList(container, map, typeLabel){
    const arr = [...map.values()];
    if(!arr.length){ container.hidden = true; container.innerHTML = ''; return; }
    container.hidden = false;
    container.innerHTML = arr.map(o => `
      <div class="saved-owner" data-key="${nameKey(o)}">
        <div class="name"><strong>${typeLabel}:</strong>&nbsp;${o.first} ${o.last} — ${o.ip || '-'}${o.role ? ` <span class="pill">(${o.role})</span>` : ''}</div>
        <button class="icon-btn clear-x" type="button" title="Remove">×</button>
      </div>
    `).join('');
    container.querySelectorAll('.clear-x').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const key = btn.closest('.saved-owner')?.dataset.key;
        if(key){ map.delete(key); renderAll(); }
      });
    });
  }

  function forcePayrollSingleOwner(){
    if (MAX_OWNERS !== 1) return;
    if (savedOwners.size <= 1) return;
    const firstKey = savedOwners.keys().next().value;
    for (const k of Array.from(savedOwners.keys())) if (k !== firstKey) savedOwners.delete(k);
    renderList(savedOwnersEl, savedOwners, 'Owner');
    showErrorToast('Payroll allows only one Owner. Keeping the first and removing others.');
  }

  function renderAll(){
    renderList(savedOwnersEl, savedOwners, 'Owner');
    renderList(savedAuthEl,   savedAuth,   'Authorized');

    const hasType  = !!accTypeSel.value;
    const hasOwner = savedOwners.size > 0;

    wizardFooter.hidden = !hasType;
    btnNext.disabled    = !(hasType && hasOwner);

    // show add buttons after first owner
    wrapAddCo.hidden   = !hasOwner;
    wrapAddAuth.hidden = !hasOwner;

    // collapse owner search unless explicitly opened
    ownersCard.classList.toggle('collapsed', hasOwner && ownerSearch.dataset.mode !== 'open');

    // payroll single owner enforcement
    forcePayrollSingleOwner();

    // Disable co-owner button if Payroll
    const isPayroll = (accTypeSel.value||'').toLowerCase()==='payroll';
    if (btnAddCoOwner){
      btnAddCoOwner.disabled = isPayroll;
      btnAddCoOwner.setAttribute('aria-disabled', isPayroll ? 'true' : 'false');
      btnAddCoOwner.title = isPayroll ? 'Payroll accounts allow only one owner.' : '';
    }
  }

  /* ===== Account type selection ===== */
  function applyTypeSelection(){
    const v = (accTypeSel.value || '').toLowerCase();
    if (!v){
      ownersCard.hidden = true;
      authCard.hidden   = true;
      typeHint.hidden   = false;
      MAX_OWNERS = 0;
      renderAll();
      return;
    }
    ownersCard.hidden = false;
    typeHint.hidden   = true;
    MAX_OWNERS = (v === 'payroll') ? 1 : 3;

    forcePayrollSingleOwner();
    renderAll();
  }
  accTypeSel.addEventListener('change', applyTypeSelection);

  /* ===== Results rendering (bottom sheet) ===== */
  function renderResults(items, onChoose){
    resultsEl.innerHTML = items.map(p=>`
      <div class="result-item">
        <strong>${p.first} ${p.last}</strong>
        <small>${p.ip || '-'}</small>
        <button class="chip-btn" data-first="${p.first}" data-last="${p.last}" data-ip="${p.ip || ''}">Choose</button>
      </div>
    `).join('') || `<div style="padding:12px;">No results.</div>`;

    resultsEl.querySelectorAll('.chip-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const person = { first: btn.dataset.first || '', last: btn.dataset.last || '', ip: btn.dataset.ip || '' };
        onChoose?.(person);
        closeSheet();
      });
    });
  }

  /* ===== Owners search/confirm ===== */
  ownerForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    if (!accTypeSel.value){ showErrorToast('Please select an account type first.'); return; }
    const items = filterBy(ownerBySel.value, ownerQ.value);
    renderResults(items, (p)=>{
      ownerSelText.textContent = `${p.first} ${p.last} — ${p.ip}`;
      ownerHint.hidden = false;
      ownerConfirm.onclick = ()=>{
        const key = nameKey(p);
        if (savedOwners.has(key)) { showErrorToast('This Owner is already added.'); return; }
        if (MAX_OWNERS && savedOwners.size >= MAX_OWNERS){
          showErrorToast(`You reached the maximum number of Owners (${MAX_OWNERS}).`);
          return;
        }
        savedOwners.set(key, p);
        // hide search after first add (re-open via Add co-owner)
        ownerSearch.dataset.mode = '';
        ownerHint.hidden = true;
        ownerQ.value = '';
        renderAll();
      };
    });
    openSheet();
  });

  /* ===== Add co-owner button ===== */
  btnAddCoOwner?.addEventListener('click', ()=>{
    if (btnAddCoOwner.disabled) return; // locked for payroll
    authCard.hidden = true;                     // hide auth section
    ownersCard.hidden = false;
    ownerSearch.dataset.mode = 'open';          // keep search visible
    ownersCard.classList.remove('collapsed');
    // place search block right after saved owners list (under the chosen owner)
    const container = ownerSearch.parentElement;
    if (savedOwnersEl.nextElementSibling !== ownerSearch){
      container.insertBefore(ownerSearch, savedOwnersEl.nextElementSibling);
    }
    ownerSearch.scrollIntoView({behavior:'smooth',block:'nearest'});
  });

  /* ===== Authorization search/confirm ===== */
  authForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    if (!accTypeSel.value){ showErrorToast('Please select an account type first.'); return; }
    const items = filterBy(authBySel.value, authQ.value);
    renderResults(items, (p)=>{
      authSelText.textContent = `${p.first} ${p.last} — ${p.ip}`;
      authHint.hidden = false;
      authConfirm.onclick = ()=>{
        const key = nameKey(p);

        // ممنوع لو Owner
        if (savedOwners.has(key)){
          showErrorToast('This person is already an Owner and cannot be added as Authorized.');
          return;
        }

        // ✅ NEW: ممنوع إضافة نفس الشخص Authorized مرتين
        if (savedAuth.has(key)){
          showErrorToast('This person is already Authorized.');
          return;
        }

        // خزن الدور المختار (Tenant / Gurantor) لو موجود
        const role = (authTypeSel?.value || '').trim();
        const entry = role ? { ...p, role } : { ...p };

        savedAuth.set(key, entry);

        authHint.hidden = true;
        authQ.value = '';
        renderAll();
      };
    });
    openSheet();
  });

  /* ===== Add Authorized Person button ===== */
  btnAddAuth?.addEventListener('click', ()=>{
    ownersCard.classList.add('collapsed'); // hide owner search if open
    ownerSearch.dataset.mode = '';
    authCard.hidden = false;
    authCard.scrollIntoView({behavior:'smooth',block:'nearest'});
  });

  /* ===== Assign New Account -> go to customer-profile.html with owners & auth ===== */
  btnNext.addEventListener('click', ()=>{
    if (!accTypeSel.value){
      showErrorToast('Please select an account type.');
      return;
    }
    if (!savedOwners.size){
      showErrorToast('Please add at least one Owner.');
      return;
    }

    const accType = accTypeSel.value;
    const limit   = (accType.toLowerCase()==='payroll') ? 1 : 3;
    const ownersConfirmed = [...savedOwners.values()].slice(0, limit);
    const authConfirmed   = [...savedAuth.values()]; // optional

    // helpers for title
    const typeToCode = (t)=>{
      const v = (t||'').toLowerCase();
      if (v==='payroll') return 'PR';
      if (v==='receivable') return 'AR';
      if (v==='payable') return 'AP';
      return '';
    };
    const buildTitle = ()=>{
      const lastNames = ownersConfirmed.map(o=>(o.last||'').trim()).filter(Boolean);
      const base = lastNames.length ? lastNames.join(' - ') : 'Customer Profile';
      const code = typeToCode(accType);
      return code ? `${base} - ${code}` : base;
    };

    const title   = buildTitle();
    const tabKey  = `customer-profile-${Date.now()}`;
    const ownersParam = encodeURIComponent(JSON.stringify(ownersConfirmed));
    let href = `customer-profile.html?accType=${encodeURIComponent(accType)}&owners=${ownersParam}&tabKey=${encodeURIComponent(tabKey)}`;

    if (authConfirmed.length){
      const authParam = encodeURIComponent(JSON.stringify(authConfirmed));
      href += `&auth=${authParam}`;
    }

    // Open as CRM tab if inside an iframe with a tab host
    try{
      if (window.parent && window.parent !== window){
        window.parent.postMessage({ type:'crm-open-tab', key: tabKey, title, href }, '*');
        setTimeout(()=>{
          window.parent.postMessage({ type:'crm-rename-tab', key: tabKey, title }, '*');
          window.parent.postMessage({ type:'crm-retitle-tab', key: tabKey, title }, '*');
        }, 200);
        return;
      }
    }catch(_){}

    // Otherwise navigate in the same window
    document.title = title;
    window.location.href = href;
  });

  /* ===== Init ===== */
  applyTypeSelection();
  renderAll();
})();
