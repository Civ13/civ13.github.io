# Unpublished static map browser prototype

This is a review prototype, not a public website route. `tools/` remains in the
existing Jekyll exclusion; no navigation, publishing configuration, game source,
procedural generator or Crafting Atlas is changed. Main reviews the prototype
before any separate player-facing integration or publication.

Run from the website root with Node 22:

```sh
node tools/map-explorer/build.cjs --check
node --test tools/map-explorer/test.cjs
```

For a deliberate source review, download the exact pinned manifest linked below
to a review directory outside this repository, then run:

```sh
node tools/map-explorer/verify-assets.cjs --manifest PATH_TO_PINNED_MANIFEST
```

This checks all four map identities and 17 image records against that manifest.
Add `--download-to OUTSIDE_REPOSITORY_DIRECTORY` to explicitly retrieve only the
four compact overviews, each bounded to 2 MiB and 15 seconds with no redirects.
It verifies bytes, SHA-256 and PNG dimensions before writing new review files;
existing files are never overwritten. The JSON receipt records each result.
Normal builds and CI make no image requests. A local render using these verified
bytes proves rendering only, not browser-to-GitHub reachability or game availability.

For local browser review, serve only this directory (not the repository root):

```powershell
& 'C:\Path\To\Real\Python\python.exe' -m http.server 8768 --bind 127.0.0.1 --directory tools/map-explorer
```

Open `http://127.0.0.1:8768/`. The initial page sends no image requests. Choose a
map to narrow the list, then explicitly load its compact overview. Thirteen
full-resolution layers remain ordinary links, with dimensions and compressed
file sizes visible before opening; a small PNG can still decode to a large image.
Without JavaScript, all four guides, overviews and layer links remain readable.
Remote image failure leaves the source links available and restores the same
native button as an explicit, keyboard-accessible Retry control. Only a user
activation retries the pinned URL; there are no automatic retries. There are no analytics,
accounts, local storage, server queries, subscriptions or new external services.
Images load from GitHub Raw only when requested, with no referrer sent.

## Source and ownership boundary

The catalog is a reviewed subset of the already-merged wiki PR
[#128](https://github.com/Civ13/civ13-wiki/pull/128): Gaia, Mountain, Oceania and
Stranded. Wiki snapshot: `48094b1fbac7031a3a49c5c9ddce84e51dea0258`.
Every image and guide URL is pinned to that complete revision. Image paths,
bytes, hashes, dimensions and layer identities come from its existing
[`asset-manifest.json`](https://github.com/Civ13/civ13-wiki/blob/48094b1fbac7031a3a49c5c9ddce84e51dea0258/src/images/maps/nomads-authored-10d264e58962/asset-manifest.json).

The manifest distinguishes static-input verification at game source
`10d264e5896221b34949ee4b67c0fd2b94bde249` from original PNG production at
`067478b82c7ad9f1b83759a221e6f22080ba865a`. Preserve both labels. The viewer
does not assert that these images represent current game master or live rounds.
It preserves Gaia's underground z=1/surface z=2 and all eight Mountain layers.

Wiki PR [#129](https://github.com/Civ13/civ13-wiki/pull/129) owns six additional
scenario pages and their availability review; none are imported here. The
existing procedural tool in game PRs #3331/#3338 owns generation, catalogs and
DMM export. It remains an offline prototype without native playability claims.
This browser consumes only existing authored PNG outputs; it creates no maps,
touches no generator source pins and consumes no saves, private layouts or players.
The Crafting Atlas continues to own recipes/resources, and the wiki owns guides.

Original asset copyrights/licenses and Civ13/SS13 contributor credit are linked
in the viewer. The wiki MIT license does not relicense these images. No binary
assets are copied into this repository. Read the original README and notices;
do not substitute art, diagnostic renders or screenshots from private servers.

## Review and next decision

Current hosting and normal player access for these authored variants are
unverified. Main must choose the intended source-reference audience and review
availability/editorial requirements before any public-site integration. This
prototype does not treat merged documentation as a deployment receipt.

Acceptance: pinned provenance, accurate layers, offline links without JS,
no automatic large downloads, escaped catalog text, keyboard-readable controls,
desktop/mobile layout, and graceful image failure. The tests cover the actual
browser script, generator and invalid provenance/path/status/layer inputs.
Full-image native viewing, current server availability and game rendering are
outside this prototype. A later publication should verify remote availability
and current content policy, not simply move this directory into Jekyll.

To deliberately update the reviewed source, inspect the new wiki manifest and
ownership first, review `catalog.json`, then run `build.cjs --write` and the
checks. There is no automatic refresh or catalog scraping.
