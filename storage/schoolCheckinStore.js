function rowToCheckin(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    note: row.note,
    createdAt: row.created_at ? row.created_at.toISOString() : null
  };
}

export class SchoolCheckinStore {
  constructor(db) {
    this.db = db;
  }

  async createCheckin(checkin) {
    const res = await this.db.query(
      `INSERT INTO school_checkins (
        id, user_id, status, note, created_at
      ) VALUES (
        $1,$2,$3,$4, NOW()
      ) RETURNING *`,
      [
        checkin.id,
        checkin.userId,
        checkin.status,
        checkin.note
      ]
    );
    if (!res.rows.length) return null;
    return rowToCheckin(res.rows[0]);
  }

  async listDistinctLocalDates(userId, timeZone) {
    const res = await this.db.query(
      `SELECT DISTINCT to_char(date(timezone($2, created_at)), 'YYYY-MM-DD') AS local_date
       FROM school_checkins
       WHERE user_id = $1
       ORDER BY local_date ASC`,
      [userId, timeZone]
    );
    return res.rows.map(row => row.local_date);
  }
}
