// Actual cloud-sync.js in a VM whose only fetch is synthetic REST.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import vm from 'node:vm';
import {buildSharedSnapshot,createSharedSaver} from '../pre-alpha/shared-save.mjs';
import {createWorkspaceStore} from '../pre-alpha/workspace-store.mjs';
import {normalizeJob} from '../pre-alpha/model.mjs';
import {memoryDatabase} from './pre-alpha-memory-database.mjs';
const clone=value=>structuredClone(value),deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
const state={bcoPipeMaterial:'CarbonSteel',bcoPipeOD:'6',preAlphaPipeOD:'6 5/8',bcoPipeID:'6',bcoCutterOD:'4',md:'10',ld:'-1/2',ldSign:'-',ptc:'1 1/4',start:'2',mt:'52',future:{raw:['1/4','invalid']}};
function fixture(){return normalizeJob({id:'synthetic-shared',record:{job:{pressure:'250 psi',temperature:'80 F',product:'Water'},future:{keep:true},measurements:{hotTap:{mco:'99',rodMco:'111'}},jobBundle:{selectedOperationId:'two',futureBundle:{keep:true},sharedState:{jobDescription:'Mock shared snapshot',jobNotes:'Raw notes α ¾'},operations:[{id:'one',operationType:'HTP',state:{...state,lineStopVariant:'htp'},measurements:{htp:{tco:'47.25'}}},{id:'two',operationType:'Line Stop',state:{...state,lsMd:'12',lsLd:'0',cpStart:'20',cpJbf:'1',cpLd:'2',cpPt:'3'},unknown:{keep:true}}]}}});}
async function harness(){
  let serial=0,queue=Promise.resolve();const database=memoryDatabase(),memory=new Map([['measurementCardHistoryV1','old-history'],['measurementCardStateV1','old-live']]);
  const storage={getItem:key=>memory.get(key)??null,setItem(){throw Error('Read-only source');}};
  const locks={request(_name,_options,fn){const task=queue.then(fn);queue=task.catch(()=>{});return task;}};
  const store=createWorkspaceStore({storage,locks,database,uuid:()=>String(++serial),now:()=> 'synthetic-time-'+serial});await store.ready;
  const saved=await store.save(fixture(),null);
  return {store,database,memory,job:saved.job,version:saved.version};
}
function restTransport(){
  const docs=new Map(),writes=[];let mode='success';
  const response=(status,payload)=>({ok:status<400,status,json:async()=>payload});
  const error=(status,message)=>response(status,{error:{message,status:message}});
  const context=vm.createContext({window:{TAPCALC_FIREBASE_CONFIG:{projectId:'demo-tapcalc-test',apiKey:'fixture'},TAPCALC_FIREBASE_COLLECTION:'fixtureJobs'},navigator:{onLine:true},crypto:webcrypto,TextEncoder,URL,URLSearchParams,AbortController,
    // Deterministic short mock deadlines; the unmodified transport still requests12000ms.
    setTimeout:fn=>setTimeout(fn,25),clearTimeout,
    fetch:async(url,options={})=>{
      const target=new URL(url);assert.equal(target.origin,'https://firestore.googleapis.com');assert.ok(target.pathname.startsWith('/v1/projects/demo-tapcalc-test/databases/(default)/documents'));assert.equal(target.searchParams.get('key'),'fixture');
      if(mode==='offline')throw new TypeError('Synthetic network failure');
      if(options.method==='POST'){
        const body=JSON.parse(options.body),write=body.writes[0];assert.deepEqual(write.currentDocument,{exists:false});assert.equal(write.updateMask,undefined);assert.equal(write.delete,undefined);
        const id=write.update.name.split('/').at(-1);writes.push(clone(write));
        if(mode==='denied')return error(403,'PERMISSION_DENIED');
        if(mode==='timeout')return new Promise(()=>{});
        if(docs.has(id))return error(409,'ALREADY_EXISTS');docs.set(id,clone(write.update));
        if(mode==='late-commit')return new Promise(()=>{});
        return response(200,{writeResults:[{updateTime:'synthetic-confirmed'}]});
      }
      assert.ok(!options.method||options.method==='GET');
      if(target.pathname.endsWith('/fixtureJobs')){
        const all=[...docs.values()];
        if(mode==='pagination'&&!target.searchParams.has('pageToken'))return response(200,{documents:all.slice(0,1),nextPageToken:'next'});
        return response(200,{documents:mode==='pagination'?all.slice(1):all});
      }
      const id=target.pathname.split('/').at(-1);
      if(mode==='collision')return response(200,{fields:{wrong:{booleanValue:true}}});
      return docs.has(id)?response(200,docs.get(id)):error(404,'NOT_FOUND');
    }});
  vm.runInContext(readFileSync(new URL('../cloud-sync.js',import.meta.url),'utf8'),context);
  return {docs,writes,upload:item=>context.window.tapCalcCloud.upload(item),list:()=>context.window.tapCalcCloud.list(),setMode:value=>{mode=value;}};
}
const raw=fixture(),before=clone(raw),item=buildSharedSnapshot(raw);
assert.deepEqual(raw,before);assert.equal(item.record.job.pressure,'250 psi');assert.equal(item.record.job.temperature,'80 F');assert.equal(item.record.job.product,'Water');
assert.deepEqual(item.record.jobBundle.operations,raw.operations);assert.deepEqual(item.record.preAlphaCapture.job,raw);assert.equal(item.record.jobBundle.futureBundle.keep,true);
assert.equal(item.record.measurements.hotTap.rodMco,'17.0625');assert.equal(item.record.measurements.hotTap.mco,'4.5625');assert.equal(item.record.measurements.completionPlug.li,'26.0000');assert.equal(item.record.preAlphaCapture.operations[0].supported,true);assert.deepEqual(Object.keys(item.record.preAlphaCapture.operations[0].results),['htp']);assert.ok(item.record.preAlphaCapture.operations[0].results.htp.every(row=>row.value===''),'Missing HTP fields never fall back to standard Hot Tap values');
const reopened=normalizeJob({id:'from-synthetic-cloud',record:item.record});assert.deepEqual(reopened.operations,raw.operations);assert.equal(reopened.selectedOperationId,'two');assert.equal(reopened.original.record.preAlphaCapture.job.original.record.future.keep,true);
const unsupported=buildSharedSnapshot({...raw,selectedOperationId:'one'});assert.equal(unsupported.record.measurements.hotTap,undefined);assert.equal(unsupported.record.measurements.htp.tco,'');assert.equal(unsupported.record.preAlphaCapture.job.operations[0].measurements.htp.tco,'47.25','Historical HTP remains unchanged, separate from current invalid TCO');
const invalid=buildSharedSnapshot({...raw,operations:raw.operations.map(op=>op.id==='two'?{...op,state:{...op.state,ld:'1/0'}}:op)});assert.equal(invalid.record.measurements.hotTap.rodMco,'');assert.equal(invalid.record.measurements.hotTap.mco,'4.5625');
console.log('PASS shared capture: complete raw/original/unknown/fraction bundles, selected canonical values, immutable attribution, metadata and Pre-Alpha reopen');
{
  const legacy=readFileSync(new URL('../measurement.js',import.meta.url),'utf8');
  const pairs=[['normalizeMode','getStoredCalcMode'],['cloneJson','escapeHtml'],['createBundleId','pickStateFields'],['pickStateFields','formatOperationType'],['formatOperationType','modeForOperationType'],['modeForOperationType','pluralizeOperationType'],['buildCombinedState','getOperationStateFields'],['mapRecordJobToSharedState','getBundleJobType'],['getBundleJobType','syncBundleJobType'],['syncBundleJobType','normalizeBundleItem'],['normalizeBundleItem','createOperationLabel'],['createOperationLabel','isAutoOperationLabel'],['isAutoOperationLabel','formatOperationOptionLabel'],['normalizeJobBundle','ensureJobBundleInitialized'],['buildStateFromRecord','setLibraryLane'],['inferOperationType','buildJobRecord']];
  const extract=(from,to)=>{const start=legacy.indexOf('function '+from+'('),end=legacy.indexOf('function '+to+'(',start);assert.ok(start>=0&&end>start);return legacy.slice(start,end);};
  const constants=['CALC_SCREEN_MODES','WORKFLOW_SCREEN_MODES','JOB_BUNDLE_VERSION','jobInfoFieldIds','SHARED_JOB_FIELD_IDS'].map(name=>legacy.match(new RegExp('const '+name+' = [^\\r\\n]+'))[0]).join('\n');
  const selected=legacy.slice(legacy.indexOf('function getSelectedOperationItem('),legacy.indexOf('window.getSelectedOperationItem ='));
  const context=vm.createContext({document:{querySelector:()=>null},record:clone(item.record)});
  vm.runInContext(constants+'\n'+pairs.map(([from,to])=>extract(from,to)).join('\n')+'\n'+selected+'\nglobalThis.loaded=normalizeJobBundle(record.jobBundle,record);globalThis.selectedState=buildStateFromRecord(record);',context);
  const loaded=JSON.parse(JSON.stringify(context.loaded)),selectedState=JSON.parse(JSON.stringify(context.selectedState));
  assert.equal(loaded.operations.length,raw.operations.length);assert.equal(loaded.selectedOperationId,raw.selectedOperationId);assert.equal(loaded.sharedState.jobPressure,'250 psi');assert.equal(loaded.sharedState.jobTemperature,'80 F');assert.equal(loaded.sharedState.jobProduct,'Water');
  for(const [index,operation]of raw.operations.entries())for(const [key,value]of Object.entries(operation.state))assert.deepEqual(loaded.operations[index].state[key],value,'Exact root loader retains raw '+key);
  assert.equal(selectedState.md,'10');assert.equal(selectedState.preAlphaPipeOD,'6 5/8');assert.deepEqual(selectedState.future,state.future);
  assert.deepEqual(item.record.preAlphaCapture.job,raw,'Complete original/unknown attribution remains in the shared record independently of legacy display normalization');
  console.log('PASS exact root bundle/state loader: all operations, selection, metadata, raw fractions/unknown states and retained independent provenance');
}

