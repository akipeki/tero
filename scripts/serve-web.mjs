// file: scripts/serve-web.mjs
//
// Serves the static build in out/ (from `npm run build:web`) on
// http://localhost:3005, so you can try exactly what a host would get.
// No dependencies.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = join(process.cwd(), 'out');
const PORT = Number(process.env.PORT ?? 3005);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.png': 'image/png',
  '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
  '.webmanifest': 'application/manifest+json',
};

async function resolve(urlPath) {
  const safe = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  let file = join(ROOT, safe);
  const s = await stat(file).catch(() => null);
  if (s?.isDirectory()) file = join(file, 'index.html');
  else if (!s) file = file + '.html';
  return file;
}

createServer(async (req, res) => {
  const file = await resolve(req.url ?? '/');
  try {
    const body = await readFile(file);
    // Extensionless files (opengraph-image) are PNGs.
    const ext = extname(file);
    res.writeHead(200, { 'content-type': TYPES[ext] ?? (ext ? 'application/octet-stream' : 'image/png') });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    res.end(await readFile(join(ROOT, '404.html')).catch(() => 'Not found'));
  }
}).listen(PORT, () => console.log(`out/ on http://localhost:${PORT}`));
