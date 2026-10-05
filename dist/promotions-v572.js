(function(){
"use strict";
const API="https://the-poster-wala-payment-api.theposterwala18.workers.dev";
const PROMO_DRAFT_KEY="tpw_owner_promo_draft_v573";
const defaults=[
  {title:"TripKhata",description:"Trip expenses, Shared Trip, Customer Khata & Suppliers",url:"https://theposterwala18-bot.github.io/TripKhata/",icon:"🧳",enabled:true,order:10}
];
function esc(v){return String(v??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));}
function safeUrl(value){
  const v=String(value||"").trim();
  if(!v)return"";
  try{const u=new URL(v,location.href);return /^https?:$/.test(u.protocol)?u.href:"";}catch(_){return"";}
}
function normalize(list){
  if(!Array.isArray(list))return defaults;
  return list.map((x,i)=>({
    title:String(x?.title||"").trim().slice(0,60),
    description:String(x?.description||"").trim().slice(0,180),
    url:safeUrl(x?.url),
    icon:String(x?.icon||"🔗").slice(0,8),
    enabled:x?.enabled!==false&&Number(x?.enabled)!==0,
    order:Number.isFinite(Number(x?.order))?Number(x.order):(i+1)*10
  })).filter(x=>x.title&&x.enabled).sort((a,b)=>a.order-b.order);
}
function render(cards){
  const holder=document.getElementById("heroPromoCards");if(!holder)return;
  holder.innerHTML=cards.map(card=>{
    const inner='<span class="hero-promo-icon">'+esc(card.icon)+'</span><span class="hero-promo-copy"><strong>'+esc(card.title)+'</strong><small>'+esc(card.description)+'</small></span><b>'+(card.url?'Open →':'Coming Soon')+'</b>';
    return card.url?'<a class="hero-promo-card" href="'+esc(card.url)+'" target="_blank" rel="noopener noreferrer">'+inner+'</a>':'<div class="hero-promo-card is-coming">'+inner+'</div>';
  }).join("")||'<div class="hero-promo-empty">More tools coming soon.</div>';
}
async function load(){
  let localDraft=null;
  try{
    const parsed=JSON.parse(localStorage.getItem(PROMO_DRAFT_KEY)||"null");
    if(Array.isArray(parsed))localDraft=normalize(parsed);
  }catch(_){}
  render(localDraft||defaults);
  try{
    const res=await fetch(API+"/public/config",{method:"GET",cache:"no-store"});
    if(!res.ok)return;
    const data=await res.json();
    const raw=data?.settings?.promo_cards_json;
    if(raw==null)return;
    const list=typeof raw==="string"?JSON.parse(raw):raw;
    if(!localDraft)render(normalize(list));
  }catch(_){}
}
load();
})();
