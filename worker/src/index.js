// Reading Room sync relay — opaque blob store keyed by room ID.
// Devices encrypt locally; this Worker never sees plaintext.
//
// Routes:
//   GET  /room/:id        → { version, blob } | 404
//   PUT  /room/:id        → { version }       (body: { blob, ifVersion? })
//
// Conflict policy: optimistic concurrency via ifVersion. Clients merge on conflict.

const TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days idle expiry
const MAX_BLOB_BYTES = 512 * 1024;     // 512 KB ceiling per room

const cors = (origin) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Max-Age': '86400',
});

const json = (body, status, headers) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });

const validRoomId = (id) => typeof id === 'string' && /^[A-Za-z0-9_-]{16,64}$/.test(id);

export default {
  async fetch(request, env) {
    const origin = env.ALLOWED_ORIGIN || '*';
    const corsHeaders = cors(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const match = url.pathname.match(/^\/room\/([^/]+)$/);
    if (!match) return json({ error: 'not found' }, 404, corsHeaders);

    const roomId = match[1];
    if (!validRoomId(roomId)) return json({ error: 'invalid room id' }, 400, corsHeaders);

    if (request.method === 'GET') {
      const stored = await env.ROOMS.get(roomId, { type: 'json' });
      if (!stored) return json({ error: 'not found' }, 404, corsHeaders);
      return json(stored, 200, corsHeaders);
    }

    if (request.method === 'PUT') {
      let payload;
      try { payload = await request.json(); }
      catch { return json({ error: 'invalid json' }, 400, corsHeaders); }

      const { blob, ifVersion } = payload || {};
      if (typeof blob !== 'string' || blob.length === 0) {
        return json({ error: 'blob required' }, 400, corsHeaders);
      }
      if (blob.length > MAX_BLOB_BYTES) {
        return json({ error: 'blob too large' }, 413, corsHeaders);
      }

      const existing = await env.ROOMS.get(roomId, { type: 'json' });
      const currentVersion = existing?.version || 0;

      if (ifVersion != null && ifVersion !== currentVersion) {
        return json(
          { error: 'version mismatch', version: currentVersion, blob: existing?.blob },
          409,
          corsHeaders,
        );
      }

      const next = { version: currentVersion + 1, blob, updatedAt: Date.now() };
      await env.ROOMS.put(roomId, JSON.stringify(next), { expirationTtl: TTL_SECONDS });
      return json({ version: next.version }, 200, corsHeaders);
    }

    return json({ error: 'method not allowed' }, 405, corsHeaders);
  },
};
