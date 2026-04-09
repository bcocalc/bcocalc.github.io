const BUILD_VERSION = '3.0.0-alpha126';

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
  eta: document.getElementById('etaPanel')
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
const referenceShortcutEls = Array.from(document.querySelectorAll('[data-reference-target]'));

function getSafeReferenceView(view) {
  const requested = String(view || referenceViewSelectEl?.value || '').trim();
  const validViews = new Set(referenceViewEls.map((panel) => panel.dataset.referenceView).filter(Boolean));
  if (requested && validViews.has(requested)) return requested;
  if (validViews.has('converter')) return 'converter';
  return referenceViewEls[0]?.dataset.referenceView || 'converter';
}

function syncReferenceShortcutState(view) {
  referenceShortcutEls.forEach((el) => el.classList.toggle('active', el.dataset.referenceTarget === view));
}

function setReferenceView(view) {
  const nextView = getSafeReferenceView(view);
  let activated = false;
  referenceViewEls.forEach((panel) => {
    const isActive = panel.dataset.referenceView === nextView;
    panel.classList.toggle('active', isActive);
    if (isActive) activated = true;
  });
  if (!activated && referenceViewEls[0]) {
    referenceViewEls[0].classList.add('active');
  }
  if (referenceViewSelectEl && referenceViewSelectEl.value !== nextView) referenceViewSelectEl.value = nextView;
  syncReferenceShortcutState(nextView);
  try { localStorage.setItem('tapcalcReferenceViewV1', nextView); } catch {}
  try {
    document.querySelector(`.reference-view[data-reference-view="${nextView}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch {}
}

referenceShortcutEls.forEach((el) => {
  el.addEventListener('click', () => {
    const view = el.dataset.referenceTarget || 'converter';
    setReferenceView(view);
  });
});

if (referenceViewSelectEl) {
  referenceViewSelectEl.addEventListener('change', () => setReferenceView(referenceViewSelectEl.value));
  try {
    setReferenceView(localStorage.getItem('tapcalcReferenceViewV1') || referenceViewSelectEl.value || 'converter');
  } catch {
    setReferenceView(referenceViewSelectEl.value || 'converter');
  }
} else {
  syncReferenceShortcutState('converter');
}

const glossarySearchInputEl = document.getElementById('glossarySearchInput');
const referenceBackToTopBtnEl = document.getElementById('referenceBackToTopBtn');
const glossaryTableBodyEl = document.getElementById('glossaryTableBody');
const glossaryCountChipEl = document.getElementById('glossaryCountChip');
const glossaryVisibleChipEl = document.getElementById('glossaryVisibleChip');
const plant150SizeSelectEl = document.getElementById('plant150SizeSelect');
const plant600SizeSelectEl = document.getElementById('plant600SizeSelect');
const plant150SearchInputEl = document.getElementById('plant150SearchInput');
const plant600SearchInputEl = document.getElementById('plant600SearchInput');
const garlock600SizeSelectEl = document.getElementById('garlock600SizeSelect');
const garlock600SearchInputEl = document.getElementById('garlock600SearchInput');
const glossaryRowsData = [
  ['MD', 'Measured Distance'],
  ['LD', 'Lost Distance'],
  ['LI', 'Lower In'],
  ['PTC', 'Pilot To Cutter'],
  ['BCO', 'Book Cut Out'],
  ['CCO', 'Coupon Cut Out'],
  ['MCO', 'Maximum Cut Out'],
  ['POP', 'Pilot On Pipe'],
  ['COP', 'Cutter On Pipe'],
  ['TTD', 'Total Travel Distance'],
  ['TCO', 'Total Cutout'],
  ['MT', 'Machine Travel'],
  ['POD', 'Pipe Outside Diameter'],
  ['OD', 'Outside Diameter'],
  ['ID', 'Inside Diameter'],
  ['WT / Wall', 'Wall Thickness'],
  ['VB', 'Valve Bore'],
  ['GTF', 'Gate To Flange'],
  ['Valve T', 'Valve Turns'],
  ['Seg T', 'Segment Turns'],
  ['-1 Wall', 'Minus One Wall Thickness'],
  ['JBF', 'Jack Bolt to Flange'],
  ['PT', 'Plug Thickness'],
  ['RPM', 'Revolutions Per Minute'],
  ['ETA', 'Estimated cutting time based on travel, feed, and RPM'],
  ['Feed Rate', 'Advance per revolution, shown in inches per revolution'],
  ['Hot Tap', 'Operation that cuts into the line with a pilot and cutter'],
  ['Line Stop', 'Operation that inserts a stopping head or inflatable stop into the line'],
  ['Completion Plug', 'Plug used to seal the branch after the tapping / stopping work is complete'],
  ['FHL', 'Folding Head Line Stop'],
  ['Coupon', 'The cutout removed by the cutter during a hot tap'],
  ['Plant Series', 'Reference chart for jack-bolt wrench size, packing nut wrench size, and jack-bolt count']
];

function renderGlossaryRows(rows) {
  if (!glossaryTableBodyEl) return;
  glossaryTableBodyEl.innerHTML = rows.map(([abbr, meaning]) => `<tr><td>${abbr}</td><td>${meaning}</td></tr>`).join('');
  if (glossaryCountChipEl) glossaryCountChipEl.textContent = String(glossaryRowsData.length);
  if (glossaryVisibleChipEl) glossaryVisibleChipEl.textContent = String(rows.length);
}

function filterGlossaryRows(query) {
  const needle = String(query || '').trim().toLowerCase();
  const filtered = glossaryRowsData.filter(([abbr, meaning]) => `${abbr} ${meaning}`.toLowerCase().includes(needle));
  renderGlossaryRows(filtered);
}

if (glossarySearchInputEl) {
  glossarySearchInputEl.addEventListener('input', () => filterGlossaryRows(glossarySearchInputEl.value));
}
renderGlossaryRows(glossaryRowsData);

if (referenceBackToTopBtnEl) {
  referenceBackToTopBtnEl.addEventListener('click', () => {
    document.querySelector('#refScreen .screen-intro-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}


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

const garlock600Data = [
  { size:'1/2', area:'0.94', bolts:'4', boltSize:'0.50', torque60:'60', maxStress:'32118', minTorque:'11', maxRecStress:'20000', preferredTorque:'37' },
  { size:'3/4', area:'1.36', bolts:'4', boltSize:'0.63', torque60:'120', maxStress:'35629', minTorque:'20', maxRecStress:'20000', preferredTorque:'67' },
  { size:'1', area:'1.79', bolts:'4', boltSize:'0.63', torque60:'120', maxStress:'27027', minTorque:'27', maxRecStress:'20000', preferredTorque:'89' },
  { size:'1-1/4', area:'2.74', bolts:'4', boltSize:'0.63', torque60:'120', maxStress:'17664', minTorque:'41', maxRecStress:'17664', preferredTorque:'120' },
  { size:'1-1/2', area:'3.65', bolts:'4', boltSize:'0.75', torque60:'200', maxStress:'19862', minTorque:'60', maxRecStress:'19862', preferredTorque:'200' },
  { size:'2', area:'5.84', bolts:'8', boltSize:'0.63', torque60:'120', maxStress:'16593', minTorque:'43', maxRecStress:'16593', preferredTorque:'120' },
  { size:'2-1/2', area:'6.82', bolts:'8', boltSize:'0.75', torque60:'200', maxStress:'21264', minTorque:'56', maxRecStress:'20000', preferredTorque:'188' },
  { size:'3', area:'10.01', bolts:'8', boltSize:'0.75', torque60:'200', maxStress:'14476', minTorque:'83', maxRecStress:'14476', preferredTorque:'200' },
  { size:'4', area:'14.19', bolts:'8', boltSize:'0.88', torque60:'320', maxStress:'14174', minTorque:'135', maxRecStress:'14174', preferredTorque:'320' },
  { size:'5', area:'17.69', bolts:'8', boltSize:'1.00', torque60:'490', maxStress:'14952', minTorque:'197', maxRecStress:'14952', preferredTorque:'490' },
  { size:'6', area:'22.33', bolts:'12', boltSize:'1.00', torque60:'490', maxStress:'17770', minTorque:'165', maxRecStress:'17770', preferredTorque:'490' },
  { size:'8', area:'30.22', bolts:'12', boltSize:'1.13', torque60:'710', maxStress:'17344', minTorque:'246', maxRecStress:'17344', preferredTorque:'710' },
  { size:'10', area:'36.91', bolts:'16', boltSize:'1.25', torque60:'1000', maxStress:'24160', minTorque:'248', maxRecStress:'20000', preferredTorque:'828' },
  { size:'12', area:'49.04', bolts:'20', boltSize:'1.25', torque60:'1000', maxStress:'22733', minTorque:'264', maxRecStress:'20000', preferredTorque:'880' },
  { size:'14', area:'53.46', bolts:'20', boltSize:'1.38', torque60:'1360', maxStress:'25928', minTorque:'315', maxRecStress:'20000', preferredTorque:'1049' },
  { size:'16', area:'67.74', bolts:'20', boltSize:'1.50', torque60:'1600', maxStress:'24889', minTorque:'386', maxRecStress:'20000', preferredTorque:'1286' },
  { size:'18', area:'91.89', bolts:'20', boltSize:'1.63', torque60:'2200', maxStress:'21939', minTorque:'602', maxRecStress:'20000', preferredTorque:'2006' },
  { size:'20', area:'101.32', bolts:'24', boltSize:'1.63', torque60:'2200', maxStress:'23878', minTorque:'553', maxRecStress:'20000', preferredTorque:'1843' },
  { size:'24', area:'130.82', bolts:'24', boltSize:'1.88', torque60:'4000', maxStress:'25362', minTorque:'946', maxRecStress:'20000', preferredTorque:'3154' }
];

function renderSimpleTableRows(targetId, rows) {
  const body = document.getElementById(targetId);
  if (!body) return;
  body.innerHTML = rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('');
}

function renderGarlock600Rows(rows) {
  const body = document.getElementById('garlock600Body');
  if (!body) return;
  body.innerHTML = rows.map((row) => `<tr><td>${row.size}</td><td>${row.bolts}</td><td>${row.boltSize}</td><td>${row.torque60}</td><td>${row.minTorque}</td><td>${row.preferredTorque}</td><td>${row.maxRecStress}</td><td>${row.area}</td></tr>`).join('');
}

function populateGarlock600Select() {
  if (!garlock600SizeSelectEl) return;
  const previous = garlock600SizeSelectEl.value;
  const markup = garlock600Data.map((row) => `<option value="${row.size}">${row.size}</option>`).join('');
  if (!garlock600SizeSelectEl.options.length || garlock600SizeSelectEl.innerHTML.trim() !== markup.trim()) {
    garlock600SizeSelectEl.innerHTML = markup;
  }
  if (previous && garlock600Data.some((row) => row.size === previous)) garlock600SizeSelectEl.value = previous;
  if (!garlock600SizeSelectEl.value && garlock600Data[0]?.size) garlock600SizeSelectEl.value = garlock600Data[0].size;
}

function updateGarlock600Summary() {
  const activeSize = garlock600SizeSelectEl?.value || garlock600Data[0]?.size;
  const match = garlock600Data.find((row) => row.size === activeSize) || garlock600Data[0];
  if (!match) return;
  const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value || '—'; };
  setText('garlock600BoltCount', match.bolts);
  setText('garlock600BoltSize', match.boltSize);
  setText('garlock600MinTorque', `${match.minTorque} ft lbs`);
  setText('garlock600PreferredTorque', `${match.preferredTorque} ft lbs`);
  setText('garlock600Torque60', `${match.torque60} ft lbs`);
  setText('garlock600StressValue', `${match.maxRecStress} psi`);
  setText('garlock600ContactArea', `${match.area} in²`);
}

function filterGarlock600Rows(query) {
  const needle = String(query || '').trim().toLowerCase();
  const filtered = !needle ? garlock600Data : garlock600Data.filter((row) => Object.values(row).join(' ').toLowerCase().includes(needle));
  renderGarlock600Rows(filtered);
}

function populatePlantSelect(selectEl, rows) {
  if (!selectEl) return;
  const previous = selectEl.value;
  selectEl.innerHTML = rows.map((row) => `<option value="${row[0]}">${row[0]}</option>`).join('');
  if (previous && rows.some((row) => row[0] === previous)) selectEl.value = previous;
}

function updatePlantSummary(seriesKey) {
  const rows = seriesKey === '600' ? plant600Data : plant150Data;
  const selectEl = seriesKey === '600' ? plant600SizeSelectEl : plant150SizeSelectEl;
  const jackEl = document.getElementById(seriesKey === '600' ? 'plant600JackBolt' : 'plant150JackBolt');
  const packingEl = document.getElementById(seriesKey === '600' ? 'plant600Packing' : 'plant150Packing');
  const countEl = document.getElementById(seriesKey === '600' ? 'plant600Count' : 'plant150Count');
  const activeSize = selectEl?.value || rows[0]?.[0];
  const match = rows.find((row) => row[0] === activeSize) || rows[0];
  if (!match) return;
  if (jackEl) jackEl.textContent = match[1] || '—';
  if (packingEl) packingEl.textContent = match[2] || '—';
  if (countEl) countEl.textContent = match[3] || '—';
}

function filterPlantRows(seriesKey, query) {
  const rows = seriesKey === '600' ? plant600Data : plant150Data;
  const targetId = seriesKey === '600' ? 'plant600Body' : 'plant150Body';
  const needle = String(query || '').trim().toLowerCase();
  const filtered = !needle ? rows : rows.filter((row) => row.join(' ').toLowerCase().includes(needle));
  renderSimpleTableRows(targetId, filtered);
}

renderSimpleTableRows('htpReferenceBody', Object.entries(htpChartData).map(([size, item]) => [size + '"', item.branch, item.head, Number(item.cutter).toFixed(3) + '"']));
renderSimpleTableRows('plant150Body', plant150Data);
renderSimpleTableRows('plant600Body', plant600Data);
populatePlantSelect(plant150SizeSelectEl, plant150Data);
populatePlantSelect(plant600SizeSelectEl, plant600Data);
updatePlantSummary('150');
updatePlantSummary('600');
if (plant150SizeSelectEl) plant150SizeSelectEl.addEventListener('change', () => updatePlantSummary('150'));
if (plant600SizeSelectEl) plant600SizeSelectEl.addEventListener('change', () => updatePlantSummary('600'));
if (plant150SearchInputEl) plant150SearchInputEl.addEventListener('input', () => filterPlantRows('150', plant150SearchInputEl.value));
if (plant600SearchInputEl) plant600SearchInputEl.addEventListener('input', () => filterPlantRows('600', plant600SearchInputEl.value));


const ETA_FEED_RATE = 0.004;
const etaMachineEl = document.getElementById('etaMachine');
const etaCutterSizeEl = document.getElementById('etaCutterSize');
const etaCutterSizeListEl = document.getElementById('etaCutterSizeList');
const etaBcoEl = document.getElementById('etaBco');
const etaFeedRateDisplayEl = document.getElementById('etaFeedRateDisplay');
const etaRpmDisplayEl = document.getElementById('etaRpmDisplay');
const etaRpmOverrideEl = document.getElementById('etaRpmOverride');
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

function getLiveBcoValue() {
  const direct = getMeasurementValue(bcoResultEl);
  if (Number.isFinite(direct)) return direct;
  const rawText = String(bcoResultEl?.textContent || '').replace(/,/g, ' ');
  const match = rawText.match(/BCO\s*=\s*([-+]?\d*\.?\d+)/i) || rawText.match(/BCO\s*:\s*([-+]?\d*\.?\d+)/i) || rawText.match(/([-+]?\d*\.?\d+)\s*in\b/i);
  if (!match) return NaN;
  const parsed = parseFloat(match[1]);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function syncBcoToEta(options = {}) {
  const force = !!options.force;
  const currentCutter = getMeasurementValue(bcoCutterOdEl);
  const currentBco = getLiveBcoValue();
  const fmt = (value) => Number(value).toFixed(4).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
  if (etaCutterSizeEl && Number.isFinite(currentCutter) && (!etaCutterSizeEl.value || force)) {
    etaCutterSizeEl.value = fmt(currentCutter);
  }
  const etaBcoIsAuto = !etaBcoEl || etaBcoEl.dataset.autoSync !== 'false';
  if (etaBcoEl && Number.isFinite(currentBco) && (!etaBcoEl.value || force || etaBcoIsAuto)) {
    etaBcoEl.value = fmt(currentBco);
    etaBcoEl.dataset.autoSync = 'true';
  }
}

function updateEtaEstimate() {
  if (!etaMachineEl || !etaCutterSizeEl || !etaBcoEl) return;
  syncBcoToEta();
  if (etaFeedRateDisplayEl) etaFeedRateDisplayEl.textContent = ETA_FEED_RATE.toFixed(4);
  const machine = etaMachineEl.value || '360';
  const cutterSize = etaCutterSizeEl.value;
  const { rpmValues, matchedSize, exact, interpolated } = getEtaRpmMatch(machine, cutterSize);
  const bco = getMeasurementValue(etaBcoEl);
  const overrideRpm = getMeasurementValue(etaRpmOverrideEl);

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
  const usingManualRpm = Number.isFinite(overrideRpm) && overrideRpm > 0;
  const slowRpm = usingManualRpm ? overrideRpm : minRpm;
  const fastRpm = usingManualRpm ? overrideRpm : maxRpm;
  const slowFeed = slowRpm * ETA_FEED_RATE;
  const fastFeed = fastRpm * ETA_FEED_RATE;
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
    if (usingManualRpm) {
      etaInlineStatusEl.textContent = `Using manual RPM override of ${overrideRpm} RPM. Recommended chart RPM for the ${machineLabel} is ${rpmText}.`;
    } else if (exact) {
      etaInlineStatusEl.textContent = `Estimate shown using recommended ${rpmText} for the ${machineLabel}.`;
    } else if (typeof interpolated !== 'undefined' && interpolated) {
      etaInlineStatusEl.textContent = `Custom cutter size ${cutterSize} is using interpolated recommended RPM from chart sizes ${matchedSize} at ${rpmText} for the ${machineLabel}.`;
    } else {
      etaInlineStatusEl.textContent = `Custom cutter size ${cutterSize} is using the nearest charted size (${matchedSize}) with recommended ${rpmText} for the ${machineLabel}.`;
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
    syncBcoToEta();
    updateEtaEstimate();
  });
  etaCutterSizeEl.addEventListener('input', updateEtaEstimate);
  etaCutterSizeEl.addEventListener('change', updateEtaEstimate);
  etaBcoEl?.addEventListener('input', () => {
    if (etaBcoEl) etaBcoEl.dataset.autoSync = 'false';
    updateEtaEstimate();
  });
  etaBcoEl?.addEventListener('change', () => {
    if (etaBcoEl) etaBcoEl.dataset.autoSync = 'false';
    updateEtaEstimate();
  });
  etaRpmOverrideEl?.addEventListener('input', updateEtaEstimate);
  etaRpmOverrideEl?.addEventListener('change', updateEtaEstimate);
  etaUseCurrentBcoBtnEl?.addEventListener('click', () => {
    syncBcoToEta({ force: true });
    updateEtaEstimate();
  });
  etaRefreshBtnEl?.addEventListener('click', () => {
    syncBcoToEta();
    updateEtaEstimate();
  });
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


function initReferenceWorkspaceHard() {
  try {
    buildDecimalChart(decimalChartSearchEl?.value || '');
    updateFractionToDecimal();
    updateDecimalToFraction();
    filterGlossaryRows(glossarySearchInputEl?.value || '');
    renderSimpleTableRows('plant150Body', plant150Data);
    renderSimpleTableRows('plant600Body', plant600Data);
    if (typeof initBoltingReference === 'function') initBoltingReference();
    const safeView = getSafeReferenceView(localStorage.getItem('tapcalcReferenceViewV1') || referenceViewSelectEl?.value || 'converter');
    setReferenceView(safeView);
  } catch (error) {
    console.warn('alpha71 reference workspace init fallback failed', error);
  }
}
window.initReferenceWorkspaceHard = initReferenceWorkspaceHard;
document.addEventListener('DOMContentLoaded', initReferenceWorkspaceHard, { once: true });
document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-go-screen="ref"], #openRefBtn, #referenceBackToTopBtn');
  if (!trigger) return;
  setTimeout(initReferenceWorkspaceHard, 0);
});
window.addEventListener('pageshow', () => setTimeout(initReferenceWorkspaceHard, 0));
document.addEventListener('click', (event) => {
  const refTab = event.target.closest('.screen-tab[data-screen="ref"]');
  const refCard = event.target.closest('.ref-category-card, .ref-shortcut-btn');
  if (refTab || refCard) setTimeout(initReferenceWorkspaceHard, 0);
});

initBoltingReference();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    navigator.serviceWorker.register('service-worker.js?v=3.0.0-alpha126', { updateViaCache: 'none' }).then((registration) => registration.update()).catch(() => {});
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
  try { syncBcoToEta(); } catch {}
  try { updateEtaEstimate(); } catch {}
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
  if (!state.etaPtc && record?.measurements?.hotTap?.ptc) state.etaPtc = record.measurements.hotTap.ptc;
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
    'etaMachine','etaCutterSize','etaBco','etaRpmOverride'
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
    etaBco: state.etaBco,
    etaRpmOverride: state.etaRpmOverride
  };
  Object.entries(directMap).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el && value != null && value !== '') {
      el.value = value;
      try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch {}
      try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch {}
    }
  });

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

window.getCombinedJobsForDisplay = function getCombinedJobsForDisplay() {
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
  return list.find((job) => String(job.id) === selectedId) || list[0] || null;
}

function updateJobsListSelectionUI() {
  if (!jobsSelectEl) return;
  jobsSelectEl.querySelectorAll('.jobs-list-item[data-job-id]').forEach((item) => {
    const active = String(item.dataset.jobId || '') === String(selectedJobId || '');
    item.classList.toggle('active', active);
    item.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function renderSelectedJobDetails(jobs = null) {
  const list = jobs || getCombinedJobsForDisplay();
  if (!jobsListEl) return;
  const compactShared = (() => {
    try {
      const compact = window.matchMedia ? window.matchMedia('(max-width: 820px)').matches : window.innerWidth <= 820;
      const sharedVisible = document.querySelector('[data-library-lane-panel="shared"]')?.classList.contains('active');
      return compact && sharedVisible;
    } catch { return false; }
  })();
  if (!list.length) {
    jobsListEl.innerHTML = '<div class="jobs-library-empty">No jobs match this search yet.</div>';
    return;
  }
  if (compactShared && !selectedJobId) {
    jobsListEl.innerHTML = '<div class="jobs-library-empty">Select a job from the list to view its details.</div>';
    return;
  }
  const selectedJob = getSelectedCombinedJob(list);
  if (!selectedJob) {
    jobsListEl.innerHTML = '<div class="jobs-library-empty">Select a job from the list to view its details.</div>';
    return;
  }
  selectedJobId = String(selectedJob.id);
  updateJobsListSelectionUI();
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
      <button type="button" id="jobsLoadSelectedBtn" class="secondary-btn" onclick="return window.tapCalcForceLoadSelectedJob && window.tapCalcForceLoadSelectedJob();">Load Job</button>
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
    const selected = getSelectedCombinedJob(list) || { record };
    loadRecordIntoCalculator(selected.record || record);
    try { document.querySelector('.screen-tab[data-screen="job"]')?.click(); } catch {}
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
    if (jobsSelectEl) jobsSelectEl.innerHTML = '<div class="jobs-library-empty">No jobs match this search yet.</div>';
    jobsListEl.innerHTML = '<div class="jobs-library-empty">No jobs match this search yet.</div>';
    return;
  }

  const previousSelectedId = selectedJobId ? String(selectedJobId) : '';
  const selectedStillExists = jobs.some((job) => String(job.id) === previousSelectedId);
  const compactShared = (() => {
    try {
      const compact = window.matchMedia ? window.matchMedia('(max-width: 820px)').matches : window.innerWidth <= 820;
      const sharedVisible = document.querySelector('[data-library-lane-panel="shared"]')?.classList.contains('active');
      return compact && sharedVisible;
    } catch { return false; }
  })();
  selectedJobId = compactShared ? (selectedStillExists ? previousSelectedId : '') : (selectedStillExists ? previousSelectedId : String(jobs[0].id));

  if (jobsSelectEl) {
    const previousScrollTop = jobsSelectEl.scrollTop;
    jobsSelectEl.innerHTML = '';
    const frag = document.createDocumentFragment();
    jobs.forEach(({ source, id, record }) => {
      const title = record?.meta?.title || record?.job?.description || record?.job?.jobNumber || 'Saved Job';
      const client = record?.job?.client || 'No customer';
      const date = record?.job?.date || record?.meta?.savedAtDisplay || 'No date';
      const op = record?.meta?.operationType || 'Job';
      const nominalSize = record?.pipe?.nominalSize || '—';
      const sourceLabel = source === 'local' ? 'Local' : source === 'synced' ? 'Synced' : 'Shared';
      const groupPrefix = jobsBrowseMode === 'customer'
        ? `Customer: ${client}`
        : jobsBrowseMode === 'location'
          ? `Location: ${record?.job?.location || 'No location'}`
          : jobsBrowseMode === 'date'
            ? `Date: ${date}`
            : 'Search';
      const isActive = String(id) === selectedJobId;
      const item = document.createElement('div');
      item.className = `jobs-list-item${isActive ? ' active' : ''}`;
      item.dataset.jobId = String(id);
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      item.innerHTML = `<span class="jobs-list-title"></span><span class="jobs-list-meta"></span>`;
      item.querySelector('.jobs-list-title').textContent = title;
      item.querySelector('.jobs-list-meta').textContent = `${groupPrefix} • ${client} • ${op} • ${nominalSize} • ${sourceLabel}`;
      const selectThis = (event) => {
        if (event) { event.preventDefault(); event.stopPropagation(); }
        selectedJobId = String(id);
        updateJobsListSelectionUI();
        renderSelectedJobDetails(jobs);
      };
      item.addEventListener('click', selectThis);
      item.addEventListener('pointerup', selectThis);
      item.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') selectThis(event);
      });
      frag.appendChild(item);
    });
    jobsSelectEl.appendChild(frag);
    jobsSelectEl.scrollTop = previousScrollTop;
  }

  updateJobsListSelectionUI();
  renderSelectedJobDetails(jobs);
}

async function loadCloudJobs() {

  const ready = await ensureFirebaseReady();
  if (!ready.enabled) {
    cloudJobsCache = [];
    renderJobsList();
    updateUnsyncedCount();
    if (jobsCloudStatusEl) jobsCloudStatusEl.textContent = 'Firebase is not connected yet. Local history still works offline.';
    return;
  }

  if (refreshCloudJobsBtnEl) refreshCloudJobsBtnEl.disabled = true;

  try {
    const { collection, getDocs, getDocsFromServer } = ready.modules;
    const colRef = collection(ready.db, getJobsCollectionName());

    const withTimeout = (promise, label) =>
      Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`${label} timeout after 10000ms`)), 10000)
        )
      ]);

    let snapshot;
    try {
      snapshot = getDocsFromServer
        ? await withTimeout(getDocsFromServer(colRef), 'Firestore server read')
        : await withTimeout(getDocs(colRef), 'Firestore read');
    } catch (serverError) {
      console.warn('Server fetch failed, falling back to cached/default Firestore read.', serverError);
      snapshot = await withTimeout(getDocs(colRef), 'Firestore fallback read');
    }

    cloudJobsCache = snapshot.docs.map((docSnap) => ({
      source: 'cloud',
      id: docSnap.id,
      record: docSnap.data() || {}
    }));

    renderJobsList();
    if (cloudJobsCache.length) openSharedLibraryLane();

    if (jobsCloudStatusEl) {
      jobsCloudStatusEl.textContent =
        `Loaded ${cloudJobsCache.length} shared job${cloudJobsCache.length === 1 ? '' : 's'} from ${getJobsCollectionName()} (${window.TAPCALC_FIREBASE_CONFIG?.projectId || 'unknown project'}).`;
    }
  } catch (error) {
    console.error('Cloud jobs load failed', error);
    if (jobsCloudStatusEl) {
      jobsCloudStatusEl.textContent = `Could not load shared jobs. ${formatFirebaseError(error)}`;
    }
  } finally {
    if (refreshCloudJobsBtnEl) refreshCloudJobsBtnEl.disabled = false;
  }

  updateUnsyncedCount();
}
function updateUnsyncedCount() {
  if (!unsyncedJobsCountEl) return;
  const unsynced = getHistory().filter((item) => !item.cloudId).length;
  unsyncedJobsCountEl.textContent = String(unsynced);
}

function setHistoryDrawerOpen(isOpen) {
  if (historyDrawerContentEl) historyDrawerContentEl.hidden = !isOpen;
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
    const item = event.target.closest('.jobs-list-item[data-job-id]');
    if (!item) return;
    selectedJobId = String(item.dataset.jobId || '');
    updateJobsListSelectionUI();
    renderSelectedJobDetails();
  });
  jobsSelectEl.addEventListener('keydown', (event) => {
    const jobs = getCombinedJobsForDisplay();
    if (!jobs.length) return;
    let index = jobs.findIndex((job) => String(job.id) === String(selectedJobId));
    if (index < 0) index = 0;
    if (event.key === 'ArrowDown') index = Math.min(jobs.length - 1, index + 1);
    else if (event.key === 'ArrowUp') index = Math.max(0, index - 1);
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = jobs.length - 1;
    else return;
    event.preventDefault();
    selectedJobId = String(jobs[index].id);
    updateJobsListSelectionUI();
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
  window.setMode=function(mode){ if(mode==='htp') mode='hotTap'; oldSetMode(mode); syncSub(mode); };
  subBtns.forEach(b=>b.addEventListener('click',()=>window.setMode(b.dataset.mode)));
  const oldWindowSetMode = window.setMode;
  window.setMode = function(mode){ if(mode==='htp') mode='hotTap'; oldWindowSetMode(mode); syncSub(mode); document.querySelectorAll('.workflow-card[data-workflow-target]').forEach(card=>card.classList.toggle('active', card.dataset.workflowTarget===mode)); updateCurrentJobLabel(); if(['hotTap','lineStop','completionPlug'].includes(mode)){ focusActiveCardPanel(mode); } };
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
    const summaryBco = getText('summaryBco');
    const summaryPipe = getText('summaryPipe');
    const summaryCutter = getText('summaryCutter');
    const geometryReady = summaryBco !== '—' && summaryPipe !== '—' && summaryCutter !== '—';
    const baseReady = hasJobInfo && hasMachine;
    const readOut = (id) => {
      const el = document.getElementById(id);
      if (!el) return '—';
      const raw = 'value' in el ? String(el.value ?? '').trim() : String(el.textContent ?? '').trim();
      return raw && raw !== '—' ? raw : '—';
    };

    const stageChecks = {
      hotTap: {
        geometry: baseReady && geometryReady,
        inputs: hasValue('md') && hasValue('ptc') && hasValue('mt'),
        output: readOut('ttd') !== '—'
      },
      htp: {
        geometry: baseReady && geometryReady,
        inputs: hasValue('htpPipeSize') && hasValue('htpMd') && hasValue('htpPtc'),
        output: readOut('htpTco') !== '—'
      },
      lineStop: {
        geometry: baseReady && geometryReady,
        inputs: hasValue('lsMd') && hasValue('lsTravel') && hasValue('lsMachineTravel'),
        output: readOut('lsLiManual') !== '—'
      },
      completionPlug: {
        geometry: baseReady && geometryReady,
        inputs: hasValue('cpStart') && hasValue('cpJbf') && hasValue('cpPt'),
        output: readOut('cpLiManual') !== '—'
      }
    };

    function describeStage(stage){
      const fallback = { geometry: false, inputs: false, output: false };
      const checks = stageChecks[stage] || stageChecks.hotTap || fallback;
      const started = !!(checks.inputs || checks.output);
      const ready = !!(checks.geometry && checks.inputs && checks.output);
      return { ...fallback, ...checks, started, ready };
    }

    const safeActiveMode = stageChecks[activeMode] ? activeMode : 'hotTap';
    const current = describeStage(safeActiveMode);
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
    const readCardOutput=(id)=>{
      const el=document.getElementById(id);
      if(!el) return '—';
      const raw=('value' in el ? String(el.value ?? '') : String(el.textContent ?? '')).trim();
      return raw || '—';
    };
    const hotTapTtd=readCardOutput('ttd');
    const htpTco=readCardOutput('htpTco');
    const lsLi=readCardOutput('lsLiManual');
    const cpLi=readCardOutput('cpLiManual');
    if(focusOutput){
      const map={hotTap: hotTapTtd !== '' ? hotTapTtd : '—', htp: htpTco !== '' ? htpTco : '—', lineStop: lsLi !== '' ? lsLi : '—', completionPlug: cpLi !== '' ? cpLi : '—'};
      const safeOutputMode = map[activeMode] ? activeMode : 'hotTap';
      focusOutput.textContent = map[safeOutputMode] || '—';
    }
    const focusTitle=document.getElementById('cardFocusTitle');
    const focusDesc=document.getElementById('cardFocusDesc');
    if(focusTitle || focusDesc){
      const modeCopy={
        hotTap:['Hot Tap workflow','Set MD, LD, and PTC first, then verify LI, BCO, and on-rod values before moving forward.'],
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
    const map={'Hot Tap':'hotTap','Line Stop':'lineStop','Completion Plug':'completionPlug'};
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


/* ===== 3.0.0-alpha48 library picker rebuild ===== */
(function(){
  const getJobsSelectEl = () => document.getElementById('jobsSelect');
  const getJobsListEl = () => document.getElementById('jobsList');
  const getJobsResultsMetaEl = () => document.getElementById('jobsResultsMeta');

  function alpha47GetJobs() {
    try { return (window.getCombinedJobsForDisplay ? window.getCombinedJobsForDisplay() : []); } catch (error) { console.error('Library jobs build failed', error); return []; }
  }

  function alpha47Escape(value) {
    return String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function alpha47SelectJob(jobId, jobs) {
    const list = jobs || alpha47GetJobs();
    const jobsListEl = getJobsListEl();
    if (!list.length) {
      selectedJobId = '';
      updateJobsListSelectionUI();
      if (jobsListEl) jobsListEl.innerHTML = '<div class="jobs-library-empty">No jobs match this search yet.</div>';
      return;
    }
    const exists = list.some((job) => String(job.id) === String(jobId || ''));
    selectedJobId = exists ? String(jobId) : String(list[0].id);
    updateJobsListSelectionUI();
    renderSelectedJobDetails(list);
  }

  window.alpha47SelectJobById = function(jobId) {
    selectedJobId = String(jobId || '');
    updateJobsListSelectionUI();
    renderSelectedJobDetails();
  };

  window.selectLibraryJobByIndex = function(index){ const jobs=alpha47GetJobs(); const entry=jobs[index]; if(entry){ selectedJobId = String(entry.id); updateJobsListSelectionUI(); renderSelectedJobDetails(jobs); } };
  window.loadSelectedLibraryJob = window.alpha47LoadSelectedLibraryJob;

  updateJobsListSelectionUI = function updateJobsListSelectionUIAlpha47() {
    const jobsSelectEl = getJobsSelectEl();
    if (!jobsSelectEl) return;
    jobsSelectEl.querySelectorAll('.jobs-list-item[data-job-id]').forEach((item) => {
      const active = String(item.dataset.jobId || '') === String(selectedJobId || '');
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', active ? 'true' : 'false');
      item.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  };

  window.alpha47LoadSelectedLibraryJob = function() {
    const list = alpha47GetJobs();
    const selected = list.find((job) => String(job.id) === String(selectedJobId || '')) || list[0];
    if (!selected) return;
    try {
      loadRecordIntoCalculator(selected.record || {});
      document.querySelector('.screen-tab[data-screen="job"]')?.click();
    } catch (error) {
      console.error('Load Job failed', error);
    }
  };

  renderSelectedJobDetails = function renderSelectedJobDetailsAlpha47(jobs) {
    const list = jobs || alpha47GetJobs();
    const jobsListEl = getJobsListEl();
    if (!jobsListEl) return;
    if (!list.length) {
      jobsListEl.innerHTML = '<div class="jobs-library-empty">No jobs match this search yet.</div>';
      return;
    }
    let selected = list.find((job) => String(job.id) === String(selectedJobId || ''));
    if (!selected) {
      selected = list[0];
      selectedJobId = String(selected.id);
    }
    updateJobsListSelectionUI();
    const record = selected.record || {};
    const title = record?.meta?.title || record?.job?.jobDescription || record?.job?.description || record?.job?.jobNumber || 'Saved Job';
    const sourceLabel = selected.source === 'local' ? 'Local only' : selected.source === 'synced' ? 'Synced' : 'Shared DB';
    const savedAtDisplay = record?.meta?.savedAtDisplay || selected.savedAt || '—';
    jobsListEl.innerHTML = `
      <div class="job-detail-header">
        <div>
          <div class="job-detail-title">${alpha47Escape(title)}</div>
          <div class="job-detail-subtitle">${alpha47Escape(savedAtDisplay)} • ${alpha47Escape(record?.meta?.operationType || 'Job')} • ${alpha47Escape(sourceLabel)}</div>
        </div>
        <div class="job-record-badges"><span class="job-source-badge ${alpha47Escape(selected.source)}">${alpha47Escape(sourceLabel)}</span></div>
      </div>
      <div class="job-detail-actions"><button type="button" id="jobsLoadSelectedBtn" class="secondary-btn" onclick="return window.tapCalcForceLoadSelectedJob && window.tapCalcForceLoadSelectedJob();">Load Job</button></div>
      ${renderJobRecordDetails(record)}
    `;
    const loadBtn = document.getElementById('jobsLoadSelectedBtn');
    if (loadBtn) loadBtn.addEventListener('click', window.alpha47LoadSelectedLibraryJob);
  };

  renderJobsList = function renderJobsListAlpha47() {
    const jobsSelectEl = getJobsSelectEl();
    const jobsListEl = getJobsListEl();
    const jobsResultsMetaEl = getJobsResultsMetaEl();
    if (!jobsSelectEl || !jobsListEl) return;
    const jobs = alpha47GetJobs();
    if (jobsResultsMetaEl) {
      const countText = `${jobs.length} job${jobs.length === 1 ? '' : 's'} found`;
      const modeLabel = jobsBrowseMode === 'all' ? 'Search' : jobsBrowseMode.charAt(0).toUpperCase() + jobsBrowseMode.slice(1);
      jobsResultsMetaEl.textContent = jobsSearchTerm ? `${countText} for “${jobsSearchTerm}” • ${modeLabel} view` : `${countText} • ${modeLabel} view`;
    }
    if (!jobs.length) {
      jobsSelectEl.innerHTML = '<div class="jobs-library-empty">No jobs match this search yet.</div>';
      jobsListEl.innerHTML = '<div class="jobs-library-empty">No jobs match this search yet.</div>';
      selectedJobId = '';
      return;
    }
    const previousScrollTop = jobsSelectEl.scrollTop;
    if (!jobs.some((job) => String(job.id) === String(selectedJobId || ''))) {
      selectedJobId = String(jobs[0].id);
    }
    jobsSelectEl.innerHTML = jobs.map(({ source, id, record }, index) => {
      const title = record?.meta?.title || record?.job?.jobDescription || record?.job?.description || record?.job?.jobNumber || 'Saved Job';
      const client = record?.job?.client || 'No customer';
      const date = record?.job?.date || record?.meta?.savedAtDisplay || 'No date';
      const op = record?.meta?.operationType || 'Job';
      const nominalSize = record?.pipe?.nominalSize || '—';
      const sourceLabel = source === 'local' ? 'Local' : source === 'synced' ? 'Synced' : 'Shared';
      const groupPrefix = jobsBrowseMode === 'customer'
        ? `Customer: ${client}`
        : jobsBrowseMode === 'location'
          ? `Location: ${record?.job?.location || 'No location'}`
          : jobsBrowseMode === 'date'
            ? `Date: ${date}`
            : 'Search';
      const active = String(id) === String(selectedJobId);
      const escapedId = alpha47Escape(id);
      return `
        <div class="jobs-list-item${active ? ' active' : ''}" role="button" tabindex="0" data-job-id="${escapedId}" data-job-index="${index}" aria-pressed="${active ? 'true' : 'false'}" aria-selected="${active ? 'true' : 'false'}">
          <span class="jobs-list-title">${alpha47Escape(title)}</span>
          <span class="jobs-list-meta">${alpha47Escape(`${groupPrefix} • ${client} • ${op} • ${nominalSize} • ${sourceLabel}`)}</span>
        </div>`;
    }).join('');
    jobsSelectEl.scrollTop = previousScrollTop;
    updateJobsListSelectionUI();
    renderSelectedJobDetails(jobs);
  };

  const jobsSelectContainer = getJobsSelectEl();
  if (jobsSelectContainer) {
    jobsSelectContainer.addEventListener('click', (event) => {
      const item = event.target.closest('.jobs-list-item[data-job-id]');
      if (!item) return;
      event.preventDefault();
      selectedJobId = String(item.dataset.jobId || '');
      updateJobsListSelectionUI();
      renderSelectedJobDetails();
    });
    jobsSelectContainer.addEventListener('keydown', (event) => {
      const item = event.target.closest('.jobs-list-item[data-job-id]');
      if (!item) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectedJobId = String(item.dataset.jobId || '');
        updateJobsListSelectionUI();
        renderSelectedJobDetails();
      }
    });
  }
})();



/* ===== 3.0.0-alpha57 library picker direct rebuild ===== */
(function(){
  const getJobsSelectEl = () => document.getElementById('jobsSelect');
  const getJobsListEl = () => document.getElementById('jobsList');
  const getJobsResultsMetaEl = () => document.getElementById('jobsResultsMeta');

  function safeJobs() {
    try {
      const jobs = (window.getCombinedJobsForDisplay ? window.getCombinedJobsForDisplay() : []);
      return Array.isArray(jobs) ? jobs : [];
    } catch (error) {
      console.error('alpha56 jobs build failed', error);
      return [];
    }
  }

  function esc(value) {
    return String(value ?? '')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  function sourceLabel(source) {
    return source === 'local' ? 'Local'
      : source === 'synced' ? 'Synced'
      : 'Shared';
  }

  function ensureSelection(list) {
    if (!list.length) {
      window.__tapcalcSelectedLibraryIndex = -1;
      window.__tapcalcSelectedLibraryRecord = null;
      selectedJobId = '';
      return null;
    }
    let idx = Number(window.__tapcalcSelectedLibraryIndex);
    if (!Number.isInteger(idx) || idx < 0 || idx >= list.length) {
      const existing = list.findIndex((job) => String(job.id) === String(selectedJobId || ''));
      idx = existing >= 0 ? existing : 0;
    }
    window.__tapcalcSelectedLibraryIndex = idx;
    const selected = list[idx];
    selectedJobId = String(selected?.id || '');
    window.__tapcalcSelectedLibraryRecord = selected?.record || null;
    return selected;
  }

  function renderAlpha56Detail(list) {
    const jobsListEl = getJobsListEl();
    if (!jobsListEl) return;
    const selected = ensureSelection(list);
    if (!selected) {
      jobsListEl.innerHTML = '<div class="jobs-library-empty">No jobs match this search yet.</div>';
      return;
    }
    const record = selected.record || {};
    const title = record?.meta?.title || record?.job?.jobDescription || record?.job?.description || record?.job?.jobNumber || 'Saved Job';
    const savedAtDisplay = record?.meta?.savedAtDisplay || record?.savedAt || '—';
    const op = record?.meta?.operationType || 'Job';
    jobsListEl.innerHTML = `
      <div class="job-detail-header">
        <div>
          <div class="job-detail-title">${esc(title)}</div>
          <div class="job-detail-subtitle">${esc(savedAtDisplay)} • ${esc(op)} • ${esc(sourceLabel(selected.source))} DB</div>
        </div>
        <div class="job-record-badges"><span class="job-source-badge ${esc(selected.source)}">${esc(sourceLabel(selected.source))} DB</span></div>
      </div>
      <div class="job-detail-actions">
        <button type="button" id="jobsLoadSelectedBtn" class="secondary-btn" onclick="return window.tapCalcForceLoadSelectedJob && window.tapCalcForceLoadSelectedJob();">Load Job</button>
      </div>
      ${typeof renderJobRecordDetails === 'function' ? renderJobRecordDetails(record) : ''}
    `;
    const btn = document.getElementById('jobsLoadSelectedBtn');
    if (btn) btn.onclick = () => window.tapCalcLibraryLoadSelected();
  }

  function renderAlpha56SelectionUI(list) {
    const jobsSelectEl = getJobsSelectEl();
    if (!jobsSelectEl) return;
    const activeId = String(selectedJobId || '');
    jobsSelectEl.querySelectorAll('.jobs-list-item[data-job-id]').forEach((item) => {
      const active = String(item.dataset.jobId || '') === activeId;
      item.classList.toggle('active', active);
      item.setAttribute('aria-selected', active ? 'true' : 'false');
      item.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  window.tapCalcLibrarySelect = function(index) {
    const list = safeJobs();
    if (!list.length) return false;
    const idx = Number(index);
    if (!Number.isInteger(idx) || idx < 0 || idx >= list.length) return false;
    window.__tapcalcSelectedLibraryIndex = idx;
    selectedJobId = String(list[idx].id || '');
    window.__tapcalcSelectedLibraryRecord = list[idx].record || null;
    renderAlpha56SelectionUI(list);
    renderAlpha56Detail(list);
    return true;
  };

  window.tapCalcLibraryLoadSelected = function() {
    const list = safeJobs();
    const selected = ensureSelection(list);
    if (!selected || !selected.record) return false;
    try {
      loadRecordIntoCalculator(selected.record || {}, { message: true });
    } catch (error) {
      console.error('alpha56 Load Job failed', error);
      return false;
    }
    try {
      if (typeof window.tapCalcSetScreen === 'function') window.tapCalcSetScreen('job');
      else document.querySelector('.screen-tab[data-screen="job"]')?.click();
    } catch {}
    return true;
  };

  renderJobsList = function renderJobsListAlpha56() {
    const jobsSelectEl = getJobsSelectEl();
    const jobsResultsMetaEl = getJobsResultsMetaEl();
    const list = safeJobs();
    if (!jobsSelectEl) return;
    if (jobsResultsMetaEl) {
      const countText = `${list.length} job${list.length === 1 ? '' : 's'} found`;
      const modeLabel = (typeof jobsBrowseMode === 'string' && jobsBrowseMode !== 'all')
        ? jobsBrowseMode.charAt(0).toUpperCase() + jobsBrowseMode.slice(1)
        : 'Search';
      jobsResultsMetaEl.textContent = (typeof jobsSearchTerm === 'string' && jobsSearchTerm)
        ? `${countText} for “${jobsSearchTerm}” • ${modeLabel} view`
        : `${countText} • ${modeLabel} view`;
    }
    if (!list.length) {
      jobsSelectEl.innerHTML = '<div class="jobs-library-empty">No jobs match this search yet.</div>';
      renderAlpha56Detail(list);
      return;
    }
    ensureSelection(list);
    jobsSelectEl.innerHTML = list.map(({source,id,record}, index) => {
      const title = record?.meta?.title || record?.job?.jobDescription || record?.job?.description || record?.job?.jobNumber || 'Saved Job';
      const client = record?.job?.client || 'No customer';
      const date = record?.job?.date || record?.meta?.savedAtDisplay || 'No date';
      const op = record?.meta?.operationType || 'Job';
      const nominalSize = record?.pipe?.nominalSize || '—';
      const groupPrefix = jobsBrowseMode === 'customer'
        ? `Customer: ${client}`
        : jobsBrowseMode === 'location'
          ? `Location: ${record?.job?.location || 'No location'}`
          : jobsBrowseMode === 'date'
            ? `Date: ${date}`
            : 'Search';
      const active = String(id) === String(selectedJobId || '');
      return `
        <button type="button" class="jobs-list-item${active ? ' active' : ''}" data-job-id="${esc(id)}" data-job-index="${index}" aria-selected="${active ? 'true' : 'false'}" aria-pressed="${active ? 'true' : 'false'}" onclick="window.tapCalcLibrarySelect(${index})">
          <span class="jobs-list-title">${esc(title)}</span>
          <span class="jobs-list-meta">${esc(`${groupPrefix} • ${client} • ${op} • ${nominalSize} • ${sourceLabel(source)}`)}</span>
        </button>`;
    }).join('');
    renderAlpha56SelectionUI(list);
    renderAlpha56Detail(list);
  };

  const jobsSelectEl = getJobsSelectEl();
  if (jobsSelectEl && !jobsSelectEl.dataset.alpha56Bound) {
    jobsSelectEl.addEventListener('click', (event) => {
      const row = event.target.closest('.jobs-list-item[data-job-index]');
      if (!row) return;
      event.preventDefault();
      window.tapCalcLibrarySelect(Number(row.dataset.jobIndex));
    });
    jobsSelectEl.addEventListener('touchend', (event) => {
      const row = event.target.closest('.jobs-list-item[data-job-index]');
      if (!row) return;
      event.preventDefault();
      window.tapCalcLibrarySelect(Number(row.dataset.jobIndex));
    }, { passive: false });
    jobsSelectEl.dataset.alpha56Bound = 'true';
  }
})();


/* ===== 3.0.0-alpha57 direct load-job hydration override ===== */
(function(){
  function normalizeDateForInput(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) {
      const mm = m[1].padStart(2,'0');
      const dd = m[2].padStart(2,'0');
      return `${m[3]}-${mm}-${dd}`;
    }
    return raw;
  }

  function setFieldValue(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === 'checkbox') {
      el.checked = !!value;
    } else {
      el.value = value == null ? '' : String(value);
    }
    try { el.dispatchEvent(new Event('input', { bubbles:true })); } catch {}
    try { el.dispatchEvent(new Event('change', { bubbles:true })); } catch {}
  }

  function deriveOperation(record) {
    const raw = String(record?.meta?.operationType || '').toLowerCase();
    if (raw.includes('completion')) return 'Completion Plug';
    if (raw.includes('line stop')) return 'Line Stop';
    if (raw.includes('htp')) return 'HTP';
    return 'Hot Tap';
  }

  function deriveEtaMachine(machine) {
    const m = String(machine || '');
    if (m.includes('360')) return '360';
    if (m.includes('660') || m.includes('760')) return '660';
    if (m.includes('1200')) return '1200';
    return m;
  }

  function hydrateVisibleFields(record) {
    const job = record?.job || {};
    const pipe = record?.pipe || {};
    const machine = record?.machine || {};
    const calc = record?.calculations || {};
    const h = record?.measurements?.hotTap || {};
    const htp = record?.measurements?.htp || {};
    const ls = record?.measurements?.lineStop || {};
    const cp = record?.measurements?.completionPlug || {};

    setFieldValue('jobClient', job.client || '');
    setFieldValue('jobDescription', job.description || record?.meta?.title || '');
    setFieldValue('jobNumber', job.jobNumber || '');
    setFieldValue('jobPressure', job.pressure || '');
    setFieldValue('jobTemperature', job.temperature || '');
    setFieldValue('jobDate', normalizeDateForInput(job.date || ''));
    setFieldValue('jobProduct', job.product || '');
    setFieldValue('jobLocation', job.location || '');
    setFieldValue('jobTechnician', job.technician || '');
    setFieldValue('jobNotes', job.notes || '');

    setFieldValue('machineType', machine.machine || '');
    setFieldValue('operationType', deriveOperation(record));

    setFieldValue('bcoPipeMaterial', pipe.material || '');
    setFieldValue('bcoPipeOD', pipe.nominalSize || '');
    setFieldValue('bcoSchedule', pipe.schedule || '');
    setFieldValue('bcoPipeID', pipe.pipeId || '');
    setFieldValue('bcoCutterOD', machine.cutterOd || '');

    setFieldValue('md', h.md || '');
    setFieldValue('ld', h.ld || '');
    setFieldValue('ldSign', h.ldSign || '+');
    setFieldValue('ptc', h.ptc || '');
    setFieldValue('pod', h.pod || pipe.trueOd || '');
    setFieldValue('mt', h.mt || '');
    setFieldValue('start', h.rodStart || '');

    setFieldValue('htpPipeSize', htp.pipeSize || '');
    setFieldValue('htpMd', htp.md || '');
    setFieldValue('htpLd', htp.ld || '');
    setFieldValue('htpLdSign', htp.ldSign || '+');
    setFieldValue('htpPtc', htp.ptc || '');

    setFieldValue('lsMd', ls.md || '');
    setFieldValue('lsLd', ls.ld || '');
    setFieldValue('lsLdSign', ls.ldSign || '+');
    setFieldValue('lsPod', ls.pod || pipe.trueOd || '');
    setFieldValue('lsTravel', ls.travel || '');
    setFieldValue('lsMachineTravel', ls.machineTravel || '');

    setFieldValue('cpStart', cp.start || '');
    setFieldValue('cpJbf', cp.jbf || '');
    setFieldValue('cpLd', cp.ld || '');
    setFieldValue('cpPt', cp.pt || '');

    setFieldValue('etaMachine', deriveEtaMachine(machine.machine || ''));
    setFieldValue('etaCutterSize', machine.cutterOd || '');
    setFieldValue('etaBco', calc.bco || '');
  }

  window.tapCalcLibraryLoadSelected = function alpha57LoadSelected() {
    try {
      const list = (window.getCombinedJobsForDisplay ? window.getCombinedJobsForDisplay() : []) || [];
      let selected = null;
      if (window.__tapcalcSelectedLibraryRecord) {
        selected = { record: window.__tapcalcSelectedLibraryRecord };
      }
      if (!selected && Number.isInteger(window.__tapcalcSelectedLibraryIndex)) {
        selected = list[window.__tapcalcSelectedLibraryIndex] || null;
      }
      if (!selected && typeof selectedJobId !== 'undefined') {
        selected = list.find((job) => String(job.id) === String(selectedJobId || '')) || null;
      }
      if (!selected || !selected.record) {
        console.warn('alpha57 Load Job: no selected record found');
        return false;
      }
      const record = selected.record;
      const rebuilt = (typeof buildStateFromRecord === 'function') ? buildStateFromRecord(record) : (record.state || {});
      if (rebuilt && typeof applyJobState === 'function') applyJobState(rebuilt);
      hydrateVisibleFields(record);
      try { localStorage.setItem('measurementCardStateV1', JSON.stringify(rebuilt || {})); } catch {}
      setTimeout(() => {
        try { if (typeof refreshBcoState === 'function') refreshBcoState(); } catch {}
        try { if (typeof updateBcoDisplays === 'function') updateBcoDisplays(); } catch {}
        try { if (typeof calculateIntegratedBco === 'function') calculateIntegratedBco({ silent:true }); } catch {}
        try { if (typeof calcHotTap === 'function') calcHotTap(); } catch {}
        try { if (typeof calcHtp === 'function') calcHtp(); } catch {}
        try { if (typeof calcLineStop === 'function') calcLineStop(); } catch {}
        try { if (typeof calcCompletionPlug === 'function') calcCompletionPlug(); } catch {}
        try { if (typeof initEtaCalculator === 'function') initEtaCalculator(); } catch {}
        try { if (typeof syncBcoToEta === 'function') syncBcoToEta({ force:true }); } catch {}
        try { if (typeof updateEtaEstimate === 'function') updateEtaEstimate(); } catch {}
        try { if (typeof updateJobInfoSummary === 'function') updateJobInfoSummary(); } catch {}
        try { if (typeof window.updateTapCalcShell === 'function') window.updateTapCalcShell(); } catch {}
      }, 60);
      const jobTab = document.querySelector('.screen-tab[data-screen="job"]');
      if (jobTab) jobTab.click();
      return true;
    } catch (error) {
      console.error('alpha57 Load Job failed', error);
      return false;
    }
  };
})();


/* ===== 3.0.0-alpha59 robust load-job override ===== */
(function(){
  function alpha58NormalizeDate(raw) {
    raw = String(raw || '').trim();
    if (!raw) return '';
    const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}`;
    return raw;
  }
  function alpha58Set(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    const v = value == null ? '' : String(value);
    if (el.type === 'checkbox') el.checked = !!value;
    else el.value = v;
    try { el.dispatchEvent(new Event('input', { bubbles:true })); } catch {}
    try { el.dispatchEvent(new Event('change', { bubbles:true })); } catch {}
  }
  function alpha58Hydrate(record) {
    const job = record?.job || {};
    const pipe = record?.pipe || {};
    const machine = record?.machine || {};
    const calc = record?.calculations || {};
    const h = record?.measurements?.hotTap || {};
    const htp = record?.measurements?.htp || {};
    const ls = record?.measurements?.lineStop || {};
    const cp = record?.measurements?.completionPlug || {};
    const rawOp = String(record?.meta?.operationType || '').toLowerCase();
    const op = rawOp.includes('completion') ? 'Completion Plug' : rawOp.includes('line stop') ? 'Line Stop' : rawOp.includes('htp') ? 'HTP' : 'Hot Tap';
    alpha58Set('jobClient', job.client || '');
    alpha58Set('jobDescription', job.description || record?.meta?.title || '');
    alpha58Set('jobNumber', job.jobNumber || '');
    alpha58Set('jobDate', alpha58NormalizeDate(job.date || ''));
    alpha58Set('jobLocation', job.location || '');
    alpha58Set('jobTechnician', job.technician || '');
    alpha58Set('jobPressure', job.pressure || '');
    alpha58Set('jobTemperature', job.temperature || '');
    alpha58Set('jobProduct', job.product || '');
    alpha58Set('jobNotes', job.notes || '');
    alpha58Set('machineType', machine.machine || '');
    alpha58Set('operationType', op);
    alpha58Set('bcoPipeMaterial', pipe.material || '');
    alpha58Set('bcoPipeOD', pipe.nominalSize || '');
    alpha58Set('bcoSchedule', pipe.schedule || '');
    alpha58Set('bcoPipeID', pipe.pipeId || '');
    alpha58Set('bcoCutterOD', machine.cutterOd || '');
    alpha58Set('etaMachine', String(machine.machine || '').includes('360') ? '360' : (String(machine.machine || '').includes('660') || String(machine.machine || '').includes('760')) ? '660' : (String(machine.machine || '').includes('1200') ? '1200' : ''));
    alpha58Set('etaCutterSize', machine.cutterOd || '');
    alpha58Set('etaBco', calc.bco || '');
    alpha58Set('md', h.md || ''); alpha58Set('ld', h.ld || ''); alpha58Set('ldSign', h.ldSign || '+'); alpha58Set('ptc', h.ptc || ''); alpha58Set('pod', h.pod || pipe.trueOd || ''); alpha58Set('mt', h.mt || ''); alpha58Set('start', h.rodStart || '');
    alpha58Set('htpPipeSize', htp.pipeSize || ''); alpha58Set('htpMd', htp.md || ''); alpha58Set('htpLd', htp.ld || ''); alpha58Set('htpLdSign', htp.ldSign || '+'); alpha58Set('htpPtc', htp.ptc || '');
    alpha58Set('lsMd', ls.md || ''); alpha58Set('lsLd', ls.ld || ''); alpha58Set('lsLdSign', ls.ldSign || '+'); alpha58Set('lsPod', ls.pod || pipe.trueOd || ''); alpha58Set('lsTravel', ls.travel || ''); alpha58Set('lsMachineTravel', ls.machineTravel || '');
    alpha58Set('cpStart', cp.start || ''); alpha58Set('cpJbf', cp.jbf || ''); alpha58Set('cpLd', cp.ld || ''); alpha58Set('cpPt', cp.pt || '');
  }
  window.tapCalcLibraryLoadSelected = function alpha58LoadSelected() {
    try {
      const list = (window.getCombinedJobsForDisplay ? window.getCombinedJobsForDisplay() : []) || [];
      let selected = null;
      if (window.__tapcalcSelectedLibraryRecord) selected = { record: window.__tapcalcSelectedLibraryRecord };
      if (!selected && Number.isInteger(window.__tapcalcSelectedLibraryIndex)) selected = list[window.__tapcalcSelectedLibraryIndex] || null;
      if (!selected && typeof selectedJobId !== 'undefined') selected = list.find((job) => String(job.id) === String(selectedJobId || '')) || null;
      if (!selected || !selected.record) return false;
      const record = selected.record;
      const rebuilt = (typeof buildStateFromRecord === 'function') ? buildStateFromRecord(record) : (record.state || {});
      try { localStorage.setItem('measurementCardStateV1', JSON.stringify(rebuilt || {})); } catch {}
      try { if (typeof applyJobState === 'function') applyJobState(rebuilt || {}); } catch {}
      alpha58Hydrate(record);
      setTimeout(() => alpha58Hydrate(record), 0);
      setTimeout(() => alpha58Hydrate(record), 120);
      setTimeout(() => {
        try { if (typeof refreshBcoState === 'function') refreshBcoState(); } catch {}
        try { if (typeof updateBcoDisplays === 'function') updateBcoDisplays(); } catch {}
        try { if (typeof calculateIntegratedBco === 'function') calculateIntegratedBco({ silent:true }); } catch {}
        try { if (typeof calcHotTap === 'function') calcHotTap(); } catch {}
        try { if (typeof calcHtp === 'function') calcHtp(); } catch {}
        try { if (typeof calcLineStop === 'function') calcLineStop(); } catch {}
        try { if (typeof calcCompletionPlug === 'function') calcCompletionPlug(); } catch {}
        try { if (typeof updateJobInfoSummary === 'function') updateJobInfoSummary(); } catch {}
        try { if (typeof window.updateTapCalcShell === 'function') window.updateTapCalcShell(); } catch {}
      }, 160);
      try { if (typeof window.tapCalcSetScreen === 'function') window.tapCalcSetScreen('job'); else document.querySelector('.screen-tab[data-screen="job"]')?.click(); } catch {}
      return true;
    } catch (error) {
      console.error('alpha58 Load Job failed', error);
      return false;
    }
  };
})();


