/* Acceso a la base de datos. El SQL se escribe con $1, $2… y solo usa TEXT e INTEGER,
   así sirve igual en PostgreSQL (Neon), en D1 (SQLite de Cloudflare) y en SQLite local para pruebas.

   Orden de preferencia:
     1. env.__sql   → solo pruebas (SQLite local)
     2. env.DB      → base D1 de Cloudflare, si algún día se prefiere
     3. env.DATABASE_URL → Neon (secreto), consultado por HTTPS sin librerías */

const toQ = (sql) => sql.replace(/\$(\d+)/g, '?$1');
const clean = (params) => params.map((v) => (v === undefined ? null : v));

export function makeDb(env) {
  if (env.__sql) return { all: async (sql, p = []) => env.__sql(toQ(sql), clean(p)) };

  if (env.DB) {
    return { all: async (sql, p = []) => (await env.DB.prepare(toQ(sql)).bind(...clean(p)).all()).results || [] };
  }

  if (env.DATABASE_URL) {
    let endpoint;
    try { endpoint = `https://${new URL(env.DATABASE_URL).host}/sql`; }
    catch (_) { throw new Error('DATABASE_URL no es una dirección válida de Neon.'); }
    return {
      async all(sql, p = []) {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'Neon-Connection-String': env.DATABASE_URL },
          body: JSON.stringify({ query: sql, params: clean(p).map((v) => (v === null ? null : String(v))) })
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(`Neon respondió ${res.status}: ${body.message || 'error'}`);
        const fields = (body.fields || []).map((f) => f.name);
        return (body.rows || []).map((r) => (Array.isArray(r) ? Object.fromEntries(r.map((v, i) => [fields[i], v])) : r));
      }
    };
  }

  throw new Error('No hay base de datos configurada (falta el secreto DATABASE_URL).');
}

export const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS products (
     id TEXT PRIMARY KEY, name TEXT NOT NULL, cat TEXT NOT NULL, price INTEGER NOT NULL, img TEXT NOT NULL DEFAULT '',
     pos TEXT NOT NULL DEFAULT 'center', descr TEXT NOT NULL DEFAULT '', alt TEXT NOT NULL DEFAULT '',
     flavors INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1, sort INTEGER NOT NULL DEFAULT 0,
     groups TEXT NOT NULL DEFAULT '[]')`,
  `CREATE TABLE IF NOT EXISTS flavors (id TEXT PRIMARY KEY, name TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, sort INTEGER NOT NULL DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS clients (phone TEXT PRIMARY KEY, name TEXT NOT NULL, birth TEXT NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS moves (
     id TEXT PRIMARY KEY, phone TEXT NOT NULL, date TEXT NOT NULL, type TEXT NOT NULL, points INTEGER NOT NULL,
     amount INTEGER NOT NULL DEFAULT 0, note TEXT NOT NULL DEFAULT '', expires_at TEXT)`,
  `CREATE INDEX IF NOT EXISTS moves_phone ON moves (phone)`,
  `CREATE TABLE IF NOT EXISTS comments (
     id TEXT PRIMARY KEY, name TEXT NOT NULL, rating INTEGER NOT NULL, text TEXT NOT NULL,
     status TEXT NOT NULL DEFAULT 'pendiente', created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS login_fails (id TEXT PRIMARY KEY, ip TEXT NOT NULL, ts TEXT NOT NULL)`
];
