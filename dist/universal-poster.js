import { createPosterExportController } from "./poster-export.js";

const canvas = document.getElementById("universalCanvas");
const ctx = canvas.getContext("2d");
const modalCanvas = document.getElementById("universalModalCanvas");
const modalCtx = modalCanvas.getContext("2d");
const W = 1080;
const H = 1620;
const FONT = '"Noto Sans Gurmukhi", "Raavi", sans-serif';
let exportController;

function field(key, label, value, aliases = [], type = "text", wide = false) {
  return { key, label, value, aliases, type, wide };
}

const moduleConfigs = {
  "vehicle-sale": {
    name: "Car / Bike Sale Poster Maker", icon: "🚗", description: "Car ਜਾਂ bike ਦੀ sale ਲਈ professional advertisement ਬਣਾਓ।",
    palette: { dark: "#14213d", accent: "#d62828", soft: "#e8eef8", gold: "#f4b942", ink: "#172033" },
    photoLabels: ["Car / Bike ਦੀ ਮੁੱਖ Photo", "ਦੂਜੀ Angle Photo (Optional)"],
    fields: [
      field("heading", "Seller / Dealership ਦਾ ਨਾਮ", "DH 尺 AUTO DEALS", ["seller", "dealership", "shop", "ਵਿਕਰੇਤਾ"]),
      field("title", "Vehicle Model", "Toyota Urban Cruiser Taisor", ["vehicle", "model", "ਕਾਰ", "ਬਾਈਕ"]),
      field("subtitle", "Variant / Short Details", "2024 • Petrol • Manual • First Owner", ["variant", "shortdetails", "details"]),
      field("highlight", "Price", "₹8,75,000", ["price", "ਕੀਮਤ"]),
      field("body", "Features — ਹਰ line ਵੱਖਰਾ point", "Excellent condition\nInsurance valid\nCompany service record\nFinance available", ["features", "ਖਾਸੀਅਤਾਂ"], "textarea", true),
      field("date", "Model / Registration", "Model 2024", ["year", "registration", "modelyear"]),
      field("time", "Kilometres / Fuel", "18,500 KM • Petrol", ["km", "kilometres", "fuel"]),
      field("venue", "Location / Address", "Mansa, Punjab", ["location", "address", "ਪਤਾ", "ਸਥਾਨ"], "textarea", true),
      field("footer", "Contact Person", "ਬਲਜੀਤ ਸਿੰਘ", ["contactperson", "owner", "ਨਾਮ"]),
      field("contact", "Phone / WhatsApp", "98150 00000", ["phone", "mobile", "whatsapp", "ਫੋਨ", "ਮੋਬਾਇਲ"])
    ]
  },
  "animal-sale": {
    name: "Dog / Animal Sale Poster Maker", icon: "🐕", description: "Dog ਜਾਂ ਹੋਰ animal ਦੀ sale/adoption ਲਈ poster ਬਣਾਓ।",
    palette: { dark: "#24402f", accent: "#cc6b2c", soft: "#edf3e8", gold: "#e7b35a", ink: "#25352a" },
    photoLabels: ["Animal ਦੀ ਮੁੱਖ Photo", "ਦੂਜੀ Photo (Optional)"],
    fields: [
      field("heading", "Kennel / Owner Name", "ROYAL PET HOUSE", ["kennel", "owner", "seller"]),
      field("title", "Breed / Animal Name", "German Shepherd Puppies", ["breed", "animal", "dog", "ਨਸਲ"]),
      field("subtitle", "Age / Gender", "Age 45 Days • Male & Female", ["age", "gender", "ਉਮਰ"]),
      field("highlight", "Price / Offer", "Starting ₹18,000", ["price", "offer", "ਕੀਮਤ"]),
      field("body", "Details — ਹਰ line ਵੱਖਰਾ point", "Healthy active puppies\nVaccinated & dewormed\nPure breed parents\nHome delivery available", ["details", "features", "vaccination"], "textarea", true),
      field("date", "Available From", "Available Now", ["available", "date"]),
      field("time", "Vaccination Status", "First vaccination done", ["vaccine", "vaccination"]),
      field("venue", "Location", "Bhikhi, Mansa", ["location", "address", "ਸਥਾਨ"], "textarea", true),
      field("footer", "Owner / Breeder", "ਸੰਪਰਕ ਲਈ ਕਾਲ ਕਰੋ", ["breeder", "contactperson"]),
      field("contact", "Phone / WhatsApp", "98150 00000", ["phone", "mobile", "whatsapp", "ਮੋਬਾਇਲ"])
    ]
  },
  wedding: {
    name: "Wedding Invitation Poster Maker", icon: "💍", description: "ਵਿਆਹ ਅਤੇ related functions ਦਾ digital invitation ਬਣਾਓ।",
    palette: { dark: "#65283d", accent: "#bd6b79", soft: "#fff0f1", gold: "#d8ad59", ink: "#542437" },
    photoLabels: ["Couple / Bride-Groom Photo", "Family / Venue Photo (Optional)"],
    fields: [
      field("heading", "Family Name", "DH 尺LIWAL FAMILY", ["family", "ਪਰਿਵਾਰ"]),
      field("title", "Bride & Groom Names", "ਅਮਨਦੀਪ ♡ ਗੁਰਪ੍ਰੀਤ", ["couple", "bride", "groom", "names", "ਨਾਮ"]),
      field("subtitle", "Invitation Line", "ਤੁਹਾਨੂੰ ਵਿਆਹ ਸਮਾਗਮ ਵਿੱਚ ਸ਼ਾਮਲ ਹੋਣ ਲਈ ਸੱਦਾ ਦਿੰਦੇ ਹਾਂ", ["invitation", "invite", "ਸੱਦਾ"], "textarea", true),
      field("highlight", "Main Function", "ਸ਼ੁਭ ਵਿਆਹ", ["function", "event", "ਸਮਾਗਮ"]),
      field("body", "Functions / Program", "ਜਾਗੋ — ਸ਼ਾਮ 7:00 ਵਜੇ\nਆਨੰਦ ਕਾਰਜ — ਸਵੇਰੇ 10:00 ਵਜੇ\nReception — ਦੁਪਹਿਰ 1:00 ਵਜੇ", ["program", "functions", "ਪ੍ਰੋਗਰਾਮ"], "textarea", true),
      field("date", "Wedding Date", "25 ਨਵੰਬਰ 2026", ["date", "ਮਿਤੀ"]),
      field("time", "Main Time", "ਸਵੇਰੇ 10:00 ਵਜੇ", ["time", "ਸਮਾਂ"]),
      field("venue", "Venue", "Royal Palace, Mansa", ["venue", "location", "ਸਥਾਨ"], "textarea", true),
      field("footer", "Invited By", "ਸਮੂਹ ਢਿੱਲੋਂ ਪਰਿਵਾਰ", ["invitedby", "host"]),
      field("contact", "Contact", "98150 00000", ["phone", "mobile", "contact", "ਮੋਬਾਇਲ"])
    ]
  },
  path: {
    name: "Akhand Path / Sukhmani Sahib Poster Maker", icon: "🙏", description: "ਅਖੰਡ ਪਾਠ, ਸੁਖਮਨੀ ਸਾਹਿਬ ਅਤੇ ਧਾਰਮਿਕ ਸਮਾਗਮ ਦਾ ਸੱਦਾ ਬਣਾਓ।",
    palette: { dark: "#173f72", accent: "#ef8b21", soft: "#fff4df", gold: "#d7a43b", ink: "#17385f" },
    photoLabels: ["ਗੁਰੂ ਘਰ / ਧਾਰਮਿਕ Photo", "ਪਰਿਵਾਰ / ਸਥਾਨ Photo (Optional)"],
    fields: [
      field("heading", "ਪਰਿਵਾਰ / ਸੰਸਥਾ ਦਾ ਨਾਮ", "ਢਿੱਲੋਂ ਪਰਿਵਾਰ ਵੱਲੋਂ", ["family", "organization", "ਪਰਿਵਾਰ"]),
      field("title", "ਸਮਾਗਮ ਦਾ ਨਾਮ", "ਸ੍ਰੀ ਅਖੰਡ ਪਾਠ ਸਾਹਿਬ", ["event", "path", "ਸਮਾਗਮ"]),
      field("subtitle", "ਸੱਦਾ / ਮੌਕਾ", "ਵਾਹਿਗੁਰੂ ਜੀ ਦੀ ਅਪਾਰ ਕਿਰਪਾ ਸਦਕਾ ਆਪ ਜੀ ਨੂੰ ਨਿਮਰਤਾ ਸਹਿਤ ਸੱਦਾ ਦਿੱਤਾ ਜਾਂਦਾ ਹੈ।", ["invitation", "message", "ਸੱਦਾ"], "textarea", true),
      field("highlight", "ਮੁੱਖ Heading", "ਭੋਗ ਅਤੇ ਕੀਰਤਨ", ["heading", "main"]),
      field("body", "Program", "ਪਾਠ ਆਰੰਭ — ਸ਼ੁੱਕਰਵਾਰ ਸਵੇਰੇ 10 ਵਜੇ\nਭੋਗ — ਐਤਵਾਰ ਸਵੇਰੇ 10 ਵਜੇ\nਗੁਰੂ ਕਾ ਲੰਗਰ ਅਤੁੱਟ ਵਰਤੇਗਾ", ["program", "ਪ੍ਰੋਗਰਾਮ"], "textarea", true),
      field("date", "ਮਿਤੀ", "18 ਅਕਤੂਬਰ 2026", ["date", "ਮਿਤੀ"]),
      field("time", "ਸਮਾਂ", "ਸਵੇਰੇ 10:00 ਵਜੇ", ["time", "ਸਮਾਂ"]),
      field("venue", "ਸਥਾਨ", "ਗੁਰਦੁਆਰਾ ਸਾਹਿਬ, ਪਿੰਡ ਮੋਹਰ ਸਿੰਘ ਵਾਲਾ", ["venue", "location", "ਸਥਾਨ"], "textarea", true),
      field("footer", "ਬੇਨਤੀ ਕਰਤਾ", "ਸਮੂਹ ਪਰਿਵਾਰ ਅਤੇ ਰਿਸ਼ਤੇਦਾਰ", ["host", "ਬੇਨਤੀਕਰਤਾ"]),
      field("contact", "ਸੰਪਰਕ", "98150 00000", ["phone", "mobile", "contact", "ਮੋਬਾਇਲ"])
    ]
  },
  "general-invite": {
    name: "General Invitation Poster Maker", icon: "💌", description: "Opening, birthday, anniversary ਜਾਂ ਕਿਸੇ ਵੀ ਸਮਾਗਮ ਦਾ invitation ਬਣਾਓ।",
    palette: { dark: "#49356b", accent: "#df5f8f", soft: "#f7edff", gold: "#dfb65e", ink: "#3f3157" },
    photoLabels: ["ਮੁੱਖ Event Photo", "ਦੂਜੀ Photo (Optional)"],
    fields: [
      field("heading", "Host / Organization", "YOU ARE INVITED", ["host", "organization"]),
      field("title", "Event Name", "Grand Opening Celebration", ["event", "title", "ਸਮਾਗਮ"]),
      field("subtitle", "Invitation Message", "ਤੁਹਾਡੀ ਹਾਜ਼ਰੀ ਸਾਡੇ ਖਾਸ ਮੌਕੇ ਨੂੰ ਹੋਰ ਵੀ ਯਾਦਗਾਰ ਬਣਾਏਗੀ।", ["message", "invitation", "ਸੱਦਾ"], "textarea", true),
      field("highlight", "Special Highlight", "JOIN US", ["highlight", "offer"]),
      field("body", "Program / Details", "Ribbon Ceremony\nRefreshments\nSpecial Guests\nMusic & Celebration", ["program", "details"], "textarea", true),
      field("date", "Date", "20 ਅਕਤੂਬਰ 2026", ["date", "ਮਿਤੀ"]),
      field("time", "Time", "ਸ਼ਾਮ 5:00 ਵਜੇ", ["time", "ਸਮਾਂ"]),
      field("venue", "Venue / Address", "Main Bazaar, Bhikhi (Mansa)", ["venue", "address", "ਸਥਾਨ"], "textarea", true),
      field("footer", "Invited By", "The Poster Wala Family", ["invitedby", "host"]),
      field("contact", "Contact", "98150 00000", ["phone", "mobile", "contact"])
    ]
  },
  missing: {
    name: "Missing Person Notice Maker", icon: "🔎", description: "ਗੁੰਮਸ਼ੁਦਾ ਵਿਅਕਤੀ ਦੀ ਤਲਾਸ਼ ਲਈ ਸਾਫ਼ ਅਤੇ urgent notice ਬਣਾਓ।",
    palette: { dark: "#222831", accent: "#d71920", soft: "#fff3d9", gold: "#f1b632", ink: "#20242b" },
    photoLabels: ["ਗੁੰਮਸ਼ੁਦਾ ਵਿਅਕਤੀ ਦੀ Photo", "ਦੂਜੀ Photo (Optional)"],
    fields: [
      field("heading", "ਉੱਪਰਲੀ Urgent Line", "ਕਿਰਪਾ ਕਰਕੇ ਲੱਭਣ ਵਿੱਚ ਮਦਦ ਕਰੋ", ["urgent", "heading"]),
      field("title", "ਵਿਅਕਤੀ ਦਾ ਨਾਮ", "ਗੁਰਪ੍ਰੀਤ ਸਿੰਘ", ["name", "person", "ਨਾਮ"]),
      field("subtitle", "ਉਮਰ / ਪਛਾਣ", "ਉਮਰ 24 ਸਾਲ • ਕੱਦ 5 ਫੁੱਟ 8 ਇੰਚ", ["age", "identity", "ਪਛਾਣ", "ਉਮਰ"]),
      field("highlight", "Notice Heading / Reward", "ਗੁੰਮਸ਼ੁਦਾ ਦੀ ਤਲਾਸ਼", ["reward", "notice"]),
      field("body", "ਪਛਾਣ ਅਤੇ ਕੱਪੜਿਆਂ ਦਾ ਵੇਰਵਾ", "ਰੰਗ ਕਣਕਵੰਨਾ\nਕਾਲੀ ਪੱਗ ਅਤੇ ਨੀਲੀ ਕਮੀਜ਼\nਪੰਜਾਬੀ ਅਤੇ ਹਿੰਦੀ ਬੋਲਦਾ ਹੈ\nਮਿਲਣ ’ਤੇ ਤੁਰੰਤ ਸੰਪਰਕ ਕਰੋ", ["description", "clothes", "details", "ਵੇਰਵਾ"], "textarea", true),
      field("date", "ਗੁੰਮ ਹੋਣ ਦੀ ਮਿਤੀ", "12 ਸਤੰਬਰ 2026", ["missingdate", "date", "ਮਿਤੀ"]),
      field("time", "ਆਖਰੀ ਵਾਰ ਵੇਖਿਆ", "ਸਵੇਰੇ 9:30 ਵਜੇ", ["lastseen", "time"]),
      field("venue", "ਗੁੰਮ ਹੋਣ ਦਾ ਸਥਾਨ", "ਬੱਸ ਸਟੈਂਡ, ਮਾਨਸਾ", ["place", "location", "ਸਥਾਨ"], "textarea", true),
      field("footer", "ਸੂਚਨਾ ਦੇਣ ਵਾਲਾ", "ਪਰਿਵਾਰ ਵੱਲੋਂ ਬੇਨਤੀ", ["family", "reportedby"]),
      field("contact", "Emergency Contact", "98150 00000", ["phone", "mobile", "contact", "ਮੋਬਾਇਲ"])
    ]
  },
  condolence: {
    name: "Condolence Notice Poster Maker", icon: "🤍", description: "ਸ਼ੋਕ, ਅਫਸੋਸ ਅਤੇ ਸੰਵੇਦਨਾ ਸੰਦੇਸ਼ ਲਈ dignified poster ਬਣਾਓ।",
    palette: { dark: "#303438", accent: "#737a80", soft: "#f1f2f2", gold: "#bda36a", ink: "#2c3033" },
    photoLabels: ["ਸ਼ਰਧਾਂਜਲੀ Photo", "Organization / Event Photo (Optional)"],
    fields: [
      field("heading", "Organization / Sender", "ਗਹਿਰੇ ਦੁੱਖ ਦਾ ਪ੍ਰਗਟਾਵਾ", ["organization", "sender"]),
      field("title", "ਵਿਅਕਤੀ ਦਾ ਨਾਮ", "ਸਵ. ਗੁਰਦੇਵ ਸਿੰਘ ਜੀ", ["name", "person", "ਨਾਮ"]),
      field("subtitle", "ਅਹੁਦਾ / ਪਛਾਣ", "ਸਤਿਕਾਰਯੋਗ ਸਮਾਜ ਸੇਵੀ", ["designation", "identity", "ਅਹੁਦਾ"]),
      field("highlight", "Main Message", "ਭਾਵਭਿੰਨੀ ਸ਼ਰਧਾਂਜਲੀ", ["tribute", "message"]),
      field("body", "Condolence Message", "ਉਨ੍ਹਾਂ ਦੇ ਅਕਾਲ ਚਲਾਣੇ ਨਾਲ ਪਰਿਵਾਰ ਅਤੇ ਸਮਾਜ ਨੂੰ ਨਾ ਪੂਰਾ ਹੋਣ ਵਾਲਾ ਘਾਟਾ ਪਿਆ ਹੈ। ਪ੍ਰਮਾਤਮਾ ਵਿਛੜੀ ਰੂਹ ਨੂੰ ਆਪਣੇ ਚਰਨਾਂ ਵਿੱਚ ਨਿਵਾਸ ਬਖ਼ਸ਼ੇ।", ["condolence", "message", "ਸੰਦੇਸ਼"], "textarea", true),
      field("date", "Date", "13 ਸਤੰਬਰ 2026", ["date", "ਮਿਤੀ"]),
      field("time", "Optional Line", "ਵਾਹਿਗੁਰੂ ਪਰਿਵਾਰ ਨੂੰ ਭਾਣਾ ਮੰਨਣ ਦਾ ਬਲ ਬਖ਼ਸ਼ੇ", ["line", "prayer"]),
      field("venue", "Place / Organization", "ਮਾਨਸਾ, ਪੰਜਾਬ", ["place", "organization", "ਸਥਾਨ"], "textarea", true),
      field("footer", "Condolence By", "ਸਮੂਹ ਮੈਂਬਰ ਅਤੇ ਸਟਾਫ਼", ["condolenceby", "sender"]),
      field("contact", "Contact (Optional)", "", ["phone", "mobile", "contact"])
    ]
  },
  meeting: {
    name: "Meeting Notice Poster Maker", icon: "🤝", description: "Society, committee, school ਜਾਂ organization meeting ਦੀ notice ਬਣਾਓ।",
    palette: { dark: "#153b5c", accent: "#168aad", soft: "#e7f5f8", gold: "#e0aa3e", ink: "#17384f" },
    photoLabels: ["Meeting / Organization Photo", "Chief Guest / Venue Photo (Optional)"],
    fields: [
      field("heading", "Organization Name", "THE MOHAR SINGH WALA MPCASS LTD.", ["organization", "society", "ਸੰਸਥਾ"]),
      field("title", "Meeting Title", "ਜ਼ਰੂਰੀ ਜਨਰਲ ਮੀਟਿੰਗ", ["meeting", "title", "ਮੀਟਿੰਗ"]),
      field("subtitle", "Short Notice", "ਸਾਰੇ ਮੈਂਬਰਾਂ ਨੂੰ ਸੂਚਿਤ ਕੀਤਾ ਜਾਂਦਾ ਹੈ ਕਿ ਹੇਠ ਲਿਖੇ ਅਨੁਸਾਰ ਮੀਟਿੰਗ ਰੱਖੀ ਗਈ ਹੈ।", ["notice", "message"], "textarea", true),
      field("highlight", "Important Label", "ਹਾਜ਼ਰੀ ਲਾਜ਼ਮੀ", ["important", "highlight"]),
      field("body", "Agenda — ਹਰ line ਵੱਖਰਾ point", "ਪਿਛਲੀ ਕਾਰਵਾਈ ਦੀ ਪੁਸ਼ਟੀ\nਆਮਦਨ ਅਤੇ ਖਰਚੇ ਦੀ ਸਮੀਖਿਆ\nਆਉਣ ਵਾਲੇ ਕੰਮਾਂ ਬਾਰੇ ਵਿਚਾਰ\nਮੈਂਬਰਾਂ ਦੇ ਸੁਝਾਅ", ["agenda", "ਮੁੱਦੇ"], "textarea", true),
      field("date", "Date", "20 ਸਤੰਬਰ 2026", ["date", "ਮਿਤੀ"]),
      field("time", "Time", "ਸਵੇਰੇ 11:00 ਵਜੇ", ["time", "ਸਮਾਂ"]),
      field("venue", "Venue", "ਸਭਾ ਦਾ ਦਫ਼ਤਰ, ਮੋਹਰ ਸਿੰਘ ਵਾਲਾ", ["venue", "location", "ਸਥਾਨ"], "textarea", true),
      field("footer", "Issued By", "ਪ੍ਰਧਾਨ / ਸਕੱਤਰ", ["issuedby", "authority"]),
      field("contact", "Contact", "98150 00000", ["phone", "mobile", "contact"])
    ]
  },
  protest: {
    name: "Dharna / Strike Notice Maker", icon: "✊", description: "ਧਰਨਾ, ਹੜਤਾਲ, ਰੈਲੀ ਜਾਂ ਇਕੱਠ ਲਈ bold public poster ਬਣਾਓ।",
    palette: { dark: "#1f1f1f", accent: "#d21f26", soft: "#fff0dc", gold: "#f1b82d", ink: "#181818" },
    photoLabels: ["Dharna / Leader Photo", "ਦੂਜੀ Photo (Optional)"],
    fields: [
      field("heading", "Organization / Union", "ਕਿਸਾਨ ਮਜ਼ਦੂਰ ਏਕਤਾ", ["organization", "union", "ਜਥੇਬੰਦੀ"]),
      field("title", "Dharna / Rally Title", "ਵਿਸ਼ਾਲ ਰੋਸ ਧਰਨਾ", ["title", "protest", "ਧਰਨਾ"]),
      field("subtitle", "Appeal Line", "ਆਪਣੇ ਹੱਕਾਂ ਲਈ ਵੱਡੀ ਗਿਣਤੀ ਵਿੱਚ ਪਹੁੰਚੋ", ["appeal", "ਸੱਦਾ"], "textarea", true),
      field("highlight", "Main Slogan", "ਇੱਕਜੁੱਟ ਹੋਵੋ", ["slogan", "ਨਾਅਰਾ"]),
      field("body", "Demands / Issues", "ਕਿਸਾਨਾਂ ਦੀਆਂ ਮੰਗਾਂ ਤੁਰੰਤ ਮੰਨੀਆਂ ਜਾਣ\nਬਕਾਇਆ ਰਾਸ਼ੀ ਜਾਰੀ ਕੀਤੀ ਜਾਵੇ\nਲੋਕ ਵਿਰੋਧੀ ਫ਼ੈਸਲੇ ਵਾਪਸ ਲਏ ਜਾਣ", ["demands", "issues", "ਮੰਗਾਂ"], "textarea", true),
      field("date", "Date", "22 ਸਤੰਬਰ 2026", ["date", "ਮਿਤੀ"]),
      field("time", "Time", "ਸਵੇਰੇ 10:00 ਵਜੇ", ["time", "ਸਮਾਂ"]),
      field("venue", "Gathering Place", "ਡੀ.ਸੀ. ਦਫ਼ਤਰ, ਮਾਨਸਾ", ["venue", "place", "ਸਥਾਨ"], "textarea", true),
      field("footer", "Organizers / Leaders", "ਸਮੂਹ ਜਥੇਬੰਦੀਆਂ", ["leaders", "organizers"]),
      field("contact", "Contact", "98150 00000", ["phone", "mobile", "contact"])
    ]
  },
  announcement: {
    name: "Public Announcement Poster Maker", icon: "📢", description: "ਪਿੰਡ, ਸੰਸਥਾ ਜਾਂ public service ਦੀ ਆਮ ਸੂਚਨਾ ਬਣਾਓ।",
    palette: { dark: "#263d5a", accent: "#e67e22", soft: "#eef4fb", gold: "#e0aa3e", ink: "#25384e" },
    photoLabels: ["Announcement ਦੀ ਮੁੱਖ Photo", "ਦੂਜੀ Photo (Optional)"],
    fields: [
      field("heading", "Authority / Organization", "ਗ੍ਰਾਮ ਪੰਚਾਇਤ ਮੋਹਰ ਸਿੰਘ ਵਾਲਾ", ["authority", "organization", "ਪੰਚਾਇਤ"]),
      field("title", "Announcement Title", "ਜਨਤਕ ਸੂਚਨਾ", ["title", "announcement", "ਸੂਚਨਾ"]),
      field("subtitle", "Short Introduction", "ਸਮੂਹ ਪਿੰਡ ਵਾਸੀਆਂ ਨੂੰ ਸੂਚਿਤ ਕੀਤਾ ਜਾਂਦਾ ਹੈ ਕਿ", ["intro", "message"], "textarea", true),
      field("highlight", "Important Heading", "ਜ਼ਰੂਰੀ ਜਾਣਕਾਰੀ", ["important", "heading"]),
      field("body", "Complete Notice / Instructions", "ਪਿੰਡ ਵਿੱਚ ਸਫਾਈ ਮੁਹਿੰਮ ਚਲਾਈ ਜਾ ਰਹੀ ਹੈ।\nਸਾਰੇ ਨਿਵਾਸੀ ਆਪਣਾ ਸਹਿਯੋਗ ਦੇਣ।\nਨਿਰਧਾਰਤ ਸਮੇਂ ’ਤੇ ਮੁੱਖ ਚੌਕ ਵਿੱਚ ਪਹੁੰਚੋ।", ["notice", "instructions", "details"], "textarea", true),
      field("date", "Date", "25 ਸਤੰਬਰ 2026", ["date", "ਮਿਤੀ"]),
      field("time", "Time", "ਸਵੇਰੇ 8:00 ਵਜੇ", ["time", "ਸਮਾਂ"]),
      field("venue", "Place / Area", "ਮੁੱਖ ਚੌਕ, ਪਿੰਡ ਮੋਹਰ ਸਿੰਘ ਵਾਲਾ", ["place", "location", "ਸਥਾਨ"], "textarea", true),
      field("footer", "Issued By", "ਸਰਪੰਚ / ਗ੍ਰਾਮ ਪੰਚਾਇਤ", ["issuedby", "authority"]),
      field("contact", "Contact", "98150 00000", ["phone", "mobile", "contact"])
    ]
  }
};

