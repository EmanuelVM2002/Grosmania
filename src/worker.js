/* =====================================================================
   GRO’SMANIA — Cloudflare Worker
   Sirve la API (/api/*) y deja el resto a los archivos estáticos (ASSETS).
   Secretos (wrangler secret put …):
     DATABASE_URL    cadena de conexión de Neon
     ADMIN_PASSWORD  contraseña del administrador
     SESSION_SECRET  texto largo y aleatorio para firmar las sesiones
   Variable opcional: ADMIN_USER (por defecto «admin»).
   ===================================================================== */
import { makeDb, SCHEMA } from './db.js';
import { computeLedger, levelIndex, addMonths, bogotaDay, bogotaMonth } from './ledger.js';
import { DEFAULT_SETTINGS, PUBLIC_SETTINGS, PHOTOS, SEED_PRODUCTS, SEED_FLAVORS } from './seed.js';

/* ---------- utilidades ---------- */

class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
const bad = (msg) => new HttpError(400, msg);

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});

const uid = () => Date.now().toString(36) + crypto.randomUUID().replace(/-/g, '').slice(0, 8);
const nowIso = () => new Date().toISOString();

function str(v, min, max, label) {
  const s = String(v ?? '').trim().replace(/\s+/g, ' ');
  if (s.length < min) throw bad(min === 1 ? `Falta: ${label}.` : `${label}: escribe al menos ${min} letras.`);
  if (s.length > max) throw bad(`${label}: máximo ${max} caracteres.`);
  return s;
}
function int(v, min, max, label) {
  const n = typeof v === 'number' ? v : parseInt(String(v ?? '').replace(/[^\d-]/g, ''), 10);
  if (!Number.isInteger(n) || n < min || n > max) throw bad(`${label}: debe ser un número entre ${min} y ${max}.`);
  return n;
}
/* Número con decimales (hasta 2), p. ej. pesos por metro o coordenadas (hasta 7). */
function dec(v, min, max, label, places = 2) {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim().replace(',', '.'));
  if (!Number.isFinite(n) || n < min || n > max) throw bad(`${label}: debe ser un número entre ${min} y ${max}.`);
  const k = 10 ** places;
  return Math.round(n * k) / k;
}
const flag = (v) => (v === true || v === 1 || v === '1' || v === 'true' ? 1 : 0);
const isPhone = (p) => /^3\d{9}$/.test(p);
const normPhone = (raw) => { let d = String(raw || '').replace(/\D/g, ''); if (d.length === 12 && d.startsWith('57')) d = d.slice(2); return d; };

function checkBirth(b) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(b))) throw bad('Revisa la fecha de nacimiento.');
  const d = new Date(b + 'T12:00:00Z');
  const age = (Date.now() - d.getTime()) / (365.25 * 864e5);
  if (Number.isNaN(+d) || age < 0 || age > 110) throw bad('Revisa la fecha de nacimiento.');
  return b;
}

async function readBody(req) {
  const text = await req.text();
  if (text.length > 20000) throw bad('La solicitud es demasiado grande.');
  try { const b = JSON.parse(text || '{}'); if (b && typeof b === 'object') return b; } catch (_) { /* cae abajo */ }
  throw bad('La solicitud no es válida.');
}

const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'item';

/* ---------- base de datos: tablas y datos iniciales ---------- */

