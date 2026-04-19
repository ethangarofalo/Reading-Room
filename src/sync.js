// Client sync: end-to-end encrypted state blob via a relay Worker.
// Room ID + secret key live in localStorage. The Worker never sees plaintext.

const SYNC_CONFIG_KEY = 'reading-dashboard-sync-v1';

const b64u = {
  encode: (bytes) => {
    let bin = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      bin += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  },
  decode: (str) => {
    const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
    const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/') + pad);
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  },
};

const randomBytes = (n) => crypto.getRandomValues(new Uint8Array(n));

export const generateRoom = () => ({
  roomId: b64u.encode(randomBytes(16)),
  secret: b64u.encode(randomBytes(32)),
});

export function loadSyncConfig() {
  try {
    const raw = localStorage.getItem(SYNC_CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveSyncConfig(config) {
  if (config) localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(config));
  else localStorage.removeItem(SYNC_CONFIG_KEY);
}

async function importKey(secretB64u) {
  const raw = b64u.decode(secretB64u);
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function encrypt(secret, plaintext) {
  const key = await importKey(secret);
  const iv = randomBytes(12);
  const data = new TextEncoder().encode(plaintext);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data));
  const combined = new Uint8Array(iv.length + ct.length);
  combined.set(iv, 0);
  combined.set(ct, iv.length);
  return b64u.encode(combined);
}

async function decrypt(secret, blob) {
  const combined = b64u.decode(blob);
  const iv = combined.slice(0, 12);
  const ct = combined.slice(12);
  const key = await importKey(secret);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return new TextDecoder().decode(pt);
}

export function encodePairingPayload({ relayUrl, roomId, secret }) {
  return b64u.encode(new TextEncoder().encode(JSON.stringify({ v: 1, u: relayUrl, r: roomId, s: secret })));
}

export function decodePairingPayload(token) {
  try {
    const json = new TextDecoder().decode(b64u.decode(token));
    const obj = JSON.parse(json);
    if (obj.v !== 1 || !obj.u || !obj.r || !obj.s) return null;
    return { relayUrl: obj.u, roomId: obj.r, secret: obj.s };
  } catch { return null; }
}

const roomUrl = (relayUrl, roomId) => `${relayUrl.replace(/\/$/, '')}/room/${roomId}`;

export async function pullRoom(config) {
  const res = await fetch(roomUrl(config.relayUrl, config.roomId));
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`pull failed: ${res.status}`);
  const { version, blob } = await res.json();
  const plaintext = await decrypt(config.secret, blob);
  return { version, state: JSON.parse(plaintext) };
}

export async function pushRoom(config, state, ifVersion) {
  const blob = await encrypt(config.secret, JSON.stringify(state));
  const res = await fetch(roomUrl(config.relayUrl, config.roomId), {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ blob, ifVersion }),
  });
  if (res.status === 409) {
    const { version, blob: remoteBlob } = await res.json();
    const plaintext = remoteBlob ? await decrypt(config.secret, remoteBlob) : null;
    return { conflict: true, version, state: plaintext ? JSON.parse(plaintext) : null };
  }
  if (!res.ok) throw new Error(`push failed: ${res.status}`);
  const { version } = await res.json();
  return { conflict: false, version };
}

// Merge strategy: union by ID for arrays of objects with `id`; for the rest,
// last-writer-wins per top-level key using updatedAt-ish heuristics.
export function mergeStates(local, remote) {
  if (!remote) return local;
  if (!local) return remote;

  const mergeById = (a = [], b = []) => {
    const map = new Map();
    [...a, ...b].forEach((item) => {
      if (item && item.id != null) map.set(item.id, { ...(map.get(item.id) || {}), ...item });
    });
    return Array.from(map.values());
  };

  const mergeEntries = (a = {}, b = {}) => {
    const out = { ...a };
    Object.keys(b).forEach((k) => {
      const seen = new Set();
      const list = [...(a[k] || []), ...(b[k] || [])].filter((item) => {
        const key = `${item?.date || ''}|${item?.text || item?.quote || ''}|${item?.pages || ''}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      out[k] = list;
    });
    return out;
  };

  const mergeSessions = (a = [], b = []) => {
    const seen = new Set();
    return [...a, ...b].filter((s) => {
      const key = `${s.date}|${s.startHour}|${s.minutes}|${s.bookId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  return {
    ...local,
    ...remote,
    books: mergeById(local.books, remote.books),
    completed: mergeById(local.completed, remote.completed),
    plan: mergeById(local.plan, remote.plan),
    contexts: mergeById(local.contexts, remote.contexts),
    entries: mergeEntries(local.entries, remote.entries),
    annotations: mergeEntries(local.annotations, remote.annotations),
    sessions: mergeSessions(local.sessions, remote.sessions),
    weeklyGoal: remote.weeklyGoal ?? local.weeklyGoal,
    theme: local.theme ?? remote.theme,
    activeBookId: local.activeBookId ?? remote.activeBookId,
  };
}
