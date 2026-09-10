const canvas = document.getElementById("bhogPosterCanvas");
const ctx = canvas.getContext("2d");
const modalCanvas = document.getElementById("bhogModalCanvas");
const modalCtx = modalCanvas.getContext("2d");

const W = 1080;
const H = 1620;
const FONT = '"Noto Sans Gurmukhi", "Raavi", sans-serif';

const templates = [
  { id: 1, name: "Cream Floral Tribute", note: "Cream, navy ਅਤੇ gold — centered portrait", look: "center", bg: "#fff8e6", border: "#b88724", accent: "#072a45", text: "#4b120f", gold: "#bf8a25" },
  { id: 2, name: "Black Gold Memorial", note: "Dark premium layout — ਵੱਡੀ photo ਅਤੇ gold details", look: "center", bg: "#101010", border: "#cf9d2e", accent: "#76150d", text: "#e8bb43", gold: "#e0b23e" },
  { id: 3, name: "Photo Left Classic", note: "ਖੱਬੇ portrait, ਸੱਜੇ details ਅਤੇ venue panel", look: "left", bg: "#fffaf0", border: "#bd974c", accent: "#c39b4c", text: "#5a120f", gold: "#c39b4c" },
  { id: 4, name: "Maroon Simple Notice", note: "White, maroon ਅਤੇ brown — ਸਾਫ਼ traditional layout", look: "center", bg: "#fff", border: "#6e3827", accent: "#792e27", text: "#722e27", gold: "#b89c72" }
];

const defaultState = {
  templateId: 1,
  portrait: null,
  venueImage: null,
  portraitScale: 1,
  portraitX: 0,
  portraitY: 0,
  symbol: "☬",
  prayer: "ੴ ਸ੍ਰੀ ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫਤਹਿ ॥",
  noticeTitle: "ਪਾਠ ਦਾ ਭੋਗ",
  personName: "ਸਵ. ਨਾਮ ਇੱਥੇ ਲਿਖੋ",
  identityLine: "(ਪਿੰਡ / ਅਹੁਦਾ)",
  passingDate: "1 ਸਤੰਬਰ 2026",
  introText: "ਬੜੇ ਦੁਖੀ ਹਿਰਦੇ ਨਾਲ ਸੂਚਿਤ ਕੀਤਾ ਜਾਂਦਾ ਹੈ ਕਿ ਸਾਡੇ ਸਤਿਕਾਰਯੋਗ ਸਾਨੂੰ ਸਦੀਵੀ ਵਿਛੋੜਾ ਦੇ ਗਏ ਹਨ। ਉਨ੍ਹਾਂ ਦੀ ਆਤਮਿਕ ਸ਼ਾਂਤੀ ਲਈ ਰੱਖੇ ਸਹਿਜ ਪਾਠ ਦਾ ਭੋਗ ਅਤੇ ਅੰਤਿਮ ਅਰਦਾਸ ਹੇਠ ਲਿਖੇ ਅਨੁਸਾਰ ਹੋਵੇਗੀ।",
  eventTitle: "ਸਹਿਜ ਪਾਠ ਦਾ ਭੋਗ ਅਤੇ ਅੰਤਿਮ ਅਰਦਾਸ",
  eventDate: "8 ਸਤੰਬਰ 2026",
  eventDay: "ਮੰਗਲਵਾਰ",
  eventTime: "ਦੁਪਹਿਰ 12:00 ਤੋਂ 1:00 ਵਜੇ ਤੱਕ",
  venue: "ਗੁਰਦੁਆਰਾ ਸਾਹਿਬ, ਪਿੰਡ ਦਾ ਨਾਮ, ਜ਼ਿਲ੍ਹਾ ਮਾਨਸਾ",
  invitationText: "ਆਪ ਜੀ ਨੂੰ ਅੰਤਿਮ ਅਰਦਾਸ ਵਿੱਚ ਸ਼ਾਮਲ ਹੋਣ ਦੀ ਨਿਮਰ ਬੇਨਤੀ ਕੀਤੀ ਜਾਂਦੀ ਹੈ।",
  familyNames: "ਸਮੂਹ ਪਰਿਵਾਰ ਅਤੇ ਰਿਸ਼ਤੇਦਾਰ",
  phone: "98150 00000",
  phone2: "",
  footerNote: "ਗੁਰੂ ਘਰ ਦੀ ਬਖ਼ਸ਼ਿਸ਼ ਅਤੇ ਸੰਗਤਾਂ ਦੀ ਹਾਜ਼ਰੀ ਦੀ ਉਡੀਕ ਵਿੱਚ।"
};

