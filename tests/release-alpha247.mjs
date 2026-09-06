import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { dirname, join, resolve, sep, extname } from 'node:path';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); }
catch { playwright = require(join(dirname(dirname(process.execPath)), 'node_modules/playwright')); }
let server;
let base = process.env.TAPCALC_TEST_BASE;
if (!base) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
    '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.pdf': 'application/pdf' };
  server = createServer((request, response) => {
    let file = resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
    try {
      if (file !== resolve(root) && !file.startsWith(resolve(root) + sep)) throw new Error('Outside root');
      if (statSync(file).isDirectory()) file = join(file, 'index.html');
      response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' });
      response.end(readFileSync(file));
    } catch { response.writeHead(404); response.end(); }
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  base = 'http://127.0.0.1:' + server.address().port + '/';
}

for (const file of ['service-worker.js', 'dev/service-worker.js', 'dev-live/service-worker.js']) {
  const source = readFileSync(new URL('../' + file, import.meta.url), 'utf8');
  const current = source.match(/const CACHE_NAME = '([^']+)'/)[1];
  const prefix = source.match(/const CACHE_PREFIX = '([^']+)'/)[1];
  const keys = [current, prefix + 'old', 'unrelated-cache',
    'tapcalc-cache-other', 'tapcalc-dev-cache-other', 'tapcalc-dev-live-cache-other'];
  const removed = [];
  const matched = [];
  const events = {};
  const context = vm.createContext({
    URL, Response,
    self: { location: { origin: new URL(base).origin }, clients: { claim() {} },
      addEventListener: (name, handler) => { events[name] = handler; } },
    caches: {
      keys: async () => keys,
      delete: async (key) => removed.push(key),
      open: async (key) => ({ match: async (request) => {
        matched.push(key);
        return request === './measurement-card.html' ? new Response(current) : undefined;
      } })
    }
  });
  vm.runInContext(source, context);
  let pending;
  events.activate({ waitUntil: (promise) => { pending = promise; } });
  await pending;
  assert.deepEqual(removed, keys.filter((key) => key.startsWith(prefix) && key !== current));
  context.request = { mode: 'navigate', url: base + 'missing' };
  assert.equal(await (await vm.runInContext('cacheFallback(request)', context)).text(), current);
  assert.ok(matched.every((key) => key === current));
  context.request = { mode: 'cors', url: base + 'missing.js' };
  assert.equal((await vm.runInContext('cacheFallback(request)', context)).type, 'error');
  for (const request of [
    new Request('https://firestore.googleapis.com/v1/projects/example'),
    new Request(base + 'private', { headers: { Authorization: 'Bearer test' } })
  ]) {
    events.fetch({ request, respondWith() { assert.fail('Private request must bypass cache'); } });
  }
  console.log('PASS cache ownership, fallback, private-request bypass: ' + file);
}

