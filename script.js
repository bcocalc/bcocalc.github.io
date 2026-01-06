// BCO Calculator - FULL script.js (restored) with fixes:
// - Uses TRUE OD for BCO calculation (fixes 8" showing ~1.1 instead of ~1.42)
// - Service-worker/cache friendliness (pair with updated service-worker.js)
// - Single, consistent theme system (body.dark) with localStorage persistence
// - History preserved (toggle + clear)

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
    "3.0": { STD: 3.26 },
    "4.0": { STD: 4.04 },
    "6.0": { STD: 6.1 },
    "8.0": { STD: 8.28 },
    "10.0": { STD: 10.32 },
    "12.0": { STD: 12.38 },
    "14.0": { STD: 14.4 },
    "16.0": { STD: 16.5 },
    "18.0": { STD: 18.6 },
    "20.0": { STD: 20.7 },
    "24.0": { STD: 24.9 },
    "30.0": { STD: 31.0 },
    "36.0": { STD: 37.0 },
    "42.0": { STD: 43.2 },
    "48.0": { STD: 49.3 }
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

let idManuallyEdited = false;

function populatePipeOD() {
  const material = document.getElementById("pipeMaterial").value;
  const odSelect = document.getElementById("pipeOD");
  odSelect.innerHTML = "";

  for (const size in pipeData[material]) {
    const label = `${size}" (${trueOD[material][size]} OD)`;
    const option = document.createElement("option");
    option.value = size;         // nominal key (e.g., "8.0")
    option.textContent = label;  // displays true OD
    odSelect.appendChild(option);
  }
  updatePipeID();
}

function updatePipeID() {
  const material = document.getElementById("pipeMaterial").value;
  const od = document.getElementById("pipeOD").value;
  const schedule = document.getElementById("schedule").value;
  const pipe = pipeData[material]?.[od];
  const idInput = document.getElementById("pipeID");

  if (!pipe) {
    if (!idManuallyEdited) idInput.value = "";
    return;
  }

  if (!idManuallyEdited) {
    if (pipe[schedule] !== undefined) {
      idInput.value = pipe[schedule];
    } else if (pipe.STD !== undefined) {
      idInput.value = pipe.STD;
    } else {
      idInput.value = "";
    }
  }
}

function calculateBCO() {
  // ✅ FIX: Use TRUE OD, not nominal size
  const material = document.getElementById("pipeMaterial").value;
  const nominal = document.getElementById("pipeOD").value;

  const pipeOD = parseFloat(trueOD?.[material]?.[nominal]);
  const pipeID = parseFloat(document.getElementById("pipeID").value);
  const cutterOD = parseFloat(document.getElementById("cutterOD").value);

  if (isNaN(pipeOD) || isNaN(pipeID) || isNaN(cutterOD)) return;

  // Guard against invalid geometry (cutter too large)
  const underRoot = Math.pow(pipeID / 2, 2) - Math.pow(cutterOD / 2, 2);
  if (underRoot < 0) {
    document.getElementById("result").textContent =
      "Error: Cutter O.D. cannot exceed Pipe I.D.";
    return;
  }

  const result = (pipeOD / 2) - Math.sqrt(underRoot);
  const bcoText = `BCO: ${result.toFixed(4)}`;

  // Show result
  document.getElementById("result").textContent = bcoText;

  // Append to history UI
  const li = document.createElement("li");
  li.textContent = bcoText;
  document.getElementById("historyList").appendChild(li);

  // Save to localStorage
  let history = JSON.parse(localStorage.getItem("bcoHistory")) || [];
  history.push(bcoText);
  localStorage.setItem("bcoHistory", JSON.stringify(history));
}

function toggleHistory() {
  const box = document.getElementById("historyBox");
  box.style.display = box.style.display === "none" ? "block" : "none";
}

function loadHistory() {
  const history = JSON.parse(localStorage.getItem("bcoHistory")) || [];
  const list = document.getElementById("historyList");
  list.innerHTML = "";
  history.forEach(entry => {
    const li = document.createElement("li");
    li.textContent = entry;
    list.appendChild(li);
  });
}

// Keep ONE clearHistory (the confirm + localStorage one)
function clearHistory() {
  if (confirm("Are you sure you want to clear all BCO history?")) {
    document.getElementById("historyList").innerHTML = "";
    localStorage.removeItem("bcoHistory");
  }
}

// Theme toggle - single system: body.dark + localStorage
function initTheme() {
  const toggleBtn = document.getElementById("themeToggle");
  if (!toggleBtn) return;

  const saved = localStorage.getItem("theme");
  const isDark = saved === "dark";

  document.body.classList.toggle("dark", isDark);
  toggleBtn.textContent = isDark ? "☀️" : "🌙";

  toggleBtn.addEventListener("click", () => {
    const nowDark = document.body.classList.toggle("dark");
    toggleBtn.textContent = nowDark ? "☀️" : "🌙";
    localStorage.setItem("theme", nowDark ? "dark" : "light");
  });
}

window.onload = function () {
  document.getElementById("pipeMaterial").addEventListener("change", () => {
    idManuallyEdited = false;
    populatePipeOD();
  });

  document.getElementById("pipeOD").addEventListener("change", () => {
    idManuallyEdited = false;
    updatePipeID();
  });

  document.getElementById("schedule").addEventListener("change", () => {
    idManuallyEdited = false;
    updatePipeID();
  });

  document.getElementById("pipeID").addEventListener("input", () => {
    idManuallyEdited = true;
  });

  initTheme();
  populatePipeOD();
  loadHistory();
};
