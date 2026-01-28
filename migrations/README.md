# Migrations

Apply:
```
psql "$DATABASE_URL" -f 001_init.sql
```

## Transaction rollback smoke check (manual)
Purpose: confirm a failed statement inside a transaction prevents any partial writes.

Steps:
```
psql "$DATABASE_URL" <<'SQL'
BEGIN;
INSERT INTO tasks (task_id, household_id, title, assigned_to, duration, status, created_by, locked, "order")
VALUES ('00000000-0000-0000-0000-000000000001', 'test-house', 'Rollback Test', 'Avery', 5, 'pending', 'parent', false, 0);
-- Force failure (invalid duration)
INSERT INTO tasks (task_id, household_id, title, assigned_to, duration, status, created_by, locked, "order")
VALUES ('00000000-0000-0000-0000-000000000002', 'test-house', 'Should Fail', 'Avery', 0, 'pending', 'parent', false, 0);
COMMIT;
SQL

psql "$DATABASE_URL" -c "SELECT count(*) FROM tasks WHERE household_id='test-house';"
```

Expected outcome:
- The second INSERT fails due to the duration constraint.
- The final count is `0`.

Why this confirms atomicity:
- The first INSERT would have created a row if the transaction partially committed.
- A zero count proves the entire transaction rolled back.
