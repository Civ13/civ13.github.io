import { createService } from './service.mjs';
import { page, script, style } from './view.mjs';
import { license } from './license.mjs';

const headers = {
  'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' },
});
export function createWorker(service) {
  return { async fetch(request) {
    if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, {
      status: 405, headers: { ...headers, Allow: 'GET, HEAD' },
    });
    const url = new URL(request.url);
    // HEAD does not refresh external sources.
    const head = request.method === 'HEAD';
    const reply = (body, status = 200) => head ? new Response(null, {
      status, headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' },
    }) : json(body, status);
    if (request.url.length > 2048 || url.search) return reply({ error: 'No query parameters are supported' }, 400);
    if (url.pathname === '/health') return reply({ service: 'civ13-public-services', schema: 1 });
    const asset = new Map([['/', [page, 'text/html']], ['/app.js', [script, 'text/javascript']], ['/style.css', [style, 'text/css']], ['/license', [license, 'text/plain']]]).get(url.pathname);
    if (asset) return new Response(head ? null : asset[0], { headers: { ...headers, 'Content-Type': `${asset[1]}; charset=utf-8` } });
    if (url.pathname === '/api/status' || url.pathname === '/api/launcher') {
      if (head) return new Response(null, { headers: { ...headers, 'Content-Type': 'application/json' } });
      try {
        const body = await (url.pathname === '/api/status' ? service.status() : service.launcher());
        return reply(body, ['fresh', 'partial'].includes(body.state) ? 200 : 503);
      } catch { return reply({ error: 'Service unavailable' }, 503); }
    }
    return reply({ error: 'Not found' }, 404);
  } };
}
let worker;
export default { fetch(request) {
  worker ??= createWorker(createService({ cache: globalThis.caches?.default ?? null }));
  return worker.fetch(request);
} };
