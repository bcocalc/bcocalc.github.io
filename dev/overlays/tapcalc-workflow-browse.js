/* TapCalc alpha248 workflow browse mode: navigation is advisory, not locked. */
(function(){
  const READY_FLAG = '__tapcalcWorkflowBrowseReady';
  if (window[READY_FLAG]) return;
  window[READY_FLAG] = true;

  const STAGE_KEY = 'tapcalcWorkflowStageV2';
  const MODE_STAGES = new Set(['hotTap', 'lineStop', 'completionPlug']);
  const PREVIEW_EVENTS = new Set(['pointerdown', 'touchstart', 'touchend']);
  let lastActionKey = '';
  let lastActionAt = 0;
  let heldStage = '';
  let heldStageUntil = 0;
  let heldJobType = '';
  let heldJobTypeUntil = 0;
  let applicationsOpen = true;

  const byId = (id) => document.getElementById(id);
  const text = (value) => String(value ?? '').trim();

  function activeJobType() {
    const selectedType = text(window.tapCalcGetSelectedOperation?.()?.operationType).toLowerCase();
    if (selectedType) return selectedType.includes('completion') ? 'Completion Plug' : (selectedType.includes('stop') || selectedType.includes('htp')) ? 'Line Stop' : 'Hot Tap';
    const raw = text(byId('workflowOperationType')?.value || byId('operationType')?.value || 'Hot Tap').toLowerCase();
    if (raw.includes('line stop') || raw.includes('completion')) return 'Line Stop';
    try {
      const operations = window.currentJobBundle?.operations || [];
      if (Array.isArray(operations) && operations.some((operation) => {
        const type = text(operation?.operationType || operation?.mode || operation?.state?.activeMode).toLowerCase();
        return type.includes('line') || type.includes('completion');
      })) return 'Line Stop';
    } catch {}
    return 'Hot Tap';
  }

  function stages() {
    if (activeJobType() === 'Completion Plug') return ['setup', 'pipe', 'completionPlug', 'review'];
    return activeJobType() === 'Line Stop'
      ? ['setup', 'pipe', 'hotTap', 'lineStop', 'completionPlug', 'review']
      : ['setup', 'pipe', 'hotTap', 'review'];
  }

  function activeStage() {
    const list = stages();
    let stage = window.__tapCalcWorkflowStage || '';
    try { stage = stage || localStorage.getItem(STAGE_KEY) || ''; } catch {}
    return list.includes(stage) ? stage : list[0];
  }

  function stopEvent(event, prevent = true) {
    try { if (prevent && event.cancelable) event.preventDefault(); } catch {}
    try { event.stopPropagation(); } catch {}
    try { event.stopImmediatePropagation?.(); } catch {}
  }

  function suppressWorkflowScroll() {
    if (typeof window.tapCalcSuppressAutoScroll === 'function') {
      try { window.tapCalcSuppressAutoScroll(1200); } catch {}
    }
    window.__tapCalcSuppressAutoScrollUntil = Date.now() + 1200;
    window.__tapcalcWorkflowBrowseSuppressScrollUntil = Date.now() + 1200;
  }

  function scrollRoot() {
    return document.scrollingElement || document.documentElement || document.body;
  }

  function captureScrollPosition() {
    const root = scrollRoot();
    return {
      left: Number(window.scrollX || root?.scrollLeft || 0),
      top: Number(window.scrollY || root?.scrollTop || 0)
    };
  }

  function restoreScrollPosition(position) {
    if (!position) return;
    const restore = () => {
      if (!document.body?.classList?.contains('tapcalc-workflow-browse')) return;
      try { window.scrollTo({ left: position.left, top: position.top, behavior: 'auto' }); }
      catch {
        try { window.scrollTo(position.left, position.top); } catch {}
      }
      const root = scrollRoot();
      if (root) {
        try {
          root.scrollLeft = position.left;
          root.scrollTop = position.top;
        } catch {}
      }
    };
    [0, 50, 140, 320, 700].forEach((delay) => setTimeout(restore, delay));
  }

  function isWorkflowScrollTarget(el) {
    if (!el || !document.body?.classList?.contains('tapcalc-workflow-browse')) return false;
    if (Date.now() > Number(window.__tapcalcWorkflowBrowseSuppressScrollUntil || 0)) return false;
    if (el.id === 'workflowGateNotice') return true;
    return !!el.closest?.('#cardScreen') && !!el.closest?.(
      '.workflow-guided-shell, .workflow-next-banner, [data-workflow-stage-panel], .workflow-helper-panel, .card-focus-shell, .mode-panel'
    );
  }

  function installScrollGuard() {
    if (!window.Element?.prototype) return;
    const current = Element.prototype.scrollIntoView;
    if (typeof current !== 'function' || current.__tapcalcWorkflowBrowseGuarded) return;
    const guarded = function(...args) {
      if (isWorkflowScrollTarget(this)) return;
      return current.apply(this, args);
    };
    guarded.__tapcalcWorkflowBrowseGuarded = true;
    guarded.__tapcalcPrevious = current;
    Element.prototype.scrollIntoView = guarded;
  }

  function setStage(stage, options = {}) {
    const list = stages();
    const target = list.includes(stage) ? stage : list[0];
    const userInitiated = options.userInitiated === true || window.__tapcalcWorkflowBrowseHandlingTap === true;
    if (!userInitiated && heldStage && Date.now() < heldStageUntil && target !== heldStage) {
      return setStage(heldStage, Object.assign({}, options, { __reassert: true }));
    }
    if (userInitiated) {
      window.__tapcalcWorkflowNavigationRevision = Number(window.__tapcalcWorkflowNavigationRevision || 0) + 1;
      heldStage = target;
      heldStageUntil = Date.now() + 1800;
    }
    const previousScroll = captureScrollPosition();
    suppressWorkflowScroll();
    const setter = window.__tapcalcAlpha201OriginalSetStage || window.__tapcalcWorkflowBrowseOriginalSetStage || window.tapCalcSetWorkflowStage;
    if (typeof setter === 'function' && setter !== setStage) {
      try {
        const result = setter.call(window, target, Object.assign({}, options, {
          guard: false,
          skipScroll: true
        }));
        setTimeout(applyBrowseMode, 0);
        setTimeout(applyBrowseMode, 80);
        restoreScrollPosition(previousScroll);
        return result;
      } catch {}
    }
    window.__tapCalcWorkflowStage = target;
    try { localStorage.setItem(STAGE_KEY, target); } catch {}
    applyBrowseMode();
    restoreScrollPosition(previousScroll);
    return true;
  }

  function setStageByDelta(delta, options = {}) {
    const list = stages();
    const current = activeStage();
    const index = Math.max(0, list.indexOf(current));
    const nextIndex = Math.max(0, Math.min(list.length - 1, index + (Number(delta) || 0)));
    return setStage(list[nextIndex], Object.assign({ skipSetMode: false }, options));
  }

  function advisoryTextFromNotice(value) {
    const missing = text(value).replace(/^Finish\s+.+?\s+before continuing:\s*/i, '').replace(/\.$/, '');
    if (!missing) return 'You can keep browsing. The checklist will show what still needs attention.';
    return `You can keep browsing. Still needs: ${missing}.`;
  }

  function unlockStageChips() {
    document.querySelectorAll('#workflowStageNav [data-workflow-stage]').forEach((chip) => {
      chip.disabled = false;
      chip.removeAttribute('disabled');
      chip.dataset.stageLocked = 'false';
      chip.setAttribute('aria-disabled', 'false');
      const label = chip.querySelector('em');
      if (label && /^locked$/i.test(text(label.textContent))) label.textContent = 'Preview';
    });
  }

  function syncActiveStageDecorations() {
    const current = activeStage();
    document.querySelectorAll('#workflowStageNav [data-workflow-stage]').forEach((chip) => {
      const active = chip.dataset.workflowStage === current;
      chip.classList.toggle('active', active);
      chip.setAttribute('aria-pressed', active ? 'true' : 'false');
      if (active) chip.setAttribute('aria-current', 'step');
      else chip.removeAttribute('aria-current');
      const label = chip.querySelector('em');
      if (label && active && label.textContent !== 'Current Step') label.textContent = 'Current Step';
      else if (label && /^locked$/i.test(text(label.textContent))) label.textContent = 'Preview';
    });
    syncHelperPanelVisibility();
    if (MODE_STAGES.has(current)) {
      document.querySelectorAll('.workflow-card[data-workflow-target]').forEach((card) => {
        card.classList.toggle('active', card.dataset.workflowTarget === current);
      });
      document.querySelectorAll('.workflow-submode-btn[data-mode]').forEach((button) => {
        button.classList.toggle('active', button.dataset.mode === current);
      });
    }
  }

  function syncHelperPanelVisibility() {
    const current = activeStage();
    document.querySelectorAll('#cardScreen [data-workflow-stage-panel]').forEach((panel) => {
      const active = panel.dataset.workflowStagePanel === current;
      panel.classList.toggle('active', active);
      panel.hidden = !active;
      panel.setAttribute('aria-hidden', active ? 'false' : 'true');
      panel.style.display = active ? 'block' : 'none';
      // display:none hides inactive steps without stale inherited visibility in WebKit.
      panel.style.visibility = 'visible';
      panel.style.opacity = active ? '1' : '0';
      panel.style.pointerEvents = active ? 'auto' : 'none';
    });
  }

  function softenGateNotice() {
    const notice = byId('workflowGateNotice');
    if (!notice) return;
    if (notice.dataset.state === 'blocked' || /^Finish\s+/i.test(text(notice.textContent))) {
      notice.textContent = advisoryTextFromNotice(notice.textContent);
      notice.dataset.state = 'advisory';
      notice.hidden = false;
    }
  }

  function updateGuidanceCopy() {
    const save = byId('workflowSaveStatus');
    const saveCopy = 'Browse any step in any order. Save remains available while the checklist tracks what still needs attention.';
    if (save && save.textContent !== saveCopy) save.textContent = saveCopy;
    const copy = byId('workflowNextActionCopy');
    if (copy && /before continuing|then move to the next step/i.test(copy.textContent || '')) {
      copy.textContent = 'Use this as a readiness checklist. You can keep browsing now, then come back to fill the missing calculation fields.';
    }
    const hint = byId('workflowStepHint');
    if (hint && !/browse/i.test(hint.textContent || '')) {
      hint.textContent = `${hint.textContent} - browse freely`;
    }
  }

  function fireInputChange(el) {
    if (!el) return;
    try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch {}
    try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch {}
  }

  function enforceHeldJobType() {
    if (!heldJobType || Date.now() > heldJobTypeUntil) return false;
    const source = byId('operationType');
    const workflow = byId('workflowOperationType');
    let changed = false;
    if (source && source.value !== heldJobType) {
      source.value = heldJobType;
      changed = true;
    }
    if (workflow && workflow.value !== heldJobType) {
      workflow.value = heldJobType;
      changed = true;
    }
    if (changed) {
      setTimeout(() => {
        try { window.tapCalcSetWorkflowStage?.(activeStage(), { guard: false, skipScroll: true }); } catch {}
        applyBrowseMode();
      }, 0);
    }
    return changed;
  }

  function scheduleHeldJobTypePass() {
    [40, 120, 260, 620, 1200, 1900].forEach((delay) => {
      setTimeout(() => {
        enforceHeldJobType();
        applyBrowseMode();
      }, delay);
    });
  }

  function syncWorkflowJobType(value, options = {}) {
    const nextValue = text(value);
    if (!nextValue) return;
    if (options.hold !== false) {
      heldJobType = nextValue;
      heldJobTypeUntil = Date.now() + 2400;
      scheduleHeldJobTypePass();
    }
    const source = byId('operationType');
    const workflow = byId('workflowOperationType');
    if (source && source.value !== nextValue) {
      source.value = nextValue;
      window.__tapcalcWorkflowBrowseHandlingType = true;
      fireInputChange(source);
      window.__tapcalcWorkflowBrowseHandlingType = false;
    }
    if (workflow && workflow.value !== nextValue) {
      workflow.value = nextValue;
    }
    setTimeout(() => {
      try { window.tapCalcSetWorkflowStage?.(activeStage(), { guard: false, skipScroll: true }); } catch {}
      applyBrowseMode();
    }, 40);
  }

  function applyBrowseMode() {
    document.body?.classList?.add('tapcalc-workflow-browse');
    installScrollGuard();
    enforceHeldJobType();
    syncHelperPanelVisibility();
    unlockStageChips();
    syncActiveStageDecorations();
    softenGateNotice();
    updateGuidanceCopy();
    syncApplicationWorkspace();
  }

  function syncApplicationWorkspace() {
    const screen = byId('cardScreen');
    const manager = byId('workflowOperationsCard');
    if (!screen || !manager) return;
    if (!byId('workflowApplicationHeader')) {
      // Move the existing manager and controls; keep their data and event owners.
      screen.prepend(manager);
      manager.querySelector('h4').textContent = 'Applications in this job';
      manager.querySelector('.hero-eyebrow').textContent = 'Choose an application';
      const header = document.createElement('section');
      header.id = 'workflowApplicationHeader';
      header.innerHTML = '<button type="button" id="workflowApplicationsBack">Back to Applications</button><h3 id="workflowApplicationTitle"></h3><p>Working on this application only. Customer and location are shared across the job.</p><nav aria-label="Application steps" id="workflowApplicationNav"><button type="button" data-workflow-stage="pipe">Pipe / Cutter</button><button type="button" data-workflow-stage="hotTap">Hot Tap</button><button type="button" data-workflow-stage="lineStop">Line Stop</button><button type="button" data-workflow-stage="completionPlug">Completion Plug</button><button type="button" data-workflow-stage="review">Review</button></nav><details id="workflowApplicationDetails"><summary>Application name, notes and options</summary></details>';
      manager.after(header);
      header.appendChild(byId('workflowNextBtn').closest('.workflow-guided-actions'));
      const checklist = document.createElement('details');
      checklist.id = 'workflowApplicationChecklist';
      checklist.innerHTML = '<summary>Calculation checklist</summary>';
      checklist.appendChild(byId('workflowReadinessPanel'));
      header.appendChild(checklist);
      const otherSheets = screen.querySelector('.workflow-mode-subnav');
      otherSheets.hidden = true;
      const options = header.querySelector('details');
      options.appendChild(manager.querySelector('.workflow-operations-grid'));
      options.appendChild(byId('workflowDuplicateOperationBtn'));
      options.appendChild(byId('workflowDeleteOperationBtn'));
      options.querySelector('summary').textContent = 'Edit application name & notes';
      options.appendChild(header.querySelector('p'));
      const add = document.createElement('section');
      add.id = 'workflowApplicationAdd';
      add.innerHTML = '<h4>Add an application</h4>';
      add.appendChild(manager.querySelector('.workflow-operations-actions'));
      manager.querySelector('#workflowJobOperationPreviewList').before(add);
      const jobInfo = document.createElement('section');
      jobInfo.id = 'workflowJobInfoCard';
      jobInfo.innerHTML = '<div class="workflow-job-info-head"><h3>Job Info</h3></div><dl><div><dt>Customer</dt><dd id="workflowVisibleCustomer"></dd></div><div><dt>Location</dt><dd id="workflowVisibleLocation"></dd></div><div><dt>Date</dt><dd id="workflowVisibleDate"></dd></div></dl>';
      manager.before(jobInfo);
      const shared = document.createElement('button');
      shared.type = 'button';
      shared.id = 'workflowApplicationJobDetails';
      shared.textContent = 'Edit Job Info';
      jobInfo.querySelector('.workflow-job-info-head').appendChild(shared);
      const jobInfoShortcut = document.createElement('button');
      jobInfoShortcut.type = 'button';
      jobInfoShortcut.id = 'workflowEditJobInfo';
      jobInfoShortcut.textContent = 'Job Info';
      const toolbar = document.createElement('div');
      toolbar.className = 'workflow-application-toolbar';
      const back = byId('workflowApplicationsBack');
      back.textContent = 'Applications';
      back.setAttribute('aria-label', 'Back to Applications');
      toolbar.append(back, jobInfoShortcut);
      header.prepend(toolbar);
      jobInfoShortcut.addEventListener('click', () => shared.click());
      const setupHead = byId('workflowSetupPanel').querySelector('.workflow-helper-head');
      setupHead.querySelector('h3').textContent = 'Job Info';
      setupHead.querySelector('p').textContent = 'Customer, location, date and other job details are shared across all applications in this job.';
      byId('workflowApplicationsBack').addEventListener('click', () => {
        applicationsOpen = true;
        applyBrowseMode();
        byId('workflowApplicationJobDetails').focus({ preventScroll: true });
      });
      shared.addEventListener('click', () => {
        applicationsOpen = false;
        setStage('setup', { userInitiated: true, skipSetMode: true });
        applyBrowseMode();
      });
      manager.addEventListener('click', event => {
        if (!event.target.closest('[data-operation-id], #workflowAddHotTapOpBtn, #workflowAddLineStopOpBtn, #workflowAddCompletionOpBtn')) return;
        applicationsOpen = false;
        heldStage = '';
        heldStageUntil = 0;
        // A newly chosen application must not inherit the previous job-type hold.
        heldJobType = '';
        heldJobTypeUntil = 0;
        setTimeout(() => {
          if (event.target.closest('#workflowAddHotTapOpBtn, #workflowAddLineStopOpBtn, #workflowAddCompletionOpBtn')) {
            setStage('pipe', { userInitiated: true, skipSetMode: true });
          }
          applyBrowseMode();
          byId('workflowApplicationTitle').focus({ preventScroll: true });
        }, 100);
      }, true);
      const label = byId('workflowJobOperationLabel')?.closest('label')?.querySelector('span');
      if (label) label.textContent = 'Application name (for example: 16 inch West)';
      byId('workflowApplicationTitle').tabIndex = -1;
    }
    screen.classList.add('application-workspace');
    screen.classList.toggle('applications-overview', applicationsOpen);
    for (const [target, source] of [['workflowVisibleCustomer', 'jobClient'], ['workflowVisibleLocation', 'jobLocation'], ['workflowVisibleDate', 'jobDate']]) {
      const value = text(byId(source)?.value) || 'Not entered';
      if (byId(target).textContent !== value) byId(target).textContent = value;
    }
    const selected = window.tapCalcGetSelectedOperation?.();
    const title = byId('workflowApplicationTitle');
    const name = activeStage() === 'setup' && !applicationsOpen ? 'Job Info' : text(selected?.label || selected?.operationType) || 'Current application';
    if (title.textContent !== name) title.textContent = name;
    const current = activeStage();
    const path = stages();
    const index = path.indexOf(current);
    const next = byId('workflowNextBtn');
    const labels = { pipe: 'Pipe / Cutter', hotTap: 'Hot Tap', lineStop: 'Line Stop', completionPlug: 'Completion Plug', review: 'Review' };
    const nextCopy = current === 'review' ? 'At Review' : 'Next: ' + labels[path[index + 1]];
    if (next.textContent !== nextCopy) next.textContent = nextCopy;
    next.disabled = current === 'review';
    byId('workflowPrevBtn').disabled = index <= 0;
    for (const button of byId('workflowApplicationNav').querySelectorAll('button')) {
      button.hidden = !path.includes(button.dataset.workflowStage);
      const active = button.dataset.workflowStage === current;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    }
  }

  function installFunctionWraps() {
    const currentSetStage = window.tapCalcSetWorkflowStage;
    if (typeof currentSetStage === 'function' && currentSetStage !== setStage && !currentSetStage.__tapcalcWorkflowBrowseWrapped) {
      window.__tapcalcWorkflowBrowseOriginalSetStage = window.__tapcalcAlpha201OriginalSetStage || currentSetStage;
      const wrappedSetStage = function(stage, options = {}) {
        return setStage(stage, options);
      };
      wrappedSetStage.__tapcalcWorkflowBrowseWrapped = true;
      window.tapCalcSetWorkflowStage = wrappedSetStage;
    }

    window.tapCalcWorkflowGo = function(stage) {
      return setStage(stage || activeStage(), { skipSetMode: false });
    };
    window.tapCalcWorkflowJump = function(delta) {
      return setStageByDelta(delta);
    };

    const previousCanAutoScroll = window.tapCalcCanAutoScroll;
    if (typeof previousCanAutoScroll === 'function' && !previousCanAutoScroll.__tapcalcWorkflowBrowseWrapped) {
      const wrappedCanAutoScroll = function(options = {}) {
        if (document.body?.classList?.contains('tapcalc-workflow-browse') && options.force !== true) return false;
        return previousCanAutoScroll.call(this, options);
      };
      wrappedCanAutoScroll.__tapcalcWorkflowBrowseWrapped = true;
      window.tapCalcCanAutoScroll = wrappedCanAutoScroll;
    }
  }

  function targetFromTrigger(trigger) {
    if (!trigger) return '';
    if (trigger.matches?.('.workflow-card[data-workflow-target]')) return trigger.dataset.workflowTarget || '';
    if (trigger.matches?.('.workflow-submode-btn[data-mode]')) return trigger.dataset.mode || '';
    if (trigger.matches?.('[data-workflow-stage]')) return trigger.dataset.workflowStage || '';
    if (trigger.matches?.('[data-workflow-setup-next]')) return 'pipe';
    if (trigger.id === 'workflowSetupNextBtn') return 'pipe';
    if (trigger.id === 'workflowPipeNextBtn') return stages()[stages().indexOf('pipe') + 1];
    return '';
  }

  function handleWorkflowTap(event) {
    const trigger = event.target?.closest?.(
      '.workflow-card[data-workflow-target], .workflow-submode-btn[data-mode], [data-workflow-stage], [data-workflow-setup-next], #workflowPrevBtn, #workflowNextBtn, #workflowSetupNextBtn, #workflowPipeNextBtn, #workflowNextPrimaryBtn'
    );
    if (!trigger) return;
    if (PREVIEW_EVENTS.has(event.type)) {
      stopEvent(event, false);
      return false;
    }

    const key = trigger.id || trigger.dataset.workflowTarget || trigger.dataset.mode || trigger.dataset.workflowStage || '';
    if (key && lastActionKey === key && Date.now() - lastActionAt < 350) {
      stopEvent(event);
      return false;
    }
    lastActionKey = key;
    lastActionAt = Date.now();

    stopEvent(event);
    if (trigger.id === 'workflowPrevBtn' || trigger.id === 'workflowNextBtn' || trigger.id === 'workflowNextPrimaryBtn') {
      const delta = trigger.id === 'workflowPrevBtn' ? -1 : 1;
      window.__tapcalcWorkflowBrowseHandlingTap = true;
      try {
        return setStageByDelta(delta, { userInitiated: true });
      } finally {
        window.__tapcalcWorkflowBrowseHandlingTap = false;
      }
    }

    const target = targetFromTrigger(trigger);
    if (!target) return false;
    if (MODE_STAGES.has(target)) {
      try { window.setMode?.(target); } catch {}
    }
    window.__tapcalcWorkflowBrowseHandlingTap = true;
    try {
      return setStage(target, { skipSetMode: false, userInitiated: true });
    } finally {
      window.__tapcalcWorkflowBrowseHandlingTap = false;
    }
  }

  function handleWorkflowTypeChange(event) {
    const target = event.target;
    if (!target || (target.id !== 'workflowOperationType' && target.id !== 'operationType')) return;
    if (target.id === 'operationType' && event.isTrusted !== true && window.__tapcalcWorkflowBrowseHandlingType !== true) return;
    syncWorkflowJobType(target.value, { hold: target.id === 'workflowOperationType' || event.isTrusted === true });
  }

  function boot() {
    installScrollGuard();
    installFunctionWraps();
    applyBrowseMode();
  }

  ['pointerdown', 'touchstart', 'touchend', 'click'].forEach((type) => {
    window.addEventListener(type, handleWorkflowTap, { capture: true, passive: false });
  });
  ['input', 'change'].forEach((type) => {
    window.addEventListener(type, handleWorkflowTypeChange, { capture: true, passive: true });
  });
  document.addEventListener('input', () => setTimeout(applyBrowseMode, 20), true);
  document.addEventListener('change', () => setTimeout(applyBrowseMode, 20), true);
  document.addEventListener('DOMContentLoaded', boot, { once: true });
  window.addEventListener('load', () => {
    boot();
    [80, 240, 700, 1400].forEach((delay) => setTimeout(boot, delay));
  });
  window.addEventListener('pageshow', () => setTimeout(boot, 40));
  if (document.readyState !== 'loading') setTimeout(boot, 0);
  try { new MutationObserver(() => setTimeout(applyBrowseMode, 20)).observe(document.documentElement, { childList: true, subtree: true }); } catch {}
})();
