// Independent owner-managed website notice. Not part of Save All Settings.
(() => {
  "use strict";
  const API="https://the-poster-wala-notices.theposterwala18.workers.dev";
  const form=document.getElementById("siteNoticeForm");
  if(!form)return;
  const enabled=document.getElementById("noticeEnabled");
  const type=document.getElementById("noticeType");
  const message=document.getElementById("noticeMessage");
  const feedback=document.getElementById("noticeFeedback");
  const save=document.getElementById("noticePublish");
  const hide=document.getElementById("noticeHide");
  const preview=document.getElementById("noticePreview");
  let loaded=false;
  function status(text,isError=false){feedback.textContent=text;feedback.style.color=isError?"#b42318":"inherit";}
  function updatePreview(){
    const kind=type.value;
    preview.textContent=(kind==="warning"?"⚠ Important Notice: ":kind==="success"?"✓ Good News: ":"ℹ Website Update: ")+(message.value.trim()||"Your message preview appears here");
    preview.dataset.kind=kind;
  }
  async function load(){
    if(loaded)return;
    try{
      const res=await fetch(API+"/notice",{cache:"no-store"});
      if(!res.ok)throw Error("Unable to load notice");
      const data=await res.json();
      if(!data.success)throw Error("Unable to load notice");
      const n=data.notice||{};
      enabled.checked=n.enabled===true;
      type.value=["warning","info","success"].includes(n.type)?n.type:"warning";
      message.value=String(n.message||"").slice(0,500);
      loaded=true;
      updatePreview();
      status(enabled.checked?"Notice is LIVE on the website.":"Notice is hidden. Ready to edit.");
    }catch(error){status("Notice service unavailable. Please retry / refresh.",true)}
  }
  async function persist(shouldShow){
    if(shouldShow&&!message.value.trim()){status("Write a message before publishing.",true);message.focus();return}
    save.disabled=true;hide.disabled=true;
    status("Saving notice…");
    try{
      const auth=window.ThePosterWalaAuth;
      if(!auth)throw Error("Login service is not ready");
      const token=await auth.getIdToken();
      if(!token)throw Error("Owner login required");
      const res=await fetch(API+"/owner/notice",{
        method:"POST",
        headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},
        body:JSON.stringify({enabled:shouldShow,type:type.value,message:message.value.trim()})
      });
      const data=await res.json().catch(()=>null);
      if(!res.ok||!data?.success)throw Error(data?.error||"Save failed");
      // Verify actual server state before reporting success.
      const check=await fetch(API+"/notice",{cache:"no-store"});
      const saved=await check.json();
      if(!check.ok||!saved.success||saved.notice?.enabled!==shouldShow||saved.notice?.message!==message.value.trim())throw Error("Save verification failed");
      enabled.checked=shouldShow;
      status(shouldShow?"✓ Published! Visitors can see this notice.":"✓ Notice hidden from all visitors.");
    }catch(error){status("✕ "+(error.message||"Save failed"),true)}
    finally{save.disabled=false;hide.disabled=false;}
  }
  form.addEventListener("submit",event=>{event.preventDefault();persist(enabled.checked)});
  hide.addEventListener("click",()=>persist(false));
  message.addEventListener("input",updatePreview);
  type.addEventListener("change",updatePreview);
  const observer=new MutationObserver(()=>{
    const holder=document.getElementById("dashboardContent");
    if(holder&&!holder.hidden){load();observer.disconnect()}
  });
  observer.observe(document.getElementById("dashboardContent"),{attributes:true,attributeFilter:["hidden"]});
  if(!document.getElementById("dashboardContent").hidden)load();
})();
