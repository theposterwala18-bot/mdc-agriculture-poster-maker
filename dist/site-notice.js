// Isolated public notice renderer. Does not interact with poster or payment functions.
(() => {
  "use strict";
  const API = "https://the-poster-wala-notices.theposterwala18.workers.dev/notice";
  const box = document.createElement("aside");
  box.id = "tpwSiteNotice";
  box.className = "tpw-site-notice";
  box.setAttribute("role", "status");
  box.setAttribute("aria-live", "polite");
  box.hidden = true;
  const icon = document.createElement("span");
  icon.className = "tpw-site-notice-icon";
  icon.setAttribute("aria-hidden", "true");
  const label = document.createElement("strong");
  const message = document.createElement("span");
  message.className = "tpw-site-notice-message";
  box.append(icon, label, message);
  document.body.prepend(box);
  const titles = {warning:"Important Notice",info:"Website Update",success:"Good News"};
  const icons = {warning:"⚠",info:"ℹ",success:"✓"};
  let activeRequest = false;
  async function refreshNotice() {
    if(activeRequest) return;
    activeRequest = true;
    try {
      const response = await fetch(API, {cache:"no-store"});
      if(!response.ok) throw Error("Notice unavailable");
      const data = await response.json();
      const n = data?.notice;
      if(!data?.success || n?.enabled !== true || typeof n.message !== "string" || !n.message.trim()) {
        box.hidden = true;
        return;
      }
      const kind = ["warning","info","success"].includes(n.type) ? n.type : "warning";
      box.className = "tpw-site-notice tpw-site-notice-" + kind;
      icon.textContent = icons[kind];
      label.textContent = titles[kind];
      message.textContent = n.message.slice(0,500);
      box.hidden = false;
    } catch(error) {
      // On failure, do not display an outdated notice.
      box.hidden = true;
      console.warn("Website notice could not refresh",error);
    } finally { activeRequest = false; }
  }
  refreshNotice();
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)refreshNotice()});
  setInterval(()=>{if(!document.hidden)refreshNotice()},60000);
})();
