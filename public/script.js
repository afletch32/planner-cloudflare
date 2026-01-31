const API_BASE = window.PLANNER_API_BASE || "/api";
const householdId = typeof HOUSEHOLD_ID !== "undefined" ? HOUSEHOLD_ID : "planner-household";
const personId = typeof PERSON_ID !== "undefined" ? PERSON_ID : "planner";
const STATE_NAMESPACE = "chore-history";
const STATE_KEY = "history";

let historyCache = null;

async function loadHistoryData() {
  try {
    const response = await fetch(
      `${API_BASE}/state?householdId=${encodeURIComponent(
        householdId
      )}&personId=${encodeURIComponent(
        personId
      )}&namespace=${encodeURIComponent(
        STATE_NAMESPACE
      )}&key=${encodeURIComponent(STATE_KEY)}`
    );
    if (!response.ok) return {};
    const data = await response.json();
    return data?.value && typeof data.value === "object" ? data.value : {};
  } catch (error) {
    return {};
  }
}

async function saveHistoryData(history) {
  try {
    await fetch(`${API_BASE}/state`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        householdId,
        personId,
        namespace: STATE_NAMESPACE,
        key: STATE_KEY,
        value: history,
      }),
    });
  } catch (error) {
    return;
  }
}

async function ensureHistory() {
  if (!historyCache) {
    historyCache = await loadHistoryData();
  }
  return historyCache;
}

async function persistHistory() {
  if (!historyCache) return;
  await saveHistoryData(historyCache);
}

// Save chore state for today
async function saveChoreHistory() {
  const today = new Date().toISOString().split("T")[0];
  const history = await ensureHistory();
  const dayLog = {};

  document.querySelectorAll('input[type="checkbox"]').forEach((box) => {
    const label = box.nextSibling.textContent.trim();
    dayLog[label] = box.checked;
  });

  history[today] = dayLog;
  historyCache = history;
  await persistHistory();
}

// Load checkbox states from today's history
async function loadTodayChores() {
  const today = new Date().toISOString().split("T")[0];
  const history = await ensureHistory();
  const todayLog = history[today] || {};

  document.querySelectorAll('input[type="checkbox"]').forEach((box) => {
    const label = box.nextSibling.textContent.trim();
    box.checked = todayLog[label] || false;
  });
}

// Display full chore history
async function showHistory() {
  const history = await ensureHistory();
  const container = document.getElementById("historyLog");
  if (!container) return;
  container.innerHTML = "";

  Object.entries(history)
    .reverse()
    .forEach(([date, chores]) => {
      const entry = document.createElement("div");
      entry.innerHTML =
        `<strong>${date}</strong><ul>` +
        Object.entries(chores)
          .map(
            ([task, done]) =>
              `<li>${task}: ${done ? "✅" : "❌"}</li>`
          )
          .join("") +
        `</ul>`;
      container.appendChild(entry);
    });
}

// Reset today’s checkboxes but keep history
async function resetTodayChores() {
  document.querySelectorAll('input[type="checkbox"]').forEach((box) => {
    box.checked = false;
  });
  await saveChoreHistory();
  await showHistory();
}

// Event listeners
const checkboxes = document.querySelectorAll('input[type="checkbox"]');
checkboxes.forEach((box) => {
  box.addEventListener("change", () => {
    void saveChoreHistory().then(showHistory);
  });
});

const resetBtn = document.getElementById("resetBtn");
if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    void resetTodayChores();
  });
}

// Initialize on page load
void loadTodayChores().then(showHistory);
