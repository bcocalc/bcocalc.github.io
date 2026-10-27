// Deterministically exercise a late startup callback; no external traffic or timing sleeps.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); }
catch { pw = require(join(dirname(dirname(process.execPath)), 'node_modules/playwright')); }
const engine = process.env.TAPCALC_BROWSER || 'webkit';
const server = spawn(process.execPath, [fileURLToPath(new URL('./sync-preview.mjs', import.meta.url))], {
  stdio: ['ignore', 'pipe', 'inherit']
});
let browser, page, device;
try {
  const base = await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error('Preview timeout')), 10000);
    server.stdout.on('data', data => {
      output += data;
      const match = output.match(/http:\/\/127\.0\.0\.1:\d+/);
      if (match) { clearTimeout(timer); resolve(match[0]); }
    });
    server.once('error', error => { clearTimeout(timer); reject(error); });
    server.once('exit', code => { clearTimeout(timer); reject(new Error('Preview exited: ' + code)); });
  });
  browser = await pw[engine].launch({
    headless: true,
    ...(engine === 'chromium' && !process.env.CI ? { channel: 'chrome' } : {})
  });
  for (const mobile of [true, false]) {
    device = mobile ? 'phone' : 'desktop';
    const context = await browser.newContext({ ...(mobile ? pw.devices['iPhone 13'] : {viewport:{width:1280,height:900}}), serviceWorkers: 'block' });
    await context.addInitScript(() => {
      const nativeTimeout = window.setTimeout.bind(window);
      const pending = [];
      window.__toolsStartupCallbacks = pending;
      window.setTimeout = function(callback, delay, ...args) {
        const source = typeof callback === 'function' ? String(callback).replace(/\s+/g, '') : '';
        if (source === '()=>setWorkflowStage(activeStage())' && (delay === 120 || delay === 160)) {
          pending.push({ callback: () => callback(...args), delay, stack: new Error('startup callback scheduled').stack });
          return nativeTimeout(() => {}, 0);
        }
        return nativeTimeout(callback, delay, ...args);
      };
      window.__releaseToolsStartupCallbacks = () => {
        const records = pending.splice(0);
        for (const record of records) record.callback();
        return records.map(({ delay, stack }) => ({ delay, stack }));
      };
    });
    page = await context.newPage();
    const activate = locator => mobile ? locator.tap() : locator.click();
    page.setDefaultTimeout(12000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/dev/measurement-card.html?fixture=success');
    await page.waitForFunction(() => window.__tapcalcWorkflowBrowseReady && window.__tapcalcReferenceRouterReady);
    await page.evaluate(() => {
      window.tapCalcSetWorkflowStage('hotTap', { guard: false, skipScroll: true });
    });
    await page.reload();
    await page.waitForFunction(() =>
      window.__tapcalcWorkflowBrowseReady && window.__tapcalcReferenceRouterReady &&
      window.__toolsStartupCallbacks.length >= 2
    );
    await activate(page.locator('.screen-nav [data-screen="calc"]'));
    await activate(page.locator('.calc-submode-btn[data-mode="bco"]'));
    const before = await page.locator('#bcoPanel').evaluate(node => ({
      active: node.classList.contains('active'), display: getComputedStyle(node).display,
      screen: document.body.dataset.activeScreen, mode: window.getActiveCalcMode()
    }));
    assert.equal(before.screen, 'calc');
    assert.equal(before.mode, 'bco');
    assert.equal(before.active, true, 'Selecting BCO must initially activate its panel');
    assert.notEqual(before.display, 'none');
    const released = await page.evaluate(() => window.__releaseToolsStartupCallbacks());
    const after = await page.locator('#bcoPanel').evaluate(node => ({
      active: node.classList.contains('active'), display: getComputedStyle(node).display,
      screen: document.body.dataset.activeScreen, mode: window.getActiveCalcMode(),
      workflowStage: window.__tapCalcWorkflowStage
    }));
    console.log('TOOLS_STARTUP_OWNERSHIP', JSON.stringify({ engine, device, before, released, after }));
    assert.equal(after.screen, 'calc', 'A background workflow refresh must not switch screens');
    assert.equal(after.mode, 'bco');
    assert.equal(after.active, true, 'A late workflow-stage startup callback must not deactivate selected BCO');
    assert.notEqual(after.display, 'none', 'Selected BCO must remain displayed after startup work');
    await activate(page.locator('.calc-submode-btn[data-mode="eta"]'));
    assert.ok(await page.locator('#etaPanel').isVisible());
    await page.evaluate(() => window.tapCalcSetWorkflowStage('hotTap', {guard:false,skipScroll:true}));
    assert.ok(await page.locator('#etaPanel').isVisible(), 'Background workflow refresh must also retain ETA');
    assert.equal(await page.locator('#bcoPanel').evaluate(node=>node.classList.contains('active')), false);
    await activate(page.locator('.calc-submode-btn[data-mode="bco"]'));
    assert.equal(await page.locator('#hotTapPanel').evaluate(node=>node.classList.contains('active')), true, 'Calculator switching must retain workflow panel state');
    await activate(page.locator('.screen-nav [data-screen="card"]'));
    await activate(page.locator('#workflowStageNav [data-workflow-stage="hotTap"]'));
    assert.ok(await page.locator('#hotTapPanel').isVisible());
    assert.ok(await page.locator('#bcoPanel').isHidden(), 'Retained calculator state must not bleed into Workflow');
    assert.equal(await page.locator('.screen-view.active:not([hidden])').count(), 1);
    await activate(page.locator('.screen-nav [data-screen="calc"]'));
    await page.locator('#bcoPanel').waitFor({state:'visible'});
    assert.ok(await page.locator('#bcoPanel').isVisible());
    assert.ok(await page.locator('#hotTapPanel').isHidden(), 'Retained workflow state must not bleed into Tools');
    assert.equal(await page.locator('.screen-view.active:not([hidden])').count(), 1);
    assert.deepEqual(errors, []);
    console.log('PASS Tools reload ownership '+engine+'/'+device+': late startup preserves BCO/ETA; calculator/workflow states stay independent with one visible screen');
    await context.close();
  }
} catch (error) {
  console.error('TOOLS_MODE_ORIGINAL_FAILURE', JSON.stringify({engine,device,name:error.name,message:error.message,stack:error.stack}));
  try {
    console.error('TOOLS_MODE_FAILURE_STATE', JSON.stringify(await page.evaluate(()=>({screen:document.body.dataset.activeScreen,calc:window.getActiveCalcMode?.(),workflow:window.getActiveWorkflowMode?.(),panels:['bcoPanel','etaPanel','hotTapPanel'].map(id=>{const node=document.getElementById(id);return {id,class:node.className,display:getComputedStyle(node).display};})}))));
    const path=join(tmpdir(),'pre-alpha-dev-mode-failure-'+engine+'-'+device+'-'+Date.now()+'.png');
    await page.screenshot({path});console.error('Screenshot: '+path);
  } catch (diagnosticError) {console.error('TOOLS_MODE_DIAGNOSTIC_FAILURE', diagnosticError.message);}
  throw error;
} finally {
  await browser?.close();
  server.kill();
}
