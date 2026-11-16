const encoder = new TextEncoder();
const decoder = new TextDecoder();

const FIREBASE_JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  };

  if (origin === env.ALLOWED_ORIGIN) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

function json(data, status, request, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(request, env),
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

async function readJson(request) {
  const contentLength = Number(request.headers.get("Content-Length") || 0);

  if (contentLength > 10000) {
    throw new Error("Request too large");
  }

  return request.json();
}

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(value) {
  const base64 = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");

  const binary = atob(base64);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

function decodeBase64UrlJson(value) {
  return JSON.parse(decoder.decode(base64UrlToBytes(value)));
}

function hexToBytes(value) {
  if (!/^[a-fA-F0-9]{64}$/.test(value)) return null;

  return Uint8Array.from(
    value.match(/.{2}/g),
    byte => parseInt(byte, 16)
  );
}

async function importHmacKey(secret, usage) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage]
  );
}

async function hmacBytes(secret, message) {
  const key = await importHmacKey(secret, "sign");
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(message)
  );

  return new Uint8Array(signature);
}

async function verifyHexHmac(secret, message, signatureHex) {
  const signature = hexToBytes(signatureHex);
  if (!signature) return false;

  const key = await importHmacKey(secret, "verify");

  return crypto.subtle.verify(
    "HMAC",
    key,
    signature,
    encoder.encode(message)
  );
}

function getBearerToken(request) {
  const authorization = request.headers.get("Authorization") || "";
  const match = authorization.match(/^Bearer\s+([^\s]+)$/i);
  return match ? match[1] : null;
}

async function getFirebasePublicKey(kid) {
  const response = await fetch(FIREBASE_JWKS_URL, {
    cf: {
      cacheEverything: true,
      cacheTtl: 3600
    }
  });

  if (!response.ok) {
    throw new Error("Unable to load Firebase signing keys");
  }

  const jwks = await response.json();
  const jwk = Array.isArray(jwks.keys)
    ? jwks.keys.find(key => key.kid === kid)
    : null;

  if (!jwk) {
    throw new Error("Firebase signing key not found");
  }

  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );
}

async function verifyFirebaseIdToken(request, env) {
  const token = getBearerToken(request);
  if (!token) {
    throw new Error("Login required");
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid login token");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  let header;
  let payload;

  try {
    header = decodeBase64UrlJson(encodedHeader);
    payload = decodeBase64UrlJson(encodedPayload);
  } catch {
    throw new Error("Invalid login token");
  }

  if (header.alg !== "RS256" || typeof header.kid !== "string") {
    throw new Error("Invalid login token");
  }

  const publicKey = await getFirebasePublicKey(header.kid);
  const signatureValid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    publicKey,
    base64UrlToBytes(encodedSignature),
    encoder.encode(`${encodedHeader}.${encodedPayload}`)
  );

  if (!signatureValid) {
    throw new Error("Invalid login token");
  }

  const projectId = env.FIREBASE_PROJECT_ID;
  const now = Math.floor(Date.now() / 1000);

  if (
    !projectId ||
    payload.aud !== projectId ||
    payload.iss !== `https://securetoken.google.com/${projectId}` ||
    typeof payload.sub !== "string" ||
    payload.sub.length === 0 ||
    payload.sub.length > 128 ||
    !Number.isFinite(payload.exp) ||
    payload.exp <= now ||
    !Number.isFinite(payload.iat) ||
    payload.iat > now + 300 ||
    (Number.isFinite(payload.auth_time) && payload.auth_time > now + 300) ||
    typeof payload.email !== "string" ||
    payload.email_verified !== true
  ) {
    throw new Error("Invalid or expired login token");
  }

  return payload;
}

async function saveUserSession(env, user) {
  if (!env.DB) {
    throw new Error("Database binding is missing");
  }

  await env.DB.prepare(
    `INSERT INTO users (
       uid, email, display_name, photo_url, created_at, last_login_at
     ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT(uid) DO UPDATE SET
       email = excluded.email,
       display_name = excluded.display_name,
       photo_url = excluded.photo_url,
       last_login_at = CURRENT_TIMESTAMP`
  )
    .bind(
      user.sub,
      user.email,
      typeof user.name === "string" ? user.name : "",
      typeof user.picture === "string" ? user.picture : ""
    )
    .run();
}

async function authSession(request, env) {
  const user = await verifyFirebaseIdToken(request, env);
  await saveUserSession(env, user);

  const ownerEmail = String(env.OWNER_EMAIL || "").trim().toLowerCase();
  const email = user.email.trim().toLowerCase();

  return json(
    {
      success: true,
      user: {
        uid: user.sub,
        email: user.email,
        displayName: typeof user.name === "string" ? user.name : "",
        photoURL: typeof user.picture === "string" ? user.picture : ""
      },
      isOwner: ownerEmail.length > 0 && email === ownerEmail
    },
    200,
    request,
    env
  );
}

async function requireOwner(request, env) {
  const user = await verifyFirebaseIdToken(request, env);
  const ownerEmail = String(env.OWNER_EMAIL || "").trim().toLowerCase();
  const email = String(user.email || "").trim().toLowerCase();

  if (!ownerEmail || email !== ownerEmail) {
    const error = new Error("Owner access required");
    throw error;
  }

  return user;
}


/* Owner-controlled temporary free download permissions. Only verified Firebase users.
 * Grant validity is checked on issuance, validation and final download recording.
 * The price, Razorpay, subscription and normal daily-free paths remain unchanged.
 */
