/* TapCalc Dev 3.0.0-alpha203 reference tool polish + mobile top nav */
(function(){
  const LABEL = 'TapCalc Dev v3.0.0-alpha203 - 2026-05-15';
  const MOBILE_NAV_STYLE_ID = 'tapcalc-mobile-top-nav-style';

  function updateVersionText(){
    document.querySelectorAll('.version-badge, .top-app-title').forEach((el) => {
      if (/TapCalc/i.test(el.textContent || '')) el.textContent = LABEL;
    });
  }

  function removeLegacyBoltingPdfAction(){
    document.querySelectorAll('#refScreen .reference-inline-actions a[href*="Bolting Chart.pdf"]').forEach((el) => el.remove());
  }

  function tagReferenceTools(){
    document.body.classList.add('tapcalc-alpha203');
    const converterCard = document.querySelector('#refScreen .reference-view[data-reference-view="converter"] .reference-card');
    if (converterCard) converterCard.classList.add('reference-converter-card');
  }

  function installMobileTopNav(){
    if (document.getElementById(MOBILE_NAV_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = MOBILE_NAV_STYLE_ID;
    style.textContent = `
      @media (max-width: 820px) {
        html { scroll-padding-top: calc(96px + env(safe-area-inset-top, 0px)); }
        body.measurement-page {
          padding-top: calc(86px + env(safe-area-inset-top, 0px)) !important;
          padding-bottom: 12px !important;
        }
        body.measurement-page .screen-nav {
          position: fixed !important;
          top: max(8px, env(safe-area-inset-top, 0px)) !important;
          bottom: auto !important;
          left: max(10px, env(safe-area-inset-left, 0px)) !important;
          right: max(10px, env(safe-area-inset-right, 0px)) !important;
          z-index: 12000 !important;
          display: grid !important;
          grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
          gap: 6px !important;
          width: auto !important;
          margin: 0 !important;
          padding: 8px !important;
          border: 1px solid rgba(140, 176, 214, 0.28) !important;
          border-radius: 0 0 16px 16px !important;
          background: rgba(8, 26, 48, 0.97) !important;
          box-shadow: 0 14px 32px rgba(0, 0, 0, 0.32) !important;
          backdrop-filter: blur(10px);
        }
        body.measurement-page .top-app-bar {
          top: calc(74px + env(safe-area-inset-top, 0px)) !important;
        }
        body.measurement-page .screen-view.active {
          padding-bottom: 16px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function run(){
    updateVersionText();
    removeLegacyBoltingPdfAction();
    tagReferenceTools();
    installMobileTopNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  [150, 500, 1200, 2200].forEach((delay) => setTimeout(run, delay));
})();