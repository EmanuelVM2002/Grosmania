/* Pruebas del servidor sin red: usa SQLite de Node (node:sqlite) en lugar de Neon.
   Ejecutar:  node --test test/            (Node 22+) */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import worker from '../src/worker.js';
import { computeLedger, addMonths } from '../src/ledger.js';
import { SEED_PRODUCTS, SEED_FLAVORS, PHOTOS } from '../src/seed.js';
import fs from 'node:fs';

const sqlite = new DatabaseSync(':memory:');
const env = {
  __sql: (sql, params) => sqlite.prepare(sql).all(...params),
  ADMIN_PASSWORD: 'clave-de-prueba', SESSION_SECRET: 'secreto-de-prueba-largo-largo-largo'
};
const call = async (method, path, body, token) => {
  const res = await worker.fetch(new Request('https://x.test' + path, {
    method, headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  }), env);
  return { status: res.status, data: await res.json() };
};

let token;

test('menú público: carga datos iniciales, con helados y sabores', async () => {
  const { status, data } = await call('GET', '/api/menu');
  assert.equal(status, 200);
  assert.ok(!data.offline);
  assert.ok(data.products.some((p) => p.cat === 'Helados' && p.flavors > 0));
  assert.equal(data.flavors.length, SEED_FLAVORS.length);
  assert.ok(data.products.length >= 60, 'carta completa cargada');
  assert.ok(data.products.some((p) => p.groups.length), 'hay productos con opciones (salsa, fruta, topping)');
  assert.equal(data.settings.delivery_fee_max, 15500);
  assert.equal('goal_monthly_sales' in data.settings, false, 'las metas no deben ser públicas');
});

test('el panel exige sesión', async () => {
  assert.equal((await call('GET', '/api/admin/data')).status, 401);
  assert.equal((await call('GET', '/api/admin/data', undefined, 'basura.basura')).status, 401);
  assert.equal((await call('POST', '/api/admin/login', { user: 'admin', password: 'mala' })).status, 401);
  const ok = await call('POST', '/api/admin/login', { user: 'admin', password: 'clave-de-prueba' });
  assert.equal(ok.status, 200);
  token = ok.data.token;
  assert.equal((await call('GET', '/api/admin/data', undefined, token)).status, 200);
});

test('bloqueo tras demasiados intentos fallidos', async () => {
  let last;
  for (let i = 0; i < 9; i++) last = await call('POST', '/api/admin/login', { user: 'admin', password: 'x' + i });
  assert.equal(last.status, 429);
});

test('productos: crear, cambiar precio, desactivar (CRUD)', async () => {
  const c = await call('POST', '/api/admin/products', { name: 'Malteada', cat: 'Bebidas', price: 11000, desc: 'Rica', flavors: 1 }, token);
  assert.equal(c.status, 200);
  assert.equal((await call('PUT', `/api/admin/products/${c.data.id}`, { price: 12000 }, token)).status, 200);
  let menu = (await call('GET', '/api/menu')).data;
  assert.equal(menu.products.find((p) => p.id === c.data.id).price, 12000);
  await call('PUT', `/api/admin/products/${c.data.id}`, { active: false }, token);
  menu = (await call('GET', '/api/menu')).data;
  assert.ok(!menu.products.some((p) => p.id === c.data.id), 'un producto inactivo no se muestra');
  assert.equal((await call('POST', '/api/admin/products', { name: 'X', cat: 'Y', price: -5 }, token)).status, 400);
  assert.equal((await call('POST', '/api/admin/products', { name: 'Malo', cat: 'Y', price: 5, img: '../secreto.png' }, token)).status, 400);
  assert.equal((await call('DELETE', `/api/admin/products/${c.data.id}`, undefined, token)).status, 200);
});

test('sabores: agregar, ocultar, repetido', async () => {
  assert.equal((await call('POST', '/api/admin/flavors', { name: 'Lulo' }, token)).status, 200);
  assert.equal((await call('POST', '/api/admin/flavors', { name: 'Lulo' }, token)).status, 409);
  await call('PUT', '/api/admin/flavors/lulo', { active: false }, token);
  assert.ok(!(await call('GET', '/api/menu')).data.flavors.some((f) => f.id === 'lulo'));
});

test('domicilios: apagar y encender desde el panel', async () => {
  await call('PUT', '/api/admin/settings', { delivery_enabled: false }, token);
  assert.equal((await call('GET', '/api/menu')).data.settings.delivery_enabled, false);
  await call('PUT', '/api/admin/settings', { delivery_enabled: true }, token);
  assert.equal((await call('GET', '/api/menu')).data.settings.delivery_enabled, true);
  assert.equal((await call('PUT', '/api/admin/settings', { delivery_enabled: 'si' }, token)).status, 400);
  assert.equal((await call('PUT', '/api/admin/settings', { inventado: 1 }, token)).status, 400);
  assert.equal((await call('PUT', '/api/admin/settings', { open_time: '25:99' }, token)).status, 400);
});