let state = cloneDefaults();
let toastTimer;

function cloneDefaults() {
  return { ...defaultState, portrait: null, venueImage: null };
}

function getTemplate() {
  return templates.find((template) => template.id === Number(state.templateId)) || templates[0];
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

function wrapLines(context, text, maxWidth) {
  const paragraphs = String(text || "").split(/\n+/);
  const lines = [];
  paragraphs.forEach((paragraph) => {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    let line = "";
    words.forEach((word) => {
      const test = line ? `${line} ${word}` : word;
      if (context.measureText(test).width <= maxWidth) {
        line = test;
      } else {
        if (line) lines.push(line);
        if (context.measureText(word).width <= maxWidth) {
          line = word;
        } else {
          let part = "";
          for (const character of word) {
            if (context.measureText(part + character).width > maxWidth && part) {
              lines.push(part);
              part = character;
            } else {
              part += character;
            }
          }
          line = part;
        }
      }
    });
    if (line) lines.push(line);
  });
  return lines.length ? lines : [""];
}

function fitSize(text, maxWidth, start, min = 18, weight = 800) {
  let size = start;
  while (size > min) {
    setFont(ctx, size, weight);
    if (ctx.measureText(String(text || " ")).width <= maxWidth) break;
    size -= 1;
  }
  return size;
}

function drawTextBlock(text, x, y, maxWidth, options = {}) {
  const align = options.align || "center";
  const weight = options.weight || 700;
  const maxLines = options.maxLines || 3;
  const minSize = options.minSize || 18;
  let size = options.size || 32;
  let lines = [];
  while (size > minSize) {
    setFont(ctx, size, weight);
    lines = wrapLines(ctx, text, maxWidth);
    if (lines.length <= maxLines) break;
    size -= 1;
  }
  setFont(ctx, size, weight);
  lines = wrapLines(ctx, text, maxWidth);
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    let last = lines[lines.length - 1];
    while (last.length > 2 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    lines[lines.length - 1] = `${last}…`;
  }
  const lineHeight = options.lineHeight || Math.round(size * 1.34);
  ctx.fillStyle = options.color || "#241914";
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
  return { lines: lines.length, height: lines.length * lineHeight, size };
}

function drawCover(image, x, y, width, height, scale = 1, offsetX = 0, offsetY = 0) {
  if (!image?.naturalWidth) return;
  const base = Math.max(width / image.naturalWidth, height / image.naturalHeight) * scale;
  const drawW = image.naturalWidth * base;
  const drawH = image.naturalHeight * base;
  ctx.drawImage(image, x + (width - drawW) / 2 + offsetX, y + (height - drawH) / 2 + offsetY, drawW, drawH);
}

function drawPortrait(x, y, width, height, options = {}) {
  ctx.save();
  ctx.beginPath();
  if (options.oval) {
    ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
  } else {
    ctx.arc(x + width / 2, y + height / 2, Math.min(width, height) / 2, 0, Math.PI * 2);
  }
  ctx.clip();
  ctx.fillStyle = options.placeholder || "#ece6da";
  ctx.fillRect(x, y, width, height);
  if (state.portrait) {
    drawCover(state.portrait, x, y, width, height, state.portraitScale, state.portraitX, state.portraitY);
  } else {
    ctx.fillStyle = options.placeholderText || "#8f7c67";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    setFont(ctx, Math.min(30, width / 7), 800);
    ctx.fillText("ਫੋਟੋ Upload ਕਰੋ", x + width / 2, y + height / 2);
  }
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = options.border || "#c59637";
  ctx.lineWidth = options.lineWidth || 10;
  ctx.beginPath();
  if (options.oval) ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
  else ctx.arc(x + width / 2, y + height / 2, Math.min(width, height) / 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawVenueImage(x, y, width, height, border) {
  ctx.save();
  roundedPath(ctx, x, y, width, height, 24);
  ctx.clip();
  ctx.fillStyle = "#f3eddf";
  ctx.fillRect(x, y, width, height);
  if (state.venueImage) {
    drawCover(state.venueImage, x, y, width, height, 1);
  } else {
    ctx.fillStyle = "#8a704c";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    setFont(ctx, 23, 800);
    ctx.fillText("ਸਥਾਨ ਦੀ ਫੋਟੋ", x + width / 2, y + height / 2);
  }
  ctx.restore();
  strokeRound(ctx, x, y, width, height, 24, border, 5);
}

function drawBorder(color, inner = "#f0dba8", dark = false) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 13;
  ctx.strokeRect(18, 18, W - 36, H - 36);
  ctx.lineWidth = 3;
  ctx.strokeStyle = inner;
  ctx.strokeRect(36, 36, W - 72, H - 72);
  ctx.strokeRect(48, 48, W - 96, H - 96);
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  setFont(ctx, 34, 700);
  [[68, 70], [W - 68, 70], [68, H - 70], [W - 68, H - 70]].forEach(([x, y]) => ctx.fillText(dark ? "✦" : "❦", x, y));
}

function drawTopPrayer(color, symbolColor, y = 63, maxWidth = 720) {
  ctx.fillStyle = symbolColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  setFont(ctx, 72, 700);
  if (state.symbol) {
    ctx.fillText(state.symbol, 100, y + 34);
    ctx.fillText(state.symbol, W - 100, y + 34);
  }
  drawTextBlock(state.prayer, W / 2, y, maxWidth, { size: 31, minSize: 20, weight: 800, maxLines: 2, color, lineHeight: 42 });
}

function drawName(centerX, y, width, color, maxSize = 58) {
  const size = fitSize(state.personName, width, maxSize, 30, 900);
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  setFont(ctx, size, 900);
  ctx.fillText(state.personName, centerX, y);
  if (state.identityLine) drawTextBlock(state.identityLine, centerX, y + size + 8, width, { size: 27, minSize: 20, weight: 700, maxLines: 1, color });
}

function drawPhoneFooter(y, color, background) {
  const phones = [state.phone, state.phone2].filter(Boolean).join("  •  ");
  if (!phones) return;
  fillRound(ctx, 175, y, 730, 68, 31, background);
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const size = fitSize(`☎  ਸੰਪਰਕ: ${phones}`, 680, 31, 19, 900);
  setFont(ctx, size, 900);
  ctx.fillText(`☎  ਸੰਪਰਕ: ${phones}`, W / 2, y + 36);
}

function drawCreamFloral(template) {
  const gradient = ctx.createRadialGradient(W / 2, 410, 60, W / 2, 720, 920);
  gradient.addColorStop(0, "#fffdf3");
  gradient.addColorStop(1, "#fff3d6");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
  drawBorder(template.border, "#ead39b");
  drawTopPrayer("#302a24", template.gold, 62, 740);

  ctx.fillStyle = "rgba(194,145,52,.18)";
  ctx.textAlign = "center";
  setFont(ctx, 86, 400);
  ctx.fillText("❀", 112, 300); ctx.fillText("❀", W - 112, 300);
  setFont(ctx, 58, 400);
  ctx.fillText("❦", 118, 410); ctx.fillText("❦", W - 118, 410);

  drawPortrait(300, 154, 480, 480, { border: template.gold, lineWidth: 12, placeholder: "#efe6d1" });
  fillRound(ctx, 270, 660, 540, 76, 22, template.accent);
  strokeRound(ctx, 270, 660, 540, 76, 22, template.gold, 5);
  drawTextBlock(state.noticeTitle, W / 2, 671, 480, { size: 42, minSize: 27, weight: 900, maxLines: 1, color: "#f5cf72" });
  drawName(W / 2, 758, 880, template.text, 62);
  drawTextBlock(state.introText, W / 2, 875, 850, { size: 28, minSize: 22, weight: 600, maxLines: 4, color: "#32251d", lineHeight: 39 });

  fillRound(ctx, 150, 1040, 780, 118, 26, "#6c3414");
  strokeRound(ctx, 150, 1040, 780, 118, 26, template.gold, 4);
  drawTextBlock(state.eventTitle, W / 2, 1052, 710, { size: 34, minSize: 23, weight: 900, maxLines: 2, color: "#fff0c4", lineHeight: 42 });
  drawTextBlock(`${state.eventDate} • ${state.eventDay}\n${state.eventTime}`, W / 2, 1169, 890, { size: 30, minSize: 22, weight: 800, maxLines: 2, color: template.text, lineHeight: 40 });
  drawTextBlock(`⌖  ${state.venue}`, W / 2, 1258, 890, { size: 28, minSize: 20, weight: 800, maxLines: 2, color: "#432217", lineHeight: 38 });
  drawTextBlock(state.invitationText, W / 2, 1347, 880, { size: 22, minSize: 18, weight: 600, maxLines: 2, color: "#5b4636", lineHeight: 31 });
  drawTextBlock(`ਦੁਖੀ ਹਿਰਦੇ: ${state.familyNames}`, W / 2, 1414, 860, { size: 23, minSize: 18, weight: 800, maxLines: 2, color: template.accent, lineHeight: 32 });
  drawPhoneFooter(1500, "#fff2c4", template.accent);
}

function drawBlackGold(template) {
  const gradient = ctx.createRadialGradient(W / 2, 470, 40, W / 2, 720, 980);
  gradient.addColorStop(0, "#263039");
  gradient.addColorStop(.38, "#111315");
  gradient.addColorStop(1, "#050505");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
  drawBorder(template.border, "#795b1c", true);
  drawTopPrayer("#f4d985", template.gold, 58, 760);

  ctx.save();
  ctx.shadowColor = "rgba(240,213,158,.5)";
  ctx.shadowBlur = 45;
  drawPortrait(245, 175, 590, 590, { border: template.gold, lineWidth: 12, placeholder: "#22262a", placeholderText: "#c9a957" });
  ctx.restore();
  ctx.fillStyle = "#e7d09d";
  ctx.textAlign = "center";
  setFont(ctx, 64, 400);
  ctx.fillText("❀  ❀  ❀", W / 2, 748);

  fillRound(ctx, 100, 792, 880, 92, 14, "#6c100b");
  strokeRound(ctx, 100, 792, 880, 92, 14, template.gold, 5);
  drawName(W / 2, 810, 820, "#f4d671", 49);
  drawTextBlock(state.introText, W / 2, 930, 870, { size: 26, minSize: 20, weight: 600, maxLines: 4, color: "#f4f0e6", lineHeight: 37 });
  drawTextBlock(state.eventTitle, W / 2, 1088, 860, { size: 48, minSize: 30, weight: 900, maxLines: 2, color: "#f5c52e", lineHeight: 55 });

  const rows = [
    ["▣", "ਮਿਤੀ", `${state.eventDate} • ${state.eventDay}`],
    ["◷", "ਸਮਾਂ", state.eventTime],
    ["⌖", "ਸਥਾਨ", state.venue]
  ];
  rows.forEach(([icon, label, value], index) => {
    const y = 1194 + index * 79;
    strokeRound(ctx, 115, y, 850, 64, 27, "#b99148", 3);
    ctx.fillStyle = "#f1d17c";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    setFont(ctx, 27, 900);
    ctx.fillText(`${icon}  ${label}:`, 150, y + 34);
    drawTextBlock(value, 390, y + 12, 535, { size: 27, minSize: 17, weight: 800, maxLines: 1, color: "#f6f3e9", align: "left", lineHeight: 34 });
  });
  drawTextBlock(`ਦੁਖੀ ਹਿਰਦੇ: ${state.familyNames}`, W / 2, 1442, 850, { size: 24, minSize: 18, weight: 700, maxLines: 2, color: "#f1e8cf", lineHeight: 32 });
  drawPhoneFooter(1520, "#17120c", "#e1b33c");
}

function drawPhotoLeft(template) {
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(0, 0, W, H);
  drawBorder(template.border, "#e5d3aa");
  drawTextBlock("ੴ ਸਤਿਗੁਰ ਪ੍ਰਸਾਦਿ ॥", W / 2, 54, 700, { size: 32, minSize: 22, weight: 800, maxLines: 1, color: "#251f1a" });
  drawPortrait(65, 152, 350, 540, { oval: true, border: template.gold, lineWidth: 8, placeholder: "#eee7d8" });
  ctx.fillStyle = "#d8ba72";
  ctx.textAlign = "center";
  setFont(ctx, 62, 400);
  ctx.fillText("❀ ❀", 240, 705);

  drawTextBlock(state.prayer, 735, 180, 560, { size: 30, minSize: 21, weight: 800, maxLines: 3, color: "#2e2822", lineHeight: 43 });
  ctx.fillStyle = template.gold;
  ctx.textAlign = "center";
  setFont(ctx, 76, 700);
  ctx.fillText(state.symbol || "ੴ", 735, 315);
  drawTextBlock("ਦੁਖੀ ਹਿਰਦੇ ਨਾਲ ਸੂਚਿਤ ਕੀਤਾ ਜਾਂਦਾ ਹੈ ਕਿ", 735, 378, 560, { size: 24, minSize: 19, weight: 700, maxLines: 2, color: "#3d332a", lineHeight: 34 });
  drawName(735, 462, 580, template.text, 54);
  drawTextBlock(`ਸਦੀਵੀ ਵਿਛੋੜਾ ਦੇ ਗਏ — ${state.passingDate}`, 735, 570, 560, { size: 24, minSize: 18, weight: 700, maxLines: 2, color: "#5c3d2c", lineHeight: 34 });

  fillRound(ctx, 190, 755, 700, 65, 20, template.accent);
  drawTextBlock(state.eventTitle, W / 2, 765, 650, { size: 34, minSize: 23, weight: 900, maxLines: 1, color: "#fffaf0" });
  strokeRound(ctx, 135, 835, 810, 168, 28, template.gold, 4);
  drawTextBlock(`${state.eventDate}, ${state.eventDay}\n${state.eventTime}\n${state.venue}`, W / 2, 856, 740, { size: 28, minSize: 20, weight: 750, maxLines: 4, color: "#2f251f", lineHeight: 38 });

  fillRound(ctx, 130, 1025, 820, 210, 24, "#fffdf7");
  strokeRound(ctx, 130, 1025, 820, 210, 24, "#d7bb7a", 4);
  drawVenueImage(160, 1060, 310, 135, template.gold);
  drawTextBlock(state.venue, 705, 1072, 410, { size: 29, minSize: 20, weight: 900, maxLines: 3, color: template.text, lineHeight: 39 });
  drawTextBlock(state.invitationText, W / 2, 1260, 870, { size: 24, minSize: 19, weight: 600, maxLines: 3, color: "#463931", lineHeight: 34 });
  fillRound(ctx, 390, 1375, 300, 56, 18, template.accent);
  drawTextBlock("ਦੁਖੀ ਹਿਰਦੇ", W / 2, 1385, 260, { size: 27, minSize: 20, weight: 900, maxLines: 1, color: "#fff" });
  drawTextBlock(state.familyNames, W / 2, 1445, 820, { size: 24, minSize: 18, weight: 700, maxLines: 2, color: "#352820", lineHeight: 32 });
  drawPhoneFooter(1510, "#fff", template.text);
}

function drawMaroon(template) {
  ctx.fillStyle = "#f9f9f6";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#6d3a2b";
  ctx.fillRect(0, 0, 44, H); ctx.fillRect(W - 44, 0, 44, H);
  drawBorder(template.border, "#bda477");
  drawTopPrayer(template.text, template.text, 58, 690);
  drawTextBlock(state.noticeTitle, W / 2, 160, 760, { size: 56, minSize: 34, weight: 900, maxLines: 1, color: template.text });
  drawPortrait(345, 245, 390, 450, { oval: true, border: template.text, lineWidth: 7, placeholder: "#e7e7e4" });
  ctx.fillStyle = "#8d342d";
  ctx.textAlign = "center";
  setFont(ctx, 50, 400);
  ctx.fillText("❀", 270, 470); ctx.fillText("❀", W - 270, 470);
  drawTextBlock("ਆਪ ਜੀ ਨੂੰ ਬੜੇ ਦੁਖੀ ਹਿਰਦੇ ਨਾਲ ਸੂਚਿਤ ਕੀਤਾ ਜਾਂਦਾ ਹੈ ਕਿ", W / 2, 725, 860, { size: 24, minSize: 19, weight: 700, maxLines: 2, color: template.text, lineHeight: 35 });
  drawName(W / 2, 792, 840, template.text, 48);
  drawTextBlock(state.introText, W / 2, 905, 850, { size: 25, minSize: 19, weight: 600, maxLines: 4, color: "#4f302b", lineHeight: 35 });
  fillRound(ctx, 130, 1055, 820, 74, 18, template.accent);
  drawTextBlock(state.eventTitle, W / 2, 1067, 760, { size: 37, minSize: 24, weight: 900, maxLines: 1, color: "#fff" });
  drawTextBlock(`${state.eventDate}, ${state.eventDay}\n${state.eventTime}`, W / 2, 1150, 840, { size: 32, minSize: 22, weight: 900, maxLines: 2, color: template.text, lineHeight: 43 });
  drawTextBlock(state.venue, W / 2, 1247, 850, { size: 27, minSize: 20, weight: 750, maxLines: 2, color: "#8b2f29", lineHeight: 38 });
  drawTextBlock(state.invitationText, W / 2, 1332, 860, { size: 22, minSize: 18, weight: 600, maxLines: 2, color: "#4f302b", lineHeight: 31 });
  drawTextBlock(`ਦੁਖੀ ਹਿਰਦੇ: ${state.familyNames}`, W / 2, 1404, 820, { size: 23, minSize: 18, weight: 800, maxLines: 2, color: template.text, lineHeight: 31 });
  drawPhoneFooter(1490, "#fff", template.accent);
}

function renderPoster() {
  ctx.clearRect(0, 0, W, H);
  const template = getTemplate();
  if (template.id === 2) drawBlackGold(template);
  else if (template.id === 3) drawPhotoLeft(template);
  else if (template.id === 4) drawMaroon(template);
  else drawCreamFloral(template);

  if (state.footerNote && template.id !== 2) {
    const footerY = template.id === 4 ? 1570 : template.id === 3 ? 1584 : 1582;
    drawTextBlock(state.footerNote, W / 2, footerY, 850, { size: 15, minSize: 13, weight: 600, maxLines: 1, color: template.text });
  }
}

function lookMarkup(template) {
  return `<span class="bhog-template-look ${template.look === "left" ? "look-left" : ""}" style="--look-bg:${template.bg};--look-border:${template.border};--look-accent:${template.accent};--look-text:${template.text};--look-gold:${template.gold}"><i></i></span>`;
}

function renderTemplateMenu() {
  const menu = document.getElementById("bhogTemplateMenu");
  menu.innerHTML = templates.map((template) => `
    <button class="template-option bhog-template-option ${template.id === Number(state.templateId) ? "selected" : ""}" type="button" role="option" aria-selected="${template.id === Number(state.templateId)}" data-bhog-template="${template.id}">
      ${lookMarkup(template)}
      <span class="template-option-copy"><strong>${String(template.id).padStart(2, "0")}. ${template.name}</strong><small>${template.note}</small></span>
      <span class="bhog-template-badge">BHOG</span>
    </button>
  `).join("");
  menu.querySelectorAll("[data-bhog-template]").forEach((button) => {
    button.addEventListener("click", () => selectTemplate(Number(button.dataset.bhogTemplate)));
  });
}

function updateTemplateButton() {
  const template = getTemplate();
  document.getElementById("bhogSelectedTemplateLook").innerHTML = lookMarkup(template);
  document.getElementById("bhogSelectedTemplateName").textContent = `${String(template.id).padStart(2, "0")}. ${template.name}`;
  document.getElementById("bhogSelectedTemplateNote").textContent = template.note;
}

function selectTemplate(id) {
  state.templateId = id;
  updateTemplateButton();
  renderTemplateMenu();
  document.getElementById("bhogTemplateSelect").classList.remove("open");
  document.getElementById("bhogTemplateSelectButton").setAttribute("aria-expanded", "false");
  renderPoster();
}

function updatePhotoCards() {
  const portraitCard = document.getElementById("bhogPortraitCard");
  const venueCard = document.getElementById("bhogVenueCard");
  portraitCard.classList.toggle("has-image", Boolean(state.portrait));
  venueCard.classList.toggle("has-image", Boolean(state.venueImage));
  portraitCard.style.backgroundImage = state.portrait?.src ? `url(${state.portrait.src})` : "";
  venueCard.style.backgroundImage = state.venueImage?.src ? `url(${state.venueImage.src})` : "";
}

function updateFormFields() {
  document.querySelectorAll("[data-bhog-key]").forEach((field) => {
    field.value = state[field.dataset.bhogKey] ?? "";
  });
  const ranges = [
    ["bhogPortraitScale", Math.round(state.portraitScale * 100), "bhogPortraitScaleValue", "%"],
    ["bhogPortraitX", state.portraitX, "bhogPortraitXValue", ""],
    ["bhogPortraitY", state.portraitY, "bhogPortraitYValue", ""]
  ];
  ranges.forEach(([id, value, output, suffix]) => {
    document.getElementById(id).value = value;
    document.getElementById(output).textContent = `${value}${suffix}`;
  });
  updatePhotoCards();
  updateTemplateButton();
  renderTemplateMenu();
}

function showToast(message) {
  const toast = document.getElementById("bhogToast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function handleUpload(inputId, key, message) {
  const input = document.getElementById(inputId);
  const file = input.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showToast("ਕਿਰਪਾ ਕਰਕੇ JPG ਜਾਂ PNG photo ਚੁਣੋ।");
    return;
  }
  try {
    state[key] = await loadImageFromFile(file);
    updatePhotoCards();
    renderPoster();
    showToast(message);
  } catch (error) {
    showToast("Photo load ਨਹੀਂ ਹੋਈ। ਕੋਈ ਹੋਰ file try ਕਰੋ।");
  }
}

function normalizeLabel(label) {
  return label.toLowerCase().replace(/[\s_.-]+/g, "").replace(/[()]/g, "");
}

function setParsedField(label, value, parsed) {
  const key = normalizeLabel(label);
  const mappings = [
    [["ਧਾਰਮਿਕਪੰਕਤੀ", "ਪੰਕਤੀ", "prayer", "verse"], "prayer"],
    [["ਨੋਟਿਸ", "title", "noticetitle"], "noticeTitle"],
    [["ਨਾਮ", "name", "ਸਵਰਗਵਾਸੀਦਾਨਾਮ", "ਮ੍ਰਿਤਕਦਾਨਾਮ"], "personName"],
    [["ਪਛਾਣ", "ਅਹੁਦਾ", "ਪਿੰਡ", "identity", "designation"], "identityLine"],
    [["ਅਕਾਲਚਲਾਣਾ", "ਮੌਤਦੀਮਿਤੀ", "passingdate", "deathdate"], "passingDate"],
    [["ਵੇਰਵਾ", "ਦੁੱਖਸੰਦੇਸ਼", "message", "description"], "introText"],
    [["ਸਮਾਗਮ", "ਭੋਗ", "ਅੰਤਿਮਅਰਦਾਸ", "event", "eventtitle"], "eventTitle"],
    [["ਮਿਤੀ", "date", "ਭੋਗਦੀਮਿਤੀ", "eventdate"], "eventDate"],
    [["ਦਿਨ", "day"], "eventDay"],
    [["ਸਮਾਂ", "time"], "eventTime"],
    [["ਸਥਾਨ", "venue", "address", "ਜਗ੍ਹਾ"], "venue"],
    [["ਬੇਨਤੀ", "invitation", "invite"], "invitationText"],
    [["ਦੁਖੀਹਿਰਦੇ", "ਪਰਿਵਾਰ", "family", "familyname", "familynames"], "familyNames"],
    [["ਮੋਬਾਇਲ", "ਫੋਨ", "phone", "mobile", "contact"], "phone"],
    [["ਦੂਜਾਨੰਬਰ", "phone2", "mobile2"], "phone2"],
    [["ਨੋਟ", "note", "footernote"], "footerNote"]
  ];
  const match = mappings.find(([aliases]) => aliases.includes(key));
  if (match && value.trim()) parsed[match[1]] = value.trim();
}

function smartFill() {
  const text = document.getElementById("bhogSmartText").value.trim();
  if (!text) {
    showToast("ਪਹਿਲਾਂ client ਦੀ details paste ਕਰੋ।");
    return;
  }
  const parsed = {};
  text.split(/\n+/).forEach((line) => {
    const match = line.match(/^\s*([^:：=–—]{2,35})\s*[:：=–—]\s*(.+)$/);
    if (match) setParsedField(match[1], match[2], parsed);
  });

  const phones = [...text.matchAll(/(?:\+91[\s-]?)?([6-9]\d[\s-]?\d{4}[\s-]?\d{4})/g)]
    .map((match) => match[1].replace(/\s+/g, " "));
  if (!parsed.phone && phones[0]) parsed.phone = phones[0];
  if (!parsed.phone2 && phones[1]) parsed.phone2 = phones[1];

  if (!parsed.eventTime) {
    const time = text.match(/(?:ਸਮਾਂ|time)[^\n:：]*[:：]?\s*([^\n]+)/i);
    if (time) parsed.eventTime = time[1].trim();
  }
  if (!parsed.eventDate) {
    const dates = [...text.matchAll(/\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/g)].map((match) => match[0]);
    if (dates.length) parsed.eventDate = dates[dates.length - 1];
  }

  Object.entries(parsed).forEach(([key, value]) => { state[key] = value; });
  updateFormFields();
  renderPoster();
  const count = Object.keys(parsed).length;
  showToast(count ? `${count} fields ਆਪਣੇ ਆਪ ਭਰ ਗਈਆਂ—ਇੱਕ ਵਾਰ check ਕਰੋ।` : "Labels ਸਾਫ਼ ਲਿਖੋ, ਜਿਵੇਂ ਨਾਮ: …, ਮਿਤੀ: …");
}

function safeFilename() {
  const name = String(state.personName || "Bhog-Notice")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 48);
  return `${name || "Bhog-Notice"}-Poster.png`;
}

function downloadPoster() {
  renderPoster();
  canvas.toBlob((blob) => {
    if (!blob) {
      showToast("Poster download ਨਹੀਂ ਹੋ ਸਕਿਆ।");
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = safeFilename();
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("Bhog Notice PNG download ਹੋ ਗਿਆ।");
  }, "image/png");
}

function resetApp() {
  state = cloneDefaults();
  document.getElementById("bhogSmartText").value = "";
  document.getElementById("bhogPortraitInput").value = "";
  document.getElementById("bhogVenueInput").value = "";
  updateFormFields();
  renderPoster();
  showToast("ਨਵਾਂ Bhog Notice sample ਤਿਆਰ ਹੈ।");
}

function bindEvents() {
  document.querySelectorAll("[data-bhog-key]").forEach((field) => {
    field.addEventListener("input", (event) => {
      state[event.target.dataset.bhogKey] = event.target.value;
      renderPoster();
    });
  });

  const select = document.getElementById("bhogTemplateSelect");
  const selectButton = document.getElementById("bhogTemplateSelectButton");
  selectButton.addEventListener("click", () => {
    const open = select.classList.toggle("open");
    selectButton.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", (event) => {
    if (!select.contains(event.target)) {
      select.classList.remove("open");
      selectButton.setAttribute("aria-expanded", "false");
    }
  });

  document.getElementById("bhogSmartFillButton").addEventListener("click", smartFill);
  document.getElementById("bhogPortraitInput").addEventListener("change", () => handleUpload("bhogPortraitInput", "portrait", "ਮੁੱਖ photo poster ਵਿੱਚ ਲੱਗ ਗਈ।"));
  document.getElementById("bhogVenueInput").addEventListener("change", () => handleUpload("bhogVenueInput", "venueImage", "ਸਥਾਨ ਦੀ photo ਲੱਗ ਗਈ।"));
  document.getElementById("bhogRemovePortrait").addEventListener("click", () => {
    state.portrait = null;
    document.getElementById("bhogPortraitInput").value = "";
    updatePhotoCards(); renderPoster(); showToast("ਮੁੱਖ photo ਹਟਾ ਦਿੱਤੀ।");
  });
  document.getElementById("bhogRemoveVenue").addEventListener("click", () => {
    state.venueImage = null;
    document.getElementById("bhogVenueInput").value = "";
    updatePhotoCards(); renderPoster(); showToast("ਸਥਾਨ photo ਹਟਾ ਦਿੱਤੀ।");
  });

  [
    ["bhogPortraitScale", "portraitScale", "bhogPortraitScaleValue", "%", .01],
    ["bhogPortraitX", "portraitX", "bhogPortraitXValue", "", 1],
    ["bhogPortraitY", "portraitY", "bhogPortraitYValue", "", 1]
  ].forEach(([inputId, key, outputId, suffix, factor]) => {
    document.getElementById(inputId).addEventListener("input", (event) => {
      state[key] = Number(event.target.value) * factor;
      document.getElementById(outputId).textContent = `${event.target.value}${suffix}`;
      renderPoster();
    });
  });

  document.getElementById("bhogDownloadButton").addEventListener("click", downloadPoster);
  document.getElementById("bhogResetButton").addEventListener("click", resetApp);

  const modal = document.getElementById("bhogPosterModal");
  const closeModal = () => {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };
  document.getElementById("bhogZoomButton").addEventListener("click", () => {
    modalCtx.clearRect(0, 0, W, H);
    modalCtx.drawImage(canvas, 0, 0);
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  });
  document.getElementById("bhogModalClose").addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });

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
  donateModal.addEventListener("click", (event) => { if (event.target === donateModal) closeDonate(); });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { closeModal(); closeDonate(); }
  });
}

updateFormFields();
bindEvents();
renderPoster();
if (document.fonts?.ready) document.fonts.ready.then(renderPoster);
