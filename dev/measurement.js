const BUILD_VERSION = '3.0.0-alpha40';

(function(){

// ===== GLOBAL THEME TOGGLE FACTORY (shared) =====
(function () {
  if (window.__BCO_THEME_READY__) return;
  window.__BCO_THEME_READY__ = true;

  const btn = document.createElement('button');
  btn.id = 'themeToggle';
  btn.className = 'theme-btn';
  btn.innerHTML = '🌓';
  btn.style.position = 'fixed';
  btn.style.top = '16px';
  btn.style.right = '16px';
  btn.style.zIndex = '9999';

  document.body.appendChild(btn);

  function syncThemeState(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.toggle('dark', theme === 'dark');
    document.body.classList.toggle('light', theme === 'light');
  }

  const current = localStorage.getItem('theme') || 'dark';
  syncThemeState(current);

  btn.addEventListener('click', () => {
    const t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    syncThemeState(t);
    localStorage.setItem('theme', t);
  });
})();
// ===== END THEME TOGGLE FACTORY =====

function getBcoData() {
  if (sessionStorage.getItem("bcoCalculated") !== "true") return null;

  try {
    return JSON.parse(localStorage.getItem("bcoData"));
  } catch {
    return null;
  }
}

function getGeometry(data) {
  const pipeOD = parseFloat(data?.pipeOD) || parseFloat(localStorage.getItem("pipeOD")) || 0;
  const pipeID = parseFloat(data?.pipeID) || parseFloat(localStorage.getItem("pipeID")) || 0;
  const wall = pipeOD && pipeID ? ((pipeOD - pipeID) / 2) : 0;
  return { pipeOD, pipeID, wall };
}

let data = getBcoData();
const status = document.getElementById("bcoStatus");
let geometry = getGeometry(data);

function refreshBcoState() {
  data = getBcoData();
  geometry = getGeometry(data);
  if (!data) {
    status.textContent = "No BCO data loaded. Use the BCO tab first.";
  } else {
    status.textContent = "Loaded BCO data";
  }
}

refreshBcoState();

// ===== MODE SWITCHING =====
const modeButtons = Array.from(document.querySelectorAll('.mode-btn[data-mode]'));
const panels = {
  bco: document.getElementById('bcoPanel'),
  hotTap: document.getElementById('hotTapPanel'),
  htp: document.getElementById('htpPanel'),
  lineStop: document.getElementById('lineStopPanel'),
  completionPlug: document.getElementById('completionPlugPanel'),
  eta: document.getElementById('etaPanel'),
  glossary: document.getElementById('glossaryPanel')
};

function setMode(mode) {
  modeButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
  Object.entries(panels).forEach(([key, panel]) => {
    if (!panel) return;
    panel.classList.toggle('active', key === mode);
  });
  if (mode === 'eta') {
    syncBcoToEta({ force: true });
    updateEtaEstimate();
  }
  try {
    localStorage.setItem('measurementCardActiveModeV1', mode);
  } catch {}
}

window.setMode = setMode;

modeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.disabled) return;
    setMode(btn.dataset.mode);
  });
});

try {
  const savedMode = localStorage.getItem('measurementCardActiveModeV1');
  setMode(savedMode && panels[savedMode] ? savedMode : 'bco');
} catch {
  setMode('bco');
}

// ===== SUPPORTING GEOMETRY DISPLAY =====
(function(){
  function run(){
    const pipeIdEl = document.getElementById("pipeId");
    const wallThkEl = document.getElementById("wallThk");
    const lsWallDisplay = document.getElementById("lsWallDisplay");
    const podEl = document.getElementById("pod");
    const lsPodEl = document.getElementById("lsPod");

    if (podEl && isFinite(geometry.pipeOD) && geometry.pipeOD) podEl.value = geometry.pipeOD.toFixed(4);
    if (lsPodEl && isFinite(geometry.pipeOD) && geometry.pipeOD) lsPodEl.value = geometry.pipeOD.toFixed(4);

    if (!document.getElementById("pipeId") && document.getElementById("mco")) {
      const mcoRow = document.getElementById("mco").closest(".row");
      if (mcoRow) {
        const pipeIdRow = document.createElement("div");
        pipeIdRow.className = "row pipe-support";
        pipeIdRow.innerHTML = '<label>Pipe I.D.</label><div id="pipeId" class="display-geometry">—</div><span class="from-bco">From BCO Calculator</span>';

        const wallRow = document.createElement("div");
        wallRow.className = "row pipe-support";
        wallRow.innerHTML = '<label>Wall Thickness</label><div id="wallThk" class="display-geometry">—</div><span class="from-bco">From BCO Calculator</span>';

        mcoRow.after(pipeIdRow);
        pipeIdRow.after(wallRow);
      }
    }

    const pipeId = document.getElementById("pipeId");
    const wallThk = document.getElementById("wallThk");

    if (isFinite(geometry.pipeID) && geometry.pipeID) pipeId && (pipeId.textContent = geometry.pipeID.toFixed(4));
    if (isFinite(geometry.wall) && geometry.wall) {
      wallThk && (wallThk.textContent = geometry.wall.toFixed(4));
      lsWallDisplay && (lsWallDisplay.textContent = geometry.wall.toFixed(4));
    } else {
      lsWallDisplay && (lsWallDisplay.textContent = "—");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();


// ===== BCO TAB =====
const pipeData = {
  CarbonSteel: {
    "3.0": { STD: 3.068, "40": 3.068, XS: 2.9, "80": 2.9 },
    "4.0": { STD: 4.026, "40": 4.026, XS: 3.826, "80": 3.826 },
    "6.0": { STD: 6.065, "40": 6.065, XS: 5.761, "80": 5.761 },
    "8.0": { STD: 7.981, "40": 7.981, XS: 7.625, "80": 7.625 },
    "10.0": { STD: 10.02, "40": 10.02, XS: 9.564, "80": 9.564 },
    "12.0": { STD: 11.938, "40": 11.938, XS: 11.314, "80": 11.314 },
    "14.0": { STD: 13.25, "40": 13.25, XS: 12.5, "80": 12.5 },
    "16.0": { STD: 15.25, "40": 15.25, XS: 14.688, "80": 14.688 },
    "18.0": { STD: 17.25, "40": 17.25, XS: 16.624, "80": 16.624 },
    "20.0": { STD: 19.25, "40": 19.25, XS: 18.624, "80": 18.624 },
    "24.0": { STD: 23.25, "40": 23.25, XS: 22.5, "80": 22.5 },
    "30.0": { STD: 29.25, "40": 29.25, XS: 28.5, "80": 28.5 },
    "36.0": { STD: 35.25, "40": 35.25, XS: 34.5, "80": 34.5 },
    "42.0": { STD: 41.25, "40": 41.25, XS: 40.5, "80": 40.5 },
    "48.0": { STD: 47.25, "40": 47.25, XS: 46.5, "80": 46.5 }
  },
  DuctileIron: {
    "3.0": { STD: 3.26 }, "4.0": { STD: 4.04 }, "6.0": { STD: 6.1 }, "8.0": { STD: 8.28 },
    "10.0": { STD: 10.32 }, "12.0": { STD: 12.38 }, "14.0": { STD: 14.4 }, "16.0": { STD: 16.5 },
    "18.0": { STD: 18.6 }, "20.0": { STD: 20.7 }, "24.0": { STD: 24.9 }, "30.0": { STD: 31.0 },
    "36.0": { STD: 37.0 }, "42.0": { STD: 43.2 }, "48.0": { STD: 49.3 }
  }
};

const trueOD = {
  CarbonSteel: {
    "3.0": 3.5, "4.0": 4.5, "6.0": 6.625, "8.0": 8.625, "10.0": 10.75,
    "12.0": 12.75, "14.0": 14.0, "16.0": 16.0, "18.0": 18.0, "20.0": 20.0,
    "24.0": 24.0, "30.0": 30.0, "36.0": 36.0, "42.0": 42.0, "48.0": 48.0
  },
  DuctileIron: {
    "3.0": 3.96, "4.0": 4.8, "6.0": 6.9, "8.0": 9.05, "10.0": 11.1,
    "12.0": 13.2, "14.0": 15.3, "16.0": 17.4, "18.0": 19.5, "20.0": 21.6,
    "24.0": 25.8, "30.0": 32.0, "36.0": 38.3, "42.0": 44.5, "48.0": 50.8
  }
};

const bcoMaterialEl = document.getElementById('bcoPipeMaterial');
const bcoPipeOdEl = document.getElementById('bcoPipeOD');
const bcoScheduleEl = document.getElementById('bcoSchedule');
const bcoPipeIdEl = document.getElementById('bcoPipeID');
const bcoCutterOdEl = document.getElementById('bcoCutterOD');
const bcoTrueOdDisplayEl = document.getElementById('bcoTrueODDisplay');
const bcoWallDisplayEl = document.getElementById('bcoWallDisplay');
const bcoResultEl = document.getElementById('bcoResult');
const bcoInlineStatusEl = document.getElementById('bcoInlineStatus');
const bcoCalcBtnEl = document.getElementById('bcoCalcBtn');
const bcoCopyBtnEl = document.getElementById('bcoCopyBtn');
let bcoIdManuallyEdited = false;

function populateBcoPipeSizes() {
  if (!bcoMaterialEl || !bcoPipeOdEl) return;
  const material = bcoMaterialEl.value;
  bcoPipeOdEl.innerHTML = '';
  Object.keys(pipeData[material]).forEach(size => {
    const option = document.createElement('option');
    option.value = size;
    option.textContent = `${size}" (${trueOD[material][size]} OD)`;
    bcoPipeOdEl.appendChild(option);
  });
  updateBcoPipeId();
}

function updateBcoDisplays() {
  const material = bcoMaterialEl?.value;
  const nominal = bcoPipeOdEl?.value;
  const pipeOD = parseFloat(trueOD?.[material]?.[nominal]);
  const pipeID = getMeasurementValue(bcoPipeIdEl);
  const wall = Number.isFinite(pipeOD) && Number.isFinite(pipeID) ? (pipeOD - pipeID) / 2 : NaN;
  if (bcoTrueOdDisplayEl) bcoTrueOdDisplayEl.textContent = Number.isFinite(pipeOD) ? pipeOD.toFixed(4) : '—';
  if (bcoWallDisplayEl) bcoWallDisplayEl.textContent = Number.isFinite(wall) ? wall.toFixed(4) : '—';
}

function updateBcoPipeId() {
  const material = bcoMaterialEl?.value;
  const od = bcoPipeOdEl?.value;
  const schedule = bcoScheduleEl?.value;
  const pipe = pipeData[material]?.[od];
  if (!pipe || !bcoPipeIdEl) return;
  if (!bcoIdManuallyEdited) {
    if (pipe[schedule] !== undefined) bcoPipeIdEl.value = pipe[schedule];
    else if (pipe.STD !== undefined) bcoPipeIdEl.value = pipe.STD;
    else bcoPipeIdEl.value = '';
  }
  updateBcoDisplays();
}

function hydrateBcoInputsFromSavedData() {
  if (!bcoMaterialEl || !bcoPipeOdEl || !bcoPipeIdEl) return;
  const savedMaterial = localStorage.getItem('pipeMaterial') || 'CarbonSteel';
  bcoMaterialEl.value = savedMaterial in pipeData ? savedMaterial : 'CarbonSteel';
  populateBcoPipeSizes();
  const savedNominal = localStorage.getItem('pipeOD');
  if (savedNominal && trueOD[bcoMaterialEl.value][savedNominal] !== undefined) bcoPipeOdEl.value = savedNominal;
  const savedSchedule = localStorage.getItem('schedule');
  if (savedSchedule) bcoScheduleEl.value = savedSchedule;
  bcoIdManuallyEdited = false;
  updateBcoPipeId();
  const savedCutter = parseFloat(data?.cutterOD);
  if (Number.isFinite(savedCutter) && bcoCutterOdEl) bcoCutterOdEl.value = savedCutter;
  updateBcoDisplays();
  if (Number.isFinite(parseFloat(data?.bco))) renderBcoResult({ pipeOD: geometry.pipeOD, pipeID: geometry.pipeID, cutterOD: parseFloat(data?.cutterOD), bco: parseFloat(data.bco) });
}

function applyBcoToMeasurementCard() {
  refreshBcoState();
  const pipeOD = Number.isFinite(geometry.pipeOD) ? geometry.pipeOD.toFixed(4) : '';
  const wall = Number.isFinite(geometry.wall) ? geometry.wall.toFixed(4) : '—';
  if (podEl && pipeOD) podEl.value = pipeOD;
  if (lsPodEl && pipeOD) lsPodEl.value = pipeOD;
  const pipeId = document.getElementById('pipeId');
  const wallThk = document.getElementById('wallThk');
  const lsWallDisplay = document.getElementById('lsWallDisplay');
  if (pipeId) pipeId.textContent = Number.isFinite(geometry.pipeID) ? geometry.pipeID.toFixed(4) : '—';
  if (wallThk) wallThk.textContent = wall;
  if (lsWallDisplay) lsWallDisplay.textContent = wall;
  calcHotTap();
  calcHtp();
  calcLineStop();
  syncBcoToEta({ force: true });
  updateEtaEstimate();
  if (bcoInlineStatusEl) bcoInlineStatusEl.textContent = 'BCO live update pushed into Hot Tap and Line Stop.';
}

function calculateIntegratedBco(options = {}) {
  const { silent = false } = options;
  const material = bcoMaterialEl?.value;
  const nominal = bcoPipeOdEl?.value;
  const pipeOD = parseFloat(trueOD?.[material]?.[nominal]);
  const pipeID = getMeasurementValue(bcoPipeIdEl);
  const cutterOD = getMeasurementValue(bcoCutterOdEl);

  localStorage.setItem('pipeMaterial', material || 'CarbonSteel');
  if (nominal) localStorage.setItem('pipeOD', nominal);
  if (bcoScheduleEl?.value) localStorage.setItem('schedule', bcoScheduleEl.value);

  if (!Number.isFinite(pipeOD) || !Number.isFinite(pipeID) || !Number.isFinite(cutterOD)) {
    sessionStorage.removeItem('bcoCalculated');
    localStorage.removeItem('bcoData');
    renderBcoResult({ pipeOD, pipeID, cutterOD, error: 'Enter Pipe I.D. and Cutter O.D.' });
    if (!silent && bcoInlineStatusEl) bcoInlineStatusEl.textContent = 'Enter Pipe I.D. and Cutter O.D. to calculate BCO.';
    refreshBcoState();
    updateBcoDisplays();
    calcHotTap();
    calcHtp();
    calcLineStop();
    updateSummary();
    return;
  }

  const underRoot = Math.pow(pipeID / 2, 2) - Math.pow(cutterOD / 2, 2);
  if (underRoot < 0) {
    sessionStorage.removeItem('bcoCalculated');
    localStorage.removeItem('bcoData');
    renderBcoResult({ pipeOD, pipeID, cutterOD, error: 'Cutter O.D. cannot exceed Pipe I.D.' });
    if (!silent && bcoInlineStatusEl) bcoInlineStatusEl.textContent = 'Check geometry: Cutter O.D. cannot exceed Pipe I.D.';
    refreshBcoState();
    updateBcoDisplays();
    calcHotTap();
    calcHtp();
    calcLineStop();
    updateSummary();
    return;
  }

  const result = (pipeOD / 2) - Math.sqrt(underRoot);
  localStorage.setItem('pipeID', pipeID);
  localStorage.setItem('bcoData', JSON.stringify({ pipeOD, pipeID, cutterOD, bco: result }));
  sessionStorage.setItem('bcoCalculated', 'true');
  renderBcoResult({ pipeOD, pipeID, cutterOD, bco: result });
  updateBcoDisplays();
  applyBcoToMeasurementCard();
  if (!silent && bcoInlineStatusEl) bcoInlineStatusEl.textContent = 'BCO updated automatically.';
}

function copyBcoResult() {
  const value = Number.isFinite(parseFloat(data?.bco)) ? parseFloat(data.bco).toFixed(3) : '';
  if (!value) return;
  navigator.clipboard?.writeText(value).then(() => {
    if (bcoInlineStatusEl) bcoInlineStatusEl.textContent = 'BCO value copied.';
  }).catch(() => {});
}

function triggerLiveBcoCalculation() {
  calculateIntegratedBco({ silent: true });
}

[bcoMaterialEl, bcoPipeOdEl, bcoScheduleEl].forEach(el => {
  if (!el) return;
  el.addEventListener('change', () => {
    if (el === bcoMaterialEl) {
      bcoIdManuallyEdited = false;
      populateBcoPipeSizes();
    } else {
      updateBcoPipeId();
    }
    triggerLiveBcoCalculation();
  });
});
if (bcoPipeIdEl) bcoPipeIdEl.addEventListener('input', () => {
  bcoIdManuallyEdited = true;
  updateBcoDisplays();
  triggerLiveBcoCalculation();
});
if (bcoCutterOdEl) bcoCutterOdEl.addEventListener('input', () => {
  updateBcoDisplays();
  triggerLiveBcoCalculation();
});
if (bcoCalcBtnEl) bcoCalcBtnEl.addEventListener('click', () => calculateIntegratedBco({ silent: false }));
if (bcoCopyBtnEl) bcoCopyBtnEl.addEventListener('click', copyBcoResult);
const decimalReferenceBtnEl = document.getElementById('decimalReferenceBtn');
const openDecimalModalBtnEl = document.getElementById('openDecimalModalBtn');
const closeDecimalModalBtnEl = document.getElementById('closeDecimalModalBtn');
const decimalModalEl = document.getElementById('decimalModal');
const decimalChartBodyEl = document.getElementById('decimalChartBody');
const fractionNumeratorEl = document.getElementById('fractionNumerator');
const fractionDenominatorEl = document.getElementById('fractionDenominator');
const fractionToDecimalResultEl = document.getElementById('fractionToDecimalResult');
const decimalInputEl = document.getElementById('decimalInput');
const fractionPrecisionEl = document.getElementById('fractionPrecision');
const decimalToFractionResultEl = document.getElementById('decimalToFractionResult');
const decimalChartSearchEl = document.getElementById('decimalChartSearch');
const quickDecimalBtnEls = Array.from(document.querySelectorAll('.quick-decimal-btn'));

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a || 1;
}

function formatDecimal(value, digits = 4) {
  if (!Number.isFinite(value)) return '—';
  return value.toFixed(digits);
}


function shouldNormalizeMeasurement(rawValue) {
  return /[\/\s-]/.test(String(rawValue || '').trim());
}

function getMeasurementValue(inputOrValue) {
  const rawValue = typeof inputOrValue === 'string' ? inputOrValue : (inputOrValue?.value ?? '');
  const parsed = parseMixedMeasurement(rawValue);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function normalizeMeasurementField(field, options = {}) {
  if (!field || field.disabled) return;
  const rawValue = String(field.value ?? '').trim();
  if (!rawValue) return;
  const parsed = parseMixedMeasurement(rawValue);
  if (!Number.isFinite(parsed)) return;
  const shouldNormalize = options.force || shouldNormalizeMeasurement(rawValue);
  if (!shouldNormalize) return;
  const normalized = formatDecimal(parsed);
  if (field.value === normalized) return;
  field.value = normalized;
  field.dispatchEvent(new Event('input', { bubbles: true }));
  field.dispatchEvent(new Event('change', { bubbles: true }));
}

function enableMixedMeasurementInputs() {
  const measurementFieldIds = [
    'bcoPipeID','bcoCutterOD','md','ld','ptc','pod','start','mt','valveBore','gtf',
    'lsMd','lsLd','lsPod','lsLiManual','lsTravel','lsMachineTravel',
    'cpStart','cpJbf','cpLd','cpPt','cpLiManual',
    'fractionNumerator','fractionDenominator','decimalInput','etaBco'
  ];
  measurementFieldIds.forEach((id) => {
    const field = document.getElementById(id);
    if (!field) return;
    try { field.type = 'text'; } catch {}
    field.setAttribute('inputmode', 'decimal');
    field.setAttribute('autocomplete', 'off');
    field.setAttribute('autocorrect', 'off');
    field.setAttribute('spellcheck', 'false');
    field.addEventListener('blur', () => normalizeMeasurementField(field, { force: true }));
    field.addEventListener('change', () => normalizeMeasurementField(field, { force: true }));
    field.addEventListener('input', () => {
      if (shouldNormalizeMeasurement(field.value) && Number.isFinite(parseMixedMeasurement(field.value))) {
        normalizeMeasurementField(field);
      }
    });
  });
}

function openDecimalModal() {
  if (!decimalModalEl) return;
  decimalModalEl.hidden = false;
  document.body.classList.add('modal-open');
}

function closeDecimalModal() {
  if (!decimalModalEl) return;
  decimalModalEl.hidden = true;
  document.body.classList.remove('modal-open');
}

function simplifyFraction(numerator, denominator) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null;
  const divisor = gcd(numerator, denominator);
  return { numerator: numerator / divisor, denominator: denominator / divisor };
}

function buildDecimalChart(filterText = '') {
  if (!decimalChartBodyEl) return;
  const rows = [];
  const normalizedFilter = String(filterText || '').trim().toLowerCase();
  for (let start = 1; start <= 64; start += 2) {
    const pair = [];
    for (let current = start; current <= Math.min(start + 1, 64); current += 1) {
      const simplified = simplifyFraction(current, 64);
      const exactFraction = `${current}/64`;
      const simpleFraction = simplified ? `${simplified.numerator}/${simplified.denominator}` : exactFraction;
      const decimal = formatDecimal(current / 64);
      const haystack = `${exactFraction} ${simpleFraction} ${decimal}`.toLowerCase();
      if (!normalizedFilter || haystack.includes(normalizedFilter)) {
        pair.push({ fraction: simpleFraction, decimal });
      }
    }
    if (!pair.length) continue;
    while (pair.length < 2) pair.push({ fraction: '', decimal: '' });
    rows.push(`<tr><td>${pair[0].fraction}</td><td>${pair[0].decimal}</td><td>${pair[1].fraction}</td><td>${pair[1].decimal}</td></tr>`);
  }
  decimalChartBodyEl.innerHTML = rows.length ? rows.join('') : '<tr><td colspan="4">No matches found.</td></tr>';
}

function updateFractionToDecimal() {
  if (!fractionNumeratorEl || !fractionDenominatorEl || !fractionToDecimalResultEl) return;
  const numerator = parseFloat(fractionNumeratorEl.value);
  const denominator = parseFloat(fractionDenominatorEl.value);
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    fractionToDecimalResultEl.textContent = '—';
    return;
  }
  fractionToDecimalResultEl.textContent = formatDecimal(numerator / denominator);
}

function updateDecimalToFraction() {
  if (!decimalInputEl || !fractionPrecisionEl || !decimalToFractionResultEl) return;
  const value = parseFloat(decimalInputEl.value);
  const maxDenominator = parseInt(fractionPrecisionEl.value, 10) || 64;
  if (!Number.isFinite(value)) {
    decimalToFractionResultEl.textContent = '—';
    return;
  }
  const whole = Math.floor(value);
  const fractionalPart = value - whole;
  let numerator = Math.round(fractionalPart * maxDenominator);
  let denominator = maxDenominator;

  if (numerator === 0) {
    decimalToFractionResultEl.textContent = whole ? `${whole}` : '0';
    return;
  }

  if (numerator === denominator) {
    decimalToFractionResultEl.textContent = `${whole + 1}`;
    return;
  }

  const simplified = simplifyFraction(numerator, denominator);
  if (!simplified) {
    decimalToFractionResultEl.textContent = '—';
    return;
  }
  numerator = simplified.numerator;
  denominator = simplified.denominator;

  const fractionText = whole ? `${whole} ${numerator}/${denominator}` : `${numerator}/${denominator}`;
  const exactText = value.toFixed(4);
  decimalToFractionResultEl.textContent = `${fractionText} (from ${exactText})`;
}

function parseMixedMeasurement(rawValue) {
  if (typeof rawValue !== 'string') return null;
  const normalized = rawValue
    .trim()
    .replace(/[″”]/g, '')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ');
  if (!normalized) return null;

  if (/^\d*\.?\d+$/.test(normalized)) {
    const decimalValue = parseFloat(normalized);
    return Number.isFinite(decimalValue) ? decimalValue : null;
  }

  const mixedMatch = normalized.match(/^(\d+)(?:\s|-)+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1], 10);
    const numerator = parseInt(mixedMatch[2], 10);
    const denominator = parseInt(mixedMatch[3], 10);
    if (!denominator) return null;
    return whole + (numerator / denominator);
  }

  const fractionMatch = normalized.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const numerator = parseInt(fractionMatch[1], 10);
    const denominator = parseInt(fractionMatch[2], 10);
    if (!denominator) return null;
    return numerator / denominator;
  }

  return null;
}


