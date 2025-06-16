// === Helper Functions ===
function createOption(value, text, selected = false) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = text;
  if (selected) option.selected = true;
  return option;
}

function createSelect(id, options, defaultText = "Please Select") {
  const select = document.createElement("select");
  select.id = id;
  select.appendChild(createOption("", defaultText, true));
  options.forEach(opt => select.appendChild(createOption(opt.value, opt.text)));
  return select;
}

function createLabel(text, element, description) {
  const label = document.createElement("label");
  label.textContent = text;
  label.appendChild(document.createElement("br"));
  label.appendChild(element);
  if (description) {
    const small = document.createElement("small");
    small.textContent = description;
    label.appendChild(document.createElement("br"));
    label.appendChild(small);
  }
  return label;
}

// === ISTUMBLE Setup ===
const istumbleQuestions = [
  { id: "pain", text: "Intense Pain?", desc: "e.g. verbal or visible pain on movement" },
  { id: "spine", text: "Spine Pain or Tenderness?", desc: "e.g. tenderness to neck/back or visible injury" },
  { id: "tingling", text: "Tingling or Numbness?", desc: "e.g. altered sensation in arms or legs" },
  { id: "unconscious", text: "Unconscious or Altered Mental State?", desc: "e.g. GCS < 15 or confused" },
  { id: "mobility", text: "Mobility Issues?", desc: "e.g. cannot walk or stand unaided" },
  { id: "bleed", text: "Bleeding or Clot Risk?", desc: "e.g. head injury + anticoagulants" },
  { id: "unwell", text: "Looked Unwell or Deteriorating?", desc: "e.g. pale, clammy, worsening symptoms" },
  { id: "trauma", text: "Evidence of Trauma?", desc: "e.g. bruising, wounds, deformity" }
];

function buildIstumble() {
  const container = document.getElementById("istumble-content");
  istumbleQuestions.forEach(q => {
    const select = createSelect(q.id, [
      { value: "Yes", text: "Yes" },
      { value: "No", text: "No" },
      { value: "Unknown", text: "Unknown" }
    ]);
    container.appendChild(createLabel(q.text, select, q.desc));
  });
}

function evaluateIstumble() {
  let redFlag = false;
  istumbleQuestions.forEach(q => {
    const val = document.getElementById(q.id).value;
    if (val === "Yes") redFlag = true;
  });
  const resultDiv = document.getElementById("istumble-result");
  if (redFlag) {
    resultDiv.textContent = "⚠️ Lift Not Authorised-Red Flag Detected: Escalate via Response Desk";
    resultDiv.className = "risk-result high-risk";
  } else {
    resultDiv.textContent = "✅ Lift Authorised-No Red Flags Detected";
    resultDiv.className = "risk-result low-risk";
  }
}

// === FRAT Setup ===
const fratQuestions = [
  { id: "falls", text: "Previous falls in last 12 months?", desc: "e.g. confirmed by patient or carer", options: [
    {value: "0", text: "None"},
    {value: "2", text: "One"},
    {value: "4", text: "Two or more"}
  ]},
  { id: "meds", text: "Medications (number of daily meds)?", desc: "e.g. 0-3, 4-6, 7+", options: [
    {value: "0", text: "0-3"},
    {value: "1", text: "4-6"},
    {value: "2", text: "7+"}
  ]},
  { id: "psych", text: "Psychological status (mood)?", desc: "e.g. Normal, Mild, Severe", options: [
    {value: "0", text: "Normal"},
    {value: "1", text: "Mild"},
    {value: "2", text: "Severe"}
  ]},
  { id: "cog", text: "Cognitive function (AMTS)?", desc: "e.g. 10 (normal), 7-9, <7", options: [
    {value: "0", text: "10"},
    {value: "2", text: "7-9"},
    {value: "4", text: "<7"}
  ]},
  { id: "func", text: "Functional status change?", desc: "Recent change in function or mobility", options: [
    {value: "0", text: "No"},
    {value: "1", text: "Yes"}
  ]},
  { id: "postural", text: "Postural hypotension?", desc: "Symptoms or documented drop in BP", options: [
    {value: "0", text: "No"},
    {value: "1", text: "Yes"}
  ]}
];

