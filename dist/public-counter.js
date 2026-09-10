const VISITOR_BADGE_URL = "https://hits.sh/theposterwala18-bot.github.io/mdc-agriculture-poster-maker/all-visitors.svg?style=flat-square&label=Visitors&color=0b6141";
const QR_BADGE_URL = "https://hits.sh/theposterwala18-bot.github.io/mdc-agriculture-poster-maker/donation-qr-views.svg?style=flat-square&label=QR%20Views&color=c99b43";

document.querySelectorAll("[data-visitor-counter]").forEach((image) => {
  image.src = VISITOR_BADGE_URL;
  image.addEventListener("error", () => {
    image.hidden = true;
    image.closest(".public-counters")?.querySelector(".counter-fallback")?.removeAttribute("hidden");
  }, { once: true });
});

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
