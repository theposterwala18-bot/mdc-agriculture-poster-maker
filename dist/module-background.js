const COMMONS_API = "https://commons.wikimedia.org/w/api.php";

function loadFileImage(file) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith("image/")) return reject(new Error("invalid image"));
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image load failed")); };
    image.src = url;
  });
}

function loadRemoteImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.referrerPolicy = "no-referrer";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("remote image blocked"));
    image.src = url;
  });
}

function stripHtml(value) {
  const holder = document.createElement("div");
  holder.innerHTML = String(value || "");
  return holder.textContent.trim();
}

function drawCover(context, image, width, height) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const dw = image.naturalWidth * scale;
  const dh = image.naturalHeight * scale;
  context.drawImage(image, (width - dw) / 2, (height - dh) / 2, dw, dh);
}

function seeded(seed) {
  let value = (Number(seed) || 1) * 9301 + 49297;
  return () => ((value = (value * 9301 + 49297) % 233280) / 233280);
}

function drawGeneratedBackground(context, width, height, style, seed, palette) {
  const colors = {
    natural: ["#dcebdd", "#fffaf0", "#91b69a"],
    clean: ["#ffffff", "#eef3f6", "#cad7df"],
    luxury: ["#17130f", "#4c3825", "#d5aa55"],
    bold: ["#7d1017", "#f4a62a", "#fff0bb"],
    neon: ["#16113a", "#6439c9", "#26d8c8"],
    festive: ["#fff1c7", "#dc4d39", "#e1b94f"]
  };
  const chosen = style === "auto"
    ? [palette?.soft || "#eef6f1", palette?.accent || "#0c5a41", palette?.gold || "#d5aa55"]
    : (colors[style] || colors.clean);
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, chosen[0]); gradient.addColorStop(.55, chosen[1]); gradient.addColorStop(1, chosen[2]);
  context.fillStyle = gradient; context.fillRect(0, 0, width, height);
  const random = seeded(seed);
  for (let i = 0; i < 9; i += 1) {
    const x = random() * width, y = random() * height, radius = (120 + random() * 280) * (width / 1080);
    const glow = context.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, `${chosen[i % chosen.length]}aa`); glow.addColorStop(1, `${chosen[i % chosen.length]}00`);
    context.fillStyle = glow; context.fillRect(0, 0, width, height);
  }
}

function sectionMarkup(prefix, targets) {
  return `<details class="module-media-tools">
    <summary><span class="section-number">✦</span>Automatic Background ਅਤੇ Online Photo Search</summary>
    <div class="details-body">
      <p class="helper-text">Original design safe ਰਹੇਗਾ। ਕੋਈ style ਚੁਣਕੇ background variation ਬਣਾਓ, ਜਾਂ ਆਪਣਾ background upload ਕਰੋ।</p>
      <div class="module-background-picker" role="radiogroup" aria-label="Background style">
        ${[["original","Original"],["auto","Auto Match"],["natural","Natural"],["clean","Clean Studio"],["luxury","Luxury"],["bold","Bold"],["neon","Neon"],["festive","Festive"]].map(([value,label])=>`<button class="module-bg-chip${value === "original" ? " active" : ""}" data-module-bg="${value}" type="button">${label}</button>`).join("")}
      </div>
      <div class="module-background-actions">
        <button class="primary-button" id="${prefix}RegenerateBackground" type="button">↻ Background Regenerate</button>
        <label class="secondary-button module-background-upload">ਆਪਣਾ Background Upload<input id="${prefix}BackgroundInput" type="file" accept="image/*"></label>
        <button class="secondary-button" id="${prefix}RemoveBackground" type="button">Background ਹਟਾਓ</button>
      </div>
      <div class="module-online-search">
        <div class="module-online-heading"><div><strong>Online Photo Search</strong><small>Wikimedia Commons ਦੇ reusable results</small></div><span class="module-online-badge">OPTIONAL</span></div>
        <div class="module-search-row">
          <select id="${prefix}SearchTarget" aria-label="Photo target">${targets.map(target=>`<option value="${target.value}">${target.label}</option>`).join("")}<option value="background">Poster Background</option></select>
          <input id="${prefix}SearchQuery" type="search" placeholder="Photo ਦਾ ਨਾਮ ਲਿਖੋ">
          <button class="primary-button" id="${prefix}SearchButton" type="button">Search</button>
        </div>
        <div class="module-search-status" id="${prefix}SearchStatus" role="status"></div>
        <div class="module-search-results" id="${prefix}SearchResults"></div>
        <button class="secondary-button full-width is-hidden" id="${prefix}MoreResults" type="button">ਹੋਰ Photos ਵੇਖੋ</button>
        <div class="module-selected-credit" id="${prefix}SelectedCredit"></div>
      </div>
    </div>
  </details>`;
}

