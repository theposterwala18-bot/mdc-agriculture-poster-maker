-- The Poster Wala: 24h recovery metadata. ADDITIVE ONLY.
-- Not active until R2 is enabled, bound privately and backend API is deployed.
-- Existing payments, users, subscriptions, and download counts are never mutated.
CREATE TABLE IF NOT EXISTS poster_recovery_orders (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  payment_order_id TEXT NOT NULL,
  payment_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  template_id TEXT,
  design_hash TEXT NOT NULL,
  design_json TEXT NOT NULL,
  poster_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL CHECK(mime_type IN ('image/png','application/pdf')),
  file_bytes INTEGER NOT NULL CHECK(file_bytes BETWEEN 1 AND 12582912),
  sha256_hex TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revision_count INTEGER NOT NULL DEFAULT 0 CHECK(revision_count BETWEEN 0 AND 2),
  state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','ready','expired','deleted')),
  UNIQUE(uid,payment_order_id)
);
CREATE INDEX IF NOT EXISTS idx_poster_recovery_uid ON poster_recovery_orders(uid,expires_at,state);
CREATE INDEX IF NOT EXISTS idx_poster_recovery_expiry ON poster_recovery_orders(state,expires_at);
CREATE TABLE IF NOT EXISTS poster_recovery_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recovery_id TEXT NOT NULL,
  uid TEXT NOT NULL,
  event TEXT NOT NULL CHECK(event IN ('upload_started','upload_confirmed','serve_attempt','serve_response','revision_requested','revision_saved','expired','purged','support_review')),
  created_at INTEGER NOT NULL,
  metadata TEXT,
  FOREIGN KEY(recovery_id) REFERENCES poster_recovery_orders(id)
);
CREATE INDEX IF NOT EXISTS idx_poster_recovery_event ON poster_recovery_events(recovery_id,created_at);
