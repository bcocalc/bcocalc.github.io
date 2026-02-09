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

// === PIPE_GEOMETRY_DISPLAY_FINAL ===
(function(){
  function run(){
    const podInput = document.getElementById("pod");
    if (!podInput) return;

    const podRow = podInput.closest(".row");
    if (!podRow) return;

    if (document.getElementById("pipeId")) return;

    function makeRow(labelText, id){
      const row = document.createElement("div");
      row.className = "row pipe-support";

      const label = document.createElement("label");
      label.textContent = labelText;

      const box = document.createElement("div");
      box.id = id;
      box.className = "display-geometry";
      box.textContent = "—";

      const span = document.createElement("span");
      span.className = "from-bco";
      span.textContent = "From BCO Calculator";

      row.appendChild(label);
      row.appendChild(box);
      row.appendChild(span);
      return row;
    }

    const pipeIdRow = makeRow("Pipe I.D.", "pipeId");
    const wallRow = makeRow("Wall Thickness", "wallThk");

    const mcoRow = document.getElementById("mco")?.closest(".row");
    if (mcoRow) {
      mcoRow.after(pipeIdRow);
      pipeIdRow.after(wallRow);
    } else {
      podRow.after(pipeIdRow);
      pipeIdRow.after(wallRow);
    }

    const bcoData = JSON.parse(localStorage.getItem("bcoData") || "{}");

    // Only show supporting geometry when BCO has been calculated this session
    if (sessionStorage.getItem("bcoCalculated") !== "true" || !bcoData || !isFinite(parseFloat(bcoData.pipeID)) || !isFinite(parseFloat(bcoData.pipeOD))) {
      return;
    }

    const pipeID =
      parseFloat(localStorage.getItem("pipeID")) ||
      parseFloat(bcoData.pipeID);

    const pipeOD =
      parseFloat(localStorage.getItem("pipeOD")) ||
      parseFloat(bcoData.pipeOD);

    if (isFinite(pipeID)) {
      document.getElementById("pipeId").textContent = pipeID.toFixed(4);
    }

    if (isFinite(pipeOD) && isFinite(pipeID)) {
      document.getElementById("wallThk").textContent = ((pipeOD - pipeID) / 2).toFixed(4);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();



const data = sessionStorage.getItem("bcoCalculated") === "true"
  ? JSON.parse(localStorage.getItem("bcoData"))
  : null;
const status = document.getElementById("bcoStatus");

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
const rbcoEl = document.getElementById("rbco");
const rmcoEl = document.getElementById("rmco");
const warnEl = document.getElementById("mtWarning");

if (!data) {
  status.textContent = "No BCO data loaded. Calculate BCO first.";
  return;
} else {
  status.textContent = "Loaded BCO from Calculator";
  document.getElementById("rbco_geom").textContent = data.bco.toFixed(4);
  if (podEl) podEl.value = data.pipeOD;
}

function calc() {
  if (!data) return;

  const md = parseFloat(mdEl.value) || 0;
  const ldRaw = parseFloat(ldEl.value) || 0;
  const sign = signEl.value;
  const ld = sign === "-" ? -ldRaw : ldRaw;
  const ptc = parseFloat(ptcEl.value) || 0;
  const pod = parseFloat(podEl.value) || data.pipeOD || 0;
  const start = parseFloat(startEl.value) || 0;
  const mt = parseFloat(mtEl.value) || 0;

  const li = md + ld;
  const mco = (pod / 2) + ptc;
  const ttd = li + ptc + data.bco;
  const pop = start + li;
  const cop = pop + ptc;
  const rbco = cop + data.bco;
  const rmco = pop + mco;

  liEl.textContent = li.toFixed(4);
  ttdEl.textContent = ttd.toFixed(4);
  mcoEl.textContent = mco.toFixed(4);
  popEl.textContent = pop.toFixed(4);
  copEl.textContent = cop.toFixed(4);
  rbcoEl.textContent = rbco.toFixed(4);
  rmcoEl.textContent = rmco.toFixed(4);

  // === MULTI-WARNING SYSTEM (PTC + MT) ===
  const warnings = [];

  // PTC geometry warning
  const wallEl = document.getElementById("wallThk");
  const wall = wallEl ? parseFloat(wallEl.value) || 0 : 0;
  const ptcLimit = (pod / 2) - wall;

  if (ptcLimit > 0 && ptc > ptcLimit) {
    warnings.push(`⚠️ PTC too long: must be < (POD/2 − Wall) = ${ptcLimit.toFixed(4)}`);
  }

  // Machine Travel warning
  if (mt && ttd > mt) {
    warnings.push("⚠️ TTD exceeds Machine Travel (MT)");
  }

  // Render warnings
  if (warnings.length) {
    warnEl.innerHTML = warnings.join("<br>");
  } else {
    warnEl.textContent = "";
  }
}

[mdEl, ldEl, ptcEl, podEl, startEl, mtEl, signEl].forEach(el => {
  if (el) el.addEventListener("input", calc);
});
if (signEl) signEl.addEventListener("change", calc);
window.addEventListener("load", calc);



})();