function buildFrat() {
  const container = document.getElementById("frat-content");
  fratQuestions.forEach(q => {
    if (q.id === "cog") {
      const infoBtn = document.createElement("button");
      infoBtn.type = "button";
      infoBtn.textContent = "ℹ️ AMTS Questions";
      infoBtn.style.marginLeft = "10px";
      infoBtn.style.fontSize = "0.9rem";

      infoBtn.addEventListener("click", () => {
        document.getElementById("amts-modal").style.display = "block";
      });

      const select = createSelect(q.id, q.options);
      const label = createLabel(q.text, select, q.desc);
      label.appendChild(infoBtn);
      container.appendChild(label);
    } else {
      const select = createSelect(q.id, q.options);
      container.appendChild(createLabel(q.text, select, q.desc));
    }
  });
}

function calculateFrat() {
  let score = 0;
  let risk = "";
  let advisories = [];

  fratQuestions.forEach(q => {
    const val = document.getElementById(q.id).value;
    if (val === "") return;
    score += parseInt(val, 10);
  });

  if (score >= 16) {
    risk = "High Risk";
  } else if (score >= 12) {
    risk = "Medium Risk";
  } else if (score >= 5) {
    risk = "Low Risk";
  } else {
    risk = "Minimal Risk";
  }

  if (score >= 16) advisories.push("Urgent referral to falls prevention team.");
  if (score >= 12 && score < 16) advisories.push("Consider referral and close monitoring.");

  const resultDiv = document.getElementById("frat-result");
  resultDiv.innerHTML = `<strong>FRAT Score: ${score} / 20 (${risk})</strong>`;
  if (advisories.length) {
    resultDiv.innerHTML += "<ul>" + advisories.map(a => `<li>${a}</li>`).join("") + "</ul>";
  }
  resultDiv.className = risk === "High Risk" ? "risk-result high-risk" : "risk-result low-risk";
}

// === OBS & NEWS2 Setup ===
const obsFields = [
  { id: "rr", text: "Respiratory Rate (breaths/min)", min: 8, max: 30 },
  { id: "spo2", text: "Oxygen Saturation (%)", min: 75, max: 100 },
  { id: "o2supp", text: "Oxygen Supplementation?", options: ["No", "Yes"] },
  { id: "temp", text: "Temperature (°C)", min: 32.0, max: 42.0 },
  { id: "sbp", text: "Systolic Blood Pressure (mmHg)", min: 65, max: 200 },
  { id: "hr", text: "Heart Rate (bpm)", min: 40, max: 200 },
  { id: "avpu", text: "Level of Consciousness (AVPU)", options: ["Alert", "Voice", "Pain", "Unresponsive"] }
];

function buildObs() {
  const container = document.getElementById("obs-content");
  obsFields.forEach(f => {
    let input;
    if (f.options) {
      input = createSelect(f.id, f.options.map(o => ({value: o, text: o})));
    } else {
      input = document.createElement("input");
      input.type = "number";
      input.id = f.id;
      input.min = f.min;
      input.max = f.max;
      input.placeholder = f.text;
    }
    container.appendChild(createLabel(f.text, input));
  });
}

