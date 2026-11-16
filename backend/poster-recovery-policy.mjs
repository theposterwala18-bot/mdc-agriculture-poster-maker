/**
 * Poster recovery business rules (pure, testable; staged until private R2 exists).
 * IMPORTANT: never treat a /record-download response as proof of device save.
 * The payment remains authoritative; recovery never grants extra poster creations.
 */
export const RECOVERY_SECONDS = 24 * 60 * 60;
export const MAX_REVISIONS = 2;
export const MAX_FILE_BYTES = 12 * 1024 * 1024;
export const ALLOWED_MIME_TYPES = Object.freeze(["image/png", "application/pdf"]);
export const RECOVERY_STATES = Object.freeze(["pending", "ready", "expired", "deleted"]);

// Purchase/first-save time is immutable. Neither a revision nor a download extends it.
export function recoveryExpiresAt(purchasedAtUnix) {
  if (!Number.isInteger(purchasedAtUnix) || purchasedAtUnix < 1) throw Error("Invalid purchase time");
  return purchasedAtUnix + RECOVERY_SECONDS;
}
export function isRecoverable(record, userId, nowUnix) {
  return Boolean(record && record.uid === userId && record.state === "ready" &&
    Number.isInteger(nowUnix) && nowUnix >= record.created_at &&
    nowUnix < record.expires_at);
}
export function assertValidFile(mimeType, byteLength, digest) {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) throw Error("Only PNG and PDF are recoverable");
  if (!Number.isSafeInteger(byteLength) || byteLength < 1 || byteLength > MAX_FILE_BYTES)
    throw Error("File must be at most 12 MiB");
  if (!/^[0-9a-f]{64}$/i.test(String(digest))) throw Error("SHA-256 digest required");
}
export function assertRevisionAllowed(record, request, nowUnix) {
  if (!isRecoverable(record, request.uid, nowUnix)) throw Error("Recovery expired or not owned by user");
  if (record.revision_count >= MAX_REVISIONS) throw Error("Two correction limit reached");
  if (record.module_id !== request.moduleId) throw Error("Cannot change poster module");
  if (String(record.template_id ?? "") !== String(request.templateId ?? ""))
    throw Error("Cannot change purchased template");
  if (record.payment_order_id !== request.orderId) throw Error("Cannot move revision to another payment");
  const changes = request.changes;
  if (!changes || typeof changes !== "object" || Array.isArray(changes) ||
      Object.keys(changes).length === 0) throw Error("No correction fields submitted");
  // This is the *intersection* of supported correction fields across modules.
  // Each module must provide explicit adapter rules before editing is enabled.
  const forbidden = ["photo","portrait","productImage","modelImage","logo","background",
    "template","templateId","moduleId","price","discount","productName","personName",
    "shopName","title","societyName","eventTitle","primaryPhoto","secondaryPhoto"];
  for (const key of Object.keys(changes)) {
    if (forbidden.some(term => key.toLowerCase().includes(term.toLowerCase())))
      throw Error("Changing poster identity requires a new purchase");
    if (typeof changes[key] !== "string" || changes[key].length > 500)
      throw Error("Correction must be short plain text");
  }
  // Without a verified per-module adapter, fail closed; never accept arbitrary
  // corrected JSON from the browser as a substitute for a purchased poster.
  if (!request.serverApprovedFields || !Array.isArray(request.serverApprovedFields))
    throw Error("This module does not yet support safe corrections");
  if (Object.keys(changes).some(k => !request.serverApprovedFields.includes(k)))
    throw Error("Only approved correction fields may be changed");
  return true;
}
export function shouldShowRecoverLink(record, userId, nowUnix) {
  return isRecoverable(record,userId,nowUnix);
}
