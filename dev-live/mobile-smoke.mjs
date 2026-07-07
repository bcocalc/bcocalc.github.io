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
const expectedVersion = args.get('--expect-version') || '3.0.0-devlive3';
const target = new URL('measurement-card.html', base).toString();
const results = [];
const warnings = [];

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

  await tap(cdp, '.screen-tab[data-screen="jobs"]');
  await sleep(250);
  await tap(cdp, '.library-lane-btn[data-library-lane="shared"]');
  await sleep(700);
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
