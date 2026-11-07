// Copyright-safe original vector compositions inspired by 52 supplied references.
const groups=[
["wedding-anand-karaj","Heirloom Floral|Ivory Orchid Arch|Punjabi Classic|Rose Gold Heritage|Festive Royal|Emerald Arch|Blush Petals|Royal Blue|Maroon Gold|Punjabi Rose Garden|Traditional Scroll|Ivory Wedding|Golden Stage|Red Blossom|Elegant Rose|Luxury Floral|Pink Family|Sikh Heritage|Royal Ivory|Mandap Floral|Vintage Gold|Palace Evening|Burgundy Gold|Traditional Couple|South Indian Marigold|Sikh Traditional|Golden Embossed|Heritage Royal|Champagne Ivory|Hindu Floral|Floral Pearl|Anand Karaj Classic"],
["engagement-ring","Garden Rings|Couple Engagement|Pastel Engagement|Grand Engagement|Dusty Rose|Luxury Rings|Engagement Blossom|Elegant Flowers|Playful Rings|Royal Engagement"],
["haldi-maiyan","Marigold Haldi|Yellow Maiyan|Sunflower Haldi|Golden Haldi|Traditional Haldi"],
["mehndi","Mehndi Garden"],
["reception","Royal Reception|Blush Reception"],
["save-date","Ivory Save the Date|Botanical Save the Date"]
];
const palettes=[["#fff8eb","#80552d","#cba666","#e2b9a8"],["#fff1f4","#863d5a","#d5b781","#e9bfcd"],["#ecf2fa","#354f78","#d8b66b","#bdcee2"],["#eef5eb","#46664b","#c9b380","#bad4b5"],["#f4ecf4","#72577a","#d2bc93","#e3c7df"],["#fff6de","#926425","#e0b757","#f0ce7e"]];
const families=["arch","floral","heritage","garden","palace","minimal","luxury","marigold"];
const palette=i=>{const p=palettes[i%palettes.length];return {soft:p[0],dark:p[1],gold:p[2],accent:p[3]}};
export const featuredWeddingTemplates=[
{id:301,name:"Royal Lantern Wedding with Couple",category:"wedding-anand-karaj",family:"couple-bottom"},
{id:302,name:"Ivory Palace Wedding with Couple",category:"wedding-anand-karaj",family:"couple-right"},
{id:303,name:"Floral Engagement with Rings",category:"engagement-ring",family:"rings-hands"}
].map((t,i)=>({...t,featured:true,wedding:true,look:"card",note:"Original illustrated premium style • Editable details",palette:palette(i)}));
const archiveReferenceIds=[1,3,4,5,6,11,16,17,18,19,21,22,24,25,26,27,28,29,30,33,34,36,37,39,40,42,44,46,47,48,51,52,10,13,15,23,31,32,35,41,43,49,2,9,12,14,20,7,8,45,38,50];
let counter=0;
export const archivedWeddingTemplates=groups.flatMap(([category,names])=>names.split("|").map(name=>{const i=counter++;return {id:201+i,name,category,family:families[(i*7+Math.floor(i/3))%families.length],motif:i,referenceId:"REF-"+String(archiveReferenceIds[i]).padStart(3,"0"),wedding:true,look:"card",note:"Original design based on reference "+String(i+1).padStart(2,"0"),palette:palette(i+Math.floor(i/6))}}));
export const allReferenceWeddingTemplates=[...featuredWeddingTemplates,...archivedWeddingTemplates];
function flower(x,y,r,p){let s='<g transform="translate('+x+' '+y+')">';for(let i=0;i<7;i++)s+='<ellipse cx="0" cy="-'+Math.round(r*.5)+'" rx="'+Math.round(r*.31)+'" ry="'+Math.round(r*.62)+'" transform="rotate('+(i*360/7)+')" fill="'+p.accent+'" opacity=".72"/>';return s+'<circle r="'+r*.2+'" fill="'+p.gold+'"/></g>';}
function arch(p){return '<path d="M130 1480V380Q130 300 220 294Q270 228 350 211Q417 70 540 74Q663 70 730 211Q810 228 860 294Q950 300 950 380V1480" fill="none" stroke="url(#gold)" stroke-width="12"/>';}
function couple(x,y,scale,col){return '<g transform="translate('+x+' '+y+') scale('+scale+')"><g transform="translate(-86 0)"><path d="M-55 35Q-100 190 -80 340H30Q48 175 40 45Z" fill="#ead6b1" stroke="#ae804b" stroke-width="6"/><circle cy="-30" r="46" fill="#bb8569"/><path d="M-60 -46Q-25 -135 42 -65L55 -18Q-4 -42 -59 -15Z" fill="#85333a" stroke="#cfa968" stroke-width="8"/></g><g transform="translate(85 0)"><path d="M-50 45Q-160 190 -118 347H126Q147 190 55 45Z" fill="'+col+'" stroke="#dcb16c" stroke-width="9"/><circle cy="-30" r="44" fill="#c18c71"/><path d="M-75 -85Q20 -160 95 -45Q140 120 150 275Q70 170 20 35Q-80 35 -140 220Z" fill="#d8b7a5" stroke="#c8a26b" stroke-width="5" opacity=".92"/><path d="M-62 195Q0 240 78 192" fill="none" stroke="#d7b26c" stroke-width="7"/></g></g>';}
function hands(p){return '<g opacity=".88"><path d="M-12 250Q120 170 225 212L366 333Q419 360 474 373L552 395Q573 413 550 432Q530 440 492 427L425 419Q374 420 352 463L260 488H0Z" fill="#d9a087" stroke="#ae7964" stroke-width="8"/><path d="M1092 250Q952 170 851 211L710 333Q660 362 607 373L552 395Q532 413 555 432Q575 439 613 426L659 419Q710 420 730 463L822 488H1080Z" fill="#be8b74" stroke="#986950" stroke-width="8"/><ellipse cx="550" cy="397" rx="18" ry="13" fill="none" stroke="'+p.gold+'" stroke-width="8"/><path d="M538 378L550 357L562 378" fill="#f2f1e9" stroke="'+p.gold+'" stroke-width="4"/></g>';}
export function referenceWeddingSvg(t){
 const p=t.palette,seed=t.motif||1,f=t.family;
 let flowers="";
 const n=f==="garden"||f==="floral"?12:7;
 for(let i=0;i<n;i++){const y=95+i*1420/(n-1),x=50+Math.abs(32*Math.sin(i*2+seed));flowers+=flower(Math.round(x),Math.round(y),27+(i+seed)%19,p)+flower(Math.round(1080-x),Math.round(y),27+(i+seed)%19,p)}
 let decorations=flowers;
 if(["arch","palace","luxury","heritage","couple-bottom","couple-right"].includes(f))decorations+=arch(p);
 if(f==="couple-bottom")decorations+=couple(540,1220,.84,"#8b2634");
 if(f==="couple-right")decorations+=couple(820,1090,1.1,"#bd8a91");
 if(f==="rings-hands")decorations+=hands(p);
 if(f==="marigold")decorations+=flower(540,1450,84,{accent:"#e8b33a",gold:p.gold});
 if(["palace","luxury","couple-bottom","couple-right"].includes(f))decorations+='<g stroke="'+p.gold+'" stroke-width="5"><path d="M125 95V313M955 95V313"/><path d="M88 316Q125 265 162 316L151 410Q125 430 99 410Z" fill="#f9de9d"/><path d="M918 316Q955 265 992 316L981 410Q955 430 929 410Z" fill="#f9de9d"/></g>';
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1620" width="1080" height="1620"><defs><linearGradient id="bg"><stop stop-color="'+p.soft+'"/><stop offset=".5" stop-color="#fffefa"/><stop offset="1" stop-color="'+p.soft+'"/></linearGradient><linearGradient id="gold"><stop stop-color="'+p.dark+'"/><stop offset=".5" stop-color="'+p.gold+'"/><stop offset="1" stop-color="#f3dfa8"/></linearGradient></defs><rect width="1080" height="1620" fill="url(#bg)"/><rect x="25" y="25" width="1030" height="1570" fill="none" stroke="url(#gold)" stroke-width="8"/><rect x="42" y="42" width="996" height="1536" fill="none" stroke="'+p.gold+'" stroke-width="2" opacity=".6"/>'+decorations+'</svg>';
}
const artCache=new Map();
export function weddingReferenceImage(t,refresh){
 if(!t?.family)return null;
 let item=artCache.get(t.id);
 if(!item){const im=new Image();item={im,ready:false};artCache.set(t.id,item);im.onload=()=>{item.ready=true;refresh?.()};im.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(referenceWeddingSvg(t));}
 return item.ready?item.im:null;
}
