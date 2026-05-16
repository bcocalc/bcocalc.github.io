window.TAPCALC_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBth_tthBmg3o_VEJ3NgKlSj1coXIcHvSo",
  authDomain: "tapcalc-afc92.firebaseapp.com",
  projectId: "tapcalc-afc92",
  storageBucket: "tapcalc-afc92.firebasestorage.app",
  messagingSenderId: "730117208452",
  appId: "1:730117208452:web:688fe41c7b9eef7c8545d1"
};

window.TAPCALC_FIREBASE_COLLECTION = window.TAPCALC_FIREBASE_COLLECTION || 'tapcalcJobs';
window.TAPCALC_BUILD = Object.assign({
  channel: 'dev',
  version: '3.0.0-alpha210',
  label: 'TapCalc Dev v3.0.0-alpha210 - 2026-05-16',
  overlayVersion: '3.0.0-alpha210',
  serviceWorkerVersion: '3.0.0-alpha210',
  syncPill: 'DEV'
}, window.TAPCALC_BUILD || {});

(function(){
  const BUILD = window.TAPCALC_BUILD || {};
  const VERSION = BUILD.overlayVersion || BUILD.version || '3.0.0-alpha210';
  const OVERLAYS = [
    { css: 'tapcalc-alpha201.css', js: 'tapcalc-alpha201.js' },
    { css: 'tapcalc-alpha202.css', js: 'tapcalc-alpha202.js' }
  ];

  function addStylesheet(file){
    if (document.querySelector(`link[href*="${file}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${file}?v=${VERSION}`;
    document.head.appendChild(link);
  }

  function addScript(file){
    if (document.querySelector(`script[src*="${file}"]`)) return;
    const script = document.createElement('script');
    script.async = false;
    script.src = `${file}?v=${VERSION}`;
    document.body.appendChild(script);
  }

  function loadTapCalcOverlays(){
    OVERLAYS.forEach((overlay) => addStylesheet(overlay.css));
    OVERLAYS.forEach((overlay) => addScript(overlay.js));
  }

  function registerFreshServiceWorker(){
    if (!('serviceWorker' in navigator)) return;
    const swVersion = BUILD.serviceWorkerVersion || VERSION;
    navigator.serviceWorker
      .register(`service-worker.js?v=${swVersion}`, { updateViaCache: 'none' })
      .then((registration) => registration.update())
      .catch(() => {});
  }

  function bootTapCalcShell(){
    loadTapCalcOverlays();
    registerFreshServiceWorker();
  }

  if (document.readyState === 'complete') {
    setTimeout(bootTapCalcShell, 0);
  } else {
    window.addEventListener('load', bootTapCalcShell, { once: true });
  }
})();