function normalizedGrantEmail(value) {
  const email=String(value||"").trim().toLowerCase();
  if(email.length>254||! /^[a-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email)) throw new Error("Valid Google email is required");
  return email;
}
function isPermanentOwner(user,env){
  return Boolean(env.OWNER_EMAIL)&&String(user.email||"").trim().toLowerCase()===String(env.OWNER_EMAIL).trim().toLowerCase();
}
async function currentFreeGrant(user,env){
  if(isPermanentOwner(user,env))return {type:"owner-free",email:normalizedGrantEmail(user.email)};
  let email;
  try { email=normalizedGrantEmail(user.email); } catch { return null; }
  const row=await env.DB.prepare("SELECT email, expires_at FROM free_access_grants WHERE email=? AND revoked_at IS NULL AND expires_at > unixepoch() LIMIT 1").bind(email).first();
  return row?{type:"guest-free",email:row.email,expiresAt:Number(row.expires_at)}:null;
}
async function ownerFreeAccessList(request,env){
  await requireOwner(request,env);
  const rows=await env.DB.prepare("SELECT email,expires_at,revoked_at,created_at,updated_at FROM free_access_grants ORDER BY updated_at DESC").all();
  return json({success:true,ownerEmail:String(env.OWNER_EMAIL||"").trim().toLowerCase(),limit:10,grants:(rows.results||[]).map(r=>({...r,active:r.revoked_at==null&&Number(r.expires_at)>Math.floor(Date.now()/1000)}))},200,request,env);
}
async function ownerGrantFreeAccess(request,env){
  const owner=await requireOwner(request,env);
  const body=await readJson(request);
  const email=normalizedGrantEmail(body.email);
  const days=Number(body.days);
  if(!Number.isInteger(days)||days<1||days>365)throw new Error("Duration must be 1 to 365 days");
  if(email===normalizedGrantEmail(env.OWNER_EMAIL))throw new Error("Owner has permanent free access already");
  // Every grant is independent, starting when saved. Renewing starts a new duration.
  const now=Math.floor(Date.now()/1000);
  const expires=now+days*86400;
  const result=await env.DB.prepare(`
    INSERT INTO free_access_grants(email,expires_at,revoked_at,created_by,created_at,updated_at)
    SELECT ?,?,NULL,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
    WHERE (SELECT COUNT(*) FROM free_access_grants WHERE revoked_at IS NULL AND expires_at>? AND email<>?)<10
    ON CONFLICT(email) DO UPDATE SET
      expires_at=excluded.expires_at,revoked_at=NULL,updated_at=CURRENT_TIMESTAMP,
      created_by=excluded.created_by
    WHERE (SELECT COUNT(*) FROM free_access_grants WHERE revoked_at IS NULL AND expires_at>? AND email<>excluded.email)<10
  `).bind(email,expires,owner.email,now,email,now).run();
  if(!result.meta?.changes)return json({success:false,error:"Maximum 10 active guest emails allowed"},409,request,env);
  await env.DB.prepare("INSERT INTO free_access_audit(email,action,actor_email,expires_at) VALUES (?,'grant',?,?)").bind(email,owner.email,expires).run();
  return json({success:true,email,expiresAt:expires},200,request,env);
}
async function ownerRevokeFreeAccess(request,env){
  const owner=await requireOwner(request,env);
  const body=await readJson(request);
  const email=normalizedGrantEmail(body.email);
  if(email===normalizedGrantEmail(env.OWNER_EMAIL))throw new Error("Permanent owner cannot be removed");
  const result=await env.DB.prepare("UPDATE free_access_grants SET revoked_at=unixepoch(),updated_at=CURRENT_TIMESTAMP WHERE email=? AND revoked_at IS NULL").bind(email).run();
  if(result.meta?.changes)await env.DB.prepare("INSERT INTO free_access_audit(email,action,actor_email) VALUES (?,'revoke',?)").bind(email,owner.email).run();
  return json({success:true,revoked:Boolean(result.meta?.changes)},200,request,env);
}

async function getAppSettings(env) {
  const result = await env.DB.prepare(
    `SELECT setting_key, setting_value FROM app_settings`
  ).all();
  const values = Object.fromEntries(
    (result.results || []).map(row => [row.setting_key, row.setting_value])
  );
  return {
    allModulesFree: values.all_modules_free === "1",
    dailyFreeEnabled: values.daily_free_enabled !== "0",
    dailyFreeLimit: Math.max(0, Number(values.daily_free_limit || 1)),
    defaultPricePaise: Math.max(100, Number(values.default_price_paise || 2900)),
    premiumPricePaise: Math.max(100, Number(values.premium_price_paise || 4900)),
    unlockMinutes: Math.max(1, Number(values.unlock_minutes || 30)),
    paidDownloadLimit: Math.max(1, Number(values.paid_download_limit || 5))
  };
}

function indiaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

async function getModuleConfig(env, moduleId, settings) {
  const row = await env.DB.prepare(
    `SELECT module_id, display_name, is_enabled, is_free, price_paise,
            offer_price_paise, offer_ends_at, is_premium
       FROM module_settings WHERE module_id = ? LIMIT 1`
  ).bind(moduleId).first();
  const offerActive = row?.offer_price_paise != null &&
    (!row.offer_ends_at || new Date(row.offer_ends_at).getTime() > Date.now());
  return {
    moduleId,
    displayName: row?.display_name || moduleId,
    enabled: row ? Number(row.is_enabled) === 1 : true,
    free: settings.allModulesFree || (row ? Number(row.is_free) === 1 : false),
    premium: row ? Number(row.is_premium) === 1 : false,
    amount: offerActive
      ? Number(row.offer_price_paise)
      : Number(row?.price_paise || settings.defaultPricePaise)
  };
}

async function createAccessToken(env, user, moduleId, accessType, extra = {}) {
  const payload = {
    version: 3,
    uid: user.sub,
    moduleId,
    accessType,
    expiresAt: Math.floor(Date.now() / 1000) + 10 * 60,
    ...extra
  };
  const encoded = bytesToBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await hmacBytes(env.DOWNLOAD_TOKEN_SECRET, encoded);
  return `${encoded}.${bytesToBase64Url(signature)}`;
}

