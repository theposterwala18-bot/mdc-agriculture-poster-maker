// The Poster Wala — Original Aadhaar Auto Print Layout v2.
// All PDF/image bytes and passwords stay in this browser. NEVER upload Aadhaar data.
const $=id=>document.getElementById(id);
const RENDER_DPI=300,mmPx=mm=>Math.round(mm*RENDER_DPI/25.4);
const PAPER_MM={a3:[297,420],a4:[210,297],a5:[148,210],a6:[105,148],letter:[215.9,279.4],legal:[215.9,355.6],executive:[184.2,266.7],"2x2":[50.8,50.8],"3.5x5":[88.9,127],"4x6":[101.6,152.4],"5x7":[127,177.8],"6x8":[152.4,203.2],"8x10":[203.2,254],"8x12":[203.2,304.8],"10x12":[254,304.8],"12x18":[304.8,457.2]};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
let placement={x:.5,y:.5},positionPreset="center",moveDrag=null;
const state={source:null,sourceView:null,regions:[],active:0,pdf:null,loading:null,drag:null,previewFrame:0,urls:[],generated:false};
const report=(msg,err=false)=>{$("aadhaarStatus").textContent=msg;$("aadhaarStatus").classList.toggle("error",err)};
function clearURLs(){for(const u of state.urls)URL.revokeObjectURL(u);state.urls=[]}
function clearDownloads(){clearURLs();$("aadhaarPng").hidden=true;$("aadhaarPdfDownload").hidden=true;state.generated=false}
function makeCanvas(w,h){const c=document.createElement("canvas");c.width=Math.max(1,Math.round(w));c.height=Math.max(1,Math.round(h));return c}
function validSource(){return !!state.source && state.regions.length===2}
function requireNumbers(){
 const w=Number($("cardWidth").value),h=Number($("cardHeight").value),margin=Number($("marginMm").value),gap=Number($("gapMm").value);
 if(!Number.isFinite(w)||w<40||w>190||!Number.isFinite(h)||h<25||h>150||!Number.isFinite(margin)||margin<3||margin>35||!Number.isFinite(gap)||gap<0||gap>20)throw Error("Print sizes must be within the allowed millimetre limits.");
 return {w,h,margin,gap};
}
function paper(){
 const landscape=$("orientation").value==="landscape";
 const key=$("paperType").value;
 const [w,h]=key==="custom"?[Number($("customPaperWidth").value),Number($("customPaperHeight").value)]:(PAPER_MM[key]||PAPER_MM.a4);
 if(!Number.isFinite(w)||!Number.isFinite(h)||w<50||w>1000||h<50||h>1000)throw Error("Paper size must be 50–1000 mm.");
 return landscape?[h,w]:[w,h];
}
function normalRegion(rect){
 return {x:Math.max(0,Math.min(1,rect.x)),y:Math.max(0,Math.min(1,rect.y)),
 w:Math.max(.02,Math.min(1-rect.x,rect.w)),h:Math.max(.02,Math.min(1-rect.y,rect.h))};
}
function suggestRegions(mode){
 if(!state.source)return;
 // Suggestions are deliberately NOT presented as reliable Aadhaar detection:
 // typical e-Aadhaar lower card strip may be side-by-side or stacked.
 state.regions=(mode==="stacked"
 ?[{x:.12,y:.60,w:.76,h:.16},{x:.12,y:.79,w:.76,h:.16}]
 :[{x:.075,y:.74,w:.42,h:.20},{x:.505,y:.74,w:.42,h:.20}]).map(normalRegion);
 drawSource();requestPreview();
 $("selectionMessage").textContent="Suggested crop only. Check that the full front and back appear inside the boxes; drag a new rectangle to correct.";
}
function setRegionsForTwoImages(){
 state.regions=[{x:0,y:0,w:.5,h:1},{x:.5,y:0,w:.5,h:1}];
 state.active=0;drawSource();requestPreview();
}
function drawSource(){
 const source=state.source,view=$("sourceCanvas");
 if(!source){view.width=1;view.height=1;return}
 view.width=source.width;view.height=source.height;
 const ctx=view.getContext("2d");ctx.drawImage(source,0,0);
 state.regions.forEach((r,i)=>{
  const x=r.x*view.width,y=r.y*view.height,w=r.w*view.width,h=r.h*view.height;
  ctx.strokeStyle=i===0?"#0a954a":"#da6e15";
  ctx.lineWidth=Math.max(3,view.width/250);
  ctx.setLineDash([Math.max(7,view.width/90),Math.max(5,view.width/130)]);
  ctx.strokeRect(x,y,w,h);ctx.setLineDash([]);
  // label only as preview overlay — never included in extracted print content.
  const fontSize=Math.max(15,view.width/48);ctx.font="bold "+fontSize+"px sans-serif";
  const label=i===0?"FRONT":"BACK";const tx=Math.max(0,x),ty=Math.max(fontSize+3,y-5);
  ctx.fillStyle="#14372e";ctx.fillRect(tx,ty-fontSize-2,fontSize*3.6,fontSize+8);
  ctx.fillStyle="white";ctx.fillText(label,tx+5,ty+1);
 });
}
function activate(index){
 state.active=index;
 for(const [i,id] of ["selectFront","selectBack"].entries()){
  $(id).classList.toggle("active",i===index);$(id).setAttribute("aria-pressed",String(i===index));
 }
}
function onPointerDown(event){
 if(!state.source||$("sourceType").value!=="pdf")return;
 event.preventDefault();const rect=$("sourceCanvas").getBoundingClientRect();
 const x=Math.min(1,Math.max(0,(event.clientX-rect.left)/rect.width));
 const y=Math.min(1,Math.max(0,(event.clientY-rect.top)/rect.height));
 state.drag={id:event.pointerId,x,y};$("sourceCanvas").setPointerCapture(event.pointerId);
}
function onPointerMove(event){
 if(!state.drag||event.pointerId!==state.drag.id)return;
 event.preventDefault();const rect=$("sourceCanvas").getBoundingClientRect();
 const x=Math.min(1,Math.max(0,(event.clientX-rect.left)/rect.width));
 const y=Math.min(1,Math.max(0,(event.clientY-rect.top)/rect.height));
 const sx=Math.min(state.drag.x,x),sy=Math.min(state.drag.y,y),w=Math.abs(x-state.drag.x),h=Math.abs(y-state.drag.y);
 if(w<.015||h<.015)return;
 state.regions[state.active]=normalRegion({x:sx,y:sy,w,h});drawSource();requestPreview();
}
function onPointerUp(event){
 if(state.drag?.id===event.pointerId){
  state.drag=null;$("selectionMessage").textContent=(state.active===0?"Front":"Back")+" selection updated. Check live page preview.";
 }
}
$("sourceCanvas").addEventListener("pointerdown",onPointerDown);
$("sourceCanvas").addEventListener("pointermove",onPointerMove);
$("sourceCanvas").addEventListener("pointerup",onPointerUp);
$("sourceCanvas").addEventListener("pointercancel",onPointerUp);
$("sourceCanvas").addEventListener("lostpointercapture",onPointerUp);
$("selectFront").addEventListener("click",()=>activate(0));
$("selectBack").addEventListener("click",()=>activate(1));
$("suggestSide").addEventListener("click",()=>suggestRegions("side"));
$("suggestStacked").addEventListener("click",()=>suggestRegions("stacked"));
$("resetRegions").addEventListener("click",()=>suggestRegions("side"));
async function decodeImage(file){
 if(!file||!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>20*1048576)throw Error("Use JPG/PNG/WebP under 20 MB");
 const url=URL.createObjectURL(file);
 try{return await new Promise((ok,bad)=>{
  const image=new Image();image.onload=()=>{if(image.naturalWidth*image.naturalHeight>24000000)bad(Error("Image exceeds 24 MP"));else ok(image)};
  image.onerror=()=>bad(Error("Image could not be decoded"));image.src=url;
 })}finally{URL.revokeObjectURL(url)}
}
async function loadImages(){
 const [front,back]=await Promise.all([decodeImage($("aadhaarFront").files?.[0]),decodeImage($("aadhaarBack").files?.[0])]);
 const w=1000,h=620,src=makeCanvas(w*2,h),ctx=src.getContext("2d");
 ctx.fillStyle="white";ctx.fillRect(0,0,src.width,src.height);
 for(const [i,image] of [front,back].entries()){
  const scale=Math.min((w-20)/image.naturalWidth,(h-20)/image.naturalHeight);
  const dw=image.naturalWidth*scale,dh=image.naturalHeight*scale;
  ctx.drawImage(image,i*w+(w-dw)/2,(h-dh)/2,dw,dh);
 }
 state.source=src;state.pdf=null;setRegionsForTwoImages();$("makeLayout").disabled=false;
 $("selectionMessage").textContent="Original images arranged side by side. Export preserves them without editing.";
 report("Two original images ready. Print layout shown on the right.");
}
$("loadImages").addEventListener("click",async()=>{try{await loadImages()}catch(e){report(e.message,true)}});
function destroyPdf(){if(state.loading){try{state.loading.destroy()}catch{}state.loading=null}if(state.pdf){try{state.pdf.destroy()}catch{}state.pdf=null}}
async function renderPdfPage(pageIndex){
 if(!state.pdf)return;
 const page=await state.pdf.getPage(pageIndex);
 const base=page.getViewport({scale:1});
 const scale=Math.min(3,2600/Math.max(base.width,base.height));
 const viewport=page.getViewport({scale});
 const canvas=makeCanvas(viewport.width,viewport.height);
 await page.render({canvasContext:canvas.getContext("2d"),viewport}).promise;
 state.source=canvas;
 suggestRegions("side");
 $("makeLayout").disabled=false;
 $("selectionMessage").textContent="PDF Page "+pageIndex+" loaded. Side-by-side regions suggested. These boxes are NOT guaranteed detection: choose Front/Back and drag the correct lower-card rectangles.";
 report("PDF rendered locally. Select both original card regions, then check preview.");
}
async function loadPdf(){
 const file=$("aadhaarPdf").files?.[0];
 if(!file||file.size<1||file.size>30*1048576||!(/\.pdf$/i.test(file.name)||file.type==="application/pdf"))throw Error("Select an original PDF under 30 MB");
 const pdfjs=window.pdfjsLib;if(!pdfjs)throw Error("PDF renderer unavailable. Check internet and refresh.");
 pdfjs.GlobalWorkerOptions.workerSrc="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
 destroyPdf();
 // The browser prompts for the genuine document's existing password if needed.
 // Neither user password nor PDF bytes leave this page.
 const loading=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),useSystemFonts:true,isEvalSupported:false,enableScripting:false});
 state.loading=loading;
 loading.onPassword=(accept,reason)=>{
  const bad=reason===pdfjs.PasswordResponses.INCORRECT_PASSWORD;
  const value=window.prompt(bad?"Wrong PDF password. Enter the correct document password:":"Enter the original PDF password to open locally:");
  if(value===null){loading.destroy();return}accept(value);
 };
 try{
  const pdf=await loading.promise;
  state.pdf=pdf;state.loading=null;
  if(pdf.numPages>20)throw Error("PDF has too many pages for this tool (max 20)");
  const select=$("pdfPage");select.replaceChildren();
  for(let i=1;i<=pdf.numPages;i++){const option=document.createElement("option");option.value=String(i);option.textContent="Page "+i;select.append(option)}
  select.disabled=false;await renderPdfPage(1);
 }catch(error){if(state.loading===loading)state.loading=null;throw Error(error?.message||"Unable to open this PDF. Check password and file compatibility.")}
}
$("loadPdf").addEventListener("click",async()=>{const button=$("loadPdf");button.disabled=true;report("Opening original PDF locally…");try{await loadPdf()}catch(e){report(e.message,true)}finally{button.disabled=false}});
$("pdfPage").addEventListener("change",async()=>{try{await renderPdfPage(Number($("pdfPage").value))}catch(e){report(e.message,true)}});
$("sourceType").addEventListener("change",()=>{
 const isPdf=$("sourceType").value==="pdf";$("pdfInputs").hidden=!isPdf;$("imageInputs").hidden=isPdf;
 state.source=null;state.regions=[];$("makeLayout").disabled=true;clearDownloads();
 $("sourceCanvas").width=1;$("layoutCanvas").width=1;report("Select your source.");
});
function extractRegion(region){
 const source=state.source;if(!source||!region)throw Error("Select genuine front/back first");
 const x=Math.max(0,Math.floor(region.x*source.width)),y=Math.max(0,Math.floor(region.y*source.height));
 const w=Math.min(source.width-x,Math.max(1,Math.round(region.w*source.width)));
 const h=Math.min(source.height-y,Math.max(1,Math.round(region.h*source.height)));
 const canvas=makeCanvas(w,h);
 canvas.getContext("2d").drawImage(source,x,y,w,h,0,0,w,h);
 return canvas;
}
function drawFit(ctx,image,x,y,w,h){
 // Draw contained original crop; no stretch, details manipulation or reconstruction.
 const scale=Math.min(w/image.width,h/image.height);
 const dw=image.width*scale,dh=image.height*scale;
 ctx.fillStyle="#fff";ctx.fillRect(x,y,w,h);
 ctx.drawImage(image,x+(w-dw)/2,y+(h-dh)/2,dw,dh);
}
function layoutSpec(){
 const {w,h,margin,gap}=requireNumbers();
 const [pw,ph]=paper(),mode=$("layoutPreset").value;
 const count=mode==="kyc"?1:Number(mode);
 const availableW=pw-margin*2,availableH=ph-margin*2;
 if(availableW<=0||availableH<=0)throw Error("Margins exceed page size");
 // One card pair = front + back. KYC is stacked vertically; ordinary pairs are side-by-side.
 const pairW=mode==="kyc"?w:2*w+gap;
 const pairH=mode==="kyc"?2*h+gap:h;
 const fullH=count*pairH+(count-1)*gap;
 const scale=Math.min(1,availableW/pairW,availableH/fullH);
 if(scale<.27)throw Error("Requested pairs cannot fit legibly. Reduce copies/card size.");
 return {pw,ph,w,h,gap,margin,mode,count,scale,actualW:w*scale,actualH:h*scale,autoReduced:scale<.999};
}
function drawPrint(ctx,pixelW,pixelH){
 if(!validSource())throw Error("Choose both genuine front and back");
 const spec=layoutSpec(),{pw,ph,w,h,gap,count,mode,scale}=spec;
 const fx=pixelW/pw,fy=pixelH/ph;
 ctx.fillStyle="#fff";ctx.fillRect(0,0,pixelW,pixelH);
 const front=extractRegion(state.regions[0]),back=extractRegion(state.regions[1]);
 const pairW=(mode==="kyc"?w:2*w+gap)*scale;
 const pairH=(mode==="kyc"?2*h+gap:h)*scale;
 const gapScaled=gap*scale,combinedH=count*pairH+(count-1)*gapScaled;
 const minX=spec.margin,minY=spec.margin,maxX=pw-spec.margin-pairW,maxY=ph-spec.margin-combinedH;
 const baseX=minX+Math.max(0,maxX-minX)*placement.x,top=minY+Math.max(0,maxY-minY)*placement.y;
 const original=[front,back];
 for(let i=0;i<count;i++){
  const baseY=top+i*(pairH+gapScaled);
  for(let j=0;j<2;j++){
   const x=baseX+(mode==="kyc"?0:j*(w+gap)*scale);
   const y=baseY+(mode==="kyc"?j*(h+gap)*scale:0);
   const dx=x*fx,dy=y*fy,dw=w*scale*fx,dh=h*scale*fy;
   drawFit(ctx,original[j],dx,dy,dw,dh);
   if($("cutGuides").checked){ctx.strokeStyle="#aaa";ctx.lineWidth=Math.max(1,pixelW/2800);ctx.strokeRect(dx,dy,dw,dh)}
  }
 }
 return spec;
}
function requestPreview(){
 if(state.previewFrame)cancelAnimationFrame(state.previewFrame);
 state.previewFrame=requestAnimationFrame(()=>{
  state.previewFrame=0;
  if(!validSource())return;
  try{
   const spec=layoutSpec(),preview=$("layoutCanvas"),edge=750;
   const width=spec.pw>=spec.ph?edge:Math.round(edge*spec.pw/spec.ph);
   const height=Math.round(width*spec.ph/spec.pw);
   preview.width=width;preview.height=height;
   drawPrint(preview.getContext("2d"),width,height);
   $("layoutInfo").textContent=spec.count+" pair(s) • "+spec.actualW.toFixed(1)+" × "+spec.actualH.toFixed(1)+" mm"+
    (spec.autoReduced?" • AUTO REDUCED to fit; check if acceptable":" • Actual selected card dimensions");
  }catch(error){$("layoutInfo").textContent=error.message}
 });
}
function savePrefs(){try{const ids=["layoutPreset","paperType","orientation","customPaperWidth","customPaperHeight","cardWidth","cardHeight","marginMm","gapMm"];localStorage.setItem("tpw-print-layout-v21",JSON.stringify({values:Object.fromEntries(ids.map(id=>[id,$(id).value])),cutGuides:$("cutGuides").checked,placement,positionPreset}))}catch{}}
function refreshPositions(){
 for(const b of document.querySelectorAll("#positionGrid button")){const active=b.dataset.pos===positionPreset;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active))}
 $("positionInfo").textContent=positionPreset==="custom"?"Custom position (dragged)":positionPreset.replace(/-/g," ");
}
function setPosition(name){
 const point={top:0,middle:.5,bottom:1,left:0,center:.5,right:1};
 const [v,h]=name==="center"?["middle","center"]:name.split("-");
 placement={x:point[h],y:point[v]};positionPreset=name;refreshPositions();clearDownloads();requestPreview();savePrefs();
}
for(const b of document.querySelectorAll("#positionGrid button"))b.addEventListener("click",()=>setPosition(b.dataset.pos));
function updateCustom(){const active=$("paperType").value==="custom";$("customWidthField").hidden=!active;$("customHeightField").hidden=!active;}
try{const s=JSON.parse(localStorage.getItem("tpw-print-layout-v21")||"null");if(s){for(const [id,v] of Object.entries(s.values||{})){const el=$(id);if(!el||typeof v!=="string")continue;if(el.tagName==="SELECT"&&!Array.from(el.options).some(o=>o.value===v))continue;el.value=v} $("cutGuides").checked=s.cutGuides!==false;if(Number.isFinite(s.placement?.x)&&Number.isFinite(s.placement?.y))placement={x:clamp(s.placement.x,0,1),y:clamp(s.placement.y,0,1)};positionPreset=typeof s.positionPreset==="string"?s.positionPreset:"center"}}catch{}
updateCustom();refreshPositions();
const previewCanvas=$("layoutCanvas");
previewCanvas.style.cursor="grab";previewCanvas.style.touchAction="none";
previewCanvas.addEventListener("pointerdown",e=>{if(!validSource())return;e.preventDefault();moveDrag={id:e.pointerId,x:e.clientX,y:e.clientY,start:{...placement}};previewCanvas.setPointerCapture(e.pointerId);previewCanvas.style.cursor="grabbing"});
previewCanvas.addEventListener("pointermove",e=>{
 if(!moveDrag||e.pointerId!==moveDrag.id)return;
 try{
 const s=layoutSpec(),r=previewCanvas.getBoundingClientRect(),groupW=(s.mode==="kyc"?s.w:2*s.w+s.gap)*s.scale,groupH=s.count*(s.mode==="kyc"?2*s.h+s.gap:s.h)*s.scale+(s.count-1)*s.gap*s.scale;
 const availableX=s.pw-2*s.margin-groupW,availableY=s.ph-2*s.margin-groupH;
 if(availableX>0)placement.x=clamp(moveDrag.start.x+(e.clientX-moveDrag.x)/r.width*s.pw/availableX,0,1);
 if(availableY>0)placement.y=clamp(moveDrag.start.y+(e.clientY-moveDrag.y)/r.height*s.ph/availableY,0,1);
 positionPreset="custom";refreshPositions();clearDownloads();requestPreview();
 }catch{}
});
function finishMove(e){if(moveDrag&&moveDrag.id===e.pointerId){moveDrag=null;previewCanvas.style.cursor="grab";savePrefs()}}
previewCanvas.addEventListener("pointerup",finishMove);previewCanvas.addEventListener("pointercancel",finishMove);previewCanvas.addEventListener("lostpointercapture",finishMove);
for(const id of ["layoutPreset","paperType","orientation","customPaperWidth","customPaperHeight","cardWidth","cardHeight","marginMm","gapMm","cutGuides"]){
 $(id).addEventListener("input",()=>{updateCustom();clearDownloads();requestPreview();savePrefs()});
}
function toBlob(canvas,type="image/png"){
 return new Promise((ok,bad)=>canvas.toBlob(b=>b?ok(b):bad(Error("Cannot export image")),type));
}
function putDownload(id,blob,name){
 const link=$(id),url=URL.createObjectURL(blob);state.urls.push(url);link.href=url;link.download=name;link.hidden=false;
}
$("makeLayout").addEventListener("click",async()=>{
 const button=$("makeLayout");button.disabled=true;clearDownloads();report("Creating print layout…");
 try{
  const spec=layoutSpec(),canvas=makeCanvas(mmPx(spec.pw),mmPx(spec.ph));
  drawPrint(canvas.getContext("2d"),canvas.width,canvas.height);
  const png=await toBlob(canvas),label=$("paperType").value.toUpperCase();putDownload("aadhaarPng",png,"Aadhaar-Original-Print-"+label+".png");
  if(!window.PDFLib)throw Error("PNG created, but PDF export library is unavailable.");
  const pdf=await window.PDFLib.PDFDocument.create();
  const embedded=await pdf.embedPng(await png.arrayBuffer());
  // PDF coordinate geometry is in points; actual physical size preserved.
  pdf.addPage([spec.pw*72/25.4,spec.ph*72/25.4]).drawImage(embedded,{x:0,y:0,width:spec.pw*72/25.4,height:spec.ph*72/25.4});
  putDownload("aadhaarPdfDownload",new Blob([await pdf.save()],{type:"application/pdf"}),"Aadhaar-Original-Print-"+label+".pdf");
  state.generated=true;requestPreview();
  report("Ready: "+label+" PDF + PNG. "+(spec.autoReduced?"Card size auto-reduced to fit the page.":"Card size preserved.")+" Print at Actual Size.");
 }catch(error){report(error.message||"Export failed",true)}
 finally{button.disabled=false}
});
$("autoTab").addEventListener("click",()=>setTab(true));
$("originalTab").addEventListener("click",()=>setTab(false));
function setTab(auto){
 $("autoPanel").hidden=!auto;$("originalPanel").hidden=auto;
 $("autoTab").classList.toggle("active",auto);$("originalTab").classList.toggle("active",!auto);
 $("autoTab").setAttribute("aria-selected",String(auto));$("originalTab").setAttribute("aria-selected",String(!auto));
}
let viewerUrl=null;
$("openOriginal").addEventListener("click",()=>{
 const f=$("viewerPdf").files?.[0];if(!f||f.size<1||f.size>30*1048576||!(/\.pdf$/i.test(f.name)||f.type==="application/pdf")){report("Choose original PDF under 30 MB",true);return}
 if(viewerUrl)URL.revokeObjectURL(viewerUrl);
 viewerUrl=URL.createObjectURL(f);
 const frame=document.createElement("iframe");frame.title="Original e-Aadhaar PDF";frame.src=viewerUrl;
 frame.style.cssText="width:100%;height:650px;border:0";
 $("originalFrame").replaceChildren(frame);
});
window.addEventListener("pagehide",()=>{clearURLs();destroyPdf();if(viewerUrl)URL.revokeObjectURL(viewerUrl)});
