// The Poster Wala Smart Image Studio: browser-only processing.
// No user images, filenames, payment credentials or blobs are sent to servers.
export const MAX_INPUT_BYTES=35*1024*1024;
export const MAX_PIXELS=32_000_000;
export const PRESETS=Object.freeze({
  govt45:{label:"Govt Form • 45 KB",kb:45,maxEdge:900},
  govt100:{label:"Govt Form • 100 KB",kb:100,maxEdge:1200},
  doc200:{label:"Documents • 200 KB",kb:200,maxEdge:1800},
  oneMB:{label:"High Quality • 1 MB",kb:1024,maxEdge:4000},
  twoMB:{label:"High Quality • 2 MB",kb:2048,maxEdge:6000}
});
export function bytesLabel(bytes){return bytes>=1048576?(bytes/1048576).toFixed(2)+" MB":(bytes/1024).toFixed(1)+" KB"}
export function targetBytes(kb){const n=Number(kb);if(!Number.isFinite(n)||n<10||n>10240)throw Error("Target must be 10–10240 KB");return Math.floor(n*1024)}
export function fitSize(w,h,maxEdge){
 const scale=Math.min(1,maxEdge/Math.max(w,h));
 return {width:Math.max(1,Math.round(w*scale)),height:Math.max(1,Math.round(h*scale))};
}
export function safeFilename(name){
 return String(name||"image").replace(/\.[^.]*$/,"").replace(/[^\p{L}\p{N}_. -]/gu,"_").slice(0,70)||"image";
}
export async function decodeImage(file){
 if(!file||file.size<1||file.size>MAX_INPUT_BYTES)throw Error("Image size must be under 35 MB");
 if(!["image/jpeg","image/png","image/webp"].includes(file.type))throw Error("Please choose JPG, PNG or WebP");
 let image,close=()=>{};
 if(typeof createImageBitmap==="function"){
  try{image=await createImageBitmap(file,{imageOrientation:"from-image"});close=()=>image.close();}catch{}
 }
 if(!image){
  const url=URL.createObjectURL(file);
  try{
   image=await new Promise((resolve,reject)=>{
    const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error("Image could not be decoded"));img.src=url;
   });
  }finally{URL.revokeObjectURL(url)}
 }
 const width=image.width||image.naturalWidth,height=image.height||image.naturalHeight;
 if(!width||!height||width*height>MAX_PIXELS){close();throw Error("Image is too large to process safely (max 32 megapixels)")}
 return {image,width,height,close};
}
function createCanvas(width,height,image,{background="#fff",brightness=100,contrast=100,saturation=100,sharpness=0}={}){
 const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext("2d",{willReadFrequently:sharpness>0});
 if(!ctx)throw Error("Canvas unavailable");
 ctx.fillStyle=background;ctx.fillRect(0,0,width,height);
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
 ctx.filter=`brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
 ctx.drawImage(image,0,0,width,height);ctx.filter="none";
 if(sharpness>0 && width*height<=8_000_000){
  const data=ctx.getImageData(0,0,width,height),a=data.data,out=new Uint8ClampedArray(a);
  // Lightweight unsharp 4-neighbour kernel. No invented AI detail.
  const amount=Math.min(0.65,sharpness/100*0.65);
  for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){
   const i=(y*width+x)*4;
   for(let c=0;c<3;c++){
    const center=a[i+c],blur=(a[i-4+c]+a[i+4+c]+a[i-width*4+c]+a[i+width*4+c])/4;
    out[i+c]=Math.max(0,Math.min(255,center+(center-blur)*amount));
   }
  }
  data.data.set(out);ctx.putImageData(data,0,0);
 }
 return canvas;
}
function encode(canvas,mime,quality){
 return new Promise((resolve,reject)=>{
  canvas.toBlob(blob=>{
   if(!blob||blob.type!==mime)reject(Error("Selected format is not supported by this browser"));
   else resolve(blob);
  },mime,quality);
 });
}
export async function compressImage(file,options={},notify=()=>{}){
 const budget=targetBytes(options.kb??200),mime=options.mime||"image/jpeg";
 if(!["image/jpeg","image/webp","image/png"].includes(mime))throw Error("Invalid output format");
 const decoded=await decodeImage(file);
 try{
  const limit=Math.max(200,Math.min(9000,Number(options.maxEdge)||6000));
  const initial=fitSize(decoded.width,decoded.height,limit);
  // First preserve details. If necessary, reduce dimensions gradually rather
  // than pretending extreme 10 MB -> 45 KB is visually lossless.
  let best=null,quality=0,attempts=0;
  for(let edge=Math.max(initial.width,initial.height);edge>=160;edge=Math.max(159,Math.round(edge*.85))){
   const dims=fitSize(initial.width,initial.height,edge);
   const canvas=createCanvas(dims.width,dims.height,decoded.image,options);
   let candidate=null,cq=1;
   if(mime==="image/png"){
    candidate=await encode(canvas,mime);
   }else{
    let low=.22,high=.96;
    // 8 bounded iterations balance accuracy, speed and visual quality.
    for(let n=0;n<8;n++){
     const q=(low+high)/2,blob=await encode(canvas,mime,q);attempts++;
     if(blob.size<=budget){candidate=blob;cq=q;low=q}
     else high=q;
    }
    if(!candidate){candidate=await encode(canvas,mime,.22);cq=.22}
   }
   if(!best||candidate.size<best.blob.size)best={blob:candidate,width:dims.width,height:dims.height,quality:cq,met: candidate.size<=budget,attempts};
   if(candidate.size<=budget){
    return {blob:candidate,width:dims.width,height:dims.height,quality:cq,met:true,originalSize:file.size,attempts};
   }
   notify(`Trying ${dims.width} × ${dims.height}…`);
   if(edge===160)break;
  }
  return {...best,met:false,originalSize:file.size,attempts,warning:"This image cannot meet the selected size without further loss. No misleading size claim."};
 }finally{decoded.close()}
}
export async function enhanceImage(file,options={}){
 const decoded=await decodeImage(file);
 try{
  const zoom=[1,2].includes(Number(options.zoom))?Number(options.zoom):1;
  const dims=fitSize(decoded.width,decoded.height,Math.min(6000,Math.max(decoded.width,decoded.height)*zoom));
  if(dims.width*dims.height>MAX_PIXELS)throw Error("Upscale would exceed device-safe image size");
  const canvas=createCanvas(dims.width,dims.height,decoded.image,{...options,sharpness:Number(options.sharpness)||20});
  const mime=options.mime==="image/png"?"image/png":"image/jpeg";
  const blob=await encode(canvas,mime,.93);
  return {blob,width:dims.width,height:dims.height,originalSize:file.size,mode:"non-ai"};
 }finally{decoded.close()}
}
// A small store-free ZIP writer for batched outputs, with CRC32 and zero compression.
// Media is already compressed (JPEG/WebP/PNG); deflating again rarely helps.
const u16=n=>[n&255,(n>>>8)&255],u32=n=>[n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255];
function crc32(arr){let c=0xffffffff;for(const byte of arr){c^=byte;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^0xffffffff)>>>0}
export async function zipFiles(items){
 if(!Array.isArray(items)||!items.length||items.length>30)throw Error("ZIP requires 1–30 files");
 const encoder=new TextEncoder(),chunks=[],central=[];let offset=0;
 for(const item of items){
  const name=encoder.encode(item.name),bytes=new Uint8Array(await item.blob.arrayBuffer()),crc=crc32(bytes);
  const local=new Uint8Array([80,75,3,4,20,0,0,0,0,0,0,0,0,0,...u32(crc),...u32(bytes.length),...u32(bytes.length),...u16(name.length),0,0]);
  chunks.push(local,name,bytes);
  central.push(new Uint8Array([80,75,1,2,20,0,20,0,0,0,0,0,0,0,0,0,...u32(crc),...u32(bytes.length),...u32(bytes.length),...u16(name.length),0,0,0,0,0,0,0,0,0,0,0,0,...u32(offset)]),name);
  offset+=local.length+name.length+bytes.length;
 }
 const centralLen=central.reduce((n,a)=>n+a.length,0);
 const end=new Uint8Array([80,75,5,6,0,0,0,0,...u16(items.length),...u16(items.length),...u32(centralLen),...u32(offset),0,0]);
 return new Blob([...chunks,...central,end],{type:"application/zip"});
}
