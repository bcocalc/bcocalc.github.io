// Deferred-feature exclusion only. Isolated synthetic profiles; no private PDF or production writes.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdtempSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {tmpdir} from 'node:os';
import {readDurableWorkspace,waitForWorkspaceSave} from './pre-alpha-workspace-test-helpers.mjs';
import {cleanupExports,observeChildClose} from './runner-cleanup.mjs';
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright');}catch{pw=require(join(dirname(dirname(process.execPath)),'node_modules/playwright'));}
const engine=process.env.TAPCALC_BROWSER||'chromium',errors=[],external=[],writes=[];
const fixture={id:'deferred-worksheet-fixture',record:{jobBundle:{selectedOperationId:'tap',sharedState:{jobDescription:'Synthetic shelf guard'},operations:[{id:'tap',label:'Synthetic tap',operationType:'Hot Tap',state:{md:'10 1/4',ld:'',future:{retain:true}}}]}}};
const history=JSON.stringify([fixture]),sentinel='{"synthetic":"retained old state"}';
const server=spawn(process.execPath,['tests/sync-preview.mjs'],{stdio:['ignore','pipe','inherit']}),preview=observeChildClose(server);let context;
try{
 const base=await new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(Error('Preview timeout')),10000);server.once('error',reject);server.stdout.on('data',v=>{out+=v;const m=out.match(/http:\/\/127\.0\.0\.1:\d+/);if(m){clearTimeout(timer);resolve(m[0]);}});});
 for(const mobile of [true,false]){
  const profile=mkdtempSync(join(tmpdir(),'tapcalc-worksheet-shelved-'+engine+'-')),pdfRequests=[];
  context=await pw[engine].launchPersistentContext(profile,{headless:true,viewport:{width:mobile?390:1280,height:900},isMobile:mobile,hasTouch:mobile,serviceWorkers:'block'});
  context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
  await context.route('**/*',route=>{const r=route.request(),u=new URL(r.url());if(u.origin!==base){external.push(u.origin);return route.abort();}if(r.method()!=='GET'){writes.push(r.method()+' '+u.pathname);return route.abort();}if(/pdf(?:\.worker)?\.mjs$|\.pdf$/i.test(u.pathname))pdfRequests.push(u.pathname);return route.continue();});
  await context.addInitScript(({base,history,sentinel})=>{if(location.origin===base&&!localStorage.getItem('shelfGuardSeed')){localStorage.setItem('measurementCardHistoryV1',history);localStorage.setItem('measurementCardStateV1',sentinel);localStorage.setItem('shelfGuardSeed','yes');}},{base,history,sentinel});
  const page=await context.newPage();page.setDefaultTimeout(20000);await page.goto(base+'/pre-alpha/#library');await page.locator('[data-source="device"]').click();await page.locator('[data-job="deferred-worksheet-fixture"]').click();await waitForWorkspaceSave(page);const durable=await readDurableWorkspace(page);
  assert.equal(await page.locator('[data-job-export="worksheet"]').count(),0);assert.equal(await page.locator('[data-job-export="pdf"]').isVisible(),true);assert.equal(await page.locator('[data-job-export="png"]').isVisible(),true);
  const deferred=await context.newPage();await deferred.goto(base+'/pre-alpha/worksheet-draft.html?v=pre-alpha26');await deferred.locator('#worksheet-deferred').waitFor();assert.equal(await deferred.title(),'Worksheet deferred');assert.equal(await deferred.locator('input,canvas,[data-worksheet-field],#print').count(),0);assert.equal(await deferred.getByRole('link',{name:'Return to calculator'}).getAttribute('href'),'./#home');
  assert.equal(await readDurableWorkspace(page),durable);assert.deepEqual(await page.evaluate(()=>[localStorage.getItem('measurementCardHistoryV1'),localStorage.getItem('measurementCardStateV1')]),[history,sentinel]);assert.deepEqual(pdfRequests,[]);await context.close();context=null;assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.deepEqual(writes,[]);
  console.log('PASS worksheet shelved '+engine+'/'+(mobile?'phone':'desktop')+': entry absent; generic PDF/PNG available; direct route inert before picker/PDF worker setup; current and legacy synthetic data retained; no production writes.');
 }
}finally{await cleanupExports(context,preview,{report:({owner,phase,error})=>{process.exitCode=1;console.error('DEFERRED_WORKSHEET_CLEANUP_FAILURE',JSON.stringify({owner,phase,message:error.message}));}});if(errors.length){process.exitCode=1;console.error('DEFERRED_WORKSHEET_PAGE_ERRORS',JSON.stringify(errors));}}