async function checkDownloadAccess(request, env) {
  const user = await verifyFirebaseIdToken(request, env);
  await saveUserSession(env, user);
  const body = await readJson(request);
  const moduleId = typeof body.module === "string" ? body.module.trim().slice(0, 80) : "";
  const format = typeof body.format === "string" ? body.format.trim().slice(0, 40) : "";
  if (!moduleId || !format) {
    return json({ success: false, error: "Module and format are required" }, 400, request, env);
  }

  const settings = await getAppSettings(env);
  const moduleConfig = await getModuleConfig(env, moduleId, settings);
  if (!moduleConfig.enabled) {
    return json({ success: false, error: "This poster module is currently disabled" }, 403, request, env);
  }

  const grant=await currentFreeGrant(user,env);
  if(grant){
    const token=await createAccessToken(env,user,moduleId,grant.type,{grantEmail:grant.email});
    return json({success:true,access:grant.type,token},200,request,env);
  }

  const subscription = await env.DB.prepare(
    `SELECT us.id, us.download_limit, us.downloads_used, sp.included_modules,
            sp.includes_premium
       FROM user_subscriptions us
       JOIN subscription_plans sp ON sp.id = us.plan_id
      WHERE us.uid = ? AND us.status = 'active'
        AND us.starts_at <= CURRENT_TIMESTAMP AND us.expires_at > CURRENT_TIMESTAMP
        AND sp.is_enabled = 1
      ORDER BY us.expires_at DESC LIMIT 1`
  ).bind(user.sub).first();

  if (subscription) {
    const modules = String(subscription.included_modules || "*").split(",").map(v => v.trim());
    const includesModule = modules.includes("*") || modules.includes(moduleId);
    const withinLimit = subscription.download_limit == null ||
      Number(subscription.downloads_used) < Number(subscription.download_limit);
    const premiumAllowed = !moduleConfig.premium || Number(subscription.includes_premium) === 1;
    if (includesModule && withinLimit && premiumAllowed) {
      const token = await createAccessToken(env, user, moduleId, "subscription", {
        subscriptionId: Number(subscription.id)
      });
      return json({ success: true, access: "subscription", token }, 200, request, env);
    }
  }

  if (moduleConfig.free) {
    const token = await createAccessToken(env, user, moduleId, "module-free");
    return json({ success: true, access: "module-free", token }, 200, request, env);
  }

  const isPng = format !== "a4-pdf" && !format.toLowerCase().includes("pdf");
  if (settings.dailyFreeEnabled && settings.dailyFreeLimit > 0 && isPng) {
    const today = indiaDate();
    const used = await env.DB.prepare(
      `SELECT COUNT(*) AS total FROM daily_downloads
        WHERE uid = ? AND download_date = ? AND access_type = 'daily-free'`
    ).bind(user.sub, today).first();
    if (Number(used?.total || 0) < settings.dailyFreeLimit) {
      const token = await createAccessToken(env, user, moduleId, "daily-free", {
        dailyDate: today,
        dailyLimit: settings.dailyFreeLimit
      });
      return json({
        success: true,
        access: "daily-free",
        token,
        remainingAfterDownload: settings.dailyFreeLimit - Number(used?.total || 0) - 1
      }, 200, request, env);
    }
  }

  return json({
    success: true,
    access: "payment-required",
    amount: moduleConfig.premium ? settings.premiumPricePaise : moduleConfig.amount,
    currency: "INR",
    unlockMinutes: settings.unlockMinutes
  }, 200, request, env);
}

async function ownerDashboard(request, env) {
  await requireOwner(request, env);

  const [summary, payments, downloads] = await Promise.all([
    env.DB.prepare(
      `SELECT
         (SELECT COUNT(*) FROM users) AS total_users,
         (SELECT COUNT(*) FROM payments) AS total_orders,
         (SELECT COUNT(*) FROM payments WHERE status = 'captured') AS captured_payments,
         (SELECT COALESCE(SUM(amount_paise), 0) FROM payments WHERE status = 'captured') AS captured_amount_paise,
         (SELECT COUNT(*) FROM daily_downloads) AS total_downloads`
    ).first(),
    env.DB.prepare(
      `SELECT
         p.order_id,
         p.payment_id,
         p.uid,
         u.email,
         u.display_name,
         p.module_id,
         p.amount_paise,
         p.status,
         p.unlock_expires_at,
         p.created_at,
         p.updated_at,
         (SELECT COUNT(*) FROM daily_downloads d
          WHERE d.uid = p.uid
            AND d.module_id = p.module_id
            AND d.created_at >= p.created_at
            AND d.created_at < COALESCE(
              (SELECT MIN(p2.created_at) FROM payments p2
               WHERE p2.uid = p.uid
                 AND p2.module_id = p.module_id
                 AND p2.created_at > p.created_at),
              '9999-12-31 23:59:59'
            )) AS download_count
       FROM payments p
       LEFT JOIN users u ON u.uid = p.uid
       ORDER BY p.created_at DESC
       LIMIT 100`
    ).all(),
    env.DB.prepare(
      `SELECT
         d.id,
         d.uid,
         u.email,
         u.display_name,
         d.download_date,
         d.module_id,
         d.file_type,
         d.created_at
       FROM daily_downloads d
       LEFT JOIN users u ON u.uid = d.uid
       ORDER BY d.id DESC
       LIMIT 100`
    ).all()
  ]);

  return json(
    {
      success: true,
      summary: summary || {},
      payments: payments.results || [],
      downloads: downloads.results || []
    },
    200,
    request,
    env
  );
}

const OWNER_SETTING_RULES = {
  all_modules_free: { min: 0, max: 1 },
  daily_free_enabled: { min: 0, max: 1 },
  daily_free_limit: { min: 0, max: 100 },
  default_price_paise: { min: 100, max: 10000000 },
  premium_price_paise: { min: 100, max: 10000000 },
  unlock_minutes: { min: 1, max: 10080 },
  paid_download_limit: { min: 1, max: 1000 }
};

function boundedInteger(value, rule, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < rule.min || number > rule.max) {
    throw new Error(`${label} is invalid`);
  }
  return number;
}

function optionalOfferEnd(value) {
  if (value == null || String(value).trim() === "") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Offer end date is invalid");
  return date.toISOString();
}

