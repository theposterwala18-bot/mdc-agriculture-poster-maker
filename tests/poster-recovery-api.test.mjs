import assert from "node:assert/strict";
import {createRecoveryHandler,byteSignature,sha256Hex} from "../backend/poster-recovery-api.mjs";
const user={sub:"customer_12345",email:"person@example.com"};
const order={order_id:"order_123456789",payment_id:"pay_123456789",uid:user.sub,module_id:"wedding",status:"captured",created_at:"2026-11-16 12:00:00"};
let audit=[];
const record={id:"poster_12345",uid:user.sub,payment_order_id:order.order_id,module_id:"wedding",
 template_id:"101",poster_key:"protected/order",mime_type:"image/png",file_bytes:8,sha256_hex:"a".repeat(64),
 created_at:1000,expires_at:90000,revision_count:0,state:"ready"};
const db={prepare(sql){
 const params={values:[],bind(...args){this.values=args;return this},
 async first(){
  if(sql.includes("FROM payments"))return this.values[0]===order.order_id?order:null;
  if(sql.includes("FROM poster_recovery_orders"))return this.values[0]===record.id&&this.values[1]===user.sub?record:null;
  return null;
 },
 async all(){
  if(sql.includes("FROM poster_recovery_orders WHERE uid="))return {results:[record]};
  return {results:[]};
 },
 async run(){audit.push(sql);return {meta:{changes:1}}}
 };return params
 }};
const r2={async get(key){return key===record.poster_key?{body:new Uint8Array([137,80,78,71,13,10,26,10])}:null}};
let owner=false;
const handler=createRecoveryHandler({verifyUser:async()=>user,requireOwner:async()=>{if(!owner)throw Error("No owner")},db,r2,now:()=>2000});
const req=(route,payload)=>new Request("https://example.com"+route,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
const list=await handler(req("/recovery/list",{}));assert.equal(list.status,200);assert.equal((await list.json()).posters.length,1);
const served=await handler(req("/recovery/serve",{id:record.id}));assert.equal(served.status,200);assert.equal(served.headers.get("Cache-Control"),"private, no-store, max-age=0");
assert.equal((await served.arrayBuffer()).byteLength,8);
const missing=await handler(req("/recovery/serve",{id:"poster_other_12345"}));assert.equal(missing.status,404);
const denied=await handler(req("/recovery/owner/disputes",{orderId:order.order_id}));assert.equal(denied.status,403);
owner=true;
const support=await handler(req("/recovery/owner/disputes",{orderId:order.order_id}));assert.equal(support.status,200);
assert.equal((await support.json()).order.status,"captured");
const unsafe=new Request("https://example.com/recovery/seal",{method:"POST",headers:{
 "Content-Type":"image/png","X-Poster-Order-Id":order.order_id,"X-Poster-Module":"wedding",
 "X-Poster-Template":"101","X-Poster-Design-Hash":"a".repeat(64),
 "X-Poster-Recovery-Consent":"yes"},body:new Uint8Array([137,80,78,71,13,10,26,10])});
assert.equal((await handler(unsafe)).status,503); // never accept unverified editor data
assert.equal(byteSignature(new Uint8Array([137,80,78,71,13,10,26,10]),"image/png"),true);
assert.equal(byteSignature(new Uint8Array([0,0,0,0,0,0,0,0]),"image/png"),false);
assert.equal((await sha256Hex(new TextEncoder().encode("abc"))).length,64);
const expired=createRecoveryHandler({verifyUser:async()=>user,requireOwner:async()=>{},db,r2,now:()=>record.expires_at});
assert.equal((await expired(req("/recovery/serve",{id:record.id}))).status,404);
assert.equal(audit.length,2);
console.log("Recovery API authorization, expires, owner dispute, private fetch, fail-closed seal tests passed.");
