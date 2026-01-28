function rowToMission(row) {
  if (!row) return null;
  return {
    missionId: row.mission_id,
    completed: row.completed,
    completedAt: row.completed_at ? row.completed_at.toISOString() : null
  };
}

export class WeeklyMissionStore {
  constructor(db) {
    this.db = db;
  }

  async ensureMissions(userId, weekStart, missionIds) {
    if (!Array.isArray(missionIds) || missionIds.length === 0) return;
    await this.db.query(
      `INSERT INTO weekly_missions (user_id, week_start, mission_id, created_at)
       SELECT $1, $2::date, mission_id, NOW()
       FROM UNNEST($3::text[]) AS mission_id
       ON CONFLICT (user_id, week_start, mission_id) DO NOTHING`,
      [userId, weekStart, missionIds]
    );
  }

  async listByWeek(userId, weekStart) {
    const res = await this.db.query(
      `SELECT mission_id, completed, completed_at
       FROM weekly_missions
       WHERE user_id = $1 AND week_start = $2::date
       ORDER BY mission_id ASC`,
      [userId, weekStart]
    );
    return res.rows.map(row => rowToMission(row));
  }

  async markCompleted(userId, weekStart, missionId) {
    const res = await this.db.query(
      `UPDATE weekly_missions
       SET completed = TRUE, completed_at = COALESCE(completed_at, NOW())
       WHERE user_id = $1 AND week_start = $2::date AND mission_id = $3 AND completed = FALSE
       RETURNING mission_id, completed, completed_at`,
      [userId, weekStart, missionId]
    );
    if (!res.rows.length) return null;
    return rowToMission(res.rows[0]);
  }

  async getWeeklyPresenceCount(userId, timeZone, weekStart, weekEnd) {
    const res = await this.db.query(
      `SELECT COUNT(*)::int AS total FROM (
         SELECT DISTINCT date(timezone($2, created_at)) AS local_date
         FROM school_checkins
         WHERE user_id = $1
           AND date(timezone($2, created_at)) BETWEEN $3::date AND $4::date
       ) t`,
      [userId, timeZone, weekStart, weekEnd]
    );
    return res.rows[0]?.total || 0;
  }

  async getWeeklyEmotionDays(userId, timeZone, weekStart, weekEnd) {
    const res = await this.db.query(
      `SELECT COUNT(*)::int AS total FROM (
         SELECT DISTINCT date(timezone($2, created_at)) AS local_date
         FROM emotion_checkins
         WHERE user_id = $1
           AND date(timezone($2, created_at)) BETWEEN $3::date AND $4::date
       ) t`,
      [userId, timeZone, weekStart, weekEnd]
    );
    return res.rows[0]?.total || 0;
  }

  async getWeeklySessionStats(userId, timeZone, weekStart, weekEnd) {
    const res = await this.db.query(
      `SELECT
         COUNT(*) FILTER (WHERE duration_minutes >= 30)::int AS sessions_30,
         COUNT(*) FILTER (WHERE duration_minutes >= 45)::int AS sessions_45
       FROM school_sessions
       WHERE user_id = $1
         AND date(timezone($2, started_at)) BETWEEN $3::date AND $4::date`,
      [userId, timeZone, weekStart, weekEnd]
    );
    return {
      sessions30: res.rows[0]?.sessions_30 || 0,
      sessions45: res.rows[0]?.sessions_45 || 0
    };
  }
}
