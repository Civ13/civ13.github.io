'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {validate, statusLabel} = require('../public/js/roadmap.js');
const root = process.argv[2] || '_site';
const html = fs.readFileSync(path.join(root, 'roadmap.html'), 'utf8');
const embedded = html.match(/<script id="roadmap-data" type="application\/json">([\s\S]*?)<\/script>/);
assert.ok(embedded, 'Missing static roadmap data');
const data = validate(JSON.parse(embedded[1]));
assert.doesNotMatch(html, /code complete/i, 'Obsolete roadmap label is still rendered');
for (const m of data.milestones) {
  const card = html.match(new RegExp(`<article[^>]+data-milestone="${m.id}"[^>]*>([\\s\\S]*?)</article>`));
  assert.ok(card, `Missing static card ${m.id}`);
  assert.ok(card[1].includes(`<p class="roadmap-status">${statusLabel(m)}</p>`), `Wrong status for ${m.id}`);
  assert.ok(html.includes(m.title), `Missing readable title ${m.id}`);
  const details = card[1].match(/<details><summary>Development progress<\/summary>([\s\S]*?)<\/details>/);
  assert.ok(details, `Missing progress dropdown for ${m.id}`);
  const expected = [...m.evidence, ...(m.references || [])].map(e => `https://github.com/${e.repository}/pull/${e.number}`);
  const actual = [...details[1].matchAll(/<a href="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(actual, expected, `Wrong progress links for ${m.id}`);
  assert.doesNotMatch([m.title, m.summary, m.availability_note].join(' '), /#\d+|\bPR \d+/, `Unlinked PR number in ${m.id}`);
}
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.match(home, /href="[^"]*\/roadmap\.html"[^>]*>Roadmap<\/a>/, 'Roadmap missing from home navigation');
assert.match(html, /last saved roadmap|latest saved progress/, 'Missing fallback explanation');
console.log('Built roadmap data, static cards and home navigation verified');
