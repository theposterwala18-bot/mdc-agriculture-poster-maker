// Navigation only for new tools: existing Poster Maker and Owner Dashboard untouched.
const sections=[
 {name:"Main",items:[["⌂","Home Page","index.html"],["◫","Tools Dashboard","tools.html"]]},
 {name:"Image",items:[["▣","Smart Image Studio","smart-image-studio.html"],["↗","HEIC to JPG","image-format-converter.html"],["✦","Free AI Upscale (External)","ai-upscale.html"],["▥","Passport Photo","passport-photo.html"]]},
 {name:"PDF & Printing",items:[["▤","PDF Converter","pdf-tools.html"],["✎","Edit PDF Text","pdf-text-editor.html"],["▦","ID / Card Page Maker","card-page-maker.html"],["▤","Aadhaar Original Print","aadhaar-print.html"]]},
 {name:"Information",items:[["ℹ","About Us","about.html"],["✉","Contact","contact.html"],["◈","Privacy Policy","privacy-policy.html"],["☷","Terms","terms.html"]]},
 {name:"Professional",items:[["☷","Resume Maker","resume-maker.html"]]}
];
const nav=document.createElement("nav");nav.className="tpw-tools-sidebar";nav.setAttribute("aria-label","Document and Printing Tools");
const brand=document.createElement("a");brand.className="tpw-tools-brand";brand.href="tools.html";brand.textContent="◉ The Poster Wala";nav.append(brand);
const active=location.pathname.split("/").pop()||"tools.html";
for(const group of sections){
 const h=document.createElement("h3");h.textContent=group.name;nav.append(h);
 for(const [emoji,title,href] of group.items){
  const a=document.createElement("a");a.href=href;a.className="tpw-tools-link";a.textContent=emoji+"  "+title;
  if(active===href)a.setAttribute("aria-current","page");nav.append(a);
 }
}
const button=document.createElement("button");button.type="button";button.className="tpw-tools-open";button.textContent="☰ Menu";button.setAttribute("aria-expanded","false");
const overlay=document.createElement("div");overlay.className="tpw-tools-overlay";
function toggle(value){document.body.classList.toggle("tpw-tools-nav-expanded",value);button.setAttribute("aria-expanded",String(value))}
button.addEventListener("click",()=>toggle(!document.body.classList.contains("tpw-tools-nav-expanded")));
overlay.addEventListener("click",()=>toggle(false));
document.addEventListener("keydown",event=>{if(event.key==="Escape")toggle(false)});
document.body.classList.add("tpw-with-tools-nav");
document.body.prepend(nav,button,overlay);
