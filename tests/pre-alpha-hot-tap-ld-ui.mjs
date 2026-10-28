// Synthetic device history and working copies only; production requests are blocked.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';
import {tmpdir} from 'node:os';
import {geometry} from '../pre-alpha/model.mjs';
import {waitForWorkspaceSave,readWorkspaceSnapshot} from './pre-alpha-workspace-test-helpers.mjs';
const require=createRequire(import.meta.url);
let pw;try{pw=require('playwright');}catch{pw=require(join(dirname(dirname(process.execPath)),'node_modules/playwright'));}
const engine=process.env.TAPCALC_BROWSER||'chromium';
const state={bcoPipeMaterial:'CarbonSteel',bcoPipeOD:'6.0',bcoPipeID:'6',bcoCutterOD:'4',md:'10',ptc:'1',start:'2',mt:'52',unknownFuture:{retain:['all',3]}};
const history=[{id:'ld-bundle',record:{jobBundle:{sharedState:{jobDescription:'LD bundle'},selectedOperationId:'missing',operations:[
  {id:'missing',label:'Missing LD',operationType:'Hot Tap',state},
  {id:'empty',label:'Empty LD',operationType:'Hot Tap',state:{...state,ld:''}},
  {id:'signed',label:'Signed LD',operationType:'Hot Tap',state:{...state,ld:'2',ldSign:'-'}}
]} }},{id:'ld-nested',record:{meta:{title:'Legacy nested measurements',operationType:'Hot Tap'},pipe:{material:'Carbon Steel',nominalSize:'6',pipeId:'6'},machine:{cutterOd:'4'},measurements:{hotTap:{md:'10',ptc:'1',rodStart:'2',mt:'52'}}}}];
const old=JSON.stringify(history),liveDraft='{"untouched":"live LD fixture"}';
const server=spawn(process.execPath,['tests/sync-preview.mjs'],{stdio:['ignore','pipe','inherit']});
let browser,page,device;
try{
  const base=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Preview timeout')),10000);server.stdout.on('data',data=>{const match=String(data).match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timer);resolve(match[0]);}});server.once('error',reject);});
  browser=await pw[engine].launch({headless:true,...(engine==='chromium'&&!process.env.CI?{channel:'chrome'}:{})});
  for(const mobile of [true,false]){
    device=mobile?'phone':'desktop';
    const context=await browser.newContext({...mobile?pw.devices['iPhone 13']:{viewport:{width:1280,height:900}},serviceWorkers:'block'});
    page=await context.newPage();page.setDefaultTimeout(15000);
    const errors=[],writes=[],activate=locator=>mobile?locator.tap():locator.click();
    page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/v1/**',async route=>{if(route.request().method()!=='GET')writes.push(route.request().method());await route.fulfill({json:{documents:[]}});});
    await page.addInitScript(({old,liveDraft})=>{if(!localStorage.getItem('measurementCardHistoryV1')){localStorage.setItem('measurementCardHistoryV1',old);localStorage.setItem('measurementCardStateV1',liveDraft);}}, {old,liveDraft});
    await page.goto(base+'/pre-alpha/');
    await page.waitForFunction(()=>document.getElementById('connection').textContent.includes('Connected'));
    const openDevice=async id=>{await activate(page.locator('.main-nav [data-page="library"]'));await activate(page.locator('[data-source="device"]'));await activate(page.locator('.job-card[data-job="'+id+'"]'));await activate(page.locator('[data-step="tap"]'));await waitForWorkspaceSave(page);};
    const output=async()=>page.locator('#results .result-panel:not(.bco-eta-panel)').evaluate(node=>[node.querySelector('.big-value').textContent,...[...node.querySelectorAll('.result-subgrid strong')].map(n=>n.textContent)].map(text=>text.trim()));
    const checkOutputs=async lowerIn=>{
      const bco=geometry(state).bco;
      assert.deepEqual(await output(),[2+lowerIn,3+lowerIn,3+lowerIn+bco,lowerIn+1+bco,lowerIn,4.3125].map(value=>value.toFixed(4)+' in'));
    };
    const defaultOrigin=async()=>assert.equal(await page.locator('[data-value-origin="ld"]').textContent(),'Default 0 - not entered');
    await openDevice('ld-bundle');
    await checkOutputs(10);await defaultOrigin();
    assert.equal(await page.locator('[data-field="ld"]').inputValue(),'');
    let snapshot=await readWorkspaceSnapshot(page),saved=snapshot.jobs.find(j=>j.id===snapshot.activeId);
    assert.equal(Object.hasOwn(saved.operations[0].state,'ld'),false,'Hydration and save must preserve missing LD');
    assert.deepEqual(saved.original.record,history[0].record);
    await page.reload();await page.locator('[data-field="ld"]').waitFor({state:'visible'});await waitForWorkspaceSave(page);
    await checkOutputs(10);await defaultOrigin();
    await activate(page.locator('[data-operation="empty"]'));await activate(page.locator('[data-step="tap"]'));
    await checkOutputs(10);await defaultOrigin();
    for(const [value,sign,expected] of [['2','+',12],['2','-',8],['-2','+',8],['-2','-',12],['1 1/2','-',8.5],['0','+',10]]){
      await page.locator('[data-field="ld"]').fill(value);await page.locator('[data-field="ldSign"]').selectOption(sign);
      await checkOutputs(expected);
      assert.equal(await page.locator('[data-field="ld"]').inputValue(),value);
      assert.equal(await page.locator('[data-value-origin="ld"]').textContent(),'Entered this session');
    }
    for(const invalid of ['oops','0oops','1/0']){
      await page.locator('[data-field="ld"]').fill(invalid);
      assert.deepEqual(await output(),['-- in','-- in','-- in','-- in','-- in','4.3125 in']);
      assert.equal(await page.locator('[data-warning-code="invalid-ld"]').count(),1);
    }
    await waitForWorkspaceSave(page);await page.reload();await page.locator('[data-field="ld"]').waitFor({state:'visible'});
    assert.equal(await page.locator('[data-field="ld"]').inputValue(),'1/0');
    assert.deepEqual(await output(),['-- in','-- in','-- in','-- in','-- in','4.3125 in'],'Invalid LD must remain invalid after reopen; independent MCO stays calculated');
    await page.locator('[data-field="ld"]').fill('');await defaultOrigin();await checkOutputs(10);
    await activate(page.locator('[data-step="review"]'));
    const review=page.locator('[data-review-stage="tap"]');
    await activate(review.locator('.review-inputs summary'));
    const ld=review.locator('.review-inputs dl > div').filter({has:page.locator('dt', {hasText:'Lost distance (LD)'})});
    assert.match(await ld.innerText(),/Default 0 - not entered/);assert.equal(await ld.locator('dd').textContent(),'0.0000 in');
    assert.equal(await page.locator('#review-checks [data-warning-code="missing-inputs"]').count(),0);
    await activate(review.locator('.review-worksheet summary'));
    const ldTerm=review.locator('.worksheet-result').first().locator('li').nth(1);
    assert.match(await ldTerm.innerText(),/Default 0 - not entered/);assert.equal(await ldTerm.locator('strong').textContent(),'0.0000 in');
    for(const theme of ['light','dark']){
      if(await page.locator('body').evaluate(node=>node.classList.contains('dark'))!==(theme==='dark'))await activate(page.locator('#theme'));
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    }
    await waitForWorkspaceSave(page);await page.reload();await page.locator('[data-review-stage="tap"]').waitFor({state:'visible'});
    snapshot=await readWorkspaceSnapshot(page);saved=snapshot.jobs.find(j=>j.id===snapshot.activeId);
    assert.equal(Object.hasOwn(saved.operations[0].state,'ld'),false);
    assert.equal(saved.operations[1].state.ld,'');assert.equal(saved.operations[2].state.ld,'2');
    assert.deepEqual(saved.operations[0].state.unknownFuture,state.unknownFuture);
    assert.deepEqual(saved.original.record,history[0].record);
    await openDevice('ld-nested');await checkOutputs(10);await defaultOrigin();
    await activate(page.locator('.operations-actions [data-action="add"]'));
    await activate(page.locator('#add-dialog [data-add-type="Hot Tap"]'));
    await activate(page.locator('[data-step="tap"]'));
    await defaultOrigin();
    for(const [key,value]of Object.entries({md:'10',ptc:'1',start:'2'}))await page.locator('[data-field="'+key+'"]').fill(value);
    assert.match((await output())[0],/^12\.0000 in$/,'A fresh blank LD calculates POP without defaulting pipe geometry');
    assert.match((await output())[1],/^13\.0000 in$/);
    assert.equal(await page.locator('[data-field="ld"]').inputValue(),'');
    await page.locator('[data-field="start"]').fill('');assert.equal((await output())[0],'-- in','Rod start must not be defaulted');
    await waitForWorkspaceSave(page);
    assert.equal(await page.evaluate(()=>localStorage.getItem('measurementCardHistoryV1')),old);
    assert.equal(await page.evaluate(()=>localStorage.getItem('measurementCardStateV1')),liveDraft);
    assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
    console.log('PASS blank Hot Tap LD '+engine+'/'+device+': legacy missing/empty hydration, real save/reopen, signed/zero/fraction/invalid entries, clear/new operation, Review/default origins, downstream results and source preservation');
    await context.close();
  }
}catch(error){
  console.error('HOT_TAP_LD_ORIGINAL_FAILURE',JSON.stringify({engine,device,name:error.name,message:error.message,stack:error.stack}));
  try{const path=join(tmpdir(),'pre-alpha-hot-tap-ld-failure-'+engine+'-'+device+'-'+Date.now()+'.png');await page.screenshot({path});console.error('Screenshot: '+path);}catch(diagnosticError){console.error('HOT_TAP_LD_DIAGNOSTIC_FAILURE',diagnosticError.message);}
  throw error;
}finally{await browser?.close();server.kill();}
