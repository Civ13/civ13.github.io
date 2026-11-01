'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

function exactKeys(value, keys) {
  return value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).sort().join(',') === [...keys].sort().join(',');
}

function validate(plan) {
  if (!exactKeys(plan, ['schema', 'enabled', 'interval_seconds', 'targets']) ||
      plan.schema !== 'civ13.public-monitoring.v1' || plan.enabled !== false ||
      !Number.isInteger(plan.interval_seconds) || plan.interval_seconds < 300 ||
      plan.interval_seconds > 86400 || !Array.isArray(plan.targets) ||
      plan.targets.length < 1 || plan.targets.length > 20) throw new Error('invalid_inactive_plan');
  const ids = new Set();
  const urls = new Set();
  for (const target of plan.targets) {
    if (!exactKeys(target, ['id', 'url', 'marker']) ||
        typeof target.id !== 'string' || !/^[a-z][a-z0-9-]{0,47}$/.test(target.id) || ids.has(target.id) ||
        typeof target.url !== 'string' || typeof target.marker !== 'string' ||
        !target.marker.trim() || target.marker.length > 100 || /[\x00-\x1f\x7f]/.test(target.marker)) throw new Error('invalid_target');
    let url;
    try { url = new URL(target.url); } catch { throw new Error('invalid_public_url'); }
    if (url.protocol !== 'https:' || url.host !== 'civ13.github.io' || url.username || url.password ||
        url.search || url.hash || !['/', '/civ13-wiki/', '/Civ13/', '/Civ13/crafting/'].includes(url.pathname) ||
        target.url !== url.href || urls.has(url.href)) throw new Error('invalid_public_url');
    ids.add(target.id);
    urls.add(url.href);
  }
  return plan;
}

// Pure projection of an already supplied sample. No fetch, ping, timer or alert transport.
function evaluate(target, observation) {
  if (!observation) return { id: target.id, state: 'unknown', reason: 'no_sample' };
  if (!Number.isInteger(observation.status_code)) return { id: target.id, state: 'unknown', reason: 'transport_unavailable' };
  if (observation.status_code !== 200) return { id: target.id, state: 'down', reason: 'http_status' };
  if (typeof observation.content_type !== 'string' ||
      observation.content_type.split(';')[0].trim().toLowerCase() !== 'text/html') return { id: target.id, state: 'down', reason: 'content_type' };
  if (typeof observation.body !== 'string') return { id: target.id, state: 'unknown', reason: 'missing_body' };
  if (Buffer.byteLength(observation.body, 'utf8') > 1048576) return { id: target.id, state: 'unknown', reason: 'body_limit' };
  if (!observation.body.toLowerCase().includes(target.marker.toLowerCase())) return { id: target.id, state: 'down', reason: 'content_marker' };
  return { id: target.id, state: 'http_available', reason: 'status_and_marker' };
}

function checkObservations(plan, observations) {
  if (!Array.isArray(observations) || observations.length > plan.targets.length) throw new Error('invalid_samples');
  const samples = new Map();
  for (const observation of observations) {
    if (!exactKeys(observation, ['id', 'status_code', 'content_type', 'body']) ||
        !plan.targets.some(target => target.id === observation.id) || samples.has(observation.id) ||
        !(observation.status_code === null || (Number.isInteger(observation.status_code) && observation.status_code >= 100 && observation.status_code <= 599)) ||
        !(observation.content_type === null || typeof observation.content_type === 'string') ||
        !(observation.body === null || typeof observation.body === 'string')) throw new Error('invalid_samples');
    samples.set(observation.id, observation);
  }
  return plan.targets.map(target => evaluate(target, samples.get(target.id)));
}

module.exports = { validate, evaluate, checkObservations };

if (require.main === module) {
  try {
    if (process.argv.length > 4) throw new Error('usage_check_plan_optional_samples');
    const plan = validate(JSON.parse(fs.readFileSync(process.argv[2] || path.join(__dirname, 'plan.json'), 'utf8')));
    const result = process.argv[3]
      ? checkObservations(plan, JSON.parse(fs.readFileSync(process.argv[3], 'utf8')))
      : { state: 'inactive_plan_valid', targets: plan.targets.length, interval_seconds: plan.interval_seconds };
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } catch (error) {
    const known = /^(invalid_|usage_)/.test(error.message);
    process.stderr.write((known ? error.message : 'input_unavailable_or_invalid_json') + '\n');
    process.exitCode = 1;
  }
}
