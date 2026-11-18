const $=id=>document.getElementById(id);
let image=null,sourceURL=null,sheetUrl=null,pdfUrl=null;
const DPI=300,mmToPx=mm=>Math.round(mm/25.4*DPI);
const status=(text,error=false)=>{$("passportStatus").textContent=text;$("passportStatus").classList.toggle("error",error)};
const mm=()=>($("passportSize").value.split("x").map(Number));
function dispose(){for(const url of [sourceURL,sheetUrl,pdfUrl])if(url)URL.revokeObjectURL(url);sourceURL=sheetUrl=pdfUrl=null;}
function crop(ctx,w,h){
 if(!image)return;
 const ratio=Math.max(w/image.naturalWidth,h/image.naturalHeight)*Number($("photoZoom").value)/100;
 const drawW=image.naturalWidth*ratio,drawH=image.naturalHeight*ratio;
 const dx=(w-drawW)/2+(w-drawW)*Number($("panX").value)/200;
 const dy=(h-drawH)/2+(h-drawH)*Number($("panY").value)/200;
 ctx.fillStyle="white";ctx.fillRect(0,0,w,h);
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
 ctx.drawImage(image,dx,dy,drawW,drawH);
}
function preview(){
 if(!image)return;
 const [w,h]=mm(),canvas=$("passportPreview");canvas.width=mmToPx(w);canvas.height=mmToPx(h);
 crop(canvas.getContext("2d"),canvas.width,canvas.height);
 for(const [id,out] of [["photoZoom","zoomText"],["panX","panXText"],["panY","panYText"]])$(out).textContent=$(id).value+(id==="photoZoom"?"%":"");
}
$("passportInput").addEventListener("change",()=>{
 const file=$("passportInput").files?.[0];if(!file)return;
 if(file.size>35*1024*1024||!["image/png","image/jpeg","image/webp"].includes(file.type)){status("Choose a JPG/PNG/WebP under 35 MB",true);return}
 if(sourceURL)URL.revokeObjectURL(sourceURL);
 sourceURL=URL.createObjectURL(file);
 const img=new Image();img.onload=()=>{
  if(img.naturalWidth*img.naturalHeight>32e6){status("Image resolution exceeds 32 MP",true);return}
  image=img;$("makePhotos").disabled=false;preview();status("Adjust crop and generate A4 sheet.");
 };img.onerror=()=>status("Invalid photo",true);img.src=sourceURL;
});
for(const id of ["passportSize","photoZoom","panX","panY"])$(id).addEventListener("input",preview);
const asBlob=(canvas,type="image/png",quality=.92)=>new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error("Image export failed")),type,quality));
$("makePhotos").addEventListener("click",async()=>{
 if(!image)return;
 const button=$("makePhotos");button.disabled=true;
 try{
  const [pw,ph]=mm(),w=mmToPx(pw),h=mmToPx(ph),canvas=document.createElement("canvas");
  const pageW=mmToPx(210),pageH=mmToPx(297);canvas.width=pageW;canvas.height=pageH;
  const ctx=canvas.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,pageW,pageH);
  const margin=mmToPx(9),gap=mmToPx(3);
  const cols=Math.max(1,Math.floor((pageW-2*margin+gap)/(w+gap)));
  const rows=Math.max(1,Math.floor((pageH-2*margin+gap)/(h+gap)));
  const count=Math.min(Number($("copies").value),cols*rows);
  const small=document.createElement("canvas");small.width=w;small.height=h;crop(small.getContext("2d"),w,h);
  for(let i=0;i<count;i++){
   const x=margin+(i%cols)*(w+gap),y=margin+Math.floor(i/cols)*(h+gap);
   ctx.drawImage(small,x,y);ctx.lineWidth=1;ctx.strokeStyle="#aaa";ctx.strokeRect(x,y,w,h);
  }
  const imageBlob=await asBlob(canvas);
  if(sheetUrl)URL.revokeObjectURL(sheetUrl);sheetUrl=URL.createObjectURL(imageBlob);
  $("passportSheet").src=sheetUrl;$("passportSheet").hidden=false;
  $("downloadPassport").href=sheetUrl;$("downloadPassport").hidden=false;
  if(window.PDFLib){
   const pdf=await window.PDFLib.PDFDocument.create(),bytes=await pdf.embedPng(await imageBlob.arrayBuffer());
   pdf.addPage([595.28,841.89]).drawImage(bytes,{x:0,y:0,width:595.28,height:841.89});
   if(pdfUrl)URL.revokeObjectURL(pdfUrl);
   pdfUrl=URL.createObjectURL(new Blob([await pdf.save()],{type:"application/pdf"}));
   $("passportPdf").href=pdfUrl;$("passportPdf").hidden=false;
  }else $("passportPdf").hidden=true;
  status(count+" photos on A4. Preview ready. Print at Actual Size / 100%.");
 }catch(e){status(e.message||"Could not make sheet",true)}finally{button.disabled=false}
});
window.addEventListener("pagehide",dispose);