/* ===== 3.0.0-alpha59 audited library/load rewrite ===== */
(function(){
  const JOB_STATE_KEY_A59 = 'measurementCardStateV1';
  const stateFieldIdsA59 = [
    'jobClient','jobDescription','jobNumber','jobPressure','jobTemperature','jobDate','jobProduct','jobLocation','jobTechnician','jobNotes','machineType','operationType','geometryLockToggle',
    'bcoPipeMaterial','bcoPipeOD','bcoSchedule','bcoPipeID','bcoCutterOD',
    'md','ld','ldSign','ptc','pod','start','mt','valveBore','gtf','lugs',
    'htpPipeSize','htpMd','htpLd','htpLdSign','htpPtc','htpMachine',
    'lsMd','lsLd','lsLdSign','lsLiManualToggle','lsLiManual','lsTravel','lsMachineTravel',
    'cpStart','cpJbf','cpLd','cpPt','cpLiManualToggle','cpLiManual',
    'etaMachine','etaCutterSize','etaBco','etaRpmOverride'
  ];

  function a59Esc(v){
    return String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }
  function a59NormalizeDate(raw){
    raw = String(raw || '').trim();
    if (!raw) return '';
    const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}`;
    return raw;
  }
  function a59SetField(id, value){
    const el = document.getElementById(id);
    if (!el) return;
    const v = value == null ? '' : value;
    if (el.type === 'checkbox') el.checked = !!v;
    else el.value = String(v);
    try { el.dispatchEvent(new Event('input', { bubbles:true })); } catch {}
    try { el.dispatchEvent(new Event('change', { bubbles:true })); } catch {}
  }
  function a59CollectSelected(list){
    if (window.__tapcalcLibrarySelectedId) {
      const found = list.find(job => String(job.id) === String(window.__tapcalcLibrarySelectedId));
      if (found) return found;
    }
    try {
      const compact = window.matchMedia ? window.matchMedia('(max-width: 820px)').matches : window.innerWidth <= 820;
      const sharedVisible = document.querySelector('[data-library-lane-panel="shared"]')?.classList.contains('active');
      if (compact && sharedVisible) return null;
    } catch {}
    return list[0] || null;
  }
  function a59DeriveEtaMachine(machine){
    const m = String(machine || '');
    if (m.includes('360')) return '360';
    if (m.includes('660') || m.includes('760')) return '660';
    if (m.includes('1200')) return '1200';
    return '';
  }
  function a59ApplyVisibleFields(record){
    const job = record?.job || {};
    const pipe = record?.pipe || {};
    const machine = record?.machine || {};
    const calc = record?.calculations || {};
    const h = record?.measurements?.hotTap || {};
    const htp = record?.measurements?.htp || {};
    const ls = record?.measurements?.lineStop || {};
    const cp = record?.measurements?.completionPlug || {};
    const rawOp = String(record?.meta?.operationType || '').toLowerCase();
    const op = rawOp.includes('completion') ? 'Completion Plug' : rawOp.includes('line stop') ? 'Line Stop' : rawOp.includes('htp') ? 'HTP' : 'Hot Tap';

    a59SetField('jobClient', job.client || '');
    a59SetField('jobDescription', job.description || record?.meta?.title || '');
    a59SetField('jobNumber', job.jobNumber || '');
    a59SetField('jobDate', a59NormalizeDate(job.date || ''));
    a59SetField('jobLocation', job.location || '');
    a59SetField('jobTechnician', job.technician || '');
    a59SetField('jobPressure', job.pressure || '');
    a59SetField('jobTemperature', job.temperature || '');
    a59SetField('jobProduct', job.product || '');
    a59SetField('jobNotes', job.notes || '');
    a59SetField('machineType', machine.machine || '');
    a59SetField('operationType', op);
    a59SetField('bcoPipeMaterial', pipe.material || '');
    a59SetField('bcoPipeOD', pipe.nominalSize || '');
    a59SetField('bcoSchedule', pipe.schedule || '');
    a59SetField('bcoPipeID', pipe.pipeId || '');
    a59SetField('bcoCutterOD', machine.cutterOd || '');
    a59SetField('etaMachine', a59DeriveEtaMachine(machine.machine || ''));
    a59SetField('etaCutterSize', machine.cutterOd || '');
    a59SetField('etaBco', calc.bco || '');
    a59SetField('md', h.md || ''); a59SetField('ld', h.ld || ''); a59SetField('ldSign', h.ldSign || '+'); a59SetField('ptc', h.ptc || ''); a59SetField('pod', h.pod || pipe.trueOd || ''); a59SetField('mt', h.mt || ''); a59SetField('start', h.rodStart || '');
    a59SetField('htpPipeSize', htp.pipeSize || ''); a59SetField('htpMd', htp.md || ''); a59SetField('htpLd', htp.ld || ''); a59SetField('htpLdSign', htp.ldSign || '+'); a59SetField('htpPtc', htp.ptc || '');
    a59SetField('lsMd', ls.md || ''); a59SetField('lsLd', ls.ld || ''); a59SetField('lsLdSign', ls.ldSign || '+'); a59SetField('lsPod', ls.pod || pipe.trueOd || ''); a59SetField('lsTravel', ls.travel || ''); a59SetField('lsMachineTravel', ls.machineTravel || '');
    a59SetField('cpStart', cp.start || ''); a59SetField('cpJbf', cp.jbf || ''); a59SetField('cpLd', cp.ld || ''); a59SetField('cpPt', cp.pt || '');
  }
  function a59ApplyState(state){
    if (!state || typeof state !== 'object') return;
    stateFieldIdsA59.forEach(id => {
      if (!(id in state)) return;
      a59SetField(id, state[id]);
    });
    if (state.activeMode && typeof window.setMode === 'function') {
      try { window.setMode(state.activeMode); } catch {}
    }
  }
  function a59Recalc(){
    try { if (typeof refreshBcoState === 'function') refreshBcoState(); } catch {}
    try { if (typeof updateBcoDisplays === 'function') updateBcoDisplays(); } catch {}
    try { if (typeof calculateIntegratedBco === 'function') calculateIntegratedBco({ silent:true }); } catch {}
    try { if (typeof calcHotTap === 'function') calcHotTap(); } catch {}
    try { if (typeof calcHtp === 'function') calcHtp(); } catch {}
    try { if (typeof calcLineStop === 'function') calcLineStop(); } catch {}
    try { if (typeof calcCompletionPlug === 'function') calcCompletionPlug(); } catch {}
    try { if (typeof initEtaCalculator === 'function') initEtaCalculator(); } catch {}
    try { if (typeof syncBcoToEta === 'function') syncBcoToEta({ force:true }); } catch {}
    try { if (typeof updateEtaEstimate === 'function') updateEtaEstimate(); } catch {}
    try { if (typeof updateJobInfoSummary === 'function') updateJobInfoSummary(); } catch {}
    try { if (typeof window.updateTapCalcShell === 'function') window.updateTapCalcShell(); } catch {}
  }
  function a59RenderDetails(entry){
    const detailsEl = document.getElementById('jobsList');
    if (!detailsEl) return;
    if (!entry || !entry.record) {
      detailsEl.innerHTML = '<div class="jobs-library-empty">Select a job from the list to view its details.</div>';
      return;
    }
    const record = entry.record;
    const title = record?.meta?.title || record?.job?.description || record?.job?.jobNumber || 'Saved Job';
    const sourceLabel = entry.source === 'local' ? 'Local only' : entry.source === 'synced' ? 'Synced' : 'Shared DB';
    const savedAtDisplay = record?.meta?.savedAtDisplay || entry.savedAt || '—';
    detailsEl.innerHTML = `
      <div class="job-detail-header">
        <div>
          <div class="job-detail-title">${a59Esc(title)}</div>
          <div class="job-detail-subtitle">${a59Esc(savedAtDisplay)} • ${a59Esc(record?.meta?.operationType || 'Job')} • ${a59Esc(sourceLabel)}</div>
        </div>
        <div class="job-record-badges"><span class="job-source-badge ${a59Esc(entry.source)}">${a59Esc(sourceLabel)}</span></div>
      </div>
      <div class="job-detail-actions"><button type="button" id="jobsLoadSelectedBtn" class="secondary-btn" onclick="return window.tapCalcForceLoadSelectedJob && window.tapCalcForceLoadSelectedJob();">Load Job</button></div>
      ${typeof renderJobRecordDetails === 'function' ? renderJobRecordDetails(record) : ''}
    `;
    detailsEl.querySelector('#jobsLoadSelectedBtn')?.addEventListener('click', () => window.tapCalcLibraryLoadSelected());
  }
  function a59RenderLibrary(){
    const listEl = document.getElementById('jobsSelect');
    const metaEl = document.getElementById('jobsResultsMeta');
    const detailsEl = document.getElementById('jobsList');
    const jobs = (window.getCombinedJobsForDisplay ? window.getCombinedJobsForDisplay() : []) || [];
    if (metaEl) metaEl.textContent = jobs.length ? `${jobs.length} job${jobs.length===1?'':'s'} found` : 'No jobs found';
    if (!listEl) return;
    if (!jobs.length) {
      listEl.innerHTML = '<div class="jobs-library-empty">No jobs match this search yet.</div>';
      if (detailsEl) detailsEl.innerHTML = '<div class="jobs-library-empty">Select a job from the list to view its details.</div>';
      window.__tapcalcLibrarySelectedId = '';
      window.__tapcalcLibrarySelectedRecord = null;
      return;
    }
    const selected = a59CollectSelected(jobs);
    window.__tapcalcLibrarySelectedId = selected ? String(selected.id) : '';
    window.__tapcalcLibrarySelectedRecord = selected?.record || null;
    listEl.innerHTML = jobs.map((job) => {
      const active = String(job.id) === String(window.__tapcalcLibrarySelectedId || '');
      const record = job.record || {};
      const title = record?.meta?.title || record?.job?.description || record?.job?.jobNumber || 'Saved Job';
      const sub = [record?.job?.client || '—', record?.job?.location || '—', record?.meta?.savedAtDisplay || job.savedAt || '—'].join(' • ');
      return `<button type="button" class="jobs-list-item${active ? ' active' : ''}" data-job-id="${a59Esc(job.id)}" aria-selected="${active ? 'true' : 'false'}"><span class="jobs-list-item-title">${a59Esc(title)}</span><span class="jobs-list-item-meta">${a59Esc(sub)}</span></button>`;
    }).join('');
    listEl.querySelectorAll('.jobs-list-item[data-job-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        window.__tapcalcLibrarySelectedId = String(btn.dataset.jobId || '');
        const entry = jobs.find(job => String(job.id) === String(window.__tapcalcLibrarySelectedId));
        window.__tapcalcLibrarySelectedRecord = entry?.record || null;
        a59RenderLibrary();
      });
    });
    a59RenderDetails(selected);
  }

  window.tapCalcLibraryLoadSelected = function alpha59LoadSelected(){
    try {
      const jobs = (window.getCombinedJobsForDisplay ? window.getCombinedJobsForDisplay() : []) || [];
      const entry = jobs.find(job => String(job.id) === String(window.__tapcalcLibrarySelectedId || '')) || null;
      const record = entry?.record || window.__tapcalcLibrarySelectedRecord || null;
      if (!record) return false;
      const state = (record.state && typeof record.state === 'object' && Object.keys(record.state).length)
        ? { ...record.state }
        : (typeof buildStateFromRecord === 'function' ? buildStateFromRecord(record) : {});
      a59ApplyState(state || {});
      a59ApplyVisibleFields(record);
      try { localStorage.setItem(JOB_STATE_KEY_A59, JSON.stringify(state || {})); } catch {}
      a59Recalc();
      setTimeout(() => { a59ApplyVisibleFields(record); a59Recalc(); }, 80);
      setTimeout(() => { a59ApplyVisibleFields(record); a59Recalc(); }, 220);
      try {
        if (typeof window.tapCalcSetScreen === 'function') window.tapCalcSetScreen('job');
        else document.querySelector('.screen-tab[data-screen="job"]')?.click();
      } catch {}
      return true;
    } catch (error) {
      console.error('alpha59 Load Job failed', error);
      return false;
    }
  };

  window.tapCalcLibrarySelect = function(id){
    window.__tapcalcLibrarySelectedId = String(id || '');
    a59RenderLibrary();
    return true;
  };
  window.renderJobsList = a59RenderLibrary;
  window.renderSelectedJobDetails = function(){ a59RenderLibrary(); };
  window.updateJobsListSelectionUI = function(){ a59RenderLibrary(); };
  document.addEventListener('DOMContentLoaded', () => setTimeout(a59RenderLibrary, 50));
  setTimeout(a59RenderLibrary, 200);
})();


// alpha60 force-reload Load Job path
(function(){
  function alpha60GetSelectedRecord() {
    try {
      if (typeof window.getCombinedJobsForDisplay === 'function') {
        const list = window.getCombinedJobsForDisplay() || [];
        const selectedId = (typeof selectedJobId !== 'undefined' ? String(selectedJobId || '') : '');
        const selected = list.find((job) => String(job.id) === selectedId) || list[0];
        return selected && selected.record ? selected.record : null;
      }
    } catch (error) {
      console.error('alpha60 get selected record failed', error);
    }
    return null;
  }

  function alpha60PersistAndReload(record) {
    const state = (typeof buildStateFromRecord === 'function') ? buildStateFromRecord(record) : (record && record.state ? record.state : null);
    if (!state || typeof state !== 'object') {
      console.warn('alpha60: no loadable state found for selected record');
      return;
    }
    try {
      localStorage.setItem(JOB_STATE_KEY, JSON.stringify(state));
      localStorage.setItem('tapcalcV3Screen', 'job');
      localStorage.setItem('tapcalcV3LoadedFromLibrary', '1');
    } catch (error) {
      console.error('alpha60 persist failed', error);
      return;
    }
    try {
      window.location.reload();
    } catch (error) {
      console.error('alpha60 reload failed', error);
    }
  }

  window.loadSelectedLibraryJob = function alpha60LoadSelectedLibraryJob() {
    const record = alpha60GetSelectedRecord();
    if (!record) return;
    alpha60PersistAndReload(record);
  };
  window.alpha47LoadSelectedLibraryJob = window.loadSelectedLibraryJob;
})();



/* ===== 3.0.0-alpha61 pending-load restore override ===== */
(function(){
  const PENDING_LOAD_KEY = 'tapcalcPendingLoadedRecordV1';
  function tc61SafeParse(raw){ try { return JSON.parse(raw); } catch { return null; } }
  function tc61Set(id, value){
    const el = document.getElementById(id);
    if (!el) return false;
    if (el.type === 'checkbox') el.checked = !!value;
    else el.value = value ?? '';
    try { el.dispatchEvent(new Event('input', { bubbles:true })); } catch {}
    try { el.dispatchEvent(new Event('change', { bubbles:true })); } catch {}
    return true;
  }
  function tc61ApplyRecord(record){
    if (!record || typeof record !== 'object') return false;
    const state = (record.state && typeof record.state === 'object' && Object.keys(record.state).length)
      ? { ...record.state }
      : (typeof buildStateFromRecord === 'function' ? buildStateFromRecord(record) : {});
    try {
      if (state && typeof applyJobState === 'function') applyJobState(state);
    } catch {}
    try {
      if (state && typeof state === 'object') localStorage.setItem('measurementCardStateV1', JSON.stringify(state));
    } catch {}
    const job = record.job || {};
    const pipe = record.pipe || {};
    const machine = record.machine || {};
    const calc = record.calculations || {};
    const rawOp = String(record?.meta?.operationType || '').toLowerCase();
    const op = rawOp.includes('completion') ? 'Completion Plug' : rawOp.includes('line stop') ? 'Line Stop' : rawOp.includes('htp') ? 'HTP' : 'Hot Tap';
    const mapping = {
      jobClient: job.client || '',
      jobDescription: job.description || record?.meta?.title || '',
      jobNumber: job.jobNumber || '',
      jobDate: job.date || '',
      jobLocation: job.location || '',
      jobTechnician: job.technician || '',
      jobPressure: job.pressure || '',
      jobTemperature: job.temperature || '',
      jobProduct: job.product || '',
      jobNotes: job.notes || '',
      machineType: machine.machine || '',
      operationType: op,
      bcoPipeMaterial: pipe.material || '',
      bcoPipeOD: pipe.nominalSize || '',
      bcoSchedule: pipe.schedule || '',
      bcoPipeID: pipe.pipeId || '',
      bcoCutterOD: machine.cutterOd || '',
      etaMachine: (typeof a59DeriveEtaMachine === 'function' ? a59DeriveEtaMachine(machine.machine || '') : (machine.machine || '')),
      etaCutterSize: machine.cutterOd || '',
      etaBco: calc.bco || ''
    };
    Object.entries(mapping).forEach(([id,val]) => tc61Set(id,val));
    try { if (typeof refreshBcoState === 'function') refreshBcoState(); } catch {}
    try { if (typeof updateBcoDisplays === 'function') updateBcoDisplays(); } catch {}
    try { if (typeof calculateIntegratedBco === 'function') calculateIntegratedBco({silent:true}); } catch {}
    try { if (typeof calcHotTap === 'function') calcHotTap(); } catch {}
    try { if (typeof calcHtp === 'function') calcHtp(); } catch {}
    try { if (typeof calcLineStop === 'function') calcLineStop(); } catch {}
    try { if (typeof calcCompletionPlug === 'function') calcCompletionPlug(); } catch {}
    try { if (typeof initEtaCalculator === 'function') initEtaCalculator(); } catch {}
    try { if (typeof syncBcoToEta === 'function') syncBcoToEta({force:true}); } catch {}
    try { if (typeof updateEtaEstimate === 'function') updateEtaEstimate(); } catch {}
    try { if (typeof updateJobInfoSummary === 'function') updateJobInfoSummary(); } catch {}
    try { if (typeof window.updateTapCalcShell === 'function') window.updateTapCalcShell(); } catch {}
    return true;
  }
  function tc61ApplyPending(){
    const raw = localStorage.getItem(PENDING_LOAD_KEY);
    if (!raw) return false;
    const record = tc61SafeParse(raw);
    if (!record) { localStorage.removeItem(PENDING_LOAD_KEY); return false; }
    // apply multiple times to beat old listeners/restore paths
    tc61ApplyRecord(record);
    setTimeout(() => tc61ApplyRecord(record), 60);
    setTimeout(() => tc61ApplyRecord(record), 220);
    setTimeout(() => tc61ApplyRecord(record), 600);
    try { localStorage.removeItem(PENDING_LOAD_KEY); } catch {}
    try { if (typeof window.tapCalcSetScreen === 'function') window.tapCalcSetScreen('job'); } catch {}
    return true;
  }
  window.tapCalcLibraryLoadSelected = function alpha61LoadSelected(){
    const record = window.__tapcalcLibrarySelectedRecord || null;
    if (!record) return false;
    try {
      localStorage.setItem(PENDING_LOAD_KEY, JSON.stringify(record));
      localStorage.setItem('tapcalcV3Screen', 'job');
    } catch {}
    // apply immediately for same-page success, then hard navigate to same page for clean restore
    tc61ApplyRecord(record);
    setTimeout(() => tc61ApplyRecord(record), 40);
    setTimeout(() => {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('loaded', 'alpha61');
        url.hash = '#current';
        window.location.assign(url.toString());
      } catch {
        try { window.location.reload(); } catch {}
      }
    }, 120);
    return true;
  };
  document.addEventListener('DOMContentLoaded', () => setTimeout(tc61ApplyPending, 150));
  window.addEventListener('load', () => setTimeout(tc61ApplyPending, 250));
})();



/* ===== 3.0.0-alpha62 unified load-job fix ===== */
(function(){
  function tc62FindSelectedEntry() {
    try {
      const list = (typeof window.getCombinedJobsForDisplay === 'function' ? window.getCombinedJobsForDisplay() : []) || [];
      const candidates = [
        window.__tapcalcLibrarySelectedId,
        typeof selectedJobId !== 'undefined' ? selectedJobId : '',
        window.__tapcalcSelectedLibraryId,
      ].map(v => String(v || '')).filter(Boolean);
      for (const id of candidates) {
        const found = list.find(job => String(job?.id || '') === id);
        if (found && found.record) return found;
      }
      if (window.__tapcalcLibrarySelectedRecord) return { record: window.__tapcalcLibrarySelectedRecord };
      if (window.__tapcalcSelectedLibraryRecord) return { record: window.__tapcalcSelectedLibraryRecord };
      if (Number.isInteger(window.__tapcalcSelectedLibraryIndex) && list[window.__tapcalcSelectedLibraryIndex]) {
        return list[window.__tapcalcSelectedLibraryIndex];
      }
      const first = list[0];
      return first && first.record ? first : null;
    } catch (error) {
      console.error('alpha62 find selected entry failed', error);
      return null;
    }
  }

  function tc62RunRecalc() {
    try { if (typeof refreshBcoState === 'function') refreshBcoState(); } catch {}
    try { if (typeof updateBcoDisplays === 'function') updateBcoDisplays(); } catch {}
    try { if (typeof calculateIntegratedBco === 'function') calculateIntegratedBco({ silent:true }); } catch {}
    try { if (typeof calcHotTap === 'function') calcHotTap(); } catch {}
    try { if (typeof calcHtp === 'function') calcHtp(); } catch {}
    try { if (typeof calcLineStop === 'function') calcLineStop(); } catch {}
    try { if (typeof calcCompletionPlug === 'function') calcCompletionPlug(); } catch {}
    try { if (typeof initEtaCalculator === 'function') initEtaCalculator(); } catch {}
    try { if (typeof syncBcoToEta === 'function') syncBcoToEta({ force:true }); } catch {}
    try { if (typeof updateEtaEstimate === 'function') updateEtaEstimate(); } catch {}
    try { if (typeof updateJobInfoSummary === 'function') updateJobInfoSummary(); } catch {}
    try { if (typeof window.updateTapCalcShell === 'function') window.updateTapCalcShell(); } catch {}
  }

  function tc62LoadRecord(record) {
    if (!record || typeof record !== 'object') return false;
    try {
      const state = (typeof buildStateFromRecord === 'function') ? buildStateFromRecord(record) : (record.state || {});
      if (state && typeof applyJobState === 'function') applyJobState(state);
      try { localStorage.setItem('measurementCardStateV1', JSON.stringify(state || {})); } catch {}
      if (typeof loadRecordIntoCalculator === 'function') {
        loadRecordIntoCalculator(record, { message: true });
      } else {
        tc62RunRecalc();
      }
      setTimeout(tc62RunRecalc, 80);
      setTimeout(tc62RunRecalc, 220);
      setTimeout(tc62RunRecalc, 500);
      try {
        if (typeof window.tapCalcSetScreen === 'function') window.tapCalcSetScreen('job');
        else document.querySelector('.screen-tab[data-screen="job"]')?.click();
      } catch {}
      return true;
    } catch (error) {
      console.error('alpha62 load record failed', error);
      return false;
    }
  }

  window.tapCalcLibraryLoadSelected = function alpha62LoadSelected(){
    const entry = tc62FindSelectedEntry();
    const record = entry?.record || null;
    if (!record) {
      console.warn('alpha62 Load Job: no selected record found');
      return false;
    }
    window.__tapcalcLibrarySelectedRecord = record;
    if (entry?.id != null) {
      window.__tapcalcLibrarySelectedId = String(entry.id);
      try { selectedJobId = String(entry.id); } catch {}
    }
    return tc62LoadRecord(record);
  };

  window.loadSelectedLibraryJob = window.tapCalcLibraryLoadSelected;
})();


/* ===== 3.0.0-alpha65 forced load-job hydration + version pass ===== */
(function(){
  const TC63_VERSION = '3.0.0-alpha126';

  function tc63SetValue(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === 'checkbox') {
      el.checked = !!value;
    } else {
      el.value = value == null ? '' : String(value);
    }
    try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch {}
    try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch {}
  }

  function tc63BuildState(record) {
    try {
      if (typeof buildStateFromRecord === 'function') return buildStateFromRecord(record) || {};
    } catch (error) {
      console.error('alpha63 build state failed', error);
    }
    return { ...(record?.state || {}) };
  }

  function tc63FindSelectedEntry() {
    try {
      const list = (typeof window.getCombinedJobsForDisplay === 'function' ? window.getCombinedJobsForDisplay() : []) || [];
      const wanted = [
        window.__tapcalcLibrarySelectedId,
        typeof selectedJobId !== 'undefined' ? selectedJobId : '',
        window.__tapcalcSelectedLibraryId,
      ].map(v => String(v || '')).filter(Boolean);
      for (const id of wanted) {
        const found = list.find(job => String(job?.id || '') === id);
        if (found?.record) return found;
      }
      if (window.__tapcalcLibrarySelectedRecord) return { id: window.__tapcalcLibrarySelectedId || '', record: window.__tapcalcLibrarySelectedRecord };
      if (window.__tapcalcSelectedLibraryRecord) return { id: window.__tapcalcSelectedLibraryId || '', record: window.__tapcalcSelectedLibraryRecord };
      return null;
    } catch (error) {
      console.error('alpha63 find selected entry failed', error);
      return null;
    }
  }

  function tc63Hydrate(record) {
    if (!record || typeof record !== 'object') return false;
    const state = tc63BuildState(record);
    try { localStorage.setItem('measurementCardStateV1', JSON.stringify(state || {})); } catch {}

    try { if (typeof applyJobState === 'function') applyJobState(state); } catch (error) { console.error('alpha63 applyJobState failed', error); }

    const directMap = {
      jobClient: state.jobClient ?? record?.job?.client ?? '',
      jobDescription: state.jobDescription ?? record?.job?.description ?? '',
      jobNumber: state.jobNumber ?? record?.job?.jobNumber ?? '',
      jobPressure: state.jobPressure ?? record?.job?.pressure ?? '',
      jobTemperature: state.jobTemperature ?? record?.job?.temperature ?? '',
      jobDate: state.jobDate ?? record?.job?.date ?? '',
      jobProduct: state.jobProduct ?? record?.job?.product ?? '',
      jobLocation: state.jobLocation ?? record?.job?.location ?? '',
      jobTechnician: state.jobTechnician ?? record?.job?.technician ?? '',
      jobNotes: state.jobNotes ?? record?.job?.notes ?? '',
      machineType: state.machineType ?? record?.machine?.machine ?? '',
      operationType: state.operationType ?? record?.meta?.operationType ?? '',
      geometryLockToggle: !!state.geometryLockToggle,
      bcoPipeMaterial: state.bcoPipeMaterial ?? record?.pipe?.material ?? '',
      bcoPipeOD: state.bcoPipeOD ?? record?.pipe?.nominalSize ?? '',
      bcoSchedule: state.bcoSchedule ?? record?.pipe?.schedule ?? '',
      bcoPipeID: state.bcoPipeID ?? record?.pipe?.pipeId ?? '',
      bcoCutterOD: state.bcoCutterOD ?? record?.machine?.cutterOd ?? '',
      md: state.md ?? record?.measurements?.hotTap?.md ?? '',
      ld: state.ld ?? record?.measurements?.hotTap?.ld ?? '',
      ldSign: state.ldSign ?? record?.measurements?.hotTap?.ldSign ?? '+',
      ptc: state.ptc ?? record?.measurements?.hotTap?.ptc ?? '',
      pod: state.pod ?? record?.measurements?.hotTap?.pod ?? '',
      start: state.start ?? record?.measurements?.hotTap?.rodStart ?? '',
      mt: state.mt ?? record?.measurements?.hotTap?.mt ?? '',
      htpPipeSize: state.htpPipeSize ?? record?.measurements?.htp?.pipeSize ?? '',
      htpMd: state.htpMd ?? record?.measurements?.htp?.md ?? '',
      htpLd: state.htpLd ?? record?.measurements?.htp?.ld ?? '',
      htpLdSign: state.htpLdSign ?? record?.measurements?.htp?.ldSign ?? '+',
      htpPtc: state.htpPtc ?? record?.measurements?.htp?.ptc ?? '',
      lsMd: state.lsMd ?? record?.measurements?.lineStop?.md ?? '',
      lsLd: state.lsLd ?? record?.measurements?.lineStop?.ld ?? '',
      lsLdSign: state.lsLdSign ?? record?.measurements?.lineStop?.ldSign ?? '+',
      lsPod: state.lsPod ?? record?.measurements?.lineStop?.pod ?? '',
      lsTravel: state.lsTravel ?? record?.measurements?.lineStop?.travel ?? '',
      lsMachineTravel: state.lsMachineTravel ?? record?.measurements?.lineStop?.machineTravel ?? '',
      cpStart: state.cpStart ?? record?.measurements?.completionPlug?.start ?? '',
      cpJbf: state.cpJbf ?? record?.measurements?.completionPlug?.jbf ?? '',
      cpLd: state.cpLd ?? record?.measurements?.completionPlug?.ld ?? '',
      cpPt: state.cpPt ?? record?.measurements?.completionPlug?.pt ?? '',
      etaMachine: state.etaMachine ?? '',
      etaCutterSize: state.etaCutterSize ?? record?.machine?.cutterOd ?? '',
      etaBco: state.etaBco ?? record?.calculations?.bco ?? ''
    };

    Object.entries(directMap).forEach(([id, value]) => tc63SetValue(id, value));

    if (state.activeMode) {
      try { if (typeof window.setMode === 'function') window.setMode(state.activeMode); } catch {}
    }
    try { if (typeof setGeometryLocked === 'function') setGeometryLocked(!!state.geometryLockToggle); } catch {}

    const rerun = () => {
      Object.entries(directMap).forEach(([id, value]) => tc63SetValue(id, value));
      try { if (typeof refreshBcoState === 'function') refreshBcoState(); } catch {}
      try { if (typeof updateBcoDisplays === 'function') updateBcoDisplays(); } catch {}
      try { if (typeof calculateIntegratedBco === 'function') calculateIntegratedBco({ silent: true }); } catch {}
      try { if (typeof calcHotTap === 'function') calcHotTap(); } catch {}
      try { if (typeof calcHtp === 'function') calcHtp(); } catch {}
      try { if (typeof calcLineStop === 'function') calcLineStop(); } catch {}
      try { if (typeof calcCompletionPlug === 'function') calcCompletionPlug(); } catch {}
      try { if (typeof initEtaCalculator === 'function') initEtaCalculator(); } catch {}
      try { if (typeof syncBcoToEta === 'function') syncBcoToEta({ force: true }); } catch {}
      try { if (typeof updateEtaEstimate === 'function') updateEtaEstimate(); } catch {}
      try { if (typeof persistCurrentJob === 'function') persistCurrentJob(); } catch {}
      try { if (typeof updateJobInfoSummary === 'function') updateJobInfoSummary(); } catch {}
      try { if (typeof window.updateTapCalcShell === 'function') window.updateTapCalcShell(); } catch {}
      try {
        const title = state.jobDescription || state.jobNumber || state.jobClient || record?.meta?.title || 'Loaded Job';
        const currentJobNameEl = document.getElementById('jobsCurrentJobName');
        if (currentJobNameEl) currentJobNameEl.textContent = title;
      } catch {}
    };

    rerun();
    setTimeout(rerun, 60);
    setTimeout(rerun, 180);
    setTimeout(rerun, 450);

    try {
      localStorage.setItem('tapcalcV3Screen', 'job');
      const jobTab = document.querySelector('.screen-tab[data-screen="job"]');
      jobTab?.click();
      if (typeof window.tapCalcSetScreen === 'function') window.tapCalcSetScreen('job');
    } catch {}

    try {
      const statusEl = document.getElementById('jobsCloudStatus');
      if (statusEl) statusEl.textContent = `Loaded ${record?.meta?.title || state.jobDescription || state.jobNumber || 'saved job'} into TapCalc.`;
    } catch {}
    return true;
  }

  window.tapCalcLibraryLoadSelected = function alpha63LoadSelected(){
    const entry = tc63FindSelectedEntry();
    const record = entry?.record || null;
    if (!record) {
      console.warn('alpha63 Load Job: no selected record found');
      return false;
    }
    window.__tapcalcLibrarySelectedRecord = record;
    if (entry?.id != null) {
      window.__tapcalcLibrarySelectedId = String(entry.id);
      try { selectedJobId = String(entry.id); } catch {}
    }
    return tc63Hydrate(record);
  };

  window.loadSelectedLibraryJob = window.tapCalcLibraryLoadSelected;

  function tc64LoadSelectedFromAnySource() {
    let entry = null;
    try { entry = tc63FindSelectedEntry(); } catch {}
    if (!entry?.record) {
      try {
        const list = (typeof window.getCombinedJobsForDisplay === 'function' ? window.getCombinedJobsForDisplay() : []) || [];
        const activeBtn = document.querySelector('#jobsSelect .jobs-list-item.active[data-job-id], #jobsSelect [data-job-id][aria-selected="true"], #jobsSelect [data-job-id][aria-pressed="true"]');
        const domId = String(activeBtn?.dataset?.jobId || window.__tapcalcLibrarySelectedId || '').trim();
        if (domId) entry = list.find(job => String(job?.id || '') === domId) || null;
        if (!entry?.record && list.length) entry = list[0];
      } catch {}
    }
    if (!entry?.record) {
      try {
        const statusEl = document.getElementById('jobsCloudStatus');
        if (statusEl) statusEl.textContent = 'Load Job failed: no selected library record found.';
      } catch {}
      return false;
    }
    try {
      window.__tapcalcLibrarySelectedRecord = entry.record;
      window.__tapcalcLibrarySelectedId = String(entry.id || '');
      if (typeof selectedJobId !== 'undefined') selectedJobId = String(entry.id || '');
    } catch {}
    try {
      if (typeof loadRecordIntoCalculator === 'function') {
        loadRecordIntoCalculator(entry.record, { switchScreen: true, skipPersist: false });
      }
    } catch (error) {
      console.error('alpha64 loadRecordIntoCalculator failed', error);
    }
    try { tc63Hydrate(entry.record); } catch (error) { console.error('alpha64 tc63Hydrate failed', error); }
    try {
      localStorage.setItem('tapcalcV3Screen', 'job');
      document.querySelector('.screen-tab[data-screen="job"]')?.click();
      if (typeof window.tapCalcSetScreen === 'function') window.tapCalcSetScreen('job');
    } catch {}
    try {
      const statusEl = document.getElementById('jobsCloudStatus');
      if (statusEl) statusEl.textContent = `Loaded ${entry.record?.meta?.title || entry.record?.job?.description || entry.record?.job?.jobNumber || 'saved job'} into Current.`;
    } catch {}
    return true;
  }

  window.tapCalcLibraryLoadSelected = function alpha64LoadSelected(){
    return tc64LoadSelectedFromAnySource();
  };
  window.loadSelectedLibraryJob = window.tapCalcLibraryLoadSelected;
  window.tapCalcForceLoadSelectedJob = tc64LoadSelectedFromAnySource;

  function tc64HandleLoadTap(event) {
    const btn = event.target.closest('#jobsLoadSelectedBtn');
    if (!btn) return;
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    tc64LoadSelectedFromAnySource();
  }

  document.addEventListener('click', tc64HandleLoadTap, true);
  document.addEventListener('pointerup', tc64HandleLoadTap, true);
  document.addEventListener('touchend', tc64HandleLoadTap, true);

  const _renderSelectedJobDetailsAlpha64 = window.renderSelectedJobDetails;
  window.renderSelectedJobDetails = function alpha64RenderSelectedJobDetails(){
    const result = typeof _renderSelectedJobDetailsAlpha64 === 'function' ? _renderSelectedJobDetailsAlpha64.apply(this, arguments) : undefined;
    try {
      const btn = document.getElementById('jobsLoadSelectedBtn');
      if (btn) {
        btn.setAttribute('onclick', 'return window.tapCalcForceLoadSelectedJob && window.tapCalcForceLoadSelectedJob();');
        btn.dataset.alpha64Bound = 'true';
      }
    } catch {}
    return result;
  };
})();


/* ===== 3.0.0-alpha65 jobs/library cleanup base ===== */
(function(){
  const VERSION = '3.0.0-alpha126';

  function tc65GetJobs() {
    try {
      const list = (typeof window.getCombinedJobsForDisplay === 'function' ? window.getCombinedJobsForDisplay() : []) || [];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  function tc65FindSelectedEntry() {
    const list = tc65GetJobs();
    if (!list.length) return null;
    const domActive = document.querySelector('#jobsSelect .jobs-list-item.active[data-job-id], #jobsSelect [data-job-id][aria-selected="true"], #jobsSelect [data-job-id][aria-pressed="true"]');
    const selectedId = String(domActive?.dataset?.jobId || window.__tapcalcLibrarySelectedId || (typeof selectedJobId !== 'undefined' ? selectedJobId : '') || '').trim();
    const found = selectedId ? list.find((job) => String(job?.id || '') === selectedId) : null;
    return found || list[0] || null;
  }

  function tc65SyncSelection(entry) {
    if (!entry) return;
    try { window.__tapcalcLibrarySelectedRecord = entry.record || null; } catch {}
    try { window.__tapcalcLibrarySelectedId = String(entry.id || ''); } catch {}
    try { if (typeof selectedJobId !== 'undefined') selectedJobId = String(entry.id || ''); } catch {}
    try {
      document.querySelectorAll('#jobsSelect .jobs-list-item[data-job-id]').forEach((item) => {
        const active = String(item.dataset.jobId || '') === String(entry.id || '');
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    } catch {}
  }

  function tc65LoadSelected() {
    const entry = tc65FindSelectedEntry();
    if (!entry?.record) {
      try {
        const statusEl = document.getElementById('jobsCloudStatus');
        if (statusEl) statusEl.textContent = 'Load Job failed: no selected library record found.';
      } catch {}
      return false;
    }
    tc65SyncSelection(entry);
    try {
      if (typeof loadRecordIntoCalculator === 'function') loadRecordIntoCalculator(entry.record, { switchScreen: true, skipPersist: false });
    } catch (error) {
      console.error('alpha65 loadRecordIntoCalculator failed', error);
      return false;
    }
    try {
      localStorage.setItem('tapcalcV3Screen', 'job');
      document.querySelector('.screen-tab[data-screen="job"]')?.click();
      if (typeof window.tapCalcSetScreen === 'function') window.tapCalcSetScreen('job');
    } catch {}
    try {
      const statusEl = document.getElementById('jobsCloudStatus');
      if (statusEl) statusEl.textContent = `Loaded ${entry.record?.meta?.title || entry.record?.job?.description || entry.record?.job?.jobNumber || 'saved job'} into Current.`;
    } catch {}
    return true;
  }

  function tc65BindLoadButton() {
    const btn = document.getElementById('jobsLoadSelectedBtn');
    if (!btn) return;
    const fresh = btn.cloneNode(true);
    fresh.removeAttribute('onclick');
    fresh.dataset.tc65Bound = 'true';
    btn.replaceWith(fresh);
    const handler = (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
      tc65LoadSelected();
      return false;
    };
    fresh.addEventListener('click', handler, { capture: true });
    fresh.addEventListener('pointerup', handler, { capture: true });
    fresh.addEventListener('touchend', handler, { capture: true });
  }

  function tc65RenderDetails() {
    const detailsEl = document.getElementById('jobsList');
    if (!detailsEl) return;
    const entry = tc65FindSelectedEntry();
    if (!entry?.record) {
      detailsEl.innerHTML = '<div class="jobs-library-empty">Select a job from the list to view its details.</div>';
      return;
    }
    tc65SyncSelection(entry);
    const record = entry.record || {};
    const title = record?.meta?.title || record?.job?.jobDescription || record?.job?.description || record?.job?.jobNumber || 'Saved Job';
    const sourceLabel = entry.source === 'local' ? 'Local only' : entry.source === 'synced' ? 'Synced' : 'Shared DB';
    const savedAtDisplay = record?.meta?.savedAtDisplay || record?.savedAt || '—';
    const warnings = [
      ...(record?.warnings?.hotTap || []),
      ...(record?.warnings?.lineStop || []),
      ...(record?.warnings?.completionPlug || [])
    ].filter(Boolean);
    const detailsHtml = typeof renderJobRecordDetails === 'function' ? renderJobRecordDetails(record) : '';
    detailsEl.innerHTML = `
      <div class="job-detail-header">
        <div>
          <div class="job-detail-title">${title}</div>
          <div class="job-detail-subtitle">${savedAtDisplay} • ${record?.meta?.operationType || 'Job'} • ${sourceLabel}</div>
        </div>
        <div class="job-record-badges">
          <span class="job-source-badge ${entry.source}">${sourceLabel}</span>
        </div>
      </div>
      <div class="job-detail-actions">
        <button type="button" id="jobsLoadSelectedBtn" class="secondary-btn">Load Job</button>
      </div>
      ${detailsHtml}
      <div class="job-detail-grid">
        <div><strong>Saved:</strong> ${savedAtDisplay}</div>
        <div><strong>Date:</strong> ${record?.job?.date || '—'}</div>
        <div><strong>Job Description:</strong> ${record?.job?.description || '—'}</div>
        <div><strong>Warnings:</strong> ${warnings.length ? warnings.join(' | ') : 'None'}</div>
      </div>`;
    tc65BindLoadButton();
  }

  const originalRenderJobsList = typeof window.renderJobsList === 'function' ? window.renderJobsList : null;
  window.renderJobsList = function alpha65RenderJobsList(){
    const result = originalRenderJobsList ? originalRenderJobsList.apply(this, arguments) : undefined;
    tc65RenderDetails();
    return result;
  };

  window.renderSelectedJobDetails = function alpha65RenderSelectedJobDetails(){
    tc65RenderDetails();
    return true;
  };

  window.tapCalcLibraryLoadSelected = tc65LoadSelected;
  window.loadSelectedLibraryJob = tc65LoadSelected;
  window.tapCalcForceLoadSelectedJob = tc65LoadSelected;

  document.addEventListener('click', (event) => {
    const row = event.target.closest('#jobsSelect .jobs-list-item[data-job-id]');
    if (!row) return;
    const list = tc65GetJobs();
    const entry = list.find((job) => String(job?.id || '') === String(row.dataset.jobId || '')) || null;
    if (!entry) return;
    tc65SyncSelection(entry);
    setTimeout(tc65RenderDetails, 0);
  }, true);

  const detailsEl = document.getElementById('jobsList');
  if (detailsEl) {
    const observer = new MutationObserver(() => {
      const btn = document.getElementById('jobsLoadSelectedBtn');
      if (btn && btn.dataset.tc65Bound !== 'true') tc65BindLoadButton();
    });
    observer.observe(detailsEl, { childList: true, subtree: true });
  }

  setTimeout(() => {
    try {
      const badge = document.querySelector('.version-badge');
      if (badge) badge.textContent = `TapCalc Dev ${VERSION} · 2026-04-07`;
      const title = document.querySelector('.top-app-title');
      if (title) title.textContent = `TapCalc Dev ${VERSION} · 2026-04-07`;
      tc65RenderDetails();
    } catch {}
  }, 0);
})();


/* ===== 3.0.0-alpha87 mobile shared-library selection fix ===== */
(function(){
  function tc81IsCompactLibrary() {
    try { return window.matchMedia('(max-width: 820px)').matches; } catch { return window.innerWidth <= 820; }
  }
  function tc81ClearLibrarySelection() {
    try { window.__tapcalcLibrarySelectedId = ''; } catch {}
    try { window.__tapcalcLibrarySelectedRecord = null; } catch {}
    try { if (typeof selectedJobId !== 'undefined') selectedJobId = ''; } catch {}
    try {
      document.querySelectorAll('#jobsSelect .jobs-list-item[data-job-id]').forEach((item) => {
        item.classList.remove('active');
        item.setAttribute('aria-selected', 'false');
        item.setAttribute('aria-pressed', 'false');
      });
    } catch {}
    try {
      const detailsEl = document.getElementById('jobsList');
      if (detailsEl) detailsEl.innerHTML = '<div class="jobs-library-empty">Select a shared job from the list to view its details.</div>';
    } catch {}
  }

  const originalSetLibraryLane81 = window.setLibraryLane || (typeof setLibraryLane === 'function' ? setLibraryLane : null);
  window.setLibraryLane = function(lane) {
    const next = lane === 'shared' ? 'shared' : 'local';
    const result = originalSetLibraryLane81 ? originalSetLibraryLane81(next) : undefined;
    if (next === 'shared' && tc81IsCompactLibrary()) {
      setTimeout(tc81ClearLibrarySelection, 30);
      setTimeout(tc81ClearLibrarySelection, 180);
    }
    return result;
  };
  try { setLibraryLane = window.setLibraryLane; } catch {}

  const originalRenderJobsList81 = window.renderJobsList;
  window.renderJobsList = function() {
    const result = originalRenderJobsList81 ? originalRenderJobsList81.apply(this, arguments) : undefined;
    const screenVisible = document.getElementById('jobsScreen')?.classList.contains('active');
    const sharedVisible = document.querySelector('[data-library-lane-panel="shared"]')?.classList.contains('active');
    if (screenVisible && sharedVisible && tc81IsCompactLibrary()) setTimeout(tc81ClearLibrarySelection, 0);
    return result;
  };
})();


/* ===== 3.0.0-alpha87 garlock init + compact library lane guard ===== */
(function(){
  function tc83IsCompact(){
    try { return window.matchMedia('(max-width: 820px)').matches; } catch { return window.innerWidth <= 820; }
  }
  function tc83InitGarlock(){
    try { populateGarlock600Select(); } catch {}
    try { renderGarlock600Rows(garlock600Data); } catch {}
    try { if (garlock600SearchInputEl && !garlock600SearchInputEl.dataset.tc83Bound) {
      garlock600SearchInputEl.dataset.tc83Bound = '1';
      garlock600SearchInputEl.addEventListener('input', () => filterGarlock600Rows(garlock600SearchInputEl.value || ''));
    } } catch {}
    try { if (garlock600SizeSelectEl && !garlock600SizeSelectEl.dataset.tc83Bound) {
      garlock600SizeSelectEl.dataset.tc83Bound = '1';
      garlock600SizeSelectEl.addEventListener('change', updateGarlock600Summary);
      garlock600SizeSelectEl.addEventListener('input', updateGarlock600Summary);
    } } catch {}
    try {
      if (garlock600SizeSelectEl && !garlock600SizeSelectEl.value && garlock600Data[0]?.size) garlock600SizeSelectEl.value = garlock600Data[0].size;
      updateGarlock600Summary();
    } catch {}
  }
  function tc83ForceLocalOnCompactLibrary(){
    if (!tc83IsCompact()) return;
    try {
      if (typeof window.setLibraryLane === 'function') window.setLibraryLane('local');
      localStorage.setItem('tapcalcLibraryLaneV1', 'local');
    } catch {}
    try {
      window.__tapcalcLibrarySelectedId = '';
      window.__tapcalcLibrarySelectedRecord = null;
    } catch {}
    try {
      document.querySelectorAll('#jobsSelect .jobs-list-item[data-job-id]').forEach((item) => {
        item.classList.remove('active');
        item.setAttribute('aria-selected', 'false');
        item.setAttribute('aria-pressed', 'false');
      });
    } catch {}
    try {
      const detailsEl = document.getElementById('jobsList');
      if (detailsEl) detailsEl.innerHTML = '<div class="jobs-library-empty">Select a job from the list to view its details.</div>';
    } catch {}
  }
  const tc83OldSetScreen = window.tapCalcSetScreen;
  if (typeof tc83OldSetScreen === 'function' && !window.__tc83WrappedScreen) {
    window.__tc83WrappedScreen = true;
    window.tapCalcSetScreen = function(name){
      const result = tc83OldSetScreen.apply(this, arguments);
      if (name === 'jobs') setTimeout(tc83ForceLocalOnCompactLibrary, 0);
      if (name === 'ref') setTimeout(tc83InitGarlock, 0);
      return result;
    };
  }
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(tc83InitGarlock, 20);
    setTimeout(tc83ForceLocalOnCompactLibrary, 30);
  });
  setTimeout(tc83InitGarlock, 80);
  document.addEventListener('click', (event) => {
    const refBtn = event.target.closest('[data-reference-target="garlock600"]');
    if (refBtn) setTimeout(tc83InitGarlock, 0);
    const libTab = event.target.closest('.screen-tab[data-screen="jobs"]');
    if (libTab) setTimeout(tc83ForceLocalOnCompactLibrary, 0);
  });
})();


/* ===== 3.0.0-alpha87 dropdown + mobile library hard fix ===== */
(function(){
  function tc84Compact(){
    try { return window.matchMedia('(max-width: 820px)').matches; } catch { return window.innerWidth <= 820; }
  }
  function tc84SharedVisible(){
    try { return !!document.querySelector('[data-library-lane-panel="shared"].active'); } catch { return false; }
  }
  function tc84ApplyLocalLane(){
    if (!tc84Compact()) return;
    try { localStorage.setItem('tapcalcLibraryLaneV1', 'local'); } catch {}
    try {
      document.querySelectorAll('.library-lane-btn[data-library-lane]').forEach((btn)=>{
        const active = btn.dataset.libraryLane === 'local';
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      document.querySelectorAll('[data-library-lane-panel]').forEach((panel)=>{
        const active = panel.dataset.libraryLanePanel === 'local';
        panel.classList.toggle('active', active);
        panel.hidden = !active;
        panel.style.display = active ? 'block' : 'none';
        panel.style.pointerEvents = active ? 'auto' : 'none';
      });
      const jobsScreen = document.getElementById('jobsScreen');
      if (jobsScreen) jobsScreen.dataset.activeLane = 'local';
    } catch {}
    try { selectedJobId = ''; } catch {}
    try { window.__tapcalcLibrarySelectedId = ''; window.__tapcalcLibrarySelectedRecord = null; } catch {}
    try { renderJobsList(); } catch {}
    try {
      const detailsEl = document.getElementById('jobsList');
      if (detailsEl) detailsEl.innerHTML = '<div class="jobs-library-empty">Select a job from the list to view its details.</div>';
    } catch {}
  }
  function tc84InitGarlock(){
    try {
      const select = document.getElementById('garlock600SizeSelect');
      if (select) {
        const current = select.value;
        const markup = garlock600Data.map((row) => `<option value="${row.size}">${row.size}</option>`).join('');
        if (!select.options.length || !select.innerHTML.trim()) select.innerHTML = markup;
        if (current && [...select.options].some((o)=>o.value===current)) select.value = current;
        if (!select.value && garlock600Data[0]?.size) select.value = garlock600Data[0].size;
      }
    } catch {}
    try { populateGarlock600Select(); } catch {}
    try { renderGarlock600Rows(garlock600Data); } catch {}
    try { updateGarlock600Summary(); } catch {}
  }
  document.addEventListener('click', (event) => {
    const libTab = event.target.closest('.screen-tab[data-screen="jobs"]');
    if (libTab) setTimeout(tc84ApplyLocalLane, 0);
    const otherTab = event.target.closest('.screen-tab:not([data-screen="jobs"])');
    if (otherTab) {
      try {
        const jobs = document.getElementById('jobsScreen');
        if (jobs) { jobs.classList.remove('active'); jobs.style.pointerEvents = 'none'; }
      } catch {}
    }
    if (event.target.closest('[data-reference-target="garlock600"]') || event.target.closest('#referenceViewSelect')) {
      setTimeout(tc84InitGarlock, 0);
      setTimeout(tc84InitGarlock, 120);
    }
  }, true);
  document.addEventListener('change', (event) => {
    if (event.target && event.target.id === 'referenceViewSelect' && event.target.value === 'garlock600') {
      setTimeout(tc84InitGarlock, 0);
      setTimeout(tc84InitGarlock, 120);
    }
  });
  window.addEventListener('pageshow', () => { setTimeout(tc84InitGarlock, 60); });
  document.addEventListener('DOMContentLoaded', () => { setTimeout(tc84InitGarlock, 60); setTimeout(tc84ApplyLocalLane, 60); });
})();


/* ===== 3.0.0-alpha87 garlock summary + mobile library hard stop ===== */
(function(){
  function tc85Compact(){
    try { return window.matchMedia('(max-width: 820px)').matches; } catch { return window.innerWidth <= 820; }
  }
  function tc85GarlockSelect(){ return document.getElementById('garlock600SizeSelect'); }
  function tc85SetText(id, value){ const el = document.getElementById(id); if (el) el.textContent = value || '—'; }
  function tc85NormalizeSize(value){
    return String(value || '').replace(/["”]/g, '').replace(/\s+/g, '').toLowerCase();
  }
  function tc85UpdateGarlock(){
    try {
      const select = tc85GarlockSelect();
      const activeSize = select?.value || garlock600Data[0]?.size || '';
      const match = garlock600Data.find((row) => tc85NormalizeSize(row.size) === tc85NormalizeSize(activeSize)) || garlock600Data[0] || null;
      if (!match) return;
      tc85SetText('garlock600BoltCount', match.bolts);
      tc85SetText('garlock600BoltSize', match.boltSize);
      tc85SetText('garlock600MinTorque', `${match.minTorque} ft lbs`);
      tc85SetText('garlock600PreferredTorque', `${match.preferredTorque} ft lbs`);
      tc85SetText('garlock600Torque60', `${match.torque60} ft lbs`);
      tc85SetText('garlock600StressValue', `${match.maxRecStress} psi`);
      tc85SetText('garlock600ContactArea', `${match.area} in²`);
    } catch {}
  }
  function tc85InitGarlock(){
    try { populateGarlock600Select(); } catch {}
    try { renderGarlock600Rows(garlock600Data); } catch {}
    try {
      const select = tc85GarlockSelect();
      if (select && !select.value && garlock600Data[0]?.size) select.value = garlock600Data[0].size;
    } catch {}
    setTimeout(tc85UpdateGarlock, 0);
    setTimeout(tc85UpdateGarlock, 120);
  }
  document.addEventListener('change', (event) => {
    if (event.target && event.target.id === 'garlock600SizeSelect') tc85UpdateGarlock();
    if (event.target && event.target.id === 'referenceViewSelect' && event.target.value === 'garlock600') tc85InitGarlock();
  }, true);
  document.addEventListener('input', (event) => {
    if (event.target && event.target.id === 'garlock600SizeSelect') tc85UpdateGarlock();
  }, true);
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-reference-target="garlock600"]')) {
      setTimeout(tc85InitGarlock, 0);
      setTimeout(tc85InitGarlock, 120);
    }
  }, true);
  window.addEventListener('pageshow', () => { setTimeout(tc85InitGarlock, 80); });
  document.addEventListener('DOMContentLoaded', () => { setTimeout(tc85InitGarlock, 80); });

  const originalOpenSharedLane85 = window.openSharedLibraryLane || (typeof openSharedLibraryLane === 'function' ? openSharedLibraryLane : null);
  window.openSharedLibraryLane = function(){
    if (tc85Compact()) {
      try { if (typeof window.setLibraryLane === 'function') window.setLibraryLane('local'); } catch {}
      try { localStorage.setItem('tapcalcLibraryLaneV1', 'local'); } catch {}
      try { selectedJobId = ''; } catch {}
      try { window.__tapcalcLibrarySelectedId = ''; window.__tapcalcLibrarySelectedRecord = null; } catch {}
      try {
        const detailsEl = document.getElementById('jobsList');
        if (detailsEl) detailsEl.innerHTML = '<div class="jobs-library-empty">Select a job from the list to view its details.</div>';
      } catch {}
      return;
    }
    return originalOpenSharedLane85 ? originalOpenSharedLane85.apply(this, arguments) : undefined;
  };
  try { openSharedLibraryLane = window.openSharedLibraryLane; } catch {}

  const originalSetScreen85 = window.tapCalcSetScreen || null;
  if (typeof originalSetScreen85 === 'function' && !window.__tc85ScreenWrapped) {
    window.__tc85ScreenWrapped = true;
    window.tapCalcSetScreen = function(name){
      const result = originalSetScreen85.apply(this, arguments);
      if (name === 'jobs' && tc85Compact()) {
        try { window.openSharedLibraryLane(); } catch {}
        try {
          document.querySelectorAll('[data-library-lane-panel="shared"] .jobs-list-item.active').forEach((item)=>item.classList.remove('active'));
        } catch {}
      }
      return result;
    };
  }

  document.addEventListener('click', (event) => {
    const tab = event.target.closest('.screen-tab[data-screen]');
    if (!tab) return;
    if (tab.dataset.screen !== 'jobs') {
      try {
        const jobsScreen = document.getElementById('jobsScreen');
        if (jobsScreen) {
          jobsScreen.classList.remove('active');
          jobsScreen.style.pointerEvents = 'none';
          jobsScreen.style.zIndex = '0';
        }
      } catch {}
    }
  }, true);
})();


/* ===== 3.0.0-alpha87 garlock self-contained init + mobile library escape hatch ===== */
(function(){
  const GARLOCK_ROWS = [
    { size:'1/2', area:'0.94', bolts:'4', boltSize:'0.50', torque60:'60', minTorque:'11', preferredTorque:'37', maxRecStress:'20000' },
    { size:'3/4', area:'1.36', bolts:'4', boltSize:'0.63', torque60:'120', minTorque:'20', preferredTorque:'67', maxRecStress:'20000' },
    { size:'1', area:'1.79', bolts:'4', boltSize:'0.63', torque60:'120', minTorque:'27', preferredTorque:'89', maxRecStress:'20000' },
    { size:'1-1/4', area:'2.74', bolts:'4', boltSize:'0.63', torque60:'120', minTorque:'41', preferredTorque:'120', maxRecStress:'17664' },
    { size:'1-1/2', area:'3.65', bolts:'4', boltSize:'0.75', torque60:'200', minTorque:'60', preferredTorque:'200', maxRecStress:'19862' },
    { size:'2', area:'5.84', bolts:'8', boltSize:'0.63', torque60:'120', minTorque:'43', preferredTorque:'120', maxRecStress:'16593' },
    { size:'2-1/2', area:'6.82', bolts:'8', boltSize:'0.75', torque60:'200', minTorque:'56', preferredTorque:'188', maxRecStress:'20000' },
    { size:'3', area:'10.01', bolts:'8', boltSize:'0.75', torque60:'200', minTorque:'83', preferredTorque:'200', maxRecStress:'14476' },
    { size:'4', area:'14.19', bolts:'8', boltSize:'0.88', torque60:'320', minTorque:'135', preferredTorque:'320', maxRecStress:'14174' },
    { size:'5', area:'17.69', bolts:'8', boltSize:'1.00', torque60:'490', minTorque:'197', preferredTorque:'490', maxRecStress:'14952' },
    { size:'6', area:'22.33', bolts:'12', boltSize:'1.00', torque60:'490', minTorque:'165', preferredTorque:'490', maxRecStress:'17770' },
    { size:'8', area:'30.22', bolts:'12', boltSize:'1.13', torque60:'710', minTorque:'246', preferredTorque:'710', maxRecStress:'17344' },
    { size:'10', area:'36.91', bolts:'16', boltSize:'1.25', torque60:'1000', minTorque:'248', preferredTorque:'828', maxRecStress:'20000' },
    { size:'12', area:'49.04', bolts:'20', boltSize:'1.25', torque60:'1000', minTorque:'264', preferredTorque:'880', maxRecStress:'20000' },
    { size:'14', area:'53.46', bolts:'20', boltSize:'1.38', torque60:'1360', minTorque:'315', preferredTorque:'1049', maxRecStress:'20000' },
    { size:'16', area:'67.74', bolts:'20', boltSize:'1.50', torque60:'1600', minTorque:'386', preferredTorque:'1286', maxRecStress:'20000' },
    { size:'18', area:'91.89', bolts:'20', boltSize:'1.63', torque60:'2200', minTorque:'602', preferredTorque:'2006', maxRecStress:'20000' },
    { size:'20', area:'101.32', bolts:'24', boltSize:'1.63', torque60:'2200', minTorque:'553', preferredTorque:'1843', maxRecStress:'20000' },
    { size:'24', area:'130.82', bolts:'24', boltSize:'1.88', torque60:'4000', minTorque:'946', preferredTorque:'3154', maxRecStress:'20000' }
  ];
  const $ = (id) => document.getElementById(id);
  const compact = () => { try { return window.matchMedia('(max-width: 820px)').matches; } catch { return window.innerWidth <= 820; } };
  function setText(id, value){ const el=$(id); if(el) el.textContent = value || '—'; }
  function renderGarlockTable(rows){ const body=$('garlock600Body'); if(!body) return; body.innerHTML = rows.map(r=>`<tr><td>${r.size}</td><td>${r.bolts}</td><td>${r.boltSize}</td><td>${r.torque60}</td><td>${r.minTorque}</td><td>${r.preferredTorque}</td><td>${r.maxRecStress}</td><td>${r.area}</td></tr>`).join(''); }
  function garlockUpdate(){
    const sel=$('garlock600SizeSelect');
    const row = GARLOCK_ROWS.find(r => r.size === (sel?.value || '')) || GARLOCK_ROWS[0];
    if(!row) return;
    setText('garlock600BoltCount', row.bolts);
    setText('garlock600BoltSize', row.boltSize);
    setText('garlock600MinTorque', `${row.minTorque} ft lbs`);
    setText('garlock600PreferredTorque', `${row.preferredTorque} ft lbs`);
    setText('garlock600Torque60', `${row.torque60} ft lbs`);
    setText('garlock600StressValue', `${row.maxRecStress} psi`);
    setText('garlock600ContactArea', `${row.area} in²`);
  }
  function garlockFilter(){
    const q = String($('garlock600SearchInput')?.value || '').trim().toLowerCase();
    const rows = !q ? GARLOCK_ROWS : GARLOCK_ROWS.filter(r => Object.values(r).join(' ').toLowerCase().includes(q));
    renderGarlockTable(rows);
  }
  function garlockInit(){
    const sel=$('garlock600SizeSelect');
    if(sel){
      const markup = GARLOCK_ROWS.map(r=>`<option value="${r.size}">${r.size}</option>`).join('');
      if(sel.innerHTML.trim() !== markup.trim()) sel.innerHTML = markup;
      if(!sel.value) sel.value = GARLOCK_ROWS[0].size;
      if(!sel.dataset.alpha87Bound){
        sel.dataset.alpha87Bound='1';
        sel.addEventListener('change', garlockUpdate);
        sel.addEventListener('input', garlockUpdate);
      }
    }
    const search=$('garlock600SearchInput');
    if(search && !search.dataset.alpha87Bound){ search.dataset.alpha87Bound='1'; search.addEventListener('input', garlockFilter); }
    renderGarlockTable(GARLOCK_ROWS);
    garlockUpdate();
  }
  function clearLibraryTrap(){
    try {
      document.querySelectorAll('.job-card.active,.job-row.active,[data-job-key].active,[data-cloud-job-id].active,[data-selected="true"]').forEach(el=>{el.classList.remove('active'); el.removeAttribute('data-selected'); el.setAttribute('aria-selected','false');});
      ['jobsDetailPanel','jobsSharedDetailPanel','jobLibraryDetail','jobDetailCard','selectedJobDetails'].forEach(id=>{ const el=$(id); if(el){ el.hidden=true; el.style.display='none'; }});
      if(typeof window.setLibraryLane==='function') window.setLibraryLane('local');
      const jobsScreen=$('jobsScreen');
      if(jobsScreen){ jobsScreen.dataset.activeLane='local'; jobsScreen.style.pointerEvents='auto'; jobsScreen.style.zIndex=''; }
      const shared=document.querySelector('[data-library-lane-panel="shared"]');
      const local=document.querySelector('[data-library-lane-panel="local"]');
      if(shared){ shared.hidden=true; shared.classList.remove('active'); shared.style.display='none'; }
      if(local){ local.hidden=false; local.classList.add('active'); local.style.display='block'; }
      document.querySelectorAll('.library-lane-btn[data-library-lane]').forEach(btn=>{ const active=btn.dataset.libraryLane==='local'; btn.classList.toggle('active',active); btn.setAttribute('aria-pressed', active?'true':'false'); });
      try { localStorage.setItem('tapcalcLibraryLaneV1','local'); } catch {}
    } catch {}
  }
  function hardShowScreen(name){
    const views={home:$('homeScreen'),job:$('jobScreen'),calc:$('calcScreen'),card:$('cardScreen'),jobs:$('jobsScreen'),ref:$('refScreen')};
    document.querySelectorAll('.screen-tab[data-screen]').forEach(t=>t.classList.toggle('active', t.dataset.screen===name));
    Object.entries(views).forEach(([k,v])=>{ if(v){ const on=k===name; v.classList.toggle('active', on); v.style.pointerEvents = on ? 'auto' : 'none'; if(!on && k==='jobs'){ v.style.zIndex='0'; } else if(on && k==='jobs'){ v.style.zIndex=''; } } });
    document.body.classList.toggle('show-library-screen', name==='jobs');
    try { localStorage.setItem('tapcalcV3Screen', name); } catch {}
    if(name==='jobs') clearLibraryTrap();
  }
  // block auto-switch to shared lane on mobile after cloud loads
  const origLoad = window.loadCloudJobs;
  if(typeof origLoad === 'function' && !window.__alpha87LoadWrapped){
    window.__alpha87LoadWrapped = true;
    window.loadCloudJobs = async function(){
      const res = await origLoad.apply(this, arguments);
      if(compact()) setTimeout(clearLibraryTrap, 50);
      return res;
    };
    try { loadCloudJobs = window.loadCloudJobs; } catch {}
  }
  const origOpenShared = window.openSharedLibraryLane;
  if(typeof origOpenShared === 'function' && !window.__alpha87OpenSharedWrapped){
    window.__alpha87OpenSharedWrapped = true;
    window.openSharedLibraryLane = function(){ if(compact()) return clearLibraryTrap(); return origOpenShared.apply(this, arguments); };
    try { openSharedLibraryLane = window.openSharedLibraryLane; } catch {}
  }
  document.addEventListener('click', (e)=>{
    const tab=e.target.closest('.screen-tab[data-screen]');
    if(tab && tab.dataset.screen !== 'jobs'){
      e.preventDefault(); e.stopPropagation();
      hardShowScreen(tab.dataset.screen);
      return;
    }
    if(e.target.closest('[data-reference-target="garlock600"]') || (e.target.id==='referenceViewSelect' && e.target.value==='garlock600')){
      setTimeout(garlockInit,0); setTimeout(garlockInit,120);
    }
  }, true);
  document.addEventListener('touchend', (e)=>{
    const tab=e.target.closest('.screen-tab[data-screen]');
    if(tab && tab.dataset.screen !== 'jobs'){
      e.preventDefault(); e.stopPropagation();
      hardShowScreen(tab.dataset.screen);
    }
  }, true);
  document.addEventListener('change', (e)=>{
    if(e.target && e.target.id==='referenceViewSelect' && e.target.value==='garlock600'){ setTimeout(garlockInit,0); setTimeout(garlockInit,120); }
  }, true);
  window.addEventListener('pageshow', ()=>{ setTimeout(garlockInit,80); if(compact()) setTimeout(clearLibraryTrap,120); });
  document.addEventListener('DOMContentLoaded', ()=>{ setTimeout(garlockInit,80); if(compact()) setTimeout(clearLibraryTrap,120); });
  setTimeout(garlockInit, 200);
})();


/* ===== 3.0.0-alpha87 load job restore + garlock direct bind + mobile library escape ===== */
(function(){
  const GARLOCK_ROWS = [
    { size:'1/2', area:'0.94', bolts:'4', boltSize:'0.50', torque60:'60', minTorque:'11', preferredTorque:'37', maxRecStress:'20000' },
    { size:'3/4', area:'1.36', bolts:'4', boltSize:'0.63', torque60:'120', minTorque:'20', preferredTorque:'67', maxRecStress:'20000' },
    { size:'1', area:'1.79', bolts:'4', boltSize:'0.63', torque60:'120', minTorque:'27', preferredTorque:'89', maxRecStress:'20000' },
    { size:'1-1/4', area:'2.74', bolts:'4', boltSize:'0.63', torque60:'120', minTorque:'41', preferredTorque:'120', maxRecStress:'17664' },
    { size:'1-1/2', area:'3.65', bolts:'4', boltSize:'0.75', torque60:'200', minTorque:'60', preferredTorque:'200', maxRecStress:'19862' },
    { size:'2', area:'5.84', bolts:'8', boltSize:'0.63', torque60:'120', minTorque:'43', preferredTorque:'120', maxRecStress:'16593' },
    { size:'2-1/2', area:'6.82', bolts:'8', boltSize:'0.75', torque60:'200', minTorque:'56', preferredTorque:'188', maxRecStress:'20000' },
    { size:'3', area:'10.01', bolts:'8', boltSize:'0.75', torque60:'200', minTorque:'83', preferredTorque:'200', maxRecStress:'14476' },
    { size:'4', area:'14.19', bolts:'8', boltSize:'0.88', torque60:'320', minTorque:'135', preferredTorque:'320', maxRecStress:'14174' },
    { size:'5', area:'17.69', bolts:'8', boltSize:'1.00', torque60:'490', minTorque:'197', preferredTorque:'490', maxRecStress:'14952' },
    { size:'6', area:'22.33', bolts:'12', boltSize:'1.00', torque60:'490', minTorque:'165', preferredTorque:'490', maxRecStress:'17770' },
    { size:'8', area:'30.22', bolts:'12', boltSize:'1.13', torque60:'710', minTorque:'246', preferredTorque:'710', maxRecStress:'17344' },
    { size:'10', area:'36.91', bolts:'16', boltSize:'1.25', torque60:'1000', minTorque:'248', preferredTorque:'828', maxRecStress:'20000' },
    { size:'12', area:'49.04', bolts:'20', boltSize:'1.25', torque60:'1000', minTorque:'264', preferredTorque:'880', maxRecStress:'20000' },
    { size:'14', area:'53.46', bolts:'20', boltSize:'1.38', torque60:'1360', minTorque:'315', preferredTorque:'1049', maxRecStress:'20000' },
    { size:'16', area:'67.74', bolts:'20', boltSize:'1.50', torque60:'1600', minTorque:'386', preferredTorque:'1286', maxRecStress:'20000' },
    { size:'18', area:'91.89', bolts:'20', boltSize:'1.63', torque60:'2200', minTorque:'602', preferredTorque:'2006', maxRecStress:'20000' },
    { size:'20', area:'101.32', bolts:'24', boltSize:'1.63', torque60:'2200', minTorque:'553', preferredTorque:'1843', maxRecStress:'20000' },
    { size:'24', area:'130.82', bolts:'24', boltSize:'1.88', torque60:'4000', minTorque:'946', preferredTorque:'3154', maxRecStress:'20000' }
  ];
  const $ = (id) => document.getElementById(id);
  const compact = () => { try { return window.matchMedia('(max-width: 820px)').matches; } catch { return window.innerWidth <= 820; } };
  const screens = { home:'homeScreen', job:'jobScreen', calc:'calcScreen', card:'cardScreen', ref:'refScreen', jobs:'jobsScreen' };

  function setText(id, value){ const el=$(id); if(el) el.textContent = value || '—'; }
  function showScreen(name){
    document.querySelectorAll('.screen-tab[data-screen]').forEach((tab)=>{
      const active = tab.dataset.screen === name;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    Object.entries(screens).forEach(([key, id])=>{
      const el = $(id); if(!el) return;
      const active = key === name;
      el.classList.toggle('active', active);
      el.style.pointerEvents = active ? 'auto' : 'none';
      el.hidden = !active;
    });
    document.body.classList.toggle('show-library-screen', name === 'jobs');
    try { localStorage.setItem('tapcalcV3Screen', name); } catch {}
  }

  function getCombinedJobs(){
    try {
      const list = typeof window.getCombinedJobsForDisplay === 'function' ? window.getCombinedJobsForDisplay() : [];
      return Array.isArray(list) ? list : [];
    } catch { return []; }
  }
  function getSelectedJobEntry(){
    const list = getCombinedJobs();
    if(!list.length) return null;
    const active = document.querySelector('#jobsSelect .jobs-list-item.active[data-job-id], #jobsSelect .jobs-list-item[aria-selected="true"][data-job-id], #jobsSelect .jobs-list-item[aria-pressed="true"][data-job-id]');
    const selectedId = String(active?.dataset?.jobId || window.__tapcalcLibrarySelectedId || window.__alpha87SelectedJobId || (typeof selectedJobId !== 'undefined' ? selectedJobId : '') || '').trim();
    const match = selectedId ? list.find((job)=> String(job?.id || '') === selectedId) : null;
    return match || window.__tapcalcLibrarySelectedRecord && { id: selectedId || 'manual', record: window.__tapcalcLibrarySelectedRecord } || null;
  }
  function syncSelectedJob(entry){
    if(!entry) return;
    try { window.__alpha87SelectedJobId = String(entry.id || ''); } catch {}
    try { window.__tapcalcLibrarySelectedId = String(entry.id || ''); } catch {}
    try { window.__tapcalcLibrarySelectedRecord = entry.record || null; } catch {}
    try { if (typeof selectedJobId !== 'undefined') selectedJobId = String(entry.id || ''); } catch {}
    try {
      document.querySelectorAll('#jobsSelect .jobs-list-item[data-job-id]').forEach((item)=>{
        const active = String(item.dataset.jobId || '') === String(entry.id || '');
        item.classList.toggle('active', active);
        item.setAttribute('aria-selected', active ? 'true' : 'false');
        item.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    } catch {}
  }
  function hardLoadSelectedJob(){
    const entry = getSelectedJobEntry();
    if(!entry?.record){
      const status = $('jobsCloudStatus');
      if(status) status.textContent = 'Load Job failed: no selected library record found.';
      return false;
    }
    syncSelectedJob(entry);
    try {
      if (typeof loadRecordIntoCalculator === 'function') loadRecordIntoCalculator(entry.record, { switchScreen: true, skipPersist: false });
    } catch (error) {
      console.error('alpha87 loadRecordIntoCalculator failed', error);
      return false;
    }
    showScreen('job');
    const status = $('jobsCloudStatus');
    if(status) status.textContent = `Loaded ${entry.record?.meta?.title || entry.record?.job?.description || entry.record?.job?.jobNumber || 'saved job'} into Current.`;
    return false;
  }
  window.tapCalcForceLoadSelectedJob = hardLoadSelectedJob;
  window.loadSelectedLibraryJob = hardLoadSelectedJob;
  window.tapCalcLibraryLoadSelected = hardLoadSelectedJob;

  function bindLoadButton(){
    const btn = $('jobsLoadSelectedBtn');
    if(!btn || btn.dataset.alpha87Bound === '1') return;
    btn.dataset.alpha87Bound = '1';
    btn.onclick = hardLoadSelectedJob;
    ['click','pointerup','touchend'].forEach((evt)=> btn.addEventListener(evt, (e)=>{ e.preventDefault(); e.stopPropagation(); if(typeof e.stopImmediatePropagation==='function') e.stopImmediatePropagation(); hardLoadSelectedJob(); return false; }, true));
  }

  function renderGarlockTable(rows){
    const body = $('garlock600Body');
    if(!body) return;
    body.innerHTML = rows.map((r)=>`<tr><td>${r.size}</td><td>${r.bolts}</td><td>${r.boltSize}</td><td>${r.torque60}</td><td>${r.minTorque}</td><td>${r.preferredTorque}</td><td>${r.maxRecStress}</td><td>${r.area}</td></tr>`).join('');
  }
  function updateGarlockSummary(){
    const sel = $('garlock600SizeSelect');
    const val = String(sel?.value || '').trim();
    const row = GARLOCK_ROWS.find((r)=> String(r.size) === val) || GARLOCK_ROWS[0] || null;
    if(!row) return;
    setText('garlock600BoltCount', row.bolts);
    setText('garlock600BoltSize', row.boltSize);
    setText('garlock600MinTorque', `${row.minTorque} ft lbs`);
    setText('garlock600PreferredTorque', `${row.preferredTorque} ft lbs`);
    setText('garlock600Torque60', `${row.torque60} ft lbs`);
    setText('garlock600StressValue', `${row.maxRecStress} psi`);
    setText('garlock600ContactArea', `${row.area} in²`);
  }
  function filterGarlockTable(){
    const q = String($('garlock600SearchInput')?.value || '').trim().toLowerCase();
    const rows = !q ? GARLOCK_ROWS : GARLOCK_ROWS.filter((r)=>Object.values(r).join(' ').toLowerCase().includes(q));
    renderGarlockTable(rows);
  }
  function initGarlock(){
    const sel = $('garlock600SizeSelect');
    if(sel){
      const current = sel.value;
      const markup = GARLOCK_ROWS.map((r)=>`<option value="${r.size}">${r.size}</option>`).join('');
      if(sel.innerHTML.trim() !== markup.trim()) sel.innerHTML = markup;
      if(current && GARLOCK_ROWS.some((r)=>r.size===current)) sel.value = current;
      if(!sel.value) sel.value = GARLOCK_ROWS[0].size;
      sel.onchange = updateGarlockSummary;
      sel.oninput = updateGarlockSummary;
    }
    const search = $('garlock600SearchInput');
    if(search){ search.oninput = filterGarlockTable; }
    renderGarlockTable(GARLOCK_ROWS);
    updateGarlockSummary();
  }

  function forceLocalLibrary(){
    if(!compact()) return;
    try { localStorage.setItem('tapcalcLibraryLaneV1', 'local'); } catch {}
    try {
      document.querySelectorAll('.library-lane-btn[data-library-lane]').forEach((btn)=>{
        const active = btn.dataset.libraryLane === 'local';
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      document.querySelectorAll('[data-library-lane-panel]').forEach((panel)=>{
        const active = panel.dataset.libraryLanePanel === 'local';
        panel.classList.toggle('active', active);
        panel.hidden = !active;
        panel.style.display = active ? 'block' : 'none';
        panel.style.pointerEvents = active ? 'auto' : 'none';
      });
      const jobsScreen = $('jobsScreen');
      if(jobsScreen){ jobsScreen.style.pointerEvents='auto'; jobsScreen.style.zIndex=''; jobsScreen.dataset.activeLane='local'; }
    } catch {}
  }

  document.addEventListener('click', (e)=>{
    const row = e.target.closest('#jobsSelect .jobs-list-item[data-job-id]');
    if(row){
      const list = getCombinedJobs();
      const entry = list.find((job)=> String(job?.id || '') === String(row.dataset.jobId || '')) || null;
      if(entry){ syncSelectedJob(entry); window.__alpha87UserPickedJob = '1'; }
      setTimeout(bindLoadButton,0);
      return;
    }
    const loadBtn = e.target.closest('#jobsLoadSelectedBtn');
    if(loadBtn){ e.preventDefault(); e.stopPropagation(); if(typeof e.stopImmediatePropagation==='function') e.stopImmediatePropagation(); hardLoadSelectedJob(); return; }
    const tab = e.target.closest('.screen-tab[data-screen]');
    if(tab && tab.dataset.screen === 'jobs'){ setTimeout(()=>{ forceLocalLibrary(); bindLoadButton(); }, 0); }
    if(tab && tab.dataset.screen !== 'jobs'){ setTimeout(()=> showScreen(tab.dataset.screen), 0); }
    if(e.target.closest('[data-reference-target="garlock600"]') || (e.target.id === 'referenceViewSelect' && $('referenceViewSelect')?.value === 'garlock600')) setTimeout(initGarlock, 0);
  }, true);
  document.addEventListener('change', (e)=>{
    if(e.target?.id === 'garlock600SizeSelect') updateGarlockSummary();
    if(e.target?.id === 'referenceViewSelect' && e.target.value === 'garlock600') setTimeout(initGarlock, 0);
  }, true);
  document.addEventListener('input', (e)=>{
    if(e.target?.id === 'garlock600SizeSelect') updateGarlockSummary();
  }, true);
  window.addEventListener('pageshow', ()=>{ setTimeout(()=>{ initGarlock(); bindLoadButton(); forceLocalLibrary(); }, 60); });
  document.addEventListener('DOMContentLoaded', ()=>{ setTimeout(()=>{ initGarlock(); bindLoadButton(); forceLocalLibrary(); }, 60); });
  setTimeout(()=>{ initGarlock(); bindLoadButton(); }, 120);
})();


/* ===== 3.0.0-alpha126 load job exact-record bind + mobile library hard exit ===== */
(function(){
  const $ = (id) => document.getElementById(id);
  const compact = () => { try { return window.matchMedia('(max-width: 820px)').matches; } catch { return window.innerWidth <= 820; } };

  function getJobsList(){
    try { return typeof window.getCombinedJobsForDisplay === 'function' ? (window.getCombinedJobsForDisplay() || []) : []; }
    catch { return []; }
  }

  function pinSelectedRecordFromList(list){
    try {
      const jobs = Array.isArray(list) ? list : getJobsList();
      const selectedId = String(window.__alpha87SelectedJobId || window.__tapcalcLibrarySelectedId || (typeof selectedJobId !== 'undefined' ? selectedJobId : '') || '').trim();
      const entry = jobs.find((job)=> String(job?.id || '') === selectedId) || jobs[0] || null;
      if(entry?.record){
        window.__tapcalcPinnedLoadJob = { id: String(entry.id || ''), record: entry.record };
      }
    } catch {}
  }

  const origRenderSelectedJobDetails = window.renderSelectedJobDetails || (typeof renderSelectedJobDetails === 'function' ? renderSelectedJobDetails : null);
  if (typeof origRenderSelectedJobDetails === 'function' && !window.__alpha88RenderWrapped) {
    window.__alpha88RenderWrapped = true;
    const wrapped = function(jobs){
      const result = origRenderSelectedJobDetails.apply(this, arguments);
      try {
        const list = Array.isArray(jobs) ? jobs : getJobsList();
        const selectedId = String(window.__alpha87SelectedJobId || window.__tapcalcLibrarySelectedId || (typeof selectedJobId !== 'undefined' ? selectedJobId : '') || '').trim();
        const entry = list.find((job)=> String(job?.id || '') === selectedId) || list[0] || null;
        if(entry?.record){
          window.__tapcalcPinnedLoadJob = { id: String(entry.id || ''), record: entry.record };
          window.__tapcalcLibrarySelectedId = String(entry.id || '');
          window.__tapcalcLibrarySelectedRecord = entry.record;
        }
        const btn = $('jobsLoadSelectedBtn');
        if (btn && !btn.dataset.alpha88Bound) {
          btn.dataset.alpha88Bound = '1';
          btn.onclick = function(e){ if(e){ e.preventDefault(); e.stopPropagation(); } return window.tapCalcForceLoadSelectedJob ? window.tapCalcForceLoadSelectedJob() : false; };
        }
      } catch {}
      return result;
    };
    window.renderSelectedJobDetails = wrapped;
    try { renderSelectedJobDetails = wrapped; } catch {}
  }

  function exactSelectedEntry(){
    const pinned = window.__tapcalcPinnedLoadJob;
    if (pinned?.record) return pinned;
    const list = getJobsList();
    const active = document.querySelector('#jobsSelect .jobs-list-item.active[data-job-id], #jobsSelect .jobs-list-item[aria-selected="true"][data-job-id], #jobsSelect .jobs-list-item[aria-pressed="true"][data-job-id]');
    const selectedId = String(active?.dataset?.jobId || window.__tapcalcLibrarySelectedId || window.__alpha87SelectedJobId || (typeof selectedJobId !== 'undefined' ? selectedJobId : '') || '').trim();
    return (selectedId ? list.find((job)=> String(job?.id || '') === selectedId) : null) || list[0] || null;
  }

  function forceLoadExactJob(){
    const entry = exactSelectedEntry();
    if (!entry?.record) {
      const status = $('jobsCloudStatus');
      if (status) status.textContent = 'Load Job failed: no selected library record found.';
      return false;
    }
    try {
      window.__tapcalcLibrarySelectedId = String(entry.id || '');
      window.__tapcalcLibrarySelectedRecord = entry.record;
      window.__tapcalcPinnedLoadJob = { id: String(entry.id || ''), record: entry.record };
      if (typeof selectedJobId !== 'undefined') selectedJobId = String(entry.id || '');
    } catch {}
    try {
      if (typeof loadRecordIntoCalculator === 'function') loadRecordIntoCalculator(entry.record, { switchScreen: true, skipPersist: false, message: true });
    } catch (error) {
      console.error('alpha88 exact load failed', error);
      return false;
    }
    setTimeout(()=>{
      try { document.querySelector('.screen-tab[data-screen="job"]')?.click(); } catch {}
      try { document.getElementById('jobScreen')?.classList.add('active'); } catch {}
    }, 20);
    const status = $('jobsCloudStatus');
    if (status) status.textContent = `Loaded ${entry.record?.meta?.title || entry.record?.job?.description || entry.record?.job?.jobNumber || 'saved job'} into Current.`;
    return false;
  }
  window.tapCalcForceLoadSelectedJob = forceLoadExactJob;
  window.loadSelectedLibraryJob = forceLoadExactJob;
  window.tapCalcLibraryLoadSelected = forceLoadExactJob;

  document.addEventListener('click', (e)=>{
    const item = e.target.closest('#jobsSelect .jobs-list-item[data-job-id]');
    if(item){
      const list = getJobsList();
      const entry = list.find((job)=> String(job?.id || '') === String(item.dataset.jobId || '')) || null;
      if(entry?.record){
        window.__tapcalcPinnedLoadJob = { id: String(entry.id || ''), record: entry.record };
        window.__tapcalcLibrarySelectedId = String(entry.id || '');
        window.__tapcalcLibrarySelectedRecord = entry.record;
        try { if (typeof selectedJobId !== 'undefined') selectedJobId = String(entry.id || ''); } catch {}
      }
    }
    const btn = e.target.closest('#jobsLoadSelectedBtn');
    if(btn){
      e.preventDefault(); e.stopPropagation();
      if(typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
      forceLoadExactJob();
      return false;
    }
    const nav = e.target.closest('.screen-tab[data-screen], [data-go-screen]');
    const next = nav?.dataset?.screen || nav?.dataset?.goScreen;
    if(next && next !== 'jobs'){
      setTimeout(()=>{
        const jobsScreen = $('jobsScreen');
        if(jobsScreen){ jobsScreen.classList.remove('active'); jobsScreen.hidden = true; jobsScreen.style.pointerEvents = 'none'; jobsScreen.style.display = 'none'; jobsScreen.style.zIndex = '0'; }
        document.body.classList.remove('show-library-screen');
      }, 0);
    }
  }, true);

  document.addEventListener('pointerup', (e)=>{
    const btn = e.target.closest('#jobsLoadSelectedBtn');
    if(btn){
      e.preventDefault(); e.stopPropagation();
      if(typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
      forceLoadExactJob();
      return false;
    }
  }, true);

  function hardExitLibrary(){
    const jobsScreen = $('jobsScreen');
    if(jobsScreen){ jobsScreen.classList.remove('active'); jobsScreen.hidden = true; jobsScreen.style.pointerEvents='none'; jobsScreen.style.display='none'; jobsScreen.style.zIndex='0'; }
    document.body.classList.remove('show-library-screen');
  }
  if (!window.__alpha88TabHardExitBound) {
    window.__alpha88TabHardExitBound = true;
    document.querySelectorAll('.screen-tab[data-screen], [data-go-screen]').forEach((el)=>{
      ['click','touchend'].forEach((evt)=> el.addEventListener(evt, ()=>{
        const next = el.dataset.screen || el.dataset.goScreen;
        if (next && next !== 'jobs') setTimeout(hardExitLibrary, 10);
        if (next === 'jobs' && compact()) {
          setTimeout(()=>{
            const jobsScreen = $('jobsScreen');
            if(jobsScreen){ jobsScreen.hidden = false; jobsScreen.style.display = ''; jobsScreen.style.pointerEvents='auto'; }
          }, 10);
        }
      }, true));
    });
  }

  setTimeout(()=>{ pinSelectedRecordFromList(); const btn = $('jobsLoadSelectedBtn'); if(btn && !btn.dataset.alpha88Bound){ btn.dataset.alpha88Bound='1'; btn.onclick=forceLoadExactJob; } }, 250);
})();


/* ===== 3.0.0-alpha126 library selection/load stabilization ===== */
(function(){
  const $ = (id) => document.getElementById(id);
  const compact = () => { try { return window.matchMedia('(max-width: 820px)').matches; } catch { return window.innerWidth <= 820; } };

  function allJobs(){
    try {
      const list = typeof window.getCombinedJobsForDisplay === 'function' ? (window.getCombinedJobsForDisplay() || []) : [];
      return Array.isArray(list) ? list : [];
    } catch { return []; }
  }
  function pinEntry(entry){
    if(!entry) return;
    const id = String(entry.id || '');
    window.__tapcalcExactLibrarySelectedId = id;
    window.__tapcalcLibrarySelectedId = id;
    window.__alpha87SelectedJobId = id;
    window.__tapcalcPinnedLoadJob = { id, record: entry.record || null };
    window.__tapcalcLibrarySelectedRecord = entry.record || null;
    try { if (typeof selectedJobId !== 'undefined') selectedJobId = id; } catch {}
    try {
      document.querySelectorAll('#jobsSelect .jobs-list-item[data-job-id]').forEach((item)=>{
        const active = String(item.dataset.jobId || '') === id;
        item.classList.toggle('active', active);
        item.setAttribute('aria-selected', active ? 'true' : 'false');
        item.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    } catch {}
  }
  function entryFromId(id){
    const sid = String(id || '').trim();
    if(!sid) return null;
    return allJobs().find((job)=> String(job?.id || '') === sid) || null;
  }
  function exactSelectedEntry(){
    const domActive = document.querySelector('#jobsSelect .jobs-list-item.active[data-job-id], #jobsSelect .jobs-list-item[aria-selected="true"][data-job-id], #jobsSelect .jobs-list-item[aria-pressed="true"][data-job-id]');
    const ids = [
      domActive?.dataset?.jobId,
      window.__tapcalcExactLibrarySelectedId,
      window.__tapcalcLibrarySelectedId,
      window.__alpha87SelectedJobId,
      (typeof selectedJobId !== 'undefined' ? selectedJobId : '')
    ].map(v => String(v || '').trim()).filter(Boolean);
    for (const id of ids) {
      const match = entryFromId(id);
      if (match?.record) return match;
    }
    const pinned = window.__tapcalcPinnedLoadJob;
    if (pinned?.record && String(pinned.id || '').trim()) return pinned;
    return null;
  }
  function showJobsScreen(){
    const jobsScreen = $('jobsScreen');
    if(!jobsScreen) return;
    jobsScreen.hidden = false;
    jobsScreen.style.display = '';
    jobsScreen.style.pointerEvents = 'auto';
    jobsScreen.style.zIndex = '';
    document.body.classList.add('show-library-screen');
  }
  function hideJobsScreen(){
    const jobsScreen = $('jobsScreen');
    if(!jobsScreen) return;
    jobsScreen.classList.remove('active');
    jobsScreen.hidden = true;
    jobsScreen.style.display = 'none';
    jobsScreen.style.pointerEvents = 'none';
    jobsScreen.style.zIndex = '0';
    document.body.classList.remove('show-library-screen');
  }
  function forceLoadSelectedJob(){
    const entry = exactSelectedEntry();
    const status = $('jobsCloudStatus');
    if(!entry?.record){
      if(status) status.textContent = 'Load Job failed: select the job you want to load first.';
      return false;
    }
    pinEntry(entry);
    try {
      if (typeof loadRecordIntoCalculator === 'function') {
        loadRecordIntoCalculator(entry.record, { switchScreen: true, skipPersist: false, message: true });
      }
    } catch (error) {
      console.error('alpha95 Load Job failed', error);
      if(status) status.textContent = 'Load Job failed. See console.';
      return false;
    }
    setTimeout(()=>{
      try { document.querySelector('.screen-tab[data-screen="job"]')?.click(); } catch {}
      try { hideJobsScreen(); } catch {}
    }, 20);
    if(status) status.textContent = `Loaded ${entry.record?.meta?.title || entry.record?.job?.description || entry.record?.job?.jobNumber || 'saved job'} into Current.`;
    return false;
  }
  window.tapCalcForceLoadSelectedJob = forceLoadSelectedJob;
  window.loadSelectedLibraryJob = forceLoadSelectedJob;
  window.tapCalcLibraryLoadSelected = forceLoadSelectedJob;

  document.addEventListener('pointerdown', (e)=>{
    const item = e.target.closest('#jobsSelect .jobs-list-item[data-job-id]');
    if(!item) return;
    const entry = entryFromId(item.dataset.jobId);
    if(entry) pinEntry(entry);
  }, true);
  document.addEventListener('click', (e)=>{
    const item = e.target.closest('#jobsSelect .jobs-list-item[data-job-id]');
    if(item){
      const entry = entryFromId(item.dataset.jobId);
      if(entry) pinEntry(entry);
    }
    const btn = e.target.closest('#jobsLoadSelectedBtn');
    if(btn){
      e.preventDefault(); e.stopPropagation();
      if(typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
      return forceLoadSelectedJob();
    }
    const tab = e.target.closest('.screen-tab[data-screen], [data-go-screen]');
    const next = tab?.dataset?.screen || tab?.dataset?.goScreen;
    if(next === 'jobs') setTimeout(showJobsScreen, 0);
    if(next && next !== 'jobs') setTimeout(hideJobsScreen, 0);
  }, true);
  document.addEventListener('touchstart', (e)=>{
    const item = e.target.closest('#jobsSelect .jobs-list-item[data-job-id]');
    if(!item) return;
    const entry = entryFromId(item.dataset.jobId);
    if(entry) pinEntry(entry);
  }, {capture:true, passive:true});
  document.addEventListener('touchend', (e)=>{
    const btn = e.target.closest('#jobsLoadSelectedBtn');
    if(btn){
      e.preventDefault(); e.stopPropagation();
      if(typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
      return forceLoadSelectedJob();
    }
    const tab = e.target.closest('.screen-tab[data-screen], [data-go-screen]');
    const next = tab?.dataset?.screen || tab?.dataset?.goScreen;
    if(next === 'jobs') setTimeout(showJobsScreen, 0);
    if(next && next !== 'jobs') setTimeout(hideJobsScreen, 0);
  }, true);

  const origRender = window.renderJobsList || (typeof renderJobsList === 'function' ? renderJobsList : null);
  if (typeof origRender === 'function' && !window.__alpha95RenderJobsWrapped) {
    window.__alpha95RenderJobsWrapped = true;
    const wrapped = function(){
      const result = origRender.apply(this, arguments);
      try {
        const exactId = String(window.__tapcalcExactLibrarySelectedId || '').trim();
        if(exactId){
          const item = document.querySelector(`#jobsSelect .jobs-list-item[data-job-id="${CSS.escape(exactId)}"]`);
          if(item){
            document.querySelectorAll('#jobsSelect .jobs-list-item[data-job-id]').forEach((el)=>{
              const active = el === item;
              el.classList.toggle('active', active);
              el.setAttribute('aria-selected', active ? 'true' : 'false');
              el.setAttribute('aria-pressed', active ? 'true' : 'false');
            });
          }
        }
        const btn = $('jobsLoadSelectedBtn');
        if(btn){ btn.onclick = forceLoadSelectedJob; }
      } catch {}
      return result;
    };
    window.renderJobsList = wrapped;
    try { renderJobsList = wrapped; } catch {}
  }

  const origShow = window.showScreen || (typeof showScreen === 'function' ? showScreen : null);
  if (typeof origShow === 'function' && !window.__alpha95ShowWrapped) {
    window.__alpha95ShowWrapped = true;
    const wrappedShow = function(name){
      const result = origShow.apply(this, arguments);
      try {
        if(name === 'jobs') showJobsScreen(); else hideJobsScreen();
      } catch {}
      return result;
    };
    window.showScreen = wrappedShow;
    try { showScreen = wrappedShow; } catch {}
  }

  function mobileScrollFix(){
    const list = $('jobsSelect');
    if(!list) return;
    list.style.overflowY = 'auto';
    list.style.overflowX = 'hidden';
    list.style.webkitOverflowScrolling = 'touch';
    list.style.touchAction = 'pan-y';
    list.style.pointerEvents = 'auto';
    const screen = $('jobsScreen');
    if(screen){ screen.style.touchAction = 'pan-y'; }
  }
  window.addEventListener('pageshow', ()=>setTimeout(mobileScrollFix, 60));
  document.addEventListener('DOMContentLoaded', ()=>setTimeout(mobileScrollFix, 60));
  setTimeout(mobileScrollFix, 250);
})();


