/* =====================================================================
   GRO’SMANIA — script.js
   1. CONFIGURACIÓN   → WhatsApp, Instagram, mapa, puntos y premios
   2. CARTA           → productos (se editan en PRODUCTS)
   3. UTILIDADES
   4. CARTA Y PEDIDO  → la carta, el carrito y el mensaje de WhatsApp
   5. CLUB (público)  → premios, unirse y consultar puntos
   6. ADMINISTRACIÓN  → clientes del Club, puntos, premios, cumpleaños
   ===================================================================== */
'use strict';

/* ---------------------------------------------------------------------
   1. CONFIGURACIÓN  (lo que normalmente se cambia)
   --------------------------------------------------------------------- */

// Número con código de país, SIN "+", espacios ni guiones. Ej.: '573001234567'
// Si está vacío, WhatsApp deja elegir a quién escribir (no se pierde el mensaje).
const WHATSAPP_NUMBER   = '573017759082';   // el mismo número que ya usaba la página publicada

const INSTAGRAM_HANDLE  = '@grosmania';                       // POR CONFIRMAR
const INSTAGRAM_URL     = 'https://www.instagram.com/grosmania';   // POR CONFIRMAR

const MAPS_URL   = 'https://maps.app.goo.gl/c2L7uqFson3YxZ9f8';
const MAPS_EMBED = 'https://www.google.com/maps?q=6.2378006,-75.5397747&hl=es&z=17&output=embed';

const OPEN_FROM  = 'la 1:30 pm';
const SONETIX_URL = 'https://sonetix.emanuelvillada10.workers.dev/';

// Acceso a la administración del Club (cámbialo antes de publicar).
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

// Club de puntos: 1 punto por cada POINTS_PER pesos de compra.
const POINTS_PER = 1000;
const REWARDS = [                       // premios que se canjean con puntos
  { id: 'adicion', name: 'Adición gratis',    pts: 30 },
  { id: 'cono',    name: 'Cono sencillo',     pts: 60 },
  { id: 'copa',    name: 'Copa de la casa',   pts: 150 }
];
const LEVELS = [                        // según los puntos acumulados en total
  { name: 'Bronce', min: 0 },
  { name: 'Plata',  min: 300 },
  { name: 'Oro',    min: 800 }
];
const BIRTHDAY_GIFT = 'Un regalo sorpresa en la semana de tu cumpleaños';

/* ---------------------------------------------------------------------
   2. CARTA
   Los precios y descripciones son un BORRADOR: confirmar con la heladería.
   Para añadir un producto: copiar una línea, cambiar los datos y subir la foto a /fotos.
   --------------------------------------------------------------------- */

const CATS = ['Fresas y frutas', 'Waffles', 'Copas'];

const PRODUCTS = [
  { id: 'fresas-crema',   name: 'Fresas con Crema', cat: 'Fresas y frutas', price: 13000, img: 'fotos/fresas-con-crema.jpg', pos: 'center 40%',
    desc: 'Fresas frescas con helado, crema chantilly y una dulce salsa cremosa, coronadas con barquillo.', alt: 'Copa de fresas con crema, helado y barquillo' },
  { id: 'fresas-helado',  name: 'Fresas con Helado', cat: 'Fresas y frutas', price: 15000, img: 'fotos/fresas-con-helado.jpg', pos: 'center 55%',
    desc: 'Helado de vainilla con fresas, abundante crema chantilly, chocolate rallado y barquillo.', alt: 'Bowl de helado de vainilla con fresas y crema chantilly' },
  { id: 'ensalada',       name: 'Ensalada de Frutas Especial', cat: 'Fresas y frutas', price: 18000, img: 'fotos/ensalada-frutas-especial.jpg', pos: 'center 50%',
    desc: 'Frutas frescas con fresas, crema chantilly, leche condensada y barquillo. La más completa de la casa.', alt: 'Copa de ensalada de frutas con fresas y crema' },
  { id: 'waffle-oreo',    name: 'Waffle Oreo y Fresas', cat: 'Waffles', price: 17000, img: 'fotos/waffle-oreo-fresas.jpg', pos: 'center 80%',
    desc: 'Waffle caliente con helado, crema chantilly, galleta Oreo, fresas y salsa de chocolate.', alt: 'Waffle con helado, galleta Oreo, fresas y chocolate' },
  { id: 'mini-waffles',   name: 'Mini Waffles con Helado', cat: 'Waffles', price: 16000, img: 'fotos/mini-waffles-helado.jpg', pos: 'center 70%',
    desc: 'Mini waffles con una bola de helado, fresas, galleta Oreo triturada y salsa de caramelo.', alt: 'Mini waffles con helado, fresas y galleta Oreo' },
  { id: 'copa-caramelo',  name: 'Copa Caramelo Crocante', cat: 'Copas', price: 16000, img: 'fotos/copa-caramelo-crocante.jpg', pos: 'center 60%',
    desc: 'Capas de helado de vainilla, salsa de caramelo, bolitas de chocolate y trozos de galleta.', alt: 'Copa con helado de vainilla, caramelo y bolitas de chocolate' },
  { id: 'copa-brownie',   name: 'Copa Brownie y Caramelo', cat: 'Copas', price: 16000, img: 'fotos/copa-brownie-caramelo.jpg', pos: 'center 25%',
    desc: 'Brownie, helado de vainilla, galleta Oreo, chocolates y salsa de caramelo en una copa irresistible.', alt: 'Copa con brownie, helado de vainilla y caramelo' },
  { id: 'copa-palmeras',  name: 'Copa Palmeritas y Frutos Rojos', cat: 'Copas', price: 17000, img: 'fotos/copa-palmeritas-frutos-rojos.jpg', pos: 'center 22%',
    desc: 'Helado y crema con salsa de frutos rojos, caramelo y palmeritas crocantes.', alt: 'Copa con salsa de frutos rojos, caramelo y palmeritas' },
  { id: 'copa-rojos',     name: 'Copa Frutos Rojos', cat: 'Copas', price: 15000, img: 'fotos/copa-frutos-rojos.jpg', pos: 'center 50%',
    desc: 'Helado de vainilla con crema chantilly, salsa de frutos rojos, chocolate blanco y barquillo.', alt: 'Copa de helado con salsa de frutos rojos y barquillo' },
  { id: 'copa-ponque',    name: 'Copa Ponqué y Fresas', cat: 'Copas', price: 16000, img: 'fotos/copa-ponque-fresas.jpg', pos: 'center 20%',
    desc: 'Fresas, helado y trozos de ponqué con cobertura de chocolate, crema chantilly y chocolate líquido.', alt: 'Copa con fresas, ponqué, crema y chocolate' }
];

