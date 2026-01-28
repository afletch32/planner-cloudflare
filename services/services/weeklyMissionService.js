import { formatLocalDate, parseIsoDateToUtcMidnight } from '../utils/time.js';

const WEEKLY_MISSIONS = [
  { id: 'show_up_4_days', kind: 'presence_days', min: 4 },
  { id: 'focus_3_sessions', kind: 'sessions_30', min: 3 },
  { id: 'one_deep_focus', kind: 'sessions_45', min: 1 },
  { id: 'check_in_feelings_3', kind: 'emotion_days', min: 3 }
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

function getWeekStart(localDate, timeZone) {
  const [year, month, day] = localDate.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = utcDate.getUTCDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  return addDaysIso(localDate, -daysSinceMonday, timeZone);
}

function addDaysIso(isoDate, days) {
  const next = parseIsoDateToUtcMidnight(isoDate) + days * 86400000;
  return new Date(next).toISOString().slice(0, 10);
}

function evaluateMission(definition, stats) {
  if (definition.kind === 'presence_days') return stats.presenceDays >= definition.min;
  if (definition.kind === 'sessions_30') return stats.sessions30 >= definition.min;
  if (definition.kind === 'sessions_45') return stats.sessions45 >= definition.min;
  if (definition.kind === 'emotion_days') return stats.emotionDays >= definition.min;
  return false;
}

export class WeeklyMissionService {
  constructor(weeklyMissionStore, db) {
    this.weeklyMissionStore = weeklyMissionStore;
    this.db = db;
  }

  async getWeeklyMissions(actor) {
    const timeZone = resolveTimeZone(actor);
    const todayLocal = formatLocalDate(new Date(), timeZone);
    const weekStart = getWeekStart(todayLocal, timeZone);
    const weekEnd = addDaysIso(weekStart, 6);
    const missionIds = WEEKLY_MISSIONS.map(mission => mission.id);

    return this.db.withTransaction(async () => {
      await this.weeklyMissionStore.ensureMissions(actor.userId, weekStart, missionIds);

      const [presenceDays, emotionDays, sessionStats] = await Promise.all([
        this.weeklyMissionStore.getWeeklyPresenceCount(actor.userId, timeZone, weekStart, weekEnd),
        this.weeklyMissionStore.getWeeklyEmotionDays(actor.userId, timeZone, weekStart, weekEnd),
        this.weeklyMissionStore.getWeeklySessionStats(actor.userId, timeZone, weekStart, weekEnd)
      ]);

      const stats = {
        presenceDays,
        emotionDays,
        sessions30: sessionStats.sessions30,
        sessions45: sessionStats.sessions45
      };

      const existing = await this.weeklyMissionStore.listByWeek(actor.userId, weekStart);
      const existingMap = new Map(existing.map(m => [m.missionId, m]));

      for (const mission of WEEKLY_MISSIONS) {
        const completed = evaluateMission(mission, stats);
        const existingMission = existingMap.get(mission.id);
        if (completed && existingMission && !existingMission.completed) {
          await this.weeklyMissionStore.markCompleted(actor.userId, weekStart, mission.id);
        }
      }

      const updated = await this.weeklyMissionStore.listByWeek(actor.userId, weekStart);
      return updated.map(mission => ({
        mission_id: mission.missionId,
        completed: mission.completed,
        completed_at: mission.completedAt
      }));
    });
  }
}
