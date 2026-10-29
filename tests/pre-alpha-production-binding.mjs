// Production URL/identity contract using injected in-memory fetch ONLY. No external request.
import assert from 'node:assert/strict';
import {createProductionTransport,documentEnvelope} from '../pre-alpha/modern-transport.mjs';
import {MODERN_DESTINATION,PRODUCTION_MODERN_BINDING,PRODUCTION_MODERN_PROPOSAL} from '../pre-alpha/modern-sharing-config.mjs';
import {makeEnvelope,verifyEnvelope} from '../pre-alpha/modern-envelope.mjs';
import {buildSharedSnapshot} from '../pre-alpha/shared-save.mjs';
import {createModernSaver} from '../pre-alpha/modern-saver.mjs';
import {createWorkspaceStore} from '../pre-alpha/workspace-store.mjs';
import {memoryDatabase} from './pre-alpha-memory-database.mjs';
import {modernJobFixture} from './modern-job-fixture.mjs';
const clone=value=>structuredClone(value),proposal=PRODUCTION_MODERN_BINDING,key='synthetic-public-identifier-a';
assert.equal(PRODUCTION_MODERN_BINDING,PRODUCTION_MODERN_PROPOSAL);assert.equal(PRODUCTION_MODERN_PROPOSAL.enabled,true);assert.equal(Object.isFrozen(PRODUCTION_MODERN_PROPOSAL),true);assert.equal(Object.isFrozen(PRODUCTION_MODERN_PROPOSAL.destination),true);
let calls=0;const forbidden=()=>{calls++;throw Error('No real fetch is allowed in this test');};
assert.throws(()=>createProductionTransport({proposal:{...proposal,enabled:false},apiKey:key,fetch:forbidden}),{code:'production-disabled'});assert.equal(calls,0);
for(const change of [{endpoint:'http://firestore.googleapis.com'},{endpoint:'https://example.invalid'},{endpoint:'https://firestore.googleapis.com/?key=other'},{kind:'synthetic-only'},{id:'another-binding'},{schema:1},{extra:'unsupported'},...['projectId','database','collection'].map(field=>({destination:{...MODERN_DESTINATION,[field]:field==='database'?'default':field==='collection'?'tapcalcJobs':'another-project'}}))])assert.throws(()=>createProductionTransport({proposal:{...proposal,...change},apiKey:key,fetch:forbidden}));
for(const apiKey of [null,'','a\r\nb','a?key=other'])assert.throws(()=>createProductionTransport({proposal,apiKey,fetch:forbidden}),{code:'production-unbound'});
assert.throws(()=>createProductionTransport({proposal,apiKey:key}),{code:'production-unbound'});assert.equal(calls,0);
console.log('PASS production binding enabled by source; explicit disabled descriptor rejects; fixed HTTPS project/(default)/new namespace; invalid or missing explicit dependencies reject before fetch');

