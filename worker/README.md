# Reading Room Sync Worker

Tiny Cloudflare Worker that stores opaque encrypted blobs keyed by room ID. The
client encrypts state locally; this Worker never sees plaintext, has no users,
no accounts, no API keys.

## One-time deploy

```bash
npm install -g wrangler
wrangler login
wrangler kv:namespace create ROOMS
# copy the printed `id` into wrangler.toml (replace REPLACE_WITH_KV_NAMESPACE_ID)
wrangler deploy
```

Wrangler prints a URL like `https://reading-room-sync.<you>.workers.dev`. Put
that into the app via `VITE_SYNC_URL` at build time (or paste it once in the
Tweaks panel — it's stored locally).

## Endpoints

- `GET /room/:id` → `{ version, blob }` or 404
- `PUT /room/:id` → body `{ blob, ifVersion? }` → `{ version }` or 409 on conflict

Rooms expire after 90 days of no writes. Blob ceiling: 512 KB.