if (decimalReferenceBtnEl) decimalReferenceBtnEl.addEventListener('click', openDecimalModal);

const referenceViewSelectEl = document.getElementById('referenceViewSelect');
const referenceViewEls = Array.from(document.querySelectorAll('.reference-view[data-reference-view]'));

function setReferenceView(view) {
  const nextView = view || referenceViewSelectEl?.value || 'converter';
  referenceViewEls.forEach((panel) => {
    panel.classList.toggle('active', panel.dataset.referenceView === nextView);
  });
  if (referenceViewSelectEl && referenceViewSelectEl.value !== nextView) referenceViewSelectEl.value = nextView;
  try { localStorage.setItem('tapcalcReferenceViewV1', nextView); } catch {}
}

if (referenceViewSelectEl) {
  referenceViewSelectEl.addEventListener('change', () => setReferenceView(referenceViewSelectEl.value));
  try {
    setReferenceView(localStorage.getItem('tapcalcReferenceViewV1') || referenceViewSelectEl.value || 'converter');
  } catch {
    setReferenceView(referenceViewSelectEl.value || 'converter');
  }
}
const referenceShortcutEls = Array.from(document.querySelectorAll('[data-reference-target]'));
function syncReferenceShortcutState(view) {
  referenceShortcutEls.forEach((el) => el.classList.toggle('active', el.dataset.referenceTarget === view));
}
referenceShortcutEls.forEach((el) => {
  el.addEventListener('click', () => {
    const view = el.dataset.referenceTarget || 'converter';
    setReferenceView(view);
    syncReferenceShortcutState(view);
  });
});
syncReferenceShortcutState(referenceViewSelectEl?.value || 'converter');

const htpChartData = {
  '3': { branch: '6"', head: '3" – 4"', cutter: 5.500, bco: 3.000 },
  '4': { branch: '6" – 8"', head: '4" – 6"', cutter: 7.468, bco: 4.000 },
  '6': { branch: '8" – 12"', head: '6" – 8"', cutter: 9.968, bco: 6.000 },
  '8': { branch: '12"', head: '6" – 8"', cutter: 9.968, bco: 8.000 },
  '10': { branch: '16"', head: '10" – 12"', cutter: 14.468, bco: 10.000 },
  '12': { branch: '16"', head: '10" – 12"', cutter: 14.468, bco: 12.000 },
  '14': { branch: '20"', head: '14" – 16"', cutter: 18.468, bco: 14.000 },
  '16': { branch: '20"', head: '14" – 16"', cutter: 18.468, bco: 16.000 }
};

const plant150Data = [
  ['3"','3/16"','5/8"','4'], ['4"','3/16"','5/8"','4'], ['6"','1/4"','3/4"','4'], ['8"','5/16"','7/8"','4'],
  ['10"','5/16"','7/8"','6'], ['12"','7/16"','1 1/16"','6'], ['14"','7/16"','1 1/4"','6'], ['16"','7/16"','1 1/4"','8'],
  ['18"','7/16"','1 1/4"','8'], ['20"','7/16"','1 1/4"','10'], ['24"','7/16"','1 1/4"','10'], ['30"','7/16"','1 3/8"','14'], ['36"','7/16"','1 3/8"','16']
];
const plant600Data = [
  ['3"','3/8"','1 1/16"','4'], ['4"','3/8"','1 1/4"','4'], ['6"','3/8"','1 1/4"','6'], ['8"','9/16"','1 5/8"','6'],
  ['10"','9/16"','1 5/8"','8'], ['12"','9/16"','1 5/8"','10'], ['14"','5/8"','1 5/8"','10'], ['16"','11/16"','1 13/16"','10'],
  ['18"','13/16"','1 13/16"','10'], ['20"','13/16"','1 13/16"','12'], ['24"','1"','2 1/8"','12'], ['30"','1 1/16"','2 1/4"','14'], ['36"','1 1/16"','2 1/2"','14']
];

function renderSimpleTableRows(targetId, rows) {
  const body = document.getElementById(targetId);
  if (!body) return;
  body.innerHTML = rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('');
}

renderSimpleTableRows('htpReferenceBody', Object.entries(htpChartData).map(([size, item]) => [size + '"', item.branch, item.head, Number(item.cutter).toFixed(3) + '"']));
renderSimpleTableRows('plant150Body', plant150Data);
renderSimpleTableRows('plant600Body', plant600Data);


const ETA_FEED_RATE = 0.004;
const etaMachineEl = document.getElementById('etaMachine');
const etaCutterSizeEl = document.getElementById('etaCutterSize');
const etaCutterSizeListEl = document.getElementById('etaCutterSizeList');
const etaBcoEl = document.getElementById('etaBco');
const etaFeedRateDisplayEl = document.getElementById('etaFeedRateDisplay');
const etaRpmDisplayEl = document.getElementById('etaRpmDisplay');
const etaFeedSpeedDisplayEl = document.getElementById('etaFeedSpeedDisplay');
const etaRangeDisplayEl = document.getElementById('etaRangeDisplay');
const etaInlineStatusEl = document.getElementById('etaInlineStatus');
const etaUseCurrentBcoBtnEl = document.getElementById('etaUseCurrentBcoBtn');
const etaRefreshBtnEl = document.getElementById('etaRefreshBtn');
const etaRpmChart = {
  '360': {
    '2': [35, 45], '3': [35, 45], '4': [35, 45], '6': [35]
  },
  '660': {
    '3': [37], '4': [37], '6': [37], '8': [37], '10': [37], '12': [33], '14': [30]
  },
  '1200': {
    '12': [25, 26, 27],
    '14': [23, 24, 25],
    '16': [21, 22, 23],
    '18': [19, 20, 21],
    '20': [17, 18, 19],
    '22': [16, 17, 18],
    '24': [14, 15, 16],
    '26': [12, 13, 14],
    '28': [12, 13, 14],
    '30': [12, 13, 14],
    '34': [12, 13, 14],
    '36': [12, 13, 14],
    '38': [12, 13, 14],
    '40': [12, 13, 14]
  }
};

function formatEtaMinutes(minutes) {
  if (!Number.isFinite(minutes) || minutes < 0) return '—';
  const totalSeconds = Math.round(minutes * 60);
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hours > 0) return `${hours} hr ${mins} min ${secs} sec`;
  return `${mins} min ${secs} sec`;
}

function populateEtaCutterSizes() {
  if (!etaMachineEl || !etaCutterSizeEl || !etaCutterSizeListEl) return;
  const machine = etaMachineEl.value || '360';
  const sizes = Object.keys(etaRpmChart[machine] || {});
  const previous = String(etaCutterSizeEl.value || '').trim();
  etaCutterSizeListEl.innerHTML = sizes.map((size) => `<option value="${size}"></option>`).join('');
  if (!previous && sizes[0]) etaCutterSizeEl.value = sizes[0];
}

function getEtaRpmMatch(machine, cutterSizeRaw) {
  const machineChart = etaRpmChart?.[machine] || {};
  const normalized = String(cutterSizeRaw || '').trim();
  if (!normalized) return { rpmValues: [], matchedSize: null, exact: false, interpolated: false };

  if (machineChart[normalized]) {
    return { rpmValues: machineChart[normalized], matchedSize: normalized, exact: true, interpolated: false };
  }

  const cutterSize = parseFloat(normalized);
  if (!Number.isFinite(cutterSize)) return { rpmValues: [], matchedSize: null, exact: false, interpolated: false };

  const available = Object.keys(machineChart)
    .map((size) => ({ size, numeric: parseFloat(size), rpmValues: machineChart[size] || [] }))
    .filter((item) => Number.isFinite(item.numeric))
    .sort((a, b) => a.numeric - b.numeric);

  if (!available.length) return { rpmValues: [], matchedSize: null, exact: false, interpolated: false };

  if (cutterSize <= available[0].numeric) {
    return { rpmValues: available[0].rpmValues, matchedSize: available[0].size, exact: false, interpolated: false };
  }

  if (cutterSize >= available[available.length - 1].numeric) {
    return { rpmValues: available[available.length - 1].rpmValues, matchedSize: available[available.length - 1].size, exact: false, interpolated: false };
  }

  let lower = available[0];
  let upper = available[available.length - 1];

  for (let i = 0; i < available.length - 1; i += 1) {
    const current = available[i];
    const next = available[i + 1];
    if (cutterSize >= current.numeric && cutterSize <= next.numeric) {
      lower = current;
      upper = next;
      break;
    }
  }

  const ratio = (cutterSize - lower.numeric) / (upper.numeric - lower.numeric || 1);
  const count = Math.max(lower.rpmValues.length, upper.rpmValues.length);
  const interpolated = [];

  for (let i = 0; i < count; i += 1) {
    const lowerVal = lower.rpmValues[i] ?? lower.rpmValues[lower.rpmValues.length - 1];
    const upperVal = upper.rpmValues[i] ?? upper.rpmValues[upper.rpmValues.length - 1];
    if (Number.isFinite(lowerVal) && Number.isFinite(upperVal)) {
      interpolated.push(Number((lowerVal + ((upperVal - lowerVal) * ratio)).toFixed(2)));
    } else if (Number.isFinite(lowerVal)) {
      interpolated.push(Number(lowerVal));
    } else if (Number.isFinite(upperVal)) {
      interpolated.push(Number(upperVal));
    }
  }

  return {
    rpmValues: interpolated,
    matchedSize: `${lower.size}-${upper.size}`,
    exact: false,
    interpolated: true
  };
}

function syncBcoToEta(options = {}) {
  if (!etaBcoEl) return;
  refreshBcoState();
  const force = !!options.force;
  const currentBco = parseFloat(data?.bco);
  if (!Number.isFinite(currentBco)) {
    if (force) etaBcoEl.value = '';
    return;
  }
  if (!etaBcoEl.value || force) etaBcoEl.value = currentBco.toFixed(4);
}

function updateEtaEstimate() {
  if (!etaMachineEl || !etaCutterSizeEl || !etaBcoEl) return;
  if (etaFeedRateDisplayEl) etaFeedRateDisplayEl.textContent = ETA_FEED_RATE.toFixed(4);
  const machine = etaMachineEl.value || '360';
  const cutterSize = etaCutterSizeEl.value;
  const { rpmValues, matchedSize, exact, interpolated } = getEtaRpmMatch(machine, cutterSize);
  const bco = getMeasurementValue(etaBcoEl);

  if (etaRpmDisplayEl) {
    etaRpmDisplayEl.textContent = rpmValues.length > 1
      ? `${Math.min(...rpmValues)}-${Math.max(...rpmValues)}`
      : (rpmValues[0] ? `${rpmValues[0]}` : '—');
  }

  if (!rpmValues.length || !Number.isFinite(bco) || bco <= 0) {
    if (etaFeedSpeedDisplayEl) etaFeedSpeedDisplayEl.textContent = '—';
    if (etaRangeDisplayEl) etaRangeDisplayEl.textContent = '—';
    if (etaInlineStatusEl) etaInlineStatusEl.textContent = 'Enter a valid BCO and cutter size to calculate estimated time to BCO.';
    return;
  }

  const minRpm = Math.min(...rpmValues);
  const maxRpm = Math.max(...rpmValues);
  const slowFeed = minRpm * ETA_FEED_RATE;
  const fastFeed = maxRpm * ETA_FEED_RATE;
  const lowEta = bco / fastFeed;
  const highEta = bco / slowFeed;

  if (etaFeedSpeedDisplayEl) {
    etaFeedSpeedDisplayEl.textContent = slowFeed === fastFeed
      ? `${slowFeed.toFixed(3)} in/min`
      : `${slowFeed.toFixed(3)}-${fastFeed.toFixed(3)} in/min`;
  }
  if (etaRangeDisplayEl) {
    etaRangeDisplayEl.textContent = lowEta === highEta
      ? formatEtaMinutes(lowEta)
      : `${formatEtaMinutes(lowEta)} to ${formatEtaMinutes(highEta)}`;
  }
  const machineLabel = machine === '1200' ? '1200-M120' : (machine === '660' ? '660 / 760' : '360 / 152');
  if (etaInlineStatusEl) {
    const rpmText = rpmValues.length > 1 ? `${minRpm}-${maxRpm} RPM` : `${rpmValues[0]} RPM`;
    if (exact) {
      etaInlineStatusEl.textContent = `Estimate shown using ${rpmText} for the ${machineLabel}.`;
    } else if (typeof interpolated !== 'undefined' && interpolated) {
      etaInlineStatusEl.textContent = `Custom cutter size ${cutterSize} is using interpolated RPM from chart sizes ${matchedSize} at ${rpmText} for the ${machineLabel}.`;
    } else {
      etaInlineStatusEl.textContent = `Custom cutter size ${cutterSize} is using the nearest charted size (${matchedSize}) at ${rpmText} for the ${machineLabel}.`;
    }
  }
}

function initEtaCalculator() {
  if (!etaMachineEl || !etaCutterSizeEl) return;
  populateEtaCutterSizes();
  syncBcoToEta();
  updateEtaEstimate();
  if (etaMachineEl.dataset.etaBound === 'true') return;
  etaMachineEl.dataset.etaBound = 'true';

  etaMachineEl.addEventListener('change', () => {
    populateEtaCutterSizes();
    updateEtaEstimate();
  });
  etaCutterSizeEl.addEventListener('input', updateEtaEstimate);
  etaCutterSizeEl.addEventListener('change', updateEtaEstimate);
  etaBcoEl?.addEventListener('input', updateEtaEstimate);
  etaBcoEl?.addEventListener('change', updateEtaEstimate);
  etaUseCurrentBcoBtnEl?.addEventListener('click', () => {
    syncBcoToEta({ force: true });
    updateEtaEstimate();
  });
  etaRefreshBtnEl?.addEventListener('click', updateEtaEstimate);
}
if (openDecimalModalBtnEl) openDecimalModalBtnEl.addEventListener('click', openDecimalModal);
if (closeDecimalModalBtnEl) closeDecimalModalBtnEl.addEventListener('click', closeDecimalModal);
if (decimalModalEl) decimalModalEl.addEventListener('click', (event) => {
  if (event.target === decimalModalEl) closeDecimalModal();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && decimalModalEl && !decimalModalEl.hidden) closeDecimalModal();
});
if (fractionNumeratorEl) fractionNumeratorEl.addEventListener('input', updateFractionToDecimal);
if (fractionDenominatorEl) fractionDenominatorEl.addEventListener('input', updateFractionToDecimal);
if (decimalInputEl) decimalInputEl.addEventListener('input', updateDecimalToFraction);
if (fractionPrecisionEl) fractionPrecisionEl.addEventListener('change', updateDecimalToFraction);
if (decimalChartSearchEl) decimalChartSearchEl.addEventListener('input', (event) => buildDecimalChart(event.target.value));
quickDecimalBtnEls.forEach((button) => {
  button.addEventListener('click', () => {
    if (!decimalInputEl) return;
    decimalInputEl.value = button.dataset.decimal || '';
    updateDecimalToFraction();
    decimalInputEl.focus();
  });
});
buildDecimalChart();
updateFractionToDecimal();
updateDecimalToFraction();
renderBcoResult({ pipeOD: geometry.pipeOD, pipeID: geometry.pipeID, cutterOD: parseFloat(data?.cutterOD), bco: parseFloat(data?.bco) });

