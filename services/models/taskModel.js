import { nowIso } from '../utils/time.js';

export const TASK_STATUSES = ['pending', 'done', 'skipped'];
export const ASSIGNEES = ['Ashley', 'Avery', 'Family'];
export const CATEGORIES = ['must', 'admin', 'cleaning', 'family', 'personal'];
export const CONTEXTS = ['parent', 'family', 'kid'];

export function buildTaskDefaults() {
  return {
    status: 'pending',
    date: null,
    startMinutes: null,
    order: 0,
    locked: false,
    google: {
      eventId: null,
      calendarId: null,
      syncMode: 'off',
      pendingChange: null
    },
    updatedAt: nowIso()
  };
}

export function normalizeTask(input) {
  const defaults = buildTaskDefaults();
  const merged = {
    ...defaults,
    ...input,
    google: {
      ...defaults.google,
      ...(input.google || {})
    }
  };
  return merged;
}
