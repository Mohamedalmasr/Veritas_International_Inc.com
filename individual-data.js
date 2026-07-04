/* Individual Data – full JS with fake DB, groups chips & roles (single panel) */

const PROVINCES = [
  "Alberta","British Columbia","Manitoba","New Brunswick","Newfoundland and Labrador",
  "Nova Scotia","Ontario","Prince Edward Island","Quebec","Saskatchewan"
];

/* ---------- Fake DB ---------- */
const ALL_GROUPS = ["Finance","HR","IT","Marketing","Sales","Support"];

const PEOPLE_DB = [
  {
    ip:"192.168.1.20",
    title:"Mr", first:"Ahmed", middle:"M.", last:"Kamel",
    dob:"1990-05-12", dod:"", sin:"123456789",
    phones:[{type:"Mobile",num:"(506) 452-1342",ext:""}],
    emails:[{type:"Office",email:"ahmed.kamel@example.com"}],
    urls:["https://linkedin.com/in/ahmedk"],
    address:{ streetNo:"12", unit:"3B", streetName:"Main", dir:"E", city:"Cairo", province:"Ontario", postal:"A1A 1A1", country:"Canada" },
    groups:[ {name:"IT", role:"Leader"}, {name:"Support", role:"Member"} ],
    password:"Vri@2024!ak"
  },
  {
    ip:"172.16.2.5",
    title:"Ms", first:"Mona", middle:"A.", last:"Aly",
    dob:"1994-09-21", dod:"", sin:"987654321",
    phones:[{type:"Phone",num:"(506) 555-0100",ext:"12"}],
    emails:[{type:"Home",email:"mona.aly@example.com"}],
    urls:["https://example.com/mona"],
    address:{ streetNo:"88", unit:"", streetName:"Queen", dir:"", city:"Giza", province:"Quebec", postal:"B2B 2B2", country:"Canada" },
    groups:[ {name:"Finance", role:"Member"}, {name:"HR", role:"Member"} ],
    password:"Vri@2024!ma"
  },
  {
    ip:"10.0.0.22",
    title:"Dr", first:"Ali", middle:"S.", last:"Hassan",
    dob:"1987-01-03", dod:"", sin:"555333111",
    phones:[{type:"Phone",num:"(506) 444-9911",ext:""}],
    emails:[{type:"Office",email:"ali.hassan@example.com"}],
    urls:["https://portfolio.example.com/ali"],
    address:{ streetNo:"45", unit:"7", streetName:"Elm", dir:"W", city:"Alexandria", province:"Ontario", postal:"C3C 3C3", country:"Canada" },
    groups:[ {name:"Marketing", role:"Leader"} ],
    password:"Vri@2024!ah"
  }
];

/* ---------- Helpers ---------- */
function ready(fn){ if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn); else fn(); }
const $ = sel => document.querySelector(sel);
const norm = s => (s||"").toString().trim().toLowerCase();
function getParam(name){ const u=new URLSearchParams(location.search); return u.get(name) || ""; }

