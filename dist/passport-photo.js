import {bindPrintSettings,printConfig,pageCanvasSize,pdfPts,anchorXY,clamp} from "./smart-print-layout.js";
const $=id=>document.getElementById(id);
let image=null,sourceURL=null,sheetUrl=null,pdfUrl=null;
const DPI=300,mmToPx=mm=>Math.round(mm/25.4*DPI);
const status=(text,error=false)=>{$("passportStatus").textContent=text;$("passportStatus").classList.toggle("error",error)};
const mm=()=>{
 const custom=$("passportSize").value==="custom";
 const [w,h]=custom?[Number($("photoCustomW").value),Number($("photoCustomH").value)]:$("passportSize").value.split("x").map(Number);
 if(!Number.isFinite(w)||!Number.isFinite(h)||w<15||h<15||w>150||h>150)throw Error("Photo size must be 15–150 mm.");
 return [w,h];
};
function dispose(){for(const url of [sourceURL,sheetUrl,pdfUrl])if(url)URL.revokeObjectURL(url);sourceURL=sheetUrl=pdfUrl=null;}
function crop(ctx,w,h){
 if(!image)return;
 const ratio=Math.max(w/image.naturalWidth,h/image.naturalHeight)*Number($("photoZoom").value)/100;
 const drawW=image.naturalWidth*ratio,drawH=image.naturalHeight*ratio;
 const dx=(w-drawW)/2+(drawW-w)*Number($("panX").value)/200;
 const dy=(h-drawH)/2+(drawH-h)*Number($("panY").value)/200;
 ctx.fillStyle="white";ctx.fillRect(0,0,w,h);
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
 ctx.drawImage(image,dx,dy,drawW,drawH);
}
function preview(){
 if(!image)return;
 const [w,h]=mm(),canvas=$("passportPreview");canvas.width=mmToPx(w);canvas.height=mmToPx(h);
 const ctx=canvas.getContext("2d");
 crop(ctx,canvas.width,canvas.height);
 // Non-exported live composition guides: thirds and face-centering reference.
 ctx.strokeStyle="rgba(244,255,250,.58)";
 ctx.lineWidth=Math.max(2,canvas.width/220);
 ctx.setLineDash([Math.max(7,canvas.width/28),Math.max(6,canvas.width/38)]);
 for(const fraction of [1/3,2/3]){
  ctx.beginPath();ctx.moveTo(0,canvas.height*fraction);ctx.lineTo(canvas.width,canvas.height*fraction);ctx.stroke();
 }
 ctx.beginPath();ctx.moveTo(canvas.width/2,0);ctx.lineTo(canvas.width/2,canvas.height);ctx.stroke();
 ctx.setLineDash([]);
 $("passportCropStatus").textContent="Live crop: "+w+" × "+h+" mm • Zoom "+$("photoZoom").value+"%. Drag photo to reposition.";
 for(const [id,out] of [["photoZoom","zoomText"],["panX","panXText"],["panY","panYText"]])$(out).textContent=$(id).value+(id==="photoZoom"?"%":"");
}
$("passportInput").addEventListener("change",()=>{
 const file=$("passportInput").files?.[0];if(!file)return;
 if(file.size>35*1024*1024||!["image/png","image/jpeg","image/webp"].includes(file.type)){status("Choose a JPG/PNG/WebP under 35 MB",true);return}
 if(sourceURL)URL.revokeObjectURL(sourceURL);
 sourceURL=URL.createObjectURL(file);
 const img=new Image();img.onload=()=>{
  if(img.naturalWidth*img.naturalHeight>32e6){status("Image resolution exceeds 32 MP",true);return}
  image=img;
  $("passportSource").src=sourceURL;$("passportSource").hidden=false;
  $("makePhotos").disabled=false;preview();
  status("Live crop ready. Drag the picture inside green frame, or use Face / Body presets.");requestSheetPreview();
 };img.onerror=()=>status("Invalid photo",true);img.src=sourceURL;
});
for(const id of ["passportSize","photoZoom","panX","panY","photoCustomW","photoCustomH"])$(id).addEventListener("input",()=>{ $("customPhotoFields").hidden=$("passportSize").value!=="custom";try{preview()}catch(e){status(e.message,true)} });
function resetFraming(zoom=100){
 $("photoZoom").value=zoom;$("panX").value=0;$("panY").value=0;preview();
}
$("faceClose").addEventListener("click",()=>resetFraming(170));
$("upperBody").addEventListener("click",()=>resetFraming(125));
$("fullPortrait").addEventListener("click",()=>resetFraming(100));
$("resetCrop").addEventListener("click",()=>resetFraming(100));
const cropCanvas=$("passportPreview");
let pointerStart=null;
cropCanvas.addEventListener("pointerdown",event=>{
 if(!image)return;
 event.preventDefault();
 cropCanvas.setPointerCapture(event.pointerId);
 pointerStart={id:event.pointerId,x:event.clientX,y:event.clientY,
   panX:Number($("panX").value),panY:Number($("panY").value)};
 cropCanvas.style.cursor="grabbing";
});
cropCanvas.addEventListener("pointermove",event=>{
 if(!pointerStart||pointerStart.id!==event.pointerId||!image)return;
 event.preventDefault();
 const rect=cropCanvas.getBoundingClientRect();
 const ratio=Math.max(cropCanvas.width/image.naturalWidth,cropCanvas.height/image.naturalHeight)
   *Number($("photoZoom").value)/100;
 const extraW=image.naturalWidth*ratio-cropCanvas.width;
 const extraH=image.naturalHeight*ratio-cropCanvas.height;
 const dx=(event.clientX-pointerStart.x)/Math.max(1,rect.width);
 const dy=(event.clientY-pointerStart.y)/Math.max(1,rect.height);
 const px=extraW>0.1?pointerStart.panX+dx*(cropCanvas.width/extraW)*200:0;
 const py=extraH>0.1?pointerStart.panY+dy*(cropCanvas.height/extraH)*200:0;
 $("panX").value=Math.max(-100,Math.min(100,Math.round(px)));
 $("panY").value=Math.max(-100,Math.min(100,Math.round(py)));
 preview();
});
function stopPointer(){pointerStart=null;cropCanvas.style.cursor="grab"}
cropCanvas.addEventListener("pointerup",stopPointer);
cropCanvas.addEventListener("pointercancel",stopPointer);
cropCanvas.addEventListener("lostpointercapture",stopPointer);

