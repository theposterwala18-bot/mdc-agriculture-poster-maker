-- Free Access Manager migration, additive only. No existing tables or user balances modified.
-- Must be applied before the new Worker version is enabled.
CREATE TABLE IF NOT EXISTS free_access_grants (
  email TEXT PRIMARY KEY COLLATE NOCASE,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_free_access_active
 ON free_access_grants(revoked_at,expires_at);
CREATE TABLE IF NOT EXISTS free_access_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('grant','revoke')),
  actor_email TEXT NOT NULL,
  expires_at INTEGER,
  happened_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_free_access_audit_email
 ON free_access_audit(email,happened_at);
