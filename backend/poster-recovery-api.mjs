/**
 * STAGED ONLY — 24h private poster recovery API.
 * Do not mount until Cloudflare R2 is enabled, migrations applied,
 * privacy notice and per-editor one-poster locking are implemented/tested.
 *
 * Call createRecoveryHandler({verifyUser,requireOwner,db,r2}) from a trusted
 * Worker router after preserving existing payment/download endpoints.
 *
 * First successful upload SEALS the order to ONE immutable poster, not a
 * license to edit arbitrary posters. Edits are deliberately NOT supported yet.
 */
import { RECOVERY_SECONDS, MAX_FILE_BYTES, assertValidFile } from "./poster-recovery-policy.mjs";
const MIME = new Set(["image/png","application/pdf"]);
const NOW = () => Math.floor(Date.now()/1000);
const fail = (error,status=400) => Response.json({success:false,error},{status,headers:{"Cache-Control":"no-store"}});
const json = (value,status=200) => Response.json(value,{status,headers:{"Cache-Control":"no-store"}});
const LIMIT = 20;

function isValidId(value){return typeof value==="string" && /^[a-zA-Z0-9_-]{8,128}$/.test(value)}
async function sha256Hex(bytes){
 const hash=await crypto.subtle.digest("SHA-256",bytes);
 return [...new Uint8Array(hash)].map(v=>v.toString(16).padStart(2,"0")).join("");
}
function byteSignature(bytes,mime) {
 const b=new Uint8Array(bytes);
 if(mime==="image/png")return b.length>=8&&[137,80,78,71,13,10,26,10].every((x,i)=>b[i]===x);
 if(mime==="application/pdf")return b.length>=5&&[37,80,68,70,45].every((x,i)=>b[i]===x);
 return false;
}
async function getOwnedOrder(db,uid,orderId) {
 const order=await db.prepare("SELECT order_id,payment_id,uid,module_id,status,created_at FROM payments WHERE order_id=? AND uid=? LIMIT 1").bind(orderId,uid).first();
 return order?.status==="captured"&&order.payment_id?order:null;
}
async function readOwned(db,uid,recoveryId) {
 if(!isValidId(recoveryId))return null;
 return db.prepare("SELECT id,uid,payment_order_id,module_id,template_id,poster_key,mime_type,file_bytes,sha256_hex,created_at,expires_at,revision_count,state FROM poster_recovery_orders WHERE id=? AND uid=? LIMIT 1").bind(recoveryId,uid).first();
}
function checkReady(row,now){
 return row && row.state==="ready" && Number(row.expires_at)>now;
}
function responseName(row) {
 const ext=row.mime_type==="image/png"?"png":"pdf";
 return "the-poster-wala-"+row.id+"."+ext;
}
function safePublicRow(row) {
 return {id:row.id,module:row.module_id,templateId:row.template_id,
   type:row.mime_type,size:row.file_bytes,createdAt:row.created_at,expiresAt:row.expires_at,
   revisionsUsed:row.revision_count,state:row.state};
}
async function logEvent(db,row,event,details={}) {
 // Noncritical audit must not destroy a successful download response.
 try{
  await db.prepare("INSERT INTO poster_recovery_events (recovery_id,uid,event,created_at,metadata) VALUES (?,?,?,?,?)")
   .bind(row.id,row.uid,event,NOW(),JSON.stringify(details).slice(0,1000)).run();
 }catch(err){ console.warn("Recovery audit insert failed",String(err).slice(0,200)); }
}
export function createRecoveryHandler({verifyUser,requireOwner,db,r2,now=NOW}) {
 if(typeof verifyUser!=="function"||typeof requireOwner!=="function")throw Error("Authenticated callbacks required");
 if(!db||!r2)throw Error("PRIVATE R2 and D1 bindings required");
 return async function handleRecovery(request) {
  if(request.method!=="POST")return fail("POST required",405);
  // No public Access-Control-Allow-Origin; the integrating Worker must enforce its exact origin.
  let user;
  try{user=await verifyUser(request)}catch{return fail("Login required",401)}
  if(!user?.sub)return fail("Login required",401);
  const route=new URL(request.url).pathname;
  if(route==="/recovery/list"){
   const rows=await db.prepare("SELECT id,uid,module_id,template_id,mime_type,file_bytes,created_at,expires_at,revision_count,state FROM poster_recovery_orders WHERE uid=? AND state='ready' AND expires_at>? ORDER BY created_at DESC LIMIT ?").bind(user.sub,now(),LIMIT).all();
   return json({success:true,posters:(rows.results||[]).map(safePublicRow)});
  }
  if(route==="/recovery/serve"){
   let b;try{b=await request.json()}catch{return fail("Invalid request")}
   const row=await readOwned(db,user.sub,b?.id);
   if(!checkReady(row,now()))return fail("Poster not available or expired",404);
   const obj=await r2.get(row.poster_key);
   if(!obj)return fail("Poster storage unavailable",503);
   await logEvent(db,row,"serve_attempt");
   const body=obj.body;
   const headers={
    "Content-Type":row.mime_type,
    "Content-Length":String(row.file_bytes),
    "Content-Disposition":'attachment; filename="'+responseName(row)+'"',
    "Cache-Control":"private, no-store, max-age=0",
    "X-Content-Type-Options":"nosniff"
   };
   await logEvent(db,row,"serve_response");
   // A streamed server response cannot prove the end-user device persisted the file.
   return new Response(body,{status:200,headers});
  }
  if(route==="/recovery/seal"){
   // First post-payment save locks one order to one rendered file. No revisions here.
   // A separate per-editor adapter must establish consent, canonical immutable design,
   // permitted template and that file actually comes from this paid editor.
   const orderId=request.headers.get("X-Poster-Order-Id");
   const moduleId=request.headers.get("X-Poster-Module");
   const templateId=request.headers.get("X-Poster-Template");
   const designHash=request.headers.get("X-Poster-Design-Hash");
   const consent=request.headers.get("X-Poster-Recovery-Consent");
   const mime=(request.headers.get("Content-Type")||"").split(";")[0].trim().toLowerCase();
   if(consent!=="yes")return fail("Recovery storage consent required",403);
   if(!isValidId(orderId)||typeof moduleId!=="string"||moduleId.length>80||!moduleId||
      !/^[a-zA-Z0-9_-]{1,80}$/.test(moduleId)||
      !/^[a-zA-Z0-9_-]{1,80}$/.test(templateId||"")||
      !/^[a-f0-9]{64}$/i.test(designHash||"")||!MIME.has(mime))
      return fail("Invalid poster metadata");
   const order=await getOwnedOrder(db,user.sub,orderId);
   if(!order)return fail("Captured payment for this user is required",403);
   if(order.module_id!==moduleId)return fail("Module mismatch",403);
   // Fail closed: no arbitrary client-supplied design snapshots accepted.
   // The server must generate/verify canonical data under per-editor lock.
   return fail("Recovery sealing unavailable until the trusted editor adapter is installed",503);
  }
  if(route==="/recovery/owner/disputes"){
   try{await requireOwner(request)}catch{return fail("Owner only",403)}
   let data={};try{data=await request.json()}catch{}
   const orderId=String(data.orderId||"");
   if(!isValidId(orderId))return fail("Valid order ID required");
   const order=await db.prepare("SELECT order_id,payment_id,uid,module_id,status,created_at FROM payments WHERE order_id=? LIMIT 1").bind(orderId).first();
   if(!order)return fail("Order not found",404);
   const recovered=await db.prepare("SELECT id,uid,module_id,template_id,mime_type,file_bytes,sha256_hex,created_at,expires_at,revision_count,state FROM poster_recovery_orders WHERE payment_order_id=? LIMIT 1").bind(orderId).first();
   const events=recovered?await db.prepare("SELECT event,created_at FROM poster_recovery_events WHERE recovery_id=? ORDER BY id DESC LIMIT 50").bind(recovered.id).all():{results:[]};
   return json({success:true,order:{id:order.order_id,module:order.module_id,status:order.status},
    recovery:recovered?{...safePublicRow(recovered),sha256:recovered.sha256_hex}:null,events:events.results||[],
    note:"A logged file delivery does not prove it was saved on the customer's device"});
  }
  return fail("Not found",404);
 };
}
export {byteSignature,sha256Hex};
