export class GoogleStore {
  constructor(db) {
    this.db = db;
  }

  async saveTokens(householdId, userId, tokens) {
    await this.db.query(
      `INSERT INTO google_tokens (household_id, user_id, tokens, updated_at)
       VALUES ($1,$2,$3, NOW())
       ON CONFLICT (household_id, user_id) DO UPDATE SET tokens = EXCLUDED.tokens, updated_at = NOW()`,
      [householdId, userId, JSON.stringify(tokens)]
    );
  }

  async getTokens(householdId, userId) {
    const res = await this.db.query(
      'SELECT tokens FROM google_tokens WHERE household_id = $1 AND user_id = $2',
      [householdId, userId]
    );
    if (!res.rows.length) return null;
    return JSON.parse(res.rows[0].tokens);
  }
}
