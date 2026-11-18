import {PRESETS,compressImage,enhanceImage,bytesLabel,safeFilename,zipFiles} from "./smart-image-engine.js?v=1.0.1";
const $=id=>document.getElementById(id);
const state={files:[],results:[],mode:"compress",busy:false,urls:[],zipUrl:null};
const message=(s,bad=false)=>{$("status").textContent=s;$("status").classList.toggle("error",bad)};
const readOptions=()=>{
 const preset=$("preset").value,entry=PRESETS[preset];
 const kb=preset==="custom"?Number($("customKB").value):entry.kb;
 const maxEdge=Number($("maxEdge").value)||entry?.maxEdge||6000;
 return {kb,maxEdge,mime:$("format").value};
};
function setMode(mode){
 state.mode=mode;
 for(const btn of document.querySelectorAll("[data-mode]"))btn.classList.toggle("active",btn.dataset.mode===mode);
 $("compressOptions").hidden=mode!=="compress";
 $("enhanceOptions").hidden=mode!=="enhance";
 if(!state.busy)message(mode==="compress"?"Select target KB and process.":"Free local enhancement, not AI super-resolution.");
}
function fileLabel(name){return name.length>28?name.slice(0,25)+"…":name}
function dropUrls(){
 for(const url of state.urls)URL.revokeObjectURL(url);
 state.urls=[];
 state.zipUrl=null;
}
function urlFor(blob){const url=URL.createObjectURL(blob);state.urls.push(url);return url}
function emptyResults(){
 dropUrls();state.results=[];
 $("resultRows").replaceChildren();
 const tr=document.createElement("tr"),td=document.createElement("td");
 td.colSpan=5;td.className="empty";td.textContent="Your results will appear here.";tr.append(td);
 $("resultRows").append(tr);
 $("beforeImage").removeAttribute("src");$("afterImage").removeAttribute("src");
 $("beforeMeta").textContent="Choose a photo";$("afterMeta").textContent="Not processed";
 $("downloadZip").disabled=true;
}
function loadFiles(list){
 if(state.busy)return;
 const files=Array.from(list||[]);
 if(files.length>20){message("Maximum 20 images at a time. Choose fewer files.",true);return}
 if(!files.length)return;
 for(const file of files){
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>35*1048576||file.size===0){
   message("Only JPG, PNG or WebP images from 1 byte to 35 MB are supported.",true);return;
  }
 }
 state.files=files;emptyResults();
 $("processBtn").disabled=false;
 const first=files[0];
 $("beforeImage").src=urlFor(first);
 $("beforeMeta").textContent=`${fileLabel(first.name)} • ${bytesLabel(first.size)}`;
 message(`${files.length} image(s) ready. Adjust options and click Process Photos.`);
}
function showResult(index){
 const record=state.results[index];if(!record)return;
 $("beforeImage").src=record.originalUrl;$("afterImage").src=record.processedUrl;
 $("beforeMeta").textContent=`${fileLabel(record.file.name)} • ${bytesLabel(record.file.size)}`;
 $("afterMeta").textContent=`${bytesLabel(record.result.blob.size)} • ${record.result.width} × ${record.result.height} px`;
 for(const row of $("resultRows").querySelectorAll("[data-index]"))row.classList.toggle("selected",Number(row.dataset.index)===index);
}
function makeCell(tr,content){
 const td=document.createElement("td");td.textContent=content;tr.append(td);return td;
}
function resultRow(record,index){
 const tr=document.createElement("tr");tr.dataset.index=index;
 makeCell(tr,fileLabel(record.file.name));
 makeCell(tr,bytesLabel(record.file.size));
 makeCell(tr,bytesLabel(record.result.blob.size));
 const status=makeCell(tr,record.result.met===false?"Over target":"Ready");
 status.className=record.result.met===false?"flag-warn":"flag-ok";
 const td=document.createElement("td");
 const link=document.createElement("a");link.className="save-file";link.textContent="Download";link.href=record.processedUrl;link.download=record.filename;
 link.addEventListener("click",event=>event.stopPropagation());
 td.append(link);tr.append(td);
 tr.addEventListener("click",()=>showResult(index));
 return tr;
}
async function process(){
 if(state.busy||!state.files.length)return;
 const options=state.mode==="compress"?readOptions():{
  zoom:Number($("zoom").value),brightness:Number($("brightness").value),
  contrast:Number($("contrast").value),saturation:Number($("saturation").value),
  sharpness:Number($("sharpness").value),mime:"image/jpeg"
 };
 if(state.mode==="compress" && (!Number.isFinite(options.kb)||options.kb<10||options.kb>10240)){
  message("Target size must be 10 to 10240 KB.",true);return;
 }
 state.busy=true;$("processBtn").disabled=true;$("studioFiles").disabled=true;
 emptyResults();
 const tbody=$("resultRows");tbody.replaceChildren();
 let errorCount=0,oversized=0;
 for(let i=0;i<state.files.length;i++){
  const file=state.files[i];
  message(`Processing ${i+1}/${state.files.length}: ${fileLabel(file.name)}`);
  try{
   const result=state.mode==="compress"
     ?await compressImage(file,options,notice=>message(`${i+1}/${state.files.length}: ${notice}`))
     :await enhanceImage(file,options);
   if(result.met===false)oversized++;
   const extension=result.blob.type==="image/png"?"png":result.blob.type==="image/webp"?"webp":"jpg";
   const name=safeFilename(file.name)+"-"+(state.mode==="compress"?"compressed":"enhanced")+"."+extension;
   const originalUrl=urlFor(file),processedUrl=urlFor(result.blob);
   const entry={file,result,filename:name,originalUrl,processedUrl};
   state.results.push(entry);tbody.append(resultRow(entry,state.results.length-1));
  }catch(error){
   errorCount++;
   const row=document.createElement("tr");
   makeCell(row,fileLabel(file.name));makeCell(row,bytesLabel(file.size));makeCell(row,"—");
   makeCell(row,error?.message||"Failed").className="flag-warn";makeCell(row,"—");
   tbody.append(row);
  }
 }
 if(state.results.length)showResult(0);
 const summary=`${state.results.length} completed${errorCount?" • "+errorCount+" failed":""}${oversized?" • "+oversized+" over target (check warnings)":""}.`;
 message(summary,Boolean(errorCount||oversized));
 if(state.results.length>1){
  try{
   message("Preparing Batch ZIP…");
   const blob=await zipFiles(state.results.map(x=>({name:x.filename,blob:x.result.blob})));
   state.zipUrl=urlFor(blob);
   const button=$("downloadZip");button.disabled=false;
   // Prebuilt ZIP: user gesture is synchronous to retain browser download support.
   button.dataset.ready="1";
   button.title=`Batch ZIP • ${bytesLabel(blob.size)}`;
  }catch(e){message(summary+" ZIP unavailable: "+e.message,true)}
 }
 if(state.results.length)message(summary,Boolean(errorCount||oversized));
 state.busy=false;$("processBtn").disabled=false;$("studioFiles").disabled=false;
}
$("studioFiles").addEventListener("change",e=>loadFiles(e.target.files));
for(const btn of document.querySelectorAll("[data-mode]"))btn.addEventListener("click",()=>{if(!state.busy)setMode(btn.dataset.mode)});
$("preset").addEventListener("change",()=>{$("customRow").hidden=$("preset").value!=="custom"});
for(const id of ["brightness","contrast","saturation","sharpness"]){
 $(id).addEventListener("input",()=>{$(id+"Value").textContent=$(id).value+"%"});
}
$("processBtn").addEventListener("click",process);
$("downloadZip").addEventListener("click",()=>{
 if(!state.zipUrl)return;
 const link=document.createElement("a");link.href=state.zipUrl;link.download="ThePosterWala-ImageStudio-Batch.zip";
 document.body.append(link);link.click();link.remove();
});
$("resetBtn").addEventListener("click",()=>{
 if(state.busy)return;state.files=[];$("studioFiles").value="";emptyResults();
 $("processBtn").disabled=true;message("Files cleared. Nothing has been uploaded.");
});
const drop=$("dropZone");
for(const type of ["dragenter","dragover"])drop.addEventListener(type,e=>{e.preventDefault();drop.classList.add("drag-over")});
for(const type of ["dragleave","drop"])drop.addEventListener(type,e=>{e.preventDefault();drop.classList.remove("drag-over")});
drop.addEventListener("drop",e=>loadFiles(e.dataTransfer?.files));
window.addEventListener("pagehide",dropUrls);
emptyResults();
