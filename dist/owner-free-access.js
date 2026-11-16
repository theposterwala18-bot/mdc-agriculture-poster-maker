// Owner-only Free Access Manager; isolated from payment settings and Razorpay.
const API="https://the-poster-wala-payment-api.theposterwala18.workers.dev";
const $=id=>document.getElementById(id);
const feedback=(message,failed=false)=>{const node=$("freeAccessStatus");node.textContent=message;node.classList.toggle("error",failed)};
let entries=[];
let editing=null; // {email,mode} for existing guest grant
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
function startEdit(row,mode){
 editing={email:row.email,mode};
 $("freeAccessEmail").value=row.email;
 $("freeAccessEmail").readOnly=true;
 $("freeAccessGrant").textContent=mode==="reactivate"?"Reactivate Access":"Save New Duration";
 $("freeAccessCancel").hidden=false;
 // Duration selection is deliberately explicit. The owner selects the new period,
 // measured from the moment the change is saved.
 $("freeAccessDays").value="7";
 $("freeCustomLabel").hidden=true;
 feedback((mode==="reactivate"?"Reactivate ":"Edit duration for ")+row.email+": choose days and click the green Save button.");
 $("freeAccessForm").scrollIntoView({behavior:"smooth",block:"center"});
 $("freeAccessDays").focus();
}
function cancelEdit(){
 editing=null;
 $("freeAccessEmail").readOnly=false;
 $("freeAccessEmail").value="";
 $("freeAccessGrant").textContent="Grant / Extend Access";
 $("freeAccessCancel").hidden=true;
 feedback("Ready to add a new guest.");
}
function actionButton(label,css,onclick){
 const b=document.createElement("button");
 b.type="button";b.className=css;b.textContent=label;b.addEventListener("click",onclick);
 return b;
}
function draw(){
 const tbody=$("freeAccessRows");tbody.replaceChildren();
 for(const row of entries){
  const tr=document.createElement("tr");
  for(const value of [row.email,dateDisplay(row.expires_at),row.active?"Active":row.revoked_at!=null?"Revoked":"Expired"]){
   const td=document.createElement("td");td.textContent=value;tr.append(td);
  }
  const cell=document.createElement("td");cell.className="free-row-actions";
  if(row.active){
   cell.append(actionButton("Edit Duration","free-edit",()=>startEdit(row,"edit")));
   cell.append(actionButton("Remove Access","free-revoke",async()=>{
    if(!confirm("Remove free download access for "+row.email+"? Standard customer rules will apply."))return;
    try{await call("/owner/free-access/revoke",{email:row.email});if(editing?.email===row.email)cancelEdit();await load();feedback("Free Access removed successfully.")}catch(e){feedback(e.message,true)}
   }));
  }else{
   cell.append(actionButton("Reactivate","free-edit",()=>startEdit(row,"reactivate")));
  }
  cell.append(actionButton("Permanent Delete","free-permanent-delete",async()=>{
   const typed=window.prompt("PERMANENT DELETE: Type the exact guest email to remove its grant record. Existing payment and download history will NOT be deleted.\n\n"+row.email,"");
   if(typed===null)return;
   const confirmed=typed.trim().toLowerCase();
   if(confirmed!==row.email){feedback("Email did not match. Nothing was deleted.",true);return}
   if(!confirm("Permanently delete Free Access entry for "+row.email+"? You will have to add this email again to grant free access."))return;
   try{const result=await call("/owner/free-access/delete",{email:row.email,confirmEmail:confirmed});if(editing?.email===row.email)cancelEdit();await load();feedback(result.deleted?"Guest Free Access entry permanently deleted.":"This entry was already deleted.")}catch(e){feedback(e.message,true)}
  }));
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
$("freeAccessCancel").addEventListener("click",cancelEdit);
$("freeAccessForm").addEventListener("submit",async event=>{
 event.preventDefault();
 const email=$("freeAccessEmail").value.trim().toLowerCase();
 if(editing && email!==editing.email){feedback("Selected guest email cannot be changed. Cancel and add a new email.",true);return}
 const selected=$("freeAccessDays").value;
 const days=Number(selected==="custom"?$("freeCustomDays").value:selected);
 if(!email||!Number.isInteger(days)||days<1||days>365){feedback("Enter a valid email and duration (1–365 days)",true);return}
 const button=$("freeAccessGrant");button.disabled=true;feedback("Saving permission…");
 try{
  await call("/owner/free-access/grant",{email,days});
  const message=editing?.mode==="reactivate"?"Guest Free Access reactivated.":editing?.mode==="edit"?"Guest duration updated.":"Free access granted successfully.";
  cancelEdit();
  await load();feedback(message);
 }catch(e){feedback(e.message,true)}
 finally{button.disabled=false}
});
// Hide management panel until owner dashboard confirms the user's role.
window.addEventListener("tpw-auth-changed",()=>setTimeout(()=>{if(!$("dashboardContent").hidden)load()},350));
const observer=new MutationObserver(()=>{if(!$("dashboardContent").hidden){observer.disconnect();load()}});
observer.observe($("dashboardContent"),{attributes:true,attributeFilter:["hidden"]});
if(!$("dashboardContent").hidden){observer.disconnect();load()}

