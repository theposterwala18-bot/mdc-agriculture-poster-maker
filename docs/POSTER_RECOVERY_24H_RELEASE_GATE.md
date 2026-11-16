# The Poster Wala — Paid Poster 24-Hour Recovery (STAGED, NOT DEPLOYED)
Date: 2026-11-16
Deployment gate: Cloudflare R2 must be enabled in the correct account and a PRIVATE R2 binding must be attached. At the time of development GET /r2/buckets returned 403 code 10042 "Please enable R2 through the Cloudflare Dashboard."

## Current evidence and why this matters
- The shared `dist/poster-export.js` creates PNG/PDF bytes, then calls `/record-download`, then invokes a DOM anchor `link.click()` against a Blob URL.
- A successful `record-download` proves only that a download was recorded. It does NOT prove the browser saved a file to the customer's device.
- The current `owner/dashboard` queries `payments` and `daily_downloads`; no immutable poster snapshots are currently stored.
- Legacy paid orders are NOT retrospectively recoverable; this feature applies to new snapshots after rollout.
- Razorpay capture, refunds, paid limit and existing free guest / owner controls are outside this change.

## Safe product behavior required before release
1. After captured payment, the first final poster is sealed to that captured order and Firebase UID.
2. Upload PNG/PDF and a sanitized canonical editor snapshot to a private R2 bucket. Verify bytes digest and metadata, then mark D1 record "ready". No public R2 URL.
3. Re-downloading that same purchased poster during a fixed 24h period must not create another poster or consume an extra paid design entitlement. Show recovery page linked to same Google login.
4. The 24h period starts with confirmed purchase time, NOT last edit/download; never extend it.
5. Return short-lived authenticated streaming responses (Cache-Control: private, no-store, Content-Disposition: attachment) for saved file. Server-side "file served" may be recorded, but must never be represented as proof the OS/browser persisted it.
6. Add owner dispute view: order ID, UID/email, module, first save, file size/digest, number of serve attempts/responses, revision count, last result. Owner preview requires admin auth; customer consent and retention notice before upload.
7. At most 2 revisions to the exact same poster during recovery period. Protect module ID, template ID, photograph/image identity, recipient/event/customer identity, and immutable original order. Define server-enforced correction-field allowlists per module and verify the final rendition against the canonical snapshot on the server. If any editor cannot enforce this, allow re-download only, not editing, for that editor.
8. Use rate limiting and uploaded file size max 12 MiB; validate PNG/PDF signatures, MIME and SHA-256, not extension alone.
9. Immediate access expiry at 24h, with R2 lifecycle + scheduled explicit delete for cleanup (actual storage deletion may be asynchronous). Owner access must not bypass retention policy. Avoid storing raw photos in D1.
10. On R2 outage, do NOT charge a second time or consume download quota for a failed save. Provide a retry and preserve the paid order.
11. For permanently inaccessible legacy poster files, be truthful: old client designs are not available; manual support for a fresh export can be offered, with no customer data falsification.

## Required architecture
- Cloudflare R2: private bucket dedicated to ephemeral paid poster files (no public domain or r2.dev exposure).
- Cloudflare D1: additive schema `cloudflare/Poster-Recovery-v1-STAGED.sql`. This migration is NOT applied in production.
- Existing Payment Worker: add verified-user private routes for create/finalize/list/download/revision; always check `uid` and captured `payments` row. Owner-only dispute details route.
- Frontend: shared `poster-export.js` should use the save-and-recover flow; new My Posters page; per-editor typed snapshot adapters; owner Dashboard dispute panel.
- Never treat browser localStorage as ownership proof. Do not accept arbitrary edit JSON or client-provided owner email.

## Deployment gates (must all pass)
- [x] Original main branch saved as `backup/pre-poster-recovery-2026-11-16`
- [x] Existing frontend/backend source inspected; identified the current ordering bug
- [x] Additive metadata migration staged (no production schema changes)
- [x] Recovery policy and tests staged
- [ ] R2 enabled on Cloudflare account by account owner
- [ ] R2 private bucket and binding configured (verify secret/binding inheritance)
- [ ] Request-authenticated upload and retrieval routes implemented and E2E tested
- [ ] Studio-specific safe revision adapters and immutable rendering verified
- [ ] Browser/device testing on Android/iPhone/Windows and interrupted download cases
- [ ] Backup database and live Worker version; rollout to staging environment with isolated bucket and DB
- [ ] Paid/Free/Owner/Guest regression tests and rollback drill
- [ ] Publish privacy notice and obtain user consent
- [ ] Controlled production deployment

## Critical safety statement
Do NOT merge this staged branch into main or enable a partial recovery feature simply to show UI. Until all gates pass, the existing website must keep operating unchanged.

## 2026-11-16 staging continuation
- Added standalone `backend/poster-recovery-api.mjs` with authenticated list, private single-poster serve, and owner dispute lookup routes, backed by injected D1 and private R2 bindings. Not mounted on the live Payment Worker.
- Recovery sealing remains intentionally disabled (`503`) until a trusted editor adapter can prove the exact captured order, original canonical design, user consent and immutable file. Allowing arbitrary image upload would let a payer substitute a different poster and defeat the anti-abuse requirement.
- Existing customers' historical poster images cannot be recreated from payment/download records.
- Cloudflare R2 still returns error `10042`: enable R2 in the account dashboard. Do not merge or deploy before full editor support and private storage tests.
