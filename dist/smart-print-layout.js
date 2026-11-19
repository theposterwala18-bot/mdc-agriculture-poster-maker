// Shared print geometry; only layout preferences are persisted (never images, IDs, PDF bytes or passwords).
export const PAPER_MM={a3:[297,420],a4:[210,297],a5:[148,210],a6:[105,148],letter:[215.9,279.4],legal:[215.9,355.6],executive:[184.2,266.7],"2x2":[50.8,50.8],"3.5x5":[88.9,127],"4x6":[101.6,152.4],"5x7":[127,177.8],"6x8":[152.4,203.2],"8x10":[203.2,254],"8x12":[203.2,304.8],"10x12":[254,304.8],"12x18":[304.8,457.2]};
export const paperOptions=()=>'<optgroup label="Document paper"><option value="a3">A3</option><option value="a4">A4</option><option value="a5">A5</option><option value="a6">A6</option><option value="letter">US Letter</option><option value="legal">US Legal</option><option value="executive">Executive</option></optgroup><optgroup label="Photo paper"><option value="2x2">2×2 in</option><option value="3.5x5">3.5×5 in</option><option value="4x6">4×6 in</option><option value="5x7">5×7 in</option><option value="6x8">6×8 in</option><option value="8x10">8×10 in</option><option value="8x12">8×12 in</option><option value="10x12">10×12 in</option><option value="12x18">12×18 in</option></optgroup><option value="custom">Custom (mm)</option>';
export const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export function paperMm(type,orientation="portrait",customW=210,customH=297){
 const pair=type==="custom"?[Number(customW),Number(customH)]:PAPER_MM[type];
 if(!pair||pair.some(v=>!Number.isFinite(v)||v<50||v>1000))throw Error("Choose a valid paper size (50–1000 mm).");
 const [w,h]=pair;return orientation==="landscape"?[Math.max(w,h),Math.min(w,h)]:orientation==="portrait"?[Math.min(w,h),Math.max(w,h)]:[w,h];
}
export function pageCanvasSize(w,h,desiredDpi=300){
 // Cap memory on large format prints; PDF physical size remains exact.
 const dpi=Math.min(desiredDpi,Math.floor(Math.sqrt(38000000/(w*h))*25.4));
 if(dpi<72)throw Error("Paper is too large for safe browser rendering.");
 return {width:Math.round(w/25.4*dpi),height:Math.round(h/25.4*dpi),dpi};
}
export const mmPx=(mm,dpi)=>mm/25.4*dpi;
export const pdfPts=mm=>mm*72/25.4;
export function anchorXY(pos,pageW,pageH,contentW,contentH,margin=0,dx=0,dy=0){
 const x=pos.includes("left")?0:pos.includes("right")?1:.5;
 const y=pos.startsWith("top")?0:pos.startsWith("bottom")?1:.5;
 const aw=pageW-2*margin-contentW,ah=pageH-2*margin-contentH;
 if(aw<-.01||ah<-.01)throw Error("Layout will not fit. Reduce copies/card size or margins.");
 return {x:margin+Math.max(0,aw)*x+clamp(Number(dx)||0,-Math.max(0,aw)*x,Math.max(0,aw)*(1-x)),y:margin+Math.max(0,ah)*y+clamp(Number(dy)||0,-Math.max(0,ah)*y,Math.max(0,ah)*(1-y))};
}
export function savePrintPrefs(key,values){try{localStorage.setItem("tpw-print-"+key,JSON.stringify(values))}catch{}}
export function readPrintPrefs(key){try{return JSON.parse(localStorage.getItem("tpw-print-"+key)||"null")}catch{return null}}

export function bindPrintSettings(prefix,onChange=()=>{}){
 const ids=["Paper","Orient","CustomW","CustomH","Position","Margin","OffsetX","OffsetY"];
 const prior=readPrintPrefs(prefix);
 for(const suffix of ids){const el=document.getElementById(prefix+suffix);if(!el)continue;
  if(prior&&Object.hasOwn(prior,suffix)&&typeof prior[suffix]==="string"){
   const value=prior[suffix];if(el.tagName!=="SELECT"||[...el.options].some(o=>o.value===value))el.value=value;
  }
 }
 function refresh(){
  const custom=document.getElementById(prefix+"Paper").value==="custom";
  document.getElementById(prefix+"CustomWField").hidden=!custom;
  document.getElementById(prefix+"CustomHField").hidden=!custom;
  const values=Object.fromEntries(ids.map(suffix=>[suffix,document.getElementById(prefix+suffix).value]));
  savePrintPrefs(prefix,values);onChange();
 }
 for(const suffix of ids)document.getElementById(prefix+suffix).addEventListener("input",refresh);
 refresh();
}
export function printConfig(prefix){
 const get=suffix=>document.getElementById(prefix+suffix).value;
 const [w,h]=paperMm(get("Paper"),get("Orient"),get("CustomW"),get("CustomH"));
 const margin=Number(get("Margin")),offsetX=Number(get("OffsetX")),offsetY=Number(get("OffsetY"));
 if(!Number.isFinite(margin)||margin<0||margin>25||!Number.isFinite(offsetX)||!Number.isFinite(offsetY)||Math.abs(offsetX)>200||Math.abs(offsetY)>200)throw Error("Invalid margin / position adjustment.");
 return {w,h,margin,offsetX,offsetY,position:get("Position"),paper:get("Paper")};
}
