'use strict';
// Optional review-time verification. Normal builds and CI never fetch map images.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { validate } = require('./build.cjs');
const ROOT = path.resolve(__dirname, '../..');
const MAX = 2 * 1024 * 1024;

function verifyManifest(catalog, manifest) {
  validate(catalog);
  assert.equal(manifest.source_repository, 'https://github.com/Civ13/Civ13');
  assert.equal(manifest.source_commit_verified, catalog.verified_game_commit);
  assert.equal(manifest.png_production_source_commit, catalog.png_production_commit);
  const files = new Map(manifest.files.map(file => [file.path, file]));
  assert.equal(files.size, manifest.files.length, 'Duplicate manifest paths');
  for (const map of catalog.maps) {
    const source = manifest.maps.find(item => item.dmm === map.dmm_path);
    assert.ok(source, 'Map absent from pinned manifest');
    assert.equal(source.dmm_sha256, map.dmm_sha256);
    assert.equal(source.source_status, map.source_status);
    assert.equal(source.layers.length, map.layers.length);
    assert.equal(source.source_commit_verified, catalog.verified_game_commit);
    assert.equal(source.png_production_source_commit, catalog.png_production_commit);
    for (const file of [map.overview, ...map.layers]) {
      const original = files.get(file.path);
      assert.ok(original, 'Image absent from pinned manifest');
      assert.equal(original.sha256, file.sha256);
      assert.equal(original.bytes, file.bytes);
      assert.deepEqual(original.dimensions_px, [file.width, file.height]);
    }
  }
}

function verifyPng(bytes, file) {
  assert.ok(bytes.length <= MAX, 'Overview exceeds review budget');
  assert.equal(bytes.length, file.bytes, 'Image length differs from manifest');
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), file.sha256, 'Image hash differs from manifest');
  assert.ok(bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')), 'Not PNG bytes');
  assert.equal(bytes.toString('ascii', 12, 16), 'IHDR');
  assert.equal(bytes.readUInt32BE(16), file.width);
  assert.equal(bytes.readUInt32BE(20), file.height);
}

async function download(catalog, output) {
  const directory = path.resolve(output);
  assert.ok(directory.toLowerCase() !== ROOT.toLowerCase() && !directory.toLowerCase().startsWith(ROOT.toLowerCase() + path.sep), 'Keep review image bytes outside the website repository');
  fs.mkdirSync(directory, { recursive: true });
  const rows = [];
  for (const map of catalog.maps) {
    const file = map.overview;
    const url = `https://raw.githubusercontent.com/Civ13/civ13-wiki/${catalog.wiki_commit}/${file.path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    let reader;
    try {
      const response = await fetch(url, { redirect: 'error', credentials: 'omit', signal: controller.signal });
      assert.equal(response.status, 200, 'Unexpected image HTTP status');
      assert.match(response.headers.get('content-type') || '', /^image\/png(?:;|$)/i);
      reader = response.body.getReader();
      const chunks = []; let length = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.byteLength;
        assert.ok(length <= MAX && length <= file.bytes, 'Image response exceeds declared bound');
        chunks.push(Buffer.from(value));
      }
      const bytes = Buffer.concat(chunks);
      verifyPng(bytes, file);
      const name = `${map.id}-overview.png`;
      fs.writeFileSync(path.join(directory, name), bytes, { flag: 'wx' });
      rows.push({ map: map.id, status: 'verified', file: name, bytes: bytes.length, sha256: file.sha256, width: file.width, height: file.height, url });
    } catch (error) {
      rows.push({ map: map.id, status: 'failed', reason: String(error.message).slice(0, 240), url });
    } finally { controller.abort(); await reader?.cancel().catch(() => {}); clearTimeout(timer); }
  }
  return rows;
}

if (require.main === module) (async () => {
  const args = process.argv.slice(2);
  assert.ok(args.length === 2 || args.length === 4, 'Use --manifest PATH [--download-to OUTSIDE_REPOSITORY]');
  assert.equal(args[0], '--manifest');
  if (args.length === 4) assert.equal(args[2], '--download-to');
  const catalog = require('./catalog.json');
  verifyManifest(catalog, JSON.parse(fs.readFileSync(args[1], 'utf8')));
  const rows = args.length === 4 ? await download(catalog, args[3]) : [];
  console.log(JSON.stringify({ checked_at: new Date().toISOString(), wiki_commit: catalog.wiki_commit, manifest_matches: true, maps: catalog.maps.length, layers: catalog.maps.reduce((n, map) => n + map.layers.length, 0), overview_downloads: rows }, null, 2));
  if (rows.some(row => row.status !== 'verified')) process.exitCode = 1;
})().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { verifyManifest, verifyPng };