const boltingChartData = {"150":{"type":"dual","rows":[{"size":"1/2","bolts":"4","diameter":"0.50","stud_rf":"2-1/2","stud_rtj":"-","wrench":"7/8"},{"size":"3/4","bolts":"4","diameter":"0.50","stud_rf":"2-1/2","stud_rtj":"-","wrench":"7/8"},{"size":"1","bolts":"4","diameter":"0.50","stud_rf":"2-3/4","stud_rtj":"3-1/4","wrench":"7/8"},{"size":"1-1/4","bolts":"4","diameter":"0.50","stud_rf":"2-3/4","stud_rtj":"3-1/4","wrench":"7/8"},{"size":"1-1/2","bolts":"4","diameter":"0.50","stud_rf":"3","stud_rtj":"3-1/2","wrench":"7/8"},{"size":"2","bolts":"4","diameter":"0.62","stud_rf":"3-1/4","stud_rtj":"3-3/4","wrench":"1-1/16"},{"size":"2-1/2","bolts":"4","diameter":"0.62","stud_rf":"3-1/2","stud_rtj":"4","wrench":"1-1/16"},{"size":"3","bolts":"4","diameter":"0.62","stud_rf":"3-3/4","stud_rtj":"4-1/4","wrench":"1-1/16"},{"size":"3-1/2","bolts":"8","diameter":"0.62","stud_rf":"3-3/4","stud_rtj":"4-1/4","wrench":"1-1/16"},{"size":"4","bolts":"8","diameter":"0.62","stud_rf":"3-3/4","stud_rtj":"4-1/4","wrench":"1-1/16"},{"size":"5","bolts":"8","diameter":"0.75","stud_rf":"4","stud_rtj":"4-1/2","wrench":"1-1/4"},{"size":"6","bolts":"8","diameter":"0.75","stud_rf":"4","stud_rtj":"4-1/2","wrench":"1-1/4"},{"size":"8","bolts":"8","diameter":"0.75","stud_rf":"4-1/4","stud_rtj":"4-1/2","wrench":"1-1/4"},{"size":"10","bolts":"12","diameter":"0.88","stud_rf":"4-3/4","stud_rtj":"5-1/4","wrench":"1-7/16"},{"size":"12","bolts":"12","diameter":"0.88","stud_rf":"4-3/4","stud_rtj":"5-1/4","wrench":"1-7/16"},{"size":"14","bolts":"12","diameter":"1.00","stud_rf":"5-1/4","stud_rtj":"5-3/4","wrench":"1-5/8"},{"size":"16","bolts":"16","diameter":"1.00","stud_rf":"5-1/2","stud_rtj":"6","wrench":"1-5/8"},{"size":"18","bolts":"16","diameter":"1.12","stud_rf":"6","stud_rtj":"6-1/2","wrench":"1-13/16"},{"size":"20","bolts":"20","diameter":"1.12","stud_rf":"6-1/4","stud_rtj":"6-3/4","wrench":"1-13/16"},{"size":"24","bolts":"20","diameter":"1.25","stud_rf":"7","stud_rtj":"7-1/2","wrench":"2"},{"size":"26","bolts":"24","diameter":"1.38","stud_rf":"8-3/4","stud_rtj":"-","wrench":"2-3/16"},{"size":"28","bolts":"28","diameter":"1.38","stud_rf":"9","stud_rtj":"-","wrench":"2-3/16"},{"size":"30","bolts":"28","diameter":"1.38","stud_rf":"9-1/4","stud_rtj":"-","wrench":"2-3/16"},{"size":"32","bolts":"28","diameter":"1.62","stud_rf":"10-1/2","stud_rtj":"-","wrench":"2-9/16"},{"size":"34","bolts":"32","diameter":"1.62","stud_rf":"10-1/2","stud_rtj":"-","wrench":"2-9/16"},{"size":"36","bolts":"32","diameter":"1.62","stud_rf":"11","stud_rtj":"-","wrench":"2-9/16"},{"size":"38","bolts":"32","diameter":"1.62","stud_rf":"11","stud_rtj":"-","wrench":"2-9/16"},{"size":"40","bolts":"36","diameter":"1.62","stud_rf":"11","stud_rtj":"-","wrench":"2-9/16"},{"size":"42","bolts":"36","diameter":"1.62","stud_rf":"11-1/2","stud_rtj":"-","wrench":"2-9/16"},{"size":"44","bolts":"40","diameter":"1.62","stud_rf":"12","stud_rtj":"-","wrench":"2-9/16"},{"size":"46","bolts":"40","diameter":"1.62","stud_rf":"12","stud_rtj":"-","wrench":"2-9/16"},{"size":"48","bolts":"44","diameter":"1.62","stud_rf":"12-1/2","stud_rtj":"-","wrench":"2-9/16"}]},"300":{"type":"dual","rows":[{"size":"1/2","bolts":"4","diameter":"0.50","stud_rf":"2-3/4","stud_rtj":"3-1/4","wrench":"7/8"},{"size":"3/4","bolts":"4","diameter":"0.62","stud_rf":"3","stud_rtj":"3-1/2","wrench":"1-1/16"},{"size":"1","bolts":"4","diameter":"0.62","stud_rf":"3-1/4","stud_rtj":"3-3/4","wrench":"1-1/16"},{"size":"1-1/4","bolts":"4","diameter":"0.62","stud_rf":"3-1/4","stud_rtj":"3-3/4","wrench":"1-1/16"},{"size":"1-1/2","bolts":"4","diameter":"0.75","stud_rf":"3-3/4","stud_rtj":"4-1/4","wrench":"1-1/4"},{"size":"2","bolts":"8","diameter":"0.62","stud_rf":"3-1/2","stud_rtj":"4-1/4","wrench":"1-1/16"},{"size":"2-1/2","bolts":"8","diameter":"0.75","stud_rf":"4","stud_rtj":"4-3/4","wrench":"1-1/4"},{"size":"3","bolts":"8","diameter":"0.75","stud_rf":"4-1/4","stud_rtj":"5","wrench":"1-1/4"},{"size":"3-1/2","bolts":"8","diameter":"0.75","stud_rf":"4-1/2","stud_rtj":"5-1/4","wrench":"1-1/4"},{"size":"4","bolts":"8","diameter":"0.75","stud_rf":"4-1/2","stud_rtj":"5-1/4","wrench":"1-1/4"},{"size":"5","bolts":"8","diameter":"0.75","stud_rf":"4-3/4","stud_rtj":"5-1/2","wrench":"1-1/4"},{"size":"6","bolts":"12","diameter":"0.75","stud_rf":"5","stud_rtj":"5-3/4","wrench":"1-1/4"},{"size":"8","bolts":"12","diameter":"0.88","stud_rf":"5-1/2","stud_rtj":"6-1/4","wrench":"1-7/16"},{"size":"10","bolts":"16","diameter":"1.00","stud_rf":"6-1/4","stud_rtj":"7","wrench":"1-5/8"},{"size":"12","bolts":"16","diameter":"1.12","stud_rf":"6-3/4","stud_rtj":"7-1/2","wrench":"1-13/16"},{"size":"14","bolts":"20","diameter":"1.12","stud_rf":"7","stud_rtj":"7-3/4","wrench":"1-13/16"},{"size":"16","bolts":"20","diameter":"1.25","stud_rf":"7-1/2","stud_rtj":"8-1/4","wrench":"2"},{"size":"18","bolts":"24","diameter":"1.25","stud_rf":"7-3/4","stud_rtj":"8-1/2","wrench":"2"},{"size":"20","bolts":"24","diameter":"1.25","stud_rf":"8-1/4","stud_rtj":"9","wrench":"2"},{"size":"24","bolts":"24","diameter":"1.50","stud_rf":"9-1/4","stud_rtj":"10-1/4","wrench":"2-3/8"},{"size":"26","bolts":"28","diameter":"1.75","stud_rf":"10-3/4","stud_rtj":"-","wrench":"2-3/4"},{"size":"28","bolts":"28","diameter":"1.75","stud_rf":"11-1/4","stud_rtj":"-","wrench":"2-3/4"},{"size":"30","bolts":"28","diameter":"1.88","stud_rf":"12","stud_rtj":"-","wrench":"2-15/16"},{"size":"32","bolts":"28","diameter":"2.00","stud_rf":"12-1/2","stud_rtj":"-","wrench":"3-1/8"},{"size":"34","bolts":"28","diameter":"2.00","stud_rf":"13","stud_rtj":"-","wrench":"3-1/8"},{"size":"36","bolts":"32","diameter":"2.12","stud_rf":"13-1/2","stud_rtj":"-","wrench":"3-1/4"},{"size":"38","bolts":"32","diameter":"1.62","stud_rf":"12-1/2","stud_rtj":"-","wrench":"2-9/16"},{"size":"40","bolts":"32","diameter":"1.75","stud_rf":"13-1/4","stud_rtj":"-","wrench":"2-3/4"},{"size":"42","bolts":"32","diameter":"1.75","stud_rf":"13-3/4","stud_rtj":"-","wrench":"2-3/4"},{"size":"44","bolts":"32","diameter":"1.88","stud_rf":"14-1/4","stud_rtj":"-","wrench":"2-15/16"},{"size":"46","bolts":"28","diameter":"2.00","stud_rf":"15","stud_rtj":"-","wrench":"3-1/8"},{"size":"48","bolts":"32","diameter":"2.00","stud_rf":"15-1/4","stud_rtj":"-","wrench":"3-1/8"}]},"400":{"type":"single","rows":[{"size":"1/2","bolts":"4","diameter":"0.50","stud":"3-1/4","wrench":"7/8"},{"size":"3/4","bolts":"4","diameter":"0.63","stud":"3-1/2","wrench":"1-1/16"},{"size":"1","bolts":"4","diameter":"0.63","stud":"3-3/4","wrench":"1-1/16"},{"size":"1-1/4","bolts":"4","diameter":"0.63","stud":"4","wrench":"1-1/16"},{"size":"1-1/2","bolts":"4","diameter":"0.75","stud":"4-1/4","wrench":"1-1/4"},{"size":"2","bolts":"8","diameter":"0.63","stud":"4-1/4","wrench":"1-1/16"},{"size":"2-1/2","bolts":"8","diameter":"0.75","stud":"4-3/4","wrench":"1-1/4"},{"size":"3","bolts":"8","diameter":"0.75","stud":"5","wrench":"1-1/4"},{"size":"3-1/2","bolts":"8","diameter":"0.88","stud":"5-1/2","wrench":"1-7/16"},{"size":"4","bolts":"8","diameter":"0.88","stud":"5-1/2","wrench":"1-7/16"},{"size":"5","bolts":"8","diameter":"0.88","stud":"5-3/4","wrench":"1-7/16"},{"size":"6","bolts":"12","diameter":"0.88","stud":"6","wrench":"1-7/16"},{"size":"8","bolts":"12","diameter":"1.00","stud":"6-3/4","wrench":"1-5/8"},{"size":"10","bolts":"16","diameter":"1.13","stud":"7-1/2","wrench":"1-13/16"},{"size":"12","bolts":"16","diameter":"1.25","stud":"8","wrench":"2"},{"size":"14","bolts":"20","diameter":"1.25","stud":"8-1/4","wrench":"2"},{"size":"16","bolts":"20","diameter":"1.38","stud":"8-3/4","wrench":"2-3/16"},{"size":"18","bolts":"24","diameter":"1.38","stud":"9","wrench":"2-3/16"},{"size":"20","bolts":"24","diameter":"1.50","stud":"9-3/4","wrench":"2-3/8"},{"size":"24","bolts":"24","diameter":"1.75","stud":"10-3/4","wrench":"2-3/4"},{"size":"26","bolts":"28","diameter":"1.88","stud":"12-1/2","wrench":"2-15/16"},{"size":"28","bolts":"28","diameter":"2.00","stud":"13-1/4","wrench":"3-1/8"},{"size":"30","bolts":"28","diameter":"2.12","stud":"14","wrench":"3-1/4"},{"size":"32","bolts":"28","diameter":"2.12","stud":"14-1/4","wrench":"3-1/4"},{"size":"34","bolts":"28","diameter":"2.12","stud":"14-3/4","wrench":"3-1/4"},{"size":"36","bolts":"32","diameter":"2.12","stud":"15","wrench":"3-1/4"},{"size":"38","bolts":"32","diameter":"1.88","stud":"14-3/4","wrench":"2-15/16"},{"size":"40","bolts":"32","diameter":"2.00","stud":"15-1/2","wrench":"3-1/8"},{"size":"42","bolts":"32","diameter":"2.00","stud":"15-3/4","wrench":"3-1/8"},{"size":"44","bolts":"32","diameter":"2.12","stud":"16-1/2","wrench":"3-1/4"},{"size":"46","bolts":"36","diameter":"2.12","stud":"17","wrench":"3-1/4"},{"size":"48","bolts":"28","diameter":"2.38","stud":"18","wrench":"3-5/8"}]},"600":{"type":"single","rows":[{"size":"1/2","bolts":"4","diameter":"0.50","stud":"3-1/4","wrench":"7/8"},{"size":"3/4","bolts":"4","diameter":"0.63","stud":"3-1/2","wrench":"1-1/16"},{"size":"1","bolts":"4","diameter":"0.63","stud":"3-3/4","wrench":"1-1/16"},{"size":"1-1/4","bolts":"4","diameter":"0.63","stud":"4","wrench":"1-1/16"},{"size":"1-1/2","bolts":"4","diameter":"0.75","stud":"4-1/4","wrench":"1-1/4"},{"size":"2","bolts":"8","diameter":"0.63","stud":"4-1/4","wrench":"1-1/16"},{"size":"2-1/2","bolts":"8","diameter":"0.75","stud":"4-3/4","wrench":"1-1/4"},{"size":"3","bolts":"8","diameter":"0.75","stud":"5","wrench":"1-1/4"},{"size":"3-1/2","bolts":"8","diameter":"0.88","stud":"5-1/2","wrench":"1-7/16"},{"size":"4","bolts":"8","diameter":"0.88","stud":"5-3/4","wrench":"1-7/16"},{"size":"5","bolts":"8","diameter":"1.00","stud":"6-1/2","wrench":"1-5/8"},{"size":"6","bolts":"12","diameter":"1.00","stud":"6-3/4","wrench":"1-5/8"},{"size":"8","bolts":"12","diameter":"1.13","stud":"7-3/4","wrench":"1-13/16"},{"size":"10","bolts":"16","diameter":"1.25","stud":"8-1/2","wrench":"2"},{"size":"12","bolts":"20","diameter":"1.25","stud":"8-3/4","wrench":"2"},{"size":"14","bolts":"20","diameter":"1.38","stud":"9-1/4","wrench":"2-3/16"},{"size":"16","bolts":"20","diameter":"1.50","stud":"10","wrench":"2-3/8"},{"size":"18","bolts":"20","diameter":"1.63","stud":"10-3/4","wrench":"2-9/16"},{"size":"20","bolts":"24","diameter":"1.63","stud":"11-1/2","wrench":"2-9/16"},{"size":"24","bolts":"24","diameter":"1.88","stud":"13","wrench":"2-15/16"},{"size":"26","bolts":"28","diameter":"2.00","stud":"14-1/2","wrench":"3-1/8"},{"size":"28","bolts":"28","diameter":"2.12","stud":"15","wrench":"3-1/4"},{"size":"30","bolts":"28","diameter":"2.12","stud":"15-1/2","wrench":"3-1/4"},{"size":"32","bolts":"28","diameter":"2.38","stud":"16-1/2","wrench":"3-5/8"},{"size":"34","bolts":"28","diameter":"2.38","stud":"16-3/4","wrench":"3-5/8"},{"size":"36","bolts":"28","diameter":"2.62","stud":"17-3/4","wrench":"4"},{"size":"38","bolts":"28","diameter":"2.38","stud":"18-1/4","wrench":"3-5/8"},{"size":"40","bolts":"32","diameter":"2.38","stud":"18-3/4","wrench":"3-5/8"},{"size":"42","bolts":"28","diameter":"2.62","stud":"19-3/4","wrench":"4"},{"size":"44","bolts":"32","diameter":"2.62","stud":"20-1/4","wrench":"4"},{"size":"46","bolts":"32","diameter":"2.62","stud":"20-3/4","wrench":"4"},{"size":"48","bolts":"32","diameter":"2.88","stud":"22-1/4","wrench":"\u2014"}]},"900":{"type":"single","rows":[{"size":"1/2","bolts":"4","diameter":"0.75","stud":"4-1/4","wrench":"1-1/4"},{"size":"3/4","bolts":"4","diameter":"0.75","stud":"4-1/2","wrench":"1-1/4"},{"size":"1","bolts":"4","diameter":"0.88","stud":"5","wrench":"1-7/16"},{"size":"1-1/4","bolts":"4","diameter":"0.88","stud":"5","wrench":"1-7/16"},{"size":"1-1/2","bolts":"4","diameter":"1.00","stud":"5-1/2","wrench":"1-5/8"},{"size":"2","bolts":"8","diameter":"0.88","stud":"5-3/4","wrench":"1-7/16"},{"size":"2-1/2","bolts":"8","diameter":"1.00","stud":"6-1/4","wrench":"1-5/8"},{"size":"3","bolts":"8","diameter":"0.88","stud":"5-3/4","wrench":"1-7/16"},{"size":"3-1/2","bolts":"-","diameter":"-","stud":"-","wrench":"\u2014"},{"size":"4","bolts":"8","diameter":"1.13","stud":"6-3/4","wrench":"1-13/16"},{"size":"5","bolts":"8","diameter":"1.25","stud":"7-1/2","wrench":"2"},{"size":"6","bolts":"12","diameter":"1.13","stud":"7-3/4","wrench":"1-13/16"},{"size":"8","bolts":"12","diameter":"1.38","stud":"8-3/4","wrench":"2-3/16"},{"size":"10","bolts":"16","diameter":"1.38","stud":"9-1/4","wrench":"2-3/16"},{"size":"12","bolts":"20","diameter":"1.38","stud":"10","wrench":"2-3/16"},{"size":"14","bolts":"20","diameter":"1.50","stud":"10-3/4","wrench":"2-3/8"},{"size":"16","bolts":"20","diameter":"1.63","stud":"11-1/4","wrench":"2-9/16"},{"size":"18","bolts":"20","diameter":"1.88","stud":"13","wrench":"2-15/16"},{"size":"20","bolts":"20","diameter":"2.00","stud":"13-3/4","wrench":"3-1/8"},{"size":"24","bolts":"20","diameter":"2.50","stud":"17-1/4","wrench":"3-7/8"},{"size":"26","bolts":"20","diameter":"2.88","stud":"18-3/4","wrench":"\u2014"},{"size":"28","bolts":"20","diameter":"3.12","stud":"19-3/4","wrench":"4-7/8"},{"size":"30","bolts":"20","diameter":"3.12","stud":"20-1/2","wrench":"4-7/8"},{"size":"32","bolts":"20","diameter":"3.38","stud":"22","wrench":"\u2014"},{"size":"34","bolts":"20","diameter":"3.62","stud":"23","wrench":"5-1/2"},{"size":"36","bolts":"20","diameter":"3.62","stud":"23-3/4","wrench":"5-1/2"},{"size":"38","bolts":"20","diameter":"3.62","stud":"24-1/2","wrench":"5-1/2"},{"size":"40","bolts":"24","diameter":"3.62","stud":"25","wrench":"5-1/2"},{"size":"42","bolts":"24","diameter":"3.62","stud":"25-3/4","wrench":"5-1/2"},{"size":"44","bolts":"24","diameter":"3.88","stud":"27","wrench":"\u2014"},{"size":"46","bolts":"24","diameter":"4.12","stud":"28-1/2","wrench":"6-1/4"},{"size":"48","bolts":"24","diameter":"4.12","stud":"29","wrench":"6-1/4"}]},"1500":{"type":"single","rows":[{"size":"1/2","bolts":"4","diameter":"0.75","stud":"4-1/4","wrench":"1-1/4"},{"size":"3/4","bolts":"4","diameter":"0.75","stud":"4-1/2","wrench":"1-1/4"},{"size":"1","bolts":"4","diameter":"0.88","stud":"5","wrench":"1-7/16"},{"size":"1-1/4","bolts":"4","diameter":"-","stud":"5","wrench":"\u2014"},{"size":"1-1/2","bolts":"4","diameter":"1.00","stud":"5-1/2","wrench":"1-5/8"},{"size":"2","bolts":"8","diameter":"0.88","stud":"5-3/4","wrench":"1-7/16"},{"size":"2-1/2","bolts":"8","diameter":"1.00","stud":"6-1/4","wrench":"1-5/8"},{"size":"3","bolts":"8","diameter":"1.13","stud":"7","wrench":"1-13/16"},{"size":"3-1/2","bolts":"-","diameter":"-","stud":"-","wrench":"\u2014"},{"size":"4","bolts":"8","diameter":"1.25","stud":"7-3/4","wrench":"2"},{"size":"5","bolts":"8","diameter":"1.50","stud":"9-3/4","wrench":"2-3/8"},{"size":"6","bolts":"12","diameter":"1.38","stud":"10-1/4","wrench":"2-3/16"},{"size":"8","bolts":"12","diameter":"1.63","stud":"11-1/2","wrench":"2-9/16"},{"size":"10","bolts":"12","diameter":"1.88","stud":"13-1/2","wrench":"2-15/16"},{"size":"12","bolts":"12","diameter":"2.00","stud":"15","wrench":"3-1/8"},{"size":"14","bolts":"16","diameter":"2.25","stud":"16-1/4","wrench":"3-1/2"},{"size":"16","bolts":"16","diameter":"2.50","stud":"17-3/4","wrench":"3-7/8"},{"size":"18","bolts":"16","diameter":"2.75","stud":"19-1/2","wrench":"4-1/4"},{"size":"20","bolts":"16","diameter":"3.00","stud":"21-1/4","wrench":"4-5/8"},{"size":"24","bolts":"16","diameter":"3.50","stud":"24-1/4","wrench":"5-3/8"},{"size":"26","bolts":"-","diameter":"-","stud":"-","wrench":"\u2014"},{"size":"28","bolts":"-","diameter":"-","stud":"-","wrench":"\u2014"},{"size":"30","bolts":"-","diameter":"-","stud":"-","wrench":"\u2014"},{"size":"32","bolts":"-","diameter":"-","stud":"-","wrench":"\u2014"},{"size":"34","bolts":"-","diameter":"-","stud":"-","wrench":"\u2014"},{"size":"36","bolts":"-","diameter":"-","stud":"-","wrench":"\u2014"},{"size":"38","bolts":"-","diameter":"-","stud":"-","wrench":"\u2014"},{"size":"40","bolts":"-","diameter":"-","stud":"-","wrench":"\u2014"},{"size":"42","bolts":"-","diameter":"-","stud":"-","wrench":"\u2014"},{"size":"44","bolts":"-","diameter":"-","stud":"-","wrench":"\u2014"},{"size":"46","bolts":"-","diameter":"-","stud":"-","wrench":"\u2014"},{"size":"48","bolts":"-","diameter":"-","stud":"-","wrench":"\u2014"}]},"2500":{"type":"single","rows":[{"size":"1/2","bolts":"4","diameter":"0.75","stud":"5","wrench":"1-1/4"},{"size":"3/4","bolts":"4","diameter":"0.75","stud":"5","wrench":"1-1/4"},{"size":"1","bolts":"4","diameter":"0.88","stud":"5-1/2","wrench":"1-7/16"},{"size":"1-1/4","bolts":"4","diameter":"1.00","stud":"6","wrench":"1-5/8"},{"size":"1-1/2","bolts":"4","diameter":"1.13","stud":"6-3/4","wrench":"1-13/16"},{"size":"2","bolts":"8","diameter":"1.00","stud":"7","wrench":"1-5/8"},{"size":"2-1/2","bolts":"8","diameter":"1.13","stud":"7-3/4","wrench":"1-13/16"},{"size":"3","bolts":"8","diameter":"1.25","stud":"8-3/4","wrench":"2"},{"size":"3-1/2","bolts":"-","diameter":"-","stud":"-","wrench":"\u2014"},{"size":"4","bolts":"8","diameter":"1.50","stud":"10","wrench":"2-3/8"},{"size":"5","bolts":"8","diameter":"1.75","stud":"11-3/4","wrench":"2-3/4"},{"size":"6","bolts":"8","diameter":"2.00","stud":"13-3/4","wrench":"3-1/8"},{"size":"8","bolts":"12","diameter":"2.00","stud":"15-1/4","wrench":"3-1/8"},{"size":"10","bolts":"12","diameter":"2.50","stud":"19-1/4","wrench":"3-7/8"},{"size":"12","bolts":"12","diameter":"2.75","stud":"21-1/4","wrench":"4-1/4"},{"size":"14","bolts":"-","diameter":"-","stud":"-","wrench":"\u2014"},{"size":"16","bolts":"-","diameter":"-","stud":"-","wrench":"\u2014"},{"size":"18","bolts":"-","diameter":"-","stud":"-","wrench":"\u2014"},{"size":"20","bolts":"-","diameter":"-","stud":"-","wrench":"\u2014"},{"size":"24","bolts":"-","diameter":"-","stud":"-","wrench":"\u2014"},{"size":"26","bolts":"-","diameter":"-","stud":"-","wrench":"\u2014"},{"size":"28","bolts":"-","diameter":"-","stud":"-","wrench":"\u2014"},{"size":"30","bolts":"-","diameter":"-","stud":"-","wrench":"\u2014"},{"size":"32","bolts":"-","diameter":"-","stud":"-","wrench":"\u2014"},{"size":"34","bolts":"-","diameter":"-","stud":"-","wrench":"\u2014"},{"size":"36","bolts":"-","diameter":"-","stud":"-","wrench":"\u2014"},{"size":"38","bolts":"-","diameter":"-","stud":"-","wrench":"\u2014"},{"size":"40","bolts":"-","diameter":"-","stud":"-","wrench":"\u2014"},{"size":"42","bolts":"-","diameter":"-","stud":"-","wrench":"\u2014"},{"size":"44","bolts":"-","diameter":"-","stud":"-","wrench":"\u2014"},{"size":"46","bolts":"-","diameter":"-","stud":"-","wrench":"\u2014"},{"size":"48","bolts":"-","diameter":"-","stud":"-","wrench":"\u2014"}]}};

