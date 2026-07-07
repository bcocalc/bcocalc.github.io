const CACHE_NAME = 'tapcalc-dev-live-cache-3.0.0-devlive13';
const SHELL_FALLBACK = './measurement-card.html';
const ASSETS = [
  './',
  './index.html',
  './measurement-card.html',
  './styles.css?v=3.0.0-devlive13',
  './measurement.js?v=3.0.0-devlive13',
  './tapcalc-overlays.css?v=3.0.0-devlive13',
  './tapcalc-overlays.js?v=3.0.0-devlive13',
  './overlays/tapcalc-workflow-library.css?v=3.0.0-devlive13',
  './overlays/tapcalc-workflow-library.js?v=3.0.0-devlive13',
  './overlays/tapcalc-livefix11-workflow.css?v=3.0.0-devlive13',
  './overlays/tapcalc-livefix11-workflow.js?v=3.0.0-devlive13',
  './overlays/tapcalc-shell-reference.css?v=3.0.0-devlive13',
  './overlays/tapcalc-shell-reference.js?v=3.0.0-devlive13',
  './overlays/tapcalc-field-manual.js?v=3.0.0-devlive13',
  './overlays/tapcalc-field-manual-mobile.css?v=3.0.0-devlive13',
  './overlays/tapcalc-light-mode.css?v=3.0.0-devlive13',
  './overlays/tapcalc-reference-router.css?v=3.0.0-devlive13',
  './overlays/tapcalc-reference-router.js?v=3.0.0-devlive13',
  './overlays/tapcalc-mobile-reliability.css?v=3.0.0-devlive13',
  './overlays/tapcalc-mobile-reliability.js?v=3.0.0-devlive13',
  '../pdf.mjs?v=3.0.0-devlive13',
  '../pdf.worker.mjs?v=3.0.0-devlive13',
  './stackup-data.js?v=3.0.0-devlive13',
  './manifest.json',
  './firebase-config.js?v=3.0.0-devlive13',
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
      .then((keys) => Promise.all(keys.map((key) => key === CACHE_NAME ? Promise.resolve() : caches.delete(key))))
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

function cacheFresh(request) {
  return fetch(request, { cache: 'no-store' }).then((response) => {
    if (response && response.ok) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
    }
    return response;
  });
}

function cacheFallback(request) {
  return caches.match(request)
    .then((cached) => cached || caches.match(request, { ignoreSearch: true }))
    .then((cached) => cached || caches.match(SHELL_FALLBACK))
    .then((cached) => cached || caches.match(SHELL_FALLBACK, { ignoreSearch: true }));
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (event.request.mode === 'navigate') {
    event.respondWith(cacheFresh(event.request).catch(() => cacheFallback(event.request)));
    return;
  }

  if (isShellAsset(url)) {
    event.respondWith(cacheFresh(event.request).catch(() => cacheFallback(event.request)));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cached) => cached || caches.match(event.request, { ignoreSearch: true }))
      .then((cached) => cached || fetch(event.request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      }))
  );
});
