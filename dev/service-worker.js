const CACHE_NAME = 'tapcalc-dev-cache-3.0.0-alpha122';
const ASSETS = [
  "./",
  "./index.html",
  "./measurement-card.html",
  "./styles.css?v=3.0.0-alpha122",
  "./measurement.js?v=3.0.0-alpha122",
  "./script.js",
  "./manifest.json",
  "./firebase-config.js?v=3.0.0-alpha122",
  "./team-logo.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => Promise.resolve()));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((key) => key !== CACHE_NAME ? caches.delete(key) : Promise.resolve())))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isShellAsset = isSameOrigin && (
    url.pathname.endsWith('/measurement-card.html') ||
    url.pathname.endsWith('/styles.css') ||
    url.pathname.endsWith('/measurement.js') ||
    url.pathname.endsWith('/firebase-config.js') ||
    url.pathname.endsWith('/service-worker.js')
  );
  if (event.request.mode === 'navigate' || isShellAsset) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match(event.request).then((cached) => cached || caches.match('./measurement-card.html')))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    }))
  );
});
