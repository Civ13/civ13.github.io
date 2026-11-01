import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { script } from '../src/view.mjs';
import { NOW, directory, feed } from './fixtures.mjs';

const iso = time => new Date(time).toISOString();
function bodies() {
  const snapshot = directory();
  snapshot.servers[0].join_url = 'byond://civ13.com:1714';
  return {
    status: { state: 'fresh', as_of: iso(NOW), providers: [{ ...snapshot, provider: 'civ13.com',
      state: 'fresh', expires_at: iso(NOW + 30000), source_url: 'https://civ13.com/', last_success_at: iso(NOW) }] },
    launcher: { state: 'fresh', as_of: iso(NOW), expires_at: iso(NOW + 3600000), last_success_at: iso(NOW),
      launcher: { ...feed, size: 1, published_at: iso(NOW), verification: 'fixture', release_url: 'https://github.com/Civ13/Civ13/releases' } },
  };
}
async function harness({ data = bodies(), wallSkew = 0, latency = 0 } = {}) {
  let monotonic = 0, wall = NOW + wallSkew, fetches = 0;
  const listeners = new Map(), timers = [];
  const listen = key => (event, handler) => listeners.set(key + event, handler);
  class Node {
    children = []; value = ''; href = ''; handlers = new Map(); disabled = false;
    constructor(tag) { this.tag = tag; }
    set textContent(value) { this.children = []; this.value = value; }
    get textContent() { return this.value; }
    append(node) { this.children.push(node); }
    replaceChildren() { this.children = []; }
    addEventListener(event, handler) { this.handlers.set(event, handler); }
    set innerHTML(_value) { throw Error('Unsafe DOM sink'); }
  }
  class ClockDate extends Date { static now() { return wall; } }
  const nodes = Object.fromEntries(['servers', 'launcher', 'refresh', 'message'].map(id => [id, new Node(id)]));
  vm.runInNewContext(script, {
    Date: ClockDate, performance: { now: () => monotonic },
    document: { getElementById: id => nodes[id], createElement: tag => new Node(tag), addEventListener: listen('document:') },
    window: { addEventListener: listen('window:') }, setInterval(callback, delay) { assert.equal(delay, 1000); timers.push(callback); },
    fetch: async path => {
      fetches++;
      await Promise.resolve(); monotonic = latency; wall = NOW + wallSkew + latency;
      return { json: async () => structuredClone(path === '/api/status' ? data.status : data.launcher) };
    },
  });
  await new Promise(resolve => setImmediate(resolve));
  function all() {
    return Object.values(nodes).flatMap(function walk(node) { return [node, ...node.children.flatMap(walk)]; });
  }
  return {
    all, nodes, fetches: () => fetches,
    advance(ms, mono = true) { if (mono) monotonic += ms; wall += ms; },
    tick() { timers.forEach(callback => callback()); },
    event(key) { assert.ok(listeners.has(key)); listeners.get(key)(); },
    joins: () => all().filter(node => node.href.startsWith('byond:')),
    downloads: () => all().filter(node => node.href === feed.url),
    hasText: value => all().some(node => String(node.textContent).includes(value)),
  };
}

test('open page ages fresh status and launcher locally, removing actions without polling or DOM churn', async () => {
  const page = await harness();
  assert.equal(page.joins().length, 1); assert.equal(page.downloads().length, 1);
  const group = page.nodes.servers.children[1];
  page.advance(1000); page.tick(); assert.equal(page.nodes.servers.children[1], group);
  page.advance(29000); page.tick();
  assert.equal(page.joins().length, 0); assert.equal(page.downloads().length, 1);
  assert.ok(page.hasText('current availability unknown')); assert.ok(page.hasText('Directory: stale'));
  page.advance(3570000); page.tick();
  assert.equal(page.downloads().length, 0); assert.ok(page.hasText('Metadata: stale'));
  assert.equal(page.fetches(), 2);
});

test('visibility, focus and page resume recheck expiry even when the monotonic clock paused during sleep', async () => {
  for (const event of ['document:visibilitychange', 'window:focus', 'window:pageshow']) {
    const page = await harness(); page.advance(3600000, false); page.event(event);
    assert.equal(page.joins().length, 0); assert.equal(page.downloads().length, 0);
    page.advance(-3600000, false); page.tick();
    assert.equal(page.joins().length, 0); assert.equal(page.downloads().length, 0);
    assert.equal(page.fetches(), 2);
  }
});

test('expired actions prevent default even before a delayed timer or resume event runs', async () => {
  for (const action of ['joins', 'downloads']) {
    const page = await harness(), node = page[action]()[0]; page.advance(3600000);
    let blocked = false; node.handlers.get('click')({ preventDefault() { blocked = true; } });
    assert.equal(blocked, true); assert.equal(page[action]().length, 0); assert.equal(page.fetches(), 2);
  }
});

test('missing, malformed, impossible, past or overlong freshness timestamps never enable actions', async () => {
  for (const expiry of [undefined, 'unknown', '2026-02-30T20:00:00Z', iso(NOW), iso(NOW + 3600001)]) {
    const data = bodies(); data.status.providers[0].expires_at = expiry; data.launcher.expires_at = expiry;
    const page = await harness({ data }); assert.equal(page.joins().length, 0); assert.equal(page.downloads().length, 0);
    assert.ok(page.hasText('current availability unknown'));
  }
  for (const asOf of [undefined, 'not-a-timestamp']) {
    const data = bodies(); data.status.as_of = asOf; data.launcher.as_of = asOf;
    const page = await harness({ data }); assert.equal(page.joins().length, 0); assert.equal(page.downloads().length, 0);
  }
});

test('relative expiry tolerates client UTC skew, subtracts fetch latency and rejects clock rollback', async () => {
  const skewed = await harness({ wallSkew: 86400000 }); assert.equal(skewed.joins().length, 1);
  const slow = await harness({ latency: 30000 }); assert.equal(slow.joins().length, 0);
  const rollback = await harness(); rollback.advance(-1000); rollback.tick();
  assert.equal(rollback.joins().length, 0); assert.equal(rollback.downloads().length, 0);
});
