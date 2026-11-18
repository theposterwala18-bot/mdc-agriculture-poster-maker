# Smart Image Studio — v1 launch and premium roadmap

## What is shipping (free, 100% browser-side)
- Dedicated `smart-image-studio.html` linked from a new, separate Document & Printing Tools group on the home page.
- JPG/PNG/WebP upload, up to 35 MB and 32 megapixels each, up to 20 photos at a time.
- Size presets: 45 KB, 100 KB, 200 KB, 1 MB, 2 MB, or 10–10240 KB custom target.
- Best-fit output JPG/WebP/PNG, with bounded quality binary search and controlled downscale. PNG is lossless but a 45 KB ceiling may be impossible; never promise mathematically lossless 10 MB -> 45 KB.
- Original and processed preview, actual output sizes, honest over-target status, individual download and prebuilt ZIP batch download.
- Local non-AI Brightness, Contrast, Saturation, Sharpen and 2× high-quality interpolation (not super-resolution).
- No image uploads, cloud processing, R2, external API calls, login, subscription or payment required. If browser rejects file or decoding fails, show failure; other images remain processed.
- No change to existing Owner Dashboard, Module-wise Controls, Free Access Manager, original Poster price/subscription/payment Worker or DB.

## Current limitations to communicate
- Exact target is best effort; format, resolution and complexity determine achievable image size.
- Compressor may need to reduce resolution to meet extreme targets; visual quality cannot remain identical.
- Browser Canvas redraw strips EXIF and often metadata, useful for privacy but not archival photo editing; animated input is not supported.
- Device memory limits apply; no private storage or background processing.
- 2× enhancement is a high-quality resample plus filters, not AI restoration. It cannot invent lost photographic details.

## AI upscale options researched (NOT deployed)
- Pixelvaerk browser upscaler (MIT), Swin2SR on-device; downloads ONNX model from model source.
- bg2x browser upscaler (MIT), Real-ESRGAN / Swin2SR; WebGPU/WASM support.
- Before enabling one on a production website: validate exact dependency/model licenses, hosting requirements, model download sizes, Android low-RAM experience, Safari fallback, images never transmitted, memory cleanup and perceived quality on faces, text and ID documents.
- Avoid claiming AI-preserved identity or guaranteed sharper results; use comparison and explicit user consent for first-time model download.
- No paid image AI API unless owner expressly chooses pricing.

## Future credit purchases and separate subscription (NOT enabled)
Design a **separate Tool Credits ledger**, isolated from existing poster payments and subscriptions:
- `tool_credit_wallets` (Firebase UID, current credited/used balance), `tool_credit_transactions` (immutable idempotent credit/debit/refund ledger), `tool_credit_orders` (Razorpay order/payment proof, unique idempotency key).
- Backend verified payment signature + order status, atomic credit insertion once, safe reversible refund/chargeback handling, owner audit and abuse rate limits.
- Credit requirement only on **verified premium compute** or premium export tools; free image compression remains available for all users.
- Owner configurable prices and enable/disable flags, separate from Poster download prices.
- Never debit from untrusted browser JS; if future AI processing is strictly on-device, credits cannot securely meter computation without an authenticated controlled server-side entitlement. Premium features must enforce server-issued rights; do not trust client-side UI locks.
- Maintain isolated migration and regression suite, do not merge before an explicit pricing decision.

## Rollout checks
- [x] Git backup branch `backup/pre-smart-image-studio-2026-11-18`
- [x] New independent page, engine, scripts and styling
- [x] Node syntax, target calculation, ZIP CRC/Python unzip, existing-site Vite build
- [ ] Manual test images on Android Chrome, iPhone Safari and Windows Chrome, at 45 KB, 200 KB, JPEG/PNG/WebP.
- [ ] Real-device preview / save, memory cleanup, drag drop and large-file error handling.
- [ ] Independent on-device AI model evaluation and full browser/device testing.
