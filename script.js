/* =====================================================================
   GRO’SMANIA — script.js  (página pública)
   1. CONFIGURACIÓN   → WhatsApp, Instagram, mapa
   2. CARTA           → se carga desde la base de datos (/api/menu); se edita en admin.html
   3. PEDIDO          → sabores, carrito, forma de pago y mensaje de WhatsApp
   4. ESTADO DEL LOCAL→ banner de cerrado y domicilios
   5. CLUB            → políticas, premios, consulta de puntos
   6. OPINIONES
   La administración vive en admin.html / admin.js.
   ===================================================================== */
'use strict';

/* ---------------------------------------------------------------------
   1. CONFIGURACIÓN
   --------------------------------------------------------------------- */

// Número con código de país, SIN "+", espacios ni guiones. Ej.: '573001234567'
const WHATSAPP_NUMBER   = '573017759082';

const INSTAGRAM_HANDLE  = '@grosmania';                          // POR CONFIRMAR
const INSTAGRAM_URL     = 'https://www.instagram.com/grosmania'; // POR CONFIRMAR

const MAPS_URL   = 'https://maps.app.goo.gl/c2L7uqFson3YxZ9f8';
const MAPS_EMBED = 'https://www.google.com/maps?q=6.2378006,-75.5397747&hl=es&z=17&output=embed';
const SONETIX_URL = 'https://sonetix.emanuelvillada10.workers.dev/';

const WA_MESSAGES = {
  hola: 'Hola Gro’smania, quisiera más información.',
  puntos: 'Hola Gro’smania 👋 Quisiera saber cuántos puntos tengo en el Club.'
};
const waLink = (text) => `https://wa.me/${WHATSAPP_NUMBER || ''}?text=${encodeURIComponent(text)}`;

/* ---------------------------------------------------------------------
   2. CARTA (viene de la base de datos)
   --------------------------------------------------------------------- */

let MENU = null;                 // { settings, products, flavors }
let filterCat = 'Todos';
const S = () => MENU.settings;
const prod = (id) => MENU.products.find((p) => p.id === id);

async function loadMenu() {
  try {
    MENU = await api('menu');
    return true;
  } catch (_) {
    // Sin servidor (p. ej. index.html abierto desde el disco): se usa la carta incluida en menu-fallback.js.
    if (window.MENU_FALLBACK) {
      MENU = window.MENU_FALLBACK;
      toast('Estás viendo la carta guardada. El Club, las opiniones y los cambios del panel necesitan el servidor.');
      return true;
    }
    $('#grid').innerHTML = `<div class="empty">No pudimos cargar la carta.<br><button class="btn btn-primary" type="button" id="retryMenu" style="margin-top:14px">Intentar de nuevo</button><br><br>También puedes escribirnos por WhatsApp.</div>`;
    return false;
  }
}

function renderChips() {
  const cats = ['Todos', ...new Set(MENU.products.map((p) => p.cat))];
  $('#chips').innerHTML = cats.map((c) =>
    `<button class="chip" type="button" data-cat="${esc(c)}" aria-pressed="${c === filterCat}">${esc(c)}</button>`).join('');
}

const qtyOfProduct = (id) => cart.filter((l) => l.id === id).reduce((a, l) => a + l.q, 0);

/* Opciones que elige el cliente en un producto: sabores de helado + grupos (salsa, fruta, topping…). */
function slotsOf(p) {
  const slots = [];
  if (p.flavors > 0) slots.push({ label: p.flavors === 1 ? 'Sabor' : 'Sabores', count: p.flavors, choices: MENU.flavors.map((f) => f.name), flavor: true });
  (p.groups || []).forEach((g) => slots.push({ label: g.name, count: g.count, choices: g.choices }));
  return slots;
}
const hasOptions = (p) => p.flavors > 0 || (p.groups || []).length > 0;
const optionsNote = (p) => [
  p.flavors > 0 ? `${p.flavors} ${p.flavors === 1 ? 'sabor' : 'sabores'} de helado` : '',
  ...(p.groups || []).map((g) => `${g.count} ${g.name.toLowerCase()}`)
].filter(Boolean).join(' · ');