const PHONE = '3001234567';
test('clientes: crear, validar duplicado y celular', async () => {
  assert.equal((await call('POST', '/api/admin/clients', { name: 'Laura Gómez', phone: '300 123 4567', birth: '1990-05-20' }, token)).status, 200);
  assert.equal((await call('POST', '/api/admin/clients', { name: 'Laura Gómez', phone: PHONE, birth: '1990-05-20' }, token)).status, 409);
  assert.equal((await call('POST', '/api/admin/clients', { name: 'Otro Cliente', phone: '123', birth: '1990-05-20' }, token)).status, 400);
  assert.equal((await call('POST', '/api/admin/clients', { name: 'Otro Cliente', phone: '3109876543', birth: '2999-01-01' }, token)).status, 400);
});

test('puntos: solo por el valor de los productos, 1 por cada $1.000', async () => {
  const r = await call('POST', `/api/admin/clients/${PHONE}/moves`, { type: 'compra', amount: 45600 }, token);
  assert.equal(r.status, 200);
  assert.equal(r.data.points, 45);
  assert.equal((await call('POST', `/api/admin/clients/${PHONE}/moves`, { type: 'compra', amount: 500 }, token)).status, 400);
});

test('canje: un premio, un producto, sin promoción, uno por día', async () => {
  await call('POST', `/api/admin/clients/${PHONE}/moves`, { type: 'compra', amount: 80000 }, token);   // 45 + 80 = 125
  const base = { type: 'canje', reward: 'cono', product: 'Cono sencillo' };
  assert.equal((await call('POST', `/api/admin/clients/${PHONE}/moves`, { ...base, noPromo: false }, token)).status, 400, 'pide confirmar que no se combina');
  assert.equal((await call('POST', `/api/admin/clients/${PHONE}/moves`, { ...base, product: '' , noPromo: true }, token)).status, 400, 'pide el producto');
  assert.equal((await call('POST', `/api/admin/clients/${PHONE}/moves`, { ...base, noPromo: true }, token)).status, 200);
  assert.equal((await call('POST', `/api/admin/clients/${PHONE}/moves`, { ...base, noPromo: true }, token)).status, 409, 'solo uno a la vez');
  const d = (await call('GET', '/api/admin/data', undefined, token)).data;
  assert.equal(d.clients.find((c) => c.phone === PHONE).balance, 125 - 60);
});

test('ajuste no deja puntos negativos y cumpleaños solo una vez al año', async () => {
  assert.equal((await call('POST', `/api/admin/clients/${PHONE}/moves`, { type: 'ajuste', points: -9999, note: 'error' }, token)).status, 400);
  assert.equal((await call('POST', `/api/admin/clients/${PHONE}/moves`, { type: 'cumple' }, token)).status, 200);
  assert.equal((await call('POST', `/api/admin/clients/${PHONE}/moves`, { type: 'cumple' }, token)).status, 409);
});

test('consulta pública de puntos: celular + cumpleaños', async () => {
  const ok = await call('POST', '/api/points', { phone: '300 123 4567', birth: '1990-05-20' });
  assert.equal(ok.status, 200);
  assert.equal(ok.data.balance, 65);
  assert.equal(ok.data.name, 'Laura');
  assert.ok(ok.data.nextExpiry.date);
  assert.equal((await call('POST', '/api/points', { phone: PHONE, birth: '1990-05-21' })).status, 404);
  assert.equal((await call('POST', '/api/points', { phone: '3999999999', birth: '1990-05-20' })).status, 404);
});

test('vencimiento: los puntos vencidos no cuentan y se reportan', () => {
  const now = new Date().toISOString();
  const old = new Date(Date.now() - 400 * 864e5).toISOString();
  const moves = [
    { date: old, type: 'compra', points: 50, expires_at: addMonths(old, 6) },
    { date: now, type: 'compra', points: 20, expires_at: addMonths(now, 6) }
  ];
  const l = computeLedger(moves, now);
  assert.equal(l.balance, 20);
  assert.equal(l.expired, 50);
  assert.equal(l.lifetime, 70);
});

test('vencimiento: un canje gasta primero los puntos más viejos', () => {
  const t = (d) => new Date(Date.now() - d * 864e5).toISOString();
  const moves = [
    { date: t(150), points: 30, expires_at: addMonths(t(150), 6) },   // vence en ~30 días
    { date: t(10), points: 40, expires_at: addMonths(t(10), 6) },
    { date: t(5), points: -30, expires_at: null }
  ];
  const l = computeLedger(moves, new Date().toISOString());
  assert.equal(l.balance, 40);
  assert.equal(l.expiring30, 0, 'los 30 puntos próximos a vencer ya se gastaron primero');
});

