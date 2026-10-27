import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {dirname,join} from 'node:path';
import {normalizeJob,STORAGE_KEY,rememberStage} from '../pre-alpha/model.mjs';
import {WORKSPACE_KEY,WORKSPACE_LOCK} from '../pre-alpha/workspace-store.mjs';
import {checkDatabaseAbort} from './pre-alpha-database-abort-ui.mjs';
const require=createRequire(import.meta.url);
let pw;try{pw=require(process.env.TAPCALC_PLAYWRIGHT_PATH||'playwright');}catch{pw=require(join(dirname(dirname(process.execPath)),'node_modules/playwright'));}
const engine=process.env.TAPCALC_BROWSER||'chromium';
// Ten fresh sequential Linux WebKit fixtures total, not retries after failure.
// Other platforms keep the original one fixture per viewport for light smoke checks.
const trialsPerDevice=engine==='webkit'&&process.platform==='linux'?5:1;
const server=spawn(process.execPath,['tests/sync-preview.mjs'],{stdio:['ignore','pipe','inherit']});
let browser;
const job=id=>{const value=normalizeJob({id,source:'experimental',record:{jobBundle:{selectedOperationId:'a',sharedState:{jobDescription:id},operations:[{id:'a',label:'A',operationType:'Hot Tap',state:{md:'10',unknownFuture:{keep:true}}},{id:'b',label:'B',operationType:'Hot Tap',state:{md:'20'}}]}}});value.operations.forEach(op=>rememberStage(op,'setup'));return value;};
// Summarize only synthetic IDs/revisions, never complete jobs or measurements.
const fixtureId=value=>['a','b','modern-race','older-race'].includes(value)?value:null;
const revision=value=>typeof value==='string'&&/^[0-9a-f-]{36}$/i.test(value)?value:null;
function versionSummary(value){
  if(value==null)return null;
  try{const parsed=JSON.parse(value);return {revision:revision(parsed[0]),hasLegacyFingerprint:parsed[1]!=null};}
  catch{return {invalid:true};}
}
function storageSummary(raw){
  if(raw==null)return null;
  const result={bytes:Buffer.byteLength(raw),sha256:createHash('sha256').update(raw).digest('hex')};
  try{
    const value=JSON.parse(raw);
    result.entries=value.entries?.map(entry=>({id:fixtureId(entry.job?.id),revision:revision(entry.revision),operationCount:entry.job?.operations?.length,renamed:entry.job?.title==='Renamed by A',hasLegacyBase:entry.legacyBase!=null}));
    result.legacyJobIds=value.jobs?.map(entry=>fixtureId(entry.id));
  }catch{result.invalid=true;}
  return result;
}
function pageTrace(trace){
  return {...trace,baseline:versionSummary(trace.baseline),completion:trace.completion?{...trace.completion,version:versionSummary(trace.completion.version)}:null,
    current:storageSummary(trace.current),events:trace.events.map(({raw,oldRaw,...event})=>({...event,...raw!==undefined?{storage:storageSummary(raw)}:{},...oldRaw!==undefined?{previousStorage:storageSummary(oldRaw)}:{}}))};
}
try{
  const base=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Preview timeout')),10000);server.stdout.on('data',data=>{const match=String(data).match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timer);resolve(match[0]);}});});
  browser=await pw[engine].launch({headless:true,...engine==='chromium'?(process.env.TAPCALC_CHROMIUM_PATH?{executablePath:process.env.TAPCALC_CHROMIUM_PATH}:!process.env.CI?{channel:'chrome'}:{}):{}});
  await checkDatabaseAbort({browser,base,engine,fixture:job('abort-control')});
  for(const mobile of [true,false]){
    const activate=locator=>mobile?locator.tap():locator.click();
    for(let trial=1;trial<=trialsPerDevice;trial++){
      console.log('CONTENTION_TRIAL '+JSON.stringify({engine,device:mobile?'phone':'desktop',trial,trialsPerDevice}));
      const context=await browser.newContext({...mobile?pw.devices['iPhone 13']:{viewport:{width:1360,height:1000}},serviceWorkers:'block'}),errors=[];
      context.on('page',page=>page.on('pageerror',error=>errors.push(error.message)));
      await context.route('**/*',route=>route.request().url().startsWith(base+'/')?route.continue():route.abort());
      await context.route(base+'/__storage_test',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Synthetic persistence test</title>'}));
      const [a,b,barrier]=await Promise.all([context.newPage(),context.newPage(),context.newPage()]);
      await Promise.all([a,b,barrier].map(page=>page.goto(base+'/__storage_test')));
      for(const [index,page] of [a,b].entries())await page.evaluate(async({base,label})=>{
        const {createWorkspaceStore,WORKSPACE_KEY}=await import(base+'/pre-alpha/workspace-store.mjs');
        const {createWorkspaceDatabase}=await import(base+'/pre-alpha/workspace-database.mjs');
        window.traceEvents=[];window.traceStage='initial';let sequence=0,requestId=0;
        const record=(event,details={})=>traceEvents.push({label,sequence:++sequence,stage:traceStage,event,time:performance.timeOrigin+performance.now(),...details});
        // No extra storage reads, awaits, logging IPC or UUID calls in a lock.
        const storage={getItem(key){const raw=localStorage.getItem(key);record('getItem',{key,raw});return raw;},setItem(key,raw){record('setItem:start',{key,raw});localStorage.setItem(key,raw);record('setItem:end',{key});}};
        const locks={request(name,options,callback){
          const id=++requestId;record('lock:request',{id,name,mode:options.mode});
          return navigator.locks.request(name,options,lock=>{
            record('lock:enter',{id,name:lock?.name,mode:lock?.mode});
            try{
              const result=callback(lock);
              if(result&&typeof result.then==='function')return result.then(value=>{record('lock:exit',{id});return value;},error=>{record('lock:throw',{id,code:error.code||error.name});throw error;});
              record('lock:exit',{id});return result;
            }
            catch(error){record('lock:throw',{id,code:error.code||error.name});throw error;}
          });
        }};
        window.addEventListener('storage',event=>{
          if(event.key===WORKSPACE_KEY)record('storage:event',{key:event.key,raw:event.newValue,oldRaw:event.oldValue});
        });
        const durable=createWorkspaceDatabase();
        const database={read:()=>durable.read(),update:change=>durable.update(raw=>{
          record('database:transaction-read',{raw});
          try{const result=change(raw);record('database:transaction-put',{raw:result.raw});return result;}
          catch(error){record('database:transaction-reject',{code:error.code||error.name});throw error;}
        })};
        window.database=durable;window.store=createWorkspaceStore({storage,locks,database});await store.ready;window.initial=store.read();
      },{base,label:index?'B':'A'});
      const hold=async(stage)=>{await barrier.evaluate(({lock,stage})=>{
        window.barrierTrace??=[];
        const record=event=>barrierTrace.push({event,stage,name:lock,mode:'exclusive',time:performance.timeOrigin+performance.now()});
        window.held=false;record('barrier:request');
        window.holding=navigator.locks.request(lock,()=>new Promise(resolve=>{record('barrier:enter');window.release=()=>{record('barrier:release');resolve();};window.held=true;}));
      },{lock:WORKSPACE_LOCK,stage});await barrier.waitForFunction(()=>window.held);};
      const release=()=>barrier.evaluate(()=>window.release());
      await hold('unrelated-jobs');
      await Promise.all([[a,job('a')],[b,job('b')]].map(([page,value])=>page.evaluate(value=>{window.done=false;window.saving=store.save(value,null).then(result=>{window.done=true;return result;});},value)));
      assert.equal(await a.evaluate(()=>done),false);assert.equal(await b.evaluate(()=>done),false);
      assert.equal(await a.evaluate(key=>localStorage.getItem(key),WORKSPACE_KEY),null);
      assert.equal(await a.evaluate(()=>database.read()),null,'No durable write while the barrier owns the lock');
      await release();await Promise.all([a,b].map(page=>page.evaluate(()=>saving)));
      await a.evaluate(()=>store.refresh());
      assert.deepEqual(await a.evaluate(()=>store.read().jobs.map(job=>job.id).sort()),['a','b']);
      console.log('PASS actual Web Locks contention: unrelated jobs '+engine+'/'+(mobile?'phone':'desktop'));
      await Promise.all([a,b].map(page=>page.evaluate(async()=>{window.traceStage='same-job-baseline';window.baseView=await store.refresh();window.same=baseView.jobs.find(job=>job.id==='a');})));
      await hold('same-job');
      await a.evaluate(()=>{window.traceStage='same-job-save';same.title='Renamed by A';window.saving=store.save(same,baseView.versions.get('a')).then(result=>{window.traceCompletion={ok:true,version:result.version};return {ok:true};},error=>{window.traceCompletion={code:error.code};return {code:error.code};});});
      await b.evaluate(()=>{window.traceStage='same-job-save';same.operations.pop();window.saving=store.save(same,baseView.versions.get('a')).then(result=>{window.traceCompletion={ok:true,version:result.version};return {ok:true};},error=>{window.traceCompletion={code:error.code};return {code:error.code};});});
      await release();const outcomes=await Promise.all([a,b].map(page=>page.evaluate(()=>saving)));
      let diagnosticError=null,fresh;
      try{
        // Collect only after both attempts settle; do not synchronize their reads.
        const traces=await Promise.all([a,b].map(page=>page.evaluate(async()=>({baseline:baseView.versions.get('a'),jobId:same?.id,completion:window.traceCompletion,current:await database.read(),events:traceEvents}))));
        fresh=await context.newPage();await fresh.goto(base+'/__storage_test');
        const freshRaw=await fresh.evaluate(async base=>{const {createWorkspaceDatabase}=await import(base+'/pre-alpha/workspace-database.mjs');return createWorkspaceDatabase().read();},base);
        console.log('SAME_JOB_TRACE '+JSON.stringify({engine,device:mobile?'phone':'desktop',trial,trialsPerDevice,platform:process.platform,browser:browser.version(),fixture:'unchanged ephemeral context; synthetic jobs only',equalBaselines:traces[0].baseline===traces[1].baseline,outcomes,pages:traces.map(pageTrace),barrier:await barrier.evaluate(()=>barrierTrace),freshTab:storageSummary(freshRaw)}));
      }catch(error){diagnosticError=error;console.error('SAME_JOB_TRACE_ERROR '+error.name);}
      finally{await fresh?.close();}
      assert.equal(outcomes.filter(x=>x.ok).length,1);assert.equal(outcomes.filter(x=>x.code==='conflict').length,1);
      await a.evaluate(()=>store.refresh());
      const winner=await a.evaluate(()=>store.read().jobs.find(job=>job.id==='a'));
      assert.equal(winner.operations.length,outcomes[0].ok?2:1);
      assert.equal(winner.title,outcomes[0].ok?'Renamed by A':'a');
      if(diagnosticError)throw diagnosticError;
      console.log('PASS actual Web Locks contention: same-job rename/delete conflict '+engine+'/'+(mobile?'phone':'desktop'));
      // A real legacy writer does not take a lock, and still cannot erase modern
      // jobs or be overwritten by the new sidecar-only authority.
      await hold('mixed-build');await a.evaluate(()=>{window.saving=store.save({...same,id:'modern-race',sourceId:'modern-race'},null);});
      const legacy=JSON.stringify({build:'pre-alpha10',activeId:'older-race',jobs:[job('older-race')]});
      await b.evaluate(({key,legacy})=>localStorage.setItem(key,legacy),{key:STORAGE_KEY,legacy});await release();await a.evaluate(()=>saving);
      assert.equal(await a.evaluate(key=>localStorage.getItem(key),STORAGE_KEY),legacy);
      assert.deepEqual(await a.evaluate(()=>store.read().jobs.map(job=>job.id).sort()),['a','b','modern-race','older-race']);
      assert.equal(await a.evaluate(key=>localStorage.getItem(key),WORKSPACE_KEY),null,'The prior companion is read-only too');
      assert.deepEqual(errors,[]);await context.close();
    }

    // Exercise the real workspace controller and UI using a fresh synthetic
    // same-origin context; never use the user's browser/profile/storage.
    const ui=await browser.newContext({...mobile?pw.devices['iPhone 13']:{viewport:{width:1360,height:1000}},serviceWorkers:'block'});
    const uiErrors=[];ui.on('page',page=>page.on('pageerror',error=>uiErrors.push(error.message)));
    await ui.route('**/*',route=>route.request().url().startsWith(base+'/')?route.continue():route.abort());
    await ui.route(base+'/__storage_test',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Synthetic seed</title>'}));
    const seed=await ui.newPage();await seed.goto(base+'/__storage_test');
    const initial=JSON.stringify({build:'pre-alpha10',activeId:'same',jobs:[job('same'),job('other')]});
    await seed.evaluate(({key,initial})=>localStorage.setItem(key,initial),{key:STORAGE_KEY,initial});
    const [left,right]=await Promise.all([ui.newPage(),ui.newPage()]);await Promise.all([left,right].map(page=>page.goto(base+'/pre-alpha/#workspace')));
    for(const page of [left,right])await page.locator('[data-field="machineType"]').waitFor();
    await left.locator('[data-field="machineType"]').selectOption('360 / 152');
    await left.waitForFunction(()=>document.getElementById('save-state').textContent==='Saved on this device');
    await right.waitForFunction(()=>!document.getElementById('save-recovery').hidden);
    await right.locator('[data-field="machineType"]').selectOption('660 / 760');
    assert.match(await right.locator('#save-state').innerText(),/another tab/);
    assert.equal(await right.locator('[data-field="machineType"]').inputValue(),'660 / 760');
    // Switching jobs never discards the blocked draft; reopening still warns.
    await activate(right.locator('.main-nav [data-page="library"]'));await activate(right.locator('[data-source="experimental"]'));
    await activate(right.locator('[data-job="other"]'));await activate(right.locator('.main-nav [data-page="library"]'));
    await activate(right.locator('[data-job="same"]'));assert.equal(await right.locator('[data-field="machineType"]').inputValue(),'660 / 760');assert.ok(await right.locator('#save-recovery').isVisible());
    await activate(right.locator('#save-copy'));await right.waitForFunction(()=>document.getElementById('job-title').textContent.endsWith('(separate copy)'));
    const saved=await right.evaluate(async()=>{const {createWorkspaceStore}=await import('./workspace-store.mjs');const store=createWorkspaceStore({storage:localStorage,locks:navigator.locks});await store.ready;return store.read().jobs;});
    assert.equal(saved.find(job=>job.id==='same').sharedState.machineType,'360 / 152');assert.equal(saved.find(job=>job.title.endsWith('(separate copy)')).sharedState.machineType,'660 / 760');
    assert.equal(await right.evaluate(key=>localStorage.getItem(key),STORAGE_KEY),initial);
    await right.reload();await right.locator('#job-title').waitFor();assert.match(await right.locator('#job-title').innerText(),/separate copy/);
    console.log('PASS real UI conflict, draft switching, explicit copy and reload '+engine+'/'+(mobile?'phone':'desktop'));
    assert.deepEqual(uiErrors,[]);
    await ui.close();
  }
}finally{await browser?.close();server.kill();}
