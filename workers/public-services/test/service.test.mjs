import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createService, validateDirectory, validateLauncher, readJson, STATUS_URLS, FEED_URL } from '../src/service.mjs';
import { NOW, directory, feed, release, response, MemoryCache } from './fixtures.mjs';

test('fresh zero-player server is online; only public fields survive', () => {
  const input = directory();
  Object.assign(input.servers[0], { ckeys: ['private'], ip: 'secret', admins: ['private'] });
  input.servers[0].round.private = 'secret';
  const output = validateDirectory(input, 'civ13.com', NOW);
  assert.equal(output.servers[0].players, 0);
  assert.equal(output.servers[0].join_url, 'byond://civ13.com:1714');
  assert.equal(JSON.stringify(output).includes('secret'), false);
  assert.deepEqual(Object.keys(output.servers[0].round), ['id', 'duration_seconds']);
});

test('directory rejects stale/future evidence and noncanonical timestamps', () => {
  for (const mutate of [
    x => x.expires_at = '2026-11-01T20:00:00Z',
    x => x.generated_at = '2026-11-01T20:00:01Z',
    x => x.expires_at = '2026-11-01T20:01:01Z',
    x => x.servers[0].checked_at = '2026-11-01T19:58:59Z',
    x => x.servers[0].checked_at = '2026-11-01T20:00:01Z',
    x => x.generated_at = '2026-02-30T20:00:00Z',
  ]) { const input = directory(); mutate(input); assert.throws(() => validateDirectory(input, 'civ13.com', NOW)); }
});

test('directory rejects arbitrary hosts/ports, duplicate identities, malformed and oversized fields', () => {
  for (const mutate of [
    x => x.servers[0].host = '127.0.0.1', x => x.servers[0].host = 'valzargaming.com',
    x => x.servers[0].port = 80, x => x.servers[0].players = -1, x => x.servers[0].players = 1.5,
    x => x.servers[0].players = 10001, x => x.servers[0].id = 123,
    x => x.servers[0].name = 'x'.repeat(121), x => x.servers[0].name = 'bad\u202e',
    x => x.servers[0].name = '\ud800', x => x.servers[0].online = false,
    x => x.servers[0].round.duration_seconds = 214748365,
    x => x.servers.push(structuredClone(x.servers[0])),
    x => { const row = structuredClone(x.servers[0]); row.id = 'duplicate-port'; x.servers.push(row); },
    x => x.servers = Array(33).fill(x.servers[0]),
  ]) { const input = directory(); mutate(input); assert.throws(() => validateDirectory(input, 'civ13.com', NOW)); }
});

test('fresh empty online-only snapshot never becomes fabricated offline rows', async () => {
  const service = createService({ clock: () => NOW, fetcher: async url => {
    const input = directory(new URL(url).searchParams.get('provider')); input.servers = []; return response(input);
  } });
  const output = await service.status();
  assert.equal(output.state, 'fresh');
  assert.ok(output.providers.every(row => row.servers.length === 0 && row.state === 'fresh'));
});

test('404 is unavailable and negative cached, never offline or zero population', async () => {
  let calls = 0;
  const service = createService({ clock: () => NOW, fetcher: async () => { calls++; return new Response('private error', { status: 404 }); } });
  const output = await service.status(); await service.status();
  assert.equal(calls, 2); assert.equal(output.state, 'unavailable');
  assert.ok(output.providers.every(row => row.error === 'upstream_http_404' && row.servers.length === 0 && row.last_success_at === null));
  assert.equal(JSON.stringify(output).includes('private error'), false);
});

test('failed refresh preserves old evidence as stale, expires retention and recovers', async () => {
  let now = NOW, broken = false, calls = 0;
  const service = createService({ clock: () => now, fetcher: async url => {
    calls++; if (broken) throw new Error('secret stack');
    return response(directory(new URL(url).searchParams.get('provider'), now));
  } });
  const first = await service.status(); broken = true; now += 15000;
  const stale = await service.status();
  assert.equal(stale.state, 'stale');
  assert.equal(stale.providers[0].servers[0].checked_at, first.providers[0].servers[0].checked_at);
  assert.equal(stale.providers[0].last_success_at, first.providers[0].last_success_at);
  assert.equal(JSON.stringify(stale).includes('secret'), false);
  now = NOW + 3600001; assert.equal((await service.status()).state, 'unavailable');
  broken = false; now += 15000; assert.equal((await service.status()).state, 'fresh'); assert.equal(calls, 8);
});

test('partial provider outage is explicit and never combines provider identities', async () => {
  const service = createService({ clock: () => NOW, fetcher: async url => url === STATUS_URLS[0]
    ? response(directory()) : new Response(null, { status: 503 }) });
  const value = await service.status(); assert.equal(value.state, 'partial');
  assert.deepEqual(value.providers.map(row => row.state), ['fresh', 'unavailable']);
});

test('source evidence arriving after network latency is checked at completion time', async () => {
  let now = NOW;
  const service = createService({ clock: () => now, fetcher: async url => {
    now += 2000; return response(directory(new URL(url).searchParams.get('provider'), now));
  } });
  const result = await service.status(); assert.equal(result.state, 'fresh');
  assert.equal(result.providers[0].last_success_at, new Date(now).toISOString());
});