/* ===== 3.0.0-alpha126 mobile load job direct detail bind ===== */
(function(){
  const $ = (id) => document.getElementById(id);

  function jobs(){
    try {
      const list = typeof window.getCombinedJobsForDisplay === 'function' ? (window.getCombinedJobsForDisplay() || []) : [];
      return Array.isArray(list) ? list : [];
    } catch { return []; }
  }

  function entryById(id){
    const sid = String(id || '').trim();
    if(!sid) return null;
    return jobs().find((job)=> String(job?.id || '') === sid) || null;
  }

  function pinEntry(entry){
    if(!entry) return;
    const id = String(entry.id || '');
    try { window.__tapcalcExactLibrarySelectedId = id; } catch {}
    try { window.__tapcalcLibrarySelectedId = id; } catch {}
    try { window.__alpha87SelectedJobId = id; } catch {}
    try { window.__tapcalcPinnedLoadJob = { id, record: entry.record || null }; } catch {}
    try { window.__tapcalcLibrarySelectedRecord = entry.record || null; } catch {}
    try { window.__tapcalcDetailSelectedRecord = entry.record || null; } catch {}
    try { window.__tapcalcDetailSelectedId = id; } catch {}
    try { if (typeof selectedJobId !== 'undefined') selectedJobId = id; } catch {}
  }

  function bestEntry(){
    const ids = [
      window.__tapcalcDetailSelectedId,
      window.__tapcalcExactLibrarySelectedId,
      window.__tapcalcLibrarySelectedId,
      window.__alpha87SelectedJobId,
      (typeof selectedJobId !== 'undefined' ? selectedJobId : '')
    ].map(v => String(v || '').trim()).filter(Boolean);
    for (const id of ids) {
      const entry = entryById(id);
      if (entry?.record) return entry;
    }
    if (window.__tapcalcDetailSelectedRecord) return { id: String(window.__tapcalcDetailSelectedId || window.__tapcalcLibrarySelectedId || 'detail'), record: window.__tapcalcDetailSelectedRecord };
    if (window.__tapcalcPinnedLoadJob?.record) return window.__tapcalcPinnedLoadJob;
    if (window.__tapcalcLibrarySelectedRecord) return { id: String(window.__tapcalcLibrarySelectedId || 'selected'), record: window.__tapcalcLibrarySelectedRecord };
    try {
      const list = jobs();
      const fallback = typeof getSelectedCombinedJob === 'function' ? getSelectedCombinedJob(list) : null;
      if (fallback?.record) return fallback;
    } catch {}
    return null;
  }

  function forceMobileFriendlyLoad(){
    const entry = bestEntry();
    const status = $('jobsCloudStatus');
    if (!entry?.record) {
      if (status) status.textContent = 'Load Job failed: select the job you want to load first.';
      return false;
    }
    pinEntry(entry);
    try {
      if (typeof loadRecordIntoCalculator === 'function') {
        loadRecordIntoCalculator(entry.record, { switchScreen: true, skipPersist: false, message: true });
      }
    } catch (error) {
      console.error('alpha95 mobile load failed', error);
      if (status) status.textContent = 'Load Job failed. See console.';
      return false;
    }
    setTimeout(()=>{
      try { document.querySelector('.screen-tab[data-screen="job"]')?.click(); } catch {}
      try { document.getElementById('jobScreen')?.classList.add('active'); } catch {}
      try { document.getElementById('jobsScreen')?.classList.remove('active'); } catch {}
      try { document.getElementById('jobsScreen').hidden = true; } catch {}
      try { document.body.classList.remove('show-library-screen'); } catch {}
    }, 20);
    return false;
  }

  window.tapCalcForceLoadSelectedJob = forceMobileFriendlyLoad;
  window.loadSelectedLibraryJob = forceMobileFriendlyLoad;
  window.tapCalcLibraryLoadSelected = forceMobileFriendlyLoad;

  function bindLoadButton(){
    const btn = $('jobsLoadSelectedBtn');
    if(!btn) return;
    btn.onclick = forceMobileFriendlyLoad;
    btn.ontouchend = function(e){
      if (e) { e.preventDefault(); e.stopPropagation(); if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation(); }
      return forceMobileFriendlyLoad();
    };
    btn.onpointerup = function(e){
      if (e) { e.preventDefault(); e.stopPropagation(); if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation(); }
      return forceMobileFriendlyLoad();
    };
  }

  const origRenderSelected = window.renderSelectedJobDetails || (typeof renderSelectedJobDetails === 'function' ? renderSelectedJobDetails : null);
  if (typeof origRenderSelected === 'function' && !window.__alpha95RenderSelectedWrapped) {
    window.__alpha95RenderSelectedWrapped = true;
    const wrapped = function(){
      const result = origRenderSelected.apply(this, arguments);
      try {
        const list = Array.isArray(arguments[0]) ? arguments[0] : jobs();
        let entry = null;
        try { entry = typeof getSelectedCombinedJob === 'function' ? getSelectedCombinedJob(list) : null; } catch {}
        if (entry?.record) pinEntry(entry);
        bindLoadButton();
      } catch {}
      return result;
    };
    window.renderSelectedJobDetails = wrapped;
    try { renderSelectedJobDetails = wrapped; } catch {}
  }

  document.addEventListener('touchstart', (e)=>{
    const row = e.target.closest('#jobsSelect .jobs-list-item[data-job-id]');
    if(!row) return;
    const entry = entryById(row.dataset.jobId);
    if(entry) pinEntry(entry);
  }, {capture:true, passive:true});

  document.addEventListener('click', (e)=>{
    const row = e.target.closest('#jobsSelect .jobs-list-item[data-job-id]');
    if(row){
      const entry = entryById(row.dataset.jobId);
      if(entry) pinEntry(entry);
    }
    const btn = e.target.closest('#jobsLoadSelectedBtn');
    if(btn){
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
      return forceMobileFriendlyLoad();
    }
  }, true);

  window.addEventListener('pageshow', ()=> setTimeout(bindLoadButton, 60));
  document.addEventListener('DOMContentLoaded', ()=> setTimeout(bindLoadButton, 60));
  setTimeout(bindLoadButton, 120);
})();


