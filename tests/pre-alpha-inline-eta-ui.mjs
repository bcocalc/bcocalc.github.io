import assert from 'node:assert/strict';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {BUILD,normalizeJob,STORAGE_KEY} from '../pre-alpha/model.mjs';
import {etaFor,formatEta} from '../pre-alpha/eta.mjs';

// Disposable contexts and fake reads only: never use production or personal jobs.
export async function runInlineEtaChecks({browser,pw,base,mobile,engine}) {
  const state={bcoPipeMaterial:'CarbonSteel',bcoPipeOD:'6.0',bcoPipeID:'6',bcoCutterOD:'4',bcoCutterID:'3.5',md:'10',ld:'0',ptc:'1',start:'2',mt:'52',lsMd:'10',lsLd:'0',cpStart:'20',cpJbf:'1',cpLd:'0',cpPt:'2'};
  const job=normalizeJob({id:'inline-eta-fixture',source:'experimental',record:{jobBundle:{selectedOperationId:'first',sharedState:{jobDescription:'Inline ETA fixture',machineType:'360 / 152'},operations:[
    {id:'first',label:'First stop',operationType:'Line Stop',workspaceStage:'pipe',state},
    {id:'second',label:'Saved lookup',operationType:'Hot Tap',workspaceStage:'pipe',state:{...state,bcoCutterOD:'3',etaMachine:'1200',etaCutterSize:'15',etaBco:'99'}},
    {id:'unsupported',label:'Unsupported equipment',operationType:'Re Stop',workspaceStage:'saved',state:{...state}},
    {id:'plug-only',label:'Plug only',operationType:'Completion Plug',workspaceStage:'pipe',state:{...state}}
  ]}}});
  const original=JSON.stringify(job.original);
  const context=await browser.newContext({...mobile?pw.devices['iPhone 13']:{viewport:{width:1360,height:1000}},serviceWorkers:'block'});
  const page=await context.newPage(),errors=[],writes=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/v1/**',route=>{if(route.request().method()!=='GET')writes.push(route.request().method());return route.fulfill({json:{documents:[]}});});
  await page.addInitScript(({job,key,build})=>{
    if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({build,activeId:job.id,jobs:[job]}));
    // Do not reset sentinels on reload: that would conceal an unwanted app write.
    if(!localStorage.getItem('measurementCardHistoryV1'))localStorage.setItem('measurementCardHistoryV1','[{"id":"keep-history"}]');
    if(!localStorage.getItem('measurementCardStateV1'))localStorage.setItem('measurementCardStateV1','{"keep":"live-draft"}');
  },{job,key:STORAGE_KEY,build:BUILD});
  const activate=locator=>mobile?locator.tap():locator.click();
  const step=key=>activate(page.locator('#steps [data-step="'+key+'"]'));
  const selectOperation=id=>activate(page.locator('#operations [data-operation="'+id+'"]'));
  const snapshot=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)).jobs[0],STORAGE_KEY);
  const summary=()=>page.locator('#results .bco-eta-summary');
  const metric=key=>summary().locator('[data-eta-value="'+key+'"]');
  const openEta=()=>activate(summary().locator('[data-eta-settings]'));
  async function closeEta(escape=false) {
    if(escape){
      // Contextual term help owns Escape while it is open; close only the dialog here.
      await page.locator('[data-eta-field="etaRpmOverride"]').focus();
      await page.waitForFunction(()=>document.getElementById('term-tooltip')?.hidden!==false);
      await page.keyboard.press('Escape');
    }else await activate(page.locator('[data-close="eta-dialog"]'));
    await page.waitForFunction(()=>!document.getElementById('eta-dialog').open);
    await page.waitForFunction(()=>document.activeElement?.matches('#results [data-eta-settings]'));
  }
  async function assertSummary() {
    const saved=await snapshot(),op=saved.operations.find(item=>item.id===saved.selectedOperationId),eta=etaFor(op,saved.sharedState.machineType);
    assert.equal(await summary().count(),1,'One automatic BCO / RPM / ETA group for this operation');
    assert.ok(await summary().isVisible());
    assert.equal((await metric('chart-rpm').textContent()).trim(),eta.match.values.join(' / ')||'Not available');
    assert.equal((await metric('used-rpm').textContent()).trim(),eta.rpm.map(value=>Number.isFinite(value)?String(value):'invalid').join(' / ')||'Not available');
    const expected=eta.issue?'Not calculated':formatEta(eta.lowMinutes)+(eta.lowMinutes===eta.highMinutes?'':' to '+formatEta(eta.highMinutes));
    assert.equal((await metric('time').textContent()).trim(),expected);
    assert.ok((await metric('bco').textContent()).includes(Number.isFinite(eta.distance)?eta.distance.toFixed(4):'Not calculated'));
    assert.match(await summary().locator('.eta-assumptions').textContent(),/Machine:.*RPM chart profile:.*Feed assumption:.*0\.0040 in\/revolution/s);
    assert.match(await summary().locator('.eta-scope').textContent(),/cutter-shell BCO only.*not Rod BCO or total travel.*Not complete Hot Tap, Line Stop, Completion Plug, or job duration/s);
    return {saved,op,eta};
  }
  try {
    await page.goto(base+'/pre-alpha/');await page.waitForSelector('#results .bco-eta-summary');
    assert.equal(await page.locator('#eta-dialog').evaluate(el=>el.open),false,'No extra click to see RPM / ETA');
    await assertSummary();assert.match(await summary().locator('[data-eta-basis]').textContent(),/Exact chart size.*follows cutter O\.D\./);
    const originalTime=await metric('time').textContent();
    await page.locator('[data-field="bcoCutterOD"]').fill('3');await assertSummary();assert.notEqual(await metric('time').textContent(),originalTime);
    for(const invalid of ['bad','']){
      await page.locator('[data-field="bcoCutterOD"]').fill(invalid);await assertSummary();
      assert.equal((await metric('time').textContent()).trim(),'Not calculated');
      assert.match(await summary().textContent(),/Enter a valid cutter size/);
    }
    await page.locator('[data-field="bcoCutterOD"]').fill('4');
    await page.locator('[data-field="bcoPipeID"]').fill('bad');await assertSummary();assert.match(await summary().textContent(),/Valid pipe and cutter dimensions/);
    await page.locator('[data-field="bcoPipeID"]').fill('');await assertSummary();assert.equal((await metric('time').textContent()).trim(),'Not calculated');
    await page.locator('[data-field="bcoPipeID"]').fill('6');
    await page.locator('[data-field="preAlphaPipeOD"]').fill('7');await assertSummary();assert.notEqual(await metric('time').textContent(),originalTime);

    await step('setup');await page.locator('[data-field="machineType"]').selectOption('660 / 760');await step('pipe');
    assert.equal((await assertSummary()).eta.profile,'660','Unconfigured profile follows job machine');
    await activate(page.locator('[data-action="details"]'));await page.locator('[data-detail="machineType"]').selectOption('1200-M120');await activate(page.locator('#details-form [type="submit"]'));
    assert.equal((await assertSummary()).eta.profile,'1200','Job details changes refresh the inline estimate');
    await openEta();await page.locator('[data-eta-field="etaMachine"]').selectOption('360');await assertSummary();await closeEta(true);
    await step('setup');await page.locator('[data-field="machineType"]').selectOption('660 / 760');await step('pipe');
    assert.equal((await assertSummary()).eta.profile,'360','Explicit chart profile is not overwritten by job machine');
    assert.match(await summary().locator('.eta-assumptions').textContent(),/Machine: 660 \/ 760.*RPM chart profile: 360 \/ 152/s);

    await openEta();await page.locator('[data-eta-field="etaCutterSize"]').fill('42');await assertSummary();await closeEta();
    assert.match(await summary().locator('[data-eta-basis]').textContent(),/Outside chart range: nearest chart size.*saved lookup override/);
    assert.match(await summary().locator('.warning').textContent(),/nearest charted cutter size/);
    await openEta();await page.locator('[data-eta-field="etaCutterSize"]').fill('');await page.locator('[data-eta-field="etaRpmOverride"]').fill('40');await assertSummary();await closeEta();
    assert.equal((await metric('used-rpm').textContent()).trim(),'40');assert.equal((await metric('chart-rpm').textContent()).trim(),'35 / 45');
    assert.match(await summary().locator('.eta-assumptions').textContent(),/manual override; chart above is reference only/);
    await openEta();await page.locator('[data-eta-field="etaRpmOverride"]').fill('bad');await assertSummary();await closeEta();
    assert.match(await summary().textContent(),/Manual RPM must be a valid number greater than zero/);
    await openEta();await page.locator('[data-eta-field="etaRpmOverride"]').fill('');await page.locator('[data-eta-field="etaMachine"]').selectOption('');await assertSummary();await closeEta();
    assert.equal((await metric('chart-rpm').textContent()).trim(),'Not available');assert.match(await summary().textContent(),/No RPM chart is selected/);
    await openEta();await page.locator('[data-eta-field="etaMachine"]').selectOption('360');await closeEta(true);await assertSummary();

    for(const stage of ['tap','stop','plug']){await step(stage);await assertSummary();assert.equal(await page.locator('#results .big-value').count(),1,'Do not duplicate the primary stage result');}
    await step('review');await assertSummary();assert.equal(await page.locator('[data-review-stage="pipe"] .bco-eta-summary').count(),1,'Review keeps ETA beside BCO');
    await selectOperation('second');await assertSummary();assert.match(await summary().locator('[data-eta-basis]').textContent(),/Interpolated between chart sizes 14 and 16.*15 in \(saved lookup override\)/);
    assert.match(await summary().textContent(),/Saved ETA distance 99 is retained but not used/);
    const secondTime=await metric('time').textContent();await page.locator('[data-field="bcoCutterOD"]').fill('4');await assertSummary();
    assert.equal((await metric('chart-rpm').textContent()).trim(),'22 / 23 / 24');assert.notEqual(await metric('time').textContent(),secondTime,'Lookup override does not freeze current BCO distance');
    await page.reload();await page.waitForSelector('#results .bco-eta-summary');await assertSummary();
    assert.equal(await page.locator('#operations [aria-current]').getAttribute('data-operation'),'second');assert.equal(await page.locator('#step-title').textContent(),'Pipe & cutter');

    for(const dark of [false,true]){
      if(await page.locator('body').evaluate(el=>el.classList.contains('dark'))!==dark)await activate(page.locator('#theme'));
      for(const width of mobile?[320,390]:[1360]){
        await page.setViewportSize({width,height:mobile?740:1000});
        const layout=await page.evaluate(()=>({viewport:innerWidth,pageWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,
          overflow:[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&(r.right>innerWidth+1||el.scrollWidth>el.clientWidth+1)&&getComputedStyle(el).position!=='fixed';}).map(el=>({tag:el.tagName,id:el.id,class:el.className,text:el.textContent.trim().slice(0,100),left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,width:el.clientWidth,scrollWidth:el.scrollWidth,display:getComputedStyle(el).display,overflow:getComputedStyle(el).overflowX})).slice(0,40)}));
        if(layout.pageWidth>layout.viewport+1)layout.afterTwoFrames=await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve({viewport:innerWidth,pageWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth})))));
        assert.ok(layout.pageWidth<=layout.viewport+1,'No page overflow at '+width+'px: '+JSON.stringify(layout));
        assert.ok(await summary().evaluate(el=>el.scrollWidth<=el.clientWidth+1),'Summary fits at '+width+'px');
        assert.ok(await page.locator('#fields .field > select').evaluateAll(controls=>controls.every(el=>el.getBoundingClientRect().width<=el.parentElement.clientWidth+1)),'Native selects fit their field grid track at '+width+'px');
        assert.ok(await metric('time').isVisible());
      }
      await summary().screenshot({path:join(tmpdir(),'pre-alpha-inline-eta-'+engine+(mobile?'-phone':'-desktop')+(dark?'-dark':'-light')+'.png'),animations:'disabled'});
    }
    await selectOperation('unsupported');assert.equal(await summary().count(),0);assert.equal(await page.locator('#results [data-open-eta]').count(),0);
    await selectOperation('plug-only');assert.equal(await summary().count(),0,'Completion Plug-only jobs do not gain Hot Tap ETA');
    await selectOperation('first');assert.equal(await page.locator('#step-title').textContent(),'Review');await assertSummary();
    const saved=await snapshot();assert.equal(JSON.stringify(saved.original),original);assert.equal(saved.operations[1].state.etaCutterSize,'15');
    assert.equal(saved.sharedState.machineType,'660 / 760','ETA settings never rename job machine');
    assert.equal(await page.evaluate(()=>localStorage.getItem('measurementCardHistoryV1')),'[{"id":"keep-history"}]');
    assert.equal(await page.evaluate(()=>localStorage.getItem('measurementCardStateV1')),'{"keep":"live-draft"}');
    assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
    console.log('PASS Pre-Alpha inline ETA '+engine+'/'+(mobile?'phone':'desktop')+': automatic BCO/RPM/time, live edits, sources/overrides, invalid states, focus, themes, reload and isolated operations');
  }finally{await context.close();}
}