const boltingClassSelectEl = document.getElementById('boltingClassSelect');
const boltingSizeSelectEl = document.getElementById('boltingSizeSelect');
const boltingBoltCountEl = document.getElementById('boltingBoltCount');
const boltingDiameterEl = document.getElementById('boltingDiameter');
const boltingStudRfEl = document.getElementById('boltingStudRf');
const boltingStudRtjEl = document.getElementById('boltingStudRtj');
const boltingWrenchEl = document.getElementById('boltingWrench');
const boltingRtjItemEl = document.getElementById('boltingRtjItem');
const boltingTableHeadEl = document.getElementById('boltingTableHead');
const boltingTableBodyEl = document.getElementById('boltingTableBody');

function getWrenchSizeForDiameter(diameter) {
  const dia = String(diameter ?? '').trim();
  const wrenchMap = {
    '0.50': '7/8',
    '0.62': '1-1/16',
    '0.63': '1-1/16',
    '0.75': '1-1/4',
    '0.88': '1-7/16',
    '1.00': '1-5/8',
    '1.12': '1-13/16',
    '1.13': '1-13/16',
    '1.25': '2',
    '1.38': '2-3/16',
    '1.50': '2-3/8',
    '1.62': '2-9/16',
    '1.63': '2-9/16',
    '1.75': '2-3/4',
    '1.88': '2-15/16',
    '2.00': '3-1/8',
    '2.12': '3-1/4',
    '2.25': '3-1/2',
    '2.38': '3-5/8',
    '2.50': '3-7/8',
    '2.62': '4',
    '2.75': '4-1/4',
    '2.88': '4-1/2',
    '3.00': '4-5/8',
    '3.12': '4-7/8',
    '3.25': '5',
    '3.38': '5-1/4',
    '3.50': '5-3/8',
    '3.62': '5-1/2',
    '3.75': '5-3/4',
    '3.88': '6',
    '4.00': '6-1/8',
    '4.12': '6-1/4'
  };
  return wrenchMap[dia] || '—';
}


function getBoltingRowsForClass(flangeClass) {
  return boltingChartData?.[flangeClass]?.rows || [];
}

function populateBoltingSizes() {
  if (!boltingClassSelectEl || !boltingSizeSelectEl) return;
  const flangeClass = boltingClassSelectEl.value || '150';
  const rows = getBoltingRowsForClass(flangeClass);
  const previousValue = boltingSizeSelectEl.value;
  boltingSizeSelectEl.innerHTML = rows.map((row) => `<option value="${row.size}">${row.size}"</option>`).join('');
  const match = rows.find((row) => row.size === previousValue);
  boltingSizeSelectEl.value = match ? previousValue : (rows[0]?.size || '');
}

function renderBoltingTable() {
  if (!boltingTableHeadEl || !boltingTableBodyEl || !boltingClassSelectEl) return;
  const flangeClass = boltingClassSelectEl.value || '150';
  const config = boltingChartData?.[flangeClass];
  const rows = config?.rows || [];
  const isDual = config?.type === 'dual';

  boltingTableHeadEl.innerHTML = isDual
    ? '<tr><th>Pipe Size</th><th>Bolts / Studs</th><th>Dia.</th><th>Wrench</th><th>Stud RF</th><th>Stud RTJ</th></tr>'
    : '<tr><th>Pipe Size</th><th>Bolts / Studs</th><th>Dia.</th><th>Wrench</th><th>Stud Length</th></tr>';

  boltingTableBodyEl.innerHTML = rows.map((row) => isDual
    ? `<tr><td>${row.size}</td><td>${row.bolts}</td><td>${row.diameter}</td><td>${row.wrench || getWrenchSizeForDiameter(row.diameter)}</td><td>${row.stud_rf}</td><td>${row.stud_rtj}</td></tr>`
    : `<tr><td>${row.size}</td><td>${row.bolts}</td><td>${row.diameter}</td><td>${row.wrench || getWrenchSizeForDiameter(row.diameter)}</td><td>${row.stud}</td></tr>`
  ).join('');
}

function updateBoltingSummary() {
  if (!boltingClassSelectEl || !boltingSizeSelectEl) return;
  const flangeClass = boltingClassSelectEl.value || '150';
  const config = boltingChartData?.[flangeClass];
  const row = getBoltingRowsForClass(flangeClass).find((entry) => entry.size === boltingSizeSelectEl.value);
  const isDual = config?.type === 'dual';
  if (!row) {
    if (boltingBoltCountEl) boltingBoltCountEl.textContent = '—';
    if (boltingDiameterEl) boltingDiameterEl.textContent = '—';
    if (boltingStudRfEl) boltingStudRfEl.textContent = '—';
    if (boltingStudRtjEl) boltingStudRtjEl.textContent = '—';
    if (boltingWrenchEl) boltingWrenchEl.textContent = '—';
    if (boltingRtjItemEl) boltingRtjItemEl.hidden = !isDual;
    return;
  }
  if (boltingBoltCountEl) boltingBoltCountEl.textContent = row.bolts || '—';
  if (boltingDiameterEl) boltingDiameterEl.textContent = row.diameter || '—';
  if (boltingWrenchEl) boltingWrenchEl.textContent = row.wrench || getWrenchSizeForDiameter(row.diameter);
  if (boltingStudRfEl) boltingStudRfEl.textContent = isDual ? (row.stud_rf || '—') : (row.stud || '—');
  if (boltingStudRtjEl) boltingStudRtjEl.textContent = isDual ? (row.stud_rtj || '—') : '—';
  if (boltingRtjItemEl) boltingRtjItemEl.hidden = !isDual;
}

function initBoltingReference() {
  if (!boltingClassSelectEl || !boltingSizeSelectEl) return;
  populateBoltingSizes();
  renderBoltingTable();
  updateBoltingSummary();
  boltingClassSelectEl.addEventListener('change', () => {
    populateBoltingSizes();
    renderBoltingTable();
    updateBoltingSummary();
  });
  boltingSizeSelectEl.addEventListener('change', updateBoltingSummary);
}

initBoltingReference();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    navigator.serviceWorker.register('service-worker.js?v=3.0.0-alpha35', { updateViaCache: 'none' }).then((registration) => registration.update()).catch(() => {});
  });
}

// ===== HTP HOT TAP =====
const htpPipeSizeEl = document.getElementById('htpPipeSize');
const htpBranchSizeEl = document.getElementById('htpBranchSize');
const htpHeadEl = document.getElementById('htpHead');
const htpCutterSizeEl = document.getElementById('htpCutterSize');
const htpBcoEl = document.getElementById('htpBco');
const htpMdEl = document.getElementById('htpMd');
const htpLdEl = document.getElementById('htpLd');
const htpLdSignEl = document.getElementById('htpLdSign');
const htpPtcEl = document.getElementById('htpPtc');
const htpTcoEl = document.getElementById('htpTco');
const htpMachineEl = document.getElementById('htpMachine');
const htpFeedRateDisplayEl = document.getElementById('htpFeedRateDisplay');
const htpEtaRpmEl = document.getElementById('htpEtaRpm');
const htpEtaFeedSpeedEl = document.getElementById('htpEtaFeedSpeed');
const htpEtaRangeEl = document.getElementById('htpEtaRange');
const htpStatusEl = document.getElementById('htpStatus');
let lastHtp = { tco: NaN, eta: '—', cutter: NaN, bco: NaN, warnings: [] };

function calcHtp() {
  if (!htpPipeSizeEl) return;
  const config = htpChartData[String(htpPipeSizeEl.value || '')];
  if (!config) return;

  if (htpBranchSizeEl) htpBranchSizeEl.textContent = config.branch;
  if (htpHeadEl) htpHeadEl.textContent = config.head;
  if (htpCutterSizeEl) htpCutterSizeEl.textContent = Number(config.cutter).toFixed(3);
  if (htpBcoEl) htpBcoEl.textContent = Number(config.bco).toFixed(3);
  if (htpFeedRateDisplayEl) htpFeedRateDisplayEl.textContent = ETA_FEED_RATE.toFixed(4);

  const md = getMeasurementValue(htpMdEl) || 0;
  const ldRaw = getMeasurementValue(htpLdEl) || 0;
  const ld = (htpLdSignEl?.value || '+') === '-' ? -ldRaw : ldRaw;
  const ptc = getMeasurementValue(htpPtcEl) || 0;
  const bco = Number(config.bco) || 0;
  const tco = md + ld + ptc + bco;

  if (htpTcoEl) htpTcoEl.textContent = Number.isFinite(tco) ? tco.toFixed(4) : '—';

  const machine = htpMachineEl?.value || '360';
  const { rpmValues, matchedSize, exact, interpolated } = getEtaRpmMatch(machine, config.cutter);

  if (htpEtaRpmEl) {
    htpEtaRpmEl.textContent = rpmValues.length > 1 ? `${Math.min(...rpmValues)}-${Math.max(...rpmValues)}` : (rpmValues[0] ? `${rpmValues[0]}` : '—');
  }

  if (!rpmValues.length || !bco) {
    if (htpEtaFeedSpeedEl) htpEtaFeedSpeedEl.textContent = '—';
    if (htpEtaRangeEl) htpEtaRangeEl.textContent = '—';
    if (htpStatusEl) htpStatusEl.textContent = 'HTP ETA is waiting on chart data.';
    lastHtp = { tco, eta: '—', cutter: config.cutter, bco, warnings: [] };
    updateSummary();
    return;
  }

  const minRpm = Math.min(...rpmValues);
  const maxRpm = Math.max(...rpmValues);
  const slowFeed = minRpm * ETA_FEED_RATE;
  const fastFeed = maxRpm * ETA_FEED_RATE;
  const lowEta = bco / fastFeed;
  const highEta = bco / slowFeed;
  const etaText = lowEta === highEta ? formatEtaMinutes(lowEta) : `${formatEtaMinutes(lowEta)} to ${formatEtaMinutes(highEta)}`;

  if (htpEtaFeedSpeedEl) htpEtaFeedSpeedEl.textContent = slowFeed === fastFeed ? `${slowFeed.toFixed(3)} in/min` : `${slowFeed.toFixed(3)}-${fastFeed.toFixed(3)} in/min`;
  if (htpEtaRangeEl) htpEtaRangeEl.textContent = etaText;

  const machineLabel = machine === '1200' ? '1200-M120' : (machine === '660' ? '660 / 760' : '360 / 152');
  const rpmText = rpmValues.length > 1 ? `${minRpm}-${maxRpm} RPM` : `${rpmValues[0]} RPM`;
  if (htpStatusEl) {
    if (exact) htpStatusEl.textContent = `HTP ${htpPipeSizeEl.value}" is using cutter ${Number(config.cutter).toFixed(3)} with ${rpmText} on the ${machineLabel}.`;
    else if (interpolated) htpStatusEl.textContent = `HTP ${htpPipeSizeEl.value}" is using interpolated RPM from chart sizes ${matchedSize} at ${rpmText} on the ${machineLabel}.`;
    else htpStatusEl.textContent = `HTP ${htpPipeSizeEl.value}" is using nearest chart size ${matchedSize} at ${rpmText} on the ${machineLabel}.`;
  }

  lastHtp = { tco, eta: etaText, cutter: config.cutter, bco, warnings: [] };
  updateSummary();
}

[htpPipeSizeEl, htpMdEl, htpLdEl, htpLdSignEl, htpPtcEl, htpMachineEl].forEach((el) => {
  if (!el) return;
  el.addEventListener('input', calcHtp);
  el.addEventListener('change', calcHtp);
});

// ===== HOT TAP =====
const mdEl = document.getElementById("md");
const ldEl = document.getElementById("ld");
const ptcEl = document.getElementById("ptc");
const podEl = document.getElementById("pod");
const startEl = document.getElementById("start");
const mtEl = document.getElementById("mt");
const signEl = document.getElementById("ldSign");

const liEl = document.getElementById("li");
const ttdEl = document.getElementById("ttd");
const mcoEl = document.getElementById("mco");
const popEl = document.getElementById("pop");
const copEl = document.getElementById("cop");
const rbcoGeomEl = document.getElementById("rbco_geom");
const rbcoEl = document.getElementById("rbco");
const rmcoEl = document.getElementById("rmco");
const hotTapWarnEl = document.getElementById("mtWarning");

let lastHotTap = { li: NaN, ttd: NaN, warnings: [] };
let lastLineStop = { li: NaN, ldRaw: NaN, warnings: [] };
let lastCompletionPlug = { li: NaN, warnings: [] };

const JOB_STATE_KEY = 'measurementCardStateV1';
const JOB_HISTORY_KEY = 'measurementCardHistoryV1';
const ACTIVE_MODE_KEY = 'measurementCardActiveModeV1';
const MAX_HISTORY_ITEMS = 8;
const saveHistoryBtnEl = document.getElementById('saveHistoryBtn');
const resetJobBtnEl = document.getElementById('resetJobBtn');
const clearHistoryBtnEl = document.getElementById('clearHistoryBtn');
const historyListEl = document.getElementById('historyList');
const historyDrawerToggleEl = document.getElementById('historyDrawerToggle');
const historyDrawerContentEl = document.getElementById('historyDrawerContent');
const historyCountBadgeEl = document.getElementById('historyCountBadge');
const HISTORY_DRAWER_OPEN_KEY = 'measurementCardHistoryDrawerOpenV1';
const geometryLockToggleEl = document.getElementById('geometryLockToggle');
const exportPdfBtnEl = document.getElementById('exportPdfBtn');
const exportImageBtnEl = document.getElementById('exportImageBtn');
const jobInfoSectionEl = document.getElementById('jobInfoSection');
const jobInfoBodyEl = document.getElementById('jobInfoBody');
const jobInfoSummaryEl = document.getElementById('jobInfoSummary');
const jobInfoToggleBtnEl = document.getElementById('jobInfoToggleBtn');
const JOB_INFO_COLLAPSED_KEY = 'measurementCardJobInfoCollapsedV1';
const jobInfoFieldIds = ['jobClient','jobDescription','jobNumber','jobPressure','jobTemperature','jobDate','jobProduct','jobLocation','jobTechnician','jobNotes','machineType','operationType'];
const bcoGeometryFieldIds = ['bcoPipeMaterial','bcoPipeOD','bcoSchedule','bcoPipeID','bcoCutterOD'];
const syncJobsBtnEl = document.getElementById('syncJobsBtn');
const refreshCloudJobsBtnEl = document.getElementById('refreshCloudJobsBtn');
const testFirestoreBtnEl = document.getElementById('testFirestoreBtn');
const jobsListEl = document.getElementById('jobsList');
const jobsSelectEl = document.getElementById('jobsSelect');
const jobsResultsMetaEl = document.getElementById('jobsResultsMeta');
const jobsSearchInputEl = document.getElementById('jobsSearchInput');
const jobsViewChipEls = Array.from(document.querySelectorAll('.jobs-view-chip'));
const libraryLaneBtnEls = Array.from(document.querySelectorAll('.library-lane-btn'));
const libraryLanePanelEls = Array.from(document.querySelectorAll('[data-library-lane-panel]'));
const jobsCloudStatusEl = document.getElementById('jobsCloudStatus');
const firebaseStatusEl = document.getElementById('firebaseStatus');
const unsyncedJobsCountEl = document.getElementById('unsyncedJobsCount');
const FIREBASE_ENABLED_KEY = 'tapcalcFirebaseEnabledV1';
let firebaseDb = null;
let firebaseModuleCache = null;
let firebaseInitPromise = null;
let cloudJobsCache = [];
let jobsSearchTerm = '';
let jobsBrowseMode = 'all';
let selectedJobId = '';
let selectedJobEntry = null;
let renderedLibraryJobs = [];



function buildBcoResultMarkup(payload = {}) {
  const pipeOD = Number.isFinite(payload.pipeOD) ? payload.pipeOD.toFixed(3) : '—';
  const pipeID = Number.isFinite(payload.pipeID) ? payload.pipeID.toFixed(3) : '—';
  const cutterOD = Number.isFinite(payload.cutterOD) ? payload.cutterOD.toFixed(3) : '—';
  const bco = Number.isFinite(payload.bco) ? payload.bco.toFixed(3) : null;
  const error = payload.error || '';
  if (error) {
    return `<div class="bco-result-card error"><div class="bco-result-header">BCO Result</div><div class="bco-result-error">${error}</div></div>`;
  }
  return `<div class="bco-result-card${bco ? ' ready' : ''}">
    <div class="bco-result-header">BCO Result</div>
    <div class="bco-result-verify">
      <div><span>Pipe OD</span><strong>${pipeOD}</strong></div>
      <div><span>Pipe ID</span><strong>${pipeID}</strong></div>
      <div><span>Cutter OD</span><strong>${cutterOD}</strong></div>
    </div>
    <div class="bco-result-main">${bco ? `BCO = ${bco} in` : 'BCO: —'}</div>
    <div class="bco-result-actions">
      <button type="button" class="secondary-btn bco-inline-copy" ${bco ? '' : 'disabled'}>Copy</button>
    </div>
  </div>`;
}

function renderBcoResult(payload = {}) {
  if (!bcoResultEl) return;
  bcoResultEl.innerHTML = buildBcoResultMarkup(payload);
}

