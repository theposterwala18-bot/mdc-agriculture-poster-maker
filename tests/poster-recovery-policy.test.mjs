import assert from "node:assert/strict";
import {RECOVERY_SECONDS,MAX_REVISIONS,recoveryExpiresAt,isRecoverable,assertValidFile,assertRevisionAllowed} from "../backend/poster-recovery-policy.mjs";
const now=1794850000;
const record={uid:"firebase-u-1",payment_order_id:"order_paid",module_id:"wedding",template_id:"101",
  created_at:now-3600,expires_at:now-3600+RECOVERY_SECONDS,revision_count:0,state:"ready"};
assert.equal(recoveryExpiresAt(now),now+86400);
assert.equal(isRecoverable(record,"firebase-u-1",now),true);
assert.equal(isRecoverable(record,"another-user",now),false);
assert.equal(isRecoverable(record,"firebase-u-1",record.expires_at),false);
assertValidFile("image/png",4096,"a".repeat(64));
assert.throws(()=>assertValidFile("image/svg+xml",4096,"a".repeat(64)));
assert.throws(()=>assertValidFile("application/pdf",13*1024*1024,"a".repeat(64)));
const req={uid:"firebase-u-1",moduleId:"wedding",templateId:"101",orderId:"order_paid",
  changes:{eventTime:"12:30 PM"},serverApprovedFields:["eventTime"]};
assert.equal(assertRevisionAllowed(record,req,now),true);
assert.throws(()=>assertRevisionAllowed(record,{...req,changes:{personName:"someone else"}},now));
assert.throws(()=>assertRevisionAllowed(record,{...req,changes:{eventTime:"12 PM"},templateId:"102"},now));
assert.throws(()=>assertRevisionAllowed({...record,revision_count:MAX_REVISIONS},req,now));
assert.throws(()=>assertRevisionAllowed(record,{...req,serverApprovedFields:undefined},now));
assert.throws(()=>assertRevisionAllowed(record,req,record.expires_at));
console.log("Recovery 24h window, identity-lock, limited-edit policy tests passed.");
