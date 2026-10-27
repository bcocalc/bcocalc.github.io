import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {createWorkspaceStore,WORKSPACE_KEY,WORKSPACE_LOCK} from '../pre-alpha/workspace-store.mjs';
import {normalizeJob,STORAGE_KEY,stageFor} from '../pre-alpha/model.mjs';
import {memoryDatabase} from './pre-alpha-memory-database.mjs';

// Network-free controller regression: execute the application's real controller
// and openJob functions, with only DOM/rendering and the lock scheduler stubbed.
// This is not evidence that a browser's real Web Locks/DOM integration ran.
const source=readFileSync(new URL('../pre-alpha/workspace.mjs',import.meta.url),'utf8').replace(/\r\n/g,'\n');
const controller=source.slice(source.indexOf('const workspaceStore='),source.indexOf('\nconst pageNames='));
const opening=source.slice(source.indexOf('function openJob('),source.indexOf('\nfunction renderLibrary('));
assert.ok(controller.includes('function persist()')&&controller.includes("window.addEventListener('beforeunload'"));
assert.ok(opening.includes('workspaceStore.select'));
const fixture=id=>normalizeJob({id,source:'experimental',record:{jobBundle:{selectedOperationId:'op',sharedState:{jobDescription:id},operations:[{id:'op',label:'Tap',operationType:'Hot Tap',state:{md:'10',unknownFuture:{keep:true}}}]}}});

async function harness(initial=[fixture('a'),fixture('b')]){
  const legacy=JSON.stringify({build:'pre-alpha10',jobs:initial,activeId:initial[0]?.id});
  const memory=new Map([[STORAGE_KEY,legacy],['measurementCardHistoryV1','untouched history'],['measurementCardStateV1','untouched draft']]);
  let tail=Promise.resolve(),rejectWrites=false;
  const writes=[],notices=[],nodes=new Map(),events=new Map();
  const storage={getItem:key=>memory.get(key)??null,setItem(key,value){if(rejectWrites)throw new Error('synthetic quota');writes.push({key,value});memory.set(key,String(value));}};
  const locks={request(name,options,fn){assert.equal(name,WORKSPACE_LOCK);assert.equal(options.mode,'exclusive');const pending=tail.then(()=>fn({name}));tail=pending.catch(()=>{});return pending;}};
  const database=memoryDatabase({beforeWrite:value=>{if(rejectWrites)throw new Error('synthetic quota');writes.push({key:'indexedDB',value});}});
  const store=createWorkspaceStore({storage,locks,database});await store.ready;
  const node=id=>{
    if(!nodes.has(id))nodes.set(id,{textContent:'',hidden:false,disabled:false,listeners:new Map(),addEventListener(type,fn){this.listeners.set(type,fn);}});
    return nodes.get(id);
  };
  const context=vm.createContext({createWorkspaceStore:()=>store,WORKSPACE_KEY,STORAGE_KEY,stageFor,structuredClone,crypto:{randomUUID},localStorage:storage,navigator:{locks},$:node,notify:message=>notices.push(message),window:{confirm:()=>true,addEventListener:(type,fn)=>events.set(type,fn)}});
  vm.runInContext(`let jobs=[],active=null,stage='setup',currentPage='workspace';
    function renderWorkspace(){saveStatus();}
    function renderLibrary(){}
    function renderHome(){}
    function page(name){currentPage=name;}
    ${controller.replace('await workspaceStore.ready','workspaceStore.ready')}
    ${opening}
    globalThis.api={
      get active(){return active;}, get jobs(){return jobs;},
      get draft(){return active&&drafts.get(active.id);},
      draftById:id=>drafts.get(id),
      activate:id=>{active=draftFor(jobs.find(job=>job.id===id)).job;saveStatus();},
      open:id=>openJob(jobs.find(job=>job.id===id)),
      persist,copy:saveSeparateCopy,read:()=>workspaceStore.read(),settle:()=>saveQueue,
      refresh:()=>{refreshSaved();saveStatus();}
    };saveStatus();`,context,{filename:'extracted-workspace-controller.mjs'});
  const unload=()=>{let prevented=false;events.get('beforeunload')({preventDefault(){prevented=true;}});return prevented;};
  const hold=()=>{let release;const gate=new Promise(resolve=>release=resolve);const held=locks.request(WORKSPACE_LOCK,{mode:'exclusive'},()=>gate);return {release,held};};
  const untouched=()=>{assert.equal(memory.get(STORAGE_KEY),legacy);assert.equal(memory.has(WORKSPACE_KEY),false);assert.equal(memory.get('measurementCardHistoryV1'),'untouched history');assert.equal(memory.get('measurementCardStateV1'),'untouched draft');assert.ok(writes.every(write=>write.key==='indexedDB'));};
  const other=createWorkspaceStore({storage,locks,database});await other.ready;
  return {api:context.api,memory,writes,notices,node,unload,hold,untouched,failWrites:value=>rejectWrites=value,click:id=>node(id).listeners.get('click')(),storageEvent:()=>events.get('storage')({key:WORKSPACE_KEY}),store:other};
}
const tick=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
let groups=0;
const check=async(name,fn)=>{await fn();groups++;console.log('PASS '+name);};

