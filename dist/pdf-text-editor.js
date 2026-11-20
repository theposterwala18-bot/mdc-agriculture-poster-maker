// The Poster Wala PDF editor: all documents stay in this browser. Edited pages are
// raster-flattened before PDF export so covered old text is not hidden/searchable.
const $=id=>document.getElementById(id);
const state={pdf:null,bytes:null,task:null,page:1,mode:"select",source:null,items:[],selection:null,patches:{},undo:[],redo:[],urls:[],drag:null,generation:0};
const escapeRect=r=>({x:Math.max(0,Math.min(1,r.x)),y:Math.max(0,Math.min(1,r.y)),w:Math.max(.001,Math.min(1-r.x,r.w)),h:Math.max(.001,Math.min(1-r.y,r.h))});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const status=(message,error=false)=>{$("editorStatus").textContent=message;$("editorStatus").classList.toggle("error",error)};
const pdfjs=()=>window.pdfjsLib;
const entries=page=>state.patches[page]||[];
const clonePatches=()=>JSON.parse(JSON.stringify(state.patches));
function releaseDownloads(){for(const u of state.urls)URL.revokeObjectURL(u);state.urls=[];$("downloadEdited").hidden=true;$("downloadEdited").removeAttribute("href")}
function history(){state.undo.push(clonePatches());if(state.undo.length>35)state.undo.shift();state.redo.length=0;releaseDownloads();refreshHistory()}
function refreshHistory(){$("undoEdit").disabled=!state.undo.length;$("redoEdit").disabled=!state.redo.length}
function commit(next){history();state.patches=next;drawEdits();status("Unsaved edits. Check the preview and export when ready.")}
function recordPatch(patch){
 const data=clonePatches();if(!data[state.page])data[state.page]=[];
 data[state.page].push(patch);commit(data);state.selection={kind:"patch",id:patch.id,page:state.page};drawEdits();syncSelection();
}
let patchSerial=0;
const uid=()=>++patchSerial;
function updateSelectedPatch(edit){
 const s=state.selection;if(!s||s.kind!=="patch")return;
 const next=clonePatches(),item=(next[s.page]||[]).find(p=>p.id===s.id);
 if(!item)return;Object.assign(item,edit);commit(next);
}
function deleteSelectedPatch(){const s=state.selection;if(!s||s.kind!=="patch")return;const next=clonePatches();next[s.page]=(next[s.page]||[]).filter(p=>p.id!==s.id);state.selection=null;commit(next)}
function undo(){if(!state.undo.length)return;state.redo.push(clonePatches());state.patches=state.undo.pop();state.selection=null;drawEdits();syncSelection();refreshHistory();releaseDownloads()}
function redo(){if(!state.redo.length)return;state.undo.push(clonePatches());state.patches=state.redo.pop();state.selection=null;drawEdits();syncSelection();refreshHistory();releaseDownloads()}
$("undoEdit").addEventListener("click",undo);$("redoEdit").addEventListener("click",redo);
document.addEventListener("keydown",e=>{if(!(e.ctrlKey||e.metaKey)||e.altKey)return;if(/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||""))return;if(e.key.toLowerCase()==="z"){e.preventDefault();e.shiftKey?redo():undo()}else if(e.key.toLowerCase()==="y"){e.preventDefault();redo()}});
function setMode(mode){state.mode=mode;state.selection=null;syncSelection();const paper=$("editPaper");for(const k of ["select","add","cover"]){$(k+"Mode").classList.toggle("mode-active",mode===k);paper.classList.toggle(k+"-mode",mode===k)}drawEdits();$("selectionInfo").textContent=mode==="select"?"Click original text; each extracted text run can be edited.":mode==="add"?"Click a point on the page to add new text.":"Drag a rectangle to cover an area on the page; edited page is flattened on export."}
for(const k of ["select","add","cover"])$(k+"Mode").addEventListener("click",()=>setMode(k));
function formatFromControls(){return {font:$("editFont").value,size:Number($("editFontSize").value),color:$("editColor").value,bg:$("coverColor").value,align:$("editAlign").value,bold:$("editBold").value==="bold"}}
function validFormat(f){if(!Number.isFinite(f.size)||f.size<5||f.size>96)throw Error("Font size must be 5–96 pt.")}
function pageScale(){return Number($("editZoom").value)}
function styleFor(item){const f=item.font;return f==="auto"?(item.sourceFont||"Arial, sans-serif"):f}
function drawPatch(ctx,patch,pw,ph){
 const r=patch.rect,x=r.x*pw,y=r.y*ph,w=r.w*pw,h=r.h*ph,info=patch.format||{};
 ctx.save();ctx.fillStyle=info.bg||"#ffffff";ctx.fillRect(x-1,y-1,w+2,h+2);
 if(patch.type!=="cover"&&patch.text){
  const fontPt=clamp(Number(info.size)||12,5,96),px=fontPt*pw/(state.exportPageWidth||pw/Math.max(.001,pageScale()))*1.0;
  // Screen page has an independent scale from the exported canvas.
  const actualPx=fontPt*pw/(patch.pageWidthPt||pw); // pt -> page pixels
  ctx.font=(info.bold?"bold ":"")+actualPx+"px "+styleFor({...info,sourceFont:patch.sourceFont});
  ctx.fillStyle=info.color||"#111111";
  ctx.textBaseline="top";ctx.textAlign=info.align||"left";
  const bx=info.align==="center"?x+w/2:info.align==="right"?x+w:x;
  const lines=patch.text.split("\n"),lineHeight=actualPx*1.17;
  for(let i=0;i<lines.length;i++){
   if(y+i*lineHeight>ph)break;
   // Replacement may be longer than the original; shrink to fit within its box if needed.
   const text=lines[i];let size=actualPx;const maxW=Math.max(4,w-(patch.type==="replace"?0:2));
   if(patch.type==="replace"&&ctx.measureText(text).width>maxW){size=actualPx*Math.max(.45,maxW/ctx.measureText(text).width);ctx.font=(info.bold?"bold ":"")+size+"px "+styleFor({...info,sourceFont:patch.sourceFont})}
   ctx.fillText(text,bx,y+i*lineHeight);
   ctx.font=(info.bold?"bold ":"")+actualPx+"px "+styleFor({...info,sourceFont});
  }
 }
 ctx.restore();
}
function applyPatches(ctx,page,w,h){for(const patch of entries(page))drawPatch(ctx,patch,w,h)}
function hitRects(){const layer=$("editHitLayer");layer.replaceChildren();
 if(state.mode!=="select")return;
 for(const item of state.items){
  const button=document.createElement("button");button.type="button";button.className="pdf-edit-hit";
  button.style.left=(item.rect.x*100)+"%";button.style.top=(item.rect.y*100)+"%";button.style.width=(item.rect.w*100)+"%";button.style.height=(item.rect.h*100)+"%";
  button.title=item.text;button.setAttribute("aria-label","Edit: "+item.text.slice(0,90));
  if(state.selection?.kind==="item"&&state.selection.id===item.id)button.classList.add("selected");
  button.addEventListener("click",()=>{state.selection={kind:"item",id:item.id,page:state.page};syncSelection();drawEdits()});layer.append(button);
 }
}
function drawEdits(){
 const canvas=$("editCanvas");if(!state.source||!canvas.width)return;
 const ctx=canvas.getContext("2d");ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(state.source,0,0,canvas.width,canvas.height);
 if(!$("showOriginal").checked)applyPatches(ctx,state.page,canvas.width,canvas.height);
 const layer=$("editAnnotations");layer.replaceChildren();
 if($("showOriginal").checked){$("editHitLayer").hidden=true;return}
 $("editHitLayer").hidden=false;hitRects();
 for(const patch of entries(state.page)){
  const box=document.createElement("div");box.className="pdf-edit-annotation";
  if(state.selection?.kind==="patch"&&state.selection.id===patch.id)box.classList.add("selected");
  box.style.cssText="left:"+(patch.rect.x*100)+"%;top:"+(patch.rect.y*100)+"%;width:"+(patch.rect.w*100)+"%;height:"+(patch.rect.h*100)+"%";
  if(state.mode==="select"){box.style.pointerEvents="auto";box.style.cursor="pointer";box.addEventListener("click",()=>{state.selection={kind:"patch",id:patch.id,page:state.page};syncSelection();drawEdits()})}
  layer.append(box);
 }
}
function currentSelected(){const s=state.selection;if(!s||s.page!==state.page)return null;if(s.kind==="item")return state.items.find(i=>i.id===s.id);return entries(state.page).find(p=>p.id===s.id)}
function syncSelection(){
 const selected=currentSelected();$("applyText").disabled=!(state.pdf&&selected);
 $("removeText").disabled=!(state.pdf&&selected);
 if(!selected){$("editText").value="";return}
 $("editText").value=selected.kind==="item"?selected.text:(selected.text||"");
 const size=selected.format?.size||selected.size||12;$("editFontSize").value=clamp(Math.round(size*2)/2,5,96);
 if(selected.format){$("editColor").value=selected.format.color;$("coverColor").value=selected.format.bg;$("editFont").value=selected.format.font;$("editAlign").value=selected.format.align;$("editBold").value=selected.format.bold?"bold":"normal"}
}
async function loadDocument(){
 const f=$("editFile").files?.[0];if(!f)return;
 if(f.size>25*1048576||f.size<1||!(f.type==="application/pdf"||/\.pdf$/i.test(f.name))){status("Choose a PDF under 25 MB.",true);return}
 const lib=pdfjs();if(!lib){status("PDF renderer unavailable. Check your internet connection.",true);return}
 releaseDownloads();if(state.task)try{await state.task.destroy()}catch{}
 state.pdf=null;state.items=[];state.patches={};state.undo=[];state.redo=[];state.selection=null;state.bytes=null;refreshHistory();
 status("Opening PDF locally…");const array=await f.arrayBuffer();state.bytes=array.slice(0);
 lib.GlobalWorkerOptions.workerSrc="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
 const task=lib.getDocument({data:new Uint8Array(array),isEvalSupported:false,enableScripting:false,useSystemFonts:true});state.task=task;
 task.onPassword=(accept,reason)=>{
  const answer=window.prompt(reason===lib.PasswordResponses.INCORRECT_PASSWORD?"Incorrect PDF password. Retry:":"Password for your own PDF (processed locally):");
  if(answer===null){task.destroy();return}accept(answer);
 };
 try{const pdf=await task.promise;if(pdf.numPages>40)throw Error("Limit: 40 PDF pages");
  state.pdf=pdf;const select=$("editPage");select.replaceChildren();
  for(let i=1;i<=pdf.numPages;i++){const o=document.createElement("option");o.value=String(i);o.textContent="Page "+i;select.append(o)}
  select.disabled=false;state.page=1;
  for(const id of ["saveEditedPdf","findReplace","cleanSpaces"])$(id).disabled=false;
  await renderPage();status(pdf.numPages+" page PDF loaded in browser. Original remains unchanged.");
 }catch(error){status(error?.message||"Could not load this PDF",true)}
}
$("editFile").addEventListener("change",()=>loadDocument().catch(e=>status(e.message,true)));
$("editPage").addEventListener("change",()=>{state.page=Number($("editPage").value);state.selection=null;renderPage().catch(e=>status(e.message,true))});
$("editZoom").addEventListener("change",()=>renderPage().catch(e=>status(e.message,true)));
$("showOriginal").addEventListener("change",drawEdits);
async function renderPage(){
 if(!state.pdf)return;
 const generation=++state.generation,page=await state.pdf.getPage(state.page);
 const viewport=page.getViewport({scale:pageScale()});
 if(viewport.width*viewport.height>11000000)throw Error("Preview page too large. Reduce zoom.");
 const source=document.createElement("canvas");source.width=Math.ceil(viewport.width);source.height=Math.ceil(viewport.height);
 await page.render({canvasContext:source.getContext("2d"),viewport}).promise;
 if(generation!==state.generation)return;
 const content=await page.getTextContent({disableCombineTextItems:true});
 if(generation!==state.generation)return;
 state.source=source;const pageCanvas=$("editCanvas"),paper=$("editPaper");
 pageCanvas.width=source.width;pageCanvas.height=source.height;paper.style.width=source.width+"px";paper.style.height=source.height+"px";
 const styles=content.styles||{},items=[];
 for(let i=0;i<content.items.length;i++){const item=content.items[i];
  if(typeof item.str!=="string"||!item.str.trim()||!Array.isArray(item.transform))continue;
  const pt=viewport.convertToViewportPoint(item.transform[4],item.transform[5]);
  const height=Math.max(5,Math.hypot(item.transform[2],item.transform[3])*pageScale()),width=Math.max(4,(item.width||item.str.length*4)*pageScale());
  const rect=escapeRect({x:clamp(pt[0]/viewport.width,0,1),y:clamp((pt[1]-height)/viewport.height,0,1),w:Math.min(width/viewport.width,1),h:Math.min(height*1.2/viewport.height,1)});
  items.push({kind:"item",id:i,text:item.str,rect,size:height/pageScale(),sourceFont:styles[item.fontName]?.fontFamily||"Arial",pageWidthPt:viewport.width/pageScale()});
 }
 state.items=items;drawEdits();syncSelection();
 $("editPlaceholder").hidden=true;$("editPageInfo").textContent="Page "+state.page+" / "+state.pdf.numPages+" • "+items.length+" selectable text fragments • "+entries(state.page).length+" edits";
}
function makePatch(source,text,type){
 const f=formatFromControls();validFormat(f);
 return {id:uid(),type,rect:{...source.rect},original:source.text||"",text,format:f,sourceFont:source.sourceFont||"Arial",pageWidthPt:source.pageWidthPt||state.source.width/pageScale()};
}
$("applyText").addEventListener("click",()=>{
 try{const selected=currentSelected();if(!selected)return;
  const text=$("editText").value;if(text.length>1000)throw Error("Text must be under 1,000 characters.");
  if(selected.kind==="item"){recordPatch(makePatch(selected,text,"replace"))}
  else updateSelectedPatch({text,type:selected.type==="cover"?"add":selected.type,format:formatFromControls()});
  $("editPageInfo").textContent="Changes previewed. Export PDF to save.";
 }catch(e){status(e.message,true)}
});
$("removeText").addEventListener("click",()=>{
 const selected=currentSelected();if(!selected)return;
 if(selected.kind==="item")recordPatch(makePatch(selected,"","cover"));
 else deleteSelectedPatch();
});
function normalizedPointer(event){const r=$("editPaper").getBoundingClientRect();return {x:clamp((event.clientX-r.left)/r.width,0,1),y:clamp((event.clientY-r.top)/r.height,0,1)}}
const paper=$("editPaper");
paper.addEventListener("pointerdown",e=>{
 if(!state.pdf||$("showOriginal").checked||state.mode==="select")return;
 e.preventDefault();const pos=normalizedPointer(e);
 if(state.mode==="add"){
  const txt=$("editText").value||"New Text",f=formatFromControls();try{validFormat(f)}catch(error){status(error.message,true);return}
  const rect=escapeRect({x:pos.x,y:pos.y,w:Math.min(.55,1-pos.x),h:Math.min(.08,1-pos.y)});
  recordPatch({id:uid(),type:"add",rect,text:txt,original:"",format:f,sourceFont:"Arial",pageWidthPt:state.source.width/pageScale()});
  return;
 }
 if(state.mode==="cover"){state.drag={id:e.pointerId,start:pos};paper.setPointerCapture(e.pointerId)}
});
paper.addEventListener("pointerup",e=>{
 if(!state.drag||e.pointerId!==state.drag.id)return;
 const p=normalizedPointer(e),a=state.drag.start;state.drag=null;
 const rect=escapeRect({x:Math.min(a.x,p.x),y:Math.min(a.y,p.y),w:Math.abs(p.x-a.x),h:Math.abs(p.y-a.y)});
 if(rect.w<.003||rect.h<.003){status("Drag a larger area to cover.",true);return}
 recordPatch({id:uid(),type:"cover",rect,text:"",original:"",format:formatFromControls(),pageWidthPt:state.source.width/pageScale()});
});
paper.addEventListener("pointercancel",()=>state.drag=null);
function batchReplace(replaceFn){
 if(!state.pdf)return;
 const next=clonePatches();const current=next[state.page]||[];
 let count=0;
 for(const item of state.items){const newText=replaceFn(item.text);if(newText===item.text)continue;
  if(newText.length>1000)continue;
  const oldPatch=current.find(p=>p.type==="replace"&&p.original===item.text&&Math.abs(p.rect.x-item.rect.x)<.0001&&Math.abs(p.rect.y-item.rect.y)<.0001);
  const patch=makePatch(item,newText,"replace");
  if(oldPatch){patch.id=oldPatch.id;current.splice(current.indexOf(oldPatch),1)}
  current.push(patch);count++;
 }
 if(count){next[state.page]=current;commit(next);status(count+" changes on current page; review before export.");}
 else status("No matching single-run text found on this page.",true);
}
$("findReplace").addEventListener("click",()=>{
 const needle=$("findText").value;if(!needle)return status("Enter text to find.",true);
 if(needle.length>200)return status("Find text too long.",true);
 batchReplace(text=>text.split(needle).join($("replaceText").value));
});
$("cleanSpaces").addEventListener("click",()=>batchReplace(text=>text.replace(/ {2,}/g," ")));
async function canvasBlob(canvas,type="image/jpeg",quality=.93){return new Promise((ok,bad)=>canvas.toBlob(b=>b?ok(b):bad(Error("Image export failed")),type,quality))}
async function exportEdited(){
 if(!state.pdf||!state.bytes)throw Error("Load a PDF first.");
 const lib=window.PDFLib;if(!lib)throw Error("PDF engine unavailable");
 let original;try{original=await lib.PDFDocument.load(state.bytes.slice(0),{ignoreEncryption:false})}catch{throw Error("Export requires an unencrypted PDF. Open an authorized unlocked copy; browser preview may still work.")}
 const dest=await lib.PDFDocument.create(),total=state.pdf.numPages,dpi=Number($("outputQuality").value);
 const modifiedPages=Object.keys(state.patches).filter(k=>(state.patches[k]||[]).length);
 for(let index=0;index<total;index++){
  if(!entries(index+1).length){const [copied]=await dest.copyPages(original,[index]);dest.addPage(copied);continue}
  const page=await state.pdf.getPage(index+1),base=page.getViewport({scale:1});
  const scale=Math.min(dpi/72,Math.sqrt(28000000/(base.width*base.height)));
  if(scale<1)throw Error("Edited page too large to export safely.");
  const viewport=page.getViewport({scale}),canvas=document.createElement("canvas");canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
  await page.render({canvasContext:canvas.getContext("2d"),viewport}).promise;
  const ctx=canvas.getContext("2d");for(const edit of entries(index+1))drawPatch(ctx,edit,canvas.width,canvas.height);
  const bytes=new Uint8Array(await (await canvasBlob(canvas)).arrayBuffer());
  const embed=await dest.embedJpg(bytes),out=dest.addPage([base.width,base.height]);
  out.drawImage(embed,{x:0,y:0,width:base.width,height:base.height});
  canvas.width=canvas.height=0;
  status("Preparing edited page "+(index+1)+" / "+total+"…");
 }
 return {pdf:new Blob([await dest.save()],{type:"application/pdf"}),modified:modifiedPages.length};
}
$("saveEditedPdf").addEventListener("click",async()=>{
 const button=$("saveEditedPdf");button.disabled=true;releaseDownloads();status("Exporting locally. Modified pages will be flattened…");
 try{const result=await exportEdited();const u=URL.createObjectURL(result.pdf);state.urls.push(u);
  const a=$("downloadEdited");a.href=u;a.download="ThePosterWala-Edited.pdf";a.hidden=false;
  status("Ready: "+result.modified+" edited page(s) flattened, remaining pages preserved. Download and review all pages.");
 }catch(e){status(e.message||"PDF export failed",true)}finally{button.disabled=false}
});
window.addEventListener("pagehide",()=>{releaseDownloads();if(state.task)state.task.destroy().catch(()=>{})});
setMode("select");refreshHistory();
