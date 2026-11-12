import { allReferenceWeddingTemplates, weddingReferenceImage } from "./wedding-reference-library.js";
// Original, editable vector wedding invitation designs. No reference images or third-party artwork embedded.
// Isolated to the "wedding" module; payment, export, and other modules remain unchanged.
const themes=[
  ["#fbf4e8","#8f602b","#d5b67e","#f4d5c4"],["#fff1ef","#9b5369","#e6b3b5","#f3d7d7"],
  ["#edf5fc","#305a86","#9dbfe1","#c4dbf0"],["#fff8ed","#68512a","#d8b668","#e7d0ad"],
  ["#f5eef9","#6c4d83","#bba2ce","#e8c8e4"],["#f6f6ee","#4e7456","#b4ceb2","#e7dfbe"],
  ["#fff3d8","#ac7830","#eac35a","#f3d77d"],["#f9eee5","#ab5e51","#d6a487","#eec6b0"],
  ["#f4e8e6","#8c3244","#c59192","#e2bdaf"],["#eaf5f2","#39726a","#9bc4ba","#ddebd8"]
];
const styles=[
 ["101","Royal Anand Karaj","wedding-anand-karaj",0,"arch"],["102","Pastel Sikh Florals","wedding-anand-karaj",1,"floral"],
 ["103","Blue Palki Elegance","wedding-anand-karaj",2,"arch"],["104","Vintage Punjabi Card","wedding-anand-karaj",3,"heritage"],
 ["105","Ivory Green Ceremony","wedding-anand-karaj",5,"leaf"],
 ["106","Golden Engagement","engagement-ring",3,"rings"],["107","Rose Ring Ceremony","engagement-ring",1,"rings"],
 ["108","Modern Engagement","engagement-ring",4,"minimal"],["109","Royal Roka","roka-shagan",8,"heritage"],
 ["110","Shagan Celebration","roka-shagan",7,"floral"],["111","Sunshine Haldi","haldi-maiyan",6,"sun"],
 ["112","Punjabi Maiyan","haldi-maiyan",7,"floral"],["113","Mehndi Garden","mehndi",5,"leaf"],
 ["114","Mehndi Night","mehndi",9,"floral"],["115","Jaggo Lights","jaggo-sangeet",8,"lights"],
 ["116","Reception Royal","reception",0,"arch"],["117","Champagne Reception","reception",3,"minimal"],
 ["118","Save The Date Bloom","save-date",1,"floral"],["119","Save The Date Blue","save-date",2,"minimal"],
 ["120","All Functions Invite","combined",4,"heritage"]
];
export const weddingTemplates=styles.map(([raw,name,category,theme,layout])=>({
 id:Number(raw),name,category,layout,
 note:category.replaceAll("-"," ").replace(/\b\w/g,c=>c.toUpperCase())+" • Original editable design",
 look:"card",palette:{soft:themes[theme][0],dark:themes[theme][1],gold:themes[theme][2],accent:themes[theme][3]},
 wedding:true
}));
weddingTemplates.unshift(...allReferenceWeddingTemplates);
export const weddingCategories=[
 ["all","All Wedding Designs"],["wedding-anand-karaj","Wedding / Anand Karaj"],
 ["engagement-ring","Engagement / Ring Ceremony"],["roka-shagan","Roka / Shagan"],
 ["haldi-maiyan","Haldi / Maiyan"],["mehndi","Mehndi"],["jaggo-sangeet","Jaggo / Sangeet"],
 ["reception","Reception"],["save-date","Save The Date"],["combined","Combined Invitation"]
];
export const weddingLanguages=[
 ["pa","ਪੰਜਾਬੀ"],["hi","हिन्दी"],["en","English"],["pa-en","Punjabi + English"]
];
const sayings={
 pa:{subtitle:"ਸਮੂਹ ਪਰਿਵਾਰ ਵੱਲੋਂ ਆਪ ਜੀ ਨੂੰ ਇਸ ਖੁਸ਼ੀ ਦੇ ਸਮਾਗਮ ਵਿੱਚ ਸ਼ਾਮਲ ਹੋਣ ਦਾ ਨਿੱਘਾ ਸੱਦਾ ਹੈ।",body:"ਆਪ ਜੀ ਦੀ ਹਾਜ਼ਰੀ ਸਾਡੀਆਂ ਖੁਸ਼ੀਆਂ ਨੂੰ ਚਾਰ ਚੰਨ ਲਾਵੇਗੀ।",headings:{"wedding-anand-karaj":"ਆਨੰਦ ਕਾਰਜ","engagement-ring":"ਮੰਗਣੀ ਅਤੇ ਰਿੰਗ ਸੈਰੇਮਨੀ","roka-shagan":"ਰੋਕਾ ਅਤੇ ਸ਼ਗਨ","haldi-maiyan":"ਮਾਈਆਂ / ਹਲਦੀ","mehndi":"ਮਹਿੰਦੀ ਸਮਾਗਮ","jaggo-sangeet":"ਜਾਗੋ ਅਤੇ ਸੰਗੀਤ","reception":"ਰਿਸੈਪਸ਼ਨ ਪਾਰਟੀ","save-date":"ਤਾਰੀਖ਼ ਯਾਦ ਰੱਖਣਾ","combined":"ਵਿਆਹ ਸਮਾਗਮ"}},
 hi:{subtitle:"सपरिवार आपको हमारे शुभ विवाह समारोह में सादर आमंत्रित करते हैं।",body:"आपकी उपस्थिति हमारे लिए सौभाग्य की बात होगी।",headings:{"wedding-anand-karaj":"शुभ विवाह","engagement-ring":"सगाई समारोह","roka-shagan":"रोका एवं शगुन","haldi-maiyan":"हल्दी समारोह","mehndi":"मेहंदी समारोह","jaggo-sangeet":"संगीत संध्या","reception":"स्वागत समारोह","save-date":"तारीख़ याद रखें","combined":"विवाह समारोह"}},
 en:{subtitle:"Together with our families, we warmly invite you to celebrate this special occasion.",body:"Your gracious presence will make our celebration even more memorable.",headings:{"wedding-anand-karaj":"ANAND KARAJ","engagement-ring":"ENGAGEMENT CEREMONY","roka-shagan":"ROKA & SHAGAN","haldi-maiyan":"HALDI CEREMONY","mehndi":"MEHNDI CELEBRATION","jaggo-sangeet":"JAGGO & SANGEET","reception":"WEDDING RECEPTION","save-date":"SAVE THE DATE","combined":"WEDDING CELEBRATION"}},
 "pa-en":{subtitle:"ਸਮੂਹ ਪਰਿਵਾਰ ਵੱਲੋਂ ਜੀ ਆਇਆਂ ਨੂੰ। Together with our families, we invite you to celebrate.",body:"Your presence is our blessing. ਆਪ ਜੀ ਦਾ ਨਿੱਘਾ ਸਵਾਗਤ ਹੈ।",headings:{"wedding-anand-karaj":"ANAND KARAJ / ਆਨੰਦ ਕਾਰਜ","engagement-ring":"ENGAGEMENT / ਮੰਗਣੀ","roka-shagan":"ROKA / ਸ਼ਗਨ","haldi-maiyan":"HALDI / ਮਾਈਆਂ","mehndi":"MEHNDI / ਮਹਿੰਦੀ","jaggo-sangeet":"JAGGO / ਜਾਗੋ","reception":"RECEPTION / ਰਿਸੈਪਸ਼ਨ","save-date":"SAVE THE DATE","combined":"WEDDING / ਵਿਆਹ"}}
};
export function weddingLanguageText(language,category){
 const p=sayings[language]||sayings.pa;
 return {highlight:p.headings[category]||p.headings["wedding-anand-karaj"],subtitle:p.subtitle,body:p.body};
}
const weddingArtworkCache = new Map();
export function preloadWeddingArtwork(onChange){
  for(const category of new Set(weddingTemplates.map(t=>t.category))){
    if(weddingArtworkCache.has(category))continue;
    const image=new Image();
    weddingArtworkCache.set(category,{image,ready:false});
    image.onload=()=>{weddingArtworkCache.get(category).ready=true;onChange?.();};
    image.onerror=()=>{weddingArtworkCache.get(category).ready=false;};
    image.src="./assets/wedding-original/"+category+".svg";
  }
}
export function drawWeddingTemplate(ctx,state,t,customBackground=null,refresh=null,drawPngLayers=null){
 const W=1080,H=1620;
 const c=t.palette,variant=t.layout;
 const safe=v=>String(v??"").trim();
 const fill=(color,x=0,y=0,w=W,h=H)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h)};
 const stroke=(color,width=2)=>{ctx.strokeStyle=color;ctx.lineWidth=width};
 function line(x1,y1,x2,y2,color,width=2){stroke(color,width);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
 function flower(x,y,r,petals=6,color=c.accent){
   ctx.save();ctx.translate(x,y);
   for(let i=0;i<petals;i++){ctx.rotate(Math.PI*2/petals);ctx.beginPath();ctx.ellipse(0,r*.58,r*.36,r*.67,0,0,Math.PI*2);ctx.fillStyle=color;ctx.globalAlpha=.7;ctx.fill()}
   ctx.globalAlpha=1;ctx.fillStyle=c.gold;ctx.beginPath();ctx.arc(0,0,r*.29,0,Math.PI*2);ctx.fill();ctx.restore()
 }
 function leaf(x,y,scale,flip=false){ctx.save();ctx.translate(x,y);ctx.scale(flip?-1:1,1);line(0,0,130*scale,160*scale,c.dark,3);for(let i=1;i<6;i++){let a=i*20*scale;ctx.fillStyle=c.gold;ctx.globalAlpha=.38;ctx.beginPath();ctx.ellipse(a*.7,a*1.1,22*scale,8*scale,.5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(a*.9,a*1.25,20*scale,7*scale,-.45,0,Math.PI*2);ctx.fill()}ctx.restore();ctx.globalAlpha=1}
 function fit(text,y,max=825,start=66,min=23,color=c.dark,weight=700){
   const raw=safe(text);if(!raw)return;
   ctx.save();ctx.fillStyle=color;ctx.textAlign="center";ctx.textBaseline="middle";
   const parts=raw.split(/\n+/).map(p=>p.trim()).filter(Boolean);
   let lines=[];
   for(const p of parts){let cur="";ctx.font=weight+" "+start+'px "Noto Sans Gurmukhi",Georgia,serif';for(const word of p.split(/\s+/)){const next=cur?cur+" "+word:word;if(cur&&ctx.measureText(next).width>max){lines.push(cur);cur=word}else cur=next}if(cur)lines.push(cur)}
   lines=lines.slice(0,5);
   let size=start;while(size>min){ctx.font=weight+" "+size+'px "Noto Sans Gurmukhi",Georgia,serif';if(lines.every(l=>ctx.measureText(l).width<=max)&&lines.length*size*1.32<=(start*1.32)*Math.max(2,Math.min(lines.length,4)))break;size--}
   ctx.font=weight+" "+size+'px "Noto Sans Gurmukhi",Georgia,serif';
   const gap=size*1.32;let pos=y-(lines.length-1)*gap/2;
   for(const l of lines){ctx.fillText(l,W/2,pos,max);pos+=gap}
   ctx.restore();
 }
 const referenceArt=weddingReferenceImage(t,refresh);
 const art=weddingArtworkCache.get(t.category);
 if(customBackground?.naturalWidth){
    const scale=Math.max(W/customBackground.naturalWidth,H/customBackground.naturalHeight);
    ctx.drawImage(customBackground,(W-customBackground.naturalWidth*scale)/2,(H-customBackground.naturalHeight*scale)/2,customBackground.naturalWidth*scale,customBackground.naturalHeight*scale);
    ctx.fillStyle="rgba(255,252,244,.83)";ctx.fillRect(115,225,850,1175);
    stroke(c.gold,7);ctx.strokeRect(42,42,W-84,H-84);
    stroke(c.gold,2);ctx.strokeRect(61,61,W-122,H-122);
 }else if(referenceArt){
    ctx.drawImage(referenceArt,0,0,W,H);
 }else if(art?.ready){
    ctx.drawImage(art.image,0,0,W,H);
 }else{
  const g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,c.soft);g.addColorStop(.56,"#fffdf8");g.addColorStop(1,c.soft);fill(g);
 const margin=variant==="minimal"?82:38;
 stroke(c.gold,variant==="heritage"?12:6);ctx.strokeRect(margin,margin,W-margin*2,H-margin*2);
 stroke(c.dark,1.5);ctx.globalAlpha=.43;ctx.strokeRect(margin+14,margin+14,W-margin*2-28,H-margin*2-28);ctx.globalAlpha=1;
 if(["arch","heritage","rings"].includes(variant)){
   ctx.save();ctx.fillStyle="#ffffffaa";ctx.strokeStyle=c.gold;ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(130,1375);ctx.lineTo(130,380);
   ctx.bezierCurveTo(130,280,270,270,360,240);ctx.quadraticCurveTo(540,35,720,240);ctx.bezierCurveTo(810,270,950,280,950,380);ctx.lineTo(950,1375);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()
 }
 if(variant==="sun"){ctx.save();ctx.translate(540,400);for(let a=0;a<24;a++){ctx.rotate(Math.PI/12);line(0,70,0,178,c.gold,5)}ctx.restore()}
 if(variant==="lights"){for(let i=0;i<10;i++){let x=70+i*105;line(x,74,x,130+(i%3)*40,c.gold,3);flower(x,135+(i%3)*40,10,5,c.gold)}}
 if(variant==="rings"){stroke(c.gold,11);ctx.beginPath();ctx.arc(505,430,85,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(575,430,85,0,Math.PI*2);ctx.stroke()}
 if(variant==="minimal"){line(225,245,855,245,c.gold,4);line(225,1374,855,1374,c.gold,4)}
 if(["floral","leaf","heritage","arch","sun"].includes(variant)){
   leaf(70,80,1,false);leaf(1010,80,1,true);leaf(70,1450,.75,false);leaf(1010,1450,.75,true);
   flower(145,165,38);flower(935,165,38);flower(145,1452,42);flower(935,1452,42);
 }
 if(variant==="floral"){for(let x=300;x<850;x+=120){flower(x,86,18,6,c.accent)}}
 if(variant==="heritage"){for(let x=140;x<960;x+=90){ctx.save();ctx.globalAlpha=.28;flower(x,1510,14,8,c.gold);ctx.restore()}}

 }
 if(drawPngLayers) drawPngLayers(ctx,W,H);
 ctx.save();ctx.globalAlpha=.7;ctx.fillStyle=c.gold;ctx.font='52px "Noto Sans Gurmukhi",Georgia,serif';ctx.textAlign="center";ctx.fillText("✦",540,155);ctx.restore();
 fit(state.heading,215,760,27,18,c.dark,650);
 fit(safe(state.highlight)||"WEDDING CELEBRATION",310,730,49,23,c.dark,750);
 line(280,362,800,362,c.gold,3);
 if(state.primaryPhoto instanceof HTMLImageElement){
   ctx.save();ctx.beginPath();ctx.ellipse(540,535,160,130,0,0,Math.PI*2);ctx.clip();
   const im=state.primaryPhoto;const scale=Math.max(320/im.width,260/im.height);
   ctx.drawImage(im,540-im.width*scale/2,535-im.height*scale/2,im.width*scale,im.height*scale);
   ctx.restore();stroke(c.gold,6);ctx.beginPath();ctx.ellipse(540,535,160,130,0,0,Math.PI*2);ctx.stroke();
 }else if(!t.heroType){
   fit(state.weddingTradition==="sikh"?"ੴ":state.weddingTradition==="hindu"?"ॐ":state.weddingTradition==="muslim"?"✦":"♡",490,430,110,60,c.gold,500);
 }
 fit(state.title,t.heroType==="rings-top"?770:725,t.heroType==="couple-right"?600:830,76,28,c.dark,800);
 line(345,825,735,825,c.gold,3);
 fit(state.subtitle,895,785,29,17,c.dark,500);
 fit(state.body,1022,760,24,16,c.dark,530);
 fit(state.date,1130,700,40,22,c.dark,800);
 fit(safe(state.time),1185,720,29,18,c.dark,600);
 fit(state.venue,t.heroType==="couple-bottom"?1240:1304,t.heroType==="couple-right"?580:760,37,18,c.dark,700);
 fit(state.footer,t.heroType==="couple-bottom"?1310:1415,800,29,18,c.dark,650);
 if(t.heroType!=="couple-bottom"&&t.heroType!=="couple-right")fit(state.contact,1490,760,23,16,c.dark,600);
 line(330,1545,750,1545,c.gold,3);
}
