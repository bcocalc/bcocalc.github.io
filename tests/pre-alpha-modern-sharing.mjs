import assert from 'node:assert/strict';
import {createModernTransport,envelopeFields} from '../pre-alpha/modern-transport.mjs';
import {createModernSaver} from '../pre-alpha/modern-saver.mjs';
import {verifyEnvelope,makeEnvelope,workingCopyOf,assertJson} from '../pre-alpha/modern-envelope.mjs';
import {MODERN_DESTINATION,PRODUCTION_MODERN_BINDING,MAX_MODERN_BYTES} from '../pre-alpha/modern-sharing-config.mjs';
import {buildSharedSnapshot} from '../pre-alpha/shared-save.mjs';
import {createWorkspaceStore} from '../pre-alpha/workspace-store.mjs';
import {memoryDatabase} from './pre-alpha-memory-database.mjs';
import {modernRelayFixture} from './modern-sharing-fixture.mjs';
const clone=value=>structuredClone(value);
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
import {modernJobFixture} from './modern-job-fixture.mjs';
async function harness(){
 let serial=0,session={uid:'alice',token:'fixture-alice',expiresAt:1000000},online=true;
 const database=memoryDatabase(),legacy=new Map([['measurementCardHistoryV1','unchanged-history'],['measurementCardStateV1','unchanged-state']]);
 const store=createWorkspaceStore({storage:{getItem:key=>legacy.get(key)??null},locks:{request:(_name,_options,fn)=>fn()},database,uuid:()=>String(++serial),now:()=> 'fixture-time-'+serial});await store.ready;
 const saved=await store.save(modernJobFixture(),null),relay=await modernRelayFixture();
 const config={kind:'synthetic-only',endpoint:relay.endpoint,destination:MODERN_DESTINATION,auth:{getSession:async()=>session},approvedUids:['alice','bob'],fetch,online:()=>online,now:()=>1000,timeoutMs:500};
 const transport=createModernTransport(config),saver=createModernSaver({store,transport});
 return {store,database,legacy,job:saved.job,version:saved.version,relay,config,transport,saver,setSession:value=>session=value,setOnline:value=>online=value,close:relay.close};
}
assert.equal(PRODUCTION_MODERN_BINDING,null);
for(const endpoint of ['https://firestore.googleapis.com','http://example.com','http://127.0.0.1@evil.invalid'])assert.throws(()=>createModernTransport({kind:'synthetic-only',endpoint,destination:MODERN_DESTINATION,auth:{getSession:async()=>null},fetch}),/localhost|synthetic/);
console.log('PASS production binding absent; non-loopback relays rejected');
{
 const h=await harness();try{
  const before=clone(h.job);const a=h.saver.save(h.job,h.version),b=h.saver.save(h.job,h.version);const [one,two]=await Promise.all([a,b]);assert.deepEqual(one,two);
  assert.equal(h.relay.posts.length,1);assert.equal(h.store.sharedSnapshots().length,1);
  const capture=h.store.sharedSnapshots()[0],envelope=capture.item.record.modernSnapshot,item=await verifyEnvelope(envelope,{destination:MODERN_DESTINATION,cloudId:one.cloudId});
  assert.deepEqual(item,buildSharedSnapshot(before));assert.deepEqual(item.record.preAlphaCapture.job,before);assert.equal(item.record.jobBundle.operations.length,4);assert.deepEqual(h.job,before);
  assert.equal(envelope.ownerUid,'alice');assert.deepEqual(envelope.destination,MODERN_DESTINATION);assert.deepEqual(item.record.preAlphaCapture.job.operations[0].state.future,before.operations[0].state.future);
  const posts=h.relay.posts.length;await h.saver.retry(one.captureId);assert.equal(h.relay.posts.length,posts);
  const received=await h.transport.get(one.cloudId);assert.deepEqual(received.item,item);assert.equal((await h.transport.list()).length,1);
  const working=workingCopyOf(received.item,{uuid:()=> 'separate-working-copy'});assert.notEqual(working.id,before.id);assert.deepEqual(working.operations,before.operations);assert.deepEqual(working.original,before.original);assert.equal(working.sourceId,working.id);
  assert.deepEqual(h.legacy,new Map([['measurementCardHistoryV1','unchanged-history'],['measurementCardStateV1','unchanged-state']]));
  h.setSession({uid:'bob',token:'fixture-bob',expiresAt:1000000});assert.deepEqual((await h.transport.get(one.cloudId)).item,item,'Approved teammate may read full snapshot');
  await assert.rejects(h.saver.retry(one.captureId),{code:'account-changed'});
  console.log('PASS complete nested-array JSON capture, canonical/history attribution, local-first duplicate clicks, verified receipt/read/list, owner-bound retry and separate working identity');
 }finally{await h.close();}
}
for(const mode of ['post-denied','timeout','late-commit','offline']){
 const h=await harness();try{
  if(mode==='offline')h.setOnline(false);else h.relay.setMode(mode);
  let id;if(mode==='late-commit')id=(await h.saver.save(h.job,h.version)).captureId;else await assert.rejects(h.saver.save(h.job,h.version),error=>{id=error.captureId;return !!id;});
  const capture=h.store.sharedSnapshots()[0];assert.equal(capture.id,id);assert.deepEqual(capture.item.record.preAlphaCapture.job,h.job);assert.equal(Boolean(capture.receipt),mode==='late-commit');
  h.setOnline(true);h.relay.setMode('success');await h.saver.retry(id);assert.ok(h.store.sharedSnapshots()[0].receipt);assert.equal(h.relay.docs.size,1);
  console.log('PASS '+mode+': immutable pending capture, bounded request/recovery and exact retry');
 }finally{await h.close();}
}
for(const session of [null,{uid:'alice',token:'fixture-alice',expiresAt:999},{uid:'mallory',token:'fixture-mallory',expiresAt:1000000}]){
 const h=await harness();try{h.setSession(session);await assert.rejects(h.transport.list());await assert.rejects(h.transport.get('tm-'+'a'.repeat(64)));await assert.rejects(h.saver.save(h.job,h.version));assert.equal(h.relay.requests.length,0);assert.equal(h.store.sharedSnapshots().length,0);console.log('PASS absent/expired/unapproved session: no request or shared capture');}finally{await h.close();}
}
{
 const h=await harness();try{
  const envelope=await makeEnvelope(buildSharedSnapshot(h.job),'bob',MODERN_DESTINATION),id='tm-'+envelope.contentHash;
  const commit={writes:[{update:{name:h.relay.name+'/'+MODERN_DESTINATION.collection+'/'+id,fields:envelopeFields(envelope)},currentDocument:{exists:false}}]};
  const url=h.relay.endpoint+'/v1/'+h.relay.name;
  for(const [token,status]of [['fixture-alice',403],['fixture-mallory',403],['expired',401]]){
   const response=await fetch(url+':commit',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(commit)});assert.equal(response.status,status);
   assert.equal((await fetch(url+'/'+MODERN_DESTINATION.collection,{headers:{Authorization:'Bearer '+token}})).status,token==='fixture-alice'?200:status);
  }
  for(const method of ['PATCH','DELETE'])assert.equal((await fetch(url+'/'+MODERN_DESTINATION.collection+'/'+id,{method,headers:{Authorization:'Bearer fixture-alice'}})).status,403);
  assert.throws(()=>h.transport.update(),{code:'immutable'});assert.throws(()=>h.transport.delete(),{code:'immutable'});assert.equal(h.relay.docs.size,0);
  console.log('PASS synthetic server policy: authenticated team read/list, owner-only create, unapproved/expired denial, no update/delete');
 }finally{await h.close();}
}
{
 const h=await harness();try{
  h.relay.setMode('post-denied');let id;await assert.rejects(h.saver.save(h.job,h.version),error=>{id=error.captureId;return true;});
  const before=h.relay.requests.length;
  const other=createModernSaver({store:h.store,transport:createModernTransport({...h.config,destination:{...MODERN_DESTINATION,collection:'otherTeamSnapshots'}})});
  await assert.rejects(other.retry(id),{code:'destination-changed'});assert.equal(h.relay.requests.length,before);
  h.setSession({uid:'bob',token:'fixture-bob',expiresAt:1000000});await assert.rejects(h.saver.retry(id),{code:'account-changed'});assert.equal(h.relay.requests.length,before);
  console.log('PASS destination/account switch: pending capture cannot redirect or change owner');
 }finally{await h.close();}
}
{
 const h=await harness();try{
  let prepared;const saver=createModernSaver({store:h.store,transport:h.transport,onPrepared:result=>{prepared=result;h.database.setBeforeWrite(()=>{throw Error('Synthetic receipt quota');});}});
  let id;await assert.rejects(saver.save(h.job,h.version),error=>{id=error.captureId;return /receipt quota/.test(error.message);});assert.ok(prepared);assert.equal(h.relay.docs.size,1);assert.equal(h.store.sharedSnapshots()[0].receipt,null);
  const count=h.relay.posts.length;h.database.setBeforeWrite(()=>{});await h.saver.retry(id);assert.equal(h.relay.posts.length,count);assert.ok(h.store.sharedSnapshots()[0].receipt);
  console.log('PASS receipt quota after server commit: exact retry verifies existing document without duplicate create');
 }finally{await h.close();}
}
{
 const h=await harness(),started=deferred(),finish=deferred();try{
  let prepared;h.relay.setOnPost(async()=>{started.resolve();await finish.promise;});
  const saver=createModernSaver({store:h.store,transport:h.transport,onPrepared:value=>prepared=value}),task=saver.save(h.job,h.version);await started.promise;
  const next=clone(prepared.job);next.operations[0].state.md='999';const edited=await h.store.save(next,prepared.version);finish.resolve();await task;
  assert.deepEqual(h.store.read().jobs.find(job=>job.id===next.id),edited.job);assert.deepEqual(h.store.sharedSnapshots()[0].item.record.preAlphaCapture.job,h.job);
  console.log('PASS late acknowledgement preserves newer edits/revision and complete earlier capture');
 }finally{finish.resolve();await h.close();}
}
for(const mode of ['conflict','quota','cancelled']){
 const h=await harness();try{
  if(mode==='conflict'){const job=clone(h.job);job.title='Other tab';await h.store.save(job,h.version);}
  if(mode==='quota')h.database.setBeforeWrite(()=>{throw Error('Synthetic local quota');});
  const before=h.database.peek();await assert.rejects(h.saver.save(h.job,h.version,{isCurrent:()=>mode!=='cancelled'}));assert.equal(h.relay.requests.length,0);assert.equal(h.database.peek(),before);
  console.log('PASS local '+mode+': no upload or changed durable bytes');
 }finally{await h.close();}
}
{
 const h=await harness();try{
  for(const bad of [undefined,Infinity,NaN,BigInt(1),()=>{},new Date(),-0]){const job=clone(h.job);job.futureUnsupported=bad;await assert.rejects(h.saver.save(job,h.version),{code:'unsupported-value'});}
  const sparse=[];sparse.length=1;assert.throws(()=>assertJson(sparse));const cyclic={};cyclic.loop=cyclic;assert.throws(()=>assertJson(cyclic));
  const large=clone(h.job);large.sharedState.jobNotes='x'.repeat(MAX_MODERN_BYTES);await assert.rejects(h.saver.save(large,h.version),{code:'snapshot-too-large'});assert.equal(large.sharedState.jobNotes.length,MAX_MODERN_BYTES);assert.equal(h.relay.posts.length,0);assert.equal(h.store.sharedSnapshots().length,0);
  console.log('PASS unsupported and oversized values: explicit errors, no truncation/local mutation/request');
 }finally{await h.close();}
}
{
 const h=await harness();try{
  const envelope=await makeEnvelope(buildSharedSnapshot(h.job),'alice',MODERN_DESTINATION),id='tm-'+envelope.contentHash;
  h.relay.docs.set(h.relay.name+'/'+MODERN_DESTINATION.collection+'/'+id,{name:h.relay.name+'/'+MODERN_DESTINATION.collection+'/'+id,fields:envelopeFields(envelope)});h.relay.setMode('collision');
  await assert.rejects(h.saver.save(h.job,h.version),{code:'snapshot-mismatch'});assert.equal(h.relay.posts.length,0);assert.equal(h.store.sharedSnapshots()[0].receipt,null);
  console.log('PASS mismatched existing content: no overwrite/create/receipt; exact pending capture retained');
 }finally{await h.close();}
}
{
 const h=await harness();try{
  await h.saver.save(h.job,h.version);const oldDocument=clone([...h.relay.docs.values()][0]);
  const next=clone(h.job);next.operations[0].state.md='11';await h.saver.save(next,h.store.read().versions.get(next.id));assert.equal(h.relay.docs.size,2);assert.deepEqual([...h.relay.docs.values()][0],oldDocument);
  h.relay.setMode('pagination');assert.equal((await h.transport.list()).length,2);
  console.log('PASS changed content appends immutable snapshot; pagination preserves both complete records');
 }finally{await h.close();}
}
{
 const h=await harness();try{
  h.setSession({uid:'alice',token:'expired-server-token',expiresAt:1000000});let id;
  await assert.rejects(h.saver.save(h.job,h.version),error=>{id=error.captureId;return error.code==='sign-in-required';});assert.equal(h.relay.docs.size,0);assert.equal(h.relay.posts.length,0);
  h.setSession({uid:'alice',token:'fixture-alice',expiresAt:1000000});await h.saver.retry(id);assert.equal(h.relay.docs.size,1);
  console.log('PASS server-expired credentials: local pending capture survives and same-owner sign-in recovers exact snapshot');
 }finally{await h.close();}
}
{
 const h=await harness();try{
  const saver=createModernSaver({store:h.store,transport:h.transport,onPrepared:()=>h.setSession({uid:'bob',token:'fixture-bob',expiresAt:1000000})});
  await assert.rejects(saver.save(h.job,h.version),{code:'account-changed'});assert.equal(h.relay.requests.length,0);assert.equal(h.store.sharedSnapshots()[0].item.record.modernSnapshot.ownerUid,'alice');
  console.log('PASS account change after local capture: no request under replacement principal');
 }finally{await h.close();}
}
{
 const h=await harness();try{
  const mutable={...MODERN_DESTINATION},transport=createModernTransport({...h.config,destination:mutable});mutable.collection='unapprovedDestination';
  await createModernSaver({store:h.store,transport}).save(h.job,h.version);assert.equal(h.relay.docs.size,1);assert.equal(transport.destination.collection,MODERN_DESTINATION.collection);
  console.log('PASS caller config mutation cannot redirect a constructed transport');
 }finally{await h.close();}
}
{
 const h=await harness();try{
  const item=buildSharedSnapshot(h.job);await h.store.save(h.job,h.version,{sharedCapture:{id:'old-unbound-capture',jobId:h.job.id,item}});
  const before=h.database.peek();await assert.rejects(h.saver.retry('old-unbound-capture'),{code:'unbound-capture'});assert.equal(h.relay.requests.length,0);assert.equal(h.database.peek(),before);
  console.log('PASS older captures remain unbound/preserved; no implicit target migration');
 }finally{await h.close();}
}
{
 const h=await harness();try{
  h.relay.setMode('post-denied');let id;await assert.rejects(h.saver.save(h.job,h.version),error=>{id=error.captureId;return true;});const captured=clone(h.store.sharedSnapshots()[0].item);
  let serial=0;const restarted=createWorkspaceStore({storage:{getItem:key=>h.legacy.get(key)??null},locks:{request:(_n,_o,fn)=>fn()},database:h.database,uuid:()=> 'restart-'+(++serial)});await restarted.ready;
  h.relay.setMode('success');await createModernSaver({store:restarted,transport:h.transport}).retry(id);assert.deepEqual(restarted.sharedSnapshots()[0].item,captured);assert.ok(restarted.sharedSnapshots()[0].receipt);assert.equal(h.relay.docs.size,1);
  console.log('PASS restarted store recovers identical pending capture/owner/destination and verifies acknowledgement');
 }finally{await h.close();}
}
console.log('PASS modern sharing synthetic core. Production remains unbound; real Firebase rules/emulator/backend and browser integration are not certified by these fixtures.');
