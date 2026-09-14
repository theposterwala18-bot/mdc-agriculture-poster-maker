import { createPosterExportController } from "./poster-export.js";

const canvas = document.getElementById("posterCanvas");
const ctx = canvas.getContext("2d");
const modalCanvas = document.getElementById("modalCanvas");
const modalCtx = modalCanvas.getContext("2d");

const W = 1080;
const H = 1620;
const FONT = '"Noto Sans Gurmukhi", "Raavi", sans-serif';
let exportController;

function installStableTextAlignment(context) {
  const nativeFillText = CanvasRenderingContext2D.prototype.fillText;
  context.fillText = function stableFillText(text, x, y, maxWidth) {
    const align = this.textAlign;
    const measuredWidth = this.measureText(String(text ?? "")).width;
    let drawX = x;
    if (align === "center") drawX -= measuredWidth / 2;
    else if (align === "right" || align === "end") drawX -= measuredWidth;
    this.save();
    this.textAlign = "left";
    if (Number.isFinite(maxWidth)) nativeFillText.call(this, text, drawX, y, maxWidth);
    else nativeFillText.call(this, text, drawX, y);
    this.restore();
  };
}

installStableTextAlignment(ctx);

const themes = {
  green: { dark: "#073e2b", mid: "#0c5a3b", accent: "#bc1418", gold: "#d7aa3d", paper: "#fbf8eb" },
  blue: { dark: "#10385e", mid: "#17598d", accent: "#ad181d", gold: "#d9aa3b", paper: "#f8f8ee" },
  maroon: { dark: "#651c2a", mid: "#8b2635", accent: "#0c5038", gold: "#d7aa3d", paper: "#fbf5eb" },
  olive: { dark: "#34492f", mid: "#586f47", accent: "#9d3524", gold: "#d2ad54", paper: "#fff9e9" },
  mustard: { dark: "#4b3818", mid: "#766027", accent: "#8d1d24", gold: "#e2ad31", paper: "#fff8e3" },
  charcoal: { dark: "#1d2924", mid: "#35463e", accent: "#a91f2b", gold: "#d5ae54", paper: "#f8f5ea" },
  clean: { dark: "#244b3e", mid: "#39745f", accent: "#b01f2b", gold: "#c99c3d", paper: "#ffffff" },
  emerald: { dark: "#053d2c", mid: "#096147", accent: "#a11225", gold: "#e1b84e", paper: "#fffaf0" },
  sapphire: { dark: "#102d52", mid: "#194f82", accent: "#b22632", gold: "#e1b75a", paper: "#f8f9f5" },
  burgundy: { dark: "#561825", mid: "#7f2634", accent: "#0b503b", gold: "#dfb654", paper: "#fff8ed" },
  copper: { dark: "#153d31", mid: "#245d49", accent: "#a84d25", gold: "#d69a55", paper: "#fff8ee" },
  midnight: { dark: "#121d2b", mid: "#24354c", accent: "#9c2130", gold: "#e2bd63", paper: "#f7f4e9" },
  ivory: { dark: "#39493f", mid: "#65756a", accent: "#912c37", gold: "#cba35e", paper: "#fffdf6" },
  teal: { dark: "#0a4144", mid: "#126a6b", accent: "#a72830", gold: "#e0b759", paper: "#f7fcf8" },
  crimson: { dark: "#441b22", mid: "#6b2833", accent: "#b31123", gold: "#e1b457", paper: "#fff8ed" },
  heritage: { dark: "#39452b", mid: "#5b6940", accent: "#8f3026", gold: "#d7b75e", paper: "#fbf8e9" },
  blackgold: { dark: "#171b19", mid: "#2b332f", accent: "#8f1f2d", gold: "#e0b94e", paper: "#fbf7e9" }
};

const templates = [
  { id: 1, name: "Classic Emerald", note: "ਰਵਾਇਤੀ ਸੁਸਾਇਟੀ ਨੋਟਿਸ", layout: "classic", look: "classic", theme: "green" },
  { id: 2, name: "Royal Blue Notice", note: "ਨੀਲਾ ਸਾਫ਼ ਲੇਆਉਟ", layout: "classic", look: "classic", theme: "blue" },
  { id: 3, name: "Maroon Sabha", note: "ਮੈਰੂਨ ਤੇ ਗੋਲਡ", layout: "classic", look: "premium", theme: "maroon" },
  { id: 4, name: "Punjab Green Cards", note: "side panel ਨਾਲ cards", layout: "modern", look: "modern", theme: "olive" },
  { id: 5, name: "Blue Split", note: "modern split layout", layout: "modern", look: "editorial", theme: "sapphire" },
  { id: 6, name: "Red Auction", note: "ਵੱਡਾ auction title", layout: "bold", look: "bold", theme: "crimson" },
  { id: 7, name: "Teal Equipment", note: "ਸੰਦਾਂ ਲਈ ਸਾਫ਼ cards", layout: "modern", look: "modern", theme: "teal" },
  { id: 8, name: "Mustard Farm", note: "ਦੇਸੀ mustard colour", layout: "bold", look: "premium", theme: "mustard" },
  { id: 9, name: "Charcoal Gold", note: "dark ਅਤੇ premium contrast", layout: "bold", look: "bold", theme: "charcoal" },
  { id: 10, name: "Clean White", note: "ਘੱਟ colour, ਸਾਫ਼ ਜਾਣਕਾਰੀ", layout: "classic", look: "editorial", theme: "clean" },
  { id: 11, name: "Emerald Prestige", note: "ਤੁਹਾਡੇ ਪਹਿਲੇ reference ਵਰਗਾ balanced notice", layout: "classic", itemLayout: "classic", look: "premium", theme: "emerald", premium: true },
  { id: 12, name: "List + Photo Catalog", note: "ਖੱਬੇ list, ਸੱਜੇ machinery photo grid", layout: "classic", itemLayout: "list-grid", look: "editorial", theme: "emerald", premium: true },
  { id: 13, name: "Big Date Auction", note: "ਵੱਡੀ date ਅਤੇ 3-column machinery focus", layout: "bold", itemLayout: "catalog", look: "premium", theme: "sapphire", premium: true },
  { id: 14, name: "Five Strip Notice", note: "ਇੱਕ ਲਾਈਨ ਵਿੱਚ compact machinery strip", layout: "classic", itemLayout: "strip", look: "classic", theme: "heritage", premium: true },
  { id: 15, name: "Ten Item Catalog", note: "5 × 2 professional machinery catalog", layout: "bold", itemLayout: "catalog", look: "premium", theme: "emerald", premium: true },
  { id: 16, name: "Public Notice Table", note: "ਘੱਟ ਸੰਦਾਂ ਲਈ ਵੱਡੀ photo presentation", layout: "classic", itemLayout: "duo", look: "editorial", theme: "burgundy", premium: true },
  { id: 17, name: "Field Feature Duo", note: "ਦੋ hero photos ਅਤੇ premium contact focus", layout: "bold", itemLayout: "duo", look: "premium", theme: "emerald", premium: true },
  { id: 18, name: "Legal Auction Cards", note: "4 large cards, strong date ਅਤੇ terms", layout: "classic", itemLayout: "legal", look: "bold", theme: "crimson", premium: true },
  { id: 19, name: "Farm Scene Catalog", note: "green-gold catalog with strong hierarchy", layout: "modern", itemLayout: "catalog", look: "modern", theme: "copper", premium: true },
  { id: 20, name: "Black Gold Elite", note: "premium 5 × 2 catalogue look", layout: "bold", itemLayout: "catalog", look: "premium", theme: "blackgold", premium: true },
  { id: 21, name: "Hero Implement Spotlight", note: "ਇੱਕ ਖਾਸ ਸੰਦ ਵੱਡਾ, ਬਾਕੀ compact cards ਵਿੱਚ", layout: "classic", itemLayout: "spotlight", look: "spotlight", theme: "emerald", premium: true }
];

const moduleGroups = [
  {
    id: "sale",
    name: "Sale ਅਤੇ ਇਸ਼ਤਿਹਾਰ",
    icon: "🏷️",
    modules: [
      { id: "agri-sale", name: "Agri Implement Sale Notice", punjabi: "ਖੇਤੀਬਾੜੀ ਸੰਦਾਂ ਦੀ ਨਿਲਾਮੀ", icon: "🌾", available: true },
      { id: "vehicle-sale", name: "Car / Bike Sale", punjabi: "ਕਾਰ ਜਾਂ ਮੋਟਰਸਾਈਕਲ ਵੇਚਣ ਦਾ Poster", icon: "🚗", available: true },
      { id: "animal-sale", name: "Dog / Animal Sale", punjabi: "ਕੁੱਤਾ ਜਾਂ ਹੋਰ ਪਸ਼ੂ ਵੇਚਣ ਦਾ Poster", icon: "🐕", available: true },
      { id: "general-sale", name: "General Item Sale", punjabi: "ਕਿਸੇ ਵੀ ਸਮਾਨ ਦੀ Sale", icon: "📦", available: true }
    ]
  },
  {
    id: "invitation",
    name: "ਖੁਸ਼ੀ ਅਤੇ Invitation",
    icon: "✨",
    modules: [
      { id: "wedding", name: "Wedding Invitation", punjabi: "ਵਿਆਹ ਦਾ ਸੱਦਾ", icon: "💍", available: true },
      { id: "path", name: "Akhand Path / Sukhmani Sahib", punjabi: "ਧਾਰਮਿਕ ਸਮਾਗਮ ਦਾ ਸੱਦਾ", icon: "🙏", available: true },
      { id: "general-invite", name: "General Invitation", punjabi: "ਕਿਸੇ ਵੀ ਖੁਸ਼ੀ ਦਾ Invitation", icon: "💌", available: true }
    ]
  },
  {
    id: "grief-help",
    name: "ਗਮੀ, ਅਫਸੋਸ ਅਤੇ ਮਦਦ",
    icon: "🕊️",
    modules: [
      { id: "missing", name: "Missing Person Notice", punjabi: "ਗੁੰਮਸ਼ੁਦਾ ਦੀ ਤਲਾਸ਼", icon: "🔎", available: true },
      { id: "death", name: "Death / Bhog Notice", punjabi: "ਮੌਤ, ਅਫਸੋਸ ਅਤੇ ਭੋਗ ਦਾ Poster", icon: "🕯️", available: true },
      { id: "condolence", name: "Condolence Notice", punjabi: "ਸ਼ੋਕ ਅਤੇ ਅਫਸੋਸ ਸੰਦੇਸ਼", icon: "🤍", available: true }
    ]
  },
  {
    id: "public",
    name: "Meeting ਅਤੇ Public Notice",
    icon: "📣",
    modules: [
      { id: "meeting", name: "Meeting Notice", punjabi: "ਮੀਟਿੰਗ ਦੀ ਜਾਣਕਾਰੀ", icon: "🤝", available: true },
      { id: "protest", name: "Dharna / Strike Notice", punjabi: "ਧਰਨਾ, ਹੜਤਾਲ ਜਾਂ ਇਕੱਠ", icon: "✊", available: true },
      { id: "announcement", name: "Public Announcement", punjabi: "ਆਮ ਜਨਤਕ ਸੂਚਨਾ", icon: "📢", available: true }
    ]
  }
];

