# Civilization 13 - Website

This is the website for Civ13, which you can find [here](https://github.com/Civ13).

It is built using **Jekyll** and the **Hyde** theme [find it here](https://github.com/poole/hyde).

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
