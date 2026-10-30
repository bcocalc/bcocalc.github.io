const LAUNCH_VERSION = 'launch-pre-alpha26-2';
const CACHE_NAME = 'tapcalc-cache-3.0.0-livefix21-' + LAUNCH_VERSION;
const CACHE_PREFIX = 'tapcalc-cache-';
// A partial root cache must never masquerade as a complete legacy shell.
const HOLD_HTML = '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TapCalc V.3 — recovery</title><h1>TapCalc V.3</h1><p>The offline calculator files are incomplete. Your saved jobs have not been changed. Reconnect and reload this page.</p><p><a href="./">Reload launch page</a></p><p><a href="./measurement-card.html?legacy=1&amp;v=3.0.0-livefix21#bco">Open legacy calculator directly</a></p></html>';
const holdResponse=()=>new Response(HOLD_HTML.replaceAll('href="./','href="'+new URL('./',self.location.href).href),{status:503,headers:{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'none'; style-src 'none'; base-uri 'none'; form-action 'none'",'Cache-Control':'no-store'}});
const ASSETS = [
  './',
  './index.html',
  './launch.js?v=' + LAUNCH_VERSION,
  './measurement-card.html',
  './styles.css?v=3.0.0-livefix21',
  './measurement.js?v=3.0.0-livefix21',
  './reference/cutter-sizes.js?v=3.0.0-livefix21',
  './reference/cutter-sizes.css?v=3.0.0-livefix21',
  './cloud-sync.js?v=3.0.0-livefix21',
  './tapcalc-overlays.css?v=3.0.0-livefix21',
  './tapcalc-overlays.js?v=3.0.0-livefix21',
  './overlays/tapcalc-workflow-library.css?v=3.0.0-livefix21',
  './overlays/tapcalc-workflow-library.js?v=3.0.0-livefix21',
  './overlays/tapcalc-livefix11-workflow.css?v=3.0.0-livefix21',
  './overlays/tapcalc-livefix11-workflow.js?v=3.0.0-livefix21',
  './overlays/tapcalc-shell-reference.css?v=3.0.0-livefix21',
  './overlays/tapcalc-shell-reference.js?v=3.0.0-livefix21',
  './overlays/tapcalc-field-manual.js?v=3.0.0-livefix21',
  './overlays/tapcalc-field-manual-mobile.css?v=3.0.0-livefix21',
  './overlays/tapcalc-light-mode.css?v=3.0.0-livefix21',
  './overlays/tapcalc-reference-router.css?v=3.0.0-livefix21',
  './overlays/tapcalc-reference-router.js?v=3.0.0-livefix21',
  './overlays/tapcalc-mobile-reliability.css?v=3.0.0-livefix21',
  './overlays/tapcalc-mobile-reliability.js?v=3.0.0-livefix21',
  './pdf.mjs?v=3.0.0-livefix21',
  './pdf.worker.mjs?v=3.0.0-livefix21',
  './stackup-data.js?v=3.0.0-livefix21',
  './manifest.json',
  './firebase-config.js?v=3.0.0-livefix21',
  './team-logo.png'
];

const CRITICAL = ['./','./index.html','./manifest.json','./launch.js?v='+LAUNCH_VERSION,'./measurement-card.html','./styles.css?v=3.0.0-livefix21','./measurement.js?v=3.0.0-livefix21','./firebase-config.js?v=3.0.0-livefix21','./cloud-sync.js?v=3.0.0-livefix21'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.allSettled(ASSETS.map((asset) => cache.add(new Request(asset,{cache:'no-store'})))))
      .then(() => caches.open(CACHE_NAME).then(cache=>cache.addAll(CRITICAL.map(asset=>new Request(asset,{cache:'no-store'})))))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function isShellAsset(url) {
  if (url.origin !== self.location.origin) return false;
  return (
    url.pathname === '/' ||
    url.pathname.endsWith('/index.html') ||
    url.pathname.endsWith('/measurement-card.html') ||
    url.pathname.endsWith('/styles.css') ||
    url.pathname.endsWith('/measurement.js') ||
    url.pathname.endsWith('/launch.js') ||
    url.pathname.endsWith('/cloud-sync.js') ||
    url.pathname.endsWith('/tapcalc-overlays.css') ||
    url.pathname.endsWith('/tapcalc-overlays.js') ||
    url.pathname.includes('/overlays/tapcalc-') ||
    url.pathname.endsWith('/pdf.mjs') ||
    url.pathname.endsWith('/pdf.worker.mjs') ||
    url.pathname.endsWith('/stackup-data.js') ||
    url.pathname.endsWith('/firebase-config.js') ||
    url.pathname.endsWith('/manifest.json') ||
    url.pathname.endsWith('/team-logo.png')
  );
}

function cacheFresh(request, event) {
  return fetch(request, { cache: 'no-store' }).then((response) => {
    if (response && response.ok) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)));
    }
    return response;
  });
}

async function matchCurrentCache(request) {
  const cache = await caches.open(CACHE_NAME);
  return await cache.match(request) || await cache.match(request, { ignoreSearch: true });
}

async function cacheFallback(request) {
  if(request.mode!=='navigate')return await matchCurrentCache(request)||new Response('',{status:503});
  const url=new URL(request.url),base=new URL('./',self.location.href);
  const isRoot=url.pathname===base.pathname||url.pathname===new URL('index.html',base).pathname;
  const isLegacy=url.pathname===new URL('measurement-card.html',base).pathname;
  if(!isRoot&&!isLegacy)return holdResponse();
  const cache=await caches.open(CACHE_NAME),required=isRoot?CRITICAL:CRITICAL.slice(4);
  const complete=await Promise.all(required.map(asset=>cache.match(new URL(asset,base).href)));
  if(complete.some(response=>!response?.ok))return holdResponse();
  // Read only the correct page for this route, never a different cached shell.
  return await cache.match(new URL(isRoot?'index.html':'measurement-card.html',base).href)||holdResponse();
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Existing child workers own their routes; never serve a cached legacy shell there.
  if(url.origin===self.location.origin&&(url.pathname.startsWith('/pre-alpha/')||url.pathname.startsWith('/dev/')))return;

  // Cache public shell assets and SDK files, never authenticated database reads.
  if (event.request.headers.has('Authorization')) return;
  if (url.origin !== self.location.origin && url.hostname !== 'www.gstatic.com') return;

  if (event.request.mode === 'navigate') {
    event.respondWith(cacheFresh(event.request, event).catch(() => cacheFallback(event.request)));
    return;
  }

  if (isShellAsset(url)) {
    event.respondWith(cacheFresh(event.request, event).catch(() => cacheFallback(event.request)));
    return;
  }

  event.respondWith(
    matchCurrentCache(event.request)
      .then((cached) => cached || fetch(event.request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)));
        }
        return response;
      }))
  );
});

// Read-only launch identity handshake. No job data is read or modified.
self.addEventListener('message',event=>{if(event.data?.type==='tapcalc-launch-version')event.ports?.[0]?.postMessage({version:LAUNCH_VERSION});});
