const PAYMENT_API="https://the-poster-wala-payment-api.theposterwala18.workers.dev";
const statusBox=document.getElementById("dashboardStatus");
const content=document.getElementById("dashboardContent");
const refreshButton=document.getElementById("refreshDashboard");
const saveSettingsButton=document.getElementById("saveOwnerSettings");
let ownerConfig={modules:[],plans:[]};
let dashboardDownloads=[];
const LEGACY_MODULE_IDS=new Set(["car-sale","dog-sale","akhand-path","invitation"]);
const PROMO_DRAFT_KEY="tpw_owner_promo_draft_v573";
let saveToastTimer=null;
function showSaveToast(message,type="saving"){
  const box=document.getElementById("ownerSaveToast");if(!box)return;
  box.hidden=false;box.textContent=message;box.className="owner-save-toast "+type;
  clearTimeout(saveToastTimer);
  if(type!=="saving")saveToastTimer=setTimeout(()=>{box.hidden=true},5000);
}
const DEFAULT_PROMOS=[
  {title:"TripKhata",description:"Trip expenses, Shared Trip, Customer Khata & Suppliers",url:"https://theposterwala18-bot.github.io/TripKhata/",icon:"🧳",enabled:true,order:10},
  {title:"Zameen Di Minnti",description:"Land measurement & calculation app — coming soon",url:"",icon:"📐",enabled:true,order:20}
];

function escapeHtml(value){return String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);}
function money(paise){return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(paise||0)/100);}
function dateTime(value){if(!value)return"—";const normalized=/Z|[+-]\d\d:?\d\d$/.test(value)?value:value.replace(" ","T")+"Z";const date=new Date(normalized);return Number.isNaN(date.getTime())?value:date.toLocaleString("en-IN");}
function userLabel(row){return escapeHtml(row.display_name||row.email||row.uid||"Unknown user");}
const rupeesToPaise=value=>Math.round(Number(value||0)*100);
const paiseToRupees=value=>Number(value||0)/100;
const checked=value=>Number(value)===1?"checked":"";

function moduleRow(item={module_id:"",display_name:"",is_enabled:1,is_free:0,price_paise:2900,offer_price_paise:null,is_premium:0}){
  return `<div class="editable-row module-row" data-id="${escapeHtml(item.module_id)}">
    <label><span>Module ID</span><input data-key="module_id" value="${escapeHtml(item.module_id)}" ${item.module_id?"readonly":""}></label>
    <label><span>Display Name</span><input data-key="display_name" value="${escapeHtml(item.display_name)}"></label>
    <label><span>Price ₹</span><input data-key="price" type="number" min="1" value="${paiseToRupees(item.price_paise)}"></label>
    <label><span>Offer ₹</span><input data-key="offer" type="number" min="1" value="${item.offer_price_paise==null?"":paiseToRupees(item.offer_price_paise)}"></label>
    <label class="mini-check"><span>Enabled</span><input data-key="is_enabled" type="checkbox" ${checked(item.is_enabled)}></label>
    <label class="mini-check"><span>Free</span><input data-key="is_free" type="checkbox" ${checked(item.is_free)}></label>
    <label class="mini-check"><span>Premium</span><input data-key="is_premium" type="checkbox" ${checked(item.is_premium)}></label>
  </div>`;
}

function promoRow(item={title:"",description:"",url:"",icon:"🔗",enabled:true,order:10}){
  return `<div class="editable-row promo-row">
    <label><span>Icon</span><input data-key="icon" maxlength="8" value="${escapeHtml(item.icon||"🔗")}"></label>
    <label><span>Title</span><input data-key="title" maxlength="60" value="${escapeHtml(item.title||"")}"></label>
    <label class="promo-description"><span>Short Description</span><input data-key="description" maxlength="180" value="${escapeHtml(item.description||"")}"></label>
    <label class="promo-url"><span>App / Website Link</span><input data-key="url" type="url" placeholder="https://..." value="${escapeHtml(item.url||"")}"></label>
    <label><span>Order</span><input data-key="order" type="number" value="${Number(item.order||10)}"></label>
    <label class="mini-check"><span>Enabled</span><input data-key="enabled" type="checkbox" ${item.enabled!==false?"checked":""}></label>
    <button type="button" class="secondary-action promo-remove">Remove</button>
  </div>`;
}
function planRow(item){return `<div class="editable-row plan-row" data-id="${Number(item.id)}">
  <label><span>Plan Name</span><input data-key="display_name" value="${escapeHtml(item.display_name)}"></label>
  <label><span>Price ₹</span><input data-key="price" type="number" min="1" value="${paiseToRupees(item.price_paise)}"></label>
  <label><span>Offer ₹</span><input data-key="offer" type="number" min="1" value="${item.offer_price_paise==null?"":paiseToRupees(item.offer_price_paise)}"></label>
  <label><span>Days</span><input data-key="duration_days" type="number" min="1" value="${Number(item.duration_days)}"></label>
  <label><span>Limit (blank = unlimited)</span><input data-key="download_limit" type="number" min="1" value="${item.download_limit??""}"></label>
  <label class="mini-check"><span>Enabled</span><input data-key="is_enabled" type="checkbox" ${checked(item.is_enabled)}></label>
  <label class="mini-check"><span>Premium Included</span><input data-key="includes_premium" type="checkbox" ${checked(item.includes_premium)}></label>
  </div>`;}

