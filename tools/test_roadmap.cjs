'use strict';
const assert = require('node:assert/strict');
const {test} = require('node:test');
const {validate, refresh} = require('../public/js/roadmap.js');
const registry = require('../_data/roadmap.json');
const copy = () => JSON.parse(JSON.stringify(registry));
const pr = (e, state = 'merged') => ({number: e.number, base: {repo: {full_name: e.repository}}, draft: state === 'draft', state: ['merged', 'closed'].includes(state) ? 'closed' : 'open', merged: state === 'merged', merge_commit_sha: state === 'merged' ? 'a'.repeat(40) : null});
test('registry is valid and merged prerequisites never complete milestones or imply live', async () => {
  const next = await refresh(copy(), async e => pr(e));
  assert.equal(next.milestones[0].status, 'in_progress');
  assert.equal(next.milestones[1].status, 'in_progress');
  assert.ok(next.milestones.every(m => m.availability === 'unverified'));
});
test('only reviewed exhaustive implementation acceptance advances a goal', async () => {
  const data = copy(), m = data.milestones[1];
  m.completion = {acceptance_verified: true, basis: 'Required gameplay and recovery contracts verified', required_prs: m.evidence.map(e => `${e.repository}#${e.number}`)};
  const partial = await refresh(data, async e => pr(e, e.number === 3118 ? 'open' : 'merged'));
  assert.equal(partial.milestones[1].status, 'in_progress');
  const done = await refresh(data, async e => pr(e));
  assert.equal(done.milestones[1].status, 'completed');
  assert.equal(done.milestones[1].availability, 'unverified');
});
test('failed refresh is atomic and leaves original last-known-good unchanged', async () => {
  const data = copy(), before = JSON.stringify(data);
  await assert.rejects(refresh(data, async e => { if (e.number === 3118) throw new Error('Rate limit'); return pr(e); }));
  assert.equal(JSON.stringify(data), before);
});
test('planned drafts stay planned; open implementation advances without downgrading existing progress', async () => {
  const planned = copy(); planned.milestones[1].status = 'planned';
  const drafts = await refresh(planned, async e => pr(e, e.number === 3147 ? 'merged' : 'draft'));
  assert.equal(drafts.milestones[1].status, 'planned');
  const active = await refresh(planned, async e => pr(e, e.number === 3082 ? 'open' : 'draft'));
  assert.equal(active.milestones[1].status, 'in_progress');
  const progressed = copy(); progressed.milestones[1].status = 'in_progress';
  const staleDrafts = await refresh(progressed, async e => pr(e, 'draft'));
  assert.equal(staleDrafts.milestones[1].status, 'in_progress');
});
test('wrong repository, malformed merge, unreviewed acceptance and invented availability fail closed', async () => {
  await assert.rejects(refresh(copy(), async e => ({...pr(e), base: {repo: {full_name: 'other/repo'}}})));
  await assert.rejects(refresh(copy(), async e => ({...pr(e), merge_commit_sha: null})));
  const data = copy(); data.milestones[0].completion = {acceptance_verified: false, basis: 'Unverified', required_prs: ['Civ13/Civ13#3147']};
  assert.throws(() => validate(data));
  const live = copy(); live.milestones[0].availability = 'verified'; assert.throws(() => validate(live));
});
