'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {refresh} = require('../public/js/roadmap.js');
const target = path.join(__dirname, '../_data/roadmap.json');
(async () => {
  const original = JSON.parse(fs.readFileSync(target, 'utf8'));
  const updated = await refresh(original, async e => {
    const response = await fetch(`https://api.github.com/repos/${e.repository}/pulls/${e.number}`, {
      headers: {Accept: 'application/vnd.github+json', ...(process.env.GH_TOKEN ? {Authorization: `Bearer ${process.env.GH_TOKEN}`} : {})},
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
    return response.json();
  });
  const text = JSON.stringify(updated, null, 2) + '\n';
  if (JSON.stringify(original) !== JSON.stringify(updated)) {
    fs.writeFileSync(target + '.tmp', text);
    fs.renameSync(target + '.tmp', target);
  }
})().catch(error => { console.error(`Roadmap refresh failed; saved data unchanged: ${error.message}`); process.exitCode = 1; });