function parsePromos(raw){
  try{
    const parsed=typeof raw==="string"?JSON.parse(raw):raw;
    if(Array.isArray(parsed)&&parsed.length){localStorage.removeItem(PROMO_DRAFT_KEY);return parsed;}
  }catch(_){}
  try{
    const draft=JSON.parse(localStorage.getItem(PROMO_DRAFT_KEY)||"null");
    if(Array.isArray(draft)&&draft.length)return draft;
  }catch(_){}
  return DEFAULT_PROMOS;
}
function bindPromoRemove(){
  document.querySelectorAll(".promo-remove").forEach(btn=>btn.onclick=()=>btn.closest(".promo-row")?.remove());
}
function renderOwnerConfig(data){
  ownerConfig=data;
  const s=data.settings||{};
  document.getElementById("paymentModeBadge").textContent=`Razorpay ${String(data.mode||"test").toUpperCase()} MODE`;
  document.getElementById("allModulesFree").checked=s.all_modules_free==="1";
  document.getElementById("dailyFreeEnabled").checked=s.daily_free_enabled!=="0";
  document.getElementById("dailyFreeLimit").value=s.daily_free_limit??1;
  document.getElementById("defaultPrice").value=paiseToRupees(s.default_price_paise??2900);
  document.getElementById("premiumPrice").value=paiseToRupees(s.premium_price_paise??4900);
  document.getElementById("unlockMinutes").value=s.unlock_minutes??30;
  document.getElementById("paidDownloadLimit").value=s.paid_download_limit??5;
  document.getElementById("promoSettings").innerHTML=parsePromos(s.promo_cards_json).map(promoRow).join("");
  bindPromoRemove();
  document.getElementById("moduleSettings").innerHTML=(data.modules||[]).filter(item=>!LEGACY_MODULE_IDS.has(item.module_id)).map(moduleRow).join("")||'<p class="muted">Add the first module setting.</p>';
  document.getElementById("planSettings").innerHTML=(data.plans||[]).map(planRow).join("");
}

async function loadOwnerConfig(token){
  const response=await fetch(PAYMENT_API+"/owner/config",{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:"{}"});
  const data=await response.json().catch(()=>null);
  if(!response.ok||!data?.success)throw new Error(data?.error||"Owner settings load ਨਹੀਂ ਹੋਈਆਂ।");
  renderOwnerConfig(data);
}

