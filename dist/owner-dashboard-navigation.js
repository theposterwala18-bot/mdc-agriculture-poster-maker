// Owner Dashboard navigation only. Existing sections/controls retain their original
// DOM identities, event listeners, endpoints and Save All Settings implementation.
(() => {
  const viewNames = new Set(["home","settings","free-access","notices","analytics","payments","downloads"]);
  const parsed = new URLSearchParams(location.search).get("view") || "home";
  const selected = viewNames.has(parsed) ? parsed : "home";
  const content = document.getElementById("dashboardContent");
  const status = document.getElementById("dashboardStatus");
  if (!content || !status) return;

  const sections = [...content.children].filter(el => el.tagName === "SECTION");
  const findSection = selector => content.querySelector(selector)?.closest("section");
  const notice = findSection(".tpw-notice-panel");
  const free = findSection(".free-access-panel");
  const owner = findSection(".control-panel");
  const analytics = findSection(".analytics-card");
  const payments = document.getElementById("paymentsBody")?.closest("section");
  const downloads = document.getElementById("downloadsBody")?.closest("section");
  const summary = content.querySelector(".summary-grid");

  // Use <details> without reconstructing inputs or form HTML, so existing
  // owner save logic continues reading exactly the same element IDs.
  function groupInDetails(parent, elements, name, initiallyOpen=false) {
    const details = document.createElement("details");
    details.className = "owner-setting-group";
    details.open = initiallyOpen;
    const heading = document.createElement("summary");
    heading.textContent = name;
    details.append(heading);
    elements.filter(Boolean).forEach(el => details.append(el));
    parent.insertBefore(details, parent.querySelector("#settingsMessage"));
  }
  if (owner && !owner.querySelector(".owner-setting-group")) {
    const grid = owner.querySelector(".settings-grid");
    const promos = owner.querySelector("#promoSettings");
    const modules = owner.querySelector("#moduleSettings");
    const plans = owner.querySelector("#planSettings");
    function headingFor(node) {
      return node?.previousElementSibling?.classList.contains("sub-heading") ? node.previousElementSibling : null;
    }
    const promoHeader = promos?.previousElementSibling?.classList.contains("promo-help") ?
      promos.previousElementSibling.previousElementSibling : headingFor(promos);
    const promoHelp = owner.querySelector(".promo-help");
    const moduleHeader = headingFor(modules);
    const planHeader = headingFor(plans);
    groupInDetails(owner, [grid], "Owner Controls — Daily Free, Prices & Download Limits", true);
    groupInDetails(owner, [promoHeader,promoHelp,promos], "Homepage Promotions");
    groupInDetails(owner, [moduleHeader,modules], "Module-wise Controls");
    groupInDetails(owner, [planHeader,plans], "Monthly / 6 Month / Yearly Plans");
    const message = document.createElement("p");
    message.className = "owner-saving-hint";
    message.textContent = "Minimize/Maximize ਨਾਲ ਕੋਈ Setting Save ਜਾਂ Reset ਨਹੀਂ ਹੁੰਦੀ। Save All Settings ਨੂੰ ਦਬਾਉਣ ਨਾਲ ਹੀ Changes Save ਹੋਣਗੀਆਂ।";
    owner.querySelector(".card-heading")?.after(message);
  }

  // Free Access remains on the SAME Settings page, collapsible, and can also be
  // opened directly as its own focused view. Preserve its exact original section.
  let freeWrapper=null;
  if(free){
    freeWrapper=document.createElement("details");
    freeWrapper.className="owner-setting-group owner-free-wrapper";
    freeWrapper.open=selected==="free-access";
    const summaryTitle=document.createElement("summary");
    summaryTitle.textContent="Free Access Manager — Emails & Expiry";
    free.before(freeWrapper);
    freeWrapper.append(summaryTitle,free);
  }

  const menu = [
    ["home","Overview","layout-dashboard"],
    ["settings","Owner Settings","settings"],
    ["free-access","Free Access","shield-check"],
    ["notices","Website Notices","megaphone"],
    ["analytics","Analytics","chart-no-axes-column"],
    ["payments","Payments","credit-card"],
    ["downloads","Downloads","download"]
  ];
  const nav = document.createElement("nav");
  nav.className = "owner-view-nav";
  nav.setAttribute("aria-label","Owner dashboard sections");
  for (const [key,label] of menu) {
    const a = document.createElement("a");
    a.href = "owner-dashboard.html?view="+encodeURIComponent(key);
    a.textContent = label;
    a.className = "owner-view-link" + (selected===key ? " is-current":"");
    if (selected===key) a.setAttribute("aria-current","page");
    nav.append(a);
  }
  content.before(nav);

  const cards = document.createElement("section");
  cards.className="owner-home-cards";
  cards.setAttribute("aria-label","Management modules");
  for(const [key,label] of menu.filter(x=>x[0]!=="home")){
    const a=document.createElement("a");
    a.href="owner-dashboard.html?view="+encodeURIComponent(key);
    a.className="owner-home-card";
    const icon=document.createElement("span");icon.className="owner-home-card-icon";
    icon.textContent=({"settings":"⚙","free-access":"✓","notices":"✉","analytics":"▥","payments":"₹","downloads":"↓"})[key];
    const title=document.createElement("strong");title.textContent=label;
    const subtitle=document.createElement("small");
    subtitle.textContent=({"settings":"Prices, Modules & Plans","free-access":"Guest Email Permissions","notices":"Publish / Hide Notice","analytics":"Service Activity","payments":"Recent Paid Orders","downloads":"Recent File Records"})[key];
    a.append(icon,title,subtitle);cards.append(a);
  }
  content.insertBefore(cards,summary?.nextSibling||content.firstChild);

  const viewMap = new Map([["settings",owner],["free-access",free],["notices",notice],
    ["analytics",analytics],["payments",payments],["downloads",downloads]]);
  for(const section of sections) {
    const visible = selected==="settings"
      ? (section===owner || section===free)
      : (selected!=="home" && section===viewMap.get(selected));
    section.classList.toggle("owner-view-hidden",!visible);
  }
  if(freeWrapper){
    freeWrapper.classList.toggle("owner-view-hidden",!(selected==="settings"||selected==="free-access"));
  }
  cards.classList.toggle("owner-view-hidden",selected!=="home");
  if (summary) summary.classList.toggle("owner-view-hidden",selected!=="home");

  // A hidden field should not accidentally lose an unsaved owner edit.
  let dirty=false;
  for(const section of [owner,free,notice].filter(Boolean)){
    section.addEventListener("input",()=>{dirty=true});
    section.addEventListener("change",()=>{dirty=true});
  }
  // Do not clear the dirty guard merely on Save click: saving could fail.
  for(const [id,successText] of [["settingsMessage","success"],["freeAccessStatus","success"],["noticeFeedback","success"]]){
    const el=document.getElementById(id);
    if(el)new MutationObserver(()=>{
      if(el.textContent.toLowerCase().includes(successText) &&
         !el.classList.contains("error"))dirty=false;
    }).observe(el,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:["class"]});
  }
  nav.addEventListener("click",event=>{
    const link=event.target.closest("a");
    if(link && dirty && !confirm("ਕੁਝ Settings ਅਜੇ Save ਨਹੀਂ ਹੋਈਆਂ ਹੋ ਸਕਦੀਆਂ। ਬਿਨਾਂ Save ਕੀਤੇ Page ਛੱਡਣਾ ਹੈ?"))event.preventDefault();
  });
  cards.addEventListener("click",event=>{
    const link=event.target.closest("a");
    if(link && dirty && !confirm("ਕੁਝ Settings ਅਜੇ Save ਨਹੀਂ ਹੋਈਆਂ ਹੋ ਸਕਦੀਆਂ। ਬਿਨਾਂ Save ਕੀਤੇ Page ਛੱਡਣਾ ਹੈ?"))event.preventDefault();
  });

  const title = {
    home:"Owner Overview",settings:"Owner Settings", "free-access":"Free Access Manager",
    notices:"Website Notice Manager",analytics:"Custom Service Analytics",
    payments:"Recent Payments",downloads:"Recent Downloads"
  }[selected];
  const h1=document.querySelector(".owner-heading h1");
  if(h1)h1.textContent=title;
  // Existing payment/dashboard APIs intentionally remain unchanged.
})();
