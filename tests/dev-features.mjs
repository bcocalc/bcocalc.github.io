// UI readiness checks only: the localhost fixture blocks all production traffic.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let playwrightPath;
try { playwrightPath = require.resolve('playwright'); }
catch { playwrightPath = join(dirname(dirname(process.execPath)), 'node_modules/playwright'); }
const { chromium, webkit, devices } = require(playwrightPath);
const browserName = process.env.TAPCALC_BROWSER || 'chromium';
assert.ok(['chromium', 'webkit'].includes(browserName));
const server = spawn(process.execPath, [fileURLToPath(new URL('./sync-preview.mjs', import.meta.url))], {
  stdio: ['ignore', 'pipe', 'inherit']
});
let browser;
let page;
let step = 'startup';
try {
  const base = await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error('Preview did not start')), 10000);
    server.stdout.on('data', chunk => {
      output += chunk;
      const match = output.match(/http:\/\/127\.0\.0\.1:\d+/);
      if (match) { clearTimeout(timer); resolve(match[0]); }
    });
    server.once('error', error => { clearTimeout(timer); reject(error); });
    server.once('exit', code => { clearTimeout(timer); reject(new Error('Preview exited: ' + code)); });
  });
  browser = browserName === 'webkit' ? await webkit.launch({ headless: true }) : await chromium.launch({
    headless: true, ...(process.env.CI ? {} : { channel: 'chrome' })
  });
  for (const mobile of (process.env.TAPCALC_DEVICE === 'desktop' ? [false] : [true, false])) {
    const label = browserName + ' / ' + (mobile ? 'phone touch' : 'desktop mouse');
    const context = await browser.newContext({
      ...(mobile ? devices['iPhone 13'] : { viewport: { width: 1280, height: 900 } }), serviceWorkers: 'block'
    });
    page = await context.newPage();
    page.setDefaultTimeout(12000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const activate = locator => mobile ? locator.tap() : locator.click();
    const screen = async name => {
      await page.evaluate(() => window.scrollTo(0, 0));
      await activate(page.locator('.screen-nav [data-screen="' + name + '"]'));
      await page.waitForTimeout(450);
      assert.equal(await page.locator('body').getAttribute('data-active-screen'), name);
    };
    const openReference = async view => {
      await page.evaluate(() => window.scrollTo(0, 0));
      await activate(page.locator('#referenceLibraryToggle'));
      await activate(page.locator('#referenceLibraryOptions [data-reference-target="' + view + '"]'));
      await page.waitForTimeout(500);
      const visible = await page.locator('#referenceWorkspaceContent > .reference-view').evaluateAll(nodes =>
        nodes.filter(node => getComputedStyle(node).display !== 'none').map(node => node.dataset.referenceView));
      assert.deepEqual(visible, [view], 'Only the selected Reference section may be visible');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'No page-wide horizontal overflow');
    };

    step = label + ' startup';
    await page.goto(base + '/dev/measurement-card.html?fixture=success');
    await page.waitForFunction(() => window.__tapcalcWorkflowBrowseReady && window.__tapcalcReferenceRouterReady);
    await page.waitForTimeout(1700);
    assert.equal(await page.locator('.top-app-title').textContent(), await page.evaluate(() => window.TAPCALC_BUILD.label));

    step = label + ' screen navigation';
    for (const name of ['home', 'calc', 'card', 'jobs', 'ref']) {
      await screen(name);
      assert.equal(await page.locator('.screen-view.active:not([hidden])').count(), 1);
    }
    for (const theme of ['dark', 'light']) {
      step = label + ' / ' + theme + ' Reference';
      if (await page.locator('html').getAttribute('data-theme') !== theme) await activate(page.locator('#themeToggle'));
      for (const view of ['glossary', 'fieldmanual', 'smartstop', 'foldinghead', 'cutters', 'glossary']) await openReference(view);

      step = label + ' / ' + theme + ' cutter sizes';
      await openReference('cutters');
      const cutterBefore = await page.locator('#bcoCutterOD').inputValue();
      const cutterType = page.locator('#cutterReferenceType');
      const cutterPipe = page.locator('#cutterReferencePipe');
      await cutterType.scrollIntoViewIfNeeded();
      await cutterType.selectOption('hotTap');
      await cutterPipe.selectOption('16');
      assert.equal(await page.locator('#cutterReferenceSize').textContent(), '14.688 in');
      await cutterType.selectOption('lineStop');
      assert.equal(await cutterPipe.inputValue(), '16');
      assert.equal(await page.locator('#cutterReferenceSize').textContent(), '15.063 in');
      await cutterPipe.selectOption('24');
      assert.equal(await page.locator('#cutterReferenceSize').textContent(), '23.000 in');
      const firstCutterRow = page.locator('#cutterReferenceRows tr').first();
      assert.equal(await firstCutterRow.isVisible(), false, 'Full chart stays collapsed until requested');
      await activate(page.locator('#cutterReferenceChartToggle'));
      assert.equal(await firstCutterRow.isVisible(), true);
      assert.equal(await page.locator('#cutterReferenceRows tr').count(), 13);
      assert.equal(await page.locator('#cutterReferenceRows tr[aria-current="true"]').getAttribute('data-pipe-size'), '24');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Cutter chart fits the page');
      await activate(page.locator('#cutterReferenceChartToggle'));
      await cutterType.scrollIntoViewIfNeeded();
      await cutterType.selectOption('hotTap');
      assert.equal(await page.locator('#cutterReferenceSize').textContent(), '21.000 in');
      await cutterPipe.selectOption('4');
      assert.equal(await page.locator('#cutterReferenceSize').textContent(), '2.438 in');
      assert.match(await page.locator('#cutterReferenceStatus').textContent(), /both 3 in and 4 in/);
      await cutterPipe.selectOption('42');
      assert.equal(await page.locator('#cutterReferenceSize').textContent(), '39.000 in');
      await cutterType.selectOption('lineStop');
      assert.equal(await page.locator('#cutterReferenceSize').textContent(), 'Not listed');
      await cutterPipe.selectOption('unlisted');
      assert.equal(await page.locator('#cutterReferenceSize').textContent(), 'Not listed');
      await cutterPipe.selectOption('');
      assert.equal(await page.locator('#cutterReferenceSize').textContent(), '-');
      assert.equal(await page.locator('#bcoCutterOD').inputValue(), cutterBefore, 'Reference does not alter the job cutter');
      await cutterPipe.selectOption('16');
      if (process.env.TAPCALC_SCREENSHOTS) {
        await page.locator('#cuttersReferenceView').screenshot({
          path: join(process.env.TAPCALC_SCREENSHOTS, 'cutters-' + browserName + '-' + (mobile ? 'phone' : 'desktop') + '-' + theme + '.png')
        });
      }

      step = label + ' / ' + theme + ' SmartStop lookup';
      await openReference('smartstop');
      const sizes = await page.locator('#smartStopSizeSelect option').evaluateAll(nodes => nodes.map(node => node.value));
      await page.locator('#smartStopSizeSelect').scrollIntoViewIfNeeded();
      for (const size of [sizes[0], sizes.at(-1)]) {
        step = label + ' / ' + theme + ' SmartStop size ' + size;
        await page.locator('#smartStopSizeSelect').selectOption(size);
        assert.ok(await page.locator('#smartStopLookupResults .smartstop-result-row').count() > 0);
      }
      await page.locator('#smartStopWallFilter').fill('999');
      assert.equal(await page.locator('#smartStopLookupResults .smartstop-result-row').count(), 0);
      await activate(page.locator('[data-smartstop-clear-filters]'));
      assert.equal(await page.locator('#smartStopWallFilter').inputValue(), '');
      assert.ok(await page.locator('#smartStopLookupResults .smartstop-result-row').count() > 0);

      step = label + ' / ' + theme + ' folding-head lookup';
      await openReference('foldinghead');
      const lines = await page.locator('#foldingHeadLineSize option').evaluateAll(nodes => nodes.map(node => node.value));
      await page.locator('#foldingHeadLineSize').scrollIntoViewIfNeeded();
      for (const line of [lines[0], lines.at(-1)]) {
        await page.locator('#foldingHeadLineSize').selectOption(line);
        assert.equal(await page.locator('[data-folding-head-line-row].active').getAttribute('data-folding-head-line-row'), line);
        assert.notEqual(await page.locator('#foldingHeadTapSizeOut').textContent(), '-');
      }
      // Exercise the displayed formula; this is not equipment-rating certification.
      for (const [id, value] of Object.entries({ Md: '10', Ld: '2', Pod: '4', Wall: '0.25', Start: '1' })) {
        await page.locator('#foldingHead' + id).fill(value);
      }
      assert.equal(await page.locator('#foldingHeadSetPointOut').textContent(), '15.7500 in');
      assert.equal(await page.locator('#foldingHeadBarTargetOut').textContent(), '16.7500 in');
      await page.locator('#foldingHeadLd').fill('-1 1/2');
      assert.equal(await page.locator('#foldingHeadSetPointOut').textContent(), '12.2500 in');
      assert.equal(await page.locator('#foldingHeadBarTargetOut').textContent(), '13.2500 in');
      await activate(page.locator('#foldingHeadClearInputs'));
      assert.equal(await page.locator('#foldingHeadSetPointOut').textContent(), '-');
      assert.equal(await page.locator('#foldingHeadSetPointStatus').getAttribute('data-state'), 'waiting');
    }
    console.log('PASS ' + label + ': screen routing; light/dark Reference isolation, lookups, filters and helper inputs');

    step = label + ' blank workflow browsing';
    const checkWorkflowPanels = async stage => {
      const panels = await page.locator('#cardScreen [data-workflow-stage-panel]').evaluateAll(nodes => nodes.map(node => ({
        stage: node.dataset.workflowStagePanel, hidden: node.hidden,
        ariaHidden: node.getAttribute('aria-hidden'), display: getComputedStyle(node).display,
        pointerEvents: getComputedStyle(node).pointerEvents
      })));
      for (const panel of panels) {
        assert.equal(panel.hidden, panel.stage !== stage);
        assert.equal(panel.ariaHidden, panel.stage === stage ? 'false' : 'true');
        assert.equal(panel.display === 'none', panel.stage !== stage);
        if (panel.stage !== stage) assert.equal(panel.pointerEvents, 'none');
      }
    };
    await screen('card');
    await activate(page.locator('#workflowStageNav [data-workflow-stage="setup"]'));
    await page.waitForTimeout(500);
    await checkWorkflowPanels('setup');
    assert.equal(await page.locator('#md').inputValue(), '');
    for (const stage of ['pipe', 'hotTap', 'review']) {
      await activate(page.locator('#workflowNextBtn'));
      await page.waitForTimeout(500);
      assert.equal(await page.evaluate(() => window.__tapCalcWorkflowStage), stage, 'Blank job can advance one step');
      await checkWorkflowPanels(stage);
    }
    await activate(page.locator('#workflowPrevBtn'));
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(() => window.__tapCalcWorkflowStage), 'hotTap');

    step = label + ' separate operation measurements';
    const setup = async () => {
      await activate(page.locator('#workflowStageNav [data-workflow-stage="setup"]'));
      await page.waitForTimeout(500);
      await checkWorkflowPanels('setup');
    };
    const measurements = [
      { add: 'workflowAddLineStopOpBtn', stage: 'lineStop', field: 'lsMd', value: 21.75 },
      { add: 'workflowAddCompletionOpBtn', stage: 'completionPlug', field: 'cpStart', value: 8.5 }
    ];
    const revealMeasurement = async item => {
      await activate(page.locator('#workflowStageNav [data-workflow-stage="' + item.stage + '"]'));
      await page.waitForTimeout(400);
      await checkWorkflowPanels(item.stage);
      const heading = page.locator('.section.collapsed:has(#' + item.field + ') > .accordion-heading');
      if (await heading.count()) await activate(heading);
    };
    for (const item of measurements) {
      await setup();
      await activate(page.locator('#' + item.add));
      await page.waitForTimeout(900);
      item.id = await page.evaluate(() => window.currentJobBundle.selectedOperationId);
      await revealMeasurement(item);
      await page.locator('#' + item.field).fill(String(item.value));
      await page.locator('#' + item.field).blur();
    }
    assert.equal(await page.evaluate(() => window.currentJobBundle.operations.length), 3);
    assert.notEqual(measurements[0].id, measurements[1].id);
    for (const item of measurements) {
      await setup();
      await page.locator('#workflowJobOperationSelect').scrollIntoViewIfNeeded();
      await page.locator('#workflowJobOperationSelect').selectOption(item.id);
      await page.waitForTimeout(1000);
      await revealMeasurement(item);
      assert.equal(Number(await page.locator('#' + item.field).inputValue()), item.value,
        'Switching operations preserves each operation measurement');
    }
    assert.deepEqual(errors, []);
    console.log('PASS ' + label + ': blank next/back; separate Line Stop / Completion measurements; no uncaught errors');
    await context.close();
  }
} catch (error) {
  console.error('FAILED: ' + step);
  if (page && !page.isClosed()) {
    console.error(await page.evaluate(failedStep => ({
      screen: document.body.dataset.activeScreen,
      selectedReference: document.getElementById('referenceViewSelect')?.value,
      visibleViews: [...document.querySelectorAll('.reference-view')].filter(node => getComputedStyle(node).display !== 'none').map(node => node.dataset.referenceView),
      visibilityRules: (() => {
        const target = document.querySelector(failedStep.includes('operation') ? '#workflowJobOperationSelect' : '.smartstop-lookup-section');
        const matches = [];
        const scan = rules => {
          for (const rule of rules) {
            if (rule.cssRules) scan(rule.cssRules);
            if (rule.selectorText && rule.style?.visibility && target?.matches(rule.selectorText)) matches.push(rule.cssText);
          }
        };
        for (const sheet of document.styleSheets) scan(sheet.cssRules || []);
        return matches;
      })(),
      controlAncestors: (() => {
        const parents = [];
        for (let node = document.getElementById(failedStep.includes('operation') ? 'workflowJobOperationSelect' : 'smartStopSizeSelect'); node; node = node.parentElement) {
          const style = getComputedStyle(node);
          const rect = node.getBoundingClientRect();
          parents.push({ tag: node.tagName, id: node.id, className: node.className, inline: node.getAttribute('style'), hidden: node.hidden,
            display: style.display, visibility: style.visibility, width: rect.width, height: rect.height });
        }
        return parents;
      })()
    }), step));
    const screenshot = join(tmpdir(), 'tapcalc-dev-feature-' + Date.now() + '.png');
    await page.screenshot({ path: screenshot });
    console.error('Screenshot: ' + screenshot);
  }
  throw error;
} finally {
  await browser?.close();
  server.kill();
}