function addArea(p) {
  if (hasOptions(p)) {
    const n = qtyOfProduct(p.id);
    return `<button class="btn btn-primary" type="button" data-pick="${esc(p.id)}" aria-label="Elegir opciones y agregar ${esc(p.name)}">${p.groups && p.groups.length ? 'Armar y agregar' : 'Elegir sabores'}</button>${n ? `<small class="in-cart">En tu pedido: ${n}</small>` : ''}`;
  }
  const key = lineKey(p.id, []), l = cart.find((x) => x.key === key), q = l ? l.q : 0;
  return q
    ? `<div class="stepper" role="group" aria-label="Cantidad de ${esc(p.name)}">
         <button type="button" data-dec="${key}" aria-label="Quitar uno">−</button><b aria-live="polite">${q}</b><button type="button" data-inc="${key}" aria-label="Agregar uno más">+</button>
       </div>`
    : `<button class="btn btn-primary" type="button" data-inc="${key}" aria-label="Agregar ${esc(p.name)} a mi pedido">Agregar</button>`;
}

function cardImage(p) {
  return p.img
    ? `<img src="${esc(p.img)}" alt="${esc(p.alt || p.name)}" loading="lazy" style="object-position:${esc(p.pos || 'center')}" width="900" height="1125">`
    : `<div class="card-noimg" role="img" aria-label="${esc(p.name)}"><img src="logos/logo-teal-v.svg" alt="" width="120" height="120"></div>`;
}

const COMPACT_CAT = 'Adiciones';        // se muestra como lista, sin tarjetas grandes

function renderGrid() {
  const list = MENU.products.filter((p) => filterCat === 'Todos' || p.cat === filterCat);
  const cards = list.filter((p) => p.cat !== COMPACT_CAT), extras = list.filter((p) => p.cat === COMPACT_CAT);
  $('#grid').innerHTML = cards.map((p) => `
    <article class="card" data-card="${esc(p.id)}">
      <div class="card-img">${cardImage(p)}</div>
      <div class="card-body">
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.desc)}</p>
        ${hasOptions(p) ? `<p class="flv-note">🍨 Eliges: ${esc(optionsNote(p))}</p>` : ''}
        <div class="card-foot"><span class="price">${pk(p.price)}</span><span class="add-area">${addArea(p)}</span></div>
      </div>
    </article>`).join('');
  if (extras.length) {
    $('#grid').insertAdjacentHTML('beforeend', `
    <section class="extras" aria-labelledby="extrasTitle">
      <h3 id="extrasTitle">Adiciones</h3><p class="fine">Para sumar a tu helado.</p>
      <ul class="extras-list">${extras.map((p) => `
        <li data-card="${esc(p.id)}"><span class="ex-name">${esc(p.name)}</span><span class="price">${pk(p.price)}</span><span class="add-area">${addArea(p)}</span></li>`).join('')}</ul>
    </section>`);
  }
  if (!list.length) $('#grid').innerHTML = '<p class="empty">No hay productos en esta categoría.</p>';
}

/* ---------------------------------------------------------------------
   3. PEDIDO
   El carrito es una lista de líneas {key, id, sel:[{label, vals}], q}. Dos productos iguales
   con las mismas opciones se juntan en una línea; con opciones distintas son líneas aparte.
   --------------------------------------------------------------------- */

const CART_KEY = 'grosmania.pedido.v3';
let cart = [];
const lineKey = (id, sel) => `${id}|${sel.map((s) => [...s.vals].sort().join('+')).join('/')}`;
const cartCount = () => cart.reduce((a, l) => a + l.q, 0);
const cartTotal = () => cart.reduce((a, l) => a + prod(l.id).price * l.q, 0);
const saveCart = () => store.set(CART_KEY, cart.map(({ id, sel, q }) => ({ id, sel, q })));
const selText = (sel, sep = ' · ') => sel.map((s) => `${s.label}: ${s.vals.join(', ')}`).join(sep);

/* Una línea guardada solo vale si sus opciones siguen existiendo en la carta actual. */
function validSel(p, sel) {
  const slots = slotsOf(p);
  return Array.isArray(sel) && sel.length === slots.length &&
    slots.every((s, i) => sel[i] && Array.isArray(sel[i].vals) && sel[i].vals.length === s.count && sel[i].vals.every((v) => s.choices.includes(v)));
}
function restoreCart() {
  cart = store.get(CART_KEY, []).filter((l) => l && prod(l.id) && l.q > 0 && validSel(prod(l.id), l.sel))
    .map((l) => ({ key: lineKey(l.id, l.sel), id: l.id, sel: l.sel.map((s, i) => ({ label: slotsOf(prod(l.id))[i].label, vals: s.vals })), q: Math.min(99, l.q | 0) }));
}

