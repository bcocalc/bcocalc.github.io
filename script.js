
// FIXED script.js — uses TRUE OD for BCO calculation

const pipeData = {
  CarbonSteel: {
    "3.0": { STD: 3.068, "40": 3.068, XS: 2.9, "80": 2.9 },
    "4.0": { STD: 4.026, "40": 4.026, XS: 3.826, "80": 3.826 },
    "6.0": { STD: 6.065, "40": 6.065, XS: 5.761, "80": 5.761 },
    "8.0": { STD: 7.981, "40": 7.981, XS: 7.625, "80": 7.625 },
    "10.0": { STD: 10.02, "40": 10.02, XS: 9.564, "80": 9.564 },
    "12.0": { STD: 11.938, "40": 11.938, XS: 11.314, "80": 11.314 }
  }
};

const trueOD = {
  CarbonSteel: {
    "3.0": 3.5,
    "4.0": 4.5,
    "6.0": 6.625,
    "8.0": 8.625,
    "10.0": 10.75,
    "12.0": 12.75
  }
};

let idManuallyEdited = false;

function populatePipeOD() {
  const material = document.getElementById("pipeMaterial").value;
  const odSelect = document.getElementById("pipeOD");
  odSelect.innerHTML = "";

  for (const size in pipeData[material]) {
    const option = document.createElement("option");
    option.value = size;
    option.textContent = `${size}" (${trueOD[material][size]} OD)`;
    odSelect.appendChild(option);
  }
  updatePipeID();
}

function updatePipeID() {
  const material = document.getElementById("pipeMaterial").value;
  const od = document.getElementById("pipeOD").value;
  const schedule = document.getElementById("schedule").value;
  const pipe = pipeData[material][od];

  if (!idManuallyEdited && pipe[schedule]) {
    document.getElementById("pipeID").value = pipe[schedule];
  }
}

function calculateBCO() {
  const material = document.getElementById("pipeMaterial").value;
  const nominal = document.getElementById("pipeOD").value;

  const pipeOD = trueOD[material][nominal];
  const pipeID = parseFloat(document.getElementById("pipeID").value);
  const cutterOD = parseFloat(document.getElementById("cutterOD").value);

  const result =
    (pipeOD / 2) -
    Math.sqrt(Math.pow(pipeID / 2, 2) - Math.pow(cutterOD / 2, 2));

  document.getElementById("result").textContent =
    `BCO: ${result.toFixed(4)}`;
}

window.onload = populatePipeOD;
