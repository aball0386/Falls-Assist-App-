// === Core Utility Functions ===
function createOption(value, text, selected = false) {
  const opt = document.createElement("option");
  opt.value = value;
  opt.textContent = text;
  if (selected) opt.selected = true;
  return opt;
}

function createSelect(id, options, defaultText = "Select", multi = false) {
  const select = document.createElement("select");
  select.id = id;
  if (multi) select.multiple = true;
  if (!multi) select.appendChild(createOption("", defaultText, true));
  options.forEach(opt => select.appendChild(createOption(opt.value, opt.text)));
  return select;
}

function createLabel(text, element, description = "") {
  const label = document.createElement("label");
  label.innerHTML = `<strong>${text}</strong><br/>`;
  label.appendChild(element);
  if (description) {
    const small = document.createElement("small");
    small.textContent = description;
    label.appendChild(document.createElement("br"));
    label.appendChild(small);
  }
  return label;
}

function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value || "" : "";
}

function toggleSection(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle("hidden");
}

function showAlert(targetId, msg, riskLevel = "low") {
  const el = document.getElementById(targetId);
  if (el) {
    el.textContent = msg;
    el.className = `risk-result ${riskLevel}-risk`;
  }
}

// === Settings Menu ===
function toggleSettings() {
  document.getElementById("settingsPanel").classList.toggle("hidden");
}

function applySettings() {
  const theme = document.getElementById("themeSelect").value;
  const dark = document.getElementById("darkModeSelect").value;
  const font = document.getElementById("fontSelect").value;

  document.body.className = `${theme} ${dark === 'on' ? 'dark' : ''} font-${font}`;
}

function resetApp() {
  if (confirm("Clear all data and reset app?")) {
    localStorage.clear();
    location.reload();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("themeSelect").addEventListener("change", applySettings);
  document.getElementById("darkModeSelect").addEventListener("change", applySettings);
  document.getElementById("fontSelect").addEventListener("change", applySettings);
  document.getElementById("resetBtn").addEventListener("click", resetApp);
});

// === ISTUMBLE ===
const istumbleQuestions = [
  { id: "pain", text: "Intense Pain?", desc: "Visible or verbal pain" },
  { id: "spine", text: "Spine Tenderness?", desc: "Neck or back injury" },
  { id: "tingling", text: "Tingling/Numbness?", desc: "Altered sensation" },
  { id: "unconscious", text: "Unconscious/Altered GCS?", desc: "Confused or <15" },
  { id: "mobility", text: "Mobility Issues?", desc: "Unable to stand unaided" },
  { id: "bleed", text: "Bleeding/Clot Risk?", desc: "Anticoagulant use" },
  { id: "unwell", text: "Unwell/Deteriorating?", desc: "Clammy, worsening" },
  { id: "trauma", text: "Evidence of Trauma?", desc: "Wounds, bruising" }
];

function buildIstumble() {
  const container = document.getElementById("istumble-content");
  istumbleQuestions.forEach(q => {
    const select = createSelect(q.id, [
      { value: "Yes", text: "Yes" },
      { value: "No", text: "No" },
      { value: "Unknown", text: "Unknown" }
    ]);
    select.addEventListener("change", () => {
      evaluateIstumble();
      checkBloodThinnerAlert();
    });
    container.appendChild(createLabel(q.text, select, q.desc));
  });
}

function evaluateIstumble() {
  const trauma = getVal("trauma");
  const meds = getSelectedMeds();
  const red = istumbleQuestions.some(q => getVal(q.id) === "Yes");
  if (red) {
    showAlert("istumble-result", "⚠️ Lift Not Authorised - Red Flag Detected", "high");
  } else {
    showAlert("istumble-result", "✅ Lift Authorised - No Red Flags", "low");
  }

  // Special alert: blood thinner + trauma
  if (meds.length && (trauma === "Yes" || trauma === "Unknown")) {
    showAlert("medsAlert", "⚠️ Anticoagulant Use with Suspected or Unknown Trauma – Lift Not Authorised. Escalate via PP Hub.", "high");
  } else if (meds.length) {
    showAlert("medsAlert", "⚠️ Anticoagulant Use Detected – Seek Advice from PP Hub", "medium");
  } else {
    showAlert("medsAlert", "", "");
  }
}

// === FAST Test ===
function buildFastTest() {
  const container = document.getElementById("fast-test");
  const items = [
    { id: "fast-face", text: "Face Droop" },
    { id: "fast-arm", text: "Arm Weakness" },
    { id: "fast-speech", text: "Speech Issues" }
  ];
  items.forEach(item => {
    const select = createSelect(item.id, [
      { value: "Yes", text: "Yes" },
      { value: "No", text: "No" },
      { value: "Unknown", text: "Unknown" }
    ]);
    select.addEventListener("change", evaluateFast);
    container.appendChild(createLabel(item.text, select));
  });
  container.appendChild(Object.assign(document.createElement("div"), { id: "fast-result", className: "risk-result" }));
}

