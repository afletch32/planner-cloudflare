# R2 Assets Worker

This worker serves static assets out of an R2 bucket.

## Setup

1) Create the bucket (name must match wrangler.toml):

```
wrangler r2 bucket create planner-cloudflare-assets
```

2) Deploy the worker:

```
wrangler deploy -c workers/assets/wrangler.toml
```

3) Upload assets (example):

```
wrangler r2 object put planner-cloudflare-assets/assets/crk/super-epic-cookie-lobby.webp --file public/assets/crk/super-epic-cookie-lobby.webp
```

Repeat for the remaining assets, preserving their paths.

4) Use the worker URL (or bind a custom domain):

```
https://planner-cloudflare-assets.<your-workers-subdomain>.workers.dev/assets/... 
```

If you want a custom domain, create a route in Cloudflare for the worker.
