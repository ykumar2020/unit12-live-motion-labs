import { createServer } from 'node:http';
import { createServer as tcpServer } from 'node:net';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { randomUUID } from 'node:crypto';
import { labs } from './labs.mjs';
import { hubHTML } from './hub.mjs';
const root = process.cwd(),
  cli = resolve('node_modules/vite/bin/vite.js'),
  children = [],
  token = randomUUID();
await mkdir('.runtime', { recursive: true });
// Never silently move to a different port or terminate an unrelated user's server.
for (const port of [5280, ...labs.map((l) => l.port)])
  await new Promise((yes, no) => {
    const s = tcpServer();
    s.once('error', () =>
      no(
        Error(
          `Port ${port} is already in use. Stop that app or run npm run stop for this workbench.`,
        ),
      ),
    );
    s.listen(port, '127.0.0.1', () => s.close(yes));
  });
let stopping = false;
function shutdown() {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill('SIGTERM');
  server.close();
  setTimeout(() => process.exit(0), 500).unref();
}
for (const lab of labs) {
  const child = spawn(
    process.execPath,
    [cli, '--host', '127.0.0.1', '--port', String(lab.port), '--strictPort'],
    { cwd: resolve('apps', lab.folder), windowsHide: true },
  );
  children.push(child);
  const log = createWriteStream(`.runtime/${lab.folder}.log`);
  child.stdout.on('data', (b) => {
    log.write(b);
    process.stdout.write(`[${lab.folder}] ${b}`);
  });
  child.stderr.on('data', (b) => {
    log.write(b);
    process.stderr.write(`[${lab.folder}] ${b}`);
  });
  child.on('error', (e) => console.error(lab.folder, e.message));
  child.on('exit', (code) => {
    if (!stopping) {
      console.error(`${lab.folder} exited (${code}). See .runtime/${lab.folder}.log`);
      shutdown();
    }
  });
}
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname === '/api/status') {
      const health = await Promise.all(
        labs.map(async (lab) => {
          try {
            const r = await fetch(`http://127.0.0.1:${lab.port}`, {
              signal: AbortSignal.timeout(1500),
            });
            return { ...lab, ready: r.ok };
          } catch {
            return { ...lab, ready: false };
          }
        }),
      );
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ managerPid: process.pid, labs: health }));
      return;
    }
    if (url.pathname === '/api/stop' && req.method === 'POST') {
      let data = '';
      for await (const b of req) {
        data += b;
        if (data.length > 1000) throw Error('Body too large');
      }
      if (data !== token) {
        res.writeHead(403);
        res.end('Wrong session token');
        return;
      }
      res.end('Stopping this workbench');
      shutdown();
      return;
    }
    if (url.pathname === '/') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(hubHTML());
      return;
    }
    let filename;
    if (url.pathname === '/style.css') filename = 'shared/style.css';
    else if (url.pathname === '/assignment') filename = 'docs/ASSIGNMENT.html';
    else if (url.pathname === '/guide.pdf')
      filename = 'output/pdf/Unit12_Corrected_Beginner_Guide.pdf';
    else if (url.pathname === '/verification') filename = 'evidence/verification.json';
    else if (url.pathname.startsWith('/code/')) {
      filename = decodeURIComponent(url.pathname.slice(6));
      if (
        !/^(shared\/|apps\/[^/]+\/src\/|scripts\/)/.test(filename) ||
        !/[.](js|jsx|vue|svelte|mjs|css)$/.test(filename)
      )
        throw Error('Source path is not allowed');
    } else {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const target = resolve(root, filename);
    if (!target.startsWith(root + sep)) throw Error('Invalid path');
    const body = await readFile(target);
    res.setHeader(
      'Content-Type',
      url.pathname.startsWith('/code/')
        ? 'text/plain; charset=utf-8'
        : {
            '.css': 'text/css; charset=utf-8',
            '.html': 'text/html; charset=utf-8',
            '.pdf': 'application/pdf',
            '.json': 'application/json',
          }[extname(target)] || 'text/plain; charset=utf-8',
    );
    res.end(body);
  } catch (e) {
    res.writeHead(404);
    res.end('Resource not available yet: ' + e.message);
  }
});
server.listen(5280, '127.0.0.1', () =>
  console.log('Eight-lab launcher: http://127.0.0.1:5280'),
);
await writeFile(
  '.runtime/session.json',
  JSON.stringify(
    {
      root,
      managerPid: process.pid,
      token,
      labs: labs.map((l, i) => ({ ...l, pid: children[i].pid })),
    },
    null,
    2,
  ),
);
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
