#!/usr/bin/env node
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index];
  if (arg.startsWith('--')) {
    args.set(arg, process.argv[index + 1]);
    index += 1;
  }
}

const base = args.get('--base') || 'http://127.0.0.1:8765/dev-live/';
const expectedVersion = args.get('--expect-version') || '3.0.0-devlive18';
const target = new URL('measurement-card.html', base).toString();
const results = [];
const warnings = [];
const seedLocalHistoryExpression = `(() => {
  const now = new Date().toISOString();
  const record = {
    meta: {
      title: 'Smoke Saved Job',
      operationType: 'Hot Tap',
      savedAtIso: now,
      savedAtDisplay: 'Smoke test'
    },
    job: {
      client: 'Smoke Client',
      description: 'Smoke Saved Job',
      jobNumber: 'SMK-001',
      location: 'Test Stand'
    },
    pipe: {
      nominalSize: '4.0',
      wallThickness: '0.237',
      material: 'Carbon Steel'
    },
    machine: {
      machine: '360 / 152',
      cutterOd: '3.875'
    },
    state: {
      jobClient: 'Smoke Client',
      jobDescription: 'Smoke Saved Job',
      jobNumber: 'SMK-001',
      jobLocation: 'Test Stand',
      operationType: 'Hot Tap',
      bcoPipeOD: '4.0',
      wallThickness: '0.237'
    }
  };
  localStorage.setItem('measurementCardHistoryV1', JSON.stringify([{
    id: 'tapcalc-smoke-load',
    savedAt: 'Smoke test',
    summary: {
      title: 'Smoke Saved Job',
      pipe: '4.0',
      bco: '1.234',
      wall: '0.237',
      operationType: 'Hot Tap'
    },
    record
  }]));
  return true;
})()`;