/* ---------------------------------------------------------------------
   3. UTILIDADES
   --------------------------------------------------------------------- */

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
const num = (n) => new Intl.NumberFormat('es-CO').format(n);

const store = {
  get(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (_) { return fallback; } },
  set(key, value)    { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* sin almacenamiento: no pasa nada */ } }
};

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  $('#toasts').appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

const WA_MESSAGES = { hola: 'Hola Gro’smania, quisiera más información.' };
const waLink = (text) => `https://wa.me/${WHATSAPP_NUMBER ? WHATSAPP_NUMBER : ''}?text=${encodeURIComponent(text)}`;

/* Celular colombiano: 10 dígitos que empiezan por 3 (acepta +57 / 57 delante). */
function normPhone(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('57')) d = d.slice(2);
  return d;
}
const validPhone = (p) => /^3\d{9}$/.test(p);
const showPhone = (p) => (p && p.length === 10 ? `${p.slice(0, 3)} ${p.slice(3, 6)} ${p.slice(6)}` : p);

const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseYMD = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const fmtDate = (iso) => new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtBirth = (s) => parseYMD(s).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' });
const todayStart = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function age(birth) {
  const b = parseYMD(birth), n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) a--;
  return a;
}
function daysToBirthday(birth) {
  const b = parseYMD(birth), t = todayStart();
  let next = new Date(t.getFullYear(), b.getMonth(), b.getDate());
  if (next < t) next = new Date(t.getFullYear() + 1, b.getMonth(), b.getDate());
  return Math.round((next - t) / 864e5);
}
const weekStart = (d) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return +x; };
/* ¿Su cumpleaños cae en la semana de hoy (lunes a domingo)? */
function isBirthdayWeek(birth) {
  const b = parseYMD(birth), t = todayStart();
  return [-1, 0, 1].some((k) => weekStart(new Date(t.getFullYear() + k, b.getMonth(), b.getDate())) === weekStart(t));
}

function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/* ---------------------------------------------------------------------
   4. CARTA Y PEDIDO
   --------------------------------------------------------------------- */

let filterCat = 'Todos';
const CART_KEY = 'grosmania.pedido.v1';
let cart = {};                                   // { idProducto: cantidad }
{
  const saved = store.get(CART_KEY, {});
  Object.keys(saved).forEach((id) => { if (PRODUCTS.some((p) => p.id === id) && saved[id] > 0) cart[id] = Math.min(99, saved[id] | 0); });
}
const prod = (id) => PRODUCTS.find((p) => p.id === id);
const cartCount = () => Object.values(cart).reduce((a, b) => a + b, 0);
const cartTotal = () => Object.entries(cart).reduce((a, [id, q]) => a + prod(id).price * q, 0);
const saveCart = () => store.set(CART_KEY, cart);

function renderChips() {
  const cats = ['Todos', ...CATS.filter((c) => PRODUCTS.some((p) => p.cat === c))];
  $('#chips').innerHTML = cats.map((c) =>
    `<button class="chip" type="button" data-cat="${esc(c)}" aria-pressed="${c === filterCat}">${esc(c)}</button>`).join('');
}

function addArea(p) {
  const q = cart[p.id] || 0;
  return q
    ? `<div class="stepper" role="group" aria-label="Cantidad de ${esc(p.name)}">
         <button type="button" data-dec="${p.id}" aria-label="Quitar uno">−</button><b aria-live="polite">${q}</b><button type="button" data-inc="${p.id}" aria-label="Agregar uno más">+</button>
       </div>`
    : `<button class="btn btn-primary" type="button" data-inc="${p.id}" aria-label="Agregar ${esc(p.name)} a mi pedido">Agregar</button>`;
}

function renderGrid() {
  const list = PRODUCTS.filter((p) => filterCat === 'Todos' || p.cat === filterCat);
  $('#grid').innerHTML = list.map((p) => `
    <article class="card" data-card="${p.id}">
      <div class="card-img"><img src="${p.img}" alt="${esc(p.alt || p.name)}" loading="lazy" style="object-position:${p.pos || 'center'}" width="900" height="1125"></div>
      <div class="card-body">
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.desc)}</p>
        <div class="card-foot"><span class="price">${money(p.price)}</span><span class="add-area">${addArea(p)}</span></div>
      </div>
    </article>`).join('') || '<p class="empty">No hay productos en esta categoría.</p>';
}

function changeQty(id, d) {
  const q = Math.max(0, Math.min(99, (cart[id] || 0) + d));
  if (q) cart[id] = q; else delete cart[id];
  saveCart();
  const card = $(`[data-card="${id}"] .add-area`);
  if (card) card.innerHTML = addArea(prod(id));
  refreshCart();
}

function refreshCart() {
  const n = cartCount(), total = cartTotal();
  const badge = $('#cartCount');
  badge.textContent = n; badge.hidden = n === 0;
  $('#orderBar').classList.toggle('show', n > 0 && !drawerOpen);
  $('#orderBarText').textContent = `${n} ${n === 1 ? 'producto' : 'productos'} · ${money(total)}`;
  if (drawerOpen) renderCartItems();
}

