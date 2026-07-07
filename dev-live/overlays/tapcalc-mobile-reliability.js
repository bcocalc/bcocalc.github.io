/* TapCalc livefix14 mobile nav/select/offline reliability guard. */
(function(){
  const READY_FLAG = '__tapcalcLivefix14ReliabilityReady';
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
  const STYLE_ID = 'tapcalc-livefix14-reliability-style';
  const LEGACY_LOAD_BUTTON_SELECTOR = '#jobsLoadSelectedBtn, #jobsLoadSelectedBtnFinal, #jobsLoadSelectedBtnMobileCanonical, #jobsLoadSelectedBtnMobile114, [data-load-job]';
  const CANONICAL_LOAD_BUTTON_SELECTOR = '.tapcalc-load-selected-job-btn[data-tapcalc-load-selected="true"]';
  const legacySetLibraryLane = typeof window.setLibraryLane === 'function' ? window.setLibraryLane.bind(window) : null;
  const legacyOpenSharedLibraryLane = typeof window.openSharedLibraryLane === 'function' ? window.openSharedLibraryLane.bind(window) : null;
  let loadGuardUntil = 0;

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

  function keepReferenceEntryVisible() {
    const reset = () => {
      if (normalizeScreen(document.body.dataset.activeScreen) !== 'ref') return;
      const root = document.scrollingElement || document.documentElement;
      const refScreen = byId('refScreen');
      try { if (refScreen) refScreen.scrollTop = 0; } catch {}
      try { if (root) root.scrollTop = 0; } catch {}
      try { document.body.scrollTop = 0; } catch {}
      try { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); } catch {}
    };
    [0, 60, 180, 420].forEach((delay) => setTimeout(reset, delay));
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
      if (activeScreen === 'ref') {
        keepReferenceEntryVisible();
        setTimeout(() => { try { window.initReferenceWorkspaceHard?.(); } catch {} }, 40);
      }
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
          position: sticky !important;
          top: max(0px, env(safe-area-inset-top)) !important;
          bottom: auto !important;
          left: auto !important;
          right: auto !important;
          z-index: 9000 !important;
          display: grid !important;
          box-sizing: border-box !important;
          width: 100% !important;
          margin: 0 0 14px !important;
          padding-top: 8px !important;
          padding-bottom: 10px !important;
          background: #081a30 !important;
          border-bottom: 1px solid rgba(142, 190, 244, 0.16) !important;
          border-top: 0 !important;
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
    if (normalizeScreen(target) === 'ref') keepReferenceEntryVisible();
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
      if (target.dataset.livefix14OptionSignature !== signature) {
        target.innerHTML = signature;
        target.dataset.livefix14OptionSignature = signature;
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
    if (operationType && !operationType.dataset.livefix14Bound) {
      operationType.dataset.livefix14Bound = '1';
      operationType.addEventListener('change', () => {
        const source = byId('operationType');
        if (source && source.value !== operationType.value) {
          source.value = operationType.value;
          fireInputChange(source);
        }
      });
    }
  }

  function applyLibraryLane(lane, options = {}) {
    const next = String(lane || '').trim() === 'shared' ? 'shared' : 'local';
    document.querySelectorAll('.library-lane-btn[data-library-lane]').forEach((button) => {
      const active = button.dataset.libraryLane === next;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    document.querySelectorAll('[data-library-lane-panel]').forEach((panel) => {
      const active = panel.dataset.libraryLanePanel === next;
      panel.classList.toggle('active', active);
      panel.classList.remove('collapsed');
      panel.hidden = !active;
      panel.setAttribute('aria-hidden', active ? 'false' : 'true');
      panel.style.display = active ? 'block' : 'none';
      panel.style.visibility = active ? 'visible' : 'hidden';
      panel.style.opacity = active ? '1' : '0';
      panel.style.pointerEvents = active ? 'auto' : 'none';
      panel.querySelectorAll('.accordion-body').forEach((body) => {
        body.style.display = active ? 'block' : '';
      });
    });
    const jobsScreen = byId('jobsScreen');
    if (jobsScreen) {
      jobsScreen.dataset.activeLane = next;
      jobsScreen.style.pointerEvents = 'auto';
    }
    try { localStorage.setItem('tapcalcLibraryLaneV1', next); } catch {}
    if (next === 'shared') {
      setTimeout(() => { try { window.renderJobsList?.(); } catch {} }, 20);
      if (!options.skipCloudLoad) {
        setTimeout(() => { try { window.loadCloudJobs?.(); } catch {} }, 40);
      }
      setTimeout(() => { try { window.renderJobsList?.(); } catch {} }, 180);
    } else {
      setTimeout(() => { try { window.renderJobsList?.(); } catch {} }, 20);
    }
    return next;
  }

  function openLibraryLane(lane) {
    const next = applyLibraryLane(lane);
    if (normalizeScreen(document.body.dataset.activeScreen) !== 'jobs') {
      setScreen('jobs', { silent: true });
    }
    return next;
  }

  function installCanonicalLibraryApi() {
    if (legacySetLibraryLane && !window.tapCalcLegacySetLibraryLane) {
      window.tapCalcLegacySetLibraryLane = legacySetLibraryLane;
    }
    if (legacyOpenSharedLibraryLane && !window.tapCalcLegacyOpenSharedLibraryLane) {
      window.tapCalcLegacyOpenSharedLibraryLane = legacyOpenSharedLibraryLane;
    }
    window.setLibraryLane = (lane) => applyLibraryLane(lane);
    window.openSharedLibraryLane = () => openLibraryLane('shared');
    window.tapCalcOpenLibrary = (lane = 'local') => openLibraryLane(lane);
  }

  function handleLibraryLane(event) {
    const button = event.target?.closest?.('.library-lane-btn[data-library-lane]');
    if (!button) return;
    try { if (event.cancelable) event.preventDefault(); } catch {}
    try { event.stopPropagation(); } catch {}
    try { event.stopImmediatePropagation?.(); } catch {}
    const lane = button.dataset.libraryLane === 'shared' ? 'shared' : 'local';
    [0, 80, 240].forEach((delay) => setTimeout(() => applyLibraryLane(lane), delay));
    return false;
  }

  function setLoadStatus(message) {
    const status = byId('jobsCloudStatus') || byId('jobsCloudStatusMirror') || byId('bcoStatus');
    if (status && message) status.textContent = message;
  }

  function hideLegacyLoadDebug() {
    ['mobileLoadDebugTop', 'mobileLoadDebugPanel'].forEach((id) => {
      const el = byId(id);
      if (!el) return;
      el.hidden = true;
      el.style.display = 'none';
    });
  }

  function getHistoryItems() {
    try {
      const parsed = JSON.parse(localStorage.getItem('measurementCardHistoryV1') || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function getDisplayJobs() {
    try {
      return typeof window.getCombinedJobsForDisplay === 'function' ? (window.getCombinedJobsForDisplay() || []) : [];
    } catch {
      return [];
    }
  }

  function syncSelectedJobId(id) {
    const value = String(id || '').trim();
    if (!value) return;
    try { selectedJobId = value; } catch {}
    window.selectedJobId = value;
    window.__tapcalcLibrarySelectedId = value;
    window.__tapcalcSelectedJobId = value;
    document.querySelectorAll('#jobsSelect .jobs-list-item[data-job-id]').forEach((item) => {
      const active = String(item.dataset.jobId || '') === value;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', active ? 'true' : 'false');
      item.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  function resolveHistoryRecord(button) {
    const id = String(button?.dataset?.loadHistory || '').trim();
    if (!id) return null;
    const item = getHistoryItems().find((entry) => String(entry?.id || '') === id);
    if (!item) return null;
    return {
      id,
      source: 'local-history',
      record: item.record || { state: item.state || {} }
    };
  }

  function resolveSelectedRecord(button = null) {
    const historyRecord = resolveHistoryRecord(button);
    if (historyRecord?.record) return historyRecord;

    const jobs = getDisplayJobs();
    const ids = [
      button?.dataset?.jobId,
      document.querySelector('#jobsSelect .jobs-list-item.active[data-job-id]')?.dataset?.jobId,
      document.querySelector('#jobsSelect .jobs-list-item[aria-pressed="true"][data-job-id]')?.dataset?.jobId,
      document.querySelector('#jobsSelect .jobs-list-item[aria-selected="true"][data-job-id]')?.dataset?.jobId,
      window.__tapcalcLibrarySelectedId,
      window.__tapcalcSelectedJobId,
      window.selectedJobId,
      (() => { try { return selectedJobId; } catch { return ''; } })()
    ].map((value) => String(value || '').trim()).filter(Boolean);

    for (const id of ids) {
      const match = jobs.find((job) => String(job?.id || '') === id);
      if (match?.record) return { id: match.id, source: match.source || 'library', record: match.record };
    }

    const selected = window.__tapcalcVisibleDetailRecord || window.__tapcalcVisibleLibraryRecord || window.__tapcalcLibrarySelectedRecord || null;
    return selected ? { id: ids[0] || 'visible', source: 'visible-detail', record: selected } : null;
  }

  function openLoadedJobScreen() {
    try { setScreen('job', { silent: true }); } catch {}
    try { window.tapCalcSetScreen?.('job'); } catch {}
    try { document.querySelector('.screen-tab[data-screen="job"]')?.click(); } catch {}
  }

  function loadSelectedJob(event) {
    if (event) {
      try { if (event.cancelable) event.preventDefault(); } catch {}
      try { event.stopPropagation(); } catch {}
      try { event.stopImmediatePropagation?.(); } catch {}
    }
    const now = Date.now();
    if (now < loadGuardUntil) return false;
    loadGuardUntil = now + 950;

    const button = event?.target?.closest?.(`${CANONICAL_LOAD_BUTTON_SELECTOR}, [data-load-history]`) || null;
    const selected = resolveSelectedRecord(button);
    if (!selected?.record) {
      setLoadStatus('Select a job first.');
      loadGuardUntil = 0;
      return false;
    }

    syncSelectedJobId(selected.id);
    try {
      if (typeof window.loadRecordIntoCalculator === 'function') {
        window.loadRecordIntoCalculator(selected.record, { switchScreen: true, skipPersist: false, message: true });
      } else if (typeof loadRecordIntoCalculator === 'function') {
        loadRecordIntoCalculator(selected.record, { switchScreen: true, skipPersist: false, message: true });
      }
      try { window.tapCalcApplyLoadedJobWorkflow?.(selected.record); } catch {}
      try { window.tapCalcRestoreOperationBundle?.(selected.record, { focus: true }); } catch {}
      openLoadedJobScreen();
      const title = selected.record?.meta?.title || selected.record?.job?.description || selected.record?.job?.jobNumber || 'selected job';
      setLoadStatus(`Loaded ${title}.`);
    } catch (error) {
      console.error('TapCalc canonical load failed', error);
      setLoadStatus('Load Job failed. See console.');
      loadGuardUntil = 0;
    }
    setTimeout(() => { loadGuardUntil = 0; }, 1000);
    return false;
  }

  function normalizeLoadButtons() {
    hideLegacyLoadDebug();
    document.querySelectorAll(LEGACY_LOAD_BUTTON_SELECTOR).forEach((button) => {
      if (button.dataset.tapcalcCanonicalizedLoad === 'true') return;
      const replacement = document.createElement('button');
      replacement.type = 'button';
      replacement.className = `${button.className || 'secondary-btn'} tapcalc-load-selected-job-btn`.trim();
      replacement.dataset.tapcalcLoadSelected = 'true';
      if (button.dataset.jobId) replacement.dataset.jobId = button.dataset.jobId;
      replacement.textContent = (button.textContent || 'Load Job').trim() || 'Load Job';
      replacement.setAttribute('aria-label', button.getAttribute('aria-label') || replacement.textContent);
      button.replaceWith(replacement);
    });
  }

  function handleLoadJob(event) {
    const target = event.target?.closest?.(`${CANONICAL_LOAD_BUTTON_SELECTOR}, [data-load-history]`);
    if (!target) return;
    return loadSelectedJob(event);
  }

  function installCanonicalLoadApi() {
    normalizeLoadButtons();
    window.tapCalcLoadSelectedJobCanonical = loadSelectedJob;
    window.tapCalcForceLoadSelectedJob = loadSelectedJob;
    window.tapCalcLibraryLoadSelected = loadSelectedJob;
    window.loadSelectedLibraryJob = loadSelectedJob;
    if (!window.__tapcalcCanonicalLoadObserver) {
      window.__tapcalcCanonicalLoadObserver = new MutationObserver(() => normalizeLoadButtons());
      window.__tapcalcCanonicalLoadObserver.observe(document.body || document.documentElement, { childList: true, subtree: true });
    }
  }

  function markInteractiveControls() {
    document.querySelectorAll('.screen-nav, .screen-tab, .library-lane-switch, .library-lane-btn, select, input, textarea, label').forEach((el) => {
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
    installCanonicalLibraryApi();
    installCanonicalLoadApi();
    installReliabilityStyle();
    markInteractiveControls();
    ensureWorkflowSelects();
  }

  ['pointerdown', 'touchstart', 'click'].forEach((eventName) => {
    window.addEventListener(eventName, handleLibraryLane, { capture: true, passive: false });
    window.addEventListener(eventName, handleNav, { capture: true, passive: false });
    window.addEventListener(eventName, handleLoadJob, { capture: true, passive: false });
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
  window.tapCalcForceLibraryLane = applyLibraryLane;
  window.tapCalcKeepReferenceEntryVisible = keepReferenceEntryVisible;
})();
