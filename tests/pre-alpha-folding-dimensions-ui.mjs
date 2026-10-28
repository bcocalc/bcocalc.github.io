// Actual app, disposable profiles and synthetic records; all external/writing requests blocked.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdtempSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {tmpdir} from 'node:os';
import {readDurableWorkspace,waitForWorkspaceSave} from './pre-alpha-workspace-test-helpers.mjs';
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright');}catch{pw=require(join(dirname(dirname(process.execPath)),'node_modules/playwright'));}
const engine=process.env.TAPCALC_BROWSER||'chromium';
const state={bcoPipeMaterial:'CarbonSteel',bcoPipeOD:'6.0',preAlphaPipeOD:'6 5/8',bcoPipeID:'6.125',bcoCutterOD:'4',md:'10',ld:'',ptc:'1 1/4',start:'2',mt:'52',future:{keep:['1/4','invalid']}};
const fixture={id:'folding-source',record:{job:{description:'Synthetic Folding Head reference check'},jobBundle:{selectedOperationId:'tap',sharedState:{jobDescription:'Synthetic Folding Head reference check'},operations:[{id:'tap',operationType:'Hot Tap',state},{id:'stop',operationType:'Line Stop',state:{...state,lsMd:'12'}}]}}};
const history=JSON.stringify([fixture]),sentinel='{"synthetic":"folding reference live state unchanged"}';
const server=spawn(process.execPath,['tests/sync-preview.mjs'],{stdio:['ignore','pipe','inherit']});let context,page,device,step='startup';
try{
 const base=await new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(Error('Preview startup timeout')),10000);server.stdout.on('data',data=>{out+=data;const m=out.match(/http:\/\/127\.0\.0\.1:\d+/);if(m){clearTimeout(timer);resolve(m[0]);}});server.once('error',reject);});
 for(const mobile of [true,false]){
  device=mobile?'phone':'desktop';const profile=mkdtempSync(join(tmpdir(),'tapcalc-folding-'+engine+'-'+device+'-')),errors=[],writes=[],external=[];
  const options={headless:true,viewport:{width:mobile?390:1280,height:820},isMobile:mobile,hasTouch:mobile,serviceWorkers:'block',...(engine==='chromium'&&!process.env.CI?{channel:'chrome'}:{})};
  async function launch(){
   context=await pw[engine].launchPersistentContext(profile,options);
   context.on('page',p=>p.on('pageerror',error=>errors.push({url:p.url(),message:error.message})));
   await context.route('**/*',route=>{const request=route.request(),url=new URL(request.url());if(url.origin!==base){external.push(url.origin);return route.abort();}if(request.method()!=='GET'){writes.push(request.method()+' '+url.pathname);return route.abort();}return route.continue();});
   await context.addInitScript(({base,history,sentinel})=>{if(location.origin!==base||localStorage.getItem('foldingFixtureSeeded'))return;localStorage.setItem('measurementCardHistoryV1',history);localStorage.setItem('measurementCardStateV1',sentinel);localStorage.setItem('foldingFixtureSeeded','yes');},{base,history,sentinel});
   page=await context.newPage();
  }
  await launch();const activate=locator=>mobile?locator.tap():locator.click();
  const field=key=>page.locator('[data-ref-filter="'+key+'"]');
  const dimensions=()=>page.locator('.reference-section').filter({has:page.locator('h3',{hasText:'Folding Head backing ring and roller positions'})});
  const rows=()=>dimensions().locator('tbody tr td:nth-child(2)').allTextContents();
  const expectDimensions=async values=>assert.deepEqual(await rows(),values);
  const openReference=async()=>{await activate(page.locator('#menu-toggle'));await activate(page.locator('#app-menu [data-page="references"]'));};
  const folding=async()=>{await page.locator('#reference-category').selectOption('foldinghead');await field('topic').selectOption('helper');};
  step='import synthetic complete bundle';await page.goto(base+'/pre-alpha/#library');await page.waitForFunction(()=>document.getElementById('connection')?.textContent.startsWith('Connected'));
  await activate(page.locator('[data-source="device"]'));await activate(page.locator('[data-job="folding-source"]'));await waitForWorkspaceSave(page);const durable=await readDurableWorkspace(page);
  await openReference();await folding();await expectDimensions(['Not available','Not available','Not available','Not available']);
  step='native fraction inputs and independent results';await field('pod').fill('6 5/8');await field('wall').fill('1/4"');
  await expectDimensions(['6.1250 in','5.6250 in','3.0625 in','2.9375 in']);
  assert.match(await dimensions().innerText(),/position from center mark/);assert.match(await page.locator('#reference-content').innerText(),/not wheel diameters.*endpoint/s);
  const wallHandle=await field('wall').elementHandle();await field('wall').fill('3/8');assert.ok(await wallHandle.evaluate(el=>el.isConnected&&el===document.querySelector('[data-ref-filter="wall"]')));await wallHandle.dispose();
  await field('wall').fill('1/4"');await field('md').fill('12 1/2');await field('ld').fill('1/4');await field('ldSign').selectOption('subtract');await field('start').fill('-0 1/2');
  const setpoint=page.locator('.reference-section').filter({has:page.locator('h3',{hasText:'Folding Head set-point helper'})});assert.deepEqual(await setpoint.locator('tbody tr td:nth-child(2)').allTextContents(),['18.6250 in','18.1250 in']);
  await field('md').fill('bad');assert.equal(await setpoint.locator('tbody tr td:nth-child(2)').first().textContent(),'Not available');await expectDimensions(['6.1250 in','5.6250 in','3.0625 in','2.9375 in']);await field('md').fill('12 1/2');
  step='invalid and impossible input clears stale results';
  for(const [pod,wall]of [['','1/4'],['6 5/8',''],['-6','1/4'],['6 5/8','-1/4'],['6 5/8','1/0'],['1','1/2']]){await field('pod').fill(pod);await field('wall').fill(wall);await expectDimensions(['Not available','Not available','Not available','Not available']);}
  await field('pod').fill('1.1');await field('wall').fill('.3');await expectDimensions(['0.5000 in','Not available','0.2500 in','0.1250 in']);
  await field('pod').fill('.75');await field('wall').fill('.25');await expectDimensions(['0.2500 in','Not available','0.1250 in','Not available']);
  await field('pod').fill('6 5/8');await field('wall').fill('1/4"');
  step='reference navigation retains exact raw inputs; pivot unchanged';await page.locator('#reference-category').selectOption('pivothead');await field('pipeSize').selectOption('16.0');await field('pressureBand').selectOption('under500');await field('wall').fill('3/8');await field('measuredNose').fill('14');
  const pivotText=await page.locator('#reference-content').innerText();assert.match(pivotText,/14\.5000 in/);assert.match(pivotText,/0\.5000 in/);
  await folding();assert.equal(await field('pod').inputValue(),'6 5/8');assert.equal(await field('wall').inputValue(),'1/4"');assert.equal(await field('start').inputValue(),'-0 1/2');
  await activate(page.locator('.main-nav [data-page="home"]'));await activate(page.locator('#home [data-page="references"]'));assert.equal(await field('wall').inputValue(),'1/4"');
  await activate(page.locator('[data-ref-current-pipe]'));assert.equal(await field('pod').inputValue(),'6.625');assert.equal(await field('wall').inputValue(),'0.25');assert.equal(await field('md').inputValue(),'12 1/2');assert.equal(await field('start').inputValue(),'-0 1/2');await expectDimensions(['6.1250 in','5.6250 in','3.0625 in','2.9375 in']);
  step='320px themes and source storage invariant';
  for(const dark of [false,true]){
   if(await page.locator('body').evaluate(el=>el.classList.contains('dark'))!==dark)await activate(page.locator('#theme'));
   await page.setViewportSize({width:mobile?320:1280,height:820});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   assert.deepEqual(await dimensions().locator('.reference-row-card,.reference-row-card>div').evaluateAll(nodes=>nodes.filter(el=>el.getBoundingClientRect().width&&el.scrollWidth>el.clientWidth+1).map(el=>el.className)),[]);
   await dimensions().screenshot({path:join(profile,'folding-dimensions-'+(dark?'dark':'light')+'.png')});
  }
  assert.equal(await readDurableWorkspace(page),durable);assert.deepEqual(await page.evaluate(()=>[localStorage.getItem('measurementCardHistoryV1'),localStorage.getItem('measurementCardStateV1')]),[history,sentinel]);
  await activate(page.locator('[data-ref-clear]'));assert.equal(await field('pod').inputValue(),'');assert.equal(await field('wall').inputValue(),'');await expectDimensions(['Not available','Not available','Not available','Not available']);
  step='online reload and persistent-profile restart';await page.reload();await page.waitForFunction(()=>document.getElementById('connection')?.textContent.startsWith('Connected'));assert.equal(await readDurableWorkspace(page),durable);await folding();assert.equal(await field('wall').inputValue(),'','Reference scratch inputs retain their existing reset-on-reload behavior');await activate(page.locator('[data-ref-current-pipe]'));await expectDimensions(['6.1250 in','5.6250 in','3.0625 in','2.9375 in']);
  await context.close();await launch();await page.goto(base+'/pre-alpha/#references');await page.waitForFunction(()=>document.getElementById('connection')?.textContent.startsWith('Connected'));assert.equal(await readDurableWorkspace(page),durable);await folding();await activate(page.locator('[data-ref-current-pipe]'));await expectDimensions(['6.1250 in','5.6250 in','3.0625 in','2.9375 in']);
  assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);assert.deepEqual(external,[]);assert.deepEqual(await page.evaluate(()=>[localStorage.getItem('measurementCardHistoryV1'),localStorage.getItem('measurementCardStateV1')]),[history,sentinel]);await context.close();context=null;
  console.log('PASS Folding Head '+engine+'/'+device+': actual O.D./wall fractions, backing ring and labeled center-mark positions, independent set point, invalid/boundary guards, pivot regression, raw reference retention, clear,320px themes, unchanged complete-job storage, online reload/process restart; profile '+profile);
 }
}catch(error){console.error('FOLDING_UI_FAILURE',JSON.stringify({engine,device,step,message:error.message,stack:error.stack}));throw error;}
finally{await context?.close();server.kill();}