async function ownerConfig(request, env) {
  await requireOwner(request, env);
  const [settings, modules, plans] = await Promise.all([
    env.DB.prepare(`SELECT setting_key, setting_value, updated_at FROM app_settings ORDER BY setting_key`).all(),
    env.DB.prepare(`SELECT module_id, display_name, is_enabled, is_free, price_paise,
      offer_price_paise, offer_ends_at, is_premium, updated_at
      FROM module_settings ORDER BY display_name`).all(),
    env.DB.prepare(`SELECT id, plan_code, display_name, is_enabled, price_paise,
      duration_days, download_limit, included_modules, includes_premium,
      offer_price_paise, offer_ends_at, sort_order, updated_at
      FROM subscription_plans ORDER BY sort_order, id`).all()
  ]);
  return json({
    success: true,
    mode: env.PAYMENT_MODE || "test",
    settings: Object.fromEntries((settings.results || []).map(row => [row.setting_key, row.setting_value])),
    modules: modules.results || [],
    plans: plans.results || []
  }, 200, request, env);
}

async function saveOwnerConfig(request, env) {
  await requireOwner(request, env);
  const body = await readJson(request);
  const statements = [];

  if (body.settings && typeof body.settings === "object") {
    for (const [key, rule] of Object.entries(OWNER_SETTING_RULES)) {
      if (!(key in body.settings)) continue;
      const value = boundedInteger(body.settings[key], rule, key);
      statements.push(env.DB.prepare(
        `INSERT INTO app_settings(setting_key, setting_value, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(setting_key) DO UPDATE SET
           setting_value = excluded.setting_value, updated_at = CURRENT_TIMESTAMP`
      ).bind(key, String(value)));
    }
  }
  if (
    body.settings &&
    typeof body.settings === "object" &&
    Object.prototype.hasOwnProperty.call(body.settings, "promo_cards_json")
  ) {
    const rawPromos = String(body.settings.promo_cards_json || "");

    if (rawPromos.length > 12000) {
      throw new Error("Promotions data is too large");
    }

    let promos;

    try {
      promos = JSON.parse(rawPromos);
    } catch {
      throw new Error("Promotions data is invalid");
    }

    if (!Array.isArray(promos) || promos.length > 20) {
      throw new Error("Promotions list is invalid");
    }

    statements.push(
      env.DB.prepare(`
        INSERT INTO app_settings(setting_key, setting_value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(setting_key) DO UPDATE SET
          setting_value = excluded.setting_value,
          updated_at = CURRENT_TIMESTAMP
      `).bind("promo_cards_json", JSON.stringify(promos))
    );
  }
  if (Array.isArray(body.modules)) {
    for (const item of body.modules.slice(0, 200)) {
      const moduleId = String(item.module_id || "").trim().slice(0, 80);
      const displayName = String(item.display_name || moduleId).trim().slice(0, 120);
      if (!moduleId || !displayName) throw new Error("Module ID and name are required");
      const price = boundedInteger(item.price_paise, { min: 100, max: 10000000 }, "Module price");
      const offer = item.offer_price_paise == null || item.offer_price_paise === ""
        ? null
        : boundedInteger(item.offer_price_paise, { min: 100, max: price }, "Module offer price");
      statements.push(env.DB.prepare(
        `INSERT INTO module_settings(module_id, display_name, is_enabled, is_free,
          price_paise, offer_price_paise, offer_ends_at, is_premium, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(module_id) DO UPDATE SET display_name = excluded.display_name,
          is_enabled = excluded.is_enabled, is_free = excluded.is_free,
          price_paise = excluded.price_paise, offer_price_paise = excluded.offer_price_paise,
          offer_ends_at = excluded.offer_ends_at, is_premium = excluded.is_premium,
          updated_at = CURRENT_TIMESTAMP`
      ).bind(moduleId, displayName, item.is_enabled ? 1 : 0, item.is_free ? 1 : 0,
        price, offer, optionalOfferEnd(item.offer_ends_at), item.is_premium ? 1 : 0));
    }
  }

  if (Array.isArray(body.plans)) {
    for (const item of body.plans.slice(0, 20)) {
      const id = boundedInteger(item.id, { min: 1, max: 1000000 }, "Plan ID");
      const displayName = String(item.display_name || "").trim().slice(0, 120);
      if (!displayName) throw new Error("Plan name is required");
      const price = boundedInteger(item.price_paise, { min: 100, max: 100000000 }, "Plan price");
      const offer = item.offer_price_paise == null || item.offer_price_paise === ""
        ? null
        : boundedInteger(item.offer_price_paise, { min: 100, max: price }, "Plan offer price");
      const limit = item.download_limit == null || item.download_limit === ""
        ? null
        : boundedInteger(item.download_limit, { min: 1, max: 1000000 }, "Plan download limit");
      statements.push(env.DB.prepare(
        `UPDATE subscription_plans SET display_name = ?, is_enabled = ?, price_paise = ?,
          duration_days = ?, download_limit = ?, included_modules = ?, includes_premium = ?,
          offer_price_paise = ?, offer_ends_at = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).bind(displayName, item.is_enabled ? 1 : 0, price,
        boundedInteger(item.duration_days, { min: 1, max: 3650 }, "Plan duration"), limit,
        String(item.included_modules || "*").trim().slice(0, 1000) || "*",
        item.includes_premium ? 1 : 0, offer, optionalOfferEnd(item.offer_ends_at),
        boundedInteger(item.sort_order ?? 0, { min: 0, max: 10000 }, "Plan sort order"), id));
    }
  }

  if (!statements.length) throw new Error("No valid settings were supplied");
  await env.DB.batch(statements);
  return json({ success: true, saved: statements.length }, 200, request, env);
}

async function publicConfig(request, env) {
  const settings = await getAppSettings(env);
  const plans = await env.DB.prepare(
    `SELECT id, plan_code, display_name, price_paise, duration_days, download_limit,
      included_modules, includes_premium, offer_price_paise, offer_ends_at
     FROM subscription_plans WHERE is_enabled = 1 ORDER BY sort_order, id`
  ).all();
  return json({ success: true, mode: env.PAYMENT_MODE || "test", settings: {
    dailyFreeEnabled: settings.dailyFreeEnabled,
    dailyFreeLimit: settings.dailyFreeLimit,
    defaultPricePaise: settings.defaultPricePaise,
    premiumPricePaise: settings.premiumPricePaise,
    unlockMinutes: settings.unlockMinutes,
    paidDownloadLimit: settings.paidDownloadLimit
  }, plans: plans.results || [] }, 200, request, env);
}

async function createSubscriptionOrder(request, env) {
  const user = await verifyFirebaseIdToken(request, env);
  await saveUserSession(env, user);
  const body = await readJson(request);
  const planId = Number(body.planId);
  if (!Number.isInteger(planId) || planId < 1) {
    return json({ success: false, error: "Valid subscription plan is required" }, 400, request, env);
  }
  const plan = await env.DB.prepare(
    `SELECT id, plan_code, display_name, price_paise, duration_days, download_limit,
      included_modules, includes_premium, offer_price_paise, offer_ends_at
     FROM subscription_plans WHERE id = ? AND is_enabled = 1 LIMIT 1`
  ).bind(planId).first();
  if (!plan) return json({ success: false, error: "Subscription plan is unavailable" }, 404, request, env);
  const offerActive = plan.offer_price_paise != null &&
    (!plan.offer_ends_at || new Date(plan.offer_ends_at).getTime() > Date.now());
  const amount = Number(offerActive ? plan.offer_price_paise : plan.price_paise);
  const authorization = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
  const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${authorization}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount, currency: "INR",
      receipt: `tpw_sub_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
      notes: { product: "The Poster Wala subscription", plan_code: plan.plan_code,
        user_uid: user.sub, mode: env.PAYMENT_MODE || "test" } })
  });
  if (!razorpayResponse.ok) return json({ success: false, error: "Unable to create subscription order" }, 502, request, env);
  const order = await razorpayResponse.json();
  await env.DB.prepare(
    `INSERT INTO subscription_orders(order_id, uid, plan_id, amount_paise, status)
     VALUES (?, ?, ?, ?, 'created')`
  ).bind(order.id, user.sub, plan.id, amount).run();
  return json({ success: true, keyId: env.RAZORPAY_KEY_ID, orderId: order.id,
    amount, currency: "INR", businessName: "The Poster Wala",
    description: plan.display_name, planId: plan.id, mode: env.PAYMENT_MODE || "test" }, 200, request, env);
}