function addLine(id, sel, d = 1) {
  const key = lineKey(id, sel);
  let l = cart.find((x) => x.key === key);
  if (!l && d > 0) { l = { key, id, sel: sel.map((s) => ({ label: s.label, vals: [...s.vals] })), q: 0 }; cart.push(l); }
  if (!l) return;
  l.q = Math.max(0, Math.min(99, l.q + d));
  if (!l.q) cart = cart.filter((x) => x !== l);
  saveCart(); refreshCardsAndCart(id);
}
function refreshCardsAndCart(id) {
  const area = $(`[data-card="${CSS.escape(id)}"] .add-area`);
  if (area) area.innerHTML = addArea(prod(id));
  refreshCart();
}

/* Ventana para elegir sabores y demás opciones del producto. */
function pickOptions(p) {
  const slots = slotsOf(p);
  if (slots.some((s) => !s.choices.length)) return toast('Por ahora no hay sabores disponibles. Escríbenos por WhatsApp.');
  const fields = slots.map((s, si) => Array.from({ length: s.count }, (_, i) => `
    <div class="field"><label for="op_${si}_${i}">${esc(s.label)}${s.count > 1 ? ` ${i + 1}` : ''}</label>
      <select id="op_${si}_${i}"><option value="" selected disabled>Elige…</option>${s.choices.map((c) => `<option>${esc(c)}</option>`).join('')}</select></div>`).join('')).join('');
  openModal(`
    <h2>${esc(p.name)}</h2>
    <p class="fine" style="margin-bottom:14px">Elige: ${esc(optionsNote(p))}. Puedes repetir una opción.</p>
    <form id="optForm" novalidate>${fields}
      <div class="modal-actions"><button class="btn btn-ghost" type="button" data-close>Cancelar</button><button class="btn btn-primary" type="submit">Agregar · ${pk(p.price)}</button></div>
    </form>`);
  $('#optForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const sel = slots.map((s, si) => ({ label: s.label, vals: Array.from({ length: s.count }, (_, i) => $(`#op_${si}_${i}`).value) }));
    const missing = sel.find((s) => s.vals.some((v) => !v));
    if (missing) return toast(`Falta elegir: ${missing.label.toLowerCase()}.`);
    addLine(p.id, sel);
    closeModal();
    toast(`${p.name} agregado a tu pedido 🍨`);
  });
}

function refreshCart() {
  const n = cartCount(), total = n ? cartTotal() : 0;
  const badge = $('#cartCount');
  badge.textContent = n; badge.hidden = n === 0;
  $('#orderBar').classList.toggle('show', n > 0 && !drawerOpen);
  $('#orderBarText').textContent = `${n} ${n === 1 ? 'producto' : 'productos'} · ${pk(total)}`;
  if (drawerOpen) renderCartItems();
}