/* ===== 3.0.0-alpha126 mobile load job touchstart fix ===== */
(function(){
  const $ = (id) => document.getElementById(id);
  function isCompact(){
    try { return window.matchMedia('(max-width: 820px)').matches; } catch { return window.innerWidth <= 820; }
  }
  function jobs(){
    try {
      const list = typeof window.getCombinedJobsForDisplay === 'function' ? (window.getCombinedJobsForDisplay() || []) : [];
      return Array.isArray(list) ? list : [];
    } catch { return []; }
  }
  function entryById(id){
    const sid = String(id || '').trim();
    if(!sid) return null;
    return jobs().find((job)=> String(job?.id || '') === sid) || null;
  }
  function activeRowId(){
    try {
      const row = document.querySelector('#jobsSelect .jobs-list-item.active[data-job-id], #jobsSelect .jobs-list-item[aria-selected="true"][data-job-id], #jobsSelect .jobs-list-item[aria-pressed="true"][data-job-id]');
      return String(row?.dataset?.jobId || '').trim();
    } catch { return ''; }
  }
  function currentEntry(){
    const btn = $('jobsLoadSelectedBtn');
    const ids = [
      btn?.dataset?.jobId,
      activeRowId(),
      window.__tapcalcDetailSelectedId,
      window.__tapcalcExactLibrarySelectedId,
      window.__tapcalcLibrarySelectedId,
      window.__alpha87SelectedJobId,
      (typeof selectedJobId !== 'undefined' ? selectedJobId : '')
    ].map(v => String(v || '').trim()).filter(Boolean);
    for (const id of ids) {
      const entry = entryById(id);
      if (entry?.record) return entry;
    }
    if (window.__tapcalcPinnedLoadJob?.record) return window.__tapcalcPinnedLoadJob;
    if (window.__tapcalcDetailSelectedRecord) return { id: String(window.__tapcalcDetailSelectedId || 'detail'), record: window.__tapcalcDetailSelectedRecord };
    if (window.__tapcalcLibrarySelectedRecord) return { id: String(window.__tapcalcLibrarySelectedId || 'selected'), record: window.__tapcalcLibrarySelectedRecord };
    return null;
  }
  function pin(entry){
    if(!entry) return;
    const id = String(entry.id || '');
    try { window.__tapcalcExactLibrarySelectedId = id; } catch {}
    try { window.__tapcalcLibrarySelectedId = id; } catch {}
    try { window.__tapcalcDetailSelectedId = id; } catch {}
    try { window.__alpha87SelectedJobId = id; } catch {}
    try { if (typeof selectedJobId !== 'undefined') selectedJobId = id; } catch {}
    try { window.__tapcalcPinnedLoadJob = { id, record: entry.record || null }; } catch {}
    try { window.__tapcalcLibrarySelectedRecord = entry.record || null; } catch {}
    try { window.__tapcalcDetailSelectedRecord = entry.record || null; } catch {}
  }
  function hardExitLibrary(){
    try { if (typeof window.tapCalcSetScreen === 'function') window.tapCalcSetScreen('job'); } catch {}
    try { document.querySelector('.screen-tab[data-screen="job"]')?.click(); } catch {}
    try { $('jobScreen')?.classList.add('active'); } catch {}
    try {
      const jobsScreen = $('jobsScreen');
      if (jobsScreen) {
        jobsScreen.classList.remove('active');
        jobsScreen.hidden = true;
        jobsScreen.style.display = 'none';
        jobsScreen.style.pointerEvents = 'none';
        jobsScreen.style.zIndex = '0';
      }
    } catch {}
    try { document.body.classList.remove('show-library-screen'); } catch {}
  }
  function doLoad(e){
    if (e) {
      try { e.preventDefault(); } catch {}
      try { e.stopPropagation(); } catch {}
      try { if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation(); } catch {}
    }
    const entry = currentEntry();
    const status = $('jobsCloudStatus');
    if (!entry?.record) {
      if (status) status.textContent = 'Load Job failed: select the job you want to load first.';
      return false;
    }
    pin(entry);
    try {
      if (typeof loadRecordIntoCalculator === 'function') {
        loadRecordIntoCalculator(entry.record, { switchScreen: true, skipPersist: false, message: true });
      }
    } catch (error) {
      console.error('alpha95 mobile load failed', error);
      if (status) status.textContent = 'Load Job failed. See console.';
      return false;
    }
    setTimeout(hardExitLibrary, 0);
    setTimeout(hardExitLibrary, 80);
    return false;
  }
  function syncButtonJobId(){
    const btn = $('jobsLoadSelectedBtn');
    if(!btn) return;
    const entry = currentEntry();
    if (entry?.id) btn.dataset.jobId = String(entry.id);
  }
  function bind(){
    const btn = $('jobsLoadSelectedBtn');
    if(!btn || btn.dataset.tc92Bound === '1') { syncButtonJobId(); return; }
    btn.dataset.tc92Bound = '1';
    syncButtonJobId();
    const handler = (e) => doLoad(e);
    btn.onclick = handler;
    btn.ontouchstart = handler;
    btn.onpointerdown = handler;
    btn.addEventListener('touchstart', handler, { capture:true, passive:false });
    btn.addEventListener('pointerdown', handler, { capture:true });
    btn.addEventListener('click', handler, { capture:true });
  }
  document.addEventListener('touchstart', (e)=>{
    const row = e.target.closest('#jobsSelect .jobs-list-item[data-job-id]');
    if (row) {
      const entry = entryById(row.dataset.jobId);
      if (entry) pin(entry);
      setTimeout(syncButtonJobId, 0);
      return;
    }
    const btn = e.target.closest('#jobsLoadSelectedBtn');
    if (btn && isCompact()) return doLoad(e);
  }, { capture:true, passive:false });
  document.addEventListener('pointerdown', (e)=>{
    const row = e.target.closest('#jobsSelect .jobs-list-item[data-job-id]');
    if (row) {
      const entry = entryById(row.dataset.jobId);
      if (entry) pin(entry);
      setTimeout(syncButtonJobId, 0);
      return;
    }
    const btn = e.target.closest('#jobsLoadSelectedBtn');
    if (btn && isCompact()) return doLoad(e);
  }, true);
  const origRender = window.renderSelectedJobDetails || (typeof renderSelectedJobDetails === 'function' ? renderSelectedJobDetails : null);
  if (typeof origRender === 'function' && !window.__alpha95RenderWrapped) {
    window.__alpha95RenderWrapped = true;
    const wrapped = function(){
      const result = origRender.apply(this, arguments);
      try { syncButtonJobId(); bind(); } catch {}
      return result;
    };
    window.renderSelectedJobDetails = wrapped;
    try { renderSelectedJobDetails = wrapped; } catch {}
  }
  window.tapCalcForceLoadSelectedJob = doLoad;
  window.loadSelectedLibraryJob = doLoad;
  window.tapCalcLibraryLoadSelected = doLoad;
  window.addEventListener('pageshow', ()=> setTimeout(()=>{ syncButtonJobId(); bind(); }, 30));
  document.addEventListener('DOMContentLoaded', ()=> setTimeout(()=>{ syncButtonJobId(); bind(); }, 30));
  setTimeout(()=>{ syncButtonJobId(); bind(); }, 120);
})();


