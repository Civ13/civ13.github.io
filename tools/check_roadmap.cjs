'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {validate} = require('../public/js/roadmap.js');
const root = process.argv[2] || '_site';
const html = fs.readFileSync(path.join(root, 'roadmap.html'), 'utf8');
const embedded = html.match(/<script id="roadmap-data" type="application\/json">([\s\S]*?)<\/script>/);
assert.ok(embedded, 'Missing static roadmap data');
const data = validate(JSON.parse(embedded[1]));
for (const m of data.milestones) {
  assert.ok(html.includes(`data-milestone="${m.id}"`), `Missing static card ${m.id}`);
  assert.ok(html.includes(m.title), `Missing readable title ${m.id}`);
}
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.match(home, /href="[^"]*\/roadmap\.html"[^>]*>Roadmap<\/a>/, 'Roadmap missing from home navigation');
assert.match(html, /last saved roadmap|latest saved progress/, 'Missing fallback explanation');
console.log('Built roadmap data, static cards and home navigation verified');
