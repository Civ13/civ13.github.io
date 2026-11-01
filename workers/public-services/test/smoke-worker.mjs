// This entry is used only by the local smoke harness, never by wrangler.jsonc.
import { createWorker } from '../src/worker.mjs';
import { createService, FEED_URL } from '../src/service.mjs';
import { NOW, directory, feed, release, response } from './fixtures.mjs';
const worker = createWorker(createService({ clock: () => NOW, cache: caches.default, fetcher: async url => {
  if (url === FEED_URL) return response(feed);
  if (url === 'https://api.github.com/repos/Civ13/Civ13/releases/tags/launcher-v1.0.8') return response(release());
  const provider = new URL(url).searchParams.get('provider');
  if (provider !== 'civ13.com') return new Response(null, { status: 404 });
  return response(directory(provider));
} }));
export default worker;
