/* TapCalc alpha245 Folding Head reference. */
(function(){
  const READY_FLAG = '__tapcalcFoldingHeadReferenceReady';
  const VIEW_KEY = 'foldinghead';
  const VIEW_ID = 'foldingHeadReferenceView';
  const SAVED_VIEW_KEY = 'tapcalcReferenceViewV1';

  if (window[READY_FLAG]) return;
  window[READY_FLAG] = true;

  const capacityRows = [
    { line: '16', tap: '12', psi: '150', bar: '10.3' },
    { line: '18', tap: '12', psi: '150', bar: '10.3' },
    { line: '20', tap: '12', psi: '150', bar: '10.3' },
    { line: '24', tap: '16', psi: '150', bar: '10.3' },
    { line: '27', tap: '16', psi: '150', bar: '10.3' },
    { line: '30', tap: '24', psi: '150', bar: '10.3' },
    { line: '36', tap: '24', psi: '150', bar: '10.3' },
    { line: '42', tap: '30', psi: '150', bar: '10.3' },
    { line: '48', tap: '30', psi: '150', bar: '10.3' },
    { line: '54', tap: '42', psi: '100', bar: '6.9' },
    { line: '60', tap: '42', psi: '100', bar: '6.9' },
    { line: '66', tap: '42', psi: '100', bar: '6.9' },
    { line: '72', tap: '48', psi: '90', bar: '6.2' },
    { line: '78', tap: '48', psi: '70', bar: '4.8' },
    { line: '84', tap: '48', psi: '70', bar: '4.8' }
  ];

  const procedureRows = [
    ['HTS-5214', 'Folding Head Line Stop / Plant Series Fitting'],
    ['HTS-5215', 'Folding Head Line Stop / Pipeline Series Fitting'],
    ['HTS-5903', 'Folding Head Line Stop / Infrastructure Only'],
    ['HTS-5904', 'Folding Head Line Stop / JCM440 with pin type completion plug'],
    ['HTS-5905', 'Folding Head Line Stop / JCM440 with threaded completion plug']
  ];

  const setupChecks = [
    'Bring tape, sketch clearances, and confirm the equipment will physically fit.',
    'Walk the full line and look for branch connections feeding the section.',
    'Get available drawings, ISO, P&ID, or other client support documents.',
    'Complete HTS-5001 and the data sheet before job execution.',
    'Use Form 901.6 when a custom fitting is needed.',
    'Petrochemical work needs critical job review during quoting and before execution.'
  ];

  const executionChecks = [
    'Install and align hot tap equipment, leak test, complete the tap, then measure the coupon to verify pipe ID.',
    'Install the FHLS machine, verify alignment, leak test, open the service valve, and equalize as needed.',
    'If possible, lower power unit pressure to 350 psi before lowering the folding head.',
    'Do not force the head. If it will not reach set dimension, remove the machine and contact Technical Support.',
    'Do not cut the isolated section until the folding head seal is verified as satisfactory.',
    'After client work is complete, equalize from upstream, retrieve the head, close/vent, remove equipment, and set the completion plug.'
  ];

  const pccpChecks = [
    'Mark the saddle ID, remove the top saddle half, and chip concrete back to the steel cylinder.',
    'Grout the fitting and allow grout to set before torqueing straps.',
    'Cut/remove pre-stressing wires inside the fitting only after the saddle is installed.',
    'Polish the steel cylinder to aid gland sealing.',
    'Use soapy water on pipe and fitting gasket; do not use oil-base pipe lubricant.',
    'Leak test the gland before pouring grout between the gland and saddle.'
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

  function views(){
    return Array.from(document.querySelectorAll('#referenceWorkspaceContent > .reference-view[data-reference-view]'));
  }

  function referenceCountLabel(){
    const count = views().length || document.querySelectorAll('#referenceViewSelect option').length || 16;
    return `${count} refs`;
  }

  function updateReferenceCount(){
    const label = referenceCountLabel();
    document.querySelectorAll('#refScreen .reference-library-count').forEach((count) => {
      if (count.textContent.trim() !== label) count.textContent = label;
    });
  }

  function renderCapacityOptions(){
    return capacityRows.map((row) => `<option value="${escapeHtml(row.line)}">${escapeHtml(row.line)} inch line</option>`).join('');
  }

  function renderCapacityTable(){
    return capacityRows.map((row) => `
      <tr data-folding-head-line-row="${escapeHtml(row.line)}">
        <td>${escapeHtml(row.line)} inch</td>
        <td>${escapeHtml(row.tap)} inch</td>
        <td>${escapeHtml(row.psi)} psi / ${escapeHtml(row.bar)} bar</td>
        <td>180 deg F / 82.2 deg C</td>
      </tr>
    `).join('');
  }

  function renderProcedureRows(){
    return procedureRows.map(([procedure, description]) => `
      <tr>
        <td>${escapeHtml(procedure)}</td>
        <td>${escapeHtml(description)}</td>
      </tr>
    `).join('');
  }

  function renderCheckList(items){
    return items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  }

  function parseMeasurement(value){
    const raw = String(value || '').trim().replace(/"/g, '');
    if (!raw) return NaN;
    const mixed = raw.match(/^(-?\d+(?:\.\d+)?)\s+(\d+)\/(\d+)$/);
    if (mixed) {
      const whole = Number(mixed[1]);
      const numerator = Number(mixed[2]);
      const denominator = Number(mixed[3]);
      if (denominator) return whole + (numerator / denominator);
    }
    const fraction = raw.match(/^(-?\d+)\/(\d+)$/);
    if (fraction) {
      const numerator = Number(fraction[1]);
      const denominator = Number(fraction[2]);
      if (denominator) return numerator / denominator;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function formatMeasurement(value){
    return Number.isFinite(value) ? `${value.toFixed(4)} in` : '-';
  }

  function firstNumericText(ids){
    for (const id of ids) {
      const text = byId(id)?.textContent || byId(id)?.value || '';
      const parsed = parseMeasurement(text.replace(/^[^0-9.-]*/, ''));
      if (Number.isFinite(parsed)) return parsed;
    }
    return NaN;
  }

  function parseSummaryPipe(part){
    const text = byId('summaryPipe')?.textContent || '';
    const match = text.match(new RegExp(`${part}\\s+([0-9.]+)`, 'i'));
    return match ? parseMeasurement(match[1]) : NaN;
  }

  function useCurrentPipe(view){
    const pod = firstNumericText(['bcoTrueODDisplay', 'trueOd', 'pipeOdDisplay']) || parseSummaryPipe('OD');
    const wall = firstNumericText(['wallThk', 'wallThickness', 'bcoWallDisplay']) || parseSummaryPipe('Wall');
    const podInput = view.querySelector('#foldingHeadPod');
    const wallInput = view.querySelector('#foldingHeadWall');
    if (Number.isFinite(pod) && podInput) podInput.value = pod.toFixed(4);
    if (Number.isFinite(wall) && wallInput) wallInput.value = wall.toFixed(4);
    updateSetPoint(view);
  }

  function updateCapacity(view){
    const line = view.querySelector('#foldingHeadLineSize')?.value || capacityRows[0].line;
    const row = capacityRows.find((item) => item.line === line) || capacityRows[0];
    const set = (id, value) => {
      const el = view.querySelector(`#${id}`);
      if (el) el.textContent = value;
    };
    set('foldingHeadTapSizeOut', `${row.tap} in`);
    set('foldingHeadPressureOut', `${row.psi} psi / ${row.bar} bar`);
    set('foldingHeadTemperatureOut', '180 deg F / 82.2 deg C');
    set('foldingHeadSourceOut', 'Page 5');
    view.querySelectorAll('[data-folding-head-line-row]').forEach((tableRow) => {
      tableRow.classList.toggle('active', tableRow.dataset.foldingHeadLineRow === row.line);
    });
  }

  function updateSetPoint(view){
    const md = parseMeasurement(view.querySelector('#foldingHeadMd')?.value);
    const ld = parseMeasurement(view.querySelector('#foldingHeadLd')?.value);
    const pod = parseMeasurement(view.querySelector('#foldingHeadPod')?.value);
    const wall = parseMeasurement(view.querySelector('#foldingHeadWall')?.value);
    const start = parseMeasurement(view.querySelector('#foldingHeadStart')?.value);
    const sign = view.querySelector('#foldingHeadLdSign')?.value === 'subtract' ? -1 : 1;
    const status = view.querySelector('#foldingHeadSetPointStatus');
    const setPointOut = view.querySelector('#foldingHeadSetPointOut');
    const barTargetOut = view.querySelector('#foldingHeadBarTargetOut');
    const missing = [];
    if (!Number.isFinite(md)) missing.push('MD');
    if (!Number.isFinite(ld)) missing.push('LD');
    if (!Number.isFinite(pod)) missing.push('POD');
    if (!Number.isFinite(wall)) missing.push('wall');
    if (missing.length) {
      if (setPointOut) setPointOut.textContent = '-';
      if (barTargetOut) barTargetOut.textContent = Number.isFinite(start) ? 'Waiting on set point' : '-';
      if (status) {
        status.dataset.state = 'waiting';
        status.textContent = `Enter ${missing.join(', ')} to calculate the folding head set point.`;
      }
      return;
    }
    const setPoint = md + (sign * ld) + pod - wall;
    const barTarget = Number.isFinite(start) ? setPoint + start : NaN;
    if (setPointOut) setPointOut.textContent = formatMeasurement(setPoint);
    if (barTargetOut) barTargetOut.textContent = Number.isFinite(barTarget) ? formatMeasurement(barTarget) : 'Add start number if used';
    if (status) {
      status.dataset.state = 'ready';
      status.textContent = 'Set point follows the Folding Head measurement slide. Confirm LD sign and valve gate clearance before use.';
    }
  }

  function renderFoldingHeadReference(){
    return `
      <section class="folding-head-hero">
        <div>
          <p class="folding-head-eyebrow">Level III Reference</p>
          <h3>Folding Head Line Stop</h3>
          <p class="reference-copy">Fast inline guide for Folding Head Line Stop capacity, hot tap sizing, set-point math, and field checks without opening the training PDF.</p>
        </div>
        <div class="folding-head-source-card">
          <strong>FHLS</strong>
          <span>16 inch through 84 inch line sizes</span>
          <span>Source: Level III / 1- Folding Head Line Stops.pdf</span>
        </div>
      </section>

      <div class="folding-head-chip-row">
        <span>Smaller hot tap than conventional stop</span>
        <span>Reduced pressure / temperature capability</span>
        <span>Standard seals: Buna, Viton, EPDM, Urethane</span>
      </div>

      <section class="reference-card folding-head-card">
        <div class="folding-head-section-heading">
          <div>
            <p class="folding-head-eyebrow">Quick Lookup</p>
            <h4>Capacity And Tap Size</h4>
          </div>
          <span class="folding-head-muted">Source page 5</span>
        </div>
        <div class="folding-head-lookup-grid">
          <label class="folding-head-control" for="foldingHeadLineSize">
            <span>Line size</span>
            <select id="foldingHeadLineSize">${renderCapacityOptions()}</select>
          </label>
          <div class="folding-head-metric"><span>Hot tap size</span><strong id="foldingHeadTapSizeOut">-</strong></div>
          <div class="folding-head-metric"><span>Max pressure</span><strong id="foldingHeadPressureOut">-</strong></div>
          <div class="folding-head-metric"><span>Max temp</span><strong id="foldingHeadTemperatureOut">-</strong></div>
          <div class="folding-head-metric"><span>Source</span><strong id="foldingHeadSourceOut">-</strong></div>
        </div>
        <p class="folding-head-note">Pressure rating decreases when temperature is greater than 100 deg F / 37.8 deg C. Confirm job-specific rating before treating this as an approval.</p>
        <div class="folding-head-table-wrap">
          <table class="folding-head-table">
            <thead><tr><th>Line</th><th>Hot tap</th><th>Max pressure</th><th>Max temp</th></tr></thead>
            <tbody>${renderCapacityTable()}</tbody>
          </table>
        </div>
      </section>

      <section class="reference-card folding-head-card">
        <div class="folding-head-section-heading">
          <div>
            <p class="folding-head-eyebrow">Measurement Helper</p>
            <h4>Set Point</h4>
          </div>
          <span class="folding-head-muted">Source pages 13-14</span>
        </div>
        <div class="folding-head-formula-card">
          <strong>Set Point = MD +/- LD + POD - 1 wall thickness</strong>
          <span>Start number on bar is added to the set point when used.</span>
        </div>
        <div class="folding-head-input-grid">
          <label class="folding-head-control" for="foldingHeadMd"><span>MD</span><input id="foldingHeadMd" type="text" inputmode="decimal" placeholder="Measured distance"></label>
          <label class="folding-head-control" for="foldingHeadLd"><span>LD</span><input id="foldingHeadLd" type="text" inputmode="decimal" placeholder="Lost distance"></label>
          <label class="folding-head-control" for="foldingHeadLdSign"><span>LD sign</span><select id="foldingHeadLdSign"><option value="add">Add LD</option><option value="subtract">Subtract LD</option></select></label>
          <label class="folding-head-control" for="foldingHeadPod"><span>POD</span><input id="foldingHeadPod" type="text" inputmode="decimal" placeholder="Pipe OD"></label>
          <label class="folding-head-control" for="foldingHeadWall"><span>Wall</span><input id="foldingHeadWall" type="text" inputmode="decimal" placeholder="Wall thickness"></label>
          <label class="folding-head-control" for="foldingHeadStart"><span>Start number</span><input id="foldingHeadStart" type="text" inputmode="decimal" placeholder="Optional"></label>
        </div>
        <div class="button-row reference-actions folding-head-actions">
          <button type="button" id="foldingHeadUseCurrentPipe" class="secondary-btn">Use Current Pipe</button>
          <button type="button" id="foldingHeadClearInputs" class="secondary-btn">Clear</button>
        </div>
        <div class="folding-head-result-grid">
          <div class="folding-head-result"><span>Set Point</span><strong id="foldingHeadSetPointOut">-</strong></div>
          <div class="folding-head-result"><span>Bar Target</span><strong id="foldingHeadBarTargetOut">-</strong></div>
        </div>
        <p id="foldingHeadSetPointStatus" class="folding-head-status" data-state="waiting">Enter MD, LD, POD, and wall to calculate the set point.</p>
      </section>

      <details class="reference-card folding-head-detail">
        <summary><span>Use Case Notes</span><small>What makes folding heads different</small></summary>
        <div class="folding-head-detail-grid">
          <div>
            <h4>Good Fit</h4>
            <ul class="reference-note-list">
              <li>No split tee fitting required.</li>
              <li>Smaller/lighter equipment than conventional line stop setups.</li>
              <li>Can incorporate bypass lines.</li>
              <li>Can be left in place for extended periods.</li>
              <li>Fittings can be rebuilt and re-entered.</li>
            </ul>
          </div>
          <div>
            <h4>Watch Outs</h4>
            <ul class="reference-note-list">
              <li>Less effective with out-of-round pipe.</li>
              <li>Limited by flow.</li>
              <li>Build-up in the line can affect the stop.</li>
              <li>Typical applications listed are water/wastewater and flare lines.</li>
            </ul>
          </div>
        </div>
      </details>

      <details class="reference-card folding-head-detail">
        <summary><span>Paperwork And Procedures</span><small>Review before the job</small></summary>
        <ul class="reference-note-list folding-head-list">${renderCheckList(setupChecks)}</ul>
        <div class="folding-head-table-wrap folding-head-procedure-wrap">
          <table class="folding-head-table">
            <thead><tr><th>Procedure</th><th>Description</th></tr></thead>
            <tbody>${renderProcedureRows()}</tbody>
          </table>
        </div>
        <p class="folding-head-note">DS-803 entries called out in the packet include pipe size, tap size, product, wall thickness, flange rating, pressure, temperature, and FHLS orientation/configuration.</p>
      </details>

      <details class="reference-card folding-head-detail">
        <summary><span>Assembly And Execution</span><small>Field reminders</small></summary>
        <div class="folding-head-detail-grid">
          <div>
            <h4>Head Assembly</h4>
            <ul class="reference-note-list">
              <li>Set the top wheel to 1/8 inch less than inside pipe radius.</li>
              <li>Set the bottom wheel equal to half of the pipe inside diameter.</li>
              <li>Square the arms and verify the head is fully extended.</li>
              <li>Adjust strut arms and foot pad to inside pipe radius as required.</li>
              <li>Verify the nose wheel does not interfere with the valve gate-to-flange clearance.</li>
            </ul>
          </div>
          <div>
            <h4>Execution</h4>
            <ul class="reference-note-list">${renderCheckList(executionChecks)}</ul>
          </div>
        </div>
      </details>

      <details class="reference-card folding-head-detail">
        <summary><span>PCCP Reminders</span><small>Concrete cylinder pipe notes</small></summary>
        <ul class="reference-note-list folding-head-list">${renderCheckList(pccpChecks)}</ul>
      </details>
    `;
  }

  function bindFoldingHeadControls(view){
    if (!view || view.dataset.foldingHeadControlsReady === 'true') return;
    view.dataset.foldingHeadControlsReady = 'true';
    view.addEventListener('input', (event) => {
      if (event.target?.closest?.('.folding-head-input-grid')) updateSetPoint(view);
    });
    view.addEventListener('change', (event) => {
      if (event.target?.id === 'foldingHeadLineSize') updateCapacity(view);
      if (event.target?.closest?.('.folding-head-input-grid')) updateSetPoint(view);
    });
    view.addEventListener('click', (event) => {
      if (event.target?.closest?.('#foldingHeadUseCurrentPipe')) {
        useCurrentPipe(view);
        return;
      }
      if (event.target?.closest?.('#foldingHeadClearInputs')) {
        view.querySelectorAll('.folding-head-input-grid input').forEach((input) => { input.value = ''; });
        updateSetPoint(view);
      }
    });
    updateCapacity(view);
    updateSetPoint(view);
  }

  function ensureFoldingHeadView(){
    const workspace = byId('referenceWorkspaceContent');
    if (!workspace) return null;
    let view = byId(VIEW_ID);
    if (!view) {
      view = document.createElement('div');
      view.id = VIEW_ID;
      view.className = 'reference-view tapcalc-folding-head-view';
      view.dataset.referenceView = VIEW_KEY;
      view.hidden = true;
      view.setAttribute('aria-hidden', 'true');
      view.style.display = 'none';
      workspace.appendChild(view);
    }
    if (view.dataset.foldingHeadRendered !== 'true') {
      view.innerHTML = renderFoldingHeadReference();
      view.dataset.foldingHeadRendered = 'true';
    }
    bindFoldingHeadControls(view);
    return view;
  }

  function ensureSelectOption(){
    const select = byId('referenceViewSelect');
    if (!select || select.querySelector(`option[value="${VIEW_KEY}"]`)) return;
    const option = document.createElement('option');
    option.value = VIEW_KEY;
    option.textContent = 'Folding Head Line Stop';
    const smartStop = select.querySelector('option[value="smartstop"]');
    if (smartStop) smartStop.before(option);
    else (select.querySelector('optgroup[label="Field Reference"]') || select).appendChild(option);
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
    button.innerHTML = '<strong>Folding Head Line Stop</strong><span>Capacity table, set-point helper, and field checks</span>';
    const smartStop = options.querySelector('[data-reference-target="smartstop"]');
    const fieldManual = options.querySelector('[data-reference-target="fieldmanual"]');
    if (smartStop) smartStop.before(button);
    else if (fieldManual) fieldManual.after(button);
    else options.appendChild(button);
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

  function syncReferenceShell(options = {}){
    const group = byId('referenceLibraryGroup');
    const current = byId('referenceLibraryCurrent');
    const description = byId('referenceLibraryDescription');
    if (group) group.textContent = 'Field Reference';
    if (current) current.textContent = 'Folding Head Line Stop';
    if (description) description.textContent = 'Capacity table, set-point helper, and field checks';

    const select = byId('referenceViewSelect');
    if (select) select.value = VIEW_KEY;

    document.querySelectorAll('#refScreen [data-reference-target]').forEach((control) => {
      const isActive = control.getAttribute('data-reference-target') === VIEW_KEY;
      control.classList.toggle('active', isActive);
      if (control.getAttribute('role') === 'option') {
        control.setAttribute('aria-selected', isActive ? 'true' : 'false');
      }
    });

    if (options.closeMenu !== false) {
      const menu = byId('referenceLibraryMenu');
      const toggle = byId('referenceLibraryToggle');
      if (menu) menu.hidden = true;
      if (toggle) {
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    }
  }

  function selectFoldingHead(options = {}){
    const view = ensureFoldingHeadView();
    if (!view) return;
    views().forEach((panel) => setPanelState(panel, panel.dataset.referenceView === VIEW_KEY));
    syncReferenceShell(options);
    updateReferenceCount();
    try { localStorage.setItem(SAVED_VIEW_KEY, VIEW_KEY); } catch {}
  }

  let scheduled = false;

  function installFoldingHeadReference(){
    ensureFoldingHeadView();
    ensureSelectOption();
    ensureLibraryOption();
    updateReferenceCount();
    try {
      if (localStorage.getItem(SAVED_VIEW_KEY) === VIEW_KEY || byId('referenceViewSelect')?.value === VIEW_KEY) {
        setTimeout(() => selectFoldingHead({ closeMenu: false }), 20);
      }
    } catch {}
  }

  function scheduleInstall(){
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      installFoldingHeadReference();
    }, 80);
  }

  function bind(){
    installFoldingHeadReference();
    setTimeout(installFoldingHeadReference, 150);
    setTimeout(installFoldingHeadReference, 700);
    setTimeout(installFoldingHeadReference, 1500);

    document.addEventListener('click', (event) => {
      const trigger = event.target?.closest?.(`[data-reference-target="${VIEW_KEY}"], [data-folding-head-open]`);
      if (!trigger) return;
      setTimeout(selectFoldingHead, 0);
      setTimeout(selectFoldingHead, 90);
    }, true);

    document.addEventListener('change', (event) => {
      if (event.target?.id !== 'referenceViewSelect' || event.target.value !== VIEW_KEY) return;
      setTimeout(selectFoldingHead, 0);
      setTimeout(selectFoldingHead, 90);
    }, true);

    document.addEventListener('input', (event) => {
      if (event.target?.id === 'referenceLibrarySearch') setTimeout(installFoldingHeadReference, 0);
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