/* --- Panel del pedido --- */
let drawerOpen = false;
const orderForm = { name: '', mode: 'Domicilio', addr: '', phone: '', notes: '' };

function openDrawer() {
  drawerOpen = true;
  $('#drawer').classList.add('show'); $('#drawer').setAttribute('aria-hidden', 'false');
  $('#overlay').classList.add('show');
  $('#orderBar').classList.remove('show');
  renderDrawer();
  $('#drawerClose').focus();
}
function closeDrawer() {
  drawerOpen = false;
  $('#drawer').classList.remove('show'); $('#drawer').setAttribute('aria-hidden', 'true');
  $('#overlay').classList.remove('show');
  refreshCart();
}

function renderDrawer() {
  $('#drawerBody').innerHTML = `
    <div id="cartItems"></div>
    <div id="cartForm">
      <div class="field" style="margin-top:18px"><label for="o_name">Tu nombre</label><input id="o_name" autocomplete="name" value="${esc(orderForm.name)}"></div>
      <div class="field"><span style="font-weight:700">¿Cómo lo quieres?</span>
        <div class="radios">
          <label><input type="radio" name="o_mode" value="Domicilio" ${orderForm.mode === 'Domicilio' ? 'checked' : ''}> Domicilio</label>
          <label><input type="radio" name="o_mode" value="Recoger en el local" ${orderForm.mode !== 'Domicilio' ? 'checked' : ''}> Recoger en el local</label>
        </div>
      </div>
      <div class="field" id="addrField"><label for="o_addr">Dirección de entrega</label><input id="o_addr" autocomplete="street-address" value="${esc(orderForm.addr)}"></div>
      <div class="field"><label for="o_phone">Tu celular <span style="font-weight:500;color:var(--muted)">(opcional)</span></label>
        <input id="o_phone" inputmode="numeric" autocomplete="tel" placeholder="300 123 4567" value="${esc(orderForm.phone)}">
        <span class="hint">Si ya estás en el Club, así te sumamos los puntos.</span></div>
      <div class="field"><label for="o_notes">Comentarios <span style="font-weight:500;color:var(--muted)">(opcional)</span></label><textarea id="o_notes" rows="2" placeholder="Sin cereza, alergias, etc.">${esc(orderForm.notes)}</textarea></div>
      <button class="btn btn-ghost btn-sm" type="button" id="clearOrder">Vaciar mi pedido</button>
    </div>`;
  $('#addrField').hidden = orderForm.mode !== 'Domicilio';
  renderCartItems();
}

function renderCartItems() {
  const ids = Object.keys(cart);
  const items = $('#cartItems'), form = $('#cartForm'), foot = $('#drawerFoot');
  if (!items) return;
  if (!ids.length) {
    items.innerHTML = '<p class="empty">Tu pedido está vacío.<br>Elige algo de la carta 🍨</p>';
    form.hidden = true;
    foot.innerHTML = '<button class="btn btn-primary btn-block" type="button" id="goMenu">Ver la carta</button>';
    return;
  }
  form.hidden = false;
  items.innerHTML = ids.map((id) => {
    const p = prod(id), q = cart[id];
    return `<div class="cart-item">
      <img src="${p.img}" alt="" style="object-position:${p.pos || 'center'}">
      <div><b>${esc(p.name)}</b><small>${money(p.price)} c/u · ${money(p.price * q)}</small></div>
      <div class="stepper"><button type="button" data-dec="${id}" aria-label="Quitar uno de ${esc(p.name)}">−</button><b>${q}</b><button type="button" data-inc="${id}" aria-label="Agregar uno más de ${esc(p.name)}">+</button></div>
    </div>`;
  }).join('');
  foot.innerHTML = `
    <div class="total-row"><span>Total</span><span>${money(cartTotal())}</span></div>
    <p class="fine">El costo del domicilio se confirma por WhatsApp según tu dirección.</p>
    <button class="btn btn-wa btn-block" type="button" id="sendOrder"><svg aria-hidden="true"><use href="#i-wa"/></svg>Enviar pedido por WhatsApp</button>`;
}

function readOrderForm() {
  if (!$('#o_name')) return;
  orderForm.name = $('#o_name').value.trim();
  orderForm.mode = ($('input[name="o_mode"]:checked') || {}).value || 'Domicilio';
  orderForm.addr = $('#o_addr').value.trim();
  orderForm.phone = $('#o_phone').value.trim();
  orderForm.notes = $('#o_notes').value.trim();
}

function sendOrder() {
  readOrderForm();
  if (!orderForm.name) { toast('Escribe tu nombre para enviar el pedido.'); $('#o_name').focus(); return; }
  if (orderForm.mode === 'Domicilio' && !orderForm.addr) { toast('Escribe la dirección de entrega.'); $('#o_addr').focus(); return; }
  const lines = Object.entries(cart).map(([id, q]) => `• ${q} x ${prod(id).name} — ${money(prod(id).price * q)}`);
  const phone = normPhone(orderForm.phone);
  const msg = [
    'Hola Gro’smania 👋 Quiero hacer este pedido:', '',
    ...lines, '',
    `Total de productos: ${money(cartTotal())}`,
    '(El costo del domicilio lo confirman por aquí.)', '',
    `Nombre: ${orderForm.name}`,
    `Modalidad: ${orderForm.mode}`,
    orderForm.mode === 'Domicilio' ? `Dirección: ${orderForm.addr}` : null,
    phone ? `Celular (Club): ${showPhone(phone)}` : null,
    orderForm.notes ? `Comentarios: ${orderForm.notes}` : null
  ].filter((l) => l !== null).join('\n');
  const w = window.open(waLink(msg), '_blank', 'noopener');
  if (!w) { location.href = waLink(msg); return; }
  cart = {}; saveCart(); orderForm.notes = '';
  renderGrid(); closeDrawer();
  toast('Se abrió WhatsApp con tu pedido. ¡Solo falta enviarlo!');
}

