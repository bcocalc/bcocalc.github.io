
const data = JSON.parse(localStorage.getItem("bcoData"));
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
  status.textContent = "No BCO data found. Calculate BCO first.";
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

  if (mt && ttd > mt) {
    warnEl.textContent = "⚠️ TTD exceeds Machine Travel (MT)";
  } else {
    warnEl.textContent = "";
  }
}

[mdEl, ldEl, ptcEl, podEl, startEl, mtEl, signEl].forEach(el => {
  if (el) el.addEventListener("input", calc);
});
if (signEl) signEl.addEventListener("change", calc);
window.addEventListener("load", calc);

// Theme sync (shared with BCO page)
const themeToggle = document.getElementById("themeToggle");
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") document.body.classList.add("dark");

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
  });
}


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
      row.className = "row";

      const label = document.createElement("label");
      label.textContent = labelText;

      const input = document.createElement("input");
      input.type = "number";
      input.id = id;
      input.readOnly = true;

      const span = document.createElement("span");
      span.className = "from-bco";
      span.textContent = "From BCO Calculator";

      row.appendChild(label);
      row.appendChild(input);
      row.appendChild(span);
      return row;
    }

    const pipeIdRow = makeRow("Pipe I.D.", "pipeId");
    const wallRow = makeRow("Wall Thickness", "wallThk");

    podRow.after(pipeIdRow);
    pipeIdRow.after(wallRow);

    const bcoData = JSON.parse(localStorage.getItem("bcoData") || "{}");

    const pipeID =
      parseFloat(localStorage.getItem("pipeID")) ||
      parseFloat(bcoData.pipeID);

    const pipeOD =
      parseFloat(localStorage.getItem("pipeOD")) ||
      parseFloat(bcoData.pipeOD);

    if (isFinite(pipeID)) {
      document.getElementById("pipeId").value = pipeID.toFixed(4);
    }

    if (isFinite(pipeOD) && isFinite(pipeID)) {
      document.getElementById("wallThk").value =
        ((pipeOD - pipeID) / 2).toFixed(4);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
