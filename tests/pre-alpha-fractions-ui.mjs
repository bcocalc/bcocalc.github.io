// Disposable, network-isolated browser fixture. Never uses a production job/write.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {execFileSync} from 'node:child_process';
import {readFileSync,mkdtempSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import {join,resolve,extname} from 'node:path';
import {normalizeJob} from '../pre-alpha/model.mjs';
import {readDurableWorkspace,waitForWorkspaceSave} from './pre-alpha-workspace-test-helpers.mjs';
const pw=createRequire(import.meta.url)('playwright'),engine=process.env.TAPCALC_BROWSER||'chromium';
const root=resolve('.'),baseline='ffacd8f8cf48cfc9c442f5e652394af79f123809',oldAssets=new Map();
let phase='old';const writes=[],external=[];
const server=createServer((req,res)=>{
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; worker-src 'self'; object-src 'none'");
  const pathname=new URL(req.url,'http://fixture.invalid').pathname;
  if(req.method!=='GET'){writes.push(req.method+' '+pathname);res.writeHead(405);res.end();return;}
  if(pathname==='/__seed'){res.writeHead(200,{'Content-Type':'text/html'});res.end('<!doctype html><title>Synthetic fraction fixture</title>');return;}
  if(pathname.startsWith('/v1/')){res.writeHead(200,{'Content-Type':'application/json'});res.end('{"documents":[]}');return;}
  let file=decodeURIComponent(pathname).replace(/^\//,'');if(file.endsWith('/'))file+='index.html';
  if(!file.startsWith('pre-alpha/')||file.includes('..')){res.writeHead(404);res.end();return;}
  try {
    let data;
    if(phase==='old'){if(!oldAssets.has(file))oldAssets.set(file,execFileSync('git',['show',baseline+':'+file],{maxBuffer:20e6}));data=oldAssets.get(file);}else data=readFileSync(join(root,file));
    if(/\.(mjs|js|html|css)$/.test(file))data=data.toString().replaceAll('https://firestore.googleapis.com',base);
    res.writeHead(200,{'Cache-Control':'no-store','Content-Type':({'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.webp':'image/webp'})[extname(file)]||'application/octet-stream'});res.end(data);
  }catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
const artifact=process.env.TAPCALC_ARTIFACT_DIR||join(tmpdir(),'tapcalc-fraction-evidence');mkdirSync(artifact,{recursive:true});
try { for(const mobile of [true,false]) {
  phase='old';const device=mobile?'phone':'desktop',profile=mkdtempSync(join(tmpdir(),'tapcalc-fraction-'+engine+'-'+device+'-'));
  const options={headless:true,...mobile?pw.devices['iPhone 13']:{viewport:{width:1360,height:1000}},serviceWorkers:'allow'};
  let context,page;const errors=[];
  const launch=async offline=>{context=await pw[engine].launchPersistentContext(profile,{...options,offline});context.on('request',request=>{const u=new URL(request.url());if(u.origin!==base)external.push(u.origin);});page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));};
  const tap=locator=>mobile?locator.tap():locator.click();
  const state={md:'10',ld:'2',start:'5',ptc:'1',preAlphaPipeOD:'16',bcoPipeID:'15.5',bcoCutterOD:'8',mt:'52',unknown:{keep:['1/32',3]}};
  const fixture=normalizeJob({id:'fraction-fixture',record:{jobBundle:{selectedOperationId:'one',sharedState:{jobDescription:'Synthetic fractions'},operations:[{id:'one',label:'Hot Tap 1',operationType:'Hot Tap',workspaceStage:'tap',state}]}}});
  const result=async(decimal,fraction)=>{assert.equal((await page.locator('.big-value .result-decimal').textContent()).trim(),decimal+' in');assert.equal((await page.locator('.big-value .result-fraction').textContent()).trim(),'('+fraction+' in)');};
  try {
    await launch(false);await page.goto(base+'/__seed');await page.evaluate(({fixture})=>{localStorage.setItem('tapcalcPreAlpha01Workspace',JSON.stringify({build:'pre-alpha26',activeId:fixture.id,jobs:[fixture]}));localStorage.setItem('measurementCardStateV1','live sentinel');},{fixture});
    await page.goto(base+'/pre-alpha/#workspace');await page.locator('[data-field="md"]').waitFor();await page.waitForFunction(async()=>{const r=await navigator.serviceWorker.getRegistration();return !r?.installing&&!r?.waiting&&r?.active?.state==='activated'&&navigator.serviceWorker.controller?.state==='activated';});await waitForWorkspaceSave(page);
    assert.equal((await page.locator('.big-value').textContent()).trim(),'17.0000 in');const before=await readDurableWorkspace(page);
    phase='new';await page.evaluate(async()=>{window.__previousFractionController=navigator.serviceWorker.controller;const r=await navigator.serviceWorker.getRegistration();await r.update();});
    await page.waitForFunction(async()=>{const r=await navigator.serviceWorker.getRegistration();return !r.installing&&!r.waiting&&r.active?.state==='activated'&&navigator.serviceWorker.controller!==window.__previousFractionController;},null,{timeout:30000});
    await page.reload();await result('17.0000','17');assert.equal(await readDurableWorkspace(page),before,'Opening upgrade preserves exact job bytes');
    await page.locator('[data-field="md"]').fill('10.34375');await result('17.3438','≈ 17 3/8');
    await page.locator('[data-field="md"]').fill('10.343749');await result('17.3437','≈ 17 5/16');
    await page.locator('[data-field="md"]').fill('10.96875');await result('17.9688','≈ 18');
    await page.locator('[data-field="md"]').fill('');assert.equal(await page.locator('.big-value .result-fraction').count(),0);
    await page.locator('[data-field="md"]').fill('10.34375');await result('17.3438','≈ 17 3/8');
    await page.locator('[data-field="v3ActualPopInput"]').fill('18.53125');await tap(page.locator('[data-actual-pop-apply]'));await result('18.5313','≈ 18 9/16');
    await tap(page.locator('[data-step="review"]'));const review=page.locator('[data-review-stage="tap"]');assert.match(await review.locator('.review-results').innerText(),/18\.5313.*≈ 18 9\/16/s);await tap(review.locator('.review-worksheet > summary'));assert.match(await review.locator('.worksheet-total').allTextContents().then(values=>values.join('\n')),/18\.5313.*≈ 18 9\/16/s);
    await tap(page.locator('[data-step="tap"]'));
    for(const dark of [false,true]) {
      if(await page.locator('body').evaluate(node=>node.classList.contains('dark'))!==dark)await tap(page.locator('#theme'));
      for(const width of mobile?[320,390,430]:[1360]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Results fit '+width);await page.screenshot({path:join(artifact,engine+'-'+device+'-'+width+'-'+dark+'.png'),fullPage:true});}
    }
    await waitForWorkspaceSave(page);const saved=await readDurableWorkspace(page);
    await context.setOffline(true);await page.reload();await result('18.5313','≈ 18 9/16');assert.equal(await readDurableWorkspace(page),saved);
    await tap(page.locator('[data-actual-pop-reset]'));await result('17.3438','≈ 17 3/8');await waitForWorkspaceSave(page);
    await context.close();await launch(true);await page.goto(base+'/pre-alpha/#workspace');await result('17.3438','≈ 17 3/8');
    const durable=JSON.parse(await readDurableWorkspace(page)),job=durable.entries.find(e=>e.job.id===fixture.id).job;assert.equal(job.operations[0].state.md,'10.34375');assert.deepEqual(job.original,fixture.original);assert.deepEqual(job.operations[0].state.unknown,state.unknown);assert.equal(await page.evaluate(()=>localStorage.getItem('measurementCardStateV1')),'live sentinel');
    assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);assert.deepEqual(external,[]);
    console.log('PASS fractions '+engine+'/'+device+': upgrade from current live, exact and rounded fractions, carry, invalid values, repeated edits, applied POP, Review, worksheet, light/dark, 320/390/430 widths, offline reload/edit/disk restart and no data rounding.');
  } finally {await context?.close();}
}} finally {await new Promise(r=>server.close(r));}
