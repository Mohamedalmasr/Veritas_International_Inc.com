/* =========================================================
   ONEklient Purchase Invoice — UI Logic (Vanilla JS)
   - Add/Remove items
   - Auto totals (subtotal, tax, freight, grand total)
   - Toggle "Auto Tax" ON/OFF (navy when ON)
   - Accessible custom dropdowns for all <select.enhance>
   - Duplicate guard (vendor + invoice_no) via localStorage
========================================================= */
(() => {
  const qs  = (s, el=document) => el.querySelector(s);
  const qsa = (s, el=document) => Array.from(el.querySelectorAll(s));

  const itemsWrap   = qs('#items');
  const tpl         = qs('#item-template');
  const addBtn      = qs('#btn-add-item');
  const freightEl   = qs('#freight');
  const subtotalEl  = qs('#subtotal');
  const taxTotalEl  = qs('#tax_total');
  const grandEl     = qs('#grand_total');
  const form        = qs('#purchase-invoice');
  const autoTaxBtn  = qs('#btn-autotax'); // قد لا يكون موجود في بعض الصفحات

  const TAX = { 'VAT 5%': 0.05, 'VAT 10%': 0.10, 'Exempt': 0, '—': 0 };

  const money = (n) => (Number.isFinite(n) ? n : 0).toFixed(2);
  const num   = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };

  /* ---------- Enhanced dropdowns ---------- */
  function enhanceSelect(select){
    // بنفعلها بس لو select.enhance
    if(!select.classList.contains('enhance')) return;

    const wrap = document.createElement('div');
    wrap.className = 'select-wrap';
    const btn  = document.createElement('button');
    btn.type   = 'button';
    btn.className = 'select-btn';
    btn.setAttribute('role','combobox');
    btn.setAttribute('aria-haspopup','listbox');
    btn.setAttribute('aria-expanded','false');

    const menu = document.createElement('div');
    menu.className = 'select-menu';
    menu.setAttribute('role','listbox');
    menu.hidden = true;

    // Build list from <option>
    Array.from(select.options).forEach((opt) => {
      const item = document.createElement('div');
      item.className = 'select-item';
      item.setAttribute('role','option');
      item.dataset.value = opt.value;
      item.textContent = opt.textContent;
      if(opt.selected) item.setAttribute('aria-selected','true');
      item.addEventListener('click', () => {
        select.value = opt.value;
        btn.textContent = opt.textContent;
        qsa('.select-item', menu).forEach(i => i.removeAttribute('aria-selected'));
        item.setAttribute('aria-selected','true');
        closeMenu();
        select.dispatchEvent(new Event('change', {bubbles:true}));
      });
      menu.appendChild(item);
      if(opt.selected) btn.textContent = opt.textContent;
    });

    // Default text
    if(!btn.textContent) btn.textContent = select.options[select.selectedIndex]?.textContent || 'Select…';

    // Insert & hide native
    select.classList.add('select-hidden');
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);
    wrap.appendChild(btn);
    wrap.appendChild(menu);

    function openMenu(){
      menu.hidden = false;
      btn.setAttribute('aria-expanded','true');
    }
    function closeMenu(){
      menu.hidden = true;
      btn.setAttribute('aria-expanded','false');
    }
    function toggleMenu(){
      menu.hidden ? openMenu() : closeMenu();
    }

    btn.addEventListener('click', toggleMenu);
    btn.addEventListener('keydown', (e) => {
      if(e.key === 'ArrowDown'){ e.preventDefault(); openMenu(); (menu.querySelector('[aria-selected="true"]') || menu.firstElementChild)?.focus(); }
      if(e.key === 'Escape'){ closeMenu(); btn.focus(); }
    });
    menu.addEventListener('keydown', (e) => {
      const items = qsa('.select-item', menu);
      const idx = items.indexOf(document.activeElement);
      if(e.key === 'ArrowDown'){ e.preventDefault(); (items[idx+1] || items[0]).focus(); }
      if(e.key === 'ArrowUp'){ e.preventDefault(); (items[idx-1] || items[items.length-1]).focus(); }
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); document.activeElement.click(); }
      if(e.key === 'Escape'){ closeMenu(); btn.focus(); }
    });

    // Manage focusability of items
    qsa('.select-item', menu).forEach(i => i.tabIndex = -1);

    // Click outside
    document.addEventListener('click', (e) => {
      if(!wrap.contains(e.target)) closeMenu();
    });
  }

  /* ---------- Items ---------- */
  function createItem(index){
    const html = tpl.innerHTML.replaceAll('__i__', index);
    const frag = document.createRange().createContextualFragment(html);
    const itemEl = frag.firstElementChild;

    // Enhance selects inside the item (لو عليها .enhance)
    qsa('select', itemEl).forEach(enhanceSelect);

    const qty     = qs('#qty-'+index, itemEl);
    const price   = qs('#price-'+index, itemEl);
    const taxSel  = qs('#tax-'+index, itemEl);
    const amount  = qs('#amount-'+index, itemEl);
    const remove  = qs('.btn-remove', itemEl);

    function recalcLine(){
      // قيمة السطر بدون ضريبة — الضريبة بتتحسب على مستوى الإجمالي حسب AutoTax
      amount.value = money(num(qty.value) * num(price.value));
      updateTotals();
    }
    qty.addEventListener('input', recalcLine);
    price.addEventListener('input', recalcLine);
    taxSel.addEventListener('change', updateTotals);

    remove.addEventListener('click', () => {
      if(qsa('.item', itemsWrap).length > 1){
        itemEl.remove();
        reindexItems();
        updateTotals();
      }
    });

    return itemEl;
  }

  function reindexItems(){
    qsa('.item', itemsWrap).forEach((el, i) => {
      const idx = i+1;
      el.dataset.index = idx;
      const map = ['item_code','unit','account','desc','qty','price','tax','amount'];
      map.forEach((base) => {
        const control = el.querySelector(`[id^="${base}-"]`);
        if(!control) return;
        control.id = `${base}-${idx}`;
        if(control.name){ control.name = control.name.replace(/items\[\d+\]/, `items[${idx}]`); }
        const label = el.querySelector(`label[for^="${base}-"]`);
        if(label) label.setAttribute('for', control.id);
      });
    });
  }

  /* ---------- Totals ---------- */
  function isAutoTaxOn(){
    // لو الزرار مش موجود نعتبر Auto Tax = ON افتراضيًا
    if(!autoTaxBtn) return true;
    return autoTaxBtn.getAttribute('aria-pressed') === 'true';
  }

  function calcTotals(){
    let subtotal = 0, taxTotal = 0;

    qsa('.item', itemsWrap).forEach(el => {
      const qty   = num(el.querySelector('[id^="qty-"]').value);
      const price = num(el.querySelector('[id^="price-"]').value);
      const tax   = el.querySelector('[id^="tax-"]')?.value;
      const line  = qty * price;

      subtotal += line;

      if(isAutoTaxOn()){
        taxTotal += line * (TAX[tax] ?? 0);
      }
    });

    return { subtotal, taxTotal };
  }

  function updateTotals(){
    const { subtotal, taxTotal } = calcTotals();
    subtotalEl.value = money(subtotal);
    taxTotalEl.value = money(taxTotal);
    const freight = num(freightEl.value);
    grandEl.value = money(subtotal + taxTotal + freight);
  }

  /* ---------- Helpers ---------- */
  function addInitialItem(){
    const el = createItem(1);
    itemsWrap.appendChild(el);
  }

  function isDuplicate(vendor, invoiceNo){
    const KEY = 'pi_invoices';
    const raw = localStorage.getItem(KEY);
    const set = new Set(raw ? JSON.parse(raw) : []);
    const token = (vendor||'').trim().toLowerCase() + '|' + (invoiceNo||'').trim().toLowerCase();
    return { exists: set.has(token), token, set, KEY };
  }

  /* ---------- Events ---------- */
  addBtn?.addEventListener('click', () => {
    const count = qsa('.item', itemsWrap).length;
    const el = createItem(count + 1);
    itemsWrap.appendChild(el);
    updateTotals();
  });

  freightEl?.addEventListener('input', updateTotals);

  // Toggle AutoTax زرار — لو موجود فقط
  autoTaxBtn?.addEventListener('click', () => {
    const on = autoTaxBtn.getAttribute('aria-pressed') === 'true';
    autoTaxBtn.setAttribute('aria-pressed', on ? 'false' : 'true');
    updateTotals();
  });

  form?.addEventListener('reset', () => {
    requestAnimationFrame(() => {
      itemsWrap.innerHTML = '';
      addInitialItem();
      updateTotals();
    });
  });

  form?.addEventListener('submit', (e) => {
    const vendor = qs('#vendor')?.value;
    const invoiceNo = qs('#invoice_no')?.value;
    const date = qs('#invoice_date')?.value;

    if(!vendor || !invoiceNo || !date){
      e.preventDefault();
      alert('Please fill Vendor, Invoice No., and Date.');
      return;
    }

    const dup = isDuplicate(vendor, invoiceNo);
    if(dup.exists){
      e.preventDefault();
      alert('This vendor already has an invoice with the same number.');
      return;
    }

    dup.set.add(dup.token);
    localStorage.setItem(dup.KEY, JSON.stringify(Array.from(dup.set)));

    // Demo only
    e.preventDefault();
    alert('Form is valid — ready to POST to your backend.');
  });

  // Enhance all selects on the page that opt-in with .enhance
  qsa('select.enhance').forEach(enhanceSelect);

  // Init items & totals
  const start = () => { addInitialItem(); updateTotals(); };
  if(document.readyState !== 'loading') start(); else document.addEventListener('DOMContentLoaded', start);
})();
