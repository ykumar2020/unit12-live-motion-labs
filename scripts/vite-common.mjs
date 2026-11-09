import { createHash } from 'node:crypto';
import { providers } from './providers.mjs';
function liveAPI() {
  const install = (server) => {
    server.middlewares.use(async (req, res, next) => {
      const url = new URL(req.url, 'http://localhost');
      if (!url.pathname.startsWith('/api/data/')) return next();
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      const key = url.pathname.slice(10),
        source = Object.hasOwn(providers, key) ? providers[key] : null;
      if (!source) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Unknown live dataset' }));
        return;
      }
      if (req.method !== 'GET') {
        res.writeHead(405);
        res.end(JSON.stringify({ error: 'GET only' }));
        return;
      }
      if (url.searchParams.get('mode') === 'snapshot') {
        res.writeHead(410);
        res.end(
          JSON.stringify({
            error: 'Saved-data mode has been removed. This lab is live-only.',
          }),
        );
        return;
      }
      try {
        const response = await fetch(source.url, {
          cache: 'no-store',
          signal: AbortSignal.timeout(25000),
          headers: {
            'User-Agent': 'CPS5745-Live-D3-Labs/2.0',
            'Cache-Control': 'no-cache',
          },
        });
        if (!response.ok) throw Error(`${source.name} returned HTTP ${response.status}`);
        const rawText = await response.text(),
          raw = JSON.parse(rawText);
        res.end(
          JSON.stringify({
            raw,
            rawText,
            meta: {
              ...source,
              key,
              mode: 'live',
              fetchedAt: new Date().toISOString(),
              providerDate: response.headers.get('date'),
              providerAge: response.headers.get('age'),
              sha256: createHash('sha256').update(rawText).digest('hex'),
            },
          }),
        );
      } catch (error) {
        res.writeHead(502);
        res.end(
          JSON.stringify({
            error: `Live request failed: ${error.message}. No saved response is substituted.`,
          }),
        );
      }
    });
  };
  return {
    name: 'live-only-data',
    configureServer: install,
    configurePreviewServer: install,
  };
}
export function labConfig(plugins, port) {
  return {
    base: process.env.DEPLOY_PUBLIC === '1' ? `/labs/${port - 5280}/` : '/',
    plugins: [...plugins, liveAPI()],
    server: { host: '127.0.0.1', port, strictPort: true },
    preview: { host: '127.0.0.1', port, strictPort: true },
    build: { target: 'es2022' },
    clearScreen: false,
  };
}
