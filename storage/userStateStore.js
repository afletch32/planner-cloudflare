export class UserStateStore {
  constructor(db) {
    this.db = db;
  }

  async get({ householdId, personId, namespace, key }) {
    const res = await this.db.query(
      `SELECT value
       FROM user_state
       WHERE household_id = $1
         AND person_id = $2
         AND namespace = $3
         AND key = $4`,
      [householdId, personId, namespace, key]
    );
    return res.rows[0]?.value ?? null;
  }

  async upsert({ householdId, personId, namespace, key, value }) {
    const payload = JSON.stringify(value ?? null);
    const res = await this.db.query(
      `INSERT INTO user_state (household_id, person_id, namespace, key, value, updated_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, NOW())
       ON CONFLICT (household_id, person_id, namespace, key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
       RETURNING key, value, updated_at`,
      [householdId, personId, namespace, key, payload]
    );
    return res.rows[0] || null;
  }

  async list({ householdId, personId, namespace, prefix = '' }) {
    const likeValue = `${prefix}%`;
    const res = await this.db.query(
      `SELECT key, value
       FROM user_state
       WHERE household_id = $1
         AND person_id = $2
         AND namespace = $3
         AND key LIKE $4
       ORDER BY key ASC`,
      [householdId, personId, namespace, likeValue]
    );
    return res.rows || [];
  }
}