/* ---------------------------------------------------------------------
   5. CLUB (parte pública)
   --------------------------------------------------------------------- */

function renderClubPublic() {
  $('#rewardsList').innerHTML = REWARDS.map((r) =>
    `<li><span>${esc(r.name)}</span><span class="pts">${r.pts} puntos</span></li>`).join('');
  $('#levelsList').innerHTML = LEVELS.map((l, i) => {
    const next = LEVELS[i + 1];
    return `<div class="level"><b>${esc(l.name)}</b><span>${next ? `${num(l.min)} a ${num(next.min - 1)} puntos` : `desde ${num(l.min)} puntos`}</span></div>`;
  }).join('');
  $('#giftNote').textContent = '🎁 ' + BIRTHDAY_GIFT;
}

function showErr(id, msg) { const e = $(id); e.textContent = msg; e.hidden = !msg; }

function setupClubForms() {
  $('#joinForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#jn').value.trim(), phone = normPhone($('#jp').value), birth = $('#jb').value;
    if (name.length < 3) return showErr('#joinErr', 'Escribe tu nombre completo.');
    if (!validPhone(phone)) return showErr('#joinErr', 'El celular debe tener 10 números y empezar por 3. Ej.: 300 123 4567');
    if (!birth) return showErr('#joinErr', 'Elige tu fecha de cumpleaños.');
    showErr('#joinErr', '');
    const msg = `Hola Gro’smania 👋 Quiero unirme al Club.\n\nNombre: ${name}\nCelular: ${showPhone(phone)}\nCumpleaños: ${fmtBirth(birth)}`;
    window.open(waLink(msg), '_blank', 'noopener');
    toast('Se abrió WhatsApp. ¡Solo falta enviar el mensaje!');
  });
  $('#pointsForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const phone = normPhone($('#qp').value);
    if (!validPhone(phone)) return showErr('#pointsErr', 'Escribe tu celular de 10 números. Ej.: 300 123 4567');
    showErr('#pointsErr', '');
    window.open(waLink(`Hola Gro’smania 👋 Quisiera saber cuántos puntos tengo en el Club.\nMi celular es ${showPhone(phone)}.`), '_blank', 'noopener');
  });
}

/* ---------------------------------------------------------------------
   6. ADMINISTRACIÓN DEL CLUB
   Los datos se guardan en este navegador (localStorage). Usa «Respaldo»
   para guardarlos y poder pasarlos a otro equipo.
   --------------------------------------------------------------------- */

const CLUB_KEY = 'grosmania.club.v1';
let DB = (() => {
  const d = store.get(CLUB_KEY, null);
  return d && Array.isArray(d.clients) && Array.isArray(d.moves) ? d : { clients: [], moves: [] };
})();
const saveDB = () => store.set(CLUB_KEY, DB);

let isAdmin = false;
try { isAdmin = sessionStorage.getItem('gm.admin') === '1'; } catch (_) { /* nada */ }
let adminSearch = '';

const levelIndex = (life) => LEVELS.reduce((idx, l, i) => (life >= l.min ? i : idx), 0);

function statsOf(c) {
  let bal = 0, life = 0, last = c.created;
  const mv = DB.moves.filter((m) => m.phone === c.phone);     // el celular es la clave que une cliente y movimientos
  mv.forEach((m) => { bal += m.points; if (m.points > 0) life += m.points; if (m.date > last) last = m.date; });
  return { bal, life, last, mv: mv.sort((a, b) => (a.date < b.date ? 1 : -1)), lvl: levelIndex(life) };
}
const giftUsedThisYear = (c) => DB.moves.some((m) => m.phone === c.phone && m.type === 'cumple' && new Date(m.date).getFullYear() === new Date().getFullYear());

function addMove(phone, type, points, extra = {}) {
  DB.moves.push({ id: uid(), phone, date: new Date().toISOString(), type, points, ...extra });
  saveDB();
}

/* --- ventanas --- */
let modalEl = null;
function openModal(html) {
  closeModal();
  modalEl = document.createElement('div');
  modalEl.className = 'modal-wrap';
  modalEl.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  modalEl.addEventListener('mousedown', (e) => { if (e.target === modalEl) closeModal(); });
  document.body.appendChild(modalEl);
  const first = $('input:not([readonly]):not([type=radio]), button', modalEl);
  if (first) first.focus();
}
function closeModal() { if (modalEl) { modalEl.remove(); modalEl = null; } }

