'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { matches } = require('../public/js/player-help.js');
const resources = require('../_data/help_resources.json');

test('curated catalog has unique identities and only approved public destinations', () => {
  assert.equal(new Set(resources.map(row => row.id)).size, resources.length);
  for (const row of resources) {
    for (const field of ['id', 'title', 'category', 'description', 'keywords', 'url', 'source']) assert.equal(typeof row[field], 'string');
    const url = new URL(row.url, 'https://civ13.github.io');
    assert.equal(url.protocol, 'https:');
    assert.ok(['civ13.github.io', 'discord.gg', 'github.com'].includes(url.host));
    assert.equal(url.username + url.password + url.search, '');
  }
});

test('player questions lead to the appropriate existing guide and retain category scope', () => {
  const find = (query, category = 'all') => resources.filter(row => matches([row.title, row.description, row.keywords, row.source].join(' '), row.category, query, category)).map(row => row.id);
  assert.ok(find('inventory controls').includes('first-round'));
  assert.ok(find('bronze kiln').includes('crafting'));
  assert.ok(find('nomads').includes('nomads'));
  assert.ok(find('source code').includes('source'));
  assert.ok(!find('bronze', 'Getting started').includes('crafting'));
  assert.deepEqual(find('unfindable-test-phrase'), []);
  assert.equal(find('  ').length, resources.length);
  assert.equal(matches('Cafe raw hide', 'topic', 'CAFÉ raw_hide', 'all'), true);
  assert.equal(matches('controls', 'topic', '<script>.*', 'all'), false);
});

test('actual browser script filters cards, announces counts and restores browsing', () => {
  const element = value => ({ value, hidden: true, textContent: '', listeners: {}, addEventListener(name, fn) { this.listeners[name] = fn; } });
  const nodes = { '#help-finder': element(), '#help-search': element(''), '#help-category': element('all'), '#help-count': element(), '#help-empty': element() };
  const cards = resources.map(row => ({ hidden: false, textContent: [row.title, row.description, row.source].join(' '), dataset: { category: row.category, keywords: row.keywords } }));
  const document = { querySelector: selector => nodes[selector], querySelectorAll: () => cards };
  const source = fs.readFileSync(path.join(__dirname, '../public/js/player-help.js'), 'utf8');
  vm.runInNewContext(source, { document });
  assert.equal(nodes['#help-finder'].hidden, false);
  assert.equal(nodes['#help-count'].textContent, `${cards.length} of ${cards.length} guide links shown`);
  nodes['#help-search'].value = 'bronze';
  nodes['#help-search'].listeners.input();
  assert.equal(cards.filter(card => !card.hidden).length, 1);
  nodes['#help-category'].value = 'Contributing';
  nodes['#help-category'].listeners.change();
  assert.equal(nodes['#help-empty'].hidden, false);
  nodes['#help-search'].value = '';
  nodes['#help-category'].value = 'all';
  nodes['#help-category'].listeners.change();
  assert.ok(cards.every(card => !card.hidden));
  assert.equal(nodes['#help-empty'].hidden, true);
  assert.doesNotThrow(() => vm.runInNewContext(source, { document: { querySelector: () => null, querySelectorAll: () => [] } }));
});
