/* TapCalc Dev 3.0.0-alpha216 reference picker and baked-in glossary detach fix */
(function(){
  const READY_FLAG = '__tapcalcAlpha216GlossaryDetachReady';
  const STYLE_ID = 'tapcalc-alpha216-glossary-detach-style';
  const FIELD_MANUAL_VIEW = 'fieldmanual';
  let glossaryView = null;
  let glossaryPlaceholder = null;
  let glossaryExplicitlyOpen = false;

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

  function workspace(){
    return byId('referenceWorkspaceContent');
  }

  function injectStyles(){
    if (byId(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      body.measurement-page #referenceWorkspaceContent > .reference-view[data-reference-view="glossary"]:not(.active){display:none!important;}
      body.measurement-page #referenceWorkspaceContent[data-glossary-detached="1"] > .reference-view[data-reference-view="glossary"]{display:none!important;}
      body.measurement-page #refScreen .reference-library-option[data-reference-target="fieldmanual"]{background:linear-gradient(135deg,rgba(33,99,197,.94),rgba(15,64,121,.94));border-color:rgba(135,190,255,.42);}
    `;
    document.head.appendChild(style);
  }

  function captureGlossary(){
    if (glossaryView) return glossaryView;
    glossaryView = document.querySelector('#referenceWorkspaceContent > .reference-view[data-reference-view="glossary"]');
    if (glossaryView && !glossaryPlaceholder) {
      glossaryPlaceholder = document.createComment('tapcalc alpha216 glossary placeholder');
      glossaryView.parentNode?.insertBefore(glossaryPlaceholder, glossaryView.nextSibling);
    }
    return glossaryView;
  }

  function setSummary(view){
    const row = labels[view] || labels.converter;
    const group = byId('referenceLibraryGroup');
    const current = byId('referenceLibraryCurrent');
    const description = byId('referenceLibraryDescription');
    if (group) group.textContent = row[0];
    if (current) current.textContent = row[1];
    if (description) description.textContent = row[2];
  }

  function syncControls(view){
    const select = byId('referenceViewSelect');
    if (select && Array.from(select.options || []).some((option) => option.value === view)) select.value = view;
    document.querySelectorAll('#refScreen [data-reference-target]').forEach((button) => {
      const active = button.getAttribute('data-reference-target') === view;
      button.classList.toggle('active', active);
      if (button.getAttribute('role') === 'option') button.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.querySelectorAll('#refScreen [data-field-manual-open]').forEach((button) => {
      button.classList.toggle('active', view === FIELD_MANUAL_VIEW);
    });
  }

  function ensureFieldManualOption(){
    document.querySelectorAll('#refScreen .reference-library-count').forEach((count) => {
      count.textContent = '14 refs';
    });
    const options = byId('referenceLibraryOptions');
    if (!options || options.querySelector('[data-reference-target="fieldmanual"]')) return;
    const label = document.createElement('div');
    label.className = 'reference-library-group-label';
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

  function deactivateAllViews(){
    document.querySelectorAll('#referenceWorkspaceContent > .reference-view[data-reference-view]').forEach((view) => {
      view.classList.remove('active');
      view.hidden = true;
      view.style.display = 'none';
      view.style.visibility = 'hidden';
      view.style.pointerEvents = 'none';
      view.setAttribute('aria-hidden', 'true');
    });
  }

  function showFieldManual(){
    detachGlossary();
    const quick = byId('fieldManualQuickButton') || byId('fieldManualInlineAction');
    if (quick) quick.click();
    setSummary(FIELD_MANUAL_VIEW);
    syncControls(FIELD_MANUAL_VIEW);
  }

  function activateView(viewName){
    const safeView = labels[viewName] ? viewName : 'converter';
    if (safeView === FIELD_MANUAL_VIEW) {
      showFieldManual();
      return;
    }
    if (safeView === 'glossary') {
      attachGlossary();
      return;
    }
    detachGlossary();
    const panel = document.querySelector(`#referenceWorkspaceContent > .reference-view[data-reference-view="${safeView}"]`);
    if (!panel) return;
    deactivateAllViews();
    panel.classList.add('active');
    panel.hidden = false;
    panel.style.display = 'block';
    panel.style.visibility = 'visible';
    panel.style.pointerEvents = 'auto';
    panel.removeAttribute('aria-hidden');
    setSummary(safeView);
    syncControls(safeView);
    try { localStorage.setItem('tapcalcReferenceViewV1', safeView); } catch {}
  }

  function detachGlossary(){
    const view = captureGlossary();
    const ws = workspace();
    if (ws) ws.dataset.glossaryDetached = '1';
    glossaryExplicitlyOpen = false;
    if (!view) return;
    view.classList.remove('active');
    view.hidden = true;
    view.style.display = 'none';
    view.style.visibility = 'hidden';
    view.style.pointerEvents = 'none';
    view.setAttribute('aria-hidden', 'true');
    if (view.isConnected) view.remove();
    try {
      if (localStorage.getItem('tapcalcReferenceViewV1') === 'glossary') localStorage.setItem('tapcalcReferenceViewV1', 'converter');
    } catch {}
  }

  function attachGlossary(){
    const view = captureGlossary();
    const ws = workspace();
    if (!view || !ws) return;
    glossaryExplicitlyOpen = true;
    ws.dataset.glossaryDetached = '0';
    if (!view.isConnected) {
      if (glossaryPlaceholder?.parentNode === ws) {
        ws.insertBefore(view, glossaryPlaceholder.nextSibling);
      } else {
        ws.appendChild(view);
      }
    }
    deactivateAllViews();
    view.classList.add('active');
    view.hidden = false;
    view.style.display = 'block';
    view.style.visibility = 'visible';
    view.style.pointerEvents = 'auto';
    view.removeAttribute('aria-hidden');
    setSummary('glossary');
    syncControls('glossary');
    try { localStorage.setItem('tapcalcReferenceViewV1', 'glossary'); } catch {}
  }

  function install(){
    if (window[READY_FLAG]) return;
    window[READY_FLAG] = true;
    injectStyles();
    ensureFieldManualOption();
    setTimeout(detachGlossary, 0);
    setTimeout(detachGlossary, 250);
    setTimeout(detachGlossary, 900);

    document.addEventListener('click', (event) => {
      const fieldManual = event.target?.closest?.('[data-field-manual-open]');
      if (fieldManual) {
        setTimeout(detachGlossary, 0);
        setTimeout(detachGlossary, 100);
        return;
      }
      const trigger = event.target?.closest?.('#refScreen [data-reference-target]');
      if (!trigger) return;
      const view = trigger.getAttribute('data-reference-target') || 'converter';
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      activateView(view);
      setTimeout(() => activateView(view), 100);
    }, true);

    document.addEventListener('change', (event) => {
      if (event.target?.id !== 'referenceViewSelect') return;
      activateView(event.target.value || 'converter');
    }, true);

    document.addEventListener('click', () => {
      setTimeout(() => {
        ensureFieldManualOption();
        if (!glossaryExplicitlyOpen) detachGlossary();
      }, 180);
    }, true);

    const options = byId('referenceLibraryOptions');
    if (options) new MutationObserver(ensureFieldManualOption).observe(options, { childList: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();
