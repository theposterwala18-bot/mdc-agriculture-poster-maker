/**
 * Private, local-device retry for the exact immutable PNG/PDF just downloaded.
 * No Cloudflare/R2, no new payment entitlement, no cross-device syncing.
 * This does not prove the device saved the original file.
 */
const DB_NAME="tpw-local-poster-recovery-v1", STORE="downloads", HOURS=24;
export const RETRY_WINDOW_MS=HOURS*3600000;
const MAX_ROWS_PER_USER=8;
function openDb(){
 return new Promise((resolve,reject)=>{
  if(!("indexedDB" in window))return reject(Error("Browser storage unavailable"));
  const request=indexedDB.open(DB_NAME,1);
  request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(STORE)){const store=db.createObjectStore(STORE,{keyPath:"key"});store.createIndex("uid","uid",{unique:false})}};
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error||Error("Browser storage failure"));
 });
}
function transaction(db,mode,operation){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,mode), store=tx.objectStore(STORE);
  let result;
  tx.oncomplete=()=>{db.close();resolve(result)};
  tx.onerror=()=>{db.close();reject(tx.error||Error("Local save failed"))};
  try{operation(store,value=>{result=value})}catch(e){tx.abort();reject(e)}
 });
}
export function mayRetry(row,uid,now=Date.now()){
 return Boolean(row&&row.uid===uid&&Number.isFinite(row.savedAt)&&
  now>=row.savedAt&&now-row.savedAt<RETRY_WINDOW_MS);
}
function validate(uid,orderId,filename,blob){
 if(!uid||!orderId||typeof uid!=="string"||typeof orderId!=="string")throw Error("Signed-in paid order required");
 if(!(blob instanceof Blob)||blob.size<1||blob.size>15*1024*1024)throw Error("Poster is too large for local recovery");
 if(!["image/png","application/pdf"].includes(blob.type))throw Error("Only PNG/PDF may be saved");
 if(typeof filename!=="string"||filename.length>160)throw Error("Invalid filename");
}
export async function savePaidPoster({uid,orderId,moduleId,filename,blob}){
 validate(uid,orderId,filename,blob);
 const db=await openDb();
 const now=Date.now();
 const key=uid+"|"+orderId+"|"+moduleId+"|"+filename;
 return transaction(db,"readwrite",(store,set)=>{
  // Keep one immutable last-exported file per exact order / module / file name.
  // Never replace a previously saved poster with a different rendered design.
  const q=store.get(key);
  q.onsuccess=()=>{
   const old=q.result;
   if(!old||!mayRetry(old,uid,now)){
    store.put({key,uid,orderId,moduleId,filename,blob,savedAt:now});
   }
   set(true);
  };
 });
}
export async function findPaidPosters(uid,moduleId){
 if(!uid)return [];
 const db=await openDb();
 return transaction(db,"readwrite",(store,set)=>{
  const q=store.getAll();
  q.onsuccess=()=>{
   const rows=q.result||[],now=Date.now();
   for(const row of rows)if(now-row.savedAt>=RETRY_WINDOW_MS)store.delete(row.key);
   const own=rows.filter(row=>mayRetry(row,uid,now)&&row.moduleId===moduleId)
    .sort((a,b)=>b.savedAt-a.savedAt).slice(0,MAX_ROWS_PER_USER);
   // UI intentionally only gets metadata, never the Blob
   set(own.map(({key,filename,savedAt,orderId})=>({key,filename,savedAt,orderId})));
  };
 });
}
export async function readPaidPoster(uid,key){
 const db=await openDb();
 return transaction(db,"readonly",(store,set)=>{
  const q=store.get(key);
  q.onsuccess=()=>set(mayRetry(q.result,uid)?q.result:null);
 });
}
export async function forgetPaidPoster(uid,key){
 const entry=await readPaidPoster(uid,key);
 if(!entry)return false;
 const db=await openDb();
 return transaction(db,"readwrite",(store,set)=>{store.delete(key);set(true)});
}