const defaultState = {
  theme: "green",
  templateId: 1,
  template: "classic",
  leftLogo: null,
  rightLogo: null,
  leftLogoScale: 1,
  rightLogoScale: 1,
  featuredItemIndex: 0,
  topLine: "ਪਿੰਡ ਮੋਹਰ ਸਿੰਘ ਵਾਲਾ ਤਹਿਸੀਲ ਤੇ ਜ਼ਿਲ੍ਹਾ ਮਾਨਸਾ",
  title: "ਨਿਲਾਮੀ ਨੋਟਿਸ",
  subtitle: "ਆਮ ਅਤੇ ਖਾਸ ਵਿਅਕਤੀਆਂ ਨੂੰ ਇਸ ਇਸ਼ਤਿਹਾਰ ਰਾਹੀਂ ਸੂਚਿਤ ਕੀਤਾ ਜਾਂਦਾ ਹੈ ਕਿ",
  societyName: "ਦੀ ਮੋਹਰ ਸਿੰਘ ਵਾਲਾ ਐਮ.ਪੀ.ਸੀ.ਏ.ਐਸ.ਐਸ ਲਿਮਿਟਡ",
  noticeText: "ਮੋਹਰ ਸਿੰਘ ਵਾਲਾ (ਜ਼ਿਲ੍ਹਾ ਮਾਨਸਾ) ਵਿਖੇ ਪੁਰਾਣੇ ਖੇਤੀਬਾੜੀ ਸੰਦਾਂ ਦੀ ਬੋਲੀ ਸਭਾ ਦੇ ਦਫ਼ਤਰ ਵਿਖੇ ਰੱਖੀ ਗਈ ਹੈ।",
  announcement: "ਸੰਦਾਂ ਦਾ ਵੇਰਵਾ ਹੇਠ ਲਿਖੇ ਅਨੁਸਾਰ ਹੈ।",
  date: "11-08-2026",
  time: "ਸਵੇਰੇ 10:30 ਵਜੇ",
  venue: "ਦੀ ਮੋਹਰ ਸਿੰਘ ਵਾਲਾ ਐਮ.ਪੀ.ਸੀ.ਏ.ਐਸ.ਐਸ ਲਿਮਿਟਡ, ਮੋਹਰ ਸਿੰਘ ਵਾਲਾ",
  conditions: "ਹਰ ਬੋਲੀਕਾਰ ਨੂੰ ਬੋਲੀ ਵਿੱਚ ਹਿੱਸਾ ਲੈਣ ਤੋਂ ਪਹਿਲਾਂ 5000/- ਰੁਪਏ ਸਕਿਉਰਿਟੀ ਵਜੋਂ ਜਮ੍ਹਾਂ ਕਰਵਾਉਣੇ ਲਾਜ਼ਮੀ ਹੋਣਗੇ।\nਨਿਲਾਮੀ ਖੁੱਲ੍ਹੀ ਬੋਲੀ ਰਾਹੀਂ ਕੀਤੀ ਜਾਵੇਗੀ।\nਹਰ ਸ਼ਰਤ ਮੌਕੇ ’ਤੇ ਦੱਸੀ ਜਾਵੇਗੀ।\nਕਿਸੇ ਵੀ ਜਾਂ ਸਾਰੀਆਂ ਬੋਲੀਆਂ ਨੂੰ ਰੱਦ ਕਰਨ ਦਾ ਪੂਰਾ ਅਧਿਕਾਰ ਸਭਾ ਕਮੇਟੀ ਕੋਲ ਹੋਵੇਗਾ।",
  items: [
    { name: "ਐਮ ਬੀ ਪਲੌ ਹਲ", qty: "1 ਨਗ", image: null, originalImage: null, processedImage: null, mode: "original", bg: "#ffffff", scale: 1 },
    { name: "ਰੋਟਾਵੇਟਰ 7 ਫੁੱਟ", qty: "1 ਨਗ", image: null, originalImage: null, processedImage: null, mode: "original", bg: "#fff4dc", scale: 1 },
    { name: "ਸੀਡ ਡਰਿੱਲ 11 ਪੈਰੀ", qty: "1 ਨਗ", image: null, originalImage: null, processedImage: null, mode: "original", bg: "#e7f2e8", scale: 1 },
    { name: "ਤਵੀਆਂ 14 ਤਵੇ", qty: "1 ਨਗ", image: null, originalImage: null, processedImage: null, mode: "original", bg: "#edf3f8", scale: 1 }
  ],
  contacts: [
    { name: "ਦਰਸ਼ਨ ਸਿੰਘ", role: "ਪ੍ਰਧਾਨ", phone: "78145 23492" },
    { name: "ਗੁਰਮੀਤ ਸਿੰਘ", role: "ਮੀਤ ਪ੍ਰਧਾਨ", phone: "98784 32013" },
    { name: "ਬਲਜੀਤ ਸਿੰਘ", role: "ਸਕੱਤਰ", phone: "98150 36664" }
  ]
};

let state = cloneDefaults();
let toastTimer;
let backgroundRemovalLoader;

const referenceImage = new Image();
referenceImage.src = "assets/reference-poster.jpeg";
referenceImage.onload = () => {
  makeReferenceThumbnails();
  renderPoster();
};

function cloneDefaults() {
  return JSON.parse(JSON.stringify(defaultState));
}

function getActiveTemplate() {
  return templates.find((template) => template.id === Number(state.templateId)) || templates[0];
}

function renderModuleHub() {
  const holder = document.getElementById("moduleGroups");
  holder.innerHTML = moduleGroups.map((group) => `
    <section class="module-group" aria-labelledby="module-group-${group.id}">
      <h3 class="module-group-title" id="module-group-${group.id}"><span aria-hidden="true">${group.icon}</span>${group.name}</h3>
      <div class="module-card-grid">
        ${group.modules.map((module) => `
          <button class="module-card ${module.available ? "available" : ""}" type="button" data-module-id="${module.id}" aria-label="${escapeAttribute(module.name)} — ${escapeAttribute(module.punjabi)}">
            <span class="module-card-icon" aria-hidden="true">${module.icon}</span>
            <span class="module-card-copy"><strong>${module.name}</strong><small>${module.punjabi}</small></span>
            <span class="module-status">${module.available ? "OPEN" : "COMING NEXT"}</span>
          </button>
        `).join("")}
      </div>
    </section>
  `).join("");
  holder.querySelectorAll("[data-module-id]").forEach((button) => {
    button.addEventListener("click", () => openModule(button.dataset.moduleId));
  });
}

