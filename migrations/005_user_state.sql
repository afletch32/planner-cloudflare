CREATE TABLE IF NOT EXISTS user_state (
  household_id TEXT NOT NULL,
  person_id TEXT NOT NULL,
  namespace TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (household_id, person_id, namespace, key)
);

CREATE INDEX IF NOT EXISTS user_state_household_idx
  ON user_state (household_id, person_id, namespace);
