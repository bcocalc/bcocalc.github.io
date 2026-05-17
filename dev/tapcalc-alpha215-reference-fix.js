/* TapCalc Dev 3.0.0-alpha215 reference picker and field manual visibility fix */
(function(){
  const STYLE_ID = 'tapcalc-alpha215-reference-fix-style';
  const READY_FLAG = '__tapcalcAlpha215ReferenceFixReady';
  const FIELD_MANUAL_VIEW = 'fieldmanual';
  const DEFAULT_VIEW = 'converter';
  const REFERENCE_LABELS = {
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

  function injectStyles(){
    if (byId(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      body.measurement-page #refScreen .reference-view[data-reference-view].active{display:block;}
      body.measurement-page #refScreen .reference-view[data-reference-view][hidden]{display:none!important;}
      body.measurement-page #refScreen .reference-library-option[data-reference-target="fieldmanual"]{background:linear-gradient(135deg,rgba(33,99,197,.94),rgba(15,64,121,.94));border-color:rgba(135,190,255,.42);}
    `;
    document.head.appendChild(style);
  }

  function validView(view){
    const requested = String(view || '').trim();
    if (requested === 'garlock600') return 'gaskettorque';
    if (requested === FIELD_MANUAL_VIEW) return FIELD_MANUAL_VIEW;
    const escaped = window.CSS && typeof window.CSS.escape === 'function'
      ? window.CSS.escape(requested)
      : requested.replace(/["\\]/g, '\\$&');
    return document.querySelector(`#referenceWorkspaceContent .reference-view[data-reference-view="${escaped}"]`)
      ? requested
      : DEFAULT_VIEW;
  }

  function setReferenceSummary(view){
    const labels = REFERENCE_LABELS[view] || REFERENCE_LABELS[DEFAULT_VIEW];
    const group = byId('referenceLibraryGroup');
    const current = byId('referenceLibraryCurrent');
    const description = byId('referenceLibraryDescription');
    if (group) group.textContent = labels[0];
    if (current) current.textContent = labels[1];
    if (description) description.textContent = labels[2];
  }

  function syncReferenceControls(view){
    const select = byId('referenceViewSelect');
    if (select && Array.from(select.options || []).some((option) => option.value === view)) {
      select.value = view;
    }
    document.querySelectorAll('#refScreen [data-reference-target]').forEach((button) => {
      const active = button.getAttribute('data-reference-target') === view;
      button.classList.toggle('active', active);
      if (button.getAttribute('role') === 'option') button.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.querySelectorAll('#refScreen [data-field-manual-open]').forEach((button) => {
      button.classList.toggle('active', view === FIELD_MANUAL_VIEW);
    });
  }

  function setPanelVisibility(view){
    const safeView = validView(view);
    let activated = false;
    document.querySelectorAll('#referenceWorkspaceContent .reference-view[data-reference-view]').forEach((panel) => {
      const isActive = panel.getAttribute('data-reference-view') === safeView;
      panel.classList.toggle('active', isActive);
      panel.hidden = !isActive;
      panel.style.display = isActive ? 'block' : 'none';
      if (isActive) activated = true;
    });
    if (!activated && safeView !== DEFAULT_VIEW) setPanelVisibility(DEFAULT_VIEW);
    setReferenceSummary(safeView);
    syncReferenceControls(safeView);
    if (safeView !== FIELD_MANUAL_VIEW) {
      try { localStorage.removeItem('tapcalcAlpha214FieldManualOpen'); } catch {}
      try { localStorage.removeItem('tapcalcAlpha215FieldManualOpen'); } catch {}
      try { localStorage.setItem('tapcalcReferenceViewV1', safeView); } catch {}
    }
  }

  function ensureFieldManualPickerOption(){
    const options = byId('referenceLibraryOptions');
    document.querySelectorAll('#refScreen .reference-library-count').forEach((count) => {
      count.textContent = '14 refs';
    });
    if (!options || options.querySelector('[data-reference-target="fieldmanual"]')) return;
    const label = document.createElement('div');
    label.className = 'reference-library-group-label';
    label.dataset.alpha215FieldManualGroup = '1';
    label.textContent = 'Field Reference';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'reference-library-option';
    button.setAttribute('data-reference-target', FIELD_MANUAL_VIEW);
    button.setAttribute('role', 'option');
    button.setAttribute('aria-selected', 'false');
    button.innerHTML = '<strong>Field Manual</strong><span>Inline RPM, Hi-Stop, machine specs, and checks</span>';
    options.append(label, button);
  }

  function showFieldManual(){
    const quick = byId('fieldManualQuickButton') || byId('fieldManualInlineAction');
    if (quick && !byId('fieldManualReferenceView')?.classList.contains('active')) {
      quick.click();
    }
    setPanelVisibility(FIELD_MANUAL_VIEW);
  }

  function setFieldManualSection(sectionName, options = {}){
    const view = byId('fieldManualReferenceView');
    if (!view) return;
    const section = String(sectionName || '').trim();
    const search = byId('fieldManualSearch');
    if (search && options.clearSearch !== false) search.value = '';
    const select = byId('fieldManualSectionSelect');
    if (select && section && select.value !== section) select.value = section;
    view.classList.add('field-manual-compact-mode');
    view.classList.remove('field-manual-searching');
    document.querySelectorAll('#fieldManualReferenceView .field-manual-section').forEach((panel) => {
      const active = panel.getAttribute('data-field-manual-section') === section;
      panel.classList.toggle('field-manual-section-active', active);
      panel.hidden = false;
      panel.style.display = active ? 'block' : '';
    });
  }

  function normalizeCurrentReference(){
    ensureFieldManualPickerOption();
    const selected = byId('referenceViewSelect')?.value || localStorage.getItem('tapcalcReferenceViewV1') || DEFAULT_VIEW;
    const active = document.querySelector('#referenceWorkspaceContent .reference-view.active[data-reference-view]')?.getAttribute('data-reference-view');
    const nextView = active === FIELD_MANUAL_VIEW ? selected : active || selected;
    setPanelVisibility(nextView === FIELD_MANUAL_VIEW ? FIELD_MANUAL_VIEW : validView(nextView));
  }

  function install(){
    if (window[READY_FLAG]) return;
    window[READY_FLAG] = true;
    injectStyles();
    try { localStorage.removeItem('tapcalcAlpha214FieldManualOpen'); } catch {}

    document.addEventListener('click', (event) => {
      const target = event.target?.closest?.('#refScreen [data-reference-target]');
      if (!target) return;
      const view = validView(target.getAttribute('data-reference-target'));
      if (view === FIELD_MANUAL_VIEW) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        showFieldManual();
      } else {
        setTimeout(() => setPanelVisibility(view), 0);
        setTimeout(() => setPanelVisibility(view), 80);
      }
    }, true);

    document.addEventListener('change', (event) => {
      if (event.target?.id === 'referenceViewSelect') {
        const view = validView(event.target.value);
        setTimeout(() => view === FIELD_MANUAL_VIEW ? showFieldManual() : setPanelVisibility(view), 0);
      }
      if (event.target?.id === 'fieldManualSectionSelect') {
        setFieldManualSection(event.target.value, { clearSearch: true });
      }
    }, true);

    document.addEventListener('click', (event) => {
      const jump = event.target?.closest?.('[data-field-manual-jump]');
      if (jump) setFieldManualSection(jump.getAttribute('data-field-manual-jump'), { clearSearch: true });
    }, true);

    const observer = new MutationObserver(() => ensureFieldManualPickerOption());
    const options = byId('referenceLibraryOptions');
    if (options) observer.observe(options, { childList: true });

    [0, 200, 650, 1200, 2400].forEach((delay) => setTimeout(normalizeCurrentReference, delay));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();
