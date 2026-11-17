# Zero-billing paid poster recovery (device-only)
Status: Candidate release; not proof of device download success.
Date: 2026-11-17.

## User-visible behavior
- Only after /record-download succeeds for a captured paid order, store an immutable PNG/PDF Blob in browser IndexedDB under verified Firebase UID, order ID, module, and filename. Up to 15 MiB per saved export.
- Show "My Recent Downloads (This Device Only)" with native Blob download links for 24 hours. Retrying an already-saved file does NOT call Razorpay, make a new poster, nor count as another paid design/download. User has to remain signed in with same Google account.
- Old entries are deleted on the user's next visit to the module after 24h; closing a browser or clearing browser data can remove them earlier, and browser storage may evict files on its own.
- If IndexedDB is unavailable or full, the normal download still proceeds; there is no backup to Cloudflare/Google or owner panel.
- The file retry is EXACT FILE ONLY: it cannot edit text. The existing editor remains available for text corrections while the original paid 30-minute / 5-download allowance permits. Clicking Save Again in the local recovery panel never changes the design.
- In particular, there is NO 24-hour FREE editing entitlement: that would permit new poster creation without securely sealed design metadata and server-enforced correction allowlists.
- Do NOT claim that server-side "record-download" establishes successful OS/device saving.
- Local storage on a shared phone is not a confidentiality guarantee; each account is filtered by UID, but browser/device administrators can inspect stored files. Customer consent/notice should be shown.

## Rollout/QA
- Automatic unit + website build tests are provided in .github/workflows/verify-local-poster-retry.yml.
- Manual QA required on Android Chrome, iOS Safari, desktop Chrome: (1) captured payment then download, (2) refresh editor, verify same file in recovery, (3) browser popup/download blocked, (4) alternate account cannot access same saved file in UI, (5) expiry >24h hidden, (6) no supported browser storage: normal download still succeeds.
- Legacy earlier customer files cannot be recovered retrospectively.
- Payment API, database, owner dashboard and previously recorded orders remain untouched.
- Backup branch backup/pre-local-poster-retry-2026-11-17.
