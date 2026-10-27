import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {dirname, join} from 'node:path';
import {tmpdir} from 'node:os';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(join(dirname(dirname(process.execPath)), 'node_modules/playwright')); }
const engine = process.env.TAPCALC_BROWSER || 'chromium';
const server = spawn(process.execPath, ['tests/sync-preview.mjs'], {stdio:['ignore','pipe','inherit']});
let browser, page, toolsVisit=0, trial=0;
try {
  const base = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Preview timeout')), 10000);
    server.stdout.on('data', data => {
      const match = String(data).match(/http:\/\/127\.0\.0\.1:\d+/);
      if (match) { clearTimeout(timer); resolve(match[0]); }
    });
  });
  browser = await pw[engine].launch({headless:true, ...(engine === 'chromium' && !process.env.CI ? {channel:'chrome'} : {})});
  // Diagnostic sampling, not retries after a failure: stop on the first error.
  const trials=engine==='webkit'&&process.platform==='linux'?5:1;
  for(trial=1;trial<=trials;trial++){
    console.log('COUPON_FREE_TRIAL',JSON.stringify({engine,platform:process.platform,trial,trials}));
    const context = await browser.newContext({...pw.devices['iPhone 13'], serviceWorkers:'block'});
    page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const openTools = async () => {
      toolsVisit++;
      await page.waitForFunction(() => window.__tapcalcWorkflowBrowseReady);
      await page.locator('.screen-nav [data-screen="calc"]').tap();
      await page.locator('.calc-submode-btn[data-mode="bco"]').tap();
      const collapsed = page.locator('.section.collapsed:has(#bcoPipeMaterial) > .accordion-heading');
      if (await collapsed.count()) await collapsed.tap();
    };
    await page.goto(base + '/dev/measurement-card.html?fixture=success');
    // Let the saved-job startup callbacks settle before selecting a tool panel.
    await page.waitForTimeout(2000);
    await openTools();
    await page.locator('#bcoPipeMaterial').selectOption('CarbonSteel');
    await page.waitForTimeout(350);
    await openTools();
    await page.locator('#bcoPipeOD').selectOption('20.0');
    await page.waitForTimeout(350);
    await openTools();
    await page.locator('#bcoPipeID').fill('19.25');
    await page.waitForTimeout(350);
    await openTools();
    await page.locator('#bcoCutterOD').fill('19');
    await page.locator('#bcoCutterOD').press('Tab');
    const original = await page.evaluate(() => localStorage.getItem('bcoData'));
    await openTools();
    await page.locator('#bcoCutterID').fill('18.5');
    await page.locator('#bcoCutterID').press('Tab');
    await page.waitForTimeout(500);
    assert.match(await page.locator('#couponFreeResult').textContent(), /7\.3395 in/);
    assert.equal(await page.evaluate(() => localStorage.getItem('bcoData')), original);
    assert.equal(await page.evaluate(() => window.tapCalcGetSelectedOperation().state.bcoCutterID), '18.5');
    for (const theme of ['light','dark']) {
      await openTools();
      const collapsedResult = page.locator('.section.collapsed:has(#couponFreeResult) > .accordion-heading');
      if (await collapsedResult.count()) await collapsedResult.tap();
      await page.evaluate(theme => {
        document.documentElement.dataset.theme = theme;
        document.body.classList.toggle('light', theme === 'light');
      }, theme);
      await page.locator('#couponFreeResult').scrollIntoViewIfNeeded();
      assert.ok(await page.locator('#couponFreeResult').isVisible());
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.screenshot({path:join(tmpdir(), 'coupon-free-' + engine + '-' + theme + '.png')});
    }
    await page.reload();
    await page.waitForTimeout(2000);
    await openTools();
    assert.equal(await page.locator('#bcoCutterID').inputValue(), '18.5');
    assert.match(await page.locator('#couponFreeResult').textContent(), /7\.3395 in/);
    await page.locator('#bcoCutterID').fill('20');
    assert.doesNotMatch(await page.locator('#couponFreeResult').textContent(), /7\.3395/);
    await page.locator('#bcoCutterID').fill('');
    assert.match(await page.locator('#couponFreeResult').textContent(), /enter Cutter I.D./);
    // Apply a legacy operation without the optional field: it must not inherit it.
    await page.locator('#bcoCutterID').fill('18.5');
    await page.evaluate(() => {
      const bundle = JSON.parse(JSON.stringify(window.currentJobBundle));
      for (const operation of bundle.operations) delete operation.state.bcoCutterID;
      window.tapCalcApplyJobBundle(bundle);
    });
    await page.waitForTimeout(500);
    assert.equal(await page.locator('#bcoCutterID').inputValue(), '');
    assert.deepEqual(errors, []);
    console.log('PASS coupon-free ' + engine + ': phone themes, BCO isolation, draft reload, invalid input and legacy reset');
    await context.close();
  }
} catch (error) {
  console.error('COUPON_FREE_ORIGINAL_FAILURE',JSON.stringify({engine,trial,toolsVisit,name:error.name,message:error.message,stack:error.stack}));
  try{
    console.error('COUPON_FREE_VISIBILITY_DIAGNOSTIC',JSON.stringify(await page.evaluate(()=>{
      const field=document.getElementById('bcoPipeMaterial'),parents=[];
      for(let node=field;node;node=node.parentElement){const style=getComputedStyle(node),rect=node.getBoundingClientRect();parents.push({tag:node.tagName,id:node.id,class:node.className,hidden:node.hidden,display:style.display,visibility:style.visibility,width:rect.width,height:rect.height});}
      return {screen:document.body.dataset.activeScreen,mode:window.getActiveCalcMode?.(),workflowReady:window.__tapcalcWorkflowBrowseReady,referenceReady:window.__tapcalcReferenceRouterReady,readyState:document.readyState,parents};
    })));
    const path=join(tmpdir(),'pre-alpha-release-dev-coupon-free-failure-'+engine+'-'+Date.now()+'.png');await page.screenshot({path});console.error('Screenshot: '+path);
  }catch(diagnosticError){console.error('COUPON_FREE_DIAGNOSTIC_FAILURE',JSON.stringify({name:diagnosticError.name,message:diagnosticError.message}));}
  throw error;
} finally { await browser?.close(); server.kill(); }