function openModule(moduleId) {
  const selected = moduleGroups.flatMap((group) => group.modules).find((module) => module.id === moduleId);
  if (!selected?.available) {
    showToast(`${selected?.name || "ਇਹ module"} ਅਗਲੀ update ਵਿੱਚ ਬਣੇਗਾ।`);
    return;
  }
  if (moduleId === "general-sale") {
    window.location.href = "general-sale.html";
    return;
  }
  if (moduleId === "death") {
    window.location.href = "death-bhog.html";
    return;
  }
  if (moduleId !== "agri-sale") {
    window.location.href = `universal-poster.html?module=${encodeURIComponent(moduleId)}`;
    return;
  }
  document.getElementById("activeModuleTitle").textContent = selected.name;
  document.getElementById("moduleHub").classList.add("is-hidden");
  document.getElementById("posterWorkspace").classList.remove("is-hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
  renderPoster();
}

function showModuleHub() {
  document.getElementById("posterWorkspace").classList.add("is-hidden");
  document.getElementById("moduleHub").classList.remove("is-hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setFont(context, size, weight = 700) {
  context.font = `${weight} ${size}px ${FONT}`;
}

function roundedPath(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function fillRound(context, x, y, width, height, radius, color) {
  roundedPath(context, x, y, width, height, radius);
  context.fillStyle = color;
  context.fill();
}

function strokeRound(context, x, y, width, height, radius, color, lineWidth = 2) {
  roundedPath(context, x, y, width, height, radius);
  context.strokeStyle = color;
  context.lineWidth = lineWidth;
  context.stroke();
}

function fitFont(context, text, maxWidth, start, min = 18, weight = 800) {
  let size = start;
  while (size > min) {
    setFont(context, size, weight);
    if (context.measureText(text || " ").width <= maxWidth) break;
    size -= 1;
  }
  return size;
}

function splitLongWord(context, word, maxWidth) {
  const parts = [];
  let part = "";
  for (const character of word) {
    const next = part + character;
    if (context.measureText(next).width > maxWidth && part) {
      parts.push(part);
      part = character;
    } else {
      part = next;
    }
  }
  if (part) parts.push(part);
  return parts;
}

function wrapLines(context, text, maxWidth) {
  const paragraphs = String(text || "").split(/\n+/);
  const lines = [];
  paragraphs.forEach((paragraph) => {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    let line = "";
    words.forEach((rawWord) => {
      const wordsToUse = context.measureText(rawWord).width > maxWidth
        ? splitLongWord(context, rawWord, maxWidth)
        : [rawWord];
      wordsToUse.forEach((word) => {
        const test = line ? `${line} ${word}` : word;
        if (context.measureText(test).width <= maxWidth) {
          line = test;
        } else {
          if (line) lines.push(line);
          line = word;
        }
      });
    });
    if (line) lines.push(line);
  });
  return lines.length ? lines : [""];
}

function drawWrapped(context, text, x, y, maxWidth, lineHeight, maxLines, options = {}) {
  const lines = wrapLines(context, text, maxWidth);
  const visible = lines.slice(0, maxLines);
  if (lines.length > maxLines && visible.length) {
    let last = visible[visible.length - 1];
    while (last.length > 2 && context.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    visible[visible.length - 1] = `${last}…`;
  }
  context.textAlign = options.align || "left";
  context.textBaseline = "alphabetic";
  visible.forEach((line, index) => context.fillText(line, x, y + index * lineHeight));
  return visible.length;
}

function drawContain(context, image, x, y, width, height, sizeMultiplier = 1) {
  if (!image || !image.naturalWidth) return;
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight) * sizeMultiplier;
  const drawW = image.naturalWidth * scale;
  const drawH = image.naturalHeight * scale;
  context.drawImage(image, x + (width - drawW) / 2, y + (height - drawH) / 2, drawW, drawH);
}

function drawItemArtwork(context, item, index, x, y, width, height) {
  const imageScale = Math.max(.55, Math.min(1.6, Number(item.scale) || 1));
  context.save();
  roundedPath(context, x, y, width, height, 10);
  context.clip();
  context.fillStyle = item.mode === "original" ? "#ffffff" : (item.bg || "#ffffff");
  context.fillRect(x, y, width, height);

  const image = item.mode === "original"
    ? (item.originalImage || item.image)
    : (item.processedImage || item.originalImage || item.image);

  if (image && image.complete) {
    if (item.mode === "3d" && item.processedImage) {
      const spotlight = context.createRadialGradient(x + width * .42, y + height * .22, 4, x + width * .5, y + height * .48, width * .72);
      spotlight.addColorStop(0, "rgba(255,255,255,.76)");
      spotlight.addColorStop(.55, "rgba(255,255,255,.16)");
      spotlight.addColorStop(1, "rgba(0,0,0,.10)");
      context.fillStyle = spotlight;
      context.fillRect(x, y, width, height);
      const floor = context.createRadialGradient(x + width / 2, y + height * .84, 4, x + width / 2, y + height * .84, width * .34);
      floor.addColorStop(0, "rgba(0,0,0,.40)");
      floor.addColorStop(1, "rgba(0,0,0,0)");
      context.fillStyle = floor;
      context.beginPath();
      context.ellipse(x + width / 2, y + height * .84, width * .34, height * .08, 0, 0, Math.PI * 2);
      context.fill();
      context.save();
      context.globalAlpha = .34;
      context.filter = "brightness(0) blur(10px)";
      context.translate(11, 15);
      drawContain(context, image, x + 4, y, width - 8, height - 12, imageScale);
      context.restore();
      context.filter = "contrast(1.09) saturate(1.12) drop-shadow(0 12px 8px rgba(0,0,0,.48)) drop-shadow(-2px -2px 1px rgba(255,255,255,.72))";
      drawContain(context, image, x + 4, y - 7, width - 8, height - 10, imageScale);
    } else if (item.mode === "cutout" && item.processedImage) {
      context.filter = "drop-shadow(0 7px 6px rgba(0,0,0,.25))";
      drawContain(context, image, x + 5, y + 4, width - 10, height - 8, imageScale);
    } else {
      drawContain(context, image, x, y, width, height, imageScale);
    }
  } else if (index < 4) {
    drawReferenceCrop(context, index, x, y, width, height);
  } else {
    context.fillStyle = "rgba(20,70,48,.08)";
    context.fillRect(x, y, width, height);
    context.fillStyle = "#718178";
    setFont(context, Math.max(15, Math.min(24, width / 8)), 700);
    context.textAlign = "center";
    context.fillText("Photo Upload ਕਰੋ", x + width / 2, y + height / 2);
  }
  context.restore();
}

function removePlainBackground(sourceImage) {
  const maxSide = 1000;
  const scale = Math.min(1, maxSide / Math.max(sourceImage.naturalWidth, sourceImage.naturalHeight));
  const width = Math.max(1, Math.round(sourceImage.naturalWidth * scale));
  const height = Math.max(1, Math.round(sourceImage.naturalHeight * scale));
  const work = document.createElement("canvas");
  work.width = width;
  work.height = height;
  const workCtx = work.getContext("2d", { willReadFrequently: true });
  workCtx.drawImage(sourceImage, 0, 0, width, height);
  const imageData = workCtx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  const samplePoints = [];
  const insetX = Math.max(2, Math.floor(width * .025));
  const insetY = Math.max(2, Math.floor(height * .025));
  const sampleRadius = Math.max(2, Math.floor(Math.min(width, height) * .012));
  [[insetX, insetY], [width - insetX - 1, insetY], [insetX, height - insetY - 1], [width - insetX - 1, height - insetY - 1]].forEach(([cx, cy]) => {
    for (let sy = -sampleRadius; sy <= sampleRadius; sy += 2) {
      for (let sx = -sampleRadius; sx <= sampleRadius; sx += 2) {
        const px = Math.max(0, Math.min(width - 1, cx + sx));
        const py = Math.max(0, Math.min(height - 1, cy + sy));
        const offset = (py * width + px) * 4;
        samplePoints.push([pixels[offset], pixels[offset + 1], pixels[offset + 2]]);
      }
    }
  });
  samplePoints.sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]));
  const middle = samplePoints[Math.floor(samplePoints.length / 2)] || [255, 255, 255];
  const [bgR, bgG, bgB] = middle;
  const bgBrightness = (bgR + bgG + bgB) / 3;

  for (let i = 0; i < pixels.length; i += 4) {
    const dr = pixels[i] - bgR;
    const dg = pixels[i + 1] - bgG;
    const db = pixels[i + 2] - bgB;
    let distance = Math.sqrt(dr * dr + dg * dg + db * db);
    if (bgBrightness > 225) {
      const nearWhite = 255 - Math.min(pixels[i], pixels[i + 1], pixels[i + 2]);
      distance = Math.min(distance, nearWhite * 1.5);
    }
    const alphaFactor = Math.max(0, Math.min(1, (distance - 24) / 68));
    pixels[i + 3] = Math.round(pixels[i + 3] * alphaFactor);
  }
  workCtx.putImageData(imageData, 0, 0);
  return new Promise((resolve, reject) => {
    work.toBlob((blob) => {
      if (!blob) return reject(new Error("Cutout creation failed"));
      const url = URL.createObjectURL(blob);
      const result = new Image();
      result.onload = () => resolve(result);
      result.onerror = reject;
      result.src = url;
    }, "image/png");
  });
}

