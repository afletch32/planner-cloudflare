// Live schedule + unfinished tasks.
(() => {
  const scheduleSection = document.getElementById("schedule");
  const scheduleList = document.getElementById("schedule-list");
  const unfinishedList = document.getElementById("unfinished-list");
  const scheduleTime = document.getElementById("schedule-time");
  const unfinishedCount = document.getElementById("unfinished-count");
  const plannerRoleBar = document.getElementById("planner-role-bar");
  const plannerRoleLabel = document.getElementById("planner-role-label");
  const plannerRoleSwitch = document.getElementById("planner-role-switch");
  const plannerAuthModal = document.getElementById("planner-auth-modal");
  const plannerAuthForm = document.getElementById("planner-auth-form");
  const plannerAuthError = document.getElementById("planner-auth-error");
  const plannerRoleSelect = document.getElementById("planner-role");
  const plannerPinInput = document.getElementById("planner-pin");
  const plannerRememberInput = document.getElementById("planner-remember");

  if (
    !scheduleSection ||
    !scheduleList ||
    !unfinishedList ||
    !scheduleTime ||
    !unfinishedCount
  ) {
    return;
  }

  const rolePermissions = {
    admin: {
      canComplete: true,
      canApproveStars: true,
      canRequestFix: true,
      canWrite: true,
    },
    adult: {
      canComplete: true,
      canApproveStars: true,
      canRequestFix: true,
      canWrite: true,
    },
    teen: {
      canComplete: true,
      canApproveStars: false,
      canRequestFix: true,
      canWrite: true,
    },
    child: {
      canComplete: true,
      canApproveStars: false,
      canRequestFix: false,
      canWrite: false,
    },
    guest: {
      canComplete: false,
      canApproveStars: false,
      canRequestFix: false,
      canWrite: false,
    },
  };
  let sessionAuth = null;
  const plannerId = scheduleSection.getAttribute("data-planner-id") || "work";
  const API_BASE = window.PLANNER_API_BASE || "/api";
  const STATE_NAMESPACE = "planner-schedule";
  const householdId =
    typeof HOUSEHOLD_ID !== "undefined" ? HOUSEHOLD_ID : "planner-household";
  const personId =
    typeof PERSON_ID !== "undefined" ? PERSON_ID : plannerId;
  const fallbackTasks = [
    {
      id: "inbox-sweep",
      title: "Review new requests and leads",
      time: "08:30",
      durationMinutes: 30,
    },
    {
      id: "content-pass",
      title: "Website content cleanup",
      time: "10:00",
      durationMinutes: 60,
    },
    {
      id: "client-call",
      title: "Client check-in call",
      time: "13:30",
      durationMinutes: 45,
    },
    {
      id: "handoff-notes",
      title: "Send handoff notes + next steps",
      time: "15:00",
      durationMinutes: 30,
    },
    {
      id: "anytime-backlog",
      title: "Anytime: Backlog cleanup",
      anytime: true,
    },
    {
      id: "anytime-star-review",
      title: "Anytime: Review task stars",
      anytime: true,
    },
  ];

  let taskState = [];
  let taskOverrides = {};

  function applyTaskOverrides(tasks) {
    const overrides = taskOverrides || {};
    return tasks.map((task) => {
      const override = overrides[task.id] || {};
      const baseCompleted =
        typeof task.completed === "boolean" ? task.completed : false;
      const baseStarsStatus = task.starsStatus || "pending";
      return {
        ...task,
        completed:
          typeof override.completed === "boolean"
            ? override.completed
            : baseCompleted,
        starsStatus: override.starsStatus || baseStarsStatus,
      };
    });
  }

  async function loadTaskOverrides() {
    const key = `overrides:${plannerId}`;
    const value = await loadStateValue(STATE_NAMESPACE, key, {});
    taskOverrides =
      value && typeof value === "object" ? value : {};
  }

  function normalizeTasks(tasks) {
    if (!Array.isArray(tasks)) {
      return [];
    }
    return tasks
      .filter((task) => task && typeof task.id === "string")
      .map((task) => ({
        id: task.id.trim(),
        title: String(task.title || "Untitled task").trim(),
        time: task.time || null,
        durationMinutes: task.durationMinutes || 30,
        anytime: Boolean(task.anytime),
        completed: Boolean(task.completed),
        starsStatus: task.starsStatus || "pending",
      }))
      .filter((task) => task.id.length > 0);
  }

  async function loadStateValue(namespace, key, fallback) {
    try {
      const response = await fetch(
        `${API_BASE}/state?householdId=${encodeURIComponent(
          householdId
        )}&personId=${encodeURIComponent(
          personId
        )}&namespace=${encodeURIComponent(
          namespace
        )}&key=${encodeURIComponent(key)}`,
        { cache: "no-store" }
      );
      if (!response.ok) {
        return fallback;
      }
      const data = await response.json();
      return typeof data?.value === "undefined" ? fallback : data.value;
    } catch (error) {
      return fallback;
    }
  }

  async function saveStateValue(namespace, key, value) {
    try {
      await fetch(`${API_BASE}/state`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          householdId,
          personId,
          namespace,
          key,
          value,
        }),
      });
    } catch (error) {
      return;
    }
  }

  function saveTaskOverrides(tasks) {
    const payload = tasks.reduce((acc, task) => {
      acc[task.id] = {
        completed: task.completed,
        starsStatus: task.starsStatus,
      };
      return acc;
    }, {});
    taskOverrides = payload;
    saveStateValue(STATE_NAMESPACE, `overrides:${plannerId}`, payload);
  }

  function loadAuth() {
    return sessionAuth;
  }

  function saveAuth(auth, remember) {
    sessionAuth = auth;
    return;
  }

  function clearAuth() {
    sessionAuth = null;
  }

  function getRole() {
    const auth = loadAuth();
    const role = auth && auth.role ? auth.role : "guest";
    return rolePermissions[role] ? role : "guest";
  }

  function getPermissions() {
    return rolePermissions[getRole()] || rolePermissions.guest;
  }

  function updateRoleBar() {
    if (!plannerRoleLabel) {
      return;
    }
    const role = getRole();
    plannerRoleLabel.textContent =
      role.charAt(0).toUpperCase() + role.slice(1);
  }

  function openAuthModal() {
    if (!plannerAuthModal) {
      return;
    }
    plannerAuthError?.classList.add("hidden");
    plannerAuthModal.classList.remove("hidden");
    plannerAuthModal.classList.add("flex");
    plannerPinInput?.focus();
  }

  function closeAuthModal() {
    if (!plannerAuthModal) {
      return;
    }
    plannerAuthModal.classList.add("hidden");
    plannerAuthModal.classList.remove("flex");
  }

  function parseTimeToDate(timeString, now) {
    if (!timeString) {
      return null;
    }
    const [hours, minutes] = timeString.split(":").map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return null;
    }
    const date = new Date(now);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  function formatTimeLabel(date) {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function getTaskRange(task, now) {
    if (task.anytime || !task.time) {
      return null;
    }
    const start = parseTimeToDate(task.time, now);
    if (!start) {
      return null;
    }
    const durationMinutes = task.durationMinutes || 30;
    const end = new Date(start.getTime() + durationMinutes * 60000);
    return { start, end, durationMinutes };
  }

  function getScheduleBadge(task, now) {
    if (task.completed) {
      return { text: "Complete", className: "bg-green-100 text-green-700" };
    }
    if (task.anytime) {
      return { text: "Anytime", className: "bg-slate-100 text-slate-600" };
    }
    const range = getTaskRange(task, now);
    if (!range) {
      return { text: "Scheduled", className: "bg-slate-100 text-slate-600" };
    }
    if (now >= range.start && now < range.end) {
      return { text: "In Progress", className: "bg-amber-100 text-amber-700" };
    }
    if (now > range.end) {
      return { text: "Overdue", className: "bg-rose-100 text-rose-700" };
    }
    return { text: "Upcoming", className: "bg-sky-100 text-sky-700" };
  }

  function getStarsLabel(status) {
    if (status === "approved") {
      return "Stars: Approved";
    }
    if (status === "fix") {
      return "Stars: Fix requested";
    }
    return "Stars: Pending";
  }

  function renderTask(task, now, permissions) {
    const range = getTaskRange(task, now);
    const badge = getScheduleBadge(task, now);
    const timeLabel = task.anytime
      ? "Anytime"
      : range
        ? `${formatTimeLabel(range.start)} · ${range.durationMinutes} min`
        : "Scheduled";
    const starsLabel = getStarsLabel(task.starsStatus);
    const completeLabel = task.completed ? "Mark Incomplete" : "Mark Complete";
    const starsBadgeClass =
      task.starsStatus === "approved"
        ? "bg-emerald-100 text-emerald-700"
        : task.starsStatus === "fix"
          ? "bg-rose-100 text-rose-700"
          : "bg-slate-100 text-slate-600";
    const actionButtons = [];
    if (permissions.canComplete) {
      actionButtons.push(`
        <button
          type="button"
          class="text-sm font-semibold px-3 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-100"
          data-task-id="${task.id}"
          data-task-action="toggle-complete"
        >
          ${completeLabel}
        </button>
      `);
    }
    if (permissions.canApproveStars) {
      actionButtons.push(`
        <button
          type="button"
          class="text-sm font-semibold px-3 py-2 rounded-full border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
          data-task-id="${task.id}"
          data-task-action="approve-stars"
        >
          Approve Stars
        </button>
      `);
    }
    if (permissions.canRequestFix) {
      actionButtons.push(`
        <button
          type="button"
          class="text-sm font-semibold px-3 py-2 rounded-full border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100"
          data-task-id="${task.id}"
          data-task-action="request-fix"
        >
          Request Fix
        </button>
      `);
    }

    return `
      <div class="p-4 border border-slate-100 rounded-xl bg-slate-50">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="font-semibold text-slate-800">${task.title}</p>
            <p class="text-sm text-slate-500">${timeLabel}</p>
          </div>
          <span class="text-xs font-semibold px-2.5 py-1 rounded-full ${badge.className}">
            ${badge.text}
          </span>
        </div>
        <div class="mt-4 flex flex-wrap items-center gap-2">
          ${actionButtons.join("")}
          <span class="text-xs font-semibold px-2.5 py-1 rounded-full ${starsBadgeClass}">
            ${starsLabel}
          </span>
        </div>
      </div>
    `;
  }

  function renderSchedule() {
    const now = new Date();
    const permissions = getPermissions();
    updateRoleBar();
    scheduleTime.textContent = now.toLocaleString([], {
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
    });

    const scheduledTasks = taskState
      .filter((task) => !task.anytime)
      .sort((a, b) => {
        const aDate = parseTimeToDate(a.time, now) || now;
        const bDate = parseTimeToDate(b.time, now) || now;
        return aDate - bDate;
      });

    const anytimeTasks = taskState.filter((task) => task.anytime);

    scheduleList.innerHTML = "";
    scheduledTasks.forEach((task) => {
      scheduleList.insertAdjacentHTML(
        "beforeend",
        renderTask(task, now, permissions)
      );
    });

    if (anytimeTasks.length > 0) {
      scheduleList.insertAdjacentHTML(
        "beforeend",
        `<div class="pt-2 text-sm font-semibold text-slate-500 uppercase tracking-wide">Anytime Tasks</div>`
      );
      anytimeTasks.forEach((task) => {
        scheduleList.insertAdjacentHTML(
          "beforeend",
          renderTask(task, now, permissions)
        );
      });
    }

    const unfinishedTasks = taskState.filter((task) => {
      if (task.completed) {
        return false;
      }
      if (task.anytime) {
        return true;
      }
      const range = getTaskRange(task, now);
      return range ? range.start <= now : false;
    });

    unfinishedList.innerHTML = "";
    unfinishedTasks.forEach((task) => {
      unfinishedList.insertAdjacentHTML(
        "beforeend",
        renderTask(task, now, permissions)
      );
    });

    unfinishedCount.textContent =
      unfinishedTasks.length === 1
        ? "1 item"
        : `${unfinishedTasks.length} items`;
  }

  document.addEventListener("click", (event) => {
    const actionTarget = event.target.closest("[data-task-action]");
    if (!actionTarget) {
      return;
    }
    const taskId = actionTarget.getAttribute("data-task-id");
    const action = actionTarget.getAttribute("data-task-action");
    const task = taskState.find((item) => item.id === taskId);
    if (!task) {
      return;
    }
    const permissions = getPermissions();
    if (
      (action === "toggle-complete" && !permissions.canComplete) ||
      (action === "approve-stars" && !permissions.canApproveStars) ||
      (action === "request-fix" && !permissions.canRequestFix)
    ) {
      openAuthModal();
      return;
    }
    if (action === "toggle-complete") {
      task.completed = !task.completed;
    }
    if (action === "approve-stars") {
      task.starsStatus = "approved";
    }
    if (action === "request-fix") {
      task.starsStatus = "fix";
    }
    saveTaskOverrides(taskState);
    renderSchedule();
  });

  if (plannerRoleSwitch) {
    plannerRoleSwitch.addEventListener("click", () => {
      openAuthModal();
    });
  }

  if (plannerAuthForm) {
    plannerAuthForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const role = plannerRoleSelect ? plannerRoleSelect.value : "guest";
      const pin = plannerPinInput ? plannerPinInput.value.trim() : "";
      if (!pin || !rolePermissions[role]) {
        plannerAuthError?.classList.remove("hidden");
        return;
      }
      saveAuth({ role, pin }, plannerRememberInput?.checked !== false);
      plannerAuthError?.classList.add("hidden");
      closeAuthModal();
      renderSchedule();
    });
  }

  if (plannerAuthModal) {
    plannerAuthModal.addEventListener("click", (event) => {
      if (event.target === plannerAuthModal) {
        closeAuthModal();
      }
    });
  }

  async function initSchedule() {
    let tasks = [];
    try {
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      const response = await fetch(
        `${API_BASE}/tasks?plannerId=${encodeURIComponent(
          plannerId
        )}&date=${encodeURIComponent(today)}`,
        { cache: "no-store" }
      );
      if (response.ok) {
        const payload = await response.json();
        tasks = normalizeTasks(payload.tasks);
      }
    } catch (error) {
      tasks = [];
    }

    if (tasks.length === 0) {
      tasks = normalizeTasks(fallbackTasks);
    }

    await loadTaskOverrides();
    taskState = applyTaskOverrides(tasks);
    renderSchedule();
    setInterval(renderSchedule, 60000);
  }

  initSchedule();
})();
