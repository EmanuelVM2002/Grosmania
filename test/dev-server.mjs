/* Servidor local SIN dependencias, para probar la página y el panel en el navegador.
   Sirve los archivos estáticos y atiende /api/* con el MISMO Worker de producción,
   pero con SQLite (en memoria, o en el archivo DEV_DB) en lugar de Neon.
   Uso:  node test/dev-server.mjs            → http://localhost:8791
   Contraseña del panel en local: admin123  (solo para pruebas; en Cloudflare es un secreto aparte) */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import worker from '../src/worker.js';

const root = path.resolve(import.meta.dirname, '..');
const port = Number(process.env.PORT) || 8791;
const sqlite = new DatabaseSync(process.env.DEV_DB || ':memory:');
const env = {
  __sql: (sql, params) => sqlite.prepare(sql).all(...params),
  ADMIN_PASSWORD: 'admin123', SESSION_SECRET: 'solo-para-pruebas-locales-0123456789'
};
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon' };
const PRIVATE = /^\/(src|test|node_modules|\.claude|respaldo|mockups)\//;

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const r = await worker.fetch(new Request(url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks) }), env);
    res.writeHead(r.status, Object.fromEntries(r.headers));
    return res.end(Buffer.from(await r.arrayBuffer()));
  }
  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.join(root, rel);
  if (PRIVATE.test(rel) || !file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('No encontrado'); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log(`Gro’smania (local) en http://localhost:${port}   ·   panel: /admin.html`));
