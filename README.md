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
