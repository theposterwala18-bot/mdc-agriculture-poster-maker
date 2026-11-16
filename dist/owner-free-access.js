// Owner-only Free Access Manager; isolated from payment settings and Razorpay.
const API="https://the-poster-wala-payment-api.theposterwala18.workers.dev";
const $=id=>document.getElementById(id);
const feedback=(message,failed=false)=>{const node=$("freeAccessStatus");node.textContent=message;node.classList.toggle("error",failed)};
let entries=[];
function dateDisplay(epoch){return new Date(Number(epoch)*1000).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"})}
async function ownerToken(){
 const auth=window.ThePosterWalaAuth;
 if(!auth)throw Error("Login service is not ready");
 const user=auth.getCurrentUser()||await auth.ready;
 if(!user)throw Error("Owner Google Login required");
 return auth.getIdToken();
}
async function call(path,data={}){
 const token=await ownerToken();
 const response=await fetch(API+path,{method:"POST",headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify(data)});
 const result=await response.json().catch(()=>({}));
 if(!response.ok||!result.success)throw Error(result.error||"Free Access operation failed");
 return result;
}
function draw(){
 const tbody=$("freeAccessRows");tbody.replaceChildren();
 for(const row of entries){
  const tr=document.createElement("tr");
  for(const value of [row.email,dateDisplay(row.expires_at),row.active?"Active":row.revoked_at!=null?"Revoked":"Expired"]){
   const td=document.createElement("td");td.textContent=value;tr.append(td);
  }
  const cell=document.createElement("td");
  if(row.active){
   const button=document.createElement("button");button.type="button";button.textContent="Remove Access";button.className="free-revoke";
   button.addEventListener("click",async()=>{
    if(!confirm("Remove free download access for "+row.email+"? Standard customer rules will apply."))return;
    button.disabled=true;try{await call("/owner/free-access/revoke",{email:row.email});await load();feedback("Free Access removed successfully.")}catch(e){feedback(e.message,true);button.disabled=false}
   });cell.append(button);
  }
  tr.append(cell);tbody.append(tr);
 }
 if(!entries.length){const tr=document.createElement("tr");const td=document.createElement("td");td.colSpan=4;td.textContent="No guest permissions granted.";tr.append(td);tbody.append(tr)}
}
async function load(){
 try{
  const data=await call("/owner/free-access/list");
  entries=data.grants||[];
  $("freeOwnerEmail").textContent=data.ownerEmail||"Owner Google Account";
  draw();
  feedback(entries.filter(x=>x.active).length+" of "+data.limit+" active guest permissions");
 }catch(e){feedback(e.message,true);$("freeAccessRows").replaceChildren()}
}
$("freeAccessDays").addEventListener("change",()=>{$("freeCustomLabel").hidden=$("freeAccessDays").value!=="custom"});
$("freeAccessRefresh").addEventListener("click",load);
$("freeAccessForm").addEventListener("submit",async event=>{
 event.preventDefault();
 const email=$("freeAccessEmail").value.trim().toLowerCase();
 const selected=$("freeAccessDays").value;
 const days=Number(selected==="custom"?$("freeCustomDays").value:selected);
 if(!email||!Number.isInteger(days)||days<1||days>365){feedback("Enter a valid email and duration (1–365 days)",true);return}
 const button=$("freeAccessGrant");button.disabled=true;feedback("Saving permission…");
 try{
  await call("/owner/free-access/grant",{email,days});
  $("freeAccessEmail").value="";
  await load();feedback("Free access granted / extended successfully.");
 }catch(e){feedback(e.message,true)}
 finally{button.disabled=false}
});
// Hide management panel until owner dashboard confirms the user's role.
window.addEventListener("tpw-auth-changed",()=>setTimeout(()=>{if(!$("dashboardContent").hidden)load()},350));
const observer=new MutationObserver(()=>{if(!$("dashboardContent").hidden){observer.disconnect();load()}});
observer.observe($("dashboardContent"),{attributes:true,attributeFilter:["hidden"]});