function showToast(msg,type="error",timeout=2200){
  let area = document.getElementById("toastAreaRight");
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
  // Navbar status
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
    helpBtn?.addEventListener("click", () => showToast("Need help? Use the chips to add/remove groups and set Leader/Member.", "success", 2200));
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
  const pwInput=$("#ipPassword"), pwToggle=$("#pwToggle");
  pwToggle?.addEventListener("click",()=>{ const hide=pwInput.type==="password"; pwInput.type = hide?"text":"password"; pwToggle.classList.toggle("eye-off", !hide?true:false); });

  // Upload control
  const imgInput=$("#indImg"), imgTrigger=$("#imgTrigger"), imgNameEl=$("#imgFileName");
  imgTrigger?.addEventListener("click",()=>imgInput?.click());
  imgInput?.addEventListener("change",()=>{ const f=imgInput.files&&imgInput.files[0]; imgNameEl.textContent=f?f.name:"No file chosen"; });

  // Repeaters (+ buttons still available for phone/email/url only)
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
        list.classList.contains("url-list")   ? "url"   :
        list.classList.contains("group-list") ? "group" : null; // not used now, but kept for parity
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
        <option value="">Select…</option><option>Office</option><option>Home</option><option>School</option></select></label>
      <label class="field grow"><span class="meta-title">Email</span><input class="email-input" type="email" placeholder="name@example.com" autocomplete="email" required/></label>
      <button type="button" class="icon-btn x-btn remove-line" title="Remove">×</button>`; }
    if(type==="url"){ line.innerHTML=`
      <label class="field grow"><span class="meta-title">URL</span><input class="url-input" type="url" placeholder="https://example.com" inputmode="url" autocomplete="url" required/></label>
      <button type="button" class="icon-btn x-btn remove-line" title="Remove">×</button>`; }
    if(type==="group"){ line.innerHTML=`
      <label class="field grow"><span class="meta-title">Group</span><input class="group-input" type="text" placeholder="e.g., Finance" required/></label>
      <button type="button" class="icon-btn x-btn remove-line" title="Remove">×</button>`; }
    if(root){ const rm=line.querySelector(".remove-line"); if(rm) rm.style.display="none"; }
    line.querySelector(".remove-line")?.addEventListener("click",()=>{ if(!line.dataset.root) line.remove(); });
    return line;
  }

  // Flags 0/1/2
  const cfgDob=$("#cfgDob"), cfgDod=$("#cfgDod"), cfgSin=$("#cfgSin"), cfgImg=$("#cfgImg");
  const fieldMap = {
    dob:{select:cfgDob,wrap:"fldDob",input:"indDob",badge:"badgeDob"},
    dod:{select:cfgDod,wrap:"fldDod",input:"indDod",badge:"badgeDod"},
    sin:{select:cfgSin,wrap:"fldSin",input:"indSin",badge:"badgeSin"},
    img:{select:cfgImg,wrap:"fldImg",input:"indImg",badge:"badgeImg"},
  };
  function resetUploadUI(){ const el=$("#imgFileName"); if(el) el.textContent="No file chosen"; }
  function applyConfig(sel,wrapId,inputId,badgeId){
    const wrap=document.getElementById(wrapId), input=document.getElementById(inputId), badge=badgeId?document.getElementById(badgeId):null;
    if(!sel||!wrap||!input) return;
    const v=String(sel.value||"1");
    if(v==="0"){ wrap.style.display="none"; input.required=false; input.setAttribute("aria-required","false"); if(badge) badge.hidden=true; try{ input.value=""; }catch{} if(inputId==="indImg") resetUploadUI(); return; }
    const must=(v==="2"); wrap.style.display=""; input.required=must; input.setAttribute("aria-required", must?"true":"false"); if(badge) badge.hidden=!must;
  }
  Object.values(fieldMap).forEach(({select,wrap,input,badge})=>{ applyConfig(select,wrap,input,badge); select.addEventListener("change",()=>applyConfig(select,wrap,input,badge)); });

  /* ---------- GROUPS (single panel using #groupsOwn / #groupsAvail) ---------- */
  function setMemberGroups(memberList){
    const members = (memberList||[]).map(g => typeof g==="string" ? ({name:g, role:"Member"}) : g);
    renderMemberChips(members);
    renderAvailableChips(members);
  }
  function renderMemberChips(members){
    const holder = document.getElementById("groupsOwn");
    holder.innerHTML = members.map(g => chipMemberHTML(g.name, g.role)).join("");
    holder.querySelectorAll(".chip").forEach(chip=>{
      const name = chip.dataset.name;
      chip.querySelector(".chip-x")?.addEventListener("click", ()=>{
        const next = members.filter(m => m.name !== name);
        renderMemberChips(next);
        renderAvailableChips(next);
      });
      chip.querySelector(".chip-role")?.addEventListener("change",(e)=>{
        const role = e.target.value;
        const next = members.map(m => m.name===name ? {...m, role} : m);
        renderMemberChips(next);
        renderAvailableChips(next);
      });
    });
  }
  function renderAvailableChips(currentMembers){
    const holder = document.getElementById("groupsAvail");
    const currentNames = new Set(currentMembers.map(m=>m.name));
    const avail = ALL_GROUPS.filter(g => !currentNames.has(g));
    holder.innerHTML = avail.map(name => chipAddHTML(name)).join("");
    holder.querySelectorAll(".chip--add").forEach(ch=>{
      const name = ch.dataset.name;
      ch.addEventListener("click", ()=>{
        const next = [...currentMembers, {name, role:"Member"}];
        renderMemberChips(next);
        renderAvailableChips(next);
      });
    });
  }
  function chipMemberHTML(name, role){
    return `
      <div class="chip" data-name="${name}">
        <span>${name}</span>
        <select class="chip-role" aria-label="Role for ${name}">
          <option ${role==="Member"?"selected":""}>Member</option>
          <option ${role==="Leader"?"selected":""}>Leader</option>
        </select>
        <button type="button" class="chip-x" aria-label="Remove ${name}">×</button>
      </div>
    `;
  }
  function chipAddHTML(name){
    return `<button type="button" class="chip chip--add" data-name="${name}" aria-label="Add ${name}">${name}</button>`;
  }

  // Load person (edit) if params provided; else prepare for add
  const paramIP = getParam("id");
  const paramFirst = getParam("first");
  const paramLast = getParam("last");
  const person = findPerson(paramIP, paramFirst, paramLast);

  if (person){
    fillPerson(person);
    showToast(`Loaded data for ${person.first} ${person.last}`, "success", 1400);
  }else{
    $("#ipPassword").value = "Temp@123!"; // default dummy password for new record
    setMemberGroups([]);                  // no groups yet
  }

  // Basic submit (demo)
  $("#ipForm")?.addEventListener("submit",(e)=>{
    e.preventDefault();
    showToast("Success! Saved.", "success", 1200);
    setTimeout(()=> location.href="home.html", 1200);
  });

  /* ---------- Fill / Find ---------- */
  function findPerson(ip, first, last){
    const byIp = PEOPLE_DB.find(p => p.ip === ip);
    if (byIp) return byIp;
    if (first || last){
      const f = norm(first), l = norm(last);
      return PEOPLE_DB.find(p =>
        (!f || norm(p.first).includes(f)) &&
        (!l || norm(p.last).includes(l))
      ) || null;
    }
    return null;
  }

  function fillPerson(p){
    $("#indTitle").value = p.title || "";
    $("#indFirst").value = p.first || "";
    $("#indMiddle").value = p.middle || "";
    $("#indLast").value = p.last || "";

    $("#indDob").value = p.dob || "";
    $("#indDod").value = p.dod || "";
    $("#indSin").value = p.sin || "";

    const phoneRoot = $("#indPhones"); phoneRoot.innerHTML="";
    (p.phones||[]).forEach((ph,i)=>{ const row=makeLine("phone",i===0); row.querySelector(".phone-type").value=ph.type||""; row.querySelector(".phone-input").value=ph.num||""; row.querySelector(".ext-input").value=ph.ext||""; phoneRoot.appendChild(row); });

    const emailRoot = $("#indEmails"); emailRoot.innerHTML="";
    (p.emails||[]).forEach((em,i)=>{ const row=makeLine("email",i===0); row.querySelector(".email-type").value=em.type||""; row.querySelector(".email-input").value=em.email||""; emailRoot.appendChild(row); });

    const urlRoot = $("#indUrls"); urlRoot.innerHTML="";
    (p.urls||[]).forEach((u,i)=>{ const row=makeLine("url",i===0); row.querySelector(".url-input").value=u||""; urlRoot.appendChild(row); });

    $("#addrStreetNo").value = p.address?.streetNo || "";
    $("#addrUnit").value = p.address?.unit || "";
    $("#addrStreetName").value = p.address?.streetName || "";
    $("#addrDirection").value = p.address?.dir || "";
    $("#addrCity").value = p.address?.city || "";
    $("#addrProvince").value = p.address?.province || "";
    $("#addrPostal").value = p.address?.postal || "";
    $("#addrCountry").value = p.address?.country || "";

    $("#ipPassword").value = p.password || "Temp@123!";
    setMemberGroups(p.groups || []);
  }
});
