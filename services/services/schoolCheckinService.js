import { validateSchoolCheckin } from '../validation/validateSchoolCheckin.js';
import { formatLocalDate, parseIsoDateToUtcMidnight } from '../utils/time.js';

function resolveTimeZone(actor) {
  const candidate = actor?.timeZone || actor?.timezone || 'UTC';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: candidate }).format(new Date());
    return candidate;
  } catch {
    return 'UTC';
  }
}

function computeStreaks(localDates) {
  if (!Array.isArray(localDates) || localDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }
  let longest = 1;
  let current = 1;
  let lastDay = parseIsoDateToUtcMidnight(localDates[0]);

  for (let i = 1; i < localDates.length; i++) {
    const day = parseIsoDateToUtcMidnight(localDates[i]);
    if (day - lastDay === 86400000) {
      current += 1;
    } else {
      current = 1;
    }
    if (current > longest) longest = current;
    lastDay = day;
  }

  return { currentStreak: current, longestStreak: longest };
}

export class SchoolCheckinService {
  constructor(schoolCheckinStore) {
    this.schoolCheckinStore = schoolCheckinStore;
  }

  async recordCheckin(payload, actor) {
    const normalized = {
      status: payload?.status,
      note: payload?.note ?? null
    };
    validateSchoolCheckin(normalized);
    const checkin = {
      id: crypto.randomUUID(),
      userId: actor.userId,
      status: normalized.status,
      note: normalized.note
    };
    return this.schoolCheckinStore.createCheckin(checkin);
  }

  async getStatus(actor) {
    const timeZone = resolveTimeZone(actor);
    const localDates = await this.schoolCheckinStore.listDistinctLocalDates(actor.userId, timeZone);
    const today = formatLocalDate(new Date(), timeZone);
    const dateSet = new Set(localDates);
    const { currentStreak, longestStreak } = computeStreaks(localDates);

    return {
      checkedInToday: dateSet.has(today),
      currentStreak,
      longestStreak
    };
  }
}
