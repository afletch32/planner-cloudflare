# Shared Task Engine Backend

## Runtime
- Cloudflare Workers
- Postgres (serverless)

## Invariants (enforced centrally)
- All validation is server-side only.
- Frontends never mutate task rules.
- Duration is minutes only; never inferred.
- `startMinutes` must be null or 15-minute increments.
- Manual ordering only: `order` is authoritative.
- Google changes are stored as pending and require explicit accept/ignore.

## Auth
- HMAC JWT (`Authorization: Bearer <token>`)
- Payload must include: `sub`, `role`, `householdId`.

## Endpoints
- `GET /tasks?householdId=&assignedTo=&date=`
- `POST /task`
- `PATCH /task/:id`
- `POST /sync`
- `POST /google/push`
- `GET /google/pull`
- `POST /google/accept`
- `POST /google/ignore`
- `GET /health`

## Database Schema (Postgres)
```sql
CREATE TABLE tasks (
  task_id UUID PRIMARY KEY,
  household_id TEXT NOT NULL,
  title TEXT NOT NULL,
  assigned_to TEXT NOT NULL,
  duration INT NOT NULL,
  date DATE NULL,
  start_minutes INT NULL,
  status TEXT NOT NULL,
  category TEXT NULL,
  contexts JSONB NOT NULL DEFAULT '[]',
  created_by TEXT NOT NULL,
  locked BOOLEAN NOT NULL DEFAULT FALSE,
  "order" INT NOT NULL DEFAULT 0,
  google JSONB NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX tasks_household_idx ON tasks (household_id);
CREATE INDEX tasks_household_date_idx ON tasks (household_id, date);
CREATE INDEX tasks_assigned_idx ON tasks (assigned_to);

CREATE TABLE sync_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE google_tokens (
  household_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  tokens JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (household_id, user_id)
);
```

## Notes
- `/sync` rejects partial success: one invalid op fails the entire transaction.
- `/google/push` stores pendingChange only; no auto-apply.
- On validation failure, the API returns the authoritative state.