async function removeAccurateBackground(item) {
  if (!item.sourceFile) return removePlainBackground(item.originalImage);
  if (!backgroundRemovalLoader) {
    backgroundRemovalLoader = import("https://esm.sh/@imgly/background-removal@1.5.8?bundle");
  }
  const module = await backgroundRemovalLoader;
  const removeBackground = module.default;
  if (typeof removeBackground !== "function") throw new Error("AI background module unavailable");
  const blob = await removeBackground(item.sourceFile, { model: "isnet_fp16", device: "cpu" });
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

async function setItemMode(index, mode) {
  const item = state.items[index];
  if (!item) return;
  if (mode === "original") {
    item.mode = mode;
    renderItemEditors();
    renderPoster();
    return;
  }
  if (!item.originalImage) {
    showToast("ਪਹਿਲਾਂ ਇਸ ਸੰਦ ਦੀ ਆਪਣੀ photo upload ਕਰੋ।");
    return;
  }
  item.mode = mode;
  if (item.processedImage) {
    renderItemEditors();
    renderPoster();
    return;
  }
  item.processing = true;
  renderItemEditors();
  showToast("AI background remove ਹੋ ਰਿਹਾ ਹੈ—ਪਹਿਲੀ ਵਾਰ model load ਹੋਣ ਵਿੱਚ ਸਮਾਂ ਲੱਗ ਸਕਦਾ ਹੈ…");
  try {
    await new Promise((resolve) => setTimeout(resolve, 40));
    let usedQuickFallback = false;
    try {
      item.processedImage = await removeAccurateBackground(item);
    } catch (aiError) {
      item.processedImage = await removePlainBackground(item.originalImage);
      usedQuickFallback = true;
    }
    if (item.processedImage) {
      showToast(usedQuickFallback
        ? "AI model ਨਹੀਂ ਚੱਲਿਆ—Quick BG Clean ਵਰਤੀ ਗਈ ਹੈ।"
        : (mode === "3d" ? "Professional 3D Touch ਤਿਆਰ ਹੈ।" : "AI background remove ਹੋ ਗਿਆ।"));
    }
  } catch (error) {
    item.mode = "original";
    showToast("ਇਸ photo ਦਾ background remove ਨਹੀਂ ਹੋ ਸਕਿਆ।");
  } finally {
    item.processing = false;
    renderItemEditors();
    renderPoster();
  }
}

function drawReferenceCrop(context, index, x, y, width, height) {
  if (!referenceImage.complete || !referenceImage.naturalWidth) return;
  const crops = [
    [18, 602, 236, 205],
    [267, 602, 236, 205],
    [515, 602, 236, 205],
    [764, 602, 236, 205]
  ];
  const [sx, sy, sw, sh] = crops[index];
  const scale = Math.min(width / sw, height / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  context.drawImage(referenceImage, sx, sy, sw, sh, x + (width - dw) / 2, y + (height - dh) / 2, dw, dh);
}

function drawPosterBackground(theme) {
  const activeTemplate = getActiveTemplate();
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = theme.paper;
  ctx.fillRect(0, 0, W, H);
  const wash = ctx.createLinearGradient(0, 0, W, H);
  wash.addColorStop(0, "rgba(255,255,255,.74)");
  wash.addColorStop(.55, "rgba(245,235,200,.12)");
  wash.addColorStop(1, "rgba(219,179,69,.10)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);

  if (state.template === "modern") {
    ctx.fillStyle = theme.dark;
    ctx.fillRect(0, 0, 300, H);
    ctx.fillStyle = theme.gold;
    ctx.fillRect(300, 0, 14, H);
    strokeRound(ctx, 18, 18, W - 36, H - 36, 20, theme.dark, 3);
  } else if (state.template === "bold") {
    ctx.fillStyle = theme.accent;
    ctx.fillRect(0, 0, W, 28);
    ctx.fillRect(0, H - 28, W, 28);
    ctx.fillStyle = theme.gold;
    ctx.fillRect(18, 28, 12, H - 56);
    ctx.fillRect(W - 30, 28, 12, H - 56);
    strokeRound(ctx, 31, 31, W - 62, H - 62, 12, theme.dark, 3);
  } else {
    strokeRound(ctx, 14, 14, W - 28, H - 28, 28, theme.dark, 5);
    strokeRound(ctx, 25, 25, W - 50, H - 50, 22, theme.dark, 2);
  }
  if (activeTemplate.premium) {
    const shine = ctx.createLinearGradient(0, 0, W, H);
    shine.addColorStop(0, "rgba(255,255,255,.18)");
    shine.addColorStop(.45, "rgba(255,255,255,0)");
    shine.addColorStop(1, "rgba(213,174,74,.08)");
    ctx.fillStyle = shine;
    ctx.fillRect(30, 30, W - 60, H - 60);
    ctx.fillStyle = theme.gold;
    ctx.fillRect(62, 46, 110, 4);
    ctx.fillRect(W - 172, 46, 110, 4);
  }
}

function drawSideLogo(context, image, centerX, centerY, size, theme) {
  context.save();
  context.beginPath();
  context.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
  context.closePath();
  context.fillStyle = "#fff";
  context.fill();
  context.clip();
  if (image && image.complete) {
    drawContain(context, image, centerX - size / 2, centerY - size / 2, size, size);
  } else {
    const fallback = context.createLinearGradient(centerX - size / 2, centerY - size / 2, centerX + size / 2, centerY + size / 2);
    fallback.addColorStop(0, theme.gold);
    fallback.addColorStop(1, "#a87717");
    context.fillStyle = fallback;
    context.fillRect(centerX - size / 2, centerY - size / 2, size, size);
    context.fillStyle = theme.dark;
    setFont(context, Math.max(13, size * .23), 900);
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("MDC", centerX, centerY + 2);
  }
  context.restore();
  context.beginPath();
  context.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
  context.strokeStyle = theme.gold;
  context.lineWidth = Math.max(2, size * .055);
  context.stroke();
}

function getLogoScale(side) {
  return Math.max(.5, Math.min(1.6, Number(state[`${side}LogoScale`]) || 1));
}

function drawHeader(theme) {
  if (state.template === "modern") {
    drawSideLogo(ctx, state.leftLogo, 150, 300, 92 * getLogoScale("left"), theme);
    drawSideLogo(ctx, state.rightLogo, 900, 270, 74 * getLogoScale("right"), theme);
    ctx.fillStyle = "#fff";
    setFont(ctx, 22, 800);
    ctx.textAlign = "left";
    drawWrapped(ctx, state.topLine, 48, 78, 212, 31, 3, { align: "left" });
    ctx.fillStyle = theme.gold;
    setFont(ctx, 58, 900);
    ctx.fillText("ਨਿਲਾਮੀ", 47, 208);
    ctx.fillStyle = "#fff";
    setFont(ctx, 37, 900);
    ctx.fillText("ਨੋਟਿਸ", 48, 255);

    ctx.fillStyle = theme.accent;
    const titleSize = fitFont(ctx, state.title, 665, 72, 45, 900);
    setFont(ctx, titleSize, 900);
    ctx.textAlign = "left";
    ctx.fillText(state.title, 355, 115);
    ctx.fillStyle = theme.dark;
    const societySize = fitFont(ctx, state.societyName, 670, 42, 27, 900);
    setFont(ctx, societySize, 900);
    drawWrapped(ctx, state.societyName, 355, 181, 670, societySize + 9, 2, { align: "left" });
    fillRound(ctx, 355, 250, 350, 48, 22, theme.gold);
    ctx.fillStyle = theme.dark;
    setFont(ctx, 23, 900);
    ctx.textAlign = "center";
    ctx.fillText(`ਮਿਤੀ  ${state.date}`, 530, 282);
    return;
  }

  if (state.template === "bold") {
    drawSideLogo(ctx, state.leftLogo, 82, 78, 68 * getLogoScale("left"), theme);
    drawSideLogo(ctx, state.rightLogo, W - 82, 78, 68 * getLogoScale("right"), theme);
    ctx.fillStyle = theme.dark;
    setFont(ctx, 29, 800);
    ctx.textAlign = "center";
    ctx.fillText(state.topLine, W / 2, 83);
    ctx.save();
    ctx.translate(W / 2, 177);
    ctx.transform(1, 0, -.04, 1, 0, 0);
    fillRound(ctx, -455, -60, 910, 118, 10, theme.accent);
    ctx.fillStyle = "#fff";
    const titleSize = fitFont(ctx, state.title, 830, 76, 48, 900);
    setFont(ctx, titleSize, 900);
    ctx.textAlign = "center";
    ctx.fillText(state.title, 0, 25);
    ctx.restore();
    ctx.fillStyle = theme.dark;
    const societySize = fitFont(ctx, state.societyName, 940, 47, 29, 900);
    setFont(ctx, societySize, 900);
    drawWrapped(ctx, state.societyName, W / 2, 290, 940, societySize + 9, 2, { align: "center" });
    return;
  }

  fillRound(ctx, 27, 27, W - 54, 118, 22, theme.dark);
  drawSideLogo(ctx, state.leftLogo, 83, 86, 76 * getLogoScale("left"), theme);
  drawSideLogo(ctx, state.rightLogo, W - 83, 86, 76 * getLogoScale("right"), theme);

  ctx.fillStyle = "#ffffff";
  const topSize = fitFont(ctx, state.topLine, 820, 38, 24, 800);
  setFont(ctx, topSize, 800);
  ctx.textAlign = "center";
  ctx.fillText(state.topLine, W / 2, 103);

  ctx.shadowColor = "rgba(66,0,0,.22)";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = theme.accent;
  const titleSize = fitFont(ctx, state.title, 820, 83, 50, 900);
  setFont(ctx, titleSize, 900);
  ctx.fillText(state.title, W / 2, 236);
  ctx.shadowColor = "transparent";
  ctx.shadowOffsetY = 0;

  ctx.strokeStyle = theme.gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(62, 205);
  ctx.lineTo(225, 205);
  ctx.moveTo(W - 225, 205);
  ctx.lineTo(W - 62, 205);
  ctx.stroke();
  ctx.fillStyle = theme.gold;
  ctx.beginPath();
  ctx.arc(236, 205, 5, 0, Math.PI * 2);
  ctx.arc(W - 236, 205, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawMainMessage(theme) {
  if (state.template === "modern") {
    ctx.fillStyle = theme.gold;
    setFont(ctx, 23, 900);
    ctx.textAlign = "left";
    ctx.fillText("ਨਿਲਾਮੀ ਦੀ ਜਾਣਕਾਰੀ", 47, 375);
    ctx.fillStyle = "rgba(255,255,255,.38)";
    ctx.fillRect(47, 393, 205, 2);
    ctx.fillStyle = "#fff";
    setFont(ctx, 22, 800);
    ctx.fillText("ਮਿਤੀ", 47, 435);
    setFont(ctx, 25, 900);
    drawWrapped(ctx, state.date, 47, 471, 205, 31, 2, { align: "left" });
    ctx.fillStyle = theme.gold;
    setFont(ctx, 21, 800);
    ctx.fillText("ਸਮਾਂ", 47, 535);
    ctx.fillStyle = "#fff";
    setFont(ctx, 21, 800);
    drawWrapped(ctx, state.time, 47, 568, 205, 29, 2, { align: "left" });

    ctx.fillStyle = "#30352f";
    setFont(ctx, 26, 650);
    drawWrapped(ctx, state.noticeText, 355, 355, 660, 38, 3, { align: "left" });
    fillRound(ctx, 355, 482, 660, 66, 12, theme.mid);
    ctx.fillStyle = "#fff";
    const announceSize = fitFont(ctx, state.announcement, 610, 28, 20, 800);
    setFont(ctx, announceSize, 800);
    ctx.textAlign = "center";
    ctx.fillText(state.announcement, 685, 525);
    return;
  }

  if (state.template === "bold") {
    ctx.fillStyle = "#292d29";
    setFont(ctx, 25, 650);
    drawWrapped(ctx, state.noticeText, W / 2, 373, 930, 37, 3, { align: "center" });
    fillRound(ctx, 130, 493, 820, 67, 8, theme.dark);
    ctx.fillStyle = theme.gold;
    const announceSize = fitFont(ctx, state.announcement, 750, 31, 21, 900);
    setFont(ctx, announceSize, 900);
    ctx.textAlign = "center";
    ctx.fillText(state.announcement, W / 2, 538);
    return;
  }

  ctx.fillStyle = "#202520";
  const subtitleSize = fitFont(ctx, state.subtitle, 960, 32, 23, 700);
  setFont(ctx, subtitleSize, 700);
  ctx.textAlign = "center";
  ctx.fillText(state.subtitle, W / 2, 293);

  ctx.fillStyle = theme.accent;
  const societySize = fitFont(ctx, state.societyName, 995, 52, 32, 900);
  setFont(ctx, societySize, 900);
  drawWrapped(ctx, state.societyName, W / 2, 361, 995, societySize + 11, 2, { align: "center" });

  ctx.fillStyle = "#252a25";
  setFont(ctx, 30, 600);
  drawWrapped(ctx, state.noticeText, W / 2, 450, 950, 44, 2, { align: "center" });

  fillRound(ctx, 235, 524, 610, 62, 27, theme.dark);
  ctx.fillStyle = "#fff";
  const announceSize = fitFont(ctx, state.announcement, 550, 31, 22, 800);
  setFont(ctx, announceSize, 800);
  ctx.textAlign = "center";
  ctx.fillText(state.announcement, W / 2, 565);
}

function drawCatalogLayout(theme, items, premium) {
  const areaX = 42;
  const areaY = 605;
  const areaW = W - 84;
  const areaH = 372;
  const cols = Math.min(items.length, items.length > 5 ? 5 : Math.max(1, items.length));
  const rows = Math.ceil(items.length / cols);
  const gap = 8;
  const cardW = (areaW - gap * (cols - 1)) / cols;
  const cardH = (areaH - gap * (rows - 1)) / rows;
  items.forEach((item, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const rowCount = Math.min(cols, items.length - row * cols);
    const rowWidth = rowCount * cardW + (rowCount - 1) * gap;
    const x = (W - rowWidth) / 2 + col * (cardW + gap);
    const y = areaY + row * (cardH + gap);
    ctx.save();
    if (premium) {
      ctx.shadowColor = "rgba(0,0,0,.16)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
    }
    fillRound(ctx, x, y, cardW, cardH, 10, "rgba(255,255,255,.96)");
    ctx.restore();
    strokeRound(ctx, x, y, cardW, cardH, 10, premium ? theme.gold : theme.dark, premium ? 2.5 : 1.8);
    const headerH = Math.max(30, Math.min(45, cardH * .22));
    fillRound(ctx, x + 5, y + 5, cardW - 10, headerH, 7, theme.dark);
    ctx.fillStyle = "#fff";
    setFont(ctx, Math.max(14, Math.min(20, cardW / 10)), 850);
    drawWrapped(ctx, `${index + 1}. ${item.name}`, x + cardW / 2, y + headerH * .72 + 5, cardW - 18, 21, 1, { align: "center" });
    const photoY = y + headerH + 9;
    const photoH = Math.max(45, cardH - headerH - 39);
    drawItemArtwork(ctx, item, index, x + 7, photoY, cardW - 14, photoH);
    ctx.fillStyle = theme.accent;
    setFont(ctx, Math.max(14, Math.min(20, cardW / 10)), 900);
    ctx.textAlign = "center";
    ctx.fillText(item.qty, x + cardW / 2, y + cardH - 9);
  });
}

function drawListGridLayout(theme, items) {
  const y = 605;
  const height = 372;
  const listX = 36;
  const listW = 420;
  const gridX = 470;
  const gridW = 574;
  fillRound(ctx, listX, y, listW, height, 13, "rgba(255,255,255,.92)");
  strokeRound(ctx, listX, y, listW, height, 13, theme.dark, 2.5);
  fillRound(ctx, listX + 6, y + 6, listW - 12, 43, 9, theme.accent);
  ctx.fillStyle = "#fff";
  setFont(ctx, 23, 900);
  ctx.textAlign = "center";
  ctx.fillText("ਸੰਦਾਂ ਦਾ ਪੂਰਾ ਵੇਰਵਾ", listX + listW / 2, y + 36);
  const lineH = (height - 57) / items.length;
  items.forEach((item, index) => {
    const lineY = y + 53 + index * lineH;
    if (index % 2 === 0) {
      ctx.fillStyle = "rgba(215,170,61,.12)";
      ctx.fillRect(listX + 7, lineY, listW - 14, lineH);
    }
    ctx.fillStyle = theme.dark;
    setFont(ctx, Math.max(15, Math.min(22, lineH * .48)), 900);
    ctx.textAlign = "left";
    ctx.fillText(`${index + 1}.`, listX + 17, lineY + lineH * .69);
    setFont(ctx, Math.max(14, Math.min(21, lineH * .45)), 750);
    let label = item.name;
    while (label.length > 2 && ctx.measureText(label).width > 260) label = label.slice(0, -1);
    if (label !== item.name) label += "…";
    ctx.fillText(label, listX + 58, lineY + lineH * .69);
    ctx.textAlign = "right";
    ctx.fillText(item.qty, listX + listW - 18, lineY + lineH * .69);
  });

  const cols = 2;
  const rows = Math.ceil(items.length / cols);
  const gap = 7;
  const cardW = (gridW - gap) / 2;
  const cardH = (height - gap * (rows - 1)) / rows;
  items.forEach((item, index) => {
    const x = gridX + (index % cols) * (cardW + gap);
    const row = Math.floor(index / cols);
    const rowCount = Math.min(cols, items.length - row * cols);
    const adjustedX = rowCount === 1 ? gridX + (gridW - cardW) / 2 : x;
    const cardY = y + row * (cardH + gap);
    fillRound(ctx, adjustedX, cardY, cardW, cardH, 10, "rgba(255,255,255,.94)");
    strokeRound(ctx, adjustedX, cardY, cardW, cardH, 10, theme.gold, 2);
    drawItemArtwork(ctx, item, index, adjustedX + 6, cardY + 5, cardW - 12, Math.max(35, cardH - 30));
    ctx.fillStyle = theme.dark;
    setFont(ctx, Math.max(13, Math.min(18, cardH * .19)), 850);
    ctx.textAlign = "center";
    ctx.fillText(item.name, adjustedX + cardW / 2, cardY + cardH - 8);
  });
}

function drawDuoLayout(theme, items) {
  const y = 605;
  const height = 372;
  const gap = 12;
  const heroItems = items.slice(0, Math.min(2, items.length));
  const heroH = items.length > 2 ? 245 : height;
  const heroW = (W - 84 - gap * (heroItems.length - 1)) / heroItems.length;
  heroItems.forEach((item, index) => {
    const x = 42 + index * (heroW + gap);
    fillRound(ctx, x, y, heroW, heroH, 16, "rgba(255,255,255,.96)");
    strokeRound(ctx, x, y, heroW, heroH, 16, theme.gold, 3);
    drawItemArtwork(ctx, item, index, x + 9, y + 9, heroW - 18, heroH - 58);
    fillRound(ctx, x + 18, y + heroH - 51, heroW - 36, 41, 12, theme.dark);
    ctx.fillStyle = "#fff";
    setFont(ctx, fitFont(ctx, `${item.name} — ${item.qty}`, heroW - 55, 23, 15, 850), 850);
    ctx.textAlign = "center";
    ctx.fillText(`${item.name} — ${item.qty}`, x + heroW / 2, y + heroH - 23);
  });
  const remaining = items.slice(2);
  if (!remaining.length) return;
  const miniY = y + heroH + gap;
  const miniH = height - heroH - gap;
  const miniGap = 6;
  const miniW = (W - 84 - miniGap * (remaining.length - 1)) / remaining.length;
  remaining.forEach((item, offset) => {
    const index = offset + 2;
    const x = 42 + offset * (miniW + miniGap);
    fillRound(ctx, x, miniY, miniW, miniH, 9, "rgba(255,255,255,.95)");
    strokeRound(ctx, x, miniY, miniW, miniH, 9, theme.dark, 1.5);
    drawItemArtwork(ctx, item, index, x + 5, miniY + 5, miniW - 10, miniH - 32);
    ctx.fillStyle = theme.dark;
    setFont(ctx, Math.max(12, Math.min(16, miniW / 8)), 800);
    drawWrapped(ctx, item.name, x + miniW / 2, miniY + miniH - 9, miniW - 8, 16, 1, { align: "center" });
  });
}

function drawStripLayout(theme, items) {
  drawCatalogLayout(theme, items, true);
  ctx.fillStyle = theme.gold;
  ctx.fillRect(42, 593, W - 84, 6);
}

function drawSpotlightLayout(theme, items) {
  if (!items.length) return;
  const requestedIndex = Number(state.featuredItemIndex);
  const featuredIndex = Number.isInteger(requestedIndex) && requestedIndex >= 0 && requestedIndex < items.length ? requestedIndex : 0;
  const featured = items[featuredIndex];
  const remaining = items
    .map((item, index) => ({ item, index }))
    .filter((entry) => entry.index !== featuredIndex);
  const areaX = 42;
  const areaY = 605;
  const areaW = W - 84;
  const areaH = 372;
  const gap = 12;
  const heroW = remaining.length ? (remaining.length > 6 ? 540 : 595) : areaW;
  const heroX = remaining.length ? areaX : (W - heroW) / 2;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.20)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 7;
  fillRound(ctx, heroX, areaY, heroW, areaH, 20, "rgba(255,255,255,.98)");
  ctx.restore();
  strokeRound(ctx, heroX, areaY, heroW, areaH, 20, theme.gold, 4);
  fillRound(ctx, heroX + 14, areaY + 14, 154, 39, 19, theme.accent);
  ctx.fillStyle = "#fff";
  setFont(ctx, 18, 900);
  ctx.textAlign = "center";
  ctx.fillText("★ ਖਾਸ ਸੰਦ", heroX + 91, areaY + 41);
  drawItemArtwork(ctx, featured, featuredIndex, heroX + 18, areaY + 52, heroW - 36, areaH - 119);
  fillRound(ctx, heroX + 18, areaY + areaH - 60, heroW - 36, 46, 13, theme.dark);
  ctx.fillStyle = "#fff";
  const heroLabel = `${featured.name} — ${featured.qty}`;
  setFont(ctx, fitFont(ctx, heroLabel, heroW - 70, 26, 17, 900), 900);
  ctx.textAlign = "center";
  ctx.fillText(heroLabel, heroX + heroW / 2, areaY + areaH - 29);

  if (!remaining.length) return;
  const miniX = heroX + heroW + gap;
  const miniW = areaX + areaW - miniX;
  const cols = remaining.length <= 3 ? 1 : remaining.length <= 6 ? 2 : 3;
  const rows = Math.ceil(remaining.length / cols);
  const miniGap = 7;
  const cardW = (miniW - miniGap * (cols - 1)) / cols;
  const cardH = (areaH - miniGap * (rows - 1)) / rows;

  remaining.forEach((entry, offset) => {
    const col = offset % cols;
    const row = Math.floor(offset / cols);
    const rowCount = Math.min(cols, remaining.length - row * cols);
    const rowWidth = rowCount * cardW + (rowCount - 1) * miniGap;
    const rowStart = miniX + (miniW - rowWidth) / 2;
    const x = rowStart + col * (cardW + miniGap);
    const y = areaY + row * (cardH + miniGap);
    fillRound(ctx, x, y, cardW, cardH, 10, "rgba(255,255,255,.95)");
    strokeRound(ctx, x, y, cardW, cardH, 10, theme.dark, 1.6);
    const footerH = Math.min(34, Math.max(24, cardH * .28));
    drawItemArtwork(ctx, entry.item, entry.index, x + 5, y + 5, cardW - 10, cardH - footerH - 7);
    fillRound(ctx, x + 4, y + cardH - footerH, cardW - 8, footerH - 4, 7, theme.dark);
    ctx.fillStyle = "#fff";
    const miniLabel = remaining.length > 6 ? String(entry.index + 1) : entry.item.name;
    setFont(ctx, fitFont(ctx, miniLabel, cardW - 15, Math.min(16, footerH * .55), 10, 850), 850);
    ctx.textAlign = "center";
    ctx.fillText(miniLabel, x + cardW / 2, y + cardH - Math.max(10, footerH * .34));
  });
}

function drawItems(theme) {
  const items = state.items.slice(0, 10);
  const activeTemplate = getActiveTemplate();
  const premium = Boolean(activeTemplate.premium);
  const areaY = 605;
  const areaH = 372;

  if (activeTemplate.itemLayout === "spotlight") {
    drawSpotlightLayout(theme, items);
    return;
  }

  if (activeTemplate.itemLayout === "list-grid") {
    drawListGridLayout(theme, items);
    return;
  }
  if (activeTemplate.itemLayout === "catalog") {
    drawCatalogLayout(theme, items, premium);
    return;
  }
  if (activeTemplate.itemLayout === "duo") {
    drawDuoLayout(theme, items);
    return;
  }
  if (activeTemplate.itemLayout === "strip") {
    drawStripLayout(theme, items);
    return;
  }
  if (activeTemplate.itemLayout === "legal") {
    if (items.length <= 4) drawDuoLayout(theme, items);
    else drawCatalogLayout(theme, items, premium);
    return;
  }

  if (state.template === "modern") {
    const startX = 335;
    const areaW = 700;
    const cols = Math.min(2, items.length);
    const rows = Math.ceil(items.length / cols);
    const gap = 10;
    const cardW = (areaW - gap * (cols - 1)) / cols;
    const cardH = (areaH - gap * (rows - 1)) / rows;
    items.forEach((item, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * (cardW + gap);
      const y = areaY + row * (cardH + gap);
      if (premium) {
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,.14)";
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 5;
        fillRound(ctx, x, y, cardW, cardH, 12, "rgba(255,255,255,.98)");
        ctx.restore();
      }
      fillRound(ctx, x, y, cardW, cardH, 12, "rgba(255,255,255,.95)");
      strokeRound(ctx, x, y, cardW, cardH, 12, premium ? theme.gold : "rgba(8,60,42,.20)", premium ? 2.5 : 1.5);
      if (premium) {
        ctx.fillStyle = theme.gold;
        ctx.fillRect(x + 1, y + 12, 5, cardH - 24);
      }
      const photoW = Math.min(cardW * .42, Math.max(76, cardH * .92));
      drawItemArtwork(ctx, item, index, x + 7, y + 7, photoW - 14, cardH - 14);
      ctx.fillStyle = theme.gold;
      fillRound(ctx, x + photoW - 9, y + 9, 31, 31, 9, theme.gold);
      ctx.fillStyle = theme.dark;
      setFont(ctx, 17, 900);
      ctx.textAlign = "center";
      ctx.fillText(String(index + 1), x + photoW + 6, y + 31);
      const textX = x + photoW + 28;
      const textW = cardW - photoW - 38;
      ctx.fillStyle = "#203129";
      setFont(ctx, Math.max(16, Math.min(25, cardH * .17)), 850);
      drawWrapped(ctx, item.name, textX, y + cardH * .47, textW, 27, rows >= 3 ? 1 : 2, { align: "left" });
      ctx.fillStyle = theme.accent;
      const qtySize = fitFont(ctx, item.qty, textW, Math.max(16, Math.min(25, cardH * .16)), 14, 900);
      setFont(ctx, qtySize, 900);
      ctx.textAlign = "left";
      ctx.fillText(item.qty, textX, y + cardH - 15);
    });
    return;
  }

  if (state.template === "bold") {
    const startX = 52;
    const areaW = W - 104;
    const cols = Math.min(3, items.length);
    const rows = Math.ceil(items.length / cols);
    const gap = 12;
    const cardW = (areaW - gap * (cols - 1)) / cols;
    const cardH = (areaH - gap * (rows - 1)) / rows;
    items.forEach((item, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const rowCount = Math.min(cols, items.length - row * cols);
      const rowWidth = rowCount * cardW + (rowCount - 1) * gap;
      const rowStart = (W - rowWidth) / 2;
      const x = rowStart + col * (cardW + gap);
      const y = areaY + row * (cardH + gap);
      fillRound(ctx, x, y, cardW, cardH, 8, "rgba(255,255,255,.93)");
      strokeRound(ctx, x, y, cardW, cardH, 8, theme.gold, 3);
      const compact = rows >= 3;
      const photoH = compact ? cardH * .55 : cardH * .62;
      drawItemArtwork(ctx, item, index, x + 8, y + 8, cardW - 16, photoH - 8);
      fillRound(ctx, x + 12, y + 12, 35, 35, 7, theme.accent);
      ctx.fillStyle = "#fff";
      setFont(ctx, 19, 900);
      ctx.textAlign = "center";
      ctx.fillText(String(index + 1), x + 29.5, y + 36);
      ctx.fillStyle = theme.dark;
      setFont(ctx, compact ? 17 : 24, 900);
      drawWrapped(ctx, item.name, x + cardW / 2, y + photoH + (compact ? 24 : 31), cardW - 22, compact ? 22 : 30, compact ? 1 : 2, { align: "center" });
      ctx.fillStyle = theme.accent;
      setFont(ctx, compact ? 16 : 24, 900);
      ctx.textAlign = "center";
      ctx.fillText(item.qty, x + cardW / 2, y + cardH - 10);
    });
    return;
  }

  const startX = 35;
  const areaW = W - 70;
  const cols = Math.min(4, items.length);
  const rows = Math.ceil(items.length / cols);
  const gap = 10;
  const cardW = (areaW - gap * (cols - 1)) / cols;
  const cardH = (areaH - gap * (rows - 1)) / rows;
  items.forEach((item, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const rowCount = Math.min(cols, items.length - row * cols);
    const rowWidth = rowCount * cardW + (rowCount - 1) * gap;
    const rowStart = (W - rowWidth) / 2;
    const x = rowStart + col * (cardW + gap);
    const y = areaY + row * (cardH + gap);
    if (premium) {
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,.16)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 5;
      fillRound(ctx, x, y, cardW, cardH, 18, "rgba(255,255,255,.88)");
      ctx.restore();
    }
    fillRound(ctx, x, y, cardW, cardH, 18, "rgba(255,255,255,.72)");
    strokeRound(ctx, x, y, cardW, cardH, 18, premium ? theme.gold : theme.dark, premium ? 3 : 2.5);
    const compact = rows > 1;
    const numberRadius = compact ? 15 : 21;
    ctx.fillStyle = theme.dark;
    ctx.beginPath();
    ctx.arc(x + numberRadius + 7, y + numberRadius + 7, numberRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    setFont(ctx, compact ? 17 : 24, 900);
    ctx.textAlign = "center";
    ctx.fillText(String(index + 1), x + numberRadius + 7, y + numberRadius + (compact ? 13 : 16));
    const photoY = y + (compact ? 10 : 55);
    const photoH = compact ? cardH * .50 : 198;
    drawItemArtwork(ctx, item, index, x + 10, photoY, cardW - 20, photoH);
    ctx.fillStyle = "#1f2823";
    setFont(ctx, compact ? 17 : 26, 800);
    drawWrapped(ctx, item.name, x + cardW / 2, y + cardH - (compact ? 43 : 78), cardW - 22, compact ? 21 : 33, compact ? 1 : 2, { align: "center" });
    ctx.fillStyle = theme.dark;
    const qtySize = fitFont(ctx, item.qty, cardW - 28, compact ? 18 : 30, 14, 900);
    setFont(ctx, qtySize, 900);
    ctx.textAlign = "center";
    ctx.fillText(item.qty, x + cardW / 2, y + cardH - 12);
  });
}

function drawInfoStrip(theme) {
  const y = 995;
  const h = 147;
  fillRound(ctx, 35, y, W - 70, h, 18, "rgba(255,255,255,.45)");
  strokeRound(ctx, 35, y, W - 70, h, 18, theme.dark, 2.5);
  const widths = [340, 260, 410];
  const data = [
    { icon: "▣", label: "ਮਿਤੀ", value: state.date },
    { icon: "◷", label: "ਸਮਾਂ", value: state.time },
    { icon: "●", label: "ਸਥਾਨ", value: state.venue }
  ];
  let x = 35;
  data.forEach((info, index) => {
    if (index > 0) {
      ctx.strokeStyle = "#a69d7b";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(x, y + 19);
      ctx.lineTo(x, y + h - 19);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    const boxW = widths[index];
    ctx.fillStyle = theme.accent;
    setFont(ctx, 43, 800);
    ctx.textAlign = "center";
    ctx.fillText(info.icon, x + 48, y + 82);

    ctx.fillStyle = "#30342e";
    setFont(ctx, 22, 800);
    ctx.textAlign = "left";
    ctx.fillText(info.label, x + 88, y + 46);
    ctx.fillStyle = index === 2 ? theme.dark : theme.accent;
    const max = boxW - 103;
    const valueSize = fitFont(ctx, info.value, max, index === 2 ? 25 : 31, 17, 900);
    setFont(ctx, valueSize, 900);
    if (index === 2) {
      drawWrapped(ctx, info.value, x + 88, y + 78, max, 31, 2, { align: "left" });
    } else {
      ctx.fillText(info.value, x + 88, y + 91);
    }
    x += boxW;
  });
}

function drawShield(theme, x, y, width, height) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + width / 2, y);
  ctx.lineTo(x + width, y + 34);
  ctx.lineTo(x + width - 18, y + height * .68);
  ctx.quadraticCurveTo(x + width / 2, y + height, x + 18, y + height * .68);
  ctx.lineTo(x, y + 34);
  ctx.closePath();
  ctx.fillStyle = theme.gold;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + width / 2, y + 11);
  ctx.lineTo(x + width - 13, y + 40);
  ctx.lineTo(x + width - 29, y + height * .65);
  ctx.quadraticCurveTo(x + width / 2, y + height - 18, x + 29, y + height * .65);
  ctx.lineTo(x + 13, y + 40);
  ctx.closePath();
  ctx.fillStyle = theme.dark;
  ctx.fill();
  ctx.fillStyle = "#fff";
  setFont(ctx, 22, 800);
  drawWrapped(ctx, "ਸਭਾ ਕਮੇਟੀ ਦਾ ਫ਼ੈਸਲਾ ਅੰਤਿਮ ਹੋਵੇਗਾ।", x + width / 2, y + 72, width - 46, 31, 3, { align: "center" });
  ctx.restore();
}

function drawConditions(theme) {
  const x = 35;
  const y = 1161;
  const width = W - 70;
  const height = 244;
  fillRound(ctx, x, y, width, height, 18, "rgba(255,255,255,.42)");
  strokeRound(ctx, x, y, width, height, 18, theme.dark, 2.5);
  fillRound(ctx, x + 28, y - 18, 150, 43, 18, theme.dark);
  ctx.fillStyle = "#fff";
  setFont(ctx, 25, 900);
  ctx.textAlign = "center";
  ctx.fillText("ਸ਼ਰਤਾਂ", x + 103, y + 12);

  const conditionLines = String(state.conditions).split(/\n+/).map((line) => line.trim()).filter(Boolean).slice(0, 4);
  const textX = x + 70;
  conditionLines.forEach((line, index) => {
    const lineY = y + 58 + index * 43;
    ctx.fillStyle = theme.dark;
    ctx.beginPath();
    ctx.arc(x + 37, lineY - 9, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    setFont(ctx, 17, 900);
    ctx.textAlign = "center";
    ctx.fillText(String(index + 1), x + 37, lineY - 3);
    ctx.fillStyle = "#20241f";
    const size = fitFont(ctx, line, 690, 25, 18, 650);
    setFont(ctx, size, 650);
    ctx.textAlign = "left";
    let clipped = line;
    while (clipped.length > 2 && ctx.measureText(clipped).width > 690) clipped = clipped.slice(0, -1);
    if (clipped !== line) clipped += "…";
    ctx.fillText(clipped, textX, lineY);
  });

  drawShield(theme, 825, y + 35, 165, 176);
}

function drawContactFooter(theme) {
  fillRound(ctx, 35, 1422, W - 70, 50, 17, theme.accent);
  ctx.fillStyle = "#fff";
  setFont(ctx, 26, 800);
  ctx.textAlign = "center";
  ctx.fillText("📣  ਹੋਰ ਜਾਣਕਾਰੀ ਲਈ ਹੇਠ ਲਿਖੇ ਨੰਬਰਾਂ ’ਤੇ ਸੰਪਰਕ ਕੀਤਾ ਜਾ ਸਕਦਾ ਹੈ।", W / 2, 1456);

  const startX = 35;
  const y = 1482;
  const gap = 8;
  const boxW = (W - 70 - gap * 2) / 3;
  state.contacts.forEach((contact, index) => {
    const x = startX + index * (boxW + gap);
    if (index > 0) {
      ctx.strokeStyle = "#9a987f";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(x - 4, y + 4);
      ctx.lineTo(x - 4, y + 79);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = "#242923";
    const nameSize = fitFont(ctx, contact.name, boxW - 115, 27, 18, 800);
    setFont(ctx, nameSize, 800);
    ctx.textAlign = "left";
    ctx.fillText(contact.name, x + 28, y + 29);
    const nameWidth = ctx.measureText(contact.name).width;
    fillRound(ctx, Math.min(x + boxW - 90, x + 34 + nameWidth), y + 4, 82, 31, 8, theme.accent);
    ctx.fillStyle = "#fff";
    setFont(ctx, 16, 800);
    ctx.textAlign = "center";
    ctx.fillText(contact.role, Math.min(x + boxW - 49, x + 75 + nameWidth), y + 26);

    ctx.fillStyle = theme.dark;
    setFont(ctx, 31, 900);
    ctx.textAlign = "left";
    ctx.fillText("☎", x + 28, y + 75);
    const phoneSize = fitFont(ctx, contact.phone, boxW - 82, 30, 21, 900);
    setFont(ctx, phoneSize, 900);
    ctx.fillText(contact.phone, x + 70, y + 75);
  });

  ctx.fillStyle = theme.dark;
  ctx.fillRect(27, 1571, W - 54, 25);
  ctx.fillStyle = "#fff";
  setFont(ctx, 18, 700);
  ctx.textAlign = "center";
  ctx.fillText("ਵੱਧ ਤੋਂ ਵੱਧ ਕਿਸਾਨ ਭਰਾਵਾਂ ਤੱਕ ਜਾਣਕਾਰੀ ਪਹੁੰਚਾਓ", W / 2, 1591);
}

function renderPoster() {
  const activeTemplate = getActiveTemplate();
  state.template = activeTemplate.layout;
  const theme = themes[state.theme] || themes[activeTemplate.theme] || themes.green;
  drawPosterBackground(theme);
  drawHeader(theme);
  drawMainMessage(theme);
  drawItems(theme);
  drawInfoStrip(theme);
  drawConditions(theme);
  drawContactFooter(theme);
  if (document.getElementById("posterModal").classList.contains("open")) exportController?.copyToModal();
  exportController?.refreshPreview();
}

function renderItemEditors() {
  const holder = document.getElementById("itemsEditor");
  holder.innerHTML = "";
  state.items.forEach((item, index) => {
    const scalePercent = Math.round((Number(item.scale) || 1) * 100);
    const previewSource = item.mode !== "original" && item.processedImage
      ? item.processedImage.src
      : item.originalImage?.src || (index < 4 ? "assets/reference-poster.jpeg" : "data:image/gif;base64,R0lGODlhAQABAAAAACw=");
    const row = document.createElement("div");
    row.className = "item-row";
    row.innerHTML = `
      <div class="item-main-row">
        <label class="photo-input" title="ਸੰਦ ਦੀ photo ਬਦਲੋ">
          <img id="itemPreview${index}" alt="ਸੰਦ ${index + 1} ਦੀ photo" src="${escapeAttribute(previewSource)}" style="background:${escapeAttribute(item.bg || "#ffffff")}" />
          <input type="file" accept="image/*" data-item-file="${index}" aria-label="ਸੰਦ ${index + 1} ਦੀ photo upload ਕਰੋ" />
          <span class="photo-badge">+</span>
        </label>
        <input type="text" value="${escapeAttribute(item.name)}" data-item-name="${index}" aria-label="ਸੰਦ ${index + 1} ਦਾ ਨਾਮ" />
        <input class="item-qty" type="text" value="${escapeAttribute(item.qty)}" data-item-qty="${index}" aria-label="ਸੰਦ ${index + 1} ਦੀ ਗਿਣਤੀ" />
        <button class="item-remove" data-remove-item="${index}" type="button" aria-label="ਸੰਦ ${index + 1} ਹਟਾਓ" ${state.items.length === 1 ? "disabled" : ""}>×</button>
      </div>
      <div class="photo-tools">
        <button class="photo-mode ${item.mode === "original" ? "active" : ""}" data-item-mode="original" data-mode-index="${index}" type="button">Original</button>
        <button class="photo-mode ${item.mode === "cutout" ? "active" : ""} ${item.processing ? "processing" : ""}" data-item-mode="cutout" data-mode-index="${index}" type="button" ${item.processing ? "disabled" : ""}>BG Remove</button>
        <button class="photo-mode ${item.mode === "3d" ? "active" : ""} ${item.processing ? "processing" : ""}" data-item-mode="3d" data-mode-index="${index}" type="button" ${item.processing ? "disabled" : ""}>3D Touch</button>
        <button class="feature-item-button ${Number(state.featuredItemIndex) === index ? "active" : ""}" data-feature-item="${index}" type="button" aria-pressed="${Number(state.featuredItemIndex) === index}">★ ${Number(state.featuredItemIndex) === index ? "Highlight ਚੁਣਿਆ" : "ਖਾਸ Highlight"}</button>
        <label class="photo-bg-color">Background <input type="color" value="${escapeAttribute(item.bg || "#ffffff")}" data-item-bg="${index}" aria-label="ਸੰਦ ${index + 1} ਦਾ background colour" /></label>
        <label class="photo-size-control">
          <span>Photo Size</span>
          <input type="range" min="55" max="160" value="${scalePercent}" data-item-scale="${index}" aria-label="ਸੰਦ ${index + 1} ਦੀ photo ਦਾ size" />
          <output id="itemScaleValue${index}">${scalePercent}%</output>
        </label>
      </div>
    `;
    holder.appendChild(row);
  });

  holder.querySelectorAll("[data-item-name]").forEach((input) => {
    input.addEventListener("input", (event) => {
      state.items[Number(event.target.dataset.itemName)].name = event.target.value;
      renderPoster();
    });
  });
  holder.querySelectorAll("[data-item-qty]").forEach((input) => {
    input.addEventListener("input", (event) => {
      state.items[Number(event.target.dataset.itemQty)].qty = event.target.value;
      renderPoster();
    });
  });
  holder.querySelectorAll("[data-item-file]").forEach((input) => {
    input.addEventListener("change", (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        showToast("ਕਿਰਪਾ ਕਰਕੇ photo file ਚੁਣੋ।");
        return;
      }
      const index = Number(event.target.dataset.itemFile);
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        state.items[index].image = image;
        state.items[index].originalImage = image;
        state.items[index].sourceFile = file;
        state.items[index].processedImage = null;
        state.items[index].mode = "original";
        renderItemEditors();
        renderPoster();
        showToast(`ਸੰਦ ${index + 1} ਦੀ photo ਬਦਲ ਗਈ।`);
      };
      image.src = url;
    });
  });
  holder.querySelectorAll("[data-item-mode]").forEach((button) => {
    button.addEventListener("click", () => setItemMode(Number(button.dataset.modeIndex), button.dataset.itemMode));
  });
  holder.querySelectorAll("[data-feature-item]").forEach((button) => {
    button.addEventListener("click", () => setFeaturedItem(Number(button.dataset.featureItem)));
  });
  holder.querySelectorAll("[data-item-bg]").forEach((input) => {
    input.addEventListener("input", () => {
      const index = Number(input.dataset.itemBg);
      state.items[index].bg = input.value;
      const preview = document.getElementById(`itemPreview${index}`);
      if (preview) preview.style.background = input.value;
      renderPoster();
    });
  });
  holder.querySelectorAll("[data-item-scale]").forEach((input) => {
    input.addEventListener("input", () => {
      const index = Number(input.dataset.itemScale);
      state.items[index].scale = Number(input.value) / 100;
      const value = document.getElementById(`itemScaleValue${index}`);
      if (value) value.textContent = `${input.value}%`;
      renderPoster();
    });
  });
  holder.querySelectorAll("[data-remove-item]").forEach((button) => {
    button.addEventListener("click", () => removeItem(Number(button.dataset.removeItem)));
  });
  const addButton = document.getElementById("addItemButton");
  if (addButton) addButton.disabled = state.items.length >= 10;
  makeReferenceThumbnails();
}

function addItem() {
  if (state.items.length >= 10) {
    showToast("ਇੱਕ poster ਵਿੱਚ ਵੱਧ ਤੋਂ ਵੱਧ 10 ਸੰਦ ਰੱਖ ਸਕਦੇ ਹੋ।");
    return;
  }
  state.items.push({
    name: "ਨਵਾਂ ਖੇਤੀਬਾੜੀ ਸੰਦ",
    qty: "1 ਨਗ",
    image: null,
    originalImage: null,
    processedImage: null,
    sourceFile: null,
    mode: "original",
    bg: "#ffffff",
    scale: 1
  });
  renderItemEditors();
  renderPoster();
  showToast(`ਸੰਦ ${state.items.length} ਜੋੜ ਦਿੱਤਾ ਗਿਆ।`);
}

function setFeaturedItem(index) {
  if (!state.items[index]) return;
  state.featuredItemIndex = index;
  renderItemEditors();
  renderPoster();
  showToast(`ਸੰਦ ${index + 1} ਨੂੰ ਖਾਸ Highlight ਲਈ ਚੁਣ ਲਿਆ।`);
}

function removeItem(index) {
  if (state.items.length <= 1) return;
  state.items.splice(index, 1);
  if (Number(state.featuredItemIndex) === index) state.featuredItemIndex = 0;
  else if (Number(state.featuredItemIndex) > index) state.featuredItemIndex -= 1;
  renderItemEditors();
  renderPoster();
  showToast("ਸੰਦ poster ਵਿੱਚੋਂ ਹਟਾ ਦਿੱਤਾ ਗਿਆ।");
}

function renderContactEditors() {
  const holder = document.getElementById("contactsEditor");
  holder.innerHTML = "";
  state.contacts.forEach((contact, index) => {
    const row = document.createElement("div");
    row.className = "contact-row";
    row.innerHTML = `
      <input type="text" value="${escapeAttribute(contact.name)}" data-contact-name="${index}" aria-label="ਵਿਅਕਤੀ ${index + 1} ਦਾ ਨਾਮ" placeholder="ਨਾਮ" />
      <input type="text" value="${escapeAttribute(contact.role)}" data-contact-role="${index}" aria-label="ਵਿਅਕਤੀ ${index + 1} ਦਾ ਅਹੁਦਾ" placeholder="ਅਹੁਦਾ" />
      <input type="tel" value="${escapeAttribute(contact.phone)}" data-contact-phone="${index}" aria-label="ਵਿਅਕਤੀ ${index + 1} ਦਾ ਫੋਨ" placeholder="ਫੋਨ ਨੰਬਰ" />
    `;
    holder.appendChild(row);
  });
  holder.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", (event) => {
      const element = event.target;
      const index = Number(element.dataset.contactName ?? element.dataset.contactRole ?? element.dataset.contactPhone);
      const field = element.hasAttribute("data-contact-name") ? "name" : element.hasAttribute("data-contact-role") ? "role" : "phone";
      state.contacts[index][field] = element.value;
      renderPoster();
    });
  });
}

