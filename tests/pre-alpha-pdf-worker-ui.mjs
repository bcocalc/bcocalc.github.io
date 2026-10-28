import assert from 'node:assert/strict';
import {cancelPendingPdf} from './pre-alpha-reference-migration-ui.mjs';

// Additional real-worker coverage; the original fake-worker/error checks still run.
export async function runPdfWorkerChecks({browser,pw,base,mobile,engine}){
  const context=await browser.newContext({...mobile?pw.devices['iPhone 13']:{viewport:{width:1360,height:1000}},serviceWorkers:'block'});
  const page=await context.newPage(),errors=[],workerErrors=[],workers=[],writes=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(/Setting up fake worker|Worker was terminated/.test(message.text()))workerErrors.push(message.text());});
  page.on('worker',worker=>workers.push(worker.url()));
  await page.route('**/v1/**',route=>{if(route.request().method()!=='GET')writes.push(route.request().method());return route.fulfill({json:{documents:[]}});});
  await page.addInitScript(()=>{if(!localStorage.getItem('measurementCardStateV1'))localStorage.setItem('measurementCardStateV1','{"keep":"pdf-fixture-draft"}');});
  const activate=locator=>mobile?locator.tap():locator.click();
  const category=value=>page.locator('#reference-category').selectOption(value);
  const preview=()=>page.locator('.stackup-card').first().locator('[data-stackup-preview]');
  const holder=()=>page.locator('.stackup-card').first().locator('.stackup-preview');
  async function choose(){await category('stackups');await page.locator('[data-ref-filter="source"]').selectOption('HTP Stackups.pdf');await activate(page.locator('.stackup-card > summary').first());}
  async function ready(){await activate(preview());await holder().locator('canvas').waitFor({state:'visible',timeout:30000});await page.waitForFunction(()=>document.querySelector('.stackup-preview[data-preview-state="ready"]'));assert.ok(await holder().locator('canvas').evaluate(canvas=>canvas.width>200&&canvas.height>200));}
  try{
    const response=await page.goto(base+'/pre-alpha/?fixture=pdf-worker');assert.match(response.headers()['content-security-policy'],/worker-src 'self'/);
    await activate(page.locator('#menu-toggle'));await activate(page.locator('#app-menu [data-page="references"]'));await choose();
    await ready();assert.ok(workers.length>0,'The additive fixture must use a real Web Worker, not fallback');
    await activate(preview());assert.equal(await holder().locator('canvas').count(),0);
    await cancelPendingPdf(page,()=>activate(preview()),()=>activate(preview()),holder());assert.equal(await preview().getAttribute('aria-expanded'),'false');
    await ready();await activate(preview());
    await cancelPendingPdf(page,()=>activate(preview()),()=>category('glossary'),holder());assert.equal(await page.locator('.stackup-preview').count(),0);
    await choose();await ready();await activate(preview());
    assert.ok(workers.every(url=>url===base+'/pre-alpha/vendor/pdf.worker.mjs?v=pre-alpha25'),'Only the isolated versioned pre-alpha worker is used');
    await page.reload();await page.waitForSelector('#menu-toggle');
    assert.equal(await page.evaluate(()=>localStorage.getItem('measurementCardStateV1')),'{"keep":"pdf-fixture-draft"}');
    assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);assert.deepEqual(workerErrors,[]);
    console.log('PASS pre-alpha real PDF worker '+engine+'/'+(mobile?'phone':'desktop')+': cancel during held load, reopen, navigate, completed render cleanup and reload');
  }finally{await context.close();}
}
