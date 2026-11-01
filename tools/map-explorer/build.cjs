'use strict';
const fs = require('node:fs');
const path = require('node:path');
const ROOT = __dirname;
const ASSETS = 'src/images/maps/nomads-authored-10d264e58962/';
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
const raw = (commit, file) => `https://raw.githubusercontent.com/Civ13/civ13-wiki/${commit}/${file}`;
const wiki = (commit, file) => `https://github.com/Civ13/civ13-wiki/blob/${commit}/${file}`;

function validate(data) {
  const requireValue = (condition, message) => { if (!condition) throw new Error(message); };
  requireValue(data.schema === 'civ13.static-maps.v1', 'Unknown catalog schema');
  for (const key of ['wiki_commit', 'verified_game_commit', 'png_production_commit']) requireValue(/^[a-f0-9]{40}$/.test(data[key]), `Invalid ${key}`);
  requireValue(data.manifest_path === ASSETS + 'asset-manifest.json', 'Unexpected asset manifest');
  requireValue(Array.isArray(data.maps) && data.maps.length > 0 && data.maps.length <= 8, 'Invalid map count');
  const ids = new Set();
  for (const map of data.maps) {
    requireValue(/^[a-z]+$/.test(map.id) && !ids.has(map.id), 'Invalid or duplicate map identity'); ids.add(map.id);
    requireValue(typeof map.title === 'string' && map.title.length > 0 && map.title.length <= 80, 'Invalid map title');
    requireValue(/^src\/maps\/[A-Za-z_]+\.md$/.test(map.guide_path), 'Invalid guide path');
    requireValue(map.source_status === 'Authored variant, outside the standard Nomads map-vote list.', 'Unreviewed availability status');
    requireValue(map.dmm_path === `maps/nomads/nomads_${map.id}.dmm` && /^[a-f0-9]{64}$/.test(map.dmm_sha256), 'Invalid DMM provenance');
    const folder = ASSETS + `nomads__nomads_${map.id}/nomads_${map.id}__`;
    const checkFile = (file, suffix) => {
      requireValue(file.path === folder + suffix, 'Unexpected image path');
      requireValue(/^[a-f0-9]{64}$/.test(file.sha256), 'Invalid image hash');
      for (const key of ['width', 'height', 'bytes']) requireValue(Number.isSafeInteger(file[key]) && file[key] > 0, `Invalid image ${key}`);
    };
    checkFile(map.overview, 'all_z_overview.png');
    requireValue(map.overview.bytes <= 2 * 1024 * 1024, 'Overview exceeds prototype budget');
    requireValue(Array.isArray(map.layers) && map.layers.length >= 1 && map.layers.length <= 8, 'Invalid layers');
    map.layers.forEach((layer, index) => {
      requireValue(layer.z === index + 1, 'Layer identities must remain contiguous');
      requireValue(['Underground', 'Surface', 'Authored layer'].includes(layer.label), 'Unreviewed layer label');
      checkFile(layer, `z${String(layer.z).padStart(2, '0')}__full.png`);
    });
  }
  return data;
}

