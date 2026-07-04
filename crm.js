// ===== CRM — Dashboard + Services + Customer Docs =====
(() => {
  "use strict";

  const SCOPE = document.getElementById('crmApp');
  const $  = (sel, scope = SCOPE) => scope.querySelector(sel);
  const $$ = (sel, scope = SCOPE) => Array.from(scope.querySelectorAll(sel));

  /* ------------ Helpers ------------- */
  function keyFromHref(hrefRaw){
    const file = (hrefRaw || '').toLowerCase().replace(/[?#].*$/,'');
    if (file.endsWith('.html')) return file.replace('.html','').replace(/[^a-z0-9-]/g,'-') || 'page';
    return file || 'page';
  }

  // SVGs (مصغّرة 20x20)
  const I = {
    gear:`<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm8.94 3a8 8 0 0 0-.65-1.57l1.39-2.41-2.12-2.12-2.41 1.39A8 8 0 0 0 15 3.06V1h-6v2.06A8 8 0 0 0 7.45 4.3L5.04 2.91 2.91 5.03 4.3 7.45A8 8 0 0 0 3.06 9H1v6h2.06a8 8 0 0 0 1.24 2.55l-1.39 2.41 2.12 2.12 2.41-1.39A8 8 0 0 0 20.94 15H23V9h-2.06z"/></svg>`,
    upload:`<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M5 20h14v-2H5m14-9h-4V3H9v6H5l7 7 7-7z"/></svg>`,
    user:`<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-5 0-9 2.5-9 5v3h18v-3c0-2.5-4-5-9-5z"/></svg>`,
    book:`<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M6 2h11a2 2 0 0 1 2 2v15a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3zm0 2a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V4H6z"/></svg>`
  };

  // كارت مربع ثابت + أيقونة صغيرة منسّقة
  function tileHTML(label, iconSvg, href){
    return `
      <button class="tile" type="button"
              ${href ? `data-href="${href}"` : ''}
              aria-label="${label}" title="${label}"
              style="width:140px;height:140px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;">
        <span class="tile-icon" title="${label}"
              style="width:48px;height:48px;display:inline-grid;place-items:center;flex:0 0 48px;background:#eef2ff;border-radius:12px;">
          ${iconSvg}
        </span>
        <span class="tile-label" aria-hidden="true" style="text-align:center;line-height:1.2;">${label}</span>
      </button>
    `;
  }

  /* ------------ Catalog ------------- */
  const TILE_CATALOG = [
    { label:'Add an IP',          icon: I.upload, href:'ip.html',                 group:'services' },
    { label:'Group Management',   icon: I.user,   href:'group1.html',             group:'services' },
    { label:'Role Management',    icon: I.gear,   href:'roles1.html',             group:'services' },
    { label:'Open A New Account', icon: I.user,   href:'open-a-new-account.html', group:'left-only' } // خارج Services
  ];
  const TILE_BY_KEY = new Map(TILE_CATALOG.map(t => [keyFromHref(t.href), t]));

  /* ------------ State (max 15) ------------- */
  const DASHBOARD_MAX = 15;
  const LS_KEY = 'dashOrder';

  function getDashOrder(){
    try{
      const raw = localStorage.getItem(LS_KEY);
      let arr = raw ? JSON.parse(raw) : null;
      if(!Array.isArray(arr) || !arr.length) arr = [];
      arr = arr.filter(k => TILE_BY_KEY.has(k)).slice(0, DASHBOARD_MAX);
      return arr;
    }catch(_){
      return [];
    }
  }
  function saveDashOrder(arr){
    try{ localStorage.setItem(LS_KEY, JSON.stringify(arr.slice(0, DASHBOARD_MAX))); }catch(_){}
  }
  function removeFromDashboard(key){
    const order = getDashOrder();
    const i = order.indexOf(key);
    if(i>-1){ order.splice(i,1); saveDashOrder(order); }
    renderDashboard();
  }

  /* ------------ Tabs ------------- */
  const tabBar  = $('#tabBar');
  const content = $('#contentArea');

  function ensureTab(key, title){
    let tab = tabBar.querySelector(`.tab[data-key="${key}"]`);
    if (!tab){
      tab = document.createElement('button');
      tab.className = 'tab';
      tab.setAttribute('role','tab');
      tab.dataset.key = key;
      tab.innerHTML = `
        <span class="tab-title">${title}</span>
        <span class="close" title="Close" aria-label="Close">×</span>
      `;
      tabBar.appendChild(tab);
      if (key === 'dashboard') tab.querySelector('.close')?.remove();
    }
    return tab;
  }

  function selectTab(key){
    $$('.tab', tabBar).forEach(t => t.setAttribute('aria-selected', String(t.dataset.key===key)));
    renderTab(key);

    // مزامنة القائمة الشمال مع التاب المختار
    $$('.menu-link').forEach(b => {
      b.classList.toggle('is-active',
        (key === 'dashboard'          && b.id === 'btn-dashboard')      ||
        (key === 'services'           && b.id === 'btn-services')       ||
        (key === 'open-a-new-account' && b.id === 'btn-open-account')   ||
        (key === 'customer-docs'      && b.id === 'btn-customer-docs')
      );
    });

    const t = tabBar.querySelector(`.tab[data-key="${key}"] .tab-title`);
    $('#paneTitle').textContent = t ? t.textContent.trim() : 'Page';
  }

  function closeTab(key){
    if (key === 'dashboard') return;
    const wasActive = tabBar.querySelector(`.tab[data-key="${key}"]`)?.getAttribute('aria-selected') === 'true';
    tabBar.querySelector(`.tab[data-key="${key}"]`)?.remove();
    if (wasActive){
      const last = $$('.tab', tabBar).slice(-1)[0];
      selectTab(last ? last.dataset.key : 'dashboard');
    }
  }

  tabBar.addEventListener('click', (e)=>{
    const t = e.target.closest('.tab');
    const c = e.target.closest('.close');
    if (c && t){ closeTab(t.dataset.key); return; }
    if (t){ selectTab(t.dataset.key); }
  });

  /* ------------ Dashboard ------------- */
  function renderDashboard(){
    const order = getDashOrder();
    const tilesHTML = order.map((key, idx)=>{
      const t = TILE_BY_KEY.get(key);
      if(!t) return '';
      const tile = tileHTML(t.label, t.icon, t.href);
      return `
        <div class="tile-wrap" data-key="${key}" data-index="${idx}" draggable="true">
          ${tile}
          <button class="tile-ctl tile-ctl-remove" type="button" aria-label="Remove from Dashboard" title="Remove from Dashboard" data-key="${key}">×</button>
        </div>
      `;
    }).join('');

    content.innerHTML = `
      <div class="dash-wrap">
        <div class="tile-grid">
          ${tilesHTML || `<div class="muted" style="opacity:.7;padding:8px 0;">No tiles</div>`}
        </div>
      </div>
    `;

    // فتح في تبويب داخلي
    content.querySelectorAll('.tile[data-href]').forEach(el=>{
      const href  = el.getAttribute('data-href') || '';
      const title = el.getAttribute('aria-label') || 'Page';
      const key   = keyFromHref(href);
      const open = () => openPageTab({ key, title, href });
      el.addEventListener('click', open);
      el.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); open(); }});
    });

    // حذف من الداشبورد
    content.querySelectorAll('.tile-ctl-remove[data-key]').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        e.stopPropagation(); e.preventDefault();
        removeFromDashboard(btn.dataset.key);
      });
    });

    // سحب وإفلات لإعادة الترتيب
    const grid = content.querySelector('.tile-grid');
    let dragWrap=null, dragKey=null;
    grid.querySelectorAll('.tile-wrap[draggable="true"]').forEach(w=>{
      w.addEventListener('dragstart', e=>{
        dragWrap=w; dragKey=w.dataset.key; w.classList.add('dragging');
        e.dataTransfer.effectAllowed='move';
      });
      w.addEventListener('dragend', ()=>{
        w.classList.remove('dragging');
        grid.querySelectorAll('.drop-target').forEach(el=> el.classList.remove('drop-target'));
        dragWrap=null; dragKey=null;
      });
      w.addEventListener('dragover', e=> e.preventDefault());
      w.addEventListener('dragenter', ()=>{ if(dragWrap && w!==dragWrap) w.classList.add('drop-target'); });
      w.addEventListener('dragleave', ()=> w.classList.remove('drop-target'));
      w.addEventListener('drop', e=>{
        e.preventDefault();
        if(!dragWrap || w===dragWrap) return;
        const targetKey = w.dataset.key;
        let ord = getDashOrder();
        const i = ord.indexOf(dragKey), j = ord.indexOf(targetKey);
        if(i>-1 && j>-1 && i!==j){ [ord[i], ord[j]] = [ord[j], ord[i]]; saveDashOrder(ord); renderDashboard(); }
      });
    });
  }

  function openPageTab({key, title, href}){
    ensureTab(key, title);
    $$('.tab', tabBar).forEach(t => t.setAttribute('aria-selected', String(t.dataset.key===key)));
    $('#paneTitle').textContent = title || 'Page';
    content.innerHTML = `
      <div class="iframe-host">
        <iframe src="${href}" title="${title}" loading="lazy"></iframe>
      </div>
    `;
  }

  // استقبال رسائل من صفحات داخل iframe
  window.addEventListener('message', (e) => {
    const d = e.data || {};
    if (d.type === 'crm-open-tab' && d.href) {
      const key = d.key || keyFromHref(d.href);
      const title = d.title || 'Page';
      ensureTab(key, title);
      openPageTab({ key, title, href: d.href });
      const t = tabBar.querySelector(`.tab[data-key="${key}"]`);
      if (t) t.setAttribute('aria-selected','true');
    }
  });

  /* ------------ Services ------------- */
  function renderServices(){
    // Open A New Account متشالة من هنا
    const tiles = [
      { label:'Add an IP',          icon:I.upload, href:'ip.html' },
      { label:'Group Management',   icon:I.user,   href:'group1.html' },
      { label:'Role Management',    icon:I.gear,   href:'roles1.html' }
    ];
    const dashKeys = new Set(getDashOrder());

    const grid = tiles.map(t=>{
      const key = keyFromHref(t.href);
      const exists = dashKeys.has(key);
      const tile = tileHTML(t.label, t.icon, t.href);
      const ctlBtn = exists
        ? `<button class="tile-ctl tile-ctl-indicator" type="button" aria-label="Exists on Dashboard" title="Exists on Dashboard" disabled>✓</button>`
        : `<button class="tile-ctl tile-ctl-add" type="button" aria-label="Add to Dashboard" title="Add to Dashboard" data-key="${key}">+</button>`;
      return `<div class="tile-wrap" data-key="${key}">${tile}${ctlBtn}</div>`;
    }).join('');

    content.innerHTML = `
      <div class="gl-wrap">
        <div class="gl-head">
          <span class="tile-icon" aria-hidden="true"
                style="width:48px;height:48px;display:inline-grid;place-items:center;background:#eef2ff;border-radius:12px;">${I.book}</span>
          <h3 class="gl-title">Services</h3>
        </div>

        <div class="gl-acc" role="region" aria-label="Services accordion">
          <div class="gl-item" aria-expanded="false">
            <div class="gl-toggle">
              <span class="ico">${I.gear}</span>
              <span>Core Services</span>
              <button class="chev-btn" type="button" data-level="1" aria-expanded="false" title="Toggle section">
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M9 6l6 6-6 6"/></svg>
              </button>
            </div>

            <div class="gl-body">
              <div class="gl-list" data-lock="cols">
                <div class="gl-sub" aria-expanded="false">
                  <div class="gl-sub-head">
                    <h4 class="gl-sub-title">Quick Actions</h4>
                    <button class="chev-btn-sm" type="button" data-level="2" aria-expanded="false" title="Toggle">
                      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M9 6l6 6-6 6"/></svg>
                    </button>
                  </div>
                  <div class="gl-sub-body">
                    <div class="tile-grid">
                      ${grid}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    `;

    // فتح التايل في تبويب
    content.querySelectorAll('.tile[data-href]').forEach(el=>{
      const href  = el.getAttribute('data-href') || '';
      const title = el.getAttribute('aria-label') || 'Page';
      const key   = keyFromHref(href);
      const open = () => openPageTab({ key, title, href });
      el.addEventListener('click', open);
      el.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); open(); }});
    });

    // إضافة للداشبورد
    content.querySelectorAll('.tile-ctl-add[data-key]').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        e.stopPropagation(); e.preventDefault();
        const k = btn.dataset.key;
        let order = getDashOrder();
        if(order.includes(k)) return;
        if(order.length >= DASHBOARD_MAX){ alert(`Max ${DASHBOARD_MAX} tiles on dashboard.`); return; }
        order.unshift(k);
        saveDashOrder(order);
        btn.classList.remove('tile-ctl-add');
        btn.classList.add('tile-ctl-indicator');
        btn.textContent = '✓';
        btn.title = 'Exists on Dashboard';
        btn.setAttribute('aria-label','Exists on Dashboard');
        btn.disabled = true;
      });
    });

    // Toggle أكورديون
    content.addEventListener('click', (e)=>{
      const btn1 = e.target.closest('.chev-btn');
      const btn2 = e.target.closest('.chev-btn-sm');

      if (btn1){
        const item = btn1.closest('.gl-item');
        const now = item.getAttribute('aria-expanded') === 'true';
        item.setAttribute('aria-expanded', String(!now));
        btn1.setAttribute('aria-expanded', String(!now));
      }
      if (btn2){
        const sub = btn2.closest('.gl-sub');
        const now = sub.getAttribute('aria-expanded') === 'true';
        sub.setAttribute('aria-expanded', String(!now));
        btn2.setAttribute('aria-expanded', String(!now));
      }
    });
  }

  function renderTab(key){
    if (key === 'dashboard') return renderDashboard();
    if (key === 'services')  return renderServices();

    // التابات التي تحمّل صفحات داخل iframe
    if (key === 'open-a-new-account') {
      return openPageTab({ key, title:'Open A New Account', href:'open-a-new-account.html' });
    }
    if (key === 'customer-docs') {
      return openPageTab({ key, title:'Customer Docs', href:'customer-docs.html' });
    }
  }

  /* ------------ Left Pane: toggle + resize ------------- */
  const workArea  = $('.work-area');
  const paneToggle= $('#paneToggle');
  const resizer   = $('#paneResizer');

  paneToggle.addEventListener('click', ()=>{
    const collapsed = workArea.classList.toggle('is-collapsed');
    paneToggle.setAttribute('aria-expanded', String(!collapsed));
  });

  resizer.addEventListener('mousedown', startResize);
  resizer.addEventListener('touchstart', (e)=> startResize(e.touches[0]), {passive:true});

  resizer.addEventListener('dblclick', ()=>{
    const cs = getComputedStyle(SCOPE);
    const MIN = (cs.getPropertyValue('--left-min') || '300px').trim();
    SCOPE.style.setProperty('--left-w', MIN);
  });

  function startResize(ev){
    ev.preventDefault?.();

    const cs = getComputedStyle(SCOPE);
    const MIN = parseInt(cs.getPropertyValue('--left-min')) || 300;
    const MAX = 520;
    const startX = ev.clientX ?? 0;
    const startW = $('.pane-left').getBoundingClientRect().width;

    workArea.classList.add('resizing');
    function onMove(e){
      const clientX = e.clientX ?? (e.touches?.[0]?.clientX || 0);
      let w = startW + (clientX - startX);
      w = Math.max(MIN, Math.min(MAX, w));
      SCOPE.style.setProperty('--left-w', w + 'px');
    }
    function onUp(){
      workArea.classList.remove('resizing');
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, {passive:false});
    window.addEventListener('touchend', onUp);
  }

  /* ------------ Left menu actions ------------- */
  $('#btn-dashboard').addEventListener('click', ()=>{
    $$('.menu-link').forEach(b => b.classList.toggle('is-active', b.id==='btn-dashboard'));
    ensureTab('dashboard','Dashboard');
    selectTab('dashboard');
  });

  $('#btn-services').addEventListener('click', ()=>{
    $$('.menu-link').forEach(b => b.classList.toggle('is-active', b.id==='btn-services'));
    ensureTab('services','Services');
    selectTab('services');
  });

  // فتح صفحة Open A New Account من العمود الشمال فقط
  const btnOpenAcc = $('#btn-open-account');
  if (btnOpenAcc){
    btnOpenAcc.addEventListener('click', ()=>{
      $$('.menu-link').forEach(b => b.classList.toggle('is-active', b.id==='btn-open-account'));
      const key = keyFromHref('open-a-new-account.html');
      ensureTab(key, 'Open A New Account');
      openPageTab({ key, title:'Open A New Account', href:'open-a-new-account.html' });
    });
  }

  // Customer Docs
  const btnCustomerDocs = $('#btn-customer-docs');
  if (btnCustomerDocs){
    btnCustomerDocs.addEventListener('click', ()=>{
      $$('.menu-link').forEach(b => b.classList.toggle('is-active', b.id==='btn-customer-docs'));
      const key = keyFromHref('customer-docs.html');
      ensureTab(key, 'Customer Docs');
      openPageTab({ key, title:'Customer Docs', href:'customer-docs.html' });
    });
  }

  /* ------------ Boot ------------- */
  function boot(){
    try { localStorage.setItem(LS_KEY, '[]'); } catch(_) {} // Dashboard فاضي
    ensureTab('dashboard','Dashboard');
    selectTab('dashboard');
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