const templates = [
  { id: 7, name: "Royal Jagran Invitation", note: "Maroon-gold religious event layout with two-photo presentation", look: "classic", modules: ["general-invite"], palette: { dark: "#4f1418", accent: "#8b1c25", soft: "#fff8e9", gold: "#d2a33a" } },
  { id: 6, name: "Boutique Grand Opening", note: "Ivory floral opening invitation with elegant maroon hierarchy", look: "card", modules: ["general-invite"], palette: { dark: "#54202d", accent: "#8f2945", soft: "#fff5eb", gold: "#c69a43" } },
  { id: 5, name: "Premium Editorial", note: "ਨਵਾਂ magazine-style layout", look: "editorial" },
  { id: 4, name: "Elegant Portrait", note: "Soft background ਅਤੇ centered card", look: "card" },
  { id: 3, name: "Bold Spotlight", note: "ਵੱਡੀ photo ਅਤੇ high-impact heading", look: "bold" },
  { id: 2, name: "Modern Split", note: "Photo ਅਤੇ details ਦਾ clean split", look: "split" },
  { id: 1, name: "Heritage Frame", note: "Traditional border ਅਤੇ balanced details", look: "classic" }
];

const requestedModule = new URLSearchParams(location.search).get("module") || "missing";
const moduleId = moduleConfigs[requestedModule] ? requestedModule : "missing";
const config = moduleConfigs[moduleId];
let state = makeState();
let toastTimer;