for(const mode of ['success','denied','offline','timeout','late-commit','collision']){
  const h=await harness(),rest=restTransport();rest.setMode(mode);let version=h.version;
  const saver=createSharedSaver({store:h.store,upload:rest.upload,crypto:webcrypto,onPrepared:result=>version=result.version});
  const a=saver.save(h.job,version),b=saver.save(h.job,version);assert.equal(a,b,'Duplicate clicks share one pending capture');
  const success=['success','late-commit'].includes(mode);let captureId;
  if(success)captureId=(await a).captureId;else await assert.rejects(a,error=>{captureId=error.captureId;return !!captureId;});
  const captures=h.store.sharedSnapshots();assert.equal(captures.length,1);assert.equal(captures[0].id,captureId);assert.deepEqual(captures[0].item.record.preAlphaCapture.job,h.job);
  assert.equal(Boolean(captures[0].receipt),success);assert.deepEqual(h.store.read().jobs[0].operations,h.job.operations);assert.equal(h.memory.get('measurementCardHistoryV1'),'old-history');assert.equal(h.memory.get('measurementCardStateV1'),'old-live');
  if(!success){rest.setMode('success');await saver.retry(captureId);assert.ok(h.store.sharedSnapshots()[0].receipt);}
  const writes=rest.writes.length;await saver.retry(captureId);assert.equal(rest.writes.length,writes,'Confirmed snapshot retry never overwrites or creates another record');
  const next=clone(h.job);next.operations[1].state.md='11';await saver.save(next,version);assert.equal(rest.docs.size,2,'Changed capture appends a distinct create-only document');
  assert.equal(h.store.sharedSnapshots().length,2);rest.setMode('pagination');assert.equal((await rest.list()).length,2);
  console.log('PASS injected actual transport '+mode+': local-first capture, stable retry, exists=false, dedup/pagination, retained raw job and changed snapshot append');
}

