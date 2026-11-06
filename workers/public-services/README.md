# Civ13 public directory and launcher metadata

A separate, read-only Cloudflare Worker for public Civ13 information. It does
not run a game server, query a BYOND port, bootstrap Civilizationbot, install a
launcher, or alter Gaia. Jekyll excludes this directory. Production has no npm
runtime dependencies, credentials, bindings, storage products or scheduled jobs.

## Routes

| GET route | Result |
| --- | --- |
| `/` | Accessible directory page, manual refresh, no automatic polling |
| `/api/status` | Two public providers, each explicitly fresh, stale or unavailable |
| `/api/launcher` | Stable Windows launcher version, URL, size and SHA-256 metadata |
| `/health` | Local application health; does not imply upstream availability |
| `/app.js`, `/style.css`, `/license` | Bundled page assets and full MIT notice |

HEAD returns no body and never refreshes sources. Other methods return 405.
Queries are rejected, paths are fixed, URLs are limited to 2,048 characters,
and no request headers or bodies are forwarded. There is no arbitrary proxy,
server selector, administrative action, private-data route or cross-origin API
grant. The page uses text nodes for public strings and a restrictive CSP.

## Existing owners and public sources

The website owns presentation. Civilizationbot already owns directory production;
this service consumes its public online-only contract instead of replacing it:

