const $=id=>document.getElementById(id);
const keys=["cvName","cvRole","cvEmail","cvPhone","cvCity","cvSummary","cvExperience","cvEducation","cvSkills"];
let photoUrl=null;
function node(tag,content,className){
 const element=document.createElement(tag);element.textContent=content||"";
 if(className)element.className=className;return element;
}
function section(article,title,text){
 if(!text.trim())return;
 article.append(node("h3",title));
 article.append(node("div",text,"entry"));
}
function render(){
 const article=$("resumePreview");article.replaceChildren();
 article.className="tool-preview-page cv-"+$("cvStyle").value;
 if(photoUrl){const image=document.createElement("img");image.className="cv-photo";image.src=photoUrl;image.alt="Resume portrait";article.append(image)}
 article.append(node("h1",$("cvName").value.trim()||"Your Name"));
 article.append(node("p",$("cvRole").value.trim()||"Professional Role","headline"));
 const contact=[$("cvEmail").value,$("cvPhone").value,$("cvCity").value].map(v=>v.trim()).filter(Boolean).join("  •  ");
 if(contact)article.append(node("p",contact,"meta"));
 section(article,"Professional Summary",$("cvSummary").value);
 section(article,"Experience",$("cvExperience").value);
 section(article,"Education",$("cvEducation").value);
 section(article,"Skills",$("cvSkills").value.split(",").map(v=>v.trim()).filter(Boolean).join("  •  "));
}
for(const id of keys)$(id).addEventListener("input",render);
$("cvStyle").addEventListener("change",render);
$("cvPhoto").addEventListener("change",()=>{if(photoUrl){URL.revokeObjectURL(photoUrl);photoUrl=null}const f=$("cvPhoto").files?.[0];if(f&&f.size<=5*1024*1024&&["image/jpeg","image/png","image/webp"].includes(f.type))photoUrl=URL.createObjectURL(f);else if(f)alert("Portrait must be JPG/PNG/WebP under 5 MB");render()});
$("clearResume").addEventListener("click",()=>{for(const id of keys)$(id).value="";$("cvPhoto").value="";if(photoUrl)URL.revokeObjectURL(photoUrl);photoUrl=null;render()});
$("printResume").addEventListener("click",()=>window.print());
render();
window.addEventListener("pagehide",()=>{if(photoUrl)URL.revokeObjectURL(photoUrl)});
