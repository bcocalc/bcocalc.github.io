// Real-worker, isolated localhost and synthetic local state only; unfiltered page errors remain failures.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';
import {cleanupExports,observeChildClose} from './runner-cleanup.mjs';
import {referenceInitialization} from './legacy-pdf-initialization.mjs';
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright');}catch{pw=require(join(dirname(dirname(process.execPath)),'node_modules/playwright'));}
const engine=process.env.TAPCALC_BROWSER||'chromium',server=spawn(process.execPath,['tests/sync-preview.mjs'],{stdio:['ignore','pipe','inherit']}),preview=observeChildClose(server);
let context,browser,evidencePage,evidencePaths=[],evidenceRequests=[],evidenceDevice;const errors=[],external=[],writes=[];
const requestedDevice=process.env.TAPCALC_DEVICE;assert.ok(requestedDevice===undefined||['phone','desktop'].includes(requestedDevice),'Known focused device only');
const base=await new Promise((resolve,reject)=>{let text='';server.stdout.on('data',chunk=>{text+=chunk;const match=text.match(/http:\/\/127\.0\.0\.1:\d+/);if(match)resolve(match[0]);});server.once('error',reject);server.once('exit',code=>reject(Error('Preview exited '+code)));});
try{
 browser=await pw[engine].launch({headless:true});
 for(const mobile of requestedDevice==='desktop'?[false]:requestedDevice==='phone'?[true]:[true,false]){
  const requests=[],workers=[],requestRecords=[],requestIDs=new WeakMap();evidencePaths=requests;evidenceRequests=requestRecords;evidenceDevice=mobile?'phone':'desktop';context=await browser.newContext({...mobile?pw.devices['iPhone 13']:{viewport:{width:1360,height:1000}},serviceWorkers:'block'});
  context.on('request',request=>{const url=new URL(request.url());if(url.origin!==base)external.push(url.origin);if(request.method()!=='GET')writes.push(request.method());if(/\/(?:pdf(?:\.worker)?\.mjs|reference\/stackups\/.*\.pdf)$/.test(url.pathname)){requests.push(url.pathname);if(requestRecords.length<128){let mainFrame=null;try{const frame=request.frame();mainFrame=frame===frame.page().mainFrame();}catch{}const record={index:requests.length,path:url.pathname,resourceType:request.resourceType(),navigation:request.isNavigationRequest(),mainFrame,rangePresent:'range'in request.headers()};requestIDs.set(request,record);requestRecords.push(record);}}});
  context.on('response',response=>{const record=requestIDs.get(response.request());if(record){record.status=response.status();record.fromServiceWorker=response.fromServiceWorker();}});
  context.on('requestfailed',request=>{const record=requestIDs.get(request);if(record)record.failure=String(request.failure()?.errorText||'').replace(/https?:\/\/[^\s]+/g,'[url]').slice(0,256);});
  context.on('page',page=>{page.on('pageerror',error=>errors.push(error.message));page.on('worker',worker=>workers.push(worker.url()));});
  await context.addInitScript(origin=>{if(location.origin!==origin)return;localStorage.setItem('tapcalcV3Screen','calc');localStorage.setItem('measurementCardCalcModeV1','bco');localStorage.setItem('measurementCardActiveModeV1','hotTap');localStorage.setItem('tapcalcWorkflowStageV2','hotTap');localStorage.setItem('measurementCardStateV1',JSON.stringify({version:3,selectedOperationId:'synthetic-pdf-op',sharedState:{jobDescription:'Synthetic PDF reference test',operationType:'Hot Tap'},operations:[{id:'synthetic-pdf-op',label:'Synthetic Hot Tap',operationType:'Hot Tap',mode:'hotTap',createdAtIso:'2026-10-30T00:00:00.000Z',updatedAtIso:'2026-10-30T00:00:00.000Z',state:{bcoPipeMaterial:'CarbonSteel',bcoPipeOD:'6.0',bcoSchedule:'STD',bcoPipeID:'6.0650',bcoCutterOD:'4',md:'12',ld:'',ptc:'1/4',mt:'52',activeMode:'hotTap',calcMode:'bco',future:{raw:['invalid','1/4']}}}]}));},base);
  const page=await context.newPage(),activate=locator=>mobile?locator.tap():locator.click();page.setDefaultTimeout(30000);evidencePage=page;
  const ready=()=>page.waitForFunction(()=>{const canvas=document.getElementById('machineReferenceVisualCanvas'),message=document.getElementById('machineReferenceVisualFallback'),frame=document.getElementById('machineReferenceVisualFrame');return canvas&&!canvas.hidden&&canvas.width>200&&canvas.height>200&&canvas.getClientRects().length>0&&getComputedStyle(canvas).visibility==='visible'&&message?.hidden===true&&frame?.hidden===true&&!frame.getAttribute('src');});
  const response=await page.goto(base+'/measurement-card.html?legacy=1&fixture=legacy-pdf-preview#bco');assert.match(response.headers()['content-security-policy'],/worker-src 'self'/);
  await page.waitForFunction(()=>document.body.dataset.activeScreen==='calc'&&typeof window.tapCalcSetScreen==='function'&&window.__tapcalcReferenceRouterReady&&window.__tapcalcLivefix11WorkflowReady);await page.locator('#bcoPipeOD').waitFor({state:'attached'});
  await page.evaluate(()=>{window.initReferenceWorkspaceHard();window.initReferenceWorkspaceHard();});
  await activate(page.locator('.screen-nav [data-screen="calc"]'));await activate(page.locator('.calc-submode-btn[data-mode="bco"]'));
  assert.deepEqual(requests,[],'BCO and repeated reference initialization must not start the API, worker or PDF request');
  await page.waitForFunction(()=>{const state=JSON.parse(localStorage.getItem('measurementCardStateV1'));const active=state?.operations?.find(op=>op.id===state.selectedOperationId);return active?.state?.bcoPipeOD==='6.0'&&Number(active.state.bcoPipeID)>0;});
  // Existing active-draft autosave updates operation timestamps on navigation. Preserve all measurements, IDs, raw fields and saved history.
  const snapshot=()=>page.evaluate(()=>{const state=JSON.parse(localStorage.getItem('measurementCardStateV1'));for(const operation of state.operations)delete operation.updatedAtIso;return {history:localStorage.getItem('measurementCardHistoryV1'),state};});
  const assertRawSeed = async () => assert.deepEqual(await page.evaluate(() => {
    const state=JSON.parse(localStorage.getItem('measurementCardStateV1'));
    const operation=state.operations.find(op=>op.id===state.selectedOperationId);
    return Object.fromEntries(['bcoCutterOD','md','ptc','mt'].map(id=>[id,operation.state[id]]));
  }),{bcoCutterOD:'4',md:'12',ptc:'1/4',mt:'52'},'Synthetic initialization/refresh preserves exact raw measurement strings');
  await assertRawSeed();
  // Positive ordinary initialization evidence, not a sleep, polling for stability or PDF/network warmup.
  await page.waitForFunction(referenceInitialization);
  await assertRawSeed();
  const stored=await snapshot();
  await activate(page.locator('.screen-nav [data-screen="ref"]'));await activate(page.locator('#referenceLibraryToggle'));await activate(page.locator('#referenceLibraryOptions [data-reference-target="machines"]'));
  await ready();
  assert.ok(requests.some(path=>path.endsWith('.pdf')),'Opening References must load a real PDF');assert.ok(workers.some(url=>url===base+'/pdf.worker.mjs?v=3.0.0-livefix21'),'Use the existing real bundled root PDF worker');
  const first=await page.locator('#machineReferenceSelect').inputValue(),options=await page.locator('#machineReferenceSelect option').evaluateAll(nodes=>nodes.map(node=>node.value));assert.ok(options.length>1);
  await page.locator('#machineReferenceSelect').selectOption(options[1]);await ready();
  await page.locator('#machineReferenceSelect').selectOption(first);await ready();
  const before=requests.length;await activate(page.locator('.screen-nav [data-screen="calc"]'));await context.setOffline(true);await activate(page.locator('.screen-nav [data-screen="ref"]'));await ready();assert.equal(requests.length,before,'Cached reference reopens offline without a new request');await context.setOffline(false);
  assert.deepEqual(await snapshot(),stored,'Reference navigation preserves all active measurements/operation IDs/raw fields and byte-exact saved history');
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.deepEqual(writes,[]);await context.close();context=null;
  console.log('PASS legacy PDF '+engine+'/'+(mobile?'phone':'desktop')+': no background request on BCO, real worker render on References entry, explicit selection, cached offline reopen and local data preservation');
 }
}catch(error){
 try{const route=await evidencePage?.evaluate(()=>{const canvas=document.getElementById('machineReferenceVisualCanvas'),frame=document.getElementById('machineReferenceVisualFrame'),message=document.getElementById('machineReferenceVisualFallback');return {observation:'after failure only',canvas:{hidden:canvas?.hidden,width:canvas?.width,height:canvas?.height,rects:canvas?.getClientRects().length,visibility:canvas?getComputedStyle(canvas).visibility:null},iframe:{hidden:frame?.hidden,src:frame?.getAttribute('src')||null},message:{hidden:message?.hidden,text:message?.textContent?.slice(0,160)},selection:document.getElementById('machineReferenceSelect')?.value};});const initialization=await evidencePage?.evaluate(referenceInitialization,true);console.error('LEGACY_PDF_FAILURE_EVIDENCE',JSON.stringify({engine,device:evidenceDevice,count:evidencePaths.length,paths:evidencePaths.slice(0,128),requests:evidenceRequests,truncated:evidencePaths.length>128,route,initialization}));}catch(evidenceError){console.error('LEGACY_PDF_FAILURE_EVIDENCE_UNAVAILABLE',evidenceError.name);}
 throw error;
}finally{
 await cleanupExports(context,preview,{report:({owner,phase,error})=>{process.exitCode=1;console.error('LEGACY_PDF_CLEANUP_FAILURE',JSON.stringify({owner,phase,message:error.message}));}});await browser?.close();if(errors.length||external.length||writes.length){process.exitCode=1;console.error('LEGACY_PDF_STRICT_FAILURE',JSON.stringify({errors,external,writes}));}
}
