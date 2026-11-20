import {bindPrintSettings,printConfig,pdfPts,anchorXY} from "./smart-print-layout.js";
const $=id=>document.getElementById(id);
let generatedUrl=null;const report=(msg,error=false)=>{$("pdfStatus").textContent=msg;$("pdfStatus").classList.toggle("error",error)};

function clear(){if(generatedUrl){URL.revokeObjectURL(generatedUrl);generatedUrl=null}$("pdfDownload").hidden=true;$("pdfPreview").replaceChildren()}
function selections(){const mode=$("pdfMode").value;if(mode==="edit"){window.location.assign("pdf-text-editor.html");return}$("splitOpts").hidden=mode!=="split";$("rotateOpts").hidden=mode!=="rotate";$("imageOpts").hidden=mode!=="image";$("pdfFiles").value="";clear();$("pdfFiles").accept=mode==="image"?"image/jpeg,image/png,image/webp":".pdf,application/pdf";$("pdfFiles").multiple=["image","merge"].includes(mode)}
$("pdfMode").addEventListener("change",selections);
export function pageIndices(range,max){
 if(!Number.isInteger(max)||max<1)throw Error("Empty PDF");
 const selected=[],seen=new Set();
 for(const fragment of String(range).split(",")){
  const part=fragment.trim();if(!part)continue;
  const match=part.match(/^(\d+)(?:-(\d+))?$/);if(!match)throw Error("Use ranges like 1-3,5");
  const a=+match[1],b=match[2]?+match[2]:a;if(a<1||b<a||b>max)throw Error("Page range exceeds the PDF length");
  for(let i=a;i<=b;i++)if(!seen.has(i)){seen.add(i);selected.push(i-1)}
 }
 if(!selected.length)throw Error("Select at least one page");return selected;
}
async function toJpeg(file){
 if(file.type==="image/jpeg")return new Uint8Array(await file.arrayBuffer());
 if(!["image/png","image/webp"].includes(file.type))throw Error("Only JPEG/PNG/WebP images supported");
 // For PNG, keep alpha and embed as PNG where supported.
 if(file.type==="image/png")return new Uint8Array(await file.arrayBuffer());
 const url=URL.createObjectURL(file);
 try{
  const image=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error("Cannot decode image"));i.src=url});
  if(image.naturalWidth*image.naturalHeight>30000000)throw Error("Image too large for browser");
  const canvas=document.createElement("canvas");canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
  const c=canvas.getContext("2d");c.fillStyle="#fff";c.fillRect(0,0,canvas.width,canvas.height);c.drawImage(image,0,0);
  return new Uint8Array(await new Promise((resolve,reject)=>canvas.toBlob(b=>b?b.arrayBuffer().then(resolve,reject):reject(Error("Could not convert image")),"image/jpeg",.92)));
 }finally{URL.revokeObjectURL(url)}
}
async function createPdf(){
 const lib=window.PDFLib;if(!lib)throw Error("PDF Engine not loaded. Check your internet connection and retry.");
 const mode=$("pdfMode").value,files=[...$("pdfFiles").files];
 if(!files.length||files.length>30)throw Error("Choose 1 to 30 files");
 if(files.some(f=>f.size>35*1024*1024))throw Error("Maximum file size 35 MB per file");
 const output=await lib.PDFDocument.create();
 if(mode==="image"){
  const p=printConfig("pdf"),pw=pdfPts(p.w),ph=pdfPts(p.h);
  for(const file of files){
   const data=await toJpeg(file);
   const embedded=file.type==="image/png"?await output.embedPng(data):await output.embedJpg(data);
   const page=output.addPage([pw,ph]),margin=pdfPts(p.margin);
   const width=pw-2*margin,height=ph-2*margin;
   if(width<=0||height<=0)throw Error("Margins are too large for this paper.");
   const cover=$("pdfFit").value==="cover";
   const scale=cover?Math.max(width/embedded.width,height/embedded.height):Math.min(width/embedded.width,height/embedded.height);
   const w=embedded.width*scale,h=embedded.height*scale;
   if(cover){
    // Physical crop to the printable rectangle without stretching originals.
    const {x,y}=anchorXY(p.position,pw,ph,width,height,margin,pdfPts(p.offsetX),-pdfPts(p.offsetY));
    page.drawImage(embedded,{x:x+(width-w)/2,y:ph-y-height+(height-h)/2,width:w,height:h});
    // Cover can extend beyond margins; image is clipped to the PDF page boundaries.
   }else{
    const position=anchorXY(p.position,pw,ph,w,h,margin,pdfPts(p.offsetX),-pdfPts(p.offsetY));
    page.drawImage(embedded,{x:position.x,y:ph-position.y-h,width:w,height:h});
   }
  }
 }else{
  for(const file of files){
   if(file.type!=="application/pdf"&&!file.name.toLowerCase().endsWith(".pdf"))throw Error("Please upload PDFs");
   let source;try{source=await lib.PDFDocument.load(await file.arrayBuffer())}
   catch{throw Error("This PDF cannot be read (possibly encrypted/password-protected). Try an authorized unlocked copy.")}
   let indices=Array.from({length:source.getPageCount()},(_,i)=>i);
   if(mode==="split")indices=pageIndices($("pageRange").value,source.getPageCount());
   const copied=await output.copyPages(source,indices);
   for(const page of copied){
    if(mode==="rotate"){const deg=+$("rotation").value;page.setRotation(lib.degrees((page.getRotation().angle+deg)%360))}
    output.addPage(page);
   }
  }
 }
 if(!output.getPageCount())throw Error("No PDF pages to save");
 return new Blob([await output.save()],{type:"application/pdf"});
}
$("makePdf").addEventListener("click",async()=>{
 const button=$("makePdf");button.disabled=true;clear();report("Preparing PDF locally…");
 try{
  const pdf=await createPdf();generatedUrl=URL.createObjectURL(pdf);
  const frame=document.createElement("iframe");frame.src=generatedUrl+"#toolbar=1";frame.title="PDF Preview";$("pdfPreview").append(frame);
  const link=$("pdfDownload");link.href=generatedUrl;link.hidden=false;link.download="ThePosterWala-"+$("pdfMode").value+".pdf";
  $("pdfInfo").textContent=(pdf.size/1048576).toFixed(2)+" MB • PDF created in your browser";
  report("PDF created. Preview and Download are ready.");
 }catch(error){report(error.message||"Conversion failed",true)}
 finally{button.disabled=false}
});
bindPrintSettings("pdf",()=>{clear();try{const p=printConfig("pdf");$("pdfPageInfo").textContent=p.w+" × "+p.h+" mm • "+p.position+" • "+p.margin+" mm margin • image to PDF only"}catch(e){$("pdfPageInfo").textContent=e.message}});
$("pdfFit").addEventListener("change",clear);
$("pdfFiles").addEventListener("change",clear);
selections();
window.addEventListener("pagehide",clear);
