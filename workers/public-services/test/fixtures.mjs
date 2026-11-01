export const NOW = Date.parse('2026-11-01T20:00:00Z');
export const stamp = time => new Date(Math.floor(time / 1000) * 1000).toISOString().replace('.000Z', 'Z');
export function directory(provider = 'civ13.com', time = NOW) {
  return { schema: 1, generated_at: stamp(time), expires_at: stamp(time + 60000), servers: [{
    id: 'fixture', name: 'Fixture server (not a live server)', host: provider, port: 1714,
    engine: 'BYOND', online: true, checked_at: stamp(time), players: 0,
    map: 'Fixture map', mode: 'Fixture mode', round: { id: '123', duration_seconds: 24 }, epoch: 'fixture',
  }] };
}
export const feed = {
  schema: 1, version: '1.0.8', sha256: '7f4d5f508bb324b0458cf0cf3bb76a64d219962ed7e21d4f8a5cd29e4048fe2c',
  url: 'https://github.com/Civ13/Civ13/releases/download/launcher-v1.0.8/Civ13.exe',
};
export function release() {
  return { tag_name: 'launcher-v1.0.8', draft: false, prerelease: false,
    html_url: 'https://github.com/Civ13/Civ13/releases/tag/launcher-v1.0.8', published_at: '2026-10-26T19:35:59Z',
    assets: [{ name: 'Civ13.exe', state: 'uploaded', size: 35167763,
      browser_download_url: feed.url, digest: `sha256:${feed.sha256}` }] };
}
export const response = body => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
export class MemoryCache {
  data = new Map();
  async match(request) { return this.data.get(request.url)?.clone(); }
  async put(request, value) { this.data.set(request.url, value.clone()); }
}