function parseRowDate(value){
  if(!value)return null;
  const normalized=/Z|[+-]\d\d:?\d\d$/.test(value)?value:value.replace(" ","T")+"Z";
  const d=new Date(normalized);return Number.isNaN(d.getTime())?null:d;
}
function renderDownloads(){
  const period=document.getElementById("downloadPeriod")?.value||"week";
  const q=(document.getElementById("downloadSearch")?.value||"").trim().toLowerCase();
  const fromInput=document.getElementById("downloadFrom"),toInput=document.getElementById("downloadTo");
  const custom=period==="custom";
  if(fromInput)fromInput.hidden=!custom;if(toInput)toInput.hidden=!custom;
  const now=new Date(),startOfToday=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  let from=null,to=null;
  if(period==="week"){from=new Date(startOfToday);from.setDate(from.getDate()-6);to=new Date(startOfToday);to.setHours(23,59,59,999);}
  else if(period==="month"){from=new Date(now.getFullYear(),now.getMonth(),1);to=new Date(now.getFullYear(),now.getMonth()+1,0,23,59,59,999);}
  else if(period==="year"){from=new Date(now.getFullYear(),0,1);to=new Date(now.getFullYear(),11,31,23,59,59,999);}
  else if(period==="custom"){
    if(fromInput?.value)from=new Date(fromInput.value+"T00:00:00");
    if(toInput?.value)to=new Date(toInput.value+"T23:59:59");
  }
  const rows=dashboardDownloads.filter(row=>{
    const d=parseRowDate(row.created_at);
    if(from&&(!d||d<from))return false;if(to&&(!d||d>to))return false;
    if(q){
      const hay=[row.display_name,row.email,row.uid,row.module_id,row.file_type].map(v=>String(v||"").toLowerCase()).join(" ");
      if(!hay.includes(q))return false;
    }
    return true;
  });
  const body=document.getElementById("downloadsBody");
  if(body)body.innerHTML=rows.length?rows.map(row=>`<tr><td>${escapeHtml(dateTime(row.created_at))}</td><td>${userLabel(row)}</td><td>${escapeHtml(row.module_id)}</td><td>${escapeHtml(row.file_type)}</td></tr>`).join(""):'<tr><td colspan="4" class="muted">No downloads in selected period</td></tr>';
  const count=document.getElementById("downloadCount");if(count)count.textContent=`${rows.length} of ${dashboardDownloads.length} records`;
}
async function loadDashboard(){
  refreshButton.disabled=true;
  statusBox.hidden=false;
  statusBox.classList.remove("is-error");
  statusBox.textContent="Secure owner data load ਹੋ ਰਿਹਾ ਹੈ…";
  content.hidden=true;
  try{
    const authApi=window.ThePosterWalaAuth;
    if(!authApi)throw new Error("Login service is not ready");
    const user=authApi.getCurrentUser()||await authApi.ready;
    if(!user)throw new Error("ਪਹਿਲਾਂ owner Google account ਨਾਲ Login ਕਰੋ।");
    const token=await authApi.getIdToken();
    const response=await fetch(PAYMENT_API+"/owner/dashboard",{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:"{}"});
    const data=await response.json().catch(()=>null);
    if(!response.ok||!data?.success)throw new Error(response.status===403?"ਇਸ Google account ਨੂੰ Owner access ਨਹੀਂ ਹੈ।":data?.error||"Dashboard data load ਨਹੀਂ ਹੋਇਆ।");

    document.getElementById("totalUsers").textContent=data.summary.total_users||0;
    document.getElementById("capturedPayments").textContent=data.summary.captured_payments||0;
    document.getElementById("capturedAmount").textContent=money(data.summary.captured_amount_paise);
    document.getElementById("totalDownloads").textContent=data.summary.total_downloads||0;
    document.getElementById("paymentCount").textContent=`${data.payments.length} records`;
    dashboardDownloads=data.downloads||[];
    document.getElementById("downloadCount").textContent=`${dashboardDownloads.length} records`;

    document.getElementById("paymentsBody").innerHTML=data.payments.length?data.payments.map(row=>`<tr><td>${escapeHtml(dateTime(row.created_at))}</td><td>${userLabel(row)}</td><td>${escapeHtml(row.module_id||"—")}</td><td>${money(row.amount_paise)}</td><td><span class="status-pill ${row.status==="created"?"created":""}">${escapeHtml(row.status)}</span></td><td>${Number(row.download_count||0)}</td><td class="muted">${escapeHtml(row.payment_id||row.order_id||"—")}</td></tr>`).join(""):'<tr><td colspan="7" class="muted">No payment records</td></tr>';
    renderDownloads();
    statusBox.hidden=true;
    content.hidden=false;
    await loadOwnerConfig(token);
  }catch(error){statusBox.textContent=error.message||"Dashboard load ਨਹੀਂ ਹੋਇਆ।";statusBox.classList.add("is-error");}
  finally{refreshButton.disabled=false;}
}

function readModules(){return [...document.querySelectorAll(".module-row")].map(row=>({
  module_id:row.querySelector('[data-key="module_id"]').value.trim(),display_name:row.querySelector('[data-key="display_name"]').value.trim(),
  price_paise:rupeesToPaise(row.querySelector('[data-key="price"]').value),offer_price_paise:row.querySelector('[data-key="offer"]').value===""?null:rupeesToPaise(row.querySelector('[data-key="offer"]').value),
  is_enabled:row.querySelector('[data-key="is_enabled"]').checked,is_free:row.querySelector('[data-key="is_free"]').checked,is_premium:row.querySelector('[data-key="is_premium"]').checked
}));}
function readPromos(){return [...document.querySelectorAll(".promo-row")].map((row,index)=>({
  title:row.querySelector('[data-key="title"]').value.trim(),
  description:row.querySelector('[data-key="description"]').value.trim(),
  url:row.querySelector('[data-key="url"]').value.trim(),
  icon:row.querySelector('[data-key="icon"]').value.trim()||"🔗",
  enabled:row.querySelector('[data-key="enabled"]').checked,
  order:Number(row.querySelector('[data-key="order"]').value)||((index+1)*10)
})).filter(p=>p.title);}
function readPlans(){return [...document.querySelectorAll(".plan-row")].map((row,index)=>({
  id:Number(row.dataset.id),display_name:row.querySelector('[data-key="display_name"]').value.trim(),price_paise:rupeesToPaise(row.querySelector('[data-key="price"]').value),
  offer_price_paise:row.querySelector('[data-key="offer"]').value===""?null:rupeesToPaise(row.querySelector('[data-key="offer"]').value),duration_days:Number(row.querySelector('[data-key="duration_days"]').value),
  download_limit:row.querySelector('[data-key="download_limit"]').value===""?null:Number(row.querySelector('[data-key="download_limit"]').value),is_enabled:row.querySelector('[data-key="is_enabled"]').checked,
  includes_premium:row.querySelector('[data-key="includes_premium"]').checked,included_modules:"*",sort_order:(index+1)*10
}));}

