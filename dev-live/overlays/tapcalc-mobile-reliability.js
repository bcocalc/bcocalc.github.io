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
  const RAW_SHARED_SYNC_ERROR_PATTERN = /INTERNAL ASSERTION FAILED|Unexpected state|FIRESTORE\s*\(/i;
  const legacySetLibraryLane = typeof window.setLibraryLane === 'function' ? window.setLibraryLane.bind(window) : null;
  const legacyOpenSharedLibraryLane = typeof window.openSharedLibraryLane === 'function' ? window.openSharedLibraryLane.bind(window) : null;
  let loadGuardUntil = 0;
  let sharedLoadTimer = 0;
  let sharedFallbackTimer = 0;
  let sharedHistoryRenderBusy = false;

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

    const jobsPanel = byId('jobsPanel');
    if (jobsPanel && activeScreen === 'jobs') {
      jobsPanel.classList.add('active');
      jobsPanel.hidden = false;
      jobsPanel.style.display = 'block';
      jobsPanel.style.visibility = 'visible';
      jobsPanel.style.pointerEvents = 'auto';
      jobsPanel.style.opacity = '1';
    }

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
      scheduleSharedHistoryRender([45]);
      if (!options.skipCloudLoad) {
        requestSharedJobsLoad('library-lane');
      }
      setTimeout(() => { try { window.renderJobsList?.(); } catch {} }, 180);
      scheduleSharedHistoryRender([220, 520]);
    } else {
      updateOfflineStatus();
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
    if (status && message) status.textContent = sanitizeSharedStatusText(message);
  }

  function isOffline() {
    return typeof navigator !== 'undefined' && navigator.onLine === false;
  }

  function setCloudStatus(message, firebaseLabel = '') {
    const safeMessage = sanitizeSharedStatusText(message);
    ['jobsCloudStatus', 'jobsCloudStatusMirror'].forEach((id) => {
      const el = byId(id);
      if (el && safeMessage) el.textContent = safeMessage;
    });
    ['firebaseStatus', 'firebaseStatusMirror'].forEach((id) => {
      const el = byId(id);
      if (el && firebaseLabel) el.textContent = firebaseLabel;
    });
    hideCloudStatusMirror();
  }

  function isRawSharedSyncError(value) {
    return RAW_SHARED_SYNC_ERROR_PATTERN.test(String(value || ''));
  }

  function friendlySharedSyncMessage(value = '') {
    const text = String(value?.message || value || '');
    if (isRawSharedSyncError(text)) {
      return 'Shared sync hit a Firebase connection hiccup. Local saved jobs still work; retry Shared when service is stable.';
    }
    if (/offline|internet|network|failed to fetch|unavailable|timeout/i.test(text)) {
      return 'Shared sync unavailable. Local saved jobs still work; retry when service returns.';
    }
    return 'Shared sync unavailable. Local saved jobs still work; retry when service returns.';
  }

  function sanitizeSharedStatusText(message) {
    const text = String(message || '');
    if (!text) return text;
    return isRawSharedSyncError(text) ? friendlySharedSyncMessage(text) : text;
  }

  function scrubSharedStatus() {
    ['jobsCloudStatus', 'jobsCloudStatusMirror'].forEach((id) => {
      const el = byId(id);
      if (!el) return;
      const safe = sanitizeSharedStatusText(el.textContent || '');
      if (safe && safe !== el.textContent) el.textContent = safe;
    });
    ['firebaseStatus', 'firebaseStatusMirror'].forEach((id) => {
      const el = byId(id);
      if (el && isRawSharedSyncError(el.textContent || '')) el.textContent = 'Connection hiccup';
    });
    hideCloudStatusMirror();
  }

  function hideCloudStatusMirror() {
    const mirror = byId('jobsCloudStatusMirror');
    if (!mirror) return;
    mirror.hidden = true;
    mirror.setAttribute('aria-hidden', 'true');
    mirror.style.display = 'none';
    mirror.style.visibility = 'hidden';
  }

  function normalizeSharedPanelCopy() {
    const note = document.querySelector('#jobsScreen .jobs-panel-shared .jobs-note');
    if (note) note.textContent = 'Search shared jobs, then tap a card to view and open it.';
    const toggle = byId('sharedJobsToggleBtn');
    if (toggle) {
      toggle.setAttribute('aria-label', 'Shared Jobs');
      toggle.setAttribute('aria-expanded', 'true');
    }
    const content = byId('sharedJobsContent');
    if (content) content.hidden = false;
  }

  function installSharedStatusSanitizer() {
    if (window.__tapcalcSharedStatusSanitizerReady) return;
    window.__tapcalcSharedStatusSanitizerReady = true;
    const observer = new MutationObserver(() => scrubSharedStatus());
    ['jobsCloudStatus', 'jobsCloudStatusMirror', 'firebaseStatus', 'firebaseStatusMirror'].forEach((id) => {
      const el = byId(id);
      if (el) observer.observe(el, { childList: true, characterData: true, subtree: true });
    });
    window.__tapcalcSharedStatusSanitizerObserver = observer;
    scrubSharedStatus();
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  }

  function activeSharedLane() {
    const screen = byId('jobsScreen');
    const panel = document.querySelector('[data-library-lane-panel="shared"]');
    return screen?.dataset?.activeLane === 'shared' || !!panel?.classList.contains('active');
  }

  function jobTitle(record = {}) {
    return record?.meta?.title || record?.job?.description || record?.job?.jobDescription || record?.job?.jobNumber || 'Saved Job';
  }

  function jobTime(record = {}) {
    return record?.meta?.savedAtDisplay || record?.job?.date || record?.savedAt || '';
  }

  function jobSourceLabel(source = '') {
    if (source === 'local') return 'Local only';
    if (source === 'synced') return 'Synced';
    return 'Shared DB';
  }

  function jobMetaParts(entry = {}) {
    const record = entry.record || {};
    const operation = record?.meta?.operationType || record?.state?.operationType || 'Job';
    const bco = record?.calculations?.bco || record?.summary?.bco || '';
    const wall = record?.pipe?.wallThickness || record?.state?.wallThickness || '';
    const parts = [operation];
    if (bco) parts.push(`BCO ${bco}`);
    if (wall) parts.push(`Wall ${wall}`);
    parts.push(jobSourceLabel(entry.source));
    return parts;
  }

  function renderSharedHistoryPicker() {
    if (!activeSharedLane()) return false;
    const list = byId('jobsSelect');
    if (!list) return false;
    if (sharedHistoryRenderBusy) return false;
    sharedHistoryRenderBusy = true;
    const jobs = getDisplayJobs();
    const previousScrollTop = list.scrollTop;
    const selectedId = String(
      window.__tapcalcLibrarySelectedId ||
      window.__tapcalcSelectedJobId ||
      window.selectedJobId ||
      (() => { try { return selectedJobId; } catch { return ''; } })() ||
      ''
    );

    list.classList.add('tapcalc-shared-history-list');
    list.setAttribute('aria-label', 'Shared job history');

    const meta = byId('jobsResultsMeta');
    if (meta) {
      meta.classList.add('tapcalc-shared-history-head');
      meta.textContent = `${jobs.length} job${jobs.length === 1 ? '' : 's'} found`;
    }

    const details = byId('jobsList');
    if (details) {
      details.classList.add('tapcalc-shared-detail-hidden');
      details.setAttribute('aria-hidden', 'true');
    }

    if (!jobs.length) {
      list.innerHTML = '<div class="jobs-library-empty">No shared jobs match this search yet.</div>';
      sharedHistoryRenderBusy = false;
      return true;
    }

    list.innerHTML = jobs.map((entry, index) => {
      const id = String(entry.id || `shared-${index}`);
      const record = entry.record || {};
      const active = id === selectedId;
      const client = record?.job?.client || '';
      const location = record?.job?.location || '';
      const subtitle = [client, location, jobTime(record)].filter(Boolean).join(' | ');
      return `
        <div class="jobs-list-item tapcalc-shared-history-card history-card${active ? ' active' : ''}" role="listitem" tabindex="0" data-job-id="${escapeHtml(id)}" aria-selected="${active ? 'true' : 'false'}" aria-pressed="${active ? 'true' : 'false'}">
          <div class="history-card-top">
            <div class="tapcalc-shared-history-copy">
              <div class="history-title jobs-list-title">${escapeHtml(jobTitle(record))}</div>
              <div class="history-time jobs-list-time">${escapeHtml(subtitle || jobTime(record) || 'Shared job')}</div>
            </div>
            <div class="history-actions">
              <button type="button" class="history-btn tapcalc-load-selected-job-btn tapcalc-shared-load-btn" data-tapcalc-load-selected="true" data-load-job="true" data-job-id="${escapeHtml(id)}">Load</button>
            </div>
          </div>
          <div class="history-meta jobs-list-meta">
            ${jobMetaParts(entry).map((part) => `<span>${escapeHtml(part)}</span>`).join('')}
          </div>
        </div>
      `;
    }).join('');

    list.querySelectorAll('.tapcalc-shared-history-card[data-job-id]').forEach((row) => {
      const select = (event) => {
        if (event?.target?.closest?.('button')) return;
        try { event?.preventDefault?.(); } catch {}
        const id = String(row.dataset.jobId || '');
        if (!id) return;
        syncSelectedJobId(id);
        list.querySelectorAll('.tapcalc-shared-history-card[data-job-id]').forEach((candidate) => {
          const active = String(candidate.dataset.jobId || '') === id;
          candidate.classList.toggle('active', active);
          candidate.setAttribute('aria-pressed', active ? 'true' : 'false');
          candidate.setAttribute('aria-selected', active ? 'true' : 'false');
        });
      };
      row.addEventListener('click', select);
      row.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') select(event);
      });
    });

    list.scrollTop = previousScrollTop;
    sharedHistoryRenderBusy = false;
    return true;
  }

  function scheduleSharedHistoryRender(delays = [0, 120, 360]) {
    delays.forEach((delay) => setTimeout(renderSharedHistoryPicker, delay));
  }

  function installSharedHistoryRenderer() {
    if (window.__tapcalcSharedHistoryRendererReady) return;
    window.__tapcalcSharedHistoryRendererReady = true;
    const previousRenderJobsList = typeof window.renderJobsList === 'function' ? window.renderJobsList.bind(window) : null;
    if (previousRenderJobsList) {
      window.renderJobsList = function tapcalcSharedHistoryRenderJobsList(...args) {
        const result = previousRenderJobsList(...args);
        setTimeout(renderSharedHistoryPicker, 0);
        return result;
      };
      try { renderJobsList = window.renderJobsList; } catch {}
    }
    document.addEventListener('input', (event) => {
      if (event.target?.id === 'jobsSearchInput') setTimeout(renderSharedHistoryPicker, 0);
    }, true);
    document.addEventListener('click', (event) => {
      if (event.target?.closest?.('.jobs-view-chip')) setTimeout(renderSharedHistoryPicker, 40);
    }, true);
    const list = byId('jobsSelect');
    if (list) {
      const observer = new MutationObserver(() => {
        if (sharedHistoryRenderBusy || !activeSharedLane()) return;
        if (list.querySelector('.tapcalc-shared-history-card')) return;
        if (!list.querySelector('.jobs-list-item[data-job-id]')) return;
        scheduleSharedHistoryRender([0, 80]);
      });
      observer.observe(list, { childList: true, subtree: true });
      window.__tapcalcSharedHistoryListObserver = observer;
    }
    scheduleSharedHistoryRender([0, 120, 500]);
  }

  function updateOfflineStatus() {
    if (isOffline()) {
      setCloudStatus('Offline mode. Local saved jobs still work; Shared reconnects when service returns.', 'Offline mode');
      return true;
    }
    const jobsScreen = byId('jobsScreen');
    const sharedActive = jobsScreen?.dataset?.activeLane === 'shared'
      || !!document.querySelector('[data-library-lane-panel="shared"].active');
    if (!sharedActive) {
      setCloudStatus('Local history is ready. Open Shared to connect to the shared job database.', 'Not connected');
    }
    return false;
  }

  function requestSharedJobsLoad(reason = 'shared') {
    if (isOffline()) {
      updateOfflineStatus();
      try { window.renderJobsList?.(); } catch {}
      return false;
    }
    setCloudStatus('Connecting to shared job database...', 'Connecting...');
    clearTimeout(sharedLoadTimer);
    clearTimeout(sharedFallbackTimer);
    sharedFallbackTimer = setTimeout(() => {
      const status = byId('jobsCloudStatus');
      if (status && /connecting/i.test(status.textContent || '')) {
        setCloudStatus('Shared sync is taking longer than expected. Local saved jobs still work.', 'Connection slow');
      }
    }, 2500);
    sharedLoadTimer = setTimeout(() => {
      try {
        const result = window.loadCloudJobs?.({ reason });
        Promise.resolve(result)
          .catch((error) => {
            setCloudStatus(friendlySharedSyncMessage(error), 'Connection failed');
            return [];
          })
          .finally(() => {
            clearTimeout(sharedFallbackTimer);
            scrubSharedStatus();
            scheduleSharedHistoryRender([0, 120, 360]);
          });
      } catch (error) {
        clearTimeout(sharedFallbackTimer);
        setCloudStatus(friendlySharedSyncMessage(error), 'Connection failed');
        scheduleSharedHistoryRender([0, 120, 360]);
      }
    }, 40);
    return true;
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

  function getSharedCloudCount() {
    return getDisplayJobs().filter((entry) => ['cloud', 'shared'].includes(String(entry?.source || '').toLowerCase())).length;
  }

  function getJobsCollectionNameSafe() {
    try {
      if (typeof getJobsCollectionName === 'function') return getJobsCollectionName();
    } catch {}
    return window.TAPCALC_FIREBASE_COLLECTION || 'tapcalcJobs';
  }

  function encodeFirestorePath(path = '') {
    return String(path || '').split('/').filter(Boolean).map((part) => encodeURIComponent(part)).join('/');
  }

  function readFirestoreValue(value) {
    if (!value || typeof value !== 'object') return undefined;
    if ('stringValue' in value) return value.stringValue;
    if ('integerValue' in value) return Number(value.integerValue);
    if ('doubleValue' in value) return Number(value.doubleValue);
    if ('booleanValue' in value) return Boolean(value.booleanValue);
    if ('timestampValue' in value) return value.timestampValue;
    if ('nullValue' in value) return null;
    if ('arrayValue' in value) return (value.arrayValue.values || []).map(readFirestoreValue);
    if ('mapValue' in value) {
      const output = {};
      Object.entries(value.mapValue.fields || {}).forEach(([key, child]) => {
        output[key] = readFirestoreValue(child);
      });
      return output;
    }
    return undefined;
  }

  function firestoreDocumentToRecord(documentRecord, id = '') {
    const output = {};
    Object.entries(documentRecord?.fields || {}).forEach(([key, value]) => {
      output[key] = readFirestoreValue(value);
    });
    const documentId = id || String(documentRecord?.name || '').split('/').pop() || '';
    if (documentId) {
      output.id = documentId;
      output.__cloudId = documentId;
    }
    return output;
  }

  async function fetchSharedJobsViaRest(options = {}) {
    const config = window.TAPCALC_FIREBASE_CONFIG || {};
    const projectId = String(config.projectId || '').trim();
    const apiKey = String(config.apiKey || '').trim();
    const collectionName = getJobsCollectionNameSafe();
    if (!projectId || typeof fetch !== 'function') return [];

    const pageSize = Math.max(1, Math.min(Number(options.pageSize || 100) || 100, 300));
    const baseUrl =
      `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}` +
      `/databases/(default)/documents/${encodeFirestorePath(collectionName)}`;
    const entries = [];
    let pageToken = '';
    let page = 0;

    do {
      const params = new URLSearchParams({ pageSize: String(pageSize) });
      if (apiKey) params.set('key', apiKey);
      if (pageToken) params.set('pageToken', pageToken);
      const response = await fetch(`${baseUrl}?${params.toString()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Firestore REST shared jobs read failed (${response.status})`);
      const payload = await response.json();
      (payload.documents || []).forEach((documentRecord) => {
        const id = String(documentRecord?.name || '').split('/').pop() || '';
        entries.push({
          source: 'cloud',
          id,
          record: firestoreDocumentToRecord(documentRecord, id)
        });
      });
      pageToken = payload.nextPageToken || '';
      page += 1;
    } while (pageToken && page < 10);

    return entries;
  }

  function installRestCloudJobsMerger() {
    if (window.__tapcalcRestCloudJobsMergerReady) return;
    const previousGetCombinedJobs = typeof window.getCombinedJobsForDisplay === 'function'
      ? window.getCombinedJobsForDisplay.bind(window)
      : null;
    if (!previousGetCombinedJobs) return;
    window.__tapcalcRestCloudJobsMergerReady = true;
    window.getCombinedJobsForDisplay = function tapcalcRestMergedCombinedJobsForDisplay(...args) {
      const baseList = previousGetCombinedJobs(...args) || [];
      const restList = Array.isArray(window.__tapcalcRestCloudJobsCache) ? window.__tapcalcRestCloudJobsCache : [];
      if (!restList.length) return baseList;
      const map = new Map();
      [...restList, ...baseList].forEach((entry) => {
        const key = String(entry?.id || entry?.record?.__cloudId || entry?.record?.id || '');
        if (key && !map.has(key)) map.set(key, entry);
      });
      return Array.from(map.values());
    };
  }

  function applyRestSharedJobs(jobs = []) {
    window.__tapcalcRestCloudJobsCache = jobs;
    let assigned = false;
    try {
      cloudJobsCache = jobs;
      assigned = true;
    } catch {}
    if (!assigned) installRestCloudJobsMerger();
    try { window.renderJobsList?.(); } catch {}
    try { if (typeof updateUnsyncedCount === 'function') updateUnsyncedCount(); } catch {}
    scheduleSharedHistoryRender([0, 120, 360]);
  }

  async function loadSharedJobsViaRestFallback(reason = 'fallback') {
    try {
      const jobs = await fetchSharedJobsViaRest();
      applyRestSharedJobs(jobs);
      const projectId = window.TAPCALC_FIREBASE_CONFIG?.projectId || 'unknown project';
      setCloudStatus(`Loaded ${jobs.length} shared job${jobs.length === 1 ? '' : 's'} from ${getJobsCollectionNameSafe()} (${projectId}).`, `Connected to ${projectId}`);
      return jobs;
    } catch (error) {
      console.warn(`Shared jobs REST fallback failed (${reason})`, error);
      setCloudStatus(friendlySharedSyncMessage(error), 'Connection failed');
      scheduleSharedHistoryRender([0, 120, 360]);
      return [];
    }
  }

  async function maybeLoadSharedJobsViaRest(reason = 'fallback') {
    const statusText = [
      byId('jobsCloudStatus')?.textContent || '',
      byId('jobsCloudStatusMirror')?.textContent || ''
    ].join(' ');
    const shouldFallback = getSharedCloudCount() === 0 || /could not load|unavailable|connection hiccup|failed|timeout|unexpected state/i.test(statusText);
    if (!shouldFallback || isOffline()) return [];
    return loadSharedJobsViaRestFallback(reason);
  }

  window.tapCalcFetchSharedJobsViaRest = fetchSharedJobsViaRest;
  window.tapCalcLoadSharedJobsViaRestFallback = loadSharedJobsViaRestFallback;

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

  function installOfflineCloudGuard() {
    const previousLoadCloudJobs = window.tapCalcLegacyLoadCloudJobs
      || (typeof window.loadCloudJobs === 'function' ? window.loadCloudJobs.bind(window) : null);
    if (previousLoadCloudJobs && !window.tapCalcLegacyLoadCloudJobs) {
      window.tapCalcLegacyLoadCloudJobs = previousLoadCloudJobs;
    }
    window.loadCloudJobs = async function guardedLoadCloudJobs(...args) {
      if (isOffline()) {
        updateOfflineStatus();
        try { window.renderJobsList?.(); } catch {}
        return [];
      }
      if (!previousLoadCloudJobs) return loadSharedJobsViaRestFallback('no-sdk-loader');
      try {
        const result = await previousLoadCloudJobs(...args);
        scrubSharedStatus();
        await maybeLoadSharedJobsViaRest('after-sdk-load');
        scheduleSharedHistoryRender([0, 120, 360]);
        return result;
      } catch (error) {
        console.warn('Shared jobs load unavailable', error);
        const fallbackJobs = await loadSharedJobsViaRestFallback('sdk-error');
        if (!fallbackJobs.length) setCloudStatus(friendlySharedSyncMessage(error), 'Connection failed');
        try { window.renderJobsList?.(); } catch {}
        scheduleSharedHistoryRender([0, 120, 360]);
        return fallbackJobs;
      }
    };
    try { loadCloudJobs = window.loadCloudJobs; } catch {}

    const previousEnsureFirebaseReady = window.tapCalcLegacyEnsureFirebaseReady
      || (typeof window.ensureFirebaseReady === 'function' ? window.ensureFirebaseReady.bind(window) : null);
    if (previousEnsureFirebaseReady && !window.tapCalcLegacyEnsureFirebaseReady) {
      window.tapCalcLegacyEnsureFirebaseReady = previousEnsureFirebaseReady;
    }
    window.ensureFirebaseReady = function guardedEnsureFirebaseReady(options = {}) {
      if (!options.forceRetry && isOffline()) {
        updateOfflineStatus();
        return Promise.resolve({ enabled: false, offline: true });
      }
      if (!previousEnsureFirebaseReady) return Promise.resolve({ enabled: false });
      return Promise.resolve(previousEnsureFirebaseReady(options))
        .then((result) => {
          scrubSharedStatus();
          return result;
        })
        .catch((error) => {
          console.warn('Firebase ready guard recovered', error);
          setCloudStatus(friendlySharedSyncMessage(error), 'Connection failed');
          return { enabled: false, error };
        });
    };
    try { ensureFirebaseReady = window.ensureFirebaseReady; } catch {}
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
    installOfflineCloudGuard();
    installSharedStatusSanitizer();
    installSharedHistoryRenderer();
    normalizeSharedPanelCopy();
    updateOfflineStatus();
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
    const jobsScreen = byId('jobsScreen');
    if (jobsScreen?.dataset?.activeLane === 'shared') requestSharedJobsLoad('online');
    else updateOfflineStatus();
  });
  window.addEventListener('offline', updateOfflineStatus);

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