function buildStateFromRecord(record = {}) {
  const state = { ...(record.state || {}) };
  const opRaw = String(record?.meta?.operationType || '').trim();
  const op = opRaw.toLowerCase();
  if (!state.jobClient) state.jobClient = record?.job?.client || '';
  if (!state.jobDescription) state.jobDescription = record?.job?.description || '';
  if (!state.jobNumber) state.jobNumber = record?.job?.jobNumber || '';
  if (!state.jobPressure) state.jobPressure = record?.job?.pressure || '';
  if (!state.jobTemperature) state.jobTemperature = record?.job?.temperature || '';
  if (!state.jobDate) state.jobDate = record?.job?.date || '';
  if (!state.jobProduct) state.jobProduct = record?.job?.product || '';
  if (!state.jobLocation) state.jobLocation = record?.job?.location || '';
  if (!state.jobTechnician) state.jobTechnician = record?.job?.technician || '';
  if (!state.jobNotes) state.jobNotes = record?.job?.notes || '';
  if (!state.bcoPipeMaterial) state.bcoPipeMaterial = record?.pipe?.material || '';
  if (!state.bcoPipeOD) state.bcoPipeOD = record?.pipe?.nominalSize || '';
  if (!state.bcoSchedule) state.bcoSchedule = record?.pipe?.schedule || '';
  if (!state.bcoPipeID) state.bcoPipeID = record?.pipe?.pipeId || '';
  if (!state.bcoCutterOD) state.bcoCutterOD = record?.machine?.cutterOd || '';
  const machine = String(record?.machine?.machine || '');
  if (!state.machineType && machine) state.machineType = machine;
  if (!state.operationType) {
    if (op.includes('completion')) state.operationType = 'Completion Plug';
    else if (op.includes('line stop')) state.operationType = 'Line Stop';
    else if (op.includes('htp')) state.operationType = 'HTP';
    else if (op.includes('hot tap')) state.operationType = 'Hot Tap';
    else state.operationType = 'Hot Tap';
  }
  if (!state.etaCutterSize && record?.machine?.cutterOd) state.etaCutterSize = record.machine.cutterOd;
  if (!state.etaBco && record?.calculations?.bco) state.etaBco = record.calculations.bco;
  if (!state.etaMachine && machine) {
    if (machine.includes('360')) state.etaMachine = '360';
    else if (machine.includes('660') || machine.includes('760')) state.etaMachine = '660';
    else if (machine.includes('1200')) state.etaMachine = '1200';
    else state.etaMachine = machine;
  }
  if (!state.pipeOD && record?.pipe?.trueOd) state.pipeOD = record.pipe.trueOd;
  if (!state.pipeID && record?.pipe?.pipeId) state.pipeID = record.pipe.pipeId;
  if (!state.wallThickness && record?.pipe?.wallThickness) state.wallThickness = record.pipe.wallThickness;
  if (!state.md && record?.measurements?.hotTap?.md) state.md = record.measurements.hotTap.md;
  if (!state.ld && record?.measurements?.hotTap?.ld) state.ld = record.measurements.hotTap.ld;
  if (!state.ldSign && record?.measurements?.hotTap?.ldSign) state.ldSign = record.measurements.hotTap.ldSign;
  if (!state.ptc && record?.measurements?.hotTap?.ptc) state.ptc = record.measurements.hotTap.ptc;
  if (!state.pod && record?.measurements?.hotTap?.pod) state.pod = record.measurements.hotTap.pod;
  if (!state.mt && record?.measurements?.hotTap?.mt) state.mt = record.measurements.hotTap.mt;
  if (!state.start && record?.measurements?.hotTap?.rodStart) state.start = record.measurements.hotTap.rodStart;
  if (!state.htpMd && record?.measurements?.htp?.md) state.htpMd = record.measurements.htp.md;
  if (!state.htpLd && record?.measurements?.htp?.ld) state.htpLd = record.measurements.htp.ld;
  if (!state.htpLdSign && record?.measurements?.htp?.ldSign) state.htpLdSign = record.measurements.htp.ldSign;
  if (!state.htpPtc && record?.measurements?.htp?.ptc) state.htpPtc = record.measurements.htp.ptc;
  if (!state.htpPipeSize && record?.measurements?.htp?.pipeSize) state.htpPipeSize = record.measurements.htp.pipeSize;
  if (!state.lsMd && record?.measurements?.lineStop?.md) state.lsMd = record.measurements.lineStop.md;
  if (!state.lsLd && record?.measurements?.lineStop?.ld) state.lsLd = record.measurements.lineStop.ld;
  if (!state.lsLdSign && record?.measurements?.lineStop?.ldSign) state.lsLdSign = record.measurements.lineStop.ldSign;
  if (!state.lsPod && record?.measurements?.lineStop?.pod) state.lsPod = record.measurements.lineStop.pod;
  if (!state.lsTravel && record?.measurements?.lineStop?.travel) state.lsTravel = record.measurements.lineStop.travel;
  if (!state.lsMachineTravel && record?.measurements?.lineStop?.machineTravel) state.lsMachineTravel = record.measurements.lineStop.machineTravel;
  if (!state.cpStart && record?.measurements?.completionPlug?.start) state.cpStart = record.measurements.completionPlug.start;
  if (!state.cpJbf && record?.measurements?.completionPlug?.jbf) state.cpJbf = record.measurements.completionPlug.jbf;
  if (!state.cpLd && record?.measurements?.completionPlug?.ld) state.cpLd = record.measurements.completionPlug.ld;
  if (!state.cpLdSign && record?.measurements?.completionPlug?.ldSign) state.cpLdSign = record.measurements.completionPlug.ldSign;
  if (!state.cpPt && record?.measurements?.completionPlug?.pt) state.cpPt = record.measurements.completionPlug.pt;

  if (!state.activeMode) {
    if (op.includes('completion')) state.activeMode = 'completionPlug';
    else if (op.includes('line stop')) state.activeMode = 'lineStop';
    else if (op.includes('htp')) state.activeMode = 'htp';
    else if (op.includes('hot tap')) state.activeMode = 'hotTap';
    else state.activeMode = 'bco';
  }
  return state;
}

function setLibraryLane(lane) {
  const next = lane === 'shared' ? 'shared' : 'local';
  const jobsScreen = document.getElementById('jobsScreen');
  libraryLaneBtnEls.forEach((btn) => { const active = btn.dataset.libraryLane === next; btn.classList.toggle('active', active); btn.setAttribute('aria-pressed', active ? 'true' : 'false'); });
  libraryLanePanelEls.forEach((panel) => {
    const isActive = panel.dataset.libraryLanePanel === next;
    panel.classList.toggle('active', isActive);
    panel.hidden = !isActive;
    panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    panel.style.display = isActive ? 'block' : 'none';
  });
  if (jobsScreen) jobsScreen.dataset.activeLane = next;
  try { localStorage.setItem('tapcalcLibraryLaneV1', next); } catch {}
  if (next === 'shared') {
    setTimeout(() => {
      try { renderJobsList(); } catch {}
    }, 120);
  }
}

libraryLaneBtnEls.forEach((btn) => btn.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();
  const lane = btn.dataset.libraryLane === 'shared' ? 'shared' : 'local';
  setLibraryLane(lane);
  if (lane === 'shared') {
    try { renderJobsList(); } catch {}
    try { loadCloudJobs(); } catch {}
    const panel = document.querySelector('[data-library-lane-panel="shared"]');
    if (panel) {
      panel.hidden = false;
      panel.classList.add('active');
      panel.style.display = 'block';
      panel.style.visibility = 'visible';
      panel.style.opacity = '1';
    }
  }
}));
document.addEventListener('click', (event) => {
  const laneBtn = event.target.closest('.library-lane-btn[data-library-lane]');
  if (!laneBtn) return;
  event.preventDefault();
  const lane = laneBtn.dataset.libraryLane === 'shared' ? 'shared' : 'local';
  setLibraryLane(lane);
  if (lane === 'shared') {
    try { renderJobsList(); } catch {}
    try { loadCloudJobs(); } catch {}
  }
});
try { setLibraryLane(localStorage.getItem('tapcalcLibraryLaneV1') || 'local'); } catch { setLibraryLane('local'); }

function openSharedLibraryLane() {
  setLibraryLane('shared');
  try { renderJobsList(); } catch {}
  try { loadCloudJobs(); } catch {}
}

function getJobsGroupingValue(record, mode = 'all') {
  if (mode === 'customer') return (record?.job?.client || 'No customer').trim() || 'No customer';
  if (mode === 'location') return (record?.job?.location || 'No location').trim() || 'No location';
  if (mode === 'date') return (record?.job?.date || record?.meta?.savedAtDisplay || 'No date').trim() || 'No date';
  return '';
}

function initAccordionSections() {
  const mobile = window.innerWidth <= 768;
  document.querySelectorAll('.mode-panel .section').forEach((section, index) => {
    if (section.classList.contains('job-info-section')) return;
    if (section.dataset.accordionReady === 'true') return;
    const heading = section.querySelector('h3');
    if (!heading) return;
    const body = document.createElement('div');
    body.className = 'accordion-body';
    let next = heading.nextSibling;
    while (next) {
      const current = next;
      next = next.nextSibling;
      body.appendChild(current);
    }
    section.appendChild(body);
    heading.classList.add('accordion-heading');
    heading.insertAdjacentHTML('beforeend', '<span class="accordion-caret">⌄</span>');
    heading.addEventListener('click', () => {
      section.classList.toggle('collapsed');
    });
    if (mobile && index > 0) section.classList.add('collapsed');
    section.dataset.accordionReady = 'true';
  });
}


function calcHotTap() {
  if (!data) {
    if (rbcoGeomEl) rbcoGeomEl.textContent = "—";
    return;
  }

  if (rbcoGeomEl) rbcoGeomEl.textContent = Number(data.bco || 0).toFixed(4);

  const md = getMeasurementValue(mdEl) || 0;
  const ldRaw = getMeasurementValue(ldEl) || 0;
  const sign = signEl?.value || "+";
  const ld = sign === "-" ? -ldRaw : ldRaw;
  const ptc = getMeasurementValue(ptcEl) || 0;
  const pod = getMeasurementValue(podEl) || geometry.pipeOD || 0;
  const start = getMeasurementValue(startEl) || 0;
  const mt = getMeasurementValue(mtEl) || 0;

  const li = md + ld;
  const mco = (pod / 2) + ptc;
  const ttd = li + ptc + (Number(data.bco) || 0);
  const pop = start + li;
  const cop = pop + ptc;
  const rbco = cop + (Number(data.bco) || 0);
  const rmco = pop + mco;

  liEl.textContent = li.toFixed(4);
  ttdEl.textContent = ttd.toFixed(4);
  mcoEl.textContent = mco.toFixed(4);
  popEl.textContent = pop.toFixed(4);
  copEl.textContent = cop.toFixed(4);
  rbcoEl.textContent = rbco.toFixed(4);
  rmcoEl.textContent = rmco.toFixed(4);

  const warnings = [];
  const wall = geometry.wall || 0;
  const ptcLimit = (pod / 2) - wall;

  if (ptcLimit > 0 && ptc > ptcLimit) {
    warnings.push(`⚠️ PTC too long: must be < (POD/2 − Wall) = ${ptcLimit.toFixed(4)}`);
  }

  if (mt && ttd > mt) {
    warnings.push("⚠️ TTD exceeds Machine Travel (MT)");
  }

  hotTapWarnEl.innerHTML = warnings.length ? warnings.join("<br>") : "";
  hotTapWarnEl.classList.toggle('active', warnings.length > 0);

  lastHotTap = { li, ttd, warnings };
  updateSummary();
}

[mdEl, ldEl, ptcEl, podEl, startEl, mtEl, signEl].forEach(el => {
  if (el) el.addEventListener("input", calcHotTap);
});
if (signEl) signEl.addEventListener("change", calcHotTap);

// ===== LINE STOP =====
const lsMdEl = document.getElementById('lsMd');
const lsLdEl = document.getElementById('lsLd');
const lsLdSignEl = document.getElementById('lsLdSign');
const lsPodEl = document.getElementById('lsPod');
const lsLiManualEl = document.getElementById('lsLiManual');
const lsLiManualToggleEl = document.getElementById('lsLiManualToggle');
const lsTravelEl = document.getElementById('lsTravel');
const lsMachineTravelEl = document.getElementById('lsMachineTravel');
const lsTravelMarginEl = document.getElementById('lsTravelMargin');
const lsWarningsEl = document.getElementById('lsWarnings');

// --- Sync Hot Tap MD to Line Stop MD unless manually edited ---
if (mdEl && lsMdEl) {
  const syncLineStopMd = () => {
    if (!lsMdEl.dataset.userEdited) {
      lsMdEl.value = mdEl.value;
    }
  };

  mdEl.addEventListener('input', () => {
    syncLineStopMd();
    calcLineStop();
  });

  lsMdEl.addEventListener('input', () => {
    lsMdEl.dataset.userEdited = 'true';
  });

  syncLineStopMd();
}

const summaryEls = {
  pipe: document.getElementById('summaryPipe'),
  cutter: document.getElementById('summaryCutter'),
  bco: document.getElementById('summaryBco'),
  hotTap: document.getElementById('summaryHotTap'),
  lineStopLi: document.getElementById('summaryLineStopLi'),
  completionLi: document.getElementById('summaryCompletionLi'),
  warnings: document.getElementById('summaryWarnings')
};

function calcLineStop() {
  const md = getMeasurementValue(lsMdEl) || 0;
  const ldRaw = getMeasurementValue(lsLdEl) || 0;
  const ld = (lsLdSignEl?.value || '+') === '-' ? -ldRaw : ldRaw;
  const pod = getMeasurementValue(lsPodEl) || geometry.pipeOD || 0;
  const wall = geometry.wall || 0;
  const manualEnabled = !!lsLiManualToggleEl?.checked;
  const liAuto = md + ld + pod - wall;
  const liManual = getMeasurementValue(lsLiManualEl);
  const liUsed = manualEnabled && isFinite(liManual) ? liManual : liAuto;
  const lineStopTravel = getMeasurementValue(lsTravelEl);
  const machineTravel = getMeasurementValue(lsMachineTravelEl);
  if (lsLiManualEl) {
    lsLiManualEl.disabled = !manualEnabled;
    if (!manualEnabled) {
      lsLiManualEl.value = Number.isFinite(liAuto) ? liAuto.toFixed(4) : '';
    } else if (!isFinite(liManual)) {
      lsLiManualEl.value = Number.isFinite(liAuto) ? liAuto.toFixed(4) : '';
    }
  }

  let travelMarginText = '—';
  if (isFinite(lineStopTravel) && isFinite(machineTravel)) {
    travelMarginText = (machineTravel - lineStopTravel).toFixed(4);
  }
  lsTravelMarginEl.textContent = travelMarginText;

  const warnings = [];

  if (!data) {
    warnings.push('⚠️ BCO data is not loaded. POD and wall thickness need the BCO Calculator first.');
  }

  if (isFinite(lineStopTravel) && isFinite(machineTravel) && lineStopTravel > machineTravel) {
    warnings.push(`⚠️ Line Stop Travel exceeds Machine Travel by ${(lineStopTravel - machineTravel).toFixed(4)}`);
  }

  if (manualEnabled && isFinite(liManual) && Math.abs(liManual - liAuto) > 0.0001) {
    warnings.push(`⚠️ Manual LI override is active. Auto LI would be ${liAuto.toFixed(4)}.`);
  }

  if (!manualEnabled && isFinite(liUsed) && liUsed < 0) {
    warnings.push('⚠️ LI is negative. Double-check MD / LD inputs and sign.');
  }

  lsWarningsEl.innerHTML = warnings.length ? warnings.join('<br>') : 'No line stop warnings.';
  lsWarningsEl.classList.toggle('active', warnings.length > 0);
  lsWarningsEl.classList.toggle('ok', warnings.length === 0);

  lastLineStop = { li: liUsed, ldRaw, warnings };
  updateSummary();
  calcCompletionPlug();
}

// ===== COMPLETION PLUG =====
const cpStartEl = document.getElementById('cpStart');
const cpJbfEl = document.getElementById('cpJbf');
const cpLdEl = document.getElementById('cpLd');
const cpPtEl = document.getElementById('cpPt');
const cpLiManualEl = document.getElementById('cpLiManual');
const cpLiManualToggleEl = document.getElementById('cpLiManualToggle');
const cpWarningsEl = document.getElementById('cpWarnings');
function calcCompletionPlug() {
  const start = getMeasurementValue(cpStartEl);
  const jbf = getMeasurementValue(cpJbfEl) || 0;
  const ld = getMeasurementValue(cpLdEl) || 0;
  const pt = getMeasurementValue(cpPtEl) || 0;
  const manualEnabled = !!cpLiManualToggleEl?.checked;
  const liAuto = (Number.isFinite(start) ? start : 0) + jbf + ld + pt;
  const liManual = getMeasurementValue(cpLiManualEl);
  const liUsed = manualEnabled && Number.isFinite(liManual) ? liManual : liAuto;

  if (cpLiManualEl) {
    cpLiManualEl.disabled = !manualEnabled;
    if (!manualEnabled) {
      cpLiManualEl.value = Number.isFinite(liAuto) ? liAuto.toFixed(4) : '';
    } else if (!Number.isFinite(liManual)) {
      cpLiManualEl.value = Number.isFinite(liAuto) ? liAuto.toFixed(4) : '';
    }
  }

  const warnings = [];
  if (!Number.isFinite(start)) warnings.push('⚠️ Enter Completion Plug Start from the On Rod section.');
  if (manualEnabled && Number.isFinite(liManual) && Math.abs(liManual - liAuto) > 0.0001) {
    warnings.push(`⚠️ Manual LI override is active. Auto LI would be ${liAuto.toFixed(4)}.`);
  }
  if (!manualEnabled && Number.isFinite(liUsed) && liUsed < 0) {
    warnings.push('⚠️ LI is negative. Double-check Start / JBF / LD / PT inputs.');
  }

  cpWarningsEl.innerHTML = warnings.length ? warnings.join('<br>') : 'No completion plug warnings.';
  cpWarningsEl.classList.toggle('active', warnings.length > 0);
  cpWarningsEl.classList.toggle('ok', warnings.length === 0);

  lastCompletionPlug = { li: liUsed, warnings };
  updateSummary();
}


function formatValue(value) {
  return Number.isFinite(value) ? value.toFixed(4) : '—';
}

function updateSummary() {
  if (summaryEls.pipe) {
    const odText = formatValue(geometry.pipeOD);
    const wallText = formatValue(geometry.wall);
    summaryEls.pipe.textContent = odText === '—' ? '—' : `OD ${odText} • Wall ${wallText}`;
  }

  if (summaryEls.cutter) {
    const cutter = parseFloat(data?.cutterOD);
    summaryEls.cutter.textContent = formatValue(cutter);
  }

  if (summaryEls.bco) {
    summaryEls.bco.textContent = formatValue(parseFloat(data?.bco));
  }

  if (summaryEls.hotTap) {
    const md = getMeasurementValue(mdEl);
    const li = lastHotTap.li;
    const ttd = lastHotTap.ttd;
    if (document.querySelector('.mode-btn.active')?.dataset.mode === 'htp' || Number.isFinite(lastHtp.tco)) {
      const htpPipe = htpPipeSizeEl?.value ? `${htpPipeSizeEl.value}"` : '—';
      summaryEls.hotTap.textContent = Number.isFinite(lastHtp.tco)
        ? `HTP ${htpPipe} • TCO ${formatValue(lastHtp.tco)} • ETA ${lastHtp.eta || '—'}`
        : '—';
    } else {
      summaryEls.hotTap.textContent = Number.isFinite(li) || Number.isFinite(ttd) || Number.isFinite(md)
        ? `MD ${formatValue(md)} • LI ${formatValue(li)} • TTD ${formatValue(ttd)}`
        : '—';
    }
  }

  if (summaryEls.lineStopLi) {
    summaryEls.lineStopLi.textContent = formatValue(lastLineStop.li);
  }

  if (summaryEls.completionLi) {
    summaryEls.completionLi.textContent = formatValue(lastCompletionPlug.li);
  }

  if (summaryEls.warnings) {
    const allWarnings = [...(lastHotTap.warnings || []), ...(lastLineStop.warnings || []), ...(lastCompletionPlug.warnings || [])];
    summaryEls.warnings.textContent = allWarnings.length ? allWarnings.join(' | ') : 'None';
  }
}

[lsMdEl, lsLdEl, lsLdSignEl, lsPodEl, lsLiManualEl, lsLiManualToggleEl, lsTravelEl, lsMachineTravelEl].forEach(el => {
  if (el) el.addEventListener('input', calcLineStop);
});

[cpStartEl, cpJbfEl, cpLdEl, cpPtEl, cpLiManualEl, cpLiManualToggleEl].forEach(el => {
  if (el) el.addEventListener('input', calcCompletionPlug);
});
if (lsLdSignEl) lsLdSignEl.addEventListener('change', calcLineStop);


function formatJobDateForSummary(value) {
  if (!value) return '';
  try {
    const parts = String(value).split('-');
    if (parts.length === 3) return `${parts[1]}/${parts[2]}/${parts[0]}`;
  } catch {}
  return String(value);
}

function buildJobInfoSummary() {
  const info = collectJobInfo();
  const parts = [];
  if ((info.jobClient || '').trim()) parts.push(info.jobClient.trim());
  if ((info.jobDescription || '').trim()) parts.push(info.jobDescription.trim());
  if ((info.jobNumber || '').trim()) parts.push(`Job # ${info.jobNumber.trim()}`);
  if ((info.jobDate || '').trim()) parts.push(formatJobDateForSummary(info.jobDate.trim()));
  if ((info.jobTechnician || '').trim()) parts.push(info.jobTechnician.trim());
  if ((info.jobLocation || '').trim()) parts.push(info.jobLocation.trim());
  return parts.length ? parts.join(' • ') : 'No job info yet.';
}

function updateJobInfoSummary() {
  if (!jobInfoSummaryEl) return;
  jobInfoSummaryEl.textContent = buildJobInfoSummary();
}

