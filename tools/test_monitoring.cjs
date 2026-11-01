'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { validate, evaluate, checkObservations } = require('./monitoring/check.cjs');
const plan = require('./monitoring/plan.json');
const copy = () => JSON.parse(JSON.stringify(plan));

test('review inventory is inactive and contains four unique public targets', () => {
  assert.equal(validate(plan), plan);
  assert.equal(plan.targets.length, 4);
  assert.deepEqual(checkObservations(plan, []).map(row => row.state), ['unknown', 'unknown', 'unknown', 'unknown']);
});

test('reject activation, private/control URLs, malformed plans and quota evasion', () => {
  for (const mutate of [
    p => { p.enabled = true; },
    p => { p.interval_seconds = 1; },
    p => { p.targets[0].url = 'https://127.0.0.1/'; },
    p => { p.targets[0].url = 'https://civ13.github.io@evil.example/'; },
    p => { p.targets[0].url = 'https://civ13.github.io/verified'; },
    p => { p.targets[0].url = 'https://civ13.github.io/?token=private'; },
    p => { p.targets[0].url = 'byond://civ13.com:1715'; },
    p => { p.targets[0].url = 'https://name:secret@civ13.github.io/'; },
    p => { p.targets[0].marker = ''; },
    p => { p.targets.push(p.targets[0]); },
    p => { p.webhook = 'private'; }
  ]) {
    const changed = copy();
    mutate(changed);
    assert.throws(() => validate(changed));
  }
});

test('HTTP available is distinct from missing, transport, status and content failures', () => {
  const target = plan.targets[0];
  const good = { id: target.id, status_code: 200, content_type: 'text/html; charset=utf-8', body: '<title>Civilization 13</title>' };
  assert.equal(evaluate(target, good).state, 'http_available');
  assert.equal(evaluate(target).reason, 'no_sample');
  assert.equal(evaluate(target, { ...good, status_code: null }).reason, 'transport_unavailable');
  assert.equal(evaluate(target, { ...good, status_code: 503 }).reason, 'http_status');
  assert.equal(evaluate(target, { ...good, status_code: 302 }).reason, 'http_status');
  assert.equal(evaluate(target, { ...good, content_type: 'application/json' }).reason, 'content_type');
  assert.equal(evaluate(target, { ...good, body: '<title>Error</title>' }).reason, 'content_marker');
  assert.equal(evaluate(target, { ...good, body: null }).reason, 'missing_body');
  assert.equal(evaluate(target, { ...good, body: 'x'.repeat(1048577) }).reason, 'body_limit');
  assert.equal(checkObservations(plan, [good])[1].state, 'unknown');
  assert.throws(() => checkObservations(plan, [good, good]), /invalid_samples/);
  assert.throws(() => checkObservations(plan, [{ ...good, id: 'unregistered' }]), /invalid_samples/);
});
