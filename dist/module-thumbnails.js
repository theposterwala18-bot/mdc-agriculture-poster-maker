// Original miniature visual cues for homepage modules; no client photographs.
const previews = {
  wedding:["WEDDING","INVITATION","#f8efe0","#a67837","✦","Anand Karaj"],
  path:["SUKHMANI","SAHIB","#f8f1d9","#ad791f","ੴ","Gurbani"],
  "general-invite":["INVITATION","SPECIAL EVENT","#fff1ec","#ae6973","✉","You're Invited"],
  death:["ANTIM ARDAAS","BHOG NOTICE","#f1efea","#776d66","✦","In Memory"],
  missing:["MISSING","PERSON NOTICE","#f5e9e2","#a34740","?","PLEASE HELP"],
  condolence:["CONDOLENCE","MESSAGE","#f0efec","#7c777a","✧","In Memory"],
  "agri-sale":["MACHINERY","SALE NOTICE","#e7f1e5","#3c794f","✺","AUCTION"],
  "vehicle-sale":["PREMIUM","CAR SALE","#e4edf3","#2b5d7a","◈","FOR SALE"],
  "animal-sale":["PET SALE","NOTICE","#fff2df","#9c643e","♥","PUPPIES"],
  "general-sale":["BIG SALE","NEW ARRIVAL","#e8f0fb","#3468a2","◆","SHOP NOW"],
  meeting:["MEETING","NOTICE","#ebf2e5","#486c54","✣","PUBLIC"],
  protest:["PROTEST","DHARNA","#f9e7e2","#a14a3a","✊","NOTICE"],
  announcement:["PUBLIC","ANNOUNCEMENT","#e8eef9","#587298","✦","IMPORTANT"]
};
function xml(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]));}
export function modulePreviewMarkup(moduleId){
 const p=previews[moduleId];
 if(!p) return "";
 const [heading,sub,bg,ink,ornament,footer]=p;
 const floral=moduleId==="wedding"||moduleId==="path"||moduleId==="general-invite";
 const art=floral
   ? '<path d="M9 65Q29 12 65 26M151 175Q119 157 102 204" fill="none" stroke="'+ink+'" stroke-width="3" opacity=".23"/><circle cx="26" cy="35" r="8" fill="#e7c1a2" opacity=".8"/><circle cx="41" cy="28" r="7" fill="#d4a6aa" opacity=".7"/><circle cx="128" cy="183" r="9" fill="#e4c0ac" opacity=".7"/><circle cx="140" cy="171" r="7" fill="#e9d3af" opacity=".75"/>'
   : '<rect x="17" y="24" width="126" height="48" rx="6" fill="'+ink+'" opacity=".12"/><path d="M22 170L138 90M25 90L135 170" stroke="'+ink+'" opacity=".07" stroke-width="7"/>';
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="160" height="216" viewBox="0 0 160 216"><rect width="160" height="216" rx="8" fill="'+bg+'"/><rect x="6" y="6" width="148" height="204" rx="5" fill="none" stroke="'+ink+'" stroke-width="2" opacity=".66"/><rect x="11" y="11" width="138" height="194" rx="4" fill="none" stroke="'+ink+'" opacity=".32"/>'+art+'<text x="80" y="73" text-anchor="middle" font-family="Georgia,serif" font-size="27" fill="'+ink+'">'+xml(ornament)+'</text><path d="M30 83H130" stroke="'+ink+'" stroke-width="1.5" opacity=".6"/><text x="80" y="108" text-anchor="middle" font-family="Georgia,serif" font-weight="bold" font-size="14" fill="'+ink+'">'+xml(heading)+'</text><text x="80" y="125" text-anchor="middle" font-family="Georgia,serif" letter-spacing="1" font-size="9" fill="'+ink+'">'+xml(sub)+'</text><path d="M39 143H121" stroke="'+ink+'" opacity=".45"/><text x="80" y="162" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="12" fill="'+ink+'">'+xml(footer)+'</text><circle cx="80" cy="184" r="3" fill="'+ink+'" opacity=".6"/></svg>';
 const src="data:image/svg+xml;charset=UTF-8,"+encodeURIComponent(svg);
 return '<span class="module-card-preview" aria-hidden="true"><img loading="lazy" decoding="async" alt="" src="'+src+'"></span>';
}
