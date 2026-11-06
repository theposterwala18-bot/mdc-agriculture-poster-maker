# Wedding Studio + Template-Level Pricing — Isolated Development Specification

**Baseline:** main commit `88a0f873d890ba84ed73305cf61b4d83b0c9ffd5` (working website / notice).  
**Branch:** `feature/wedding-studio-template-pricing-2026-11-06`  
**Release policy:** NO live deployment until full sandbox payment and poster-export tests pass. Never change existing real payments, users, download counts or owner settings as part of migration.

## Reference sorting (user-provided ZIP)
52 user-provided reference images sorted in a separate offline ZIP. All are inspiration-only; originals, embedded logos, watermark artwork and unlicensed illustrations must NOT be published as templates. Additional nine sample images supplied in chat are separate references.

| Primary reference group | Image count |
|---|---:|
| Wedding / Anand Karaj | 32 |
| Engagement / Ring Ceremony | 10 |
| Haldi / Maiyan | 5 |
| Mehndi | 1 |
| Reception | 2 |
| Save the Date | 2 |

For more design choice, original layouts should include Roka/Shagan, Jaggo/Sangeet and Combined Invite too. Do not duplicate all 52 copyrighted reference designs. Begin by producing 20 original editable templates, expand towards 45+.

## Wedding Studio category IDs
`save-date`, `engagement-ring`, `roka-shagan`, `haldi-maiyan`, `mehndi`, `jaggo-sangeet`, `wedding-anand-karaj`, `reception`, `combined`.

Each style needs stable unique ID, category, title, asset license, multilingual text layout, and independently saved fields. Punjabi should be default; support Punjabi (Gurmukhi), Hindi (Devanagari), English and Punjabi+English. Avoid conflating ceremony names: Sikh Anand Karaj vs Hindu wedding etc.

## Owner Template Pricing Manager (ALL modules)
- List modules and each available template with preview, stable template ID, title, category, current status and price.
- `Free/Standard/Premium` choice per template, editable premium price (₹); default to module-level settings when no override exists.
- State must be stored and validated on the SERVER, not in browser localStorage.
- Existing module-level global Free and promotional prices remain functional and retain their precedence only according to clearly documented rules.
- Owner-only editing using existing Firebase verified Owner auth; no public write endpoint. Read-only pricing response for visitor UI.
- Preserve existing premium choices on migration and avoid price changes before explicit owner save.
- Prevent an invalid or unknown template ID from falling back to a cheap/default tier when processing payment.
- All module entrypoints need correct and stable template ID and consistent premium badge/price before purchase.
- A payment order MUST be created with server-resolved price and persist immutable module/template/tier/amount snapshot. Verify paid order against stored snapshot.
- Download authorization and membership/free quota must respect server-resolved premium status. Do not trust browser-supplied `isPremium`.
- Template switching after an order cannot apply the old payment to a different premium template unless allowed by an explicit policy. Preserve validity of previously paid downloads according to existing terms.
- The owner should be able to hide/disable a template without destroying historical payment records.

## Existing code findings — DO NOT SKIP
- `dist/app.js` uses hard-coded `template.premium` values for Agri.
- `dist/death-bhog.js` marks premium using `id >= 7`.
- `dist/general-sale.js` and `dist/universal-poster.js` do not supply per-template pricing context to the export controller.
- `dist/poster-export.js` includes templateId and isPremium, but live payment backend `/create-order` computes amount at **module level**, not from template. Server also evaluates subscription eligibility at the module tier.
- Existing `module_settings.is_premium` is MODULE premium, not template premium. DO NOT re-purpose it or overwrite it.
- Existing Razorpay checkout confirmed working by owner: preserve payment worker and secrets until isolated tests cover end-to-end.

## Proposed additive data model (only in safe test DB until approval)
```sql
CREATE TABLE IF NOT EXISTS template_pricing (
  module_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  tier TEXT NOT NULL DEFAULT 'standard' CHECK (tier IN ('standard','premium')),
  premium_price_paise INTEGER,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0,1)),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(module_id, template_id),
  CHECK (premium_price_paise IS NULL OR premium_price_paise >= 100)
);
```
Do not migrate or modify production D1 schema without separate verified backup and owner-ready release.

## Safety gates
1. Snapshot production code, Worker version and D1 backup separately; never copy or reveal API secrets.
2. Test old module pricing unchanged with no per-template override.
3. Test Premium disabled/enabled, owner edit, cross-browser persistence, changed price after purchase, malformed IDs and non-owner rejection.
4. Test Razorpay *test* order lifecycle, captured vs failed payment, wrong amount/order, subscription access, daily free PNG, payment unlock, and expired unlock.
5. Test all existing Agri, General Sale, Bhog and Universal module editor and PDF/PNG downloads including mobile.
6. Enable in stages only after verification; no forced live deployment from development branch.

## Public-site status
As of this document, this is a **design/specification in the feature branch**, NOT a live feature. Do not present it as operational until backend, UI, and validation are actually deployed and tested.
