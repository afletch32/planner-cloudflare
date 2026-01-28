import { validateEmotionCheckin } from '../validation/validateEmotionCheckin.js';
import { formatLocalDate, parseIsoDateToUtcMidnight } from '../utils/time.js';

const BADGE_RULES = [
  { id: 'steady', minStreak: 3 },
  { id: 'momentum', minStreak: 7 },
  { id: 'consistent', minStreak: 14 }
];

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

function computeDayDiff(a, b) {
  return Math.round((parseIsoDateToUtcMidnight(a) - parseIsoDateToUtcMidnight(b)) / 86400000);
}

export class EmotionService {
  constructor(emotionStore, db) {
    this.emotionStore = emotionStore;
    this.db = db;
  }

  async recordCheckin(payload, actor) {
    const normalized = {
      mood: payload?.mood,
      bodyState: payload?.bodyState ?? payload?.body_state ?? null,
      reason: payload?.reason ?? null,
      note: payload?.note ?? null
    };
    validateEmotionCheckin(normalized);
    const checkin = {
      id: crypto.randomUUID(),
      userId: actor.userId,
      mood: normalized.mood,
      bodyState: normalized.bodyState,
      reason: normalized.reason,
      note: normalized.note
    };

    const timeZone = resolveTimeZone(actor);

    return this.db.withTransaction(async () => {
      const saved = await this.emotionStore.createCheckin(checkin);
      const badges = await this.evaluateBadges(actor.userId, timeZone);
      await this.emotionStore.awardBadges(actor.userId, badges);
      return saved;
    });
  }

  async getStatus(actor) {
    const timeZone = resolveTimeZone(actor);
    const localDates = await this.emotionStore.listDistinctLocalDates(actor.userId, timeZone);
    const today = formatLocalDate(new Date(), timeZone);
    const dateSet = new Set(localDates);
    const { currentStreak, longestStreak } = computeStreaks(localDates);

    return {
      checkedInToday: dateSet.has(today),
      currentStreak,
      longestStreak
    };
  }

  async listBadges(actor) {
    return this.emotionStore.listBadges(actor.userId);
  }

  async evaluateBadges(userId, timeZone) {
    const badges = [];
    const total = await this.emotionStore.countCheckins(userId);
    if (total === 1) badges.push('first_checkin');

    const localDates = await this.emotionStore.listDistinctLocalDates(userId, timeZone);
    const { currentStreak } = computeStreaks(localDates);

    for (const rule of BADGE_RULES) {
      if (currentStreak >= rule.minStreak) {
        badges.push(rule.id);
      }
    }

    const today = formatLocalDate(new Date(), timeZone);
    const previous = await this.emotionStore.getPreviousLocalDate(userId, timeZone, today);
    if (previous && computeDayDiff(today, previous) >= 2) {
      badges.push('resilient');
    }

    const toolCount = await this.emotionStore.getRegulationToolCount(userId);
    if (toolCount >= 5) {
      badges.push('grounded');
    }

    return badges;
  }
}
