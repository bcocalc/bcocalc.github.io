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
  const VERSION = '3.0.0-alpha201';

  function addStylesheet(){
    if (document.querySelector('link[href*="tapcalc-alpha201.css"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `tapcalc-alpha201.css?v=${VERSION}`;
    document.head.appendChild(link);
  }

  function addScript(){
    if (document.querySelector('script[src*="tapcalc-alpha201.js"]')) return;
    const script = document.createElement('script');
    script.src = `tapcalc-alpha201.js?v=${VERSION}`;
    document.body.appendChild(script);
  }

  function loadAlpha201Overlay(){
    addStylesheet();
    addScript();
  }

  if (document.readyState === 'complete') {
    setTimeout(loadAlpha201Overlay, 0);
  } else {
    window.addEventListener('load', loadAlpha201Overlay, { once: true });
  }
})();
