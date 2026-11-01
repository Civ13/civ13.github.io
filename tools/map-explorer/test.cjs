'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { validate, render } = require('./build.cjs');
const catalog = require('./catalog.json');
const source = fs.readFileSync(path.join(__dirname, 'viewer.js'), 'utf8');

test('four merged wiki maps retain distinct source pins, layers and image budgets', () => {
  validate(catalog);
  assert.equal(catalog.wiki_commit, '48094b1fbac7031a3a49c5c9ddce84e51dea0258');
  assert.equal(catalog.verified_game_commit, '10d264e5896221b34949ee4b67c0fd2b94bde249');
  assert.equal(catalog.png_production_commit, '067478b82c7ad9f1b83759a221e6f22080ba865a');
  assert.deepEqual(catalog.maps.map(map => [map.id, map.layers.length]), [['gaia', 2], ['mountain', 8], ['oceania', 1], ['stranded', 2]]);
  assert.deepEqual(catalog.maps[0].layers.map(layer => [layer.z, layer.label]), [[1, 'Underground'], [2, 'Surface']]);
  assert.ok(catalog.maps.every(map => map.overview.bytes <= 2 * 1024 * 1024));
});

test('reject swapped provenance, escaped destinations, false status and missing layers', () => {
  const reject = mutate => { const data = structuredClone(catalog); mutate(data); assert.throws(() => validate(data)); };
  reject(data => { data.wiki_commit = 'master'; });
  reject(data => { data.manifest_path = '../private.json'; });
  reject(data => { data.maps[0].overview.path = 'https://example.com/map.png'; });
  reject(data => { data.maps[0].overview.path += '?token=secret'; });
  reject(data => { data.maps[0].source_status = 'Available now'; });
  reject(data => { data.maps[1].layers.splice(2, 1); });
  reject(data => { data.maps[0].overview.bytes = 3 * 1024 * 1024; });
  reject(data => { data.maps[0].dmm_path = data.maps[1].dmm_path; });
  reject(data => { data.maps[1].id = 'gaia'; });
  reject(data => { data.maps[0].overview.width = 0; });
});

test('generated prototype has complete no-JS links, explicit image loading and truthful credit', () => {
  const html = render(catalog);
  assert.equal(fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8'), html);
  assert.equal((html.match(/class="map-card"/g) || []).length, 4);
  assert.equal((html.match(/>z=\d —/g) || []).length, 13);
  assert.equal((html.match(/<img /g) || []).length, 4);
  assert.equal((html.match(/<img[^>]*\ssrc=/g) || []).length, 0);
  assert.ok(html.includes('current hosting and player access are unverified'));
  assert.ok(html.includes('Original PNG production source:'));
  assert.ok(html.includes('not relicensed under the wiki MIT license'));
  assert.ok(!html.includes('byond://') && !html.includes('<form'));
  const data = structuredClone(catalog); data.maps[0].title = '"</h2><script>alert(1)</script>';
  assert.ok(render(data).includes('&quot;&lt;/h2&gt;&lt;script&gt;'));
  assert.ok(!render(data).includes('<script>alert(1)</script>'));
  const config = fs.readFileSync(path.join(__dirname, '../../_config.yml'), 'utf8');
  assert.match(config, /exclude:[\s\S]*\n  - tools\r?\n/);
});

test('real viewer script filters without requests and only loads clicked overviews', () => {
  const node = extra => Object.assign({ hidden: false, textContent: '', listeners: {}, addEventListener(event, fn) { this.listeners[event] = fn; } }, extra);
  const requests = [];
  const cards = catalog.maps.map(map => {
    const button = node({ hidden: true });
    const image = node({ hidden: true, dataset: { src: 'https://raw.githubusercontent.com/' + map.overview.path } });
    Object.defineProperty(image, 'src', { set(value) { requests.push(value); } });
    const status = node();
    return node({ dataset: { map: map.id }, button, image, status, querySelector(selector) { return { '.load-overview': button, '.overview': image, '.image-status': status }[selector]; } });
  });
  const nodes = { '#map-choice': node({ value: 'all' }), '#map-controls': node({ hidden: true }), '#map-count': node() };
  vm.runInNewContext(source, { document: { querySelector: selector => nodes[selector], querySelectorAll: () => cards } });
  assert.equal(requests.length, 0);
  assert.equal(nodes['#map-controls'].hidden, false);
  nodes['#map-choice'].value = 'mountain'; nodes['#map-choice'].listeners.change();
  assert.deepEqual(cards.filter(card => !card.hidden).map(card => card.dataset.map), ['mountain']);
  assert.equal(nodes['#map-count'].textContent, '1 of 4 authored maps shown');
  assert.equal(requests.length, 0);
  cards[1].button.listeners.click();
  assert.equal(requests.length, 1);
  assert.equal(cards[1].image.hidden, false);
  cards[1].image.listeners.load(); assert.match(cards[1].status.textContent, /loaded/);
  cards[1].image.listeners.error(); assert.equal(cards[1].image.hidden, true); assert.match(cards[1].status.textContent, /could not load/);
  nodes['#map-choice'].value = 'all'; nodes['#map-choice'].listeners.change();
  assert.ok(cards.every(card => !card.hidden)); assert.equal(requests.length, 1);
  assert.doesNotThrow(() => vm.runInNewContext(source, { document: { querySelector: () => null, querySelectorAll: () => [] } }));
});
