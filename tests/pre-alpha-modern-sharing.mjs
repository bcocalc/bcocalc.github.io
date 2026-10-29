import assert from 'node:assert/strict';
import {createModernTransport,envelopeFields} from '../pre-alpha/modern-transport.mjs';
import {createModernSaver} from '../pre-alpha/modern-saver.mjs';
import {verifyEnvelope,makeEnvelope,workingCopyOf,assertJson} from '../pre-alpha/modern-envelope.mjs';
import {MODERN_DESTINATION,PRODUCTION_MODERN_BINDING,PRODUCTION_MODERN_PROPOSAL,MAX_MODERN_BYTES} from '../pre-alpha/modern-sharing-config.mjs';
import {buildSharedSnapshot} from '../pre-alpha/shared-save.mjs';
import {createWorkspaceStore} from '../pre-alpha/workspace-store.mjs';
import {memoryDatabase} from './pre-alpha-memory-database.mjs';
import {modernRelayFixture} from './modern-sharing-fixture.mjs';
import {modernSnapshotMarkup,legacySnapshotMarkup} from '../pre-alpha/modern-view.mjs';
import {createSharedLibrary,sharedLibraryKey,legacyLibraryEntry} from '../pre-alpha/shared-library.mjs';
const clone=value=>structuredClone(value);
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
import {modernJobFixture} from './modern-job-fixture.mjs';
async function harness(){
 let serial=0,online=true;
 const database=memoryDatabase(),legacy=new Map([['measurementCardHistoryV1','unchanged-history'],['measurementCardStateV1','unchanged-state']]);
 const store=createWorkspaceStore({storage:{getItem:key=>legacy.get(key)??null},locks:{request:(_name,_options,fn)=>fn()},database,uuid:()=>String(++serial),now:()=> 'fixture-time-'+serial});await store.ready;
 const saved=await store.save(modernJobFixture(),null),relay=await modernRelayFixture();
 const config={kind:'synthetic-only',endpoint:relay.endpoint,destination:MODERN_DESTINATION,fetch,online:()=>online,timeoutMs:500};
 const transport=createModernTransport(config),saver=createModernSaver({store,transport});
 return {store,database,legacy,job:saved.job,version:saved.version,relay,config,transport,saver,setOnline:value=>online=value,close:relay.close};
}
assert.equal(PRODUCTION_MODERN_BINDING,PRODUCTION_MODERN_PROPOSAL);assert.equal(PRODUCTION_MODERN_BINDING.enabled,true);
assert.throws(()=>createModernTransport({kind:'synthetic-only',endpoint:'http://127.0.0.1:8094',destination:{...MODERN_DESTINATION,collection:'tapcalcJobs'},fetch}),{code:'legacy-read-only'});
for(const endpoint of ['https://firestore.googleapis.com','http://example.com','http://127.0.0.1@evil.invalid'])assert.throws(()=>createModernTransport({kind:'synthetic-only',endpoint,destination:MODERN_DESTINATION,fetch}),/localhost|synthetic/);
console.log('PASS source production binding enabled; synthetic non-loopback relays rejected');
{
 const job=modernJobFixture();job.title='<script>private notes</script>';job.sharedState.jobNotes='<img src=x onerror=alert(1)>';
 const item=buildSharedSnapshot(job),current=item.record.preAlphaCapture.operations.find(op=>op.id==='htp');current.results.htp[0].value='123.4567';
 const envelope=await makeEnvelope(item,MODERN_DESTINATION),received=await verifyEnvelope(envelope,{destination:MODERN_DESTINATION});
 const html=modernSnapshotMarkup({item:received,envelope});assert.ok(html.includes('123.4567'),'Recipient displays captured value, not recalculated current math');assert.ok(html.includes('777'));assert.ok(html.includes('888'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img'));assert.equal((html.match(/data-modern-operation=/g)||[]).length,4);assert.ok(html.includes('futureBundle'));
 const invalid=clone(item);invalid.record.preAlphaCapture.operations[0].results.tap[0].value=undefined;await assert.rejects(makeEnvelope(invalid,MODERN_DESTINATION),{code:'unsupported-value'});
 const missing=clone(item);missing.record.preAlphaCapture.operations=[];await assert.rejects(verifyEnvelope(await makeEnvelope(missing,MODERN_DESTINATION)),{code:'invalid-snapshot'});
 console.log('PASS complete read-only view: captured result attribution, escaped notes, retained originals/history/unknowns, malformed captures rejected');
}
{
 const h=await harness();try{
  const before=clone(h.job);const a=h.saver.save(h.job,h.version),b=h.saver.save(h.job,h.version);const [one,two]=await Promise.all([a,b]);assert.deepEqual(one,two);
  assert.equal(h.relay.posts.length,1);assert.equal(h.store.sharedSnapshots().length,1);
  const capture=h.store.sharedSnapshots()[0],envelope=capture.item.record.modernSnapshot,item=await verifyEnvelope(envelope,{destination:MODERN_DESTINATION,cloudId:one.cloudId});
  const expected=buildSharedSnapshot(before);expected.record.modernRelay=clone(h.transport.binding);assert.deepEqual(item,expected);assert.deepEqual(item.record.preAlphaCapture.job,before);assert.equal(item.record.jobBundle.operations.length,4);assert.deepEqual(h.job,before);
  assert.equal(envelope.schema,2);assert.equal(h.relay.requests.every(request=>request.authorization===null),true,'No account or bearer token required');assert.deepEqual(envelope.destination,MODERN_DESTINATION);assert.deepEqual(item.record.preAlphaCapture.job.operations[0].state.future,before.operations[0].state.future);
  const posts=h.relay.posts.length;await h.saver.retry(one.captureId);assert.equal(h.relay.posts.length,posts);
  const received=await h.transport.get(one.cloudId);assert.deepEqual(received.item,item);assert.equal((await h.transport.list()).length,1);
  const working=workingCopyOf(received.item,{uuid:()=> 'separate-working-copy'});assert.notEqual(working.id,before.id);assert.deepEqual(working.operations,before.operations);assert.deepEqual(working.original,before.original);assert.equal(working.sourceId,working.id);
  assert.deepEqual(h.legacy,new Map([['measurementCardHistoryV1','unchanged-history'],['measurementCardStateV1','unchanged-state']]));
  assert.deepEqual((await h.transport.get(one.cloudId)).item,item,'Fresh anonymous reader receives the complete snapshot');
  console.log('PASS complete nested-array JSON capture, canonical/history attribution, local-first duplicate clicks, verified receipt/read/list, scope-bound retry and separate working identity');
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
{
 const h=await harness();try{
  h.relay.setMode('post-denied');let id;await assert.rejects(h.saver.save(h.job,h.version),error=>{id=error.captureId;return true;});
  const before=h.relay.requests.length;
  await assert.rejects(h.saver.confirmed(id),{code:'unconfirmed-upload'});assert.equal(h.relay.requests.length,before,'Copy-link validation never uploads an unconfirmed capture');
  const other=createModernSaver({store:h.store,transport:createModernTransport({...h.config,destination:{...MODERN_DESTINATION,collection:'otherTeamSnapshots'}})});
  await assert.rejects(other.retry(id),{code:'destination-changed'});assert.equal(h.relay.requests.length,before);
  console.log('PASS destination switch: pending capture cannot redirect');
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
  const item=buildSharedSnapshot(h.job);item.record.modernRelay=clone(h.transport.binding);const envelope=await makeEnvelope(item,MODERN_DESTINATION),id='tm2-'+envelope.contentHash;
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
  console.log('PASS restarted store recovers identical pending capture/schema/destination and verifies acknowledgement');
 }finally{await h.close();}
}
{
 const h=await harness(),other=await modernRelayFixture();try{
  h.relay.setMode('post-denied');let id;await assert.rejects(h.saver.save(h.job,h.version),error=>{id=error.captureId;return true;});const before=h.relay.requests.length;
  const moved=createModernSaver({store:h.store,transport:createModernTransport({...h.config,endpoint:other.endpoint})});
  await assert.rejects(moved.retry(id),{code:'environment-changed'});assert.equal(other.requests.length,0);assert.equal(h.relay.requests.length,before);assert.equal(h.store.sharedSnapshots()[0].receipt,null);
  console.log('PASS relay/environment switch: a synthetic pending capture cannot move to another relay or future production binding');
 }finally{await h.close();await other.close();}
}
{
 const h=await harness(),other=await modernRelayFixture();try{
  h.relay.setRedirect(other.endpoint+'/v1/'+other.name+'/'+MODERN_DESTINATION.collection);
  await assert.rejects(h.saver.save(h.job,h.version),{code:'network-failure'});assert.equal(other.requests.length,0);assert.equal(h.relay.posts.length,0);assert.equal(h.store.sharedSnapshots()[0].receipt,null);
  console.log('PASS relay redirect denied: no request or captured payload leaves the configured synthetic relay');
 }finally{await h.close();await other.close();}
}
console.log('PASS anonymous modern sharing synthetic core. Production remains unbound; real Firebase rules/emulator/backend and browser integration are not certified by these fixtures.');

{
 const h=await harness();try{
  const saved=await h.saver.save(h.job,h.version),legacyScope={...MODERN_DESTINATION,collection:'tapcalcJobs'},old={...clone(h.job.original),id:saved.cloudId,source:'cloud'};
  old.record.job.notes='<img src=x onerror=alert(1)>';const bytes=JSON.stringify(old);let legacy=[old],legacyFail=false,calls=0;
  const library=createSharedLibrary({legacyDestination:legacyScope,legacyList:async()=>{calls++;if(legacyFail)throw Error('Synthetic legacy read failure');return clone(legacy);},modernTransport:h.transport});
  const [first,twin]=await Promise.all([library.refresh(),library.refresh()]);assert.deepEqual(first,twin);assert.equal(calls,1);assert.equal(first.jobs.length,2);assert.equal(new Set(first.jobs.map(job=>job.id)).size,2);assert.notEqual(sharedLibraryKey(legacyScope,saved.cloudId),sharedLibraryKey(MODERN_DESTINATION,saved.cloudId));
  const original=first.jobs.find(job=>job.sharedSnapshot.kind==='legacy');assert.equal(JSON.stringify(original.sharedSnapshot.entry),bytes);const html=legacySnapshotMarkup(original.sharedSnapshot);assert.equal((html.match(/data-modern-operation=/g)||[]).length,4);assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<img'));assert.ok(html.includes('777'));assert.ok(html.includes('888'));assert.ok(html.includes('not assigned to every operation'));
  legacy.push({...clone(old),id:'another-old-job'});h.relay.setMode('denied');const partial=await library.refresh();assert.equal(partial.jobs.length,3);assert.equal(partial.status.legacy.state,'ready');assert.equal(partial.status.modern.state,'failed');
  h.relay.setMode('success');legacyFail=true;const next=clone(h.job);next.operations[0].state.md='13';await h.saver.save(next,h.store.read().versions.get(next.id));const opposite=await library.refresh();assert.equal(opposite.jobs.length,4);assert.equal(opposite.status.legacy.state,'failed');assert.equal(opposite.status.modern.state,'ready');assert.equal(JSON.stringify(old),bytes);
  const unbound=createSharedLibrary({legacyDestination:legacyScope,legacyList:async()=>clone(legacy)});const value=await unbound.refresh();assert.equal(value.jobs.length,2);assert.equal(value.status.modern.state,'unbound');assert.equal(JSON.stringify(legacyLibraryEntry(old,legacyScope).sharedSnapshot.entry),bytes);
  console.log('PASS one-list namespace-safe identity, complete legacy saved-value view, hostile text escaping, both partial-refresh directions, duplicate refresh coalescing, unbound saving and original-record preservation');
 }finally{await h.close();}
}

{
 const h=await harness();try{
  const item=buildSharedSnapshot(h.job);item.record.modernRelay=clone(h.transport.binding);const envelope=await makeEnvelope(item,MODERN_DESTINATION),id='tm2-'+envelope.contentHash;
  const url=h.relay.endpoint+'/v1/'+h.relay.name,commit={writes:[{update:{name:h.relay.name+'/'+MODERN_DESTINATION.collection+'/'+id,fields:envelopeFields(envelope)},currentDocument:{exists:false},updateTransforms:[{fieldPath:'syncedAt',setToServerValue:'REQUEST_TIME'}]}]};
  const response=await fetch(url+':commit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(commit)});assert.equal(response.status,200);
  assert.equal((await fetch(url+'/'+MODERN_DESTINATION.collection)).status,200);assert.equal((await fetch(url+'/'+MODERN_DESTINATION.collection+'/'+id)).status,200);
  assert.equal((await fetch(url+':commit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(commit)})).status,409);
  for(const method of ['PATCH','DELETE'])assert.equal((await fetch(url+'/'+MODERN_DESTINATION.collection+'/'+id,{method})).status,403);
  assert.throws(()=>h.transport.update(),{code:'immutable'});assert.throws(()=>h.transport.delete(),{code:'immutable'});
  assert.equal(h.relay.requests.every(entry=>entry.authorization===null),true);const bytes=JSON.stringify([...h.relay.docs]);h.relay.setMode('pagination-loop');await assert.rejects(h.transport.list(),{code:'pagination'});assert.equal(JSON.stringify([...h.relay.docs]),bytes);
  console.log('PASS anonymous synthetic policy: get/list/create, duplicate create collision, no update/delete, no credentials and pagination-loop detection');
 }finally{await h.close();}
}
{
 const h=await harness();try{
  const item=buildSharedSnapshot(h.job);item.record.modernSnapshot={schema:1,ownerUid:'retained-private-fixture'};await h.store.save(h.job,h.version,{sharedCapture:{id:'retained-private-capture',jobId:h.job.id,item}});
  const before=h.database.peek();await assert.rejects(h.saver.retry('retained-private-capture'),{code:'unbound-capture'});assert.equal(h.database.peek(),before);assert.equal(h.relay.requests.length,0);
  console.log('PASS private schema1 captures retained without promotion, reinterpretation or upload');
 }finally{await h.close();}
}
