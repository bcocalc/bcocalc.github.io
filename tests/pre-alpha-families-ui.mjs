// Disposable persistent localhost profiles; all external traffic/writes blocked.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,join} from 'node:path';
import {readWorkspaceSnapshot,readDurableWorkspace,waitForWorkspaceSave} from './pre-alpha-workspace-test-helpers.mjs';
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright');}catch{pw=require(join(dirname(dirname(process.execPath)),'node_modules/playwright'));}
const engine=process.env.TAPCALC_BROWSER||'chromium';
const pipe={bcoPipeMaterial:'CarbonSteel',bcoPipeOD:'6.0',preAlphaPipeOD:'6 5/8',bcoPipeID:'6',bcoCutterOD:'4',md:'10',ld:'',ptc:'1 1/4',start:'2',mt:'52',etaBco:'999',etaMachine:'660',etaRpmOverride:'999',future:{keep:['1/4','invalid']}};
const htp={...pipe,lineStopVariant:'htp',htpPipeSize:'6',htpMd:'10',htpLd:'2',htpLdSign:'+',htpPtc:'1 1/4',htpMachine:'360'};
const hi={...pipe,lineStopVariant:'hiStop',hsMd:'10',hsLd:'2',hsLdSign:'+',hsRl:'8',hsCl:'3',hsPtc:'1',hsRcd:'8',hsPb:'7',hsPtp:'1/4',hsPod:'99'};
const bundle={id:'family-import',record:{job:{client:'Synthetic client',pressure:'250 psi',temperature:'80 F',product:'Water'},future:{keep:true},jobBundle:{selectedOperationId:'hi',sharedState:{jobDescription:'Synthetic family bundle',future:{keep:2}},futureBundle:{keep:true},operations:[
 {id:'htp',label:'Imported HTP',operationType:'Line Stop',state:htp,measurements:{htp:{tco:'88',future:{keep:true}}}},
 {id:'hi',label:'Imported Hi-Stop',operationType:'Line Stop',state:hi,measurements:{hiStop:{tco:'66',psd:'77',plugSet:'88'}}},
 {id:'tap',label:'Imported standard tap',operationType:'Hot Tap',state:pipe}
]}}};
const unknown={id:'unknown-htp',record:{meta:{operationType:'HTP'},state:{...htp,htpPipeSize:'22',htpMachine:'future profile'},future:{keep:true}}};
const history=JSON.stringify([bundle,unknown]),sentinel='{"synthetic":"family live state unchanged"}';
const server=spawn(process.execPath,['tests/sync-preview.mjs'],{stdio:['ignore','pipe','inherit']});let context,page,device,step='startup';
try{
 const base=await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('Preview timeout')),10000);server.stdout.on('data',data=>{output+=data;const match=output.match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timer);resolve(match[0]);}});server.once('error',reject);});
 for(const mobile of [true,false]){
  device=mobile?'phone':'desktop';const profile=mkdtempSync(join(tmpdir(),'tapcalc-families-'+engine+'-'+device+'-')),errors=[],writes=[],external=[];
  const options={headless:true,...(mobile?pw.devices['iPhone 13']:{viewport:{width:1280,height:900}}),serviceWorkers:'block'};
  async function launch(){
   context=await pw[engine].launchPersistentContext(profile,options);
   await context.route('**/*',route=>{const request=route.request(),url=new URL(request.url());if(url.origin!==base){external.push(request.method()+' '+url.origin);return route.abort();}if(request.method()!=='GET'){writes.push(request.method()+' '+url.pathname);return route.abort();}return route.continue();});
   await context.addInitScript(({history,sentinel})=>{if(localStorage.getItem('measurementCardHistoryV1')===null){localStorage.setItem('measurementCardHistoryV1',history);localStorage.setItem('measurementCardStateV1',sentinel);}},{history,sentinel});
   page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',error=>errors.push(error.message));page.on('crash',()=>console.error('FAMILY_PAGE_CRASH',JSON.stringify({engine,device,step})));
  }
  const activate=locator=>mobile?locator.tap():locator.click();
  const activeJob=async()=>{const snapshot=await readWorkspaceSnapshot(page);return snapshot.jobs.find(job=>job.id===snapshot.activeId);};
  const openJob=async(source,id)=>{await activate(page.locator('.main-nav [data-page="library"]'));await activate(page.locator('[data-source="'+source+'"]'));await activate(page.locator('[data-job="'+id+'"]'));await waitForWorkspaceSave(page);};
  const checkResults=async expected=>{
   const panel=page.locator('#results > .result-panel').first();const actual=await panel.evaluate(node=>Object.fromEntries([[node.querySelector('.eyebrow')?.textContent,node.querySelector('.big-value')?.textContent],...[...node.querySelectorAll('.result-subgrid > div')].map(row=>[row.querySelector('span').textContent,row.querySelector('strong').textContent])].map(([key,value])=>[key.trim(),value.trim()])));
   assert.deepEqual(actual,expected);
  };
  step='new HTP';await launch();await page.goto(base+'/pre-alpha/');await page.waitForFunction(()=>document.getElementById('connection').textContent.includes('Connected'));
  await activate(page.locator('[data-action="new"]').first());await page.locator('[data-detail="jobDescription"]').fill('Fresh synthetic families');await activate(page.locator('#details-form [type="submit"]'));
  await page.locator('[data-field="operationType"]').selectOption('HTP');await activate(page.locator('[data-step="htp"]'));
  assert.equal(await page.locator('[data-step="tap"],[data-step="stop"],[data-step="plug"],[data-step="pipe"]').count(),0);
  await page.locator('[data-field="htpPipeSize"]').selectOption('6');for(const [key,value]of Object.entries({htpMd:'10 1/2',htpLd:'-1/2',htpPtc:'1 1/4'}))await page.locator('[data-field="'+key+'"]').fill(value);
  await page.locator('[data-field="htpLdSign"]').selectOption('-');await page.locator('[data-field="htpMachine"]').selectOption('660');
  await checkResults({'Total cut out (TCO)':'18.2500 in','Chart BCO':'6.0000 in'});assert.match(await page.locator('[data-htp-chart]').textContent(),/8" - 12".*6" - 8".*9\.968 in/s);assert.match(await page.locator('[aria-label="HTP chart cutting estimate"]').textContent(),/660 \/ 760/);
  await page.locator('[data-field="htpLd"]').fill('');await checkResults({'Total cut out (TCO)':'-- in','Chart BCO':'6.0000 in'});assert.equal(await page.locator('[data-value-origin="htpLd"]').textContent(),'Not entered');
  await page.locator('[data-field="htpLd"]').fill('1/0');assert.equal(await page.locator('[data-warning-code="invalid-htpLd"]').count(),1);await page.locator('[data-field="htpLd"]').fill('-1/2');
  await activate(page.locator('#results [data-open-eta]'));assert.equal(await page.locator('#eta-fields [data-eta-field="etaCutterSize"],#eta-fields [data-eta-field="etaRpmOverride"]').count(),0);await page.locator('[data-eta-field="htpMachine"]').selectOption('1200');await activate(page.locator('[data-close="eta-dialog"]'));
  await checkResults({'Total cut out (TCO)':'18.2500 in','Chart BCO':'6.0000 in'});assert.match(await page.locator('[aria-label="HTP chart cutting estimate"]').textContent(),/1200-M120/);assert.equal(await page.locator('[data-field="htpMachine"]').inputValue(),'1200','Dialog and stage show the same separate HTP profile');await waitForWorkspaceSave(page);
  const freshId=(await activeJob()).id,firstHtp=(await activeJob()).operations[0].id;
  step='new Hi-Stop';await activate(page.locator('[data-action="add"]').first());await activate(page.locator('[data-add-type="Hi-Stop"]'));await activate(page.locator('[data-step="pipe"]'));
  assert.equal(await page.locator('[data-field="bcoCutterOD"],[data-field="bcoCutterID"]').count(),0);await page.locator('[data-field="bcoPipeOD"]').selectOption('6.0');await page.locator('[data-field="bcoSchedule"]').selectOption('custom');await page.locator('[data-field="preAlphaPipeOD"]').fill('6 5/8');await page.locator('[data-field="bcoPipeID"]').fill('6');await activate(page.locator('[data-step="hiStop"]'));
  for(const [key,value]of Object.entries({hsMd:'10',hsLd:'2',hsRl:'8',hsCl:'3',hsPtc:'1',hsRcd:'8',hsPb:'7',hsPtp:'1/4'}))await page.locator('[data-field="'+key+'"]').fill(value);
  const hiExpected={'Lower in':'12.0000 in','Total cut out (TCO)':'11.3125 in',PSD:'2.2500 in','Plug Set':'17.5625 in'};
  await checkResults(hiExpected);assert.equal(await page.locator('[data-field="hsPod"],#results [data-open-eta]').count(),0);assert.match(await page.locator('#results').textContent(),/POD:.*6\.6250 in/s);
  await page.locator('[data-field="hsPtp"]').fill('0');await checkResults({...hiExpected,PSD:'-- in','Plug Set':'-- in'});assert.equal(await page.locator('[data-warning-code="histop-taper"]').count(),1);await page.locator('[data-field="hsPtp"]').fill('1/4');
  await page.locator('[data-field="hsMd"]').fill('1/0');await checkResults({...hiExpected,'Lower in':'-- in','Plug Set':'-- in'});await page.locator('[data-field="hsMd"]').fill('10');
  await page.locator('[data-field="hsPtc"]').fill('');await checkResults({...hiExpected,'Total cut out (TCO)':'-- in'});await page.locator('[data-field="hsPtc"]').fill('1');
  await activate(page.locator('#results [data-review-edit="pipe"]'));await page.locator('[data-field="preAlphaPipeOD"]').fill('7');await activate(page.locator('[data-step="hiStop"]'));await checkResults({...hiExpected,'Total cut out (TCO)':'11.5000 in','Plug Set':'17.7500 in'});
  await waitForWorkspaceSave(page);const fresh=await activeJob();assert.equal(fresh.operations.length,2);assert.equal(fresh.operations[0].state.htpMd,'10 1/2');assert.equal(fresh.operations[0].state.htpLd,'-1/2');assert.equal(fresh.operations[0].state.htpMachine,'1200');
  step='legacy complete family bundle';await openJob('device','family-import');await activate(page.locator('[data-step="hiStop"]'));await checkResults(hiExpected);assert.match(await page.locator('[data-warning-code="histop-pod-source"]').textContent(),/99.*inactive/);assert.equal((await activeJob()).operations[1].state.hsPod,'99');
  assert.match(await page.locator('[data-historical-family="hiStop"]').textContent(),/66.*77.*88/s);assert.equal(await page.locator('#results [data-open-eta]').count(),0);
  await activate(page.locator('[data-step="review"]'));const hiReview=page.locator('[data-review-stage="hiStop"]');assert.match(await hiReview.textContent(),/12\.0000.*11\.3125.*2\.2500.*17\.5625/s);assert.match(await hiReview.textContent(),/Saved Hi-Stop POD \(not used\).*99/s);assert.equal(await page.locator('[data-review-stage="tap"],[data-review-stage="stop"],[data-review-stage="plug"]').count(),0);
  await activate(page.locator('[data-operation="htp"]'));await activate(page.locator('[data-step="htp"]'));await checkResults({'Total cut out (TCO)':'19.2500 in','Chart BCO':'6.0000 in'});assert.match(await page.locator('[data-historical-family="htp"]').textContent(),/88/);assert.match(await page.locator('[aria-label="HTP chart cutting estimate"]').textContent(),/Standard Hot Tap ETA overrides are retained but not used/);
  await activate(page.locator('[data-step="review"]'));assert.match(await page.locator('[data-review-stage="htp"]').textContent(),/19\.2500/);assert.equal(await page.locator('[data-review-stage="tap"]').count(),0);
  await activate(page.locator('[data-operation="tap"]'));await activate(page.locator('[data-step="tap"]'));assert.match(await page.locator('#results > .result-panel').first().textContent(),/Rod MCO.*16\.5625/s);assert.equal(await page.locator('[data-step="htp"],[data-step="hiStop"]').count(),0);
  await waitForWorkspaceSave(page);const imported=await activeJob();assert.deepEqual(imported.operations.map(op=>op.state),bundle.record.jobBundle.operations.map(op=>op.state));assert.deepEqual(imported.original,{...bundle,source:'device'});
  step='unlisted HTP row and profile';await openJob('device','unknown-htp');await activate(page.locator('[data-step="htp"]'));await checkResults({'Total cut out (TCO)':'-- in','Chart BCO':'-- in'});assert.equal(await page.locator('[data-field="htpPipeSize"]').inputValue(),'22');assert.equal(await page.locator('[data-field="htpMachine"]').inputValue(),'future profile');assert.equal(await page.locator('[data-warning-code="htp-chart"]').count(),1);
  await page.locator('[data-field="htpPipeSize"]').selectOption('6');await checkResults({'Total cut out (TCO)':'19.2500 in','Chart BCO':'6.0000 in'});assert.equal(await page.locator('[data-warning-code="htp-eta"]').count(),1);await waitForWorkspaceSave(page);assert.equal((await activeJob()).original.record.state.htpPipeSize,'22');assert.equal((await activeJob()).original.record.state.htpMachine,'future profile');
  step='save/reopen/reload/restart';await openJob('experimental',imported.id);await activate(page.locator('[data-operation="hi"]'));await activate(page.locator('[data-step="hiStop"]'));await checkResults(hiExpected);await waitForWorkspaceSave(page);const durable=await readDurableWorkspace(page);
  for(const dark of [false,true]){
   if(await page.locator('body').evaluate(node=>node.classList.contains('dark'))!==dark)await activate(page.locator('#theme'));
   for(const width of mobile?[320,390]:[1280]){await page.setViewportSize({width,height:820});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Family controls/results/worksheets fit viewport');await page.screenshot({path:join(profile,'hiStop-'+width+'-'+dark+'.png'),fullPage:true});}
  }
  assert.equal(await readDurableWorkspace(page),durable);await page.reload();await page.locator('[data-field="hsPtp"]').waitFor();await checkResults(hiExpected);assert.equal(await readDurableWorkspace(page),durable);
  await context.close();await launch();await page.goto(base+'/pre-alpha/#workspace');await page.locator('[data-field="hsPtp"]').waitFor();await checkResults(hiExpected);assert.equal(await readDurableWorkspace(page),durable);
  await openJob('experimental',freshId);await activate(page.locator('[data-operation="'+firstHtp+'"]'));await activate(page.locator('[data-step="htp"]'));await checkResults({'Total cut out (TCO)':'18.2500 in','Chart BCO':'6.0000 in'});assert.equal((await activeJob()).operations[1].state.preAlphaPipeOD,'7');
  assert.equal(await page.evaluate(()=>localStorage.getItem('measurementCardHistoryV1')),history);assert.equal(await page.evaluate(()=>localStorage.getItem('measurementCardStateV1')),sentinel);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.deepEqual(writes,[]);
  await context.close();context=null;console.log('PASS families '+engine+'/'+device+': new/legacy/three-operation active HTP+Hi-Stop, exact values/chart/profile/ETA, signed/fraction/strict blank/invalid/zero-taper guards, source-POD disclosure, Review/worksheet/history separation, no standard fallback, raw/original/live-key invariants, explicit reopen/reload/browser restart; profile '+profile);
 }
}catch(error){console.error('FAMILY_UI_FAILURE',JSON.stringify({engine,device,step,message:error.message,stack:error.stack}));throw error;}
finally{await context?.close();server.kill();}