function makeReferenceThumbnails() {
  if (!referenceImage.complete || !referenceImage.naturalWidth) return;
  const crops = [
    [18, 602, 236, 205],
    [267, 602, 236, 205],
    [515, 602, 236, 205],
    [764, 602, 236, 205]
  ];
  crops.forEach((crop, index) => {
    if (!state.items[index] || state.items[index].originalImage) return;
    const image = document.getElementById(`itemPreview${index}`);
    if (!image) return;
    const thumb = document.createElement("canvas");
    thumb.width = 120;
    thumb.height = 120;
    const thumbCtx = thumb.getContext("2d");
    thumbCtx.fillStyle = "#fff";
    thumbCtx.fillRect(0, 0, 120, 120);
    thumbCtx.drawImage(referenceImage, ...crop, 0, 0, 120, 120);
    image.src = thumb.toDataURL("image/jpeg", .88);
  });
}

function templateLookMarkup(template, extraClass = "") {
  const palette = themes[template.theme] || themes.green;
  const lookClass = `${template.look}-preview`;
  return `<span class="template-preview ${lookClass} ${extraClass}" style="--preview-dark:${palette.dark};--preview-accent:${palette.accent};--preview-gold:${palette.gold};--preview-paper:${palette.paper}" aria-hidden="true"><i style="background-color:${palette.dark}"></i><b style="background-color:${palette.accent}"></b><em></em></span>`;
}

