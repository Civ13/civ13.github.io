# Static community calendar

Source plan: add a calendar page and a downloadable iCalendar file alongside
the existing game-mode/event guidance. There is no scheduled event data in that
guidance, so `events.json` is explicitly empty. Examples in tests are synthetic
and never become website events. This slice does not create Discord events,
scrape announcements, subscribe users, send notifications or operate a game.

## Generate and verify

Node 22 or newer, no added dependencies:

```text
node tools/calendar/build.cjs --write
node tools/calendar/build.cjs --check
node --test tools/test_calendar.cjs
```

`--write` updates only `_data/community_calendar.json` and, for nonempty event
lists, `public/calendar/civ13.ics`. With empty configuration it removes that
generated ICS file and the page omits its download link: RFC 5545 requires at
least one calendar component. No dummy event is invented to satisfy that rule.
Commit the generated changes with the source change. The default
`--check` mode only reads local files and rejects drift. The source and tools
remain under the existing Jekyll `tools` exclusion. Neither mode opens a socket
or uses credentials. Preserve CRLF bytes in the ICS file; its Git attribute
disables automatic newline conversion.

## Event contract

The only source keys are `schema: "civ13.events.v1"` and `events` (up to 64).
Each event must contain exactly:

- `id`: permanent lowercase letters/digits/hyphens, beginning with a letter,
  at most 64 characters. It produces the stable UID `id@civ13.github.io`.
- `sequence`: integer 0 through 2147483647. Increase it for each published
  change to a known event; never reuse an ID for a different event.
- `updated_at`, `start_at`, `end_at`: second-resolution ISO timestamps with
  uppercase `Z` or an explicit numeric offset, such as `2026-11-01T01:30:00-04:00`.
  End must follow start, by no more than seven days. Years 2000 through 2099
  are supported. Ambiguous floating times, zone-name guessing, all-day dates,
  leap seconds, fractional seconds and recurrence are rejected/unsupported.
- `title`, `description`, `location`: public text, limited to 200, 4000 and 200
  UTF-8 bytes respectively. Only description accepts line breaks.
- `url`: original public announcement, using HTTPS on `civ13.github.io`, or
  `discord.com/events/<guild ID>/<event ID>`. No credentials, query or fragment.
- `status`: `confirmed` or `cancelled`.

The event owner must review the original public announcement, the intended
offset during daylight-saving changes, and the normalized UTC output. Offset
syntax establishes an instant, not that a named region used that offset then.
The repeated 01:30 at a fall-back boundary is two different instants when its
offsets differ. The build host's timezone never determines an event's meaning.

Keep a cancellation with the same ID and a higher sequence/updated timestamp.
This generator validates one snapshot; it cannot establish that a later input
advanced its sequence or that an announcement remains current. Review source
history before publishing updates or removing cancellation records. ICS carries
STATUS and SEQUENCE but no invitation method, attendees, organizer, alarms or
automatic subscription. Imported copies may require a fresh download/import;
calendar clients differ in how they reconcile revisions and cancellations.

Dates on the website are visibly UTC and remain usable without JavaScript.
The page has an explicit empty state, rather than made-up dates or availability.
The ICS uses UTC DTSTART/DTEND, escaped text, CRLF endings and UTF-8-safe folds
of at most 75 octets including continuation spaces. See
[RFC 5545 sections 3.1, 3.3.5, 3.3.11, 3.8.4.7 and 3.8.7](https://www.rfc-editor.org/rfc/rfc5545.html).

## Review and publication

This source packet is prepared locally for Main review before branch publication.
Website master merges publish Pages, so publication needs its own authorization.
Before that action: run the exact-head Jekyll workflow, inspect generated desktop
and mobile output, check the empty state has no broken download, and use synthetic fixture events
to inspect dates, escaped text and cancellation presentation. A separate review
must approve real event data. Monitoring remains inactive and is not a dependency.
