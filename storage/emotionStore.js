function rowToCheckin(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    mood: row.mood,
    bodyState: row.body_state,
    reason: row.reason,
    note: row.note,
    createdAt: row.created_at ? row.created_at.toISOString() : null
  };
}

function rowToBadge(row) {
  if (!row) return null;
  return {
    badge_id: row.badge_id,
    earned_at: row.earned_at ? row.earned_at.toISOString() : null
  };
}

export class EmotionStore {
  constructor(db) {
    this.db = db;
  }

  async createCheckin(checkin) {
    const res = await this.db.query(
      `INSERT INTO emotion_checkins (
        id, user_id, mood, body_state, reason, note, created_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6, NOW()
      ) RETURNING *`,
      [
        checkin.id,
        checkin.userId,
        checkin.mood,
        checkin.bodyState,
        checkin.reason,
        checkin.note
      ]
    );
    if (!res.rows.length) return null;
    return rowToCheckin(res.rows[0]);
  }

  async countCheckins(userId) {
    const res = await this.db.query(
      'SELECT COUNT(*)::int AS total FROM emotion_checkins WHERE user_id = $1',
      [userId]
    );
    return res.rows[0]?.total || 0;
  }

  async listDistinctLocalDates(userId, timeZone) {
    const res = await this.db.query(
      `SELECT DISTINCT to_char(date(timezone($2, created_at)), 'YYYY-MM-DD') AS local_date
       FROM emotion_checkins
       WHERE user_id = $1
       ORDER BY local_date ASC`,
      [userId, timeZone]
    );
    return res.rows.map(row => row.local_date);
  }

  async getPreviousLocalDate(userId, timeZone, beforeDate) {
    const res = await this.db.query(
      `SELECT to_char(MAX(date(timezone($2, created_at))), 'YYYY-MM-DD') AS local_date
       FROM emotion_checkins
       WHERE user_id = $1 AND date(timezone($2, created_at)) < $3::date`,
      [userId, timeZone, beforeDate]
    );
    return res.rows[0]?.local_date || null;
  }

  async listBadges(userId) {
    const res = await this.db.query(
      'SELECT badge_id, earned_at FROM emotion_badges WHERE user_id = $1 ORDER BY earned_at ASC',
      [userId]
    );
    return res.rows.map(row => rowToBadge(row));
  }

  async awardBadges(userId, badgeIds) {
    if (!Array.isArray(badgeIds) || badgeIds.length === 0) return [];
    const res = await this.db.query(
      `INSERT INTO emotion_badges (user_id, badge_id, earned_at)
       SELECT $1, badge_id, NOW() FROM UNNEST($2::text[]) AS badge_id
       ON CONFLICT (user_id, badge_id) DO NOTHING
       RETURNING badge_id, earned_at`,
      [userId, badgeIds]
    );
    return res.rows.map(row => rowToBadge(row));
  }

  async getRegulationToolCount(userId) {
    const res = await this.db.query(
      'SELECT COUNT(*)::int AS total FROM regulation_tool_uses WHERE user_id = $1',
      [userId]
    );
    return res.rows[0]?.total || 0;
  }
}
