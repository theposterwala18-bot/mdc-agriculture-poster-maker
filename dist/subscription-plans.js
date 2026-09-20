const API="https://the-poster-wala-payment-api.theposterwala18.workers.dev";
const modal=document.getElementById("plansModal");
const list=document.getElementById("plansList");
const status=document.getElementById("plansStatus");
const money=paise=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(paise)/100);
const homeFreeMessage=document.getElementById("homeFreeMessage");
const homePlanOffer=document.getElementById("homePlanOffer");
const freeMessages=[
  "Create & download 1 poster PNG FREE every day.",
  "ਹਰ ਰੋਜ਼ 1 ਪੋਸਟਰ PNG ਮੁਫ਼ਤ ਬਣਾਓ ਅਤੇ ਡਾਊਨਲੋਡ ਕਰੋ।",
  "हर दिन 1 पोस्टर PNG मुफ़्त बनाएं और डाउनलोड करें।"
];
let publicConfigPromise;
let freeMessageIndex=0;
let planOfferIndex=0;

function checkoutScript(){return new Promise((resolve,reject)=>{if(window.Razorpay)return resolve();const script=document.createElement("script");script.src="https://checkout.razorpay.com/v1/checkout.js";script.onload=resolve;script.onerror=()=>reject(new Error("Payment window load ਨਹੀਂ ਹੋਈ"));document.head.append(script);});}
function activeAmount(plan){const offer=plan.offer_price_paise!=null&&(!plan.offer_ends_at||new Date(plan.offer_ends_at)>new Date());return Number(offer?plan.offer_price_paise:plan.price_paise);}
async function api(path,body,auth=false){const headers={"Content-Type":"application/json"};if(auth){const token=await window.ThePosterWalaAuth?.getIdToken();if(!token)throw new Error("ਪਹਿਲਾਂ Google Login ਕਰੋ।");headers.Authorization="Bearer "+token;}const response=await fetch(API+path,{method:"POST",headers,body:JSON.stringify(body||{})});const data=await response.json().catch(()=>null);if(!response.ok||!data?.success)throw new Error(data?.error||"Request complete ਨਹੀਂ ਹੋਈ");return data;}
function loadPublicConfig(){if(!publicConfigPromise)publicConfigPromise=api("/public/config",{}).catch(error=>{publicConfigPromise=null;throw error;});return publicConfigPromise;}
async function loadPlans(){try{const data=await loadPublicConfig();list.innerHTML=data.plans.length?data.plans.map(plan=>`<article class="plan-card"><h3>${plan.display_name}</h3><strong>${money(activeAmount(plan))}</strong>${plan.offer_price_paise!=null?`<del>${money(plan.price_paise)}</del>`:""}<p>${plan.duration_days} days • ${plan.download_limit==null?"Unlimited downloads":plan.download_limit+" downloads"}</p><button type="button" data-plan="${plan.id}">Choose Plan</button></article>`).join(""):"<p>ਕੋਈ plan active ਨਹੀਂ ਹੈ।</p>";}catch(error){list.innerHTML=`<p>${error.message}</p>`;}}
function showFreeMessage(){if(!homeFreeMessage)return;homeFreeMessage.classList.add("is-changing");window.setTimeout(()=>{homeFreeMessage.textContent=freeMessages[freeMessageIndex];homeFreeMessage.lang=["en","pa","hi"][freeMessageIndex];homeFreeMessage.classList.remove("is-changing");freeMessageIndex=(freeMessageIndex+1)%freeMessages.length;},180);}
function showPlanOffer(plans){if(!homePlanOffer||!plans.length)return;const plan=plans[planOfferIndex%plans.length];homePlanOffer.classList.add("is-changing");window.setTimeout(()=>{homePlanOffer.innerHTML=`<div><small>SPECIAL OFFER</small><strong>${plan.display_name}</strong><span>${plan.download_limit==null?"Unlimited poster downloads":plan.download_limit+" poster downloads"}</span></div><b>${money(activeAmount(plan))}</b>`;homePlanOffer.classList.remove("is-changing");planOfferIndex=(planOfferIndex+1)%plans.length;},180);}
async function startHomeOffers(){if(!homeFreeMessage||!homePlanOffer)return;showFreeMessage();window.setInterval(showFreeMessage,3600);try{const data=await loadPublicConfig();const plans=(data.plans||[]).slice(0,3);if(!plans.length)return;showPlanOffer(plans);if(plans.length>1)window.setInterval(()=>showPlanOffer(plans),4200);}catch(_error){/* Keep the useful fallback offer visible if the API is temporarily unavailable. */}}
function openPlans(){modal.classList.add("open");modal.setAttribute("aria-hidden","false");loadPlans();}
async function buyPlan(planId){status.textContent="Payment ਤਿਆਰ ਹੋ ਰਹੀ ਹੈ…";try{const auth=window.ThePosterWalaAuth;if(!auth)throw new Error("Login service ready ਨਹੀਂ ਹੈ");let user=auth.getCurrentUser();if(!user){await auth.signIn();user=auth.getCurrentUser();if(!user)throw new Error("Google Login ਪੂਰਾ ਕਰਕੇ Plan ਦੁਬਾਰਾ ਚੁਣੋ।");}const order=await api("/subscription/create-order",{planId},true);await checkoutScript();const checkout=new window.Razorpay({key:order.keyId,amount:order.amount,currency:order.currency,name:order.businessName,description:order.description,order_id:order.orderId,prefill:{name:user.displayName||"",email:user.email||""},theme:{color:"#0c5a41"},handler:async payment=>{status.textContent="Payment verify ਹੋ ਰਹੀ ਹੈ…";try{await api("/subscription/verify-payment",payment,true);status.textContent="✓ Plan active ਹੋ ਗਿਆ";status.className="plans-status success";}catch(error){status.textContent=error.message;status.className="plans-status error";}}});checkout.open();status.textContent="";}catch(error){status.textContent=error.message;status.className="plans-status error";}}
document.getElementById("plansButton")?.addEventListener("click",openPlans);
document.getElementById("homeOfferPlansButton")?.addEventListener("click",openPlans);
document.getElementById("plansClose")?.addEventListener("click",()=>{modal.classList.remove("open");modal.setAttribute("aria-hidden","true");});
list?.addEventListener("click",event=>{const button=event.target.closest("[data-plan]");if(button)buyPlan(Number(button.dataset.plan));});
startHomeOffers();