/* --- Panel del pedido --- */
let drawerOpen = false;
const orderForm = { name: '', mode: 'Domicilio', addr: '', pay: 'Efectivo', cash: '', phone: '', notes: '' };

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
  const delivery = S().delivery_enabled;
  if (!delivery && orderForm.mode === 'Domicilio') orderForm.mode = 'Recoger en el local';
  $('#drawerBody').innerHTML = `
    <div id="cartItems"></div>
    <div id="cartForm">
      <div class="field" style="margin-top:18px"><label for="o_name">Tu nombre</label><input id="o_name" autocomplete="name" value="${esc(orderForm.name)}"></div>
      <div class="field"><span style="font-weight:700">¿Cómo lo quieres?</span>
        <div class="radios">
          <label class="${delivery ? '' : 'off'}"><input type="radio" name="o_mode" value="Domicilio" ${orderForm.mode === 'Domicilio' ? 'checked' : ''} ${delivery ? '' : 'disabled'}> Domicilio</label>
          <label><input type="radio" name="o_mode" value="Recoger en el local" ${orderForm.mode !== 'Domicilio' ? 'checked' : ''}> Recoger en el local</label>
        </div>
        ${delivery ? '' : '<span class="hint">Por ahora no hacemos domicilios. ¡Te esperamos en el local!</span>'}
      </div>
      <div class="field" id="addrField"><label for="o_addr">Dirección de entrega</label><input id="o_addr" autocomplete="street-address" value="${esc(orderForm.addr)}">
        <span class="hint">El domicilio cuesta como máximo ${pk(S().delivery_fee_max)}; lo confirmamos por WhatsApp.</span></div>
      <div class="field"><span style="font-weight:700">¿Cómo vas a pagar?</span>
        <div class="radios">
          <label><input type="radio" name="o_pay" value="Efectivo" ${orderForm.pay === 'Efectivo' ? 'checked' : ''}> Efectivo</label>
          <label><input type="radio" name="o_pay" value="Transferencia" ${orderForm.pay === 'Transferencia' ? 'checked' : ''}> Transferencia</label>
        </div>
      </div>
      <div class="field" id="cashField"><label for="o_cash">¿Con cuánto pagas? <span style="font-weight:500;color:var(--muted)">(opcional)</span></label>
        <input id="o_cash" inputmode="numeric" placeholder="Ej.: 50000" value="${esc(orderForm.cash)}"><span class="hint">Así llevamos el cambio exacto.</span></div>
      <div class="field" id="transferField"><div class="pay-note">${S().transfer_info
        ? `<b>Datos para la transferencia:</b><br>${esc(S().transfer_info)}<br><small>Envía el comprobante por WhatsApp junto con tu pedido.</small>`
        : '<b>Transferencia:</b> te enviamos los datos de la cuenta por WhatsApp y nos mandas el comprobante.'}</div></div>
      <div class="field"><label for="o_phone">Tu celular <span style="font-weight:500;color:var(--muted)">(opcional)</span></label>
        <input id="o_phone" inputmode="numeric" autocomplete="tel" placeholder="300 123 4567" value="${esc(orderForm.phone)}">
        <span class="hint">Si ya estás en el Club, así te sumamos los puntos.</span></div>
      <div class="field"><label for="o_notes">Comentarios <span style="font-weight:500;color:var(--muted)">(opcional)</span></label><textarea id="o_notes" rows="2" placeholder="Sin cereza, alergias, etc.">${esc(orderForm.notes)}</textarea></div>
      <button class="btn btn-ghost btn-sm" type="button" id="clearOrder">Vaciar mi pedido</button>
    </div>`;
  syncOrderFields();
  renderCartItems();
}

function syncOrderFields() {
  if (!$('#addrField')) return;
  $('#addrField').hidden = orderForm.mode !== 'Domicilio';
  $('#cashField').hidden = orderForm.pay !== 'Efectivo';
  $('#transferField').hidden = orderForm.pay !== 'Transferencia';
}

function renderCartItems() {
  const items = $('#cartItems'), form = $('#cartForm'), foot = $('#drawerFoot');
  if (!items) return;
  if (!cart.length) {
    items.innerHTML = '<p class="empty">Tu pedido está vacío.<br>Elige algo de la carta 🍨</p>';
    form.hidden = true;
    foot.innerHTML = '<button class="btn btn-primary btn-block" type="button" id="goMenu">Ver la carta</button>';
    return;
  }
  form.hidden = false;
  items.innerHTML = cart.map((l) => {
    const p = prod(l.id);
    return `<div class="cart-item">
      ${p.img ? `<img src="${esc(p.img)}" alt="" style="object-position:${esc(p.pos || 'center')}">` : '<img src="logos/logo-teal-v.svg" alt="" class="noimg">'}
      <div><b>${esc(p.name)}</b>${l.sel.map((s) => `<small class="fl">${esc(s.label)}: ${esc(s.vals.join(', '))}</small>`).join('')}<small>${pk(p.price)} c/u · ${pk(p.price * l.q)}</small></div>
      <div class="stepper"><button type="button" data-dec="${esc(l.key)}" aria-label="Quitar uno de ${esc(p.name)}">−</button><b>${l.q}</b><button type="button" data-inc="${esc(l.key)}" aria-label="Agregar uno más de ${esc(p.name)}">+</button></div>
    </div>`;
  }).join('');

  const st = storeStatus(S());
  const fee = S().delivery_fee_max, dom = orderForm.mode === 'Domicilio';
  foot.innerHTML = `
    <div class="total-row"><span>Productos</span><span>${pk(cartTotal())}</span></div>
    ${dom ? `<p class="fine">+ Domicilio: <b>máximo ${pk(fee)}</b> (se confirma por WhatsApp según tu dirección). Total máximo: <b>${pk(cartTotal() + fee)}</b>.</p>` : '<p class="fine">Recoges en el local: sin costo de domicilio.</p>'}
    ${st.open ? '' : `<p class="closed-note">${esc(st.reason)} ${esc(st.next)} Podrás enviar el pedido cuando abramos.</p>`}
    <button class="btn btn-wa btn-block" type="button" id="sendOrder" ${st.open ? '' : 'disabled'}><svg aria-hidden="true"><use href="#i-wa"/></svg>${st.open ? 'Enviar pedido por WhatsApp' : 'Local cerrado'}</button>`;
}