function makeState() {
  const values = Object.fromEntries(config.fields.map((item) => [item.key, item.value]));
  return { ...values, templateId: 5, primaryPhoto: null, secondaryPhoto: null, logo: null, primaryScale: 1, primaryX: 0, primaryY: 0, logoScale: 1 };
}

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

function setFont(context, size, weight = 700) { context.font = `${weight} ${size}px ${FONT}`; }
function roundedPath(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath(); context.moveTo(x + r, y); context.arcTo(x + width, y, x + width, y + height, r); context.arcTo(x + width, y + height, x, y + height, r); context.arcTo(x, y + height, x, y, r); context.arcTo(x, y, x + width, y, r); context.closePath();
}
function fillRound(x, y, width, height, radius, color) { roundedPath(ctx, x, y, width, height, radius); ctx.fillStyle = color; ctx.fill(); }
function strokeRound(x, y, width, height, radius, color, lineWidth = 3) { roundedPath(ctx, x, y, width, height, radius); ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.stroke(); }
function wrapLines(text, maxWidth) {
  const lines = [];
  String(text || "").split(/\n+/).forEach((paragraph) => {
    const words = paragraph.trim().split(/\s+/).filter(Boolean); let line = "";
    words.forEach((word) => {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width <= maxWidth) line = test;
      else { if (line) lines.push(line); line = word; }
    });
    if (line) lines.push(line);
  });
  return lines.length ? lines : [""];
}
function fitSize(text, maxWidth, start, min = 18, weight = 800) {
  let size = start;
  while (size > min) { setFont(ctx, size, weight); if (ctx.measureText(String(text || " ")).width <= maxWidth) break; size -= 1; }
  return size;
}
function drawText(text, x, y, maxWidth, options = {}) {
  const align = options.align || "center"; const weight = options.weight || 700; const maxLines = options.maxLines || 3; const minSize = options.minSize || 17;
  let size = options.size || 30; let lines = [];
  while (size > minSize) { setFont(ctx, size, weight); lines = wrapLines(text, maxWidth); if (lines.length <= maxLines) break; size -= 1; }
  setFont(ctx, size, weight); lines = wrapLines(text, maxWidth).slice(0, maxLines);
  const lineHeight = options.lineHeight || Math.round(size * 1.34);
  ctx.fillStyle = options.color || config.palette.ink; ctx.textAlign = align; ctx.textBaseline = "top";
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
  return lines.length * lineHeight;
}
function drawCover(image, x, y, width, height, scale = 1, offsetX = 0, offsetY = 0) {
  if (!image?.naturalWidth) return;
  const base = Math.max(width / image.naturalWidth, height / image.naturalHeight) * scale;
  const drawW = image.naturalWidth * base; const drawH = image.naturalHeight * base;
  ctx.drawImage(image, x + (width - drawW) / 2 + offsetX, y + (height - drawH) / 2 + offsetY, drawW, drawH);
}
function drawPhoto(image, x, y, width, height, options = {}) {
  ctx.save(); roundedPath(ctx, x, y, width, height, options.radius ?? 28); ctx.clip(); ctx.fillStyle = options.placeholder || config.palette.soft; ctx.fillRect(x, y, width, height);
  if (image) drawCover(image, x, y, width, height, image === state.primaryPhoto ? state.primaryScale : 1, image === state.primaryPhoto ? state.primaryX : 0, image === state.primaryPhoto ? state.primaryY : 0);
  else { ctx.fillStyle = config.palette.accent; ctx.textAlign = "center"; ctx.textBaseline = "middle"; setFont(ctx, Math.min(72, width / 4), 800); ctx.fillText(config.icon, x + width / 2, y + height / 2 - 20); drawText("Photo Upload ਕਰੋ", x + width / 2, y + height / 2 + 48, width - 40, { size: 24, minSize: 17, maxLines: 1, color: config.palette.ink }); }
  ctx.restore(); strokeRound(x, y, width, height, options.radius ?? 28, options.border || config.palette.gold, options.lineWidth || 6);
}
function drawLogo(x, y, size, dark = false) {
  const actual = size * state.logoScale;
  if (state.logo) { ctx.save(); ctx.beginPath(); ctx.arc(x, y, actual / 2, 0, Math.PI * 2); ctx.clip(); drawCover(state.logo, x - actual / 2, y - actual / 2, actual, actual); ctx.restore(); ctx.strokeStyle = config.palette.gold; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, actual / 2, 0, Math.PI * 2); ctx.stroke(); }
  else { ctx.fillStyle = dark ? "#fff" : config.palette.dark; ctx.textAlign = "center"; ctx.textBaseline = "middle"; setFont(ctx, Math.min(56, actual * .55), 800); ctx.fillText(config.icon, x, y); }
}
function drawInfoRows(startY, color, background = "rgba(255,255,255,.82)", width = 850, centerX = W / 2) {
  const rows = [["▣", state.date], ["◷", state.time], ["⌖", state.venue]];
  rows.forEach(([icon, value], index) => { const y = startY + index * 72; fillRound(centerX - width / 2, y, width, 58, 18, background); drawText(`${icon}  ${value}`, centerX, y + 11, width - 55, { size: 25, minSize: 17, weight: 800, maxLines: 1, color }); });
}
function drawBulletBody(x, y, width, color, maxLines = 4, align = "left") {
  const lines = String(state.body || "").split(/\n+/).filter(Boolean).slice(0, maxLines);
  lines.forEach((line, index) => drawText(`• ${line}`, x, y + index * 47, width, { align, size: 25, minSize: 17, weight: 650, maxLines: 1, color }));
}
function drawFooter(y, foreground, background) {
  fillRound(90, y, 900, 86, 28, background);
  drawText(state.footer, 320, y + 13, 390, { size: 25, minSize: 17, weight: 800, maxLines: 2, color: foreground });
  drawText(state.contact ? `☎ ${state.contact}` : "", 770, y + 22, 350, { size: 29, minSize: 18, weight: 900, maxLines: 1, color: foreground });
}
function drawHeritage() {
  const p = config.palette; const g = ctx.createRadialGradient(W / 2, 420, 80, W / 2, 820, 980); g.addColorStop(0, "#fff"); g.addColorStop(1, p.soft); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = p.gold; ctx.lineWidth = 14; ctx.strokeRect(22, 22, W - 44, H - 44); ctx.lineWidth = 3; ctx.strokeRect(43, 43, W - 86, H - 86);
  drawLogo(108, 108, 88); drawLogo(W - 108, 108, 88);
  drawText(state.heading, W / 2, 63, 720, { size: 31, minSize: 20, weight: 850, maxLines: 2, color: p.dark });
  fillRound(115, 160, 850, 85, 28, p.dark); drawText(state.highlight, W / 2, 174, 790, { size: 41, minSize: 24, weight: 900, maxLines: 1, color: "#fff" });
  drawPhoto(state.primaryPhoto, 315, 280, 450, 450, { radius: 225, border: p.gold, lineWidth: 10 });
  drawText(state.title, W / 2, 755, 900, { size: 57, minSize: 28, weight: 900, maxLines: 2, color: p.ink, lineHeight: 64 });
  drawText(state.subtitle, W / 2, 880, 850, { size: 27, minSize: 18, weight: 650, maxLines: 3, color: p.dark, lineHeight: 37 });
  drawBulletBody(170, 1002, 740, p.ink, 4);
  drawInfoRows(1200, p.dark, "rgba(255,255,255,.76)");
  drawFooter(1490, "#fff", p.dark);
}
function drawModernSplit() {
  const p = config.palette; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = p.dark; ctx.fillRect(0, 0, 455, H);
  drawPhoto(state.primaryPhoto, 40, 165, 375, 650, { radius: 32, border: p.gold, lineWidth: 7, placeholder: "rgba(255,255,255,.12)" });
  if (state.secondaryPhoto) drawPhoto(state.secondaryPhoto, 90, 855, 275, 275, { radius: 138, border: p.gold, lineWidth: 6 });
  drawLogo(105, 92, 82, true); drawText(state.heading, 250, 60, 300, { size: 25, minSize: 17, weight: 850, maxLines: 2, color: "#fff" });
  drawText(state.highlight, 225, 1190, 365, { size: 37, minSize: 22, weight: 900, maxLines: 2, color: p.gold });
  drawText(state.footer, 225, 1310, 345, { size: 24, minSize: 17, weight: 700, maxLines: 3, color: "#fff" });
  drawText(state.contact ? `☎ ${state.contact}` : "", 225, 1455, 350, { size: 29, minSize: 18, weight: 900, maxLines: 1, color: p.gold });
  drawText(state.title, 750, 110, 540, { size: 59, minSize: 29, weight: 900, maxLines: 3, color: p.ink, lineHeight: 67 });
  ctx.fillStyle = p.accent; ctx.fillRect(500, 340, 520, 9);
  drawText(state.subtitle, 750, 390, 520, { size: 28, minSize: 18, weight: 650, maxLines: 4, color: p.dark, lineHeight: 39 });
  drawBulletBody(535, 585, 455, p.ink, 5);
  drawInfoRows(930, p.dark, p.soft, 500, 750);
}
function drawBoldSpotlight() {
  const p = config.palette; ctx.fillStyle = p.dark; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = .92; if (state.primaryPhoto) drawCover(state.primaryPhoto, 0, 0, W, 880, state.primaryScale, state.primaryX, state.primaryY); else { const g = ctx.createLinearGradient(0, 0, W, 880); g.addColorStop(0, p.accent); g.addColorStop(1, p.dark); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 880); }
  const overlay = ctx.createLinearGradient(0, 180, 0, 900); overlay.addColorStop(0, "rgba(0,0,0,.05)"); overlay.addColorStop(1, "rgba(0,0,0,.94)"); ctx.fillStyle = overlay; ctx.fillRect(0, 0, W, 900); ctx.restore();
  drawLogo(94, 92, 82, true); drawText(state.heading, 600, 58, 760, { size: 28, minSize: 18, weight: 850, maxLines: 2, color: "#fff" });
  fillRound(70, 530, 450, 68, 22, p.accent); drawText(state.highlight, 295, 542, 405, { size: 32, minSize: 20, weight: 900, maxLines: 1, color: "#fff" });
  drawText(state.title, 75, 625, 900, { align: "left", size: 68, minSize: 32, weight: 900, maxLines: 3, color: "#fff", lineHeight: 74 });
  drawText(state.subtitle, 75, 855, 930, { align: "left", size: 27, minSize: 18, weight: 650, maxLines: 3, color: "#f4f2ef", lineHeight: 38 });
  fillRound(55, 985, 970, 420, 34, "#fff");
  drawBulletBody(105, 1035, 870, p.ink, 4);
  drawInfoRows(1235, p.dark, p.soft, 850);
  drawFooter(1480, "#fff", p.accent);
}
function drawElegantPortrait() {
  const p = config.palette; const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, p.soft); g.addColorStop(.5, "#fff"); g.addColorStop(1, p.soft); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = p.gold; ctx.fillRect(0, 0, W, 18); ctx.fillRect(0, H - 18, W, 18);
  fillRound(70, 70, 940, 1470, 45, "rgba(255,255,255,.91)"); strokeRound(70, 70, 940, 1470, 45, p.gold, 4);
  drawLogo(W / 2, 130, 90); drawText(state.heading, W / 2, 188, 780, { size: 27, minSize: 18, weight: 850, maxLines: 2, color: p.dark });
  drawPhoto(state.primaryPhoto, 320, 280, 440, 520, { radius: 220, border: p.gold, lineWidth: 11 });
  drawText(state.title, W / 2, 835, 850, { size: 52, minSize: 27, weight: 900, maxLines: 2, color: p.ink, lineHeight: 59 });
  fillRound(230, 955, 620, 67, 27, p.accent); drawText(state.highlight, W / 2, 966, 570, { size: 32, minSize: 21, weight: 900, maxLines: 1, color: "#fff" });
  drawText(state.subtitle, W / 2, 1050, 820, { size: 25, minSize: 17, weight: 650, maxLines: 3, color: p.dark, lineHeight: 35 });
  drawBulletBody(180, 1160, 720, p.ink, 3);
  drawInfoRows(1308, p.dark, p.soft, 850);
  drawText(`${state.footer}${state.contact ? `  •  ☎ ${state.contact}` : ""}`, W / 2, 1530, 850, { size: 22, minSize: 16, weight: 800, maxLines: 1, color: p.dark });
}
function drawPremiumEditorial() {
  const p = config.palette; ctx.fillStyle = "#f7f7f4"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = p.dark; ctx.fillRect(0, 0, W, 245);
  ctx.fillStyle = p.accent; ctx.fillRect(0, 245, W, 14); drawLogo(104, 112, 88, true);
  drawText(state.heading, 610, 62, 760, { size: 30, minSize: 18, weight: 850, maxLines: 2, color: "#fff" });
  drawText(state.highlight, 610, 150, 760, { size: 42, minSize: 23, weight: 900, maxLines: 1, color: p.gold });
  drawText(state.title, 70, 310, 570, { align: "left", size: 64, minSize: 30, weight: 900, maxLines: 3, color: p.ink, lineHeight: 69 });
  drawText(state.subtitle, 72, 540, 515, { align: "left", size: 27, minSize: 18, weight: 650, maxLines: 4, color: p.dark, lineHeight: 38 });
  drawPhoto(state.primaryPhoto, 635, 310, 385, 570, { radius: 24, border: p.gold, lineWidth: 6 });
  if (state.secondaryPhoto) drawPhoto(state.secondaryPhoto, 70, 745, 250, 200, { radius: 22, border: p.accent, lineWidth: 5 });
  fillRound(350, 745, 600, 200, 24, p.soft); drawBulletBody(390, 775, 520, p.ink, 4);
  ctx.fillStyle = p.dark; ctx.fillRect(0, 1000, W, 8);
  drawInfoRows(1050, p.dark, "#fff", 900);
  fillRound(90, 1290, 900, 120, 26, p.soft); drawText(state.body, W / 2, 1310, 820, { size: 24, minSize: 17, weight: 650, maxLines: 3, color: p.ink, lineHeight: 33 });
  drawFooter(1470, "#fff", p.dark);
}
function drawBoutiqueOpening() {
  const p = { dark: "#54202d", accent: "#8f2945", soft: "#fff5eb", gold: "#c69a43", ink: "#3e2730" };
  const paper = ctx.createLinearGradient(0, 0, W, H); paper.addColorStop(0, "#fffdf8"); paper.addColorStop(.55, p.soft); paper.addColorStop(1, "#f7e7df"); ctx.fillStyle = paper; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = p.gold; ctx.lineWidth = 12; ctx.strokeRect(24, 24, W - 48, H - 48); ctx.lineWidth = 3; ctx.strokeRect(45, 45, W - 90, H - 90);
  [[82,82],[W-82,82],[82,H-82],[W-82,H-82]].forEach(([x,y], index) => { ctx.save(); ctx.translate(x,y); if(index % 2) ctx.scale(-1,1); if(index > 1) ctx.scale(1,-1); ctx.fillStyle="#ead2c1"; for(let i=0;i<5;i+=1){ctx.beginPath();ctx.ellipse(18+i*13,8+i*8,24,12,-.55,0,Math.PI*2);ctx.fill();} ctx.fillStyle=p.gold;ctx.beginPath();ctx.arc(0,0,18,0,Math.PI*2);ctx.fill();ctx.restore(); });
  drawLogo(W / 2, 100, 82); drawText(state.heading, W / 2, 150, 820, { size: 29, minSize: 19, weight: 850, maxLines: 2, color: p.dark });
  drawText(state.title, W / 2, 242, 920, { size: 72, minSize: 34, weight: 900, maxLines: 2, color: p.accent, lineHeight: 78 });
  ctx.fillStyle=p.gold; ctx.fillRect(180,405,720,4); drawText(state.subtitle, W / 2, 435, 830, { size: 27, minSize: 18, weight: 650, maxLines: 3, color: p.ink, lineHeight: 38 });
  drawPhoto(state.primaryPhoto, 315, 565, 450, 420, { radius: 225, border: p.gold, lineWidth: 10, placeholder: "#f1dfd5" });
  fillRound(170, 1015, 740, 76, 32, p.dark); drawText(state.highlight, W / 2, 1029, 680, { size: 38, minSize: 22, weight: 900, maxLines: 1, color: "#fff4d8" });
  fillRound(105, 1120, 870, 180, 25, "rgba(255,255,255,.76)"); strokeRound(105, 1120, 870, 180, 25, p.gold, 3); drawBulletBody(170, 1150, 740, p.ink, 3, "center");
  [["▣",state.date],["◷",state.time],["⌖",state.venue]].forEach(([icon,value],i)=>{const x=80+i*320;fillRound(x,1330,280,105,20,i===0?p.accent:"#fff");strokeRound(x,1330,280,105,20,p.gold,3);drawText(`${icon}  ${value}`,x+140,1351,245,{size:23,minSize:16,weight:850,maxLines:2,color:i===0?"#fff":p.dark,lineHeight:30});});
  drawFooter(1472, "#fff", p.dark);
}
function drawRoyalJagran() {
  const p = { dark: "#4f1418", accent: "#8b1c25", soft: "#fff8e9", gold: "#d2a33a", ink: "#351c1b" };
  const paper=ctx.createRadialGradient(W/2,520,80,W/2,780,1000);paper.addColorStop(0,"#fffdf6");paper.addColorStop(1,"#f1dfbf");ctx.fillStyle=paper;ctx.fillRect(0,0,W,H);
  ctx.strokeStyle=p.gold;ctx.lineWidth=14;ctx.strokeRect(22,22,W-44,H-44);ctx.lineWidth=3;ctx.strokeRect(45,45,W-90,H-90);
  drawLogo(92,92,74); drawText(state.heading,W/2,55,780,{size:27,minSize:18,weight:850,maxLines:2,color:p.dark});
  drawText(state.title,W/2,145,920,{size:62,minSize:31,weight:900,maxLines:2,color:p.accent,lineHeight:68});
  ctx.fillStyle=p.gold;ctx.fillRect(145,300,790,5);
  drawPhoto(state.primaryPhoto,75,345,430,520,{radius:28,border:p.gold,lineWidth:8,placeholder:"#f3e3c6"});
  drawPhoto(state.secondaryPhoto,575,345,430,520,{radius:28,border:p.gold,lineWidth:8,placeholder:"#f3e3c6"});
  fillRound(125,900,830,84,36,p.dark);drawText(state.highlight,W/2,915,760,{size:40,minSize:23,weight:900,maxLines:1,color:"#fff2c9"});
  drawText(state.subtitle,W/2,1015,860,{size:26,minSize:18,weight:650,maxLines:3,color:p.ink,lineHeight:36});
  fillRound(95,1135,890,150,26,"rgba(255,255,255,.76)");strokeRound(95,1135,890,150,26,p.gold,3);drawBulletBody(155,1160,770,p.ink,3,"center");
  [["▣",state.date],["◷",state.time],["⌖",state.venue]].forEach(([icon,value],i)=>{const x=65+i*327;fillRound(x,1322,296,108,20,i===0?p.accent:"#fff9ef");strokeRound(x,1322,296,108,20,p.gold,3);drawText(`${icon} ${value}`,x+148,1344,260,{size:22,minSize:16,weight:850,maxLines:2,color:i===0?"#fff":p.dark,lineHeight:29});});
  drawFooter(1470,"#fff",p.dark);
}
function renderPoster() {
  ctx.clearRect(0, 0, W, H);
  if (state.templateId === 7 && moduleId === "general-invite") drawRoyalJagran();
  else if (state.templateId === 6 && moduleId === "general-invite") drawBoutiqueOpening();
  else if (state.templateId === 1) drawHeritage();
  else if (state.templateId === 2) drawModernSplit();
  else if (state.templateId === 3) drawBoldSpotlight();
  else if (state.templateId === 4) drawElegantPortrait();
  else drawPremiumEditorial();
  if (document.getElementById("universalModal").classList.contains("open")) exportController?.copyToModal();
  exportController?.refreshPreview();
}