function render(data) {
  validate(data);
  const link = (url, text) => `<a href="${escape(url)}" rel="noreferrer">${escape(text)}</a>`;
  const size = file => `${file.width.toLocaleString('en-US')} × ${file.height.toLocaleString('en-US')} px; ${(file.bytes / 1048576).toFixed(2)} MiB PNG`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer"><title>Authored map browser — review prototype</title>
<link rel="stylesheet" href="viewer.css"><script src="viewer.js" defer></script></head>
<body><main><p class="kicker">Civ13 · unpublished review prototype</p><h1>Explore authored maps</h1>
<p>Compare four existing Nomads layouts and open their original layer images. These are static source renders: current hosting and player access are unverified.</p>
<p>Runtime lighting, generated objects, animation and lower-level view projection are absent. This browser does not connect to a game server or generate maps.</p>
<div id="map-controls" hidden><label for="map-choice">Show a map</label><select id="map-choice"><option value="all">All four maps</option>${data.maps.map(map => `<option value="${escape(map.id)}">${escape(map.title)}</option>`).join('')}</select><p id="map-count" role="status" aria-live="polite"></p></div>
<noscript><p>All map links work without JavaScript. Open an overview or layer below to view it.</p></noscript>
<p>Images stay unloaded until you choose one. Opening a full-resolution layer can use substantial memory; the file size and dimensions are shown first.</p>
${data.maps.map(map => `<article class="map-card" data-map="${escape(map.id)}"><h2>${escape(map.title)}</h2>
<p>${escape(map.source_status)}</p>
<p>${link(wiki(data.wiki_commit, map.guide_path), 'Read the pinned wiki guide')} · ${link('https://github.com/Civ13/Civ13/blob/' + data.verified_game_commit + '/' + map.dmm_path, 'Authored DMM source')}</p>
<button class="load-overview" type="button" hidden>Load ${escape(map.title)} overview (${(map.overview.bytes / 1048576).toFixed(2)} MiB)</button>
<p class="image-status" role="status" aria-live="polite"></p>
<figure><img class="overview" data-src="${escape(raw(data.wiki_commit, map.overview.path))}" width="${map.overview.width}" height="${map.overview.height}" alt="${escape(map.title)} authored layers, north up; static sprite render" referrerpolicy="no-referrer" hidden><figcaption>${link(raw(data.wiki_commit, map.overview.path), 'Open original overview')} · ${escape(size(map.overview))}</figcaption></figure>
<details><summary>Full-resolution layers (${map.layers.length})</summary><ul>${map.layers.map(layer => `<li>${link(raw(data.wiki_commit, layer.path), `z=${layer.z} — ${layer.label}`)} · ${escape(size(layer))}</li>`).join('')}</ul></details></article>`).join('\n')}
<section aria-labelledby="provenance"><h2 id="provenance">Source and credit</h2>
<p>Wiki snapshot: ${link('https://github.com/Civ13/civ13-wiki/tree/' + data.wiki_commit, data.wiki_commit)}.<br>Game source used for static equivalence verification: ${link('https://github.com/Civ13/Civ13/tree/' + data.verified_game_commit, data.verified_game_commit)}.<br>Original PNG production source: ${link('https://github.com/Civ13/Civ13/tree/' + data.png_production_commit, data.png_production_commit)}.</p>
<p>The wiki reused existing PNG bytes after checking their static inputs. This prototype reuses those images and does not reproduce or replace the renderer. See ${link(wiki(data.wiki_commit, data.manifest_path), 'the original asset manifest')} for hashes and limitations.</p>
<p>Credit: Civilization 13 team and original Civ13/Space Station 13 map and sprite contributors. Original copyrights and asset licenses remain with their authors; images are not relicensed under the wiki MIT license. ${link(wiki(data.wiki_commit, ASSETS + 'README.txt'), 'Original credit and reuse statement')} · ${link(wiki(data.wiki_commit, ASSETS + 'LICENSE-Civ13.txt'), 'Civ13 license notice')} · ${link(wiki(data.wiki_commit, ASSETS + 'bark.dmi.LICENSE.txt'), 'Bark sprite credit')}.</p>
<p>${link('https://civ13.github.io/civ13-wiki/maps_overview.html', 'Browse the existing wiki map index')} · ${link('https://civ13.github.io/Civ13/crafting/', 'Crafting Atlas')}</p></section></main></body></html>
`;
}

if (require.main === module) {
  const output = render(JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog.json'), 'utf8')));
  const target = path.join(ROOT, 'index.html');
  if (process.argv[2] === '--write') fs.writeFileSync(target, output);
  else if (process.argv[2] === '--check') {
    if (fs.readFileSync(target, 'utf8') !== output) throw new Error('Generated explorer is stale');
    console.log('Unpublished explorer matches its pinned catalog');
  } else throw new Error('Use --write or --check');
}
module.exports = { validate, render };
