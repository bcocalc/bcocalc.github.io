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
    const timer = setTimeout(() => reject(new Error('Preview timeout')), 10000);
    server.stdout.on('data', data => { const match = String(data).match(/http:\/\/127\.0\.0\.1:\d+/); if (match) { clearTimeout(timer); resolve(match[0]); } });
    server.once('error', reject);
  });
  browser = await pw[engine].launch({ headless: true, ...(engine === 'chromium' && !process.env.CI ? { channel: 'chrome' } : {}) });
  for (const folder of ['', 'dev/']) {
    const context = await browser.newContext({ ...pw.devices['iPhone 13'], serviceWorkers: 'block' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/' + folder + 'measurement-card.html?fixture=success');
    await page.waitForTimeout(2000);
    await page.locator('.screen-nav [data-screen="calc"]').tap();
    await page.locator('#bcoPipeMaterial').selectOption('CarbonSteel');
    for (const size of [22, 26, 28]) {
      await page.locator('#bcoPipeOD').selectOption(size.toFixed(1));
      for (const [schedule, wall] of [['STD', 0.375], ['XS', 0.5]]) {
        await page.locator('#bcoSchedule').selectOption(schedule);
        const id = size - 2 * wall;
        assert.equal(Number(await page.locator('#bcoPipeID').inputValue()), id);
        const cutter = size - 2;
        await page.locator('#bcoCutterOD').fill(String(cutter));
        await page.locator('#bcoCutterOD').press('Tab');
        await page.waitForTimeout(100);
        const geometry = await page.evaluate(() => JSON.parse(localStorage.getItem('bcoData')));
        assert.equal(geometry.pipeOD, size);
        assert.equal(geometry.pipeID, id);
        assert.ok(Math.abs(geometry.bco - (size / 2 - Math.sqrt((id / 2) ** 2 - (cutter / 2) ** 2))) < 1e-9);
        await page.locator('.calc-submode-btn[data-mode="eta"]').tap();
        const collapsedEta = page.locator('.section.collapsed:has(#etaMachine) > .accordion-heading');
        if (await collapsedEta.count()) await collapsedEta.tap();
        await page.locator('#etaMachine').selectOption('1200');
        assert.equal(Number(await page.locator('#etaCutterSize').inputValue()), cutter);
        assert.ok(Math.abs(Number(await page.locator('#etaBco').inputValue()) - geometry.bco) < 0.001);
        assert.equal(await page.locator('#etaRpmDisplay').textContent(), {22:'17-19',26:'14-16',28:'12-14'}[size]);
        assert.match(await page.locator('#etaRangeDisplay').textContent(), /min|sec/);
        await page.locator('.calc-submode-btn[data-mode="bco"]').tap();
      }
      for (const schedule of ['40', '80']) {
        await page.locator('#bcoSchedule').selectOption(schedule);
        assert.equal(await page.locator('#bcoPipeID').inputValue(), '', 'Unverified schedule requires manual ID');
        assert.equal(await page.evaluate(() => localStorage.getItem('bcoData')), null, 'No stale geometry after blank ID');
      }
    }
    assert.deepEqual(errors, []);
    await context.close();
    console.log('PASS pipe sizes ' + engine + '/' + (folder || 'live') + ': dropdown, STD/XS, BCO and unsupported schedule clearing');
  }
} finally { await browser?.close(); server.kill(); }
