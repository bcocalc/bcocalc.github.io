/* TapCalc livefix11 workflow hotfixes: edit scroll guard, resume hydration, operation cards. */
(function(){
  const PATCH_FLAG = '__tapcalcLivefix11WorkflowReady';
  if (window[PATCH_FLAG]) return;
  window[PATCH_FLAG] = true;

  const EDIT_SCROLL_GUARD_MS = 1400;
  const MODE_STAGES = new Set(['hotTap', 'lineStop', 'completionPlug']);
  const WORKFLOW_STAGE_KEY = 'tapcalcWorkflowStageV2';
  let refreshTimer = 0;
  let enhanceTimer = 0;

  const text = (value) => String(value ?? '').trim();
  const byId = (id) => document.getElementById(id);
  const editableTarget = (target) => !!target?.closest?.('input, textarea, select, [contenteditable="true"]');

  function meaningful(value) {
    const next = text(value);
    return !!next && next !== '-' && next !== '?' && next !== '0.0000' && next !== '0.000' && !/^not ready$/i.test(next);
  }

  function markEditingWindow() {
    window.__tapcalcEditingUntil = Date.now() + EDIT_SCROLL_GUARD_MS;
  }

  function editingNow() {
    if (Date.now() < Number(window.__tapcalcEditingUntil || 0)) return true;
    return editableTarget(document.activeElement);
  }

  function withScrollGuard(callback) {
    window.__tapcalcEditingUntil = Math.max(Number(window.__tapcalcEditingUntil || 0), Date.now() + 700);
    try { return callback?.(); } catch {}
  }

  function installEditScrollGuard() {
    if (!window.__tapcalcLivefix11ScrollGuardReady) {
      window.__tapcalcLivefix11ScrollGuardReady = true;
      ['focusin', 'input', 'keydown', 'change'].forEach((type) => {
        document.addEventListener(type, (event) => {
          if (editableTarget(event.target)) markEditingWindow();
        }, true);
      });
    }
    if (!window.Element?.prototype) return;
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    if (typeof originalScrollIntoView === 'function' && !originalScrollIntoView.__tapcalcLivefix11Guarded) {
      const guarded = function(...args) {
        if (editingNow() && document.body?.classList?.contains('measurement-page')) return;
        return originalScrollIntoView.apply(this, args);
      };
      guarded.__tapcalcLivefix11Guarded = true;
      guarded.__tapcalcOriginal = originalScrollIntoView;
      Element.prototype.scrollIntoView = guarded;
    }
  }

  function dispatchRefreshEvents() {
    document.querySelectorAll('#cardScreen input, #cardScreen select, #cardScreen textarea, #calcScreen input, #calcScreen select, #calcScreen textarea, #jobScreen input, #jobScreen select, #jobScreen textarea').forEach((el) => {
      try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch {}
      try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch {}
    });
  }

  function operationType(operation = {}) {
    const raw = text(operation.operationType || operation.mode || operation.state?.activeMode || 'Hot Tap').toLowerCase();
    if (raw.includes('completion')) return 'Completion Plug';
    if (raw.includes('hi')) return 'Hi-Stop';
    if (raw.includes('htp')) return 'HTP Hot Tap';
    if (raw.includes('line')) return 'Line Stop';
    return 'Hot Tap';
  }

  function stageFromOperation(operation = {}) {
    const stateStage = text(operation.state?.activeMode || operation.activeMode);
    if (MODE_STAGES.has(stateStage)) return stateStage;
    const type = operationType(operation);
    if (type === 'Completion Plug') return 'completionPlug';
    if (type === 'Line Stop' || type === 'Hi-Stop') return 'lineStop';
    return 'hotTap';
  }

  function activeStage() {
    const jobType = text(byId('workflowOperationType')?.value || byId('operationType')?.value || 'Hot Tap').toLowerCase();
    const stages = jobType.includes('line stop') || jobType.includes('completion')
      ? ['setup', 'pipe', 'hotTap', 'lineStop', 'completionPlug', 'review']
      : ['setup', 'pipe', 'hotTap', 'review'];
    let stage = window.__tapCalcWorkflowStage || '';
    try { stage = stage || localStorage.getItem(WORKFLOW_STAGE_KEY) || ''; } catch {}
    return stages.includes(stage) ? stage : stages[0];
  }

  function refreshWorkflowAfterLoad() {
    withScrollGuard(() => {
      try { window.tapCalcSyncWorkflowJobSetup?.(); } catch {}
      try { window.tapCalcSyncWorkflowTools?.(); } catch {}
      try { window.tapCalcSyncWorkflowOperations?.(); } catch {}
      try { window.tapCalcRenderOperationManager?.(); } catch {}
      dispatchRefreshEvents();
      const selected = window.tapCalcGetSelectedOperation?.();
      const targetStage = selected ? stageFromOperation(selected) : activeStage();
      try {
        if (MODE_STAGES.has(targetStage) && typeof window.setMode === 'function') window.setMode(targetStage);
      } catch {}
      try { window.tapCalcSetWorkflowStage?.(targetStage, { guard: false, skipSetMode: false }); } catch {}
      try { window.tapCalcUpdateLibraryPolish?.(); } catch {}
      scheduleEnhance(0);
    });
  }

  function scheduleWorkflowRefresh(delay = 80) {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(refreshWorkflowAfterLoad, delay);
  }

  function installResumeRefresh() {
    if (!window.__tapcalcLivefix11ResumeRefreshReady) {
      window.__tapcalcLivefix11ResumeRefreshReady = true;
      document.addEventListener('click', (event) => {
        if (event.target?.closest?.('#workflowResumeDraftBtn, #homeResumeDraftBtn, #homeResumeDraftHeroBtn, #homeResumeDraftQuickBtn, #jobsResumeOpenBtn, [data-load-history], #jobsLoadSelectedBtn, #jobsLoadSelectedBtnFinal, .job-operation-card[data-operation-id]')) {
          scheduleWorkflowRefresh(160);
          setTimeout(() => scheduleWorkflowRefresh(0), 420);
        }
      }, true);
      window.addEventListener('pageshow', () => scheduleWorkflowRefresh(260));
    }
    const loader = window.loadRecordIntoCalculator;
    if (typeof loader === 'function' && !loader.__tapcalcLivefix11RefreshWrapped) {
      const wrapped = function(...args) {
        const result = loader.apply(this, args);
        scheduleWorkflowRefresh(120);
        setTimeout(() => scheduleWorkflowRefresh(0), 360);
        return result;
      };
      wrapped.__tapcalcLivefix11RefreshWrapped = true;
      window.loadRecordIntoCalculator = wrapped;
    }
  }

  function htmlEscape(value) {
    return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function numberValue(value) {
    if (!meaningful(value)) return NaN;
    if (typeof window.parseMixedMeasurement === 'function') {
      try {
        const parsed = window.parseMixedMeasurement(String(value));
        if (Number.isFinite(parsed)) return parsed;
      } catch {}
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function displayNumber(value) {
    return Number.isFinite(value) ? value.toFixed(4).replace(/\.?0+$/, '') : '';
  }

  function signed(state, key, signKey) {
    const raw = numberValue(state?.[key]);
    if (!Number.isFinite(raw)) return NaN;
    return state?.[signKey] === '-' ? -raw : raw;
  }

  function pushRow(rows, label, value) {
    if (meaningful(value)) rows.push({ label, value: String(value).trim() });
  }

  function operationRows(operation = {}) {
    const state = operation.state || {};
    const type = operationType(operation);
    const rows = [];
    const pipeOd = numberValue(state.bcoTrueOD || state.pipeOD || state.bcoPipeOD);
    const pipeId = numberValue(state.bcoPipeID);
    const cutter = numberValue(state.bcoCutterOD);
    const wall = Number.isFinite(pipeOd) && Number.isFinite(pipeId) ? (pipeOd - pipeId) / 2 : numberValue(state.wallThickness);
    const bcoRoot = Number.isFinite(pipeId) && Number.isFinite(cutter) ? Math.pow(pipeId / 2, 2) - Math.pow(cutter / 2, 2) : NaN;
    const bco = Number.isFinite(pipeOd) && bcoRoot >= 0 ? (pipeOd / 2) - Math.sqrt(bcoRoot) : numberValue(state.etaBco);

    pushRow(rows, 'Pipe', state.bcoPipeOD);
    pushRow(rows, 'Sched', state.bcoSchedule);
    pushRow(rows, 'Pipe ID', state.bcoPipeID);
    pushRow(rows, 'Wall', displayNumber(wall));
    pushRow(rows, 'Cutter', state.bcoCutterOD);
    pushRow(rows, 'BCO', displayNumber(bco));

    if (type === 'Line Stop') {
      const md = numberValue(state.lsMd);
      const ld = signed(state, 'lsLd', 'lsLdSign');
      const li = Number.isFinite(md) && Number.isFinite(ld) && Number.isFinite(pipeOd) && Number.isFinite(wall) ? md + ld + pipeOd - wall : NaN;
      pushRow(rows, 'Variant', state.lineStopVariant);
      pushRow(rows, 'MD', state.lsMd);
      pushRow(rows, 'LD', Number.isFinite(ld) ? displayNumber(ld) : state.lsLd);
      pushRow(rows, 'LI', state.lsLiManual || displayNumber(li));
      pushRow(rows, 'Travel', state.lsTravel);
      pushRow(rows, 'Machine Travel', state.lsMachineTravel);
    } else if (type === 'Completion Plug') {
      pushRow(rows, 'Start', state.cpStart);
      pushRow(rows, 'JBF', state.cpJbf);
      pushRow(rows, 'LD', state.cpLd);
      pushRow(rows, 'PT', state.cpPt);
      pushRow(rows, 'LI', state.cpLiManual);
    } else {
      const md = numberValue(state.md || state.htpMd || state.hsMd);
      const ld = signed(state, state.htpMd ? 'htpLd' : 'ld', state.htpMd ? 'htpLdSign' : 'ldSign');
      const ptc = numberValue(state.ptc || state.htpPtc || state.hsCl);
      const li = Number.isFinite(md) && Number.isFinite(ld) ? md + ld : NaN;
      const ttd = Number.isFinite(li) && Number.isFinite(ptc) && Number.isFinite(bco) ? li + ptc + bco : NaN;
      pushRow(rows, 'MD', state.md || state.htpMd || state.hsMd);
      pushRow(rows, 'LD', Number.isFinite(ld) ? displayNumber(ld) : (state.ld || state.htpLd || state.hsLd));
      pushRow(rows, 'PTC', state.ptc || state.htpPtc || state.hsCl);
      pushRow(rows, 'LI', state.hsLiManual || displayNumber(li));
      pushRow(rows, 'TTD', displayNumber(ttd));
      pushRow(rows, 'MT', state.mt || state.hsTco);
    }
    return rows.slice(0, 12);
  }

  function operationSummary(operation = {}) {
    const state = operation.state || {};
    const type = operationType(operation);
    const bits = [];
    if (meaningful(state.bcoPipeOD)) bits.push(`${state.bcoPipeOD} pipe`);
    if (meaningful(state.bcoCutterOD)) bits.push(`Cutter ${state.bcoCutterOD}`);
    if (type === 'Line Stop') {
      if (meaningful(state.lsMd)) bits.push(`MD ${state.lsMd}`);
      if (meaningful(state.lsTravel)) bits.push(`Travel ${state.lsTravel}`);
    } else if (type === 'Completion Plug') {
      if (meaningful(state.cpStart)) bits.push(`Start ${state.cpStart}`);
      if (meaningful(state.cpJbf)) bits.push(`JBF ${state.cpJbf}`);
    } else {
      if (meaningful(state.md || state.htpMd || state.hsMd)) bits.push(`MD ${state.md || state.htpMd || state.hsMd}`);
      if (meaningful(state.ptc || state.htpPtc || state.hsCl)) bits.push(`PTC ${state.ptc || state.htpPtc || state.hsCl}`);
    }
    return bits.join(' | ') || 'No measurements yet';
  }

  function enhanceOperationCards() {
    const bundle = window.currentJobBundle || null;
    const cards = Array.from(document.querySelectorAll('.job-operation-card[data-operation-id]'));
    const bundleOperations = Array.isArray(bundle?.operations) ? bundle.operations : [];
    const selectedId = text(bundle?.selectedOperationId) || text(cards.find((card) => card.classList.contains('active'))?.dataset.operationId);
    const operations = bundleOperations.length ? bundleOperations : cards.map((card) => ({
      id: card.dataset.operationId,
      operationType: card.querySelector('small')?.textContent || '',
      label: card.querySelector('strong')?.textContent || card.textContent || '',
      state: {}
    }));
    if (!operations.length) return;
    document.querySelectorAll('.job-operation-preview').forEach((host) => {
      host.querySelectorAll('.job-operation-card[data-operation-id]').forEach((card) => {
        const operation = operations.find((item) => String(item?.id || '') === String(card.dataset.operationId || ''));
        if (!operation) return;
        const active = String(operation.id || '') === String(selectedId || '');
        const type = operationType(operation);
        const action = active ? 'Currently open' : `Open ${type}`;
        const rows = operationRows(operation);
        const rowsHtml = rows.length
          ? `<span class="job-operation-detail-grid">${rows.map((row) => `<span class="job-operation-detail"><b>${htmlEscape(row.label)}</b><em>${htmlEscape(row.value)}</em></span>`).join('')}</span>`
          : '<span class="job-operation-empty">No saved measurements yet.</span>';
        const notes = text(operation.notes);
        const noteHtml = notes ? `<span class="job-operation-card-note"><b>Note</b>${htmlEscape(notes)}</span>` : '';
        card.classList.toggle('active', active);
        card.setAttribute('aria-pressed', active ? 'true' : 'false');
        card.setAttribute('aria-label', `${action}: ${operation.label || type}. ${operationSummary(operation)}`);
        card.innerHTML = `<span class="job-operation-card-top"><small>${htmlEscape(type)}</small><span class="job-operation-card-state">${htmlEscape(action)}</span></span><strong>${htmlEscape(operation.label || type)}</strong><span class="job-operation-card-summary">${htmlEscape(operationSummary(operation))}</span>${rowsHtml}${noteHtml}`;
      });
    });
  }

  function scheduleEnhance(delay = 80) {
    if (enhanceTimer) return;
    enhanceTimer = setTimeout(() => {
      enhanceTimer = 0;
      enhanceOperationCards();
    }, delay);
  }

  function boot() {
    try { installEditScrollGuard(); } catch {}
    try { installResumeRefresh(); } catch {}
    try { scheduleWorkflowRefresh(180); } catch {}
    try {
      scheduleEnhance(40);
      [180, 420, 900, 1600].forEach((delay) => setTimeout(() => scheduleEnhance(0), delay));
    } catch {}
    if (!window.__tapcalcLivefix11ObserverReady) {
      window.__tapcalcLivefix11ObserverReady = true;
      try { new MutationObserver(() => scheduleEnhance(60)).observe(document.body, { childList: true, subtree: true }); } catch {}
    }
  }

  document.addEventListener('DOMContentLoaded', boot);
  window.addEventListener('load', () => {
    boot();
    setTimeout(boot, 350);
    setTimeout(boot, 1000);
  });
  window.addEventListener('pageshow', () => setTimeout(boot, 80));
  document.addEventListener('input', () => scheduleEnhance(120), true);
  document.addEventListener('change', () => scheduleEnhance(120), true);
  document.addEventListener('click', () => scheduleEnhance(180), true);
  if (document.readyState !== 'loading') setTimeout(boot, 0);
})();
