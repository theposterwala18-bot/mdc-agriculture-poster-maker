# The Poster Wala — Website Compliance Audit (26 November 2026)

## Scope and limitations
Audited current GitHub website source and public Google AdSense guidance; attempted direct public-site access, which did not provide live-site HTML in this review environment. This audit is not an AdSense certification or legal opinion. The user's screenshots show **account not approved: account information inaccurate or incomplete**, so website changes do **not** establish that the account-level issue is resolved.

## Confirmed source findings and repairs
1. No standalone published About/Contact/Privacy/Terms pages existed in dist. Added accurate pages and linked them from site home, tools, custom services, and tools navigation.
2. Main homepage used obsolete "Mr Dhaliwal Creation" in a contact link's accessibility label. Updated label, preserved the existing functioning contact email.
3. Main website contact and custom creative-service email differ. Both remain explicitly labeled for their actual uses; AdSense login email is not required to equal contact email.
4. AdSense code in site header and root ads.txt publisher identifier correspond. Existing ads.txt retained unchanged.
5. Added robots.txt and sitemap.xml for public pages. Admin page deliberately excluded.
6. Privacy disclosure now reflects Firebase Google authentication, Cloudflare server-side operations, Razorpay payment flow, downloads and analytics. Avoids misleading "everything is offline/no data collected" wording.
7. Terms explain variation in PDF accuracy, responsible lawful use, checkout conditions and support for payment/refund questions without unsupported guarantees.

## Requires human or provider-side verification
- AdSense account rejection details, identity/account status and any account-level policy flag: only AdSense can resolve.
- Live URL serving /ads.txt, sitemap and all legal pages after deployment; check HTTP 200 and correct body.
- Contact mailbox delivery, business/legal disclosures under applicable India regulations, actual refund procedures and privacy request handling must be reviewed by owner.
- Verify mobile navigation, real payments, accessibility and all site tools in browser. Static tests do not prove those flows.
- Google ads consent implementation for EEA/UK/Switzerland users, if applicable when ad serving is enabled, must be configured using Google's current requirements; no fake consent banner was deployed.
- Check published design assets for licensed commercial use/originality.
- Do not resubmit until account details and live status are confirmed.
