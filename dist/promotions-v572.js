(function(){
"use strict";
const API="https://the-poster-wala-payment-api.theposterwala18.workers.dev";
const PROMO_DRAFT_KEY="tpw_owner_promo_draft_v573";
const defaults=[
  {title:"Professional Custom Posters",description:"Movie, Web Series, Song Poster & Lyrical Video Design",url:"custom-service.html",icon:"🎬",enabled:true,order:1}
];
const showcaseImages=[
  "assets/main-custom-showcase/kirdaar.webp",
  "assets/main-custom-showcase/ptph.webp",
  "assets/main-custom-showcase/rasmalai.webp",
  "assets/main-custom-showcase/angreji.webp",
  "assets/main-custom-showcase/south.webp",
  "assets/main-custom-showcase/sharma.webp"
];
let showcaseTimer=null;
function esc(v){return String(v??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));}
function safeUrl(value){
  const v=String(value||"").trim();
  if(!v)return"";
  try{const u=new URL(v,location.href);return /^https?:$/.test(u.protocol)?u.href:"";}catch(_){return"";}
}
function normalize(list){
  if(!Array.isArray(list))return defaults;
  const cards=list.map((x,i)=>({
    title:String(x?.title||"").trim().slice(0,60),
    description:String(x?.description||"").trim().slice(0,180),
    url:safeUrl(x?.url),
    icon:String(x?.icon||"🔗").slice(0,8),
    enabled:x?.enabled!==false&&Number(x?.enabled)!==0,
    order:Number.isFinite(Number(x?.order))?Number(x.order):(i+1)*10
  })).filter(x=>x.title&&x.enabled&&x.title.toLowerCase()!=="tripkhata"&&x.title.toLowerCase()!=="professional custom posters");
  return [...defaults,...cards].sort((a,b)=>a.order-b.order);
}
function render(cards){
  const holder=document.getElementById("heroPromoCards");if(!holder)return;
  const cardMarkup=cards.map(card=>{
    if(card.title.toLowerCase()==="professional custom posters"&&card.url){
      return '<a class="hero-promo-card hero-custom-poster-card" href="'+esc(card.url)+'" aria-label="View Professional Custom Posters portfolio"><span class="hero-promo-icon">'+esc(card.icon)+'</span><span class="hero-promo-copy"><strong>'+esc(card.title)+'</strong><small>'+esc(card.description)+'</small><em>Explore Portfolio →</em></span><span class="hero-promo-mini-video" aria-hidden="true"><video autoplay muted loop playsinline preload="metadata" poster="assets/custom-promo/custom-promo-vertical.webp"><source src="assets/custom-promo/custom-promo-vertical.mp4" type="video/mp4"></video><i>SHOWREEL</i></span></a>';
    }
    const inner='<span class="hero-promo-icon">'+esc(card.icon)+'</span><span class="hero-promo-copy"><strong>'+esc(card.title)+'</strong><small>'+esc(card.description)+'</small></span><b>'+(card.url?'Open →':'Coming Soon')+'</b>';
    return card.url?'<a class="hero-promo-card" href="'+esc(card.url)+'" target="_blank" rel="noopener noreferrer">'+inner+'</a>':'<div class="hero-promo-card is-coming">'+inner+'</div>';
  }).join("")||'<div class="hero-promo-empty">More tools coming soon.</div>';
  const slides=showcaseImages.map(src=>'<span class="hero-selected-slide"><img src="'+src+'" alt=""></span>').join("");
  holder.innerHTML=cardMarkup+'<div class="hero-selected-carousel" aria-label="Selected professional poster slideshow"><span class="hero-selected-label">SELECTED POSTERS</span><div class="hero-selected-stage" aria-hidden="true">'+slides+'</div></div>';
  startSelectedShowcase();
}
function startSelectedShowcase(){
  if(showcaseTimer){clearInterval(showcaseTimer);showcaseTimer=null;}
  const slides=Array.from(document.querySelectorAll(".hero-selected-slide"));
  if(!slides.length)return;
  let active=0;
  const update=()=>{
    const count=slides.length;
    slides.forEach((slide,index)=>{
      let d=(index-active+count)%count;if(d>count/2)d-=count;
      slide.className="hero-selected-slide";
      if(d===0)slide.classList.add("is-active");
      else if(d===-1)slide.classList.add("is-left");
      else if(d===1)slide.classList.add("is-right");
      else slide.classList.add("is-hidden");
    });
  };
  update();
  if(!window.matchMedia("(prefers-reduced-motion: reduce)").matches){showcaseTimer=setInterval(()=>{active=(active+1)%slides.length;update();},2200);}
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
