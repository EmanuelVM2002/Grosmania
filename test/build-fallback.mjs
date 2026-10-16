/* Genera menu-fallback.js a partir de src/seed.js: la carta inicial para cuando la página se abre
   sin servidor (doble clic en index.html) o si el servidor no responde.
   Ejecutar tras cambiar src/seed.js:   node test/build-fallback.mjs */
import fs from 'node:fs';
import { DEFAULT_SETTINGS, PUBLIC_SETTINGS, SEED_PRODUCTS, SEED_FLAVORS } from '../src/seed.js';

export function fallbackSource() {
  const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'item';
  const menu = {
    offline: true,
    settings: Object.fromEntries(PUBLIC_SETTINGS.map((k) => [k, DEFAULT_SETTINGS[k]])),
    products: SEED_PRODUCTS.map((p, i) => ({ id: p.id, name: p.name, cat: p.cat, price: p.price, img: p.img, pos: p.pos, desc: p.descr, alt: p.alt, flavors: p.flavors, groups: p.groups, active: true, sort: i + 1 })),
    flavors: SEED_FLAVORS.map((n, i) => ({ id: slug(n), name: n, active: true, sort: i + 1 }))
  };
  return `/* GENERADO por test/build-fallback.mjs a partir de src/seed.js. No editar a mano. */\nwindow.MENU_FALLBACK = ${JSON.stringify(menu)};\n`;
}

if (import.meta.url === new URL(process.argv[1], 'file:///').href || process.argv[1]?.endsWith('build-fallback.mjs')) {
  fs.writeFileSync(new URL('../menu-fallback.js', import.meta.url), fallbackSource());
  console.log('menu-fallback.js actualizado');
}
