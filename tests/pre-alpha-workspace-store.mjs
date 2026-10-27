import assert from 'node:assert/strict';
import {createWorkspaceStore,WORKSPACE_KEY,WORKSPACE_LOCK} from '../pre-alpha/workspace-store.mjs';
import {STORAGE_KEY,normalizeJob,deleteOperation} from '../pre-alpha/model.mjs';
import {memoryDatabase} from './pre-alpha-memory-database.mjs';

const fixture=id=>normalizeJob({id,source:'experimental',record:{jobBundle:{selectedOperationId:'a',sharedState:{jobDescription:id},operations:[{id:'a',label:'A',operationType:'Hot Tap',state:{md:'10',unknownFuture:{preserve:true}}},{id:'b',label:'B',operationType:'Line Stop',state:{lsLiManualToggle:true,lsLiManual:'22'}}]}}});
async function harness(initial=[]){
  const memory=new Map([[STORAGE_KEY,JSON.stringify({build:'pre-alpha10',jobs:initial,activeId:initial[0]?.id})],['measurementCardHistoryV1','legacy-history-sentinel'],['measurementCardStateV1','live-draft-sentinel']]);
  let queue=Promise.resolve(),serial=0;
  const database=memoryDatabase(),writes=database.writes;
  const storage={getItem:key=>memory.get(key)??null,setItem(){throw new Error('Read-only legacy storage must not be written');}};
  const locks={request(name,options,fn){assert.equal(name,WORKSPACE_LOCK);assert.equal(options.mode,'exclusive');const pending=queue.then(fn);queue=pending.catch(()=>{});return pending;}};
  const tab=async()=>{const store=createWorkspaceStore({storage,locks,database,uuid:()=>`synthetic-${++serial}`,now:()=>`time-${serial}`});await store.ready;return store;};
  return {memory,storage,locks,database,tab,writes,legacy:memory.get(STORAGE_KEY)};
}
let checks=0;
const check=async(name,fn)=>{await fn();checks++;console.log('PASS '+name);};
await check('stale tabs save unrelated jobs without replacing either; legacy keys byte-identical',async()=>{
  const h=await harness(),a=await h.tab(),b=await h.tab();a.read();b.read();
  await Promise.all([a.save(fixture('new-a'),null),b.save(fixture('new-b'),null)]);
  await a.refresh();assert.deepEqual(a.read().jobs.map(x=>x.id).sort(),['new-a','new-b']);
  assert.equal(h.memory.get(STORAGE_KEY),h.legacy);
  assert.equal(h.memory.get('measurementCardHistoryV1'),'legacy-history-sentinel');assert.equal(h.memory.get('measurementCardStateV1'),'live-draft-sentinel');
  assert.equal(h.writes.length,2);assert.equal(h.memory.has(WORKSPACE_KEY),false);
});
await check('same-job simultaneous rename versus operation deletion rejects stale overwrite',async()=>{
  const initial=fixture('same'),h=await harness([initial]),a=await h.tab(),b=await h.tab();
  const va=a.read(),vb=b.read(),rename=va.jobs[0],deletion=vb.jobs[0];rename.title='Renamed';rename.sharedState.jobDescription='Renamed';deleteOperation(deletion,'b');
  const results=await Promise.allSettled([a.save(rename,va.versions.get('same')),b.save(deletion,vb.versions.get('same'))]);
  assert.equal(results[0].status,'fulfilled');assert.equal(results[1].reason.code,'conflict');
  const saved=a.read().jobs[0];assert.equal(saved.title,'Renamed');assert.equal(saved.operations.length,2);assert.deepEqual(saved.original,initial.original);
  const copy=await b.save(deletion,null,{copy:true});assert.equal(copy.job.operations.length,1);assert.equal(copy.job.source,'experimental');assert.equal(copy.job.sourceId,copy.job.id);assert.notEqual(copy.job.id,'same');assert.deepEqual(copy.job.original,initial.original);
  await a.refresh();assert.equal(a.read().jobs.length,2);assert.equal(a.read().jobs.find(x=>x.id==='same').operations.length,2);
});
await check('stale edit cannot resurrect deleted operation or revert manual settings',async()=>{
  const h=await harness([fixture('same')]),a=await h.tab(),b=await h.tab(),base=a.read(),stale=b.read();
  deleteOperation(base.jobs[0],'b');await a.save(base.jobs[0],base.versions.get('same'));
  stale.jobs[0].operations[1].state.lsLiManual='33';
  await assert.rejects(b.save(stale.jobs[0],stale.versions.get('same')),{code:'conflict'});
  assert.equal(a.read().jobs[0].operations.length,1);
});
await check('old writer during new commit retains unseen old job; new writer never touches legacy key',async()=>{
  const h=await harness(),a=await h.tab();
  h.database.setBeforeWrite(()=>h.memory.set(STORAGE_KEY,JSON.stringify({jobs:[fixture('old-during-commit')]})));
  await a.save(fixture('new-during-commit'),null);
  assert.deepEqual(a.read().jobs.map(x=>x.id).sort(),['new-during-commit','old-during-commit']);
  h.memory.set(STORAGE_KEY,JSON.stringify({jobs:[fixture('later-old-job')]}));
  assert.deepEqual(a.read().jobs.map(x=>x.id).sort(),['later-old-job','new-during-commit']);
  assert.equal(h.writes.length,1);assert.equal(h.memory.has(WORKSPACE_KEY),false);
});
await check('legacy same-ID divergence remains explicit across reload; both saved versions survive copy',async()=>{
  const original=fixture('same'),h=await harness([original]),a=await h.tab(),view=a.read();view.jobs[0].title='New tab';await a.save(view.jobs[0],view.versions.get('same'));
  const older=fixture('same');older.title='Older tab';older.operations[0].state.md='77';h.memory.set(STORAGE_KEY,JSON.stringify({jobs:[older]}));
  const reloaded=(await h.tab()).read();assert.equal(reloaded.jobs[0].title,'New tab');assert.equal(reloaded.conflicts.get('same').title,'Older tab');
  await assert.rejects(a.save(reloaded.jobs[0],reloaded.versions.get('same')),{code:'legacy-conflict'});
  const oldBytes=h.memory.get(STORAGE_KEY),copy=await a.save(reloaded.conflicts.get('same'),null,{copy:true});
  assert.equal(copy.job.operations[0].state.md,'77');assert.equal(h.memory.get(STORAGE_KEY),oldBytes);assert.ok(a.read().conflicts.has('same'),'Copy never silently acknowledges the divergent legacy base');
});
await check('immutable queued snapshots and per-job baselines',async()=>{
  const h=await harness(),a=await h.tab(),job=fixture('pending');let release;const gate=new Promise(resolve=>release=resolve);
  const held=h.locks.request(WORKSPACE_LOCK,{mode:'exclusive'},()=>gate);
  const saving=a.save(job,null);job.title='Later unsaved edit';job.operations[0].state.md='99';release();await held;const first=await saving;
  assert.equal(first.job.title,'pending');assert.equal(first.job.operations[0].state.md,'10');
  const second=await a.save(job,first.version);assert.equal(second.job.title,'Later unsaved edit');
  await a.save(fixture('other'),null);job.title='Third edit';await a.save(job,second.version);assert.equal(a.read().jobs.find(x=>x.id==='pending').title,'Third edit');
});
await check('quota/write failure does not advance persisted versions; retry succeeds',async()=>{
  const h=await harness([fixture('same')]),a=await h.tab(),view=a.read(),before=[...h.memory];
  const durableBefore=h.database.peek();h.database.setBeforeWrite(()=>{throw new Error('quota');});
  view.jobs[0].title='Unsaved';await assert.rejects(a.save(view.jobs[0],view.versions.get('same')),/quota/);assert.deepEqual([...h.memory],before);
  assert.equal(h.database.peek(),durableBefore);h.database.setBeforeWrite(()=>{});await a.save(view.jobs[0],view.versions.get('same'));assert.equal(a.read().jobs[0].title,'Unsaved');
});
await check('no Web Locks fails closed without any write',async()=>{
  const h=await harness(),store=createWorkspaceStore({storage:h.storage,locks:null,database:h.database});await assert.rejects(store.save(fixture('unsafe'),null),{code:'locking-unavailable'});assert.equal(h.writes.length,0);
});
await check('selection-only commit changes resume ID, not job content or legacy bytes',async()=>{
  const h=await harness([fixture('a'),fixture('b')]),a=await h.tab(),before=a.read();await a.select('b');
  assert.equal(a.read().activeId,'b');assert.deepEqual(a.read().jobs,before.jobs);assert.deepEqual(a.read().versions,before.versions);assert.equal(h.memory.get(STORAGE_KEY),h.legacy);
});
await check('discarded pending draft is checked again inside the lock before mutation',async()=>{
  const h=await harness(),a=await h.tab();let release,current=true;
  const held=h.locks.request(WORKSPACE_LOCK,{mode:'exclusive'},()=>new Promise(resolve=>release=resolve));
  await Promise.resolve();const pending=a.save(fixture('discarded'),null,{isCurrent:()=>current});current=false;release();await held;
  await assert.rejects(pending,{code:'cancelled'});assert.equal(h.writes.length,0);
});
await check('corrupt or unsupported legacy/companion state refuses writes and preserves bytes',async()=>{
  const badOperation=fixture('bad');badOperation.operations=[null];
  const badState=fixture('bad');badState.sharedState=[];
  const badDate=fixture('bad');badDate.savedAt=10;
  for(const [key,raw] of [[STORAGE_KEY,'{broken'],[STORAGE_KEY,'{"jobs":{}}'],...[badOperation,badState,badDate].map(job=>[STORAGE_KEY,JSON.stringify({jobs:[job]})]),[WORKSPACE_KEY,'{broken'],[WORKSPACE_KEY,'{"format":2,"entries":[]}']]){
    const h=await harness(),a=await h.tab();h.memory.set(key,raw);const before=[...h.memory];assert.throws(()=>a.read(),{code:'invalid-storage'});await assert.rejects(a.save(fixture('unsafe'),null),{code:'invalid-storage'});assert.deepEqual([...h.memory],before);assert.equal(h.writes.length,0);
  }
});
await check('permanently stale localStorage cannot authorize a second save against a committed DB revision',async()=>{
  const h=await harness([fixture('same')]),a=await h.tab(),b=await h.tab(),va=a.read(),vb=b.read(),oldBytes=[...h.memory];
  va.jobs[0].title='Transaction A';vb.jobs[0].operations.pop();
  await a.save(va.jobs[0],va.versions.get('same'));
  assert.equal(b.read().jobs[0].title,'same','The tab cache is deliberately stale');
  await assert.rejects(b.save(vb.jobs[0],vb.versions.get('same')),{code:'conflict'});
  await b.refresh();assert.equal(b.read().jobs[0].title,'Transaction A');assert.equal(b.read().jobs[0].operations.length,2);
  assert.deepEqual([...h.memory],oldBytes);assert.equal(h.writes.length,1);
});
await check('old V1 companion is read-only; new writes and divergent older tabs retain both complete versions',async()=>{
  const h=await harness(),older=fixture('same'),entry={job:older,revision:'old-v1',legacyBase:null};
  const raw=JSON.stringify({format:1,activeId:'same',entries:[entry]});h.memory.set(WORKSPACE_KEY,raw);
  const a=await h.tab(),view=a.read();assert.deepEqual(view.jobs[0],older);assert.equal(h.writes.length,0);
  view.jobs[0].title='Transactional edit';await a.save(view.jobs[0],view.versions.get('same'));
  assert.equal(h.memory.get(WORKSPACE_KEY),raw);
  older.operations[0].state.md='77';const oldWrite=JSON.stringify({format:1,entries:[entry]});h.memory.set(WORKSPACE_KEY,oldWrite);
  await a.refresh();const current=a.read();assert.equal(current.jobs[0].title,'Transactional edit');assert.equal(current.conflicts.get('same').operations[0].state.md,'77');
  await assert.rejects(a.save(current.jobs[0],current.versions.get('same')),{code:'legacy-conflict'});
  await a.save(current.conflicts.get('same'),null,{copy:true});assert.equal(a.read().jobs.length,2);assert.equal(h.memory.get(WORKSPACE_KEY),oldWrite);
  assert.deepEqual(a.read().jobs.find(job=>job.id==='same').original,older.original);
});
await check('unsupported or corrupt transactional storage fails closed and retains legacy bytes',async()=>{
  const h=await harness([fixture('same')]);h.database.seed('{broken');const oldBytes=[...h.memory],oldDurable=h.database.peek();
  const bad=createWorkspaceStore({storage:h.storage,locks:h.locks,database:h.database});
  await assert.rejects(bad.ready,{code:'invalid-storage'});await assert.rejects(bad.save(fixture('new'),null),{code:'invalid-storage'});
  assert.equal(h.database.peek(),oldDurable);assert.deepEqual([...h.memory],oldBytes);assert.equal(h.writes.length,0);
  const denied=Object.assign(new Error('Denied storage'),{code:'database-unavailable'});
  const unavailable=createWorkspaceStore({storage:h.storage,locks:h.locks,database:{read:async()=>{throw denied;},update:()=>assert.fail('No fallback write')}});
  await assert.rejects(unavailable.ready,error=>error===denied);await assert.rejects(unavailable.save(fixture('new'),null),error=>error===denied);
  assert.deepEqual([...h.memory],oldBytes);
});
await check('missing selection from a stale tab cannot replace the authoritative transaction record',async()=>{
  const h=await harness(),a=await h.tab(),b=await h.tab();await a.save(fixture('new'),null);
  const before=h.database.peek();await b.select('missing');assert.equal(h.database.peek(),before);assert.equal(h.writes.length,1);
});
await check('a delayed peer refresh cannot regress a newer committed local snapshot',async()=>{
  const h=await harness(),a=await h.tab();let release;
  const originalRead=h.database.read,old=h.database.peek();h.database.read=()=>new Promise(resolve=>release=()=>resolve(old));
  const pending=a.refresh();await a.save(fixture('newer'),null);release();await pending;
  assert.equal(a.read().jobs[0].id,'newer');assert.equal(h.writes.length,1);h.database.read=originalRead;
});
console.log(`PASS ${checks} network-free workspace persistence groups (synthetic storage/transaction/lock scheduler; browser races are tested separately)`);