function hiddenStorageKey() { return `mdc-hidden-templates-${moduleId}`; }
function getHiddenTemplates() { try { return JSON.parse(localStorage.getItem(hiddenStorageKey()) || "[]"); } catch { return []; } }
function visibleTemplates() { const hidden = new Set(getHiddenTemplates()); return templates.filter((template) => (!template.modules || template.modules.includes(moduleId)) && !hidden.has(template.id)); }
function lookMarkup(template) { const p = template.palette || config.palette; return `<span class="universal-template-look look-${template.look}" style="--look-bg:${p.soft};--look-border:${p.gold};--look-accent:${p.accent};--look-text:${p.dark}"><i></i></span>`; }
function renderTemplateMenu() {
  const menu = document.getElementById("universalTemplateMenu");
  menu.innerHTML = visibleTemplates().map((template) => `<button class="template-option universal-template-option ${template.id === state.templateId ? "selected" : ""}" type="button" role="option" aria-selected="${template.id === state.templateId}" data-template-id="${template.id}">${lookMarkup(template)}<span class="template-option-copy"><strong>${String(template.id).padStart(2, "0")}. ${template.name}</strong><small>${template.note}</small></span><span class="universal-template-badge">${config.icon}</span></button>`).join("");
  menu.querySelectorAll("[data-template-id]").forEach((button) => button.addEventListener("click", () => selectTemplate(Number(button.dataset.templateId))));
}
function updateTemplateButton() {
  const template = templates.find((item) => item.id === state.templateId) || visibleTemplates()[0];
  document.getElementById("universalSelectedLook").innerHTML = lookMarkup(template);
  document.getElementById("universalSelectedName").textContent = `${String(template.id).padStart(2, "0")}. ${template.name}`;
  document.getElementById("universalSelectedNote").textContent = template.note;
}
function selectTemplate(id) { state.templateId = id; updateTemplateButton(); renderTemplateMenu(); document.getElementById("universalTemplateSelect").classList.remove("open"); document.getElementById("universalTemplateButton").setAttribute("aria-expanded", "false"); renderPoster(); }
function hideSelectedTemplate() {
  const visible = visibleTemplates();
  if (visible.length <= 1) { showToast("ਘੱਟੋ-ਘੱਟ ਇੱਕ template visible ਰਹਿਣਾ ਲਾਜ਼ਮੀ ਹੈ।"); return; }
  const hidden = getHiddenTemplates(); if (!hidden.includes(state.templateId)) hidden.push(state.templateId); localStorage.setItem(hiddenStorageKey(), JSON.stringify(hidden)); state.templateId = visibleTemplates()[0].id; updateTemplateButton(); renderTemplateMenu(); renderPoster(); showToast("Template ਇਸ device ’ਤੇ hide ਹੋ ਗਿਆ।");
}
function restoreTemplates() { localStorage.removeItem(hiddenStorageKey()); state.templateId = 5; updateTemplateButton(); renderTemplateMenu(); renderPoster(); showToast("ਸਾਰੇ templates restore ਹੋ ਗਏ।"); }

