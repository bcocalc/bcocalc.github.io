/* TapCalc Dev reference router with Field Manual dedupe folded in */
(function(){
  const READY_FLAG = '__tapcalcReferenceRouterReady';
  const SAVED_VIEW_KEY = 'tapcalcReferenceViewV1';
  const DEFAULT_VIEW = 'converter';
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

  if (window[READY_FLAG]) return;
  window[READY_FLAG] = true;
  window.__tapcalcAlpha219ReferenceRouterReady = true;
  window.__tapcalcAlpha221ReferenceDedupeReady = true;

  let activeView = DEFAULT_VIEW;
  let applying = false;
  let scheduled = false;

  function byId(id){
    return document.getElementById(id);
  }

  function views(){
    return Array.from(document.querySelectorAll('#referenceWorkspaceContent > .reference-view[data-reference-view]'));
  }

  function panelFor(view){
    return views().find((panel) => panel.dataset.referenceView === view) || null;
  }

  function repairReferenceAccordionDamage(){
    const card = document.querySelector('#refScreen .reference-workspace-card');
    const glossary = panelFor('glossary');
    if (card) {
      card.dataset.accordionReady = 'true';
      card.classList.remove('collapsed');
    }
    if (!card || !glossary) return;
    const movedBody = card.querySelector(':scope > .accordion-body');
    if (movedBody) {
      while (movedBody.firstChild) glossary.appendChild(movedBody.firstChild);
      movedBody.remove();
    }
    const heading = glossary.querySelector(':scope > h3.accordion-heading');
    if (heading) {
      heading.classList.remove('accordion-heading');
      heading.querySelector('.accordion-caret')?.remove();
    }
  }

  function makeRetiredMarker(id){
    const marker = document.createElement('span');
    marker.id = id;
    marker.hidden = true;
    marker.setAttribute('aria-hidden', 'true');
    marker.dataset.tapcalcRetiredShortcut = 'true';
    return marker;
  }

  function ensureRetiredMarker(id){
    const existing = byId(id);
    if (existing?.dataset.tapcalcRetiredShortcut === 'true') return;
    if (existing) {
      const wrapper = existing.closest('.field-manual-entry-row, .field-manual-quick-row');
      (wrapper || existing).replaceWith(makeRetiredMarker(id));
      return;
    }
    if (document.body) document.body.appendChild(makeRetiredMarker(id));
  }

  function cleanFieldManualShortcuts(){
    ensureRetiredMarker('fieldManualQuickButton');
    ensureRetiredMarker('fieldManualInlineAction');
  }

  function ensureFieldManualOption(){
    repairReferenceAccordionDamage();
    cleanFieldManualShortcuts();

    const select = byId('referenceViewSelect');
    if (select && !select.querySelector('option[value="fieldmanual"]')) {
      const option = document.createElement('option');
      option.value = 'fieldmanual';
      option.textContent = 'Field Manual';
      (select.querySelector('optgroup[label="Field Reference"]') || select).appendChild(option);
    }

    document.querySelectorAll('#refScreen .reference-library-count').forEach((count) => {
      if (count.textContent.trim() !== '14 refs') count.textContent = '14 refs';
    });

    const options = byId('referenceLibraryOptions');
    if (!options || options.querySelector('[data-reference-target="fieldmanual"]')) return;
    const group = document.createElement('div');
    group.className = 'reference-library-group-label';
    group.textContent = 'Field Reference';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'reference-library-option';
    button.setAttribute('data-reference-target', 'fieldmanual');
    button.setAttribute('role', 'option');
    button.setAttribute('aria-selected', 'false');
    button.innerHTML = '<strong>Field Manual</strong><span>Inline RPM, Hi-Stop, machine specs, and checks</span>';
    options.append(group, button);
  }

  function safeView(view){
    const requested = String(view || '').trim();
    if (requested === 'garlock600') return panelFor('gaskettorque') ? 'gaskettorque' : DEFAULT_VIEW;
    if (requested && panelFor(requested)) return requested;
    if (panelFor(DEFAULT_VIEW)) return DEFAULT_VIEW;
    return views()[0]?.dataset.referenceView || DEFAULT_VIEW;
  }

  function setPanelState(panel, isActive){
    panel.classList.toggle('active', isActive);
    panel.hidden = !isActive;
    panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    panel.style.setProperty('display', isActive ? 'block' : 'none', 'important');
    panel.style.setProperty('visibility', isActive ? 'visible' : 'hidden', 'important');
    panel.style.setProperty('pointer-events', isActive ? 'auto' : 'none', 'important');
    panel.style.opacity = isActive ? '1' : '0';
    if (isActive) {
      panel.removeAttribute('aria-hidden');
      panel.style.removeProperty('height');
      panel.style.removeProperty('max-height');
      panel.style.removeProperty('overflow');
    } else {
      panel.style.height = '0';
      panel.style.maxHeight = '0';
      panel.style.overflow = 'hidden';
    }
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
    document.querySelectorAll('#refScreen [data-reference-target]').forEach((control) => {
      const isActive = control.getAttribute('data-reference-target') === view;
      control.classList.toggle('active', isActive);
      if (control.getAttribute('role') === 'option') {
        control.setAttribute('aria-selected', isActive ? 'true' : 'false');
      }
    });
    document.querySelectorAll('#refScreen [data-field-manual-open]').forEach((control) => {
      control.classList.toggle('active', view === 'fieldmanual');
    });
  }

  function closeMenu(){
    const menu = byId('referenceLibraryMenu');
    const toggle = byId('referenceLibraryToggle');
    if (menu) menu.hidden = true;
    if (toggle) {
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  }

  function rebuildGlossaryIfNeeded(){
    const glossary = panelFor('glossary');
    if (!glossary?.querySelector('#glossaryTableBody')) return;
    if (typeof window.filterGlossaryRows === 'function') {
      try { window.filterGlossaryRows(byId('glossarySearchInput')?.value || ''); } catch {}
    }
  }

  function selectReference(view, options = {}){
    ensureFieldManualOption();
    const target = safeView(view);
    const panels = views();
    if (!panels.length) return;

    activeView = target;
    applying = true;
    panels.forEach((panel) => setPanelState(panel, panel.dataset.referenceView === target));
    applying = false;

    syncSummary(target);
    syncControls(target);
    rebuildGlossaryIfNeeded();
    if (options.closeMenu !== false) closeMenu();
    if (options.persist !== false) {
      try { localStorage.setItem(SAVED_VIEW_KEY, target); } catch {}
    }
  }

  function startupView(){
    let saved = '';
    try {
      saved = localStorage.getItem(SAVED_VIEW_KEY) || '';
      if (saved === 'glossary') {
        localStorage.setItem(SAVED_VIEW_KEY, DEFAULT_VIEW);
        saved = DEFAULT_VIEW;
      }
    } catch {}
    return saved || byId('referenceViewSelect')?.value || DEFAULT_VIEW;
  }

  function scheduleSelect(view, options = {}){
    selectReference(view, options);
    setTimeout(() => selectReference(view, options), 80);
    setTimeout(() => selectReference(view, options), 260);
  }

  function scheduleMaintenance(){
    if (scheduled || applying) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      selectReference(activeView, { closeMenu: false, persist: false });
    }, 80);
  }

  function bind(){
    ensureFieldManualOption();
    setTimeout(ensureFieldManualOption, 150);
    setTimeout(ensureFieldManualOption, 700);
    setTimeout(ensureFieldManualOption, 1500);

    document.addEventListener('click', (event) => {
      const option = event.target?.closest?.('#refScreen [data-reference-target]');
      if (!option) return;
      scheduleSelect(option.getAttribute('data-reference-target') || DEFAULT_VIEW, { closeMenu: true, persist: true });
    }, true);

    document.addEventListener('change', (event) => {
      if (event.target?.id !== 'referenceViewSelect') return;
      scheduleSelect(event.target.value || DEFAULT_VIEW, { closeMenu: true, persist: true });
    }, true);

    document.addEventListener('click', (event) => {
      if (event.target?.closest?.('[data-field-manual-open]')) {
        setTimeout(() => scheduleSelect('fieldmanual', { closeMenu: true, persist: true }), 0);
      }
    }, true);

    const refScreen = byId('refScreen');
    if (refScreen) {
      new MutationObserver(scheduleMaintenance).observe(refScreen, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'hidden', 'aria-hidden']
      });
    }

    scheduleSelect(startupView(), { closeMenu: false, persist: true });
    window.tapcalcSetReferenceView = (view) => scheduleSelect(view || DEFAULT_VIEW, { closeMenu: true, persist: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();
