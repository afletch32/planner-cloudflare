export class SyncStore {
  constructor(db) {
    this.db = db;
  }

  async recordSync(householdId, userId, payload) {
    await this.db.query(
      'INSERT INTO sync_events (household_id, user_id, payload, created_at) VALUES ($1,$2,$3, NOW())',
      [householdId, userId, JSON.stringify(payload)]
    );
  }
}
