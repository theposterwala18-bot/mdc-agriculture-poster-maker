const canvas = document.getElementById("gsPosterCanvas");
const ctx = canvas.getContext("2d");
const modalCanvas = document.getElementById("gsModalCanvas");
const modalCtx = modalCanvas.getContext("2d");

const W = 1080;
const H = 1350;
const FOOTER_Y = 1228;
const FONT = '"Noto Sans Gurmukhi", "Raavi", Arial, sans-serif';

const templates = [
  { id: 1, name: "Fresh Natural", note: "soft botanical product campaign", layout: "natural", bg: "natural", base: "#f8f5df", dark: "#174629", accent: "#f4a51c", price: "#f5c43f", look: "split" },
  { id: 2, name: "Weekend Flash", note: "black, red ਅਤੇ yellow high-impact sale", layout: "flash", bg: "bold", base: "#0a0a0a", dark: "#050505", accent: "#ef1d18", price: "#ffe000", look: "centered" },
  { id: 3, name: "Citrus Clean", note: "bright orange clean product focus", layout: "citrus", bg: "clean", base: "#fff8e8", dark: "#44200e", accent: "#f55a10", price: "#ffd334", look: "split" },
  { id: 4, name: "Beauty Model Split", note: "model ਅਤੇ product ਦੀ premium split story", layout: "model-split", bg: "natural", base: "#f4f1df", dark: "#154826", accent: "#f1a91c", price: "#ffd53f", look: "split" },
  { id: 5, name: "Hero Product Spotlight", note: "ਵੱਡਾ product ਅਤੇ clear benefit icons", layout: "hero", bg: "clean", base: "#fffbee", dark: "#183f27", accent: "#f69a10", price: "#ffcb31", look: "centered" },
  { id: 6, name: "Emerald Gold", note: "dark green luxury counter display", layout: "emerald", bg: "luxury", base: "#052d1d", dark: "#031c12", accent: "#deb852", price: "#e7be55", look: "centered" },
  { id: 7, name: "Black Gold Elite", note: "premium black studio campaign", layout: "black-gold", bg: "luxury", base: "#12100c", dark: "#080705", accent: "#e4c276", price: "#f0ca68", look: "centered" },
  { id: 8, name: "Orange Retail Blocks", note: "bold blocks with instant price reading", layout: "blocks", bg: "bold", base: "#fffdfa", dark: "#151515", accent: "#ff5a08", price: "#ffe20d", look: "right" },
  { id: 9, name: "Pink Beauty Care", note: "soft pink model-led sale design", layout: "pink", bg: "clean", base: "#ffe6e5", dark: "#68182f", accent: "#d32759", price: "#ffd13d", look: "split" },
  { id: 10, name: "Clean Retail Grid", note: "product of the week style clean grid", layout: "grid", bg: "clean", base: "#ffffff", dark: "#123f24", accent: "#239130", price: "#ffd943", look: "split" },
  { id: 11, name: "Neon Digital Deal", note: "blue-purple online exclusive look", layout: "neon", bg: "neon", base: "#12095d", dark: "#08043d", accent: "#4e31ff", price: "#ffe72c", look: "centered" },
  { id: 12, name: "Festive Royal Sale", note: "magenta, marigold ਅਤੇ gold festive theme", layout: "festive", bg: "festive", base: "#810a55", dark: "#43002d", accent: "#f1bd45", price: "#f6cb62", look: "centered" }
];

const defaultState = {
  templateId: 1,
  bgStyle: "natural",
  bgSeed: 0,
  productColor: "#f0a018",
  shopName: "GLOW & CARE COSMETICS",
  tagline: "Beauty • Skin Care • Personal Care",
  productName: "Mamaearth Vitamin C Daily Glow Face Wash",
  category: "SKIN CARE",
  headline: "Fresh Skin. Daily Glow.",
  regularPrice: "₹299",
  salePrice: "₹199",
  discount: "33% OFF",
  offerText: "Limited Time Offer",
  features: "Cleanses gently\nBrightens skin\nMade safe",
  cta: "SHOP NOW",
  address: "Main Bazaar, Bhikhi (Mansa)",
  phone: "+91 98765 43210",
  email: "hello@glowandcare.in",
  instagram: "@glowandcare",
  logo: null,
  productImage: null,
  modelImage: null,
  customBackground: null,
  logoScale: 1,
  productScale: 1,
  productX: 0,
  productY: 0,
  modelScale: 1,
  onlineCredit: "",
  onlineSourceUrl: ""
};

let state = cloneDefaults();
let toastTimer;
let searchContinue = null;
let lastSearch = { query: "", kind: "product" };

function cloneDefaults() {
  return JSON.parse(JSON.stringify(defaultState));
}

function getTemplate() {
  return templates.find((template) => template.id === Number(state.templateId)) || templates[0];
}

function setFont(context, size, weight = 700, family = FONT) {
  context.font = `${weight} ${size}px ${family}`;
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

function fitFont(context, text, maxWidth, start, min = 18, weight = 800, family = FONT) {
  let size = start;
  while (size > min) {
    setFont(context, size, weight, family);
    if (context.measureText(String(text || " ")).width <= maxWidth) break;
    size -= 1;
  }
  return size;
}

function wrapLines(context, text, maxWidth) {
  const paragraphs = String(text || "").split(/\n+/);
  const lines = [];
  paragraphs.forEach((paragraph) => {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    let line = "";
    words.forEach((word) => {
      const next = line ? `${line} ${word}` : word;
      if (context.measureText(next).width <= maxWidth || !line) {
        line = next;
      } else {
        lines.push(line);
        line = word;
      }
    });
    if (line) lines.push(line);
  });
  return lines;
}

function drawWrapped(context, text, x, y, maxWidth, lineHeight, maxLines, options = {}) {
  const {
    size = 32,
    minSize = 20,
    weight = 700,
    color = "#111",
    align = "left",
    family = FONT
  } = options;
  let fontSize = size;
  let lines = [];
  while (fontSize >= minSize) {
    setFont(context, fontSize, weight, family);
    lines = wrapLines(context, text, maxWidth);
    if (lines.length <= maxLines) break;
    fontSize -= 1;
  }
  context.fillStyle = color;
  context.textAlign = align;
  context.textBaseline = "top";
  lines.slice(0, maxLines).forEach((line, index) => {
    context.fillText(line, x, y + index * lineHeight);
  });
  return { lines: lines.slice(0, maxLines), fontSize };
}

function drawContain(context, image, x, y, width, height, scale = 1, offsetX = 0, offsetY = 0) {
  if (!image?.naturalWidth) return false;
  const ratio = Math.min(width / image.naturalWidth, height / image.naturalHeight) * scale;
  const drawWidth = image.naturalWidth * ratio;
  const drawHeight = image.naturalHeight * ratio;
  context.drawImage(
    image,
    x + (width - drawWidth) / 2 + offsetX,
    y + (height - drawHeight) / 2 + offsetY,
    drawWidth,
    drawHeight
  );
  return true;
}

function drawCover(context, image, x, y, width, height, scale = 1) {
  if (!image?.naturalWidth) return false;
  const ratio = Math.max(width / image.naturalWidth, height / image.naturalHeight) * scale;
  const drawWidth = image.naturalWidth * ratio;
  const drawHeight = image.naturalHeight * ratio;
  context.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
  return true;
}

function hexToRgb(hex) {
  const value = String(hex || "").replace("#", "");
  const full = value.length === 3 ? value.split("").map((char) => char + char).join("") : value.padEnd(6, "0").slice(0, 6);
  return {
    r: parseInt(full.slice(0, 2), 16) || 0,
    g: parseInt(full.slice(2, 4), 16) || 0,
    b: parseInt(full.slice(4, 6), 16) || 0
  };
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0")).join("")}`;
}

function mixColor(first, second, amount) {
  const a = hexToRgb(first);
  const b = hexToRgb(second);
  return rgbToHex(
    a.r + (b.r - a.r) * amount,
    a.g + (b.g - a.g) * amount,
    a.b + (b.b - a.b) * amount
  );
}

function rgba(hex, alpha) {
  const color = hexToRgb(hex);
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}

function drawImagePlaceholder(x, y, width, height, label, dark = "#31503f") {
  ctx.save();
  ctx.setLineDash([14, 12]);
  strokeRound(ctx, x, y, width, height, 24, rgba(dark, .35), 3);
  ctx.setLineDash([]);
  ctx.fillStyle = rgba(dark, .72);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  setFont(ctx, 26, 800);
  ctx.fillText(label, x + width / 2, y + height / 2 - 8);
  setFont(ctx, 19, 600);
  ctx.fillText("Upload ਜਾਂ Online Search", x + width / 2, y + height / 2 + 28);
  ctx.restore();
}

function drawProduct(x, y, width, height, options = {}) {
  const { glow = "#ffffff", placeholderDark = "#31503f", shadow = true } = options;
  if (!state.productImage?.naturalWidth) {
    drawImagePlaceholder(x + 20, y + 20, width - 40, height - 40, "PRODUCT PHOTO", placeholderDark);
    return;
  }
  ctx.save();
  if (shadow) {
    ctx.shadowColor = rgba(glow, .48);
    ctx.shadowBlur = 34;
    ctx.shadowOffsetY = 18;
  }
  drawContain(ctx, state.productImage, x, y, width, height, state.productScale, state.productX, state.productY);
  ctx.restore();
}

function drawModel(x, y, width, height, shape = "round") {
  if (!state.modelImage?.naturalWidth) return false;
  ctx.save();
  if (shape === "circle") {
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height / 2, Math.min(width, height) / 2, 0, Math.PI * 2);
    ctx.clip();
  } else {
    roundedPath(ctx, x, y, width, height, shape === "soft" ? 52 : 24);
    ctx.clip();
  }
  drawCover(ctx, state.modelImage, x, y, width, height, state.modelScale);
  ctx.restore();
  return true;
}

