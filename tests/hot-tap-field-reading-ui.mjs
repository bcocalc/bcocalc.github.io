// All data and writes stay inside the CSP-isolated localhost fixture.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(join(dirname(dirname(process.execPath)), 'node_modules/playwright')); }
const engine = process.env.TAPCALC_BROWSER || 'chromium';
const server = spawn(process.execPath, ['tests/sync-preview.mjs'], { stdio: ['ignore', 'pipe', 'inherit'] });
let browser;
try {
  const base = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Preview startup timeout')), 10000);
    server.stdout.on('data', chunk => { const match = String(chunk).match(/http:\/\/127\.0\.0\.1:\d+/); if (match) { clearTimeout(timer); resolve(match[0]); } });
    server.once('error', reject);
  });
  browser = await pw[engine].launch({ headless: true, ...(engine === 'chromium' && !process.env.CI ? { channel: 'chrome' } : {}) });
  for (const phone of [true, false]) {
    const context = await browser.newContext({ ...(phone ? pw.devices['iPhone 13'] : { viewport: { width: 1280, height: 900 } }), serviceWorkers: 'block' });
    const page = await context.newPage();
    await page.addInitScript(() => {
      if (!localStorage.getItem('measurementCardStateV1')) {
        sessionStorage.setItem('bcoCalculated', 'true');
        localStorage.setItem('bcoData', JSON.stringify({ pipeOD: 16, pipeID: 15.5, cutterOD: 15, bco: 3 }));
      }
      window.applyFieldFixture = state => {
        window.tapCalcApplyJobBundle({ version: 3, selectedOperationId: 'field-fixture', sharedState: {}, operations: [{ id: 'field-fixture', label: 'Field fixture', operationType: 'Hot Tap', state: { activeMode: 'hotTap', bcoPipeMaterial: 'CarbonSteel', bcoPipeOD: '16.0', bcoPipeID: '15.5', bcoCutterOD: '15', ...state } }] });
        document.getElementById('bcoCutterOD').dispatchEvent(new Event('input', { bubbles: true }));
        document.getElementById('md').dispatchEvent(new Event('input', { bubbles: true }));
      };
    });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const activate = selector => phone ? page.locator(selector).tap() : page.locator(selector).click();
    const value = id => page.locator('#' + id).textContent().then(Number);
    await page.goto(base + '/dev/measurement-card.html?fixture=success');
    await page.waitForTimeout(1800);
    await activate('.screen-nav [data-screen="card"]');
    await page.evaluate(() => {
      applyFieldFixture({ md: '10', ld: '2', ldSign: '+', ptc: '1', pod: '16', start: '5', mt: '30', htActualPop: '', htFieldBasis: '' });
      tapCalcSetWorkflowStage('hotTap', { userInitiated: true, guard: false, skipScroll: true });
    });
    await page.waitForTimeout(1000);
    const collapsed = page.locator('.section.collapsed:has(#htActualPop) > .accordion-heading');
    if (await collapsed.count()) await (phone ? collapsed.tap() : collapsed.click());
    if (await value('pop') !== 17) console.error('Fixture state', errors, await page.evaluate(() => ({ fields: ['md','ld','ptc','start','htActualPop'].map(id => [id, document.getElementById(id)?.value]), status: document.getElementById('htFieldStatus')?.textContent, bco: localStorage.getItem('bcoData'), pop: document.getElementById('pop')?.textContent })));
    assert.equal(await value('pop'), 17);
    await page.locator('#htActualPop').fill('18.5');
    assert.equal(await value('pop'), 17, 'Preview must not apply itself');
    assert.equal(await page.locator('#htFieldPreview').isVisible(), true);
    await activate('#htFieldApply');
    await page.waitForTimeout(300);
    assert.equal(await value('pop'), 18.5);
    assert.equal(await value('cop'), 19.5);
    const bco = await page.evaluate(() => JSON.parse(localStorage.getItem('bcoData')).bco);
    assert.ok(Math.abs(await value('ttd') - (14.5 + bco)) < 0.0001);
    for (const [id, expected] of [['md', '10'], ['ld', '2'], ['start', '5']]) assert.equal(await page.locator('#' + id).inputValue(), expected);
    const saved = await page.evaluate(() => tapCalcBuildPersistedJobBundlePayload());
    const selected = saved.operations.find(item => item.id === saved.selectedOperationId);
    assert.equal(selected.state.htActualPop, '18.5');
    assert.ok(selected.state.htFieldBasis);
    await page.reload();
    await page.waitForTimeout(1800);
    await activate('.screen-nav [data-screen="card"]');
    await activate('#workflowStageNav [data-workflow-stage="hotTap"]');
    await page.waitForTimeout(700);
    const restoredCollapsed = page.locator('.section.collapsed:has(#htActualPop) > .accordion-heading');
    if (await restoredCollapsed.count()) await (phone ? restoredCollapsed.tap() : restoredCollapsed.click());
    assert.equal(await value('pop'), 18.5, 'Confirmed adjustment survives a reload');
    await activate('#htFieldUndo');
    assert.equal(await value('pop'), 17);
    assert.equal(await page.locator('#htActualPop').inputValue(), '18.5');
    await page.evaluate(state => applyFieldFixture(state), selected.state);
    assert.equal(await value('pop'), 18.5, 'Restoring the same operation retains confirmed adjustment');
    await page.evaluate(saved => {
      const copy = JSON.parse(JSON.stringify(saved));
      copy.operations[0].id = 'different-application';
      copy.selectedOperationId = 'different-application';
      tapCalcApplyJobBundle(copy);
      document.getElementById('md').dispatchEvent(new Event('input', { bubbles: true }));
    }, saved);
    assert.equal(await value('pop'), 17, 'A different application cannot inherit confirmation');
    await page.evaluate(() => applyFieldFixture({ md: '10', ld: '2', ldSign: '+', ptc: '1', pod: '16', start: '5', mt: '30' }));
    assert.equal(await page.locator('#htActualPop').inputValue(), '', 'Legacy job cannot inherit actual POP');
    assert.equal(await value('pop'), 17);
    await page.locator('#htActualPop').fill('18.5');
    await activate('#htFieldApply');
    await page.locator('#htActualPop').fill('19');
    assert.equal(await value('pop'), 17, 'Editing reading invalidates confirmation');
    await activate('#htFieldApply');
    assert.equal(await value('pop'), 19);
    await page.evaluate(() => { const el = document.getElementById('ld'); el.value = '3'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    assert.equal(await value('pop'), 18, 'Changed setup cannot use stale confirmation');
    await page.locator('#htActualPop').fill('4');
    assert.equal(await page.locator('#htFieldApply').isDisabled(), true, 'POP below Rod Start is rejected');
    await page.locator('#htActualPop').fill('18.5');
    if (phone) await page.setViewportSize({ width: 320, height: 700 });
    for (const theme of ['light', 'dark']) {
      if (await page.locator('html').getAttribute('data-theme') !== theme) await activate('#themeToggle');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      assert.ok(await page.locator('#htFieldPreview').evaluate(el => el.scrollWidth <= el.clientWidth + 1), 'Comparison fits without horizontal scrolling');
      if (process.env.TAPCALC_SCREENSHOTS) await page.locator('#hotTapFieldReading').screenshot({ path: join(process.env.TAPCALC_SCREENSHOTS, 'actual-pop-' + engine + '-' + (phone ? 'phone' : 'desktop') + '-' + theme + '.png') });
    }
    assert.deepEqual(errors, []);
    await context.close();
    console.log('PASS actual POP ' + engine + '/' + (phone ? 'phone' : 'desktop') + ': preview, apply, undo, persisted state, legacy isolation, stale setup, invalid reading and themes');
  }
} finally { await browser?.close(); server.kill(); }