function setJobInfoCollapsed(collapsed) {
  if (!jobInfoSectionEl || !jobInfoToggleBtnEl) return;
  jobInfoSectionEl.classList.toggle('collapsed', !!collapsed);
  jobInfoToggleBtnEl.textContent = collapsed ? 'Expand' : 'Collapse';
  jobInfoToggleBtnEl.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  try {
    localStorage.setItem(JOB_INFO_COLLAPSED_KEY, collapsed ? 'true' : 'false');
  } catch {}
}

function initJobInfoSection() {
  updateJobInfoSummary();
  let collapsed = false;
  try {
    const saved = localStorage.getItem(JOB_INFO_COLLAPSED_KEY);
    if (saved === 'true') collapsed = true;
    else if (saved === 'false') collapsed = false;
    else collapsed = window.innerWidth <= 768;
  } catch {
    collapsed = window.innerWidth <= 768;
  }
  setJobInfoCollapsed(collapsed);
}

function setGeometryLocked(locked) {
  bcoGeometryFieldIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.disabled = !!locked;
  });
  if (geometryLockToggleEl) geometryLockToggleEl.checked = !!locked;
}

function collectJobInfo() {
  const info = {};
  jobInfoFieldIds.forEach(id => {
    const el = document.getElementById(id);
    info[id] = el ? (el.value || '') : '';
  });
  return info;
}

function getJobInfoLines() {
  const info = collectJobInfo();
  const rows = [
    ['Client', info.jobClient],
    ['Job Description', info.jobDescription],
    ['Job Number', info.jobNumber],
    ['Pressure', info.jobPressure],
    ['Temperature', info.jobTemperature],
    ['Date', info.jobDate],
    ['Product', info.jobProduct],
    ['Location', info.jobLocation],
    ['Technician', info.jobTechnician],
    ['Notes', info.jobNotes]
  ];
  return rows.filter(([,v]) => (v || '').trim() !== '');
}

function buildExportText() {
  const lines = ['TapCalc', ''];
  const infoLines = getJobInfoLines();
  if (infoLines.length) {
    infoLines.forEach(([label, value]) => lines.push(`${label}: ${value}`));
    lines.push('');
  }
  lines.push(`Pipe: ${summaryEls.pipe?.textContent || '—'}`);
  lines.push(`Cutter: ${summaryEls.cutter?.textContent || '—'}`);
  lines.push(`BCO: ${summaryEls.bco?.textContent || '—'}`);
  lines.push(`Hot Tap: ${summaryEls.hotTap?.textContent || '—'}`);
  lines.push(`Line Stop LI: ${summaryEls.lineStopLi?.textContent || '—'}`);
  lines.push(`Completion Plug LI: ${summaryEls.completionLi?.textContent || '—'}`);
  lines.push(`Warnings: ${summaryEls.warnings?.textContent || 'None'}`);
  return lines.join('\n');
}

function exportJobPdf() {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return;
  const text = buildExportText().split('\n').map(line => `<div>${line || '&nbsp;'}</div>`).join('');
  printWindow.document.write(`<!DOCTYPE html><html><head><title>TapCalc</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111;}h1{margin:0 0 16px;}div{margin:0 0 8px;white-space:pre-wrap;} .muted{color:#555;font-size:12px;margin-top:18px;}</style></head><body><h1>TapCalc</h1>${text}<div class="muted">Generated from the field calculator.</div><script>window.onload=()=>{window.print();};<\/script></body></html>`);
  printWindow.document.close();
}

function exportJobImage() {
  const text = buildExportText().split('\n');
  const canvas = document.createElement('canvas');
  const width = 1400;
  const lineHeight = 42;
  const height = Math.max(900, 140 + (text.length * lineHeight));
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#0b2e52';
  ctx.fillRect(0, 0, width, 110);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 40px Arial';
  ctx.fillText('TapCalc', 50, 68);
  ctx.fillStyle = '#111111';
  ctx.font = '28px Arial';
  let y = 160;
  text.forEach(line => {
    ctx.fillText(line || ' ', 50, y);
    y += lineHeight;
  });
  const link = document.createElement('a');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  link.href = canvas.toDataURL('image/png');
  link.download = `tapcalc-${stamp}.png`;
  link.click();
}

function getStateFields() {
  return [
    'jobClient','jobDescription','jobNumber','jobPressure','jobTemperature','jobDate','jobProduct','jobLocation','jobTechnician','jobNotes','machineType','operationType','geometryLockToggle',
    'bcoPipeMaterial','bcoPipeOD','bcoSchedule','bcoPipeID','bcoCutterOD',
    'md','ld','ldSign','ptc','pod','start','mt','valveBore','gtf','lugs',
    'htpPipeSize','htpMd','htpLd','htpLdSign','htpPtc','htpMachine',
    'lsMd','lsLd','lsLdSign','lsLiManualToggle','lsLiManual','lsTravel','lsMachineTravel',
    'cpStart','cpJbf','cpLd','cpPt','cpLiManualToggle','cpLiManual',
    'etaMachine','etaCutterSize','etaBco'
  ];
}

function collectJobState() {
  const state = {};
  getStateFields().forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === 'checkbox') state[id] = el.checked;
    else state[id] = el.value;
  });
  state.activeMode = document.querySelector('.submode-btn.active[data-mode]')?.dataset.mode || localStorage.getItem(ACTIVE_MODE_KEY) || 'hotTap';
  state.lineStopMdUserEdited = lsMdEl?.dataset.userEdited === 'true';
  return state;
}

function persistCurrentJob() {
  try {
    localStorage.setItem(JOB_STATE_KEY, JSON.stringify(collectJobState()));
  } catch {}
}

function applyJobState(state) {
  if (!state || typeof state !== 'object') return;
  getStateFields().forEach(id => {
    const el = document.getElementById(id);
    if (!el || !(id in state)) return;
    if (el.type === 'checkbox') el.checked = !!state[id];
    else el.value = state[id] ?? '';
  });
  if (lsMdEl) {
    if (state.lineStopMdUserEdited) lsMdEl.dataset.userEdited = 'true';
    else delete lsMdEl.dataset.userEdited;
  }
  if (state.activeMode) {
    setMode(state.activeMode);
  }
  getStateFields().forEach((id) => dispatchFieldUpdate(id));
  updateJobInfoSummary();
  if (typeof window.updateTapCalcShell === 'function') window.updateTapCalcShell();
}

function restoreCurrentJob() {
  try {
    const raw = localStorage.getItem(JOB_STATE_KEY);
    if (!raw) return;
    applyJobState(JSON.parse(raw));
    if (typeof window.updateTapCalcShell === 'function') window.updateTapCalcShell();
  } catch {}
}

function loadRecordIntoCalculator(record, options = {}) {
  const state = buildStateFromRecord(record);
  if (!state || !Object.keys(state).length) return;
  applyJobState(state);

  const directMap = {
    jobClient: record?.job?.client,
    jobDescription: record?.job?.description,
    jobNumber: record?.job?.jobNumber,
    jobPressure: record?.job?.pressure,
    jobTemperature: record?.job?.temperature,
    jobDate: record?.job?.date,
    jobProduct: record?.job?.product,
    jobLocation: record?.job?.location,
    jobTechnician: record?.job?.technician,
    jobNotes: record?.job?.notes,
    machineType: state.machineType || record?.machine?.machine,
    operationType: state.operationType,
    bcoPipeMaterial: state.bcoPipeMaterial,
    bcoPipeOD: state.bcoPipeOD,
    bcoSchedule: state.bcoSchedule,
    bcoPipeID: state.bcoPipeID,
    bcoCutterOD: state.bcoCutterOD,
    etaMachine: state.etaMachine,
    etaCutterSize: state.etaCutterSize,
    etaBco: state.etaBco
  };
  Object.entries(directMap).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el && value != null) el.value = value;
  });
  Object.keys(directMap).forEach((id) => dispatchFieldUpdate(id));

  try {
    const currentJobNameEl = document.getElementById('jobsCurrentJobName');
    if (currentJobNameEl) currentJobNameEl.textContent = state.jobDescription || state.jobNumber || state.jobClient || 'Loaded Job';
  } catch {}

  refreshBcoState();
  updateBcoDisplays();
  calculateIntegratedBco({ silent: true });
  calcHotTap();
  calcHtp();
  calcLineStop();
  calcCompletionPlug();
  initEtaCalculator();
  syncBcoToEta({ force: true });
  updateEtaEstimate();

  clearTimeout(window.__tapcalcLoadJobBcoTimer);
  window.__tapcalcLoadJobBcoTimer = setTimeout(() => {
    refreshBcoState();
    updateBcoDisplays();
    calculateIntegratedBco({ silent: true });
    calcHotTap();
    calcHtp();
    calcLineStop();
    calcCompletionPlug();
    syncBcoToEta({ force: true });
    updateEtaEstimate();
    updateJobInfoSummary();
    if (typeof window.updateTapCalcShell === 'function') window.updateTapCalcShell();
  }, 80);

  persistCurrentJob();
  updateJobInfoSummary();
  if (typeof window.updateTapCalcShell === 'function') window.updateTapCalcShell();
  if (jobsCloudStatusEl && options.message !== false) {
    jobsCloudStatusEl.textContent = `Loaded ${record?.meta?.title || state.jobDescription || state.jobNumber || 'saved job'} into TapCalc.`;
  }
  const targetMode = state?.activeMode || 'hotTap';
  if (targetMode) setMode(targetMode);
  try {
    const jobTab = document.querySelector('.screen-tab[data-screen="job"]');
    jobTab?.click();
  } catch {}
}


function getHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(JOB_HISTORY_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(items) {
  try {
    localStorage.setItem(JOB_HISTORY_KEY, JSON.stringify(items.slice(0, MAX_HISTORY_ITEMS)));
  } catch {}
}

function inferOperationType(state = collectJobState()) {
  const activeMode = state.activeMode || document.querySelector('.mode-btn.active')?.dataset.mode || 'bco';
  if (activeMode === 'lineStop') return 'Line Stop';
  if (activeMode === 'completionPlug') return 'Completion Plug';
  if (activeMode === 'htp') return 'HTP Hot Tap';
  if (activeMode === 'hotTap' || activeMode === 'eta') return 'Hot Tap';
  const hasLineStop = ['lsMd','lsLd','lsLiManual','lsTravel','lsMachineTravel'].some((key) => String(state[key] || '').trim() !== '');
  if (hasLineStop) return 'Line Stop';
  const hasCompletion = ['cpStart','cpJbf','cpLd','cpPt','cpLiManual'].some((key) => String(state[key] || '').trim() !== '');
  if (hasCompletion) return 'Completion Plug';
  const hasHtp = ['htpMd','htpLd','htpPtc'].some((key) => String(state[key] || '').trim() !== '');
  if (hasHtp) return 'HTP Hot Tap';
  const hasHotTap = ['md','ld','ptc','start','mt'].some((key) => String(state[key] || '').trim() !== '');
  if (hasHotTap) return 'Hot Tap';
  return 'BCO / Geometry';
}

function buildJobRecord(state = collectJobState()) {
  refreshBcoState();
  const materialLabel = bcoMaterialEl?.selectedOptions?.[0]?.textContent || state.bcoPipeMaterial || '—';
  const nominal = state.bcoPipeOD || '—';
  const machineLabelMap = { '360': '360 / 152', '660': '660 / 760', '1200': '1200-M120' };
  const operationType = inferOperationType(state);
  const savedAtIso = new Date().toISOString();
  const etaRpm = etaRpmDisplayEl?.textContent?.trim() || '—';
  const etaRange = etaRangeDisplayEl?.textContent?.trim() || '—';
  const etaFeedSpeed = etaFeedSpeedDisplayEl?.textContent?.trim() || '—';
  const wallText = Number.isFinite(geometry.wall) ? geometry.wall.toFixed(4) : '';
  const pipeOdText = Number.isFinite(geometry.pipeOD) ? geometry.pipeOD.toFixed(4) : '';
  const pipeIdText = Number.isFinite(geometry.pipeID) ? geometry.pipeID.toFixed(4) : '';
  const cutterText = String(state.bcoCutterOD || '').trim();
  const title = (state.jobDescription || state.jobNumber || state.jobClient || `${operationType} Job`).trim();

  return {
    meta: {
      title,
      operationType,
      savedAtIso,
      savedAtDisplay: new Date(savedAtIso).toLocaleString(),
      app: 'TapCalc',
      version: `v${BUILD_VERSION}`
    },
    job: {
      client: state.jobClient || '',
      description: state.jobDescription || '',
      jobNumber: state.jobNumber || '',
      pressure: state.jobPressure || '',
      temperature: state.jobTemperature || '',
      date: state.jobDate || '',
      product: state.jobProduct || '',
      location: state.jobLocation || '',
      technician: state.jobTechnician || '',
      notes: state.jobNotes || ''
    },
    pipe: {
      material: materialLabel,
      nominalSize: nominal,
      trueOd: pipeOdText,
      pipeId: pipeIdText,
      wallThickness: wallText,
      schedule: state.bcoSchedule || ''
    },
    machine: {
      machine: machineLabelMap[state.etaMachine] || state.etaMachine || '',
      cutterOd: cutterText,
      rpm: etaRpm,
      feedRate: ETA_FEED_RATE.toFixed(4),
      etaRange,
      feedSpeed: etaFeedSpeed,
      htpMachine: htpMachineEl?.selectedOptions?.[0]?.textContent || state.htpMachine || '',
      htpEtaRange: lastHtp.eta || '—'
    },
    calculations: {
      bco: formatValue(parseFloat(data?.bco)),
      hotTapLi: formatValue(lastHotTap.li),
      hotTapTtd: formatValue(lastHotTap.ttd),
      htpTco: formatValue(lastHtp.tco),
      lineStopLi: formatValue(lastLineStop.li),
      completionPlugLi: formatValue(lastCompletionPlug.li)
    },
    measurements: {
      hotTap: {
        md: state.md || '', ld: state.ld || '', ldSign: state.ldSign || '+', li: formatValue(lastHotTap.li),
        ptc: state.ptc || '', pod: state.pod || pipeOdText, ttd: formatValue(lastHotTap.ttd),
        mco: mcoEl?.textContent?.trim() || '', mt: state.mt || '', rodStart: state.start || '',
        pop: popEl?.textContent?.trim() || '', cop: copEl?.textContent?.trim() || '',
        rodBco: rbcoEl?.textContent?.trim() || '', rodMco: rmcoEl?.textContent?.trim() || ''
      },
      htp: {
        pipeSize: state.htpPipeSize || '', branchSize: htpBranchSizeEl?.textContent?.trim() || '',
        head: htpHeadEl?.textContent?.trim() || '', cutterSize: htpCutterSizeEl?.textContent?.trim() || '',
        bco: htpBcoEl?.textContent?.trim() || '', md: state.htpMd || '', ld: state.htpLd || '',
        ldSign: state.htpLdSign || '+', ptc: state.htpPtc || '', tco: formatValue(lastHtp.tco), eta: lastHtp.eta || '—'
      },
      lineStop: {
        md: state.lsMd || '', ld: state.lsLd || '', ldSign: state.lsLdSign || '+',
        pod: state.lsPod || pipeOdText, wallThickness: wallText, li: formatValue(lastLineStop.li),
        travel: state.lsTravel || '', machineTravel: state.lsMachineTravel || '',
        travelMargin: lsTravelMarginEl?.textContent?.trim() || ''
      },
      completionPlug: {
        start: state.cpStart || '', jbf: state.cpJbf || '', ld: state.cpLd || '',
        pt: state.cpPt || '', li: formatValue(lastCompletionPlug.li)
      }
    },
    warnings: {
      hotTap: lastHotTap.warnings || [],
      lineStop: lastLineStop.warnings || [],
      completionPlug: lastCompletionPlug.warnings || []
    },
    state
  };
}

function buildHistorySnapshot() {
  const state = collectJobState();
  const record = buildJobRecord(state);
  const material = bcoMaterialEl?.selectedOptions?.[0]?.textContent || bcoMaterialEl?.value || '—';
  const nominal = bcoPipeOdEl?.value || '—';
  return {
    id: `${Date.now()}`,
    savedAt: record.meta.savedAtDisplay,
    state,
    synced: false,
    cloudId: null,
    record,
    summary: {
      title: record.meta.title,
      operationType: record.meta.operationType,
      pipe: `${material} ${nominal}`.trim(),
      bco: record.calculations.bco,
      hotTapLi: record.calculations.hotTapLi,
      lineStopLi: record.calculations.lineStopLi,
      completionLi: record.calculations.completionPlugLi,
      wall: record.pipe.wallThickness || '—',
      location: record.job.location || '—',
      technician: record.job.technician || '—'
    }
  };
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms))
  ]);
}

async function ensureFirebaseReady(options = {}) {
  if (firebaseDb && !options.forceRetry) return { enabled: true, db: firebaseDb, modules: firebaseModuleCache };
  if (options.forceRetry) {
    firebaseDb = null;
    firebaseModuleCache = null;
    firebaseInitPromise = null;
  }
  if (firebaseInitPromise) return firebaseInitPromise;
  const config = window.TAPCALC_FIREBASE_CONFIG;
  if (!config || typeof config !== 'object' || !config.apiKey || !config.projectId || !config.appId) {
    if (firebaseStatusEl) firebaseStatusEl.textContent = 'Not connected';
    if (jobsCloudStatusEl) jobsCloudStatusEl.textContent = 'Firebase config is missing in this build.';
    return { enabled: false };
  }
  if (firebaseStatusEl) firebaseStatusEl.textContent = 'Connecting…';
  if (jobsCloudStatusEl) jobsCloudStatusEl.textContent = 'Connecting to shared job database...';
  firebaseInitPromise = (async () => {
    try {
      const [appModule, firestoreModule, authModule] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js'),
        import('https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js')
      ]);
      const app = appModule.getApps().length ? appModule.getApp() : appModule.initializeApp(config);
      const auth = authModule.getAuth(app);
      if (!auth.currentUser) {
        await authModule.signInAnonymously(auth);
      }
      firebaseDb = firestoreModule.getFirestore(app);
      firebaseModuleCache = firestoreModule;
      if (firebaseStatusEl) firebaseStatusEl.textContent = `Connected to ${config.projectId}`;
      if (jobsCloudStatusEl) jobsCloudStatusEl.textContent = `Connected to shared job database (${config.projectId}).`;
      return { enabled: true, db: firebaseDb, modules: firestoreModule };
    } catch (error) {
      console.error('Firebase init failed', error);
      firebaseDb = null;
      firebaseModuleCache = null;
      if (firebaseStatusEl) firebaseStatusEl.textContent = 'Connection failed';
      if (jobsCloudStatusEl) jobsCloudStatusEl.textContent = `Firebase could not connect. ${formatFirebaseError(error)}`;
      return { enabled: false, error };
    } finally {
      firebaseInitPromise = null;
      try { syncJobsWorkspace(); } catch {}
    }
  })();
  return firebaseInitPromise;
}

function getJobsCollectionName() {
  return window.TAPCALC_FIREBASE_COLLECTION || 'tapcalcJobs';
}

function formatFirebaseError(error) {
  if (!error) return 'Unknown Firebase error.';
  const parts = [];
  if (error.code) parts.push(String(error.code));
  if (error.message) parts.push(String(error.message));
  return parts.join(' — ') || String(error);
}


async function uploadHistoryItemToCloud(item) {
  const ready = await ensureFirebaseReady();
  if (!ready.enabled) return null;

  const { collection, addDoc, serverTimestamp } = ready.modules;

  const payload = {
    ...item.record,
    state: item.state || item.record?.state || collectJobState(),
    localId: item.id,
    syncedAt: serverTimestamp(),
    source: 'tapcalc-web'
  };

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Firestore upload timeout after 10000ms')), 10000);
  });

  const docRef = await Promise.race([
    addDoc(collection(ready.db, getJobsCollectionName()), payload),
    timeoutPromise
  ]);

  return docRef.id;
}