function drawLogo(x, y, size, align = "center") {
  if (!state.logo?.naturalWidth) return false;
  const scaled = size * state.logoScale;
  const drawX = align === "left" ? x : x - scaled / 2;
  drawContain(ctx, state.logo, drawX, y - scaled / 2, scaled, scaled, 1);
  return true;
}

function drawContactFooter(template, darkBackground = true) {
  const footerColor = darkBackground ? template.dark : "#ffffff";
  const textColor = darkBackground ? "#ffffff" : template.dark;
  ctx.fillStyle = footerColor;
  ctx.fillRect(0, FOOTER_Y, W, H - FOOTER_Y);

  const values = [
    state.address ? { icon: "●", text: state.address } : null,
    state.phone ? { icon: "☎", text: state.phone } : null,
    state.email ? { icon: "✉", text: state.email } : null,
    state.instagram ? { icon: "◎", text: state.instagram } : null
  ].filter(Boolean);
  const count = Math.max(1, values.length);
  const gap = 18;
  const itemWidth = (W - 70 - gap * (count - 1)) / count;

  values.forEach((item, index) => {
    const left = 35 + index * (itemWidth + gap);
    if (index) {
      ctx.fillStyle = rgba(textColor, .35);
      ctx.fillRect(left - gap / 2, FOOTER_Y + 26, 2, 70);
    }
    ctx.fillStyle = index === 0 ? template.accent : textColor;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    setFont(ctx, 28, 900, "Arial, sans-serif");
    ctx.fillText(item.icon, left, FOOTER_Y + 60);
    const iconWidth = 35;
    fitFont(ctx, item.text, itemWidth - iconWidth, 22, 14, 700);
    ctx.fillStyle = textColor;
    ctx.fillText(item.text, left + iconWidth, FOOTER_Y + 60);
  });

  if (state.onlineCredit) {
    ctx.textAlign = "right";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = rgba(textColor, .72);
    setFont(ctx, 11, 500, "Arial, sans-serif");
    ctx.fillText(`Image: ${state.onlineCredit}`.slice(0, 130), W - 28, H - 10);
  }
}

function drawShopHeader(template, options = {}) {
  const {
    x = 55,
    y = 34,
    width = W - 110,
    height = 132,
    background = rgba("#ffffff", .88),
    color = template.dark,
    border = rgba(template.accent, .45),
    logoPosition = "left"
  } = options;
  fillRound(ctx, x, y, width, height, 28, background);
  strokeRound(ctx, x, y, width, height, 28, border, 2);
  const hasLogo = state.logo?.naturalWidth;
  if (hasLogo) {
    const logoX = logoPosition === "center" ? x + width / 2 : x + 72;
    drawLogo(logoX, y + height / 2, 90, logoPosition === "left" ? "center" : "center");
  }
  const textLeft = hasLogo && logoPosition === "left" ? x + 140 : x + 30;
  const textWidth = hasLogo && logoPosition === "left" ? width - 170 : width - 60;
  ctx.textAlign = logoPosition === "center" ? "center" : "left";
  ctx.textBaseline = "alphabetic";
  const textX = logoPosition === "center" ? x + width / 2 : textLeft;
  fitFont(ctx, state.shopName, textWidth, 44, 25, 900);
  ctx.fillStyle = color;
  ctx.fillText(state.shopName, textX, y + 62);
  fitFont(ctx, state.tagline, textWidth, 23, 15, 600);
  ctx.fillStyle = rgba(color, .82);
  ctx.fillText(state.tagline, textX, y + 100);
}

function drawFeatureList(x, y, width, template, options = {}) {
  const features = String(state.features || "").split(/\n|,|•/).map((item) => item.trim()).filter(Boolean).slice(0, options.max || 4);
  const lineHeight = options.lineHeight || 55;
  const color = options.color || template.dark;
  features.forEach((feature, index) => {
    const cy = y + index * lineHeight;
    ctx.beginPath();
    ctx.arc(x + 18, cy + 15, 14, 0, Math.PI * 2);
    ctx.fillStyle = options.iconBg || rgba(template.accent, .2);
    ctx.fill();
    ctx.strokeStyle = template.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 11, cy + 15);
    ctx.lineTo(x + 17, cy + 21);
    ctx.lineTo(x + 27, cy + 8);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    fitFont(ctx, feature, width - 48, options.size || 25, 17, 700);
    ctx.fillText(feature, x + 45, cy);
  });
}

function drawPriceCard(x, y, width, height, template, options = {}) {
  const background = options.background || template.price;
  const color = options.color || template.dark;
  fillRound(ctx, x, y, width, height, options.radius || 28, background);
  if (options.border) strokeRound(ctx, x, y, width, height, options.radius || 28, options.border, 3);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (state.offerText) {
    fitFont(ctx, state.offerText.toUpperCase(), width - 34, 23, 14, 800);
    ctx.fillStyle = rgba(color, .86);
    ctx.fillText(state.offerText.toUpperCase(), x + width / 2, y + 27);
  }
  fitFont(ctx, state.salePrice, width - 30, options.priceSize || 72, 38, 900);
  ctx.fillStyle = color;
  ctx.fillText(state.salePrice, x + width / 2, y + height * .57);
  if (state.regularPrice) {
    fitFont(ctx, `MRP ${state.regularPrice}`, width - 42, 24, 15, 700);
    ctx.fillStyle = rgba(color, .82);
    const priceY = y + height - 24;
    ctx.fillText(`MRP ${state.regularPrice}`, x + width / 2, priceY);
    const measured = ctx.measureText(`MRP ${state.regularPrice}`).width;
    ctx.strokeStyle = options.strike || "#d21720";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + width / 2 - measured / 2 + 42, priceY);
    ctx.lineTo(x + width / 2 + measured / 2, priceY - 5);
    ctx.stroke();
  }
}

