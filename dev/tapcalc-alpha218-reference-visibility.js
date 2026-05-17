/* TapCalc Dev 3.0.0-alpha219: alpha218 compatibility loader */
(function(){
  window.__tapcalcAlpha218ReferenceVisibilityReady = true;
  const VERSION = window.TAPCALC_BUILD?.overlayVersion || '3.0.0-alpha219';
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
  addStylesheet('tapcalc-alpha219-reference-router.css');
  addScript('tapcalc-alpha219-reference-router.js');
})();
