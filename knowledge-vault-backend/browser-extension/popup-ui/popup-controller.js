// POPUP CONTROLLER
//
// This script controls the extension's popup interface.
// It handles user interactions like starting/stopping sessions
// and provides preview/export functionality.
//
// For beginners: This is the "remote control" for the extension.
// It sends commands to the background service and updates the UI.

const startBtn    = document.getElementById("startBtn");
const stopBtn     = document.getElementById("stopBtn");
const statusBadge = document.getElementById("statusBadge");
const sessionInfo = document.getElementById("sessionInfo");
const exportCsv   = document.getElementById("exportCsv");
const exportPdf   = document.getElementById("exportPdf");
const exportJson  = document.getElementById("exportJson");
const previewBtn  = document.getElementById("previewBtn");
const previewBox  = document.getElementById("previewBox");

let currentSessionId = null;

chrome.runtime.sendMessage({ type: "GET_STATUS" }, (res) => {
  if (res?.isSessionActive) {
    setActiveState(res.sessionId);
  } else {
    setInactiveState();
  }
});

startBtn.addEventListener("click", () => {
  startBtn.disabled = true;
  startBtn.textContent = "Starting...";
  chrome.runtime.sendMessage({ type: "START_SESSION" }, (res) => {
    if (res?.success) {
      setActiveState(res.sessionId);
    } else {
      startBtn.disabled = false;
      startBtn.textContent = "Start Session";
      alert("Failed to start session. Is the AI server running?");
    }
  });
});

stopBtn.addEventListener("click", () => {
  stopBtn.disabled = true;
  stopBtn.textContent = "Stopping...";
  chrome.runtime.sendMessage({ type: "STOP_SESSION" }, () => {
    setInactiveState();
  });
});

previewBtn.addEventListener("click", async () => {
  if (!currentSessionId) return;
  previewBox.textContent = "Loading preview...";
  previewBox.style.display = "block";

  try {
    const res = await fetch(
      `http://localhost:4000/preview/${currentSessionId}`
    );
    const data = await res.json();
    const p = data.profile;

    previewBox.innerHTML = `
      <b>Quality Score:</b> ${p.data_quality_score}/100<br>
      <b>Pages:</b> ${p.pages_analyzed}<br>
      <b>Interests:</b> ${p.top_interests.map(i => i.name).join(", ") || "—"}<br>
      <b>Topics:</b> ${p.top_topics.map(t => t.name).join(", ") || "—"}<br>
      <b>Searches:</b> ${p.search_queries.join(", ") || "—"}<br>
      <b>Sensitivity:</b> ${data.consent.sensitivity_level}
    `;
  } catch {
    previewBox.textContent = "Could not load preview.";
  }
});

exportCsv.addEventListener("click", () => {
  if (!currentSessionId) return;
  chrome.tabs.create({
    url: `http://localhost:4000/export/csv/${currentSessionId}`
  });
});

exportPdf.addEventListener("click", () => {
  if (!currentSessionId) return;
  chrome.tabs.create({
    url: `http://localhost:4000/export/pdf/${currentSessionId}`
  });
});

exportJson.addEventListener("click", () => {
  if (!currentSessionId) return;
  chrome.tabs.create({
    url: `http://localhost:4000/export/profile/${currentSessionId}`
  });
});

function setActiveState(sessionId) {
  currentSessionId = sessionId;
  statusBadge.textContent = "● Active";
  statusBadge.className = "status-badge active";
  startBtn.disabled = true;
  stopBtn.disabled = false;
  previewBtn.disabled = false;
  exportCsv.disabled = false;
  exportPdf.disabled = false;
  exportJson.disabled = false;
  sessionInfo.textContent = `Session: ${sessionId}`;
}

function setInactiveState() {
  statusBadge.textContent = "● Inactive";
  statusBadge.className = "status-badge inactive";
  startBtn.disabled = false;
  startBtn.textContent = "Start Session";
  stopBtn.disabled = true;
  stopBtn.textContent = "Stop Session";
  previewBtn.disabled = false;
  sessionInfo.textContent = currentSessionId
    ? `Last: ${currentSessionId}` : "";
}
