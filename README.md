# Civilization 13 - Website

This is the website for Civ13, which you can find [here](https://github.com/Civ13).

It is built using **Jekyll** and the **Hyde** theme [find it here](https://github.com/poole/hyde).

## Build dependency boundary

The theme's layouts, includes, and assets live in this repository. The build
does not download remote themes or extract ZIP archives. `Gemfile` pins the
direct Jekyll renderer and plugins rather than installing the `github-pages`
metagem, whose unused remote-theme chain requires an affected rubyzip version.
Jekyll 3.10.0 matches the legacy Pages renderer; the GFM parser remains explicit.
Use Ruby 3.3 and Bundler 2.7.2, then `bundle install` with the committed lockfile.
Dependency changes should be resolved with Bundler and reviewed, not edited
into the lockfile by hand.

Run `bundle exec ruby tools/check_build_contract.rb` alongside the build and
preview checks. It verifies that the resolved bundle contains no remote-theme
or ZIP extraction dependency and rejects both current and legacy configuration
keys that could activate remote-theme fetching, including negative controls.
This protects the repository-managed build. GitHub manages its own legacy Pages
dependencies separately; the unchanged site configuration supplies no remote
theme or archive input there. Hosting still publishes `master` through Pages.

## Website previews

Public content pages declare a concise `description` and a raster `image` with
real dimensions and alt text in front matter. `_includes/discord-preview.html`
renders dedicated website component JSON into the fetched head, alongside the
existing `jekyll-seo-tag` Open Graph and Twitter fallback. It uses the configured
`url` and `baseurl`; 404 pages have no component card. Buttons link to the page
and community, while game join endpoints remain in the website itself.

Dynamic strings use Liquid's JSON serializer followed by Unicode escaping of
HTML delimiters. The emitted UTF-8 byte budget is measured after escaping via
URL encoding; previews above 3,000 bytes are omitted rather than truncated.
No bot envelope, runtime, credentials, interactions or custom IDs are involved.

Run `bundle exec jekyll build`, `python3 tools/check_site_previews.py _site`,
and `python3 tools/test_previews.py` with the locked Ruby/Bundler dependencies.
CI runs these commands and uploads the validated site at the exact source SHA.
The integration check also builds isolated fixtures for Unicode, script hazards,
oversized/empty data, and an alternate origin/base path. `tools/check_preview.py`
is the versioned read-only schema guard adapted from the installed preview skill.
These checks establish generated HTML/schema correctness, not Discord client
rendering; verify served HTML and media with the Discordbot user agent after
publishing. The canonical site is `https://civ13.github.io/`.

## Game-host website redirect

`civ13.com` and `www.civ13.com` resolve to the game host. Its root currently
uses an HTML meta-refresh to this Pages site; a crawler should instead receive
an HTTP redirect. In the existing Apache virtual hosts for those names, the
coordinator can replace the root/index wrapper with this narrowly scoped rule:

```apache
RewriteEngine On
RewriteRule "^/?(?:index\.html)?$" "https://civ13.github.io/" [R=301,L]
```

This matches only `/` and `/index.html`. Keep `/verified` and every other
game-host service path on the existing host; do not use a catch-all redirect or
change DNS, BYOND endpoints, or the Pages canonical origin. Apply the rule only
to the intended virtual hosts, validate with `apachectl configtest`, and reload
using the host's established procedure. Compare existing service responses
before and after. Fetch both root variants using the Discordbot user agent and
confirm a 301 `Location` followed by 200 HTML containing the Pages preview head.
The redirect is an operational snippet, not a deployment performed by this PR;
the coordinator owns SSH, configuration changes, and live redirect evidence.
See the [Apache mod_rewrite reference](https://httpd.apache.org/docs/2.4/mod/mod_rewrite.html).

## Game mode showcase

`game-modes.md` provides the mode and event catalog, with links to the matching
wiki guides. The home-page finder also includes survival competitions,
Gladiators, colony/prison roleplay, islands/wastelands, crew modes and Football.
Event copy points to community announcements rather than maintaining a schedule.

The home page includes Nomads, team deathmatch, The Art of the Deal (AOTD),
Wizard Boy and a clearly labeled extraction-survival development preview.
Promote the preview to a playable mode only after its player availability is
verified. Existing server join links remain the published Nomads/TDM endpoints.

The AOTD and Wizard Boy card images are existing Civ13 wiki gameplay images,
reused from `src/images/red_hq.png` and `src/images/wiz/wizard_boy_screen.png`
in Civ13/civ13-wiki. They are not images of the extraction-survival mode.
# Player roadmap

`_data/roadmap.json` is the reviewed public milestone registry. Jekyll renders
`/roadmap.html` with navigation automatically, so it remains readable without
JavaScript or GitHub access. Only curated public PR evidence is queried; no
private coordinator logs or arbitrary PR titles become player copy.

The industrialization milestone covers planned pipes, pumps and foundries.
It remains **Planned** with unverified availability; implementation evidence
and completion requirements need review before the milestone can advance.

The **Refresh roadmap progress** workflow runs every six hours, on manual
dispatch, or on a `roadmap-progress` repository dispatch. It validates the whole
response before replacing the saved snapshot and requests a build of the
existing legacy Pages site after a changed snapshot is committed. Failed
requests/schema validation do not write data. Page visits also refresh linked
progress once, with bounded request counts and timeouts; there is no polling.
Cross-repository push dispatch is optional and is not configured by this change.

Milestone definitions and acceptance contracts require maintainer review.
Tracked implementation leaving draft advances a planned goal to **In progress**;
prerequisites cannot do this. To enable automatic **Code complete**, set `completion` to
`{"acceptance_verified":true,"basis":"what acceptance was verified","required_prs":["Civ13/Civ13#123"]}`.
Every required PR must be listed as implementation evidence and represent the
whole milestone's reviewed acceptance, not a prerequisite. The updater advances
only when all are merged. None of the initial milestones has such a contract.
**Available** additionally requires independently verified public server
availability, a public `availability_evidence` HTTPS URL and reviewed explanatory
copy. Merge status never grants availability.

Run `node --test tools/test_roadmap.cjs` offline. Run
`node tools/refresh_roadmap.cjs` to refresh public data; `GH_TOKEN` is optional for
local public reads and is supplied by Actions. No credential is embedded in the
page. Existing Jekyll build/preview checks still apply.

## Planned cross-server travel contract

Real-time travel between servers we host is a **Planned** goal with unverified
availability. The bounded scope is one character moving from one Civ13-hosted
source server to one Civ13-hosted destination per transfer. The following
requirements still need design and verification. No delivery date, seamless
travel or zero downtime is promised:

- **Compatibility:** use a reviewed compatibility definition for the in-game era
  and persistence game mode. Refuse incompatible or unknown combinations before
  unloading the source character; do not silently convert or synchronize worlds.
- **Identity and ownership:** preserve shared character identity and a unique
  transfer identity, with one authoritative owner. Concurrent or replayed requests
  must not let the same character play on both servers or create another copy.
- **Inventory and state custody:** define the transferred inventory/state snapshot
  and compatible save schema. Retain durable, recoverable source custody until the
  destination durably accepts ownership; every item and state field needs an owner.
- **Destination readiness:** confirm admission, capacity and compatible load
  readiness before source unload. Failed or stale readiness must leave the
  character recoverable, rather than discard its source state.
- **Interrupted transfers:** bound each attempt and persist its identity and
  progress. Timeouts, disconnects and either server restarting before, during or
  after handoff must support safe retry or reconciliation to one authoritative
  owner. An uncertain outcome must not trigger a fresh import or playable copy.
- **Acceptance:** demonstrate rejection of incompatible servers, concurrent/replayed
  transfers and recovery at each interruption boundary, with character identity,
  inventory and state accounted for without duplication or loss. Public availability
  still requires separate verification under the roadmap's existing rules.

## Linked geography, authoring and regional-travel goals

The roadmap groups this direction into seven player-facing goals. **In progress**
can mean metadata groundwork or bounded interface/documentation design; it does
not establish a complete feature, published guide, working sharding service or
public availability. All seven goals retain unverified availability and no automatic
completion contract. Dependencies below describe design order, not delivery dates.

| Goal | Current scope | Depends on |
| --- | --- | --- |
| Geographic layers and elevation | Elevation metadata groundwork in development; temperature coupling, mountain profiles and precipitation consistency planned | Durable metadata preservation through terrain changes and saves |
| Snow shaped by local weather | Unmerged, undeployed draft; native runtime validation pending | Geographic and weather consistency |
| Persistent world editing and map authoring | Unpublished zone/spawn candidate; export design started; mapper documentation underway | Geographic metadata and safe persistence |
| Safe persistence and transfer foundations | Bounded admission/custody/handoff interface design; no working sharding service | Shared operation admission and durable recovery contracts |
| Small USA regional persistence pilot | Tentative two-slice experiment with explicit routes and on-demand processes | Geographic, authoring and safe-transfer foundations; bounded resource admission and offline-simulation policy |
| Optional desktop launcher and shared connection core | Planned GUI, retained CLI automation, shard browser and recoverable joining; framework undecided | Shared connection/update contract and server-authoritative readiness/admission; optional for manual BYOND joining |
| Player-built crossings and rail routes | Planned construction-dependent regional route graph | Regional travel, connectivity summaries and safe transfers |

### Geography and snow

Biome, optional elevation (default `0`), room/shelter and future overlapping
special regions are independent metadata layers. A z-level is a map layer, not
altitude. Roofing, turf replacement and save/load must preserve the appropriate
metadata rather than infer one layer from another. Elevation-to-temperature
coupling, mountain profiles and precipitation rules must remain consistent when
added; the metadata foundation alone does not implement those climate effects.

Snow accumulation follows actual local weather and exposure. Melting or shoveling
generated cover must reveal the same underlying soil without automatic seasonal
terrain replacement. The linked ground-snow implementation remains a draft;
source/CI checks do not establish native gameplay, save round-trip or deployment
acceptance. Existing authored terrain and generated cover need distinct handling.

### Persistent editing, export and mapper guidance

Zone and spawn persistence must cover create/move/delete operations with stable
local identities and safe restoration, including durable removal so deleted
definitions do not reappear. The current candidate is unpublished, not complete.

Save-to-map export design must preserve originals and export reviewed static world
state as compilable Civ13 map source plus necessary metadata. Exclude player,
private and runtime state by default; report unsupported state instead of silently
dropping it or claiming a complete world export. Export is not implemented.
A Civ13-specific wiki guide and repository mapper checklist are being prepared;
neither is represented as published or verified by this roadmap.

### Persistence-aware transfers and the USA pilot

Shared operation admission, durable custody/transfer records and idempotent,
fenced handoff/recovery must protect one authoritative owner. Loading an older
source save must not resurrect a character already transferred elsewhere.
Global character identities are distinct from local zone identities. This is
bounded interface design, not an implemented sharding service; the earlier
cross-server travel compatibility and recovery contract still applies.

The USA pilot should begin with two small logical region slices and explicit
routes. A logical geographic region, shard process and physical host are separate
concepts. Regional biomes and civil/daylight clocks share one authoritative world
timeline. State borders and hosting groups need not match; hosting noncontiguous
places together must not create geographic adjacency. Exact regions remain
tentative. Measure performance, state custody and interruption recovery before
expansion; no player capacity or full-state scale has been established.

Registered regions must retain durable saves and lightweight route metadata while
their hosting game process is stopped. An on-demand destination must first obtain
bounded concurrency/resource admission, then start, load, reconcile custody and
pass health/readiness checks before accepting a transfer. Keep players at the
source if startup fails; cached registration or topology is not readiness.

An idle shard may save and sleep only with no players, no pending custody or
transfer work, and no unsafe active operations. Shutdown admission must prevent
new work from racing that decision and preserve recoverable durable state before
stopping. An explicit offline-simulation policy must define which clocks and
systems pause or reconcile across sleep; the common timeline alone does not
define catch-up behavior. Resource/concurrency limits and that policy are
prerequisites to the pilot. Sleeping processes can reduce active memory use but
retained data and lifecycle work still have costs; no zero overhead or unlimited
scale is established. This is planned design only, with no server changes.

Official Civ13 launcher evolution is planned around a shared connection/update
core with an optional desktop GUI and a retained CLI for automation. Plan a
server/shard browser for discovering/selecting a destination, wake/load/readiness
progress, compatible client-package selection and a recoverable join flow with
connect/reconnect support. No GUI framework is selected and these additions are
not verified current launcher capabilities. Direct/manual BYOND remains supported for
non-launcher users and as a recovery path. Server-side authentication, custody,
transfer reconciliation, route validity, authorization and readiness safeguards
apply identically to both paths; launcher progress or a connection request cannot
grant admission. Ordinary authorized joining must not require a launcher-only
secret. Do not put secrets in public launch arguments.

Before publishing an on-demand pilot, provide a documented manual workflow:
discover a registered region and its public wake/control surface, request wake
through that surface, wait for reported load/reconciliation/readiness, then connect
with BYOND to the published destination address. That surface and workflow remain
to be designed and verified; no endpoint or current capability is claimed here.
A stopped game port cannot receive the connection or serve as its own wake path.
Startup failure leaves the player at the source and reports that readiness was
not reached. No launcher, wake/control service or networking implementation is
part of this roadmap change.

### Constructed crossings and rail travel

Player-established border crossings and local rail/station connectivity summaries
should feed a cross-shard route graph. A usable route requires constructed
continuity along the whole route. Cached known topology is separate from current
route usability: travel needs fresh validation, destination admission and safe
behavior when a required server or connection is unavailable. Passing through an
offline intermediary is later durable-transit scope; caching alone does not solve
custody, interruption recovery or arrival. No transit service is implemented here.

### Future ocean, underwater and advanced-era scope

These three future **Civ13** goals are **Planned**, with unverified availability,
no implementation evidence or completion contract, and no delivery commitment:

- **Ocean voyages and offshore industry:** travel across one or more ocean maps,
  connected map levels or regions, with player-built and maintained offshore oil
  rigs. Depends on industrialization, geographic layers, persistent world authoring
  and regional travel foundations; routes must define the actual connections.
- **Submarines and pressurized underwater habitats:** building and maintenance
  require explicit pressure/atmosphere, power and ongoing upkeep. Depends on ocean
  voyages, industrialization, geographic depth metadata and persistence contracts.
- **A later advanced-era space mode:** a separate future game mode for launches,
  satellites, space stations and building/maintenance on the Moon or Mars. Depends
  on industrialization, geographic/environment metadata, persistence and regional
  travel foundations; scope and environments still require design and testing.

Map z-levels may organize connected maps but do not automatically define physical
depth, altitude, pressure or orbital environments. Each needs explicit metadata,
rules and persistence/transition handling. These are Civ13 roadmap directions,
distinct from Frontier Systems implementation; no game systems or assets for
either project are implemented or verified by this documentation change.

### Player-owned persistent expedition regions

This **Planned**, availability-unverified goal builds on world authoring,
geographic layers, industrialization, on-demand regional processes and safe
transfers. It covers player-requested ocean/continental expedition regions,
offshore rigs and remote factories reached through explicit geographic routes.
Ownership or shared hosting must not create an unbuilt route or false adjacency.

A request must specify location, purpose, approved template, dimensions, native
z-level count and access policy. The host provider must approve or reject that
exact resource specification before creation; a changed specification needs
review again. Define benchmarked size classes and limits on owned/registered
regions, active simulations, machinery, persistent storage and backups. Requests
such as 300x300 with 3-4 native z-levels illustrate desired scale, not tested
capacity or an approved allocation. Greater sizes require their own evidence.

Creation requests and resource reservations must be idempotent so retries cannot
duplicate regions or allocations. Publish inactivity, archival and recovery
policies, and notify affected players before archival rather than surprise deletion.

Region identity and its persistent save must survive an idle hosting process.
The first version should keep dimensions fixed; expansion is later scope needing
host-approved offline migration that preserves original saves and metadata.
Owner building/access rights do not confer operator administration or permission
to upload arbitrary scripts. Retain the shared world mode, era and authoritative
timeline, and keep elevation separate from native z-count. Entry/exit still needs
readiness-gated, crash-safe transfers and the supported manual BYOND fallback.

An explicit, bounded offline-simulation/production policy is required for remote
factories and machinery; sleeping a region does not grant free unlimited output.
Nothing here provisions a region, selects a paid service or establishes capacity.

### Recovery when a region shuts down or becomes unavailable

This separate **Planned**, availability-unverified goal depends on the durable
custody and recovery foundation. Character state and recursive inventory must be
durable outside individual region snapshots, with authoritative single-owner
custody/generation and departure records that old region saves cannot override.
These are design/acceptance requirements, not implemented recovery guarantees.

Recovery also requires stable item identities/ownership and pickup/drop/trade/
consume/container transactions coordinated with character and world state;
snapshots alone are insufficient.

- **Graceful shutdown:** durably checkpoint character state and recursive
  inventory before evacuation, then use the normal authorized transfer handoff.
- **Unexpected outage:** recover only durable state after fencing old ownership.
  A missing heartbeat alone does not prove ownership is released. Refuse recovery
  if custody or its generation cannot be established; do not create a new copy
  merely because a player reconnects or a source is unreachable.
- **Destination admission:** another world/region must be live, compatible with
  the shared mode/era, authorized for that player and capacity-ready. Apply the
  same server checks to launcher and manual BYOND joins; no compatible destination
  or unresolved custody means safe refusal, not an unsafe quick-travel shortcut.
- **Source reconciliation:** before resuming an old save, reconcile authoritative
  departure/custody records for characters and their recursive items. Departed
  characters or cargo must not reappear or become playable at the old source.
  Account for items later dropped, traded or consumed at the destination. Retain
  departure history across the allowed backup-restore window, or reject
  incompatible older backups rather than resurrect departed state.
- **Acceptance and limits:** demonstrate single ownership and inventory custody
  across shutdown, crash, retry and old-save restoration without duplication or
  loss of recoverable durable state. Changes never durably written cannot be
  promised after an outage; offline production remains subject to the explicit
  bounded policy. No game code or server operations are part of this roadmap task.
