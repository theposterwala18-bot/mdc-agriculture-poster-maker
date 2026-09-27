const VISITOR_BADGE_URL = "https://hits.sh/theposterwala18-bot.github.io/mdc-agriculture-poster-maker/all-visitors.svg?style=flat-square&label=Visitors&color=0b6141";
const QR_BADGE_URL = "https://hits.sh/theposterwala18-bot.github.io/mdc-agriculture-poster-maker/donation-qr-views.svg?style=flat-square&label=QR%20Views&color=c99b43";

function installBrandAssets() {
  const assets = [
    { rel: "icon", type: "image/svg+xml", href: "assets/app-icon.svg" },
    { rel: "apple-touch-icon", href: "assets/apple-touch-icon.png" },
    { rel: "manifest", href: "manifest.webmanifest" }
  ];
  assets.forEach((asset) => {
    if (document.head.querySelector(`link[rel="${asset.rel}"]`)) return;
    const link = document.createElement("link");
    Object.entries(asset).forEach(([name, value]) => link.setAttribute(name, value));
    document.head.appendChild(link);
  });
}

installBrandAssets();

document.querySelectorAll("[data-visitor-counter]").forEach((image) => {
  image.src = VISITOR_BADGE_URL;
  image.addEventListener("error", () => {
    image.hidden = true;
    image.closest(".public-counters")?.querySelector(".counter-fallback")?.removeAttribute("hidden");
  }, { once: true });
});

function moduleIdFromPage() {
  const page = location.pathname.split("/").pop() || "index.html";
  if (page === "general-sale.html") return "general-sale";
  if (page === "death-bhog.html") return "death-bhog";
  if (page === "universal-poster.html") return new URLSearchParams(location.search).get("module") || "universal-poster";
  return "";
}

function cleanModuleId(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "unknown";
}

function ensureModuleCounter() {
  let holder = document.querySelector("[data-module-usage-counter]");
  if (holder) return holder;
  holder = document.createElement("span");
  holder.className = "module-usage-counter header-counter";
  holder.dataset.moduleUsageCounter = "";
  holder.hidden = true;
  holder.setAttribute("aria-live", "polite");
  holder.innerHTML = '<img alt="Module usage count" /><small class="counter-fallback" hidden>Module count unavailable</small>';
  document.querySelector(".topbar-actions")?.appendChild(holder);
  return holder;
}

window.showModuleCounter = (moduleId, moduleName = "") => {
  const holder = ensureModuleCounter();
  const image = holder?.querySelector("img");
  if (!holder || !image || holder.dataset.loadedModule === moduleId) return;
  const safeId = cleanModuleId(moduleId);
  holder.dataset.loadedModule = moduleId;
  holder.hidden = false;
  holder.setAttribute("aria-label", `${moduleName || moduleId} usage count`);
  image.hidden = false;
  image.alt = `${moduleName || moduleId} views`;
  image.src = `https://hits.sh/theposterwala18-bot.github.io/mdc-agriculture-poster-maker/module-${safeId}.svg?style=flat-square&label=Module%20Views&color=0b6141&v=${Date.now()}`;
  image.addEventListener("error", () => {
    image.hidden = true;
    holder.querySelector(".counter-fallback")?.removeAttribute("hidden");
  }, { once: true });
};

const pageModuleId = moduleIdFromPage();
if (pageModuleId) window.showModuleCounter(pageModuleId, document.querySelector("h1")?.textContent?.trim() || pageModuleId);

let qrCounterLoaded = false;
const qrCounter = document.querySelector("[data-qr-view-counter]");
const donateButton = document.getElementById("donateButton");

donateButton?.addEventListener("click", () => {
  if (!qrCounter || qrCounterLoaded) return;
  qrCounterLoaded = true;
  qrCounter.src = QR_BADGE_URL;
  qrCounter.hidden = false;
  qrCounter.addEventListener("error", () => {
    qrCounter.hidden = true;
    qrCounter.closest(".qr-view-counter")?.querySelector(".counter-fallback")?.removeAttribute("hidden");
  }, { once: true });
});
