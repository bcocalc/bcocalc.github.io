
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

  const current = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', current);

  btn.addEventListener('click', () => {
    const t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', t);
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
  lineStop: document.getElementById('lineStopPanel'),
  completionPlug: document.getElementById('completionPlugPanel'),
  glossary: document.getElementById('glossaryPanel')
};

function setMode(mode) {
  modeButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
  Object.entries(panels).forEach(([key, panel]) => {
    if (!panel) return;
    panel.classList.toggle('active', key === mode);
  });
}

modeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.disabled) return;
    setMode(btn.dataset.mode);
  });
});

setMode('bco');

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
  const pipeID = parseFloat(bcoPipeIdEl?.value);
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
  if (Number.isFinite(parseFloat(data?.bco)) && bcoResultEl) bcoResultEl.textContent = `BCO: ${parseFloat(data.bco).toFixed(4)}`;
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
  calcLineStop();
  if (bcoInlineStatusEl) bcoInlineStatusEl.textContent = 'BCO live update pushed into Hot Tap and Line Stop.';
}

function calculateIntegratedBco(options = {}) {
  const { silent = false } = options;
  const material = bcoMaterialEl?.value;
  const nominal = bcoPipeOdEl?.value;
  const pipeOD = parseFloat(trueOD?.[material]?.[nominal]);
  const pipeID = parseFloat(bcoPipeIdEl?.value);
  const cutterOD = parseFloat(bcoCutterOdEl?.value);

  localStorage.setItem('pipeMaterial', material || 'CarbonSteel');
  if (nominal) localStorage.setItem('pipeOD', nominal);
  if (bcoScheduleEl?.value) localStorage.setItem('schedule', bcoScheduleEl.value);

  if (!Number.isFinite(pipeOD) || !Number.isFinite(pipeID) || !Number.isFinite(cutterOD)) {
    sessionStorage.removeItem('bcoCalculated');
    localStorage.removeItem('bcoData');
    if (bcoResultEl) bcoResultEl.textContent = 'BCO: Enter Pipe I.D. and Cutter O.D.';
    if (!silent && bcoInlineStatusEl) bcoInlineStatusEl.textContent = 'Enter Pipe I.D. and Cutter O.D. to calculate BCO.';
    refreshBcoState();
    updateBcoDisplays();
    calcHotTap();
    calcLineStop();
    updateSummary();
    return;
  }

  const underRoot = Math.pow(pipeID / 2, 2) - Math.pow(cutterOD / 2, 2);
  if (underRoot < 0) {
    sessionStorage.removeItem('bcoCalculated');
    localStorage.removeItem('bcoData');
    if (bcoResultEl) bcoResultEl.textContent = 'BCO: Error — Cutter O.D. cannot exceed Pipe I.D.';
    if (!silent && bcoInlineStatusEl) bcoInlineStatusEl.textContent = 'Check geometry: Cutter O.D. cannot exceed Pipe I.D.';
    refreshBcoState();
    updateBcoDisplays();
    calcHotTap();
    calcLineStop();
    updateSummary();
    return;
  }

  const result = (pipeOD / 2) - Math.sqrt(underRoot);
  localStorage.setItem('pipeID', pipeID);
  localStorage.setItem('bcoData', JSON.stringify({ pipeOD, pipeID, cutterOD, bco: result }));
  sessionStorage.setItem('bcoCalculated', 'true');
  if (bcoResultEl) bcoResultEl.textContent = `BCO: ${result.toFixed(4)}`;
  updateBcoDisplays();
  applyBcoToMeasurementCard();
  if (!silent && bcoInlineStatusEl) bcoInlineStatusEl.textContent = 'BCO updated automatically.';
}

