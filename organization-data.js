/* Organization Data – full JS with fake DB, session sync, delete control */

const PROVINCES = [
  "Alberta","British Columbia","Manitoba","New Brunswick","Newfoundland and Labrador",
  "Nova Scotia","Ontario","Prince Edward Island","Quebec","Saskatchewan"
];

const ORGS_STORAGE_KEY = "ORGS_DB";

/* Default fake DB (used if nothing in session) */
const ORGS_DB_DEFAULT = [
  {
    id: "1001",
    name: "Acme Logistics Ltd",
    phones:[{type:"Phone", num:"(506) 400-1200", ext:"101"}],
    emails:[{type:"General", email:"info@acmelogistics.com"}],
    urls:["https://acmelogistics.com"],
    address:{ streetNo:"500", unit:"", streetName:"Harbour", dir:"E", city:"Toronto", province:"Ontario", postal:"M5A 1A1", country:"Canada" },
    password:"Org@2024!AL"
  },
  {
    id: "1002",
    name: "Northwind Traders",
    phones:[{type:"Phone", num:"(506) 411-2300", ext:""}],
    emails:[{type:"Sales", email:"sales@northwind.com"}],
    urls:["https://northwind.com"],
    address:{ streetNo:"12", unit:"3A", streetName:"King", dir:"W", city:"Ottawa", province:"Ontario", postal:"K1A 0B1", country:"Canada" },
    password:"Org@2024!NT"
  },
  {
    id: "1003",
    name: "Contoso Finance",
    phones:[{type:"Phone", num:"(506) 422-8899", ext:""}],
    emails:[{type:"Support", email:"support@contoso.finance"}],
    urls:["https://contoso.finance"],
    address:{ streetNo:"77", unit:"", streetName:"Market", dir:"", city:"Montreal", province:"Quebec", postal:"H1H 2B2", country:"Canada" },
    password:"Org@2024!CF"
  }
];

/* ---------- Utilities ---------- */
function ready(fn){ if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn); else fn(); }
const $ = sel => document.querySelector(sel);
const norm = s => (s||"").toString().trim().toLowerCase();
function qsParam(k){ return new URLSearchParams(location.search).get(k) || ""; }

function getOrgs(){
  try{
    const raw = sessionStorage.getItem(ORGS_STORAGE_KEY);
    if (raw){ return JSON.parse(raw); }
  }catch{}
  // Seed session with defaults
  try{ sessionStorage.setItem(ORGS_STORAGE_KEY, JSON.stringify(ORGS_DB_DEFAULT)); }catch{}
  return JSON.parse(JSON.stringify(ORGS_DB_DEFAULT));
}

function saveOrgs(orgs){
  try{ sessionStorage.setItem(ORGS_STORAGE_KEY, JSON.stringify(orgs)); }catch{}
}

function showToast(msg,type="error",timeout=2200){
  let area = $("#toastAreaRight");
  if (!area){
    area = document.createElement("div");
    area.id = "toastAreaRight";
    area.className = "toast-area right";
    document.body.appendChild(area);
  }
  const t=document.createElement("div");
  t.className=`toast ${type}`;
  t.innerHTML=`<div class="msg">${msg}</div><button class="close" type="button" aria-label="Close">✕</button>`;
  t.querySelector(".close").addEventListener("click",()=>t.remove());
  area.appendChild(t);
  if(timeout>0) setTimeout(()=>t.remove(), timeout);
}

