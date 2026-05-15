/* TapCalc Dev 3.0.0-alpha202 reference tool polish */
(function(){
  const LABEL = 'TapCalc Dev v3.0.0-alpha202 - 2026-05-15';

  function updateVersionText(){
    document.querySelectorAll('.version-badge, .top-app-title').forEach((el) => {
      if (/TapCalc Dev v/i.test(el.textContent || '')) el.textContent = LABEL;
    });
  }

  function removeLegacyBoltingPdfAction(){
    document.querySelectorAll('#refScreen .reference-inline-actions a[href*="Bolting Chart.pdf"]').forEach((el) => el.remove());
  }

  function tagReferenceTools(){
    document.body.classList.add('tapcalc-alpha202');
    const converterCard = document.querySelector('#refScreen .reference-view[data-reference-view="converter"] .reference-card');
    if (converterCard) converterCard.classList.add('reference-converter-card');
  }

  function run(){
    updateVersionText();
    removeLegacyBoltingPdfAction();
    tagReferenceTools();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  [150, 500, 1200, 2200].forEach((delay) => setTimeout(run, delay));
})();
