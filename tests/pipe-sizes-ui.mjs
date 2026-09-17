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
    if (folder) await page.waitForFunction(() => window.__tapcalcWorkflowBrowseReady && window.__tapcalcReferenceRouterReady);
    await page.waitForTimeout(2000);
    await page.locator('.screen-nav [data-screen="calc"]').tap();
    await page.locator('.calc-submode-btn[data-mode="bco"]').tap();
    const collapsedBco = page.locator('.section.collapsed:has(#bcoPipeMaterial) > .accordion-heading');
    if (await collapsedBco.count()) await collapsedBco.tap();
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
    const cutterBeforeLookup = await page.locator('#bcoCutterOD').inputValue();
    await page.locator('.screen-nav [data-screen="ref"]').tap();
    await page.locator('#referenceLibraryToggle').tap();
    await page.locator('#referenceLibraryOptions [data-reference-target="cutters"]').tap();
    for (const theme of ['light', 'dark']) {
      await page.evaluate(theme => {
        document.documentElement.dataset.theme = theme;
        document.body.classList.toggle('light', theme === 'light');
      }, theme);
      for (const [type, values] of Object.entries({hotTap: ['19.000', '23.000', '25.000'], lineStop: ['21.000', '25.000', '27.000']})) {
        await page.locator('#cutterReferenceType').selectOption(type);
        for (const [i, size] of ['22', '26', '28'].entries()) {
          await page.locator('#cutterReferencePipe').selectOption(size);
          assert.equal(await page.locator('#cutterReferenceSize').textContent(), values[i] + ' in');
          assert.match(await page.locator('#cutterReferenceStatus').textContent(), /Furmanite\/IPSCO/);
        }
      }
      assert.ok(await page.locator('#cuttersReferenceView').isVisible());
      for (const [type, values] of Object.entries({floStopHotTap: ['3.438', '5.468', '7.312', '9.5', '11.5'], floStopLineStop: ['3.8', '5.8', '7.9', '9.8', '11.8']})) {
        await page.locator('#cutterReferenceType').selectOption(type);
        for (const [i, size] of ['4', '6', '8', '10', '12'].entries()) {
          await page.locator('#cutterReferencePipe').selectOption(size);
          assert.equal(await page.locator('#cutterReferenceSize').textContent(), values[i] + ' in');
          assert.match(await page.locator('#cutterReferenceResultLabel').textContent(), /FloStop II \/ IP-412/);
          assert.match(await page.locator('#cutterReferenceStatus').textContent(), /ONLY/);
        }
        await page.locator('#cutterReferencePipe').selectOption('22');
        assert.equal(await page.locator('#cutterReferenceSize').textContent(), 'Not listed');
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    }
    assert.equal(await page.locator('#bcoCutterOD').inputValue(), cutterBeforeLookup, 'Reference must not modify the job cutter');
    assert.deepEqual(errors, []);
    await context.close();
    console.log('PASS pipe sizes ' + engine + '/' + (folder || 'live') + ': dropdown, STD/XS, BCO, unsupported schedules and light/dark cutter reference');
  }
} finally { await browser?.close(); server.kill(); }
