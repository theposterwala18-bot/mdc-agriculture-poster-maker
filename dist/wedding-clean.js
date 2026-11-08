// Wedding Studio: clean, photo-ready invitations. NO vector couple, clipart, SVG artwork or cartoon illustrations.
// Old draft vector designs are intentionally not registered in the customer-facing template list.
const styles=[
[401,"Ivory Wedding Card","wedding-anand-karaj","#fbf7ef","#684c39","#b69b6e","classic"],
[402,"Elegant Punjabi Wedding","wedding-anand-karaj","#fff5f2","#754550","#bca27b","photo"],
[403,"Minimal Traditional Wedding","wedding-anand-karaj","#f8f4eb","#635c4c","#ab9465","minimal"],
[404,"Engagement Invitation","engagement-ring","#fff5f7","#875768","#bb986a","photo"],
[405,"Roka & Shagan Card","roka-shagan","#fbf5eb","#765036","#c1a076","classic"],
[406,"Haldi / Maiyan Invite","haldi-maiyan","#fff7db","#88682e","#bb9b51","minimal"],
[407,"Mehndi Invitation","mehndi","#f1f5ea","#49624b","#a5a27d","photo"],
[408,"Jaggo / Sangeet Invite","jaggo-sangeet","#f9f1ed","#79524a","#be9e7a","classic"],
[409,"Wedding Reception Card","reception","#f7f3ee","#625148","#b9a181","photo"],
[410,"Save the Date","save-date","#f2f6f8","#4a6877","#abb7bc","minimal"],
[411,"Combined Wedding Functions","combined","#f8f2f5","#78596c","#ba9eac","classic"]
];
export const cleanWeddingTemplates=styles.map(([id,name,category,soft,dark,gold,layout])=>({
 id,name,category,wedding:true,look:"card",layout,
 note:"Clean, no cartoon artwork • Custom photo or background",palette:{soft,dark,gold,accent:gold,ink:dark}
}));
export function drawCleanWedding(ctx,state,t,uploadedBackground){
 const W=1080,H=1620,p=t.palette;
 ctx.save();
 const cover=(img,x,y,w,h)=>{
   const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height;
   if(!iw||!ih)return;
   const scale=Math.max(w/iw,h/ih),sw=iw*scale,sh=ih*scale;
   ctx.drawImage(img,x+(w-sw)/2,y+(h-sh)/2,sw,sh);
 };
 ctx.fillStyle=p.soft;ctx.fillRect(0,0,W,H);
 if(uploadedBackground){cover(uploadedBackground,0,0,W,H);}
 if(uploadedBackground){
   ctx.fillStyle="rgba(255,253,248,.87)";
   ctx.fillRect(75,85,930,t.layout==="photo"?1020:1415);
 } else {
   const g=ctx.createLinearGradient(0,0,W,H);
   g.addColorStop(0,p.soft);g.addColorStop(.5,"#fffefd");g.addColorStop(1,p.soft);
   ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 }
 // Simple stationery borders only. No decorative SVGs or vector figures.
 ctx.strokeStyle=p.gold;ctx.lineWidth=5;ctx.strokeRect(45,45,W-90,H-90);
 ctx.lineWidth=1.5;ctx.strokeRect(59,59,W-118,H-118);
 const setText=(text,y,maxWidth,fontSize,weight=500,color=p.dark,maxLines=3)=>{
   const raw=String(text||"").trim();if(!raw)return;
   ctx.fillStyle=color;ctx.textAlign="center";ctx.textBaseline="middle";
   const paragraphs=raw.split(/\n+/).map(s=>s.trim()).filter(Boolean);
   const pieces=[];
   for(const paragraph of paragraphs){
     let line="";
     for(const word of paragraph.split(/\s+/)){
       const next=line?line+" "+word:word;
       ctx.font=weight+" "+fontSize+'px "Noto Sans Gurmukhi", Georgia, serif';
       if(line&&ctx.measureText(next).width>maxWidth){pieces.push(line);line=word;}else line=next;
     }
     if(line)pieces.push(line);
   }
   const lines=pieces.slice(0,maxLines);
   let size=fontSize;
   while(size>20){
     ctx.font=weight+" "+size+'px "Noto Sans Gurmukhi",Georgia,serif';
     if(lines.every(s=>ctx.measureText(s).width<=maxWidth))break;
     size-=2;
   }
   const height=size*1.4;let pos=y-(lines.length-1)*height/2;
   ctx.font=weight+" "+size+'px "Noto Sans Gurmukhi",Georgia,serif';
   for(const line of lines){ctx.fillText(line,540,pos,maxWidth);pos+=height}
 };
 setText(state.heading,205,810,30,500);
 ctx.strokeStyle=p.gold;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(350,265);ctx.lineTo(730,265);ctx.stroke();
 setText(state.highlight,365,870,57,750);
 const hasPhoto=state.primaryPhoto?.naturalWidth>0;
 if(hasPhoto&&t.layout==="photo"){
   ctx.save();ctx.beginPath();ctx.roundRect(255,485,570,455,24);ctx.clip();
   cover(state.primaryPhoto,255,485,570,455);ctx.restore();
   ctx.strokeStyle=p.gold;ctx.lineWidth=5;ctx.strokeRect(255,485,570,455);
 }
 const nameY=hasPhoto&&t.layout==="photo"?1010:700;
 setText(state.title,nameY,870,76,700);
 const subtitleY=hasPhoto&&t.layout==="photo"?1125:840;
 setText(state.subtitle,subtitleY,820,31,450);
 if(t.layout!=="photo"&&hasPhoto){
   ctx.save();ctx.beginPath();ctx.roundRect(400,915,280,235,18);ctx.clip();
   cover(state.primaryPhoto,400,915,280,235);ctx.restore();
 }
 const dateY=t.layout==="photo"?1250:1150;
 setText(state.date,dateY,850,45,700);
 setText(state.time,dateY+62,820,29,500);
 setText(state.venue,dateY+135,820,30,650);
 setText(state.footer,dateY+230,850,26,500);
 setText(state.contact,1528,830,24,500);
 ctx.restore();
}