const docs=new Map(),requests=[],name='projects/tapcalc-afc92/databases/(default)/documents',reply=(status,value)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});let mode='success',online=false,posts=0;
const fetcher=async(url,options)=>{
 const target=new URL(url);assert.equal(target.origin,'https://firestore.googleapis.com');assert.equal(target.searchParams.get('key'),key);assert.deepEqual([...target.searchParams.keys()].filter(field=>field!=='key').sort(),target.pathname.endsWith('/tapcalcModernSnapshots')?['pageSize']:[]);
 assert.equal(options.credentials,'omit');assert.equal(options.redirect,'error');assert.equal(options.cache,'no-store');assert.deepEqual(Object.keys(options.headers),['Content-Type']);
 requests.push({method:options.method,path:target.pathname});
 if(target.pathname==='/v1/'+name+':commit'){
  assert.equal(options.method,'POST');posts++;const body=JSON.parse(options.body);assert.equal(body.writes.length,1);const write=body.writes[0];assert.deepEqual(write.currentDocument,{exists:false});assert.equal(write.updateMask,undefined);assert.equal(write.delete,undefined);assert.deepEqual(write.updateTransforms,[{fieldPath:'syncedAt',setToServerValue:'REQUEST_TIME'}]);
  assert.ok(write.update.name.startsWith(name+'/tapcalcModernSnapshots/tm2-'));if(mode==='denied')return reply(403,{error:{status:'PERMISSION_DENIED'}});if(docs.has(write.update.name))return reply(409,{error:{status:'ALREADY_EXISTS'}});
  docs.set(write.update.name,{...clone(write.update),fields:{...write.update.fields,syncedAt:{timestampValue:'synthetic-server-time'}}});if(mode==='late-commit'){mode='success';throw Error('Synthetic acknowledgement loss');}return reply(200,{writeResults:[{updateTime:'synthetic-server-time'}]});
 }
 assert.equal(options.method,'GET');assert.ok(target.pathname.startsWith('/v1/'+name+'/tapcalcModernSnapshots'));
 if(target.pathname==='/v1/'+name+'/tapcalcModernSnapshots')return reply(200,{documents:[...docs.values()]});
 const document=docs.get(target.pathname.slice('/v1/'.length));return document?reply(200,document):reply(404,{error:{status:'NOT_FOUND'}});
};
const transport=createProductionTransport({proposal,apiKey:key,fetch:fetcher,online:()=>online,timeoutMs:500}),database=memoryDatabase();
const store=createWorkspaceStore({storage:{getItem:()=>null},database,locks:{request:(_name,_options,callback)=>callback()},now:()=> 'synthetic-production-time'});await store.ready;
const first=await store.save(modernJobFixture(),null),saver=createModernSaver({store,transport});
let pendingId;await assert.rejects(saver.save(first.job,first.version),error=>{pendingId=error.captureId;return error.code==='offline';});
const pending=clone(store.sharedSnapshots().find(capture=>capture.id===pendingId));assert.ok(pending);assert.equal(pending.receipt,null);assert.deepEqual(pending.item.record.preAlphaCapture.job,first.job);assert.deepEqual(pending.item.record.modernRelay,transport.binding);assert.equal(JSON.stringify(pending).includes(key),false);assert.equal(requests.length,0);
online=true;mode='denied';await assert.rejects(saver.retry(pendingId),{code:'permission-denied'});assert.deepEqual(store.sharedSnapshots().find(capture=>capture.id===pendingId).item,pending.item);assert.equal(docs.size,0);
mode='success';const confirmed=await saver.retry(pendingId);assert.ok(store.sharedSnapshots().find(capture=>capture.id===pendingId).receipt);assert.equal(docs.size,1);const old=JSON.stringify([...docs]);
const received=await transport.get(confirmed.cloudId);assert.deepEqual(received.item.record.preAlphaCapture.job,first.job);assert.equal((await transport.list()).length,1);
const postCount=posts;await saver.retry(pendingId);assert.equal(posts,postCount);assert.throws(()=>transport.update(),{code:'immutable'});assert.throws(()=>transport.delete(),{code:'immutable'});assert.equal(JSON.stringify([...docs]),old);
const changed=clone(first.job);changed.operations[0].state.md='21 1/4';mode='late-commit';await saver.save(changed,store.read().versions.get(changed.id));assert.equal(docs.size,2);assert.equal(JSON.stringify([...docs].slice(0,1)),old);assert.ok(store.sharedSnapshots().every(capture=>capture.receipt));
assert.deepEqual((await transport.list()).map(snapshot=>snapshot.item.record.preAlphaCapture.job.operations[0].state.md),[first.job.operations[0].state.md,'21 1/4']);
const fixture=buildSharedSnapshot(first.job);fixture.record.modernRelay={kind:'synthetic-only',endpoint:'http://127.0.0.1:9999'};const fixtureEnvelope=await makeEnvelope(fixture,MODERN_DESTINATION),before=requests.length;await assert.rejects(transport.upload(fixtureEnvelope),{code:'environment-changed'});assert.equal(requests.length,before);
const last=[...docs.values()].at(-1),envelope=documentEnvelope(last);assert.deepEqual(await verifyEnvelope(envelope,{destination:MODERN_DESTINATION,binding:transport.binding,cloudId:last.name.split('/').at(-1)}),JSON.parse(envelope.payloadJson));
assert.equal(PRODUCTION_MODERN_BINDING,PRODUCTION_MODERN_PROPOSAL);assert.equal(PRODUCTION_MODERN_PROPOSAL.enabled,true);
console.log('PASS injected-only production contract: local-first complete capture; public identifier outside immutable data; anonymous fixed-target GET/list/create-only server stamp/readback; denied/offline exact retry, receipt/dedup, late acknowledgement recovery, immutable append and no fixture promotion');
