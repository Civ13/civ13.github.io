'use strict';
(function () {
  const SCHEMA = 'civ13.discord-calendar.v1';
  const keys = (value, expected) => value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).sort().join(',') === [...expected].sort().join(',');
  const id = value => typeof value === 'string' && /^[1-9][0-9]{16,19}$/.test(value);
  function instant(value) {
    if (typeof value !== 'string' || !/^20\d\d-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value.replace('Z', '.000Z')) throw Error('invalid_time');
    return Date.parse(value);
  }
  function text(value, limit) {
    if (typeof value !== 'string' || !value.isWellFormed() || new TextEncoder().encode(value).length > limit || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value)) throw Error('invalid_text');
    return value;
  }
  function config(value) {
    if (!keys(value, ['enabled', 'source_url', 'guild_id']) || typeof value.enabled !== 'boolean') throw Error('invalid_configuration');
    if (!value.enabled) { if (value.source_url !== '' || value.guild_id !== '') throw Error('inactive_configuration_must_be_empty'); return value; }
    const url = new URL(value.source_url);
    if (!id(value.guild_id) || url.protocol !== 'https:' || url.port || url.username || url.password || url.search || url.hash || url.href !== value.source_url || url.pathname !== '/calendar/v1/snapshot' || !(['civ13.com', 'www.civ13.com'].includes(url.hostname) || /^[a-z0-9-]+\.valzargaming\.workers\.dev$/.test(url.hostname))) throw Error('invalid_configuration');
    return value;
  }
  function validate(snapshot, guild, now) {
    if (!keys(snapshot, ['schema', 'guild_id', 'revision', 'generated_at', 'expires_at', 'state', 'notes', 'events']) || snapshot.schema !== SCHEMA || !id(guild) || snapshot.guild_id !== guild || !Number.isSafeInteger(snapshot.revision) || snapshot.revision < 1 || !['complete', 'degraded', 'stale'].includes(snapshot.state) || !Array.isArray(snapshot.notes) || !Array.isArray(snapshot.events) || snapshot.events.length > 1000) throw Error('invalid_snapshot');
    const issued = instant(snapshot.generated_at), expires = instant(snapshot.expires_at);
    if (expires <= issued || expires - issued > 120000 || issued > now + 5000 || expires <= now) throw Error('stale_snapshot');
    const notes = ['visibility_unknown', 'recurrence_not_expanded', 'event_not_representable', 'refresh_pending', 'source_unavailable'];
    if (snapshot.notes.some(note => !notes.includes(note)) || new Set(snapshot.notes).size !== snapshot.notes.length || (snapshot.state === 'complete' && snapshot.notes.length) || (snapshot.state === 'degraded' && !snapshot.notes.length) || (snapshot.state === 'stale' && snapshot.events.length)) throw Error('invalid_coverage');
    if (snapshot.state === 'stale') throw Error('stale_snapshot');
    const seen = new Set();
    for (const event of snapshot.events) {
      if (!keys(event, ['event_id', 'uid', 'sequence', 'updated_at', 'start_at', 'end_at', 'title', 'description', 'location', 'url', 'status', 'recurrence']) || !id(event.event_id) || seen.has(event.event_id) || event.uid !== `discord-${guild}-${event.event_id}@civ13.github.io` || !Number.isSafeInteger(event.sequence) || event.sequence < 0 || event.sequence > 2147483647 || !['confirmed', 'active', 'completed', 'cancelled', 'withdrawn'].includes(event.status) || !['none', 'unknown', 'discord_only'].includes(event.recurrence)) throw Error('invalid_event');
      seen.add(event.event_id);
      const start = instant(event.start_at); instant(event.updated_at);
      if (event.end_at !== null && instant(event.end_at) <= start) throw Error('invalid_interval');
      text(event.title, 400); text(event.description, 4000); text(event.location, 400);
      if (!event.title.trim()) throw Error('invalid_event');
      if (event.status === 'withdrawn') {
        if (event.title !== 'Event no longer listed' || event.description !== 'Details withdrawn; check Discord for current information.' || event.location !== '' || event.url !== '' || event.end_at !== null || event.recurrence !== 'none') throw Error('invalid_withdrawal');
      } else if (event.url !== `https://discord.com/events/${guild}/${event.event_id}`) throw Error('invalid_event_url');
      if (event.recurrence !== 'none' && (snapshot.state !== 'degraded' || !snapshot.notes.includes('recurrence_not_expanded'))) throw Error('incomplete_recurrence_unlabelled');
    }
    return snapshot;
  }
  const escapeText = value => value.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
  function fold(line) {
    let current = '', bytes = 0; const lines = []; const encoder = new TextEncoder();
    for (const character of line) { const size = encoder.encode(character).length; if (bytes + size > 75) { lines.push(current); current = ' '; bytes = 1; } current += character; bytes += size; }
    return [...lines, current].join('\r\n');
  }
  function ics(snapshot) {
    if (!snapshot.events.length) return null;
    const stamp = value => value.replace(/[-:]/g, '');
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Civ13//Discord community snapshot//EN', 'CALSCALE:GREGORIAN'];
    for (const event of snapshot.events) {
      const note = event.recurrence === 'none' ? '' : '\nRepeating schedule is not expanded. This file includes only the displayed instance; see Discord for occurrences and exceptions.';
      lines.push('BEGIN:VEVENT', 'UID:' + event.uid, 'SEQUENCE:' + event.sequence, 'DTSTAMP:' + stamp(event.updated_at), 'LAST-MODIFIED:' + stamp(event.updated_at), 'DTSTART:' + stamp(event.start_at));
      if (event.end_at !== null) lines.push('DTEND:' + stamp(event.end_at));
      lines.push('SUMMARY:' + escapeText(event.title), 'DESCRIPTION:' + escapeText(event.description + note));
      if (event.location) lines.push('LOCATION:' + escapeText(event.location));
      if (event.url) lines.push('URL:' + event.url);
      lines.push('STATUS:' + (['cancelled', 'withdrawn'].includes(event.status) ? 'CANCELLED' : 'CONFIRMED'), 'TRANSP:TRANSPARENT', 'END:VEVENT');
    }
    return [...lines, 'END:VCALENDAR'].map(fold).join('\r\n') + '\r\n';
  }
  async function boundedResponse(response) {
    if (!response.ok || !/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') || '')) throw Error('unavailable');
    const reader = response.body.getReader(); let size = 0; const parts = [];
    try { while (true) { const {done, value} = await reader.read(); if (done) break; size += value.byteLength; if (size > 2097152) throw Error('oversized'); parts.push(value); } }
    catch (error) { await reader.cancel().catch(() => {}); throw error; }
    const bytes = new Uint8Array(size); let offset = 0; for (const part of parts) { bytes.set(part, offset); offset += part.length; }
    return JSON.parse(new TextDecoder('utf-8', {fatal:true}).decode(bytes));
  }
  function mount(root, settings, env) {
    config(settings); if (!settings.enabled) return null;
    const {document:doc, window:win, fetch:fetcher, now, monotonic, schedule, cancel, createUrl, revokeUrl} = env;
    const status = root.querySelector('[data-sync-status]'), list = root.querySelector('[data-sync-events]'), download = root.querySelector('[data-sync-download]');
    let snapshot = null, revision = 0, lastPayload = null, lease = 0, wall = 0, observed = 0, objectUrl = null, timer = null, busy = false, stopped = false, pending = null;
    function clear(message = 'Discord calendar unavailable or stale. Check the original Discord calendar.') {
      snapshot = null; lease = 0; list.replaceChildren(); status.textContent = message; download.hidden = true; download.removeAttribute('href');
      if (objectUrl !== null) { revokeUrl(objectUrl); objectUrl = null; }
    }
    function fresh() { return snapshot !== null && now() >= wall && now() < instant(snapshot.expires_at) && monotonic() >= observed && monotonic() < lease; }
    function arm() { if (timer !== null) cancel(timer); timer = schedule(() => { if (!fresh()) clear(); if (!doc.hidden) refresh(); else arm(); }, snapshot ? Math.max(1, Math.min(60000, lease - monotonic())) : 60000); }
    function add(parent, tag, value) { const node = doc.createElement(tag); node.textContent = value; parent.append(node); return node; }
    function display(value) {
      clear(); snapshot = value;
      status.textContent = value.state === 'complete' ? 'Discord event sync is up to date for ordinary members.' : 'Discord sync is incomplete: check Discord for omitted events, repeating dates and exceptions.';
      if (!value.events.length) add(list, 'p', 'No eligible Discord events are listed in this snapshot.');
      for (const event of value.events) {
        const card = doc.createElement('article'); card.className = 'home-card calendar-event';
        add(card, 'h3', event.title); add(card, 'p', event.status === 'withdrawn' ? 'Removed from website listing' : event.status[0].toUpperCase() + event.status.slice(1));
        add(card, 'p', event.start_at.replace('T', ' ').replace('Z', ' UTC') + (event.end_at ? ' to ' + event.end_at.replace('T', ' ').replace('Z', ' UTC') : ' · End time not specified'));
        add(card, 'p', event.description); if (event.location) add(card, 'p', 'Location: ' + event.location);
        if (event.recurrence !== 'none') add(card, 'p', 'Repeating schedule is not expanded here. See Discord for all occurrences and exceptions.');
        if (event.url) { const link = add(card, 'a', 'Open original Discord event'); link.href = event.url; }
        list.append(card);
      }
      const calendar = ics(value);
      if (calendar !== null) { objectUrl = createUrl(new Blob([calendar], {type:'text/calendar;charset=utf-8'})); download.href = objectUrl; download.hidden = false; }
    }
    async function refresh() {
      if (stopped || busy || doc.hidden) return;
      busy = true; const began = monotonic(); const started = now(); const controller = new AbortController(); pending = controller; const deadline = schedule(() => controller.abort(), 15000);
      try {
        const response = await fetcher(settings.source_url, {method:'GET', credentials:'omit', cache:'no-store', redirect:'error', signal:controller.signal});
        const value = validate(await boundedResponse(response), settings.guild_id, now());
        if (stopped) return;
        const elapsed = monotonic() - began;
        const payload = JSON.stringify(value);
        if (value.revision < revision || (value.revision === revision && lastPayload !== payload) || now() < started || elapsed < 0 || elapsed >= 120000) throw Error('old_response');
        const remaining = Math.min(instant(value.expires_at) - now(), 120000 - elapsed);
        if (remaining <= 0) throw Error('expired_in_transit');
        revision = value.revision; lastPayload = payload; display(value); wall = now(); observed = monotonic(); lease = observed + remaining;
      } catch { if (!stopped) clear(); }
      finally { cancel(deadline); pending = null; busy = false; if (!stopped) arm(); }
    }
    const resume = () => { if (!fresh()) clear(); if (!doc.hidden) refresh(); };
    const guardDownload = event => { if (!fresh()) { event.preventDefault(); clear(); } };
    download.addEventListener('click', guardDownload); doc.addEventListener('visibilitychange', resume); win.addEventListener('focus', resume); win.addEventListener('pageshow', resume);
    clear('Loading the Discord calendar…'); refresh();
    return {refresh, stop() { stopped = true; if (pending !== null) pending.abort(); if (timer !== null) cancel(timer); clear(); download.removeEventListener('click', guardDownload); doc.removeEventListener('visibilitychange', resume); win.removeEventListener('focus', resume); win.removeEventListener('pageshow', resume); }};
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {config, validate, ics, fold, boundedResponse, mount};
  if (typeof document === 'undefined') return;
  const root = document.querySelector('#discord-calendar'); if (!root) return;
  try { mount(root, {enabled:true,source_url:root.dataset.source,guild_id:root.dataset.guild}, {document,window,fetch:window.fetch.bind(window),now:Date.now,monotonic:()=>performance.now(),schedule:setTimeout,cancel:clearTimeout,createUrl:URL.createObjectURL.bind(URL),revokeUrl:URL.revokeObjectURL.bind(URL)}); }
  catch { root.querySelector('[data-sync-status]').textContent = 'Discord calendar configuration unavailable. Check Discord for current events.'; }
})();