function readOrderForm() {
  if (!$('#o_name')) return;
  orderForm.name = $('#o_name').value.trim();
  orderForm.mode = ($('input[name="o_mode"]:checked') || {}).value || orderForm.mode;
  orderForm.addr = $('#o_addr').value.trim();
  orderForm.pay = ($('input[name="o_pay"]:checked') || {}).value || 'Efectivo';
  orderForm.cash = $('#o_cash').value.replace(/\D/g, '');
  orderForm.phone = $('#o_phone').value.trim();
  orderForm.notes = $('#o_notes').value.trim();
}

function sendOrder() {
  readOrderForm();
  const st = storeStatus(S());
  if (!st.open) return toast('Estamos cerrados. ' + st.next);
  if (!orderForm.name) { toast('Escribe tu nombre para enviar el pedido.'); $('#o_name').focus(); return; }
  const dom = orderForm.mode === 'Domicilio';
  if (dom && !S().delivery_enabled) return toast('Por ahora no hacemos domicilios. Elige «Recoger en el local».');
  if (dom && !orderForm.addr) { toast('Escribe la dirección de entrega.'); $('#o_addr').focus(); return; }

  const lines = cart.map((l) => {
    const p = prod(l.id);
    return `• ${l.q} x ${p.name}${l.sel.length ? ` (${selText(l.sel, '; ')})` : ''} — ${money(p.price * l.q)}`;
  });
  const phone = normPhone(orderForm.phone), cash = parseInt(orderForm.cash, 10);
  const fee = S().delivery_fee_max;
  const msg = [
    'Hola Gro’smania 👋 Quiero hacer este pedido:', '',
    ...lines, '',
    `Total de productos: ${money(cartTotal())}`,
    dom ? `Domicilio: máximo ${money(fee)} (lo confirman por aquí) → total máximo ${money(cartTotal() + fee)}` : null, '',
    `Nombre: ${orderForm.name}`,
    `Modalidad: ${orderForm.mode}`,
    dom ? `Dirección: ${orderForm.addr}` : null,
    `Forma de pago: ${orderForm.pay}`,
    orderForm.pay === 'Efectivo' && cash ? `Pago con: ${money(cash)}` : null,
    orderForm.pay === 'Transferencia' ? 'Les envío el comprobante por aquí.' : null,
    phone ? `Celular (Club): ${showPhone(phone)}` : null,
    orderForm.notes ? `Comentarios: ${orderForm.notes}` : null
  ].filter((l) => l !== null).join('\n');
  const w = window.open(waLink(msg), '_blank', 'noopener');
  if (!w) { location.href = waLink(msg); return; }
  cart = []; saveCart(); orderForm.notes = '';
  renderGrid(); closeDrawer();
  toast('Se abrió WhatsApp con tu pedido. ¡Solo falta enviarlo!');
}

/* ---------------------------------------------------------------------
   4. ESTADO DEL LOCAL Y DOMICILIOS
   --------------------------------------------------------------------- */

function renderStatus() {
  const s = S(), st = storeStatus(s), banner = $('#closedBanner');
  banner.hidden = st.open;
  if (!st.open) banner.innerHTML = `<div class="wrap"><span class="dot" aria-hidden="true"></span><strong>${esc(st.reason)}</strong> <span>${esc(st.next)}</span></div>`;
  $$('[data-text="hours"]').forEach((el) => { el.textContent = hoursText(s); });
  $('#deliveryInfo').textContent = s.delivery_enabled
    ? `Pide por WhatsApp. El domicilio cuesta como máximo ${pk(s.delivery_fee_max)}, según tu dirección, y se confirma por WhatsApp.`
    : 'Por ahora no tenemos domicilios. Puedes pedir por WhatsApp y recoger en el local.';
  $('#deliveryChip').textContent = s.delivery_enabled ? 'Domicilios por WhatsApp' : 'Pedidos para recoger en el local';
  if (drawerOpen) renderCartItems();
}

