const PAYMENT_API="https://the-poster-wala-payment-api.theposterwala18.workers.dev";
const statusBox=document.getElementById("dashboardStatus");
const content=document.getElementById("dashboardContent");
const refreshButton=document.getElementById("refreshDashboard");
const saveSettingsButton=document.getElementById("saveOwnerSettings");
let ownerConfig={modules:[],plans:[]};

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

function planRow(item){return `<div class="editable-row plan-row" data-id="${Number(item.id)}">
  <label><span>Plan Name</span><input data-key="display_name" value="${escapeHtml(item.display_name)}"></label>
  <label><span>Price ₹</span><input data-key="price" type="number" min="1" value="${paiseToRupees(item.price_paise)}"></label>
  <label><span>Offer ₹</span><input data-key="offer" type="number" min="1" value="${item.offer_price_paise==null?"":paiseToRupees(item.offer_price_paise)}"></label>
  <label><span>Days</span><input data-key="duration_days" type="number" min="1" value="${Number(item.duration_days)}"></label>
  <label><span>Limit (blank = unlimited)</span><input data-key="download_limit" type="number" min="1" value="${item.download_limit??""}"></label>
  <label class="mini-check"><span>Enabled</span><input data-key="is_enabled" type="checkbox" ${checked(item.is_enabled)}></label>
  <label class="mini-check"><span>Premium Included</span><input data-key="includes_premium" type="checkbox" ${checked(item.includes_premium)}></label>
  </div>`;}

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
  document.getElementById("moduleSettings").innerHTML=(data.modules||[]).map(moduleRow).join("")||'<p class="muted">Add the first module setting.</p>';
  document.getElementById("planSettings").innerHTML=(data.plans||[]).map(planRow).join("");
}

async function loadOwnerConfig(token){
  const response=await fetch(PAYMENT_API+"/owner/config",{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:"{}"});
  const data=await response.json().catch(()=>null);
  if(!response.ok||!data?.success)throw new Error(data?.error||"Owner settings load ਨਹੀਂ ਹੋਈਆਂ।");
  renderOwnerConfig(data);
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
    document.getElementById("downloadCount").textContent=`${data.downloads.length} records`;

    document.getElementById("paymentsBody").innerHTML=data.payments.length?data.payments.map(row=>`<tr><td>${escapeHtml(dateTime(row.created_at))}</td><td>${userLabel(row)}</td><td>${escapeHtml(row.module_id||"—")}</td><td>${money(row.amount_paise)}</td><td><span class="status-pill ${row.status==="created"?"created":""}">${escapeHtml(row.status)}</span></td><td>${Number(row.download_count||0)}</td><td class="muted">${escapeHtml(row.payment_id||row.order_id||"—")}</td></tr>`).join(""):'<tr><td colspan="7" class="muted">No payment records</td></tr>';
    document.getElementById("downloadsBody").innerHTML=data.downloads.length?data.downloads.map(row=>`<tr><td>${escapeHtml(dateTime(row.created_at))}</td><td>${userLabel(row)}</td><td>${escapeHtml(row.module_id)}</td><td>${escapeHtml(row.file_type)}</td></tr>`).join(""):'<tr><td colspan="4" class="muted">No download records</td></tr>';
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
function readPlans(){return [...document.querySelectorAll(".plan-row")].map((row,index)=>({
  id:Number(row.dataset.id),display_name:row.querySelector('[data-key="display_name"]').value.trim(),price_paise:rupeesToPaise(row.querySelector('[data-key="price"]').value),
  offer_price_paise:row.querySelector('[data-key="offer"]').value===""?null:rupeesToPaise(row.querySelector('[data-key="offer"]').value),duration_days:Number(row.querySelector('[data-key="duration_days"]').value),
  download_limit:row.querySelector('[data-key="download_limit"]').value===""?null:Number(row.querySelector('[data-key="download_limit"]').value),is_enabled:row.querySelector('[data-key="is_enabled"]').checked,
  includes_premium:row.querySelector('[data-key="includes_premium"]').checked,included_modules:"*",sort_order:(index+1)*10
}));}

async function saveOwnerSettings(){
  const message=document.getElementById("settingsMessage");saveSettingsButton.disabled=true;message.textContent="Settings save ਹੋ ਰਹੀਆਂ ਹਨ…";message.className="settings-message";
  try{const token=await window.ThePosterWalaAuth.getIdToken();const body={settings:{all_modules_free:document.getElementById("allModulesFree").checked?1:0,daily_free_enabled:document.getElementById("dailyFreeEnabled").checked?1:0,daily_free_limit:Number(document.getElementById("dailyFreeLimit").value),default_price_paise:rupeesToPaise(document.getElementById("defaultPrice").value),premium_price_paise:rupeesToPaise(document.getElementById("premiumPrice").value),unlock_minutes:Number(document.getElementById("unlockMinutes").value),paid_download_limit:Number(document.getElementById("paidDownloadLimit").value)},modules:readModules(),plans:readPlans()};
    const response=await fetch(PAYMENT_API+"/owner/config/save",{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify(body)});const data=await response.json().catch(()=>null);if(!response.ok||!data?.success)throw new Error(data?.error||"Settings save ਨਹੀਂ ਹੋਈਆਂ।");message.textContent=`✓ ${data.saved} settings safely saved`;message.className="settings-message success";await loadOwnerConfig(token);
  }catch(error){message.textContent=error.message||"Settings save ਨਹੀਂ ਹੋਈਆਂ।";message.className="settings-message error";}finally{saveSettingsButton.disabled=false;}
}

refreshButton.addEventListener("click",loadDashboard);
saveSettingsButton.addEventListener("click",saveOwnerSettings);
document.getElementById("addModuleRow").addEventListener("click",()=>{const holder=document.getElementById("moduleSettings");holder.querySelector(".muted")?.remove();holder.insertAdjacentHTML("beforeend",moduleRow());});
window.addEventListener("tpw-auth-changed",()=>setTimeout(loadDashboard,0));
setTimeout(loadDashboard,0);
