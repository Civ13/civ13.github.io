export const PROVIDERS = Object.freeze(['civ13.com', 'valzargaming.com']);
export const STATUS_URLS = Object.freeze(PROVIDERS.map(host =>
  `https://civ13.com/.well-known/civ13/servers.json?provider=${host}`));
export const FEED_URL = 'https://raw.githubusercontent.com/Civ13/Civ13/native-launcher-updates/native-launcher-channel.json';
const RELEASE_BASE = 'https://api.github.com/repos/Civ13/Civ13/releases/tags/launcher-v';
const SECOND = 1000;
const HOUR = 3600 * SECOND;
const MAX_BODY = 512 * 1024;
const decoder = new TextDecoder('utf-8', { fatal: true });
const bytes = new TextEncoder();
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const integer = (value, max) => Number.isInteger(value) && value >= 0 && value <= max;
const iso = value => typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(value)
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().replace('.000Z', 'Z') === value;
const text = (value, max, empty = false) => typeof value === 'string'
  && (empty || value.trim().length > 0) && bytes.encode(value).length <= max
  && !/[\p{Cc}\p{Cf}\p{Cs}\p{Zl}\p{Zp}]/u.test(value);
const stamp = time => new Date(time).toISOString();
const fail = code => { throw new Error(code); };

// Reads a fixed public source only. The timeout covers headers and streamed body.
export async function readJson(url, fetcher, limit = MAX_BODY) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  let reader, response;
  try {
    response = await fetcher(url, {
      method: 'GET', redirect: 'manual', signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'Civ13-Public-Services/1.0' },
    });
    if (response.status !== 200) fail(`upstream_http_${response.status}`);
    if (!/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') ?? '')) fail('upstream_content_type');
    const length = response.headers.get('content-length');
    if (length && (!/^\d+$/.test(length) || Number(length) > limit)) fail('upstream_size');
    if (!response.body) fail('upstream_empty');
    reader = response.body.getReader();
    const body = new Uint8Array(limit); let size = 0;
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      if (size + part.value.byteLength > limit) fail('upstream_size');
      body.set(part.value, size); size += part.value.byteLength;
    }
    return JSON.parse(decoder.decode(body.subarray(0, size)));
  } finally {
    clearTimeout(timer);
    if (reader) await reader.cancel().catch(() => {});
    else if (response?.body) await response.body.cancel().catch(() => {});
  }
}

export function validateDirectory(input, provider, now) {
  if (!record(input) || input.schema !== 1 || !iso(input.generated_at) || !iso(input.expires_at)
    || !Array.isArray(input.servers) || input.servers.length > 32) fail('invalid_directory');
  const generated = Date.parse(input.generated_at), expires = Date.parse(input.expires_at);
  if (generated > now || expires <= now || expires <= generated || expires - generated > 60 * SECOND)
    fail('expired_directory');
  const seen = new Set(), ports = new Set();
  const servers = input.servers.map(row => {
    if (!record(row) || typeof row.id !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(row.id) || seen.has(row.id) || ports.has(row.port)
      || !text(row.name, 120) || row.host !== provider || ![1714, 1715].includes(row.port)
      || row.engine !== 'BYOND' || row.online !== true || !iso(row.checked_at)
      || !integer(row.players, 10000) || !text(row.map, 128) || !text(row.mode, 80)
      || !record(row.round) || !text(row.round.id, 80, true)
      || !integer(row.round.duration_seconds, 214748364)) fail('invalid_server');
    const checked = Date.parse(row.checked_at);
    if (checked > generated || checked > now || now - checked >= 60 * SECOND
      || expires > checked + 60 * SECOND) fail('expired_server');
    seen.add(row.id); ports.add(row.port);
    const result = {
      id: row.id, name: row.name, host: provider, port: row.port, engine: 'BYOND',
      online: true, checked_at: row.checked_at, players: row.players, map: row.map, mode: row.mode,
      round: { id: row.round.id, duration_seconds: row.round.duration_seconds },
      join_url: `byond://${provider}:${row.port}`,
    };
    if (text(row.epoch, 32)) result.epoch = row.epoch;
    return result;
  });
  return { generated_at: input.generated_at, expires_at: input.expires_at, servers };
}

