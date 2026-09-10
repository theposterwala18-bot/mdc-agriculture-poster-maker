const measurementId = String(window.MDC_ANALYTICS_ID || "").trim();

function moduleNameFromPage() {
  const page = location.pathname.split("/").pop() || "index.html";
  if (page === "general-sale.html") return "general_sale";
  if (page === "death-bhog.html") return "death_bhog";
  return "module_hub";
}

function safeTrack(eventName, parameters = {}) {
  if (!measurementId || typeof window.gtag !== "function") return;
  window.gtag("event", eventName, {
    module_name: moduleNameFromPage(),
    ...parameters
  });
}

window.mdcTrack = safeTrack;

if (/^G-[A-Z0-9]+$/i.test(measurementId)) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });

  const tag = document.createElement("script");
  tag.async = true;
  tag.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(tag);
}

document.addEventListener("click", (event) => {
  const moduleCard = event.target.closest?.("[data-module-id]");
  if (moduleCard) safeTrack("module_open", { selected_module: moduleCard.dataset.moduleId || "unknown" });

  if (event.target.closest?.("#donateButton")) safeTrack("donation_qr_view");
  if (event.target.closest?.(".upi-pay-button")) safeTrack("donation_intent", { payment_method: "upi" });

  if (event.target.closest?.("#downloadButton, #gsDownloadButton, #bhogDownloadButton")) safeTrack("poster_download");
  if (event.target.closest?.("#smartFillButton, #gsSmartFillButton, #bhogSmartFillButton")) safeTrack("smart_fill_used");

  const template = event.target.closest?.("[data-template-id], [data-gs-template], [data-bhog-template]");
  if (template) {
    safeTrack("template_select", {
      template_id: template.dataset.templateId || template.dataset.gsTemplate || template.dataset.bhogTemplate || "unknown"
    });
  }
});

document.addEventListener("change", (event) => {
  if (event.target instanceof HTMLInputElement && event.target.type === "file" && event.target.files?.length) {
    safeTrack("photo_upload", { upload_control: event.target.id || "file_input" });
  }
});

safeTrack("module_view");
