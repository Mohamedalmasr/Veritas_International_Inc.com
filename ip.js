/* IP Form – Validation + Toasts (fixed, always bottom-right) */

const PROVINCES = [
  "Alberta","British Columbia","Manitoba","New Brunswick","Newfoundland and Labrador",
  "Nova Scotia","Ontario","Prince Edward Island","Quebec","Saskatchewan"
];

function ready(fn){ if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn); else fn(); }

ready(() => {
  const ipForm   = document.getElementById("ipForm");
  const ipErr    = document.getElementById("ipErr");
  const addrProv = document.getElementById("addrProvince");

  /* === عناصر كانت ناقصة تعريفها قبل كده === */
  const cfgDob = document.getElementById("cfgDob");
  const cfgDod = document.getElementById("cfgDod");
  const cfgSin = document.getElementById("cfgSin");
  const cfgImg = document.getElementById("cfgImg");
  const indDob = document.getElementById("indDob");
  const indDod = document.getElementById("indDod");
  const indSin = document.getElementById("indSin");

  /* ===== Navbar status (New / INI) ===== */
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
    helpBtn?.addEventListener("click", () => showToast("Help", "success", 2200));
  })();

  /* ===== Provinces fill ===== */
  PROVINCES.forEach(p => { const o=document.createElement("option"); o.value=o.textContent=p; addrProv.appendChild(o); });

  /* ===== Formatting helpers ===== */
  const addrStreetNo = document.getElementById("addrStreetNo");
  const addrUnit     = document.getElementById("addrUnit");
  addrStreetNo?.addEventListener("input", ()=> addrStreetNo.value=(addrStreetNo.value||"").replace(/\D/g,"").slice(0,6));
  addrUnit?.addEventListener("input", ()=> addrUnit.value=(addrUnit.value||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,3));

  /* ===== Phone mask + ext toggle ===== */
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
      const type = list.classList.contains("phone-list")?"phone":list.classList.contains("email-list")?"email":"url";
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
        <option value="">Select…</option><option>Office</option><option>Home</option><option>School</option></select></label>
      <label class="field grow"><span class="meta-title">Email</span><input class="email-input" type="email" placeholder="name@example.com" autocomplete="email" required/></label>
      <button type="button" class="icon-btn x-btn remove-line" title="Remove">×</button>`; }
    if(type==="url"){ line.innerHTML=`
      <label class="field grow"><span class="meta-title">URL</span><input class="url-input" type="url" placeholder="https://example.com" inputmode="url" autocomplete="url" required/></label>
      <button type="button" class="icon-btn x-btn remove-line" title="Remove">×</button>`; }
    if(root){ const rm=line.querySelector(".remove-line"); if(rm) rm.style.display="none"; }
    line.querySelector(".remove-line")?.addEventListener("click",()=>{ if(!line.dataset.root) line.remove(); });
    return line;
  }

  /* ===== Flags 0/1/2 ===== */
  const fieldMap = {
    dob:{select:cfgDob,wrap:"fldDob",input:"indDob",badge:"badgeDob"},
    dod:{select:cfgDod,wrap:"fldDod",input:"indDod",badge:"badgeDod"},
    sin:{select:cfgSin,wrap:"fldSin",input:"indSin",badge:"badgeSin"},
    img:{select:cfgImg,wrap:"fldImg",input:"indImg",badge:"badgeImg"},
  };
  function resetUploadUI(){ const el=document.getElementById("imgFileName"); if(el) el.textContent="No file chosen"; }
  function applyConfig(sel,wrapId,inputId,badgeId){
    const wrap=document.getElementById(wrapId), input=document.getElementById(inputId), badge=badgeId?document.getElementById(badgeId):null;
    if(!sel||!wrap||!input) return;
    const v=String(sel.value||"1");
    if(v==="0"){ wrap.style.display="none"; input.required=false; input.setAttribute("aria-required","false"); if(badge) badge.hidden=true; try{ input.value=""; }catch{} if(inputId==="indImg") resetUploadUI(); return; }
    const must=(v==="2"); wrap.style.display=""; input.required=must; input.setAttribute("aria-required", must?"true":"false"); if(badge) badge.hidden=!must;
  }
  Object.values(fieldMap).forEach(({select,wrap,input,badge})=>{ applyConfig(select,wrap,input,badge); select.addEventListener("change",()=>applyConfig(select,wrap,input,badge)); });

  /* ===== Upload UI ===== */
  const imgInput=document.getElementById("indImg"), imgTrigger=document.getElementById("imgTrigger"), imgNameEl=document.getElementById("imgFileName");
  imgTrigger?.addEventListener("click",()=>imgInput?.click());
  imgInput?.addEventListener("change",()=>{ const f=imgInput.files&&imgInput.files[0]; imgNameEl.textContent=f?f.name:"No file chosen"; });

  /* ===== Password toggle ===== */
  const pwInput=document.getElementById("ipPassword"), pwToggle=document.getElementById("pwToggle");
  pwToggle?.addEventListener("click",()=>{ const hidden=pwInput.getAttribute("type")==="password"; pwInput.setAttribute("type", hidden?"text":"password"); pwToggle.classList.toggle("eye-off", !hidden?true:false); pwToggle.setAttribute("aria-label", hidden?"Hide password":"Show password"); });

  /* ===== Toast helpers (يمين تحت دائمًا) ===== */
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
  function showToast(msg,type="error",timeout=2200){
    if(!msg) return;
    const area=getToastArea();
    const t=document.createElement("div");
    t.className=`toast ${type}`;
    t.innerHTML=`<div class="msg">${msg}</div><button class="close" type="button" aria-label="Close">✕</button>`;
    t.querySelector(".close").addEventListener("click",()=>t.remove());
    area.appendChild(t);
    if(timeout>0) setTimeout(()=>t.remove(), timeout);
  }
  window.showToast = showToast; // لو محتاجها برا

  /* ===== Validation ===== */
  function firstEmpty(...ids){ for(const id of ids){ const el=document.getElementById(id); if(el && !String(el.value).trim()) return el; } return null; }
  function validateRepeaters(){
    const phoneNum=document.querySelector("#indPhones .phone-line .phone-input");
    const phoneTyp=document.querySelector("#indPhones .phone-line .phone-type");
    const emailVal=document.querySelector("#indEmails .email-line .email-input");
    const emailTyp=document.querySelector("#indEmails .email-line .email-type");
    const urlVal  =document.querySelector("#indUrls   .url-line   .url-input");
    if(!phoneTyp.value || !phoneNum.value.trim()) return {ok:false, el:phoneNum||phoneTyp, msg:"Please enter phone type and number."};
    if(!emailTyp.value || !emailVal.value.trim()) return {ok:false, el:emailVal||emailTyp, msg:"Please enter an email."};
    if(!urlVal.value.trim())                      return {ok:false, el:urlVal, msg:"Please enter a URL."};
    return {ok:true};
  }
  function validateByFlags(){
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
    if(!addrProv.value) return {ok:false, el:addrProv, msg:"Please choose Province/State."};
    const rep=validateRepeaters(); if(!rep.ok) return rep;
    const fl=validateByFlags();    if(!fl.ok)  return fl;
    if(!pwInput.value.trim()) return {ok:false, el:pwInput, msg:"Password is required."};
    return {ok:true};
  }

  /* ===== Submit ===== */
  ipForm?.addEventListener("submit", (e)=>{
    e.preventDefault();
    ipErr.hidden = true; ipErr.textContent = "";

    const res = validateAll();
    if (!res.ok){
      try{ res.el?.scrollIntoView({behavior:"smooth", block:"center"}); res.el?.focus({preventScroll:true}); }catch{}
      showToast(res.msg, "error", 2800);   // ⬅️ أحمر (يمين تحت)
      return;
    }
    showToast("Success! Saved.", "success", 1200); // ✅ أخضر (يمين تحت)
    setTimeout(()=>{ window.location.href = "home.html"; }, 1200);
  });
});