const asBlob=(canvas,type="image/png",quality=.92)=>new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error("Image export failed")),type,quality));
function clearPassportExports(){
 for(const id of ["downloadPassport","passportPdf"]){$(id).hidden=true;$(id).removeAttribute("href")}
}
function layoutPhotoSheet(canvas){
 if(!image)throw Error("Upload a photograph first.");
 const p=printConfig("passport"),[pw,ph]=mm(),gap=3;
 const copies=Number($("copies").value);
 if(!Number.isInteger(copies)||copies<1||copies>25)throw Error("Invalid photo copies.");
 const usableW=p.w-2*p.margin,usableH=p.h-2*p.margin;
 const cols=Math.floor((usableW+gap)/(pw+gap)),rows=Math.floor((usableH+gap)/(ph+gap));
 if(cols<1||rows<1)throw Error("Photo does not fit paper. Select larger paper or smaller photo.");
 const count=Math.min(copies,cols*rows),actualRows=Math.ceil(count/cols);
 const groupCols=Math.min(count,cols),groupW=groupCols*pw+(groupCols-1)*gap;
 const groupH=actualRows*ph+(actualRows-1)*gap;
 const pos=anchorXY(p.position,p.w,p.h,groupW,groupH,p.margin,p.offsetX,p.offsetY);
 const ctx=canvas.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);
 const fx=canvas.width/p.w,fy=canvas.height/p.h;
 const small=document.createElement("canvas");small.width=Math.max(1,Math.round(pw*fx));small.height=Math.max(1,Math.round(ph*fy));
 crop(small.getContext("2d"),small.width,small.height);
 for(let i=0;i<count;i++){
  const x=(pos.x+(i%cols)*(pw+gap))*fx,y=(pos.y+Math.floor(i/cols)*(ph+gap))*fy;
  ctx.drawImage(small,x,y,pw*fx,ph*fy);
  ctx.lineWidth=Math.max(.5,canvas.width/2500);ctx.strokeStyle="#aaa";ctx.strokeRect(x,y,pw*fx,ph*fy);
 }
 return {p,count,capacity:cols*rows};
}
let photoPreviewFrame=0;
function requestSheetPreview(){
 clearPassportExports();if(!image)return;
 cancelAnimationFrame(photoPreviewFrame);
 photoPreviewFrame=requestAnimationFrame(()=>{
  try{
   const p=printConfig("passport"),d=pageCanvasSize(p.w,p.h,92),canvas=$("passportSheetCanvas");
   canvas.width=d.width;canvas.height=d.height;
   const result=layoutPhotoSheet(canvas);
   $("passportPageInfo").textContent=result.count+" photos • "+p.w+"×"+p.h+" mm • capacity "+result.capacity+" • drag preview to move";
  }catch(e){$("passportPageInfo").textContent=e.message}
 });
}
bindPrintSettings("passport",requestSheetPreview);
for(const id of ["copies","passportSize","photoZoom","panX","panY","photoCustomW","photoCustomH"])$(id).addEventListener("input",requestSheetPreview);