await check('queued save captures its own job despite active-job switching',async()=>{
  const h=await harness(),gate=h.hold();h.api.active.operations[0].state.md='21';const saving=h.api.persist();
  assert.equal(h.node('save-state').textContent,'Saving on this device…');assert.equal(h.unload(),true);
  h.api.activate('b');assert.equal(h.api.active.id,'b');gate.release();await saving;
  assert.equal(h.api.active.id,'b');assert.equal(h.api.active.operations[0].state.md,'10');
  assert.equal(h.api.read().jobs.find(job=>job.id==='a').operations[0].state.md,'21');
  assert.equal(h.node('save-state').textContent,'Saved on this device');assert.equal(h.unload(),false);h.untouched();
});

await check('rapid same-tab saves advance baselines in order and retain last edit',async()=>{
  const h=await harness(),gate=h.hold(),pending=[];
  for(const md of ['11','12','13']){h.api.active.operations[0].state.md=md;pending.push(h.api.persist());}
  gate.release();assert.deepEqual(await Promise.all(pending),[true,true,true]);
  assert.deepEqual(h.writes.map(write=>JSON.parse(write.value).entries.find(entry=>entry.job.id==='a').job.operations[0].state.md),['11','12','13']);
  assert.equal(h.api.read().jobs.find(job=>job.id==='a').operations[0].state.md,'13');assert.equal(h.api.draft.saved,3);assert.equal(h.unload(),false);h.untouched();
});

await check('storage failure retains draft and baseline; later explicit edit retries safely',async()=>{
  const h=await harness(),base=h.api.draft.base;h.failWrites(true);h.api.active.operations[0].state.md='41';assert.equal(await h.api.persist(),false);
  assert.equal(h.api.draft.base,base);assert.equal(h.api.active.operations[0].state.md,'41');assert.equal(h.memory.has(WORKSPACE_KEY),false);
  assert.match(h.node('save-state').textContent,/Could not save/);assert.equal(h.unload(),true);
  h.failWrites(false);h.api.active.operations[0].state.md='42';assert.equal(await h.api.persist(),true);
  assert.equal(h.api.read().jobs.find(job=>job.id==='a').operations[0].state.md,'42');assert.equal(h.api.draft.error,null);assert.equal(h.unload(),false);h.untouched();
});

await check('discard cancels an already-requested lock write for the orphaned draft',async()=>{
  const h=await harness();h.failWrites(true);h.api.active.operations[0].state.md='51';await h.api.persist();h.failWrites(false);
  const oldDraft=h.api.draft,gate=h.hold();h.api.active.operations[0].state.md='52';const pending=h.api.persist();await tick();
  h.click('load-saved');assert.notEqual(h.api.draft,oldDraft);assert.equal(h.api.active.operations[0].state.md,'10');
  gate.release();assert.equal(await pending,false);assert.equal(h.memory.has(WORKSPACE_KEY),false);assert.equal(h.api.active.operations[0].state.md,'10');assert.equal(h.unload(),false);h.untouched();
});

await check('recovery copy captures click-time snapshot, rejects repeat, and keeps later edits',async()=>{
  const h=await harness();h.failWrites(true);h.api.active.operations[0].state.md='61';await h.api.persist();h.failWrites(false);
  const original=h.api.active,gate=h.hold(),copy=h.api.copy();await tick();assert.equal(h.node('save-copy').disabled,true);assert.equal(h.node('load-saved').disabled,true);assert.equal(h.unload(),true);
  h.click('load-saved');assert.equal(h.api.active,original,'Discard is also guarded while recovery is pending');
  await h.api.copy();h.api.active.operations[0].state.md='62';const later=h.api.persist();
  gate.release();await copy;await later;
  const copies=h.api.read().jobs.filter(job=>job.id!=='a'&&job.id!=='b');assert.equal(copies.length,1);assert.equal(copies[0].operations[0].state.md,'61');
  assert.equal(copies[0].sourceId,copies[0].id);assert.equal(copies[0].source,'experimental');assert.deepEqual(copies[0].original,fixture('a').original);
  assert.equal(h.api.active,original);assert.equal(h.api.active.operations[0].state.md,'62');h.untouched();
});

await check('successful unchanged recovery copy becomes independent active saved job',async()=>{
  const h=await harness();h.failWrites(true);h.api.active.operations[0].state.md='71';await h.api.persist();h.failWrites(false);
  await h.api.copy();assert.notEqual(h.api.active.id,'a');assert.equal(h.api.active.operations[0].state.md,'71');assert.equal(h.api.draftById('a'),undefined);
  assert.equal(h.node('save-state').textContent,'Saved on this device');assert.equal(h.unload(),false);h.untouched();
});

await check('inactive modern conflict is visible on reopen and selection preserves stored content',async()=>{
  const h=await harness();h.api.activate('b');const view=h.store.read(),external=view.jobs.find(job=>job.id==='a');external.title='Changed elsewhere';await h.store.save(external,view.versions.get('a'));await h.storageEvent();
  h.api.open('a');assert.match(h.node('save-state').textContent,/changed in another tab/);assert.equal(h.api.active.title,'a');await h.api.settle();
  assert.equal(h.api.read().jobs.find(job=>job.id==='a').title,'Changed elsewhere');h.untouched();
});

await check('selection-only pending state warns on unload then resumes selected job',async()=>{
  const h=await harness(),gate=h.hold();h.api.open('b');assert.equal(h.api.active.id,'b');assert.equal(h.node('save-state').textContent,'Saving on this device…');assert.equal(h.unload(),true);
  gate.release();await h.api.settle();assert.equal(h.api.read().activeId,'b');assert.equal(h.api.read().jobs.find(job=>job.id==='a').operations[0].state.md,'10');assert.equal(h.unload(),false);h.untouched();
});

console.log(`PASS ${groups} extracted real-controller regression groups (synthetic DOM/lock scheduler, no browser or network)`);
