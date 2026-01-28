function rowToSafetyNote(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    createdBy: row.created_by,
    note: row.note,
    createdAt: row.created_at ? row.created_at.toISOString() : null,
    resolved: row.resolved
  };
}

export class SafetyNoteStore {
  constructor(db) {
    this.db = db;
  }

  async create(note) {
    const res = await this.db.query(
      `INSERT INTO safety_notes (
        id, user_id, created_by, note, created_at, resolved
      ) VALUES (
        $1,$2,$3,$4, NOW(), $5
      ) RETURNING *`,
      [
        note.id,
        note.userId,
        note.createdBy,
        note.note,
        note.resolved
      ]
    );
    if (!res.rows.length) return null;
    return rowToSafetyNote(res.rows[0]);
  }

  async listByUserId(userId) {
    const res = await this.db.query(
      'SELECT * FROM safety_notes WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return res.rows.map(row => rowToSafetyNote(row));
  }

  async updateResolved(id, resolved) {
    const res = await this.db.query(
      'UPDATE safety_notes SET resolved = $2 WHERE id = $1 RETURNING *',
      [id, resolved]
    );
    if (!res.rows.length) return null;
    return rowToSafetyNote(res.rows[0]);
  }
}
