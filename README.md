# planner-cloudflare

Cookie Kingdom-themed family planner deployed on Cloudflare.

This project includes:
- A static frontend in `public/` (schedule, chores, rewards, missions, gacha-style collection UI)
- A Cloudflare Worker API in `services/` for tasks, state, habits, sync, emotion logs, school check-ins, and Google route hooks
- SQL migrations in `migrations/` and Neon Postgres access via `@neondatabase/serverless`

## Repo Structure

- `public/`: Pages frontend assets (`index.html`, scripts, PWA files, data)
- `services/`: Worker API entrypoint and route/service layers
- `db/`: DB client wiring
- `storage/`: DB store classes used by API routes
- `migrations/`: SQL migration files
- `scripts/migrate.mjs`: migration runner for Neon
- `wrangler.pages.toml`: Cloudflare Pages config (build output: `public`)
- `wrangler.worker.toml`: Cloudflare Worker API config (`services/index.js`)
- `workers/assets/`: asset worker setup and related docs

## Prerequisites

- Node.js 18+ (20+ recommended)
- npm
- Wrangler CLI (for Cloudflare deploy/dev)
- Neon Postgres database URL

## Install

```bash
npm install
```

## Environment / Secrets

Worker environment values used by `services/env.js`:

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_ISSUER`
- `AUTH_AUDIENCE`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `GOOGLE_WEBHOOK_SECRET`

Set them in your Worker environment (via Wrangler secrets/vars).

## Database Migrations

Run all SQL files in `migrations/` against Neon:

```bash
DATABASE_URL="postgres://..." npm run migrate
```

## Local Development

Frontend (static):
- Serve `public/` with any static server (for example, your editor live server).

Worker API:
- Run with Wrangler using `wrangler.worker.toml` and your local secrets/vars.

When running together, frontend calls `window.PLANNER_API_BASE || "/api"` by default.

## Deployment

Cloudflare Pages:
- Configured by `wrangler.pages.toml`
- Build output directory: `public`

Cloudflare Worker API:
- Configured by `wrangler.worker.toml`
- Entrypoint: `services/index.js`
- Route target: `planner-cloudflare.pages.dev/api/*`

## Package Metadata

Package name: `planner-cloudflare`  
Repository: https://github.com/afletch32/planner-cloudflare