async function saveOwnerSettings(){
  const message=document.getElementById("settingsMessage");
  const promos=readPromos();
  localStorage.setItem(PROMO_DRAFT_KEY,JSON.stringify(promos));
  saveSettingsButton.disabled=true;
  message.textContent="Settings save ਹੋ ਰਹੀਆਂ ਹਨ…";message.className="settings-message";
  showSaveToast("Saving settings…","saving");
  try{
    const token=await window.ThePosterWalaAuth.getIdToken();
    const body={settings:{
      all_modules_free:document.getElementById("allModulesFree").checked?1:0,
      daily_free_enabled:document.getElementById("dailyFreeEnabled").checked?1:0,
      daily_free_limit:Number(document.getElementById("dailyFreeLimit").value),
      default_price_paise:rupeesToPaise(document.getElementById("defaultPrice").value),
      premium_price_paise:rupeesToPaise(document.getElementById("premiumPrice").value),
      unlock_minutes:Number(document.getElementById("unlockMinutes").value),
      paid_download_limit:Number(document.getElementById("paidDownloadLimit").value),
      promo_cards_json:JSON.stringify(promos)
    },modules:readModules(),plans:readPlans()};
    const response=await fetch(PAYMENT_API+"/owner/config/save",{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify(body)});
    const data=await response.json().catch(()=>null);
    if(!response.ok||!data?.success)throw new Error(data?.error||"Settings save ਨਹੀਂ ਹੋਈਆਂ।");

    const verifyResponse=await fetch(PAYMENT_API+"/owner/config",{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:"{}"});
    const verify=await verifyResponse.json().catch(()=>null);
    const serverPromoRaw=verify?.settings?.promo_cards_json;
    let promoSaved=false;
    try{
      const serverPromos=typeof serverPromoRaw==="string"?JSON.parse(serverPromoRaw):serverPromoRaw;
      promoSaved=Array.isArray(serverPromos)&&JSON.stringify(serverPromos)===JSON.stringify(promos);
    }catch(_){}

    if(!promoSaved){
      message.textContent="Main settings saved, ਪਰ Homepage Promotions server ਤੇ save ਨਹੀਂ ਹੋਏ। Promotion draft ਇਸ browser ਵਿੱਚ safe ਹੈ.";
      message.className="settings-message error";
      showSaveToast("⚠ Promotions not saved to server — backend update required","error");
      return;
    }

    localStorage.removeItem(PROMO_DRAFT_KEY);
    message.textContent=`✓ ${data.saved} settings safely saved`;
    message.className="settings-message success";
    showSaveToast("✓ All settings saved successfully","success");
    await loadOwnerConfig(token);
  }catch(error){
    message.textContent=error.message||"Settings save ਨਹੀਂ ਹੋਈਆਂ।";message.className="settings-message error";
    showSaveToast("✕ Save failed: "+(error.message||"Unknown error"),"error");
  }finally{saveSettingsButton.disabled=false;}
}

refreshButton.addEventListener("click",loadDashboard);
saveSettingsButton.addEventListener("click",saveOwnerSettings);
document.getElementById("addPromoRow")?.addEventListener("click",()=>{const holder=document.getElementById("promoSettings");holder.insertAdjacentHTML("beforeend",promoRow({order:(holder.querySelectorAll(".promo-row").length+1)*10}));bindPromoRemove();});
document.getElementById("addModuleRow").addEventListener("click",()=>{const holder=document.getElementById("moduleSettings");holder.querySelector(".muted")?.remove();holder.insertAdjacentHTML("beforeend",moduleRow());});
document.getElementById("downloadPeriod")?.addEventListener("change",renderDownloads);
document.getElementById("downloadSearch")?.addEventListener("input",renderDownloads);
document.getElementById("downloadFrom")?.addEventListener("change",renderDownloads);
document.getElementById("downloadTo")?.addEventListener("change",renderDownloads);
window.addEventListener("tpw-auth-changed",()=>setTimeout(loadDashboard,0));
setTimeout(loadDashboard,0);
