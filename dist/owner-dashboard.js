const PAYMENT_API="https://the-poster-wala-payment-api.theposterwala18.workers.dev";
const statusBox=document.getElementById("dashboardStatus");
const content=document.getElementById("dashboardContent");
const refreshButton=document.getElementById("refreshDashboard");

function escapeHtml(value){return String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);}
function money(paise){return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(paise||0)/100);}
function dateTime(value){if(!value)return"—";const normalized=/Z|[+-]\d\d:?\d\d$/.test(value)?value:value.replace(" ","T")+"Z";const date=new Date(normalized);return Number.isNaN(date.getTime())?value:date.toLocaleString("en-IN");}
function userLabel(row){return escapeHtml(row.display_name||row.email||row.uid||"Unknown user");}

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
  }catch(error){statusBox.textContent=error.message||"Dashboard load ਨਹੀਂ ਹੋਇਆ।";statusBox.classList.add("is-error");}
  finally{refreshButton.disabled=false;}
}

refreshButton.addEventListener("click",loadDashboard);
window.addEventListener("tpw-auth-changed",()=>setTimeout(loadDashboard,0));
setTimeout(loadDashboard,0);
