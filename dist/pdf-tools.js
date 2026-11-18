const $=id=>document.getElementById(id);
let generatedUrl=null;const report=(msg,error=false)=>{$("pdfStatus").textContent=msg;$("pdfStatus").classList.toggle("error",error)};
const sizes={a4:[595.28,841.89],letter:[612,792]};
function clear(){if(generatedUrl){URL.revokeObjectURL(generatedUrl);generatedUrl=null}$("pdfDownload").hidden=true;$("pdfPreview").replaceChildren()}
function selections(){const mode=$("pdfMode").value;$("splitOpts").hidden=mode!=="split";$("rotateOpts").hidden=mode!=="rotate";$("imageOpts").hidden=mode!=="image";$("pdfFiles").value="";clear();$("pdfFiles").accept=mode==="image"?"image/jpeg,image/png,image/webp":".pdf,application/pdf";$("pdfFiles").multiple=["image","merge"].includes(mode)}
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
  const [pw,ph]=sizes[$("pdfPageSize").value]||sizes.a4;
  for(const file of files){
   const data=await toJpeg(file);
   const embedded=file.type==="image/png"?await output.embedPng(data):await output.embedJpg(data);
   const page=output.addPage([pw,ph]);const margin=24;
   const scale=Math.min((pw-margin*2)/embedded.width,(ph-margin*2)/embedded.height);
   const w=embedded.width*scale,h=embedded.height*scale;
   page.drawImage(embedded,{x:(pw-w)/2,y:(ph-h)/2,width:w,height:h});
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
selections();
window.addEventListener("pagehide",clear);