function calculateNews2() {
  function scoreRR(rr) {
    if (rr === "") return 0;
    rr = Number(rr);
    if (rr <= 8) return 3;
    if (rr <= 11) return 1;
    if (rr >= 25) return 3;
    if (rr >= 21) return 2;
    return 0;
  }

  function scoreSpo2(spo2, o2supp) {
    spo2 = Number(spo2);
    if (spo2 === "") return 0;
    if (spo2 <= 91) return 3;
    if (spo2 <= 93) return 2;
    if (spo2 <= 95) return 1;
    return 0;
  }

  function scoreTemp(temp) {
    if (temp === "") return 0;
    temp = Number(temp);
    if (temp <= 35) return 3;
    if (temp >= 39.1) return 2;
    if (temp >= 38.1) return 1;
    return 0;
  }

  function scoreSBP(sbp) {
    if (sbp === "") return 0;
    sbp = Number(sbp);
    if (sbp <= 90) return 3;
    if (sbp <= 100) return 2;
    if (sbp <= 110) return 1;
    return 0;
  }

  function scoreHR(hr) {
    if (hr === "") return 0;
    hr = Number(hr);
    if (hr <= 40) return 3;
    if (hr <= 50) return 1;
    if (hr >= 131) return 3;
    if (hr >= 111) return 2;
    if (hr >= 91) return 1;
    return 0;
  }

  function scoreAVPU(avpu) {
    if (avpu === "") return 0;
    if (avpu === "Alert") return 0;
    return 3;
  }

  const rr = document.getElementById("rr").value;
  const spo2 = document.getElementById("spo2").value;
  const o2supp = document.getElementById("o2supp").value;
  const temp = document.getElementById("temp").value;
  const sbp = document.getElementById("sbp").value;
  const hr = document.getElementById("hr").value;
  const avpu = document.getElementById("avpu").value;

  let total = 0;
  total += scoreRR(rr);
  total += scoreSpo2(spo2, o2supp);
  total += scoreTemp(temp);
  total += scoreSBP(sbp);
  total += scoreHR(hr);
  total += scoreAVPU(avpu);

  let riskBand = "low-risk";
  let riskText = "Low Risk";
  if (total >= 7) {
    riskBand = "high-risk";
    riskText = "High Risk — Escalate Immediately";
  } else if (total >= 5) {
    riskBand = "medium-risk";
    riskText = "Medium Risk — Close Monitoring";
  }

  const resultDiv = document.getElementById("news2-result");
  resultDiv.textContent = `NEWS2 Score: ${total} (${riskText})`;
  resultDiv.className = `risk-result ${riskBand}`;
}

// === Setup & event listeners ===
document.addEventListener("DOMContentLoaded", () => {
  buildIstumble();
  buildFrat();
  buildObs();

  document.getElementById("istumble-evaluate").addEventListener("click", evaluateIstumble);
  document.getElementById("frat-calculate").addEventListener("click", calculateFrat);

  ["rr", "spo2", "o2supp", "temp", "sbp", "hr", "avpu"].forEach(id => {
    document.getElementById(id).addEventListener("input", calculateNews2);
    document.getElementById(id).addEventListener("change", calculateNews2);
  });

  document.getElementById("generate-email").addEventListener("click", () => {
    const istumbleAnswers = istumbleQuestions.map(q => `${q.text}: ${document.getElementById(q.id).value || "Not answered"}`).join("\n");
    const fratAnswers = fratQuestions.map(q => `${q.text}: ${document.getElementById(q.id).value || "Not answered"}`).join("\n");
    const obsAnswers = obsFields.map(f => `${f.text}: ${document.getElementById(f.id).value || "Not answered"}`).join("\n");
    const news2Score = document.getElementById("news2-result").textContent || "Not calculated";

    const summary =
      `Falls Assessment Summary:\n\n` +
      `ISTUMBLE:\n${istumbleAnswers}\n\n` +
      `FRAT:\n${fratAnswers}\n\n` +
      `Observations:\n${obsAnswers}\n\n` +
      `NEWS2 Score:\n${news2Score}`;

    const subject = encodeURIComponent("Falls Assessment Summary");
    const body = encodeURIComponent(summary);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  });

  document.getElementById("close-amts").addEventListener("click", () => {
    document.getElementById("amts-modal").style.display = "none";
  });

  // PWA Service Worker registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js').then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      }).catch(error => {
        console.log('Service Worker registration failed:', error);
      });
    });
  }
});
