import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { createWorker } from '../src/worker.mjs';
import { script } from '../src/view.mjs';

test('fixed GET routes, HEAD and method/input bounds cannot trigger arbitrary upstream calls', async () => {
  let calls = 0;
  const worker = createWorker({ async status() { calls++; return { state: 'unavailable' }; }, async launcher() { calls++; return { state: 'fresh' }; } });
  const request = (path, method = 'GET') => worker.fetch(new Request('https://example.test' + path, { method }));
  for (const path of ['/health', '/', '/app.js', '/style.css', '/license']) assert.equal((await request(path)).status, 200);
  assert.equal(await (await request('/license')).text(), readFileSync(new URL('../../../LICENSE.md', import.meta.url), 'utf8').replace(/\r\n/g, '\n'));
  assert.equal((await request('/api/status', 'HEAD')).status, 200); assert.equal(calls, 0);
  assert.equal(await (await request('/health', 'HEAD')).text(), '');
  assert.equal(await (await request('/unknown', 'HEAD')).text(), '');
  assert.equal(await (await request('/api/status?bad=1', 'HEAD')).text(), '');
  assert.equal((await request('/api/status?url=http://127.0.0.1')).status, 400);
  assert.equal((await request('/' + 'x'.repeat(2050))).status, 400);
  assert.equal((await request('/unknown')).status, 404);
  assert.equal((await request('/constructor')).status, 404);
  assert.equal((await request('/api/status', 'POST')).status, 405); assert.equal(calls, 0);
  assert.equal((await request('/api/status')).status, 503);
  const launcher = await request('/api/launcher'); assert.equal(launcher.status, 200); assert.equal(calls, 2);
  assert.equal(launcher.headers.get('access-control-allow-origin'), null);
  assert.equal(launcher.headers.get('cache-control'), 'no-store');
  assert.match(launcher.headers.get('content-security-policy'), /frame-ancestors 'none'/);
});

test('unhandled service errors remain bounded and contain no private diagnostics', async () => {
  const worker = createWorker({ status() { throw new Error('private path'); } });
  const result = await worker.fetch(new Request('https://example.test/api/status'));
  assert.equal(result.status, 503); assert.deepEqual(await result.json(), { error: 'Service unavailable' });
});

test('directory UI uses text nodes, hides stale join/download links and labels unknown status', async () => {
  class Node {
    children = []; textContent = ''; href = ''; disabled = false;
    constructor(tag) { this.tag = tag; }
    append(node) { this.children.push(node); }
    replaceChildren() { this.children = []; }
    addEventListener() {}
    set innerHTML(_value) { throw Error('Unsafe DOM sink'); }
  }
  const nodes = Object.fromEntries(['servers', 'launcher', 'refresh', 'message'].map(id => [id, new Node(id)]));
  const attack = '<img src=x onerror=alert(1)>';
  const status = { state: 'stale', as_of: 'fixture', providers: [{ provider: 'civ13.com', state: 'stale',
    source_url: 'https://civ13.com/.well-known/civ13/servers.json?provider=civ13.com',
    servers: [{ name: attack, players: 0, map: attack, mode: 'fixture', round: { id: 'fixture', duration_seconds: 0 },
      checked_at: 'fixture', join_url: 'byond://civ13.com:1714' }] }] };
  const launcher = { state: 'stale', launcher: { version: '1.0.8', size: 1, sha256: 'a'.repeat(64),
    url: 'https://github.com/download', release_url: 'https://github.com/release', verification: 'fixture' } };
  vm.runInNewContext(script, { document: { getElementById: id => nodes[id], createElement: tag => new Node(tag) },
    fetch: async path => ({ json: async () => path === '/api/status' ? status : launcher }) });
  await new Promise(resolve => setImmediate(resolve));
  const all = Object.values(nodes).flatMap(function walk(node) { return [node, ...node.children.flatMap(walk)]; });
  assert.ok(all.some(node => node.textContent === attack));
  assert.equal(all.some(node => node.href.startsWith('byond:') || node.href === launcher.launcher.url), false);
  assert.ok(all.some(node => String(node.textContent).includes('current availability unknown')));
  assert.equal(nodes.refresh.disabled, false);
});