/* ---------------------------------------------------------------------
   5. CLUB
   --------------------------------------------------------------------- */

function renderClubPublic() {
  const s = S();
  $$('[data-text="ppp"]').forEach((el) => { el.textContent = `1 punto por cada ${money(s.points_per)}`; });
  $('#rewardsList').innerHTML = s.rewards.map((r) =>
    `<li><span>${esc(r.name)}</span><span class="pts">${num(r.pts)} puntos</span></li>`).join('');
  $('#levelsList').innerHTML = s.levels.map((l, i) => {
    const next = s.levels[i + 1];
    return `<div class="level"><b>${esc(l.name)}</b><span>${next ? `${num(l.min)} a ${num(next.min - 1)} puntos` : `desde ${num(l.min)} puntos`}</span></div>`;
  }).join('');
  $('#giftNote').textContent = '🎁 ' + s.birthday_gift;
  $('#termsList').innerHTML = [
    `<b>Puntos solo por productos.</b> Ganas 1 punto por cada ${money(s.points_per)} del valor de los productos. El domicilio no suma puntos.`,
    `<b>Vencimiento.</b> Los puntos vencen a los ${s.points_valid_months} meses de la compra. Se gastan primero los más antiguos y abajo puedes consultar cuándo vencen los tuyos.`,
    '<b>Un premio, un producto.</b> Cada canje es de un solo premio y se aplica a un solo producto. Se canjea un premio a la vez (máximo uno por día).',
    '<b>No se acumula con promociones.</b> El premio no se combina con otras promociones, descuentos o combos: se usa uno u otro, nunca los dos en la misma compra.',
    '<b>Personales e intransferibles.</b> Los puntos están ligados al celular del titular, no se cambian por dinero ni se pueden pasar a otra persona.',
    '<b>Se registran en el momento.</b> Da tu celular al pagar para sumar puntos o canjear. Sin ese registro no se suman ni se descuentan.',
    '<b>Cumpleaños.</b> El regalo se entrega una sola vez al año, durante la semana de tu cumpleaños.',
    '<b>Cambios.</b> Gro’smania puede modificar premios y condiciones avisando en esta página. Los puntos ya ganados se respetan hasta su fecha de vencimiento.'
  ].map((t) => `<li>${t}</li>`).join('');
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

  $('#pointsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const phone = normPhone($('#qp').value), birth = $('#qb').value, box = $('#pointsResult');
    box.hidden = true;
    if (!validPhone(phone)) return showErr('#pointsErr', 'Escribe tu celular de 10 números. Ej.: 300 123 4567');
    if (!birth) return showErr('#pointsErr', 'Elige tu fecha de cumpleaños (es tu clave).');
    showErr('#pointsErr', '');
    const btn = $('#pointsBtn'); btn.disabled = true; btn.textContent = 'Consultando…';
    try {
      const r = await api('points', { method: 'POST', body: { phone, birth } });
      const can = S().rewards.filter((x) => x.pts <= r.balance);
      box.innerHTML = `<b>Hola ${esc(r.name)} 👋</b><br>Tienes <strong>${num(r.balance)} puntos</strong> · Nivel ${esc(r.level)}.
        ${can.length ? `<br>Ya te alcanza para: ${can.map((x) => esc(x.name)).join(', ')}.` : ''}
        ${r.nextExpiry ? `<br><small>Vencen ${num(r.nextExpiry.pts)} puntos el ${fmtDate(r.nextExpiry.date)}.</small>` : ''}`;
      box.hidden = false;
    } catch (err) { showErr('#pointsErr', err.message); }
    btn.disabled = false; btn.textContent = 'Ver mis puntos';
  });
}

/* ---------------------------------------------------------------------
   6. OPINIONES
   --------------------------------------------------------------------- */

async function loadReviews() {
  try {
    const { comments, average } = await api('comments');
    $('#reviewsSummary').innerHTML = comments.length
      ? `<span class="avg">${stars(Math.round(average))}</span> <b>${average.toString().replace('.', ',')}</b> de 5 · ${comments.length} ${comments.length === 1 ? 'opinión' : 'opiniones'}`
      : 'Sé el primero en contarnos cómo te fue. Tu opinión nos ayuda a mejorar.';
    $('#reviewsList').innerHTML = comments.map((c) => `
      <article class="review"><div class="stars" aria-label="${c.rating} de 5 estrellas">${stars(c.rating)}</div>
        <p>“${esc(c.text)}”</p><small><b>${esc(c.name)}</b> · ${fmtDate(c.date)}</small></article>`).join('');
  } catch (_) { $('#reviewsList').innerHTML = ''; }
}

