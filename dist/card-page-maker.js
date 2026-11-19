import {bindPrintSettings,printConfig,pageCanvasSize,mmPx,pdfPts,anchorXY} from "./smart-print-layout.js";
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
let currentPreviewKey=0;
function clearExports(){for(const id of ["cardDownload","cardPdf"]){const a=$(id);a.hidden=true;a.removeAttribute("href")}}
function drawCardPage(canvas,print){
 if(!front||!back)throw Error("Choose both original front/back images.");
 const p=printConfig("card"),[cw,ch]=$("cardSize").value.split("x").map(Number);
 const requested=Number($("cardPairs").value),gap=Number($("cardGap").value);
 if(!Number.isInteger(requested)||requested<1||requested>4||!Number.isFinite(gap)||gap<0||gap>20)throw Error("Invalid copies or gap.");
 const pairW=cw*2+gap,pairH=requested*ch+(requested-1)*gap;
 const availableW=p.w-2*p.margin,availableH=p.h-2*p.margin;
 if(pairW>availableW||pairH>availableH)throw Error("Cards do not fit this paper at real size. Select larger paper, fewer copies or smaller margin.");
 const x=anchorXY(p.position,p.w,p.h,pairW,pairH,p.margin,p.offsetX,p.offsetY);
 const ctx=canvas.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);
 const fx=canvas.width/p.w,fy=canvas.height/p.h;
 for(let i=0;i<requested;i++){const y=x.y+i*(ch+gap);fit(ctx,front,x.x*fx,y*fy,cw*fx,ch*fy);fit(ctx,back,(x.x+cw+gap)*fx,y*fy,cw*fx,ch*fy)}
 return {p,requested};
}
let schedule=0;
function requestCardPreview(){
 clearExports();cancelAnimationFrame(schedule);
 schedule=requestAnimationFrame(()=>{
  const canvas=$("cardPreviewCanvas");if(!front||!back)return;
  try{const p=printConfig("card"),dims=pageCanvasSize(p.w,p.h,96);
   canvas.width=dims.width;canvas.height=dims.height;
   const result=drawCardPage(canvas);
   $("cardPageInfo").textContent=result.requested+" pair(s) • "+p.w+"×"+p.h+" mm • drag to fine-tune position";
  }catch(e){$("cardPageInfo").textContent=e.message}
 });
}
bindPrintSettings("card",requestCardPreview);
for(const id of ["cardSize","cardPairs","cardGap"])$(id).addEventListener("input",requestCardPreview);
let moving=null;const sheet=$("cardPreviewCanvas");
sheet.addEventListener("pointerdown",e=>{if(!front||!back)return;moving={id:e.pointerId,x:e.clientX,y:e.clientY,ox:Number($("cardOffsetX").value),oy:Number($("cardOffsetY").value)};sheet.setPointerCapture(e.pointerId)});
sheet.addEventListener("pointermove",e=>{if(!moving||moving.id!==e.pointerId)return;const box=sheet.getBoundingClientRect(),p=printConfig("card");$("cardOffsetX").value=Math.max(-200,Math.min(200,Math.round((moving.ox+(e.clientX-moving.x)/box.width*p.w)*10)/10));$("cardOffsetY").value=Math.max(-200,Math.min(200,Math.round((moving.oy+(e.clientY-moving.y)/box.height*p.h)*10)/10));$("cardOffsetX").dispatchEvent(new Event("input"));$("cardOffsetY").dispatchEvent(new Event("input"))});
for(const eventName of ["pointerup","pointercancel","lostpointercapture"])sheet.addEventListener(eventName,()=>moving=null);
for(const id of ["cardFront","cardBack"])$(id).addEventListener("change",async()=>{
 try{const f=$("cardFront").files?.[0],b=$("cardBack").files?.[0];if(!f||!b)return;
  [front,back]=await Promise.all([imageOf(f),imageOf(b)]);
  if([front,back].some(i=>i.naturalWidth*i.naturalHeight>32000000))throw Error("Each image must be under 32 MP.");
  requestCardPreview();status("Original front and back ready. Adjust position or generate.");
 }catch(e){front=back=null;status(e.message,true)}
});
$("cardGenerate").addEventListener("click",async()=>{
 const btn=$("cardGenerate");btn.disabled=true;clearExports();
 try{
  if(!front||!back)[front,back]=await Promise.all([imageOf($("cardFront").files?.[0]),imageOf($("cardBack").files?.[0])]);
  const p=printConfig("card"),dims=pageCanvasSize(p.w,p.h),canvas=document.createElement("canvas");
  canvas.width=dims.width;canvas.height=dims.height;
  const result=drawCardPage(canvas);
  const blob=await new Promise((res,rej)=>canvas.toBlob(b=>b?res(b):rej(Error("Could not export sheet")),"image/png"));
  const src=url(blob),tag=p.paper.toUpperCase();
  $("cardPreview").src=src;$("cardPreview").hidden=false;
  $("cardDownload").href=src;$("cardDownload").download="Card-Page-"+tag+".png";$("cardDownload").hidden=false;
  if(!window.PDFLib)throw Error("PNG ready, PDF engine unavailable.");
  const pdf=await window.PDFLib.PDFDocument.create(),pic=await pdf.embedPng(await blob.arrayBuffer());
  pdf.addPage([pdfPts(p.w),pdfPts(p.h)]).drawImage(pic,{x:0,y:0,width:pdfPts(p.w),height:pdfPts(p.h)});
  $("cardPdf").href=url(new Blob([await pdf.save()],{type:"application/pdf"}));$("cardPdf").download="Card-Page-"+tag+".pdf";$("cardPdf").hidden=false;
  status(result.requested+" front/back pairs • "+tag+" • "+dims.dpi+" DPI • print at Actual Size.");
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
