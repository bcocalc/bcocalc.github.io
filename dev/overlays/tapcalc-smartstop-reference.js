/* SmartStop read-only field reference. Main Reference routing stays with its existing owner. */
(function(){
  const READY_FLAG = '__tapcalcSmartStopReferenceReady';
  const VIEW_KEY = 'smartstop';
  const VIEW_ID = 'smartStopReferenceView';
  const SAVED_VIEW_KEY = 'tapcalcReferenceViewV1';
  const SMARTSTOP_ACTIVE_KEY = 'tapcalcSmartStopReferenceActiveV1';

  if (window[READY_FLAG]) return;
  window[READY_FLAG] = true;


  function rangeLabel(min, max){
    return `${Number(min).toFixed(3).replace(/^0/, '')} - ${Number(max).toFixed(3).replace(/^0/, '')}`;
  }

  function kit(suffix, wallMin, wallMax, pipeIdMin, pipeIdMax, footPadShims, nosePadShims, noseRing, seal, retainingRing, footPad, nosePad, options = {}){
    return {
      suffix,
      sourceLabel: options.sourceLabel || suffix,
      pressure: options.pressure || 'Standard',
      wallMin,
      wallMax,
      wallLabel: options.wallLabel || rangeLabel(wallMin, wallMax),
      pipeIdMin,
      pipeIdMax,
      pipeIdLabel: options.pipeIdLabel || rangeLabel(pipeIdMin, pipeIdMax),
      footPadShims,
      nosePadShims,
      noseRing,
      seal,
      retainingRing,
      footPad,
      nosePad,
      primaryNosePad: options.primaryNosePad || '',
      secondaryNosePad: options.secondaryNosePad || '',
      sourceNote: options.sourceNote || ''
    };
  }

  const suffixCharts = [
    {
      size: '4',
      label: '4" SmartStop',
      pdfPage: 96,
      printedPage: 29,
      note: 'Source has separate primary and secondary nose pad columns. Row -07 is printed after -06 but covers the thinnest wall range.',
      rows: [
        kit('-01', .204, .218, 4.064, 4.093, 3, 1, '-01', '-X1', '-01', '-01', '', { primaryNosePad: '-01', secondaryNosePad: '-01' }),
        kit('-02', .219, .248, 4.004, 4.063, 0, 0, '-01', '-X2', '-01', '-01', '', { primaryNosePad: '-01', secondaryNosePad: '-02' }),
        kit('-03', .249, .279, 3.942, 4.003, 3, 1, '-02', '-X3', '-02', '-02', '', { primaryNosePad: '-02', secondaryNosePad: '-03' }),
        kit('-04', .280, .309, 3.882, 3.941, 0, 0, '-02', '-X4', '-02', '-02', '', { primaryNosePad: '-02', secondaryNosePad: '-04' }),
        kit('-05', .310, .340, 3.820, 3.881, 3, 1, '-03', '-X5', '-03', '-03', '', { primaryNosePad: '-03', secondaryNosePad: '-05' }),
        kit('-06', .341, .370, 3.760, 3.819, 0, 0, '-03', '-X6', '-03', '-03', '', { primaryNosePad: '-03', secondaryNosePad: '-06' }),
        kit('-07', .188, .203, 4.094, 4.124, 3, 2, '-01', '-X1', '-01', '-01', '', { primaryNosePad: '-01', secondaryNosePad: '-07', sourceNote: 'Printed out of wall-thickness order on the source chart.' })
      ]
    },
    {
      size: '6',
      label: '6" SmartStop',
      pdfPage: 97,
      printedPage: 30,
      note: 'Source row -03 wall range reads .230 - .266 and overlaps row -02. Preserved exactly as shown.',
      rows: [
        kit('-01', .166, .202, 6.221, 6.293, 3, 2, '-01', '-X1', '-01', '-01', '-01'),
        kit('-02', .202, .238, 6.149, 6.221, 0, 0, '-01', '-X2', '-01', '-01', '-01'),
        kit('-03', .230, .266, 6.093, 6.166, 3, 2, '-02', '-X3', '-02', '-02', '-02', { sourceNote: 'Wall range overlaps row -02 in the source scan.' }),
        kit('-04', .266, .302, 6.021, 6.093, 0, 0, '-02', '-X4', '-02', '-02', '-02'),
        kit('-05', .303, .339, 5.947, 6.020, 3, 2, '-03', '-X5', '-03', '-03', '-03'),
        kit('-06', .339, .375, 5.875, 5.947, 0, 0, '-03', '-X6', '-03', '-03', '-03'),
        kit('-07', .376, .412, 5.801, 5.874, 3, 2, '-04', '-X7', '-04', '-04', '-04'),
        kit('-08', .412, .448, 5.729, 5.801, 0, 0, '-04', '-X8', '-04', '-04', '-04')
      ]
    },
    {
      size: '8',
      label: '8" SmartStop',
      pdfPage: 98,
      printedPage: 31,
      note: 'Rows -09 and -10 are marked 1480 psi on the source chart.',
      rows: [
        kit('-01', .250, .298, 8.029, 8.125, 3, 2, '-01', '-X1', '-01', '-01', '-01'),
        kit('-02', .299, .346, 7.933, 8.028, 0, 0, '-01', '-X2', '-01', '-01', '-01'),
        kit('-03', .347, .395, 7.835, 7.932, 3, 2, '-02', '-X3', '-02', '-02', '-02'),
        kit('-04', .396, .443, 7.739, 7.834, 0, 0, '-02', '-X4', '-02', '-02', '-02'),
        kit('-05', .444, .492, 7.641, 7.738, 3, 2, '-03', '-X5', '-03', '-03', '-03'),
        kit('-06', .493, .540, 7.545, 7.640, 0, 0, '-03', '-X6', '-03', '-03', '-03'),
        kit('-07', .541, .589, 7.447, 7.544, 3, 2, '-04', '-X7', '-04', '-04', '-04'),
        kit('-08', .590, .637, 7.351, 7.446, 0, 0, '-04', '-X8', '-04', '-04', '-04'),
        kit('-09', .225, .250, 8.125, 8.175, 6, 4, '-01', '-X1', '-01', '-01', '-01', { pressure: '1480 psi', sourceLabel: '-09 (1480 psi)' }),
        kit('-10', .219, .225, 8.175, 8.187, 6, 6, '-01', '-X1', '-01', '-01', '-01', { pressure: '1480 psi', sourceLabel: '-10 (1480 psi)' })
      ]
    },
    {
      size: '10',
      label: '10" SmartStop',
      pdfPage: 99,
      printedPage: 32,
      note: 'Rows -10 and -11 are marked 1480 psi on the source chart.',
      rows: [
        kit('-01', .237, .287, 10.176, 10.276, 3, 2, '-01', '-X1', '-01', '-01', '-01'),
        kit('-02', .288, .337, 10.076, 10.175, 0, 0, '-01', '-X2', '-01', '-01', '-01'),
        kit('-03', .338, .388, 9.974, 10.075, 3, 2, '-02', '-X3', '-02', '-02', '-02'),
        kit('-04', .389, .438, 9.874, 9.973, 0, 0, '-02', '-X4', '-02', '-02', '-02'),
        kit('-05', .439, .489, 9.772, 9.873, 3, 2, '-03', '-X5', '-03', '-03', '-03'),
        kit('-06', .490, .539, 9.672, 9.771, 0, 0, '-03', '-X6', '-03', '-03', '-03'),
        kit('-07', .540, .590, 9.570, 9.671, 3, 2, '-04', '-X7', '-04', '-04', '-04'),
        kit('-08', .591, .640, 9.470, 9.569, 0, 0, '-04', '-X8', '-04', '-04', '-04'),
        kit('-09', .641, .691, 9.368, 9.469, 0, 0, '-05', '-X9', '-05', '-05', '-05'),
        kit('-10', .212, .236, 10.277, 10.326, 6, 4, '-01', '-X1', '-01', '-01', '-01', { pressure: '1480 psi', sourceLabel: '-10 (1480 psi)' }),
        kit('-11', .187, .211, 10.327, 10.376, 9, 6, '-01', '-X1', '-01', '-01', '-01', { pressure: '1480 psi', sourceLabel: '-11 (1480 psi)' })
      ]
    },
    {
      size: '12',
      label: '12" SmartStop',
      pdfPage: 100,
      printedPage: 33,
      note: 'Source row -03 wall range reads .343 - .406 and overlaps row -02. Preserved exactly as shown.',
      rows: [
        kit('-01', .250, .313, 12.125, 12.250, 3, 2, '-01', '-X1', '-01', '-01', '-01'),
        kit('-02', .313, .376, 11.999, 12.125, 0, 0, '-01', '-X2', '-01', '-01', '-01'),
        kit('-03', .343, .406, 11.938, 12.064, 3, 2, '-02', '-X3', '-02', '-02', '-02', { sourceNote: 'Wall range overlaps row -02 in the source scan.' }),
        kit('-04', .406, .469, 11.812, 11.938, 0, 0, '-02', '-X4', '-02', '-02', '-02'),
        kit('-05', .468, .531, 11.688, 11.814, 3, 2, '-03', '-X5', '-03', '-03', '-03'),
        kit('-06', .531, .594, 11.562, 11.688, 0, 0, '-03', '-X6', '-03', '-03', '-03'),
        kit('-07', .593, .656, 11.438, 11.564, 3, 2, '-04', '-X7', '-04', '-04', '-04'),
        kit('-08', .656, .719, 11.312, 11.438, 0, 0, '-04', '-X8', '-04', '-04', '-04'),
        kit('-09', .719, .782, 11.187, 11.313, 0, 0, '-05', '-X9', '-05', '-05', '-05'),
        kit('-10', .219, .250, 12.250, 12.312, 6, 4, '-01', '-X1', '-01', '-01', '-01', { pressure: '1480 psi', sourceLabel: '-10 (1480 psi)' })
      ]
    },
    {
      size: '16',
      label: '16" SmartStop',
      pdfPage: 101,
      printedPage: 34,
      note: 'Row -09 is marked 1480 psi on the source chart.',
      rows: [
        kit('-01', .250, .324, 15.351, 15.500, 3, 2, '-01', '-X1', '-01', '-01', '-01'),
        kit('-02', .325, .400, 15.200, 15.350, 0, 0, '-01', '-X2', '-01', '-01', '-01'),
        kit('-03', .401, .476, 15.048, 15.199, 3, 2, '-02', '-X3', '-02', '-02', '-02'),
        kit('-04', .477, .551, 14.898, 15.047, 0, 0, '-02', '-X4', '-02', '-02', '-02'),
        kit('-05', .552, .627, 14.746, 14.897, 3, 2, '-03', '-X5', '-03', '-03', '-03'),
        kit('-06', .628, .702, 14.596, 14.745, 0, 0, '-03', '-X6', '-03', '-03', '-03'),
        kit('-07', .703, .778, 14.444, 14.595, 3, 2, '-04', '-X7', '-04', '-04', '-04'),
        kit('-08', .779, .853, 14.294, 14.443, 0, 0, '-04', '-X8', '-04', '-04', '-04'),
        kit('-09', .200, .249, 15.501, 15.600, 6, 4, '-01', '-X1', '-01', '-01', '-01', { pressure: '1480 psi', sourceLabel: '-09 (1480 psi)' })
      ]
    }
  ];

  const torqueRows = [
    { screwSize: '#8', ftLb: '2.5', inLb: '30' },
    { screwSize: '#10', ftLb: '3.75', inLb: '45' },
    { screwSize: '1/4"', ftLb: '9', inLb: '108' },
    { screwSize: '5/16"', ftLb: '18', inLb: '216' },
    { screwSize: '3/8"', ftLb: '32', inLb: '384' },
    { screwSize: '1/2"', ftLb: '80', inLb: '' },
    { screwSize: '5/8"', ftLb: '150', inLb: '' },
    { screwSize: '3/4"', ftLb: '270', inLb: '' },
    { screwSize: '7/8"', ftLb: '440', inLb: '' },
    { screwSize: '1"', ftLb: '650', inLb: '' }
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


  function renderSizeOptions(){
    return suffixCharts.map((chart) => `<option value="${escapeHtml(chart.size)}">${escapeHtml(chart.label)}</option>`).join('');
  }

  function parseDecimal(value){
    const normalized = String(value ?? '').trim();
    if (!normalized) return null;
    if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return NaN;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : NaN;
  }

  function lookupValueLabel(value){
    if (value === null) return '';
    return Number(value).toFixed(3).replace(/^0/, '');
  }

  function matchesRange(value, min, max){
    if (value === null) return true;
    return Number.isFinite(value) && value >= min && value <= max;
  }

  function visibleNosePad(row){
    if (row.primaryNosePad || row.secondaryNosePad) {
      return `Primary ${row.primaryNosePad || '-'} / Secondary ${row.secondaryNosePad || '-'}`;
    }
    return row.nosePad || '-';
  }

  function renderSuffixRow(row, expanded = false){
    const pressure = row.pressure && row.pressure !== 'Standard'
      ? `<span class="smartstop-pressure-chip">${escapeHtml(row.pressure)}</span>`
      : '';
    const sourceNote = row.sourceNote
      ? `<p class="smartstop-row-note">${escapeHtml(row.sourceNote)}</p>`
      : '';
    return `
      <details class="smartstop-result-row" data-suffix="${escapeHtml(row.suffix)}"${expanded ? ' open' : ''}>
        <summary class="smartstop-result-main">
          <div>
            <span class="smartstop-card-kicker">Suffix</span>
            <strong>${escapeHtml(row.sourceLabel)}</strong>
            ${pressure}
          </div>
          <div class="smartstop-range-pair">
            <span>Wall ${escapeHtml(row.wallLabel)}</span>
            <span>Pipe I.D. ${escapeHtml(row.pipeIdLabel)}</span>
          </div>
        </summary>
        ${sourceNote}
        <div class="smartstop-kit-grid">
          <span><b>Foot shims</b>${escapeHtml(row.footPadShims)}</span>
          <span><b>Nose shims</b>${escapeHtml(row.nosePadShims)}</span>
          <span><b>Nose ring</b>${escapeHtml(row.noseRing)}</span>
          <span><b>Seal</b>${escapeHtml(row.seal)}</span>
          <span><b>Retaining</b>${escapeHtml(row.retainingRing)}</span>
          <span><b>Foot pad</b>${escapeHtml(row.footPad)}</span>
          <span class="smartstop-kit-wide"><b>Nose pad</b>${escapeHtml(visibleNosePad(row))}</span>
        </div>
      </details>
    `;
  }

  function filterChartRows(chart, wallValue, pipeIdValue){
    return chart.rows.filter((row) => (
      matchesRange(wallValue, row.wallMin, row.wallMax) &&
      matchesRange(pipeIdValue, row.pipeIdMin, row.pipeIdMax)
    ));
  }

  function renderLookupResults(chart, rows, filters){
    const filterSummary = [
      filters.wallValue !== null ? `wall ${lookupValueLabel(filters.wallValue)}` : '',
      filters.pipeIdValue !== null ? `pipe I.D. ${lookupValueLabel(filters.pipeIdValue)}` : ''
    ].filter(Boolean).join(' and ');
    const matchText = filterSummary
      ? `${rows.length} match${rows.length === 1 ? '' : 'es'} for ${escapeHtml(filterSummary)}`
      : `${rows.length} chart rows shown`;
    const rowsHtml = rows.length
      ? rows.map(row => renderSuffixRow(row, rows.length === 1)).join('')
      : '<div class="smartstop-empty-result">No chart row matches all selections. Confirm the source chart and measurements; no nearest-match substitution is made.</div>';
    return `
      <div class="smartstop-result-summary">
        <strong>${escapeHtml(chart.label)}</strong>
        <span>${matchText}</span>
        <em>PDF page ${escapeHtml(chart.pdfPage)} / printed page ${escapeHtml(chart.printedPage)}</em>
      </div>
      ${chart.note ? `<p class="smartstop-source-note">${escapeHtml(chart.note)}</p>` : ''}
      <div class="smartstop-results-list">${rowsHtml}</div>
    `;
  }

  function renderTorqueRows(){
    return torqueRows.map((row) => `
      <tr>
        <td>${escapeHtml(row.screwSize)}</td>
        <td>${escapeHtml(row.ftLb)}</td>
        <td>${row.inLb ? escapeHtml(row.inLb) : '<span class="smartstop-muted-cell">not printed</span>'}</td>
      </tr>
    `).join('');
  }

  function resetSmartStopFilters(view){
    for (const id of ['smartStopWallFilter', 'smartStopPipeIdFilter', 'smartStopSuffixSelect']) view.querySelector('#' + id).value = '';
  }

  function populateSmartStopSuffixes(view){
    const chart = suffixCharts.find(item => item.size === view.querySelector('#smartStopSizeSelect').value);
    view.querySelector('#smartStopSuffixSelect').innerHTML = '<option value="">All suffixes</option>' +
      (chart?.rows || []).map(row => `<option value="${escapeHtml(row.suffix)}">${escapeHtml(row.sourceLabel)}</option>`).join('');
  }

  function updateSmartStopLookup(view){
    const chart = suffixCharts.find(item => item.size === view.querySelector('#smartStopSizeSelect').value);
    const wall = view.querySelector('#smartStopWallFilter');
    const pipeId = view.querySelector('#smartStopPipeIdFilter');
    const wallValue = parseDecimal(wall.value);
    const pipeIdValue = parseDecimal(pipeId.value);
    wall.setAttribute('aria-invalid', String(Number.isNaN(wallValue)));
    pipeId.setAttribute('aria-invalid', String(Number.isNaN(pipeIdValue)));
    const target = view.querySelector('#smartStopLookupResults');
    const status = view.querySelector('#smartStopFilterStatus');
    const invalid = Number.isNaN(wallValue) || Number.isNaN(pipeIdValue);
    status.dataset.state = invalid ? 'error' : '';
    if (!chart || invalid) {
      target.innerHTML = '';
      status.textContent = !chart ? 'Choose a listed SmartStop size.' : 'Enter positive decimal inches, or leave the measurement blank. Fractions and negative values are not accepted.';
      return;
    }
    const suffix = view.querySelector('#smartStopSuffixSelect').value;
    const rows = filterChartRows(chart, wallValue, pipeIdValue).filter(row => !suffix || row.suffix === suffix);
    const filtered = !!suffix || wallValue !== null || pipeIdValue !== null;
    status.textContent = filtered && rows.length > 1
      ? rows.length + ' matching rows. Overlapping ranges require review; no kit is automatically selected.'
      : filtered ? rows.length + ' matching row(s). Confirm the source and approved equipment requirements.'
      : rows.length + ' suffixes. Open a row to see its parts, or filter by measurements.';
    status.dataset.state = filtered && rows.length !== 1 ? 'warning' : '';
    target.innerHTML = renderLookupResults(chart, rows, { wallValue, pipeIdValue });
  }

  function showSmartStopSection(view){
    const selected = view.querySelector('#smartStopSectionSelect').value;
    for (const section of view.querySelectorAll('[data-smartstop-section]')) {
      section.hidden = section.dataset.smartstopSection !== selected;
    }
  }

  function updateSmartStopTorque(view){
    const value = view.querySelector('#smartStopScrewSelect').value;
    const row = /^\d+$/.test(value) ? torqueRows[Number(value)] : null;
    view.querySelector('#smartStopTorqueResult').textContent = row
      ? row.screwSize + ': ' + row.ftLb + ' ft-lb / ' + (row.inLb ? row.inLb + ' in-lb' : 'in-lb not printed')
      : 'Choose a screw size.';
  }

  function bindSmartStopControls(view){
    if (!view || view.dataset.smartstopControlsReady === 'true') return;
    view.dataset.smartstopControlsReady = 'true';
    view.addEventListener('input', event => {
      if (event.target.matches('#smartStopWallFilter, #smartStopPipeIdFilter')) updateSmartStopLookup(view);
    });
    view.addEventListener('change', event => {
      if (event.target.id === 'smartStopSectionSelect') showSmartStopSection(view);
      if (event.target.id === 'smartStopScrewSelect') updateSmartStopTorque(view);
      if (event.target.id === 'smartStopSizeSelect') {
        resetSmartStopFilters(view);
        populateSmartStopSuffixes(view);
      }
      if (event.target.closest('.smartstop-lookup-controls')) updateSmartStopLookup(view);
    });
    view.addEventListener('click', event => {
      if (!event.target.closest('[data-smartstop-clear-filters]')) return;
      resetSmartStopFilters(view);
      updateSmartStopLookup(view);
    });
    populateSmartStopSuffixes(view);
    showSmartStopSection(view);
    updateSmartStopLookup(view);
  }


  function renderSmartStopReference(){
    return `
      <header class="smartstop-hero">
        <h3>SmartStop Field Guide</h3>
        <p class="reference-copy">Suffix and parts lookup for 4, 6, 8, 10, 12 and 16 inch SmartStops. Reference only; confirm the approved equipment and job requirements.</p>
      </header>
      <label class="smartstop-topic-label" for="smartStopSectionSelect">Choose SmartStop reference</label>
      <select id="smartStopSectionSelect">
        <option value="suffix">Suffix &amp; Parts</option>
        <option value="torque">Seal Ring Torque</option>
        <option value="source">Source &amp; Limits</option>
      </select>
      <section class="smartstop-section smartstop-lookup-section" data-smartstop-section="suffix">
        <div class="smartstop-lookup-controls">
          <label for="smartStopSizeSelect">SmartStop size<select id="smartStopSizeSelect">${renderSizeOptions()}</select></label>
          <label for="smartStopSuffixSelect">Known suffix<select id="smartStopSuffixSelect"><option value="">All suffixes</option></select></label>
          <label for="smartStopWallFilter">Wall (decimal inches)<input id="smartStopWallFilter" type="text" inputmode="decimal" placeholder=".250" aria-describedby="smartStopFilterStatus"></label>
          <label for="smartStopPipeIdFilter">Pipe I.D. (decimal inches)<input id="smartStopPipeIdFilter" type="text" inputmode="decimal" placeholder="8.125" aria-describedby="smartStopFilterStatus"></label>
          <button type="button" data-smartstop-clear-filters>Clear filters</button>
        </div>
        <p id="smartStopFilterStatus" role="status" aria-live="polite"></p>
        <div id="smartStopLookupResults" class="smartstop-lookup-results"></div>
      </section>
      <section class="smartstop-section smartstop-torque-section" data-smartstop-section="torque" hidden>
        <h4>Seal Ring Torque</h4>
        <p class="smartstop-source-note">Only for the source assumptions: ASTM A574/F835 screw material, .14 K-factor / .10 friction factor, lubricated with nickel-based anti-seize. Not a general bolt-torque chart.</p>
        <label for="smartStopScrewSelect">Screw size</label>
        <select id="smartStopScrewSelect"><option value="">Choose screw size</option>${torqueRows.map((row, index) => `<option value="${index}">${escapeHtml(row.screwSize)}</option>`).join('')}</select>
        <p id="smartStopTorqueResult" class="smartstop-torque-result" role="status" aria-live="polite">Choose a screw size.</p>
        <details><summary>View complete torque chart</summary>
          <div class="smartstop-table-wrap"><table class="smartstop-table">
            <caption>Seal ring torque - PDF page 102 / printed page 35</caption>
            <thead><tr><th scope="col">Screw</th><th scope="col">ft-lb</th><th scope="col">in-lb</th></tr></thead>
            <tbody>${renderTorqueRows()}</tbody>
          </table></div>
        </details>
      </section>
      <section class="smartstop-section" data-smartstop-section="source" hidden>
        <h4>Source &amp; Limits</h4>
        <p>TEAM SmartStop Training packet, 2316_001.pdf. Suffix charts: PDF pages 96-101 / printed pages 29-34. Seal ring torque: PDF page 102 / printed page 35.</p>
        <p>Chart values and merged component cells are transcribed from the supplied scan. Range overlaps, shared endpoints, and source annotations are preserved. Multiple matches require review; this lookup never chooses a kit for you.</p>
        <p>The 6 inch and 12 inch charts include overlapping wall ranges. Use the applicable source and approved equipment requirements to resolve ambiguity. Do not round measurements into a matching range.</p>
        <p>Rows marked 1480 psi retain that source annotation; it is not approval of the complete assembly or job. Unmarked rows do not receive an inferred pressure rating.</p>
        <p>This read-only reference does not change job data or replace the approved setup, breakdown, field-execution procedures, or equipment drawings. Those procedures and dimensional stack-ups are not reproduced here.</p>
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
    bindSmartStopControls(view);
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
    button.innerHTML = '<strong>SmartStop Field Guide</strong><span>Suffixes, parts and seal ring torque</span>';

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
    const countValue = document.querySelectorAll('#referenceWorkspaceContent > .reference-view[data-reference-view]').length ||
      document.querySelectorAll('#referenceViewSelect option').length ||
      15;
    const label = `${countValue} refs`;
    document.querySelectorAll('#refScreen .reference-library-count').forEach((count) => {
      if (count.textContent.trim() !== label) count.textContent = label;
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

  function syncReferenceShell(options = {}){
    const group = byId('referenceLibraryGroup');
    const current = byId('referenceLibraryCurrent');
    const description = byId('referenceLibraryDescription');
    if (group) group.textContent = 'Field Reference';
    if (current) current.textContent = 'SmartStop Field Guide';
    if (description) description.textContent = 'Suffixes, parts and seal ring torque';

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

  function selectSmartStop(options = {}){
    const view = ensureSmartStopView();
    if (!view) return;

    document.querySelectorAll('#referenceWorkspaceContent > .reference-view[data-reference-view]').forEach((panel) => {
      setPanelState(panel, panel.dataset.referenceView === VIEW_KEY);
    });
    syncReferenceShell(options);
    updateReferenceCount();
    try {
      localStorage.setItem(SAVED_VIEW_KEY, VIEW_KEY);
      localStorage.setItem(SMARTSTOP_ACTIVE_KEY, 'true');
    } catch {}
  }

  let scheduled = false;
  let restoreScheduled = false;

  function isReferenceMenuOpen(){
    const menu = byId('referenceLibraryMenu');
    return Boolean(menu && !menu.hidden);
  }

  function shouldRestoreSmartStop(){
    if (typeof window.tapcalcSetReferenceView === 'function') return false;
    if (isReferenceMenuOpen()) return false;
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
      if (!shouldRestoreSmartStop()) return;
      selectSmartStop({ closeMenu: false });
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
      if (typeof window.tapcalcSetReferenceView === 'function') {
        window.tapcalcSetReferenceView(VIEW_KEY);
        return;
      }
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
      if (typeof window.tapcalcSetReferenceView === 'function') return;
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
