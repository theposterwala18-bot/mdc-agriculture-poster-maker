// Poster homepage drawer, no mutation of original header, export or financial code.
const drawer=document.createElement("nav");
drawer.className="tpw-main-drawer";drawer.setAttribute("aria-label","Site sections and document tools");drawer.id="tpwMainDrawer";
const heading=document.createElement("div");heading.className="tpw-main-drawer-header";
const title=document.createElement("span");title.textContent="The Poster Wala";
const close=document.createElement("button");close.type="button";close.textContent="×";close.className="tpw-main-drawer-close";close.setAttribute("aria-label","Close menu");
heading.append(title,close);drawer.append(heading);
const sections=[
 ["MAIN",[["Home Page","#moduleHub"],["All Document Tools","tools.html"],["Smart Image Studio","smart-image-studio.html"]]],
 ["POSTERS",[["Wedding & Invitations","#module-group-invitation"],["Death / Bhog","#module-group-grief-help"],["Sale Posters","#module-group-sale"],["Public Notices","#module-group-public"]]],
 ["EVERYDAY TOOLS",[["HEIC → JPG Converter","image-format-converter.html"],["PDF Converter","pdf-tools.html"],["Passport Photo","passport-photo.html"],["ID Card Page Maker","card-page-maker.html"],["Resume Maker","resume-maker.html"]]]
];
for(const [name,links] of sections){
 const label=document.createElement("p");label.className="tpw-main-drawer-label";label.textContent=name;drawer.append(label);
 for(const [text,href] of links){
  const anchor=document.createElement("a");anchor.href=href;anchor.textContent=text;drawer.append(anchor);
 }
}
const overlay=document.createElement("div");overlay.className="tpw-main-drawer-overlay";
const open=document.createElement("button");open.type="button";open.className="tpw-main-drawer-button";
open.textContent="☰ Menu";open.setAttribute("aria-controls",drawer.id);open.setAttribute("aria-expanded","false");
function toggle(next){
 document.body.classList.toggle("tpw-main-drawer-open",next);
 open.setAttribute("aria-expanded",String(next));
 if(next)close.focus();else open.focus();
}
open.addEventListener("click",()=>toggle(true));
close.addEventListener("click",()=>toggle(false));
overlay.addEventListener("click",()=>toggle(false));
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&document.body.classList.contains("tpw-main-drawer-open"))toggle(false)});
drawer.addEventListener("click",e=>{
 const a=e.target.closest("a");if(!a)return;
 if(a.hash&&a.pathname===location.pathname){
  document.body.classList.remove("tpw-main-drawer-open");
  open.setAttribute("aria-expanded","false");
 }
});
document.body.append(overlay,drawer,open);