async function verifySubscriptionPayment(request, env) {
  const user = await verifyFirebaseIdToken(request, env);
  const body = await readJson(request);
  const paymentId = String(body.razorpay_payment_id || "");
  const orderId = String(body.razorpay_order_id || "");
  const signature = String(body.razorpay_signature || "");
  if (!paymentId || !orderId || !signature) return json({ success: false, error: "Missing payment details" }, 400, request, env);
  const saved = await env.DB.prepare(
    `SELECT so.uid, so.plan_id, so.amount_paise, so.status, sp.duration_days,
      sp.download_limit FROM subscription_orders so
      JOIN subscription_plans sp ON sp.id = so.plan_id
      WHERE so.order_id = ? LIMIT 1`
  ).bind(orderId).first();
  if (!saved || saved.uid !== user.sub) return json({ success: false, error: "Subscription order is invalid" }, 403, request, env);
  if (saved.status === "captured") return json({ success: true, alreadyActive: true }, 200, request, env);
  const signatureValid = await verifyHexHmac(env.RAZORPAY_KEY_SECRET, `${orderId}|${paymentId}`, signature);
  if (!signatureValid) return json({ success: false, error: "Payment signature verification failed" }, 401, request, env);
  const authorization = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
  const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`,
    { headers: { Authorization: `Basic ${authorization}` } });
  if (!response.ok) return json({ success: false, error: "Unable to confirm subscription payment" }, 502, request, env);
  const payment = await response.json();
  if (payment.order_id !== orderId || Number(payment.amount) !== Number(saved.amount_paise) ||
      payment.currency !== "INR" || payment.status !== "captured") {
    return json({ success: false, error: "Subscription payment is not captured" }, 409, request, env);
  }
  await env.DB.batch([
    env.DB.prepare(`UPDATE user_subscriptions SET status = 'expired', updated_at = CURRENT_TIMESTAMP
      WHERE uid = ? AND status = 'active'`).bind(user.sub),
    env.DB.prepare(`INSERT INTO user_subscriptions(uid, plan_id, payment_id, starts_at,
      expires_at, status, download_limit, downloads_used)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, datetime('now', ?), 'active', ?, 0)`)
      .bind(user.sub, saved.plan_id, paymentId, `+${Number(saved.duration_days)} days`, saved.download_limit),
    env.DB.prepare(`UPDATE subscription_orders SET payment_id = ?, status = 'captured',
      updated_at = CURRENT_TIMESTAMP WHERE order_id = ?`).bind(paymentId, orderId)
  ]);
  return json({ success: true, active: true, durationDays: Number(saved.duration_days) }, 200, request, env);
}

async function createUnlockToken(env, payment, user, moduleId) {
  const settings = await getAppSettings(env);
  const unlockMinutes = settings.unlockMinutes;

  const payload = {
    version: 2,
    uid: user.sub,
    moduleId,
    paymentId: payment.id,
    orderId: payment.order_id,
    amount: payment.amount,
    expiresAt: Math.floor(Date.now() / 1000) + unlockMinutes * 60
  };

  const encodedPayload = bytesToBase64Url(
    encoder.encode(JSON.stringify(payload))
  );

  const signature = await hmacBytes(
    env.DOWNLOAD_TOKEN_SECRET,
    encodedPayload
  );

  return `${encodedPayload}.${bytesToBase64Url(signature)}`;
}

async function validateUnlockToken(env, token, expectedUid) {
  if (typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encodedPayload, encodedSignature] = parts;

  try {
    const key = await importHmacKey(
      env.DOWNLOAD_TOKEN_SECRET,
      "verify"
    );

    const validSignature = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToBytes(encodedSignature),
      encoder.encode(encodedPayload)
    );

    if (!validSignature) return null;

    const payload = JSON.parse(
      decoder.decode(base64UrlToBytes(encodedPayload))
    );

    const now = Math.floor(Date.now() / 1000);
    if (
      payload.version !== 2 ||
      typeof payload.uid !== "string" ||
      payload.uid !== expectedUid ||
      typeof payload.moduleId !== "string" ||
      payload.moduleId.length === 0 ||
      !payload.paymentId ||
      !payload.orderId ||
      !Number.isInteger(payload.amount) ||
      payload.amount < 100 ||
      !Number.isFinite(payload.expiresAt) ||
      payload.expiresAt <= now
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

async function validateAccessToken(env, token, expectedUid) {
  const paid = await validateUnlockToken(env, token, expectedUid);
  if (paid) return { ...paid, accessType: "paid" };
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  try {
    const key = await importHmacKey(env.DOWNLOAD_TOKEN_SECRET, "verify");
    const valid = await crypto.subtle.verify(
      "HMAC", key, base64UrlToBytes(parts[1]), encoder.encode(parts[0])
    );
    if (!valid) return null;
    const payload = JSON.parse(decoder.decode(base64UrlToBytes(parts[0])));
    if (
      payload.version !== 3 || payload.uid !== expectedUid ||
      typeof payload.moduleId !== "string" || !payload.moduleId ||
      !["daily-free", "module-free", "subscription", "owner-free", "guest-free"].includes(payload.accessType) ||
      !Number.isFinite(payload.expiresAt) || payload.expiresAt <= Math.floor(Date.now() / 1000)
    ) return null;
    if(payload.accessType==="owner-free" || payload.accessType==="guest-free"){
      // UID and token signature are already verified; recheck live permission.
      const row=await env.DB.prepare("SELECT email FROM users WHERE uid=? LIMIT 1").bind(expectedUid).first();
      const email=String(row?.email||"").trim().toLowerCase();
      if(!email||payload.grantEmail!==email)return null;
      if(payload.accessType==="owner-free"){
        if(email!==String(env.OWNER_EMAIL||"").trim().toLowerCase())return null;
      }else{
        const allowed=await env.DB.prepare("SELECT 1 AS allowed FROM free_access_grants WHERE email=? AND revoked_at IS NULL AND expires_at>unixepoch() LIMIT 1").bind(email).first();
        if(!allowed)return null;
      }
    }
    return payload;
  } catch {
    return null;
  }
}

async function createOrder(request, env) {
  const user = await verifyFirebaseIdToken(request, env);
  await saveUserSession(env, user);
  const body = await readJson(request);
  const moduleId = typeof body.module === "string"
    ? body.module.trim().slice(0, 80)
    : "";

  if (!moduleId) {
    return json(
      { success: false, error: "Poster module is required" },
      400,
      request,
      env
    );
  }
  const settings = await getAppSettings(env);
  const moduleConfig = await getModuleConfig(env, moduleId, settings);
  const amount = moduleConfig.premium ? settings.premiumPricePaise : moduleConfig.amount;

  if (!Number.isInteger(amount) || amount < 100) {
    return json(
      { success: false, error: "Invalid server payment amount" },
      500,
      request,
      env
    );
  }

  const authorization = btoa(
    `${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`
  );

  const razorpayResponse = await fetch(
    "https://api.razorpay.com/v1/orders",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${authorization}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt: `tpw_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
        notes: {
          product: "The Poster Wala poster download",
          mode: env.PAYMENT_MODE || "test",
          user_uid: user.sub
        }
      })
    }
  );

  if (!razorpayResponse.ok) {
    return json(
      { success: false, error: "Unable to create payment order" },
      502,
      request,
      env
    );
  }

  const order = await razorpayResponse.json();

  await env.DB.prepare(
    `INSERT INTO payments (
       order_id, uid, module_id, amount_paise, status, created_at, updated_at
     ) VALUES (?, ?, ?, ?, 'created', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT(order_id) DO UPDATE SET
       uid = excluded.uid,
       module_id = excluded.module_id,
       amount_paise = excluded.amount_paise,
       status = 'created',
       updated_at = CURRENT_TIMESTAMP`
  )
    .bind(
      order.id,
      user.sub,
      moduleId,
      order.amount
    )
    .run();

  return json(
    {
      success: true,
      keyId: env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      businessName: "The Poster Wala",
      description: `Poster download – ${settings.unlockMinutes} minute access`,
      mode: env.PAYMENT_MODE || "test"
    },
    200,
    request,
    env
  );
}