test('simultaneous requests coalesce and Cache API survives a new isolate', async () => {
  let calls = 0; const cache = new MemoryCache();
  const options = { cache, clock: () => NOW, fetcher: async url => {
    calls++; await new Promise(resolve => setTimeout(resolve, 5));
    return response(directory(new URL(url).searchParams.get('provider')));
  } };
  const one = createService(options);
  await Promise.all(Array.from({ length: 12 }, () => one.status())); assert.equal(calls, 2);
  const two = createService(options); assert.equal((await two.status()).state, 'fresh'); assert.equal(calls, 2);
});

test('cache failure, eviction and a backward clock fail safely', async () => {
  let now = NOW;
  const service = createService({ clock: () => now, cache: { match() { throw Error(); }, put() { throw Error(); } },
    fetcher: async url => response(directory(new URL(url).searchParams.get('provider'), now)) });
  assert.equal((await service.status()).state, 'fresh'); now -= 1000;
  assert.equal((await service.status()).state, 'fresh');
});

test('launcher stable feed is matched to exact release asset metadata', () => {
  const result = validateLauncher(feed, release());
  assert.equal(result.sha256, feed.sha256); assert.equal(result.size, 35167763);
  for (const mutate of [x => x.prerelease = true, x => x.draft = true,
    x => x.tag_name = 'byond-toolchain-cache-123', x => x.assets[0].digest = 'sha256:' + '0'.repeat(64),
    x => x.assets.push(structuredClone(x.assets[0])), x => x.assets[0].browser_download_url = 'https://evil.example/file',
    x => x.assets[0].size = 0]) {
    const input = release(); mutate(input); assert.throws(() => validateLauncher(feed, input));
  }
  assert.throws(() => validateLauncher({ ...feed, url: 'https://evil.example' }, release()));
});

test('launcher never fetches arbitrary feed URL, latest releases or malformed tags', async () => {
  const calls = [];
  const service = createService({ clock: () => NOW, fetcher: async url => {
    calls.push(url); return response(url === FEED_URL ? feed : release());
  } });
  const output = await service.launcher(); await service.launcher();
  assert.equal(output.state, 'fresh');
  assert.equal(output.expires_at, new Date(NOW + 3600000).toISOString());
  assert.deepEqual(calls, [FEED_URL, 'https://api.github.com/repos/Civ13/Civ13/releases/tags/launcher-v1.0.8']);
  const bad = createService({ clock: () => NOW, fetcher: async url => { assert.equal(url, FEED_URL); return response({ ...feed, version: '../../secrets' }); } });
  assert.equal((await bad.launcher()).state, 'unavailable');
});

test('canonical GitHub Raw feed accepts its observed text/plain MIME only at the exact URL', async () => {
  const plain = () => new Response(JSON.stringify(feed), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  const service = createService({ clock: () => NOW, fetcher: async url => url === FEED_URL ? plain() : response(release()) });
  assert.equal((await service.launcher()).state, 'fresh');
  for (const url of [...STATUS_URLS, FEED_URL + '?other=1',
    'https://raw.githubusercontent.com/Civ13/Civ13/master/other.json',
    'https://api.github.com/repos/Civ13/Civ13/releases/tags/launcher-v1.0.8']) {
    await assert.rejects(readJson(url, async () => plain()), /upstream_content_type/);
  }
  await assert.rejects(readJson(FEED_URL, async () => new Response('not JSON', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })));
  await assert.rejects(readJson(FEED_URL, async () => new Response('x'.repeat(4097), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  }), 4096), /upstream_size/);
});

test('launcher outage yields explicit stale metadata then no expired download', async () => {
  let now = NOW, broken = false;
  const service = createService({ clock: () => now, fetcher: async url => {
    if (broken) return new Response(null, { status: 429 }); return response(url === FEED_URL ? feed : release());
  } });
  assert.equal((await service.launcher()).state, 'fresh'); broken = true; now += 3600000;
  const stale = await service.launcher(); assert.equal(stale.state, 'stale'); assert.equal(stale.launcher.version, '1.0.8');
  now = NOW + 86400001; const old = await service.launcher(); assert.equal(old.state, 'unavailable'); assert.equal(old.launcher, null);
});

test('upstream redirects, oversized streams, invalid UTF-8/JSON and wrong MIME fail closed', async () => {
  for (const make of [
    () => new Response(null, { status: 302, headers: { Location: 'http://127.0.0.1/' } }),
    () => new Response('x'.repeat(65), { headers: { 'Content-Type': 'application/json' } }),
    () => new Response(new Uint8Array([0xff]), { headers: { 'Content-Type': 'application/json' } }),
    () => new Response('{', { headers: { 'Content-Type': 'application/json' } }),
    () => new Response('{}', { headers: { 'Content-Type': 'text/html' } }),
    () => new Response('{}', { headers: { 'Content-Type': 'application/json', 'Content-Length': '9999' } }),
  ]) await assert.rejects(readJson(STATUS_URLS[0], async (_url, options) => { assert.equal(options.redirect, 'manual'); return make(); }, 64));
});

test('body timeout aborts a stalled upstream within its fixed deadline', async () => {
  const start = Date.now();
  await assert.rejects(readJson(STATUS_URLS[0], async (_url, options) => new Response(new ReadableStream({
    start(controller) { options.signal.addEventListener('abort', () => controller.error(new Error('aborted'))); },
  }), { headers: { 'Content-Type': 'application/json' } })));
  assert.ok(Date.now() - start >= 2900 && Date.now() - start < 6000);
});
