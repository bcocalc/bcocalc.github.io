import {readWorkspaceSnapshot,waitForWorkspaceSave} from './pre-alpha-workspace-test-helpers.mjs';
import assert from 'node:assert/strict';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {normalizeJob,geometry,STORAGE_KEY} from '../pre-alpha/model.mjs';
import {formatEta} from '../pre-alpha/eta.mjs';
import {REFERENCE_CATEGORIES} from '../pre-alpha/references.mjs';
import {runReferenceMigrationChecks} from './pre-alpha-reference-migration-ui.mjs';
import {runReferenceSelectorChecks,installReferenceFocusTrace} from './pre-alpha-reference-selectors-ui.mjs';

export async function runNextChecks({browser,pw,base,mobile,engine}) {
  const state={bcoPipeMaterial:'CarbonSteel',bcoPipeOD:'6.0',bcoPipeID:'6',bcoCutterOD:'4',md:'10',ld:'0',ptc:'1',start:'0',mt:'52',lsMd:'10',lsLd:'0',lsPod:'8',lsTravel:'20',lsMachineTravel:'19',cpStart:'20',cpJbf:'1.25',cpLd:'0.5',cpPt:'2.75',cpLiManual:'99',cpLiManualToggle:false,etaBco:'99'};
  const record={jobBundle:{selectedOperationId:'first',sharedState:{jobDescription:'Next pass fixture',machineType:'Legacy unlisted machine'},operations:[{id:'first',operationType:'Line Stop',label:'First stop',state},{id:'second',operationType:'Line Stop',label:'Second stop',state:{...state,lsPod:'invalid'}}]}};
  const job=normalizeJob({id:'next-pass',source:'experimental',record});
  job.operations[0].workspaceStage='stop';job.operations[1].workspaceStage='tap';
  const original=JSON.stringify(job.original);
  const context=await browser.newContext({...mobile?pw.devices['iPhone 13']:{viewport:{width:1360,height:1000}},serviceWorkers:'block'});
  const page=await context.newPage(),errors=[],writes=[];
  await page.addInitScript(installReferenceFocusTrace);
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/v1/**',route=>{if(route.request().method()!=='GET')writes.push(route.request().method());return route.fulfill({json:{documents:[]}});});
  await page.addInitScript(({job,key})=>{
    if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({build:'pre-alpha05',activeId:job.id,jobs:[job]}));
    localStorage.setItem('measurementCardHistoryV1','[]');localStorage.setItem('measurementCardStateV1','{"keep":"live"}');
  },{job,key:STORAGE_KEY});
  const activate=locator=>mobile?locator.tap():locator.click();
  const step=key=>activate(page.locator('#steps [data-step="'+key+'"]'));
  const snapshot=async()=>(await readWorkspaceSnapshot(page)).jobs[0];
  try{
    await page.goto(base+'/pre-alpha/#workspace');await page.waitForSelector('#job-title');
    assert.equal(await page.locator('#step-title').textContent(),'Line stop');
    assert.equal(await page.locator('[data-field="lsPod"]').count(),0);
    assert.match(await page.locator('.big-value').textContent(),/16.3125/);
    assert.match(await page.locator('[data-warning-code="pipe-source-change"]').textContent(),/17.6875.*16.3125/);
    const migrated=await snapshot();
    assert.equal(migrated.operations[0].retiredLineStopOD.value,'8');
    assert.equal(migrated.operations[1].retiredLineStopOD.value,'invalid');
    assert.ok(migrated.operations.every(op=>!Object.hasOwn(op.state,'lsPod')));
    assert.equal(JSON.stringify(migrated.original),original);
    await step('pipe');await page.locator('[data-field="preAlphaPipeOD"]').fill('7');
    await step('stop');assert.match(await page.locator('.big-value').textContent(),/16.5000/);
    assert.match(await page.locator('[data-warning-code="pipe-source-change"]').textContent(),/7.0000/);
    await step('tap');
    const md=page.locator('#fields abbr[data-help-term="MD"]');
    if(mobile)await md.tap();else await md.hover();
    assert.ok(await page.locator('#term-tooltip').isVisible());
    assert.match(await page.locator('#term-tooltip').textContent(),/Measured distance.*Hot Tap/s);
    await page.keyboard.press('Escape');assert.equal(await page.locator('#term-tooltip').isVisible(),false);
    await page.locator('[data-field="ld"]').focus();await md.focus();assert.equal(await md.getAttribute('aria-describedby'),'term-tooltip');
    // Let any stale 120ms focus-out callback fire: refocused help must stay open.
    await page.waitForTimeout(220);assert.equal(await md.getAttribute('aria-describedby'),'term-tooltip');assert.ok(await page.locator('#term-tooltip').isVisible());
    await page.keyboard.press('Escape');
    await activate(page.locator('[data-help-field="ptc"]'));assert.match(await page.locator('#term-tooltip').textContent(),/pilot-to-cutter/i);
    await page.screenshot({path:join(tmpdir(),'pre-alpha-help-'+engine+(mobile?'-phone':'-desktop')+'.png')});
    await page.keyboard.press('Escape');assert.equal(await page.locator('[data-field="md"]').inputValue(),'10');
    for(const term of ['MD','LD','PTC'])assert.ok(await page.locator('#fields abbr[data-help-term="'+term+'"]').count()>0);
    await activate(page.locator('[data-open-eta]').first());
    assert.match(await page.locator('#eta-results').textContent(),/No RPM chart/);
    await page.locator('[data-eta-field="etaMachine"]').selectOption('360');
    const bco=geometry({...state,preAlphaPipeOD:'7'}).bco;
    assert.match(await page.locator('#eta-results').textContent(),/35 \/ 45/);
    assert.ok((await page.locator('#eta-results').textContent()).includes(formatEta(bco/(45*.004))));
    assert.match(await page.locator('#eta-results').textContent(),/Saved ETA distance 99.*retained but not used/);
    await page.locator('[data-eta-field="etaRpmOverride"]').fill('40');
    assert.ok((await page.locator('#eta-results').textContent()).includes(formatEta(bco/(40*.004))));
    for(const dark of [false,true]){
      if(await page.locator('body').evaluate(el=>el.classList.contains('dark'))!==dark){await activate(page.locator('[data-close="eta-dialog"]'));await activate(page.locator('#theme'));await activate(page.locator('[data-open-eta]').first());}
      assert.ok(await page.locator('#eta-dialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
      await page.screenshot({path:join(tmpdir(),'pre-alpha-eta-'+engine+(mobile?'-phone':'-desktop')+(dark?'-dark':'-light')+'.png')});
    }
    await page.locator('[data-eta-field="etaRpmOverride"]').fill('bad');
    assert.match(await page.locator('#eta-results .warning').textContent(),/Manual RPM must be/);
    await activate(page.locator('[data-close="eta-dialog"]'));
    assert.equal(await page.locator('#step-title').textContent(),'Hot tap');
    await step('review');assert.ok(await page.locator('[data-warning-code="eta-input"]').isVisible());
    assert.match(await page.locator('.review-notes').textContent(),/Saved ETA distance 99 is retained but not used/);
    await activate(page.locator('#review-checks [data-open-eta]'));
    await page.locator('[data-eta-field="etaRpmOverride"]').fill('');await activate(page.locator('[data-close="eta-dialog"]'));
    await page.waitForSelector('[data-warning-code="eta-input"]',{state:'detached'});
    assert.equal(await page.locator('[data-warning-code="eta-input"]').count(),0);
    assert.match(await page.locator('[data-review-stage="stop"] .review-results').textContent(),/16.5000/);
    await step('stop');
    const beforeReferences=await snapshot();
    await activate(page.locator('#menu-toggle'));assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'true');
    await page.keyboard.press('Escape');assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'false');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'menu-toggle');
    await activate(page.locator('#menu-toggle'));await activate(page.locator('#app-menu [data-page="references"]'));
    assert.ok(await page.locator('#references').isVisible());
    for(const category of Object.keys(REFERENCE_CATEGORIES)){
      await page.locator('#reference-category').selectOption(category);
      assert.ok((await page.locator('#reference-content').innerText()).length>50,category);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),category+' does not widen the page');
      assert.equal(await page.locator('iframe').count(),0);
    }
    await page.locator('#reference-category').selectOption('smartstop');
    await page.locator('[data-ref-filter="size"]').selectOption('6');await page.locator('[data-ref-filter="wall"]').fill('.235');
    assert.equal(await page.locator('.reference-section').first().locator('tbody tr').count(),2,'Keep overlapping source ranges');
    await page.locator('[data-ref-filter="wall"]').fill('bad');assert.ok(await page.locator('#reference-content .warning').isVisible());
    await page.locator('#reference-category').selectOption('cutters');await page.locator('[data-ref-filter="kind"]').selectOption('lineStop');await page.locator('[data-ref-filter="pipe"]').selectOption('42');
    assert.equal(await page.locator('#reference-content tbody tr').count(),0,'No fabricated 42-inch Line Stop cutter');
    await page.locator('#reference-category').selectOption('glossary');await page.locator('#reference-query').fill('nothing-matches');assert.equal(await page.locator('#reference-content tbody tr').count(),0);
    await page.locator('#reference-category').selectOption('htp');assert.equal(await page.locator('#reference-content tbody tr').count(),0,'Size-first sections do not show a full table');await page.locator('[data-ref-filter="size"]').selectOption('3');assert.equal(await page.locator('#reference-content tbody tr').count(),1,'An explicit size shows its source row');
    const sourceBco=page.locator('#reference-content th abbr[data-help-term="BCO"]');
    await sourceBco.focus();assert.match(await page.locator('#term-tooltip').textContent(),/not verified.*Do not substitute/s);
    await page.keyboard.press('Escape');
    await runReferenceMigrationChecks(page,activate);
    await runReferenceSelectorChecks(page,activate);
    for(const dark of [false,true]){
      if(await page.locator('body').evaluate(el=>el.classList.contains('dark'))!==dark)await activate(page.locator('#theme'));
      if(mobile)await page.setViewportSize({width:320,height:700});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      await page.screenshot({path:join(tmpdir(),'pre-alpha-next-'+engine+(mobile?'-phone':'-desktop')+(dark?'-dark':'-light')+'.png'),fullPage:true});
    }
    if(mobile)await page.setViewportSize({width:390,height:664});
    await page.goBack();assert.ok(await page.locator('#workspace').isVisible());assert.equal(await page.locator('#step-title').textContent(),'Line stop');
    const afterReferences=await snapshot();assert.deepEqual(afterReferences.operations,beforeReferences.operations,'References and help do not rewrite job measurements or step position');
    assert.equal(afterReferences.sharedState.machineType,'Legacy unlisted machine','ETA profile does not rename the job machine');
    await activate(page.locator('#menu-toggle'));await activate(page.locator('#app-menu [data-page="settings"]'));
    await page.locator('#settings-theme').selectOption('dark');assert.ok(await page.locator('body').evaluate(el=>el.classList.contains('dark')));
    await activate(page.locator('#settings [data-page="workspace"]'));assert.equal(await page.locator('#step-title').textContent(),'Line stop');
    await waitForWorkspaceSave(page);await page.reload();await page.waitForSelector('#job-title');assert.equal(await page.locator('#step-title').textContent(),'Line stop');
    assert.equal((await snapshot()).operations[0].retiredLineStopOD.previousAutomaticLI,17.6875);
    assert.equal(JSON.stringify((await snapshot()).original),original);
    assert.equal(await page.evaluate(()=>localStorage.getItem('measurementCardHistoryV1')),'[]');
    assert.equal(await page.evaluate(()=>localStorage.getItem('measurementCardStateV1')),'{"keep":"live"}');
    assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
    console.log('PASS Pre-Alpha next '+engine+'/'+(mobile?'phone':'desktop')+': single O.D. migration, menu/back, accessible help, read-only References, ETA and independent storage');
  }finally{await context.close();}
}