async function verifyPayment(request, env) {
  const user = await verifyFirebaseIdToken(request, env);
  const body = await readJson(request);

  const paymentId = body.razorpay_payment_id;
  const orderId = body.razorpay_order_id;
  const signature = body.razorpay_signature;

  if (!paymentId || !orderId || !signature) {
    return json(
      { success: false, error: "Missing payment verification details" },
      400,
      request,
      env
    );
  }

  const savedOrder = await env.DB.prepare(
    `SELECT uid, module_id, amount_paise FROM payments WHERE order_id = ? LIMIT 1`
  )
    .bind(orderId)
    .first();

  if (!savedOrder || savedOrder.uid !== user.sub) {
    return json(
      { success: false, error: "Payment order does not belong to this user" },
      403,
      request,
      env
    );
  }

  const signatureValid = await verifyHexHmac(
    env.RAZORPAY_KEY_SECRET,
    `${orderId}|${paymentId}`,
    signature
  );

  if (!signatureValid) {
    return json(
      { success: false, error: "Payment signature verification failed" },
      401,
      request,
      env
    );
  }

  const authorization = btoa(
    `${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`
  );

  const paymentResponse = await fetch(
    `https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`,
    {
      headers: {
        Authorization: `Basic ${authorization}`
      }
    }
  );

  if (!paymentResponse.ok) {
    return json(
      { success: false, error: "Unable to confirm payment" },
      502,
      request,
      env
    );
  }

  const payment = await paymentResponse.json();
  const requiredAmount = Number(savedOrder.amount_paise);

  if (
    payment.order_id !== orderId ||
    payment.amount !== requiredAmount ||
    payment.currency !== "INR" ||
    payment.status !== "captured"
  ) {
    return json(
      { success: false, error: "Payment is not captured or amount is invalid" },
      402,
      request,
      env
    );
  }

  const settings = await getAppSettings(env);
  await env.DB.prepare(
    `UPDATE payments SET
       payment_id = ?,
       status = 'captured',
       unlock_expires_at = datetime('now', ?),
       updated_at = CURRENT_TIMESTAMP
     WHERE order_id = ? AND uid = ?`
  )
    .bind(
      payment.id,
      `+${settings.unlockMinutes} minutes`,
      orderId,
      user.sub
    )
    .run();

  const token = await createUnlockToken(
    env,
    payment,
    user,
    savedOrder.module_id
  );

  return json(
    {
      success: true,
      token,
      expiresInMinutes: settings.unlockMinutes
    },
    200,
    request,
    env
  );
}