function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]); }
function renderFields() {
  document.getElementById("dynamicFields").innerHTML = config.fields.map((item) => `<label class="field ${item.wide ? "field-wide" : ""}"><span>${escapeHtml(item.label)}</span>${item.type === "textarea" ? `<textarea data-universal-key="${item.key}" rows="${item.key === "body" ? 5 : 3}">${escapeHtml(state[item.key])}</textarea>` : `<input data-universal-key="${item.key}" type="text" value="${escapeHtml(state[item.key])}" />`}</label>`).join("");
  document.querySelectorAll("[data-universal-key]").forEach((input) => input.addEventListener("input", () => { state[input.dataset.universalKey] = input.value; renderPoster(); }));
}
function updatePhotoCards() {
  [["primaryPhotoCard", state.primaryPhoto], ["secondaryPhotoCard", state.secondaryPhoto], ["universalLogoCard", state.logo]].forEach(([id, image]) => { const card = document.getElementById(id); card.classList.toggle("has-image", Boolean(image)); card.style.backgroundImage = image?.src ? `url(${image.src})` : ""; });
}
function loadImage(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onerror = reject; reader.onload = () => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = reader.result; }; reader.readAsDataURL(file); }); }
async function handleUpload(inputId, key) { const file = document.getElementById(inputId).files?.[0]; if (!file) return; if (!file.type.startsWith("image/")) { showToast("JPG ਜਾਂ PNG photo ਚੁਣੋ।"); return; } try { state[key] = await loadImage(file); updatePhotoCards(); renderPoster(); showToast("Photo upload ਹੋ ਗਈ।"); } catch { showToast("Photo load ਨਹੀਂ ਹੋਈ—ਕੋਈ ਹੋਰ file try ਕਰੋ।"); } }

