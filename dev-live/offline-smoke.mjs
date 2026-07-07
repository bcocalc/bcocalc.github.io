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
const expectedVersion = args.get('--expect-version') || '3.0.0-devlive7';
const target = new URL('measurement-card.html', base).toString();
const results = [];

const seedLocalHistoryExpression = `(() => {
  const now = new Date().toISOString();
  const record = {
    meta: {
      title: 'Offline Smoke Saved Job',
      operationType: 'Hot Tap',
      savedAtIso: now,
      savedAtDisplay: 'Offline smoke test'
    },
    job: {
      client: 'Offline Smoke Client',
      description: 'Offline Smoke Saved Job',
      jobNumber: 'OFF-001',
      location: 'Offline Stand'
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
      jobClient: 'Offline Smoke Client',
      jobDescription: 'Offline Smoke Saved Job',
      jobNumber: 'OFF-001',
      jobLocation: 'Offline Stand',
      operationType: 'Hot Tap',
      bcoPipeOD: '4.0',
      wallThickness: '0.237'
    }
  };
  localStorage.setItem('measurementCardHistoryV1', JSON.stringify([{
    id: 'tapcalc-offline-smoke-load',
    savedAt: 'Offline smoke test',
    summary: {
      title: 'Offline Smoke Saved Job',
      pipe: '4.0',
      bco: '1.234',
      wall: '0.237',
      operationType: 'Hot Tap'
    },
    record
  }]));
  localStorage.setItem('tapcalcLibraryLaneV1', 'local');
  return true;
})()`;

function record(ok, name, detail = '') {
  results.push({ ok, name, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` - ${detail}` : ''}`);
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

const userDataDir = mkdtempSync(join(tmpdir(), 'tapcalc-offline-smoke-'));
const port = 44000 + Math.floor(Math.random() * 1000);
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
  await waitFor(cdp, `navigator.serviceWorker?.ready?.then(() => true).catch(() => false)`, 15000);
  await evaluate(cdp, `navigator.serviceWorker.ready.then(() => true)`);
  await sleep(1200);
  await evaluate(cdp, seedLocalHistoryExpression);
  await cdp.send('Page.reload', { ignoreCache: true });
  await waitFor(cdp, `!!document.querySelector('.screen-nav .screen-tab[data-screen="home"]')`, 15000);
  await sleep(1200);

  await cdp.send('Network.overrideNetworkState', {
    offline: true,
    latency: 0,
    downloadThroughput: 0,
    uploadThroughput: 0,
    connectionType: 'none'
  }).catch(() => {});
  await cdp.send('Network.emulateNetworkConditions', {
    offline: true,
    latency: 0,
    downloadThroughput: 0,
    uploadThroughput: 0
  });
  await cdp.send('Network.setBlockedURLs', {
    urls: [
      'https://www.gstatic.com/*',
      'https://*.googleapis.com/*',
      'https://identitytoolkit.googleapis.com/*',
      'https://firestore.googleapis.com/*'
    ]
  }).catch(() => {});
  await cdp.send('Page.reload', { ignoreCache: true });
  await waitFor(cdp, `!!document.querySelector('.screen-nav .screen-tab[data-screen="home"]')`, 15000);
  await sleep(1000);

  const versionText = await evaluate(cdp, `document.querySelector('.top-app-title')?.textContent || ''`);
  record(versionText.includes(expectedVersion), 'offline app shell loads cached dev-live build', versionText.trim());

  const offlineState = await evaluate(cdp, `(() => {
    const probeUrl = 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js?tapcalcOfflineProbe=' + Date.now();
    return fetch(probeUrl, { cache: 'no-store' })
      .then(() => ({
        online: navigator.onLine,
        probeBlocked: false,
        status: document.getElementById('jobsCloudStatus')?.textContent || '',
        firebase: document.getElementById('firebaseStatus')?.textContent || ''
      }))
      .catch(() => ({
        online: navigator.onLine,
        probeBlocked: true,
        status: document.getElementById('jobsCloudStatus')?.textContent || '',
        firebase: document.getElementById('firebaseStatus')?.textContent || ''
      }));
  })()`);
  record(offlineState.probeBlocked === true, 'browser network requests are blocked offline', JSON.stringify(offlineState));
  record(/offline|local history is ready/i.test(`${offlineState.status} ${offlineState.firebase}`), 'startup status stays usable offline', JSON.stringify(offlineState));

  await tap(cdp, '.screen-tab[data-screen="jobs"]');
  await sleep(400);
  await tap(cdp, '.library-lane-btn[data-library-lane="local"]');
  await sleep(500);
  const localJob = await evaluate(cdp, `(() => ({
    activeScreen: document.body.dataset.activeScreen || '',
    lane: document.getElementById('jobsScreen')?.dataset.activeLane || '',
    historyButton: !!document.querySelector('[data-load-history="tapcalc-offline-smoke-load"]'),
    count: JSON.parse(localStorage.getItem('measurementCardHistoryV1') || '[]').length
  }))()`);
  record(localJob.activeScreen === 'jobs' && localJob.lane === 'local' && localJob.historyButton && localJob.count === 1, 'local saved jobs are available offline', JSON.stringify(localJob));

  await tap(cdp, '[data-load-history="tapcalc-offline-smoke-load"]');
  await sleep(900);
  const loadedLocalJob = await evaluate(cdp, `(() => ({
    activeScreen: document.body.dataset.activeScreen || '',
    jobClient: document.getElementById('jobClient')?.value || '',
    jobDescription: document.getElementById('jobDescription')?.value || '',
    jobNumber: document.getElementById('jobNumber')?.value || ''
  }))()`);
  record(
    loadedLocalJob.activeScreen === 'job'
      && loadedLocalJob.jobClient === 'Offline Smoke Client'
      && loadedLocalJob.jobDescription === 'Offline Smoke Saved Job'
      && loadedLocalJob.jobNumber === 'OFF-001',
    'local history Load works offline',
    JSON.stringify(loadedLocalJob)
  );

  await tap(cdp, '.screen-tab[data-screen="jobs"]');
  await sleep(300);
  await tap(cdp, '.library-lane-btn[data-library-lane="shared"]');
  await sleep(3200);
  const sharedOffline = await evaluate(cdp, `(() => ({
    lane: document.getElementById('jobsScreen')?.dataset.activeLane || '',
    status: document.getElementById('jobsCloudStatus')?.textContent || '',
    firebase: document.getElementById('firebaseStatus')?.textContent || ''
  }))()`);
  record(
    sharedOffline.lane === 'shared'
      && /offline|local saved jobs|could not connect|connection failed|unavailable|longer/i.test(`${sharedOffline.status} ${sharedOffline.firebase}`),
    'Shared lane falls back cleanly offline',
    JSON.stringify(sharedOffline)
  );

  const fatalErrors = consoleErrors.filter((line) => !/Failed to load resource|ERR_INTERNET_DISCONNECTED|ERR_FAILED/i.test(line));
  record(fatalErrors.length === 0, 'no unexpected offline console errors', fatalErrors.slice(0, 3).join(' | '));
} catch (error) {
  record(false, 'offline smoke script error', error.stack || error.message);
} finally {
  try { cdp?.close(); } catch {}
  try { browser.kill(); } catch {}
  try { rmSync(userDataDir, { recursive: true, force: true }); } catch {}
}

const passed = results.filter((result) => result.ok).length;
console.log(`\n${passed}/${results.length} checks passed for ${base}`);
if (passed !== results.length) process.exit(1);