function renderTemplatePicker() {
  const selected = getActiveTemplate();
  document.getElementById("selectedTemplateLook").innerHTML = templateLookMarkup(selected);
  document.getElementById("selectedTemplateName").textContent = `Template ${String(selected.id).padStart(2, "0")} — ${selected.name}`;
  document.getElementById("selectedTemplateTier").textContent = selected.premium ? "Premium professional design" : selected.note;
  const menu = document.getElementById("templateMenu");
  menu.innerHTML = templates.map((template) => `
    <button class="template-option ${template.id === selected.id ? "active" : ""}" type="button" role="option" aria-selected="${template.id === selected.id}" data-template-id="${template.id}">
      ${templateLookMarkup(template)}
      <span class="template-option-copy"><strong>${String(template.id).padStart(2, "0")} — ${template.name}</strong><small>${template.note}</small></span>
      ${template.premium ? '<span class="premium-badge">PREMIUM</span>' : ""}
    </button>
  `).join("");
  menu.querySelectorAll("[data-template-id]").forEach((button) => {
    button.addEventListener("click", () => selectTemplate(Number(button.dataset.templateId)));
  });
}

function selectTemplate(id) {
  const template = templates.find((candidate) => candidate.id === id);
  if (!template) return;
  state.templateId = template.id;
  state.template = template.layout;
  state.theme = template.theme;
  renderTemplatePicker();
  document.getElementById("templateSelect").classList.remove("open");
  document.getElementById("templateSelectButton").setAttribute("aria-expanded", "false");
  updateFormFields(false);
  renderPoster();
  showToast(`Template ${String(template.id).padStart(2, "0")} — ${template.name} ਲੱਗ ਗਿਆ।`);
}

