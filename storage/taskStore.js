function parseMaybeJson(value, fallback) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value;
}

function rowToTask(row) {
  if (!row) return null;
  return {
    taskId: row.task_id,
    householdId: row.household_id,
    title: row.title,
    assignedTo: row.assigned_to,
    duration: row.duration,
    date: row.date ? row.date.toISOString().slice(0, 10) : null,
    startMinutes: row.start_minutes,
    status: row.status,
    category: row.category,
    contexts: parseMaybeJson(row.contexts, []),
    createdBy: row.created_by,
    locked: row.locked,
    order: row.order,
    google: parseMaybeJson(row.google, { eventId: null, calendarId: null, syncMode: 'off', pendingChange: null }),
    updatedAt: row.updated_at ? row.updated_at.toISOString() : null
  };
}

export class TaskStore {
  constructor(db) {
    this.db = db;
  }

  async get(taskId) {
    const res = await this.db.query(
      'SELECT * FROM tasks WHERE task_id = $1',
      [taskId]
    );
    if (!res.rows.length) return null;
    return rowToTask(res.rows[0]);
  }

  async list({ householdId, assignedTo, date }) {
    const clauses = [];
    const values = [];
    let i = 1;
    if (householdId) {
      clauses.push(`household_id = $${i++}`);
      values.push(householdId);
    }
    if (assignedTo) {
      clauses.push(`assigned_to = $${i++}`);
      values.push(assignedTo);
    }
    if (date) {
      clauses.push(`date = $${i++}`);
      values.push(date);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const res = await this.db.query(
      `SELECT * FROM tasks ${where} ORDER BY date NULLS LAST, start_minutes NULLS LAST, "order" ASC`,
      values
    );
    return res.rows.map(row => rowToTask(row));
  }

  async listPendingGoogle(householdId) {
    const res = await this.db.query(
      `SELECT * FROM tasks WHERE household_id = $1 AND google -> 'pendingChange' IS NOT NULL`,
      [householdId]
    );
    return res.rows.map(row => rowToTask(row));
  }

  async upsert(task) {
    const res = await this.db.query(
      `INSERT INTO tasks (
        task_id, household_id, title, assigned_to, duration, date, start_minutes,
        status, category, contexts, created_by, locked, "order", google, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, NOW()
      )
      ON CONFLICT (task_id) DO UPDATE SET
        household_id = EXCLUDED.household_id,
        title = EXCLUDED.title,
        assigned_to = EXCLUDED.assigned_to,
        duration = EXCLUDED.duration,
        date = EXCLUDED.date,
        start_minutes = EXCLUDED.start_minutes,
        status = EXCLUDED.status,
        category = EXCLUDED.category,
        contexts = EXCLUDED.contexts,
        created_by = EXCLUDED.created_by,
        locked = EXCLUDED.locked,
        "order" = EXCLUDED."order",
        google = EXCLUDED.google,
        updated_at = NOW()
      RETURNING *`,
      [
        task.taskId,
        task.householdId,
        task.title,
        task.assignedTo,
        task.duration,
        task.date,
        task.startMinutes,
        task.status,
        task.category,
        JSON.stringify(task.contexts || []),
        task.createdBy,
        task.locked,
        task.order,
        JSON.stringify(task.google || null)
      ]
    );
    return rowToTask(res.rows[0]);
  }

  async update(taskId, patch) {
    const fields = [];
    const values = [];
    let i = 1;
    const set = (col, val) => {
      fields.push(`${col} = $${i++}`);
      values.push(val);
    };

    if ('title' in patch) set('title', patch.title);
    if ('assignedTo' in patch) set('assigned_to', patch.assignedTo);
    if ('duration' in patch) set('duration', patch.duration);
    if ('date' in patch) set('date', patch.date);
    if ('startMinutes' in patch) set('start_minutes', patch.startMinutes);
    if ('status' in patch) set('status', patch.status);
    if ('category' in patch) set('category', patch.category);
    if ('contexts' in patch) set('contexts', JSON.stringify(patch.contexts || []));
    if ('createdBy' in patch) set('created_by', patch.createdBy);
    if ('locked' in patch) set('locked', patch.locked);
    if ('order' in patch) set('"order"', patch.order);
    if ('google' in patch) set('google', JSON.stringify(patch.google || null));

    fields.push('updated_at = NOW()');

    values.push(taskId);
    const res = await this.db.query(
      `UPDATE tasks SET ${fields.join(', ')} WHERE task_id = $${i} RETURNING *`,
      values
    );
    if (!res.rows.length) return null;
    return rowToTask(res.rows[0]);
  }
}