/* ===== 3.0.0-alpha126 mobile library viewport + direct load button fix ===== */
(function(){
  const $ = (id) => document.getElementById(id);
  function compact(){
    try { return window.matchMedia('(max-width: 820px)').matches; } catch { return window.innerWidth <= 820; }
  }
  function setBodyLibraryLock(on){
    if (!compact()) return;
    try {
      document.body.classList.toggle('show-library-screen', !!on);
      document.body.style.overflow = '';
      document.body.style.height = '';
    } catch {}
    try {
      const jobsScreen = $('jobsScreen');
      if (jobsScreen) {
        jobsScreen.style.overflowY = on ? 'auto' : '';
        jobsScreen.style.webkitOverflowScrolling = on ? 'touch' : '';
      }
    } catch {}
  }
  function jobs(){
    try {
      const list = typeof window.getCombinedJobsForDisplay === 'function' ? (window.getCombinedJobsForDisplay() || []) : [];
      return Array.isArray(list) ? list : [];
    } catch { return []; }
  }
  function entryById(id){
    const sid = String(id || '').trim();
    if (!sid) return null;
    return jobs().find((job) => String(job?.id || '') === sid) || null;
  }
  function activeRowId(){
    try {
      const row = document.querySelector('#jobsSelect .jobs-list-item.active[data-job-id], #jobsSelect .jobs-list-item[aria-selected="true"][data-job-id], #jobsSelect .jobs-list-item[data-selected="true"][data-job-id]');
      return String(row?.dataset?.jobId || '').trim();
    } catch { return ''; }
  }
  function currentEntry(){
    const btn = $('jobsLoadSelectedBtn');
    const ids = [btn?.dataset?.jobId, activeRowId(), window.__tapcalcDetailSelectedId, window.__tapcalcExactLibrarySelectedId, window.__tapcalcLibrarySelectedId, window.__alpha87SelectedJobId, (typeof selectedJobId !== 'undefined' ? selectedJobId : '')]
      .map(v => String(v || '').trim()).filter(Boolean);
    for (const id of ids) {
      const entry = entryById(id);
      if (entry?.record) return entry;
    }
    if (window.__tapcalcPinnedLoadJob?.record) return window.__tapcalcPinnedLoadJob;
    if (window.__tapcalcDetailSelectedRecord) return { id: String(window.__tapcalcDetailSelectedId || 'detail'), record: window.__tapcalcDetailSelectedRecord };
    if (window.__tapcalcLibrarySelectedRecord) return { id: String(window.__tapcalcLibrarySelectedId || 'selected'), record: window.__tapcalcLibrarySelectedRecord };
    return null;
  }
  function pin(entry){
    if (!entry) return;
    const id = String(entry.id || '');
    try { window.__tapcalcExactLibrarySelectedId = id; } catch {}
    try { window.__tapcalcLibrarySelectedId = id; } catch {}
    try { window.__tapcalcDetailSelectedId = id; } catch {}
    try { window.__alpha87SelectedJobId = id; } catch {}
    try { if (typeof selectedJobId !== 'undefined') selectedJobId = id; } catch {}
    try { window.__tapcalcPinnedLoadJob = { id, record: entry.record || null }; } catch {}
    try { window.__tapcalcLibrarySelectedRecord = entry.record || null; } catch {}
    try { window.__tapcalcDetailSelectedRecord = entry.record || null; } catch {}
    const btn = $('jobsLoadSelectedBtn');
    if (btn) btn.dataset.jobId = id;
  }
  function exitLibrary(){
    try { if (typeof window.tapCalcSetScreen === 'function') window.tapCalcSetScreen('job'); } catch {}
    try { document.querySelector('.screen-tab[data-screen="job"]')?.classList.add('active'); } catch {}
    try { $('jobScreen')?.classList.add('active'); } catch {}
    try {
      const jobsScreen = $('jobsScreen');
      if (jobsScreen) {
        jobsScreen.classList.remove('active');
        jobsScreen.hidden = true;
        jobsScreen.style.display = 'none';
        jobsScreen.style.pointerEvents = 'none';
      }
    } catch {}
    setBodyLibraryLock(false);
  }
  function doLoad(e){
    if (e) {
      try { e.preventDefault(); } catch {}
      try { e.stopPropagation(); } catch {}
      try { if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation(); } catch {}
    }
    const entry = currentEntry();
    const status = $('jobsCloudStatus');
    if (!entry?.record) {
      if (status) status.textContent = 'Load Job failed: select the job you want to load first.';
      return false;
    }
    pin(entry);
    try {
      if (typeof loadRecordIntoCalculator === 'function') {
        loadRecordIntoCalculator(entry.record, { switchScreen: true, skipPersist: false, message: true });
      }
    } catch (error) {
      console.error('alpha95 mobile load failed', error);
      if (status) status.textContent = 'Load Job failed. See console.';
      return false;
    }
    setTimeout(exitLibrary, 0);
    setTimeout(exitLibrary, 80);
    return false;
  }
  function bindButton(){
    const btn = $('jobsLoadSelectedBtn');
    if (!btn) return;
    btn.setAttribute('onclick', 'return false;');
    btn.setAttribute('ontouchstart', 'return false;');
    btn.setAttribute('onpointerdown', 'return false;');
    btn.style.touchAction = 'manipulation';
    btn.style.pointerEvents = 'auto';
    if (btn.dataset.tc93Bound === '1') return;
    btn.dataset.tc93Bound = '1';
    const handler = (ev) => doLoad(ev);
    btn.addEventListener('touchstart', handler, { capture:true, passive:false });
    btn.addEventListener('touchend', handler, { capture:true, passive:false });
    btn.addEventListener('pointerdown', handler, { capture:true });
    btn.addEventListener('click', handler, { capture:true });
  }
  function wireRowSelection(){
    document.querySelectorAll('#jobsSelect .jobs-list-item[data-job-id]').forEach((row) => {
      if (row.dataset.tc93Bound === '1') return;
      row.dataset.tc93Bound = '1';
      const selectRow = () => { const entry = entryById(row.dataset.jobId); if (entry) pin(entry); };
      row.addEventListener('touchstart', selectRow, { capture:true, passive:true });
      row.addEventListener('pointerdown', selectRow, { capture:true });
      row.addEventListener('click', selectRow, { capture:true });
    });
  }
  const origRender = window.renderSelectedJobDetails || (typeof renderSelectedJobDetails === 'function' ? renderSelectedJobDetails : null);
  if (typeof origRender === 'function' && !window.__alpha95RenderWrapped) {
    window.__alpha95RenderWrapped = true;
    const wrapped = function(){
      const result = origRender.apply(this, arguments);
      try { bindButton(); wireRowSelection(); } catch {}
      return result;
    };
    window.renderSelectedJobDetails = wrapped;
    try { renderSelectedJobDetails = wrapped; } catch {}
  }
  document.addEventListener('click', (e) => {
    const tab = e.target.closest('.screen-tab[data-screen]');
    if (!tab) return;
    setBodyLibraryLock(tab.dataset.screen === 'jobs');
  }, true);
  document.addEventListener('touchstart', (e) => {
    const btn = e.target.closest('#jobsLoadSelectedBtn');
    if (btn && compact()) return doLoad(e);
    const tab = e.target.closest('.screen-tab[data-screen]');
    if (tab) setBodyLibraryLock(tab.dataset.screen === 'jobs');
  }, { capture:true, passive:false });
  window.tapCalcForceLoadSelectedJob = doLoad;
  window.loadSelectedLibraryJob = doLoad;
  window.tapCalcLibraryLoadSelected = doLoad;
  window.addEventListener('pageshow', ()=> setTimeout(()=>{ bindButton(); wireRowSelection(); }, 60));
  document.addEventListener('DOMContentLoaded', ()=> setTimeout(()=>{ bindButton(); wireRowSelection(); }, 60));
  setTimeout(()=>{ bindButton(); wireRowSelection(); }, 150);
})();


/* ===== 3.0.0-alpha126 mobile library visible-detail load fix ===== */
(function(){
  const $ = (id) => document.getElementById(id);
  const isMobile = () => {
    try { return window.matchMedia('(max-width: 820px)').matches; } catch { return window.innerWidth <= 820; }
  };
  function jobs(){
    try {
      const list = typeof window.getCombinedJobsForDisplay === 'function' ? (window.getCombinedJobsForDisplay() || []) : [];
      return Array.isArray(list) ? list : [];
    } catch { return []; }
  }
  function entryById(id){
    const sid = String(id || '').trim();
    if(!sid) return null;
    return jobs().find((job)=> String(job?.id || '') === sid) || null;
  }
  function setVisibleEntry(entry){
    if(!entry?.record) return;
    const id = String(entry.id || '');
    window.__tapcalcMobileVisibleDetail = { id, record: entry.record };
    try { window.__tapcalcPinnedLoadJob = { id, record: entry.record }; } catch {}
    try { window.__tapcalcDetailSelectedRecord = entry.record; } catch {}
    try { window.__tapcalcDetailSelectedId = id; } catch {}
    try { window.__tapcalcLibrarySelectedRecord = entry.record; } catch {}
    try { window.__tapcalcLibrarySelectedId = id; } catch {}
    try { if (typeof selectedJobId !== 'undefined') selectedJobId = id; } catch {}
    const btn = $('jobsLoadSelectedBtn');
    if (btn) btn.dataset.jobId = id;
  }
  function currentVisibleEntry(){
    const btn = $('jobsLoadSelectedBtn');
    const ids = [
      btn?.dataset?.jobId,
      window.__tapcalcMobileVisibleDetail?.id,
      window.__tapcalcDetailSelectedId,
      window.__tapcalcLibrarySelectedId,
      (typeof selectedJobId !== 'undefined' ? selectedJobId : '')
    ].map(v => String(v || '').trim()).filter(Boolean);
    for (const id of ids){
      const entry = entryById(id);
      if (entry?.record) return entry;
    }
    if (window.__tapcalcMobileVisibleDetail?.record) return window.__tapcalcMobileVisibleDetail;
    if (window.__tapcalcPinnedLoadJob?.record) return window.__tapcalcPinnedLoadJob;
    return null;
  }
  function exitToCurrent(){
    try { if (typeof window.tapCalcSetScreen === 'function') window.tapCalcSetScreen('job'); } catch {}
    try { document.querySelector('.screen-tab[data-screen="job"]')?.click(); } catch {}
    try { $('jobScreen')?.classList.add('active'); } catch {}
    try {
      const jobsScreen = $('jobsScreen');
      if (jobsScreen) {
        jobsScreen.classList.remove('active');
        jobsScreen.hidden = true;
        jobsScreen.style.display = 'none';
        jobsScreen.style.pointerEvents = 'none';
        jobsScreen.style.zIndex = '0';
      }
    } catch {}
    try { document.body.classList.remove('show-library-screen'); } catch {}
  }
  function mobileLoadFromVisibleDetail(e){
    if(!isMobile()) return true;
    if (e) {
      try { e.preventDefault(); } catch {}
      try { e.stopPropagation(); } catch {}
      try { if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation(); } catch {}
    }
    const entry = currentVisibleEntry();
    const status = $('jobsCloudStatus');
    if (!entry?.record) {
      if (status) status.textContent = 'Load Job failed: select the job you want to load first.';
      return false;
    }
    setVisibleEntry(entry);
    try {
      if (typeof loadRecordIntoCalculator === 'function') {
        loadRecordIntoCalculator(entry.record, { switchScreen: true, skipPersist: false, message: true });
      }
    } catch (error) {
      console.error('alpha96 mobile visible-detail load failed', error);
      if (status) status.textContent = 'Load Job failed. See console.';
      return false;
    }
    setTimeout(exitToCurrent, 10);
    setTimeout(exitToCurrent, 80);
    return false;
  }
  function bindMobileLoadButton(){
    const btn = $('jobsLoadSelectedBtn');
    if(!btn) return;
    const handler = (e) => mobileLoadFromVisibleDetail(e);
    btn.onclick = handler;
    btn.ontouchstart = handler;
    btn.ontouchend = handler;
    btn.onpointerdown = handler;
    btn.onpointerup = handler;
    if (btn.dataset.tc96Bound !== '1') {
      btn.dataset.tc96Bound = '1';
      btn.addEventListener('touchstart', handler, { capture:true, passive:false });
      btn.addEventListener('touchend', handler, { capture:true, passive:false });
      btn.addEventListener('pointerdown', handler, { capture:true });
      btn.addEventListener('click', handler, { capture:true });
    }
  }
  const origRender = window.renderSelectedJobDetails || (typeof renderSelectedJobDetails === 'function' ? renderSelectedJobDetails : null);
  if (typeof origRender === 'function' && !window.__alpha96RenderWrapped) {
    window.__alpha96RenderWrapped = true;
    const wrapped = function(){
      const result = origRender.apply(this, arguments);
      try {
        const list = Array.isArray(arguments[0]) ? arguments[0] : jobs();
        let entry = null;
        try { entry = typeof getSelectedCombinedJob === 'function' ? getSelectedCombinedJob(list) : null; } catch {}
        if (entry?.record) setVisibleEntry(entry);
        bindMobileLoadButton();
      } catch {}
      return result;
    };
    window.renderSelectedJobDetails = wrapped;
    try { renderSelectedJobDetails = wrapped; } catch {}
  }
  document.addEventListener('touchstart', (e) => {
    const row = e.target.closest('#jobsSelect .jobs-list-item[data-job-id]');
    if (!row) return;
    const entry = entryById(row.dataset.jobId);
    if (entry) {
      setVisibleEntry(entry);
      setTimeout(bindMobileLoadButton, 30);
    }
  }, { capture:true, passive:true });
  document.addEventListener('click', (e) => {
    const row = e.target.closest('#jobsSelect .jobs-list-item[data-job-id]');
    if (row) {
      const entry = entryById(row.dataset.jobId);
      if (entry) {
        setVisibleEntry(entry);
        setTimeout(bindMobileLoadButton, 30);
      }
      return;
    }
    const btn = e.target.closest('#jobsLoadSelectedBtn');
    if (btn && isMobile()) {
      return mobileLoadFromVisibleDetail(e);
    }
  }, true);
  const priorLoad = window.tapCalcForceLoadSelectedJob;
  if (!window.tapCalcForceLoadSelectedJobOriginal && typeof priorLoad === 'function') {
    window.tapCalcForceLoadSelectedJobOriginal = priorLoad;
  }
  window.tapCalcForceLoadSelectedJob = function(e){
    if (isMobile()) return mobileLoadFromVisibleDetail(e);
    return window.tapCalcForceLoadSelectedJobOriginal ? window.tapCalcForceLoadSelectedJobOriginal(e) : true;
  };
  window.addEventListener('pageshow', ()=> setTimeout(bindMobileLoadButton, 60));
  document.addEventListener('DOMContentLoaded', ()=> setTimeout(bindMobileLoadButton, 60));
  setTimeout(bindMobileLoadButton, 180);
})();


