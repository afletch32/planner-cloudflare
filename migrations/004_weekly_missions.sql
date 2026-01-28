CREATE TABLE IF NOT EXISTS weekly_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  week_start DATE NOT NULL,
  mission_id TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, week_start, mission_id)
);

CREATE INDEX IF NOT EXISTS weekly_missions_user_week_idx ON weekly_missions (user_id, week_start);
