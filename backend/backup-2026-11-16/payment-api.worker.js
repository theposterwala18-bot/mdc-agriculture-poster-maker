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
    headers: { Authorization: `Basic ${authorization}`, "Content-Type": "ap --- TRUNCATED --- 44,578 chars