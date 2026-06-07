/* TapCalc Dev overlay script entrypoint. Legacy patches live under dev/overlays while they are folded into the main app. */
(function(){
  const READY_FLAG = '__tapcalcDevOverlayLoaderReady';
  if (window[READY_FLAG]) return;
  window[READY_FLAG] = true;

  const BUILD = window.TAPCALC_BUILD || {};
  const VERSION = BUILD.overlayVersion || BUILD.version || '3.0.0-alpha240';
  const FILES = [
    'overlays/tapcalc-workflow-library.js',
    'overlays/tapcalc-shell-reference.js',
    'overlays/tapcalc-field-manual.js',
    'overlays/tapcalc-smartstop-reference.js',
    'overlays/tapcalc-reference-router.js'
  ];

  function loadScript(file){
    return new Promise((resolve) => {
      if (document.querySelector(`script[src*="${file}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.async = false;
      script.src = `${file}?v=${VERSION}`;
      script.onload = resolve;
      script.onerror = () => {
        console.warn(`TapCalc overlay failed to load: ${file}`);
        resolve();
      };
      document.body.appendChild(script);
    });
  }

  async function loadOverlays(){
    for (const file of FILES) {
      await loadScript(file);
    }
  }

  if (document.body) {
    loadOverlays();
  } else {
    document.addEventListener('DOMContentLoaded', loadOverlays, { once: true });
  }
})();
