import {BUILD,STORAGE_KEY} from './model.mjs?v=pre-alpha25';
import {createWorkspaceDatabase} from './workspace-database.mjs?v=pre-alpha25';

// Both older localStorage formats are read-only inputs. Web Locks alone did not
// make their cross-process reads fresh in WebKit. IndexedDB is the authority;
// compare revisions and write in one transaction, never a storage-key mirror.
export const WORKSPACE_KEY=STORAGE_KEY+'ConcurrentV1';
export const WORKSPACE_LOCK=WORKSPACE_KEY+':write';
const clone=value=>structuredClone(value);
const fingerprint=value=>value==null?null:JSON.stringify(value);
const captureFingerprint=value=>JSON.stringify(value,(_,child)=>child&&typeof child==='object'&&!Array.isArray(child)?Object.fromEntries(Object.keys(child).sort().map(key=>[key,child[key]])):child);
const fail=(code,message)=>Object.assign(new Error(message),{code});

function parse(raw,label){
  if(raw===null)return null;
  try{
    const value=JSON.parse(raw);
    if(!value||typeof value!=='object'||Array.isArray(value))throw new Error();
    return value;
  }catch{throw fail('invalid-storage',label+' could not be read. Its saved bytes have not been changed.');}
}
function object(value){return value&&typeof value==='object'&&!Array.isArray(value);}
function validJobs(jobs){
  return Array.isArray(jobs)&&jobs.every(job=>object(job)&&typeof job.id==='string'&&job.id&&typeof job.title==='string'&&typeof job.savedAt==='string'&&object(job.sharedState)&&Array.isArray(job.operations)&&job.operations.every(op=>object(op)&&typeof op.id==='string'&&op.id&&object(op.state))&&new Set(job.operations.map(op=>op.id)).size===job.operations.length)&&new Set(jobs.map(job=>job.id)).size===jobs.length;
}
function readState(storage,durableRaw=null){
  const legacy=parse(storage.getItem(STORAGE_KEY),'The older workspace');
  if(legacy&&!validJobs(legacy.jobs))throw fail('invalid-storage','The older workspace has an unsupported format. It has not been changed.');
  const companion=parse(storage.getItem(WORKSPACE_KEY),'The older concurrent workspace');
  const record=parse(durableRaw,'The transactional workspace');
  for(const value of [companion,record])if(value&&(value.format!==1||!Array.isArray(value.entries)||!validJobs(value.entries.map(entry=>entry?.job))||value.entries.some(entry=>typeof entry.revision!=='string'||!entry.revision||!(entry.legacyBase===null||typeof entry.legacyBase==='string')||entry.companionBase!==undefined&&entry.companionBase!==null&&typeof entry.companionBase!=='string')))throw fail('invalid-storage','The workspace has an unsupported format. Its saved bytes have not been changed.');
  return {legacy:legacy||{jobs:[],activeId:null},companion:companion||{entries:[],activeId:null},record:record||{format:1,build:BUILD,activeId:null,entries:[]}};
}
function viewOf({legacy,companion,record}){
  const entries=new Map(record.entries.map(entry=>[entry.job.id,entry]));
  const prior=new Map(companion.entries.map(entry=>[entry.job.id,entry]));
  const combined=new Map([...prior,...entries]);
  const older=new Map(legacy.jobs.map(job=>[job.id,job]));
  const jobs=[...combined.values()].map(entry=>entry.job).concat(legacy.jobs.filter(job=>!combined.has(job.id)));
  const versions=new Map(),conflicts=new Map();
  for(const job of jobs){
    const entry=combined.get(job.id),old=older.get(job.id),previous=prior.get(job.id);
    versions.set(job.id,JSON.stringify([entry?.revision??null,fingerprint(old),fingerprint(previous?.job)]));
    // Missing legacy jobs are a known consequence of old whole-array writers,
    // not permission to remove a durable upgraded copy.
    if(entry&&old&&fingerprint(old)!==entry.legacyBase&&fingerprint(old)!==fingerprint(entry.job))conflicts.set(job.id,clone(old));
    const durable=entries.get(job.id);
    if(durable&&previous&&fingerprint(previous.job)!==durable.companionBase&&fingerprint(previous.job)!==fingerprint(durable.job))conflicts.set(job.id,clone(previous.job));
  }
  return {jobs:clone(jobs),activeId:record.activeId||companion.activeId||legacy.activeId||null,versions,conflicts};
}
export function createWorkspaceStore({storage,locks,database=createWorkspaceDatabase(),uuid=()=>crypto.randomUUID(),now=()=>new Date().toISOString(),onCommit=()=>{}}){
  let cachedRaw=null,initialized=false,initialError=null,generation=0;
  const read=()=>{if(!initialized)throw initialError||fail('loading-storage','Device storage is still opening.');return viewOf(readState(storage,cachedRaw));};
  async function refresh(){
    const current=++generation,raw=await database.read();
    if(current===generation){cachedRaw=raw;initialized=true;initialError=null;}
    return read();
  }
  const ready=refresh().catch(error=>{initialError=error;throw error;});
  // The page awaits ready; this also prevents an unhandled rejection for a store
  // created only to attempt a save in a denied-storage recovery path.
  ready.catch(()=>{});
  async function commit(change){
    await ready;
    const committed=await database.update(raw=>change(readState(storage,raw),raw));
    ++generation;cachedRaw=committed.raw;initialized=true;
    try{onCommit();}catch{} // A notification failure cannot undo a committed save.
    return committed.result;
  }
  async function save(job,expected,{copy=false,isCurrent=()=>true,sharedCapture=null}={}){
    // Capture before the asynchronous lock request: edits/navigation may continue.
    const snapshot=clone(job);
    if(sharedCapture&&(copy||sharedCapture.jobId!==snapshot.id||sharedCapture.item?.id!==snapshot.id||typeof sharedCapture.id!=='string'||!sharedCapture.id||captureFingerprint(sharedCapture.item.record?.preAlphaCapture?.job)!==captureFingerprint(snapshot)))throw fail('invalid-snapshot','The shared capture does not match this working copy. Nothing was uploaded.');
    const capture=sharedCapture?clone(sharedCapture):null;
    if(!validJobs([snapshot]))throw fail('invalid-job','This working copy has an unsupported format. Its saved version has not been changed.');
    if(!locks?.request)throw fail('locking-unavailable','Safe saving is unavailable in this browser. Keep this page open and use a current browser over HTTPS.');
    return locks.request(WORKSPACE_LOCK,{mode:'exclusive'},()=>commit(state=>{
      if(!isCurrent())throw fail('cancelled','This draft was replaced before saving.');
      const view=viewOf(state);
      if(!copy&&(view.versions.get(snapshot.id)??null)!==expected)throw fail('conflict','This job changed in another tab. Your changes are still in this tab.');
      if(!copy&&view.conflicts.has(snapshot.id))throw fail('legacy-conflict','An older tab saved a different version of this job. Both saved versions are retained.');
      if(copy){
        const id=uuid();
        if(view.versions.has(id))throw fail('conflict','A new copy could not be assigned a unique ID. Please try again.');
        snapshot.id=id;snapshot.sourceId=id;snapshot.source='experimental';
        snapshot.title=(snapshot.title||'Untitled job')+' (separate copy)';
        snapshot.sharedState.jobDescription=snapshot.title;
      }
      snapshot.updatedAt=capture?snapshot.updatedAt||now():now();
      if(capture){
        if(state.record.sharedSnapshots!==undefined&&!Array.isArray(state.record.sharedSnapshots))throw fail('invalid-storage','Saved shared snapshots could not be read. Nothing was changed.');
        const captures=state.record.sharedSnapshots??=[],previousCapture=captures.find(entry=>entry.id===capture.id);
        if(previousCapture&&captureFingerprint(previousCapture.item)!==captureFingerprint(capture.item))throw fail('snapshot-collision','The saved capture differs. Nothing was overwritten or uploaded.');
        if(!previousCapture)captures.push({...capture,preparedAt:now(),receipt:null});
        state.record.sharedSnapshots=captures;
      }
      const index=state.record.entries.findIndex(entry=>entry.job.id===snapshot.id);
      const old=index<0?null:state.record.entries[index];
      const previous=state.companion.entries.find(item=>item.job.id===snapshot.id);
      const entry={job:snapshot,revision:uuid(),legacyBase:old?old.legacyBase:previous?previous.legacyBase:fingerprint(state.legacy.jobs.find(item=>item.id===snapshot.id)),companionBase:old?old.companionBase:fingerprint(previous?.job)};
      if(index<0)state.record.entries.unshift(entry);else state.record.entries[index]=entry;
      state.record.activeId=snapshot.id;state.record.build=BUILD;
      const result=viewOf(state);
      return {raw:JSON.stringify(state.record),result:{job:clone(snapshot),version:result.versions.get(snapshot.id),view:result}};
    }));
  }
  async function select(id){
    if(!locks?.request)throw fail('locking-unavailable','Safe saving is unavailable in this browser.');
    return locks.request(WORKSPACE_LOCK,{mode:'exclusive'},()=>commit((state,raw)=>{
      if(!viewOf(state).versions.has(id))return {raw,result:undefined};
      state.record.activeId=id;state.record.build=BUILD;
      return {raw:JSON.stringify(state.record),result:undefined};
    }));
  }
  function sharedSnapshots(){
    if(!initialized)throw fail('loading-storage','Device storage is still opening.');
    const captures=readState(storage,cachedRaw).record.sharedSnapshots??[];
    if(!Array.isArray(captures))throw fail('invalid-storage','Saved shared snapshots could not be read.');
    return clone(captures);
  }
  async function confirmSharedSnapshot(id,cloudId){
    if(typeof cloudId!=='string'||!cloudId)throw fail('unconfirmed-upload','Shared upload was not confirmed. The local capture is retained.');
    if(!locks?.request)throw fail('locking-unavailable','Safe saving is unavailable in this browser.');
    return locks.request(WORKSPACE_LOCK,{mode:'exclusive'},()=>commit((state,raw)=>{
      const captures=state.record.sharedSnapshots;
      if(!Array.isArray(captures))throw fail('missing-snapshot','The local shared capture could not be found.');
      const capture=captures.find(entry=>entry.id===id);
      if(!capture)throw fail('missing-snapshot','The local shared capture could not be found.');
      if(capture.receipt&&capture.receipt.cloudId!==cloudId)throw fail('receipt-conflict','This capture has a different confirmed receipt. Nothing was overwritten.');
      if(capture.receipt)return {raw,result:clone(capture.receipt)};
      capture.receipt={cloudId,confirmedAt:now()};
      return {raw:JSON.stringify(state.record),result:clone(capture.receipt)};
    }));
  }
  return {ready,refresh,read,save,select,sharedSnapshots,confirmSharedSnapshot,close:()=>database.close?.()};
}
