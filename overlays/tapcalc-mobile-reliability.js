/* TapCalc livefix13 mobile nav/select/offline reliability guard. */
(function(){
  const READY_FLAG = '__tapcalcLivefix13ReliabilityReady';
  if (window[READY_FLAG]) return;
  window[READY_FLAG] = true;

  const screens = {
    home: 'homeScreen',
    job: 'jobScreen',
    calc: 'calcScreen',
    card: 'cardScreen',
    jobs: 'jobsScreen',
    ref: 'refScreen'
  };
  const aliases = {
    tools: 'calc',
    workflow: 'card',
    library: 'jobs',
    reference: 'ref'
  };
  const STYLE_ID = 'tapcalc-livefix13-reliability-style';

  function byId(id) {
    return document.getElementById(id);
  }

  function normalizeScreen(name) {
    const raw = String(name || '').trim();
    const next = aliases[raw] || raw;
    return screens[next] ? next : 'home';
  }

  function fireInputChange(el) {
    if (!el) return;
    try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch {}
    try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch {}
  }

  function setScreen(name, options = {}) {
    const activeScreen = normalizeScreen(name);
    document.body.dataset.activeScreen = activeScreen;
    document.body.classList.toggle('show-library-screen', activeScreen === 'jobs');

    Object.entries(screens).forEach(([key, id]) => {
      const el = byId(id);
      if (!el) return;
      const active = key === activeScreen;
      el.classList.toggle('active', active);
      el.hidden = !active;
      el.setAttribute('aria-hidden', active ? 'false' : 'true');
      el.style.display = active ? 'block' : 'none';
      el.style.visibility = active ? 'visible' : 'hidden';
      el.style.pointerEvents = active ? 'auto' : 'none';
      el.style.opacity = active ? '1' : '0';
      el.style.zIndex = active ? '2' : '0';
      el.style.position = 'relative';
    });

    document.querySelectorAll('.screen-tab[data-screen]').forEach((tab) => {
      const active = normalizeScreen(tab.dataset.screen) === activeScreen;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-pressed', active ? 'true' : 'false');
      tab.style.pointerEvents = 'auto';
    });

    try { localStorage.setItem('tapcalcV3Screen', activeScreen); } catch {}
    if (!options.silent) {
      try { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); } catch {}
    }
    if (!options.silent) {
      if (activeScreen === 'jobs') setTimeout(() => { try { window.renderJobsList?.(); } catch {} }, 40);
      if (activeScreen === 'ref') setTimeout(() => { try { window.initReferenceWorkspaceHard?.(); } catch {} }, 40);
      if (activeScreen === 'card') setTimeout(ensureWorkflowSelects, 40);
    }
    return activeScreen;
  }

  function installReliabilityStyle() {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent = `
      @media (max-width: 820px) {
        body.measurement-page .screen-nav {
          position: relative !important;
          top: auto !important;
          bottom: auto !important;
          left: auto !important;
          right: auto !important;
          z-index: 9000 !important;
          display: grid !important;
          box-sizing: border-box !important;
          width: 100% !important;
          margin: 0 0 14px !important;
          pointer-events: auto !important;
          touch-action: manipulation !important;
          isolation: isolate !important;
        }
        body.measurement-page .screen-nav .screen-tab {
          position: relative !important;
          z-index: 9001 !important;
          pointer-events: auto !important;
          touch-action: manipulation !important;
          cursor: pointer !important;
        }
        body.measurement-page select {
          pointer-events: auto !important;
          touch-action: auto !important;
          -webkit-appearance: menulist !important;
          appearance: auto !important;
        }
        body.measurement-page .screen-view.active {
          margin-top: 0 !important;
        }
        body.measurement-page .workflow-setup-field,
        body.measurement-page .row,
        body.measurement-page .converter-inline {
          pointer-events: auto !important;
        }
      }
    `;
  }

  function handleNav(event) {
    const trigger = event.target?.closest?.('.screen-tab[data-screen], [data-go-screen]');
    if (!trigger) return;
    const formControl = event.target?.closest?.('select, input, textarea, option');
    if (formControl && !trigger.classList.contains('screen-tab')) return;
    const target = trigger.dataset.goScreen || trigger.dataset.screen;
    if (!target) return;

    try { if (event.cancelable) event.preventDefault(); } catch {}
    try { event.stopPropagation(); } catch {}
    try { event.stopImmediatePropagation?.(); } catch {}
    setScreen(target);
    if (trigger.dataset.goMode) {
      setTimeout(() => { try { window.setMode?.(trigger.dataset.goMode); } catch {} }, 20);
    }
    if (trigger.dataset.libraryLaneTarget) {
      setTimeout(() => { try { window.setLibraryLane?.(trigger.dataset.libraryLaneTarget); } catch {} }, 40);
    }
    return false;
  }

  function hasOptions(select) {
    return !!select && select.options && select.options.length > 0;
  }

  function copyOptions(targetId, sourceId, fallbackOptions = []) {
    const target = byId(targetId);
    if (!target || target.tagName !== 'SELECT') return;
    const source = byId(sourceId);
    const previous = target.value || source?.value || '';
    if (source?.tagName === 'SELECT' && source.options.length) {
      const signature = source.innerHTML;
      if (target.dataset.livefix13OptionSignature !== signature) {
        target.innerHTML = signature;
        target.dataset.livefix13OptionSignature = signature;
      }
    } else if (!hasOptions(target) && fallbackOptions.length) {
      target.innerHTML = fallbackOptions.map((value) => `<option value="${value}">${value}</option>`).join('');
    }
    if (previous && Array.from(target.options).some((option) => option.value === previous)) target.value = previous;
    if (!target.value && target.options[0]) target.value = target.options[0].value;
  }

  function ensureWorkflowSelects() {
    copyOptions('workflowOperationType', 'operationType', ['Hot Tap', 'Line Stop']);
    copyOptions('workflowMachineType', 'machineType', ['412', '360 / 152', '660 / 760', '1200']);
    copyOptions('workflowJobOperationSelect', 'jobOperationSelect');
    copyOptions('workflowBcoPipeMaterial', 'bcoPipeMaterial', ['Carbon Steel', 'Stainless Steel']);
    copyOptions('workflowBcoPipeOD', 'bcoPipeOD');
    copyOptions('workflowBcoSchedule', 'bcoSchedule');
    copyOptions('workflowEtaMachine', 'etaMachine', ['360', '660', '1200']);

    const operationType = byId('workflowOperationType');
    if (operationType && !operationType.dataset.livefix13Bound) {
      operationType.dataset.livefix13Bound = '1';
      operationType.addEventListener('change', () => {
        const source = byId('operationType');
        if (source && source.value !== operationType.value) {
          source.value = operationType.value;
          fireInputChange(source);
        }
      });
    }
  }

  function markInteractiveControls() {
    document.querySelectorAll('.screen-nav, .screen-tab, select, input, textarea, label').forEach((el) => {
      el.style.pointerEvents = 'auto';
    });
  }

  function restoreSavedScreen() {
    const hash = String(window.location.hash || '').replace(/^#/, '').trim();
    if (hash === 'bco' || hash === 'eta') {
      setScreen('calc', { silent: true });
      setTimeout(() => { try { window.setMode?.(hash); } catch {} }, 20);
      return;
    }
    if (screens[hash] || aliases[hash]) {
      setScreen(hash, { silent: true });
      return;
    }
    let saved = 'home';
    try { saved = localStorage.getItem('tapcalcV3Screen') || 'home'; } catch {}
    setScreen(saved, { silent: true });
  }

  function run() {
    installReliabilityStyle();
    markInteractiveControls();
    ensureWorkflowSelects();
  }

  ['pointerdown', 'touchstart', 'click'].forEach((eventName) => {
    window.addEventListener(eventName, handleNav, { capture: true, passive: false });
  });
  document.addEventListener('input', ensureWorkflowSelects, true);
  document.addEventListener('change', ensureWorkflowSelects, true);
  document.addEventListener('DOMContentLoaded', () => { restoreSavedScreen(); run(); }, { once: true });
  window.addEventListener('load', () => { restoreSavedScreen(); run(); });
  window.addEventListener('pageshow', () => { restoreSavedScreen(); run(); });
  window.addEventListener('online', () => {
    try { navigator.serviceWorker?.ready?.then((registration) => registration.update()).catch(() => {}); } catch {}
  });

  if (document.readyState === 'loading') {
    setTimeout(run, 0);
  } else {
    restoreSavedScreen();
    run();
  }
  [0, 120, 500, 1500, 3000].forEach((delay) => setTimeout(run, delay));
  window.tapCalcEnsureLiveControls = run;
})();
