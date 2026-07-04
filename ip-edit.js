/* ===== Provinces (نفس اللي عندك) ===== */
const PROVINCES = [
  "Alberta","British Columbia","Manitoba","New Brunswick","Newfoundland and Labrador",
  "Nova Scotia","Ontario","Prince Edward Island","Quebec","Saskatchewan"
];

/* ===== داتا وهمية (أسماء + IPs من مثالِك القديم) ===== */
const BASE_PEOPLE = [
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

const FEMALE = new Set(['Mona','Sara','Laila']);

/* مولد سجل كامل من الأساسيات */
function buildPerson(base, i){
  const title = FEMALE.has(base.first) ? 'Ms' : 'Mr';
  const pad = (n)=> String(n).padStart(2,'0');
  const dob = `198${i%10}-${pad((i%12)+1)}-${pad((i%28)+1)}`;
  const sin = `12345678${i%10}`;

  const phone1 = `(416) 555-01${pad(i)}`.slice(0, 14);
  const phone2 = `(437) 555-02${pad(i)}`.slice(0, 14);

  const email = `${base.first}.${base.last}`.toLowerCase();

  // ✅ باسورد وهمي لكل شخص (سهل التذكّر)
  // مثال: AK@00! أو MS@07! (حروف من الاسم + رقم الشخص)
  const initials = `${(base.first[0]||'X')}${(base.last[0]||'X')}`.toUpperCase();
  const password = `${initials}@${pad(i)}!`;

  return {
    id: base.ip, ip: base.ip,
    title, first: base.first, middle: (FEMALE.has(base.first)?'A.':'H.'), last: base.last,
    dob, dod: '', sin,
    password,                         // ✅ مضاف
    imageName: `avatar_${i+1}.jpg`,
    phones: [
      { type:'Mobile', num: phone1, ext:'' },
      { type:'Phone',  num: phone2, ext: String(200 + i) }
    ],
    emails: [
      { type:'Office', email: `${email}@example.com` },
      { type:'Home',   email: `${email}@mail.com` }
    ],
    urls: [
      { url:`https://example.com/u/${email}` }
    ],
    address: {
      streetNo: String(120 + i),
      unit: (i%2 ? '5B' : ''),
      streetName: (i%3? 'Queen St' : 'King St'),
      direction: (i%4===0? 'E' : i%4===1? 'W' : i%4===2? 'N' : 'S'),
      city: 'Toronto',
      province: 'Ontario',
      postal: `M5V 2${i%10}${(i%3? 'A':'B')}`,
      country: 'Canada'
    },
    flags: {
      dob: (i%3===0? 2 : 1),   // أحياناً required
      dod: 0,
      sin: 1,
      img: 1
    }
  };
}

const PEOPLE = BASE_PEOPLE.map(buildPerson);

/* ===== Utilities ===== */
function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn); else fn(); }
const qs = (s, r=document)=> r.querySelector(s);
const ci = s => (s||'').toString().trim().toLowerCase();