function setupReviews() {
  $('#reviewForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = $('#rv_n').value.trim(), text = $('#rv_t').value.trim(), rating = ($('input[name="rv_r"]:checked') || {}).value;
    if (name.length < 2) return showErr('#reviewErr', 'Escribe tu nombre.');
    if (!rating) return showErr('#reviewErr', 'Elige cuántas estrellas nos das.');
    if (text.length < 5) return showErr('#reviewErr', 'Cuéntanos un poquito más en tu comentario.');
    showErr('#reviewErr', '');
    const btn = $('#reviewBtn'); btn.disabled = true;
    try {
      await api('comments', { method: 'POST', body: { name, rating: Number(rating), text, website: $('#rv_w').value } });
      e.target.reset();
      toast('¡Gracias por tu comentario! Lo publicaremos después de revisarlo 💚');
    } catch (err) { showErr('#reviewErr', err.message); }
    btn.disabled = false;
  });
}

/* ---------------------------------------------------------------------
   Arranque
   --------------------------------------------------------------------- */

function route() {
  if (location.hash === '#admin') { location.replace('admin.html'); return; }
  if (location.hash.length > 1) { const t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
}

async function startMenu() {
  if (!(await loadMenu())) return;
  restoreCart();
  if (!S().delivery_enabled) orderForm.mode = 'Recoger en el local';
  renderChips(); renderGrid(); renderClubPublic(); renderStatus(); refreshCart();
}

function init() {
  $$('[data-wa]').forEach((a) => { a.href = waLink(WA_MESSAGES[a.dataset.wa] || WA_MESSAGES.hola); });
  $('#mapsBtn').href = MAPS_URL;
  $('#mapFrame').src = MAPS_EMBED;
  $('#igBtn').href = INSTAGRAM_URL; $('#igHandle').textContent = INSTAGRAM_HANDLE;
  const so = $('#sonetix'); if (SONETIX_URL) { so.href = SONETIX_URL; so.target = '_blank'; so.rel = 'noopener'; }
  $('#year').textContent = new Date().getFullYear();

  setupClubForms(); setupReviews();
  startMenu().then(() => { if (MENU) route(); });
  loadReviews();
  setInterval(() => { if (MENU) renderStatus(); }, 60000);   // el banner se actualiza solo al abrir/cerrar

  $('#chips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]'); if (!b) return;
    filterCat = b.dataset.cat; renderChips(); renderGrid();
  });
  document.addEventListener('click', (e) => {
    const inc = e.target.closest('[data-inc]'), dec = e.target.closest('[data-dec]'), pick = e.target.closest('[data-pick]');
    const byKey = (k) => { const id = k.split('|')[0]; return [id, cart.find((l) => l.key === k)]; };
    if (pick) pickOptions(prod(pick.dataset.pick));
    else if (inc) { const k = inc.dataset.inc, [id, l] = byKey(k); addLine(id, l ? l.sel : [], 1); }
    else if (dec) { const k = dec.dataset.dec, [id, l] = byKey(k); if (l) addLine(id, l.sel, -1); }
    else if (e.target.closest('#cartBtn, #orderBarBtn')) { if (MENU) openDrawer(); }
    else if (e.target.closest('#drawerClose') || e.target.id === 'overlay') closeDrawer();
    else if (e.target.closest('#sendOrder')) sendOrder();
    else if (e.target.closest('#retryMenu')) startMenu();
    else if (e.target.closest('#goMenu')) { closeDrawer(); location.hash = '#menu'; }
    else if (e.target.closest('#clearOrder')) { if (confirm('¿Vaciar todo tu pedido?')) { cart = []; saveCart(); renderGrid(); refreshCart(); } }
  });
  document.addEventListener('input', (e) => { if (e.target.id && e.target.id.startsWith('o_')) readOrderForm(); });
  document.addEventListener('change', (e) => {
    if (e.target.name === 'o_mode' || e.target.name === 'o_pay') { readOrderForm(); syncOrderFields(); renderCartItems(); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawerOpen) closeDrawer(); });
  window.addEventListener('hashchange', route);
}
init();