let sheetMove=null;const sheetCanvas=$("passportSheetCanvas");
sheetCanvas.addEventListener("pointerdown",e=>{if(!image)return;sheetMove={id:e.pointerId,x:e.clientX,y:e.clientY,ox:Number($("passportOffsetX").value),oy:Number($("passportOffsetY").value)};sheetCanvas.setPointerCapture(e.pointerId)});
sheetCanvas.addEventListener("pointermove",e=>{
 if(!sheetMove||sheetMove.id!==e.pointerId)return;
 const r=sheetCanvas.getBoundingClientRect(),p=printConfig("passport");
 $("passportOffsetX").value=clamp(sheetMove.ox+(e.clientX-sheetMove.x)/r.width*p.w,-200,200).toFixed(1);
 $("passportOffsetY").value=clamp(sheetMove.oy+(e.clientY-sheetMove.y)/r.height*p.h,-200,200).toFixed(1);
 $("passportOffsetX").dispatchEvent(new Event("input"));
});
for(const type of ["pointerup","pointercancel","lostpointercapture"])sheetCanvas.addEventListener(type,()=>sheetMove=null);
$("makePhotos").addEventListener("click",async()=>{
 if(!image)return;
 const button=$("makePhotos");button.disabled=true;clearPassportExports();
 try{
  const p=printConfig("passport"),d=pageCanvasSize(p.w,p.h),canvas=document.createElement("canvas");
  canvas.width=d.width;canvas.height=d.height;
  const result=layoutPhotoSheet(canvas),imageBlob=await asBlob(canvas),tag=p.paper.toUpperCase();
  if(sheetUrl)URL.revokeObjectURL(sheetUrl);sheetUrl=URL.createObjectURL(imageBlob);
  $("passportSheet").src=sheetUrl;$("passportSheet").hidden=false;
  $("downloadPassport").href=sheetUrl;$("downloadPassport").download="Passport-Photos-"+tag+".png";$("downloadPassport").hidden=false;
  if(!window.PDFLib)throw Error("PNG created but PDF library is unavailable.");
  const pdf=await window.PDFLib.PDFDocument.create(),bytes=await pdf.embedPng(await imageBlob.arrayBuffer());
  pdf.addPage([pdfPts(p.w),pdfPts(p.h)]).drawImage(bytes,{x:0,y:0,width:pdfPts(p.w),height:pdfPts(p.h)});
  if(pdfUrl)URL.revokeObjectURL(pdfUrl);
  pdfUrl=URL.createObjectURL(new Blob([await pdf.save()],{type:"application/pdf"}));
  $("passportPdf").href=pdfUrl;$("passportPdf").download="Passport-Photos-"+tag+".pdf";$("passportPdf").hidden=false;
  status(result.count+" photos on "+tag+" at "+d.dpi+" DPI. Print Actual Size / 100%.");
 }catch(e){status(e.message||"Could not make sheet",true)}finally{button.disabled=false}
});
window.addEventListener("pagehide",dispose);