/* --- pantalla principal --- */
function renderAdmin() {
  const root = $('#adminRoot');
  if (!isAdmin) {
    root.innerHTML = `
    <div class="login"><form class="login-card" id="loginForm">
      <img src="logos/logo-teal-v.svg" alt="Gro’smania Heladería">
      <h1>Administración</h1><p>Club Gro’smania · solo para el personal</p>
      <div class="field"><label for="lu">Usuario</label><input id="lu" autocomplete="username"></div>
      <div class="field"><label for="lp">Contraseña</label><input id="lp" type="password" autocomplete="current-password"></div>
      <p class="field err" id="loginErr" role="alert" hidden></p>
      <button class="btn btn-primary btn-block" type="submit">Entrar</button>
      <a class="btn btn-ghost btn-block" href="#menu" style="margin-top:12px">← Volver a la página</a>
    </form></div>`;
    return;
  }

  const clients = DB.clients.map((c) => ({ c, s: statsOf(c) }));
  const q = adminSearch.trim().toLowerCase();
  const qd = q.replace(/\D/g, '');
  const shown = clients
    .filter(({ c }) => !q || c.name.toLowerCase().includes(q) || (qd && c.phone.includes(qd)))
    .sort((a, b) => a.c.name.localeCompare(b.c.name, 'es'));

  const totalPts = clients.reduce((a, x) => a + x.s.bal, 0);
  const monthRedeems = DB.moves.filter((m) => m.type === 'canje' && new Date(m.date).getMonth() === new Date().getMonth() && new Date(m.date).getFullYear() === new Date().getFullYear()).length;
  const bdays = clients.map(({ c }) => ({ c, d: daysToBirthday(c.birth), week: isBirthdayWeek(c.birth) }))
    .filter((x) => x.week || x.d <= 14).sort((a, b) => a.d - b.d);

  root.innerHTML = `
  <div class="admin">
    <header class="adm-top"><div class="wrap">
      <div class="adm-brand"><img src="logos/logo-cream-v.svg" alt="Gro’smania"><h1>Club Gro’smania · Administración</h1></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <a class="btn btn-light btn-sm" href="#menu">Ver la página</a>
        <button class="btn btn-ghost btn-sm" type="button" data-act="logout">Cerrar sesión</button>
      </div>
    </div></header>

    <div class="wrap">
      <div class="kpis">
        <div class="kpi"><small>Clientes en el Club</small><b>${clients.length}</b></div>
        <div class="kpi"><small>Puntos en circulación</small><b>${num(totalPts)}</b></div>
        <div class="kpi"><small>Cumpleaños esta semana</small><b>${bdays.filter((x) => x.week).length}</b></div>
        <div class="kpi"><small>Premios canjeados este mes</small><b>${monthRedeems}</b></div>
      </div>

      ${bdays.length ? `<section class="adm-panel"><h2>🎂 Cumpleaños cercanos</h2><div class="bday-list">
        ${bdays.map(({ c, d, week }) => `<div class="bday"><span><b>${esc(c.name)}</b> · ${fmtBirth(c.birth)} (cumple ${age(c.birth) + (d === 0 ? 0 : 1)})</span>
          <span>${week ? '<span class="tag-now">Semana de cumpleaños</span> ' : ''}${d === 0 ? '¡Hoy!' : d === 1 ? 'Mañana' : `en ${d} días`}
          ${week && !giftUsedThisYear(c) ? `<button class="btn btn-sm btn-primary" type="button" data-act="gift" data-phone="${c.phone}">Entregar regalo</button>` : (week ? '<small>Regalo entregado</small>' : '')}</span></div>`).join('')}
      </div></section>` : ''}

      <section class="adm-panel">
        <h2>Clientes del Club</h2>
        <div class="toolbar">
          <input type="search" id="admSearch" placeholder="Buscar por nombre o celular" value="${esc(adminSearch)}" aria-label="Buscar cliente">
          <button class="btn btn-primary" type="button" data-act="new">＋ Nuevo cliente</button>
          <button class="btn btn-ghost btn-sm" type="button" data-act="csv">Descargar Excel (CSV)</button>
          <button class="btn btn-ghost btn-sm" type="button" data-act="backup">Respaldo</button>
          <button class="btn btn-ghost btn-sm" type="button" data-act="restore">Restaurar respaldo</button>
          <input type="file" id="restoreFile" accept="application/json,.json" hidden>
        </div>
        ${shown.length ? `
        <div class="client head"><span>Cliente</span><span>Celular</span><span>Nivel</span><span>Puntos</span><span></span></div>
        ${shown.map(({ c, s }) => `
        <div class="client">
          <div class="name"><b>${esc(c.name)}</b><small>🎂 ${fmtBirth(c.birth)} · ${age(c.birth)} años</small></div>
          <div>${showPhone(c.phone)}<br><small>Última visita: ${fmtDate(s.last)}</small></div>
          <div><span class="lvl lvl-${s.lvl}">${esc(LEVELS[s.lvl].name)}</span><br><small>${num(s.life)} acumulados</small></div>
          <div><span class="pts-badge">${num(s.bal)}</span></div>
          <div class="acts">
            <button class="btn btn-primary btn-sm" type="button" data-act="buy" data-phone="${c.phone}">＋ Compra</button>
            <button class="btn btn-ghost btn-sm" type="button" data-act="redeem" data-phone="${c.phone}">Canjear</button>
            <button class="btn btn-ghost btn-sm" type="button" data-act="view" data-phone="${c.phone}">Ver</button>
          </div>
        </div>`).join('')}` : `
        <p class="empty">${clients.length ? 'No hay clientes con esa búsqueda.' : 'Aún no hay clientes en el Club. Pulsa «Nuevo cliente» para registrar el primero.'}</p>
        ${clients.length ? '' : '<p style="text-align:center"><button class="btn btn-ghost btn-sm" type="button" data-act="sample">Cargar 5 clientes de ejemplo (para probar)</button></p>'}`}
      </section>
      <p class="fine">Los datos se guardan en este equipo. Descarga un «Respaldo» de vez en cuando y guárdalo en un lugar seguro.</p>
    </div>
  </div>`;
}

