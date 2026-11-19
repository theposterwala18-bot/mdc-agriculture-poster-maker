import {zipFiles,safeFilename,bytesLabel} from "./smart-image-engine.js?v=1.0.1";
const $=id=>document.getElementById(id);
let urls=[];const report=(message,failed=false)=>{$("formatStatus").textContent=message;$("formatStatus").classList.toggle("error",failed)};
const fileTypes=new Set(["image/jpeg","image/png","image/webp"]);
function clear(){
 for(const url of urls)URL.revokeObjectURL(url);
 urls=[];$("formatZip").hidden=true;$("formatResults").replaceChildren();
}
function isHeic(file){return /\.(heic|heif)$/i.test(file.name)||["image/heic","image/heif"].includes(file.type)}
function sourceImage(file){
 return new Promise((resolve,reject)=>{
  const url=URL.createObjectURL(file),image=new Image();
  image.onload=()=>{URL.revokeObjectURL(url);resolve(image)};
  image.onerror=()=>{URL.revokeObjectURL(url);reject(Error("This browser cannot decode this image"))};
  image.src=url;
 });
}
async function convert(file,mime,quality){
 let source=file;
 if(isHeic(file)){
  if(typeof window.heic2any!=="function")throw Error("HEIC decoder unavailable: check Internet or use a different browser");
  const converted=await window.heic2any({blob:file,toType:"image/jpeg",quality:.98});
  source=Array.isArray(converted)?converted[0]:converted;
 }
 if(!fileTypes.has(source.type)){
  // Some browsers return an empty MIME for supported formats; try native image decoding.
  if(!isHeic(file)&&!fileTypes.has(file.type))throw Error("Unsupported image format");
 }
 const img=await sourceImage(source);
 if(img.naturalWidth*img.naturalHeight>32e6)throw Error("Image exceeds 32 megapixels");
 const canvas=document.createElement("canvas");canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
 const ctx=canvas.getContext("2d");if(!ctx)throw Error("Canvas unavailable");
 if(mime==="image/jpeg"){ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height)}
 ctx.drawImage(img,0,0);
 return await new Promise((resolve,reject)=>{
  canvas.toBlob(blob=>blob&&blob.type===mime?resolve(blob):reject(Error("Output format not supported on this browser")),mime,quality);
 });
}
$("formatQuality").addEventListener("input",()=>{$("formatQualityValue").textContent=$("formatQuality").value+"%"});
$("convertFormat").addEventListener("click",async()=>{
 const files=Array.from($("formatFiles").files||[]);
 if(!files.length||files.length>15){report("Select 1 to 15 photos",true);return}
 if(files.some(file=>!file.size||file.size>35*1048576)){report("Each photo must be under 35 MB",true);return}
 const button=$("convertFormat");button.disabled=true;clear();
 const mime=$("outputFormat").value,q=Number($("formatQuality").value)/100;
 const ext=mime==="image/png"?"png":mime==="image/webp"?"webp":"jpg";
 const result=[];let failures=0;
 for(let i=0;i<files.length;i++){
  const file=files[i];report("Converting "+(i+1)+"/"+files.length+"...");
  const row=document.createElement("div");row.style.cssText="padding:12px;border-bottom:1px solid #e1e9e4;display:flex;align-items:center;gap:10px;flex-wrap:wrap";
  try{
   const blob=await convert(file,mime,q),name=safeFilename(file.name)+"."+ext;
   const url=URL.createObjectURL(blob);urls.push(url);
   const text=document.createElement("span");text.style.flex="1";text.textContent=name+" • "+bytesLabel(blob.size);
   const link=document.createElement("a");link.href=url;link.download=name;link.className="tool-btn alt";link.textContent="Download";
   row.append(text,link);result.push({name,blob});
  }catch(error){failures++;row.textContent=file.name+": "+error.message}
  $("formatResults").append(row);
 }
 if(result.length>1){
  try{const zip=await zipFiles(result),url=URL.createObjectURL(zip);urls.push(url);$("formatZip").href=url;$("formatZip").hidden=false}
  catch(error){report("ZIP creation failed: "+error.message,true)}
 }
 report(result.length+" files converted"+(failures?" • "+failures+" failed":""),failures>0);
 button.disabled=false;
});
window.addEventListener("pagehide",clear);
