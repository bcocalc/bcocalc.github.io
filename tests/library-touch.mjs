// Disposable localhost browser test. The preview's CSP and fake Firebase isolate all data.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, webkit, devices } = require(join(dirname(dirname(process.execPath)), 'node_modules/playwright'));
const server = spawn(process.execPath, [fileURLToPath(new URL('./sync-preview.mjs', import.meta.url))], { stdio: ['ignore', 'pipe', 'inherit'] });
let browser;
let activePage;
try {
  const base = await new Promise((resolve, reject) => {
    let output = '';
    server.stdout.on('data', chunk => { output += chunk; const match = output.match(/http:\/\/127\.0\.0\.1:\d+/); if (match) resolve(match[0]); });
    server.once('exit', code => reject(new Error('Preview failed: ' + code)));
  });
  browser = process.env.TAPCALC_WEBKIT ? await webkit.launch({ headless: true }) : await chromium.launch({ channel: 'chrome', headless: true });
  for (const directory of ['', 'dev/']) {
    const context = await browser.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
    const page = await context.newPage();
    activePage = page;
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    // DOM event trace identifies capture cancellation and detached touch targets.
    await page.addInitScript(() => {
      window.touchTrace = [];
      for (const type of ['pointerdown', 'touchstart', 'touchend', 'pointerup', 'mousedown', 'mouseup', 'click']) {
        document.addEventListener(type, event => {
          const target = event.target;
          const button = target.closest?.('button');
          if (!button) return;
          setTimeout(() => window.touchTrace.push({ type, id: button.id, text: button.textContent.trim().slice(0, 30),
            canceled: event.defaultPrevented, attached: button.isConnected }), 0);
        }, { capture: true, passive: true });
      }
    });
    await page.goto(base + '/' + directory + 'measurement-card.html?fixture=success');
    await page.waitForFunction(() => typeof window.tapCalcEnsureLiveControls === 'function');
    await page.waitForTimeout(1700);
    await page.getByRole('button', { name: 'Library', exact: true }).tap();
    await page.waitForTimeout(500);
    assert.equal(await page.locator('.top-app-title').textContent(),
      await page.evaluate(() => window.TAPCALC_BUILD.label));
    const originalHistory = await page.evaluate(() => JSON.parse(localStorage.getItem('measurementCardHistoryV1')));
    assert.equal(originalHistory.length, 4);
    assert.equal(originalHistory.filter(item => !item.cloudId).length, 2);
    assert.ok(await page.evaluate(() => {
      const button = document.querySelector('[data-recent-history-id="A"]');
      for (let i = 0; i < 8; i++) window.tapCalcUpdateLibraryPolish();
      return button === document.querySelector('[data-recent-history-id="A"]');
    }), 'Background refreshes must preserve the touch target');
    for (const id of ['A', 'B']) {
      await page.locator('[data-recent-history-id="' + id + '"]').tap();
      await page.waitForFunction(id => document.getElementById('jobDescription').value === 'Preview ' + id, id);
      // Let the legacy loader's scheduled hydration finish before the next navigation.
      await page.waitForTimeout(1800);
      assert.equal(Number(await page.locator('#md').inputValue()), id === 'A' ? 12 : 24);
      assert.equal(await page.locator('body').getAttribute('data-active-screen'), 'card');
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.getByRole('button', { name: 'Library', exact: true }).tap();
      await page.waitForTimeout(350);
      assert.equal(await page.locator('body').getAttribute('data-active-screen'), 'jobs', 'Return to Library after opening ' + id);
    }
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('measurementCardHistoryV1'))), originalHistory,
      'Loading local jobs must not rewrite the saved snapshots');
    await page.getByRole('button', { name: 'Sync shared jobs', exact: true }).tap();
    await page.waitForFunction(() => document.getElementById('unsyncedJobsCount')?.textContent === '0', null, { timeout: 15000 });
    assert.equal(await page.locator('#unsyncedJobsCount').textContent(), '0');
    const syncedHistory = await page.evaluate(() => JSON.parse(localStorage.getItem('measurementCardHistoryV1')));
    assert.deepEqual(syncedHistory.map(item => item.state), originalHistory.map(item => item.state));
    assert.equal(syncedHistory.length, 4);
    if (directory) {
      assert.equal(await page.evaluate(() => window.tapCalcSetWorkflowStage.__alpha201Guarded === true), false,
        'The old locking wrapper must not reinstall over browse mode');
      assert.equal(await page.locator('#workflowStageNav [data-stage-locked="true"]').count(), 0);
    }
    assert.deepEqual(errors, []);
    console.log('PASS ' + (process.env.TAPCALC_WEBKIT ? 'WebKit' : 'Chromium') + ' ' + (directory || 'live/') +
      ': stable cards; both local jobs opened by touch; 4 local / 2 unsynced -> 4 local / 0 unsynced; saved states unchanged');
    await context.close();
  }
} catch (error) {
  console.error(await activePage?.evaluate(() => ({
    screen: document.body.dataset.activeScreen,
    trace: window.touchTrace.slice(-20),
    status: document.getElementById('jobsSyncStatus')?.textContent
  })));
  throw error;
} finally {
  await browser?.close();
  server.kill();
}
