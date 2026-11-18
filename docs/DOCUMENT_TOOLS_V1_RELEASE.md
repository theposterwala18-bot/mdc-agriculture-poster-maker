# The Poster Wala — Document & Printing Tools expansion

Status: Development code completed for first independent tool pack. Existing Poster Maker and payment/owner backend untouched.

## Implemented modules
- Responsive left-hand grouped tools menu ONLY on new tool pages. Home link returns to current original site.
- Smart Image Studio: adjustable Brightness/Contrast/Saturation/Sharpen show live downsampled canvas preview when slider moves. The real full-resolution image is encoded by the original engine when Process is pressed. Current non-AI upscale remains FREE.
- PDF Converter: Images (JPG/PNG/WebP) to A4 or US Letter PDF, Merge multiple PDFs, Split/extract page ranges, Rotate PDF pages, preview and download.
- Passport Photo Maker: upload authentic photo, adjust zoom and crop X/Y with live preview, print-ready 300 DPI A4 sheet, PNG and PDF.
- Card Page Maker: genuine supplied front/back card images arranged in repeated A4 print sheets; separately open an original local PDF in the browser's viewer for password entry/printing. No Aadhaar editing, no false identity features.
- Resume Maker: live DOM-safe preview with optional local photo, modern/classic/minimal designs, browser Print → Save as PDF.
- Document Tools dashboard: entry point to the above.
- Home Page Document Tools group: new links added while existing Poster templates, modules and payment logic stay unchanged.

## Billing, privacy, limits
- No new billing account, AI API charges, new paid subscriptions, credits or payments.
- PDF-lib 1.17.1 is loaded by version-pinned public CDN in browser; this is a runtime JS library request, not a file upload. Images/PDFs stay in browser. For better resilience, vendor the tested library in a future update.
- The site must show a warning instead of claiming that password protection can be circumvented. For authentic password protected documents, the user's normal browser PDF viewer may ask for the correct password. Do not attempt decryption or editing identity/security features.
- PDF→Excel (table recognition) and DOCX→PDF (Microsoft Word layout fidelity) are NOT implemented: they need dedicated accuracy tests. PDF-to-Excel scanning/OCR is more costly and error-prone.
- True Kundli horoscope calculation is NOT implemented: requires trustworthy astronomical ephemeris, location, time zone and ayanamsa calculations; do not fabricate charts.
- No on-site AI super-resolution is shipped yet. Open-source local browser models exist without API fees (e.g., MIT Pixelvaerk Swin2SR, MIT bg2x), but download model size, mobile support, face fidelity and browser fallback need verification before deployment. Basic interpolation enlargement remains free.
- New tools are free in v1. A future separate tool-credits ledger and price plans are planned, with server-side verified purchase/entitlements. Current Poster subscriptions must never be reused or altered without explicit decision.

## QA and rollout requirements
1. Automated syntax, protected-files diff, website build and smoke checks on independent tool pages.
2. Test on Windows Chrome + Android Chrome + iPhone Safari: live enhancement sliders, exact export, image compression unaffected.
3. PDF conversion: merge documents, extract 1-3,5, rotate, image-to-PDF; verify page count and visual quality. CDN load failure must show a clear error.
4. Passport and card A4 printed at Actual Size (100%) with real dimensions; images not altered besides crop, scale and layout.
5. Resume print preview, long text page breaks and photo layout.
6. Existing Poster payments, owner dashboard, Free Access, subscriptions and poster downloads tested separately.
7. Existing stable backup: `backup/pre-tools-expansion-2026-11-18`.
