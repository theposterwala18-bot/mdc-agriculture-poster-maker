const $=id=>document.getElementById(id),DPI=300,toPx=mm=>Math.round(mm/25.4*DPI);
let urls=[],front=null,back=null;const status=(s,bad=false)=>{$("cardStatus").textContent=s;$("cardStatus").classList.toggle("error",bad)};
function url(blob){const u=URL.createObjectURL(blob);urls.push(u);return u}
async function imageOf(file){
 if(!file)throw Error("Front and back images required");
 if(file.size>25*1024*1024||!["image/png","image/jpeg","image/webp"].includes(file.type))throw Error("JPG, PNG or WebP, max 25 MB");
 const u=url(file);return await new Promise((res,rej)=>{const img=new Image();img.onload=()=>res(img);img.onerror=()=>rej(Error("Invalid card image"));img.src=u})
}
function fit(ctx,image,x,y,w,h){
 ctx.fillStyle="#fff";ctx.fillRect(x,y,w,h);
 const s=Math.min(w/image.naturalWidth,h/image.naturalHeight),a=image.naturalWidth*s,b=image.naturalHeight*s;
 ctx.drawImage(image,x+(w-a)/2,y+(h-b)/2,a,b);
 ctx.strokeStyle="#777";ctx.strokeRect(x,y,w,h);
}
$("cardGenerate").addEventListener("click",async()=>{
 const btn=$("cardGenerate");btn.disabled=true;
 try{
  [front,back]=await Promise.all([imageOf($("cardFront").files?.[0]),imageOf($("cardBack").files?.[0])]);
  const [cardW,cardH]=$("cardSize").value.split("x").map(Number);
  const canvas=document.createElement("canvas");canvas.width=toPx(210);canvas.height=toPx(297);
  const ctx=canvas.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);
  const w=toPx(cardW),h=toPx(cardH),left=toPx(10),top=toPx(12),gapX=toPx(5),gapY=toPx(9);
  const max=Math.min(4,Math.floor((canvas.height-top*2+gapY)/(h+gapY)));
  const pairs=Math.min(+$("cardPairs").value,max);
  for(let i=0;i<pairs;i++){const y=top+i*(h+gapY);fit(ctx,front,left,y,w,h);fit(ctx,back,left+w+gapX,y,w,h)}
  const blob=await new Promise((res,rej)=>canvas.toBlob(b=>b?res(b):rej(Error("Could not export sheet")),"image/png"));
  const src=url(blob);$("cardPreview").src=src;$("cardPreview").hidden=false;
  $("cardDownload").href=src;$("cardDownload").hidden=false;
  if(window.PDFLib){
   const pdf=await window.PDFLib.PDFDocument.create(),pic=await pdf.embedPng(await blob.arrayBuffer());
   pdf.addPage([595.28,841.89]).drawImage(pic,{x:0,y:0,width:595.28,height:841.89});
   $("cardPdf").href=url(new Blob([await pdf.save()],{type:"application/pdf"}));$("cardPdf").hidden=false;
  }else $("cardPdf").hidden=true;
  status(pairs+" front/back pairs ready. Print A4 at actual size.");
 }catch(e){status(e.message,true)}finally{btn.disabled=false}
});
$("showOriginalPdf").addEventListener("click",()=>{
 const file=$("securePdfInput").files?.[0];if(!file||!file.name.toLowerCase().endsWith(".pdf")){status("Select an authentic PDF first.",true);return}
 if(file.size>35*1024*1024){status("PDF exceeds 35 MB limit",true);return}
 const iframe=document.createElement("iframe");iframe.title="Original PDF viewer";iframe.src=url(file);iframe.style.cssText="width:100%;height:560px;border:0";
 const wrapper=$("securePdfViewer");wrapper.replaceChildren(iframe);wrapper.hidden=false;
 status("PDF opened locally. Use the browser viewer's password prompt and print tools.");
});
window.addEventListener("pagehide",()=>{for(const u of urls)URL.revokeObjectURL(u)});
