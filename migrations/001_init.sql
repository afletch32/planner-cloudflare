CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS tasks (
  task_id UUID PRIMARY KEY,
  household_id TEXT NOT NULL,
  title TEXT NOT NULL,
  assigned_to TEXT NOT NULL CHECK (assigned_to IN ('Ashley', 'Avery', 'Family')),
  duration INT NOT NULL CHECK (duration > 0),
  date DATE NULL,
  start_minutes INT NULL CHECK (
    start_minutes IS NULL OR
    (start_minutes >= 0 AND start_minutes <= 1435 AND start_minutes % 15 = 0)
  ),
  status TEXT NOT NULL CHECK (status IN ('pending', 'done', 'skipped')),
  category TEXT NULL,
  contexts JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by TEXT NOT NULL CHECK (created_by IN ('parent', 'child')),
  locked BOOLEAN NOT NULL DEFAULT FALSE,
  "order" INT NOT NULL DEFAULT 0,
  google JSONB NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tasks_household_idx ON tasks (household_id);
CREATE INDEX IF NOT EXISTS tasks_household_date_idx ON tasks (household_id, date);

CREATE TABLE IF NOT EXISTS sync_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS google_tokens (
  household_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  tokens JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (household_id, user_id)
);