function normalize(value) { return String(value).toLowerCase().replace(/[\s_.()/-]+/g, ""); }
function smartFill() {
  const text = document.getElementById("universalSmartText").value.trim(); if (!text) { showToast("ਪਹਿਲਾਂ details paste ਕਰੋ।"); return; }
  const parsed = {};
  text.split(/\n+/).forEach((line) => {
    const match = line.match(/^\s*([^:：=–—]{2,42})\s*[:：=–—]\s*(.+)$/); if (!match) return;
    const label = normalize(match[1]); const target = config.fields.find((item) => [item.label, item.key, ...item.aliases].map(normalize).includes(label)); if (target) parsed[target.key] = match[2].trim();
  });
  if (!parsed.contact) { const phone = text.match(/(?:\+91[\s-]?)?[6-9]\d[\s-]?\d{4}[\s-]?\d{4}/); if (phone) parsed.contact = phone[0]; }
  Object.entries(parsed).forEach(([key, value]) => { state[key] = value; }); renderFields(); renderPoster(); showToast(Object.keys(parsed).length ? `${Object.keys(parsed).length} fields ਆਪਣੇ ਆਪ ਭਰ ਗਈਆਂ—check ਕਰ ਲਵੋ।` : "Labels ਨਾਲ details ਲਿਖੋ, ਜਿਵੇਂ ਨਾਮ: …, ਮਿਤੀ: …");
}
function smartPlaceholder() { return config.fields.map((item) => `${item.label}: ${item.value}`).join("\n"); }
function showToast(message) { const toast = document.getElementById("universalToast"); toast.textContent = message; toast.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 2500); }
function safeFilename() { return `${String(state.title || config.name).replace(/[^\p{L}\p{N}\s-]/gu, "").trim().replace(/\s+/g, "-").slice(0, 48) || "Poster"}.png`; }
function downloadPoster() { renderPoster(); exportController.downloadPNG(); }
function resetPoster() { state = makeState(); localStorage.removeItem(`mdc-draft-${moduleId}`); renderFields(); updateTemplateButton(); renderTemplateMenu(); updatePhotoCards(); syncRanges(); renderPoster(); showToast("ਨਵਾਂ poster ready ਹੈ।"); }
function syncRanges() { [["primaryScale", Math.round(state.primaryScale * 100), "primaryScaleValue", "%"], ["primaryX", state.primaryX, "primaryXValue", ""], ["primaryY", state.primaryY, "primaryYValue", ""], ["universalLogoScale", Math.round(state.logoScale * 100), "universalLogoScaleValue", "%"]].forEach(([id, value, output, suffix]) => { document.getElementById(id).value = value; document.getElementById(output).textContent = `${value}${suffix}`; }); }