/* ---------- Page boot ---------- */
ready(() => {
  // Navbar status + help
  (function statusBoot(){
    const statusArea = $("#statusArea");
    const statusChip = $("#statusChip");
    const helpBtn    = $("#helpBtn");
    let org="—", lic="—";
    try { org = sessionStorage.getItem("orgid") || "—"; lic = sessionStorage.getItem("license") || "—"; } catch {}
    let statusText = "";
    if (org === "19" && lic === "19") statusText = "New";
    else if (org === "15" && lic === "15") statusText = "INI";
    if (statusText){ statusChip.textContent = statusText; statusArea.hidden = false; }
    helpBtn?.addEventListener("click", () => showToast("Fill Organization Name, then add phone/email/url and address.", "success", 2200));
  })();

  // Provinces
  const addrProv = $("#addrProvince");
  PROVINCES.forEach(p => { const o=document.createElement("option"); o.value=o.textContent=p; addrProv.appendChild(o); });

  // Small formatters
  const addrStreetNo = $("#addrStreetNo");
  const addrUnit     = $("#addrUnit");
  addrStreetNo?.addEventListener("input", ()=> addrStreetNo.value=(addrStreetNo.value||"").replace(/\D/g,"").slice(0,6));
  addrUnit?.addEventListener("input", ()=> addrUnit.value=(addrUnit.value||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,3));

  // Password toggle
  const pwInput=$("#orgPassword"), pwToggle=$("#pwToggle");
  pwToggle?.addEventListener("click",()=>{ const hide=pwInput.type==="password"; pwInput.type = hide?"text":"password"; pwToggle.classList.toggle("eye-off", !hide?true:false); });

  // Repeaters
  document.querySelectorAll(".phone-line").forEach(attachPhoneRowBehavior);
  function formatPhone(v){ const d=(v||"").replace(/\D/g,"").slice(0,10); const a=d.slice(0,3),b=d.slice(3,6),c=d.slice(6,10); if(d.length<=3)return a; if(d.length<=6)return`(${a}) ${b}`; return`(${a}) ${b}-${c}`; }
  function attachPhoneRowBehavior(row){
    const phone=row.querySelector(".phone-input"); const type=row.querySelector(".phone-type"); const ext=row.querySelector(".ext-input"); const extLabel=ext?.closest("label");
    if (phone && !phone.__masked){ phone.addEventListener("input",()=>{ const end=phone.selectionStart===phone.value.length; phone.value=formatPhone(phone.value); if(end) phone.selectionStart=phone.selectionEnd=phone.value.length; }); phone.__masked=true; }
    function toggleExt(){ if(!extLabel) return; const show=(type?.value?.toLowerCase()==="phone"); extLabel.style.display=show?"":"none"; if(!show && ext) ext.value=""; }
    type?.addEventListener("change",toggleExt); toggleExt();
  }
  document.querySelectorAll(".addline-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const list=document.getElementById(btn.dataset.target);
      if(!list) return;
      const type =
        list.classList.contains("phone-list") ? "phone" :
        list.classList.contains("email-list") ? "email" :
        list.classList.contains("url-list")   ? "url"   : null;
      if(!type) return;
      list.appendChild(makeLine(type,false));
    });
  });
  function makeLine(type,root=false){
    const line=document.createElement("div"); line.className=`line ${type}-line`; if(root) line.dataset.root="true";
    if(type==="phone"){ line.innerHTML=`
      <label class="field compact"><span class="meta-title">Type</span><select class="phone-type" required>
        <option value="">Select…</option><option>Phone</option><option>Fax</option><option>Mobile</option></select></label>
      <label class="field grow"><span class="meta-title">Phone Number</span><input class="phone-input" type="tel" placeholder="(506) 452-1342" inputmode="tel" maxlength="18" autocomplete="tel" required/></label>
      <label class="field compact ext-col"><span class="meta-title">Ext</span><input class="ext-input" type="text" placeholder="Ext" inputmode="numeric" maxlength="7"/></label>
      <button type="button" class="icon-btn x-btn remove-line" title="Remove">×</button>`; attachPhoneRowBehavior(line);
    }
    if(type==="email"){ line.innerHTML=`
      <label class="field compact"><span class="meta-title">Type</span><select class="email-type" required>
        <option value="">Select…</option><option>General</option><option>Sales</option><option>Support</option></select></label>
      <label class="field grow"><span class="meta-title">Email</span><input class="email-input" type="email" placeholder="contact@example.com" autocomplete="email" required/></label>
      <button type="button" class="icon-btn x-btn remove-line" title="Remove">×</button>`; }
    if(type==="url"){ line.innerHTML=`
      <label class="field grow"><span class="meta-title">URL</span><input class="url-input" type="url" placeholder="https://example.com" inputmode="url" autocomplete="url" required/></label>
      <button type="button" class="icon-btn x-btn remove-line" title="Remove">×</button>`; }
    if(root){ const rm=line.querySelector(".remove-line"); if(rm) rm.style.display="none"; }
    line.querySelector(".remove-line")?.addEventListener("click",()=>{ if(!line.dataset.root) line.remove(); });
    return line;
  }

  /* Load data for edit / new */
  let orgs = getOrgs();
  const qId   = qsParam("id");
  const qName = qsParam("name");
  const mode  = (qsParam("mode")||"").toLowerCase(); // "edit" or "add"
  const current = findOrg(orgs, qId, qName);

  if (current){
    fillOrg(current);
    $("#orgDelete").hidden = false; // show delete icon in edit
    $("#orgDelete").addEventListener("click", ()=>{
      const ok = confirm(`Delete organization "${current.name}"?`);
      if(!ok) return;
      orgs = orgs.filter(o => o.id !== current.id);
      saveOrgs(orgs);
      showToast("Organization deleted.", "success", 1200);
      setTimeout(()=> location.href="home.html", 1000);
    });
    showToast(`Loaded data for ${current.name}`, "success", 1200);
  }else{
    // for Add mode: give a temporary password
    $("#orgPassword").value = "OrgTemp@123!";
  }

  /* Submit (demo only) */
  $("#orgForm")?.addEventListener("submit",(e)=>{
    e.preventDefault();
    const v = validate();
    if(!v.ok){
      try{ v.el?.scrollIntoView({behavior:"smooth", block:"center"}); v.el?.focus({preventScroll:true}); }catch{}
      showToast(v.msg, "error", 2200);
      return;
    }
    showToast("Success! Saved.", "success", 1200);
    // Persist rudimentary save for the demo:
    const payload = collectOrg();
    if (current){ // update
      const idx = orgs.findIndex(o=>o.id===current.id);
      if (idx>=0) orgs[idx] = {...payload, id: current.id};
    }else{ // add
      const newId = String(Date.now());
      orgs.push({...payload, id: newId});
    }
    saveOrgs(orgs);
    setTimeout(()=> location.href="home.html", 1200);
  });

  /* Validation */
  function validate(){
    if(!$("#orgName").value.trim()) return {ok:false, el:$("#orgName"), msg:"Organization name is required."};
    const pType = $("#orgPhones .phone-line .phone-type");
    const pNum  = $("#orgPhones .phone-line .phone-input");
    const eType = $("#orgEmails .email-line .email-type");
    const eVal  = $("#orgEmails .email-line .email-input");
    const uVal  = $("#orgUrls .url-line .url-input");
    if(!pType.value || !pNum.value.trim()) return {ok:false, el:pNum||pType, msg:"Please enter phone type and number."};
    if(!eType.value || !eVal.value.trim()) return {ok:false, el:eVal||eType, msg:"Please enter email."};
    if(!uVal.value.trim())                 return {ok:false, el:uVal,       msg:"Please enter URL."};
    if(!$("#addrStreetNo").value.trim() || !$("#addrStreetName").value.trim() || !$("#addrCity").value.trim() || !$("#addrProvince").value || !$("#addrPostal").value.trim() || !$("#addrCountry").value.trim())
      return {ok:false, el:$("#addrStreetNo"), msg:"Please complete the address."};
    if(!$("#orgPassword").value.trim()) return {ok:false, el:$("#orgPassword"), msg:"Password is required."};
    return {ok:true};
  }

  /* Collect minimal payload for demo save */
  function collectOrg(){
    const phones=[...document.querySelectorAll("#orgPhones .phone-line")].map(l=>({
      type:l.querySelector(".phone-type")?.value||"",
      num:l.querySelector(".phone-input")?.value||"",
      ext:l.querySelector(".ext-input")?.value||""
    }));
    const emails=[...document.querySelectorAll("#orgEmails .email-line")].map(l=>({
      type:l.querySelector(".email-type")?.value||"",
      email:l.querySelector(".email-input")?.value||""
    }));
    const urls=[...document.querySelectorAll("#orgUrls .url-line")].map(l=>(
      l.querySelector(".url-input")?.value||""
    ));
    return {
      name: $("#orgName").value.trim(),
      phones, emails, urls,
      address:{
        streetNo:$("#addrStreetNo").value.trim(),
        unit:$("#addrUnit").value.trim(),
        streetName:$("#addrStreetName").value.trim(),
        dir:$("#addrDirection").value,
        city:$("#addrCity").value.trim(),
        province:$("#addrProvince").value,
        postal:$("#addrPostal").value.trim(),
        country:$("#addrCountry").value.trim()
      },
      password: $("#orgPassword").value
    };
  }

  /* Find org by id or fuzzy name */
  function findOrg(list, id, name){
    const byId = list.find(o => o.id === id);
    if (byId) return byId;
    if (name){
      const n = norm(name);
      return list.find(o => norm(o.name).includes(n)) || null;
    }
    return null;
  }
});