function evaluateFast() {
  const f = getVal("fast-face"), a = getVal("fast-arm"), s = getVal("fast-speech");
  if ([f, a, s].includes("Yes")) {
    showAlert("fast-result", "⚠️ Suspected Stroke. Initiate Stroke Pathway and Update on NMA.", "high");
  } else {
    showAlert("fast-result", "✅ No FAST indicators present.", "low");
  }
}

// === Blood Thinner Dropdown & Alert ===
const bloodThinnerOptions = [
  "Warfarin", "Rivaroxaban (Xarelto)", "Apixaban (Eliquis)",
  "Dabigatran (Pradaxa)", "Edoxaban (Lixiana)", "Clopidogrel (Plavix)",
  "Ticagrelor", "Prasugrel", "Aspirin", "Dipyridamole", "Heparin", "Enoxaparin"
];

function getSelectedMeds() {
  const meds = document.getElementById("bloodThinners");
  return meds ? Array.from(meds.selectedOptions).map(o => o.value) : [];
}

function buildMedsPanel() {
  const container = document.getElementById("medsPanel");
  const medSelect = createSelect("bloodThinners", bloodThinnerOptions.map(m => ({ value: m, text: m })), "", true);
  medSelect.addEventListener("change", () => {
    evaluateIstumble();
  });

  container.appendChild(createLabel("Prescribed Blood Thinners", medSelect, "Select all that apply"));
  const alert = document.createElement("div");
  alert.id = "medsAlert";
  alert.className = "risk-result";
  container.appendChild(alert);
}

// === OBS Inputs Highlighting ===
const obsThresholds = {
  resp: { green: [12, 20], amber: [9, 11, 21, 24], red: [0, 8, 25, 100] },
  sats: { green: [96, 100], amber: [94, 95], red: [0, 93] },
  temp: { green: [36.1, 38.0], amber: [35.1, 36.0, 38.1, 39.0], red: [0, 35.0, 39.1, 100] },
  pulse: { green: [51, 90], amber: [41, 50, 91, 110], red: [0, 40, 111, 250] },
  bp: { green: [111, 219], amber: [101, 110, 220, 240], red: [0, 100, 241, 300] },
  bm: { green: [4.0, 7.8], amber: [3.5, 3.9, 7.9, 11.0], red: [0.0, 3.4, 11.1, 25.0] }
};

function colorHighlight(input, type) {
  const val = parseFloat(input.value);
  if (isNaN(val)) return (input.style.backgroundColor = "");

  const thresholds = obsThresholds[type];
  let color = "";

  if ((val >= thresholds.green[0] && val <= thresholds.green[1])) {
    color = "lightgreen";
  } else if (
    (val >= thresholds.amber[0] && val <= thresholds.amber[1]) ||
    (val >= thresholds.amber[2] && val <= thresholds.amber[3])
  ) {
    color = "orange";
  } else {
    color = "red";
  }
  input.style.backgroundColor = color;
}

// === Build OBS Fields ===
function buildObs() {
  const fields = [
    { id: "resp", label: "Respiratory Rate" },
    { id: "sats", label: "SpO2 (%)" },
    { id: "temp", label: "Temperature (°C)" },
    { id: "pulse", label: "Pulse Rate (bpm)" },
    { id: "bp", label: "Systolic BP" },
    { id: "bm", label: "Blood Glucose (BM)" }
  ];
  const container = document.getElementById("obs-section");
  fields.forEach(f => {
    const input = document.createElement("input");
    input.type = "number";
    input.id = f.id;
    input.addEventListener("input", () => colorHighlight(input, f.id));
    container.appendChild(createLabel(f.label, input));
  });

  const normRangeToggle = createSelect("normalRangeToggle", [
    { value: "No", text: "No" },
    { value: "Yes", text: "Yes" }
  ]);
  container.appendChild(createLabel("Use Patient's Normal Ranges?", normRangeToggle));
}