function initialize() {
  document.documentElement.style.setProperty("--module-accent", config.palette.accent); document.documentElement.style.setProperty("--module-dark", config.palette.dark); document.documentElement.style.setProperty("--module-soft", config.palette.soft);
  document.title = `${config.name} — MDC`; document.getElementById("moduleIcon").textContent = config.icon; document.getElementById("modulePageTitle").textContent = config.name; document.getElementById("editorModuleTitle").textContent = config.name; document.getElementById("moduleDescription").textContent = config.description; document.getElementById("previewTitle").textContent = config.name.replace(" Poster Maker", "");
  document.getElementById("primaryPhotoLabel").textContent = config.photoLabels[0]; document.getElementById("secondaryPhotoLabel").textContent = config.photoLabels[1]; document.getElementById("universalSmartText").placeholder = smartPlaceholder();
  renderFields(); updateTemplateButton(); renderTemplateMenu(); updatePhotoCards(); syncRanges(); renderPoster(); window.mdcTrack?.("module_view", { selected_module: moduleId });
}

document.getElementById("universalTemplateButton").addEventListener("click", () => { const select = document.getElementById("universalTemplateSelect"); const open = select.classList.toggle("open"); document.getElementById("universalTemplateButton").setAttribute("aria-expanded", String(open)); });
document.addEventListener("click", (event) => { if (!event.target.closest("#universalTemplateSelect")) { document.getElementById("universalTemplateSelect").classList.remove("open"); document.getElementById("universalTemplateButton").setAttribute("aria-expanded", "false"); } });
document.getElementById("hideSelectedTemplate").addEventListener("click", hideSelectedTemplate);
document.getElementById("restoreTemplates").addEventListener("click", restoreTemplates);
document.getElementById("universalSmartFillButton").addEventListener("click", smartFill);
document.getElementById("primaryPhotoInput").addEventListener("change", () => handleUpload("primaryPhotoInput", "primaryPhoto"));
document.getElementById("secondaryPhotoInput").addEventListener("change", () => handleUpload("secondaryPhotoInput", "secondaryPhoto"));
document.getElementById("universalLogoInput").addEventListener("change", () => handleUpload("universalLogoInput", "logo"));
[["removePrimaryPhoto", "primaryPhoto"], ["removeSecondaryPhoto", "secondaryPhoto"], ["removeUniversalLogo", "logo"]].forEach(([id, key]) => document.getElementById(id).addEventListener("click", () => { state[key] = null; updatePhotoCards(); renderPoster(); showToast("Photo ਹਟਾ ਦਿੱਤੀ।"); }));
[["primaryScale", "primaryScale", 100, "primaryScaleValue", "%"], ["primaryX", "primaryX", 1, "primaryXValue", ""], ["primaryY", "primaryY", 1, "primaryYValue", ""], ["universalLogoScale", "logoScale", 100, "universalLogoScaleValue", "%"]].forEach(([id, key, divisor, output, suffix]) => document.getElementById(id).addEventListener("input", (event) => { state[key] = Number(event.target.value) / divisor; document.getElementById(output).textContent = `${event.target.value}${suffix}`; renderPoster(); }));
document.getElementById("universalResetButton").addEventListener("click", resetPoster);
document.getElementById("universalDownloadButton").addEventListener("click", downloadPoster);
document.getElementById("universalZoomButton").addEventListener("click", () => { renderPoster(); exportController.copyToModal(); document.getElementById("universalModal").classList.add("open"); document.getElementById("universalModal").setAttribute("aria-hidden", "false"); });
document.getElementById("universalModalClose").addEventListener("click", () => { document.getElementById("universalModal").classList.remove("open"); document.getElementById("universalModal").setAttribute("aria-hidden", "true"); });
document.getElementById("donateButton").addEventListener("click", () => { document.getElementById("donateModal").classList.add("open"); document.getElementById("donateModal").setAttribute("aria-hidden", "false"); });
document.getElementById("donateClose").addEventListener("click", () => { document.getElementById("donateModal").classList.remove("open"); document.getElementById("donateModal").setAttribute("aria-hidden", "true"); });

exportController = createPosterExportController({
  sourceCanvas: canvas,
  modalCanvas,
  toolbar: document.querySelector(".universal-preview .toolbar-actions"),
  previewNote: document.querySelector(".universal-preview .preview-note"),
  filename: safeFilename,
  showToast,
  storageKey: `mdc-${moduleId}-poster-size`,
  defaultFormat: "social"
});
initialize();
if (document.fonts?.ready) document.fonts.ready.then(renderPoster);