/* --- formularios del administrador --- */
function clientForm(c) {
  const edit = !!c;
  openModal(`
    <h2>${edit ? 'Editar cliente' : 'Nuevo cliente'}</h2>
    <form id="clientForm" novalidate>
      <div class="field"><label for="cf_n">Nombre completo</label><input id="cf_n" value="${esc(c ? c.name : '')}" autocomplete="off"></div>
      <div class="field"><label for="cf_p">Celular ${edit ? '(no se puede cambiar: es la clave del cliente)' : ''}</label>
        <input id="cf_p" inputmode="numeric" placeholder="300 123 4567" value="${esc(c ? showPhone(c.phone) : '')}" ${edit ? 'readonly' : ''} autocomplete="off"></div>
      <div class="field"><label for="cf_b">Fecha de nacimiento</label><input id="cf_b" type="date" max="${ymd(new Date())}" value="${c ? c.birth : ''}"></div>
      <p class="field err" id="cf_e" role="alert" hidden></p>
      <div class="modal-actions">
        ${edit ? '<button class="btn btn-danger btn-sm" type="button" id="cf_del" style="margin-right:auto">Eliminar cliente</button>' : ''}
        <button class="btn btn-ghost" type="button" data-close>Cancelar</button>
        <button class="btn btn-primary" type="submit">Guardar</button>
      </div>
    </form>`);
  $('#clientForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#cf_n').value.trim().replace(/\s+/g, ' ');
    const phone = edit ? c.phone : normPhone($('#cf_p').value);
    const birth = $('#cf_b').value;
    const err = (m) => { const el = $('#cf_e'); el.textContent = m; el.hidden = false; };
    if (name.length < 3) return err('Escribe el nombre completo.');
    if (!validPhone(phone)) return err('El celular debe tener 10 números y empezar por 3.');
    if (!edit && DB.clients.some((x) => x.phone === phone)) return err('Ya existe un cliente con ese celular.');
    if (!birth || parseYMD(birth) > new Date() || age(birth) > 110) return err('Revisa la fecha de nacimiento.');
    if (edit) { c.name = name; c.birth = birth; }
    else DB.clients.push({ phone, name, birth, created: new Date().toISOString() });
    saveDB(); closeModal(); renderAdmin();
    toast(edit ? 'Cliente actualizado ✅' : `${name} ya hace parte del Club 🎉`);
  });
  const del = $('#cf_del');
  if (del) del.addEventListener('click', () => {
    if (!confirm(`¿Eliminar a ${c.name} y todo su historial de puntos? Esto no se puede deshacer.`)) return;
    DB.clients = DB.clients.filter((x) => x.phone !== c.phone);
    DB.moves = DB.moves.filter((m) => m.phone !== c.phone);
    saveDB(); closeModal(); renderAdmin(); toast('Cliente eliminado');
  });
}

function purchaseForm(c) {
  openModal(`
    <h2>Sumar compra</h2>
    <p style="margin-bottom:14px"><b>${esc(c.name)}</b> · ${showPhone(c.phone)}<br><small>Puntos actuales: ${num(statsOf(c).bal)}</small></p>
    <form id="buyForm" novalidate>
      <div class="field"><label for="bf_a">Valor de la compra (pesos)</label><input id="bf_a" inputmode="numeric" placeholder="Ej.: 32000" autocomplete="off"></div>
      <p style="font-size:1.3rem;font-weight:700;margin-bottom:12px" id="bf_pts" aria-live="polite">Suma 0 puntos</p>
      <div class="field"><label for="bf_n">Nota (opcional)</label><input id="bf_n" placeholder="Ej.: factura 1234" autocomplete="off"></div>
      <p class="field err" id="bf_e" role="alert" hidden></p>
      <div class="modal-actions"><button class="btn btn-ghost" type="button" data-close>Cancelar</button><button class="btn btn-primary" type="submit">Sumar puntos</button></div>
    </form>`);
  const calc = () => Math.floor((parseInt($('#bf_a').value.replace(/\D/g, ''), 10) || 0) / POINTS_PER);
  $('#bf_a').addEventListener('input', () => { $('#bf_pts').textContent = `Suma ${num(calc())} ${calc() === 1 ? 'punto' : 'puntos'}`; });
  $('#buyForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseInt($('#bf_a').value.replace(/\D/g, ''), 10) || 0, pts = calc();
    if (pts < 1) { const el = $('#bf_e'); el.textContent = `La compra debe ser de ${money(POINTS_PER)} o más.`; el.hidden = false; return; }
    addMove(c.phone, 'compra', pts, { amount, note: $('#bf_n').value.trim() });
    closeModal(); renderAdmin();
    toast(`+${num(pts)} puntos para ${c.name.split(' ')[0]} ✅`);
  });
}

function redeemForm(c) {
  const bal = statsOf(c).bal;
  openModal(`
    <h2>Canjear premio</h2>
    <p style="margin-bottom:14px"><b>${esc(c.name)}</b> · tiene <b>${num(bal)} puntos</b></p>
    <form id="redeemForm">
      <div class="rw-list">
        ${REWARDS.map((r, i) => `<label class="rw ${bal < r.pts ? 'off' : ''}"><input type="radio" name="rw" value="${r.id}" ${bal < r.pts ? 'disabled' : ''} ${i === 0 && bal >= r.pts ? 'checked' : ''}>${esc(r.name)}<span class="pts">${r.pts} puntos${bal < r.pts ? ` · faltan ${r.pts - bal}` : ''}</span></label>`).join('')}
      </div>
      <div class="modal-actions"><button class="btn btn-ghost" type="button" data-close>Cancelar</button><button class="btn btn-primary" type="submit" ${bal < REWARDS[0].pts ? 'disabled' : ''}>Canjear</button></div>
    </form>`);
  $('#redeemForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const sel = $('input[name="rw"]:checked');
    if (!sel) return toast('Elige un premio.');
    const r = REWARDS.find((x) => x.id === sel.value);
    if (statsOf(c).bal < r.pts) return toast('No alcanzan los puntos.');
    addMove(c.phone, 'canje', -r.pts, { note: r.name });
    closeModal(); renderAdmin();
    toast(`Canje listo: ${r.name} 🎁`);
  });
}

