/* TapCalc Dev 3.0.0-alpha201 overlay */
(function(){
  const HISTORY_KEY = 'measurementCardHistoryV1';
  const SAVE_STATE_KEY = 'tapcalcWorkflowSaveStateV1';
  const DRAFT_UPDATED_KEY = 'measurementCardDraftUpdatedAtV1';
  const WORKFLOW_STAGE_KEY = 'tapcalcWorkflowStageV2';
  const MODE_STAGES = new Set(['hotTap', 'lineStop', 'completionPlug']);
  const STAGE_META = {
    setup: { short: 'Job Setup' },
    pipe: { short: 'Pipe / Cutter' },
    hotTap: { short: 'Hot Tap' },
    lineStop: { short: 'Line Stop' },
    completionPlug: { short: 'Completion Plug' },
    review: { short: 'Review' }
  };
  const SAVE_COPY = {
    draft: { label: 'Draft Only', copy: 'This job is auto-saved as a draft on this device.' },
    local: { label: 'Saved Local', copy: 'This job has been saved to the local Library on this device.' },
    synced: { label: 'Synced Shared', copy: 'This job has been saved locally and uploaded to the shared Library.' },
    error: { label: 'Save Issue', copy: 'The last shared sync was not verified.' },
    empty: { label: 'No Draft', copy: 'Open Workflow to start, or load a recent local save below.' }
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function safeParse(raw, fallback) {
    try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
  }

  function readJson(key, fallback) {
    try { return safeParse(localStorage.getItem(key), fallback); } catch { return fallback; }
  }

  function text(value) {
    return String(value ?? '').trim();
  }

  function fieldValue(id) {
    const el = byId(id);
    if (!el) return '';
    return text('value' in el ? el.value : el.textContent);
  }

  function meaningful(value) {
    const next = text(value);
    return !!next && next !== '-' && next !== '?' && next !== '0.0000' && next !== '0.000' && !/^not ready$/i.test(next);
  }

  function getJobType() {
    const value = text(fieldValue('operationType') || fieldValue('workflowOperationType') || 'Hot Tap').toLowerCase();
    return value.includes('line stop') || value.includes('completion') ? 'Line Stop' : 'Hot Tap';
  }

  function getStages() {
    return getJobType() === 'Line Stop'
      ? ['setup', 'pipe', 'hotTap', 'lineStop', 'completionPlug', 'review']
      : ['setup', 'pipe', 'hotTap', 'review'];
  }

  function activeStage() {
    const stages = getStages();
    let stage = window.__tapCalcWorkflowStage || '';
    try { stage = stage || localStorage.getItem(WORKFLOW_STAGE_KEY) || ''; } catch {}
    return stages.includes(stage) ? stage : stages[0];
  }

  function textReady(id) {
    const value = fieldValue(id);
    if (id === 'summaryPipe' && /^OD\s+0(?:\.0+)?\s*\|\s*Wall\s+0(?:\.0+)?$/i.test(value)) return false;
    return meaningful(value);
  }

  function missingIf(list, condition, label) {
    if (!condition) list.push(label);
  }

  function stageStatus(stage) {
    const statusMap = {
      hotTap: fieldValue('workflowStatusHotTap') || 'Not Ready',
      lineStop: fieldValue('workflowStatusLineStop') || 'Not Ready',
      completionPlug: fieldValue('workflowStatusCompletionPlug') || 'Not Ready'
    };
    if (statusMap[stage]) return statusMap[stage];
    const state = requirement(stage);
    return state.missing.length ? (state.started ? 'In Progress' : 'Waiting') : 'Ready';
  }

  function requirement(stage) {
    const pipeReady = textReady('summaryPipe');
    const cutterReady = textReady('summaryCutter');
    const bcoReady = textReady('summaryBco');
    const machineReady = !!fieldValue('machineType');
    const geometryReady = pipeReady && cutterReady && bcoReady;
    const state = { missing: [], started: false };

    if (stage === 'setup') {
      missingIf(state.missing, !!fieldValue('jobClient'), 'Customer');
      missingIf(state.missing, !!fieldValue('jobLocation'), 'Location');
      missingIf(state.missing, machineReady, 'Machine');
      state.started = ['jobClient', 'jobLocation', 'jobDescription', 'jobNumber', 'jobTechnician', 'machineType'].some((id) => !!fieldValue(id));
      return state;
    }
    if (stage === 'pipe') {
      missingIf(state.missing, pipeReady, 'Pipe size / wall');
      missingIf(state.missing, cutterReady, 'Cutter O.D.');
      missingIf(state.missing, bcoReady, 'BCO result');
      state.started = pipeReady || cutterReady || bcoReady;
      return state;
    }
    if (stage === 'hotTap') {
      missingIf(state.missing, machineReady, 'Machine');
      missingIf(state.missing, geometryReady, 'Pipe / Cutter / BCO');
      missingIf(state.missing, !!fieldValue('md'), 'MD');
      missingIf(state.missing, !!fieldValue('ptc'), 'PTC');
      missingIf(state.missing, !!fieldValue('mt'), 'Machine travel');
      missingIf(state.missing, textReady('ttd'), 'Hot Tap output');
      state.started = ['md', 'ld', 'ptc', 'mt'].some((id) => !!fieldValue(id));
      return state;
    }
    if (stage === 'lineStop') {
      const variant = typeof window.getLineStopVariant === 'function' ? window.getLineStopVariant() : 'standard';
      missingIf(state.missing, machineReady, 'Machine');
      if (variant !== 'htp') missingIf(state.missing, geometryReady, 'Pipe / Cutter / BCO');
      if (variant === 'htp') {
        missingIf(state.missing, !!fieldValue('htpPipeSize'), 'HTP pipe size');
        missingIf(state.missing, !!fieldValue('htpMd'), 'HTP MD');
        missingIf(state.missing, !!fieldValue('htpPtc'), 'HTP PTC');
        missingIf(state.missing, textReady('htpTco'), 'HTP output');
      } else if (variant === 'hiStop') {
        missingIf(state.missing, !!fieldValue('hsMd'), 'MD');
        missingIf(state.missing, !!fieldValue('hsRl'), 'RL');
        missingIf(state.missing, !!fieldValue('hsCl'), 'CL');
        missingIf(state.missing, !!fieldValue('hsRcd'), 'RCD');
        missingIf(state.missing, !!fieldValue('hsPb'), 'PB');
        missingIf(state.missing, !!fieldValue('hsPtp'), 'PTP');
        missingIf(state.missing, textReady('hsPlugSet'), 'Hi-Stop output');
      } else {
        missingIf(state.missing, !!fieldValue('lsMd'), 'MD');
        missingIf(state.missing, textReady('lsLiManual'), 'Lower-in output');
      }
      state.started = ['lsMd', 'lsLd', 'lsLiManual', 'htpMd', 'hsMd'].some((id) => !!fieldValue(id));
      return state;
    }
    if (stage === 'completionPlug') {
      missingIf(state.missing, machineReady, 'Machine');
      missingIf(state.missing, geometryReady, 'Pipe / Cutter / BCO');
      missingIf(state.missing, !!fieldValue('cpStart'), 'Start');
      missingIf(state.missing, !!fieldValue('cpJbf'), 'JBF');
      missingIf(state.missing, !!fieldValue('cpPt'), 'PT');
      missingIf(state.missing, textReady('cpLiManual'), 'Completion output');
      state.started = ['cpStart', 'cpJbf', 'cpLd', 'cpPt'].some((id) => !!fieldValue(id));
      return state;
    }
    if (stage === 'review') {
      state.missing = getStages().filter((item) => MODE_STAGES.has(item) && stageStatus(item) !== 'Ready').map((item) => STAGE_META[item].short);
    }
    return state;
  }

  function showGate(stage, state) {
    const notice = byId('workflowGateNotice');
    if (!notice) return;
    const label = STAGE_META[stage]?.short || 'This step';
    notice.textContent = `Finish ${label} before continuing: ${(state?.missing || []).join(', ')}.`;
    notice.dataset.state = 'blocked';
    notice.hidden = false;
    try { notice.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch {}
  }

  function clearGate() {
    const notice = byId('workflowGateNotice');
    if (!notice) return;
    notice.hidden = true;
    notice.textContent = '';
    delete notice.dataset.state;
  }

  function decorateStageNav() {
    const stages = getStages();
    const current = activeStage();
    const currentIndex = Math.max(0, stages.indexOf(current));
    stages.forEach((stage, index) => {
      const chip = document.querySelector(`#workflowStageNav [data-workflow-stage="${stage}"]`);
      if (!chip) return;
      const locked = index > currentIndex && stages.slice(currentIndex, index).some((priorStage) => requirement(priorStage).missing.length);
      chip.dataset.stageLocked = locked ? 'true' : 'false';
      const label = chip.querySelector('em');
      if (locked && label) label.textContent = 'Locked';
    });
  }

  function guardTarget(targetStage) {
    const stages = getStages();
    const current = activeStage();
    const currentIndex = stages.indexOf(current);
    const targetIndex = stages.indexOf(targetStage);
    if (targetIndex <= currentIndex || current === 'review') {
      clearGate();
      decorateStageNav();
      return true;
    }
    for (let index = currentIndex; index < targetIndex; index += 1) {
      const stage = stages[index];
      const state = requirement(stage);
      if (!state.missing.length) continue;
      window.__tapcalcAlpha201BlockedModeUntil = Date.now() + 700;
      if (stage !== current && typeof window.__tapcalcAlpha201OriginalSetStage === 'function') {
        window.__tapcalcAlpha201OriginalSetStage(stage, { skipSetMode: true });
      }
      const refresh = () => {
        showGate(stage, state);
        decorateStageNav();
      };
      refresh();
      setTimeout(refresh, 120);
      setTimeout(refresh, 320);
      return false;
    }
    clearGate();
    decorateStageNav();
    return true;
  }

  function installWorkflowGuard() {
    if (typeof window.tapCalcSetWorkflowStage === 'function' && !window.tapCalcSetWorkflowStage.__alpha201Guarded) {
      const original = window.tapCalcSetWorkflowStage;
      window.__tapcalcAlpha201OriginalSetStage = original;
      const wrapped = function(stage, opts = {}) {
        const stages = getStages();
        const target = stages.includes(stage) ? stage : stages[0];
        if (opts && opts.guard === false) return original.call(this, target, opts);
        if (!guardTarget(target)) return false;
        const result = original.call(this, target, opts);
        setTimeout(decorateStageNav, 20);
        return result;
      };
      wrapped.__alpha201Guarded = true;
      window.tapCalcSetWorkflowStage = wrapped;
    }

    if (typeof window.tapCalcWorkflowGo === 'function' && !window.tapCalcWorkflowGo.__alpha201Guarded) {
      const originalGo = window.tapCalcWorkflowGo;
      const wrappedGo = function(stage) {
        const stages = getStages();
        const target = stages.includes(stage) ? stage : activeStage();
        if (!guardTarget(target)) return false;
        return originalGo.call(this, target);
      };
      wrappedGo.__alpha201Guarded = true;
      window.tapCalcWorkflowGo = wrappedGo;
    }

    if (typeof window.setMode === 'function' && !window.setMode.__alpha201Guarded) {
      const originalMode = window.setMode;
      const wrappedMode = function(mode, ...args) {
        if (Date.now() < Number(window.__tapcalcAlpha201BlockedModeUntil || 0) && MODE_STAGES.has(String(mode || ''))) {
          return false;
        }
        return originalMode.call(this, mode, ...args);
      };
      wrappedMode.__alpha201Guarded = true;
      window.setMode = wrappedMode;
    }
    decorateStageNav();
  }

  function ensureLibraryMarkup() {
    if (byId('jobsResumeCard')) return;
    const statusStrip = document.querySelector('#jobsScreen .jobs-status-strip');
    if (!statusStrip) return;
    const section = document.createElement('section');
    section.className = 'jobs-quick-resume';
    section.setAttribute('aria-label', 'Quick resume and recent jobs');
    section.innerHTML = `
      <article class="jobs-resume-card" id="jobsResumeCard" data-state="empty">
        <div class="jobs-resume-copy">
          <span class="jobs-mini-label">Current Draft</span>
          <strong id="jobsResumeTitle">No active draft</strong>
          <span id="jobsResumeMeta" class="jobs-mini-note">Open Workflow to start, or load a recent local save below.</span>
        </div>
        <div class="jobs-resume-side">
          <span class="workflow-save-state-pill" id="jobsResumeStatus" data-state="draft">Draft Only</span>
          <span id="jobsResumeOperations" class="jobs-mini-note">0 operations</span>
          <button type="button" id="jobsResumeOpenBtn" data-go-screen="card">Open Workflow</button>
        </div>
      </article>
      <article class="jobs-recent-card">
        <div class="jobs-recent-head">
          <div>
            <span class="jobs-mini-label">Recent Local Saves</span>
            <strong>Pick up fast</strong>
          </div>
          <button type="button" id="jobsRecentViewAllBtn" class="secondary-btn">View All</button>
        </div>
        <div id="jobsRecentList" class="jobs-recent-list">No local saves yet.</div>
      </article>`;
    statusStrip.parentNode.insertBefore(section, statusStrip);
  }

  function updateVersionText() {
    const label = 'TapCalc Dev v3.0.0-alpha201 - 2026-05-15';
    document.querySelectorAll('.version-badge, .top-app-title').forEach((el) => {
      if (/TapCalc Dev v/i.test(el.textContent || '')) el.textContent = label;
    });
  }

  function historyItems() {
    try {
      if (typeof window.getHistory === 'function') {
        const items = window.getHistory();
        if (Array.isArray(items)) return items;
      }
    } catch {}
    const parsed = readJson(HISTORY_KEY, []);
    return Array.isArray(parsed) ? parsed : [];
  }

  function hasDraftPayload(payload) {
    if (!payload || typeof payload !== 'object') return false;
    const shared = payload.sharedState || {};
    if (['jobClient', 'jobDescription', 'jobNumber', 'jobLocation', 'jobTechnician', 'machineType'].some((key) => meaningful(shared[key]))) return true;
    const operations = Array.isArray(payload.operations) ? payload.operations : [];
    if (operations.length > 1) return true;
    return operations.some((operation, index) => {
      if (meaningful(operation?.notes)) return true;
      const label = text(operation?.label);
      if (label && label !== `Hot Tap ${index + 1}`) return true;
      const opState = operation?.state || {};
      return ['bcoPipeOD', 'bcoPipeID', 'bcoCutterOD', 'md', 'ld', 'ptc', 'mt', 'lsMd', 'cpStart', 'etaBco'].some((key) => meaningful(opState[key]));
    });
  }

  function visibleDraftExists() {
    return ['jobClient', 'jobLocation', 'jobDescription', 'jobNumber', 'jobTechnician', 'machineType', 'bcoCutterOD', 'md', 'ptc'].some((id) => meaningful(fieldValue(id)));
  }

  function timeLabel(iso) {
    const value = text(iso);
    if (!value) return '';
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return value;
  }

  function dateTimeLabel(iso) {
    const value = text(iso);
    if (!value) return '';
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    return value;
  }

  function draftSummary() {
    const stateKey = typeof window.JOB_STATE_KEY === 'string' ? window.JOB_STATE_KEY : 'measurementCardStateV1';
    const payload = readJson(stateKey, null);
    const saved = readJson(SAVE_STATE_KEY, {}) || {};
    const exists = hasDraftPayload(payload) || visibleDraftExists();
    const status = exists && SAVE_COPY[saved.state] ? saved.state : (exists ? 'draft' : 'empty');
    const customer = fieldValue('jobClient') || payload?.sharedState?.jobClient || '';
    const location = fieldValue('jobLocation') || payload?.sharedState?.jobLocation || '';
    const description = fieldValue('jobDescription') || payload?.sharedState?.jobDescription || '';
    const jobNumber = fieldValue('jobNumber') || payload?.sharedState?.jobNumber || '';
    const label = [customer || description, location].filter(Boolean).join(' - ') || 'Current draft';
    const count = Number(saved.operationCount) || (Array.isArray(payload?.operations) ? payload.operations.length : 1) || 1;
    let updatedAt = saved.syncedAtIso || saved.savedAtIso || saved.updatedAtIso || '';
    try { updatedAt = updatedAt || localStorage.getItem(DRAFT_UPDATED_KEY) || ''; } catch {}
    return { exists, status, label: exists ? (saved.label || (jobNumber ? `${label} (${jobNumber})` : label)) : 'No active draft', count: exists ? count : 0, updatedAt };
  }

  function renderRecent(history) {
    const list = byId('jobsRecentList');
    if (!list) return;
    list.innerHTML = '';
    const recent = history.slice(0, 4);
    if (!recent.length) {
      list.classList.add('empty');
      list.textContent = 'No local saves yet.';
      return;
    }
    list.classList.remove('empty');
    const frag = document.createDocumentFragment();
    recent.forEach((item) => {
      const record = item?.record || {};
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'jobs-recent-item';
      button.dataset.recentHistoryId = String(item?.id || '');
      const title = document.createElement('span');
      title.className = 'jobs-recent-title';
      title.textContent = record?.meta?.title || item?.summary?.title || record?.job?.description || record?.job?.jobNumber || 'Saved Job';
      const meta = document.createElement('span');
      meta.className = 'jobs-recent-meta';
      meta.textContent = [
        record?.meta?.operationType || item?.summary?.operationType || 'Job',
        item?.summary?.pipe || [record?.pipe?.material, record?.pipe?.nominalSize].filter(Boolean).join(' ') || 'Pipe -',
        dateTimeLabel(record?.meta?.savedAtIso || item?.savedAt || record?.meta?.savedAtDisplay),
        item?.cloudId ? 'Synced' : 'Local'
      ].filter(Boolean).join(' | ');
      button.append(title, meta);
      frag.appendChild(button);
    });
    list.appendChild(frag);
  }

  function updateLibraryPolish() {
    const history = historyItems();
    const draft = draftSummary();
    const card = byId('jobsResumeCard');
    if (card) card.dataset.state = draft.status;
    const title = byId('jobsResumeTitle');
    if (title) title.textContent = draft.label;
    const meta = byId('jobsResumeMeta');
    if (meta) meta.textContent = draft.exists
      ? `${SAVE_COPY[draft.status].copy}${draft.updatedAt ? ` Last updated at ${timeLabel(draft.updatedAt)}.` : ''}`
      : SAVE_COPY.empty.copy;
    const pill = byId('jobsResumeStatus');
    if (pill) {
      pill.textContent = SAVE_COPY[draft.status].label;
      pill.dataset.state = draft.status;
    }
    const ops = byId('jobsResumeOperations');
    if (ops) ops.textContent = `${draft.count} operation${draft.count === 1 ? '' : 's'}`;
    const open = byId('jobsResumeOpenBtn');
    if (open) open.textContent = draft.exists ? 'Resume Workflow' : 'Open Workflow';

    const localCount = String(history.length || 0);
    const unsyncedCount = String(history.filter((item) => !item?.cloudId).length || 0);
    const currentTitle = byId('jobsCurrentTitle');
    if (currentTitle) currentTitle.textContent = draft.exists ? draft.label : 'No active job yet';
    const currentMeta = byId('jobsCurrentMeta');
    if (currentMeta) currentMeta.textContent = draft.exists
      ? `${SAVE_COPY[draft.status].label}${draft.updatedAt ? ` at ${timeLabel(draft.updatedAt)}` : ''}. ${draft.count} operation${draft.count === 1 ? '' : 's'}.`
      : 'Start from Workflow, then save locally or sync to shared.';
    const currentName = byId('jobsCurrentJobName');
    if (currentName) currentName.textContent = draft.exists ? draft.label : 'No active job';
    const savedCount = byId('jobsLocalSavedCount');
    if (savedCount) savedCount.textContent = localCount;
    const historyCount = byId('historyCountBadge');
    if (historyCount) historyCount.textContent = localCount;
    const unsynced = byId('unsyncedJobsCount');
    if (unsynced) unsynced.textContent = unsyncedCount;
    const unsyncedStat = byId('jobsUnsyncedStat');
    if (unsyncedStat) unsyncedStat.textContent = unsyncedCount;
    renderRecent(history);
  }

  function loadRecent(id) {
    const item = historyItems().find((entry) => String(entry?.id || '') === String(id || ''));
    const record = item?.record || (item?.state ? { state: item.state } : null);
    if (!record) return;
    try { window.loadRecordIntoCalculator?.(record, { switchScreen: true, skipPersist: false, message: true }); } catch {}
    setTimeout(() => {
      try { window.tapCalcSetScreen?.('card'); } catch {}
      updateLibraryPolish();
    }, 80);
  }

  function bindLibrary() {
    const recent = byId('jobsRecentList');
    if (recent && recent.dataset.alpha201Bound !== '1') {
      recent.dataset.alpha201Bound = '1';
      recent.addEventListener('click', (event) => {
        const button = event.target?.closest?.('[data-recent-history-id]');
        if (!button) return;
        event.preventDefault();
        loadRecent(button.dataset.recentHistoryId);
      });
    }
    const viewAll = byId('jobsRecentViewAllBtn');
    if (viewAll && viewAll.dataset.alpha201Bound !== '1') {
      viewAll.dataset.alpha201Bound = '1';
      viewAll.addEventListener('click', (event) => {
        event.preventDefault();
        try { window.tapCalcOpenLibrary ? window.tapCalcOpenLibrary('local') : window.tapCalcSetScreen?.('jobs'); } catch {}
        try { window.setLibraryLane?.('local'); } catch {}
        const toggle = byId('historyDrawerToggle');
        if (toggle && toggle.getAttribute('aria-expanded') !== 'true') toggle.click();
      });
    }
  }

  function scheduleUpdate(delay = 80) {
    clearTimeout(window.__tapcalcAlpha201Timer);
    window.__tapcalcAlpha201Timer = setTimeout(() => {
      installWorkflowGuard();
      updateLibraryPolish();
      decorateStageNav();
    }, delay);
  }

  function boot() {
    ensureLibraryMarkup();
    updateVersionText();
    installWorkflowGuard();
    bindLibrary();
    updateLibraryPolish();
    decorateStageNav();
    ['historyList', 'workflowStageNav', 'jobsCloudStatus', 'firebaseStatus'].forEach((id) => {
      const el = byId(id);
      if (!el || el.dataset.alpha201Observed === '1') return;
      el.dataset.alpha201Observed = '1';
      try { new MutationObserver(() => scheduleUpdate(40)).observe(el, { childList: true, subtree: true, characterData: true }); } catch {}
    });
  }

  document.addEventListener('DOMContentLoaded', boot);
  window.addEventListener('load', () => {
    boot();
    setTimeout(boot, 300);
    setTimeout(boot, 1000);
  });
  window.addEventListener('pageshow', () => setTimeout(boot, 80));
  document.addEventListener('input', () => scheduleUpdate(140), true);
  document.addEventListener('change', () => scheduleUpdate(140), true);
  document.addEventListener('click', (event) => {
    if (event.target?.closest?.('#saveHistoryBtn, #saveHistoryBtnClone, #saveHistoryBtnJobs, [data-load-history], [data-delete-history], [data-workflow-stage], .workflow-card[data-workflow-target], .workflow-submode-btn[data-mode]')) {
      scheduleUpdate(160);
    }
  }, true);
  window.tapCalcUpdateLibraryPolish = updateLibraryPolish;
  if (document.readyState !== 'loading') setTimeout(boot, 0);
})();
