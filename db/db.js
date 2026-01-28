import { neon } from '@neondatabase/serverless';

export function createDb(env) {
  const sql = neon(env.DATABASE_URL, { fetch: env.fetch });

  async function query(text, params = []) {
    return sql.unsafe(text, params);
  }

  async function withTransaction(fn) {
    // Explicit transaction ensures sync batches are all-or-nothing.
    await query('BEGIN');
    try {
      const result = await fn({ query });
      await query('COMMIT');
      return result;
    } catch (err) {
      await query('ROLLBACK');
      throw err;
    }
  }

  return { query, withTransaction };
}
