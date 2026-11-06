// Real persistent browser, isolated localhost; CSP blocks external requests; the server rejects writes.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {execFileSync} from 'node:child_process';
import {readFileSync,mkdtempSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import {join,resolve,extname} from 'node:path';
import {normalizeJob,geometry} from '../pre-alpha/model.mjs';
import {readDurableWorkspace,waitForWorkspaceSave} from './pre-alpha-workspace-test-helpers.mjs';
const pw=createRequire(import.meta.url)('playwright'),engine=process.env.TAPCALC_BROWSER||'chromium';
const root=resolve('.'),baseline='2972089ac1b17b90f2bc0dae9f069d0ca9746018',oldAssets=new Map();
let phase='old';const writes=[],external=[];
const server=createServer((req,res)=>{
 res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; worker-src 'self'; object-src 'none'");
 const pathname=new URL(req.url,'http://fixture.invalid').pathname;
 if(req.method!=='GET'){writes.push(req.method+' '+pathname);res.writeHead(405);res.end();return;}
 if(pathname==='/__seed'){res.writeHead(200,{'Content-Type':'text/html'});res.end('<!doctype html><title>Synthetic POP fixture</title>');return;}
 if(pathname.startsWith('/v1/')){res.writeHead(200,{'Content-Type':'application/json'});res.end('{"documents":[]}');return;}
 let file=decodeURIComponent(pathname).replace(/^\//,'');if(file.endsWith('/'))file+='index.html';
 if(!file.startsWith('pre-alpha/')){res.writeHead(404);res.end();return;}
 try{
 let data;
 if(phase==='old'){if(!oldAssets.has(file))oldAssets.set(file,execFileSync('git',['show',baseline+':'+file],{maxBuffer:20e6}));data=oldAssets.get(file);}else data=readFileSync(join(root,file));
 if(/\.(mjs|js|html|css)$/.test(file))data=data.toString().replaceAll('https://firestore.googleapis.com',base);
 res.writeHead(200,{'Cache-Control':'no-store','Content-Type':({'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.webp':'image/webp'})[extname(file)]||'application/octet-stream'});res.end(data);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
const artifact=process.env.TAPCALC_ARTIFACT_DIR||join(tmpdir(),'tapcalc-pop-evidence');mkdirSync(artifact,{recursive:true});
try{for(const mobile of [true,false]){
 phase='old';const device=mobile?'phone':'desktop',profile=mkdtempSync(join(tmpdir(),'tapcalc-pop-'+engine+'-'+device+'-'));
 const options={headless:true,...mobile?pw.devices['iPhone 13']:{viewport:{width:1360,height:1000}},serviceWorkers:'allow'};
 let context,page,step='baseline';const errors=[];
 const launch=async offline=>{context=await pw[engine].launchPersistentContext(profile,{...options,offline});context.on('request',request=>{const u=new URL(request.url());if(u.origin!==base)external.push(u.origin);});page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));};
 const tap=locator=>mobile?locator.tap():locator.click();
 const state={md:'10',ld:'2',start:'5',ptc:'1',preAlphaPipeOD:'16',bcoPipeID:'15.5',bcoCutterOD:'8',mt:'52',htActualPop:'999',htFieldBasis:'retained legacy',future:{keep:['raw',3]}};
 const fixture=normalizeJob({id:'pop-fixture',record:{jobBundle:{selectedOperationId:'one',sharedState:{jobDescription:'Synthetic actual POP'},operations:[{id:'one',label:'Hot Tap 1',operationType:'Hot Tap',workspaceStage:'tap',state},{id:'two',label:'Line Stop 1',operationType:'Line Stop',state:{...state,lsMd:'47',unknown:'preserved'}}]}}});
 const durableJob=raw=>JSON.parse(raw).entries.find(e=>e.job.id===fixture.id).job;
 const result=async(label,expected)=>{const selector=label==='Pilot on pipe'?page.locator('.big-value'):page.locator('.result-subgrid > div').filter({has:page.locator('span',{hasText:new RegExp('^'+label+'$')})}).locator('strong');assert.equal((await selector.textContent()).replace(/ \((?:≈ )?-?[0-9 /]+ in\)/g,'').replace(/\s+/g,' ').trim(),expected.toFixed(4)+' in',label);};
 try{
 await launch(false);await page.goto(base+'/__seed');await page.evaluate(({fixture})=>{localStorage.setItem('tapcalcPreAlpha01Workspace',JSON.stringify({build:'pre-alpha26',activeId:fixture.id,jobs:[fixture]}));localStorage.setItem('measurementCardStateV1','live sentinel');localStorage.setItem('measurementCardHistoryV1','[]');},{fixture});
 await page.goto(base+'/pre-alpha/#workspace');await page.locator('[data-field="md"]').waitFor();await page.waitForFunction(async()=>{const r=await navigator.serviceWorker.getRegistration();return !r?.installing&&!r?.waiting&&r?.active?.state==='activated'&&navigator.serviceWorker.controller?.state==='activated';});await waitForWorkspaceSave(page);
 await result('Pilot on pipe',17);const before=await readDurableWorkspace(page);
 step='upgrade';phase='new';await page.evaluate(async()=>{window.__popPreviousController=navigator.serviceWorker.controller;const r=await navigator.serviceWorker.getRegistration();await r.update();});
 // Cache creation begins installation; it is not evidence of activation or a complete offline cache.
 await page.waitForFunction(async()=>{const r=await navigator.serviceWorker.getRegistration();return !r.installing&&!r.waiting&&r.active?.state==='activated'&&navigator.serviceWorker.controller&&navigator.serviceWorker.controller!==window.__popPreviousController;},null,{timeout:30000});
 await page.waitForFunction(async()=>{const cache=await caches.open('tapcalc-pre-alpha-pre-alpha26-fractions1');return (await Promise.all(['index.html','workspace.mjs?v=pre-alpha26','model.mjs?v=pre-alpha26','workspace.css?v=pre-alpha26'].map(file=>cache.match(new URL(file,location.href).href)))).every(Boolean);},null,{timeout:30000});
 step='upgrade reload';await page.reload();await page.locator('[data-field="v3ActualPopInput"]').waitFor();assert.equal(await readDurableWorkspace(page),before,'Opening upgrade preserves exact stored bytes');
 assert.equal(await page.locator('[data-actual-pop-apply]').isDisabled(),true);await result('Pilot on pipe',17);
 await page.locator('[data-field="v3ActualPopInput"]').fill('18 1/2');await result('Pilot on pipe',17);
 await tap(page.locator('[data-actual-pop-apply]'));await result('Pilot on pipe',18.5);await result('Cutter on pipe',19.5);await result('Lower in',13.5);await result('Rod BCO',19.5+geometry(state).bco);await result('Total travel',14.5+geometry(state).bco);await result('Rod MCO',27.5);
 assert.match(await page.locator('[data-calculated-pop]').textContent(),/17\.0000/);await waitForWorkspaceSave(page);
 const applied=durableJob(await readDurableWorkspace(page));assert.deepEqual(applied.original,fixture.original);assert.deepEqual(applied.operations[1],fixture.operations[1]);
 await page.locator('[data-field="v3ActualPopInput"]').fill('oops');assert.equal(await page.locator('[data-actual-pop-apply]').isDisabled(),true);await result('Pilot on pipe',18.5);
 await tap(page.locator('[data-step="review"]'));assert.match(await page.locator('[data-review-stage="tap"]').innerText(),/Applied actual POP/);
 await tap(page.locator('[data-step="tap"]'));await page.locator('[data-field="v3ActualPopInput"]').fill('18 1/2');await page.screenshot({path:join(artifact,engine+'-'+device+'-light.png'),fullPage:true});await tap(page.locator('#theme'));await page.screenshot({path:join(artifact,engine+'-'+device+'-dark.png'),fullPage:true});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow');
 step='offline reload';await context.setOffline(true);await page.reload();await result('Pilot on pipe',18.5);
 await tap(page.locator('[data-actual-pop-reset]'));await result('Pilot on pipe',17);await waitForWorkspaceSave(page);
 await page.locator('[data-field="v3ActualPopInput"]').fill('20');await tap(page.locator('[data-actual-pop-apply]'));await waitForWorkspaceSave(page);await result('Pilot on pipe',20);
 step='offline restart';await context.close();await launch(true);await page.goto(base+'/pre-alpha/#workspace');await result('Pilot on pipe',20);await result('Rod MCO',29);
 assert.deepEqual(durableJob(await readDurableWorkspace(page)).original,fixture.original);assert.equal(await page.evaluate(()=>localStorage.getItem('measurementCardStateV1')),'live sentinel');
 assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);assert.deepEqual(external,[]);
 console.log('PASS actual POP '+engine+'/'+device+': real touch/click, original26 upgrade, exact formula outputs, explicit apply/reset, invalid drafts, Review, themes, offline reload/edit/disk restart, original and other-operation preservation; profile '+profile);
 }catch(error){
 console.error('ACTUAL_POP_ORIGINAL_FAILURE',JSON.stringify({engine,device,step,message:error.message}));
 try{console.error('ACTUAL_POP_WORKER_DIAGNOSTIC',JSON.stringify(await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();return {url:location.href,online:navigator.onLine,controller:navigator.serviceWorker.controller?.state,installing:r?.installing?.state,waiting:r?.waiting?.state,active:r?.active?.state,caches:await Promise.all((await caches.keys()).map(async key=>({key,urls:(await (await caches.open(key)).keys()).map(request=>request.url)})))};})));await page.screenshot({path:join(artifact,engine+'-'+device+'-failure.png'),fullPage:true});}catch(diagnosticError){console.error('ACTUAL_POP_DIAGNOSTIC_FAILURE',diagnosticError.message);}
 throw error;
 }finally{await context?.close();}
}}finally{await new Promise(r=>server.close(r));}