async function syncLocalJobsToCloud() {
  const items = getHistory();
  const unsynced = items.filter((item) => !item.cloudId);
  updateUnsyncedCount();

  if (syncJobsBtnEl) syncJobsBtnEl.disabled = true;
  if (testFirestoreBtnEl) testFirestoreBtnEl.disabled = true;
  if (refreshCloudJobsBtnEl) refreshCloudJobsBtnEl.disabled = true;

  try {
    if (!unsynced.length) {
      if (jobsCloudStatusEl) jobsCloudStatusEl.textContent = 'All local jobs are already synced.';
      return;
    }

    if (jobsCloudStatusEl) {
      jobsCloudStatusEl.textContent =
        `Syncing 0 of ${unsynced.length} job${unsynced.length === 1 ? '' : 's'}...`;
    }

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < unsynced.length; i += 1) {
      const item = unsynced[i];

      if (jobsCloudStatusEl) {
        jobsCloudStatusEl.textContent =
          `Syncing ${i + 1} of ${unsynced.length}: ${item?.record?.meta?.title || 'Saved Job'}...`;
      }

      try {
        const cloudId = await uploadHistoryItemToCloud(item);
        if (cloudId) {
          item.cloudId = cloudId;
          item.synced = true;
          successCount += 1;
        } else {
          failCount += 1;
        }
      } catch (error) {
        failCount += 1;
        console.error('TapCalc sync failed', error);
      }
    }

    saveHistory(items);
    renderHistory();
    updateUnsyncedCount();
    await loadCloudJobs();

    if (jobsCloudStatusEl) {
      if (failCount === 0) {
        jobsCloudStatusEl.textContent = `Sync complete. ${successCount} job${successCount === 1 ? '' : 's'} uploaded.`;
      } else {
        jobsCloudStatusEl.textContent = `Sync finished with issues. Uploaded ${successCount}, failed ${failCount}.`;
      }
    }
  } finally {
    if (syncJobsBtnEl) syncJobsBtnEl.disabled = false;
    if (testFirestoreBtnEl) testFirestoreBtnEl.disabled = false;
    if (refreshCloudJobsBtnEl) refreshCloudJobsBtnEl.disabled = false;
  }
}
function renderJobRecordDetails(record) {
  const warnings = [
    ...(record?.warnings?.hotTap || []),
    ...(record?.warnings?.lineStop || []),
    ...(record?.warnings?.completionPlug || [])
  ].filter(Boolean);
  return `
    <div class="job-detail-grid">
      <div><strong>Customer:</strong> ${record?.job?.client || '—'}</div>
      <div><strong>Location:</strong> ${record?.job?.location || '—'}</div>
      <div><strong>Technician:</strong> ${record?.job?.technician || '—'}</div>
      <div><strong>Job #:</strong> ${record?.job?.jobNumber || '—'}</div>
      <div><strong>Pipe:</strong> ${record?.pipe?.material || '—'} ${record?.pipe?.nominalSize || ''}</div>
      <div><strong>Wall:</strong> ${record?.pipe?.wallThickness || '—'}</div>
      <div><strong>Cutter:</strong> ${record?.machine?.cutterOd || '—'}</div>
      <div><strong>Machine:</strong> ${record?.machine?.machine || '—'}</div>
      <div><strong>BCO:</strong> ${record?.calculations?.bco || '—'}</div>
      <div><strong>ETA:</strong> ${record?.machine?.etaRange || '—'}</div>
      <div><strong>HTP TCO:</strong> ${record?.calculations?.htpTco || '—'}</div>
      <div><strong>Operation:</strong> ${record?.meta?.operationType || '—'}</div>
      <div><strong>Notes:</strong> ${record?.job?.notes || '—'}</div>
    </div>
    <div class="job-detail-grid">
      <div><strong>Hot Tap LI:</strong> ${record?.calculations?.hotTapLi || '—'}</div>
      <div><strong>Line Stop LI:</strong> ${record?.calculations?.lineStopLi || '—'}</div>
      <div><strong>Completion Plug LI:</strong> ${record?.calculations?.completionPlugLi || '—'}</div>
      <div><strong>Warnings:</strong> ${warnings.length ? warnings.join(' | ') : 'None'}</div>
    </div>`;
}

function getCombinedJobsForDisplay() {
  const localItems = getHistory()
    .filter((item) => item && item.record)
    .map((item) => ({ source: item.cloudId ? 'synced' : 'local', id: item.cloudId || item.id, record: item.record, savedAt: item.savedAt }));
  const map = new Map();
  [...cloudJobsCache, ...localItems].forEach((entry) => {
    const key = entry.id || `${entry.record?.meta?.savedAtIso}-${entry.record?.job?.jobNumber || ''}`;
    if (!map.has(key)) map.set(key, entry);
  });
  let jobs = Array.from(map.values());
  if (jobsSearchTerm) {
    const term = jobsSearchTerm.toLowerCase();
    jobs = jobs.filter(({ record }) => {
      const haystack = [
        record?.meta?.title, record?.meta?.operationType, record?.job?.client, record?.job?.location, record?.job?.technician,
        record?.job?.jobNumber, record?.job?.date, record?.job?.notes, record?.pipe?.nominalSize, record?.pipe?.material, record?.machine?.machine, record?.machine?.cutterOd, record?.meta?.savedAtDisplay
      ].join(' ').toLowerCase();
      return haystack.includes(term);
    });
  }
  if (jobsBrowseMode === 'customer') {
    jobs.sort((a,b) => getJobsGroupingValue(a.record, 'customer').localeCompare(getJobsGroupingValue(b.record, 'customer')) || String(b.record?.meta?.savedAtIso || '').localeCompare(String(a.record?.meta?.savedAtIso || '')));
  } else if (jobsBrowseMode === 'location') {
    jobs.sort((a,b) => getJobsGroupingValue(a.record, 'location').localeCompare(getJobsGroupingValue(b.record, 'location')) || String(b.record?.meta?.savedAtIso || '').localeCompare(String(a.record?.meta?.savedAtIso || '')));
  } else {
    jobs.sort((a,b) => String(b.record?.meta?.savedAtIso || '').localeCompare(String(a.record?.meta?.savedAtIso || '')));
  }
  return jobs;
}

function getSelectedCombinedJob(jobs = null) {
  const list = jobs || getCombinedJobsForDisplay();
  if (!list.length) return null;
  const selectedId = selectedJobId ? String(selectedJobId) : '';
  const found = list.find((job) => String(job.id) === selectedId) || list[0] || null;
  if (found) selectedJobEntry = found;
  return found;
}

function updateJobsListSelectionUI() {
  if (!jobsSelectEl) return;
  jobsSelectEl.querySelectorAll('.jobs-list-item[data-job-id]').forEach((item) => {
    const active = String(item.dataset.jobId || '') === String(selectedJobId || '');
    item.classList.toggle('active', active);
    item.setAttribute('aria-selected', active ? 'true' : 'false');
  });
}

function setSelectedJobEntry(entry) {
  selectedJobEntry = entry || null;
  selectedJobId = entry ? String(entry.id) : '';
  updateJobsListSelectionUI();
}

function selectLibraryJobByIndex(index) {
  const idx = Number(index);
  const selected = Number.isInteger(idx) ? renderedLibraryJobs[idx] || null : null;
  if (!selected) return false;
  setSelectedJobEntry(selected);
  renderSelectedJobDetails(renderedLibraryJobs);
  return true;
}

function loadSelectedLibraryJob() {
  const selected = selectedJobEntry || getSelectedCombinedJob(renderedLibraryJobs);
  if (!selected || !selected.record) {
    if (jobsCloudStatusEl) jobsCloudStatusEl.textContent = 'Select a job first.';
    return false;
  }
  loadRecordIntoCalculator(selected.record);
  try { document.querySelector('.screen-tab[data-screen="job"]')?.click(); } catch {}
  return true;
}

window.selectLibraryJobByIndex = selectLibraryJobByIndex;
window.loadSelectedLibraryJob = loadSelectedLibraryJob;

function dispatchFieldUpdate(id) {
  const el = document.getElementById(id);
  if (!el) return;
  try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch {}
  try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch {}
}

function renderSelectedJobDetails(jobs = null) {
  const list = jobs || getCombinedJobsForDisplay();
  if (!jobsListEl) return;
  if (!list.length) {
    jobsListEl.innerHTML = '<div class="jobs-library-empty">No jobs match this search yet.</div>';
    return;
  }
  const selectedJob = getSelectedCombinedJob(list);
  if (!selectedJob) {
    jobsListEl.innerHTML = '<div class="jobs-library-empty">No jobs match this search yet.</div>';
    return;
  }
  setSelectedJobEntry(selectedJob);
  const record = selectedJob.record;
  const title = record?.meta?.title || record?.job?.jobDescription || record?.job?.jobNumber || 'Saved Job';
  const sourceLabel = selectedJob.source === 'local' ? 'Local only' : selectedJob.source === 'synced' ? 'Synced' : 'Shared DB';
  const savedAtDisplay = record?.meta?.savedAtDisplay || record?.savedAt || '—';
  const warnings = [
    ...(record?.warnings?.hotTap || []),
    ...(record?.warnings?.lineStop || []),
    ...(record?.warnings?.completionPlug || [])
  ].filter(Boolean);
  jobsListEl.innerHTML = `
    <div class="job-detail-header">
      <div>
        <div class="job-detail-title">${title}</div>
        <div class="job-detail-subtitle">${savedAtDisplay} • ${record?.meta?.operationType || 'Job'} • ${sourceLabel}</div>
      </div>
      <div class="job-record-badges">
        <span class="job-source-badge ${selectedJob.source}">${sourceLabel}</span>
      </div>
    </div>
    <div class="job-detail-actions">
      <button type="button" id="jobsLoadSelectedBtn" class="secondary-btn">Load Job</button>
    </div>
    ${renderJobRecordDetails(record)}
    <div class="job-detail-grid">
      <div><strong>Saved:</strong> ${savedAtDisplay}</div>
      <div><strong>Date:</strong> ${record?.job?.date || '—'}</div>
      <div><strong>Job Description:</strong> ${record?.job?.description || '—'}</div>
      <div><strong>Warnings:</strong> ${warnings.length ? warnings.join(' | ') : 'None'}</div>
    </div>`;
  const loadBtn = document.getElementById('jobsLoadSelectedBtn');
  if (loadBtn) loadBtn.addEventListener('click', () => {
    if (!loadSelectedLibraryJob()) {
      const fallback = selectedJobEntry || getSelectedCombinedJob(list) || { record };
      loadRecordIntoCalculator(fallback.record || record);
      try { document.querySelector('.screen-tab[data-screen="job"]')?.click(); } catch {}
    }
  });
}

function renderJobsList() {
  if (!jobsListEl) return;
  const jobs = getCombinedJobsForDisplay();

  if (jobsResultsMetaEl) {
    const countText = `${jobs.length} job${jobs.length === 1 ? '' : 's'} found`;
    const modeLabel = jobsBrowseMode === 'all' ? 'Search' : jobsBrowseMode.charAt(0).toUpperCase() + jobsBrowseMode.slice(1);
    jobsResultsMetaEl.textContent = jobsSearchTerm ? `${countText} for “${jobsSearchTerm}” • ${modeLabel} view` : `${countText} • ${modeLabel} view`;
  }

  if (!jobs.length) {
    if (jobsSelectEl) jobsSelectEl.innerHTML = '';
    jobsListEl.innerHTML = '<div class="jobs-library-empty">No jobs match this search yet.</div>';
    return;
  }

  const previousSelectedId = selectedJobId ? String(selectedJobId) : '';
  const selectedStillExists = jobs.some((job) => String(job.id) === previousSelectedId);
  selectedJobId = selectedStillExists ? previousSelectedId : String(jobs[0].id);
  selectedJobEntry = jobs.find((job) => String(job.id) === String(selectedJobId)) || jobs[0] || null;

  if (jobsSelectEl) {
  const selectFromEvent = (event) => {
    const item = event.target.closest('.jobs-list-item[data-job-index]');
    if (!item || !jobsSelectEl.contains(item)) return false;
    event.preventDefault();
    event.stopPropagation();
    const ok = selectLibraryJobByIndex(item.dataset.jobIndex);
    return ok;
  };
  jobsSelectEl.addEventListener('pointerdown', selectFromEvent, true);
  jobsSelectEl.addEventListener('click', selectFromEvent, true);
  jobsSelectEl.addEventListener('keydown', (event) => {
    const jobs = renderedLibraryJobs.length ? renderedLibraryJobs : getCombinedJobsForDisplay();
    if (!jobs.length) return;
    const activeEl = event.target.closest('.jobs-list-item[data-job-index]');
    let index = activeEl ? Number(activeEl.dataset.jobIndex) : jobs.findIndex((job) => String(job.id) === String(selectedJobId));
    if (!Number.isInteger(index) || index < 0) index = 0;
    if (event.key === 'ArrowDown') index = Math.min(jobs.length - 1, index + 1);
    else if (event.key === 'ArrowUp') index = Math.max(0, index - 1);
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = jobs.length - 1;
    else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      loadSelectedLibraryJob();
      return;
    } else return;
    event.preventDefault();
    selectLibraryJobByIndex(index);
    jobsSelectEl.querySelector(`.jobs-list-item[data-job-index="${index}"]`)?.scrollIntoView({ block: 'nearest' });
  });
}
if (historyDrawerToggleEl) {
    historyDrawerToggleEl.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    historyDrawerToggleEl.classList.toggle('open', isOpen);
  }
  try {
    localStorage.setItem(HISTORY_DRAWER_OPEN_KEY, isOpen ? 'true' : 'false');
  } catch {}
}

function initHistoryDrawer() {
  let isOpen = false;
  try {
    isOpen = localStorage.getItem(HISTORY_DRAWER_OPEN_KEY) === 'true';
  } catch {}
  setHistoryDrawerOpen(isOpen);
}

function updateHistoryCount() {
  if (!historyCountBadgeEl) return;
  const count = getHistory().length;
  historyCountBadgeEl.textContent = String(count);
}

function renderHistory() {
  if (!historyListEl) return;
  const items = getHistory();
  updateHistoryCount();
  if (!items.length) {
    historyListEl.innerHTML = 'No saved jobs yet.';
    return;
  }
  historyListEl.innerHTML = items.map(item => `
    <div class="history-card">
      <div class="history-card-top">
        <div>
          <div class="history-title">${item.summary.title || item.summary.pipe || 'Saved Job'}</div>
          <div class="history-time">${item.savedAt}</div>
        </div>
        <div class="history-actions">
          <button type="button" class="history-btn" data-load-history="${item.id}">Load</button>
          <button type="button" class="history-btn danger-btn" data-delete-history="${item.id}">Delete</button>
        </div>
      </div>
      <div class="history-meta">
        <span>${item.summary.operationType || 'Job'}</span>
        <span>BCO ${item.summary.bco}</span>
        <span>Wall ${item.summary.wall || '—'}</span>
        <span>${item.cloudId ? 'Synced' : 'Local only'}</span>
      </div>
    </div>
  `).join('');
}

window.ensureFirebaseReady = ensureFirebaseReady;

async function saveCurrentJobToHistory() {
  const items = getHistory();
  const snapshot = buildHistorySnapshot();
  items.unshift(snapshot);
  saveHistory(items);
  initHistoryDrawer();
  renderHistory();
  updateHistoryCount();
  updateUnsyncedCount();
  renderJobsList();
  setHistoryDrawerOpen(true);
  if (window.innerWidth <= 768) setJobInfoCollapsed(true);
  try {
    const cloudId = await uploadHistoryItemToCloud(snapshot);
    if (cloudId) {
      const refreshed = getHistory();
      const target = refreshed.find((entry) => entry.id === snapshot.id);
      if (target) {
        target.cloudId = cloudId;
        target.synced = true;
        saveHistory(refreshed);
        renderHistory();
        updateUnsyncedCount();
        await loadCloudJobs();
        if (jobsCloudStatusEl) jobsCloudStatusEl.textContent = `Uploaded to ${getJobsCollectionName()} (${window.TAPCALC_FIREBASE_CONFIG?.projectId || 'unknown project'}). ${cloudJobsCache.length} shared job${cloudJobsCache.length === 1 ? '' : 's'} visible.`;
      }
    }
  } catch (error) {
    console.error('TapCalc auto-sync failed', error);
    if (jobsCloudStatusEl) jobsCloudStatusEl.textContent = `Saved locally only. Cloud upload was not verified. Retry from the Library tab. ${formatFirebaseError(error)}`;
  }
}

function resetCurrentJob() {
  localStorage.removeItem(JOB_STATE_KEY);
  sessionStorage.removeItem('bcoCalculated');
  localStorage.removeItem('bcoData');
  localStorage.removeItem('pipeMaterial');
  localStorage.removeItem('pipeOD');
  localStorage.removeItem('schedule');
  localStorage.removeItem('pipeID');
  window.location.reload();
}

function clearHistory() {
  localStorage.removeItem(JOB_HISTORY_KEY);
  renderHistory();
  updateHistoryCount();
  updateUnsyncedCount();
  renderJobsList();
}

document.addEventListener('click', (event) => {
  const loadId = event.target?.getAttribute('data-load-history');
  const deleteId = event.target?.getAttribute('data-delete-history');
  if (loadId) {
    const item = getHistory().find(entry => entry.id === loadId);
    if (item) {
      loadRecordIntoCalculator(item.record || { state: item.state });
    }
  }
  if (deleteId) {
    const items = getHistory().filter(entry => entry.id !== deleteId);
    saveHistory(items);
    renderHistory();
    updateUnsyncedCount();
    renderJobsList();
  }
});

jobInfoFieldIds.forEach((id) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', updateJobInfoSummary);
  el.addEventListener('change', updateJobInfoSummary);
});
if (jobInfoToggleBtnEl) jobInfoToggleBtnEl.addEventListener('click', () => {
  const collapsed = !jobInfoSectionEl?.classList.contains('collapsed');
  setJobInfoCollapsed(collapsed);
});

[...document.querySelectorAll('input, select, textarea')].forEach(el => {
  el.addEventListener('input', persistCurrentJob);
  el.addEventListener('change', persistCurrentJob);
});
window.saveCurrentJobToHistory = saveCurrentJobToHistory;
window.loadCloudJobs = loadCloudJobs;
if (saveHistoryBtnEl) saveHistoryBtnEl.addEventListener('click', saveCurrentJobToHistory);
if (resetJobBtnEl) resetJobBtnEl.addEventListener('click', resetCurrentJob);
if (clearHistoryBtnEl) clearHistoryBtnEl.addEventListener('click', clearHistory);
if (syncJobsBtnEl) syncJobsBtnEl.addEventListener('click', syncLocalJobsToCloud);

async function testFirestoreUpload() {
  const ready = await ensureFirebaseReady();
  if (!ready.enabled) {
    if (jobsCloudStatusEl) jobsCloudStatusEl.textContent = 'Firebase not ready for test upload.';
    alert('Firebase not ready.');
    return;
  }

  if (testFirestoreBtnEl) testFirestoreBtnEl.disabled = true;

  try {
    const { collection, addDoc, serverTimestamp } = ready.modules;

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Firestore test upload timeout after 10000ms')), 10000);
    });

    const ref = await Promise.race([
      addDoc(
        collection(ready.db, getJobsCollectionName()),
        {
          debug: 'tapcalc-test',
          created: serverTimestamp(),
          source: 'debug-button'
        }
      ),
      timeoutPromise
    ]);

    if (jobsCloudStatusEl) jobsCloudStatusEl.textContent = `Firestore test upload succeeded. Doc ID: ${ref.id}`;
    alert(`Firestore write success. Doc ID: ${ref.id}`);
    await loadCloudJobs();
  } catch (error) {
    console.error('Firestore test upload failed', error);
    if (jobsCloudStatusEl) jobsCloudStatusEl.textContent = `Firestore test upload FAILED. ${formatFirebaseError(error)}`;
    alert(`Firestore write FAILED: ${error?.message || error}`);
  } finally {
    if (testFirestoreBtnEl) testFirestoreBtnEl.disabled = false;
  }
}
if (refreshCloudJobsBtnEl) refreshCloudJobsBtnEl.addEventListener('click', loadCloudJobs);
if (testFirestoreBtnEl) testFirestoreBtnEl.addEventListener('click', testFirestoreUpload);
if (jobsSearchInputEl) jobsSearchInputEl.addEventListener('input', (event) => { jobsSearchTerm = event.target.value.trim(); renderJobsList(); });
jobsViewChipEls.forEach((button) => {
  button.addEventListener('click', () => {
    jobsBrowseMode = button.dataset.jobsView || 'all';
    jobsViewChipEls.forEach((btn) => btn.classList.toggle('active', btn === button));
    renderJobsList();
  });
});
if (bcoResultEl) {
  bcoResultEl.addEventListener('click', (event) => {
    if (event.target.closest('.bco-inline-copy')) copyBcoResult();
  });
}
if (jobsSelectEl) {
  jobsSelectEl.addEventListener('click', (event) => {
    const item = event.target.closest('.jobs-list-item[data-job-index]');
    if (!item) return;
    window.selectLibraryJobByIndex(item.dataset.jobIndex);
  });
  jobsSelectEl.addEventListener('pointerup', (event) => {
    const item = event.target.closest('.jobs-list-item[data-job-index]');
    if (!item) return;
    window.selectLibraryJobByIndex(item.dataset.jobIndex);
  });
  jobsSelectEl.addEventListener('keydown', (event) => {
    const jobs = renderedLibraryJobs.length ? renderedLibraryJobs : getCombinedJobsForDisplay();
    if (!jobs.length) return;
    let index = jobs.findIndex((job) => String(job.id) === String(selectedJobId));
    if (index < 0) index = 0;
    if (event.key === 'ArrowDown') index = Math.min(jobs.length - 1, index + 1);
    else if (event.key === 'ArrowUp') index = Math.max(0, index - 1);
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = jobs.length - 1;
    else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      window.loadSelectedLibraryJob();
      return;
    } else return;
    event.preventDefault();
    setSelectedJobEntry(jobs[index]);
    renderSelectedJobDetails(jobs);
    const activeItem = jobsSelectEl.querySelector('.jobs-list-item.active');
    activeItem?.scrollIntoView({ block: 'nearest' });
  });
}
if (historyDrawerToggleEl) historyDrawerToggleEl.addEventListener('click', () => {
  const isOpen = historyDrawerToggleEl.getAttribute('aria-expanded') === 'true';
  setHistoryDrawerOpen(!isOpen);
});
if (geometryLockToggleEl) geometryLockToggleEl.addEventListener('change', () => { setGeometryLocked(geometryLockToggleEl.checked); persistCurrentJob(); });
if (exportPdfBtnEl) exportPdfBtnEl.addEventListener('click', exportJobPdf);
if (exportImageBtnEl) exportImageBtnEl.addEventListener('click', exportJobImage);

