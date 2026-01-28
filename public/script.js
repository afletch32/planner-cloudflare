// Save chore state for today
function saveChoreHistory() {
  const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
  const history = JSON.parse(localStorage.getItem('choreHistory')) || {};
  const dayLog = {};

  document.querySelectorAll('input[type="checkbox"]').forEach(box => {
    const label = box.nextSibling.textContent.trim();
    dayLog[label] = box.checked;
  });

  history[today] = dayLog;
  localStorage.setItem('choreHistory', JSON.stringify(history));
}

// Load checkbox states from today's history
function loadTodayChores() {
  const today = new Date().toISOString().split('T')[0];
  const history = JSON.parse(localStorage.getItem('choreHistory')) || {};
  const todayLog = history[today] || {};

  document.querySelectorAll('input[type="checkbox"]').forEach(box => {
    const label = box.nextSibling.textContent.trim();
    box.checked = todayLog[label] || false;
  });
}

// Display full chore history
function showHistory() {
  const history = JSON.parse(localStorage.getItem('choreHistory')) || {};
  const container = document.getElementById('historyLog');
  container.innerHTML = '';

  for (const [date, chores] of Object.entries(history).reverse()) {
    const entry = document.createElement('div');
    entry.innerHTML = `<strong>${date}</strong><ul>` +
      Object.entries(chores).map(([task, done]) =>
        `<li>${task}: ${done ? '✅' : '❌'}</li>`).join('') +
      `</ul>`;
    container.appendChild(entry);
  }
}

// Reset today’s checkboxes but keep history
function resetTodayChores() {
  document.querySelectorAll('input[type="checkbox"]').forEach(box => {
    box.checked = false;
  });
  saveChoreHistory(); // Save reset state
  showHistory();       // Refresh history view
}

// Event listeners
document.querySelectorAll('input[type="checkbox"]').forEach(box => {
  box.addEventListener('change', () => {
    saveChoreHistory();
    showHistory();
  });
});

document.getElementById('resetBtn').addEventListener('click', () => {
  resetTodayChores();
});

// Initialize on page load
loadTodayChores();
showHistory();