export function createModuleBackgroundController(options) {
  const { prefix, insertAfter, targets = [], onChange, getDefaultQuery = () => "", getPalette = () => ({}) } = options;
  const state = { style: "original", seed: 1, customImage: null, credit: "", source: "", continuation: null, query: "", target: "" };
  const wrapper = document.createElement("div");
  wrapper.innerHTML = sectionMarkup(prefix, targets);
  const section = wrapper.firstElementChild;
  insertAfter.insertAdjacentElement("afterend", section);
  const byId = suffix => document.getElementById(prefix + suffix);

  function refreshPicker() {
    section.querySelectorAll("[data-module-bg]").forEach(button => {
      const active = button.dataset.moduleBg === state.style && !state.customImage;
      button.classList.toggle("active", active); button.setAttribute("aria-pressed", String(active));
    });
  }

  function resetResults() {
    byId("SearchResults").innerHTML = ""; byId("SearchStatus").textContent = "";
    byId("MoreResults").classList.add("is-hidden"); byId("SelectedCredit").textContent = "";
    state.continuation = null; state.credit = ""; state.source = "";
  }

  async function search(loadMore = false) {
    const query = byId("SearchQuery").value.trim() || String(getDefaultQuery() || "").trim();
    const target = byId("SearchTarget").value;
    if (!query) { byId("SearchStatus").textContent = "Search ਲਈ photo ਦਾ ਨਾਮ ਲਿਖੋ।"; return; }
    if (!loadMore || query !== state.query || target !== state.target) { state.continuation = null; byId("SearchResults").innerHTML = ""; }
    state.query = query; state.target = target;
    const params = new URLSearchParams({ action:"query", format:"json", origin:"*", generator:"search", gsrsearch:`${query} filetype:bitmap`, gsrnamespace:"6", gsrlimit:"12", prop:"imageinfo", iiprop:"url|mime|extmetadata", iiurlwidth:"700" });
    if (loadMore && state.continuation) Object.entries(state.continuation).forEach(([key,value]) => params.set(key, String(value)));
    byId("SearchStatus").textContent = "Online photos ਲੱਭ ਰਹੇ ਹਾਂ…"; byId("SearchButton").disabled = true;
    try {
      const response = await fetch(`${COMMONS_API}?${params}`); if (!response.ok) throw new Error("search failed");
      const data = await response.json();
      const results = Object.values(data.query?.pages || {}).map(page => {
        const info = page.imageinfo?.[0]; if (!info?.thumburl || !/^image\/(?:png|jpeg|webp)$/i.test(info.mime || "")) return null;
        const metadata = info.extmetadata || {};
        return { title:String(page.title || "Online image").replace(/^File:/,""), thumb:info.thumburl, url:info.thumburl, source:info.descriptionurl || info.url, mime:info.mime, credit:`${stripHtml(metadata.Artist?.value || metadata.Credit?.value || "Wikimedia contributor")} / ${stripHtml(metadata.LicenseShortName?.value || metadata.UsageTerms?.value || "Wikimedia Commons")}` };
      }).filter(Boolean).sort((a,b)=>Number(b.mime === "image/png")-Number(a.mime === "image/png"));
      renderResults(results, loadMore); state.continuation = data.continue || null;
      byId("MoreResults").classList.toggle("is-hidden", !state.continuation);
      byId("SearchStatus").textContent = results.length ? `${results.length} reusable photos ਮਿਲੀਆਂ—ਕੋਈ photo select ਕਰੋ।` : "Usable photo ਨਹੀਂ ਮਿਲੀ; ਆਪਣੀ photo upload ਕਰੋ।";
    } catch (_) { byId("SearchStatus").textContent = "Online search ਇਸ ਵੇਲੇ ਨਹੀਂ ਚੱਲੀ। Manual upload ਵਰਤੋ ਜਾਂ ਦੁਬਾਰਾ try ਕਰੋ।"; }
    finally { byId("SearchButton").disabled = false; }
  }

  function renderResults(results, append) {
    const holder = byId("SearchResults"); if (!append) holder.innerHTML = "";
    results.forEach(result => {
      const button = document.createElement("button"); button.type = "button"; button.className = "module-search-result"; button.title = result.title;
      const image = document.createElement("img"); image.src = result.thumb; image.alt = result.title; image.loading = "lazy"; image.referrerPolicy = "no-referrer";
      const label = document.createElement("span"); label.textContent = result.title; button.append(image,label);
      if (result.mime === "image/png") { const badge=document.createElement("span"); badge.className="module-format-badge"; badge.textContent="PNG"; button.append(badge); }
      button.addEventListener("click", async () => {
        button.disabled = true; byId("SearchStatus").textContent = "Photo poster ਵਿੱਚ ਲਗਾ ਰਹੇ ਹਾਂ…";
        try {
          const selected = await loadRemoteImage(result.url); const targetValue = byId("SearchTarget").value;
          if (targetValue === "background") { state.customImage = selected; state.style = "original"; refreshPicker(); }
          else { const target = targets.find(item => item.value === targetValue); await target?.setImage(selected); }
          state.credit = result.credit; state.source = result.source;
          byId("SelectedCredit").innerHTML = `Selected image: ${result.credit}${result.source ? ` — <a href="${result.source}" target="_blank" rel="noopener noreferrer">Source</a>` : ""}`;
          onChange(); byId("SearchStatus").textContent = "Photo select ਹੋ ਗਈ। Poster preview check ਕਰੋ।";
        } catch (_) { byId("SearchStatus").textContent = "ਇਹ photo browser ਨੇ block ਕਰ ਦਿੱਤੀ। ਕੋਈ ਹੋਰ result ਚੁਣੋ।"; }
        finally { button.disabled = false; }
      });
      holder.append(button);
    });
  }

  section.querySelectorAll("[data-module-bg]").forEach(button => button.addEventListener("click", () => {
    state.style = button.dataset.moduleBg; state.customImage = null; state.seed += 1; refreshPicker(); onChange();
  }));
  byId("RegenerateBackground").addEventListener("click", () => { if (state.style === "original") state.style = "auto"; state.customImage = null; state.seed += 1; refreshPicker(); onChange(); });
  byId("BackgroundInput").addEventListener("change", async event => {
    const file = event.target.files?.[0]; if (!file) return;
    try { state.customImage = await loadFileImage(file); state.style = "original"; refreshPicker(); onChange(); }
    catch (_) { byId("SearchStatus").textContent = "Background photo load ਨਹੀਂ ਹੋਈ।"; }
  });
  byId("RemoveBackground").addEventListener("click", () => { state.customImage = null; state.style = "original"; state.seed += 1; byId("BackgroundInput").value = ""; refreshPicker(); onChange(); });
  byId("SearchButton").addEventListener("click", () => search(false)); byId("MoreResults").addEventListener("click", () => search(true));
  byId("SearchQuery").addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); search(false); } });

  return {
    apply(context, width, height) {
      if (!state.customImage && state.style === "original") return;
      const snapshot = document.createElement("canvas"); snapshot.width = width; snapshot.height = height; snapshot.getContext("2d").drawImage(context.canvas, 0, 0);
      context.clearRect(0, 0, width, height);
      if (state.customImage?.naturalWidth) drawCover(context, state.customImage, width, height);
      else drawGeneratedBackground(context, width, height, state.style, state.seed, getPalette());
      context.save(); context.globalAlpha = state.customImage ? .88 : .94; context.drawImage(snapshot, 0, 0); context.restore();
    },
    reset() { state.style = "original"; state.customImage = null; state.seed += 1; byId("BackgroundInput").value = ""; byId("SearchQuery").value = ""; resetResults(); refreshPicker(); }
  };
}