function adjustForm(c) {
  openModal(`
    <h2>Ajustar puntos</h2>
    <p style="margin-bottom:14px"><b>${esc(c.name)}</b> · tiene ${num(statsOf(c).bal)} puntos<br><small>Úsalo solo para corregir un error. Queda registrado en el historial.</small></p>
    <form id="adjForm" novalidate>
      <div class="field"><label for="af_p">Puntos (usa − para restar)</label><input id="af_p" inputmode="numeric" placeholder="Ej.: 10 o -10" autocomplete="off"></div>
      <div class="field"><label for="af_n">Motivo</label><input id="af_n" placeholder="Ej.: compra mal digitada" autocomplete="off"></div>
      <p class="field err" id="af_e" role="alert" hidden></p>
      <div class="modal-actions"><button class="btn btn-ghost" type="button" data-close>Cancelar</button><button class="btn btn-primary" type="submit">Aplicar</button></div>
    </form>`);
  $('#adjForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const pts = parseInt($('#af_p').value.replace(/[^\d-]/g, ''), 10), note = $('#af_n').value.trim();
    const err = (m) => { const el = $('#af_e'); el.textContent = m; el.hidden = false; };
    if (!pts) return err('Escribe cuántos puntos sumar o restar.');
    if (!note) return err('Escribe el motivo del ajuste.');
    if (statsOf(c).bal + pts < 0) return err('El cliente no puede quedar con puntos negativos.');
    addMove(c.phone, 'ajuste', pts, { note });
    closeModal(); renderAdmin(); toast('Ajuste registrado ✅');
  });
}

function viewClient(c) {
  const s = statsOf(c), next = LEVELS[s.lvl + 1];
  const pct = next ? Math.min(100, Math.round(((s.life - LEVELS[s.lvl].min) / (next.min - LEVELS[s.lvl].min)) * 100)) : 100;
  const label = { compra: 'Compra', canje: 'Canje', ajuste: 'Ajuste', cumple: 'Regalo de cumpleaños' };
  openModal(`
    <h2>${esc(c.name)}</h2>
    <p>${showPhone(c.phone)} · 🎂 ${fmtBirth(c.birth)} (${age(c.birth)} años)<br><small>En el Club desde ${fmtDate(c.created)}</small></p>
    <p style="margin:14px 0 4px"><span class="pts-badge">${num(s.bal)} puntos</span> <span class="lvl lvl-${s.lvl}">${esc(LEVELS[s.lvl].name)}</span></p>
    <div class="bar" aria-hidden="true"><i style="width:${pct}%"></i></div>
    <small>${next ? `Le faltan ${num(next.min - s.life)} puntos acumulados para nivel ${esc(next.name)}` : 'Nivel máximo alcanzado'}</small>
    <h3 style="margin:18px 0 6px;font-size:1.2rem">Historial</h3>
    ${s.mv.length ? `<div style="max-height:260px;overflow:auto"><table class="hist"><thead><tr><th>Fecha</th><th>Movimiento</th><th>Puntos</th></tr></thead><tbody>
      ${s.mv.map((m) => `<tr><td>${fmtDate(m.date)}</td><td>${label[m.type] || m.type}${m.amount ? ` · ${money(m.amount)}` : ''}${m.note ? `<br><small>${esc(m.note)}</small>` : ''}</td><td class="${m.points >= 0 ? 'plus' : 'minus'}">${m.points > 0 ? '+' : ''}${num(m.points)}</td></tr>`).join('')}
    </tbody></table></div>` : '<p class="fine">Aún no tiene movimientos.</p>'}
    <div class="modal-actions" style="margin-top:16px">
      <button class="btn btn-ghost btn-sm" type="button" data-act2="adjust">Ajustar puntos</button>
      <button class="btn btn-ghost btn-sm" type="button" data-act2="edit">Editar datos</button>
      <button class="btn btn-primary btn-sm" type="button" data-close>Cerrar</button>
    </div>`);
  $('[data-act2="adjust"]', modalEl).addEventListener('click', () => adjustForm(c));
  $('[data-act2="edit"]', modalEl).addEventListener('click', () => clientForm(c));
}

/* --- exportar / respaldo / ejemplos --- */
function exportCSV() {
  const cell = (v) => { v = String(v ?? ''); return /[;"\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
  const rows = [['Celular', 'Nombre', 'Cumpleaños', 'Puntos disponibles', 'Puntos acumulados', 'Nivel', 'Última visita']];
  DB.clients.forEach((c) => { const s = statsOf(c); rows.push([c.phone, c.name, c.birth, s.bal, s.life, LEVELS[s.lvl].name, ymd(new Date(s.last))]); });
  // BOM + «;» para que Excel en español abra las columnas directamente
  download(`grosmania_club_${ymd(new Date())}.csv`, '﻿' + rows.map((r) => r.map(cell).join(';')).join('\r\n'), 'text/csv;charset=utf-8');
  toast(`Descargados ${DB.clients.length} clientes`);
}
function exportBackup() {
  download(`grosmania_respaldo_${ymd(new Date())}.json`, JSON.stringify({ version: 1, exported: new Date().toISOString(), ...DB }, null, 1), 'application/json');
  toast('Respaldo descargado. Guárdalo en un lugar seguro.');
}
function restoreBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const d = JSON.parse(reader.result);
      if (!Array.isArray(d.clients) || !Array.isArray(d.moves)) throw new Error('formato');
      const okClient = (c) => c && validPhone(String(c.phone)) && typeof c.name === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(c.birth || '');
      const okMove = (m) => m && validPhone(String(m.phone)) && Number.isFinite(m.points) && typeof m.date === 'string';
      if (!d.clients.every(okClient) || !d.moves.every(okMove)) throw new Error('datos');
      if (!confirm(`El respaldo tiene ${d.clients.length} clientes y ${d.moves.length} movimientos.\n¿Reemplazar los datos actuales por los del respaldo?`)) return;
      DB = { clients: d.clients, moves: d.moves }; saveDB(); renderAdmin(); toast('Respaldo restaurado ✅');
    } catch (_) { toast('Ese archivo no es un respaldo válido del Club.'); }
  };
  reader.readAsText(file);
}
function loadSamples() {
  const t = new Date(), ago = (days) => new Date(Date.now() - days * 864e5).toISOString();
  const bd = (off) => { const d = new Date(t.getFullYear() - 30, t.getMonth(), t.getDate() + off); return ymd(d); };
  [['3001112233', 'Laura Gómez', bd(2)], ['3109876543', 'Andrés Ruiz', bd(-120)], ['3205550101', 'Camila Torres', bd(10)],
   ['3151112233', 'Santiago Díaz', bd(-200)], ['3012223344', 'Valentina Mora', bd(60)]].forEach(([phone, name, birth], i) => {
    DB.clients.push({ phone, name, birth, created: ago(90 - i * 10) });
    [[60, 18000], [30, 32000], [7, 45000 + i * 20000]].forEach(([d, amt]) => DB.moves.push({ id: uid(), phone, date: ago(d - i), type: 'compra', points: Math.floor(amt / POINTS_PER), amount: amt, note: 'Ejemplo' }));
  });
  saveDB(); renderAdmin(); toast('Se cargaron 5 clientes de ejemplo.');
}

