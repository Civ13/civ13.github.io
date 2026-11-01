import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
process.env.XDG_CONFIG_HOME = fileURLToPath(new URL('../.wrangler/local-config/', import.meta.url));
process.env.WRANGLER_SEND_METRICS = 'false';
const { unstable_dev } = await import('wrangler');
const config = fileURLToPath(new URL('../wrangler.jsonc', import.meta.url));
const options = { config, local: true, envFiles: [], ip: '127.0.0.1', port: 0,
  persist: false, logLevel: 'error',
  experimental: { disableExperimentalWarning: true, disableDevRegistry: true, watch: false, liveReload: false, enableContainers: false } };
let count = 0;
const original = await unstable_dev(fileURLToPath(new URL('../dist/worker.js', import.meta.url)), { ...options, bundle: false });
try {
  for (const [path, status] of [['/health', 200], ['/', 200], ['/app.js', 200], ['/style.css', 200], ['/unknown', 404], ['/api/status?url=http://127.0.0.1', 400]]) {
    assert.equal((await original.fetch(path)).status, status); count++;
  }
  assert.equal((await original.fetch('/api/status', { method: 'POST' })).status, 405); count++;
  assert.equal(await (await original.fetch('/api/status', { method: 'HEAD' })).text(), ''); count++;
  assert.equal(await (await original.fetch('/license')).text(), readFileSync(new URL('../../../LICENSE.md', import.meta.url), 'utf8').replace(/\r\n/g, '\n')); count++;
} finally { await original.stop(); }
const mocked = await unstable_dev(fileURLToPath(new URL('./smoke-worker.mjs', import.meta.url)), options);
try {
  for (let i = 0; i < 2; i++) {
    const status = await mocked.fetch('/api/status'); count++;
    assert.equal(status.status, 200);
    const body = await status.json(); assert.equal(body.state, 'partial');
    assert.equal(body.providers[0].servers[0].players, 0);
    assert.equal(body.providers[0].servers[0].join_url, 'byond://civ13.com:1714');
    assert.equal(body.providers[1].state, 'unavailable');
    const launcher = await mocked.fetch('/api/launcher'); count++;
    assert.equal(launcher.status, 200); assert.equal((await launcher.json()).launcher.version, '1.0.8');
  }
} finally { await mocked.stop(); }
console.log(`Local workerd: ${count} bounded requests passed; upstreams mocked, no account or game traffic.`);