function firestoreValue(value) {
  if (value === null) return { nullValue: null };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(firestoreValue) } };
  if (typeof value === 'object') return { mapValue: { fields: Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, firestoreValue(child)])) } };
  if (typeof value === 'number') return { doubleValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  return { stringValue: value };
}
const record = {
  meta: { title: 'Release test job', operationType: 'Line Stop' },
  job: { client: 'Release fixture', description: 'Release test job',
    notes: '<img src="missing-fixture.png" onerror="window.__tapcalcMarkupExecuted=true">' },
  jobBundle: {
    version: 1, selectedOperationId: 'east',
    sharedState: { jobClient: 'Release fixture', jobDescription: 'Release test job' },
    operations: ['east', 'west', 'main'].map((id, index) => ({
      id, label: id + ' stop', operationType: 'Line Stop',
      state: { operationType: 'Line Stop', activeMode: 'lineStop', md: String(10 + index),
        bcoPipeMaterial: 'CarbonSteel', bcoPipeOD: '4.0', bcoPipeID: '4.026', bcoCutterOD: '3.875' }
    }))
  }
};
const document = {
  name: 'projects/tapcalc-afc92/databases/(default)/documents/tapcalcJobs/release-fixture',
  fields: firestoreValue(record).mapValue.fields
};
const browser = await playwright.chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const width of (process.env.TAPCALC_LIVE_READ_ONLY || process.env.TAPCALC_OFFLINE_ONLY) ? [] : (process.env.TAPCALC_DESKTOP_ONLY ? [1280] : [390, 1280])) {
    const context = await browser.newContext({
      viewport: { width, height: 844 }, isMobile: width < 600, hasTouch: width < 600,
      serviceWorkers: 'block'
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await context.route('https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js', (route) =>
      route.fulfill({ contentType: 'text/javascript', body: [
        'const user = { getIdToken: async force => force ? "fixture-refreshed" : "fixture-token" };',
        'const auth = { currentUser: null, authStateReady: async () => {} };',
        'export function getAuth(){ return auth; }',
        'export async function signInAnonymously(){ auth.currentUser = user; return {user}; }'
      ].join('\n') }));
    let mode = 'success';
    let calls = 0;
    let refreshed = false;
    await context.route('https://firestore.googleapis.com/**', async (route) => {
      if (route.request().method() === 'POST' && new URL(route.request().url()).pathname === '/google.firestore.v1.Firestore/Listen/channel') return route.abort();
      assert.equal(route.request().method(), 'GET', 'Release tests never write shared records');
      assert.ok(new URL(route.request().url()).pathname.includes('/databases/(default)/documents/'));
      calls++;
      const token = route.request().headers().authorization;
      assert.ok(/^Bearer fixture-(token|refreshed)$/.test(token || ''), 'Read must be signed in');
      if (mode === 'timeout') return;
      if (mode === 'expired' && token !== 'Bearer fixture-refreshed') {
        return route.fulfill({ status: 401, json: { error: { message: 'Expired token' } } });
      }
      if (mode === 'expired') refreshed = true;
      if (mode === 'billing') return route.fulfill({ status: 403, json: {
        error: { message: 'This API method requires billing to be enabled.' }
      } });
      const url = new URL(route.request().url());
      if (mode === 'empty') return route.fulfill({ json: { documents: [] } });
      return route.fulfill({ json: url.searchParams.has('pageToken')
        ? { documents: [] } : { documents: [document], nextPageToken: 'page-2' } });
    });
    await page.goto(new URL('dev/measurement-card.html?v=3.0.0-alpha247', base).href);
    await page.waitForFunction(() => window.__tapcalcWorkflowBrowseReady && window.__tapcalcReferenceRouterReady);
    await page.waitForTimeout(1600);
    assert.match(await page.locator('.top-app-title').innerText(), /alpha247/);
    if (!process.env.TAPCALC_SHARED_ONLY) {
      await page.locator('.screen-nav [data-screen="card"]').click();
      await page.locator('#workflowStageNav [data-workflow-stage="setup"]').click();
      await page.locator('#workflowAddLineStopOpBtn').click();
      await page.waitForTimeout(850);
      await page.locator('#workflowStageNav [data-workflow-stage="lineStop"]').click();
      await page.waitForTimeout(400);
      const stopHeading = page.locator('.section.collapsed:has(#lsMd) > .accordion-heading');
      if (await stopHeading.count()) await stopHeading.click();
      await page.locator('#lsMd').fill('21.75');
      await page.locator('#workflowStageNav [data-workflow-stage="setup"]').click();
      await page.locator('#workflowAddCompletionOpBtn').click();
      await page.waitForTimeout(850);
      await page.locator('#workflowStageNav [data-workflow-stage="completionPlug"]').click();
      const plugHeading = page.locator('.section.collapsed:has(#cpStart) > .accordion-heading');
      if (await plugHeading.count()) await plugHeading.click();
      await page.locator('#cpStart').fill('8.5');
      assert.equal(await page.evaluate(() => window.currentJobBundle.operations.length), 3);
      console.log('PASS adding Line Stop and Completion exposes editable inputs: ' + width + 'px');
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await page.waitForFunction(() => window.__tapcalcWorkflowBrowseReady && window.__tapcalcReferenceRouterReady);
      await page.waitForTimeout(1600);
    }
    if (!process.env.TAPCALC_SHARED_ONLY) {
    for (const screen of ['home', 'calc', 'card', 'jobs', 'ref']) {
      await page.locator('.screen-nav [data-screen="' + screen + '"]').click();
      await page.waitForTimeout(800);
      assert.equal(await page.evaluate(() => document.querySelectorAll('.screen-view.active:not([hidden])').length), 1);
      assert.equal(await page.evaluate(() => document.body.dataset.activeScreen), screen);
    }
    for (const theme of ['dark', 'light']) {
      if (await page.locator('html').getAttribute('data-theme') !== theme) await page.locator('#themeToggle').click();
      for (const view of ['glossary', 'fieldmanual', 'smartstop', 'foldinghead']) {
        console.log('Reference check: ' + width + ' / ' + theme + ' / ' + view);
        await page.locator('#referenceLibraryToggle').click();
        await page.locator('#referenceLibraryOptions [data-reference-target="' + view + '"]').click();
        await page.waitForTimeout(650);
        const visible = await page.locator('#referenceWorkspaceContent > .reference-view').evaluateAll(
          (els) => els.filter((el) => getComputedStyle(el).display !== 'none').map((el) => el.dataset.referenceView));
        assert.deepEqual(visible, [view]);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      }
    }
    await page.locator('.screen-nav [data-screen="card"]').click();
    await page.waitForTimeout(800);
    await page.locator('#workflowStageNav [data-workflow-stage="setup"]').click();
    await page.waitForTimeout(800);
    assert.equal(await page.evaluate(() => window.__tapCalcWorkflowStage), 'setup');
    for (const stage of ['pipe', 'hotTap', 'review']) {
      await page.locator('#workflowNextBtn').click();
      await page.waitForTimeout(800);
      assert.equal(await page.evaluate(() => window.__tapCalcWorkflowStage), stage, 'Blank job advances one step');
    }
    await page.locator('#workflowPrevBtn').click();
    await page.waitForTimeout(800);
    assert.equal(await page.evaluate(() => window.__tapCalcWorkflowStage), 'hotTap');
    }
    await page.locator('.screen-nav [data-screen="jobs"]').click();
    await page.locator('.library-lane-btn[data-library-lane="shared"]').click();
    await page.waitForFunction(() => window.getCombinedJobsForDisplay?.().some((job) => job.id === 'release-fixture'));
    await page.locator('#jobsSelect .tapcalc-shared-load-btn[data-job-id="release-fixture"]').waitFor({ state: 'visible' });
    await page.waitForTimeout(1200);
    assert.equal(await page.evaluate(() => !!window.__tapcalcMarkupExecuted), false, 'Shared notes must render as text');
    assert.equal(await page.locator('#jobsSelect .tapcalc-shared-load-btn[data-job-id="release-fixture"]').count(), 1);
    await page.locator('#jobsSelect .tapcalc-shared-load-btn[data-job-id="release-fixture"]').click();
    await page.waitForFunction(() => window.currentJobBundle?.operations?.length === 3);
    for (const id of ['west', 'main', 'east']) {
      await page.locator('#workflowStageNav [data-workflow-stage="setup"]').click();
      await page.waitForTimeout(800);
      assert.equal(await page.evaluate(() => document.body.dataset.activeScreen), 'card', 'Loading must not revive the retired Job screen');
      await page.locator('#workflowJobOperationSelect').selectOption(id);
      await page.waitForTimeout(850);
      assert.equal(await page.evaluate(() => window.currentJobBundle.selectedOperationId), id);
      assert.equal(Number(await page.locator('#md').inputValue()), 10 + ['east', 'west', 'main'].indexOf(id));
    }
    assert.equal(await page.evaluate(() => !!window.__tapcalcMarkupExecuted), false);
    console.log('PASS shared job load, visible operation picker, separate measurements and safe text: ' + width + 'px');
    mode = 'expired';
    await page.evaluate(() => window.tapCalcFetchSharedJobsViaRest());
    assert.ok(refreshed);
    mode = 'empty';
    await page.evaluate(() => window.loadCloudJobs());
    assert.equal(await page.evaluate(() => window.getCombinedJobsForDisplay().filter((job) => job.source === 'cloud').length), 0);
    mode = 'billing';
    await page.locator('.screen-nav [data-screen="jobs"]').click();
    await page.locator('.library-lane-btn[data-library-lane="shared"]').click();
    await page.waitForFunction(() => document.getElementById('jobsCloudStatus').textContent.includes('billing'));
    assert.ok(await page.locator('#jobsCloudStatus').isVisible());
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    mode = 'success';
    const before = calls;
    await page.evaluate(() => Promise.all([window.loadCloudJobs(), window.loadCloudJobs(), window.loadCloudJobs()]));
    assert.equal(calls - before, 2, 'Concurrent loads share one two-page read');
    mode = 'timeout';
    const started = Date.now();
    await page.evaluate(() => window.loadCloudJobs());
    assert.ok(Date.now() - started < 12000);
    assert.match(await page.locator('#jobsCloudStatus').innerText(), /unavailable/);
    await context.setOffline(true);
    const offlineCalls = calls;
    await page.evaluate(() => window.loadCloudJobs());
    assert.equal(calls, offlineCalls);
    assert.match(await page.locator('#jobsCloudStatus').innerText(), /Offline/);
    assert.deepEqual(errors, []);
    console.log('PASS token refresh, empty results, billing errors, retry, deduplication, timeout and offline: ' + width + 'px');
    await context.close();
  }
  if (process.env.TAPCALC_LIVE_READ_ONLY) {
    for (const width of [390, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 844 }, serviceWorkers: 'block' });
      const page = await context.newPage();
      const errors = [];
      const blockedNonGet = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await context.route('https://firestore.googleapis.com/**', async (route) => {
        if (route.request().method() !== 'GET') {
          blockedNonGet.push({ method: route.request().method(), url: route.request().url() });
          return route.abort();
        }
        return route.continue();
      });
      await page.goto(new URL('dev/measurement-card.html?v=3.0.0-alpha247', base).href);
      await page.waitForFunction(() => window.__tapcalcWorkflowBrowseReady && window.__tapcalcReferenceRouterReady);
      await page.waitForTimeout(1600);
      await page.locator('.screen-nav [data-screen="jobs"]').click();
      await page.locator('.library-lane-btn[data-library-lane="shared"]').click();
      await page.waitForFunction(() => window.getCombinedJobsForDisplay?.().some((job) => job.source === 'cloud'));
      const count = await page.evaluate(() => window.getCombinedJobsForDisplay().filter((job) => job.source === 'cloud').length);
      await page.locator('#jobsSelect .tapcalc-shared-load-btn').first().waitFor({ state: 'visible' });
      await page.waitForTimeout(1400);
      assert.equal(await page.locator('#jobsSelect .tapcalc-shared-load-btn').count(), count);
      assert.match(await page.locator('.top-app-title').innerText(), /alpha247/);
      assert.deepEqual(errors, []);
      // The SDK uses POST for its read-only Listen transport; keep it blocked so
      // this check still relies exclusively on the authenticated REST GET path.
      const unexpectedRequests = blockedNonGet.filter(({ method, url }) =>
        method !== 'POST' || new URL(url).pathname !== '/google.firestore.v1.Firestore/Listen/channel');
      assert.deepEqual(unexpectedRequests, [], 'Read-only check must not initiate Firestore writes');
      console.log('PASS real Firebase read and visible Load buttons: ' + count + ' jobs at ' + width + 'px');
      await context.close();
    }
  }
  if (process.env.TAPCALC_OFFLINE_ONLY) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.route('https://**', (route) => route.abort());
    const devPage = await context.newPage();
    await devPage.goto(new URL('dev/measurement-card.html?v=3.0.0-alpha247', base).href);
    await devPage.waitForFunction(() => navigator.serviceWorker.controller?.scriptURL.includes('/dev/service-worker.js'));
    await devPage.evaluate(() => navigator.serviceWorker.ready);
    const rootPage = await context.newPage();
    await rootPage.goto(new URL('measurement-card.html', base).href);
    await rootPage.waitForFunction(() => navigator.serviceWorker.controller?.scriptURL.includes('/service-worker.js'));
    await rootPage.evaluate(() => navigator.serviceWorker.ready);
    const keys = await rootPage.evaluate(() => caches.keys());
    assert.ok(keys.some((key) => key.startsWith('tapcalc-dev-cache-')));
    assert.ok(keys.some((key) => key.startsWith('tapcalc-cache-')));
    await context.setOffline(true);
    await devPage.reload();
    await devPage.waitForFunction(() => window.__tapcalcWorkflowBrowseReady);
    assert.match(await devPage.locator('.top-app-title').innerText(), /alpha247/);
    await rootPage.reload();
    assert.match(await rootPage.locator('.top-app-title').innerText(), /livefix16/);
    console.log('PASS real browser dev/live cache coexistence and offline reloads');
    await context.close();
  }
} finally {
  await browser.close();
  if (server) await new Promise((done) => server.close(done));
}
