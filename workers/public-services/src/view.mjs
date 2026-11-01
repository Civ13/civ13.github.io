export const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Civ13 server directory</title><link rel="stylesheet" href="/style.css"><script src="/app.js" defer></script></head>
<body><main><p><a href="https://civ13.github.io/">Civilization 13</a></p>
<h1>Find a Civ13 server</h1><p>Public server snapshots and the stable Windows launcher. Status may change before you join.</p>
<button id="refresh" type="button">Refresh public data</button><p id="message" role="status" aria-live="polite"></p>
<section aria-labelledby="servers-heading"><h2 id="servers-heading">Servers</h2><div id="servers">Status has not been loaded.</div></section>
<section aria-labelledby="joins-heading"><h2 id="joins-heading">Published join addresses</h2>
<p>These addresses are published on the Civ13 website. Availability and current mode are unverified here; an empty directory does not prove a server is offline.</p>
<ul><li><a href="byond://civ13.com:1715">civ13.com:1715</a></li><li><a href="byond://civ13.com:1714">civ13.com:1714</a></li></ul>
<p>BYOND must be installed to use a join link. Server names, including Gaia, appear only when supplied by a fresh public directory snapshot.</p></section>
<section aria-labelledby="launcher-heading"><h2 id="launcher-heading">Windows launcher</h2><div id="launcher">Launcher metadata has not been loaded.</div>
<p>Downloads remain on GitHub Releases. This page does not install or run software. Compare the downloaded file's SHA-256 before running it.</p></section>
<footer><p><a href="https://github.com/Civ13/civ13.github.io/tree/master/workers/public-services">Source and data policy</a> ·
<a href="https://github.com/Civ13/Civ13/releases">Launcher releases</a></p><p>No player names or account identifiers are shown. Cached data is temporary and may be unavailable.</p></footer>
</main></body></html>`;

export const script = `const byId = id => document.getElementById(id);
const add = (parent, tag, value) => { const node = document.createElement(tag); node.textContent = value; parent.append(node); return node; };
const link = (parent, label, href) => { const node = add(parent, 'a', label); node.href = href; return node; };
function renderStatus(body) {
  const target = byId('servers'); target.replaceChildren();
  add(target, 'p', 'Directory: ' + body.state + '. Viewed at ' + body.as_of);
  for (const provider of body.providers) {
    const group = add(target, 'article', ''); add(group, 'h3', provider.provider + ' - ' + provider.state);
    add(group, 'p', 'Last successful fetch: ' + (provider.last_success_at || 'none') + '. Source expiry: ' + (provider.expires_at || 'unknown'));
    if (!provider.servers.length) add(group, 'p', provider.state === 'fresh' ? 'The source listed no online servers. Offline status is not established.' : 'No verified server snapshot is available.');
    for (const server of provider.servers) {
      const row = add(group, 'div', ''); add(row, 'h4', server.name);
      add(row, 'p', (provider.state === 'fresh' ? 'Reported online' : 'Stale snapshot; current availability unknown') + ': ' + server.players + ' players. Map: ' + server.map + '. Mode: ' + server.mode + '. Round: ' + server.round.id + ', ' + server.round.duration_seconds + ' seconds at check time.');
      add(row, 'p', 'Checked: ' + server.checked_at);
      if (provider.state === 'fresh') link(row, 'Join ' + server.host + ':' + server.port, server.join_url);
    }
    link(group, 'Public snapshot source', provider.source_url);
  }
}
function renderLauncher(body) {
  const target = byId('launcher'); target.replaceChildren();
  add(target, 'p', 'Metadata: ' + body.state + '. Last verified: ' + (body.last_success_at || 'never'));
  if (!body.launcher) { add(target, 'p', 'Stable launcher metadata is unavailable. Check the official releases.'); return; }
  const item = body.launcher;
  add(target, 'p', 'Version ' + item.version + ', Windows, ' + item.size + ' bytes. Published ' + item.published_at);
  add(target, 'p', item.verification + '. This is checksum consistency, not a signature or security assessment.');
  add(target, 'code', 'SHA-256: ' + item.sha256);
  if (body.state === 'fresh') link(target, 'Download Civ13.exe', item.url);
  else add(target, 'p', 'Cached metadata is stale; use the official release page to check for updates.');
  link(target, 'Release details', item.release_url);
}
async function load(path, render, target) {
  try {
    const response = await fetch(path, { cache: 'no-store' });
    const body = await response.json();
    if (!body.state) throw new Error('Unavailable');
    render(body);
  } catch { byId(target).textContent = 'Public data is unavailable. Try refreshing later.'; }
}
async function refresh() {
  const button = byId('refresh'); button.disabled = true; byId('message').textContent = 'Fetching public snapshots...';
  await Promise.all([load('/api/status', renderStatus, 'servers'), load('/api/launcher', renderLauncher, 'launcher')]);
  byId('message').textContent = 'Refresh finished. Source timestamps show when the data was checked.'; button.disabled = false;
}
byId('refresh').addEventListener('click', refresh); refresh();`;

export const style = `:root{color-scheme:dark;font:17px/1.55 system-ui,sans-serif;background:#111a18;color:#e3ebe6}body{margin:0}main{max-width:850px;margin:auto;padding:2rem 1.25rem}a{color:#b8dfb5}h1{font-size:clamp(2rem,6vw,3.4rem);line-height:1.1}h2{border-top:1px solid #506459;padding-top:1.4rem}article{background:#1c2923;padding:1rem 1.3rem;margin:1rem 0;border-radius:8px}h3,h4{margin:.4rem 0}button{font:inherit;background:#c9e7a4;color:#182017;border:0;padding:.65rem 1rem;border-radius:5px;cursor:pointer}button:disabled{opacity:.6;cursor:wait}a:focus-visible,button:focus-visible{outline:3px solid #efcf91;outline-offset:4px}code{display:block;overflow-wrap:anywhere;font-size:.85rem;margin:1rem 0}#launcher>a{display:block;margin:.8rem 0}footer{margin-top:3rem;font-size:.85rem;color:#bac9bf}`;
