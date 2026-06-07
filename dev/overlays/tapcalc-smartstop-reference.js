/* TapCalc Dev SmartStop reference source map. */
(function(){
  const READY_FLAG = '__tapcalcSmartStopReferenceReady';
  const VIEW_KEY = 'smartstop';
  const VIEW_ID = 'smartStopReferenceView';
  const SAVED_VIEW_KEY = 'tapcalcReferenceViewV1';
  const SMARTSTOP_ACTIVE_KEY = 'tapcalcSmartStopReferenceActiveV1';

  if (window[READY_FLAG]) return;
  window[READY_FLAG] = true;

  const pageMap = [
    {
      pages: '1-2',
      section: 'Cover / Admin',
      appUse: 'Source identification',
      status: 'Mapped',
      notes: 'Cover page and table of contents. Keep as source provenance, not field lookup content.'
    },
    {
      pages: '4-18',
      section: 'Introduction / Nomenclature',
      appUse: 'Training context',
      status: 'Mapped',
      notes: 'Overview, service context, and labeled SmartStop component visuals.'
    },
    {
      pages: '20-44',
      section: 'Set-Up',
      appUse: 'Procedure reference candidate',
      status: 'Mapped',
      notes: 'Equipment setup, stick/update references, head and seal assembly, latch pins, and central bit prep.'
    },
    {
      pages: '46-66',
      section: 'Break-Down',
      appUse: 'Procedure reference candidate',
      status: 'Mapped',
      notes: 'Disassembly/removal flow for seals, heads, latch pins, control bar, and related components.'
    },
    {
      pages: '68-78',
      section: 'Field Execution',
      appUse: 'Field guide candidate',
      status: 'Mapped',
      notes: 'Execution photos and sequence references for chip removal, seating, and retrieving SmartStop.'
    },
    {
      pages: '80-92',
      section: 'Case Studies',
      appUse: 'Background only',
      status: 'Mapped',
      notes: 'Field photos and notes. Useful for context, but likely too bulky for the app workflow.'
    },
    {
      pages: '93',
      section: 'Experience Matrix',
      appUse: 'Optional compact matrix',
      status: 'Candidate',
      notes: 'Possible field-facing summary if kit counts/deployments help planning.'
    },
    {
      pages: '95-103',
      section: 'Stopping Information',
      appUse: 'High-value lookup candidate',
      status: 'Extract next',
      notes: 'Overview sheet, suffix charts, seal-ring torque spec, and SmartStop stack-up drawings.'
    }
  ];

  const lookupCandidates = [
    {
      title: 'SmartStop Suffix Charts',
      pages: '96-101',
      status: 'Pending extraction',
      fields: 'Size, wall range, pipe I.D. range, shims, nose ring, seal, retaining ring, foot pad, nose pad'
    },
    {
      title: 'Seal-Ring Torque',
      pages: '102',
      status: 'Pending verification',
      fields: 'Seal-ring torque table after scan crop/OCR and manual double-check'
    },
    {
      title: 'Stack-Up Drawings',
      pages: '95-103',
      status: 'Index first',
      fields: 'Drawing/page index before any dimensional lookup is exposed'
    },
    {
      title: 'Experience Matrix',
      pages: '93',
      status: 'Optional',
      fields: 'Kit/deployment matrix only if it helps field planning'
    }
  ];

  const extractionSteps = [
    'Confirm the PDF page number against the printed page label before entering any value.',
    'Crop and OCR the suffix chart pages, then manually compare against the scan.',
    'Transcribe chart values into a dev-only data file with source page and row notes.',
    'Double-enter or spot-check wall range, pipe I.D. range, and kit component codes.',
    'Only wire job helpers after the lookup table is traceable back to a source page.'
  ];

  function byId(id){
    return document.getElementById(id);
  }

  function escapeHtml(value){
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  }

  function statusClass(status){
    return String(status || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'mapped';
  }

  function renderPageMap(){
    return pageMap.map((item) => `
      <article class="smartstop-map-row">
        <div class="smartstop-map-pages">Pages ${escapeHtml(item.pages)}</div>
        <div class="smartstop-map-main">
          <strong>${escapeHtml(item.section)}</strong>
          <span>${escapeHtml(item.appUse)}</span>
          <p>${escapeHtml(item.notes)}</p>
        </div>
        <span class="smartstop-status smartstop-status-${escapeHtml(statusClass(item.status))}">${escapeHtml(item.status)}</span>
      </article>
    `).join('');
  }

  function renderLookupCards(){
    return lookupCandidates.map((item) => `
      <article class="smartstop-lookup-card">
        <div>
          <span class="smartstop-card-kicker">Pages ${escapeHtml(item.pages)}</span>
          <strong>${escapeHtml(item.title)}</strong>
        </div>
        <p>${escapeHtml(item.fields)}</p>
        <span class="smartstop-status smartstop-status-${escapeHtml(statusClass(item.status))}">${escapeHtml(item.status)}</span>
      </article>
    `).join('');
  }

  function renderExtractionSteps(){
    return extractionSteps.map((step, index) => `
      <li>
        <span>${index + 1}</span>
        <p>${escapeHtml(step)}</p>
      </li>
    `).join('');
  }

  function renderSmartStopReference(){
    return `
      <section class="smartstop-hero">
        <div>
          <p class="smartstop-eyebrow">Dev Reference - Source Map</p>
          <h3>SmartStop Field Guide</h3>
          <p class="reference-copy">This is the staging area for the 104-page TEAM SmartStop Training scan. It maps what is in the packet now, then gives us a safe checklist for extracting the suffix and torque charts later.</p>
        </div>
        <div class="smartstop-source-card" aria-label="SmartStop source status">
          <strong>2316_001.pdf</strong>
          <span>104 pages</span>
          <span>Scan-only PDF</span>
          <span>Dev-only intake</span>
        </div>
      </section>

      <div class="smartstop-chip-row" aria-label="SmartStop build status">
        <span>Source mapped</span>
        <span>Lookup extraction pending</span>
        <span>No SmartStop calculator active</span>
      </div>

      <section class="reference-card smartstop-section">
        <div class="smartstop-section-heading">
          <div>
            <p class="smartstop-eyebrow">Packet Index</p>
            <h4>What The Scan Contains</h4>
          </div>
          <span class="smartstop-muted">Use this to decide what belongs in the app.</span>
        </div>
        <div class="smartstop-map-list">
          ${renderPageMap()}
        </div>
      </section>

      <section class="reference-card smartstop-section">
        <div class="smartstop-section-heading">
          <div>
            <p class="smartstop-eyebrow">Future Lookups</p>
            <h4>Best Candidates To Extract</h4>
          </div>
          <span class="smartstop-muted">These stay locked until verified.</span>
        </div>
        <div class="smartstop-lookup-grid">
          ${renderLookupCards()}
        </div>
      </section>

      <section class="reference-card smartstop-section smartstop-extraction-section">
        <div class="smartstop-section-heading">
          <div>
            <p class="smartstop-eyebrow">Data Safety</p>
            <h4>Extraction Checklist</h4>
          </div>
          <span class="smartstop-muted">This prevents bad scan data from becoming app data.</span>
        </div>
        <ol class="smartstop-extraction-list">
          ${renderExtractionSteps()}
        </ol>
      </section>
    `;
  }

  function ensureSmartStopView(){
    const workspace = byId('referenceWorkspaceContent');
    if (!workspace) return null;

    let view = byId(VIEW_ID);
    if (!view) {
      view = document.createElement('div');
      view.id = VIEW_ID;
      view.className = 'reference-view tapcalc-smartstop-view';
      view.dataset.referenceView = VIEW_KEY;
      view.hidden = true;
      view.setAttribute('aria-hidden', 'true');
      view.style.display = 'none';
      workspace.appendChild(view);
    }

    if (view.dataset.smartstopRendered !== 'true') {
      view.innerHTML = renderSmartStopReference();
      view.dataset.smartstopRendered = 'true';
    }
    return view;
  }

  function ensureSelectOption(){
    const select = byId('referenceViewSelect');
    if (!select || select.querySelector(`option[value="${VIEW_KEY}"]`)) return;
    const option = document.createElement('option');
    option.value = VIEW_KEY;
    option.textContent = 'SmartStop Field Guide';
    (select.querySelector('optgroup[label="Field Reference"]') || select).appendChild(option);
  }

  function ensureLibraryOption(){
    const options = byId('referenceLibraryOptions');
    if (!options || options.querySelector(`[data-reference-target="${VIEW_KEY}"]`)) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'reference-library-option';
    button.setAttribute('data-reference-target', VIEW_KEY);
    button.setAttribute('role', 'option');
    button.setAttribute('aria-selected', 'false');
    button.innerHTML = '<strong>SmartStop Field Guide</strong><span>Source map and verified lookup staging</span>';

    const fieldManual = options.querySelector('[data-reference-target="fieldmanual"]');
    if (fieldManual) {
      fieldManual.after(button);
      return;
    }

    const groupExists = Array.from(options.querySelectorAll('.reference-library-group-label'))
      .some((label) => label.textContent.trim() === 'Field Reference');
    if (!groupExists) {
      const group = document.createElement('div');
      group.className = 'reference-library-group-label';
      group.textContent = 'Field Reference';
      options.appendChild(group);
    }
    options.appendChild(button);
  }

  function updateReferenceCount(){
    document.querySelectorAll('#refScreen .reference-library-count').forEach((count) => {
      if (count.textContent.trim() !== '15 refs') count.textContent = '15 refs';
    });
  }

  function setPanelState(panel, isActive){
    panel.classList.toggle('active', isActive);
    panel.hidden = !isActive;
    panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    panel.style.setProperty('display', isActive ? 'block' : 'none', 'important');
    panel.style.setProperty('visibility', isActive ? 'visible' : 'hidden', 'important');
    panel.style.setProperty('pointer-events', isActive ? 'auto' : 'none', 'important');
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

  function syncReferenceShell(){
    const group = byId('referenceLibraryGroup');
    const current = byId('referenceLibraryCurrent');
    const description = byId('referenceLibraryDescription');
    if (group) group.textContent = 'Field Reference';
    if (current) current.textContent = 'SmartStop Field Guide';
    if (description) description.textContent = 'Source map and verified lookup staging';

    const select = byId('referenceViewSelect');
    if (select) select.value = VIEW_KEY;

    document.querySelectorAll('#refScreen [data-reference-target]').forEach((control) => {
      const isActive = control.getAttribute('data-reference-target') === VIEW_KEY;
      control.classList.toggle('active', isActive);
      if (control.getAttribute('role') === 'option') {
        control.setAttribute('aria-selected', isActive ? 'true' : 'false');
      }
    });

    const menu = byId('referenceLibraryMenu');
    const toggle = byId('referenceLibraryToggle');
    if (menu) menu.hidden = true;
    if (toggle) {
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  }

  function selectSmartStop(){
    const view = ensureSmartStopView();
    if (!view) return;

    document.querySelectorAll('#referenceWorkspaceContent > .reference-view[data-reference-view]').forEach((panel) => {
      setPanelState(panel, panel.dataset.referenceView === VIEW_KEY);
    });
    syncReferenceShell();
    updateReferenceCount();
    try {
      localStorage.setItem(SAVED_VIEW_KEY, VIEW_KEY);
      localStorage.setItem(SMARTSTOP_ACTIVE_KEY, 'true');
    } catch {}
  }

  let scheduled = false;
  let restoreScheduled = false;

  function shouldRestoreSmartStop(){
    if (byId('referenceViewSelect')?.value === VIEW_KEY) return true;
    try {
      return localStorage.getItem(SAVED_VIEW_KEY) === VIEW_KEY ||
        localStorage.getItem(SMARTSTOP_ACTIVE_KEY) === 'true';
    } catch {}
    return false;
  }

  function scheduleRestoreSmartStop(){
    if (!shouldRestoreSmartStop() || restoreScheduled) return;
    restoreScheduled = true;
    setTimeout(() => {
      restoreScheduled = false;
      selectSmartStop();
    }, 30);
  }

  function scheduleInstall(){
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      installSmartStopReference();
    }, 80);
  }

  function installSmartStopReference(){
    ensureSmartStopView();
    ensureSelectOption();
    ensureLibraryOption();
    updateReferenceCount();
    scheduleRestoreSmartStop();
  }

  function bind(){
    installSmartStopReference();
    setTimeout(installSmartStopReference, 150);
    setTimeout(installSmartStopReference, 700);
    setTimeout(installSmartStopReference, 1500);

    document.addEventListener('click', (event) => {
      const trigger = event.target?.closest?.(`[data-reference-target="${VIEW_KEY}"], [data-smartstop-open]`);
      if (!trigger) return;
      setTimeout(selectSmartStop, 0);
      setTimeout(selectSmartStop, 90);
      setTimeout(selectSmartStop, 260);
    }, true);

    document.addEventListener('click', (event) => {
      const trigger = event.target?.closest?.('[data-reference-target]');
      if (!trigger || trigger.getAttribute('data-reference-target') === VIEW_KEY) return;
      try { localStorage.removeItem(SMARTSTOP_ACTIVE_KEY); } catch {}
    }, true);

    document.addEventListener('change', (event) => {
      if (event.target?.id !== 'referenceViewSelect' || event.target.value !== VIEW_KEY) return;
      setTimeout(selectSmartStop, 0);
      setTimeout(selectSmartStop, 90);
    }, true);

    document.addEventListener('change', (event) => {
      if (event.target?.id !== 'referenceViewSelect' || event.target.value === VIEW_KEY) return;
      try { localStorage.removeItem(SMARTSTOP_ACTIVE_KEY); } catch {}
    }, true);

    document.addEventListener('input', (event) => {
      if (event.target?.id === 'referenceLibrarySearch') setTimeout(installSmartStopReference, 0);
    }, true);

    const refScreen = byId('refScreen');
    if (refScreen) {
      new MutationObserver(scheduleInstall).observe(refScreen, {
        childList: true,
        subtree: true
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();
