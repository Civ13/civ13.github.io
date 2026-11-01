'use strict';
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');
const SOURCE = path.join(__dirname, 'events.json');

function exactKeys(value, keys) {
  return value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).sort().join(',') === [...keys].sort().join(',');
}

function text(value, maxBytes, multiline = false) {
  if (typeof value !== 'string' || !value.trim() || !value.isWellFormed() ||
      Buffer.byteLength(value, 'utf8') > maxBytes ||
      (multiline ? /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/ : /[\x00-\x1f\x7f]/).test(value)) throw new Error('invalid_event_text');
  return value;
}

// Explicit instants only. Validate the civil date before applying its supplied offset.
function instant(value) {
  if (typeof value !== 'string') throw new Error('explicit_time_required');
  const parts = /^(20\d\d)-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(Z|([+-])(\d{2}):(\d{2}))$/.exec(value);
  if (!parts) throw new Error('explicit_time_required');
  const [, year, month, day, hour, minute, second, zone, sign, offsetHour, offsetMinute] = parts;
  const [y, mo, d, h, mi, s] = [year, month, day, hour, minute, second].map(Number);
  const civil = Date.UTC(y, mo - 1, d, h, mi, s);
  const check = new Date(civil);
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d ||
      check.getUTCHours() !== h || check.getUTCMinutes() !== mi || check.getUTCSeconds() !== s) throw new Error('invalid_civil_time');
  const oh = Number(offsetHour || 0), om = Number(offsetMinute || 0);
  if (oh > 14 || om > 59 || (oh === 14 && om !== 0) || zone === '-00:00') throw new Error('invalid_time_offset');
  const offset = (oh * 60 + om) * (sign === '-' ? -1 : 1);
  const stamp = civil - offset * 60000;
  const iso = new Date(stamp).toISOString().replace('.000Z', 'Z');
  if (!iso.startsWith('20')) throw new Error('time_out_of_range');
  return { stamp, iso, ics: iso.replace(/[-:]/g, ''), label: iso.replace('T', ' ').replace('Z', ' UTC') };
}

function publicUrl(value) {
  if (typeof value !== 'string') throw new Error('invalid_event_url');
  let url;
  try { url = new URL(value); } catch { throw new Error('invalid_event_url'); }
  const approved = (url.host === 'civ13.github.io') ||
    (url.host === 'discord.com' && /^\/events\/\d{17,20}\/\d{17,20}\/?$/.test(url.pathname));
  if (!approved || url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.href !== value) throw new Error('invalid_event_url');
  return value;
}

function validate(source) {
  if (!exactKeys(source, ['schema', 'events']) || source.schema !== 'civ13.events.v1' ||
      !Array.isArray(source.events) || source.events.length > 64) throw new Error('invalid_calendar');
  const ids = new Set();
  return source.events.map(event => {
    if (!exactKeys(event, ['id', 'sequence', 'updated_at', 'start_at', 'end_at', 'title', 'description', 'location', 'url', 'status']) ||
        typeof event.id !== 'string' || !/^[a-z][a-z0-9-]{0,63}$/.test(event.id) || ids.has(event.id) ||
        !Number.isSafeInteger(event.sequence) || event.sequence < 0 || event.sequence > 2147483647 ||
        !['confirmed', 'cancelled'].includes(event.status)) throw new Error('invalid_event');
    ids.add(event.id);
    const start = instant(event.start_at), end = instant(event.end_at), updated = instant(event.updated_at);
    if (end.stamp <= start.stamp || end.stamp - start.stamp > 7 * 86400000) throw new Error('invalid_event_duration');
    return {
      id: event.id, uid: event.id + '@civ13.github.io', sequence: event.sequence,
      updated_at: updated.iso, start_at: start.iso, end_at: end.iso,
      start_label: start.label, end_label: end.label,
      title: text(event.title, 200), description: text(event.description, 4000, true),
      location: text(event.location, 200), url: publicUrl(event.url), status: event.status
    };
  }).sort((a, b) => a.start_at < b.start_at ? -1 : a.start_at > b.start_at ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

function escapeText(value) {
  return value.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}

function fold(line) {
  const lines = [];
  let current = '', octets = 0;
  for (const character of line) {
    const size = Buffer.byteLength(character, 'utf8');
    if (octets + size > 75) {
      lines.push(current);
      current = ' ';
      octets = 1;
    }
    current += character;
    octets += size;
  }
  lines.push(current);
  return lines.join('\r\n');
}

function build(source) {
  const events = validate(source);
  const data = JSON.stringify({ schema: source.schema, events }, null, 2) + '\n';
  // RFC 5545 requires at least one component. Empty configuration has no ICS download.
  if (!events.length) return { data, ics: null };
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Civ13//Public community events//EN', 'CALSCALE:GREGORIAN'];
  for (const event of events) {
    lines.push('BEGIN:VEVENT', 'UID:' + event.uid, 'SEQUENCE:' + event.sequence,
      'DTSTAMP:' + instant(event.updated_at).ics, 'LAST-MODIFIED:' + instant(event.updated_at).ics,
      'DTSTART:' + instant(event.start_at).ics, 'DTEND:' + instant(event.end_at).ics,
      'SUMMARY:' + escapeText(event.title), 'DESCRIPTION:' + escapeText(event.description),
      'LOCATION:' + escapeText(event.location), 'URL:' + event.url,
      'STATUS:' + event.status.toUpperCase(), 'TRANSP:TRANSPARENT', 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return {
    data,
    ics: lines.map(fold).join('\r\n') + '\r\n'
  };
}

module.exports = { instant, validate, escapeText, fold, build };

if (require.main === module) {
  try {
    const mode = process.argv[2] || '--check';
    if (process.argv.length > 3 || !['--write', '--check'].includes(mode)) throw new Error('usage_build_check_or_write');
    const output = build(JSON.parse(fs.readFileSync(SOURCE, 'utf8')));
    for (const [relative, contents] of [['_data/community_calendar.json', output.data], ['public/calendar/civ13.ics', output.ics]]) {
      const target = path.join(ROOT, relative);
      if (contents === null) {
        if (mode === '--write' && fs.existsSync(target)) fs.unlinkSync(target);
        else if (fs.existsSync(target)) throw new Error('generated_calendar_out_of_date');
        continue;
      }
      if (mode === '--write') {
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, contents, 'utf8');
      } else if (fs.readFileSync(target, 'utf8') !== contents) throw new Error('generated_calendar_out_of_date');
    }
    console.log(mode === '--write' ? 'Calendar generated from reviewed local source' : 'Generated calendar matches source');
  } catch (error) {
    console.error(/^(invalid_|explicit_|time_|usage_|generated_)/.test(error.message) ? error.message : 'calendar_input_or_output_unavailable');
    process.exitCode = 1;
  }
}
