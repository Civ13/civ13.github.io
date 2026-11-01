# Inactive public HTTP monitoring plan

`plan.json` is a reviewable inventory, not a registered monitor or scheduler.
`check.cjs` reads local JSON and projects supplied observations. It has no HTTP,
Discord, email, timer or job-control transport. The site's existing `tools`
exclusion keeps this plan and operator documentation out of generated Pages.

Run offline with Node 22 or newer:

```text
node tools/monitoring/check.cjs
node --test tools/test_player_help.cjs tools/test_monitoring.cjs
node tools/monitoring/check.cjs tools/monitoring/plan.json observations.json
```

Optional observations are a JSON array of objects with exactly `id`,
`status_code`, `content_type` and `body`. A transport failure uses null for the
last three fields. Missing samples stay `unknown`; a valid HTTP 200 HTML response
with its marker is only `http_available`, never game health or readiness. The
checker prints fixed classifications, not response bodies. A redirected response
needs the eventual provider's redirect/origin policy reviewed before it is
accepted as an observation. This offline checker does not follow redirects.

## Proposed service setup for owner review

The [UptimeRobot Free plan](https://uptimerobot.com/pricing/) currently offers
50 monitors, five-minute intervals, five integrations and basic status pages,
with no card required for personal or commercial use (checked 1 November 2026).
The plan's four ordinary public Pages URLs fit that scope. Its markers are
proposals to validate against the served HTML before registration. A 200 error
page can still contain a generic title; use meaningful reviewed markers.

Do not register monitors or recipients from this repository. The owner must
first select their existing account/free plan, confirm actual target behavior
and provider limits, choose alert recipients, and authorize activation. Do not
change `enabled` to true: a separately reviewed operational configuration owns
activation. No account, API key, webhook URL or email address belongs here.
Do not add direct game-port probes, bot/private endpoints or arbitrary URLs.

Four five-minute checks imply 1,152 requests/day before retries and probe
locations. These targets are static Pages. A future dynamic status API needs a
separate reviewed freshness contract and account-wide Worker request budget.
That directory and launcher feed remain with their existing owner.

Acceptance after separate activation authorization: use a disposable endpoint
to establish failure, recovery and actual alert delivery; distinguish transport
failure from empty/zero-player status; verify recipient privacy and disable/
rollback behavior. Offline tests do not establish live monitoring.

## Scheduled job completion signals are a later adapter

[Healthchecks.io Hobbyist](https://healthchecks.io/pricing/) offers 20 checks and
100 log entries/check; [its homepage](https://healthchecks.io/) states no card
is required (checked 1 November 2026). A trusted existing job may eventually send
a completion signal only after its real accepted outcome. Keep ping URLs secret,
send no log body, and never wait on the provider in a game/save critical path.

No completion sender is supplied here. The save/lifecycle owner must define
the actual completion receipt, run identity, failure/timeout and restart policy
before an adapter is implemented. Missing-job monitoring must not become a
second save/restart controller. Test with injected transports first; external
pings and notifications need separate operational authorization.