async function validateToken(request, env) {
  const user = await verifyFirebaseIdToken(request, env);
  const body = await readJson(request);
  const candidate = await validateAccessToken(env, body.token, user.sub);
  // Preserve existing customer free/subscription caching semantics: only paid tokens
  // and the new owner's grants are reusable here.
  const payload = candidate && ["paid","owner-free","guest-free"].includes(candidate.accessType)
    ? candidate : null;

  if (!payload) {
    return json(
      { success: false, error: "Download access is invalid or expired" },
      401,
      request,
      env
    );
  }

  return json(
    {
      success: true,
      expiresAt: payload.expiresAt,
      moduleId: payload.moduleId
    },
    200,
    request,
    env
  );
}

async function recoverAccess(request, env) {
  const user = await verifyFirebaseIdToken(request, env);
  const body = await readJson(request);
  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  const moduleId = typeof body.module === "string" ? body.module.trim() : "";

  if (!/^order_[A-Za-z0-9]+$/.test(orderId) || !moduleId) {
    return json({ success: false, error: "Valid Order ID is required" }, 400, request, env);
  }

  const payment = await env.DB.prepare(
    `SELECT payment_id AS id, order_id, module_id, amount_paise AS amount
       FROM payments
      WHERE order_id = ?
        AND uid = ?
        AND module_id = ?
        AND status = 'captured'
        AND created_at >= datetime('now', '-24 hours')
      LIMIT 1`
  )
    .bind(orderId, user.sub, moduleId)
    .first();

  if (!payment) {
    return json(
      { success: false, error: "Payment recovery is unavailable or older than 24 hours" },
      404,
      request,
      env
    );
  }

  const count = await env.DB.prepare(
    `SELECT COUNT(*) AS total FROM daily_downloads WHERE payment_id = ?`
  )
    .bind(payment.id)
    .first();
  const downloadsUsed = Number(count?.total || 0);

  const settings = await getAppSettings(env);
  if (downloadsUsed >= settings.paidDownloadLimit) {
    return json(
      { success: false, error: `This payment has reached the ${settings.paidDownloadLimit}-download limit` },
      429,
      request,
      env
    );
  }

  const token = await createUnlockToken(env, payment, user, payment.module_id);

  return json(
    {
      success: true,
      token,
      orderId: payment.order_id,
      moduleId: payment.module_id,
      downloadsUsed,
      downloadsRemaining: settings.paidDownloadLimit - downloadsUsed,
      expiresInMinutes: settings.unlockMinutes
    },
    200,
    request,
    env
  );
}

