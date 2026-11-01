'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { instant, validate, fold, build } = require('./calendar/build.cjs');
const empty = require('./calendar/events.json');

function fixture() {
  return { schema: 'civ13.events.v1', events: [{
    id: 'synthetic-test-only', sequence: 0, updated_at: '2026-10-31T12:00:00Z',
    start_at: '2026-11-01T01:30:00-04:00', end_at: '2026-11-01T01:30:00-05:00',
    title: 'Synthetic test only', description: 'Not a scheduled Civ13 event.',
    location: 'Offline fixture', url: 'https://civ13.github.io/', status: 'confirmed'
  }] };
}

test('approved source is explicitly empty and generates no fictitious events', () => {
  assert.deepEqual(empty, { schema: 'civ13.events.v1', events: [] });
  const output = build(empty);
  assert.equal(output.ics, null, 'empty calendars cannot satisfy the required component grammar');
  assert.deepEqual(JSON.parse(output.data).events, []);
});

test('fall-back offsets represent separate instants and rollover stays in UTC', () => {
  const result = validate(fixture())[0];
  assert.equal(result.start_at, '2026-11-01T05:30:00Z');
  assert.equal(result.end_at, '2026-11-01T06:30:00Z');
  assert.equal(instant('2026-01-01T00:15:00+05:30').iso, '2025-12-31T18:45:00Z');
  assert.equal(instant('2028-02-29T12:00:00Z').ics, '20280229T120000Z');
  const output = build(fixture()).ics;
  assert.match(output, /DTSTART:20261101T053000Z\r\nDTEND:20261101T063000Z/);
  assert.doesNotMatch(output, /TZID|VTIMEZONE/);
});

test('refuse floating, impossible, unknown-offset and unsupported times', () => {
  for (const value of ['2026-11-01T01:30:00', '2026-11-01', '2027-02-29T12:00:00Z', '2026-04-31T12:00:00Z',
    '2026-01-01T24:00:00Z', '2026-01-01T12:60:00Z', '2026-01-01T12:00:60Z', '2026-01-01T12:00:00.5Z',
    '2026-01-01T12:00:00-00:00', '2026-01-01T12:00:00+14:01', '2026-01-01T12:00:00+01:60', 'Europe/London']) {
    assert.throws(() => instant(value), value);
  }
});

test('stable UID, sequence and explicit cancellation survive updates', () => {
  const input = fixture();
  const first = build(input).ics;
  input.events[0].sequence = 1;
  input.events[0].updated_at = '2026-11-01T04:00:00Z';
  input.events[0].status = 'cancelled';
  const next = build(input).ics;
  assert.match(first, /UID:synthetic-test-only@civ13.github.io/);
  assert.match(next, /UID:synthetic-test-only@civ13.github.io/);
  assert.match(next, /SEQUENCE:1\r\n/);
  assert.match(next, /STATUS:CANCELLED\r\n/);
  assert.doesNotMatch(next, /METHOD:|ATTENDEE|ORGANIZER|VALARM/);
});

test('text escaping prevents content-line injection and folding preserves Unicode', () => {
  const input = fixture();
  input.events[0].description = 'A, B; C\\D\r\nBEGIN:VEVENT\n' + '🧭é'.repeat(60);
  const output = build(input).ics;
  assert.equal(output.split('BEGIN:VEVENT').length - 1, 2); // One escaped text occurrence, one component.
  const physical = output.split('\r\n');
  assert.equal(physical.filter(line => line === 'BEGIN:VEVENT').length, 1);
  assert.ok(physical.every(line => Buffer.byteLength(line, 'utf8') <= 75));
  assert.ok(!output.replace(/\r\n/g, '').includes('\n'));
  const unfolded = output.replace(/\r\n /g, '');
  assert.ok(unfolded.includes('DESCRIPTION:A\\, B\\; C\\\\D\\nBEGIN:VEVENT\\n' + '🧭é'.repeat(60)));
  assert.equal(fold('x'.repeat(74) + '🧭').replace(/\r\n /g, ''), 'x'.repeat(74) + '🧭');
});

test('reject duplicate IDs, unsafe URLs, controls and invalid event bounds', () => {
  for (const mutate of [
    p => p.events.push(p.events[0]), p => { p.events[0].sequence = -1; },
    p => { p.events[0].end_at = p.events[0].start_at; },
    p => { p.events[0].end_at = '2027-01-01T00:00:00Z'; },
    p => { p.events[0].url = 'https://name:secret@civ13.github.io/'; },
    p => { p.events[0].url = 'https://civ13.github.io/?token=secret'; },
    p => { p.events[0].url = 'https://example.com/'; },
    p => { p.events[0].url = 'https://discord.com/channels/123/456'; },
    p => { p.events[0].title = 'Title\r\nBEGIN:VEVENT'; },
    p => { p.events[0].description = '\u0000'; },
    p => { p.events[0].title = '\ud800'; },
    p => { p.events[0].title = 'é'.repeat(101); },
    p => { p.events[0].attendees = ['private']; }
  ]) { const input = fixture(); mutate(input); assert.throws(() => build(input)); }
  const input = fixture();
  input.events[0].url = 'https://discord.com/events/468979034571931648/123456789012345678';
  assert.doesNotThrow(() => build(input));
});

test('output ordering and bytes do not depend on input order or build timezone', () => {
  const input = fixture();
  input.events.push({ ...input.events[0], id: 'another-fixture', start_at: '2026-11-02T09:00:00Z', end_at: '2026-11-02T10:00:00Z' });
  const expected = build(input);
  input.events.reverse();
  assert.deepEqual(build(input), expected);
  const script = 'process.stdout.write(require("./tools/calendar/build.cjs").build(' + JSON.stringify(input) + ').ics)';
  for (const TZ of ['UTC', 'America/New_York', 'Pacific/Auckland']) {
    const result = spawnSync(process.execPath, ['-e', script], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8', env: { ...process.env, TZ } });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, expected.ics, TZ);
  }
});

test('generated tracked outputs exactly match the reviewed empty source', () => {
  const output = build(empty);
  assert.equal(fs.readFileSync(path.join(__dirname, '../_data/community_calendar.json'), 'utf8'), output.data);
  const ics = path.join(__dirname, '../public/calendar/civ13.ics');
  if (output.ics === null) assert.equal(fs.existsSync(ics), false);
  else assert.equal(fs.readFileSync(ics, 'utf8'), output.ics);
});
