const CACHE_NAME = 'tapcalc-dev-cache-3.0.0-alpha246';
const CACHE_PREFIX = 'tapcalc-dev-cache-';
const SHELL_FALLBACK = './measurement-card.html';
const ASSETS = [
  './',
  './index.html',
  './measurement-card.html',
  './styles.css?v=3.0.0-alpha246',
  './measurement.js?v=3.0.0-alpha246',
  './tapcalc-dev-overlays.css?v=3.0.0-alpha246',
  './tapcalc-dev-overlays.js?v=3.0.0-alpha246',
  './overlays/tapcalc-workflow-library.css?v=3.0.0-alpha246',
  './overlays/tapcalc-workflow-library.js?v=3.0.0-alpha246',
  './overlays/tapcalc-livefix11-workflow.css?v=3.0.0-alpha246',
  './overlays/tapcalc-livefix11-workflow.js?v=3.0.0-alpha246',
  './overlays/tapcalc-shell-reference.css?v=3.0.0-alpha246',
  './overlays/tapcalc-shell-reference.js?v=3.0.0-alpha246',
  './overlays/tapcalc-field-manual.js?v=3.0.0-alpha246',
  './overlays/tapcalc-field-manual-mobile.css?v=3.0.0-alpha246',
  './overlays/tapcalc-smartstop-reference.css?v=3.0.0-alpha246',
  './overlays/tapcalc-smartstop-reference.js?v=3.0.0-alpha246',
  './overlays/tapcalc-folding-head-reference.css?v=3.0.0-alpha246',
  './overlays/tapcalc-folding-head-reference.js?v=3.0.0-alpha246',
  './overlays/tapcalc-light-mode.css?v=3.0.0-alpha246',
  './overlays/tapcalc-reference-router.css?v=3.0.0-alpha246',
  './overlays/tapcalc-reference-router.js?v=3.0.0-alpha246',
  './overlays/tapcalc-mobile-reliability.css?v=3.0.0-alpha246',
  './overlays/tapcalc-mobile-reliability.js?v=3.0.0-alpha246',
  './overlays/tapcalc-workflow-browse.css?v=3.0.0-alpha246',
  './overlays/tapcalc-workflow-browse.js?v=3.0.0-alpha246',
  './pdf.mjs?v=3.0.0-alpha246',
  './pdf.worker.mjs?v=3.0.0-alpha246',
  './stackup-data.js?v=3.0.0-alpha246',
  './script.js',
  './manifest.json',
  './firebase-config.js?v=3.0.0-alpha246',
  './team-logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.allSettled(ASSETS.map((asset) => cache.add(asset))))
      .then(() => self.skipWaiting())
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
    url.pathname === '/dev/' ||
    url.pathname.endsWith('/dev/index.html') ||
    url.pathname.endsWith('/dev/measurement-card.html') ||
    url.pathname.endsWith('/dev/styles.css') ||
    url.pathname.endsWith('/dev/measurement.js') ||
    url.pathname.endsWith('/dev/tapcalc-dev-overlays.css') ||
    url.pathname.endsWith('/dev/tapcalc-dev-overlays.js') ||
    url.pathname.includes('/dev/overlays/tapcalc-') ||
    url.pathname.endsWith('/dev/pdf.mjs') ||
    url.pathname.endsWith('/dev/pdf.worker.mjs') ||
    url.pathname.endsWith('/dev/stackup-data.js') ||
    url.pathname.endsWith('/dev/firebase-config.js') ||
    url.pathname.endsWith('/dev/manifest.json') ||
    url.pathname.endsWith('/dev/team-logo.png') ||
    url.pathname.endsWith('/dev/script.js')
  );
}

function cacheFresh(request) {
  return fetch(request, { cache: 'no-store' }).then((response) => {
    if (response && response.ok) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
    }
    return response;
  });
}

async function matchCurrentCache(request) {
  const cache = await caches.open(CACHE_NAME);
  return await cache.match(request) || await cache.match(request, { ignoreSearch: true });
}

async function cacheFallback(request) {
  const cached = await matchCurrentCache(request);
  if (cached) return cached;
  if (request.mode === 'navigate') return matchCurrentCache(SHELL_FALLBACK);
  return Response.error();
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Cache public shell assets and SDK files, never authenticated database reads.
  if (event.request.headers.has('Authorization')) return;
  if (url.origin !== self.location.origin && url.hostname !== 'www.gstatic.com') return;

  if (event.request.mode === 'navigate') {
    event.respondWith(cacheFresh(event.request).catch(() => cacheFallback(event.request)));
    return;
  }

  if (isShellAsset(url)) {
    event.respondWith(cacheFresh(event.request).catch(() => cacheFallback(event.request)));
    return;
  }

  event.respondWith(
    matchCurrentCache(event.request)
      .then((cached) => cached || fetch(event.request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      }))
  );
});
