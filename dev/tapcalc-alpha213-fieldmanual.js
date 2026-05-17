/* TapCalc Dev 3.0.0-alpha213 inline field manual reference */
(function(){
  const STYLE_ID = 'tapcalc-alpha213-fieldmanual-style';
  const READY_FLAG = '__tapcalcAlpha213FieldManualReady';

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));

  const tableRows = (rows, cells) => rows.map((row) => `<tr>${cells.map((cell) => `<td>${escapeHtml(typeof cell === 'function' ? cell(row) : row[cell])}</td>`).join('')}</tr>`).join('');
  const headerCells = (labels) => labels.map((label) => `<th>${escapeHtml(label)}</th>`).join('');
  const makeTable = (labels, rows, cells) => `<div class="field-manual-table-wrap"><table class="glossary-table field-manual-table"><thead><tr>${headerCells(labels)}</tr></thead><tbody>${tableRows(rows, cells)}</tbody></table></div>`;

  const threadMakeupRows = [
    ['1/2"', '7/16"'],
    ['3/4"', '7/16"'],
    ['1"', '1/2"'],
    ['1-1/4"', '9/16"'],
    ['1-1/2"', '9/16"'],
    ['2"', '9/16"'],
    ['2-1/2"', '7/8"'],
    ['3"', '15/16"'],
    ['4"', '1-1/16"']
  ].map(([size, makeup]) => ({ size, makeup }));

  const cutterRpmRows = [
    ['T101', '2"', '195'],
    ['T101', '3"', '120'],
    ['T101', '4"', '100'],
    ['C1-25 / C1-36', '3"', '50-60'],
    ['C1-25 / C1-36', '4"', '50-60'],
    ['C1-25 / C1-36', '6"', '50-60'],
    ['C1-25 / C1-36', '8"', '50-60'],
    ['C1-25 / C1-36', '10"', '50-60'],
    ['C1-25 / C1-36', '12"', '50-60'],
    ['360', '2"', '35-45'],
    ['360', '3"', '35-45'],
    ['360', '4"', '35-45'],
    ['360', '6"', '35'],
    ['660 / 760', '3"', '37'],
    ['660 / 760', '4"', '37'],
    ['660 / 760', '6"', '37'],
    ['660 / 760', '8"', '37'],
    ['660 / 760', '10"', '37'],
    ['660 / 760', '12"', '33'],
    ['660 / 760', '14"', '30'],
    ['1200', '12"', '25'],
    ['1200', '14"', '23'],
    ['1200', '16"', '21'],
    ['1200', '18"', '19'],
    ['1200', '20"', '17'],
    ['1200', '22"', '16'],
    ['1200', '24"', '14'],
    ['1200', '26"', '12'],
    ['1200', '28"', '12'],
    ['1200', '30"', '12'],
    ['1200', '34"', '12'],
    ['1200', '36"', '12'],
    ['1200', '38"', '12'],
    ['1200', '40"', '12']
  ].map(([machine, cutter, rpm]) => ({ machine, cutter, rpm }));

  const hiStopAdapterRows = [
    ['2"', '3.130"'],
    ['3"', '4.130"'],
    ['4"', '6.130"'],
    ['6"', '8.130"'],
    ['8"', '10.130"'],
    ['10"', '12.130"'],
    ['12"', '13.250"'],
    ['14"', '15.250"'],
    ['16"', '17.250"']
  ].map(([size, bore]) => ({ size, bore }));

  const hiStopBoltCircleRows = [
    ['2"', '6.625"'],
    ['3"', '8.500"'],
    ['4"', '11.500"'],
    ['6"', '13.750"'],
    ['8"', '17.000"'],
    ['10"', '19.250"'],
    ['12"', '20.750"'],
    ['14"', '23.750"'],
    ['16"', '25.750"']
  ].map(([size, circle]) => ({ size, circle }));

  const hiStopTorqueRows = [
    ['2" 600# (360TM)', '1-5-3-7-2-6-4-8', '1st 63 ft/lbs, 2nd 74 ft/lbs, 3rd 84 ft/lbs, final 84 ft/lbs'],
    ['4" 600# (660TM)', '1-5-3-7-2-6-4-8', '1st 180 ft/lbs, 2nd 210 ft/lbs, 3rd 240 ft/lbs, final 240 ft/lbs'],
    ['6" 600# (1200TM)', '1-5-9-3-7-11-2-6-10-4-8-12', '1st 270 ft/lbs, 2nd 315 ft/lbs, 3rd 360 ft/lbs, final 360 ft/lbs']
  ].map(([flange, pattern, passes]) => ({ flange, pattern, passes }));

  const hiStopPressureRows = [
    ['T-101 style machines', '1480 psi @ 100 F', '700 psi @ 700 F'],
    ['360 style machines', '1480 psi @ 100 F', '700 psi @ 700 F'],
    ['660 / 760 style machines', '1480 psi @ 100 F', '700 psi @ 700 F'],
    ['1200 style machines', '1480 psi @ 100 F', '700 psi @ 700 F'],
    ['CH-24', '1480 psi @ 100 F', '700 psi @ 500 F'],
    ['936 and subsea machines', '1480 psi @ 100 F', 'Max temp 180 F']
  ].map(([machine, cold, hot]) => ({ machine, cold, hot }));

  const flangePressureRows = [
    ['150# flange', '285 psi @ -20 F to 100 F', '110 psi @ 700 F'],
    ['300# flange', '740 psi @ -20 F to 100 F', '535 psi @ 700 F'],
    ['600# flange', '1480 psi @ -20 F to 100 F', '700 psi @ 700 F'],
    ['900# flange', '2220 psi @ -20 F to 100 F', '1600 psi @ 700 F'],
    ['1500# flange', '3705 psi @ -20 F to 100 F', '2665 psi @ 700 F'],
    ['2500# flange', '6170 psi @ -20 F to 100 F', '4440 psi @ 700 F']
  ].map(([flange, cold, hot]) => ({ flange, cold, hot }));

  const machineSpecRows = [
    {
      name: 'I-914',
      pressure: '1440 psi @ 100 F',
      temperature: '-20 F to 700 F @ 700 psi',
      travel: '109"',
      feed: '0.004 in/rev auto; approx. 12 turns/in hand crank',
      range: '12" through 42"',
      flange: '6" 600# RTJ, R45 ring',
      bolts: '1" bolt, 1-5/8" wrench',
      weight: '3000 lbs',
      drive: '1" square socket',
      bar: '4" OD boring bar'
    },
    {
      name: 'C1-25 / C1-36',
      pressure: '500 psi @ 100 F',
      temperature: '-20 F to 500 F @ 250 psi',
      travel: '25" / 36"',
      feed: 'Approx. 6 turns/in hand crank',
      range: 'C1-25: 4" through 10"; C1-36: 4" through 12"',
      flange: '4" 150# flange',
      bolts: '5/8" bolts, 1-1/16" wrench',
      weight: '175 lbs / 270 lbs',
      drive: 'Manual',
      bar: '2.5" OD boring bar'
    },
    {
      name: '660 / 760 TM',
      pressure: '1440 psi @ 100 F',
      temperature: '-20 F to 700 F @ 700 psi',
      travel: '660TM: 42"; 760TM: 66"',
      feed: '0.003 in/rev auto; approx. 4.5 turns/in hand crank',
      range: '660TM: 4" through 12"; 760TM: 4" through 14"',
      flange: '4" 600# RTJ, R37 ring',
      bolts: '7/8" bolt, 1-7/16" wrench',
      weight: '460 lbs / 540 lbs',
      drive: '1/2" square socket',
      bar: '2.5" OD boring bar'
    }
  ];

  const toleranceRows = [
    ['1.688"', '24", 30"', '.045"', '.025"', '.005" - .020"'],
    ['2.5"', '42"', '.062"', '.030"', '.005" - .020"'],
    ['2.5"', '66"', '.094"', '.030"', '.005" - .020"'],
    ['4"', '72", 80"', '.094"', '.040"', '.005" - .020"'],
    ['4"', '102", 108", 110"', '.102"', '.040"', '.005" - .020"'],
    ['4"', '120", 130"', '.110"', '.040"', '.005" - .020"'],
    ['4.5"', '72"', '.094"', '.040"', '.005" - .020"'],
    ['4.5"', '120"', '.110"', '.040"', '.005" - .020"']
  ].map(([od, length, runout, lash, travel]) => ({ od, length, runout, lash, travel }));

  const checklistGroups = [
    {
      title: 'Post-job drive ring',
      items: ['Inspect drive ring for cracks or damage.', 'Check for broken screws or stripped threads.']
    },
    {
      title: 'Inner bar / retainer rod',
      items: ['Measure feed screw to inner bar with tape measure.', 'Measure feed screw to inner bar with measuring rod.']
    },
    {
      title: 'Packing service note',
      items: ['Change inner and outer packing after 350 F or greater service.', 'Change packing after corrosive service.', 'Record packing material: N/A, Aflas, or Buna.']
    },
    {
      title: 'Packing nuts and pressure test',
      items: ['Remove, clean, and inspect outer bar packing nut threads and wiper seal.', 'Lubricate and reinstall packing nuts; tighten then back off 1/4 turn.', 'Record pressure-test date, duration, pressure, temperature, medium, pass/fail, and observer.']
    }
  ];

  const topicCards = [
    ['Thread Make-up', 'Nominal pipe size to thread make-up length.', 'thread make up makeup travel taper'],
    ['Cutter RPM', 'Machine and cutter-size RPM lookup.', 'rpm cutter machine t101 360 660 760 1200 c1'],
    ['Hi-Stop Setup', 'Adapter bores, bolt circles, torque passes, and pressure limits.', 'hi-stop histop adapter torque pressure flange'],
    ['Machine Specs', 'Operating pressure, travel, feed rate, range, flange, and weights.', 'machine specs i-914 c1 660 760 travel pressure'],
    ['Post-job Checks', 'Inspection notes and boring-bar tolerance rows.', 'post job checklist inspection tolerance packing pressure test']
  ].map(([title, text, keywords]) => ({ title, text, keywords }));

  function injectFieldManualStyles(){
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      body.measurement-page #refScreen .field-manual-entry-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;margin-top:10px;}
      body.measurement-page #refScreen .field-manual-quick-btn{border:1px solid rgba(119,172,236,.42);background:linear-gradient(135deg,rgba(32,95,183,.95),rgba(23,52,96,.95));color:#f5f9ff;border-radius:14px;padding:12px 14px;text-align:left;font-weight:800;box-shadow:0 12px 28px rgba(0,0,0,.18);}
      body.measurement-page #refScreen .field-manual-quick-btn span{display:block;margin-top:3px;color:rgba(235,244,255,.82);font-size:.86rem;font-weight:650;}
      body.measurement-page #refScreen .tapcalc-fieldmanual-view{display:none;}
      body.measurement-page #refScreen .tapcalc-fieldmanual-view.active{display:block;}
      body.measurement-page #refScreen .field-manual-hero{border:1px solid rgba(127,177,234,.28);border-radius:22px;padding:18px;margin-bottom:16px;background:radial-gradient(circle at top left,rgba(56,118,218,.30),transparent 34%),linear-gradient(135deg,rgba(12,32,58,.98),rgba(7,20,39,.98));}
      body.measurement-page #refScreen .field-manual-hero h3{margin:0 0 6px;font-size:clamp(1.45rem,4vw,2.1rem);}
      body.measurement-page #refScreen .field-manual-topic-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin:14px 0;}
      body.measurement-page #refScreen .field-manual-topic-card{border:1px solid rgba(122,172,228,.28);border-radius:16px;background:rgba(9,29,55,.86);color:#f5f9ff;padding:12px;text-align:left;}
      body.measurement-page #refScreen .field-manual-topic-card strong,body.measurement-page #refScreen .field-manual-section h4{color:#fff;}
      body.measurement-page #refScreen .field-manual-topic-card span{display:block;margin-top:4px;color:rgba(224,236,255,.80);font-size:.84rem;}
      body.measurement-page #refScreen .field-manual-filter{width:100%;border-radius:14px;border:1px solid rgba(133,182,236,.36);background:rgba(3,14,29,.78);color:#f8fbff;padding:12px 14px;font-weight:750;}
      body.measurement-page #refScreen .field-manual-section{margin-top:16px;}
      body.measurement-page #refScreen .field-manual-card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;}
      body.measurement-page #refScreen .field-manual-mini-card{border:1px solid rgba(130,180,232,.24);border-radius:16px;padding:12px;background:rgba(9,26,48,.78);}
      body.measurement-page #refScreen .field-manual-mini-card strong{display:block;margin-bottom:8px;color:#fff;}
      body.measurement-page #refScreen .field-manual-mini-card ul{margin:0;padding-left:18px;color:rgba(232,241,255,.86);}
      body.measurement-page #refScreen .field-manual-table-wrap{overflow-x:auto;border-radius:16px;border:1px solid rgba(125,173,228,.22);}
      body.measurement-page #refScreen .field-manual-table{min-width:520px;}
      body.measurement-page #refScreen .field-manual-table th,body.measurement-page #refScreen .field-manual-table td{white-space:nowrap;}
      :root[data-theme="light"] body.measurement-page #refScreen .field-manual-hero,body.light.measurement-page #refScreen .field-manual-hero{background:linear-gradient(135deg,#eaf3ff,#d9e8f7);color:#071d35;}
      :root[data-theme="light"] body.measurement-page #refScreen .field-manual-hero h3,:root[data-theme="light"] body.measurement-page #refScreen .field-manual-section h4,:root[data-theme="light"] body.measurement-page #refScreen .field-manual-topic-card strong,:root[data-theme="light"] body.measurement-page #refScreen .field-manual-mini-card strong,body.light.measurement-page #refScreen .field-manual-hero h3,body.light.measurement-page #refScreen .field-manual-section h4,body.light.measurement-page #refScreen .field-manual-topic-card strong,body.light.measurement-page #refScreen .field-manual-mini-card strong{color:#071d35;}
      :root[data-theme="light"] body.measurement-page #refScreen .field-manual-topic-card,:root[data-theme="light"] body.measurement-page #refScreen .field-manual-mini-card,body.light.measurement-page #refScreen .field-manual-topic-card,body.light.measurement-page #refScreen .field-manual-mini-card{background:rgba(255,255,255,.72);color:#071d35;border-color:rgba(76,123,174,.28);}
      :root[data-theme="light"] body.measurement-page #refScreen .field-manual-topic-card span,:root[data-theme="light"] body.measurement-page #refScreen .field-manual-mini-card ul,body.light.measurement-page #refScreen .field-manual-topic-card span,body.light.measurement-page #refScreen .field-manual-mini-card ul{color:#294d73;}
      :root[data-theme="light"] body.measurement-page #refScreen .field-manual-filter,body.light.measurement-page #refScreen .field-manual-filter{background:#f7fbff;color:#071d35;border-color:rgba(74,118,169,.35);}
      @media (max-width:680px){body.measurement-page #refScreen .field-manual-entry-row{grid-template-columns:1fr;}body.measurement-page #refScreen .field-manual-topic-grid,body.measurement-page #refScreen .field-manual-card-grid{grid-template-columns:1fr;}body.measurement-page #refScreen .field-manual-table{min-width:440px;}}
    `;
    document.head.appendChild(style);
  }

  function ensureFieldManualTriggers(){
    const libraryPanel = document.querySelector('#refScreen .reference-library-panel');
    if (libraryPanel && !document.getElementById('fieldManualQuickButton')) {
      const row = document.createElement('div');
      row.className = 'field-manual-entry-row';
      row.innerHTML = '<button type="button" id="fieldManualQuickButton" class="field-manual-quick-btn" data-field-manual-open>Field Manual<span>Inline tables for RPM, Hi-Stop, machine specs, and checks</span></button>';
      libraryPanel.appendChild(row);
    }
    const inlineActions = document.querySelector('#refScreen .reference-inline-actions');
    if (inlineActions && !document.getElementById('fieldManualInlineAction')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.id = 'fieldManualInlineAction';
      button.className = 'secondary-btn';
      button.setAttribute('data-field-manual-open', '');
      button.textContent = 'Field Manual';
      inlineActions.insertBefore(button, inlineActions.firstChild);
    }
    const select = document.getElementById('referenceViewSelect');
    if (select && !select.querySelector('option[value="fieldmanual"]')) {
      const option = document.createElement('option');
      option.value = 'fieldmanual';
      option.textContent = 'Field Manual';
      select.appendChild(option);
    }
  }

  function renderFieldManualView(workspace){
    let view = document.getElementById('fieldManualReferenceView');
    if (!view) {
      view = document.createElement('div');
      view.id = 'fieldManualReferenceView';
      view.className = 'reference-view tapcalc-fieldmanual-view';
      view.dataset.referenceView = 'fieldmanual';
      view.hidden = true;
      workspace.appendChild(view);
    }
    view.innerHTML = `
      <div class="field-manual-hero" data-field-manual-text="field manual reference thread make-up cutter rpm hi-stop machine specs post-job checks tolerance">
        <p class="eyebrow">Field Manual</p>
        <h3>Inline field tables</h3>
        <p class="reference-copy">Recreated from the approved field pages as app-native cards so you can search, scroll, and read them on a phone without opening scans or PDFs.</p>
        <input id="fieldManualSearch" class="field-manual-filter" type="search" placeholder="Filter field manual: rpm, hi-stop, 1200, make-up, packing...">
        <div class="field-manual-topic-grid">
          ${topicCards.map((card) => `<button type="button" class="field-manual-topic-card" data-field-manual-jump="${escapeHtml(card.title)}" data-field-manual-text="${escapeHtml(`${card.title} ${card.text} ${card.keywords}`)}"><strong>${escapeHtml(card.title)}</strong><span>${escapeHtml(card.text)}</span></button>`).join('')}
        </div>
      </div>
      <section class="reference-card field-manual-section" data-field-manual-section="Thread Make-up" data-field-manual-text="thread make-up makeup nominal pipe travel taper">
        <h4>Thread Make-up Lengths</h4>
        <p class="reference-copy">Use as a guide for tapping-travel math. Always measure the actual thread make-up distance in the field.</p>
        ${makeTable(['Nominal Pipe Size', 'Make-up'], threadMakeupRows, ['size', 'makeup'])}
      </section>
      <section class="reference-card field-manual-section" data-field-manual-section="Cutter RPM" data-field-manual-text="cutter rpm machine t101 c1 360 660 760 1200">
        <h4>Cutter RPM</h4>
        <p class="reference-copy">Quick machine and cutter-size speed lookup.</p>
        ${makeTable(['Machine', 'Cutter Size', 'RPM'], cutterRpmRows, ['machine', 'cutter', 'rpm'])}
      </section>
      <section class="reference-card field-manual-section" data-field-manual-section="Hi-Stop Setup" data-field-manual-text="hi-stop histop adapter bore bolt circle torque pressure flange">
        <h4>Hi-Stop Setup</h4>
        <div class="field-manual-card-grid">
          <div class="field-manual-mini-card"><strong>Adapter Minimum I.D. Bore</strong>${makeTable(['Size', 'Bore'], hiStopAdapterRows, ['size', 'bore'])}</div>
          <div class="field-manual-mini-card"><strong>600# Bolt Circles</strong>${makeTable(['Size', 'Bolt Circle'], hiStopBoltCircleRows, ['size', 'circle'])}</div>
          <div class="field-manual-mini-card"><strong>Torque Passes</strong>${makeTable(['Flange', 'Pattern', 'Passes'], hiStopTorqueRows, ['flange', 'pattern', 'passes'])}</div>
          <div class="field-manual-mini-card"><strong>Machine Pressure / Temperature</strong>${makeTable(['Machine', 'Low Temp', 'High Temp'], hiStopPressureRows, ['machine', 'cold', 'hot'])}</div>
          <div class="field-manual-mini-card"><strong>Max Operating Pressure by Flange</strong>${makeTable(['Flange', 'Low Temp', 'High Temp'], flangePressureRows, ['flange', 'cold', 'hot'])}</div>
        </div>
      </section>
      <section class="reference-card field-manual-section" data-field-manual-section="Machine Specs" data-field-manual-text="machine operating specs i-914 c1-25 c1-36 660 760 travel pressure range flange weight boring bar">
        <h4>Machine Operating Specs</h4>
        <div class="field-manual-card-grid">
          ${machineSpecRows.map((machine) => `
            <div class="field-manual-mini-card" data-field-manual-text="${escapeHtml(Object.values(machine).join(' '))}">
              <strong>${escapeHtml(machine.name)}</strong>
              <ul>
                <li>Pressure: ${escapeHtml(machine.pressure)}</li>
                <li>Temperature: ${escapeHtml(machine.temperature)}</li>
                <li>Travel: ${escapeHtml(machine.travel)}</li>
                <li>Feed: ${escapeHtml(machine.feed)}</li>
                <li>Range: ${escapeHtml(machine.range)}</li>
                <li>Flange: ${escapeHtml(machine.flange)}</li>
                <li>Bolts: ${escapeHtml(machine.bolts)}</li>
                <li>Weight: ${escapeHtml(machine.weight)}</li>
                <li>Drive: ${escapeHtml(machine.drive)}</li>
                <li>Boring bar: ${escapeHtml(machine.bar)}</li>
              </ul>
            </div>
          `).join('')}
        </div>
      </section>
      <section class="reference-card field-manual-section" data-field-manual-section="Post-job Checks" data-field-manual-text="post job checklist inspection tolerance packing pressure test boring bar feed screw">
        <h4>Post-job Checks and Tolerances</h4>
        <div class="field-manual-card-grid">
          ${checklistGroups.map((group) => `<div class="field-manual-mini-card" data-field-manual-text="${escapeHtml(`${group.title} ${group.items.join(' ')}`)}"><strong>${escapeHtml(group.title)}</strong><ul>${group.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>`).join('')}
        </div>
        <h4 class="reference-table-heading">Boring Bar Tolerance Table</h4>
        ${makeTable(['Boring Bar OD', 'Boring Bar Length', 'Run-Out', 'Feed Nut Lash', 'Feed Screw Travel'], toleranceRows, ['od', 'length', 'runout', 'lash', 'travel'])}
        <p class="reference-footnote">If bearing lash exceeds .020", adjust the feed screw bearing nut and get supervisor direction as required.</p>
      </section>
    `;
  }

  function setFieldManualFilter(query){
    const tokens = String(query || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
    document.querySelectorAll('#fieldManualReferenceView [data-field-manual-text]').forEach((el) => {
      if (!tokens.length) {
        el.hidden = false;
        return;
      }
      const haystack = String(el.getAttribute('data-field-manual-text') || '').toLowerCase();
      el.hidden = !tokens.every((token) => haystack.includes(token));
    });
    document.querySelectorAll('#fieldManualReferenceView .field-manual-section').forEach((section) => {
      if (!tokens.length) {
        section.hidden = false;
        return;
      }
      const haystack = `${section.getAttribute('data-field-manual-text') || ''} ${section.textContent || ''}`.toLowerCase();
      section.hidden = !tokens.every((token) => haystack.includes(token));
    });
  }

  function showFieldManual(){
    const workspace = document.getElementById('referenceWorkspaceContent');
    if (!workspace) return;
    renderFieldManualView(workspace);
    document.querySelectorAll('#referenceWorkspaceContent .reference-view[data-reference-view]').forEach((panel) => {
      const active = panel.id === 'fieldManualReferenceView';
      panel.classList.toggle('active', active);
      panel.hidden = !active;
      panel.style.display = active ? 'block' : 'none';
    });
    const select = document.getElementById('referenceViewSelect');
    if (select) select.value = 'fieldmanual';
    const current = document.getElementById('referenceLibraryCurrent');
    const description = document.getElementById('referenceLibraryDescription');
    const group = document.getElementById('referenceLibraryGroup');
    if (current) current.textContent = 'Field Manual';
    if (description) description.textContent = 'Inline RPM, Hi-Stop, machine specs, and checks';
    if (group) group.textContent = 'Field Reference';
    document.querySelectorAll('[data-reference-target]').forEach((el) => el.classList.remove('active'));
    document.querySelectorAll('[data-field-manual-open]').forEach((el) => el.classList.add('active'));
    try { localStorage.setItem('tapcalcAlpha213FieldManualOpen', '1'); } catch {}
    setTimeout(() => document.getElementById('fieldManualReferenceView')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }

  function hideFieldManual(){
    const view = document.getElementById('fieldManualReferenceView');
    if (view) {
      view.classList.remove('active');
      view.hidden = true;
      view.style.display = 'none';
    }
    document.querySelectorAll('[data-field-manual-open]').forEach((el) => el.classList.remove('active'));
    try { localStorage.removeItem('tapcalcAlpha213FieldManualOpen'); } catch {}
  }

  function installFieldManualReference(){
    const workspace = document.getElementById('referenceWorkspaceContent');
    if (!workspace || window[READY_FLAG]) return;
    window[READY_FLAG] = true;
    document.body.classList.add('tapcalc-alpha213-fieldmanual');
    injectFieldManualStyles();
    renderFieldManualView(workspace);
    const cssEscape = window.CSS && typeof window.CSS.escape === 'function'
      ? window.CSS.escape
      : (value) => String(value).replace(/["\\]/g, '\\$&');
    ensureFieldManualTriggers();

    document.addEventListener('click', (event) => {
      const openTrigger = event.target?.closest?.('[data-field-manual-open]');
      if (openTrigger) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        showFieldManual();
        return;
      }
      const jump = event.target?.closest?.('[data-field-manual-jump]');
      if (jump) {
        const target = jump.getAttribute('data-field-manual-jump');
        document.querySelector(`#fieldManualReferenceView [data-field-manual-section="${cssEscape(target)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      const referenceTrigger = event.target?.closest?.('[data-reference-target]');
      if (referenceTrigger && referenceTrigger.getAttribute('data-reference-target') !== 'fieldmanual') hideFieldManual();
    }, true);

    document.addEventListener('change', (event) => {
      if (event.target?.id !== 'referenceViewSelect') return;
      if (event.target.value === 'fieldmanual') {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        showFieldManual();
      } else {
        hideFieldManual();
      }
    }, true);

    document.addEventListener('input', (event) => {
      if (event.target?.id === 'fieldManualSearch') setFieldManualFilter(event.target.value);
    }, true);

    setTimeout(() => {
      ensureFieldManualTriggers();
      try {
        if (localStorage.getItem('tapcalcAlpha213FieldManualOpen') === '1') showFieldManual();
      } catch {}
    }, 450);
  }

  function run(){
    installFieldManualReference();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  document.addEventListener('click', () => setTimeout(run, 60), true);
  window.addEventListener('hashchange', run);
  [250, 800, 1600, 2600, 4200, 7000].forEach((delay) => setTimeout(run, delay));
})();