function record(ok, name, detail = '') {
  results.push({ ok, name, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` - ${detail}` : ''}`);
}

function warn(name, detail = '') {
  warnings.push({ name, detail });
  console.log(`WARN ${name}${detail ? ` - ${detail}` : ''}`);
}

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  ].filter(Boolean);
  return candidates.find((candidate) => existsSync(candidate));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
  return response.json();
}

async function waitForJson(url, timeout = 10000) {
  const start = Date.now();
  let lastError;
  while (Date.now() - start < timeout) {
    try {
      return await fetchJson(url);
    } catch (error) {
      lastError = error;
      await sleep(150);
    }
  }
  throw lastError || new Error(`Timed out waiting for ${url}`);
}

function connectCdp(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const pending = new Map();
    const listeners = new Map();
    let nextId = 1;

    ws.addEventListener('open', () => {
      resolve({
        on(method, handler) {
          if (!listeners.has(method)) listeners.set(method, []);
          listeners.get(method).push(handler);
        },
        send(method, params = {}) {
          const id = nextId;
          nextId += 1;
          ws.send(JSON.stringify({ id, method, params }));
          return new Promise((resolveSend, rejectSend) => {
            pending.set(id, { resolve: resolveSend, reject: rejectSend, method });
          });
        },
        close() {
          try { ws.close(); } catch {}
        }
      });
    }, { once: true });

    ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id && pending.has(message.id)) {
        const request = pending.get(message.id);
        pending.delete(message.id);
        if (message.error) request.reject(new Error(`${request.method}: ${message.error.message}`));
        else request.resolve(message.result || {});
        return;
      }
      if (message.method && listeners.has(message.method)) {
        for (const handler of listeners.get(message.method)) handler(message.params || {});
      }
    });

    ws.addEventListener('error', () => reject(new Error(`Unable to connect to ${wsUrl}`)), { once: true });
  });
}

async function evaluate(cdp, expression) {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || 'Runtime evaluation failed');
  }
  return result.result?.value;
}

async function waitFor(cdp, expression, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await evaluate(cdp, expression)) return true;
    await sleep(150);
  }
  throw new Error(`Timed out waiting for ${expression}`);
}

async function tap(cdp, selector) {
  return evaluate(cdp, `(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return false;
    let rect = el.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth) {
      el.scrollIntoView({ block: 'center', inline: 'nearest' });
      rect = el.getBoundingClientRect();
    }
    const init = {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2
    };
    if (window.PointerEvent) {
      el.dispatchEvent(new PointerEvent('pointerdown', { ...init, pointerId: 1, pointerType: 'touch', isPrimary: true }));
      el.dispatchEvent(new PointerEvent('pointerup', { ...init, pointerId: 1, pointerType: 'touch', isPrimary: true }));
    }
    el.dispatchEvent(new MouseEvent('mousedown', init));
    el.dispatchEvent(new MouseEvent('mouseup', init));
    el.dispatchEvent(new MouseEvent('click', init));
    return true;
  })()`);
}

const browserPath = findBrowser();
if (!browserPath) {
  console.error('Unable to find Chrome or Edge. Set CHROME_PATH to a Chromium-based browser executable and retry.');
  process.exit(1);
}

const userDataDir = mkdtempSync(join(tmpdir(), 'tapcalc-mobile-smoke-'));
const port = 43000 + Math.floor(Math.random() * 1000);
const browser = spawn(browserPath, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  '--disable-gpu',
  '--disable-extensions',
  '--disable-background-networking',
  '--no-first-run',
  '--no-default-browser-check',
  '--window-size=390,844',
  'about:blank'
], { stdio: 'ignore' });

let cdp;
try {
  await waitForJson(`http://127.0.0.1:${port}/json/version`);
  const tab = await fetchJson(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' });
  cdp = await connectCdp(tab.webSocketDebuggerUrl);
  const consoleErrors = [];

  cdp.on('Runtime.consoleAPICalled', (event) => {
    if (event.type !== 'error') return;
    consoleErrors.push((event.args || []).map((arg) => arg.value || arg.description || '').join(' '));
  });
  cdp.on('Log.entryAdded', (event) => {
    if (event.entry?.level === 'error') consoleErrors.push(event.entry.text || '');
  });

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Log.enable').catch(() => {});
  await cdp.send('Network.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true
  });
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  await cdp.send('Network.setUserAgentOverride', {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
  });

  await cdp.send('Page.navigate', { url: target });
  await waitFor(cdp, `!!document.querySelector('.screen-nav .screen-tab[data-screen="home"]')`, 15000);
  await sleep(900);
  await evaluate(cdp, seedLocalHistoryExpression);
  await cdp.send('Page.reload', { ignoreCache: true });
  await waitFor(cdp, `!!document.querySelector('.screen-nav .screen-tab[data-screen="home"]')`, 15000);
  await sleep(900);

  const versionText = await evaluate(cdp, `document.querySelector('.top-app-title')?.textContent || ''`);
  record(versionText.includes(expectedVersion), 'version marker visible', versionText.trim());

  const navPosition = await evaluate(cdp, `getComputedStyle(document.querySelector('.screen-nav')).position`);
  record(navPosition === 'sticky', 'mobile top nav is sticky', navPosition);

  const overflow = await evaluate(cdp, `document.documentElement.scrollWidth > document.documentElement.clientWidth + 1`);
  record(!overflow, 'no horizontal overflow');

  const tabOrder = [
    ['home', '#homeScreen'],
    ['calc', '#calcScreen'],
    ['card', '#cardScreen'],
    ['jobs', '#jobsScreen'],
    ['ref', '#refScreen']
  ];

  for (const [screen, selector] of tabOrder) {
    await tap(cdp, `.screen-tab[data-screen="${screen}"]`);
    await sleep(250);
    const state = await evaluate(cdp, `document.body.dataset.activeScreen || ''`);
    const isActive = await evaluate(cdp, `(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      return !!el && el.classList.contains('active') && !el.hidden;
    })()`);
    record(state === screen && isActive, `tab activates ${screen}`, `body=${state}`);
  }

  await tap(cdp, '.screen-tab[data-screen="calc"]');
  await sleep(300);
  const bcoAutofill = await evaluate(cdp, `(() => {
    const material = document.getElementById('bcoPipeMaterial');
    const size = document.getElementById('bcoPipeOD');
    const schedule = document.getElementById('bcoSchedule');
    const pipeId = document.getElementById('bcoPipeID');
    const fire = (el, type = 'change') => el?.dispatchEvent(new Event(type, { bubbles: true }));
    if (!material || !size || !schedule || !pipeId) return { ready: false };
    material.value = 'CarbonSteel';
    fire(material);
    size.value = '4.0';
    schedule.value = 'STD';
    fire(size);
    fire(schedule);
    const initial = pipeId.value;
    pipeId.value = '4.111';
    fire(pipeId, 'input');
    const manual = pipeId.value;
    size.value = '6.0';
    fire(size);
    const afterSize = pipeId.value;
    schedule.value = 'XS';
    fire(schedule);
    const afterSchedule = pipeId.value;
    pipeId.value = '5.700';
    fire(pipeId, 'input');
    schedule.value = 'STD';
    fire(schedule);
    const afterSecondSchedule = pipeId.value;
    return { ready: true, initial, manual, afterSize, afterSchedule, afterSecondSchedule };
  })()`);
  record(
    bcoAutofill.ready &&
      Math.abs(Number(bcoAutofill.initial) - 4.026) < 0.0001 &&
      bcoAutofill.manual === '4.111' &&
      Math.abs(Number(bcoAutofill.afterSize) - 6.065) < 0.0001 &&
      Math.abs(Number(bcoAutofill.afterSchedule) - 5.761) < 0.0001 &&
      Math.abs(Number(bcoAutofill.afterSecondSchedule) - 6.065) < 0.0001,
    'BCO Pipe I.D. autofills on pipe size and schedule changes after manual override',
    JSON.stringify(bcoAutofill)
  );

  await tap(cdp, '.screen-tab[data-screen="jobs"]');
  await sleep(250);
  await tap(cdp, '.library-lane-btn[data-library-lane="shared"]');
  await sleep(1800);
  const sharedState = await evaluate(cdp, `(() => {
    const screen = document.getElementById('jobsScreen');
    const panel = document.querySelector('[data-library-lane-panel="shared"]');
    const button = document.querySelector('.library-lane-btn[data-library-lane="shared"]');
    return {
      lane: screen?.dataset.activeLane || '',
      panelActive: !!panel?.classList.contains('active'),
      panelHidden: !!panel?.hidden,
      buttonActive: !!button?.classList.contains('active')
    };
  })()`);
  record(sharedState.lane === 'shared' && sharedState.panelActive && !sharedState.panelHidden && sharedState.buttonActive, 'Library Shared lane opens', JSON.stringify(sharedState));

  const restFallbackProbe = await evaluate(cdp, `window.tapCalcFetchSharedJobsViaRest
    ? window.tapCalcFetchSharedJobsViaRest({ pageSize: 2 }).then((jobs) => ({
        available: true,
        count: jobs.length,
        firstId: jobs[0]?.id || '',
        firstSource: jobs[0]?.source || ''
      })).catch((error) => ({ available: true, count: 0, error: error?.message || String(error) }))
    : Promise.resolve({ available: false, count: 0 })`);
  record(
    restFallbackProbe.available &&
      restFallbackProbe.count > 0 &&
      restFallbackProbe.firstSource === 'cloud',
    'Shared jobs REST fallback can list Firebase jobs',
    JSON.stringify(restFallbackProbe)
  );

  const sharedRowLayout = await evaluate(cdp, `(() => {
    const rows = Array.from(document.querySelectorAll('#jobsSelect .jobs-list-item[data-job-id]'));
    const item = rows
      .find((candidate) => {
        const rect = candidate.getBoundingClientRect();
        return rect.width > 50 && rect.height > 10;
      });
    const title = item?.querySelector('.history-title');
    const time = item?.querySelector('.history-time');
    const meta = item?.querySelector('.history-meta');
    const top = item?.querySelector('.history-card-top');
    const loadButton = item?.querySelector('.history-btn.tapcalc-shared-load-btn');
    const titleStyle = title ? getComputedStyle(title) : null;
    const timeStyle = time ? getComputedStyle(time) : null;
    const metaStyle = meta ? getComputedStyle(meta) : null;
    const topStyle = top ? getComputedStyle(top) : null;
    const loadStyle = loadButton ? getComputedStyle(loadButton) : null;
    const rect = item?.getBoundingClientRect();
    const select = document.getElementById('jobsSelect');
    const selectRect = select?.getBoundingClientRect();
    const jobsPanel = document.getElementById('jobsPanel');
    const jobsPanelStyle = jobsPanel ? getComputedStyle(jobsPanel) : null;
    const detail = document.getElementById('jobsList');
    const status = document.getElementById('jobsCloudStatus');
    return {
      hasItem: !!item,
      hasHistoryCard: !!item?.classList.contains('history-card'),
      hasSharedHistoryCard: !!item?.classList.contains('tapcalc-shared-history-card'),
      itemWidth: rect ? Math.round(rect.width) : 0,
      itemHeight: rect ? Math.round(rect.height) : 0,
      itemScrollWidth: item ? Math.round(item.scrollWidth) : 0,
      titleDisplay: titleStyle?.display || '',
      topDisplay: topStyle?.display || '',
      timeDisplay: timeStyle?.display || '',
      metaDisplay: metaStyle?.display || '',
      loadDisplay: loadStyle?.display || '',
      loadText: loadButton?.textContent?.trim() || '',
      loadCanonical: loadButton?.dataset?.tapcalcLoadSelected === 'true',
      loadHasLegacyMarker: loadButton?.hasAttribute('data-load-job') || false,
      detailHasLegacyTc65Load: !!document.querySelector('#jobsLoadSelectedBtn[data-tc65-bound="true"]'),
      canonicalApiReady: typeof window.tapCalcLoadSelectedJobCanonical === 'function',
      forceUsesCanonical: window.tapCalcForceLoadSelectedJob === window.tapCalcLoadSelectedJobCanonical,
      rendererOwner: window.__tapcalcLibraryRendererOwner || '',
      titleText: title?.textContent?.trim() || '',
      timeText: time?.textContent?.trim() || '',
      metaText: meta?.textContent?.trim() || '',
      rowCount: rows.length,
      selectWidth: selectRect ? Math.round(selectRect.width) : 0,
      jobsPanelDisplay: jobsPanelStyle?.display || '',
      detailDisplay: detail ? getComputedStyle(detail).display : '',
      statusDisplay: status ? getComputedStyle(status).display : '',
      status: status?.textContent || ''
    };
  })()`);
  record(
    sharedRowLayout.hasItem &&
      sharedRowLayout.hasHistoryCard &&
      sharedRowLayout.hasSharedHistoryCard &&
      sharedRowLayout.itemWidth > 50 &&
      sharedRowLayout.itemHeight >= 50 &&
      sharedRowLayout.topDisplay === 'flex' &&
      sharedRowLayout.titleDisplay !== 'inline' &&
      sharedRowLayout.timeDisplay !== 'inline' &&
      sharedRowLayout.metaDisplay !== 'inline' &&
      sharedRowLayout.loadText === 'Load' &&
      sharedRowLayout.loadDisplay.includes('flex') &&
      sharedRowLayout.loadCanonical &&
      !sharedRowLayout.loadHasLegacyMarker &&
      !sharedRowLayout.detailHasLegacyTc65Load &&
      sharedRowLayout.canonicalApiReady &&
      sharedRowLayout.forceUsesCanonical &&
      sharedRowLayout.rendererOwner === 'mobile-reliability-shared-history' &&
      sharedRowLayout.detailDisplay === 'none' &&
      sharedRowLayout.statusDisplay === 'none' &&
      sharedRowLayout.itemScrollWidth <= sharedRowLayout.itemWidth + 1,
    'Shared job picker rows match Local history cards',
    JSON.stringify(sharedRowLayout)
  );

  const sharedVisualMatch = await evaluate(cdp, `(() => {
    const localTitle = document.querySelector('.jobs-panel-local .jobs-section-head h3');
    const sharedToggle = document.getElementById('sharedJobsToggleBtn');
    const sharedTitle = sharedToggle?.querySelector('span:first-child');
    const sharedHead = document.querySelector('.jobs-panel-shared .jobs-section-head');
    const sharedAnchor = document.getElementById('sharedJobsAnchor');
    const sharedNote = document.querySelector('.jobs-panel-shared .jobs-note');
    const sharedStatusGrid = document.querySelector('.jobs-panel-shared .jobs-status-grid');
    const sharedStatus = document.getElementById('jobsCloudStatus');
    const cloudStatusMirror = document.getElementById('jobsCloudStatusMirror');
    const sharedDetail = document.getElementById('jobsList');
    const sharedMeta = document.getElementById('jobsResultsMeta');
    const viewToggle = document.querySelector('.jobs-panel-shared .jobs-view-toggle');
    const localStyle = localTitle ? getComputedStyle(localTitle) : null;
    const sharedStyle = sharedTitle ? getComputedStyle(sharedTitle) : null;
    const buttonStyle = sharedToggle ? getComputedStyle(sharedToggle) : null;
    const headStyle = sharedHead ? getComputedStyle(sharedHead) : null;
    const anchorStyle = sharedAnchor ? getComputedStyle(sharedAnchor) : null;
    const chevronStyle = sharedToggle?.querySelector('.section-toggle-chevron')
      ? getComputedStyle(sharedToggle.querySelector('.section-toggle-chevron'))
      : null;
    const statusGridStyle = sharedStatusGrid ? getComputedStyle(sharedStatusGrid) : null;
    const statusStyle = sharedStatus ? getComputedStyle(sharedStatus) : null;
    const cloudStatusMirrorStyle = cloudStatusMirror ? getComputedStyle(cloudStatusMirror) : null;
    const detailStyle = sharedDetail ? getComputedStyle(sharedDetail) : null;
    const metaBeforeStyle = sharedMeta ? getComputedStyle(sharedMeta, '::before') : null;
    const viewStyle = viewToggle ? getComputedStyle(viewToggle) : null;
    const localFont = Number.parseFloat(localStyle?.fontSize || '0');
    const sharedFont = Number.parseFloat(sharedStyle?.fontSize || '0');
    return {
      localFont,
      sharedFont,
      buttonBackground: buttonStyle?.backgroundColor || '',
      buttonBorderTop: buttonStyle?.borderTopWidth || '',
      headBorderBottom: headStyle?.borderBottomWidth || '',
      anchorDisplay: anchorStyle?.display || '',
      chevronDisplay: chevronStyle?.display || '',
      statusGridDisplay: statusGridStyle?.display || '',
      statusDisplay: statusStyle?.display || '',
      cloudStatusMirrorDisplay: cloudStatusMirrorStyle?.display || '',
      cloudStatusMirrorText: cloudStatusMirror?.textContent?.trim() || '',
      detailDisplay: detailStyle?.display || '',
      metaBefore: metaBeforeStyle?.content || '',
      noteText: sharedNote?.textContent?.trim() || '',
      viewDisplay: viewStyle?.display || '',
      viewColumns: viewStyle?.gridTemplateColumns || ''
    };
  })()`);
  record(
    sharedVisualMatch.sharedFont > 0 &&
      sharedVisualMatch.localFont > 0 &&
      sharedVisualMatch.sharedFont <= sharedVisualMatch.localFont + 2 &&
      sharedVisualMatch.buttonBorderTop === '0px' &&
      sharedVisualMatch.headBorderBottom !== '0px' &&
      sharedVisualMatch.anchorDisplay === 'none' &&
      sharedVisualMatch.chevronDisplay === 'none' &&
      sharedVisualMatch.statusGridDisplay === 'none' &&
      sharedVisualMatch.statusDisplay === 'none' &&
      sharedVisualMatch.cloudStatusMirrorDisplay === 'none' &&
      sharedVisualMatch.detailDisplay === 'none' &&
      /Shared Job History/i.test(sharedVisualMatch.metaBefore) &&
      /^Search shared jobs/i.test(sharedVisualMatch.noteText) &&
      sharedVisualMatch.viewDisplay === 'grid',
    'Shared lane matches compact Local styling',
    JSON.stringify(sharedVisualMatch)
  );

  await evaluate(cdp, `(() => {
    const status = document.getElementById('jobsCloudStatus');
    if (!status) return false;
    status.textContent = 'Could not load shared jobs. FIRESTORE (10.12.5) INTERNAL ASSERTION FAILED: Unexpected state';
    return true;
  })()`);
  await sleep(180);
  const sanitizedSharedError = await evaluate(cdp, `(() => {
    const status = document.getElementById('jobsCloudStatus');
    const text = status?.textContent || '';
    return { text, display: status ? getComputedStyle(status).display : '' };
  })()`);
  record(
    !/INTERNAL ASSERTION FAILED|Unexpected state|FIRESTORE\s*\(/i.test(sanitizedSharedError.text) &&
      /Firebase connection hiccup|Local saved jobs/i.test(sanitizedSharedError.text) &&
      sanitizedSharedError.display === 'none',
    'Shared sync hides raw Firestore internal assertion from UI',
    JSON.stringify(sanitizedSharedError)
  );

  await tap(cdp, '.library-lane-btn[data-library-lane="local"]');
  await sleep(350);
  const localLayout = await evaluate(cdp, `(() => {
    const screen = document.getElementById('jobsScreen');
    const panel = document.querySelector('[data-library-lane-panel="local"]');
    const button = document.querySelector('.library-lane-btn[data-library-lane="local"]');
    const switcher = document.querySelector('#jobsScreen .library-lane-switch');
    const status = document.querySelector('#jobsScreen .jobs-status-strip');
    const switchRect = switcher?.getBoundingClientRect();
    const panelRect = panel?.getBoundingClientRect();
    const columns = (getComputedStyle(status).gridTemplateColumns || '').trim().split(/\\s+/).filter(Boolean).length;
    return {
      lane: screen?.dataset.activeLane || '',
      panelActive: !!panel?.classList.contains('active'),
      panelHidden: !!panel?.hidden,
      buttonActive: !!button?.classList.contains('active'),
      switchPosition: switcher ? getComputedStyle(switcher).position : '',
      switchBottom: switchRect ? Math.round(switchRect.bottom) : null,
      panelTop: panelRect ? Math.round(panelRect.top) : null,
      statusColumns: columns
    };
  })()`);
  record(localLayout.lane === 'local' && localLayout.panelActive && !localLayout.panelHidden && localLayout.buttonActive, 'Library Local lane reopens', JSON.stringify(localLayout));
  record(localLayout.statusColumns === 1, 'Library status cards stack on mobile', JSON.stringify(localLayout));
  record(localLayout.switchPosition === 'static' && localLayout.panelTop >= localLayout.switchBottom + 4, 'Library lane switch stays in flow', JSON.stringify(localLayout));

  const seededLocalJob = await evaluate(cdp, `(() => {
    return {
      historyButton: !!document.querySelector('[data-load-history="tapcalc-smoke-load"]'),
      count: JSON.parse(localStorage.getItem('measurementCardHistoryV1') || '[]').length
    };
  })()`);
  record(seededLocalJob.historyButton && seededLocalJob.count === 1, 'seeded local saved job for load test', JSON.stringify(seededLocalJob));

  await evaluate(cdp, `(() => {
    const original = window.loadRecordIntoCalculator || (typeof loadRecordIntoCalculator === 'function' ? loadRecordIntoCalculator : null);
    window.__tapcalcSmokeLoadRecordCount = 0;
    window.__tapcalcSmokeOriginalLoadRecordIntoCalculator = original;
    if (typeof original === 'function') {
      const wrapped = function(...args) {
        window.__tapcalcSmokeLoadRecordCount += 1;
        return original.apply(this, args);
      };
      window.loadRecordIntoCalculator = wrapped;
      try { loadRecordIntoCalculator = wrapped; } catch {}
    }
    return true;
  })()`);
  await tap(cdp, '[data-load-history="tapcalc-smoke-load"]');
  await sleep(900);
  const loadedLocalJob = await evaluate(cdp, `(() => ({
    activeScreen: document.body.dataset.activeScreen || '',
    jobClient: document.getElementById('jobClient')?.value || '',
    workflowClient: document.getElementById('workflowJobClient')?.value || '',
    jobDescription: document.getElementById('jobDescription')?.value || '',
    jobNumber: document.getElementById('jobNumber')?.value || '',
    status: document.getElementById('jobsCloudStatus')?.textContent || '',
    loadRecordCount: window.__tapcalcSmokeLoadRecordCount || 0
  }))()`);
  record(
    loadedLocalJob.activeScreen === 'job' &&
      loadedLocalJob.jobClient === 'Smoke Client' &&
      loadedLocalJob.jobDescription === 'Smoke Saved Job' &&
      loadedLocalJob.jobNumber === 'SMK-001' &&
      loadedLocalJob.loadRecordCount === 1,
    'Local history Load hydrates saved job once',
    JSON.stringify(loadedLocalJob)
  );

  await evaluate(cdp, `window.scrollTo(0, document.body.scrollHeight); true`);
  await sleep(150);
  await tap(cdp, '.screen-tab[data-screen="ref"]');
  await sleep(700);
  const refState = await evaluate(cdp, `(() => {
    const toggle = document.getElementById('referenceLibraryToggle');
    const rect = toggle?.getBoundingClientRect();
    return {
      scrollY: Math.round(window.scrollY),
      toggleY: rect ? Math.round(rect.y) : null,
      toggleVisible: !!rect && rect.bottom > 0 && rect.top < window.innerHeight
    };
  })()`);
  record(refState.scrollY <= 80 && refState.toggleVisible, 'Reference tab resets near top', JSON.stringify(refState));

  await tap(cdp, '.screen-tab[data-screen="card"]');
  await sleep(350);
  const workflowSelects = await evaluate(cdp, `(() => {
    const operation = document.getElementById('workflowOperationType');
    const machine = document.getElementById('workflowMachineType');
    return {
      operationOptions: operation?.options?.length || 0,
      machineOptions: machine?.options?.length || 0
    };
  })()`);
  record(workflowSelects.operationOptions > 0 && workflowSelects.machineOptions > 0, 'Workflow selects are populated', JSON.stringify(workflowSelects));

  const firestoreErrors = consoleErrors.filter((line) => /Firestore .*INTERNAL ASSERTION FAILED|Unexpected state/i.test(line));
  if (firestoreErrors.length) warn('Firestore internal assertion console errors observed', `${firestoreErrors.length}`);
  else record(true, 'no Firestore internal assertion console errors', '0');
} catch (error) {
  record(false, 'mobile smoke script error', error.stack || error.message);
} finally {
  try { cdp?.close(); } catch {}
  try { browser.kill(); } catch {}
  try { rmSync(userDataDir, { recursive: true, force: true }); } catch {}
}

const passed = results.filter((result) => result.ok).length;
console.log(`\n${passed}/${results.length} checks passed for ${base}`);
if (warnings.length) console.log(`${warnings.length} warnings`);
if (passed !== results.length) process.exit(1);