/* ===== 3.0.0-alpha126 mobile load job exact detail record ===== */
(function(){
  const $ = (id) => document.getElementById(id);
  const isMobile = () => {
    try { return window.matchMedia('(max-width: 820px)').matches; } catch { return window.innerWidth <= 820; }
  };
  function setExactDetailRecord(entry){
    if (!entry || !entry.record) return;
    const id = String(entry.id || '');
    try { window.__tapcalcExactMobileDetailEntry = { id, record: entry.record }; } catch {}
    try { window.__tapcalcPinnedLoadJob = { id, record: entry.record }; } catch {}
    try { window.__tapcalcDetailSelectedRecord = entry.record; } catch {}
    try { window.__tapcalcDetailSelectedId = id; } catch {}
    try { window.__tapcalcLibrarySelectedRecord = entry.record; } catch {}
    try { window.__tapcalcLibrarySelectedId = id; } catch {}
    try { if (typeof selectedJobId !== 'undefined') selectedJobId = id; } catch {}
    const btn = $('jobsLoadSelectedBtn');
    if (btn) btn.dataset.jobId = id;
  }
  function getExactDetailRecord(){
    const direct = window.__tapcalcExactMobileDetailEntry;
    if (direct && direct.record) return direct;
    const id = String(window.__tapcalcDetailSelectedId || window.__tapcalcLibrarySelectedId || '').trim();
    try {
      const list = typeof window.getCombinedJobsForDisplay === 'function' ? (window.getCombinedJobsForDisplay() || []) : [];
      if (id && Array.isArray(list)) {
        const found = list.find(job => String(job?.id || '') === id);
        if (found?.record) return found;
      }
    } catch {}
    return null;
  }
  function hardExitLibrary(){
    try { if (typeof window.tapCalcSetScreen === 'function') window.tapCalcSetScreen('job'); } catch {}
    try { document.querySelector('.screen-tab[data-screen="job"]')?.classList.add('active'); } catch {}
    try { $('jobScreen')?.classList.add('active'); } catch {}
    try {
      const jobsScreen = $('jobsScreen');
      if (jobsScreen) {
        jobsScreen.classList.remove('active');
        jobsScreen.hidden = true;
        jobsScreen.style.display = 'none';
        jobsScreen.style.pointerEvents = 'none';
        jobsScreen.style.zIndex = '0';
      }
    } catch {}
    try { document.body.classList.remove('show-library-screen'); } catch {}
  }
  function mobileExactLoad(ev){
    if (!isMobile()) return true;
    if (ev) {
      try { ev.preventDefault(); } catch {}
      try { ev.stopPropagation(); } catch {}
      try { if (typeof ev.stopImmediatePropagation === 'function') ev.stopImmediatePropagation(); } catch {}
    }
    const entry = getExactDetailRecord();
    const status = $('jobsCloudStatus');
    if (!entry?.record) {
      if (status) status.textContent = 'Load Job failed: select the job you want to load first.';
      return false;
    }
    setExactDetailRecord(entry);
    try {
      loadRecordIntoCalculator(entry.record, { switchScreen: true, skipPersist: false, message: true });
    } catch (error) {
      console.error('alpha97 mobile exact load failed', error);
      if (status) status.textContent = 'Load Job failed. See console.';
      return false;
    }
    setTimeout(hardExitLibrary, 20);
    setTimeout(hardExitLibrary, 120);
    return false;
  }
  const origRender = window.renderSelectedJobDetails || (typeof renderSelectedJobDetails === 'function' ? renderSelectedJobDetails : null);
  if (typeof origRender === 'function' && !window.__alpha97RenderWrapped) {
    window.__alpha97RenderWrapped = true;
    const wrapped = function(){
      const result = origRender.apply(this, arguments);
      try {
        const list = Array.isArray(arguments[0]) ? arguments[0] : (typeof window.getCombinedJobsForDisplay === 'function' ? (window.getCombinedJobsForDisplay() || []) : []);
        let entry = null;
        try { entry = typeof getSelectedCombinedJob === 'function' ? getSelectedCombinedJob(list) : null; } catch {}
        if (entry?.record) setExactDetailRecord(entry);
        const btn = $('jobsLoadSelectedBtn');
        if (btn && btn.dataset.tc97Bound !== '1') {
          btn.dataset.tc97Bound = '1';
          btn.style.width = '100%';
          btn.style.display = 'block';
          const handler = (e) => mobileExactLoad(e);
          btn.addEventListener('touchend', handler, { capture:true, passive:false });
          btn.addEventListener('click', handler, { capture:true });
        }
      } catch {}
      return result;
    };
    window.renderSelectedJobDetails = wrapped;
    try { renderSelectedJobDetails = wrapped; } catch {}
  }
  document.addEventListener('click', (e) => {
    const row = e.target.closest('#jobsSelect .jobs-list-item[data-job-id]');
    if (!row) return;
    try {
      const list = typeof window.getCombinedJobsForDisplay === 'function' ? (window.getCombinedJobsForDisplay() || []) : [];
      const entry = Array.isArray(list) ? list.find(job => String(job?.id || '') === String(row.dataset.jobId || '')) : null;
      if (entry?.record) setExactDetailRecord(entry);
    } catch {}
  }, true);
  window.tapCalcMobileExactLoad = mobileExactLoad;
  const prevForce = window.tapCalcForceLoadSelectedJob;
  window.tapCalcForceLoadSelectedJob = function(e){
    if (isMobile()) return mobileExactLoad(e);
    return typeof prevForce === 'function' ? prevForce(e) : true;
  };
})();


/* ===== 3.0.0-alpha126 mobile load job single-bind + delayed hydrate ===== */
(function(){
  const $ = (id) => document.getElementById(id);
  const isMobile = () => {
    try { return window.matchMedia('(max-width: 820px)').matches; } catch { return window.innerWidth <= 820; }
  };
  function jobs(){
    try {
      const list = typeof window.getCombinedJobsForDisplay === 'function' ? (window.getCombinedJobsForDisplay() || []) : [];
      return Array.isArray(list) ? list : [];
    } catch { return []; }
  }
  function entryById(id){
    const sid = String(id || '').trim();
    if(!sid) return null;
    return jobs().find((job)=> String(job?.id || '') === sid) || null;
  }
  function activeRowId(){
    try {
      const row = document.querySelector('#jobsSelect .jobs-list-item.active[data-job-id], #jobsSelect .jobs-list-item[aria-selected="true"][data-job-id], #jobsSelect .jobs-list-item[data-selected="true"][data-job-id]');
      return String(row?.dataset?.jobId || '').trim();
    } catch { return ''; }
  }
  function pinEntry(entry){
    if(!entry?.record) return null;
    const id = String(entry.id || '').trim();
    try { window.__tapcalcMobilePinnedEntry = { id, record: entry.record }; } catch {}
    try { window.__tapcalcExactMobileDetailEntry = { id, record: entry.record }; } catch {}
    try { window.__tapcalcPinnedLoadJob = { id, record: entry.record }; } catch {}
    try { window.__tapcalcDetailSelectedRecord = entry.record; } catch {}
    try { window.__tapcalcDetailSelectedId = id; } catch {}
    try { window.__tapcalcLibrarySelectedRecord = entry.record; } catch {}
    try { window.__tapcalcLibrarySelectedId = id; } catch {}
    try { window.__tapcalcExactLibrarySelectedId = id; } catch {}
    try { window.__alpha87SelectedJobId = id; } catch {}
    try { if (typeof selectedJobId !== 'undefined') selectedJobId = id; } catch {}
    const btn = $('jobsLoadSelectedBtn');
    if (btn) btn.dataset.jobId = id;
    return entry;
  }
  function currentEntry(){
    const btn = $('jobsLoadSelectedBtn');
    const ids = [
      btn?.dataset?.jobId,
      activeRowId(),
      window.__tapcalcMobilePinnedEntry?.id,
      window.__tapcalcExactMobileDetailEntry?.id,
      window.__tapcalcDetailSelectedId,
      window.__tapcalcLibrarySelectedId,
      window.__tapcalcExactLibrarySelectedId,
      window.__alpha87SelectedJobId,
      (typeof selectedJobId !== 'undefined' ? selectedJobId : '')
    ].map(v => String(v || '').trim()).filter(Boolean);
    for (const id of ids){
      const entry = entryById(id);
      if (entry?.record) return pinEntry(entry);
    }
    if (window.__tapcalcMobilePinnedEntry?.record) return window.__tapcalcMobilePinnedEntry;
    if (window.__tapcalcExactMobileDetailEntry?.record) return window.__tapcalcExactMobileDetailEntry;
    if (window.__tapcalcPinnedLoadJob?.record) return window.__tapcalcPinnedLoadJob;
    return null;
  }
  function hydrateAfterLoad(record){
    try { if (typeof hydrateVisibleFields === 'function') hydrateVisibleFields(record); } catch {}
    try { if (typeof alpha58Hydrate === 'function') alpha58Hydrate(record); } catch {}
    try { if (typeof loadRecordIntoCalculator === 'function') loadRecordIntoCalculator(record, { switchScreen: true, skipPersist: false, message: true }); } catch {}
    try { if (typeof updateJobInfoSummary === 'function') updateJobInfoSummary(); } catch {}
    try { if (typeof window.updateTapCalcShell === 'function') window.updateTapCalcShell(); } catch {}
  }
  function exitLibrary(){
    try { document.body.classList.remove('show-library-screen'); } catch {}
    try {
      const jobsScreen = $('jobsScreen');
      if (jobsScreen) {
        jobsScreen.classList.remove('active');
        jobsScreen.hidden = true;
        jobsScreen.style.display = 'none';
        jobsScreen.style.pointerEvents = 'none';
        jobsScreen.style.zIndex = '0';
      }
    } catch {}
    try { if (typeof window.tapCalcSetScreen === 'function') window.tapCalcSetScreen('job'); } catch {}
    try { document.querySelector('.screen-tab[data-screen="job"]')?.click(); } catch {}
    try { $('jobScreen')?.classList.add('active'); } catch {}
  }
  function mobileLoadJob(e){
    if (!isMobile()) return true;
    if (e) {
      try { e.preventDefault(); } catch {}
      try { e.stopPropagation(); } catch {}
      try { if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation(); } catch {}
    }
    const status = $('jobsCloudStatus');
    const entry = currentEntry();
    if (!entry?.record) {
      if (status) status.textContent = 'Load Job failed: select the job you want to load first.';
      return false;
    }
    pinEntry(entry);
    try {
      hydrateAfterLoad(entry.record);
      setTimeout(() => hydrateAfterLoad(entry.record), 30);
      setTimeout(() => hydrateAfterLoad(entry.record), 140);
      setTimeout(exitLibrary, 220);
      if (status) status.textContent = `Loaded ${entry.record?.meta?.title || entry.record?.job?.description || entry.id || 'saved job'} into TapCalc.`;
    } catch (error) {
      console.error('alpha100 mobile Load Job failed', error);
      if (status) status.textContent = 'Load Job failed. See console.';
      return false;
    }
    return false;
  }
  function replaceAndBindButton(){
    const btn = $('jobsLoadSelectedBtn');
    if (!btn || !isMobile()) return;
    if (btn.dataset.tc98Fresh === '1') return;
    const clone = btn.cloneNode(true);
    clone.dataset.tc98Fresh = '1';
    clone.style.width = '100%';
    clone.style.display = 'block';
    clone.style.margin = '0';
    clone.style.touchAction = 'manipulation';
    clone.onclick = null;
    clone.ontouchstart = null;
    clone.ontouchend = null;
    clone.onpointerdown = null;
    clone.onpointerup = null;
    btn.replaceWith(clone);
    const handler = (ev) => mobileLoadJob(ev);
    clone.addEventListener('touchstart', handler, { capture:true, passive:false });
    clone.addEventListener('click', handler, { capture:true });
    clone.addEventListener('pointerdown', handler, { capture:true });
  }
  function wireRows(){
    if (!isMobile()) return;
    document.querySelectorAll('#jobsSelect .jobs-list-item[data-job-id]').forEach((row) => {
      if (row.dataset.tc98Bound === '1') return;
      row.dataset.tc98Bound = '1';
      const select = () => {
        const entry = entryById(row.dataset.jobId);
        if (entry) pinEntry(entry);
        setTimeout(replaceAndBindButton, 25);
      };
      row.addEventListener('touchstart', select, { capture:true, passive:true });
      row.addEventListener('pointerdown', select, { capture:true });
      row.addEventListener('click', select, { capture:true });
    });
  }
  const origRender = window.renderSelectedJobDetails || (typeof renderSelectedJobDetails === 'function' ? renderSelectedJobDetails : null);
  if (typeof origRender === 'function' && !window.__alpha100RenderWrapped) {
    window.__alpha100RenderWrapped = true;
    const wrapped = function(){
      const result = origRender.apply(this, arguments);
      try {
        const list = Array.isArray(arguments[0]) ? arguments[0] : jobs();
        let entry = null;
        try { entry = typeof getSelectedCombinedJob === 'function' ? getSelectedCombinedJob(list) : null; } catch {}
        if (entry?.record) pinEntry(entry);
        replaceAndBindButton();
        wireRows();
      } catch {}
      return result;
    };
    window.renderSelectedJobDetails = wrapped;
    try { renderSelectedJobDetails = wrapped; } catch {}
  }
  const prevForce = window.tapCalcForceLoadSelectedJob;
  window.tapCalcForceLoadSelectedJob = function(e){
    if (isMobile()) return mobileLoadJob(e);
    return typeof prevForce === 'function' ? prevForce(e) : true;
  };
  window.loadSelectedLibraryJob = window.tapCalcForceLoadSelectedJob;
  window.tapCalcLibraryLoadSelected = window.tapCalcForceLoadSelectedJob;
  window.addEventListener('pageshow', ()=> setTimeout(()=>{ replaceAndBindButton(); wireRows(); }, 80));
  document.addEventListener('DOMContentLoaded', ()=> setTimeout(()=>{ replaceAndBindButton(); wireRows(); }, 80));
  setTimeout(()=>{ replaceAndBindButton(); wireRows(); }, 200);
})();


/* ===== 3.0.0-alpha126 mobile load job use canonical desktop loader ===== */
(function(){
  const $ = (id) => document.getElementById(id);
  const isMobile = () => {
    try { return window.matchMedia('(max-width: 820px)').matches; } catch { return window.innerWidth <= 820; }
  };
  function combinedJobs(){
    try {
      const list = typeof window.getCombinedJobsForDisplay === 'function' ? (window.getCombinedJobsForDisplay() || []) : [];
      return Array.isArray(list) ? list : [];
    } catch { return []; }
  }
  function selectedId(){
    const btn = $('jobsLoadSelectedBtn');
    const active = document.querySelector('#jobsSelect .jobs-list-item.active[data-job-id], #jobsSelect .jobs-list-item[aria-selected="true"][data-job-id], #jobsSelect .jobs-list-item[data-selected="true"][data-job-id]');
    return String(btn?.dataset?.jobId || active?.dataset?.jobId || window.__tapcalcLibrarySelectedId || window.__alpha87SelectedJobId || (typeof selectedJobId !== 'undefined' ? selectedJobId : '') || '').trim();
  }
  function pin(id){
    id = String(id || '').trim();
    if (!id) return '';
    try { if (typeof selectedJobId !== 'undefined') selectedJobId = id; } catch {}
    try { window.__tapcalcLibrarySelectedId = id; } catch {}
    try { window.__alpha87SelectedJobId = id; } catch {}
    const btn = $('jobsLoadSelectedBtn');
    if (btn) btn.dataset.jobId = id;
    const entry = combinedJobs().find((job)=> String(job?.id || '') === id);
    if (entry?.record) {
      try { window.__tapcalcLibrarySelectedRecord = entry.record; } catch {}
      try { window.__tapcalcPinnedLoadJob = { id, record: entry.record }; } catch {}
    }
    return id;
  }
  function exitLibrary(){
    try { document.body.classList.remove('show-library-screen'); } catch {}
    try {
      const jobsScreen = $('jobsScreen');
      if (jobsScreen) {
        jobsScreen.classList.remove('active');
        jobsScreen.hidden = true;
        jobsScreen.style.display = 'none';
        jobsScreen.style.pointerEvents = 'none';
        jobsScreen.style.zIndex = '0';
      }
    } catch {}
    try { if (typeof window.tapCalcSetScreen === 'function') window.tapCalcSetScreen('job'); } catch {}
    try { document.querySelector('.screen-tab[data-screen="job"]')?.click(); } catch {}
  }
  function mobileLoadCanonical(e){
    if (!isMobile()) return true;
    if (e) {
      try { e.preventDefault(); } catch {}
      try { e.stopPropagation(); } catch {}
      try { if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation(); } catch {}
    }
    const status = $('jobsCloudStatus');
    const id = pin(selectedId());
    if (!id) {
      if (status) status.textContent = 'Load Job failed: select the job you want to load first.';
      return false;
    }
    try {
      if (typeof window.alpha47LoadSelectedLibraryJob === 'function') {
        window.alpha47LoadSelectedLibraryJob();
      } else if (typeof window.tapCalcForceLoadSelectedJob === 'function' && window.tapCalcForceLoadSelectedJob !== mobileLoadCanonical) {
        window.tapCalcForceLoadSelectedJob();
      }
      setTimeout(() => {
        try {
          const entry = combinedJobs().find((job)=> String(job?.id || '') === id);
          if (entry?.record && typeof hydrateVisibleFields === 'function') hydrateVisibleFields(entry.record);
        } catch {}
      }, 40);
      setTimeout(exitLibrary, 120);
      return false;
    } catch (error) {
      console.error('alpha100 mobile Load Job failed', error);
      if (status) status.textContent = 'Load Job failed. See console.';
      return false;
    }
  }
  function rebindButton(){
    if (!isMobile()) return;
    const btn = $('jobsLoadSelectedBtn');
    if (!btn) return;
    if (btn.dataset.tc99Fresh === '1') return;
    const clone = btn.cloneNode(true);
    clone.dataset.tc99Fresh = '1';
    clone.style.width = '100%';
    clone.style.display = 'block';
    clone.style.margin = '0';
    clone.style.touchAction = 'manipulation';
    btn.replaceWith(clone);
    const handler = (ev) => mobileLoadCanonical(ev);
    clone.addEventListener('touchstart', handler, {capture:true, passive:false});
    clone.addEventListener('click', handler, {capture:true});
    clone.addEventListener('pointerdown', handler, {capture:true});
  }
  function bindRows(){
    if (!isMobile()) return;
    document.querySelectorAll('#jobsSelect .jobs-list-item[data-job-id]').forEach((row) => {
      if (row.dataset.tc99Bound === '1') return;
      row.dataset.tc99Bound = '1';
      const select = () => {
        pin(row.dataset.jobId || '');
        setTimeout(rebindButton, 25);
      };
      row.addEventListener('touchstart', select, {capture:true, passive:true});
      row.addEventListener('pointerdown', select, {capture:true});
      row.addEventListener('click', select, {capture:true});
    });
  }
  const origRender = window.renderSelectedJobDetails || (typeof renderSelectedJobDetails === 'function' ? renderSelectedJobDetails : null);
  if (typeof origRender === 'function' && !window.__alpha100RenderWrapped) {
    window.__alpha100RenderWrapped = true;
    const wrapped = function(){
      const result = origRender.apply(this, arguments);
      try {
        const list = Array.isArray(arguments[0]) ? arguments[0] : combinedJobs();
        let selected = null;
        const id = selectedId();
        if (id) selected = list.find((job)=> String(job?.id || '') === id) || null;
        if (!selected && typeof getSelectedCombinedJob === 'function') selected = getSelectedCombinedJob(list);
        if (selected?.id) pin(selected.id);
        rebindButton();
        bindRows();
      } catch {}
      return result;
    };
    window.renderSelectedJobDetails = wrapped;
    try { renderSelectedJobDetails = wrapped; } catch {}
  }
  window.tapCalcForceLoadSelectedJob = function(e){
    if (isMobile()) return mobileLoadCanonical(e);
    return typeof window.alpha47LoadSelectedLibraryJob === 'function' ? window.alpha47LoadSelectedLibraryJob(e) : true;
  };
  window.loadSelectedLibraryJob = window.tapCalcForceLoadSelectedJob;
  window.tapCalcLibraryLoadSelected = window.tapCalcForceLoadSelectedJob;
  window.addEventListener('pageshow', ()=> setTimeout(()=>{ bindRows(); rebindButton(); }, 60));
  document.addEventListener('DOMContentLoaded', ()=> setTimeout(()=>{ bindRows(); rebindButton(); }, 60));
  setTimeout(()=>{ bindRows(); rebindButton(); }, 180);
})();


/* ===== 3.0.0-alpha126 mobile load job post-tab force hydrate ===== */
(function(){
  const $ = (id) => document.getElementById(id);
  const isMobile = () => { try { return window.matchMedia('(max-width: 820px)').matches; } catch { return window.innerWidth <= 820; } };
  function allJobs(){
    try {
      const list = typeof window.getCombinedJobsForDisplay === 'function' ? (window.getCombinedJobsForDisplay() || []) : [];
      return Array.isArray(list) ? list : [];
    } catch { return []; }
  }
  function entryById(id){
    const sid = String(id || '').trim();
    if(!sid) return null;
    return allJobs().find((job)=> String(job?.id || '') === sid) || null;
  }
  function selectedEntry(){
    const btn = $('jobsLoadSelectedBtn');
    const active = document.querySelector('#jobsSelect .jobs-list-item.active[data-job-id], #jobsSelect .jobs-list-item[aria-selected="true"][data-job-id], #jobsSelect .jobs-list-item[aria-pressed="true"][data-job-id]');
    const ids = [
      btn?.dataset?.jobId,
      active?.dataset?.jobId,
      window.__tapcalcExactLibrarySelectedId,
      window.__tapcalcDetailSelectedId,
      window.__tapcalcLibrarySelectedId,
      window.__alpha87SelectedJobId,
      (typeof selectedJobId !== 'undefined' ? selectedJobId : '')
    ].map(v => String(v || '').trim()).filter(Boolean);
    for (const id of ids) {
      const entry = entryById(id);
      if (entry?.record) return entry;
    }
    if (window.__tapcalcPinnedLoadJob?.record) return window.__tapcalcPinnedLoadJob;
    if (window.__tapcalcDetailSelectedRecord) return { id: String(window.__tapcalcDetailSelectedId || 'detail'), record: window.__tapcalcDetailSelectedRecord };
    if (window.__tapcalcLibrarySelectedRecord) return { id: String(window.__tapcalcLibrarySelectedId || 'selected'), record: window.__tapcalcLibrarySelectedRecord };
    return null;
  }
  function pin(entry){
    if(!entry) return;
    const id = String(entry.id || '');
    try { window.__tapcalcExactLibrarySelectedId = id; } catch {}
    try { window.__tapcalcDetailSelectedId = id; } catch {}
    try { window.__tapcalcLibrarySelectedId = id; } catch {}
    try { window.__alpha87SelectedJobId = id; } catch {}
    try { if (typeof selectedJobId !== 'undefined') selectedJobId = id; } catch {}
    try { window.__tapcalcPinnedLoadJob = { id, record: entry.record || null }; } catch {}
    try { window.__tapcalcDetailSelectedRecord = entry.record || null; } catch {}
    try { window.__tapcalcLibrarySelectedRecord = entry.record || null; } catch {}
    const btn = $('jobsLoadSelectedBtn');
    if (btn) btn.dataset.jobId = id;
  }
  function exitLibraryToCurrent(){
    try { document.querySelector('.screen-tab[data-screen="job"]')?.click(); } catch {}
    try { if (typeof window.tapCalcSetScreen === 'function') window.tapCalcSetScreen('job'); } catch {}
    try { $('jobScreen')?.classList.add('active'); } catch {}
    try {
      const jobsScreen = $('jobsScreen');
      if (jobsScreen) {
        jobsScreen.classList.remove('active');
        jobsScreen.hidden = true;
        jobsScreen.style.display = 'none';
        jobsScreen.style.pointerEvents = 'none';
        jobsScreen.style.zIndex = '0';
      }
    } catch {}
    try { document.body.classList.remove('show-library-screen'); } catch {}
  }
  function rehydrateRecord(record){
    try {
      if (typeof loadRecordIntoCalculator === 'function') loadRecordIntoCalculator(record, { switchScreen: false, skipPersist: false, message: false });
    } catch {}
    try {
      if (typeof hydrateVisibleFields === 'function') hydrateVisibleFields(record);
    } catch {}
    try {
      if (typeof buildStateFromRecord === 'function' && typeof applyJobState === 'function') {
        const state = buildStateFromRecord(record) || {};
        applyJobState(state);
      }
    } catch {}
    try { if (typeof refreshBcoState === 'function') refreshBcoState(); } catch {}
    try { if (typeof updateBcoDisplays === 'function') updateBcoDisplays(); } catch {}
    try { if (typeof calculateIntegratedBco === 'function') calculateIntegratedBco({ silent:true }); } catch {}
    try { if (typeof calcHotTap === 'function') calcHotTap(); } catch {}
    try { if (typeof calcHtp === 'function') calcHtp(); } catch {}
    try { if (typeof calcLineStop === 'function') calcLineStop(); } catch {}
    try { if (typeof calcCompletionPlug === 'function') calcCompletionPlug(); } catch {}
    try { if (typeof initEtaCalculator === 'function') initEtaCalculator(); } catch {}
    try { if (typeof syncBcoToEta === 'function') syncBcoToEta({ force:true }); } catch {}
    try { if (typeof updateEtaEstimate === 'function') updateEtaEstimate(); } catch {}
    try { if (typeof updateJobInfoSummary === 'function') updateJobInfoSummary(); } catch {}
    try { if (typeof window.updateTapCalcShell === 'function') window.updateTapCalcShell(); } catch {}
  }
  function mobileLoad(ev){
    if (!isMobile()) return true;
    if (ev) {
      try { ev.preventDefault(); } catch {}
      try { ev.stopPropagation(); } catch {}
      try { if (typeof ev.stopImmediatePropagation === 'function') ev.stopImmediatePropagation(); } catch {}
    }
    const entry = selectedEntry();
    const status = $('jobsCloudStatus');
    if (!entry?.record) {
      if (status) status.textContent = 'Load Job failed: select the job you want to load first.';
      return false;
    }
    pin(entry);
    exitLibraryToCurrent();
    rehydrateRecord(entry.record);
    [40, 140, 320, 650].forEach((ms) => setTimeout(() => { exitLibraryToCurrent(); rehydrateRecord(entry.record); }, ms));
    if (status) status.textContent = `Loaded ${entry.record?.meta?.title || entry.record?.job?.description || entry.record?.job?.jobNumber || 'saved job'} into Current.`;
    return false;
  }
  function bindRows(){
    if (!isMobile()) return;
    document.querySelectorAll('#jobsSelect .jobs-list-item[data-job-id]').forEach((row) => {
      if (row.dataset.alpha100Bound === '1') return;
      row.dataset.alpha100Bound = '1';
      const select = () => {
        const entry = entryById(row.dataset.jobId || '');
        if (entry) pin(entry);
        setTimeout(bindButton, 10);
      };
      row.addEventListener('touchstart', select, {capture:true, passive:true});
      row.addEventListener('pointerdown', select, {capture:true});
      row.addEventListener('click', select, {capture:true});
    });
  }
  function bindButton(){
    if (!isMobile()) return;
    const btn = $('jobsLoadSelectedBtn');
    if (!btn) return;
    const currentId = String(window.__tapcalcExactLibrarySelectedId || window.__tapcalcDetailSelectedId || window.__tapcalcLibrarySelectedId || '').trim();
    if (currentId) btn.dataset.jobId = currentId;
    if (btn.dataset.alpha100Fresh !== '1') {
      const clone = btn.cloneNode(true);
      clone.dataset.alpha100Fresh = '1';
      clone.style.width = '100%';
      clone.style.display = 'block';
      clone.style.margin = '0';
      clone.style.touchAction = 'manipulation';
      btn.replaceWith(clone);
      const handler = (e) => mobileLoad(e);
      clone.addEventListener('touchstart', handler, {capture:true, passive:false});
      clone.addEventListener('pointerdown', handler, {capture:true});
      clone.addEventListener('click', handler, {capture:true});
    }
  }
  const origRender = window.renderSelectedJobDetails || (typeof renderSelectedJobDetails === 'function' ? renderSelectedJobDetails : null);
  if (typeof origRender === 'function' && !window.__alpha100RenderWrapped) {
    window.__alpha100RenderWrapped = true;
    const wrapped = function(){
      const result = origRender.apply(this, arguments);
      try {
        const list = Array.isArray(arguments[0]) ? arguments[0] : allJobs();
        const entry = selectedEntry() || list.find((job)=> String(job?.id || '') === String(window.__tapcalcLibrarySelectedId || '')) || null;
        if (entry?.record) pin(entry);
      } catch {}
      setTimeout(() => { bindRows(); bindButton(); }, 0);
      return result;
    };
    window.renderSelectedJobDetails = wrapped;
    try { renderSelectedJobDetails = wrapped; } catch {}
  }
  const prevForce = window.tapCalcForceLoadSelectedJob;
  window.tapCalcForceLoadSelectedJob = function(e){
    if (isMobile()) return mobileLoad(e);
    return typeof prevForce === 'function' ? prevForce(e) : true;
  };
  window.loadSelectedLibraryJob = window.tapCalcForceLoadSelectedJob;
  window.tapCalcLibraryLoadSelected = window.tapCalcForceLoadSelectedJob;
  window.addEventListener('pageshow', ()=> setTimeout(()=>{ bindRows(); bindButton(); }, 80));
  document.addEventListener('DOMContentLoaded', ()=> setTimeout(()=>{ bindRows(); bindButton(); }, 80));
  setTimeout(()=>{ bindRows(); bindButton(); }, 200);
})();


/* ===== 3.0.0-alpha126 mobile load job post-hydrate exit ===== */
(function(){
  const $ = (id) => document.getElementById(id);
  const isMobile = () => {
    try { return window.matchMedia ? window.matchMedia('(max-width: 820px)').matches : window.innerWidth <= 820; } catch { return window.innerWidth <= 820; }
  };
  function allJobs(){
    try {
      const jobs = window.getCombinedJobsForDisplay ? window.getCombinedJobsForDisplay() : [];
      return Array.isArray(jobs) ? jobs : [];
    } catch { return []; }
  }
  function findEntryById(id){
    const key = String(id || '').trim();
    if (!key) return null;
    return allJobs().find((job) => String(job?.id || '').trim() === key) || null;
  }
  function captureVisibleDetailEntry(){
    try {
      const active = document.querySelector('#jobsSelect .jobs-list-item.active[data-job-id]');
      const id = String(active?.dataset?.jobId || window.__tapcalcExactLibrarySelectedId || window.__tapcalcDetailSelectedId || window.__tapcalcLibrarySelectedId || '').trim();
      const entry = findEntryById(id);
      if (entry?.record) {
        window.__tapcalcMobileVisibleEntry = entry;
        window.__tapcalcMobileVisibleJobId = id;
        const btn = $('jobsLoadSelectedBtn');
        if (btn) btn.dataset.jobId = id;
        return entry;
      }
    } catch {}
    return window.__tapcalcMobileVisibleEntry || null;
  }
  function hideLibraryLater(){
    const hide = () => {
      try { document.querySelector('.screen-tab[data-screen="job"]')?.click(); } catch {}
      try { if (typeof window.tapCalcSetScreen === 'function') window.tapCalcSetScreen('job'); } catch {}
      try {
        const jobsScreen = $('jobsScreen');
        if (jobsScreen) {
          jobsScreen.classList.remove('active');
          jobsScreen.hidden = true;
          jobsScreen.style.display = 'none';
          jobsScreen.style.pointerEvents = 'none';
          jobsScreen.style.zIndex = '0';
        }
      } catch {}
      try { document.body.classList.remove('show-library-screen'); } catch {}
    };
    [80, 220, 500].forEach((ms) => setTimeout(hide, ms));
  }
  function mobileLoadFromVisible(e){
    if (!isMobile()) return true;
    try { e?.preventDefault?.(); } catch {}
    try { e?.stopPropagation?.(); } catch {}
    try { e?.stopImmediatePropagation?.(); } catch {}
    const status = $('jobsCloudStatus');
    const entry = captureVisibleDetailEntry();
    if (!entry?.record) {
      if (status) status.textContent = 'Load Job failed: select the job you want to load first.';
      return false;
    }
    try {
      window.__tapcalcExactLibrarySelectedId = String(entry.id || '');
      window.__tapcalcDetailSelectedId = String(entry.id || '');
      window.__tapcalcLibrarySelectedId = String(entry.id || '');
      window.__tapcalcPinnedLoadJob = { id: String(entry.id || ''), record: entry.record };
      window.__tapcalcDetailSelectedRecord = entry.record;
      window.__tapcalcLibrarySelectedRecord = entry.record;
      if (typeof selectedJobId !== 'undefined') selectedJobId = String(entry.id || '');
    } catch {}
    try {
      if (typeof loadRecordIntoCalculator === 'function') {
        loadRecordIntoCalculator(entry.record, { switchScreen: true, skipPersist: false, message: true });
      }
    } catch (err) {
      console.error('alpha101 mobile visible-detail load failed', err);
      if (status) status.textContent = 'Load Job failed. See console.';
      return false;
    }
    try {
      if (typeof buildStateFromRecord === 'function' && typeof applyJobState === 'function') {
        const state = buildStateFromRecord(entry.record) || {};
        [50, 140, 320].forEach((ms) => setTimeout(() => {
          try { applyJobState(state); } catch {}
          try { if (typeof updateJobInfoSummary === 'function') updateJobInfoSummary(); } catch {}
          try { if (typeof window.updateTapCalcShell === 'function') window.updateTapCalcShell(); } catch {}
        }, ms));
      }
    } catch {}
    hideLibraryLater();
    if (status) status.textContent = `Loaded ${entry.record?.meta?.title || entry.record?.job?.description || entry.record?.job?.jobNumber || 'saved job'} into Current.`;
    return false;
  }
  function bindRows(){
    if (!isMobile()) return;
    document.querySelectorAll('#jobsSelect .jobs-list-item[data-job-id]').forEach((row) => {
      if (row.dataset.alpha101Bound === '1') return;
      row.dataset.alpha101Bound = '1';
      const remember = () => {
        const entry = findEntryById(row.dataset.jobId || '');
        if (entry?.record) {
          window.__tapcalcMobileVisibleEntry = entry;
          window.__tapcalcMobileVisibleJobId = String(entry.id || '');
          const btn = $('jobsLoadSelectedBtn');
          if (btn) btn.dataset.jobId = String(entry.id || '');
        }
      };
      row.addEventListener('touchstart', remember, {capture:true, passive:true});
      row.addEventListener('pointerdown', remember, {capture:true});
      row.addEventListener('click', remember, {capture:true});
    });
  }
  function bindButton(){
    if (!isMobile()) return;
    const btn = $('jobsLoadSelectedBtn');
    if (!btn) return;
    const freshNeeded = btn.dataset.alpha101Fresh !== '1';
    let target = btn;
    if (freshNeeded) {
      const clone = document.createElement('button');
      clone.type = 'button';
      clone.id = 'jobsLoadSelectedBtn';
      clone.className = btn.className || 'secondary-btn';
      clone.textContent = btn.textContent || 'Load Job';
      clone.dataset.alpha101Fresh = '1';
      clone.style.width = '100%';
      clone.style.display = 'block';
      clone.style.margin = '0';
      clone.style.touchAction = 'manipulation';
      btn.replaceWith(clone);
      target = clone;
    }
    if (window.__tapcalcMobileVisibleJobId) target.dataset.jobId = window.__tapcalcMobileVisibleJobId;
    if (target.dataset.alpha101Bound === '1') return;
    target.dataset.alpha101Bound = '1';
    const handler = (ev) => mobileLoadFromVisible(ev);
    target.addEventListener('touchstart', handler, {capture:true, passive:false});
    target.addEventListener('pointerdown', handler, {capture:true});
    target.addEventListener('click', handler, {capture:true});
  }
  const origRender = window.renderSelectedJobDetails || (typeof renderSelectedJobDetails === 'function' ? renderSelectedJobDetails : null);
  if (typeof origRender === 'function' && !window.__alpha101RenderWrapped) {
    window.__alpha101RenderWrapped = true;
    const wrapped = function(){
      const result = origRender.apply(this, arguments);
      try { captureVisibleDetailEntry(); } catch {}
      setTimeout(() => { bindRows(); bindButton(); captureVisibleDetailEntry(); }, 0);
      return result;
    };
    window.renderSelectedJobDetails = wrapped;
    try { renderSelectedJobDetails = wrapped; } catch {}
  }
  const prevForce = window.tapCalcForceLoadSelectedJob;
  window.tapCalcForceLoadSelectedJob = function(e){
    if (isMobile()) return mobileLoadFromVisible(e);
    return typeof prevForce === 'function' ? prevForce(e) : true;
  };
  window.loadSelectedLibraryJob = window.tapCalcForceLoadSelectedJob;
  window.tapCalcLibraryLoadSelected = window.tapCalcForceLoadSelectedJob;
  document.addEventListener('click', (event) => {
    if (event.target.closest('#jobsSelect .jobs-list-item[data-job-id]')) setTimeout(() => { captureVisibleDetailEntry(); bindButton(); }, 0);
    if (event.target.closest('.screen-tab[data-screen="jobs"]')) setTimeout(() => { bindRows(); bindButton(); captureVisibleDetailEntry(); }, 80);
  }, true);
  window.addEventListener('pageshow', () => setTimeout(() => { bindRows(); bindButton(); captureVisibleDetailEntry(); }, 120));
  document.addEventListener('DOMContentLoaded', () => setTimeout(() => { bindRows(); bindButton(); captureVisibleDetailEntry(); }, 120));
  setTimeout(() => { bindRows(); bindButton(); captureVisibleDetailEntry(); }, 240);
})();


