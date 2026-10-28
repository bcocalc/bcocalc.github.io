// Injected harness only: real IndexedDB/locks + unchanged transport, fake REST.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdtempSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,join} from 'node:path';
import {readDurableWorkspace} from './pre-alpha-workspace-test-helpers.mjs';
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright');}catch{pw=require(join(dirname(dirname(process.execPath)),'node_modules/playwright'));}
const engine=process.env.TAPCALC_BROWSER||'chromium';
const cloudSource=readFileSync(new URL('../cloud-sync.js',import.meta.url),'utf8');
const state={bcoPipeMaterial:'CarbonSteel',bcoPipeOD:'6',preAlphaPipeOD:'6 5/8',bcoPipeID:'6',bcoCutterOD:'4',md:'10',ld:'',ptc:'1 1/4',start:'2',mt:'52',future:{raw:['1/4','invalid']}};
const fixture={id:'synthetic-shared-browser',record:{future:{keep:true},job:{pressure:'250 psi',temperature:'80 F',product:'Water'},jobBundle:{selectedOperationId:'two',sharedState:{jobDescription:'Mock shared browser',jobNotes:'Raw α ¾'},operations:[{id:'one',operationType:'HTP',state:{...state,lineStopVariant:'htp'},measurements:{htp:{tco:'47.25'}}},{id:'two',operationType:'Line Stop',state:{...state,lsMd:'12',lsLd:'0',cpStart:'20',cpJbf:'1',cpLd:'2',cpPt:'3'},unknown:{keep:true}}]}}};
const html='<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Injected shared snapshot fixture</title><h1>Synthetic shared snapshot</h1><label>MD <input id="md"></label><button id="local">Save local edit</button><button data-shared-save>Save shared copy</button><button data-shared-save data-shared-retry="" id="retry">Retry last snapshot</button><p role="status" data-shared-status>Ready</p><p id="local-status"></p>';
const server=spawn(process.execPath,['tests/sync-preview.mjs'],{stdio:['ignore','pipe','inherit']});let context,page;
try{
 const base=await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('Preview timeout')),10000);server.stdout.on('data',data=>{output+=data;const match=output.match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timer);resolve(match[0]);}});server.once('error',reject);});
 for(const mobile of [true,false]){
  const device=mobile?'phone':'desktop',profile=mkdtempSync(join(tmpdir(),'tapcalc-shared-mock-'+engine+'-'+device+'-')),docs=new Map(),posts=[],unexpected=[],errors=[];
  let mode='hold',release;const gate=new Promise(resolve=>release=resolve);
  const options={headless:true,...(mobile?pw.devices['iPhone 13']:{viewport:{width:1280,height:900}}),serviceWorkers:'block'};
  async function launch(){
   context=await pw[engine].launchPersistentContext(profile,options);
   await context.addInitScript(()=>{
    if(localStorage.getItem('measurementCardHistoryV1')===null){localStorage.setItem('measurementCardHistoryV1','synthetic-history-unchanged');localStorage.setItem('measurementCardStateV1','synthetic-live-unchanged');}
    window.TAPCALC_FIREBASE_CONFIG={projectId:'demo-tapcalc-test',apiKey:'fixture'};window.TAPCALC_FIREBASE_COLLECTION='fixtureJobs';
   });
   await context.route('**/*',async route=>{
    const request=route.request(),url=new URL(request.url()),reply=(status,data)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
    if(url.origin===base){
     if(request.method()!=='GET'){unexpected.push(request.method()+' '+url.pathname);return route.abort();}
     if(url.pathname==='/cloud-sync.js')return route.fulfill({contentType:'text/javascript',body:cloudSource});
     if(url.pathname==='/shared-harness')return route.fulfill({contentType:'text/html',headers:{'Content-Security-Policy':"default-src 'self'; script-src 'self'; connect-src 'self' https://firestore.googleapis.com"},body:html});
     return route.continue();
    }
    if(url.origin!=='https://firestore.googleapis.com'||!url.pathname.startsWith('/v1/projects/demo-tapcalc-test/databases/(default)/documents')||url.searchParams.get('key')!=='fixture'){unexpected.push(request.method()+' '+url.origin+url.pathname);return route.abort();}
    if(request.method()==='POST'){
     assert.ok(url.pathname.endsWith('/documents:commit'));const body=request.postDataJSON(),write=body.writes[0];assert.deepEqual(write.currentDocument,{exists:false});assert.equal(write.updateMask,undefined);assert.equal(write.delete,undefined);posts.push(write);
     if(mode==='hold')await gate;
     if(mode==='denied')return reply(403,{error:{status:'PERMISSION_DENIED',message:'Synthetic shared save denied'}});
     const id=write.update.name.split('/').at(-1);if(docs.has(id))return reply(409,{error:{status:'ALREADY_EXISTS'}});docs.set(id,write.update);return reply(200,{writeResults:[{updateTime:'synthetic-confirmed'}]});
    }
    assert.equal(request.method(),'GET');if(url.pathname.endsWith('/fixtureJobs'))return reply(200,{documents:[...docs.values()]});
    const document=docs.get(url.pathname.split('/').at(-1));return document?reply(200,document):reply(404,{error:{status:'NOT_FOUND',message:'Not found'}});
   });
  }
  async function install(target){
   target.on('pageerror',error=>errors.push(error.message));await target.goto(base+'/shared-harness');await target.addScriptTag({url:base+'/cloud-sync.js'});
   await target.evaluate(async fixture=>{
    const {createWorkspaceStore}=await import('/pre-alpha/workspace-store.mjs');const {normalizeJob}=await import('/pre-alpha/model.mjs');const {createSharedSaver,bindSharedSaving}=await import('/pre-alpha/shared-save.mjs');
    const store=createWorkspaceStore({storage:{getItem:key=>localStorage.getItem(key)},locks:navigator.locks});await store.ready;
    let view=store.read();if(!view.jobs.length){await store.save(normalizeJob(fixture),null);view=store.read();}
    const draft={job:structuredClone(view.jobs[0]),version:view.versions.get(view.jobs[0].id)};
    const harness=window.sharedHarness={store,draft,uploadCalls:0,lastResult:null,lastError:null};
    const saver=createSharedSaver({store,upload:item=>{harness.uploadCalls++;return window.tapCalcCloud.upload(item);},onPrepared:result=>{draft.version=result.version;draft.job.updatedAt=result.job.updatedAt;}});
    const retry=document.getElementById('retry'),captures=store.sharedSnapshots();if(captures.length)retry.dataset.sharedRetry=captures.at(-1).id;
    bindSharedSaving(document,{saver,getDraft:()=>draft,onResult:result=>{harness.lastResult=result;retry.dataset.sharedRetry=result.captureId;},onError:error=>{harness.lastError=error.message;if(error.captureId)retry.dataset.sharedRetry=error.captureId;}});
    const input=document.getElementById('md');input.value=draft.job.operations[1].state.md;input.addEventListener('input',()=>draft.job.operations[1].state.md=input.value);
    document.getElementById('local').addEventListener('click',async()=>{try{const saved=await store.save(draft.job,draft.version);draft.version=saved.version;draft.job.updatedAt=saved.job.updatedAt;document.getElementById('local-status').textContent='Local saved';}catch(error){document.getElementById('local-status').textContent=error.message;}});
   },fixture);
  }
  const activate=async locator=>{if(mobile)await locator.tap();else{await locator.focus();await locator.press('Enter');}};
  await launch();page=await context.newPage();await install(page);
  await activate(page.locator('[data-shared-save]:not(#retry)'));await page.waitForFunction(()=>window.sharedHarness.uploadCalls===1);
  assert.equal(await page.locator('[data-shared-save]:not(#retry)').isDisabled(),true);assert.equal(await page.locator('[data-shared-save]:not(#retry)').getAttribute('aria-busy'),'true');
  await page.locator('#md').fill('999');await activate(page.locator('#local'));await page.waitForFunction(()=>document.getElementById('local-status').textContent==='Local saved');
  const edited=JSON.parse(await readDurableWorkspace(page)).entries[0];mode='success';release();await page.waitForFunction(()=>document.querySelector('[data-shared-status]').textContent==='Shared snapshot saved');
  const acknowledged=JSON.parse(await readDurableWorkspace(page));assert.deepEqual(acknowledged.entries[0],edited);assert.equal(acknowledged.sharedSnapshots.length,1);assert.equal(acknowledged.sharedSnapshots[0].item.record.preAlphaCapture.job.operations[1].state.md,'10');assert.equal(acknowledged.sharedSnapshots[0].item.record.measurements.hotTap.rodMco,'16.5625');assert.ok(acknowledged.sharedSnapshots[0].receipt);assert.equal(posts.length,1);
  mode='denied';await activate(page.locator('[data-shared-save]:not(#retry)'));await page.waitForFunction(()=>document.querySelector('[data-shared-status]').textContent.includes('Synthetic shared save denied'));
  const failed=JSON.parse(await readDurableWorkspace(page));assert.equal(failed.sharedSnapshots.length,2);assert.equal(failed.sharedSnapshots[1].receipt,null);assert.deepEqual(failed.entries[0].job.operations,edited.job.operations);
  mode='success';await activate(page.locator('#retry'));await page.waitForFunction(()=>document.querySelector('[data-shared-status]').textContent==='Shared snapshot saved');assert.equal(docs.size,2);
  assert.equal(await page.evaluate(()=>localStorage.getItem('measurementCardHistoryV1')),'synthetic-history-unchanged');assert.equal(await page.evaluate(()=>localStorage.getItem('measurementCardStateV1')),'synthetic-live-unchanged');
  const durable=await readDurableWorkspace(page);await page.screenshot({path:join(profile,'shared-mock-controls.png')});await page.reload();await install(page);assert.equal(await readDurableWorkspace(page),durable);
  await context.close();await launch();page=await context.newPage();await install(page);assert.equal(await readDurableWorkspace(page),durable);
  const oldPosts=posts.length;await activate(page.locator('#retry'));await page.waitForFunction(()=>document.querySelector('[data-shared-status]').textContent==='Shared snapshot saved');assert.equal(posts.length,oldPosts);assert.equal(await readDurableWorkspace(page),durable);
  const peer=await context.newPage();await install(peer);await peer.locator('#md').fill('444');await activate(peer.locator('#local'));await peer.waitForFunction(()=>document.getElementById('local-status').textContent==='Local saved');const peerSaved=await readDurableWorkspace(peer),calls=await page.evaluate(()=>window.sharedHarness.uploadCalls);
  await activate(page.locator('[data-shared-save]:not(#retry)'));await page.waitForFunction(()=>document.querySelector('[data-shared-status]').textContent.includes('changed in another tab'));assert.equal(await page.evaluate(()=>window.sharedHarness.uploadCalls),calls);assert.equal(await readDurableWorkspace(page),peerSaved);
  assert.deepEqual(unexpected,[]);assert.deepEqual(errors,[]);await context.close();context=null;
  console.log('PASS mocked shared browser '+engine+'/'+device+': real IndexedDB/locks, native pending controls, current edits survive old receipt, actual create-only transport/REST mocks, denied/retry, complete raw/original/metadata bundles, two-tab conflict, exact reload and browser-process restart; profile '+profile);
 }
}catch(error){console.error('SHARED_BROWSER_FAILURE',JSON.stringify({engine,message:error.message,stack:error.stack}));throw error;}
finally{await context?.close();server.kill();}