// === Summary Generator ===
function generateSummary() {
  const summary = document.getElementById("summary");
  summary.innerHTML = `
    <h3>Patient Identifier Summary</h3>
    <p><strong>INC Number:</strong> ${getVal("incidentNumber")}</p>
    <p><strong>Age:</strong> ${getVal("patientAge")} | <strong>Sex:</strong> ${getVal("patientSex")}</p>
    <p><strong>FAST:</strong> ${getVal("fast-face")}, ${getVal("fast-arm")}, ${getVal("fast-speech")}</p>
    <p><strong>Blood Thinners:</strong> ${getSelectedMeds().join(", ")}</p>
    <h4>OBS:</h4>
    <ul>
      <li>Resp: ${getVal("resp")}</li>
      <li>SpO2: ${getVal("sats")}</li>
      <li>Temp: ${getVal("temp")}</li>
      <li>Pulse: ${getVal("pulse")}</li>
      <li>BP: ${getVal("bp")}</li>
      <li>BM: ${getVal("bm")}</li>
    </ul>
  `;
  document.getElementById("summaryPanel").classList.remove("hidden");
}

document.getElementById("summaryButton").addEventListener("click", generateSummary);

// === FRAT Questions and Scoring (From CSV Mapping) ===
const fratQuestions = [
  {
    id: "frat-falls",
    text: "Previous falls in last 12 months?",
    options: [
      { value: "No falls", score: 0 },
      { value: "1 fall", score: 5 },
      { value: "More than 1 fall", score: 10 }
    ]
  },
  {
    id: "frat-function",
    text: "Change in Function in last 3 months?",
    options: [
      { value: "No", score: 0 },
      { value: "Yes", score: 5 },
      { value: "Unknown", score: 5 }
    ],
    showComment: true
  },
  {
    id: "frat-walking",
    text: "Walking aid used?",
    options: [
      { value: "No aid", score: 0 },
      { value: "Single point stick", score: 5 },
      { value: "Zimmer/frame/walker", score: 10 }
    ]
  },
  {
    id: "frat-medication",
    text: "Medication causing dizziness?",
    options: [
      { value: "No", score: 0 },
      { value: "Yes", score: 5 },
      { value: "Unknown", score: 5 }
    ]
  },
  {
    id: "frat-cognitive",
    text: "Cognitive Impairment?",
    options: [
      { value: "No", score: 0 },
      { value: "Yes", score: 10 },
      { value: "Unknown", score: 10 }
    ]
  }
];

function buildFratAssessment() {
  const container = document.getElementById("frat-section");
  fratQuestions.forEach(q => {
    const select = createSelect(q.id, q.options.map(o => ({ value: o.value, text: o.value })));
    select.addEventListener("change", () => {
      calculateFratScore();
      if (q.showComment && (select.value === "Yes" || select.value === "Unknown")) {
        document.getElementById(`${q.id}-comment`).classList.remove("hidden");
      } else if (q.showComment) {
        document.getElementById(`${q.id}-comment`).classList.add("hidden");
      }
    });

    container.appendChild(createLabel(q.text, select));

    if (q.showComment) {
      const comment = document.createElement("textarea");
      comment.id = `${q.id}-comment-text`;
      comment.classList.add("hidden");
      comment.placeholder = "Add relevant comment here";
      const wrapper = document.createElement("div");
      wrapper.id = `${q.id}-comment`;
      wrapper.className = "hidden";
      wrapper.appendChild(comment);
      container.appendChild(wrapper);
    }
  });

  const dateLabel = document.createElement("label");
  dateLabel.innerHTML = "Date of previous fall (if applicable):";
  const fallDate = document.createElement("input");
  fallDate.type = "date";
  fallDate.id = "frat-falls-date";
  dateLabel.appendChild(fallDate);
  container.appendChild(dateLabel);

  const result = document.createElement("div");
  result.id = "frat-result";
  result.className = "risk-result";
  container.appendChild(result);
}

function calculateFratScore() {
  let total = 0;
  fratQuestions.forEach(q => {
    const val = getVal(q.id);
    const found = q.options.find(opt => opt.value === val);
    if (found) total += found.score;
  });

  let risk = "";
  let riskClass = "";
  if (total >= 16) {
    risk = "High Risk";
    riskClass = "high-risk";
  } else if (total >= 12) {
    risk = "Medium Risk";
    riskClass = "medium-risk";
  } else if (total >= 5) {
    risk = "Low Risk";
    riskClass = "low-risk";
  } else {
    risk = "No Risk";
    riskClass = "";
  }

  const result = document.getElementById("frat-result");
  result.textContent = `FRAT Score: ${total} – ${risk}`;
  result.className = `risk-result ${riskClass}`;
}

// === PDF Export Stub (Optional Placeholder for Integration) ===
function exportToPDF() {
  alert("PDF export feature coming soon – please screenshot or copy summary for now.");
}

// === Initial App Load ===
window.onload = function () {
  buildIstumble();
  buildFastTest();
  buildObs();
  buildFratAssessment();
  buildMedsPanel();
  applySettings(); // Load theme if stored
};