function updateLogoPreviews() {
  [["leftLogoPreview", state.leftLogo], ["rightLogoPreview", state.rightLogo]].forEach(([id, image]) => {
    const text = document.getElementById(id);
    if (!text) return;
    const label = text.closest(".logo-upload");
    if (image?.src) {
      label.style.backgroundImage = `url("${image.src}")`;
      label.classList.add("has-image");
      text.textContent = "Logo ਬਦਲੋ";
    } else {
      label.style.backgroundImage = "";
      label.classList.remove("has-image");
      text.textContent = id === "leftLogoPreview" ? "ਖੱਬਾ Logo" : "ਸੱਜਾ Logo";
    }
  });
}

function updateLogoScaleControls() {
  [["leftLogoScale", state.leftLogoScale], ["rightLogoScale", state.rightLogoScale]].forEach(([id, scale]) => {
    const input = document.getElementById(id);
    const output = document.getElementById(`${id}Value`);
    if (!input || !output) return;
    const percent = Math.round((Number(scale) || 1) * 100);
    input.value = String(percent);
    output.textContent = `${percent}%`;
  });
}

function updateFormFields(updateTemplate = true) {
  document.querySelectorAll("[data-key]").forEach((field) => {
    field.value = state[field.dataset.key] ?? "";
  });
  document.querySelectorAll(".theme-chip").forEach((button) => {
    button.classList.toggle("active", button.dataset.theme === state.theme);
  });
  if (updateTemplate) renderTemplatePicker();
  updateLogoPreviews();
  updateLogoScaleControls();
}