export const weddingCategories=[
 ["all","All Wedding Designs"],["wedding-anand-karaj","Wedding / Anand Karaj"],
 ["engagement-ring","Engagement / Ring Ceremony"],["roka-shagan","Roka / Shagan"],
 ["haldi-maiyan","Haldi / Maiyan"],["mehndi","Mehndi"],["jaggo-sangeet","Jaggo / Sangeet"],
 ["reception","Reception"],["save-date","Save the Date"],["combined","Combined Invitation"]
];
export const weddingLanguages=[["pa","ਪੰਜਾਬੀ"],["hi","हिन्दी"],["en","English"],["pa-en","Punjabi + English"]];
const headings={
 pa:["ਆਨੰਦ ਕਾਰਜ","ਮੰਗਣੀ ਅਤੇ ਰਿੰਗ ਸੈਰੇਮਨੀ","ਰੋਕਾ ਅਤੇ ਸ਼ਗਨ","ਮਾਈਆਂ / ਹਲਦੀ","ਮਹਿੰਦੀ ਸਮਾਗਮ","ਜਾਗੋ ਅਤੇ ਸੰਗੀਤ","ਰਿਸੈਪਸ਼ਨ ਪਾਰਟੀ","ਤਾਰੀਖ਼ ਯਾਦ ਰੱਖਣਾ","ਵਿਆਹ ਸਮਾਗਮ"],
 hi:["शुभ विवाह","सगाई समारोह","रोका एवं शगुन","हल्दी समारोह","मेहंदी समारोह","संगीत संध्या","स्वागत समारोह","तारीख़ याद रखें","विवाह समारोह"],
 en:["WEDDING INVITATION","ENGAGEMENT CEREMONY","ROKA & SHAGAN","HALDI CEREMONY","MEHNDI CELEBRATION","JAGGO & SANGEET","WEDDING RECEPTION","SAVE THE DATE","WEDDING CELEBRATION"],
 "pa-en":["WEDDING / ਆਨੰਦ ਕਾਰਜ","ENGAGEMENT / ਮੰਗਣੀ","ROKA / ਸ਼ਗਨ","HALDI / ਮਾਈਆਂ","MEHNDI / ਮਹਿੰਦੀ","JAGGO / ਜਾਗੋ","RECEPTION / ਰਿਸੈਪਸ਼ਨ","SAVE THE DATE","WEDDING / ਵਿਆਹ"]
};
const copy={
 pa:["ਸਮੂਹ ਪਰਿਵਾਰ ਵੱਲੋਂ ਆਪ ਜੀ ਨੂੰ ਸੱਦਾ ਦਿੱਤਾ ਜਾਂਦਾ ਹੈ।","ਆਪ ਜੀ ਦੀ ਹਾਜ਼ਰੀ ਸਾਡੇ ਲਈ ਵੱਡੀ ਖੁਸ਼ੀ ਹੋਵੇਗੀ।"],
 hi:["सपरिवार आपको सादर आमंत्रित करते हैं।","आपकी उपस्थिति हमारे लिए सौभाग्य की बात होगी।"],
 en:["Together with our families, we warmly invite you.","Your presence will make our celebration memorable."],
 "pa-en":["ਸਮੂਹ ਪਰਿਵਾਰ ਵੱਲੋਂ ਸੱਦਾ। Together with our families, we invite you.","ਆਪ ਜੀ ਦਾ ਸਵਾਗਤ ਹੈ। We look forward to seeing you."]
};
export function weddingLanguageText(lang,category){
 const index=Math.max(0,weddingCategories.findIndex(x=>x[0]===category)-1);
 const k=headings[lang]?lang:"pa";
 return {highlight:headings[k][index],subtitle:copy[k][0],body:copy[k][1]};
}