/* ===== Toasts (يمين تحت) ===== */
function getToastArea(){
  let area = document.getElementById("toastAreaRight");
  if (!area){
    area = document.createElement("div");
    area.id = "toastAreaRight";
    area.className = "toast-area right";
    document.body.appendChild(area);
  }
  return area;
}
function showToast(msg,type="success",timeout=2000){
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<div class="msg">${msg}</div><button class="close" type="button" aria-label="Close">✕</button>`;
  t.querySelector('.close')?.addEventListener('click', ()=> t.remove());
  getToastArea().appendChild(t);
  if(timeout>0) setTimeout(()=> t.remove(), timeout);
}
window.showToast = showToast;

/* ===== نفس لوجيك الخطوط المتكررة (تليفون/إيميل/URL) ===== */
function formatPhone(v){
  const d=(v||"").replace(/\D/g,"").slice(0,10);
  const a=d.slice(0,3),b=d.slice(3,6),c=d.slice(6,10);
  if(d.length<=3) return a;
  if(d.length<=6) return `(${a}) ${b}`;
  return `(${a}) ${b}-${c}`;
}
function attachPhoneRowBehavior(row){
  const phone=row.querySelector(".phone-input");
  const type=row.querySelector(".phone-type");
  const ext=row.querySelector(".ext-input");
  const extLabel=ext?.closest("label");
  if(phone && !phone.__masked){
    phone.addEventListener("input",()=>{
      const end=phone.selectionStart===phone.value.length;
      phone.value=formatPhone(phone.value);
      if(end) phone.selectionStart=phone.selectionEnd=phone.value.length;
    });
    phone.__masked=true;
  }
  function toggleExt(){
    if(!extLabel) return;
    const show=(type?.value?.toLowerCase()==="phone");
    extLabel.style.display=show?"":"none";
    if(!show && ext) ext.value="";
  }
  type?.addEventListener("change",toggleExt); toggleExt();
}
function makeLine(type,root=false){
  const line=document.createElement("div");
  line.className=`line ${type}-line`; if(root) line.dataset.root="true";
  if(type==="phone"){
    line.innerHTML=`
      <label class="field compact"><span class="meta-title">Type</span>
        <select class="phone-type" required>
          <option value="">Select…</option><option>Phone</option><option>Fax</option><option>Mobile</option>
        </select></label>
      <label class="field grow"><span class="meta-title">Phone Number</span>
        <input class="phone-input" type="tel" placeholder="(506) 452-1342" inputmode="tel" maxlength="18" autocomplete="tel" required/></label>
      <label class="field compact ext-col"><span class="meta-title">Ext</span>
        <input class="ext-input" type="text" placeholder="Ext" inputmode="numeric" maxlength="7"/></label>
      <button type="button" class="icon-btn x-btn remove-line" title="Remove">×</button>`;
    attachPhoneRowBehavior(line);
  }
  if(type==="email"){
    line.innerHTML=`
      <label class="field compact"><span class="meta-title">Type</span>
        <select class="email-type" required>
          <option value="">Select…</option><option>Office</option><option>Home</option><option>School</option>
        </select></label>
      <label class="field grow"><span class="meta-title">Email</span>
        <input class="email-input" type="email" placeholder="name@example.com" autocomplete="email" required/></label>
      <button type="button" class="icon-btn x-btn remove-line" title="Remove">×</button>`;
  }
  if(type==="url"){
    line.innerHTML=`
      <label class="field grow"><span class="meta-title">URL</span>
        <input class="url-input" type="url" placeholder="https://example.com" inputmode="url" autocomplete="url" required/></label>
      <button type="button" class="icon-btn x-btn remove-line" title="Remove">×</button>`;
  }
  line.querySelector(".remove-line")?.addEventListener("click",()=>{ if(!line.dataset.root) line.remove(); });
  return line;
}

/* ===== flags helpers ===== */
function applyConfig(sel,wrapId,inputId,badgeId){
  const wrap=document.getElementById(wrapId),
        input=document.getElementById(inputId),
        badge=badgeId?document.getElementById(badgeId):null;
  if(!sel||!wrap||!input) return;
  const v=String(sel.value||"1");
  if(v==="0"){
    wrap.style.display="none";
    input.required=false;
    input.setAttribute("aria-required","false");
    if(badge) badge.hidden=true;
    try{ input.value=""; }catch{}
    if(inputId==="indImg"){ const el=document.getElementById("imgFileName"); if(el) el.textContent="No file chosen"; }
    return;
  }
  const must=(v==="2");
  wrap.style.display="";
  input.required=must;
  input.setAttribute("aria-required", must?"true":"false");
  if(badge) badge.hidden=!must;
}

/* ===== Prefill logic ===== */
function findSelected(){
  const p = new URLSearchParams(location.search);
  const byId = p.get('id') || p.get('ip');
  const f = p.get('first'), l = p.get('last');

  let m = null;
  if(byId) m = PEOPLE.find(x => ci(x.id)===ci(byId));
  if(!m && f && l) m = PEOPLE.find(x => ci(x.first)===ci(f) && ci(x.last)===ci(l));
  if(!m && f) m = PEOPLE.find(x => ci(x.first)===ci(f));
  if(!m && l) m = PEOPLE.find(x => ci(x.last)===ci(l));
  return m || PEOPLE[0];
}

function fillRepeaters(listId, type, rows){
  const list = document.getElementById(listId);
  if(!list) return;
  list.innerHTML = "";
  rows.forEach((r,idx)=>{
    const line = makeLine(type, idx===0);
    list.appendChild(line);
    if(type==='phone'){
      line.querySelector('.phone-type').value = r.type || '';
      line.querySelector('.phone-input').value = r.num || '';
      const ext = line.querySelector('.ext-input');
      if(ext) ext.value = r.ext || '';
      attachPhoneRowBehavior(line);
    }else if(type==='email'){
      line.querySelector('.email-type').value = r.type || '';
      line.querySelector('.email-input').value = r.email || '';
    }else{
      line.querySelector('.url-input').value = r.url || '';
    }
    if(idx===0){
      line.dataset.root = "true";
      const rm = line.querySelector('.remove-line'); if(rm) rm.style.display="none";
    }
  });
}

function populate(person){
  // عنوان الصفحة
  const ttl = document.getElementById('ip-title');
  ttl.textContent = `Edit Individual: ${person.first} ${person.last} (${person.id})`;

  // الهوية
  document.getElementById('indTitle').value  = person.title || '';
  document.getElementById('indFirst').value  = person.first || '';
  document.getElementById('indMiddle').value = person.middle || '';
  document.getElementById('indLast').value   = person.last || '';

  // التواريخ/SIN/الصورة
  document.getElementById('indDob').value = person.dob || '';
  document.getElementById('indDod').value = person.dod || '';
  document.getElementById('indSin').value = person.sin || '';
  const imgNameEl = document.getElementById('imgFileName');
  if(imgNameEl) imgNameEl.textContent = person.imageName || 'No file chosen';

  // ✅ باسورد (يتعبّى تلقائيًا)
  const pwInput = document.getElementById('ipPassword');
  if (pwInput) pwInput.value = person.password || '';

  // العنوان
  const a = person.address || {};
  document.getElementById('addrStreetNo').value  = a.streetNo || '';
  document.getElementById('addrUnit').value      = a.unit || '';
  document.getElementById('addrStreetName').value= a.streetName || '';
  document.getElementById('addrDirection').value = a.direction || '';
  document.getElementById('addrCity').value      = a.city || '';
  document.getElementById('addrPostal').value    = a.postal || '';
  document.getElementById('addrCountry').value   = a.country || '';

  // المقاطعات
  const addrProv = document.getElementById('addrProvince');
  addrProv.innerHTML = `<option value="">Select…</option>`;
  PROVINCES.forEach(p => {
    const o=document.createElement("option");
    o.value=o.textContent=p;
    if(p === (a.province||'')) o.selected = true;
    addrProv.appendChild(o);
  });

  // Repeaters
  fillRepeaters('indPhones','phone', person.phones || []);
  fillRepeaters('indEmails','email', person.emails || []);
  fillRepeaters('indUrls',  'url',   person.urls   || []);

  // Flags (وتطبيقها على الفورم)
  const flags = person.flags || {};
  const cfgDob=document.getElementById('cfgDob');
  const cfgDod=document.getElementById('cfgDod');
  const cfgSin=document.getElementById('cfgSin');
  const cfgImg=document.getElementById('cfgImg');

  if(flags.dob!=null) cfgDob.value = String(flags.dob);
  if(flags.dod!=null) cfgDod.value = String(flags.dod);
  if(flags.sin!=null) cfgSin.value = String(flags.sin);
  if(flags.img!=null) cfgImg.value = String(flags.img);

  applyConfig(cfgDob,'fldDob','indDob','badgeDob');
  applyConfig(cfgDod,'fldDod','indDod','badgeDod');
  applyConfig(cfgSin,'fldSin','indSin','badgeSin');
  applyConfig(cfgImg,'fldImg','indImg','badgeImg');
}

/* ===== Init + Validation + Submit ===== */
ready(() => {
  // Navbar status (New/INI)
  (function statusBoot(){
    const statusArea = document.getElementById("statusArea");
    const statusChip = document.getElementById("statusChip");
    const helpBtn    = document.getElementById("helpBtn");
    let org="—", lic="—";
    try { org = sessionStorage.getItem("orgid") || "—"; lic = sessionStorage.getItem("license") || "—"; } catch {}
    let statusText = "";
    if (org === "19" && lic === "19") statusText = "New";
    else if (org === "15" && lic === "15") statusText = "INI";
    if (statusText){ statusChip.textContent = statusText; statusArea.hidden = false; }
    helpBtn?.addEventListener("click", () => showToast("You are editing an existing profile.", "success", 2200));
  })();

  // تفعيل زر رفع الصورة
  const imgInput=document.getElementById("indImg"),
        imgTrigger=document.getElementById("imgTrigger"),
        imgNameEl=document.getElementById("imgFileName");
  imgTrigger?.addEventListener("click",()=>imgInput?.click());
  imgInput?.addEventListener("change",()=>{ const f=imgInput.files&&imgInput.files[0]; imgNameEl.textContent=f?f.name:"No file chosen"; });

  // تفعيل Password toggle
  const pwInput=document.getElementById("ipPassword"), pwToggle=document.getElementById("pwToggle");
  pwToggle?.addEventListener("click",()=>{
    const hidden=pwInput.getAttribute("type")==="password";
    pwInput.setAttribute("type", hidden?"text":"password");
    pwToggle.classList.toggle("eye-off", !hidden?true:false);
    pwToggle.setAttribute("aria-label", hidden?"Hide password":"Show password");
  });

  // Addline buttons
  document.querySelectorAll(".addline-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const list=document.getElementById(btn.dataset.target);
      if(!list) return;
      const type = list.classList.contains("phone-list")?"phone":list.classList.contains("email-list")?"email":"url";
      list.appendChild(makeLine(type,false));
    });
  });

  // Prefill selected person
  const person = findSelected();
  populate(person);

  /* ====== Validation ====== */
  function firstEmpty(...ids){ for(const id of ids){ const el=document.getElementById(id); if(el && !String(el.value).trim()) return el; } return null; }
  function validateRepeaters(){
    const phoneNum=document.querySelector("#indPhones .phone-line .phone-input");
    const phoneTyp=document.querySelector("#indPhones .phone-line .phone-type");
    const emailVal=document.querySelector("#indEmails .email-line .email-input");
    const emailTyp=document.querySelector("#indEmails .email-line .email-type");
    const urlVal  =document.querySelector("#indUrls   .url-line   .url-input");
    if(!phoneTyp?.value || !phoneNum?.value.trim()) return {ok:false, el:phoneNum||phoneTyp, msg:"Please enter phone type and number."};
    if(!emailTyp?.value || !emailVal?.value.trim()) return {ok:false, el:emailVal||emailTyp, msg:"Please enter an email."};
    if(!urlVal?.value.trim())                      return {ok:false, el:urlVal, msg:"Please enter a URL."};
    return {ok:true};
  }
  function validateByFlags(){
    const cfgDob=document.getElementById('cfgDob'),
          cfgDod=document.getElementById('cfgDod'),
          cfgSin=document.getElementById('cfgSin'),
          cfgImg=document.getElementById('cfgImg');
    const indDob=document.getElementById('indDob'),
          indDod=document.getElementById('indDod'),
          indSin=document.getElementById('indSin'),
          imgInput=document.getElementById('indImg'),
          imgTrigger=document.getElementById('imgTrigger');
    const dobSel=cfgDob.value, dodSel=cfgDod.value, sinSel=cfgSin.value, imgSel=cfgImg.value;
    if(dobSel==="2" && !indDob.value) return {ok:false, el:indDob, msg:"Date of Birth is required."};
    if(dodSel==="2" && !indDod.value) return {ok:false, el:indDod, msg:"Date of Death is required."};
    if(sinSel==="2" && !indSin.value.trim()) return {ok:false, el:indSin, msg:"SIN is required."};
    if(imgSel==="2"){ const f=imgInput?.files && imgInput.files[0]; if(!f) return {ok:false, el:imgTrigger, msg:"Image is required."}; }
    return {ok:true};
  }
  function validateAll(){
    const must = firstEmpty("indTitle","indFirst","indMiddle","indLast","addrStreetNo","addrStreetName","addrCity","addrPostal","addrCountry");
    if(must) return {ok:false, el:must, msg:"Please complete all required fields."};
    if(!document.getElementById("addrProvince").value) return {ok:false, el:document.getElementById("addrProvince"), msg:"Please choose Province/State."};
    const rep=validateRepeaters(); if(!rep.ok) return rep;
    const fl=validateByFlags();    if(!fl.ok)  return fl;
    return {ok:true};
  }

  // Submit (تحديث فقط من غير تحويل)
  document.getElementById('ipForm')?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const res = validateAll();
    if (!res.ok){
      try{ res.el?.scrollIntoView({behavior:"smooth", block:"center"}); res.el?.focus({preventScroll:true}); }catch{}
      showToast(res.msg, "error", 2800);
      return;
    }
    showToast("Changes saved successfully.", "success", 1500);
    // هنا تقدر تجمع وتحفظ التعديلات لو عندك API
  });
});