function escapeAttribute(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function smartFill() {
  const text = document.getElementById("smartText").value.trim();
  if (!text) {
    showToast("ਪਹਿਲਾਂ WhatsApp ਵਾਲਾ ਵੇਰਵਾ paste ਕਰੋ।");
    return;
  }
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  let found = 0;

  const dateMatch = text.match(/\b([0-3]?\d)[\-/.]([01]?\d)[\-/.](20\d{2}|\d{2})\b/);
  if (dateMatch) {
    state.date = dateMatch[0].replace(/[/.]/g, "-");
    found++;
  }

  const timeMatch = text.match(/(?:ਸਵੇਰੇ|ਸ਼ਾਮ|ਸ਼ਾਮ|ਦੁਪਹਿਰੇ|ਦੁਪਹਿਰ)?\s*([0-1]?\d(?::[0-5]\d)?\s*(?:ਵਜੇ|AM|PM|am|pm))/i);
  if (timeMatch) {
    state.time = timeMatch[0].trim();
    found++;
  }

  const societyLine = lines.find((line) => /(?:ਸੁਸਾਇਟੀ|ਸੋਸਾਇਟੀ|ਸਭਾ|ਲਿਮਿਟਡ|MPCASS|CASS|PACS)/i.test(line));
  if (societyLine) {
    state.societyName = societyLine.replace(/^[-–—•\d.()\s]+/, "");
    found++;
  }

  const venueLine = lines.find((line) => /(?:ਸਥਾਨ|ਜਗ੍ਹਾ|ਜਗਾ|ਦਫ਼ਤਰ|ਦਫਤਰ|ਵਿਖੇ)/.test(line));
  if (venueLine) {
    state.venue = venueLine.replace(/^(?:ਸਥਾਨ|ਜਗ੍ਹਾ|ਜਗਾ)\s*[:：-]?\s*/, "");
    found++;
  }

  const phones = [...text.matchAll(/(?<!\d)(?:\+?91[\s-]?)?([6-9]\d{4}[\s-]?\d{5})(?!\d)/g)]
    .map((match) => match[1].replace(/\D/g, ""));
  phones.slice(0, 3).forEach((phone, index) => {
    state.contacts[index].phone = `${phone.slice(0, 5)} ${phone.slice(5)}`;
    found++;
  });

  const numberedLines = lines.filter((line) => /^\s*(?:[1-4][.)]|[①②③④]|•)/.test(line));
  numberedLines.slice(0, 4).forEach((line, index) => {
    const cleaned = line.replace(/^\s*(?:[1-4][.)]|[①②③④]|•)\s*/, "");
    if (cleaned.length < 55) state.items[index].name = cleaned;
  });

  if (!societyLine && lines[0] && lines[0].length < 85) state.topLine = lines[0];
  if (lines.length > 1) {
    const body = lines.filter((line) => line !== societyLine && line !== venueLine).join(" ");
    if (body) state.noticeText = body.slice(0, 250);
  }

  updateFormFields();
  renderItemEditors();
  renderContactEditors();
  renderPoster();
  showToast(found ? `${found} ਵੇਰਵੇ ਆਪਣੇ ਆਪ ਭਰੇ ਗਏ—ਇੱਕ ਵਾਰ check ਕਰ ਲਵੋ।` : "Message ਜੋੜ ਦਿੱਤਾ—ਹੁਣ ਵੇਰਵਾ check ਕਰਕੇ edit ਕਰੋ।");
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function safeFilename() {
  const base = (state.societyName || "MDC-Poster")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 55);
  return `${base || "MDC-Poster"}-${state.date || "Notice"}.png`;
}

function downloadPoster() {
  renderPoster();
  exportController.downloadPNG();
}

function resetApp() {
  state = cloneDefaults();
  document.getElementById("smartText").value = "";
  updateFormFields();
  renderItemEditors();
  renderContactEditors();
  renderPoster();
  showToast("ਨਵਾਂ sample poster ਤਿਆਰ ਹੈ।");
}

function loadUserImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) return reject(new Error("Invalid image"));
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

function bindEvents() {
  document.getElementById("modulesButton").addEventListener("click", showModuleHub);

  document.querySelectorAll("[data-key]").forEach((field) => {
    field.addEventListener("input", (event) => {
      state[event.target.dataset.key] = event.target.value;
      renderPoster();
    });
  });

  document.querySelectorAll(".theme-chip").forEach((button) => {
    button.addEventListener("click", () => {
      state.theme = button.dataset.theme;
      updateFormFields();
      renderPoster();
    });
  });

  const templateSelect = document.getElementById("templateSelect");
  const templateButton = document.getElementById("templateSelectButton");
  templateButton.addEventListener("click", () => {
    const open = templateSelect.classList.toggle("open");
    templateButton.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", (event) => {
    if (!templateSelect.contains(event.target)) {
      templateSelect.classList.remove("open");
      templateButton.setAttribute("aria-expanded", "false");
    }
  });

  [["leftLogoInput", "leftLogo"], ["rightLogoInput", "rightLogo"]].forEach(([inputId, key]) => {
    document.getElementById(inputId).addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        state[key] = await loadUserImage(file);
        updateLogoPreviews();
        renderPoster();
        showToast(key === "leftLogo" ? "ਖੱਬਾ logo ਬਦਲ ਗਿਆ।" : "ਸੱਜਾ logo ਬਦਲ ਗਿਆ।");
      } catch (error) {
        showToast("ਇਹ logo photo ਨਹੀਂ ਖੁੱਲ੍ਹੀ।");
      }
    });
  });
  [["leftLogoScale", "leftLogoScale"], ["rightLogoScale", "rightLogoScale"]].forEach(([inputId, key]) => {
    document.getElementById(inputId).addEventListener("input", (event) => {
      state[key] = Number(event.target.value) / 100;
      document.getElementById(`${inputId}Value`).textContent = `${event.target.value}%`;
      renderPoster();
    });
  });
  document.getElementById("sameLogoButton").addEventListener("click", () => {
    if (!state.leftLogo) {
      showToast("ਪਹਿਲਾਂ ਖੱਬਾ logo upload ਕਰੋ।");
      return;
    }
    state.rightLogo = state.leftLogo;
    state.rightLogoScale = state.leftLogoScale;
    updateLogoPreviews();
    updateLogoScaleControls();
    renderPoster();
    showToast("ਇੱਕੋ logo ਦੋਵੇਂ ਪਾਸੇ ਲੱਗ ਗਿਆ।");
  });

  document.getElementById("smartFillButton").addEventListener("click", smartFill);
  document.getElementById("downloadButton").addEventListener("click", downloadPoster);
  document.getElementById("resetButton").addEventListener("click", resetApp);
  document.getElementById("addItemButton").addEventListener("click", addItem);

  const modal = document.getElementById("posterModal");
  document.getElementById("zoomButton").addEventListener("click", () => {
    exportController.copyToModal();
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  });
  const closeModal = () => {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };
  document.getElementById("modalClose").addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  const donateModal = document.getElementById("donateModal");
  const closeDonate = () => {
    donateModal.classList.remove("open");
    donateModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };
  document.getElementById("donateButton").addEventListener("click", () => {
    donateModal.classList.add("open");
    donateModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  });
  document.getElementById("donateClose").addEventListener("click", closeDonate);
  donateModal.addEventListener("click", (event) => {
    if (event.target === donateModal) closeDonate();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
      closeDonate();
    }
  });
}

renderModuleHub();
updateFormFields();
renderItemEditors();
renderContactEditors();
bindEvents();
exportController = createPosterExportController({
  sourceCanvas: canvas,
  modalCanvas,
  toolbar: document.querySelector(".preview-panel .toolbar-actions"),
  previewNote: document.querySelector(".preview-panel .preview-note"),
  filename: safeFilename,
  showToast,
  storageKey: "mdc-agri-poster-size",
  defaultFormat: "social"
});
renderPoster();

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(renderPoster);
}