async function recordDownload(request, env) {
  const user = await verifyFirebaseIdToken(request, env);
  const body = await readJson(request);
  const payload = await validateAccessToken(env, body.token, user.sub);

  if (!payload) {
    return json(
      { success: false, error: "Download access is invalid or expired" },
      401,
      request,
      env
    );
  }

  if (body.module !== payload.moduleId) {
    return json(
      { success: false, error: "This payment belongs to a different poster module" },
      403,
      request,
      env
    );
  }

  const format = typeof body.format === "string" ? body.format.slice(0, 40) : "unknown";

  const settings = await getAppSettings(env);

  if(payload.accessType==="owner-free" || payload.accessType==="guest-free"){
    // Atomic insert is guarded by live guest grant at the moment the download is recorded.
    const email=String(user.email||"").trim().toLowerCase();
    const owner=payload.accessType==="owner-free"&&isPermanentOwner(user,env);
    if(!owner&&payload.accessType!=="guest-free")return json({success:false,error:"Free access expired or removed"},403,request,env);
    const result=await env.DB.prepare(`
      INSERT INTO daily_downloads(uid,payment_id,subscription_id,download_date,module_id,file_type,access_type,created_at)
      SELECT ?,NULL,NULL,?,?,?,?,CURRENT_TIMESTAMP
      WHERE ?=1 OR EXISTS(SELECT 1 FROM free_access_grants WHERE email=? AND revoked_at IS NULL AND expires_at>unixepoch())
    `).bind(user.sub,indiaDate(),payload.moduleId,format,payload.accessType,owner?1:0,email).run();
    if(!result.meta?.changes)return json({success:false,error:"Free access expired or removed"},403,request,env);
    return json({success:true,access:payload.accessType},200,request,env);
  }

  if (payload.accessType === "daily-free") {
    const today = indiaDate();
    if (payload.dailyDate !== today) {
      return json({ success: false, error: "Daily free access has expired" }, 401, request, env);
    }
    const result = await env.DB.prepare(
      `INSERT INTO daily_downloads (
         uid, payment_id, subscription_id, download_date, module_id,
         file_type, access_type, created_at
       )
       SELECT ?, NULL, NULL, ?, ?, ?, 'daily-free', CURRENT_TIMESTAMP
       WHERE (SELECT COUNT(*) FROM daily_downloads
              WHERE uid = ? AND download_date = ? AND access_type = 'daily-free') < ?`
    ).bind(
      user.sub, today, payload.moduleId, format,
      user.sub, today, settings.dailyFreeLimit
    ).run();
    if (!result.meta?.changes) {
      return json({ success: false, error: "Today's free PNG limit is finished" }, 429, request, env);
    }
    return json({ success: true, access: "daily-free" }, 200, request, env);
  }

  if (payload.accessType === "module-free") {
    await env.DB.prepare(
      `INSERT INTO daily_downloads (
         uid, payment_id, subscription_id, download_date, module_id,
         file_type, access_type, created_at
       ) VALUES (?, NULL, NULL, ?, ?, ?, 'module-free', CURRENT_TIMESTAMP)`
    ).bind(user.sub, indiaDate(), payload.moduleId, format).run();
    return json({ success: true, access: "module-free" }, 200, request, env);
  }

  if (payload.accessType === "subscription") {
    const subscription = await env.DB.prepare(
      `SELECT id, download_limit, downloads_used FROM user_subscriptions
        WHERE id = ? AND uid = ? AND status = 'active'
          AND starts_at <= CURRENT_TIMESTAMP AND expires_at > CURRENT_TIMESTAMP`
    ).bind(payload.subscriptionId, user.sub).first();
    if (!subscription || (subscription.download_limit != null &&
        Number(subscription.downloads_used) >= Number(subscription.download_limit))) {
      return json({ success: false, error: "Subscription access is unavailable" }, 403, request, env);
    }
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO daily_downloads (
           uid, payment_id, subscription_id, download_date, module_id,
           file_type, access_type, created_at
         ) VALUES (?, NULL, ?, ?, ?, ?, 'subscription', CURRENT_TIMESTAMP)`
      ).bind(user.sub, subscription.id, indiaDate(), payload.moduleId, format),
      env.DB.prepare(
        `UPDATE user_subscriptions SET downloads_used = downloads_used + 1,
          updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      ).bind(subscription.id)
    ]);
    return json({ success: true, access: "subscription" }, 200, request, env);
  }

  const count = await env.DB.prepare(
    `SELECT COUNT(*) AS total
       FROM daily_downloads
      WHERE payment_id = ?`
  )
    .bind(payload.paymentId)
    .first();

  if (Number(count?.total || 0) >= settings.paidDownloadLimit) {
    return json(
      { success: false, error: `This payment has reached the ${settings.paidDownloadLimit}-download limit` },
      429,
      request,
      env
    );
  }

  await env.DB.prepare(
    `INSERT INTO daily_downloads (
       uid, payment_id, download_date, module_id, file_type, access_type, created_at
     )
     SELECT ?, ?, ?, ?, ?, 'paid', CURRENT_TIMESTAMP
     WHERE NOT EXISTS (
       SELECT 1 FROM daily_downloads
       WHERE uid = ?
         AND payment_id = ?
         AND module_id = ?
         AND file_type = ?
         AND created_at >= datetime('now', '-5 seconds')
     )`
  )
    .bind(
      user.sub,
      payload.paymentId,
      indiaDate(),
      payload.moduleId,
      format,
      user.sub,
      payload.paymentId,
      payload.moduleId,
      format
    )
    .run();

  return json({ success: true }, 200, request, env);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      if (request.headers.get("Origin") !== env.ALLOWED_ORIGIN) {
        return new Response(null, { status: 403 });
      }

      return new Response(null, {
        status: 204,
        headers: corsHeaders(request, env)
      });
    }

    if (request.method === "GET" && url.pathname === "/") {
      return json(
        {
          success: true,
          service: "The Poster Wala Payment API",
          mode: env.PAYMENT_MODE || "test",
          auth: "firebase",
          database: Boolean(env.DB)
        },
        200,
        request,
        env
      );
    }

    if (request.method === "POST") {
      if (request.headers.get("Origin") !== env.ALLOWED_ORIGIN) {
        return json(
          { success: false, error: "Origin not allowed" },
          403,
          request,
          env
        );
      }

      try {
        if (url.pathname === "/auth/session") {
          return await authSession(request, env);
        }

        if (url.pathname === "/access/check") {
          return await checkDownloadAccess(request, env);
        }

        if (url.pathname === "/create-order") {
          return await createOrder(request, env);
        }

        if (url.pathname === "/subscription/create-order") {
          return await createSubscriptionOrder(request, env);
        }

        if (url.pathname === "/subscription/verify-payment") {
          return await verifySubscriptionPayment(request, env);
        }

        if (url.pathname === "/verify-payment") {
          return await verifyPayment(request, env);
        }

        if (url.pathname === "/validate-token") {
          return await validateToken(request, env);
        }

        if (url.pathname === "/recover-access") {
          return await recoverAccess(request, env);
        }

        if (url.pathname === "/record-download") {
          return await recordDownload(request, env);
        }

        if (url.pathname === "/owner/dashboard") {
          return await ownerDashboard(request, env);
        }

        if(url.pathname==="/owner/free-access/list")return await ownerFreeAccessList(request,env);
        if(url.pathname==="/owner/free-access/grant")return await ownerGrantFreeAccess(request,env);
        if(url.pathname==="/owner/free-access/revoke")return await ownerRevokeFreeAccess(request,env);

        if (url.pathname === "/owner/config") {
          return await ownerConfig(request, env);
        }

        if (url.pathname === "/owner/config/save") {
          return await saveOwnerConfig(request, env);
        }

        if (url.pathname === "/public/config") {
          return await publicConfig(request, env);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Invalid request";
        const isAuthError = /login token|login required/i.test(message);
        const isOwnerError = /owner access required/i.test(message);

        return json(
          { success: false, error: isAuthError || isOwnerError ? message : "Invalid request" },
          isOwnerError ? 403 : isAuthError ? 401 : 400,
          request,
          env
        );
      }
    }

    return json(
      { success: false, error: "Not found" },
      404,
      request,
      env
    );
  }
};
