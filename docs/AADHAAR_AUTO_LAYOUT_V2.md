# Aadhaar Auto Print Layout v2 — implementation and safety
This upgrades only dist/aadhaar-print.html using separate dist/aadhaar-auto-layout.js and .css.
No change to the working generic Card Page Maker, Posters, payments, DB, or Owner Settings.

## User flow
1. Select Original e-Aadhaar PDF (supported password protected) or 2 genuine front/back images.
2. PDF.js 3.11.174 renders source page fully in-browser. Set isEvalSupported:false and enableScripting:false; original password supplied via browser prompt, never persisted. PDF.js worker is version pinned.
3. Suggested side-by-side / stacked boxes are **heuristics only**, not reliable detection. Choose Front or Back and redraw each selection rectangle on original page by touch/mouse drag.
4. Preview shows an A4 or Letter sheet with KYC single front-above-back or 1/2/4/6 pairs. Cards are fitted preserving aspect ratio; if necessary actual card millimetres automatically reduce with a visible warning.
5. Export 300dpi raster PNG or PDF (pdf-lib embeds rendered page). Print at 100% actual size. PDF rendering currently uses up to 3× resolution, bounded maximum edge 2600 to protect mobile memory.
6. Original PDF viewer in separate tab remains, unmodified.

## Limitations
- Cropping is **manual-assisted** for uncertain PDFs. Layout differences mean auto suggestions can be wrong. Verify identity photo, text, QR inside crop before printing.
- Source PDF/vector text is rasterized for printing; very small typography can be softer than the native PDF. Use original browser viewer for maximum fidelity.
- Uploading an encrypted PDF may require the document owner to enter the real password; unsupported encryption or missing PDF.js/CDN fails clearly, no bypass.
- All bytes processed locally; loaded public libraries do require internet but images and passwords are not sent to server by app logic.
- This tool is not an official UIDAI service, does not create blank or forged IDs and cannot edit personal details.
- Generated Blob URLs cleaned up on pagehide.

## Safety / QA
- Original stable branch: backup/pre-aadhaar-auto-layout-2026-11-19.
- Automated CI: syntax, layout markers, owner/payment/card unchanged, Vite full build.
- Manual acceptance: 1) genuine authorized/redacted PDF side-by-side lower cards, 2) stacked example, 3) encrypted PDF with correct/wrong password, 4) manual crop on mobile, 5) KYC and 2/4/6 pairs printed actual dimensions, 6) PNG/PDF verify readable QR and no clipping.