window.addEventListener('load', async () => {
  enableMixedMeasurementInputs();
  hydrateBcoInputsFromSavedData();
  restoreCurrentJob();
  initJobInfoSection();
  try {
    const savedMode = localStorage.getItem(ACTIVE_MODE_KEY);
    if (savedMode) setMode(savedMode);
  } catch {}
  updateBcoDisplays();
  applyBcoToMeasurementCard();
  calcHotTap();
  calcHtp();
  calcLineStop();
  calcCompletionPlug();
  initEtaCalculator();
  persistCurrentJob();
  renderHistory();
  updateUnsyncedCount();
  renderJobsList();
  updateJobInfoSummary();
  initAccordionSections();
  ensureFirebaseReady().then(()=>loadCloudJobs()).catch(()=>{});
});

})();


// alpha4 app shell navigation
(function(){
  const tabs=[...document.querySelectorAll('.screen-tab')];
  const views={home:document.getElementById('homeScreen'),job:document.getElementById('jobScreen'),calc:document.getElementById('calcScreen'),card:document.getElementById('cardScreen'),jobs:document.getElementById('jobsScreen'),ref:document.getElementById('refScreen')};
  function setScreen(name){
    tabs.forEach(t=>t.classList.toggle('active', t.dataset.screen===name));
    Object.entries(views).forEach(([k,v])=>{ if(v) v.classList.toggle('active', k===name); });
    document.body.classList.toggle('show-library-screen', name === 'jobs');
    const jobsPanelEl = document.getElementById('jobsPanel');
    if (jobsPanelEl) jobsPanelEl.classList.add('active');
    if (name === 'jobs') {
      try { setLibraryLane(localStorage.getItem('tapcalcLibraryLaneV1') || 'local'); } catch {}
      try { renderJobsList(); } catch {}
      try { loadCloudJobs(); } catch {}
    }
    try{ localStorage.setItem('tapcalcV3Screen', name);}catch{}
  }

  function focusActiveCardPanel(mode){
    const panelMap={hotTap:'hotTapPanel',htp:'htpPanel',lineStop:'lineStopPanel',completionPlug:'completionPlugPanel'};
    const panel=document.getElementById(panelMap[mode]);
    if(!panel) return;
    setTimeout(()=>{
      try { panel.scrollIntoView({behavior:'smooth', block:'start'}); } catch {}
      const firstInput=panel.querySelector('input, select, textarea, button');
      try { firstInput?.focus({preventScroll:true}); } catch {}
    }, 80);
  }
  tabs.forEach(t=>t.addEventListener('click',()=>{ setScreen(t.dataset.screen); if(t.dataset.screen==='card'){ setTimeout(()=>focusActiveCardPanel(document.querySelector('.submode-btn.active[data-mode]')?.dataset.mode || 'hotTap'), 120); } }));
  document.querySelectorAll('[data-go-screen]').forEach(b=>b.addEventListener('click',()=>{
    const screen=b.dataset.goScreen;
    setScreen(screen);
    if (b.dataset.libraryLaneTarget === 'shared') setTimeout(()=>{ openSharedLibraryLane(); }, 80);
    if (b.dataset.goMode) setTimeout(()=>window.setMode(b.dataset.goMode), 80);
  }));
  const saved=(localStorage.getItem('tapcalcV3Screen')||'home');
  setScreen(views[saved]?saved:'home');
  if((views[saved]?saved:'home')==='card'){ setTimeout(()=>focusActiveCardPanel(document.querySelector('.submode-btn.active[data-mode]')?.dataset.mode || 'hotTap'), 120); }
  const subBtns=[...document.querySelectorAll('.submode-btn[data-mode]')];
  const oldSetMode = window.setMode || function(){};
  function syncSub(mode){subBtns.forEach(b=>b.classList.toggle('active', b.dataset.mode===mode));}
  window.setMode=function(mode){ oldSetMode(mode); syncSub(mode); };
  subBtns.forEach(b=>b.addEventListener('click',()=>window.setMode(b.dataset.mode)));
  const oldWindowSetMode = window.setMode;
  window.setMode = function(mode){ oldWindowSetMode(mode); syncSub(mode); document.querySelectorAll('.workflow-card[data-workflow-target]').forEach(card=>card.classList.toggle('active', card.dataset.workflowTarget===mode)); updateCurrentJobLabel(); if(['hotTap','htp','lineStop','completionPlug'].includes(mode)){ focusActiveCardPanel(mode); } };
  syncSub(localStorage.getItem('measurementCardActiveModeV1')||'bco');
  initAlpha8WorkspaceActions();
  initAlpha18CoreActions();

  function getText(id){ return document.getElementById(id)?.textContent?.trim() || '—'; }
  function hasValue(id){ const v=document.getElementById(id)?.value; return !!String(v ?? '').trim(); }

  function updateCurrentWorkspaceLive(){
    const client=document.getElementById('jobClient')?.value?.trim() || '';
    const location=document.getElementById('jobLocation')?.value?.trim() || '';
    const description=document.getElementById('jobDescription')?.value?.trim() || '';
    const machine=document.getElementById('machineType')?.value?.trim() || '—';
    const operation=document.getElementById('operationType')?.value?.trim() || 'Hot Tap';
    const jobNumber=document.getElementById('jobNumber')?.value?.trim() || '—';
    const technician=document.getElementById('jobTechnician')?.value?.trim() || '—';
    const pipe=getText('summaryPipe');
    const cutter=getText('summaryCutter');
    const bco=getText('summaryBco');
    const titleEl=document.getElementById('currentSnapshotTitle');
    if(titleEl) titleEl.textContent=client || description || 'No active job';
    const metaEl=document.getElementById('currentSnapshotMeta');
    if(metaEl) metaEl.textContent=[location, machine !== '—' ? machine : '', description].filter(Boolean).join(' • ') || 'Start with customer and location, then add machine and pipe setup.';
    const ids={currentMachineStat:machine,currentOperationStat:operation,currentPipeStat:pipe,currentBcoStat:bco,currentPipeSetup:pipe,currentCutterSetup:cutter,currentClientStat:client || '—',currentLocationStat:location || '—',currentJobNumberStat:jobNumber,currentTechStat:technician};
    Object.entries(ids).forEach(([id,val])=>{ const el=document.getElementById(id); if(el) el.textContent=val || '—'; });
  }

  function updateCardStageChecks(){
    const activeMode=document.querySelector('.submode-btn.active[data-mode]')?.dataset.mode || 'hotTap';
    const hasJobInfo = ['jobClient','jobLocation','jobDescription','jobNumber','jobTechnician'].some(id => hasValue(id));
    const hasMachine = hasValue('machineType');
    const geometryReady = getText('summaryBco') !== '—' && getText('summaryPipe') !== '—' && getText('summaryCutter') !== '—';
    const baseReady = hasJobInfo && hasMachine;

    const stageChecks = {
      hotTap: {
        geometry: baseReady && geometryReady,
        inputs: hasValue('md') && hasValue('ptc') && hasValue('mt'),
        output: getText('ttd') !== '—'
      },
      htp: {
        geometry: baseReady && geometryReady,
        inputs: hasValue('htpPipeSize') && hasValue('htpMd') && hasValue('htpPtc'),
        output: getText('htpTco') !== '—'
      },
      lineStop: {
        geometry: baseReady && geometryReady,
        inputs: hasValue('lsMd') && hasValue('lsTravel') && hasValue('lsMachineTravel'),
        output: getText('ls_li') !== '—'
      },
      completionPlug: {
        geometry: baseReady && geometryReady,
        inputs: hasValue('cpStart') && hasValue('cpJbf') && hasValue('cpPt'),
        output: getText('cp_li') !== '—'
      }
    };

    function describeStage(stage){
      const checks = stageChecks[stage];
      const started = checks.inputs || checks.output;
      const ready = checks.geometry && checks.inputs && checks.output;
      return { ...checks, started, ready };
    }

    const current = describeStage(activeMode);
    const missingSetup = [];
    if (!hasJobInfo) missingSetup.push('job');
    if (!hasMachine) missingSetup.push('machine');
    if (getText('summaryPipe') === '—') missingSetup.push('pipe');
    if (getText('summaryCutter') === '—') missingSetup.push('cutter');
    if (getText('summaryBco') === '—') missingSetup.push('BCO');

    const geometryLabel = current.geometry
      ? 'Ready'
      : (missingSetup.length ? `Need ${missingSetup.join(', ')}` : 'Waiting');

    const labelMap = {
      cardCheckGeometry: geometryLabel,
      cardCheckInputs: current.inputs ? 'Ready' : (current.started ? 'In Progress' : 'Waiting on stage fields'),
      cardCheckOutput: current.output ? 'Ready' : 'Waiting on output',
      cardCheckReady: current.ready ? 'Ready' : (current.started || current.geometry ? 'In Progress' : 'Not Ready')
    };
    Object.entries(labelMap).forEach(([id,val])=>{ const el=document.getElementById(id); if(el) { el.textContent=val; el.dataset.state=(val === 'Ready' ? 'ready' : val.startsWith('Need') ? 'needs-setup' : val.toLowerCase().replace(/\s+/g,'-')); } });

    const stageReadyMap = {
      workflowStatusHotTap: describeStage('hotTap'),
      workflowStatusHtp: describeStage('htp'),
      workflowStatusLineStop: describeStage('lineStop'),
      workflowStatusCompletionPlug: describeStage('completionPlug')
    };
    Object.entries(stageReadyMap).forEach(([id,state])=>{
      const el=document.getElementById(id);
      if(!el) return;
      const val = state.ready ? 'Ready' : (state.started || state.geometry ? 'In Progress' : 'Not Ready');
      el.textContent = val;
      el.dataset.state = val.toLowerCase().replace(/\s+/g,'-');
    });
  }

  function updateCurrentJobLabel(){
    const client=document.getElementById('jobClient')?.value?.trim() || '';
    const location=document.getElementById('jobLocation')?.value?.trim() || '';
    const description=document.getElementById('jobDescription')?.value?.trim() || '';
    const machine=document.getElementById('machineType')?.value?.trim() || '';
    const operation=document.getElementById('operationType')?.value?.trim() || 'Hot Tap';
    const technician=document.getElementById('jobTechnician')?.value?.trim() || '';
    const jobNumber=document.getElementById('jobNumber')?.value?.trim() || '';
    const date=document.getElementById('jobDate')?.value?.trim() || '';
    const pipeLabel=document.getElementById('summaryPipe')?.textContent?.trim() || '—';
    const bcoLabel=document.getElementById('summaryBco')?.textContent?.trim() || '—';
    const parts=[client, location].filter(Boolean);
    const topLabel=document.getElementById('topCurrentJobLabel');
    if(topLabel) topLabel.textContent=parts.length?parts.join(' • '):(description || 'No current job');
    const homeTitle=document.getElementById('homeCurrentJobTitle');
    if(homeTitle) homeTitle.textContent=client || description || 'No active job yet';
    const homeSubtitle=document.getElementById('homeCurrentJobSubtitle');
    if(homeSubtitle) homeSubtitle.textContent=[location, jobNumber ? 'Job ' + jobNumber : '', technician ? 'Tech ' + technician : ''].filter(Boolean).join(' • ') || (description || 'Set up a customer and location to get rolling.');
    const jobOverviewName=document.getElementById('jobOverviewName');
    if(jobOverviewName) jobOverviewName.textContent=client || description || 'No active job';
    const jobOverviewMeta=document.getElementById('jobOverviewMeta');
    if(jobOverviewMeta) jobOverviewMeta.textContent=location ? `${location}${description ? ' • ' + description : ''}` : 'Add customer and location details to start.';
    const homePipe=document.getElementById('homePipeStat');
    if(homePipe) homePipe.textContent=pipeLabel || '—';
    const homeMachine=document.getElementById('homeMachineStat');
    if(homeMachine) homeMachine.textContent=machine || '—';
    const homeBco=document.getElementById('homeBcoStat');
    if(homeBco) homeBco.textContent=bcoLabel || '—';
    const homeStatus=document.getElementById('homeStatusStat');
    if(homeStatus) homeStatus.textContent=client || location ? 'In Progress' : 'Draft';
    const calcBco=document.getElementById('calcCurrentBco');
    if(calcBco) calcBco.textContent=bcoLabel || '—';
    const calcMachine=document.getElementById('calcCurrentMachine');
    if(calcMachine) calcMachine.textContent=machine || '—';
    const cardJob=document.getElementById('cardCurrentJob');
    if(cardJob) cardJob.textContent=client || description || 'No active job';
    const cardPipe=document.getElementById('cardCurrentPipe');
    if(cardPipe) cardPipe.textContent=pipeLabel || '—';
    const cardMeta=document.getElementById('cardCurrentMeta');
    if(cardMeta) {
      const missing=[];
      if(!(client || description)) missing.push('job');
      if(!machine) missing.push('machine');
      if(pipeLabel === '—') missing.push('pipe');
      if(bcoLabel === '—') missing.push('BCO');
      const context=[location, date, technician].filter(Boolean).join(' • ');
      cardMeta.textContent = missing.length ? `Missing ${missing.join(', ')}. Fill out Current and Calc → BCO to unlock the card workflow.` : (context || 'Card workflow is ready for stage inputs.');
    }
    const activeMode=document.querySelector('.submode-btn.active[data-mode]')?.dataset.mode || 'hotTap';
    const activeLabel=document.querySelector('.submode-btn.active[data-mode]')?.textContent?.trim() || 'Hot Tap';
    const stage=document.getElementById('cardStageStat');
    if(stage) stage.textContent=operation === 'Hot Tap' ? activeLabel : operation;
    const focusStage=document.getElementById('cardFocusStage');
    if(focusStage) focusStage.textContent=activeLabel;
    const focusMachine=document.getElementById('cardFocusMachine');
    if(focusMachine) focusMachine.textContent=machine || '—';
    const focusBco=document.getElementById('cardFocusBco');
    if(focusBco) focusBco.textContent=bcoLabel || '—';
    const focusOutput=document.getElementById('cardFocusOutput');
    const hotTapTtd=document.getElementById('ttd')?.textContent?.trim() || '—';
    const htpTco=document.getElementById('htpTco')?.textContent?.trim() || '—';
    const lsLi=document.getElementById('ls_li')?.textContent?.trim() || '—';
    const cpLi=document.getElementById('cp_li')?.textContent?.trim() || '—';
    if(focusOutput){
      const map={hotTap: hotTapTtd !== '' ? hotTapTtd : '—', htp: htpTco !== '' ? htpTco : '—', lineStop: lsLi !== '' ? lsLi : '—', completionPlug: cpLi !== '' ? cpLi : '—'};
      focusOutput.textContent = map[activeMode] || '—';
    }
    const focusTitle=document.getElementById('cardFocusTitle');
    const focusDesc=document.getElementById('cardFocusDesc');
    if(focusTitle || focusDesc){
      const modeCopy={
        hotTap:['Hot Tap workflow','Set MD, LD, and PTC first, then verify LI, BCO, and on-rod values before moving forward.'],
        htp:['HTP workflow','Use pipe size to drive branch, head, cutter, and ETA automatically before confirming the cut math.'],
        lineStop:['Line Stop workflow','Use the stop-stage fields to confirm lower-in, turns, and valve positioning before setting the stop.'],
        completionPlug:['Completion Plug workflow','Finish the operation by confirming plug dimensions, lower-in, and final checks.']
      };
      const copy=modeCopy[activeMode] || modeCopy.hotTap;
      if(focusTitle) focusTitle.textContent=copy[0];
      if(focusDesc) focusDesc.textContent=copy[1];
    }
    updateCurrentWorkspaceLive();
    updateCardStageChecks();
    syncJobsWorkspace();
  }

  function syncJobsWorkspace() {
    const client=document.getElementById('jobClient')?.value?.trim() || '';
    const location=document.getElementById('jobLocation')?.value?.trim() || '';
    const description=document.getElementById('jobDescription')?.value?.trim() || '';
    const title = client || description || 'No active job yet';
    const meta = location ? `${location}${description ? ' • ' + description : ''}` : 'Start a job in the Current screen, then save locally or sync to shared.';
    const currentTitle=document.getElementById('jobsCurrentTitle');
    if(currentTitle) currentTitle.textContent=title;
    const currentMeta=document.getElementById('jobsCurrentMeta');
    if(currentMeta) currentMeta.textContent=meta;
    const currentName=document.getElementById('jobsCurrentJobName');
    if(currentName) currentName.textContent=title;
    const unsynced=document.getElementById('unsyncedJobsCount')?.textContent?.trim() || '0';
    const unsyncedStat=document.getElementById('jobsUnsyncedStat');
    if(unsyncedStat) unsyncedStat.textContent=unsynced;
    try {
      const history = JSON.parse(localStorage.getItem('measurementCardHistoryV1') || '[]');
      const localSaved=document.getElementById('jobsLocalSavedCount');
      if(localSaved) localSaved.textContent=String(history.length || 0);
    } catch {}
    const firebase=document.getElementById('firebaseStatus')?.textContent?.trim() || 'Not connected';
    const firebaseMirror=document.getElementById('firebaseStatusMirror');
    if(firebaseMirror) firebaseMirror.textContent=firebase;
    const cloud=document.getElementById('jobsCloudStatus')?.textContent?.trim() || 'Connecting to shared job database...';
    const cloudMirror=document.getElementById('jobsCloudStatusMirror');
    if(cloudMirror) cloudMirror.textContent=cloud;
  }
  function initAlpha8WorkspaceActions(){
    document.getElementById('saveHistoryBtnClone')?.addEventListener('click', ()=>document.getElementById('saveHistoryBtn')?.click());
    document.getElementById('saveHistoryBtnJobs')?.addEventListener('click', ()=>document.getElementById('saveHistoryBtn')?.click());
    document.getElementById('syncJobsBtnClone')?.addEventListener('click', ()=>document.getElementById('syncJobsBtn')?.click());
    const jobsHistoryDrawer=document.getElementById('historyDrawerContent'); if (jobsHistoryDrawer) jobsHistoryDrawer.hidden=false;
    document.querySelectorAll('.workflow-card[data-workflow-target]').forEach(card=>card.addEventListener('click', ()=>window.setMode(card.dataset.workflowTarget)));
  }

  function initAlpha18CoreActions(){
    document.getElementById('currentSaveLocalBtn')?.addEventListener('click', async ()=>{ await window.saveCurrentJobToHistory(); });
    document.getElementById('currentSyncSharedBtn')?.addEventListener('click', async ()=>{ await window.saveCurrentJobToHistory(); document.getElementById('syncJobsBtn')?.click(); });
    document.getElementById('currentResetBtn')?.addEventListener('click', ()=>document.getElementById('resetJobBtn')?.click());
    document.getElementById('firebaseReconnectBtn')?.addEventListener('click', async ()=>{ await window.ensureFirebaseReady({ forceRetry:true }); await window.loadCloudJobs(); });
    document.getElementById('cardJumpToInputsBtn')?.addEventListener('click', ()=>focusActiveCardPanel(document.querySelector('.submode-btn.active[data-mode]')?.dataset.mode || 'hotTap'));
  }
  function syncOperationSelection(){
    const operation=(document.getElementById('operationType')?.value || 'Hot Tap').trim();
    const map={'Hot Tap':'hotTap','HTP':'htp','Line Stop':'lineStop','Completion Plug':'completionPlug'};
    const target=map[operation] || 'hotTap';
    const active=document.querySelector('.submode-btn.active[data-mode]')?.dataset.mode;
    if(active !== target) window.setMode(target);
  }
  document.getElementById('operationType')?.addEventListener('change', syncOperationSelection);
  ['jobClient','jobLocation','jobDescription','machineType','operationType','jobDate','jobNumber','jobTechnician','jobPressure','jobTemperature','jobProduct','jobNotes','bcoPipeMaterial','bcoPipeOD','bcoSchedule','bcoPipeID','bcoCutterOD','md','ptc','mt','htpPipeSize','htpMd','htpPtc','lsMd','lsTravel','lsMachineTravel','cpStart','cpJbf','cpPt'].forEach(id=>document.getElementById(id)?.addEventListener('input',updateCurrentJobLabel));
  syncOperationSelection();
  updateCurrentJobLabel();
  window.addEventListener('load', async () => { syncOperationSelection(); updateCurrentJobLabel(); });
  document.querySelectorAll('select').forEach(el=>el.addEventListener('change', updateCurrentJobLabel));
  window.addEventListener('load', syncJobsWorkspace);
  const mirrorTargets=['firebaseStatus','jobsCloudStatus','unsyncedJobsCount']; mirrorTargets.forEach(id=>new MutationObserver(syncJobsWorkspace).observe(document.getElementById(id) || document.body,{childList:true,subtree:id==='jobsCloudStatus',characterData:true}));
})();