const ready = new WeakMap();
function ensureReady(env, db) {
  if (!ready.has(env)) {
    const p = (async () => {
      for (const stmt of SCHEMA) await db.all(stmt);
      const rows = Object.entries(DEFAULT_SETTINGS);
      await db.all(
        `INSERT INTO settings (key, value) VALUES ${rows.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ')} ON CONFLICT (key) DO NOTHING`,
        rows.flatMap(([k, v]) => [k, JSON.stringify(v)]));
      if (!(await db.all('SELECT id FROM products LIMIT 1')).length) {
        const cols = 11, per = 8;                       // lotes de 8 filas: D1 admite máx. 100 parámetros por consulta
        for (let s = 0; s < SEED_PRODUCTS.length; s += per) {
          const batch = SEED_PRODUCTS.slice(s, s + per);
          await db.all(
            `INSERT INTO products (id, name, cat, price, img, pos, descr, alt, flavors, sort, groups) VALUES ${batch.map((_, i) => `(${Array.from({ length: cols }, (_, j) => `$${i * cols + j + 1}`).join(', ')})`).join(', ')}`,
            batch.flatMap((p, i) => [p.id, p.name, p.cat, p.price, p.img, p.pos, p.descr, p.alt, p.flavors, s + i + 1, JSON.stringify(p.groups)]));
        }
      }
      if (!(await db.all('SELECT id FROM flavors LIMIT 1')).length) {
        await db.all(
          `INSERT INTO flavors (id, name, sort) VALUES ${SEED_FLAVORS.map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`).join(', ')}`,
          SEED_FLAVORS.flatMap((n, i) => [slug(n), n, i + 1]));
      }
    })();
    ready.set(env, p);
    p.catch(() => ready.delete(env));
  }
  return ready.get(env);
}

async function loadSettings(db) {
  const out = { ...DEFAULT_SETTINGS };
  for (const r of await db.all('SELECT key, value FROM settings')) {
    if (r.key in out) { try { out[r.key] = JSON.parse(r.value); } catch (_) { /* se queda el valor por defecto */ } }
  }
  return out;
}
const publicSettings = (s) => Object.fromEntries(PUBLIC_SETTINGS.map((k) => [k, s[k]]));

const parseGroups = (s) => { try { const v = JSON.parse(s); return Array.isArray(v) ? v : []; } catch (_) { return []; } };
const productOut = (r) => ({
  id: r.id, name: r.name, cat: r.cat, price: Number(r.price), img: r.img, pos: r.pos, desc: r.descr, alt: r.alt || r.name,
  flavors: Number(r.flavors), active: Number(r.active) === 1, sort: Number(r.sort), groups: parseGroups(r.groups)
});
const flavorOut = (r) => ({ id: r.id, name: r.name, active: Number(r.active) === 1, sort: Number(r.sort) });

/* ---------- sesión del administrador ---------- */

const enc = new TextEncoder();
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const hmacKey = (env, usage) => crypto.subtle.importKey('raw', enc.encode(env.SESSION_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, [usage]);

async function makeToken(env) {
  const payload = b64u(enc.encode(JSON.stringify({ exp: Date.now() + 12 * 3600e3 })));
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(env, 'sign'), enc.encode(payload));
  return `${payload}.${b64u(sig)}`;
}
async function checkToken(env, req) {
  if (!env.SESSION_SECRET) throw new HttpError(500, 'Falta configurar el secreto SESSION_SECRET.');
  const m = /^Bearer (.+)$/.exec(req.headers.get('authorization') || '');
  const [payload, sig] = (m ? m[1] : '').split('.');
  if (!payload || !sig) throw new HttpError(401, 'Inicia sesión.');
  try {
    const ok = await crypto.subtle.verify('HMAC', await hmacKey(env, 'verify'), unb64u(sig), enc.encode(payload));
    if (ok && JSON.parse(new TextDecoder().decode(unb64u(payload))).exp > Date.now()) return;
  } catch (_) { /* cae abajo */ }
  throw new HttpError(401, 'Tu sesión venció. Entra de nuevo.');
}
async function sameSecret(a, b) {
  const [x, y] = await Promise.all([a, b].map(async (s) => new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(String(s))))));
  let diff = 0; for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

async function login(env, db, req) {
  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) throw new HttpError(500, 'Falta configurar ADMIN_PASSWORD y SESSION_SECRET en Cloudflare.');
  const ip = req.headers.get('cf-connecting-ip') || 'local';
  const since = new Date(Date.now() - 15 * 60e3).toISOString();
  const fails = await db.all('SELECT id FROM login_fails WHERE ip = $1 AND ts > $2', [ip, since]);
  if (fails.length >= 8) throw new HttpError(429, 'Demasiados intentos. Espera 15 minutos.');
  const b = await readBody(req);
  const okUser = await sameSecret(b.user ?? '', env.ADMIN_USER || 'admin');
  const okPass = await sameSecret(b.password ?? '', env.ADMIN_PASSWORD);
  if (!(okUser && okPass)) {
    await db.all('INSERT INTO login_fails (id, ip, ts) VALUES ($1, $2, $3)', [uid(), ip, nowIso()]);
    throw new HttpError(401, 'Usuario o contraseña incorrectos.');
  }
  await db.all('DELETE FROM login_fails WHERE ts < $1', [since]);
  return json({ token: await makeToken(env) });
}

/* ---------- puntos ---------- */

async function clientMoves(db, phone) {
  return (await db.all('SELECT * FROM moves WHERE phone = $1', [phone])).map((m) => ({ ...m, points: Number(m.points), amount: Number(m.amount) }));
}
const statsOf = (settings, moves, now) => {
  const l = computeLedger(moves, now);
  return { ...l, level: levelIndex(settings.levels, l.lifetime) };
};

async function addMove(db, settings, client, b) {
  const now = nowIso();
  const moves = await clientMoves(db, client.phone);
  const bal = computeLedger(moves, now).balance;
  const type = String(b.type);
  let points = 0, amount = 0, note = '', expires = null;

  if (type === 'compra') {
    amount = int(b.amount, settings.points_per, 50_000_000, `El valor de los productos (mínimo ${settings.points_per} pesos)`);
    points = Math.floor(amount / settings.points_per);
    expires = addMonths(now, settings.points_valid_months);
    note = str(b.note ?? '', 0, 120, 'La nota');
  } else if (type === 'canje') {
    const reward = settings.rewards.find((r) => r.id === b.reward);
    if (!reward) throw bad('Elige un premio.');
    const product = str(b.product, 2, 80, 'El producto sobre el que se aplica el premio');
    if (!flag(b.noPromo)) throw bad('Confirma que el premio no se combina con otra promoción.');
    if (bal < reward.pts) throw bad('No alcanzan los puntos.');
    const today = bogotaDay(now);
    if (moves.some((m) => m.type === 'canje' && bogotaDay(m.date) === today)) throw new HttpError(409, 'Este cliente ya canjeó un premio hoy: se canjea uno a la vez.');
    points = -reward.pts;
    note = `${reward.name} · ${product}`;
  } else if (type === 'ajuste') {
    points = int(b.points, -100000, 100000, 'Los puntos');
    if (!points) throw bad('Escribe cuántos puntos sumar o restar.');
    note = str(b.note, 3, 120, 'El motivo');
    if (bal + points < 0) throw bad('El cliente no puede quedar con puntos negativos.');
    if (points > 0) expires = addMonths(now, settings.points_valid_months);
  } else if (type === 'cumple') {
    const year = bogotaDay(now).slice(0, 4);
    if (moves.some((m) => m.type === 'cumple' && bogotaDay(m.date).slice(0, 4) === year)) throw new HttpError(409, 'El regalo de este año ya se entregó.');
    note = settings.birthday_gift;
  } else throw bad('Tipo de movimiento no válido.');

  await db.all(
    'INSERT INTO moves (id, phone, date, type, points, amount, note, expires_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
    [uid(), client.phone, now, type, points, amount, note, expires]);
  return { points };
}

function buildReport({ clients, moves, ledgers, settings, now }) {
  const month = bogotaMonth(now);
  const monthsBack = [];
  { let [y, m] = month.split('-').map(Number); for (let i = 0; i < 6; i++) { monthsBack.unshift(`${y}-${String(m).padStart(2, '0')}`); m--; if (m === 0) { m = 12; y--; } } }
  const series = Object.fromEntries(monthsBack.map((k) => [k, { month: k, sales: 0, issued: 0, redeemed: 0 }]));
  const total = { issued: 0, redeemed: 0, adjustedDown: 0, sales: 0, redemptions: 0 };
  const cur = { sales: 0, issued: 0, redeemed: 0, redemptions: 0, members: 0 };
  const rewards = {};

  for (const m of moves) {
    const k = bogotaMonth(m.date), s = series[k], p = m.points;
    if (p > 0) { total.issued += p; if (s) s.issued += p; if (k === month) cur.issued += p; }
    if (m.type === 'compra') { total.sales += m.amount; if (s) s.sales += m.amount; if (k === month) cur.sales += m.amount; }
    if (m.type === 'canje') {
      total.redeemed += -p; total.redemptions++;
      if (s) s.redeemed += -p;
      if (k === month) { cur.redeemed += -p; cur.redemptions++; }
      const name = m.note.split(' · ')[0]; rewards[name] = (rewards[name] || 0) + 1;
    }
    if (m.type === 'ajuste' && p < 0) total.adjustedDown += -p;
  }
  cur.members = clients.filter((c) => bogotaMonth(c.created_at) === month).length;

  const sum = (f) => Object.values(ledgers).reduce((a, l) => a + l[f], 0);
  const top = clients.map((c) => ({ phone: c.phone, name: c.name, balance: ledgers[c.phone].balance }))
    .filter((c) => c.balance > 0).sort((a, b) => b.balance - a.balance).slice(0, 5);

  return {
    month,
    totals: { clients: clients.length, available: sum('balance'), expired: sum('expired'), expiring30: sum('expiring30'), ...total },
    current: cur,
    series: monthsBack.map((k) => series[k]),
    rewards: Object.entries(rewards).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    top,
    goals: [
      { key: 'sales', label: 'Ventas del mes (productos)', goal: settings.goal_monthly_sales, value: cur.sales, money: true },
      { key: 'members', label: 'Clientes nuevos en el Club', goal: settings.goal_monthly_members, value: cur.members },
      { key: 'redeemed', label: 'Puntos canjeados en el mes', goal: settings.goal_monthly_redeemed, value: cur.redeemed }
    ]
  };
}

/* ---------- validación de ajustes ---------- */

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const SETTING_RULES = {
  delivery_enabled: (v) => v === true || v === false ? v : (() => { throw bad('Domicilios: valor no válido.'); })(),
  delivery_min_order: (v) => int(v, 0, 1_000_000, 'El pedido mínimo para domicilio'),
  delivery_tiers: (v) => {
    if (!Array.isArray(v) || v.length > 8) throw bad('Los tramos del domicilio no son válidos (máximo 8).');
    const t = v.map((x) => ({ upTo: int(x.upTo, 1, 50000, 'La distancia del tramo'), fee: int(x.fee, 0, 200000, 'El valor del tramo') })).sort((a, b) => a.upTo - b.upTo);
    if (new Set(t.map((x) => x.upTo)).size !== t.length) throw bad('Dos tramos tienen la misma distancia.');
    return t;                           // sin tramos: todo se cobra por metro
  },
  delivery_max_meters: (v) => int(v, 0, 50000, 'La distancia máxima del domicilio'),
  delivery_per_meter: (v) => dec(v, 0, 1000, 'El valor por metro'),
  store_lat: (v) => dec(v, -90, 90, 'La latitud del local', 7),
  store_lng: (v) => dec(v, -180, 180, 'La longitud del local', 7),
  delivery_zones: (v) => {
    if (!Array.isArray(v)) throw bad('Los barrios de domicilio no son válidos.');
    const names = [...new Set(v.map((n) => str(n, 0, 60, 'El nombre del barrio')).filter(Boolean))];
    if (names.length > 80) throw bad('Pon como máximo 80 barrios.');
    return names;                       // lista vacía = domicilio sin restricción de barrio
  },
  delivery_note: (v) => str(v, 0, 300, 'La nota de cobertura'),
  open_time: (v) => { if (!HHMM.test(v)) throw bad('La hora de apertura debe ser HH:MM.'); return v; },
  close_time: (v) => { if (!HHMM.test(v)) throw bad('La hora de cierre debe ser HH:MM.'); return v; },
  open_days: (v) => {
    if (!Array.isArray(v) || v.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) throw bad('Días de atención no válidos.');
    return [...new Set(v)].sort();
  },
  status_override: (v) => { if (!['auto', 'open', 'closed'].includes(v)) throw bad('Estado del local no válido.'); return v; },
  closed_message: (v) => str(v, 0, 200, 'El mensaje de cierre'),
  transfer_info: (v) => str(v, 0, 300, 'Los datos de transferencia'),
  points_per: (v) => int(v, 100, 100000, 'Pesos por punto'),
  points_valid_months: (v) => int(v, 1, 60, 'Meses de vigencia'),
  birthday_gift: (v) => str(v, 3, 200, 'El regalo de cumpleaños'),
  rewards: (v) => {
    if (!Array.isArray(v) || !v.length || v.length > 12) throw bad('Define entre 1 y 12 premios.');
    const seen = new Set();
    return v.map((r) => {
      const name = str(r.name, 2, 60, 'El nombre del premio');
      let id = slug(String(r.id || name)); while (seen.has(id)) id += '-2'; seen.add(id);
      return { id, name, pts: int(r.pts, 1, 100000, 'Los puntos del premio') };
    });
  },
  levels: (v) => {
    if (!Array.isArray(v) || !v.length || v.length > 6) throw bad('Define entre 1 y 6 niveles.');
    const l = v.map((x) => ({ name: str(x.name, 2, 30, 'El nombre del nivel'), min: int(x.min, 0, 10_000_000, 'Los puntos del nivel') })).sort((a, b) => a.min - b.min);
    if (l[0].min !== 0) throw bad('El primer nivel debe empezar en 0 puntos.');
    return l;
  },
  goal_monthly_sales: (v) => int(v, 0, 1_000_000_000, 'La meta de ventas'),
  goal_monthly_members: (v) => int(v, 0, 100000, 'La meta de clientes nuevos'),
  goal_monthly_redeemed: (v) => int(v, 0, 10_000_000, 'La meta de puntos canjeados')
};

/* ---------- rutas públicas ---------- */

async function publicMenu(env, db) {
  try {
    await ensureReady(env, db);
    const [settings, products, flavors] = await Promise.all([
      loadSettings(db),
      db.all('SELECT * FROM products WHERE active = 1 ORDER BY sort'),
      db.all('SELECT * FROM flavors WHERE active = 1 ORDER BY sort')
    ]);
    return json({ settings: publicSettings(settings), products: products.map(productOut), flavors: flavors.map(flavorOut) });
  } catch (err) {
    // Si la base no responde, la carta sigue visible con los datos iniciales.
    console.error('menu: usando datos iniciales', err.message);
    return json({
      offline: true, settings: publicSettings(DEFAULT_SETTINGS),
      products: SEED_PRODUCTS.map((p, i) => ({ ...p, desc: p.descr, active: true, sort: i + 1 })),
      flavors: SEED_FLAVORS.map((n, i) => ({ id: slug(n), name: n, active: true, sort: i + 1 }))
    });
  }
}

async function publicComments(db) {
  const rows = await db.all(`SELECT name, rating, text, created_at FROM comments WHERE status = 'publicado' ORDER BY created_at DESC LIMIT 30`);
  const avg = rows.length ? rows.reduce((a, r) => a + Number(r.rating), 0) / rows.length : 0;
  return json({ comments: rows.map((r) => ({ name: r.name, rating: Number(r.rating), text: r.text, date: r.created_at })), average: Math.round(avg * 10) / 10 });
}

async function postComment(db, req) {
  const b = await readBody(req);
  if (b.website) return json({ ok: true });                       // campo trampa para robots
  const name = str(b.name, 2, 60, 'Tu nombre');
  const rating = int(b.rating, 1, 5, 'La calificación');
  const text = str(b.text, 5, 500, 'Tu comentario');
  const recent = await db.all('SELECT id FROM comments WHERE created_at > $1', [new Date(Date.now() - 3600e3).toISOString()]);
  if (recent.length >= 30) throw new HttpError(429, 'Hay muchos comentarios en este momento. Intenta más tarde.');
  await db.all(`INSERT INTO comments (id, name, rating, text, status, created_at) VALUES ($1, $2, $3, $4, 'pendiente', $5)`, [uid(), name, rating, text, nowIso()]);
  return json({ ok: true });
}

async function publicPoints(db, req) {
  const b = await readBody(req);
  const phone = normPhone(b.phone);
  const notFound = new HttpError(404, 'No encontramos ese celular con esa fecha de cumpleaños. Si ya eres del Club, revisa los datos o escríbenos por WhatsApp.');
  if (!isPhone(phone) || !/^\d{4}-\d{2}-\d{2}$/.test(String(b.birth))) throw notFound;
  const [c] = await db.all('SELECT * FROM clients WHERE phone = $1', [phone]);
  if (!c || c.birth !== b.birth) throw notFound;          // el cumpleaños hace de segunda clave
  const settings = await loadSettings(db);
  const s = statsOf(settings, await clientMoves(db, phone), nowIso());
  return json({
    name: c.name.split(' ')[0], balance: s.balance, level: settings.levels[s.level].name,
    nextExpiry: s.nextExpiry, expiring30: s.expiring30
  });
}

/* ---------- rutas del administrador ---------- */

async function adminData(db) {
  const now = nowIso();
  const [settings, products, flavors, clients, moves, comments] = await Promise.all([
    loadSettings(db),
    db.all('SELECT * FROM products ORDER BY sort'),
    db.all('SELECT * FROM flavors ORDER BY sort'),
    db.all('SELECT * FROM clients'),
    db.all('SELECT * FROM moves ORDER BY date DESC'),
    db.all('SELECT * FROM comments ORDER BY created_at DESC')
  ]);
  const mv = moves.map((m) => ({ ...m, points: Number(m.points), amount: Number(m.amount) }));
  const byPhone = {};
  mv.forEach((m) => { (byPhone[m.phone] ||= []).push(m); });
  const ledgers = {};
  clients.forEach((c) => { ledgers[c.phone] = computeLedger(byPhone[c.phone] || [], now); });
  return {
    now, settings, photos: PHOTOS,
    products: products.map(productOut), flavors: flavors.map(flavorOut),
    clients: clients.map((c) => ({ ...c, ...ledgers[c.phone], level: levelIndex(settings.levels, ledgers[c.phone].lifetime) })),
    moves: mv, comments: comments.map((c) => ({ ...c, rating: Number(c.rating) })),
    report: buildReport({ clients, moves: mv, ledgers, settings, now })
  };
}

/* Grupos de opciones del producto: [{name, count, choices[]}], p. ej. «Salsa» ×1 con 5 opciones. */
function checkGroups(v) {
  if (!Array.isArray(v) || v.length > 5) throw bad('Un producto admite hasta 5 grupos de opciones.');
  return v.map((x) => {
    const choices = [...new Set((Array.isArray(x.choices) ? x.choices : []).map((c) => str(c, 1, 40, 'Una opción')))];
    if (choices.length < 2 || choices.length > 40) throw bad('Cada grupo necesita entre 2 y 40 opciones.');
    return { name: str(x.name, 1, 40, 'El nombre del grupo de opciones'), count: int(x.count, 1, 6, 'Cuántas opciones se eligen'), choices };
  });
}

function productFields(b, cur = {}) {
  const img = b.img ?? cur.img ?? '';
  if (img && !PHOTOS.includes(img)) throw bad('Elige una de las fotos disponibles.');
  const pos = String(b.pos ?? cur.pos ?? 'center');
  if (!/^[\w% .-]{1,30}$/.test(pos)) throw bad('Posición de la foto no válida.');
  const name = str(b.name ?? cur.name, 2, 80, 'El nombre');
  return {
    name, cat: str(b.cat ?? cur.cat, 2, 40, 'La categoría'),
    price: int(b.price ?? cur.price, 0, 1_000_000, 'El precio'),
    img, pos, descr: str(b.desc ?? cur.descr ?? '', 0, 300, 'La descripción'),
    alt: str(b.alt ?? cur.alt ?? name, 0, 120, 'El texto de la foto'),
    flavors: int(b.flavors ?? cur.flavors ?? 0, 0, 5, 'Los sabores a elegir'),
    active: flag(b.active ?? cur.active ?? 1),
    groups: JSON.stringify(checkGroups(b.groups ?? (cur.groups ? parseGroups(cur.groups) : [])))
  };
}

async function adminRoute(env, db, req, url, parts) {
  const method = req.method, [res, id, sub] = parts;      // /api/admin/<res>/<id>/<sub>
  await ensureReady(env, db);

  if (res === 'data' && method === 'GET') return json(await adminData(db));

  if (res === 'settings' && method === 'PUT') {
    const b = await readBody(req), entries = [];
    for (const [k, v] of Object.entries(b)) {
      if (!SETTING_RULES[k]) throw bad(`Ajuste desconocido: ${k}`);
      entries.push([k, JSON.stringify(SETTING_RULES[k](v))]);
    }
    if (!entries.length) throw bad('No hay nada que guardar.');
    await db.all(
      `INSERT INTO settings (key, value) VALUES ${entries.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ')} ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
      entries.flat());
    return json({ ok: true });
  }

  if (res === 'products') {
    if (method === 'POST' && !id) {
      const f = productFields(await readBody(req));
      const [{ m } = { m: 0 }] = await db.all('SELECT MAX(sort) AS m FROM products');
      const pid = `${slug(f.name)}-${uid().slice(-4)}`;
      await db.all(
        'INSERT INTO products (id, name, cat, price, img, pos, descr, alt, flavors, active, sort, groups) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
        [pid, f.name, f.cat, f.price, f.img, f.pos, f.descr, f.alt, f.flavors, f.active, Number(m || 0) + 1, f.groups]);
      return json({ id: pid });
    }
    const [cur] = await db.all('SELECT * FROM products WHERE id = $1', [id || '']);
    if (!cur) throw new HttpError(404, 'Producto no encontrado.');
    if (method === 'PUT') {
      const f = productFields(await readBody(req), cur);
      await db.all('UPDATE products SET name=$1, cat=$2, price=$3, img=$4, pos=$5, descr=$6, alt=$7, flavors=$8, active=$9, groups=$10 WHERE id=$11',
        [f.name, f.cat, f.price, f.img, f.pos, f.descr, f.alt, f.flavors, f.active, f.groups, id]);
      return json({ ok: true });
    }
    if (method === 'DELETE') { await db.all('DELETE FROM products WHERE id = $1', [id]); return json({ ok: true }); }
  }

  if (res === 'flavors') {
    if (method === 'POST' && !id) {
      const name = str((await readBody(req)).name, 2, 40, 'El nombre del sabor');
      if ((await db.all('SELECT id FROM flavors')).some((f) => f.id === slug(name))) throw new HttpError(409, 'Ese sabor ya existe.');
      const [{ m } = { m: 0 }] = await db.all('SELECT MAX(sort) AS m FROM flavors');
      await db.all('INSERT INTO flavors (id, name, active, sort) VALUES ($1, $2, 1, $3)', [slug(name), name, Number(m || 0) + 1]);
      return json({ ok: true });
    }
    const [cur] = await db.all('SELECT * FROM flavors WHERE id = $1', [id || '']);
    if (!cur) throw new HttpError(404, 'Sabor no encontrado.');
    if (method === 'PUT') {
      const b = await readBody(req);
      await db.all('UPDATE flavors SET name=$1, active=$2 WHERE id=$3',
        [str(b.name ?? cur.name, 2, 40, 'El nombre del sabor'), flag(b.active ?? cur.active), id]);
      return json({ ok: true });
    }
    if (method === 'DELETE') { await db.all('DELETE FROM flavors WHERE id = $1', [id]); return json({ ok: true }); }
  }

  if (res === 'clients') {
    if (method === 'POST' && !id) {
      const b = await readBody(req), phone = normPhone(b.phone);
      if (!isPhone(phone)) throw bad('El celular debe tener 10 números y empezar por 3.');
      if ((await db.all('SELECT phone FROM clients WHERE phone = $1', [phone])).length) throw new HttpError(409, 'Ya existe un cliente con ese celular.');
      await db.all('INSERT INTO clients (phone, name, birth, created_at) VALUES ($1, $2, $3, $4)',
        [phone, str(b.name, 3, 80, 'El nombre'), checkBirth(b.birth), nowIso()]);
      return json({ phone });
    }
    const phone = normPhone(id);
    const [client] = await db.all('SELECT * FROM clients WHERE phone = $1', [phone]);
    if (!client) throw new HttpError(404, 'Cliente no encontrado.');
    if (method === 'PUT' && !sub) {
      const b = await readBody(req);
      await db.all('UPDATE clients SET name=$1, birth=$2 WHERE phone=$3', [str(b.name ?? client.name, 3, 80, 'El nombre'), checkBirth(b.birth ?? client.birth), phone]);
      return json({ ok: true });
    }
    if (method === 'DELETE' && !sub) {
      await db.all('DELETE FROM moves WHERE phone = $1', [phone]);
      await db.all('DELETE FROM clients WHERE phone = $1', [phone]);
      return json({ ok: true });
    }
    if (sub === 'moves' && method === 'POST') return json(await addMove(db, await loadSettings(db), client, await readBody(req)));
  }

  if (res === 'comments' && id) {
    if (method === 'PUT') {
      const status = (await readBody(req)).status;
      if (!['pendiente', 'publicado', 'oculto'].includes(status)) throw bad('Estado no válido.');
      await db.all('UPDATE comments SET status = $1 WHERE id = $2', [status, id]);
      return json({ ok: true });
    }
    if (method === 'DELETE') { await db.all('DELETE FROM comments WHERE id = $1', [id]); return json({ ok: true }); }
  }

  throw new HttpError(404, 'No existe.');
}

/* ---------- entrada ---------- */

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS ? env.ASSETS.fetch(req) : new Response('No encontrado', { status: 404 });
    try {
      const db = makeDb(env), path = url.pathname.replace(/^\/api\//, '').replace(/\/+$/, '');
      const m = req.method;

      if (path === 'menu' && m === 'GET') return await publicMenu(env, db);
      await ensureReady(env, db);
      if (path === 'comments' && m === 'GET') return await publicComments(db);
      if (path === 'comments' && m === 'POST') return await postComment(db, req);
      if (path === 'points' && m === 'POST') return await publicPoints(db, req);
      if (path === 'admin/login' && m === 'POST') return await login(env, db, req);
      if (path.startsWith('admin/')) {
        await checkToken(env, req);
        return await adminRoute(env, db, req, url, path.slice(6).split('/').map(decodeURIComponent));
      }
      throw new HttpError(404, 'No existe.');
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message }, err.status);
      console.error(err);
      return json({ error: 'No pudimos conectar con la base de datos. Intenta de nuevo en un momento.' }, 500);
    }
  }
};