/* --- eventos del administrador --- */
function setupAdmin() {
  const root = $('#adminRoot');
  const byPhone = (el) => DB.clients.find((c) => c.phone === el.dataset.phone);

  root.addEventListener('submit', (e) => {
    if (e.target.id !== 'loginForm') return;
    e.preventDefault();
    if ($('#lu').value.trim() === ADMIN_USER && $('#lp').value === ADMIN_PASS) {
      isAdmin = true; try { sessionStorage.setItem('gm.admin', '1'); } catch (_) { /* nada */ }
      renderAdmin();
    } else { const el = $('#loginErr'); el.textContent = 'Usuario o contraseña incorrectos.'; el.hidden = false; }
  });
  root.addEventListener('input', (e) => {
    if (e.target.id !== 'admSearch') return;
    adminSearch = e.target.value;
    const pos = e.target.selectionStart;
    renderAdmin();
    const s = $('#admSearch'); s.focus(); s.setSelectionRange(pos, pos);
  });
  root.addEventListener('change', (e) => {
    if (e.target.id === 'restoreFile' && e.target.files[0]) { restoreBackup(e.target.files[0]); e.target.value = ''; }
  });
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const c = byPhone(b);
    switch (b.dataset.act) {
      case 'logout':  isAdmin = false; try { sessionStorage.removeItem('gm.admin'); } catch (_) { /* nada */ } renderAdmin(); break;
      case 'new':     clientForm(null); break;
      case 'buy':     c && purchaseForm(c); break;
      case 'redeem':  c && redeemForm(c); break;
      case 'view':    c && viewClient(c); break;
      case 'gift':
        if (c && confirm(`¿Entregar el regalo de cumpleaños a ${c.name}?`)) { addMove(c.phone, 'cumple', 0, { note: BIRTHDAY_GIFT }); renderAdmin(); toast('Regalo registrado 🎁'); }
        break;
      case 'csv':     exportCSV(); break;
      case 'backup':  exportBackup(); break;
      case 'restore': $('#restoreFile').click(); break;
      case 'sample':  loadSamples(); break;
    }
  });
  document.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeModal(); if (drawerOpen) closeDrawer(); } });
}

/* ---------------------------------------------------------------------
   Arranque
   --------------------------------------------------------------------- */

function route() {
  const admin = location.hash === '#admin';
  $('#site').hidden = admin;
  $('#adminRoot').hidden = !admin;
  document.title = admin ? 'Administración · Gro’smania' : 'Gro’smania · Heladería';
  if (admin) { closeDrawer(); renderAdmin(); window.scrollTo(0, 0); }
  else if (location.hash.length > 1) { const t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
}

function init() {
  // Enlaces y textos configurables
  $$('[data-wa]').forEach((a) => { a.href = waLink(WA_MESSAGES[a.dataset.wa] || WA_MESSAGES.hola); });
  $$('[data-text="open"]').forEach((el) => { el.textContent = OPEN_FROM; });
  $$('[data-text="ppp"]').forEach((el) => { el.textContent = `1 punto por cada ${money(POINTS_PER)}`; });
  $('#mapsBtn').href = MAPS_URL;
  $('#mapFrame').src = MAPS_EMBED;
  $('#igBtn').href = INSTAGRAM_URL; $('#igHandle').textContent = INSTAGRAM_HANDLE;
  const so = $('#sonetix'); if (SONETIX_URL) { so.href = SONETIX_URL; so.target = '_blank'; so.rel = 'noopener'; }
  $('#year').textContent = new Date().getFullYear();

  renderChips(); renderGrid(); renderClubPublic(); setupClubForms(); refreshCart();

  $('#chips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]'); if (!b) return;
    filterCat = b.dataset.cat; renderChips(); renderGrid();
  });
  document.addEventListener('click', (e) => {
    const inc = e.target.closest('[data-inc]'), dec = e.target.closest('[data-dec]');
    if (inc) changeQty(inc.dataset.inc, 1);
    else if (dec) changeQty(dec.dataset.dec, -1);
    else if (e.target.closest('#cartBtn, #orderBarBtn')) openDrawer();
    else if (e.target.closest('#drawerClose') || e.target.id === 'overlay') closeDrawer();
    else if (e.target.closest('#sendOrder')) sendOrder();
    else if (e.target.closest('#goMenu')) { closeDrawer(); location.hash = '#menu'; }
    else if (e.target.closest('#clearOrder')) { if (confirm('¿Vaciar todo tu pedido?')) { cart = {}; saveCart(); renderGrid(); refreshCart(); } }
  });
  document.addEventListener('input', (e) => { if (e.target.id && e.target.id.startsWith('o_')) readOrderForm(); });
  document.addEventListener('change', (e) => {
    if (e.target.name === 'o_mode') { readOrderForm(); $('#addrField').hidden = orderForm.mode !== 'Domicilio'; }
  });

  setupAdmin();
  window.addEventListener('hashchange', route);
  route();
}
init();