function drawCta(x, y, width, height, template, options = {}) {
  fillRound(ctx, x, y, width, height, height / 2, options.background || template.dark);
  if (options.border) strokeRound(ctx, x, y, width, height, height / 2, options.border, 3);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  fitFont(ctx, state.cta || "SHOP NOW", width - 52, options.size || 34, 20, 900);
  ctx.fillStyle = options.color || "#fff";
  ctx.fillText(`${state.cta || "SHOP NOW"}  ›`, x + width / 2, y + height / 2 + 2);
}

function drawDiscountBadge(x, y, size, template, options = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(options.rotate || 0);
  ctx.beginPath();
  const points = 24;
  for (let i = 0; i < points; i += 1) {
    const angle = (Math.PI * 2 * i) / points;
    const radius = i % 2 === 0 ? size / 2 : size * .43;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    if (!i) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = options.background || template.price;
  ctx.fill();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  fitFont(ctx, state.discount || "SALE", size * .72, options.size || 40, 22, 900);
  ctx.fillStyle = options.color || template.dark;
  const lines = String(state.discount || "SALE").split(/\s+/);
  if (lines.length > 1) {
    ctx.fillText(lines[0], 0, -15);
    ctx.fillText(lines.slice(1).join(" "), 0, 25);
  } else {
    ctx.fillText(lines[0], 0, 2);
  }
  ctx.restore();
}

function drawGeneratedBackground(template) {
  if (state.customBackground?.naturalWidth) {
    drawCover(ctx, state.customBackground, 0, 0, W, H);
    const overlay = ctx.createLinearGradient(0, 0, 0, H);
    overlay.addColorStop(0, "rgba(0,0,0,.05)");
    overlay.addColorStop(.72, "rgba(0,0,0,.08)");
    overlay.addColorStop(1, "rgba(0,0,0,.28)");
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, W, H);
    return;
  }

  const style = state.bgStyle || template.bg;
  const seed = Number(state.bgSeed) || 0;
  const accent = style === "auto" ? state.productColor || template.accent : template.accent;
  let top = template.base;
  let bottom = mixColor(template.base, template.dark, .2);

  if (style === "natural") {
    top = mixColor("#fffbea", accent, .06);
    bottom = mixColor("#f0f5df", template.dark, .08);
  } else if (style === "clean") {
    top = "#fffdf8";
    bottom = mixColor("#ffffff", accent, .1);
  } else if (style === "luxury") {
    top = mixColor(template.dark, "#000000", .12);
    bottom = mixColor(template.dark, accent, .16);
  } else if (style === "bold") {
    top = template.dark;
    bottom = mixColor(template.dark, template.accent, .28);
  } else if (style === "neon") {
    top = "#120654";
    bottom = "#09032c";
  } else if (style === "festive") {
    top = "#851057";
    bottom = "#4a0030";
  } else if (style === "auto") {
    top = mixColor("#ffffff", accent, .13);
    bottom = mixColor("#fff8e8", accent, .28);
  }

  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, top);
  gradient.addColorStop(1, bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  if (style === "natural" || style === "auto" || style === "clean") {
    const spots = [
      [80 + (seed * 47) % 130, 260, 270],
      [890 - (seed * 31) % 150, 390, 330],
      [160 + (seed * 23) % 180, 1050, 260]
    ];
    spots.forEach(([x, y, radius], index) => {
      const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
      glow.addColorStop(0, rgba(index === 1 ? accent : template.dark, style === "clean" ? .08 : .16));
      glow.addColorStop(1, rgba(accent, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
    for (let i = 0; i < 9; i += 1) {
      ctx.save();
      ctx.translate((i * 173 + seed * 41) % 1160 - 40, 180 + ((i * 241 + seed * 37) % 980));
      ctx.rotate((i + seed) * .62);
      ctx.fillStyle = rgba(template.dark, .09);
      ctx.beginPath();
      ctx.ellipse(0, 0, 48, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  if (style === "luxury" || style === "neon") {
    const glowColor = style === "neon" ? "#7454ff" : accent;
    const glow = ctx.createRadialGradient(W * .5, 680, 50, W * .5, 680, 470);
    glow.addColorStop(0, rgba(glowColor, .36));
    glow.addColorStop(.55, rgba(glowColor, .1));
    glow.addColorStop(1, rgba(glowColor, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 100, W, 1060);
    ctx.strokeStyle = rgba(style === "neon" ? "#57baff" : accent, .65);
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(W / 2, 670, 300 + (seed % 3) * 22, Math.PI * .05, Math.PI * 1.95);
    ctx.stroke();
  }

  if (style === "bold") {
    ctx.save();
    ctx.translate(-120 + (seed % 4) * 35, 0);
    ctx.rotate(-.16);
    ctx.fillStyle = rgba(template.accent, .76);
    ctx.fillRect(0, 150, 1400, 160);
    ctx.fillStyle = rgba(template.price, .92);
    ctx.fillRect(0, 1000, 1400, 90);
    ctx.restore();
    for (let i = 0; i < 11; i += 1) {
      ctx.fillStyle = rgba(template.price, i % 2 ? .18 : .09);
      ctx.beginPath();
      ctx.arc((i * 113 + seed * 27) % W, 330 + (i % 4) * 180, 5 + (i % 3) * 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (style === "festive") {
    ctx.strokeStyle = rgba("#ffd46a", .72);
    ctx.lineWidth = 10;
    for (let i = 0; i < 5; i += 1) {
      const archX = 100 + i * 220;
      ctx.beginPath();
      ctx.arc(archX, 90, 122, 0, Math.PI, true);
      ctx.stroke();
    }
    for (let i = 0; i < 38; i += 1) {
      const x = (i * 149 + seed * 31) % W;
      const y = 30 + ((i * 83 + seed * 29) % 1120);
      ctx.fillStyle = rgba("#ffe597", .45 + (i % 3) * .13);
      ctx.beginPath();
      ctx.arc(x, y, 2 + (i % 4), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawProductName(x, y, width, template, options = {}) {
  const color = options.color || template.dark;
  ctx.textAlign = options.align || "left";
  ctx.textBaseline = "top";
  drawWrapped(ctx, state.productName, x, y, width, options.lineHeight || 48, options.maxLines || 3, {
    size: options.size || 43,
    minSize: options.minSize || 25,
    weight: options.weight || 900,
    color,
    align: options.align || "left"
  });
}

function drawHeadline(x, y, width, template, options = {}) {
  ctx.textAlign = options.align || "left";
  ctx.textBaseline = "top";
  drawWrapped(ctx, state.headline, x, y, width, options.lineHeight || 55, options.maxLines || 2, {
    size: options.size || 48,
    minSize: options.minSize || 28,
    weight: options.weight || 900,
    color: options.color || template.dark,
    align: options.align || "left"
  });
}

function drawCategoryPill(x, y, width, template, options = {}) {
  fillRound(ctx, x, y, width, options.height || 42, 21, options.background || template.accent);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  fitFont(ctx, String(state.category || "SPECIAL OFFER").toUpperCase(), width - 30, options.size || 20, 13, 900);
  ctx.fillStyle = options.color || "#ffffff";
  ctx.fillText(String(state.category || "SPECIAL OFFER").toUpperCase(), x + width / 2, y + (options.height || 42) / 2 + 1);
}

function drawNaturalLayout(template) {
  drawShopHeader(template, { background: "rgba(255,255,255,.86)" });
  drawHeadline(58, 195, 500, template, { size: 55, lineHeight: 62, maxLines: 2 });
  drawCategoryPill(60, 335, 270, template);

  if (state.modelImage) {
    drawModel(598, 178, 440, 770, "soft");
    const wash = ctx.createLinearGradient(540, 0, 760, 0);
    wash.addColorStop(0, "rgba(255,252,238,.92)");
    wash.addColorStop(1, "rgba(255,252,238,0)");
    ctx.fillStyle = wash;
    ctx.fillRect(490, 170, 310, 820);
    drawProduct(462, 350, 430, 690, { glow: template.accent });
  } else {
    drawProduct(500, 260, 500, 820, { glow: template.accent });
  }

  drawFeatureList(64, 425, 370, template, { max: 4, lineHeight: 66, size: 27 });
  drawDiscountBadge(250, 735, 176, template, { background: template.price });
  drawPriceCard(60, 840, 360, 190, template, { background: "#ffffff", border: rgba(template.accent, .55), priceSize: 70 });
  drawCta(60, 1060, 380, 86, template, { background: template.dark });
  drawContactFooter(template);
}

function drawFlashLayout(template) {
  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, W, 150);
  if (state.logo) drawLogo(78, 74, 90);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  fitFont(ctx, state.shopName, state.logo ? 810 : 980, 48, 27, 900);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(state.shopName, state.logo ? 590 : W / 2, 57);
  fitFont(ctx, state.tagline, 860, 22, 15, 700);
  ctx.fillStyle = template.price;
  ctx.fillText(state.tagline, state.logo ? 590 : W / 2, 108);

  ctx.save();
  ctx.translate(-70, 180);
  ctx.rotate(-.06);
  fillRound(ctx, 0, 0, 470, 122, 8, template.price);
  ctx.fillStyle = "#050505";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  fitFont(ctx, String(state.headline || "FLASH SALE").toUpperCase(), 420, 58, 27, 900);
  ctx.fillText(String(state.headline || "FLASH SALE").toUpperCase(), 250, 62);
  ctx.restore();

  drawProduct(335, 235, 470, 800, { glow: template.price });
  drawDiscountBadge(895, 335, 250, template, { background: template.price, color: "#080808", size: 58 });
  drawProductName(42, 350, 315, template, { color: "#ffffff", size: 38, minSize: 23, lineHeight: 46, maxLines: 4 });
  drawFeatureList(44, 575, 280, template, { max: 3, color: "#fff", iconBg: rgba(template.price, .13), size: 22, lineHeight: 58 });
  drawPriceCard(735, 695, 310, 210, template, { background: template.accent, color: "#ffffff", border: template.price, priceSize: 76 });
  drawCategoryPill(760, 935, 260, template, { background: template.price, color: "#080808" });
  drawCta(250, 1090, 580, 92, template, { background: template.accent, border: "#ffffff", size: 38 });
  drawContactFooter(template);
}

function drawCitrusLayout(template) {
  drawShopHeader(template, { background: "rgba(255,255,255,.9)", border: rgba(template.accent, .5) });
  drawProduct(20, 250, 570, 890, { glow: "#ffb21f" });
  drawHeadline(565, 220, 455, template, { size: 52, lineHeight: 58, maxLines: 2, color: "#5c2208" });
  drawProductName(565, 360, 455, template, { size: 54, minSize: 29, lineHeight: 56, maxLines: 4, color: template.accent });
  drawFeatureList(575, 620, 420, template, { max: 3, lineHeight: 62, size: 25, color: "#51250f" });
  drawDiscountBadge(890, 800, 190, template, { background: "#ff3f12", color: "#fff" });
  drawPriceCard(575, 850, 390, 190, template, { background: template.price, priceSize: 74 });
  drawCta(570, 1070, 405, 82, template, { background: "#168b35" });
  drawContactFooter(template, false);
}

function drawModelSplitLayout(template) {
  drawShopHeader(template, { background: "rgba(255,255,255,.88)" });
  const hasModel = drawModel(0, 172, 535, 1056, "soft");
  if (!hasModel) {
    fillRound(ctx, 30, 200, 465, 900, 50, rgba("#ffffff", .52));
    drawProduct(45, 245, 430, 810, { glow: template.accent });
  } else {
    const modelShade = ctx.createLinearGradient(0, 800, 0, 1228);
    modelShade.addColorStop(0, "rgba(16,65,35,0)");
    modelShade.addColorStop(1, "rgba(16,65,35,.65)");
    ctx.fillStyle = modelShade;
    ctx.fillRect(0, 620, 535, 608);
    drawHeadline(55, 995, 430, template, { color: "#fff", size: 42, lineHeight: 49, maxLines: 2 });
  }
  drawCategoryPill(585, 210, 290, template);
  drawProductName(565, 280, 470, template, { size: 47, minSize: 26, lineHeight: 52, maxLines: 3 });
  drawProduct(565, 405, 420, 555, { glow: template.accent });
  drawFeatureList(575, 925, 390, template, { max: 3, lineHeight: 49, size: 22 });
  drawDiscountBadge(900, 950, 170, template, { background: template.price });
  drawPriceCard(555, 1040, 455, 150, template, { background: "#ffffff", border: rgba(template.accent, .55), priceSize: 58 });
  drawContactFooter(template);
}

function drawHeroLayout(template) {
  drawShopHeader(template, { background: "rgba(255,255,255,.9)" });
  drawCategoryPill(60, 205, 310, template, { background: template.dark });
  drawProduct(35, 260, 570, 880, { glow: template.accent });
  drawProductName(590, 220, 440, template, { size: 50, lineHeight: 56, maxLines: 4 });
  drawHeadline(590, 455, 420, template, { size: 36, minSize: 23, lineHeight: 43, maxLines: 2, color: template.accent });
  drawFeatureList(600, 580, 390, template, { max: 4, lineHeight: 66, size: 25 });
  drawPriceCard(600, 855, 390, 188, template, { background: "#fff", border: template.accent, priceSize: 72 });
  drawDiscountBadge(925, 825, 160, template, { background: template.price });
  drawCta(590, 1075, 410, 82, template, { background: template.accent });
  drawContactFooter(template, false);
}

function drawEmeraldLayout(template) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (state.logo) drawLogo(W / 2, 62, 75);
  fitFont(ctx, state.shopName, 950, 52, 29, 900);
  ctx.fillStyle = template.accent;
  ctx.fillText(state.shopName, W / 2, state.logo ? 126 : 65);
  fitFont(ctx, state.tagline, 800, 24, 15, 600);
  ctx.fillStyle = "#fff4cf";
  ctx.fillText(state.tagline, W / 2, state.logo ? 169 : 112);
  ctx.strokeStyle = rgba(template.accent, .75);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(100, 150);
  ctx.lineTo(980, 150);
  ctx.stroke();

  drawProduct(80, 220, 520, 900, { glow: template.accent });
  drawProductName(810, 255, 420, template, { color: template.accent, size: 53, minSize: 28, lineHeight: 58, maxLines: 4, align: "center" });
  drawHeadline(810, 500, 400, template, { color: "#ffffff", size: 40, lineHeight: 48, maxLines: 2, align: "center" });
  drawFeatureList(625, 620, 350, template, { max: 3, color: "#fff7dd", iconBg: rgba(template.accent, .15), lineHeight: 58, size: 23 });
  drawPriceCard(625, 820, 350, 200, template, { background: "#091a11", color: template.accent, border: template.accent, priceSize: 76, strike: "#f04a4a" });
  drawCta(610, 1060, 390, 86, template, { background: template.accent, color: template.dark });
  drawContactFooter(template);
}

function drawBlackGoldLayout(template) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (state.logo) drawLogo(W / 2, 55, 78);
  fitFont(ctx, state.shopName, 940, 49, 27, 900);
  ctx.fillStyle = template.accent;
  ctx.fillText(state.shopName, W / 2, state.logo ? 119 : 58);
  fitFont(ctx, state.tagline, 820, 22, 15, 600);
  ctx.fillStyle = "#fff6d8";
  ctx.fillText(state.tagline, W / 2, state.logo ? 158 : 105);

  ctx.strokeStyle = rgba(template.accent, .72);
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(W / 2, 665, 360, 0, Math.PI * 2);
  ctx.stroke();
  drawProduct(300, 230, 480, 830, { glow: template.accent });
  drawFeatureList(45, 410, 250, template, { max: 4, color: "#fff6da", iconBg: rgba(template.accent, .15), size: 20, lineHeight: 96 });
  drawProductName(902, 275, 275, template, { color: template.accent, size: 38, minSize: 24, lineHeight: 45, maxLines: 5, align: "center" });
  drawPriceCard(760, 630, 280, 225, template, { background: "#0c0b08", color: template.accent, border: template.accent, priceSize: 70 });
  drawDiscountBadge(900, 915, 190, template, { background: template.accent, color: template.dark });
  drawCta(300, 1090, 480, 86, template, { background: template.accent, color: template.dark });
  drawContactFooter(template);
}

function drawBlocksLayout(template) {
  fillRound(ctx, 18, 18, 590, 140, 18, template.accent);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  fitFont(ctx, state.shopName, 545, 50, 28, 900);
  ctx.fillStyle = "#fff";
  ctx.fillText(state.shopName, 42, 68);
  fitFont(ctx, state.tagline, 545, 21, 14, 700);
  ctx.fillStyle = "#161616";
  ctx.fillText(state.tagline, 42, 120);
  if (state.logo) {
    fillRound(ctx, 625, 20, 430, 138, 20, "#ffffff");
    drawLogo(840, 88, 105);
  }

  const blockX = 18;
  const blockW = 590;
  fillRound(ctx, blockX, 175, blockW, 105, 16, template.price);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  fitFont(ctx, state.headline, blockW - 35, 47, 25, 900);
  ctx.fillStyle = "#101010";
  ctx.fillText(state.headline, blockX + blockW / 2, 228);

  fillRound(ctx, blockX, 295, blockW, 162, 16, "#181818");
  drawProductName(blockX + blockW / 2, 320, blockW - 50, template, { color: "#fff", size: 40, minSize: 24, lineHeight: 46, maxLines: 3, align: "center" });
  fillRound(ctx, blockX, 472, blockW, 205, 16, template.accent);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  fitFont(ctx, state.discount, blockW - 40, 108, 48, 900);
  ctx.fillText(state.discount, blockX + blockW / 2, 575);
  drawPriceCard(blockX, 692, blockW, 220, template, { background: template.price, priceSize: 84, radius: 16 });
  drawCta(blockX, 930, blockW, 98, template, { background: "#171717", size: 42 });
  drawFeatureList(42, 1050, 540, template, { max: 2, lineHeight: 54, size: 22 });

  fillRound(ctx, 625, 175, 430, 985, 18, "#fff");
  strokeRound(ctx, 625, 175, 430, 985, 18, template.price, 4);
  drawProduct(645, 205, 390, 925, { glow: template.accent, placeholderDark: "#222" });
  drawContactFooter(template, false);
}

function drawPinkLayout(template) {
  drawShopHeader(template, { background: "rgba(255,250,248,.9)", color: template.dark, border: rgba(template.accent, .4) });
  drawHeadline(55, 205, 515, template, { size: 55, lineHeight: 62, maxLines: 2, color: "#5b1a2c" });
  drawProduct(20, 340, 500, 800, { glow: template.price });
  const hasModel = drawModel(555, 185, 500, 720, "soft");
  if (!hasModel) {
    drawProductName(560, 255, 455, template, { size: 50, lineHeight: 55, maxLines: 4 });
    drawFeatureList(580, 520, 400, template, { max: 3, lineHeight: 68, size: 27 });
  } else {
    const fade = ctx.createLinearGradient(0, 715, 0, 910);
    fade.addColorStop(0, "rgba(255,230,229,0)");
    fade.addColorStop(1, "rgba(255,230,229,.95)");
    ctx.fillStyle = fade;
    ctx.fillRect(550, 690, 510, 230);
  }
  drawDiscountBadge(535, 875, 175, template, { background: template.price, color: template.dark });
  drawPriceCard(570, 900, 440, 160, template, { background: template.accent, color: "#fff", priceSize: 62, strike: "#fff" });
  drawCta(560, 1085, 470, 88, template, { background: "#bd1748" });
  drawContactFooter(template, false);
}

function drawGridLayout(template) {
  drawShopHeader(template, { x: 18, y: 18, width: W - 36, height: 150, background: "#fff", border: template.accent });
  fillRound(ctx, 18, 188, 560, 1008, 28, "rgba(255,255,255,.94)");
  drawProduct(38, 220, 520, 930, { glow: template.accent });
  fillRound(ctx, 598, 188, 464, 270, 28, "#fff9ce");
  drawProductName(630, 225, 400, template, { size: 49, minSize: 27, lineHeight: 55, maxLines: 4 });
  fillRound(ctx, 598, 478, 464, 145, 28, template.accent);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  fitFont(ctx, state.headline, 410, 40, 23, 900);
  ctx.fillStyle = "#fff";
  ctx.fillText(state.headline, 830, 550);
  drawPriceCard(598, 643, 464, 260, template, { background: "#fff", border: template.price, priceSize: 88 });
  drawDiscountBadge(965, 660, 145, template, { background: template.price });
  drawCta(598, 925, 464, 105, template, { background: template.accent, size: 40 });
  drawFeatureList(620, 1055, 410, template, { max: 2, lineHeight: 55, size: 22 });
  drawContactFooter(template, false);
}

function drawNeonLayout(template) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (state.logo) drawLogo(W / 2, 55, 78);
  fitFont(ctx, state.shopName, 930, 52, 29, 900);
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "#794cff";
  ctx.shadowBlur = 18;
  ctx.fillText(state.shopName, W / 2, state.logo ? 120 : 62);
  ctx.shadowBlur = 0;
  drawCategoryPill(345, state.logo ? 157 : 105, 390, template, { background: rgba("#ffffff", .12), color: "#fff", height: 48 });

  drawProduct(300, 225, 480, 810, { glow: "#61beff" });
  fillRound(ctx, 35, 420, 275, 420, 28, "rgba(92,75,255,.22)");
  strokeRound(ctx, 35, 420, 275, 420, 28, rgba("#71c6ff", .55), 3);
  drawFeatureList(58, 465, 225, template, { max: 4, color: "#fff", iconBg: rgba("#ffe72c", .12), size: 20, lineHeight: 82 });

  fillRound(ctx, 780, 360, 270, 190, 28, "rgba(82,57,240,.3)");
  strokeRound(ctx, 780, 360, 270, 190, 28, rgba("#71c6ff", .6), 3);
  ctx.fillStyle = template.price;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  fitFont(ctx, state.discount, 230, 58, 30, 900);
  ctx.fillText(state.discount, 915, 455);
  drawPriceCard(780, 575, 270, 220, template, { background: "rgba(39,24,152,.42)", color: "#fff", border: rgba("#71c6ff", .6), priceSize: 72, strike: "#ff496d" });
  drawProductName(912, 835, 255, template, { color: "#fff", size: 34, minSize: 21, lineHeight: 40, maxLines: 4, align: "center" });
  drawCta(260, 1080, 560, 96, template, { background: template.price, color: "#12103b", size: 36 });
  drawContactFooter(template);
}

function drawFestiveLayout(template) {
  fillRound(ctx, 170, 28, 740, 150, 38, rgba("#3d0027", .8));
  strokeRound(ctx, 170, 28, 740, 150, 38, template.accent, 4);
  if (state.logo) drawLogo(245, 103, 92);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const center = state.logo ? 600 : W / 2;
  fitFont(ctx, state.shopName, state.logo ? 550 : 670, 50, 27, 900);
  ctx.fillStyle = template.accent;
  ctx.fillText(state.shopName, center, 82);
  fitFont(ctx, state.tagline, state.logo ? 550 : 670, 21, 14, 600);
  ctx.fillStyle = "#fff2c7";
  ctx.fillText(state.tagline, center, 133);

  fillRound(ctx, 210, 195, 660, 155, 12, template.accent);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  fitFont(ctx, state.headline, 610, 60, 32, 900);
  ctx.fillStyle = "#6e0648";
  ctx.fillText(state.headline, W / 2, 270);
  drawProductName(W / 2, 370, 660, template, { color: "#fff9d8", size: 38, minSize: 25, lineHeight: 45, maxLines: 2, align: "center" });
  drawProduct(325, 430, 430, 690, { glow: template.accent });
  drawFeatureList(60, 540, 260, template, { max: 4, color: "#fff8d8", iconBg: rgba(template.accent, .16), lineHeight: 85, size: 22 });
  drawPriceCard(770, 565, 270, 245, template, { background: template.accent, color: "#6b0646", priceSize: 74, strike: "#b41435" });
  drawDiscountBadge(900, 905, 190, template, { background: "#fff0a9", color: "#7a064f" });
  drawCta(755, 1010, 300, 86, template, { background: "#c41462", border: template.accent, size: 31 });
  drawContactFooter(template);
}

function renderPoster() {
  const template = getTemplate();
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  drawGeneratedBackground(template);
  const renderers = {
    natural: drawNaturalLayout,
    flash: drawFlashLayout,
    citrus: drawCitrusLayout,
    "model-split": drawModelSplitLayout,
    hero: drawHeroLayout,
    emerald: drawEmeraldLayout,
    "black-gold": drawBlackGoldLayout,
    blocks: drawBlocksLayout,
    pink: drawPinkLayout,
    grid: drawGridLayout,
    neon: drawNeonLayout,
    festive: drawFestiveLayout
  };
  (renderers[template.layout] || drawNaturalLayout)(template);
  ctx.restore();
  if (document.getElementById("gsPosterModal").classList.contains("open")) {
    modalCtx.clearRect(0, 0, W, H);
    modalCtx.drawImage(canvas, 0, 0);
  }
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function stripHtml(value) {
  const holder = document.createElement("div");
  holder.innerHTML = String(value || "");
  return holder.textContent.trim();
}

function showToast(message) {
  const toast = document.getElementById("gsToast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

function templateLookMarkup(template) {
  return `<span class="gs-template-look look-${template.look}" style="--look-bg:${template.base};--look-accent:${template.accent};--look-price:${template.price}" aria-hidden="true"><i></i><b></b></span>`;
}

function renderTemplatePicker() {
  const selected = getTemplate();
  document.getElementById("gsSelectedTemplateLook").innerHTML = templateLookMarkup(selected);
  document.getElementById("gsSelectedTemplateName").textContent = `Template ${String(selected.id).padStart(2, "0")} — ${selected.name}`;
  document.getElementById("gsSelectedTemplateNote").textContent = selected.note;
  const menu = document.getElementById("gsTemplateMenu");
  menu.innerHTML = templates.map((template) => `
    <button class="template-option gs-template-option ${template.id === selected.id ? "active" : ""}" type="button" role="option" aria-selected="${template.id === selected.id}" data-gs-template="${template.id}">
      ${templateLookMarkup(template)}
      <span class="template-option-copy"><strong>${String(template.id).padStart(2, "0")} — ${escapeHtml(template.name)}</strong><small>${escapeHtml(template.note)}</small></span>
      <span class="gs-template-badge">PRO</span>
    </button>
  `).join("");
  menu.querySelectorAll("[data-gs-template]").forEach((button) => {
    button.addEventListener("click", () => selectTemplate(Number(button.dataset.gsTemplate)));
  });
}

function updateBackgroundPicker() {
  document.querySelectorAll("[data-gs-bg]").forEach((button) => {
    button.classList.toggle("active", button.dataset.gsBg === state.bgStyle);
    button.setAttribute("aria-pressed", String(button.dataset.gsBg === state.bgStyle));
  });
}

function selectTemplate(id) {
  const template = templates.find((candidate) => candidate.id === id);
  if (!template) return;
  state.templateId = id;
  state.bgStyle = template.bg;
  state.bgSeed += 1;
  renderTemplatePicker();
  updateBackgroundPicker();
  document.getElementById("gsTemplateSelect").classList.remove("open");
  document.getElementById("gsTemplateSelectButton").setAttribute("aria-expanded", "false");
  renderPoster();
  showToast(`Template ${String(id).padStart(2, "0")} — ${template.name} ਲੱਗ ਗਿਆ।`);
}

function updateFormFields() {
  document.querySelectorAll("[data-gs-key]").forEach((field) => {
    field.value = state[field.dataset.gsKey] ?? "";
  });
  const controls = [
    ["gsLogoScale", state.logoScale, "gsLogoScaleValue", "%", 100],
    ["gsProductScale", state.productScale, "gsProductScaleValue", "%", 100],
    ["gsProductX", state.productX, "gsProductXValue", "", 1],
    ["gsProductY", state.productY, "gsProductYValue", "", 1],
    ["gsModelScale", state.modelScale, "gsModelScaleValue", "%", 100]
  ];
  controls.forEach(([inputId, value, outputId, suffix, multiplier]) => {
    const input = document.getElementById(inputId);
    const output = document.getElementById(outputId);
    const shown = Math.round(Number(value || 0) * multiplier);
    input.value = String(shown);
    output.textContent = `${shown}${suffix}`;
  });
  updatePhotoCards();
  updateBackgroundPicker();
  renderTemplatePicker();
  updateSelectedCredit();
}

function updatePhotoCard(cardId, image, emptyTitle, filledTitle) {
  const card = document.getElementById(cardId);
  const title = card.querySelector("strong");
  if (image?.src) {
    card.style.backgroundImage = `url("${image.src}")`;
    card.classList.add("has-image");
    title.textContent = filledTitle;
  } else {
    card.style.backgroundImage = "";
    card.classList.remove("has-image");
    title.textContent = emptyTitle;
  }
}

function updatePhotoCards() {
  updatePhotoCard("gsLogoCard", state.logo, "Logo Upload ਕਰੋ", "Logo ਬਦਲੋ");
  updatePhotoCard("gsProductCard", state.productImage, "Product Photo Upload", "Product Photo ਬਦਲੋ");
  updatePhotoCard("gsModelCard", state.modelImage, "ਕੁੜੀ / Model Photo", "Model Photo ਬਦਲੋ");
}

function updateSelectedCredit() {
  const holder = document.getElementById("gsSelectedCredit");
  if (!state.onlineCredit) {
    holder.innerHTML = "";
    return;
  }
  const link = state.onlineSourceUrl
    ? ` <a href="${escapeHtml(state.onlineSourceUrl)}" target="_blank" rel="noopener noreferrer">Source ਵੇਖੋ</a>`
    : "";
  holder.innerHTML = `Selected online image credit: ${escapeHtml(state.onlineCredit)}${link}`;
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith("image/")) {
      reject(new Error("Invalid image"));
      return;
    }
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image load failed"));
    image.src = url;
  });
}

function loadRemoteImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.referrerPolicy = "no-referrer";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Remote image blocked"));
    image.src = url;
  });
}

function detectDominantColor(image) {
  try {
    const sampler = document.createElement("canvas");
    sampler.width = 72;
    sampler.height = 72;
    const sampleCtx = sampler.getContext("2d", { willReadFrequently: true });
    sampleCtx.drawImage(image, 0, 0, 72, 72);
    const pixels = sampleCtx.getImageData(0, 0, 72, 72).data;
    let red = 0;
    let green = 0;
    let blue = 0;
    let count = 0;
    for (let index = 0; index < pixels.length; index += 16) {
      const alpha = pixels[index + 3];
      const r = pixels[index];
      const g = pixels[index + 1];
      const b = pixels[index + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (alpha < 150 || max > 242 || max < 24 || max - min < 18) continue;
      red += r;
      green += g;
      blue += b;
      count += 1;
    }
    if (count > 5) state.productColor = rgbToHex(red / count, green / count, blue / count);
  } catch (error) {
    // Cross-origin sources can reject pixel sampling. The template palette remains the safe fallback.
  }
}

async function handleLocalUpload(inputId, stateKey, successMessage) {
  const input = document.getElementById(inputId);
  const file = input.files?.[0];
  if (!file) return;
  try {
    const image = await loadImageFromFile(file);
    state[stateKey] = image;
    if (stateKey === "productImage") {
      state.onlineCredit = "";
      state.onlineSourceUrl = "";
      detectDominantColor(image);
    }
    updatePhotoCards();
    updateSelectedCredit();
    renderPoster();
    showToast(successMessage);
  } catch (error) {
    showToast("ਇਹ photo ਨਹੀਂ ਖੁੱਲ੍ਹੀ—JPG ਜਾਂ PNG file ਚੁਣੋ।");
  }
}

function normalizeKey(value) {
  return String(value || "").toLowerCase().replace(/[\s_./-]+/g, "");
}

function smartFill() {
  const text = document.getElementById("gsSmartText").value.trim();
  if (!text) {
    showToast("ਪਹਿਲਾਂ client ਦੀ details paste ਕਰੋ।");
    return;
  }

  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const aliases = {
    shopName: ["shopname", "businessname", "storename", "ਦੁਕਾਨਦਾਨਾਮ", "ਸ਼ਾਪਦਾਨਾਮ", "ਸ਼ਾਪਦਾਨਾਮ"],
    tagline: ["tagline", "dealsin", "shopdeals", "ਕੰਮ", "ਕੀਮਿਲਦਾਹੈ"],
    productName: ["product", "productname", "item", "itemname", "ਸਮਾਨ", "ਪ੍ਰੋਡਕਟ"],
    category: ["category", "ਸ਼੍ਰੇਣੀ", "ਸ਼੍ਰੇਣੀ"],
    headline: ["headline", "title", "offerheadline", "ਸਿਰਲੇਖ"],
    regularPrice: ["mrp", "regularprice", "oldprice", "ਅਸਲਕੀਮਤ"],
    salePrice: ["saleprice", "offerprice", "price", "now", "ਕੀਮਤ"],
    discount: ["discount", "off", "ਬਚਤ", "ਛੂਟ"],
    offerText: ["offer", "offertext", "offerline", "ਆਫਰ"],
    features: ["features", "benefits", "whatweoffer", "ਫਾਇਦੇ", "ਖਾਸੀਅਤਾਂ"],
    cta: ["cta", "button", "calltoaction"],
    address: ["address", "location", "ਪਤਾ", "ਸਥਾਨ"],
    phone: ["phone", "mobile", "contact", "whatsapp", "ਫੋਨ", "ਮੋਬਾਇਲ"],
    email: ["email", "mail", "ਈਮੇਲ"],
    instagram: ["instagram", "insta", "instagramid", "ਇੰਸਟਾਗ੍ਰਾਮ"]
  };
  let found = 0;
  let collectingFeatures = false;
  const featureLines = [];
  const parsedFields = new Set();

  lines.forEach((line) => {
    const labelled = line.match(/^([^:：]{1,35})\s*[:：]\s*(.+)$/);
    if (labelled) {
      const key = normalizeKey(labelled[1]);
      const value = labelled[2].trim();
      const field = Object.entries(aliases).find(([, names]) => names.includes(key))?.[0];
      if (field) {
        if (field === "features") {
          featureLines.push(...value.split(/,|•|;/).map((item) => item.trim()).filter(Boolean));
          collectingFeatures = true;
        } else {
          state[field] = value;
          collectingFeatures = false;
        }
        parsedFields.add(field);
        found += 1;
        return;
      }
    }
    if (collectingFeatures && /^[-•✓✔]/.test(line)) {
      featureLines.push(line.replace(/^[-•✓✔]\s*/, ""));
    } else {
      collectingFeatures = false;
    }
  });

  if (featureLines.length) state.features = featureLines.join("\n");

  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (email && !parsedFields.has("email")) {
    state.email = email[0];
    found += 1;
  }
  const phone = text.match(/(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/);
  if (phone && !parsedFields.has("phone")) {
    state.phone = phone[0];
    found += 1;
  }
  const insta = text.match(/@[A-Za-z0-9._]{3,}/);
  if (insta && !lines.some((line) => /(?:email|mail)/i.test(line) && line.includes(insta[0]))) {
    state.instagram = insta[0];
    found += 1;
  }
  const rupeePrices = [...text.matchAll(/₹\s?[\d,]+/g)].map((match) => match[0]);
  if (rupeePrices.length >= 2 && !parsedFields.has("regularPrice") && !parsedFields.has("salePrice")) {
    state.regularPrice = rupeePrices[0];
    state.salePrice = rupeePrices[1];
    found += 2;
  }
  const discount = text.match(/\b\d{1,2}%\s*(?:OFF|off|ਛੂਟ)?/);
  if (discount && !lines.some((line) => /(?:discount|off|ਛੂਟ)/i.test(line))) {
    state.discount = discount[0].toUpperCase();
    found += 1;
  }
  if (!found && lines.length) {
    state.shopName = lines[0].slice(0, 70);
    if (lines[1]) state.productName = lines[1].slice(0, 100);
  }

  updateFormFields();
  renderPoster();
  showToast(found ? `${found} details fields ਵਿੱਚ ਭਰ ਗਈਆਂ—ਇੱਕ ਵਾਰ check ਕਰ ਲਵੋ।` : "Message ਜੋੜਿਆ ਗਿਆ—fields ਨੂੰ check ਕਰਕੇ edit ਕਰੋ।");
}

function buildSearchParams(query, continuation = null) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    generator: "search",
    gsrsearch: `${query} filetype:bitmap`,
    gsrnamespace: "6",
    gsrlimit: "12",
    prop: "imageinfo",
    iiprop: "url|mime|extmetadata",
    iiurlwidth: "500"
  });
  if (continuation) {
    Object.entries(continuation).forEach(([key, value]) => params.set(key, String(value)));
  }
  return params;
}

async function searchOnlineImages(loadMore = false) {
  const queryInput = document.getElementById("gsImageQuery");
  const kind = document.getElementById("gsSearchKind").value;
  const query = queryInput.value.trim() || (kind === "product" ? state.productName : "beauty model portrait");
  if (!query) {
    showToast("Search ਲਈ product ਜਾਂ photo ਦਾ ਨਾਮ ਲਿਖੋ।");
    return;
  }

  if (!loadMore || query !== lastSearch.query || kind !== lastSearch.kind) {
    searchContinue = null;
    document.getElementById("gsSearchResults").innerHTML = "";
  }
  lastSearch = { query, kind };
  const status = document.getElementById("gsSearchStatus");
  const button = document.getElementById("gsImageSearchButton");
  status.textContent = "Online photos ਲੱਭ ਰਹੇ ਹਾਂ…";
  button.disabled = true;
  try {
    const params = buildSearchParams(query, loadMore ? searchContinue : null);
    const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params.toString()}`);
    if (!response.ok) throw new Error("Search failed");
    const data = await response.json();
    const results = Object.values(data.query?.pages || {})
      .map((page) => {
        const info = page.imageinfo?.[0];
        if (!info?.thumburl || !/^image\/(?:png|jpeg|webp)$/i.test(info.mime || "")) return null;
        const metadata = info.extmetadata || {};
        return {
          title: String(page.title || "Online image").replace(/^File:/, ""),
          thumb: info.thumburl,
          url: info.thumburl,
          source: info.descriptionurl || info.url,
          mime: info.mime,
          artist: stripHtml(metadata.Artist?.value || metadata.Credit?.value || "Wikimedia contributor"),
          license: stripHtml(metadata.LicenseShortName?.value || metadata.UsageTerms?.value || "Wikimedia Commons")
        };
      })
      .filter(Boolean)
      .sort((a, b) => Number(b.mime === "image/png") - Number(a.mime === "image/png"));

    renderSearchResults(results, loadMore);
    searchContinue = data.continue || null;
    const moreButton = document.getElementById("gsMoreResults");
    moreButton.classList.toggle("is-hidden", !searchContinue);
    status.textContent = results.length
      ? `${results.length} reusable photos ਮਿਲੀਆਂ—ਕੋਈ photo select ਕਰੋ।`
      : "ਇਸ ਨਾਮ ਨਾਲ usable photo ਨਹੀਂ ਮਿਲੀ। Manual upload ਸਭ ਤੋਂ reliable ਹੈ।";
  } catch (error) {
    status.textContent = "Online search ਇਸ ਵੇਲੇ ਨਹੀਂ ਚੱਲੀ। ਆਪਣੀ photo upload ਕਰੋ ਜਾਂ ਦੁਬਾਰਾ try ਕਰੋ।";
  } finally {
    button.disabled = false;
  }
}

function renderSearchResults(results, append = false) {
  const holder = document.getElementById("gsSearchResults");
  if (!append) holder.innerHTML = "";
  results.forEach((result) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "gs-search-result";
    button.title = `${result.title} — ${result.license}`;
    const image = document.createElement("img");
    image.src = result.thumb;
    image.alt = result.title;
    image.loading = "lazy";
    image.referrerPolicy = "no-referrer";
    const title = document.createElement("span");
    title.textContent = result.title;
    button.append(image, title);
    if (result.mime === "image/png") {
      const badge = document.createElement("span");
      badge.className = "gs-format-badge";
      badge.textContent = "PNG";
      button.appendChild(badge);
    }
    button.addEventListener("click", () => selectOnlineImage(result, button));
    holder.appendChild(button);
  });
}

async function selectOnlineImage(result, button) {
  const status = document.getElementById("gsSearchStatus");
  const kind = document.getElementById("gsSearchKind").value;
  status.textContent = "Photo poster ਵਿੱਚ ਲਗਾ ਰਹੇ ਹਾਂ…";
  button.disabled = true;
  try {
    const image = await loadRemoteImage(result.url);
    if (kind === "model") {
      state.modelImage = image;
      showToast("Online model photo poster ਵਿੱਚ ਲੱਗ ਗਈ।");
    } else {
      state.productImage = image;
      detectDominantColor(image);
      showToast("Online product photo poster ਵਿੱਚ ਲੱਗ ਗਈ।");
    }
    state.onlineCredit = `${result.artist || "Wikimedia contributor"} / ${result.license}`;
    state.onlineSourceUrl = result.source;
    updatePhotoCards();
    updateSelectedCredit();
    renderPoster();
    status.textContent = "Photo select ਹੋ ਗਈ। Download ਤੋਂ ਪਹਿਲਾਂ design check ਕਰੋ।";
  } catch (error) {
    status.textContent = "ਇਹ online photo browser ਨੇ block ਕਰ ਦਿੱਤੀ। ਇਸਨੂੰ download ਕਰਕੇ Manual Upload ਕਰੋ।";
  } finally {
    button.disabled = false;
  }
}

function safeFilename() {
  const shop = String(state.shopName || "General-Sale")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 45);
  const product = String(state.productName || "Poster")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 35);
  return `${shop || "General-Sale"}-${product || "Poster"}.png`;
}

function downloadPoster() {
  renderPoster();
  try {
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
      showToast("General Sale poster PNG download ਹੋ ਗਿਆ।");
    }, "image/png");
  } catch (error) {
    showToast("Online photo ਕਾਰਨ download block ਹੋਇਆ। Photo save ਕਰਕੇ Manual Upload ਕਰੋ।");
  }
}

function resetApp() {
  state = cloneDefaults();
  searchContinue = null;
  document.getElementById("gsSmartText").value = "";
  document.getElementById("gsImageQuery").value = "";
  document.getElementById("gsSearchResults").innerHTML = "";
  document.getElementById("gsSearchStatus").textContent = "";
  document.getElementById("gsMoreResults").classList.add("is-hidden");
  ["gsLogoInput", "gsProductInput", "gsModelInput", "gsBackgroundInput"].forEach((id) => {
    document.getElementById(id).value = "";
  });
  updateFormFields();
  renderPoster();
  showToast("ਨਵਾਂ General Sale sample poster ਤਿਆਰ ਹੈ।");
}

function bindEvents() {
  document.querySelectorAll("[data-gs-key]").forEach((field) => {
    field.addEventListener("input", (event) => {
      state[event.target.dataset.gsKey] = event.target.value;
      renderPoster();
    });
  });

  const templateSelect = document.getElementById("gsTemplateSelect");
  const templateButton = document.getElementById("gsTemplateSelectButton");
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

  document.getElementById("gsSmartFillButton").addEventListener("click", smartFill);
  document.getElementById("gsLogoInput").addEventListener("change", () => handleLocalUpload("gsLogoInput", "logo", "Shop logo ਲੱਗ ਗਿਆ।"));
  document.getElementById("gsProductInput").addEventListener("change", () => handleLocalUpload("gsProductInput", "productImage", "Product photo ਲੱਗ ਗਈ।"));
  document.getElementById("gsModelInput").addEventListener("change", () => handleLocalUpload("gsModelInput", "modelImage", "Model photo ਲੱਗ ਗਈ।"));
  document.getElementById("gsBackgroundInput").addEventListener("change", () => handleLocalUpload("gsBackgroundInput", "customBackground", "ਆਪਣਾ background ਲੱਗ ਗਿਆ।"));

  const rangeControls = [
    ["gsLogoScale", "logoScale", "gsLogoScaleValue", "%", .01],
    ["gsProductScale", "productScale", "gsProductScaleValue", "%", .01],
    ["gsProductX", "productX", "gsProductXValue", "", 1],
    ["gsProductY", "productY", "gsProductYValue", "", 1],
    ["gsModelScale", "modelScale", "gsModelScaleValue", "%", .01]
  ];
  rangeControls.forEach(([inputId, key, outputId, suffix, factor]) => {
    document.getElementById(inputId).addEventListener("input", (event) => {
      state[key] = Number(event.target.value) * factor;
      document.getElementById(outputId).textContent = `${event.target.value}${suffix}`;
      renderPoster();
    });
  });

  document.getElementById("gsRemoveProduct").addEventListener("click", () => {
    state.productImage = null;
    state.onlineCredit = "";
    state.onlineSourceUrl = "";
    updatePhotoCards();
    updateSelectedCredit();
    renderPoster();
    showToast("Product photo ਹਟਾ ਦਿੱਤੀ।");
  });
  document.getElementById("gsRemoveModel").addEventListener("click", () => {
    state.modelImage = null;
    updatePhotoCards();
    renderPoster();
    showToast("Model photo ਹਟਾ ਦਿੱਤੀ।");
  });

  document.querySelectorAll("[data-gs-bg]").forEach((button) => {
    button.addEventListener("click", () => {
      state.bgStyle = button.dataset.gsBg;
      state.customBackground = null;
      state.bgSeed += 1;
      updateBackgroundPicker();
      renderPoster();
    });
  });
  document.getElementById("gsRegenerateBackground").addEventListener("click", () => {
    state.customBackground = null;
    state.bgSeed += 1;
    renderPoster();
    showToast("ਨਵੀਂ background variation ਬਣ ਗਈ।");
  });
  document.getElementById("gsRemoveBackground").addEventListener("click", () => {
    state.customBackground = null;
    document.getElementById("gsBackgroundInput").value = "";
    renderPoster();
    showToast("Uploaded background ਹਟਾ ਦਿੱਤਾ।");
  });

  document.getElementById("gsImageSearchButton").addEventListener("click", () => searchOnlineImages(false));
  document.getElementById("gsMoreResults").addEventListener("click", () => searchOnlineImages(true));
  document.getElementById("gsImageQuery").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      searchOnlineImages(false);
    }
  });
  document.getElementById("gsSearchKind").addEventListener("change", (event) => {
    document.getElementById("gsImageQuery").placeholder = event.target.value === "model"
      ? "ਜਿਵੇਂ beauty model portrait"
      : "Product name, ਜਿਵੇਂ face wash";
  });

  document.getElementById("gsDownloadButton").addEventListener("click", downloadPoster);
  document.getElementById("gsResetButton").addEventListener("click", resetApp);

  const modal = document.getElementById("gsPosterModal");
  const closeModal = () => {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };
  document.getElementById("gsZoomButton").addEventListener("click", () => {
    modalCtx.clearRect(0, 0, W, H);
    modalCtx.drawImage(canvas, 0, 0);
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  });
  document.getElementById("gsModalClose").addEventListener("click", closeModal);
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

updateFormFields();
bindEvents();
renderPoster();

if (document.fonts?.ready) {
  document.fonts.ready.then(renderPoster);
}
