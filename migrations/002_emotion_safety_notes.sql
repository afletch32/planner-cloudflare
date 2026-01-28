CREATE TABLE IF NOT EXISTS emotion_checkins (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  mood TEXT NOT NULL,
  body_state TEXT NULL,
  reason TEXT NULL,
  note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS emotion_checkins_user_idx ON emotion_checkins (user_id);
CREATE INDEX IF NOT EXISTS emotion_checkins_user_created_idx ON emotion_checkins (user_id, created_at);

CREATE TABLE IF NOT EXISTS emotion_badges (
  user_id TEXT NOT NULL,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS emotion_badges_user_idx ON emotion_badges (user_id);

CREATE TABLE IF NOT EXISTS safety_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  created_by TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS safety_notes_user_idx ON safety_notes (user_id);
CREATE INDEX IF NOT EXISTS safety_notes_resolved_idx ON safety_notes (user_id, resolved);
