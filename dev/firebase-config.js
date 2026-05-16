window.TAPCALC_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBth_tthBmg3o_VEJ3NgKlSj1coXIcHvSo",
  authDomain: "tapcalc-afc92.firebaseapp.com",
  projectId: "tapcalc-afc92",
  storageBucket: "tapcalc-afc92.firebasestorage.app",
  messagingSenderId: "730117208452",
  appId: "1:730117208452:web:688fe41c7b9eef7c8545d1"
};

window.TAPCALC_FIREBASE_COLLECTION = window.TAPCALC_FIREBASE_COLLECTION || 'tapcalcJobs';

(function(){
  const VERSION = '3.0.0-alpha206';
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

  function loadDevOverlays(){
    OVERLAYS.forEach((overlay) => addStylesheet(overlay.css));
    OVERLAYS.forEach((overlay) => addScript(overlay.js));
  }

  if (document.readyState === 'complete') {
    setTimeout(loadDevOverlays, 0);
  } else {
    window.addEventListener('load', loadDevOverlays, { once: true });
  }
})();
