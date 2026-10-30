(()=>{
  "use strict";
  const API="https://the-poster-wala-analytics.theposterwala18.workers.dev";
  const VISITOR_KEY="tpw_custom_service_visitor_v1";
  let visitorId="";

  try{
    visitorId=localStorage.getItem(VISITOR_KEY)||"";
    if(!visitorId){
      visitorId=(crypto.randomUUID?.()||("tpw-"+Date.now()+"-"+Math.random().toString(36).slice(2)));
      localStorage.setItem(VISITOR_KEY,visitorId);
    }
  }catch(_){
    visitorId="session-"+Date.now()+"-"+Math.random().toString(36).slice(2);
  }

  function send(event){
    const body=JSON.stringify({event,visitorId,page:"custom-service"});
    try{
      if(navigator.sendBeacon&&navigator.sendBeacon(API+"/track",new Blob([body],{type:"text/plain;charset=UTF-8"})))return;
    }catch(_){}
    fetch(API+"/track",{method:"POST",headers:{"Content-Type":"text/plain;charset=UTF-8"},body,keepalive:true,mode:"cors"}).catch(()=>{});
  }

  send("page_view");

  document.addEventListener("click",event=>{
    const link=event.target.closest?.("a[href]");
    if(!link)return;
    const href=link.getAttribute("href")||"";
    if(/^mailto:/i.test(href)){send("email_click");return;}
    try{
      const host=new URL(link.href,location.href).hostname.replace(/^www\./,"");
      if(host==="instagram.com")send("instagram_click");
      else if(host==="fiverr.com")send("fiverr_click");
    }catch(_){}
  },{capture:true});
})();