- [Civilizationbot directory PR 20](https://github.com/Valgorithms/Civilizationbot/pull/20),
  merged `2a4ae459a05a4b71a5ce5d8a50505fec5d8acce7`.
- [Producer contract](https://github.com/Valgorithms/Civilizationbot/blob/2a4ae459a05a4b71a5ce5d8a50505fec5d8acce7/docs/launcher-directory.md).
- `https://civ13.com/.well-known/civ13/servers.json?provider=civ13.com`
- `https://civ13.com/.well-known/civ13/servers.json?provider=valzargaming.com`

Both exact HTTPS URLs returned **404** in the bounded November 1, 2026 inspection.
Their operator must activate/restore the existing bridge before this service can
display live server snapshots. This change does not configure the bot, inventory,
reverse proxy, source eligibility, or game server. Do not probe BYOND as a fallback.

The [published site](https://civ13.github.io/) lists `byond://civ13.com:1715`,
`byond://civ13.com:1714` and `byond://valzargaming.com:1714` (Persistence).
These appear separately as unverified static join
addresses. The launcher candidate hosts/ports do not prove a current mode or Gaia
mapping. Names and modes in live rows come only from validated producer data.

The canonical native launcher feed remains owned by Civ13's release workflow:

- [Stable feed](https://raw.githubusercontent.com/Civ13/Civ13/native-launcher-updates/native-launcher-channel.json).
- Observed feed commit `1ab32d97cc32ba303ff78259eb8623d0e4428e59`, blob
  `35a12dce7cab5a7c06943c8b40be7e45a18a52e5`.
- Observed [launcher 1.0.8 release](https://github.com/Civ13/Civ13/releases/tag/launcher-v1.0.8),
  built from reviewed `2bfbef4bdc3622b61f09a914d8f1e6b89ba8e7a1`.
  `Civ13.exe`: 35,167,763 bytes, SHA-256
  `7f4d5f508bb324b0458cf0cf3bb76a64d219962ed7e21d4f8a5cd29e4048fe2c`.

The Worker reads the stable feed, then the exact `launcher-v<version>` release
API. It requires a non-draft, non-prerelease release and one uploaded `Civ13.exe`
whose URL and GitHub SHA-256 digest match the feed. It never uses "latest",
BYOND toolchain cache releases, caller-supplied URLs, or binary downloads.
This checks metadata consistency, not a signature, malware safety, or the bytes
of a user's download. Downloads stay on GitHub. Existing updater feeds and
launcher behavior are unchanged. Observed pins document provenance; runtime
metadata follows later valid stable releases rather than freezing version 1.0.8.

## Freshness, cache and bounds

Each fixed source has a single coalesced refresh per isolate. Cache API shares
disposable results within a Cloudflare location; it is neither global coordination
nor durable storage. Cache eviction or a new location may cause another fetch.
No claim of an account-wide upstream rate limit is made.

- Status refresh/backoff: 15 seconds. Last successful snapshot retained at most
  one hour. Producer timestamps must be canonical UTC seconds, not in the future,
  and expire within 60 seconds. Every server's own check must support that expiry.
- A failed refresh or expired snapshot is stale, even if a last-known row exists.
  Cache writes and reads never advance `checked_at`, `generated_at`, `expires_at`
  or `last_success_at`. Stale rows are historical observations; their `online`
  field belongs to the source snapshot, not current connectivity. Consumers must
  check the provider's state. The page hides stale join links.
- An empty fresh online-only list means the source listed no online servers.
  Missing rows, 404s and outages never become fabricated offline/zero-player rows.
  A verified zero-player row remains online. Partial provider success is explicit.
- Launcher refresh/backoff: one hour. Failed refreshes may retain metadata for
  at most 24 hours, labelled stale; the page hides stale direct download links.
- The launcher API supplies an explicit `expires_at`. An open page ages status
  and launcher freshness locally against server `as_of`/expiry budgets, subtracting
  fetch elapsed time. A one-second local check, visibility/focus/page-resume
  checks and action-time guards remove expired verified join/download links
  without network polling. Missing, malformed or overlong timestamp budgets fail
  closed. Wall and monotonic elapsed clocks cover sleep and client UTC skew;
  expiry is irreversible for that snapshot until a manual refresh supplies new data.
- Each upstream has a three-second headers/body deadline, no redirects or retries,
  strict JSON MIME and UTF-8, with `text/plain` also accepted only for the exact
  canonical GitHub Raw JSON feed URL (its observed MIME). Status bodies are at most 64 KiB, feed 4 KiB,
  release API 512 KiB. Stream buffering is bounded even for tiny chunks.
- Maximum 32 rows per provider (the existing producer caps 32 across its inventory),
  fixed provider hosts, ports 1714/1715 only, unique IDs and ports, bounded text,
  players 0..10,000 and bounded round duration. Only public allowlisted fields
  survive; raw statuses, ckeys, IPs, CIDs, admins and unknown fields are omitted.
- A cold API request makes at most two external subrequests, at most two at once.
  Errors expose bounded categories, never upstream error bodies or stack traces.
  API results are `no-store` to preserve freshness semantics. All-stale or
  unavailable APIs return 503 with a useful JSON body; partial/fresh return 200.

## Local validation and deployment boundary

Node 22 or newer:

```sh
npm ci --ignore-scripts --no-fund
npm test
npm run build
npm run smoke
```

`build` is **Wrangler dry-run**, never a deployment. `smoke` runs the production
bundle's static/bounds routes and a separate test-only entry with injected public
fixtures in local workerd. It uses no account, environment files, remote bindings,
bot or game traffic. The test entry is not a production setting or route.
The workflow uploads the exact tested bundle, and never deploys it.

The first install on this Windows task failed writing the system npm cache.
A task-local cache succeeded; no system permission/configuration was changed.
Tests use fixture names explicitly, never pretend they are live Gaia evidence.

Proposed Worker name: `civ13-public-services`, separate from `dphp-docs-mcp`.
Compatibility is pinned to `2026-10-01`, a date supported by both the local
runtime and the observed dashboard date selector. No compatibility flags are set.
Public deployment requires Main's source review and an existing Free account.
There is no deploy script, token, account ID, CI secret or account grant here.
Do not add paid products to work around limits. Deployment must verify exact
source/configuration, the public page and bounded health/status/launcher checks.
The absent status bridge remains an upstream activation dependency.

Cloudflare's [current limits](https://developers.cloudflare.com/workers/platform/limits/)
(updated October 29, 2026) list Free: 100,000 requests/day, 10 ms CPU/request,
128 MB memory, 50 external subrequests/request, 64 MiB Worker size and one-second
startup. The [Cache API](https://developers.cloudflare.com/workers/runtime-apis/cache/)
is local and ephemeral. Waiting on fetch is not CPU time. Bundle size/build and
local functional tests do not establish production CPU headroom or availability;
no load test or Free-tier capacity claim is made.