{
  const h=await harness(),started=deferred(),ack=deferred();let prepared;
  const saver=createSharedSaver({store:h.store,crypto:webcrypto,upload:async()=>{started.resolve();return ack.promise;},onPrepared:result=>prepared=result});
  const pending=saver.save(h.job,h.version);await started.promise;
  const newer=clone(prepared.job);newer.operations[1].state.md='999';const edited=await h.store.save(newer,prepared.version);
  ack.resolve('synthetic-cloud-id');await pending;
  assert.deepEqual(h.store.read().jobs[0],edited.job);assert.equal(h.store.read().versions.get(h.job.id),edited.version);assert.equal(h.store.sharedSnapshots()[0].item.record.preAlphaCapture.job.operations[1].state.md,'10');assert.equal(h.store.read().jobs[0].synced,undefined);
  await assert.rejects(h.store.confirmSharedSnapshot(h.store.sharedSnapshots()[0].id,'different-cloud-id'),{code:'receipt-conflict'});
  console.log('PASS late receipt: newer edit/version untouched, earlier snapshot alone acknowledged, conflicting receipt rejected');
}
for(const failure of ['conflict','quota','cancelled']){
  const h=await harness();let uploads=0;const saver=createSharedSaver({store:h.store,upload:async()=>{uploads++;return 'synthetic';},crypto:webcrypto});
  if(failure==='conflict'){const changed=clone(h.job);changed.title='Other tab';await h.store.save(changed,h.version);}
  if(failure==='quota')h.database.setBeforeWrite(()=>{throw Object.assign(new Error('Synthetic quota'),{name:'QuotaExceededError'});});
  const old=h.database.peek();await assert.rejects(saver.save(h.job,h.version,{isCurrent:()=>failure!=='cancelled'}));assert.equal(uploads,0);assert.equal(h.database.peek(),old);
  console.log('PASS local '+failure+': no cloud attempt or changed durable bytes');
}
{
  const h=await harness(),rest=restTransport();let prepared;
  const saver=createSharedSaver({store:h.store,crypto:webcrypto,upload:rest.upload,onPrepared:result=>{prepared=result;h.database.setBeforeWrite(()=>{throw Error('Synthetic receipt quota');});}});
  let captureId;await assert.rejects(saver.save(h.job,h.version),error=>{captureId=error.captureId;return /receipt quota/.test(error.message);});
  assert.equal(h.store.sharedSnapshots()[0].receipt,null);assert.equal(rest.docs.size,1);assert.deepEqual(h.store.read().jobs[0],prepared.job);
  h.database.setBeforeWrite(()=>{});const posts=rest.writes.length;await saver.retry(captureId);assert.equal(rest.writes.length,posts);assert.ok(h.store.sharedSnapshots()[0].receipt);
  console.log('PASS acknowledgement quota: immutable local pending capture survives server success; exact retry recovers receipt without another POST');
}
{
  const h=await harness(),rest=restTransport(),item=buildSharedSnapshot(h.job);await rest.upload(item);
  for(const [id,doc]of [...rest.docs]){rest.docs.delete(id);doc.name=doc.name.replace(/tc-[a-f0-9]+$/,'older-addDoc-id');rest.docs.set('older-addDoc-id',doc);}
  const posts=rest.writes.length,saver=createSharedSaver({store:h.store,crypto:webcrypto,upload:rest.upload});
  const result=await saver.save(h.job,h.version);assert.equal(result.cloudId,'older-addDoc-id');assert.equal(rest.writes.length,posts);
  console.log('PASS older addDoc recovery: exact localId/content match confirms prior document with no new write');
}
{
  const h=await harness();const nested=clone(h.job);nested.operations[1].state.future.raw=[['unsupported nested raw']];const rest=restTransport();const saver=createSharedSaver({store:h.store,upload:rest.upload,crypto:webcrypto});
  await assert.rejects(saver.save(nested,h.version),/nested array/);assert.deepEqual(h.store.read().jobs[0].operations,nested.operations);assert.deepEqual(h.store.sharedSnapshots()[0].item.record.preAlphaCapture.job.operations,nested.operations);assert.equal(rest.writes.length,0);
  console.log('PASS unsupported nested array: exact local capture retained, no dropped raw value or REST write');
}
assert.throws(()=>createSharedSaver({store:{}}),/explicitly injected/);
console.log('PASS shared-save draft units. Production transport remains unbound; browser/full validation still required.');