/* ===== 3.0.0-alpha126 mobile visible-record hardfix ===== */
(function(){
  const $ = (id) => document.getElementById(id);
  function isMobile(){
    try { return window.matchMedia ? window.matchMedia('(max-width: 820px)').matches : window.innerWidth <= 820; } catch { return false; }
  }
  function clone(v){
    try { return JSON.parse(JSON.stringify(v)); } catch { return v; }
  }
  function pinVisibleRecord(record, id){
    if(!record) return;
    try { window.__tapcalcVisibleLibraryRecord = clone(record); } catch { window.__tapcalcVisibleLibraryRecord = record; }
    try { window.__tapcalcVisibleLibraryRecordId = String(id || record?.id || ''); } catch {}
    try { window.__tapcalcDetailSelectedRecord = window.__tapcalcVisibleLibraryRecord; } catch {}
    try { window.__tapcalcDetailSelectedId = String(id || ''); } catch {}
  }
  const origRender = window.renderSelectedJobDetails || (typeof renderSelectedJobDetails === 'function' ? renderSelectedJobDetails : null);
  if (typeof origRender === 'function' && !window.__alpha102RenderWrapped) {
    window.__alpha102RenderWrapped = true;
    const wrapped = function(){
      const result = origRender.apply(this, arguments);
      try {
        const list = Array.isArray(arguments[0]) ? arguments[0] : (typeof window.getCombinedJobsForDisplay === 'function' ? (window.getCombinedJobsForDisplay() || []) : []);
        const activeId = String((typeof selectedJobId !== 'undefined' ? selectedJobId : window.__tapcalcExactLibrarySelectedId || window.__tapcalcLibrarySelectedId || '') || '').trim();
        const selected = list.find((job)=> String(job?.id || '') === activeId) || (typeof getSelectedCombinedJob === 'function' ? getSelectedCombinedJob(list) : null) || list[0] || null;
        if (selected?.record) pinVisibleRecord(selected.record, selected.id);
        const btn = $('jobsLoadSelectedBtn');
        if (btn && isMobile()) {
          const fresh = btn.cloneNode(true);
          try { fresh.removeAttribute('onclick'); } catch {}
          fresh.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); if (typeof window.tapCalcMobileHardLoad === 'function') return window.tapCalcMobileHardLoad(); }, true);
          fresh.addEventListener('touchend', function(e){ e.preventDefault(); e.stopPropagation(); if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation(); if (typeof window.tapCalcMobileHardLoad === 'function') return window.tapCalcMobileHardLoad(); }, {capture:true, passive:false});
          btn.parentNode && btn.parentNode.replaceChild(fresh, btn);
        }
      } catch {}
      return result;
    };
    window.renderSelectedJobDetails = wrapped;
    try { renderSelectedJobDetails = wrapped; } catch {}
  }

  document.addEventListener('click', function(e){
    const item = e.target.closest('#jobsSelect .jobs-list-item[data-job-id]');
    if(!item) return;
    try {
      const list = typeof window.getCombinedJobsForDisplay === 'function' ? (window.getCombinedJobsForDisplay() || []) : [];
      const selected = list.find((job)=> String(job?.id || '') === String(item.dataset.jobId || '')) || null;
      if (selected?.record) pinVisibleRecord(selected.record, selected.id);
    } catch {}
  }, true);

  function hardHydrate(record){
    if(!record) return;
    try { if (typeof loadRecordIntoCalculator === 'function') loadRecordIntoCalculator(record, { switchScreen:true, skipPersist:false, message:true }); } catch {}
    const rerun = () => { try { if (typeof loadRecordIntoCalculator === 'function') loadRecordIntoCalculator(record, { switchScreen:false, skipPersist:false, message:false }); } catch {} };
    setTimeout(rerun, 0);
    setTimeout(rerun, 120);
    setTimeout(rerun, 300);
    setTimeout(()=>{ try { updateCurrentJobLabel(); } catch {} try { updateJobInfoSummary(); } catch {} }, 60);
  }

  function getBestVisibleRecord(){
    if (window.__tapcalcVisibleLibraryRecord) return window.__tapcalcVisibleLibraryRecord;
    if (window.__tapcalcDetailSelectedRecord) return window.__tapcalcDetailSelectedRecord;
    if (window.__tapcalcLibrarySelectedRecord) return window.__tapcalcLibrarySelectedRecord;
    try {
      const list = typeof window.getCombinedJobsForDisplay === 'function' ? (window.getCombinedJobsForDisplay() || []) : [];
      const activeId = String(window.__tapcalcVisibleLibraryRecordId || window.__tapcalcDetailSelectedId || window.__tapcalcExactLibrarySelectedId || window.__tapcalcLibrarySelectedId || (typeof selectedJobId !== 'undefined' ? selectedJobId : '') || '').trim();
      const selected = list.find((job)=> String(job?.id || '') === activeId) || (typeof getSelectedCombinedJob === 'function' ? getSelectedCombinedJob(list) : null) || null;
      return selected?.record || null;
    } catch { return null; }
  }

  window.tapCalcMobileHardLoad = function(){
    const status = $('jobsCloudStatus');
    const record = getBestVisibleRecord();
    if (!record) {
      if (status) status.textContent = 'Load Job failed: no visible library record found.';
      return false;
    }
    if (status) status.textContent = 'Loading selected job...';
    hardHydrate(record);
    setTimeout(()=>{ try { document.querySelector('.screen-tab[data-screen="job"]')?.click(); } catch {} }, 180);
    setTimeout(()=>{ hardHydrate(record); }, 260);
    setTimeout(()=>{
      try { document.getElementById('jobsScreen')?.classList.remove('active'); } catch {}
      try { document.getElementById('jobsScreen').hidden = true; } catch {}
      try { document.body.classList.remove('show-library-screen'); } catch {}
      if (status) status.textContent = `Loaded ${record?.meta?.title || record?.job?.description || record?.job?.jobNumber || 'saved job'} into Current.`;
    }, 420);
    return false;
  };
})();


/* alpha115 canonical library loader reset */
(function(){
  function tc103IsMobileCompact(){
    try { return window.matchMedia ? window.matchMedia('(max-width: 820px)').matches : window.innerWidth <= 820; } catch { return false; }
  }
  function tc103SharedVisible(){
    try { return !!document.querySelector('[data-library-lane-panel="shared"].active'); } catch { return false; }
  }
  function tc103GetJobs(){
    try { return typeof getCombinedJobsForDisplay === 'function' ? getCombinedJobsForDisplay() : []; } catch { return []; }
  }
  function tc103GetSelected(jobs){
    const list = Array.isArray(jobs) ? jobs : tc103GetJobs();
    if (!list.length) return null;
    const id = String(selectedJobId || '');
    return list.find(j => String(j?.id) === id) || null;
  }
  function tc103UpdateSelectionUI(){
    try {
      if (!jobsSelectEl) return;
      jobsSelectEl.querySelectorAll('.jobs-list-item[data-job-id]').forEach((item) => {
        const active = String(item.dataset.jobId || '') === String(selectedJobId || '');
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    } catch {}
  }
  function tc103ShowCurrent(){
    try {
      if (typeof openScreen === 'function') { openScreen('job'); return; }
    } catch {}
    try { document.querySelector('.screen-tab[data-screen="job"]')?.click(); } catch {}
  }
  function tc103CanonicalLoad(record){
    if (!record) return false;
    try { window.__tapCalcSelectedLibraryRecord = record; } catch {}
    try { if (typeof loadRecordIntoCalculator === 'function') loadRecordIntoCalculator(record, { switchScreen: false, message: true }); } catch (e) { console.error('alpha115 loadRecordIntoCalculator failed', e); }
    try { if (typeof tc63Hydrate === 'function') tc63Hydrate(record); } catch {}
    const delays = [0, 60, 180, 360];
    delays.forEach((ms) => setTimeout(() => {
      try { if (typeof loadRecordIntoCalculator === 'function') loadRecordIntoCalculator(record, { switchScreen: false, message: false }); } catch {}
      try { if (typeof tc63Hydrate === 'function') tc63Hydrate(record); } catch {}
      try { if (typeof updateCurrentJobLabel === 'function') updateCurrentJobLabel(); } catch {}
      try { if (typeof updateCardStageChecks === 'function') updateCardStageChecks(); } catch {}
    }, ms));
    setTimeout(tc103ShowCurrent, 40);
    return true;
  }
  window.tapCalcForceLoadSelectedJob = function tc103ForceLoadSelectedJob(){
    const jobs = tc103GetJobs();
    const selected = tc103GetSelected(jobs);
    const record = selected?.record || window.__tapCalcSelectedLibraryRecord || window.__tapCalcVisibleLibraryRecord || null;
    if (!record) return false;
    return tc103CanonicalLoad(record);
  };
  window.renderSelectedJobDetails = function tc103RenderSelectedJobDetails(jobs){
    const list = Array.isArray(jobs) ? jobs : tc103GetJobs();
    if (!jobsListEl) return;
    const compactShared = tc103IsMobileCompact() && tc103SharedVisible();
    if (!list.length) {
      jobsListEl.innerHTML = '<div class="jobs-library-empty">No jobs match this search yet.</div>';
      return;
    }
    const selected = tc103GetSelected(list) || (!compactShared ? list[0] : null);
    if (!selected) {
      jobsListEl.innerHTML = '<div class="jobs-library-empty">Select a job from the list to view its details.</div>';
      return;
    }
    selectedJobId = String(selected.id);
    try { window.__tapCalcSelectedLibraryRecord = selected.record; window.__tapCalcVisibleLibraryRecord = selected.record; } catch {}
    tc103UpdateSelectionUI();
    const record = selected.record || {};
    const title = record?.meta?.title || record?.job?.jobDescription || record?.job?.jobNumber || 'Saved Job';
    const sourceLabel = selected.source === 'local' ? 'Local only' : selected.source === 'synced' ? 'Synced' : 'Shared DB';
    const savedAtDisplay = record?.meta?.savedAtDisplay || record?.savedAt || '—';
    const warnings = [
      ...((record?.warnings?.hotTap) || []),
      ...((record?.warnings?.lineStop) || []),
      ...((record?.warnings?.completionPlug) || [])
    ].filter(Boolean);
    jobsListEl.innerHTML = `
      <div class="job-detail-header">
        <div>
          <div class="job-detail-title">${title}</div>
          <div class="job-detail-subtitle">${savedAtDisplay} • ${record?.meta?.operationType || 'Job'} • ${sourceLabel}</div>
        </div>
        <div class="job-record-badges"><span class="job-source-badge ${selected.source}">${sourceLabel}</span></div>
      </div>
      <div class="job-detail-actions"><button type="button" id="jobsLoadSelectedBtn" class="secondary-btn">Load Job</button></div>
      ${typeof renderJobRecordDetails === 'function' ? renderJobRecordDetails(record) : ''}
      <div class="job-detail-grid">
        <div><strong>Saved:</strong> ${savedAtDisplay}</div>
        <div><strong>Date:</strong> ${record?.job?.date || '—'}</div>
        <div><strong>Job Description:</strong> ${record?.job?.description || '—'}</div>
        <div><strong>Warnings:</strong> ${warnings.length ? warnings.join(' | ') : 'None'}</div>
      </div>`;
    const btn = document.getElementById('jobsLoadSelectedBtn');
    if (btn) {
      const fresh = btn.cloneNode(true);
      btn.replaceWith(fresh);
      fresh.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); window.tapCalcForceLoadSelectedJob(); });
      fresh.addEventListener('touchstart', (event) => { event.stopPropagation(); }, { passive: true });
    }
  };
  window.renderJobsList = function tc103RenderJobsList(){
    if (!jobsListEl) return;
    const jobs = tc103GetJobs();
    if (jobsResultsMetaEl) {
      const countText = `${jobs.length} job${jobs.length === 1 ? '' : 's'} found`;
      const modeLabel = jobsBrowseMode === 'all' ? 'Search' : jobsBrowseMode.charAt(0).toUpperCase() + jobsBrowseMode.slice(1);
      jobsResultsMetaEl.textContent = jobsSearchTerm ? `${countText} for “${jobsSearchTerm}” • ${modeLabel} view` : `${countText} • ${modeLabel} view`;
    }
    if (!jobs.length) {
      if (jobsSelectEl) jobsSelectEl.innerHTML = '<div class="jobs-library-empty">No jobs match this search yet.</div>';
      jobsListEl.innerHTML = '<div class="jobs-library-empty">No jobs match this search yet.</div>';
      return;
    }
    const previousSelectedId = selectedJobId ? String(selectedJobId) : '';
    const selectedStillExists = jobs.some((job) => String(job.id) === previousSelectedId);
    const compactShared = tc103IsMobileCompact() && tc103SharedVisible();
    selectedJobId = compactShared ? (selectedStillExists ? previousSelectedId : '') : (selectedStillExists ? previousSelectedId : String(jobs[0].id));
    if (jobsSelectEl) {
      const previousScrollTop = jobsSelectEl.scrollTop;
      jobsSelectEl.innerHTML = '';
      const frag = document.createDocumentFragment();
      jobs.forEach(({ source, id, record }) => {
        const title = record?.meta?.title || record?.job?.description || record?.job?.jobNumber || 'Saved Job';
        const client = record?.job?.client || 'No customer';
        const date = record?.job?.date || record?.meta?.savedAtDisplay || 'No date';
        const op = record?.meta?.operationType || 'Job';
        const nominalSize = record?.pipe?.nominalSize || '—';
        const sourceLabel = source === 'local' ? 'Local' : source === 'synced' ? 'Synced' : 'Shared';
        const groupPrefix = jobsBrowseMode === 'customer'
          ? `Customer: ${client}`
          : jobsBrowseMode === 'location'
            ? `Location: ${record?.job?.location || 'No location'}`
            : jobsBrowseMode === 'date'
              ? `Date: ${date}`
              : 'Search';
        const isActive = String(id) === String(selectedJobId || '');
        const item = document.createElement('div');
        item.className = `jobs-list-item${isActive ? ' active' : ''}`;
        item.dataset.jobId = String(id);
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        item.innerHTML = `<span class="jobs-list-title"></span><span class="jobs-list-meta"></span>`;
        item.querySelector('.jobs-list-title').textContent = title;
        item.querySelector('.jobs-list-meta').textContent = `${groupPrefix} • ${client} • ${op} • ${nominalSize} • ${sourceLabel}`;
        const selectThis = (event) => {
          if (event) { event.preventDefault(); event.stopPropagation(); }
          selectedJobId = String(id);
          try { window.__tapCalcSelectedLibraryRecord = record; window.__tapCalcVisibleLibraryRecord = record; } catch {}
          tc103UpdateSelectionUI();
          window.renderSelectedJobDetails(jobs);
        };
        item.addEventListener('click', selectThis);
        item.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') selectThis(event); });
        frag.appendChild(item);
      });
      jobsSelectEl.appendChild(frag);
      jobsSelectEl.scrollTop = previousScrollTop;
      try {
        jobsSelectEl.style.overflowY = 'auto';
        jobsSelectEl.style.webkitOverflowScrolling = 'touch';
      } catch {}
    }
    tc103UpdateSelectionUI();
    window.renderSelectedJobDetails(jobs);
  };
  try { renderJobsList = window.renderJobsList; } catch {}
  try { renderSelectedJobDetails = window.renderSelectedJobDetails; } catch {}
  try { setTimeout(() => { if (typeof window.renderJobsList === 'function') window.renderJobsList(); }, 0); } catch {}
})();


/* alpha115 mobile pending load bridge */
(function(){
  const MOBILE_MEDIA='(max-width: 820px)';
  const isMobile=()=>{ try { return window.matchMedia ? window.matchMedia(MOBILE_MEDIA).matches : window.innerWidth <= 820; } catch { return window.innerWidth <= 820; } };
  const $=(id)=>document.getElementById(id);
  function getJobs(){
    try {
      if (typeof window.getCombinedJobsForDisplay === 'function') return window.getCombinedJobsForDisplay() || [];
    } catch {}
    return [];
  }
  function getSelectedId(){
    try {
      const active=document.querySelector('#jobsSelect .jobs-list-item.active[data-job-id]');
      if(active?.dataset?.jobId) return String(active.dataset.jobId);
    } catch {}
    try {
      const btn=$('jobsLoadSelectedBtn');
      if(btn?.dataset?.jobId) return String(btn.dataset.jobId);
    } catch {}
    try { if (typeof selectedJobId !== 'undefined' && selectedJobId) return String(selectedJobId); } catch {}
    return '';
  }
  function getSelectedEntry(){
    const jobs=getJobs();
    const id=getSelectedId();
    if(id){
      const match=jobs.find(j => String(j.id)===String(id));
      if(match) return match;
    }
    try {
      const active=document.querySelector('#jobsSelect .jobs-list-item.active[data-job-id]');
      if(active?.dataset?.jobId){
        const match=jobs.find(j => String(j.id)===String(active.dataset.jobId));
        if(match) return match;
      }
    } catch {}
    return null;
  }
  function applyRecord(record){
    if(!record) return false;
    try { window.__tapcalcMobilePendingRecord = record; } catch {}
    try { sessionStorage.setItem('tapcalc-mobile-pending-record', JSON.stringify(record)); } catch {}
    let ok=false;
    const run=()=>{
      try {
        if (typeof loadRecordIntoCalculator === 'function') {
          loadRecordIntoCalculator(record, { switchScreen: false, message: true });
          ok=true;
        }
      } catch(e) { console.error('alpha115 mobile applyRecord failed', e); }
    };
    run();
    setTimeout(run, 0);
    setTimeout(run, 60);
    setTimeout(run, 180);
    setTimeout(run, 360);
    return ok;
  }
  function showCurrentLikeDesktop(){
    try { document.querySelector('.screen-tab[data-screen="job"]')?.click(); } catch {}
    setTimeout(()=>{ try { document.querySelector('.screen-tab[data-screen="job"]')?.click(); } catch {} }, 50);
  }
  function mobileLoadSelected(ev){
    if(ev){ try { ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation(); } catch {} }
    const entry=getSelectedEntry();
    if(!entry?.record){
      try { $('jobsCloudStatus').textContent = 'Select a job first.'; } catch {}
      return false;
    }
    try { window.__tapcalcLastExplicitSelectedJobId = String(entry.id); } catch {}
    applyRecord(entry.record);
    showCurrentLikeDesktop();
    setTimeout(()=>applyRecord(entry.record), 80);
    setTimeout(()=>applyRecord(entry.record), 220);
    return false;
  }
  window.tapCalcForceLoadSelectedJob = function(){
    if(!isMobile()){
      const entry=getSelectedEntry();
      if(entry?.record && typeof loadRecordIntoCalculator === 'function'){
        try { loadRecordIntoCalculator(entry.record, { switchScreen: true, skipPersist: false, message: true }); return false; } catch {}
      }
    }
    return mobileLoadSelected();
  };
  function bindBtn(){
    const btn=$('jobsLoadSelectedBtn');
    if(!btn) return;
    const entry=getSelectedEntry();
    if(entry?.id) btn.dataset.jobId = String(entry.id);
    if(btn.dataset.alpha115Bound==='1') return;
    btn.dataset.alpha115Bound='1';
    btn.removeAttribute('onclick');
    ['touchstart','touchend','pointerdown','pointerup','click'].forEach(type=>{
      btn.addEventListener(type, function(e){ if(isMobile()) mobileLoadSelected(e); }, {capture:true});
    });
  }
  function pinFromRow(el){
    if(!el?.dataset?.jobId) return;
    try { window.__tapcalcLastExplicitSelectedJobId = String(el.dataset.jobId); } catch {}
    const btn=$('jobsLoadSelectedBtn');
    if(btn) btn.dataset.jobId = String(el.dataset.jobId);
  }
  document.addEventListener('touchstart', function(e){
    const row=e.target.closest('#jobsSelect .jobs-list-item[data-job-id]');
    if(row) pinFromRow(row);
  }, {capture:true, passive:true});
  document.addEventListener('pointerdown', function(e){
    const row=e.target.closest('#jobsSelect .jobs-list-item[data-job-id]');
    if(row) pinFromRow(row);
  }, {capture:true});
  document.addEventListener('click', function(e){
    const row=e.target.closest('#jobsSelect .jobs-list-item[data-job-id]');
    if(row) pinFromRow(row);
    const btn=e.target.closest('#jobsLoadSelectedBtn');
    if(btn) bindBtn();
  }, {capture:true});
  const origRender=window.renderSelectedJobDetails || (typeof renderSelectedJobDetails==='function' ? renderSelectedJobDetails : null);
  if(typeof origRender==='function'){
    const wrapped=function(){
      const result=origRender.apply(this, arguments);
      setTimeout(bindBtn, 0);
      return result;
    };
    window.renderSelectedJobDetails=wrapped;
    try { renderSelectedJobDetails=wrapped; } catch {}
  } else {
    setInterval(bindBtn, 500);
  }
})();


/* ===== 3.0.0-alpha126 canonical final library/load reset ===== */
(() => {
  const $ = (id) => document.getElementById(id);
  const isCompact = () => {
    try { return window.matchMedia ? window.matchMedia('(max-width: 820px)').matches : window.innerWidth <= 820; } catch { return window.innerWidth <= 820; }
  };
  const getJobs = () => {
    try { return typeof getCombinedJobsForDisplay === 'function' ? getCombinedJobsForDisplay() : []; } catch { return []; }
  };
  const getSelected = (jobs = null) => {
    const list = Array.isArray(jobs) ? jobs : getJobs();
    const activeId = String(
      (window.__tapcalcLibrarySelectedId || '') ||
      (typeof selectedJobId !== 'undefined' ? selectedJobId : '') ||
      document.querySelector('.jobs-list-item.active')?.dataset?.jobId || ''
    ).trim();
    return list.find((job) => String(job.id) === activeId) || list[0] || null;
  };
  const syncSelected = (id) => {
    try { selectedJobId = String(id || ''); } catch {}
    try { window.__tapcalcLibrarySelectedId = String(id || ''); } catch {}
    try { updateJobsListSelectionUI(); } catch {}
  };

  function loadSelectedCanonical(event){
    if (event) {
      try { event.preventDefault(); } catch {}
      try { event.stopPropagation(); } catch {}
      try { event.stopImmediatePropagation(); } catch {}
    }
    const jobs = getJobs();
    const selected = getSelected(jobs);
    if (!selected?.record) return false;
    syncSelected(selected.id);
    try { loadRecordIntoCalculator(selected.record, { message: true }); } catch (error) { console.error('alpha115 canonical load failed', error); }
    setTimeout(() => {
      try { loadRecordIntoCalculator(selected.record, { message: false }); } catch {}
      try { document.querySelector('.screen-tab[data-screen="job"]')?.click(); } catch {}
      try { document.body.classList.remove('show-library-screen'); } catch {}
      try { $('jobsScreen')?.classList.remove('active'); } catch {}
    }, 60);
    setTimeout(() => { try { loadRecordIntoCalculator(selected.record, { message: false }); } catch {} }, 180);
    return false;
  }

  function renderSelectedCanonical(jobs = null) {
    const list = Array.isArray(jobs) ? jobs : getJobs();
    const detailsEl = $('jobsList');
    if (!detailsEl) return;
    if (!list.length) {
      detailsEl.innerHTML = '<div class="jobs-library-empty">No jobs match this search yet.</div>';
      return;
    }
    const compactShared = (() => {
      try {
        const sharedVisible = document.querySelector('[data-library-lane-panel="shared"]')?.classList.contains('active');
        return isCompact() && sharedVisible;
      } catch { return false; }
    })();
    const selected = getSelected(list);
    if (compactShared && !selected?.id) {
      detailsEl.innerHTML = '<div class="jobs-library-empty">Select a job from the list to view its details.</div>';
      return;
    }
    if (!selected?.record) {
      detailsEl.innerHTML = '<div class="jobs-library-empty">Select a job from the list to view its details.</div>';
      return;
    }
    syncSelected(selected.id);
    const record = selected.record || {};
    const title = record?.meta?.title || record?.job?.jobDescription || record?.job?.jobNumber || 'Saved Job';
    const sourceLabel = selected.source === 'local' ? 'Local only' : selected.source === 'synced' ? 'Synced' : 'Shared DB';
    const savedAtDisplay = record?.meta?.savedAtDisplay || record?.savedAt || '—';
    const warnings = [
      ...(record?.warnings?.hotTap || []),
      ...(record?.warnings?.lineStop || []),
      ...(record?.warnings?.completionPlug || [])
    ].filter(Boolean);
    detailsEl.innerHTML = `
      <div class="job-detail-header">
        <div>
          <div class="job-detail-title">${title}</div>
          <div class="job-detail-subtitle">${savedAtDisplay} • ${record?.meta?.operationType || 'Job'} • ${sourceLabel}</div>
        </div>
        <div class="job-record-badges">
          <span class="job-source-badge ${selected.source}">${sourceLabel}</span>
        </div>
      </div>
      <div class="job-detail-actions">
        <button type="button" id="jobsLoadSelectedBtnFinal" class="secondary-btn">Load Job</button>
      </div>
      ${typeof renderJobRecordDetails === 'function' ? renderJobRecordDetails(record) : ''}
      <div class="job-detail-grid">
        <div><strong>Saved:</strong> ${savedAtDisplay}</div>
        <div><strong>Date:</strong> ${record?.job?.date || '—'}</div>
        <div><strong>Job Description:</strong> ${record?.job?.description || '—'}</div>
        <div><strong>Warnings:</strong> ${warnings.length ? warnings.join(' | ') : 'None'}</div>
      </div>`;
    const btn = $('jobsLoadSelectedBtnFinal');
    if (btn) {
      btn.dataset.jobId = String(selected.id || '');
      btn.addEventListener('click', loadSelectedCanonical, { capture: true });
      btn.addEventListener('touchstart', loadSelectedCanonical, { capture: true, passive: false });
    }
  }

  function renderJobsCanonical() {
    const detailsEl = $('jobsList');
    if (!detailsEl) return;
    const listEl = $('jobsSelect');
    const jobs = getJobs();
    if (typeof jobsResultsMetaEl !== 'undefined' && jobsResultsMetaEl) {
      const countText = `${jobs.length} job${jobs.length === 1 ? '' : 's'} found`;
      const modeLabel = jobsBrowseMode === 'all' ? 'Search' : jobsBrowseMode.charAt(0).toUpperCase() + jobsBrowseMode.slice(1);
      jobsResultsMetaEl.textContent = jobsSearchTerm ? `${countText} for “${jobsSearchTerm}” • ${modeLabel} view` : `${countText} • ${modeLabel} view`;
    }
    if (!jobs.length) {
      if (listEl) listEl.innerHTML = '<div class="jobs-library-empty">No jobs match this search yet.</div>';
      detailsEl.innerHTML = '<div class="jobs-library-empty">No jobs match this search yet.</div>';
      return;
    }
    const prev = String((window.__tapcalcLibrarySelectedId || '') || (typeof selectedJobId !== 'undefined' ? selectedJobId : '') || '').trim();
    const selectedStillExists = jobs.some((job) => String(job.id) === prev);
    const compactShared = (() => {
      try {
        const sharedVisible = document.querySelector('[data-library-lane-panel="shared"]')?.classList.contains('active');
        return isCompact() && sharedVisible;
      } catch { return false; }
    })();
    syncSelected(compactShared ? (selectedStillExists ? prev : '') : (selectedStillExists ? prev : String(jobs[0].id)));
    if (listEl) {
      const previousScrollTop = listEl.scrollTop;
      listEl.innerHTML = '';
      const frag = document.createDocumentFragment();
      jobs.forEach(({ source, id, record }) => {
        const title = record?.meta?.title || record?.job?.description || record?.job?.jobNumber || 'Saved Job';
        const client = record?.job?.client || 'No customer';
        const date = record?.job?.date || record?.meta?.savedAtDisplay || 'No date';
        const op = record?.meta?.operationType || 'Job';
        const nominalSize = record?.pipe?.nominalSize || '—';
        const sourceLabel = source === 'local' ? 'Local' : source === 'synced' ? 'Synced' : 'Shared';
        const groupPrefix = jobsBrowseMode === 'customer'
          ? `Customer: ${client}`
          : jobsBrowseMode === 'location'
            ? `Location: ${record?.job?.location || 'No location'}`
            : jobsBrowseMode === 'date'
              ? `Date: ${date}`
              : 'Search';
        const active = String(id) === String((window.__tapcalcLibrarySelectedId || '') || (typeof selectedJobId !== 'undefined' ? selectedJobId : '') || '');
        const item = document.createElement('div');
        item.className = `jobs-list-item${active ? ' active' : ''}`;
        item.dataset.jobId = String(id);
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.setAttribute('aria-pressed', active ? 'true' : 'false');
        item.innerHTML = `<span class="jobs-list-title"></span><span class="jobs-list-meta"></span>`;
        item.querySelector('.jobs-list-title').textContent = title;
        item.querySelector('.jobs-list-meta').textContent = `${groupPrefix} • ${client} • ${op} • ${nominalSize} • ${sourceLabel}`;
        const selectThis = (event) => {
          if (event) {
            try { event.preventDefault(); } catch {}
            try { event.stopPropagation(); } catch {}
          }
          syncSelected(id);
          renderSelectedCanonical(jobs);
        };
        item.addEventListener('click', selectThis, { capture: true });
        item.addEventListener('touchstart', selectThis, { capture: true, passive: false });
        item.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') selectThis(event);
        });
        frag.appendChild(item);
      });
      listEl.appendChild(frag);
      listEl.scrollTop = previousScrollTop;
    }
    try { updateJobsListSelectionUI(); } catch {}
    renderSelectedCanonical(jobs);
  }

  window.tapCalcForceLoadSelectedJob = loadSelectedCanonical;
  window.renderSelectedJobDetails = renderSelectedCanonical;
  window.renderJobsList = renderJobsCanonical;
  try { renderSelectedJobDetails = renderSelectedCanonical; } catch {}
  try { renderJobsList = renderJobsCanonical; } catch {}
  setTimeout(() => { try { renderJobsCanonical(); } catch (e) { console.error('alpha115 initial render failed', e); } }, 50);
})();


