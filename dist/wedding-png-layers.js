// Wedding PNG decorations editor. Uses existing uploaded PNG files only.
export function installWeddingPngLayers(anchor,render){
 const builtIns=[
  {id:"royal-mint",name:"Royal Mint Couple",src:"./assets/wedding-couples/royal-mint-couple.png"},
  {id:"lavender-duo",name:"Lavender Duo",src:"./assets/wedding-couples/lavender-duo.png"},
  {id:"red-namaste",name:"Red Namaste Couple",src:"./assets/wedding-couples/red-namaste-couple.png"}
 ];
 const layers=[];let selected=-1;
 const panel=document.createElement("section");panel.className="wedding-png-panel";
 panel.innerHTML='<strong>Wedding Couple / PNG Library</strong><p>Transparent PNG add ਕਰੋ, ਫਿਰ Size, Position ਅਤੇ Transparency ਬਦਲੋ।</p><div class="wedding-builtins"><span>Built-in Wedding PNGs — ਇਕ Click ਨਾਲ ਜੋੜੋ</span><div id="weddingBuiltInList" class="wedding-built-in-list"></div></div><label class="wedding-upload">＋ Add PNG / Couple Image<input type="file" id="weddingPngFile" accept="image/png,image/webp" multiple /></label><div id="weddingLayerList"></div><div id="weddingLayerEdit" hidden><label>Left / Right<input id="wedX" type="range" min="0" max="1080" step="5"></label><label>Up / Down<input id="wedY" type="range" min="0" max="1620" step="5"></label><label>Size<input id="wedSize" type="range" min="5" max="110"></label><label>Opacity<input id="wedOpacity" type="range" min="15" max="100"></label><button type="button" id="wedRemove">Remove PNG</button><button type="button" id="wedUp">Bring Forward</button><button type="button" id="wedDown">Send Back</button></div><small>PNG is optional. Poster text and background remain editable.</small>';
 anchor.insertAdjacentElement("afterend",panel);
 const el=id=>panel.querySelector("#"+id);
 function insertImage(image,name){
  if(layers.length>=8){window.alert("Maximum 8 PNG layers allowed");return false;}
  layers.push({name,image,x:540,y:1070,size:40,opacity:100});
  selected=layers.length-1;sync();return true;
 }
 for(const asset of builtIns){
  const button=document.createElement("button");button.type="button";button.className="wedding-built-in-option";
  const img=document.createElement("img");img.loading="lazy";img.decoding="async";img.src=asset.src;img.alt="";
  const name=document.createElement("span");name.textContent=asset.name;
  button.append(img,name);button.setAttribute("aria-label","Add "+asset.name+" to poster");
  button.addEventListener("click",()=>{
   if(layers.length>=8){window.alert("Maximum 8 PNG layers allowed");return;}
   button.disabled=true;
   const image=new Image();
   image.onload=()=>{button.disabled=false;insertImage(image,asset.name)};
   image.onerror=()=>{button.disabled=false;window.alert("Could not load "+asset.name+"; refresh and try again.")};
   image.src=asset.src;
  });
  el("weddingBuiltInList").append(button);
 }
 function sync(){
  const holder=el("weddingLayerList");holder.replaceChildren();
  layers.forEach((layer,index)=>{
   const btn=document.createElement("button");btn.type="button";btn.className="wedding-png-chip";btn.setAttribute("aria-pressed",String(index===selected));
   const img=document.createElement("img");img.src=layer.image.src;img.alt="";
   const span=document.createElement("span");span.textContent=layer.name;btn.append(img,span);
   btn.addEventListener("click",()=>{selected=index;sync()});holder.append(btn);
  });
  el("weddingLayerEdit").hidden=selected<0;
  if(selected>=0){const l=layers[selected];for(const [id,key] of [["wedX","x"],["wedY","y"],["wedSize","size"],["wedOpacity","opacity"]])el(id).value=l[key]}
  render();
 }
 el("weddingPngFile").addEventListener("change",async event=>{
  const input=event.target;
  for(const f of Array.from(input.files||[]).slice(0,6)){
   if(layers.length>=8)break;
   if(!["image/png","image/webp"].includes(f.type)||f.size>8e6)continue;
   try{
    const image=await new Promise((resolve,reject)=>{
     const reader=new FileReader();reader.onerror=reject;
     reader.onload=()=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=reader.result};
     reader.readAsDataURL(f);
    });
    insertImage(image,f.name.slice(0,50));
   }catch(e){console.warn("Could not load PNG",e)}
  }
  input.value="";sync();
 });
 for(const [id,key] of [["wedX","x"],["wedY","y"],["wedSize","size"],["wedOpacity","opacity"]])el(id).addEventListener("input",e=>{if(selected<0)return;layers[selected][key]=Number(e.target.value);render()});
 el("wedRemove").addEventListener("click",()=>{if(selected<0)return;layers.splice(selected,1);selected=Math.min(selected,layers.length-1);sync()});
 function swap(target){if(selected<0||target<0||target>=layers.length)return;[layers[selected],layers[target]]=[layers[target],layers[selected]];selected=target;sync()}
 el("wedUp").addEventListener("click",()=>swap(selected+1));el("wedDown").addEventListener("click",()=>swap(selected-1));
 return {draw(ctx,W,H){
  for(const l of layers){const w=W*l.size/100,h=H*l.size/100;const scale=Math.min(w/l.image.naturalWidth,h/l.image.naturalHeight);const width=l.image.naturalWidth*scale,height=l.image.naturalHeight*scale;ctx.save();ctx.globalAlpha=l.opacity/100;ctx.drawImage(l.image,l.x-width/2,l.y-height/2,width,height);ctx.restore()}
 },reset(){layers.length=0;selected=-1;sync()}};
}
