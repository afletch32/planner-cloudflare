CREATE TABLE IF NOT EXISTS school_checkins (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL,
  note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS school_checkins_user_idx ON school_checkins (user_id);
CREATE INDEX IF NOT EXISTS school_checkins_user_created_idx ON school_checkins (user_id, created_at);
