# Discord calendar consumer (inactive)

`_data/discord_calendar.json` defaults off with no source URL or guild. Manual
calendar generation is unchanged. There are no Discord details in generated HTML,
Jekyll data, preview metadata or persistent browser storage. The browser consumer
imports only the producer's `civ13.discord-calendar.v1` sanitized snapshot.

The existing Civilizationbot source owns the single Gateway and a durable private
revision/cancellation ledger. It never sends attendees, creators or channel/role
records to this website. Its default-off adapter can serve the fixed read-only
path `/calendar/v1/snapshot` using existing HTTP infrastructure. Main must review
that producer and the intended HTTPS delivery before enabling this consumer.
No new Worker route, account, credential or deployment is created here. The
separate public-services owner retains proxy/directory/launcher ownership.

On an approved deployment, set `enabled` true and explicitly review `guild_id`
and `source_url`. Supported source hosts are civ13.com, www.civ13.com, or a
service under the existing valzargaming.workers.dev account; the URL must use HTTPS,
the exact snapshot path, and no port/query/credentials/fragment. This is a fixed
reviewed configuration, never a URL entered by a visitor. Main owns activation.

The consumer requests that sanitized source without cookies/cache/redirects,
at most once per minute while visible and on focus/page restoration. It never
polls Discord itself. Requests are bounded to 15 seconds and 2 MiB, require JSON
and fatal UTF-8 decoding, and validate an exact allowlisted schema/guild/UID.
Revisions cannot roll back or change bytes at the same revision in one page.
No subscriber data or user queries are sent. Full snapshot details are inserted
as text nodes only. Ordinary-member visibility is the producer's reviewed
@everyone/onboarding profile, never the bot's administrator visibility.

Fresh details and the Blob download are removed on failed/stale responses, absolute
expiry, monotonic expiry, clock rollback or resuming an expired page. The download
click also checks freshness so a delayed timer cannot permit stale downloads.
Hidden tabs do not fetch; resume removes expired data before requesting new data.
There is no stale fallback. Without JavaScript, only original Discord guidance and
the separate manually authored calendar remain available.

Missing event ends remain unspecified and ICS omits DTEND. Recurring series stay
visible but explicitly degraded: no RRULE or invented future instances, and the
download describes its single displayed instance. Discord is the authority for
occurrences/exceptions. Withdrawals use the original UID and increased SEQUENCE,
but contain generic text and no former restricted details. They are retained by
the producer with withdrawal-observation time rather than the old event schedule;
the page labels that removal time. They remain exported for the cancellation window,
30 days. ICS line escaping/75-octet UTF-8 folding are tested.
Imported downloads remain static copies; this does not create subscriptions or
promise that already downloaded private details can be recalled.

Run `node --test tools/test_discord_calendar.cjs` and the existing Jekyll checks.
The synthetic producer fixture is byte-identical to Civilizationbot's
`tests/calendar/snapshot.fixture.json`; the producer test regenerates and compares
it using its actual projection and ledger. Keep both reviews in step. No real
events are in this fixture or the empty manual event source.

For visual review only, copy `preview.html` and `discord-snapshot.fixture.json`
into the root of a temporary copy of the exact-head generated site. Serve that
temporary root on loopback. The page loads the actual consumer/CSS and injects a
local fixture response, with controls for withdrawal, expiry, outage and recovery.
It never contacts the configured public source. Do not copy this harness into
published output; `tools/` remains excluded by Jekyll.