test('reporte: totales cuadran (emitidos − canjeados − vencidos − descuentos = disponibles)', async () => {
  const r = (await call('GET', '/api/admin/data', undefined, token)).data.report;
  const t = r.totals;
  assert.equal(t.issued - t.redeemed - t.expired - t.adjustedDown, t.available);
  assert.equal(r.series.length, 6);
  assert.equal(t.sales, 125600);
  assert.equal(r.rewards[0].name, 'Cucurucho de 1 bola');
});

test('comentarios: llegan pendientes, se publican y se ocultan', async () => {
  assert.equal((await call('POST', '/api/comments', { name: 'Ana', rating: 5, text: 'Muy ricas las copas' })).status, 200);
  assert.equal((await call('POST', '/api/comments', { name: 'Ana', rating: 9, text: 'Muy ricas las copas' })).status, 400);
  assert.equal((await call('POST', '/api/comments', { name: 'Bot', rating: 5, text: 'spam spam', website: 'http://spam' })).status, 200);
  assert.equal((await call('GET', '/api/comments')).data.comments.length, 0, 'nada público sin aprobar');
  const list = (await call('GET', '/api/admin/data', undefined, token)).data.comments;
  assert.equal(list.length, 1, 'el robot (campo trampa) no guarda nada');
  await call('PUT', `/api/admin/comments/${list[0].id}`, { status: 'publicado' }, token);
  const pub = (await call('GET', '/api/comments')).data;
  assert.equal(pub.comments.length, 1);
  assert.equal(pub.average, 5);
  await call('PUT', `/api/admin/comments/${list[0].id}`, { status: 'oculto' }, token);
  assert.equal((await call('GET', '/api/comments')).data.comments.length, 0);
});

test('eliminar cliente borra su historial', async () => {
  assert.equal((await call('DELETE', `/api/admin/clients/${PHONE}`, undefined, token)).status, 200);
  const d = (await call('GET', '/api/admin/data', undefined, token)).data;
  assert.equal(d.clients.length, 0);
  assert.equal(d.moves.length, 0);
});

test('si la base falla, la carta sigue saliendo con datos iniciales', async () => {
  const broken = { __sql: () => { throw new Error('sin base'); } };
  const res = await worker.fetch(new Request('https://x.test/api/menu'), broken);
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.offline, true);
  assert.ok(data.products.length > 5);
});

test('la carta inicial es coherente: ids únicos, fotos que existen, grupos válidos', () => {
  const ids = SEED_PRODUCTS.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length, 'ids repetidos');
  for (const p of SEED_PRODUCTS) {
    assert.ok(p.price > 0 && p.price % 500 === 0, 'precio raro en ' + p.id);
    if (p.img) { assert.ok(PHOTOS.includes(p.img), p.id + ': foto fuera de la lista'); }
    for (const g of p.groups) assert.ok(g.choices.length >= 2 && g.count >= 1, 'grupo inválido en ' + p.id);
  }
  for (const f of PHOTOS) assert.ok(fs.existsSync(new URL('../' + f, import.meta.url)), 'falta el archivo ' + f);
});

test('productos: grupos de opciones se guardan y se validan', async () => {
  const body = { name: 'Waffle de prueba', cat: 'Waffles', price: 12000, groups: [{ name: 'Salsa', count: 1, choices: ['Chocolate', 'Mora'] }] };
  const c = await call('POST', '/api/admin/products', body, token);
  assert.equal(c.status, 200);
  const p = (await call('GET', '/api/menu')).data.products.find((x) => x.id === c.data.id);
  assert.deepEqual(p.groups, body.groups);
  assert.equal((await call('PUT', '/api/admin/products/' + c.data.id, { groups: [{ name: 'Salsa', count: 1, choices: ['Sola'] }] }, token)).status, 400);
  assert.equal((await call('PUT', '/api/admin/products/' + c.data.id, { price: 13000 }, token)).status, 200);
  const q = (await call('GET', '/api/menu')).data.products.find((x) => x.id === c.data.id);
  assert.equal(q.groups.length, 1, 'cambiar el precio no borra las opciones');
  await call('DELETE', '/api/admin/products/' + c.data.id, undefined, token);
});

test('menu-fallback.js está al día con src/seed.js', async () => {
  const { fallbackSource } = await import('./build-fallback.mjs');
  assert.equal(fs.readFileSync(new URL('../menu-fallback.js', import.meta.url), 'utf8'), fallbackSource(), 'ejecuta: node test/build-fallback.mjs');
});
