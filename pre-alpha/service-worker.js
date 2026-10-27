const BUILD = 'pre-alpha11';
const PREFIX = 'tapcalc-pre-alpha-';
const CACHE = PREFIX + BUILD;
const scope = new URL('./', self.location.href);
const ASSETS = ['./','./index.html','./workspace.css?v='+BUILD,'./workspace.mjs?v='+BUILD,'./workspace-store.mjs?v='+BUILD,'./workspace-database.mjs?v='+BUILD,'./model.mjs?v='+BUILD,'./review.mjs?v='+BUILD,'./presentation.mjs?v='+BUILD,'./help.mjs?v='+BUILD,'./eta.mjs?v='+BUILD,'./eta-view.mjs?v='+BUILD,'./auxiliary.mjs?v='+BUILD,'./references.mjs?v='+BUILD,'./reference-data.mjs?v='+BUILD,'./reference-supplement-data.mjs?v='+BUILD,'./reference-helpers.mjs?v='+BUILD,'./pipe-data.mjs?v='+BUILD,'./firebase-config.js?v='+BUILD];
self.addEventListener('install', event => event.waitUntil(
  caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())
));
self.addEventListener('activate', event => event.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())
));
self.addEventListener('fetch', event => {
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
  if(!ASSETS.some(asset=>new URL(asset,scope).pathname===url.pathname))return;
  event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{
    if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));}
    return response;
  }).catch(async()=>{
    const cached=await caches.open(CACHE);
    return await cached.match(event.request,{ignoreSearch:true})||Response.error();
  }));
});