// alpha115 mobile Load Job debug tracer
(function(){
  const isCompact = () => {
    try { return window.matchMedia ? window.matchMedia('(max-width: 820px)').matches : window.innerWidth <= 820; } catch { return false; }
  };
  const status = (msg) => {
    try {
      const el = document.getElementById('jobsCloudStatus');
      if (el) el.textContent = msg;
      console.log('[alpha115-mobile-debug]', msg);
    } catch {}
  };
  const txt = (sel) => (document.querySelector(sel)?.textContent || '').trim();
  const val = (id) => (document.getElementById(id)?.value || '').trim();
  const mobileTrace = (phase) => {
    if (!isCompact()) return;
    const activeId = (window.selectedJobId || '').toString();
    const title = txt('.job-detail-title');
    const subtitle = txt('.job-detail-subtitle');
    const currentClient = val('jobClient');
    const currentJob = val('jobDescription') || val('jobNumber');
    status(`${phase} | selectedJobId=${activeId || 'none'} | detail=${title || 'none'} | currentClient=${currentClient || 'blank'} | currentJob=${currentJob || 'blank'} | ${subtitle || ''}`);
  };
  document.addEventListener('click', (e) => {
    if (!isCompact()) return;
    const item = e.target.closest('.jobs-list-item[data-job-id]');
    if (item) {
      setTimeout(() => {
        status(`ROW CLICK | rowId=${item.dataset.jobId || 'none'} | detail=${txt('.job-detail-title') || 'none'}`);
      }, 25);
    }
  }, true);
  const bindBtn = () => {
    if (!isCompact()) return;
    const btn = document.getElementById('jobsLoadSelectedBtn');
    if (!btn || btn.dataset.alpha115DebugBound) return;
    btn.dataset.alpha115DebugBound = '1';
    ['touchstart','pointerdown','click'].forEach((evt) => {
      btn.addEventListener(evt, () => {
        mobileTrace(`LOAD BTN ${evt}`);
        setTimeout(() => mobileTrace(`POST ${evt} 150ms`), 150);
        setTimeout(() => mobileTrace(`POST ${evt} 500ms`), 500);
        setTimeout(() => mobileTrace(`POST ${evt} 1200ms`), 1200);
      }, true);
    });
  };
  const mo = new MutationObserver(() => bindBtn());
  const start = () => {
    bindBtn();
    try { mo.observe(document.body, {childList:true, subtree:true}); } catch {}
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();



/* ===== 3.0.0-alpha126 mobile pending hydrate + library layout fix ===== */
(() => {
  const VERSION = '3.0.0-alpha126';
  const $ = (id) => document.getElementById(id);
  const isMobile = () => {
    try { return window.matchMedia ? window.matchMedia('(max-width: 820px)').matches : window.innerWidth <= 820; } catch { return window.innerWidth <= 820; }
  };
  const getJobs = () => {
    try { return typeof getCombinedJobsForDisplay === 'function' ? getCombinedJobsForDisplay() : []; } catch { return []; }
  };
  const getSelected = () => {
    const jobs = getJobs();
    const activeId = String((window.__tapcalcLibrarySelectedId || '') || (typeof selectedJobId !== 'undefined' ? selectedJobId : '') || document.querySelector('.jobs-list-item.active')?.dataset?.jobId || '').trim();
    return jobs.find((job) => String(job.id) === activeId) || null;
  };
  function forceHydrateRecord(record, message = true) {
    if (!record) return false;
    try {
      if (typeof loadRecordIntoCalculator === 'function') {
        loadRecordIntoCalculator(record, { switchScreen: false, skipPersist: false, message });
      }
    } catch (error) {
      console.error('alpha115 forceHydrateRecord failed', error);
    }
    try {
      const state = typeof buildStateFromRecord === 'function' ? buildStateFromRecord(record) : null;
      if (state && typeof applyJobState === 'function') applyJobState(state);
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
        jobNotes: record?.job?.notes
      };
      Object.entries(directMap).forEach(([id, value]) => {
        const el = $(id);
        if (!el) return;
        el.value = value == null ? '' : String(value);
        try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch {}
        try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch {}
      });
      try { if (typeof persistCurrentJob === 'function') persistCurrentJob(); } catch {}
      try { if (typeof updateJobInfoSummary === 'function') updateJobInfoSummary(); } catch {}
      try { if (typeof window.updateTapCalcShell === 'function') window.updateTapCalcShell(); } catch {}
    } catch (error) {
      console.error('alpha115 direct field hydrate failed', error);
    }
    return true;
  }
  function setPending(record) {
    window.__tapcalcPendingMobileLoadRecord = record || null;
    try { sessionStorage.setItem('tapcalcPendingMobileLoadRecord', JSON.stringify(record || null)); } catch {}
  }
  function getPending() {
    if (window.__tapcalcPendingMobileLoadRecord) return window.__tapcalcPendingMobileLoadRecord;
    try {
      const raw = sessionStorage.getItem('tapcalcPendingMobileLoadRecord');
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }
  function clearPending() {
    window.__tapcalcPendingMobileLoadRecord = null;
    try { sessionStorage.removeItem('tapcalcPendingMobileLoadRecord'); } catch {}
  }
  function applyPendingAfterSwitch() {
    if (!isMobile()) return;
    const record = getPending();
    if (!record) return;
    const run = (delay, message = false) => setTimeout(() => forceHydrateRecord(record, message), delay);
    run(20, true);
    run(120, false);
    run(320, false);
    setTimeout(clearPending, 800);
  }
  function mobileLoadFromFinalButton(event) {
    if (!isMobile()) return;
    const btn = event.target.closest('#jobsLoadSelectedBtnFinal');
    if (!btn) return;
    try { event.preventDefault(); } catch {}
    try { event.stopPropagation(); } catch {}
    try { event.stopImmediatePropagation(); } catch {}
    const selected = getSelected();
    const record = selected?.record || null;
    if (!record) return false;
    setPending(record);
    forceHydrateRecord(record, true);
    try { document.querySelector('.screen-tab[data-screen="job"]')?.click(); } catch {}
    applyPendingAfterSwitch();
    setTimeout(() => {
      try { document.body.classList.remove('show-library-screen'); } catch {}
      try { $('jobsScreen')?.classList.remove('active'); } catch {}
    }, 450);
    return false;
  }
  document.addEventListener('click', mobileLoadFromFinalButton, true);
  document.addEventListener('touchstart', mobileLoadFromFinalButton, { capture: true, passive: false });
  document.addEventListener('pointerdown', mobileLoadFromFinalButton, true);
  document.addEventListener('click', (event) => {
    const tab = event.target.closest('.screen-tab[data-screen="job"]');
    if (!tab || !isMobile()) return;
    applyPendingAfterSwitch();
  }, true);
  window.addEventListener('pageshow', () => { if (isMobile()) setTimeout(applyPendingAfterSwitch, 40); });
  window.tapCalcApplyPendingMobileLoad = applyPendingAfterSwitch;
})();


/* ===== 3.0.0-alpha126 mobile direct library load final override ===== */
(() => {
  const isMobile = () => {
    try { return window.matchMedia ? window.matchMedia('(max-width: 820px)').matches : window.innerWidth <= 820; } catch { return window.innerWidth <= 820; }
  };
  const $ = (id) => document.getElementById(id);
  const getJobs = () => {
    try { return typeof getCombinedJobsForDisplay === 'function' ? getCombinedJobsForDisplay() : []; } catch { return []; }
  };
  const getSelected = (jobs = null) => {
    const list = Array.isArray(jobs) ? jobs : getJobs();
    const activeId = String((window.__tapcalcLibrarySelectedId || '') || (typeof selectedJobId !== 'undefined' ? selectedJobId : '') || '').trim();
    return list.find((job) => String(job.id) === activeId) || null;
  };
  const syncSelected = (id) => {
    try { selectedJobId = String(id || ''); } catch {}
    try { window.__tapcalcLibrarySelectedId = String(id || ''); } catch {}
    try { updateJobsListSelectionUI(); } catch {}
  };
  const dispatchValue = (id, value) => {
    const el = $(id);
    if (!el) return;
    if (el.type === 'checkbox') {
      el.checked = !!value;
    } else {
      el.value = value ?? '';
    }
    try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch {}
    try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch {}
  };
  const hardApplyRecord = (record) => {
    if (!record) return;
    try {
      const state = typeof buildStateFromRecord === 'function' ? buildStateFromRecord(record) : null;
      if (state && typeof applyJobState === 'function') applyJobState(state);
      const job = record.job || {};
      const machine = record.machine || {};
      const pipe = record.pipe || {};
      const calc = record.calculations || {};
      const directMap = {
        jobClient: job.client || '',
        jobDescription: job.description || '',
        jobNumber: job.jobNumber || '',
        jobDate: job.date || '',
        jobLocation: job.location || '',
        jobTechnician: job.technician || '',
        jobPressure: job.pressure || '',
        jobTemperature: job.temperature || '',
        jobProduct: job.product || '',
        jobNotes: job.notes || '',
        machineType: machine.machine || '',
        operationType: (state && state.operationType) || record?.meta?.operationType || '',
        bcoPipeMaterial: (state && state.bcoPipeMaterial) || pipe.material || '',
        bcoPipeOD: (state && state.bcoPipeOD) || pipe.nominalSize || '',
        bcoPipeID: (state && state.bcoPipeID) || pipe.id || '',
        bcoSchedule: (state && state.bcoSchedule) || pipe.schedule || '',
        bcoCutterOD: (state && state.bcoCutterOD) || machine.cutterOd || '',
        md: (state && state.md) || calc.hotTapMd || '',
        ptc: (state && state.ptc) || calc.hotTapPtc || '',
        mt: (state && state.mt) || calc.hotTapMachineTravel || '',
        lsMd: (state && state.lsMd) || calc.lineStopMd || '',
        lsTravel: (state && state.lsTravel) || calc.lineStopTravel || '',
        lsMachineTravel: (state && state.lsMachineTravel) || calc.lineStopMachineTravel || '',
      };
      Object.entries(directMap).forEach(([id, value]) => dispatchValue(id, value));
      try { refreshBcoState(); } catch {}
      try { updateBcoDisplays(); } catch {}
      try { calculateIntegratedBco({ silent: true }); } catch {}
      try { calcHotTap(); } catch {}
      try { calcHtp(); } catch {}
      try { calcLineStop(); } catch {}
      try { calcCompletionPlug(); } catch {}
      try { initEtaCalculator(); } catch {}
      try { syncBcoToEta({ force: true }); } catch {}
      try { updateEtaEstimate(); } catch {}
      try { updateJobInfoSummary(); } catch {}
      try { if (typeof persistCurrentJob === 'function') persistCurrentJob(); } catch {}
      try { if (typeof window.updateTapCalcShell === 'function') window.updateTapCalcShell(); } catch {}
      try {
        const currentJobNameEl = $('jobsCurrentJobName');
        if (currentJobNameEl) currentJobNameEl.textContent = job.description || job.jobNumber || job.client || 'Loaded Job';
      } catch {}
    } catch (e) {
      console.error('alpha115 hardApplyRecord failed', e);
    }
  };
  const mobileDirectLoad = (record) => {
    if (!record) return false;
    try { window.__tapcalcVisibleDetailRecord = record; } catch {}
    const switchToCurrent = () => {
      try { document.querySelector('.screen-tab[data-screen="job"]')?.click(); } catch {}
    };
    hardApplyRecord(record);
    switchToCurrent();
    [60, 180, 420, 900].forEach((delay) => setTimeout(() => hardApplyRecord(record), delay));
    setTimeout(() => {
      try { document.body.classList.remove('show-library-screen'); } catch {}
      try { $('jobsScreen')?.classList.remove('active'); } catch {}
    }, 700);
    return false;
  };

  function finalRenderSelectedJobDetails(jobs = null) {
    const list = Array.isArray(jobs) ? jobs : getJobs();
    const detailsEl = $('jobsList');
    if (!detailsEl) return;
    if (!list.length) {
      detailsEl.innerHTML = '<div class="jobs-library-empty">No jobs match this search yet.</div>';
      return;
    }
    const selected = getSelected(list) || list[0];
    if (!selected?.record) {
      detailsEl.innerHTML = '<div class="jobs-library-empty">Select a job from the list to view its details.</div>';
      return;
    }
    syncSelected(selected.id);
    const record = selected.record || {};
    try { window.__tapcalcVisibleDetailRecord = record; } catch {}
    const title = record?.meta?.title || record?.job?.jobDescription || record?.job?.jobNumber || 'Saved Job';
    const sourceLabel = selected.source === 'local' ? 'Local only' : selected.source === 'synced' ? 'Synced' : 'Shared DB';
    const savedAtDisplay = record?.meta?.savedAtDisplay || record?.savedAt || '—';
    const warnings = [
      ...(record?.warnings?.hotTap || []),
      ...(record?.warnings?.lineStop || []),
      ...(record?.warnings?.completionPlug || [])
    ].filter(Boolean);
    detailsEl.innerHTML = `
      <div class="job-detail-header">
        <div>
          <div class="job-detail-title">${title}</div>
          <div class="job-detail-subtitle">${savedAtDisplay} • ${record?.meta?.operationType || 'Job'} • ${sourceLabel}</div>
        </div>
        <div class="job-record-badges">
          <span class="job-source-badge ${selected.source}">${sourceLabel}</span>
        </div>
      </div>
      <div class="job-detail-actions">
        <button type="button" id="jobsLoadSelectedBtnFinal" class="secondary-btn">Load Job</button>
      </div>
      ${typeof renderJobRecordDetails === 'function' ? renderJobRecordDetails(record) : ''}
      <div class="job-detail-grid">
        <div><strong>Saved:</strong> ${savedAtDisplay}</div>
        <div><strong>Date:</strong> ${record?.job?.date || '—'}</div>
        <div><strong>Job Description:</strong> ${record?.job?.description || '—'}</div>
        <div><strong>Warnings:</strong> ${warnings.length ? warnings.join(' | ') : 'None'}</div>
      </div>`;
    const btn = $('jobsLoadSelectedBtnFinal');
    if (btn) {
      const handler = (event) => {
        if (event) {
          try { event.preventDefault(); } catch {}
          try { event.stopPropagation(); } catch {}
          try { event.stopImmediatePropagation(); } catch {}
        }
        mobileDirectLoad(record);
        return false;
      };
      ['click','touchstart','pointerdown'].forEach((type) => btn.addEventListener(type, handler, { capture: true }));
    }
  }

  const origRenderJobsList = (window.renderJobsList || (typeof renderJobsList === 'function' ? renderJobsList : null));
  function bindRowSelection() {
    document.querySelectorAll('#jobsSelect .jobs-list-item[data-job-id]').forEach((item) => {
      if (item.dataset.alpha115Bound === '1') return;
      item.dataset.alpha115Bound = '1';
      const selectThis = (event) => {
        if (event) {
          try { event.preventDefault(); } catch {}
          try { event.stopPropagation(); } catch {}
        }
        const id = String(item.dataset.jobId || '');
        syncSelected(id);
        finalRenderSelectedJobDetails();
      };
      item.addEventListener('touchstart', selectThis, { capture: true, passive: false });
      item.addEventListener('pointerdown', selectThis, { capture: true });
      item.addEventListener('click', selectThis, { capture: true });
    });
  }
  function finalRenderJobsList() {
    if (typeof origRenderJobsList === 'function') origRenderJobsList();
    setTimeout(() => {
      bindRowSelection();
      finalRenderSelectedJobDetails();
    }, 0);
  }

  window.tapCalcMobileDirectLoad = mobileDirectLoad;
  window.renderSelectedJobDetails = finalRenderSelectedJobDetails;
  try { renderSelectedJobDetails = finalRenderSelectedJobDetails; } catch {}
  window.renderJobsList = finalRenderJobsList;
  try { renderJobsList = finalRenderJobsList; } catch {}
  setTimeout(() => { try { finalRenderJobsList(); } catch {} }, 0);
})();


/* ===== 3.0.0-alpha126 mobile current hydrate bridge ===== */
(function(){
  const $ = (id) => document.getElementById(id);
  const isMobile = () => {
    try { return window.matchMedia ? window.matchMedia('(max-width: 820px)').matches : window.innerWidth <= 820; } catch { return false; }
  };
  function currentDirectMap(record, state){
    return {
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
      machineType: state?.machineType || record?.machine?.machine,
      operationType: state?.operationType,
      bcoPipeMaterial: state?.bcoPipeMaterial,
      bcoPipeOD: state?.bcoPipeOD,
      bcoSchedule: state?.bcoSchedule,
      bcoPipeID: state?.bcoPipeID,
      bcoCutterOD: state?.bcoCutterOD,
      etaMachine: state?.etaMachine,
      etaCutterSize: state?.etaCutterSize,
      etaBco: state?.etaBco,
      md: state?.md,
      ptc: state?.ptc,
      mt: state?.mt,
      htpMd: state?.htpMd,
      htpPtc: state?.htpPtc,
      lsMd: state?.lsMd,
      lsTravel: state?.lsTravel,
      lsMachineTravel: state?.lsMachineTravel,
      cpStart: state?.cpStart,
      cpJbf: state?.cpJbf,
      cpPt: state?.cpPt,
    };
  }
  function forceApplyCurrentRecord(record){
    if (!record) return false;
    let state = {};
    try { state = typeof buildStateFromRecord === 'function' ? (buildStateFromRecord(record) || {}) : {}; } catch {}
    try {
      if (state && Object.keys(state).length && typeof applyJobState === 'function') applyJobState(state);
    } catch {}
    const map = currentDirectMap(record, state);
    Object.entries(map).forEach(([id, value]) => {
      const el = $(id);
      if (!el) return;
      if (el.type === 'checkbox') {
        el.checked = !!value;
      } else if (value != null && value !== '') {
        el.value = value;
      }
      try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch {}
      try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch {}
    });
    try {
      if (state && Object.keys(state).length) localStorage.setItem(JOB_STATE_KEY, JSON.stringify(state));
    } catch {}
    try { refreshBcoState(); } catch {}
    try { updateBcoDisplays(); } catch {}
    try { calculateIntegratedBco({ silent: true }); } catch {}
    try { calcHotTap(); } catch {}
    try { calcHtp(); } catch {}
    try { calcLineStop(); } catch {}
    try { calcCompletionPlug(); } catch {}
    try { initEtaCalculator(); } catch {}
    try { syncBcoToEta({ force: true }); } catch {}
    try { updateEtaEstimate(); } catch {}
    try { updateCurrentJobLabel(); } catch {}
    try { updateJobInfoSummary(); } catch {}
    try { window.updateTapCalcShell && window.updateTapCalcShell(); } catch {}
    const top = $('topCurrentJobLabel');
    if (top) top.textContent = record?.meta?.title || record?.job?.description || record?.job?.jobNumber || 'Loaded job';
    return true;
  }
  function getVisibleDetailRecord(){
    try {
      return window.__tapcalcVisibleLibraryRecord || window.__tapCalcVisibleDetailRecord || window.__tapcalcSelectedExactRecord || null;
    } catch { return null; }
  }
  function getSelectedRecord(){
    try {
      const jobs = typeof getCombinedJobsForDisplay === 'function' ? getCombinedJobsForDisplay() : [];
      const sel = typeof getSelectedCombinedJob === 'function' ? getSelectedCombinedJob(jobs) : null;
      return sel?.record || getVisibleDetailRecord();
    } catch { return getVisibleDetailRecord(); }
  }
  const oldRender = typeof renderSelectedJobDetails === 'function' ? renderSelectedJobDetails : null;
  if (oldRender) {
    renderSelectedJobDetails = function(...args){
      const out = oldRender.apply(this,args);
      try {
        const jobs = typeof getCombinedJobsForDisplay === 'function' ? getCombinedJobsForDisplay() : [];
        const sel = typeof getSelectedCombinedJob === 'function' ? getSelectedCombinedJob(jobs) : null;
        window.__tapcalcVisibleLibraryRecord = sel?.record || null;
      } catch {}
      return out;
    };
  }
  const oldShow = window.showScreen;
  if (typeof oldShow === 'function') {
    window.showScreen = function(name, ...rest){
      const res = oldShow.apply(this, [name, ...rest]);
      if ((name === 'job' || name === 'current') && window.__tapcalcPendingMobileRecord) {
        const rec = window.__tapcalcPendingMobileRecord;
        [0, 40, 120, 280, 700].forEach(ms => setTimeout(() => forceApplyCurrentRecord(rec), ms));
      }
      return res;
    };
  }
  function mobileLoadJob(e){
    if (!isMobile()) return;
    const btn = e.target && e.target.closest ? e.target.closest('#jobsLoadSelectedBtn, #jobsLoadSelectedBtnFinal, #jobsLoadSelectedBtnCanonical') : null;
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    const record = getSelectedRecord();
    window.__tapcalcPendingMobileRecord = record || null;
    if (!record) return false;
    forceApplyCurrentRecord(record);
    try { localStorage.setItem('tapcalcV3Screen', 'job'); } catch {}
    try {
      const tab = document.querySelector('.screen-tab[data-screen="job"]');
      if (tab) tab.click(); else if (typeof showScreen === 'function') showScreen('job');
    } catch {}
    [40, 120, 280, 700, 1200].forEach(ms => setTimeout(() => forceApplyCurrentRecord(record), ms));
    return false;
  }
  ['click','touchstart','pointerdown'].forEach(evt => document.addEventListener(evt, mobileLoadJob, true));
})();


/* ===== 3.0.0-alpha126 mobile current debug ===== */
(function(){
  const isMobile = () => window.matchMedia && window.matchMedia('(max-width: 860px)').matches;
  const $ = (id) => document.getElementById(id);
  function dbg(msg){
    try {
      const panel = $('mobileLoadDebugPanel');
      const text = $('mobileLoadDebugText');
      if(panel) panel.style.display = isMobile() ? 'block' : 'none';
      const stamp = new Date().toLocaleTimeString();
      if(text) text.textContent = `[${stamp}] ${msg}\n` + (text.textContent || '').slice(0, 3000);
      try { console.log('[alpha115 mobile dbg]', msg); } catch {}
    } catch {}
  }
  function summarizeRecord(record){
    if(!record) return 'record=<none>';
    const state = (typeof buildStateFromRecord === 'function') ? (buildStateFromRecord(record) || {}) : {};
    const title = record?.meta?.title || state.jobDescription || state.jobNumber || state.jobClient || '<untitled>';
    const keys = Object.keys(state).slice(0,12).join(',');
    return `title=${title} | id=${record?.id || record?.meta?.id || '<none>'} | stateKeys=${Object.keys(state).length} [${keys}]`;
  }
  function inspectCurrent(){
    const ids=['jobClient','jobLocation','jobDescription','jobNumber','jobDate','machineType','operationType'];
    return ids.map(id=>`${id}=${$(''+id)?.value || ''}`).join(' | ');
  }
  function getSelectedRecord(){
    try { if(window.__tapcalcSelectedJobRecord) return window.__tapcalcSelectedJobRecord; } catch {}
    try { if(window.__tapcalcPinnedSelectedRecord) return window.__tapcalcPinnedSelectedRecord; } catch {}
    try {
      const id = window.selectedJobId || window.__tapcalcSelectedJobId;
      const jobs = (typeof getAllJobs==='function') ? getAllJobs() : [];
      const entry = jobs.find(j=>String(j.id)===String(id));
      if(entry?.record) return entry.record;
    } catch {}
    return null;
  }
  function forceApply(record, label){
    dbg(`${label}: start | ${summarizeRecord(record)}`);
    try { if(typeof loadRecordIntoCalculator==='function') loadRecordIntoCalculator(record, { switchScreen:false, skipPersist:false, message:true }); } catch(e){ dbg(`${label}: loader error ${e.message}`); }
    setTimeout(()=>dbg(`${label}: fields@80 ${inspectCurrent()}`),80);
    setTimeout(()=>dbg(`${label}: fields@240 ${inspectCurrent()}`),240);
    setTimeout(()=>dbg(`${label}: fields@600 ${inspectCurrent()}`),600);
  }
  function bindMobileDebugLoad(){
    const btn = $('jobsLoadSelectedBtn') || $('jobsLoadSelectedBtnFinal') || $('jobsLoadSelectedBtnCanonical');
    if(!btn || btn.dataset.alpha115Bound==='1') return;
    const clone = btn.cloneNode(true);
    clone.dataset.alpha115Bound='1';
    btn.replaceWith(clone);
    const handler = function(ev){
      if(!isMobile()) return;
      ev.preventDefault();
      ev.stopPropagation();
      ev.stopImmediatePropagation && ev.stopImmediatePropagation();
      const record = getSelectedRecord();
      dbg(`tap load | ${summarizeRecord(record)}`);
      const tab = document.querySelector('.screen-tab[data-screen="job"]');
      try { if(tab) tab.click(); else if(typeof showScreen==='function') showScreen('job'); } catch(e){ dbg(`screen switch error ${e.message}`); }
      setTimeout(()=>forceApply(record,'post-switch'),20);
      setTimeout(()=>forceApply(record,'post-switch-2'),180);
      return false;
    };
    clone.addEventListener('click', handler, true);
    clone.addEventListener('touchstart', handler, true);
    clone.addEventListener('pointerdown', handler, true);
    dbg('bound mobile debug load button');
  }
  function pinRecordFromSelection(){
    try {
      const id = window.selectedJobId || window.__tapcalcSelectedJobId;
      const jobs = (typeof getAllJobs==='function') ? getAllJobs() : [];
      const entry = jobs.find(j=>String(j.id)===String(id));
      if(entry?.record){
        window.__tapcalcSelectedJobRecord = entry.record;
        dbg(`pin selected | ${summarizeRecord(entry.record)}`);
      }
    } catch(e){ dbg(`pin error ${e.message}`); }
  }
  document.addEventListener('click', function(e){
    const row = e.target.closest && e.target.closest('.jobs-entry, .jobs-list-item, [data-job-id]');
    if(row){ setTimeout(pinRecordFromSelection, 10); setTimeout(bindMobileDebugLoad, 20); }
    const libTab = e.target.closest && e.target.closest('.screen-tab[data-screen="jobs"]');
    if(libTab){ setTimeout(bindMobileDebugLoad, 80); }
  }, true);
  window.addEventListener('load', ()=>{ setTimeout(bindMobileDebugLoad, 300); if(isMobile()){ try{ const p=$('mobileLoadDebugTop'); if(p) p.style.display='block'; }catch{} dbg('alpha115 debug active'); } });
  window.addEventListener('pageshow', ()=>{ setTimeout(bindMobileDebugLoad, 200); });
  const oldShow = window.showScreen;
  if(typeof oldShow==='function'){
    window.showScreen = function(name, ...rest){
      const result = oldShow.call(this, name, ...rest);
      if(name==='jobs') setTimeout(bindMobileDebugLoad, 80);
      if(name==='job' && isMobile()) setTimeout(()=>dbg(`entered Current | ${inspectCurrent()}`),100);
      return result;
    };
  }
})();


/* ===== 3.0.0-alpha126 mobile unique-button canonical load ===== */
(function(){
  const $ = (id) => document.getElementById(id);
  const isMobile = () => {
    try { return window.matchMedia ? window.matchMedia('(max-width: 820px)').matches : window.innerWidth <= 820; } catch { return window.innerWidth <= 820; }
  };
  function getCombined(){
    try { return typeof getCombinedJobsForDisplay === 'function' ? getCombinedJobsForDisplay() : []; } catch { return []; }
  }
  function currentSelectedRecord(){
    const id = String((window.__tapcalcLibrarySelectedId || '') || (typeof selectedJobId !== 'undefined' ? selectedJobId : '') || '').trim();
    const jobs = getCombined();
    return jobs.find(j => String(j.id) === id) || null;
  }
  function hardLoadRecord(record){
    if (!record) return false;
    try { window.__alpha115MobileRecord = record; } catch {}
    try { if (typeof loadRecordIntoCalculator === 'function') loadRecordIntoCalculator(record, { switchScreen:false, skipPersist:false, message:true }); } catch(e) { console.error('alpha115 loadRecordIntoCalculator', e); }
    try {
      const state = typeof buildStateFromRecord === 'function' ? buildStateFromRecord(record) : null;
      if (state && typeof applyJobState === 'function') applyJobState(state);
    } catch(e) { console.error('alpha115 applyJobState', e); }
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
      machineType: record?.machine?.machine,
      bcoCutterOD: record?.machine?.cutterOd,
    };
    Object.entries(directMap).forEach(([id,val]) => {
      const el = $(id);
      if (!el) return;
      el.value = val == null ? '' : String(val);
      try { el.dispatchEvent(new Event('input', { bubbles:true })); } catch {}
      try { el.dispatchEvent(new Event('change', { bubbles:true })); } catch {}
    });
    try { if (typeof refreshBcoState === 'function') refreshBcoState(); } catch {}
    try { if (typeof updateBcoDisplays === 'function') updateBcoDisplays(); } catch {}
    try { if (typeof calculateIntegratedBco === 'function') calculateIntegratedBco({ silent:true }); } catch {}
    try { if (typeof calcHotTap === 'function') calcHotTap(); } catch {}
    try { if (typeof calcLineStop === 'function') calcLineStop(); } catch {}
    try { if (typeof calcCompletionPlug === 'function') calcCompletionPlug(); } catch {}
    try { if (typeof updateJobInfoSummary === 'function') updateJobInfoSummary(); } catch {}
    try { if (typeof persistCurrentJob === 'function') persistCurrentJob(); } catch {}
    return true;
  }
  function forceAfterSwitch(){
    const rec = window.__alpha115MobileRecord;
    if (!rec) return;
    [20,120,350,800].forEach(delay => setTimeout(() => hardLoadRecord(rec), delay));
  }
  function mobileButtonHandler(event){
    const btn = event.target.closest('#jobsLoadSelectedBtnMobileCanonical');
    if (!btn || !isMobile()) return;
    try { event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation(); } catch {}
    let record = null;
    try { record = JSON.parse(btn.dataset.recordJson || 'null'); } catch {}
    if (!record) record = currentSelectedRecord()?.record || window.__tapcalcVisibleDetailRecord || null;
    if (!record) {
      try { const s=$('jobsCloudStatus'); if(s) s.textContent='alpha115: no record found for mobile load'; } catch {}
      return false;
    }
    hardLoadRecord(record);
    try { document.querySelector('.screen-tab[data-screen="job"]')?.click(); } catch {}
    forceAfterSwitch();
    setTimeout(() => {
      try { document.body.classList.remove('show-library-screen'); } catch {}
      try { $('jobsScreen')?.classList.remove('active'); } catch {}
      forceAfterSwitch();
    }, 150);
    return false;
  }
  document.addEventListener('click', mobileButtonHandler, true);
  document.addEventListener('touchstart', mobileButtonHandler, { capture:true, passive:false });
  document.addEventListener('pointerdown', mobileButtonHandler, true);
  const oldRender = window.renderSelectedJobDetails || (typeof renderSelectedJobDetails === 'function' ? renderSelectedJobDetails : null);
  function wrappedRender(jobs){
    if (typeof oldRender === 'function') oldRender.apply(this, arguments);
    if (!isMobile()) return;
    const details = $('jobsList');
    if (!details) return;
    const selected = currentSelectedRecord() || (Array.isArray(jobs) ? jobs.find(j=>String(j.id)===String(window.__tapcalcLibrarySelectedId||'')) : null);
    const rec = selected?.record || window.__tapcalcVisibleDetailRecord || null;
    const actions = details.querySelector('.job-detail-actions');
    if (!actions || !rec) return;
    actions.innerHTML = '<button type="button" id="jobsLoadSelectedBtnMobileCanonical" class="secondary-btn">Load Job</button>';
    const btn = $('jobsLoadSelectedBtnMobileCanonical');
    if (btn) {
      btn.dataset.recordJson = JSON.stringify(rec).slice(0, 900000);
      btn.style.display='block'; btn.style.width='100%'; btn.style.margin='0 auto'; btn.style.textAlign='center';
    }
  }
  window.renderSelectedJobDetails = wrappedRender;
  try { renderSelectedJobDetails = wrappedRender; } catch {}
  const oldShow = window.showScreen || (typeof showScreen === 'function' ? showScreen : null);
  if (typeof oldShow === 'function') {
    const wrappedShow = function(name, ...rest){ const out = oldShow.call(this,name,...rest); if (name==='job' && isMobile()) forceAfterSwitch(); return out; };
    window.showScreen = wrappedShow; try { showScreen = wrappedShow; } catch {}
  }
})();


/* ===== 3.0.0-alpha126 mobile canonical desktop loader bind ===== */
(function(){
  const MOBILE_MEDIA='(max-width: 820px)';
  const isMobile=()=>{ try { return window.matchMedia ? window.matchMedia(MOBILE_MEDIA).matches : window.innerWidth <= 820; } catch { return window.innerWidth <= 820; } };
  const $=(id)=>document.getElementById(id);
  function getCombined(){
    try { return typeof getCombinedJobsForDisplay === 'function' ? (getCombinedJobsForDisplay() || []) : []; } catch { return []; }
  }
  function getSelectedEntry(){
    const jobs=getCombined();
    const active=document.querySelector('#jobsSelect .jobs-list-item.active[data-job-id], #jobsSelect .jobs-list-item[aria-pressed="true"][data-job-id], #jobsSelect .jobs-list-item[aria-selected="true"][data-job-id]');
    const id=String(active?.dataset?.jobId || window.__tapcalcLibrarySelectedId || window.__alpha87SelectedJobId || window.__tapcalcSelectedJobId || (typeof selectedJobId!=='undefined' ? selectedJobId : '') || '').trim();
    let match=id ? jobs.find(j => String(j?.id||'')===id) : null;
    if (!match && window.__tapcalcVisibleLibraryRecord) match = { id: id || 'visible', record: window.__tapcalcVisibleLibraryRecord, source:'shared' };
    return match || null;
  }
  function canonicalMobileLoad(record){
    if (!record) return false;
    let state=null;
    try { state = typeof buildStateFromRecord === 'function' ? (buildStateFromRecord(record) || null) : null; } catch {}
    try { window.__alpha115MobileRecord = record; } catch {}
    try { if (state && typeof localStorage !== 'undefined') localStorage.setItem(JOB_STATE_KEY, JSON.stringify(state)); } catch {}
    try { if (state && typeof applyJobState === 'function') applyJobState(state); } catch {}
    try { if (typeof loadRecordIntoCalculator === 'function') loadRecordIntoCalculator(record, { switchScreen:false, skipPersist:false, message:true }); } catch(e) { console.error('alpha115 mobile load', e); }
    try { if (typeof persistCurrentJob === 'function') persistCurrentJob(); } catch {}
    const showCurrent=()=>{
      try { const tab=document.querySelector('.screen-tab[data-screen="job"]'); if(tab) tab.click(); else if (typeof openScreen==='function') openScreen('job'); else if (typeof showScreen==='function') showScreen('job'); } catch {}
    };
    showCurrent();
    [0,80,220,480,900].forEach(ms => setTimeout(() => {
      try { if (state && typeof applyJobState === 'function') applyJobState(state); } catch {}
      try { if (typeof restoreCurrentJob === 'function') restoreCurrentJob(); } catch {}
      try { if (typeof updateCurrentJobLabel === 'function') updateCurrentJobLabel(); } catch {}
      try { if (typeof updateJobInfoSummary === 'function') updateJobInfoSummary(); } catch {}
      try { if (typeof window.updateTapCalcShell === 'function') window.updateTapCalcShell(); } catch {}
    }, ms));
    return true;
  }
  window.tapCalcCanonicalMobileLoadFromSelected = function(){
    const entry=getSelectedEntry();
    if (!entry?.record) return false;
    try { window.__tapcalcLibrarySelectedId = String(entry.id || ''); } catch {}
    return canonicalMobileLoad(entry.record);
  };
  const oldRender = window.renderSelectedJobDetails || (typeof renderSelectedJobDetails === 'function' ? renderSelectedJobDetails : null);
  function wrappedRender(){
    const out = typeof oldRender === 'function' ? oldRender.apply(this, arguments) : undefined;
    if (!isMobile()) return out;
    const details = $('jobsList');
    if (!details) return out;
    const actions = details.querySelector('.job-detail-actions');
    const entry = getSelectedEntry();
    if (!actions || !entry?.record) return out;
    actions.innerHTML = '<button type="button" id="jobsLoadSelectedBtnMobile114" class="secondary-btn" onclick="return window.tapCalcCanonicalMobileLoadFromSelected && window.tapCalcCanonicalMobileLoadFromSelected();">Load Job</button>';
    const btn = $('jobsLoadSelectedBtnMobile114');
    if (btn) {
      btn.style.display='block';
      btn.style.width='100%';
      btn.style.margin='0 auto';
      btn.style.textAlign='center';
    }
    return out;
  }
  window.renderSelectedJobDetails = wrappedRender;
  try { renderSelectedJobDetails = wrappedRender; } catch {}
  document.addEventListener('click', function(e){
    const row=e.target.closest && e.target.closest('#jobsSelect .jobs-list-item[data-job-id], [data-job-id]');
    if(!row) return;
    const id=String(row.dataset.jobId || '');
    if(id) { try { window.__tapcalcLibrarySelectedId = id; if (typeof selectedJobId!=='undefined') selectedJobId = id; } catch {} }
  }, true);
  setTimeout(()=>{ try { if (typeof window.renderSelectedJobDetails === 'function') window.renderSelectedJobDetails(); } catch {} }, 50);
})();


/* ===== 3.0.0-alpha126 mobile library overlay/nav isolation ===== */
(() => {
  const isCompact = () => {
    try { return window.matchMedia ? window.matchMedia('(max-width: 820px)').matches : window.innerWidth <= 820; } catch { return window.innerWidth <= 820; }
  };
  const syncLibraryOverlayState = () => {
    try {
      const jobs = document.getElementById('jobsScreen');
      const open = !!(jobs && jobs.classList.contains('active'));
      document.body.classList.toggle('show-library-screen', open);
      const nav = document.querySelector('.screen-nav');
      if (nav) {
        nav.style.display = open && isCompact() ? 'none' : '';
        nav.style.pointerEvents = open && isCompact() ? 'none' : '';
      }
      if (jobs && open && isCompact()) {
        jobs.style.pointerEvents = 'auto';
        jobs.style.zIndex = '1001';
        jobs.style.display = 'block';
        jobs.hidden = false;
      }
    } catch {}
  };

  const loadBtnHandler = (event) => {
    if (!isCompact()) return;
    const btn = event.target.closest('#jobsLoadSelectedBtnFinal');
    if (!btn) return;
    try { event.preventDefault(); } catch {}
    try { event.stopPropagation(); } catch {}
    try { event.stopImmediatePropagation(); } catch {}
    if (typeof window.tapCalcForceLoadSelectedJob === 'function') {
      window.tapCalcForceLoadSelectedJob(event);
    }
  };

  document.addEventListener('pointerdown', loadBtnHandler, true);
  document.addEventListener('touchstart', loadBtnHandler, { capture: true, passive: false });
  document.addEventListener('click', loadBtnHandler, true);

  const origShow = window.showScreen || (typeof showScreen === 'function' ? showScreen : null);
  if (typeof origShow === 'function') {
    const wrapped = function(name){
      const result = origShow.apply(this, arguments);
      setTimeout(syncLibraryOverlayState, 0);
      return result;
    };
    window.showScreen = wrapped;
    try { showScreen = wrapped; } catch {}
  }
  window.addEventListener('pageshow', syncLibraryOverlayState);
  window.addEventListener('resize', syncLibraryOverlayState);
  setTimeout(syncLibraryOverlayState, 0);
})();


/* ===== 3.0.0-alpha126 mobile library screen ownership reset ===== */
(function(){
  const $ = (id) => document.getElementById(id);
  const compact = () => { try { return window.matchMedia('(max-width: 820px)').matches; } catch { return window.innerWidth <= 820; } };
  const screens = { home:'homeScreen', job:'jobScreen', calc:'calcScreen', card:'cardScreen', jobs:'jobsScreen', ref:'refScreen' };

  function finalShowScreen(name){
    Object.entries(screens).forEach(([key, id])=>{
      const el = $(id); if(!el) return;
      const active = key === name;
      el.classList.toggle('active', active);
      el.hidden = !active;
      el.style.display = active ? 'block' : 'none';
      el.style.pointerEvents = active ? 'auto' : 'none';
      el.style.visibility = active ? 'visible' : 'hidden';
      el.style.zIndex = active ? (name === 'jobs' ? '1001' : '2') : '0';
      if (!active && key === 'jobs') {
        el.style.position = '';
      }
      if (active && key === 'jobs') {
        el.style.position = 'relative';
        el.style.overflowX = 'hidden';
      }
    });
    document.querySelectorAll('.screen-tab[data-screen]').forEach((tab)=>{
      const active = tab.dataset.screen === name;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    document.body.classList.toggle('show-library-screen', name === 'jobs');
    try { localStorage.setItem('tapcalcV3Screen', name); } catch {}
    if (name === 'jobs') setTimeout(forceLibraryInteractive, 0);
  }

  function forceLibraryInteractive(){
    const jobs = $('jobsScreen');
    if (!jobs) return;
    jobs.hidden = false;
    jobs.classList.add('active');
    jobs.style.display = 'block';
    jobs.style.visibility = 'visible';
    jobs.style.pointerEvents = 'auto';
    jobs.style.position = 'relative';
    jobs.style.zIndex = '1001';
    jobs.querySelectorAll('button, input, select, textarea, a, .jobs-list-item, .library-lane-btn, .jobs-chip-btn').forEach((el)=>{
      el.style.pointerEvents = 'auto';
      el.style.position = el.style.position || 'relative';
      if (!el.style.zIndex) el.style.zIndex = '1002';
    });
  }

  function handleTab(e){
    const tab = e.target.closest('.screen-tab[data-screen]');
    if (!tab || !compact()) return;
    const next = String(tab.dataset.screen || '').trim();
    if (!next) return;
    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
    finalShowScreen(next);
    return false;
  }

  document.addEventListener('pointerdown', handleTab, true);
  document.addEventListener('click', handleTab, true);
  window.addEventListener('pageshow', ()=>{ if (compact()) setTimeout(forceLibraryInteractive, 40); });
  document.addEventListener('DOMContentLoaded', ()=>{ if (compact()) setTimeout(forceLibraryInteractive, 40); });
  window.tapCalcFinalShowScreen = finalShowScreen;
})();


(function(){
  function bindCollapsible(btnId, contentId){
    const btn=document.getElementById(btnId);
    const content=document.getElementById(contentId);
    if(!btn||!content||btn.dataset.boundToggle==='1') return;
    btn.dataset.boundToggle='1';
    const setOpen=(open)=>{
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      content.hidden=!open;
    };
    setOpen(true);
    btn.addEventListener('click', ()=>{
      const open=btn.getAttribute('aria-expanded')!=='true';
      setOpen(open);
    });
  }
  function initAuditToggles(){
    bindCollapsible('referenceToolsToggleBtn','referenceWorkspaceContent');
    bindCollapsible('sharedJobsToggleBtn','sharedJobsContent');
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', initAuditToggles, {once:true});
  } else {
    initAuditToggles();
  }
  window.addEventListener('pageshow', initAuditToggles);
})();
