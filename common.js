/* =====================================================================
   GRO’SMANIA — common.js
   Utilidades que comparten la página pública (script.js) y el panel (admin.js).
   ===================================================================== */
'use strict';

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
const num = (n) => new Intl.NumberFormat('es-CO').format(n);
/* Precio corto para la página: 13000 → «13K», 15500 → «15,5K». (El administrador y WhatsApp usan el valor completo.) */
const pk = (n) => (n % 100 === 0 ? `${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(n / 1000)}K` : money(n));

const store = {
  get(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (_) { return fallback; } },
  set(key, value)    { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* sin almacenamiento: no pasa nada */ } }
};

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  $('#toasts').appendChild(t);
  setTimeout(() => t.remove(), 3600);
}

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
const fmtDate = (iso) => new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Bogota' });
const fmtBirth = (s) => parseYMD(s).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' });
const todayStart = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };

/* «13:30» → «1:30 pm» */
function fmtTime(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h < 12 ? 'am' : 'pm'}`;
}
const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

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

const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

/* Ventana emergente. Cualquier elemento con data-close la cierra; Escape también. */
let modalEl = null;
function openModal(html) {
  closeModal();
  modalEl = document.createElement('div');
  modalEl.className = 'modal-wrap';
  modalEl.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  modalEl.addEventListener('mousedown', (e) => { if (e.target === modalEl) closeModal(); });
  document.body.appendChild(modalEl);
  const first = $('input:not([readonly]):not([type=radio]), select, button', modalEl);
  if (first) first.focus();
  return modalEl;
}
function closeModal() { if (modalEl) { modalEl.remove(); modalEl = null; } }
document.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

/* Llamadas a la API (/api/...). Lanza Error con el mensaje en español que devuelve el servidor. */
async function api(path, { method = 'GET', body, token } = {}) {
  let res;
  try {
    res = await fetch('/api/' + path, {
      method,
      headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: 'Bearer ' + token } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch (_) { throw new Error('Sin conexión con el servidor. Revisa tu internet e intenta de nuevo.'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const err = new Error(data.error || 'Algo salió mal. Intenta de nuevo.'); err.status = res.status; throw err; }
  return data;
}

/* Estado del local según el horario de Colombia (America/Bogota) y el interruptor del administrador. */
function storeStatus(s, now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(now).map((p) => [p.type, p.value]));
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
  const min = Number(parts.hour) * 60 + Number(parts.minute);
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const open = toMin(s.open_time), close = toMin(s.close_time);

  if (s.status_override === 'open') return { open: true };
  if (s.status_override === 'closed') return { open: false, reason: s.closed_message || 'Hoy estamos cerrados.', next: nextOpening(s, day, min, open, true) };
  const inHours = close > open ? min >= open && min < close : min >= open || min < close;
  if (s.open_days.includes(day) && inHours) return { open: true };
  return { open: false, reason: s.closed_message || 'En este momento estamos cerrados.', next: nextOpening(s, day, min, open, false) };
}
function nextOpening(s, day, min, open, skipToday) {
  const at = fmtTime(s.open_time);
  if (!skipToday && s.open_days.includes(day) && min < open) return `Hoy abrimos a las ${at}.`;
  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7;
    if (s.open_days.includes(d)) return i === 1 ? `Mañana abrimos a las ${at}.` : `Abrimos el ${DAYS[d]} a las ${at}.`;
  }
  return '';
}
function hoursText(s) {
  const days = s.open_days.length === 7 ? 'Todos los días' : s.open_days.length ? 'Abrimos ' + s.open_days.map((d) => DAYS[d]).join(', ') : 'Sin días de atención';
  return `${days} de ${fmtTime(s.open_time)} a ${fmtTime(s.close_time)}`;
}

/* --- Domicilio por metros --- */
/* ¿El local tiene tarifa por metro y ubicación? Si no, el valor del domicilio se confirma por WhatsApp. */
const hasMeterRate = (s) => Number(s.delivery_per_meter) > 0 && Number.isFinite(Number(s.store_lat)) && Number.isFinite(Number(s.store_lng));

/* Costo del domicilio por tramos de distancia (delivery_tiers: «hasta X metros, $Y»). Pasado el último tramo se cobra su valor
   más el valor por metro de lo que pase, redondeado hacia arriba a los $100. Sin tramos, todo va por metro. */
function deliveryFee(meters, s) {
  const tiers = (Array.isArray(s.delivery_tiers) ? s.delivery_tiers : []).slice().sort((a, b) => a.upTo - b.upTo);
  for (const t of tiers) if (meters <= Number(t.upTo)) return Number(t.fee);
  const last = tiers[tiers.length - 1], base = last ? Number(last.upTo) : 0;
  return (last ? Number(last.fee) : 0) + Math.ceil(((meters - base) * Number(s.delivery_per_meter)) / 100) * 100;
}

/* ¿Queda más lejos de lo que se atiende? (delivery_max_meters = 0 → sin límite de distancia) */
const tooFar = (meters, s) => Number(s.delivery_max_meters) > 0 && meters > Number(s.delivery_max_meters);

/* Pedido mínimo (solo productos) para hacer domicilio; 0 = sin mínimo. */
const deliveryMin = (s) => Math.max(0, Number(s.delivery_min_order) || 0);

/* Distancia en línea recta (metros) entre dos puntos. */
function straightMeters(a, b) {
  const R = 6371000, rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/* Metros para llegar por la calle (OSRM, gratuito y sin clave). Si no responde, línea recta × 1,3 y se marca como aproximado. */
async function routeMeters(from, to) {
  try {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 7000);
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;
    const res = await fetch(url, { signal: ctl.signal });
    clearTimeout(t);
    const d = await res.json();
    const m = d && d.routes && d.routes[0] && d.routes[0].distance;
    if (res.ok && d.code === 'Ok' && Number.isFinite(m)) return { meters: Math.round(m), approx: false };
  } catch (_) { /* sin red o servicio caído: se usa la línea recta */ }
  return { meters: Math.round(straightMeters(from, to) * 1.3), approx: true };
}

const fmtMeters = (m) => (m >= 1000 ? `${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(m / 1000)} km` : `${num(m)} m`);