function copyBcoResult() {
  const text = bcoResultEl?.textContent || '';
  if (!text || text.includes('—')) return;
  navigator.clipboard?.writeText(text).then(() => {
    if (bcoInlineStatusEl) bcoInlineStatusEl.textContent = 'BCO result copied.';
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
hydrateBcoInputsFromSavedData();
triggerLiveBcoCalculation();

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
const jobInfoFieldIds = ['jobClient','jobDescription','jobNumber','jobPressure','jobTemperature','jobDate','jobProduct'];
const bcoGeometryFieldIds = ['bcoPipeMaterial','bcoPipeOD','bcoSchedule','bcoPipeID','bcoCutterOD'];

function calcHotTap() {
  if (!data) {
    if (rbcoGeomEl) rbcoGeomEl.textContent = "—";
    return;
  }

  if (rbcoGeomEl) rbcoGeomEl.textContent = Number(data.bco || 0).toFixed(4);

  const md = parseFloat(mdEl?.value) || 0;
  const ldRaw = parseFloat(ldEl?.value) || 0;
  const sign = signEl?.value || "+";
  const ld = sign === "-" ? -ldRaw : ldRaw;
  const ptc = parseFloat(ptcEl?.value) || 0;
  const pod = parseFloat(podEl?.value) || geometry.pipeOD || 0;
  const start = parseFloat(startEl?.value) || 0;
  const mt = parseFloat(mtEl?.value) || 0;

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
  const md = parseFloat(lsMdEl?.value) || 0;
  const ldRaw = parseFloat(lsLdEl?.value) || 0;
  const ld = (lsLdSignEl?.value || '+') === '-' ? -ldRaw : ldRaw;
  const pod = parseFloat(lsPodEl?.value) || geometry.pipeOD || 0;
  const wall = geometry.wall || 0;
  const manualEnabled = !!lsLiManualToggleEl?.checked;
  const liAuto = md + ld + pod - wall;
  const liManual = parseFloat(lsLiManualEl?.value);
  const liUsed = manualEnabled && isFinite(liManual) ? liManual : liAuto;
  const lineStopTravel = parseFloat(lsTravelEl?.value);
  const machineTravel = parseFloat(lsMachineTravelEl?.value);
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
  const start = parseFloat(cpStartEl?.value);
  const jbf = parseFloat(cpJbfEl?.value) || 0;
  const ld = parseFloat(cpLdEl?.value) || 0;
  const pt = parseFloat(cpPtEl?.value) || 0;
  const manualEnabled = !!cpLiManualToggleEl?.checked;
  const liAuto = (Number.isFinite(start) ? start : 0) + jbf + ld + pt;
  const liManual = parseFloat(cpLiManualEl?.value);
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
    const md = parseFloat(mdEl?.value);
    const li = lastHotTap.li;
    const ttd = lastHotTap.ttd;
    summaryEls.hotTap.textContent = Number.isFinite(li) || Number.isFinite(ttd) || Number.isFinite(md)
      ? `MD ${formatValue(md)} • LI ${formatValue(li)} • TTD ${formatValue(ttd)}`
      : '—';
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
    ['Product', info.jobProduct]
  ];
  return rows.filter(([,v]) => (v || '').trim() !== '');
}

function buildExportText() {
  const lines = ['TEAM Field Measurement Calculator', ''];
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
  printWindow.document.write(`<!DOCTYPE html><html><head><title>TEAM Field Measurement Calculator</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111;}h1{margin:0 0 16px;}div{margin:0 0 8px;white-space:pre-wrap;} .muted{color:#555;font-size:12px;margin-top:18px;}</style></head><body><h1>TEAM Field Measurement Calculator</h1>${text}<div class="muted">Generated from the field calculator.</div><script>window.onload=()=>{window.print();};<\/script></body></html>`);
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
  ctx.fillText('TEAM Field Measurement Calculator', 50, 68);
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
  link.download = `team-field-calculator-${stamp}.png`;
  link.click();
}

function getStateFields() {
  return [
    'jobClient','jobDescription','jobNumber','jobPressure','jobTemperature','jobDate','jobProduct','geometryLockToggle',
    'bcoPipeMaterial','bcoPipeOD','bcoSchedule','bcoPipeID','bcoCutterOD',
    'md','ld','ldSign','ptc','pod','start','mt','valveBore','gtf','lugs',
    'lsMd','lsLd','lsLdSign','lsLiManualToggle','lsLiManual','lsTravel','lsMachineTravel',
    'cpStart','cpJbf','cpLd','cpPt','cpLiManualToggle','cpLiManual'
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
  state.activeMode = document.querySelector('.mode-btn.active')?.dataset.mode || 'bco';
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
    switchMode(state.activeMode);
  }
}

function restoreCurrentJob() {
  try {
    const raw = localStorage.getItem(JOB_STATE_KEY);
    if (!raw) return;
    applyJobState(JSON.parse(raw));
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

function buildHistorySnapshot() {
  const material = bcoMaterialEl?.selectedOptions?.[0]?.textContent || bcoMaterialEl?.value || '—';
  const nominal = bcoPipeOdEl?.value || '—';
  const jobTitle = document.getElementById('jobDescription')?.value || document.getElementById('jobClient')?.value || document.getElementById('jobNumber')?.value || '';
  return {
    id: `${Date.now()}`,
    savedAt: new Date().toLocaleString(),
    state: collectJobState(),
    summary: {
      title: jobTitle.trim(),
      pipe: `${material} ${nominal}`.trim(),
      bco: formatValue(parseFloat(data?.bco)),
      hotTapLi: formatValue(lastHotTap.li),
      lineStopLi: formatValue(lastLineStop.li),
      completionLi: formatValue(lastCompletionPlug.li)
    }
  };
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
        <span>BCO ${item.summary.bco}</span>
        <span>Hot Tap LI ${item.summary.hotTapLi}</span>
        <span>Line Stop LI ${item.summary.lineStopLi}</span>
        <span>Completion LI ${item.summary.completionLi}</span>
      </div>
    </div>
  `).join('');
}

function saveCurrentJobToHistory() {
  const items = getHistory();
  items.unshift(buildHistorySnapshot());
  saveHistory(items);
  initHistoryDrawer();
  renderHistory();
  updateHistoryCount();
  setHistoryDrawerOpen(true);
  if (historyListEl) historyListEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
}

document.addEventListener('click', (event) => {
  const loadId = event.target?.getAttribute('data-load-history');
  const deleteId = event.target?.getAttribute('data-delete-history');
  if (loadId) {
    const item = getHistory().find(entry => entry.id === loadId);
    if (item) {
      applyJobState(item.state);
      updateBcoDisplays();
      refreshBcoState();
      calcHotTap();
      calcLineStop();
      calcCompletionPlug();
      persistCurrentJob();
    }
  }
  if (deleteId) {
    const items = getHistory().filter(entry => entry.id !== deleteId);
    saveHistory(items);
    renderHistory();
  }
});

[...document.querySelectorAll('input, select')].forEach(el => {
  el.addEventListener('input', persistCurrentJob);
  el.addEventListener('change', persistCurrentJob);
});
if (saveHistoryBtnEl) saveHistoryBtnEl.addEventListener('click', saveCurrentJobToHistory);
if (resetJobBtnEl) resetJobBtnEl.addEventListener('click', resetCurrentJob);
if (clearHistoryBtnEl) clearHistoryBtnEl.addEventListener('click', clearHistory);
if (historyDrawerToggleEl) historyDrawerToggleEl.addEventListener('click', () => {
  const isOpen = historyDrawerToggleEl.getAttribute('aria-expanded') === 'true';
  setHistoryDrawerOpen(!isOpen);
});
if (geometryLockToggleEl) geometryLockToggleEl.addEventListener('change', () => { setGeometryLocked(geometryLockToggleEl.checked); persistCurrentJob(); });
if (exportPdfBtnEl) exportPdfBtnEl.addEventListener('click', exportJobPdf);
if (exportImageBtnEl) exportImageBtnEl.addEventListener('click', exportJobImage);

window.addEventListener('load', () => {
  hydrateBcoInputsFromSavedData();
  restoreCurrentJob();
  updateBcoDisplays();
  applyBcoToMeasurementCard();
  calcHotTap();
  calcLineStop();
  calcCompletionPlug();
  persistCurrentJob();
  renderHistory();
});

})();