export function validateLauncher(feed, release) {
  if (!record(feed) || feed.schema !== 1 || !/^\d{1,4}\.\d{1,4}\.\d{1,4}$/.test(feed.version ?? '')
    || !/^[a-f0-9]{64}$/.test(feed.sha256 ?? '')) fail('invalid_feed');
  const tag = `launcher-v${feed.version}`;
  const url = `https://github.com/Civ13/Civ13/releases/download/${tag}/Civ13.exe`;
  if (feed.url !== url || !record(release) || release.tag_name !== tag || release.draft !== false
    || release.prerelease !== false || release.html_url !== `https://github.com/Civ13/Civ13/releases/tag/${tag}`
    || !Array.isArray(release.assets) || release.assets.length > 32 || !iso(release.published_at)) fail('invalid_release');
  const matches = release.assets.filter(asset => asset.name === 'Civ13.exe');
  const asset = matches[0];
  if (matches.length !== 1 || asset.state !== 'uploaded' || asset.browser_download_url !== url
    || asset.digest !== `sha256:${feed.sha256}` || !integer(asset.size, 256 * 1024 * 1024)
    || asset.size === 0) fail('release_digest_mismatch');
  return { version: feed.version, sha256: feed.sha256, url, size: asset.size,
    release_url: release.html_url, published_at: release.published_at, feed_url: FEED_URL,
    verification: 'stable feed matches GitHub release asset SHA-256 metadata' };
}

// Cache API and memory are disposable, per-location caches, never authoritative storage.
// Two status sources and one launcher channel are the complete key space.
export function createService({ fetcher = fetch, clock = Date.now, cache = null } = {}) {
  const memory = new Map(), pending = new Map();
  async function cached(key, interval, retention, load) {
    if (pending.has(key)) return pending.get(key);
    const operation = (async () => {
      const now = clock();
      const cacheKey = new Request(`https://civ13-public-services.invalid/cache-v1/${key}`);
      let entry = memory.get(key);
      if (!entry && cache) {
        try {
          const hit = await cache.match(cacheKey);
          if (hit) {
            const value = await hit.json();
            if (record(value) && Number.isFinite(value.attempted) && value.attempted <= now
              && (!value.good || (Number.isFinite(value.good_at) && value.good_at <= now
                && now - value.good_at <= retention))) entry = value;
          }
        } catch { /* Cache availability never determines source validity. */ }
      }
      if (entry && now >= entry.attempted && now - entry.attempted < interval) return entry;
      const next = { attempted: now, good: null, good_at: null, error: null };
      if (entry?.good && now >= entry.good_at && now - entry.good_at <= retention) {
        next.good = entry.good; next.good_at = entry.good_at;
      }
      try { next.good = await load(); next.good_at = clock(); }
      catch (error) {
        // Error bodies, URLs, stack traces and upstream fields are never exposed.
        next.error = /^upstream_http_\d{3}$/.test(error.message) ? error.message : 'source_unavailable_or_invalid';
      }
      memory.set(key, next);
      if (cache) {
        try { await cache.put(cacheKey, new Response(JSON.stringify(next), {
          headers: { 'Cache-Control': `public, max-age=${retention / SECOND}`, 'Content-Type': 'application/json' },
        })); } catch { /* Eviction or a failed put is safe. */ }
      }
      return next;
    })();
    pending.set(key, operation);
    try { return await operation; } finally { pending.delete(key); }
  }
  return {
    async status() {
      const entries = await Promise.all(PROVIDERS.map((provider, i) => cached(`status-${i}`, 15 * SECOND, HOUR,
        async () => validateDirectory(await readJson(STATUS_URLS[i], fetcher, 64 * 1024), provider, clock()))));
      const now = clock();
      const providers = entries.map((entry, i) => {
        const good = entry.good && now - entry.good_at <= HOUR ? entry.good : null;
        const fresh = good && !entry.error && Date.parse(good.expires_at) > now;
        return { provider: PROVIDERS[i], source_url: STATUS_URLS[i],
          state: fresh ? 'fresh' : good ? 'stale' : 'unavailable',
          last_attempt_at: stamp(entry.attempted), last_success_at: good ? stamp(entry.good_at) : null,
          error: entry.error, ...(good ?? { generated_at: null, expires_at: null, servers: [] }) };
      });
      const count = providers.filter(row => row.state === 'fresh').length;
      return { schema: 1, as_of: stamp(now), state: count === 2 ? 'fresh' : count ? 'partial'
        : providers.some(row => row.state === 'stale') ? 'stale' : 'unavailable', providers };
    },
    async launcher() {
      const entry = await cached('launcher', HOUR, 24 * HOUR, async () => {
        const feed = await readJson(FEED_URL, fetcher, 4096);
        // Validate before deriving the only variable outbound URL component.
        if (!record(feed) || !/^\d{1,4}\.\d{1,4}\.\d{1,4}$/.test(feed.version ?? '')) fail('invalid_feed');
        return validateLauncher(feed, await readJson(`${RELEASE_BASE}${feed.version}`, fetcher));
      });
      const now = clock(), good = entry.good && now - entry.good_at <= 24 * HOUR ? entry.good : null;
      return { schema: 1, as_of: stamp(now), state: good ? (!entry.error && now - entry.good_at < HOUR ? 'fresh' : 'stale') : 'unavailable',
        last_attempt_at: stamp(entry.attempted), last_success_at: good ? stamp(entry.good_at) : null,
        error: entry.error, launcher: good };
    },
  };
}
