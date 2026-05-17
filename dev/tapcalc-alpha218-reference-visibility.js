/* TapCalc Dev 3.0.0-alpha218 harden Reference panel switching */
(function(){
  const READY_FLAG = '__tapcalcAlpha218ReferenceVisibilityReady';
  const DEFAULT_VIEW = 'converter';
  const SAVED_VIEW_KEY = 'tapcalcReferenceViewV1';
  let desiredView = DEFAULT_VIEW;
  let enforcing = false;

  const labels = {
    converter: ['Charts', 'Decimal / Fraction', 'Quick conversion and full chart'],
    bolting: ['Charts', 'Bolting Chart', 'Flange class, stud, wrench, counts'],
    glossary: ['Charts', 'Glossary', 'Abbreviations and field meanings'],
    htp: ['Charts', 'HTP Chart', 'Pipe size, branch, head, and cutter lookup'],
    stopmath: ['Charts', 'Stop Math', 'Standard, HTP, and Hi-Stop formulas'],
    pivothead: ['Setup Guides', 'Pivot Head Setup', 'Seal size, load pad, nose/backing plate, and Clearance B'],
    machines: ['Machine Reference', 'Machine Stack-Ups', 'Tap, stop, plug, and manual index'],
    uwire: ['Field Reference', 'U-Wire Calculator', 'Pre-job U-wire placement and engagement checks'],
    fieldcheck: ['Field Reference', 'Field Checklists', 'Pre-job, cut, stop, and save checks'],
    plant150: ['Field Reference', '150# Plant Series', 'Jack-bolt and packing wrench info'],
    plant600: ['Field Reference', '600# Plant Series', 'Higher class flange reference'],
    gaskettorque: ['Field Reference', 'Graphonic', 'Starred RF gasket torque lookup with engineering 600# data'],
    papergaskets: ['Field Reference', 'Paper Gaskets', 'Compressed sheet and GYLON ring gasket torque tables'],
    fieldmanual: ['Field Reference', 'Field Manual', 'Inline RPM, Hi-Stop, machine specs, and checks']
  };

  function byId(id){
    return document.getElementById(id);
  }

  function referenceViews(){
    return Array.from(document.querySelectorAll('#referenceWorkspaceContent > .reference-view[data-reference-view]'));
  }

  function getPanel(view){
    return referenceViews().find((panel) => panel.dataset.referenceView === view) || null;
  }

  function firstAvailableView(){
    const first = referenceViews()[0];
    return first?.dataset?.referenceView || DEFAULT_VIEW;
  }

  function resolveView(view){
    const requested = String(view || '').trim();
    if (requested && getPanel(requested)) return requested;
    if (getPanel(DEFAULT_VIEW)) return DEFAULT_VIEW;
    return firstAvailableView();
  }

  function hidePanel(panel){
    panel.classList.remove('active');
    panel.hidden = true;
    panel.setAttribute('aria-hidden', 'true');
    panel.style.setProperty('display', 'none', 'important');
    panel.style.setProperty('visibility', 'hidden', 'important');
    panel.style.setProperty('pointer-events', 'none', 'important');
    panel.style.setProperty('opacity', '0', 'important');
    panel.style.setProperty('height', '0', 'important');
    panel.style.setProperty('max-height', '0', 'important');
    panel.style.setProperty('overflow', 'hidden', 'important');
  }

  function showPanel(panel){
    panel.classList.add('active');
    panel.hidden = false;
    panel.removeAttribute('aria-hidden');
    panel.style.setProperty('display', 'block', 'important');
    panel.style.setProperty('visibility', 'visible', 'important');
    panel.style.setProperty('pointer-events', 'auto', 'important');
    panel.style.setProperty('opacity', '1', 'important');
    panel.style.removeProperty('height');
    panel.style.removeProperty('max-height');
    panel.style.removeProperty('overflow');
  }

  function syncSummary(view){
    const row = labels[view] || labels[DEFAULT_VIEW];
    const group = byId('referenceLibraryGroup');
    const current = byId('referenceLibraryCurrent');
    const description = byId('referenceLibraryDescription');
    if (group) group.textContent = row[0];
    if (current) current.textContent = row[1];
    if (description) description.textContent = row[2];
  }

  function syncControls(view){
    const select = byId('referenceViewSelect');
    if (select && Array.from(select.options || []).some((option) => option.value === view)) {
      select.value = view;
    }
    document.querySelectorAll('#refScreen [data-reference-target]').forEach((button) => {
      const active = button.getAttribute('data-reference-target') === view;
      button.classList.toggle('active', active);
      if (button.getAttribute('role') === 'option') {
        button.setAttribute('aria-selected', active ? 'true' : 'false');
      }
    });
  }

  function saveView(view){
    try {
      localStorage.setItem(SAVED_VIEW_KEY, view);
    } catch {}
  }

  function enforceReferenceView(view, options = {}){
    const requested = String(view || desiredView || DEFAULT_VIEW).trim() || DEFAULT_VIEW;
    desiredView = requested;
    const nextView = resolveView(requested);
    const panels = referenceViews();
    if (!panels.length) return;
    enforcing = true;
    panels.forEach((panel) => {
      if (panel.dataset.referenceView === nextView) showPanel(panel);
      else hidePanel(panel);
    });
    syncSummary(nextView);
    syncControls(nextView);
    document.documentElement.dataset.tapcalcReferenceView = nextView;
    if (options.persist !== false) saveView(nextView);
    enforcing = false;
    if (requested !== nextView) {
      setTimeout(() => {
        if (getPanel(requested)) enforceReferenceView(requested, options);
      }, 150);
    }
  }

  function getStartupView(){
    let saved = '';
    try {
      saved = localStorage.getItem(SAVED_VIEW_KEY) || '';
      if (saved === 'glossary') {
        localStorage.setItem(SAVED_VIEW_KEY, DEFAULT_VIEW);
        return DEFAULT_VIEW;
      }
    } catch {}
    return saved || byId('referenceViewSelect')?.value || DEFAULT_VIEW;
  }

  function currentTargetFromDom(){
    const activeControl = document.querySelector('#refScreen [data-reference-target].active');
    return byId('referenceViewSelect')?.value || activeControl?.getAttribute('data-reference-target') || desiredView || DEFAULT_VIEW;
  }

  function scheduleEnforce(view, options){
    enforceReferenceView(view, options);
    setTimeout(() => enforceReferenceView(view, options), 60);
    setTimeout(() => enforceReferenceView(view, options), 220);
  }

  function install(){
    if (window[READY_FLAG]) return;
    window[READY_FLAG] = true;
    desiredView = getStartupView();
    scheduleEnforce(desiredView, { persist: true });

    document.addEventListener('click', (event) => {
      const trigger = event.target?.closest?.('#refScreen [data-reference-target]');
      if (!trigger) return;
      const next = trigger.getAttribute('data-reference-target') || DEFAULT_VIEW;
      desiredView = next;
      setTimeout(() => scheduleEnforce(next, { persist: true }), 0);
    }, true);

    document.addEventListener('change', (event) => {
      if (event.target?.id !== 'referenceViewSelect') return;
      const next = event.target.value || DEFAULT_VIEW;
      desiredView = next;
      setTimeout(() => scheduleEnforce(next, { persist: true }), 0);
    }, true);

    const workspace = byId('referenceWorkspaceContent');
    if (workspace) {
      new MutationObserver(() => {
        if (enforcing) return;
        setTimeout(() => enforceReferenceView(desiredView || currentTargetFromDom(), { persist: false }), 0);
      }).observe(workspace, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'aria-hidden'] });
    }

    window.TapCalcAlpha218SetReferenceView = function(view){
      desiredView = view || DEFAULT_VIEW;
      scheduleEnforce(desiredView, { persist: true });
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();
