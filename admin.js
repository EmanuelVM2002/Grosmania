/* =====================================================================
   GRO’SMANIA — admin.js  (panel de administración)
   Todo se guarda en la base de datos por medio de /api/admin/*.
   La sesión se firma en el servidor: aquí solo se guarda el permiso temporal (12 h).
   ===================================================================== */
'use strict';

const TOKEN_KEY = 'gm.admin.token';
let token = null;
try { token = sessionStorage.getItem(TOKEN_KEY); } catch (_) { /* nada */ }

let D = null;                 // todo lo que devuelve /api/admin/data
let tab = 'resumen';
try { const t0 = sessionStorage.getItem('gm.admin.tab'); if (t0) tab = t0; } catch (_) { /* nada */ }
let search = '';
let commentFilter = 'pendiente';

const TABS = [['resumen', 'Resumen'], ['clientes', 'Clientes'], ['productos', 'Productos'], ['sabores', 'Sabores'], ['comentarios', 'Comentarios'], ['ajustes', 'Ajustes']];
/* Iconos de la barra de navegación (trazo simple, 24×24). */
const TAB_ICON = {
  resumen: '<path d="M5 20V11M12 20V4M19 20v-6M3 20h18"/>',
  clientes: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17.5" cy="9" r="2.5"/><path d="M17 14c2.8 0 4.5 1.8 4.5 4.5"/>',
  productos: '<path d="M7 10a5 5 0 0 1 10 0"/><path d="M5.5 10h13l-6.5 12z"/>',
  sabores: '<circle cx="12" cy="8.5" r="5"/><path d="M7.5 13l4.5 9 4.5-9"/>',
  comentarios: '<path d="M4 5h16v11H9.5L4 20.5z"/>',
  ajustes: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'
};
const icon = (p) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const MOVE_LABEL = { compra: 'Compra', canje: 'Canje', ajuste: 'Ajuste', cumple: 'Regalo de cumpleaños' };
const bogotaDay = (iso) => new Date(new Date(iso).getTime() - 5 * 3600e3).toISOString().slice(0, 10);
const monthName = (ym) => parseYMD(ym + '-01').toLocaleDateString('es-CO', { month: 'short' });

/* ---------- llamadas ---------- */

async function call(path, opts = {}) {
  try { return await api('admin/' + path, { ...opts, token }); }
  catch (err) { if (err.status === 401) { setToken(null); render(); } throw err; }
}
function setToken(t) {
  token = t;
  try { t ? sessionStorage.setItem(TOKEN_KEY, t) : sessionStorage.removeItem(TOKEN_KEY); } catch (_) { /* nada */ }
}
async function refresh() { const y = window.scrollY; D = await call('data'); render(); window.scrollTo(0, y); }

/* Ejecuta una acción, muestra el error en pantalla si falla y recarga los datos si sale bien. */
async function run(fn, okMsg, errEl) {
  try {
    await fn();
    closeModal();
    await refresh();
    if (okMsg) toast(okMsg);
    return true;
  } catch (err) {
    if (errEl) { errEl.textContent = err.message; errEl.hidden = false; } else toast(err.message);
    return false;
  }
}
const errBox = (id) => `<p class="field err" id="${id}" role="alert" hidden></p>`;

/* ---------- pantalla principal ---------- */

function render() {
  const root = $('#adminRoot');
  document.body.classList.toggle('is-admin', !!(token && D));
  if (!token || !D) { renderLogin(root); return; }
  const s = D.settings, pending = D.comments.filter((c) => c.status === 'pendiente').length;
  const svg = (p) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  root.innerHTML = `
  <div class="admin adm-shell">
    <aside class="adm-side">
      <div class="adm-brand"><img src="logos/logo-cream-v.svg" alt="Gro’smania"><h1>Administración</h1></div>
      <div class="adm-side-actions">
        <button class="adm-icon-btn" type="button" data-act="reload" aria-label="Actualizar datos">${svg('<path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5"/>')}<span>Actualizar</span></button>
        <a class="adm-icon-btn" href="index.html">${svg('<path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5"/>')}<span>Ver la página</span></a>
        <button class="adm-icon-btn" type="button" data-act="logout" aria-label="Cerrar sesión">${svg('<path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9"/>')}<span>Salir</span></button>
      </div>
      <nav class="adm-nav" role="tablist" aria-label="Secciones">${TABS.map(([id, label]) =>
        `<button class="tab" role="tab" type="button" data-tab="${id}" aria-selected="${tab === id}">${icon(TAB_ICON[id])}<span class="lbl">${label}</span>${id === 'comentarios' && pending ? `<span class="n">${pending}</span>` : ''}</button>`).join('')}</nav>
    </aside>
    <main class="adm-main">${statusBar(s)}<h2 class="adm-title">${(TABS.find((t) => t[0] === tab) || TABS[0])[1]}</h2><div id="tabBody">${tabBody()}</div></main>
  </div>`;
}

function renderLogin(root) {
  root.innerHTML = `
  <div class="login"><form class="login-card" id="loginForm">
    <img src="logos/logo-teal-v.svg" alt="Gro’smania Heladería">
    <h1>Administración</h1><p>Solo para el personal de Gro’smania</p>
    <div class="field"><label for="lu">Usuario</label><input id="lu" autocomplete="username" value="admin"></div>
    <div class="field"><label for="lp">Contraseña</label><input id="lp" type="password" autocomplete="current-password"></div>
    ${errBox('loginErr')}
    <button class="btn btn-primary btn-block" type="submit" id="loginBtn">Entrar</button>
    <a class="btn btn-ghost btn-block" href="index.html" style="margin-top:12px">← Volver a la página</a>
  </form></div>`;
  $('#lp').focus();
}

function statusBar(s) {
  const st = storeStatus(s), manual = s.status_override !== 'auto';
  const storeBtn = manual
    ? '<button class="btn btn-ghost" type="button" data-act="store-auto">Volver al horario</button>'
    : st.open ? '<button class="btn btn-danger" type="button" data-act="store-closed">Cerrar ahora</button>'
              : '<button class="btn btn-primary" type="button" data-act="store-open">Abrir ahora</button>';
  return `<div class="statusbar">
    <div class="status-card ${st.open ? 'is-on' : 'is-off'}"><div class="st-text"><span class="st-name">Local</span><b>${st.open ? 'Abierto' : 'Cerrado'}</b>
      <small>${manual ? 'Manual (ignora el horario)' : esc(hoursText(s))}</small></div>${storeBtn}</div>
    <div class="status-card ${s.delivery_enabled ? 'is-on' : 'is-off'}"><div class="st-text"><span class="st-name">Domicilios</span><b>${s.delivery_enabled ? 'Activos' : 'Apagados'}</b>
      <small>${s.delivery_enabled ? 'Pedido mínimo ' + money(s.delivery_min_order) : 'Solo recoger y comer en el local'}</small></div>
      <button class="btn ${s.delivery_enabled ? 'btn-danger' : 'btn-primary'}" type="button" data-act="delivery-toggle">${s.delivery_enabled ? 'Apagar' : 'Activar'}</button></div>
  </div>`;
}

function tabBody() {
  return ({ resumen: tabResumen, clientes: tabClientes, productos: tabProductos, sabores: tabSabores, comentarios: tabComentarios, ajustes: tabAjustes })[tab]();
}

/* ---------- RESUMEN: puntos, metas, reportes ---------- */

function tabResumen() {
  const r = D.report, t = r.totals, cur = r.current;
  const maxPts = Math.max(1, ...r.series.map((m) => Math.max(m.issued, m.redeemed)));
  return `
  <div class="kpis five">
    <div class="kpi"><small>Clientes en el Club</small><b>${num(t.clients)}</b></div>
    <div class="kpi"><small>Puntos disponibles</small><b>${num(t.available)}</b></div>
    <div class="kpi"><small>Puntos emitidos (total)</small><b>${num(t.issued)}</b></div>
    <div class="kpi k-red"><small>Puntos consumidos (canjeados)</small><b>${num(t.redeemed)}</b></div>
    <div class="kpi k-gray"><small>Puntos vencidos</small><b>${num(t.expired)}</b></div>
  </div>
  <p class="fine">Emitidos ${num(t.issued)} − canjeados ${num(t.redeemed)} − vencidos ${num(t.expired)}${t.adjustedDown ? ` − descontados por ajuste ${num(t.adjustedDown)}` : ''} = disponibles ${num(t.available)}.
    ${t.expiring30 ? `<b>${num(t.expiring30)} puntos vencen en los próximos 30 días.</b>` : ''}</p>

  <div class="rep-grid" style="margin-top:16px">
    <section class="adm-panel"><h2>Metas de ${monthName(r.month)} ${r.month.slice(0, 4)}</h2>
      ${r.goals.map((g) => {
        const pct = g.goal ? Math.min(100, Math.round((g.value / g.goal) * 100)) : 0, fmt = (n) => (g.money ? money(n) : num(n));
        return `<div class="goal"><div class="top-line"><span>${g.label}</span><span>${fmt(g.value)}${g.goal ? ` de ${fmt(g.goal)}` : ''}</span></div>
          ${g.goal ? `<div class="bar" role="img" aria-label="${pct}% de la meta"><i class="${pct >= 100 ? 'done' : ''}" style="width:${pct}%"></i></div><small>${pct >= 100 ? '¡Meta cumplida! 🎉' : `${pct}% · falta ${fmt(g.goal - g.value)}`}</small>`
                  : '<small>Sin meta definida. Pon una en la pestaña «Ajustes».</small>'}</div>`;
      }).join('')}
      <p class="fine" style="margin:0">Este mes: ${num(cur.redemptions)} ${cur.redemptions === 1 ? 'premio canjeado' : 'premios canjeados'}, ${num(cur.issued)} puntos emitidos.</p>
    </section>

    <section class="adm-panel"><h2>Puntos por mes</h2>
      <div class="legend"><span><i style="background:var(--teal)"></i>Emitidos</span><span><i style="background:var(--berry)"></i>Canjeados</span></div>
      <div class="mchart">${r.series.map((m) => `
        <div class="col"><div class="bars"><i class="b-issued" style="height:${(m.issued / maxPts) * 100}%" title="Emitidos: ${num(m.issued)}"></i><i class="b-redeemed" style="height:${(m.redeemed / maxPts) * 100}%" title="Canjeados: ${num(m.redeemed)}"></i></div>
          <b>${monthName(m.month)}</b><small>${num(m.issued)} / ${num(m.redeemed)}</small></div>`).join('')}</div>
      <p class="fine" style="margin:10px 0 0">Ventas de productos: ${r.series.map((m) => `${monthName(m.month)} ${money(m.sales)}`).join(' · ')}</p>
    </section>

    <section class="adm-panel"><h2>Premios más canjeados</h2>
      ${r.rewards.length ? `<ul class="mini-list">${r.rewards.map((x) => `<li><span>${esc(x.name)}</span><b>${num(x.count)}</b></li>`).join('')}</ul>` : '<p class="empty" style="padding:14px">Aún no hay canjes.</p>'}
      <h2 style="margin-top:20px">Clientes con más puntos</h2>
      ${r.top.length ? `<ul class="mini-list">${r.top.map((x) => `<li><span>${esc(x.name)}</span><b>${num(x.balance)}</b></li>`).join('')}</ul>` : '<p class="empty" style="padding:14px">Aún no hay puntos.</p>'}
    </section>
  </div>`;
}

/* ---------- CLIENTES ---------- */

function clientRows() {
  const q = search.trim().toLowerCase(), qd = q.replace(/\D/g, '');
  const shown = D.clients.filter((c) => !q || c.name.toLowerCase().includes(q) || (qd && c.phone.includes(qd))).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  if (!shown.length) return `<p class="empty">${D.clients.length ? 'No hay clientes con esa búsqueda.' : 'Aún no hay clientes en el Club. Pulsa «Nuevo cliente» para registrar el primero.'}</p>`;
  const lvls = D.settings.levels;
  return `<div class="client head"><span>Cliente</span><span>Celular</span><span>Nivel</span><span>Puntos</span><span></span></div>` + shown.map((c) => `
    <div class="client">
      <div class="name"><b>${esc(c.name)}</b><small>🎂 ${fmtBirth(c.birth)} · ${age(c.birth)} años</small></div>
      <div>${showPhone(c.phone)}<br><small>Última visita: ${fmtDate(c.last || c.created_at)}</small></div>
      <div><span class="lvl lvl-${Math.min(c.level, 2)}">${esc(lvls[c.level].name)}</span><br><small>${num(c.lifetime)} acumulados</small></div>
      <div><span class="pts-badge">${num(c.balance)}</span>${c.nextExpiry ? `<br><small>Vencen ${num(c.nextExpiry.pts)} el ${fmtDate(c.nextExpiry.date)}</small>` : ''}</div>
      <div class="acts">
        <button class="btn btn-primary btn-sm" type="button" data-act="buy" data-phone="${c.phone}">＋ Compra</button>
        <button class="btn btn-ghost btn-sm" type="button" data-act="redeem" data-phone="${c.phone}">Canjear</button>
        <button class="btn btn-ghost btn-sm" type="button" data-act="view" data-phone="${c.phone}">Ver</button>
      </div>
    </div>`).join('');
}

function tabClientes() {
  const hasGift = (c) => D.moves.some((m) => m.phone === c.phone && m.type === 'cumple' && bogotaDay(m.date).slice(0, 4) === String(new Date().getFullYear()));
  const bdays = D.clients.map((c) => ({ c, d: daysToBirthday(c.birth), week: isBirthdayWeek(c.birth) })).filter((x) => x.week || x.d <= 14).sort((a, b) => a.d - b.d);
  return `
  ${bdays.length ? `<section class="adm-panel"><h2>🎂 Cumpleaños cercanos</h2><div class="bday-list">
    ${bdays.map(({ c, d, week }) => `<div class="bday"><span><b>${esc(c.name)}</b> · ${fmtBirth(c.birth)} (cumple ${age(c.birth) + (d === 0 ? 0 : 1)})</span>
      <span>${week ? '<span class="tag-now">Semana de cumpleaños</span> ' : ''}${d === 0 ? '¡Hoy!' : d === 1 ? 'Mañana' : `en ${d} días`}
      ${week && !hasGift(c) ? `<button class="btn btn-sm btn-primary" type="button" data-act="gift" data-phone="${c.phone}">Entregar regalo</button>` : (week ? '<small>Regalo entregado</small>' : '')}</span></div>`).join('')}
  </div></section>` : ''}
  <section class="adm-panel">
    <h2>Clientes del Club (${D.clients.length})</h2>
    <div class="toolbar">
      <input type="search" id="admSearch" placeholder="Buscar por nombre o celular" value="${esc(search)}" aria-label="Buscar cliente">
      <button class="btn btn-primary" type="button" data-act="new">＋ Nuevo cliente</button>
      <button class="btn btn-ghost btn-sm" type="button" data-act="csv">Descargar Excel (CSV)</button>
    </div>
    <div id="clientList">${clientRows()}</div>
  </section>`;
}

const byPhone = (p) => D.clients.find((c) => c.phone === p);

function clientForm(c) {
  const edit = !!c;
  openModal(`
    <h2>${edit ? 'Editar cliente' : 'Nuevo cliente'}</h2>
    <form id="clientForm" novalidate>
      <div class="field"><label for="cf_n">Nombre completo</label><input id="cf_n" value="${esc(c ? c.name : '')}" autocomplete="off"></div>
      <div class="field"><label for="cf_p">Celular ${edit ? '(no se puede cambiar: es la clave del cliente)' : ''}</label>
        <input id="cf_p" inputmode="numeric" placeholder="300 123 4567" value="${esc(c ? showPhone(c.phone) : '')}" ${edit ? 'readonly' : ''} autocomplete="off"></div>
      <div class="field"><label for="cf_b">Fecha de nacimiento</label><input id="cf_b" type="date" max="${ymd(new Date())}" value="${c ? c.birth : ''}"></div>
      ${errBox('cf_e')}
      <div class="modal-actions">
        ${edit ? '<button class="btn btn-danger btn-sm" type="button" id="cf_del" style="margin-right:auto">Eliminar cliente</button>' : ''}
        <button class="btn btn-ghost" type="button" data-close>Cancelar</button>
        <button class="btn btn-primary" type="submit">Guardar</button>
      </div>
    </form>`);
  $('#clientForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const body = { name: $('#cf_n').value, phone: $('#cf_p').value, birth: $('#cf_b').value };
    run(() => (edit ? call(`clients/${c.phone}`, { method: 'PUT', body }) : call('clients', { method: 'POST', body })),
      edit ? 'Cliente actualizado ✅' : 'Cliente registrado en el Club 🎉', $('#cf_e'));
  });
  const del = $('#cf_del');
  if (del) del.addEventListener('click', () => {
    if (confirm(`¿Eliminar a ${c.name} y todo su historial de puntos? Esto no se puede deshacer.`)) run(() => call(`clients/${c.phone}`, { method: 'DELETE' }), 'Cliente eliminado');
  });
}

function purchaseForm(c) {
  const per = D.settings.points_per;
  openModal(`
    <h2>Sumar compra</h2>
    <p style="margin-bottom:14px"><b>${esc(c.name)}</b> · ${showPhone(c.phone)}<br><small>Puntos actuales: ${num(c.balance)}</small></p>
    <form id="buyForm" novalidate>
      <div class="field"><label for="bf_a">Valor de los productos (pesos)</label><input id="bf_a" inputmode="numeric" placeholder="Ej.: 32000" autocomplete="off">
        <span class="hint"><b>No incluyas el domicilio</b>: los puntos son solo por el valor de los productos.</span></div>
      <p style="font-size:1.3rem;font-weight:700;margin-bottom:12px" id="bf_pts" aria-live="polite">Suma 0 puntos</p>
      <div class="field"><label for="bf_n">Nota (opcional)</label><input id="bf_n" placeholder="Ej.: factura 1234" autocomplete="off"></div>
      <p class="fine">Estos puntos vencen a los ${D.settings.points_valid_months} meses.</p>
      ${errBox('bf_e')}
      <div class="modal-actions"><button class="btn btn-ghost" type="button" data-close>Cancelar</button><button class="btn btn-primary" type="submit">Sumar puntos</button></div>
    </form>`);
  const amount = () => parseInt($('#bf_a').value.replace(/\D/g, ''), 10) || 0;
  $('#bf_a').addEventListener('input', () => { const p = Math.floor(amount() / per); $('#bf_pts').textContent = `Suma ${num(p)} ${p === 1 ? 'punto' : 'puntos'}`; });
  $('#buyForm').addEventListener('submit', (e) => {
    e.preventDefault();
    run(() => call(`clients/${c.phone}/moves`, { method: 'POST', body: { type: 'compra', amount: amount(), note: $('#bf_n').value } }),
      `+${num(Math.floor(amount() / per))} puntos para ${c.name.split(' ')[0]} ✅`, $('#bf_e'));
  });
}

function redeemForm(c) {
  const rewards = D.settings.rewards, today = bogotaDay(new Date().toISOString());
  const doneToday = D.moves.some((m) => m.phone === c.phone && m.type === 'canje' && bogotaDay(m.date) === today);
  const first = rewards.findIndex((r) => c.balance >= r.pts);
  openModal(`
    <h2>Canjear premio</h2>
    <p style="margin-bottom:10px"><b>${esc(c.name)}</b> · tiene <b>${num(c.balance)} puntos</b></p>
    <div class="policy-note">Un solo premio, en <b>un solo producto</b>, y <b>no se combina con otra promoción</b>. Máximo un canje por día.${doneToday ? '<br><b style="color:#a3123a">Este cliente ya canjeó hoy.</b>' : ''}</div>
    <form id="redeemForm" novalidate>
      <div class="rw-list">
        ${rewards.map((r, i) => `<label class="rw ${c.balance < r.pts ? 'off' : ''}"><input type="radio" name="rw" value="${esc(r.id)}" ${c.balance < r.pts ? 'disabled' : ''} ${i === first ? 'checked' : ''}>${esc(r.name)}<span class="pts">${num(r.pts)} puntos${c.balance < r.pts ? ` · faltan ${num(r.pts - c.balance)}` : ''}</span></label>`).join('')}
      </div>
      <div class="field"><label for="rd_p">¿En qué producto se aplica?</label><input id="rd_p" list="prodList" placeholder="Ej.: Copa Frutos Rojos" autocomplete="off">
        <datalist id="prodList">${D.products.map((p) => `<option value="${esc(p.name)}">`).join('')}</datalist></div>
      <label class="switch" style="margin-bottom:14px"><input type="checkbox" id="rd_np"><i></i><span>Confirmo: un solo producto y sin otra promoción</span></label>
      ${errBox('rd_e')}
      <div class="modal-actions"><button class="btn btn-ghost" type="button" data-close>Cancelar</button><button class="btn btn-primary" type="submit" ${first < 0 || doneToday ? 'disabled' : ''}>Canjear</button></div>
    </form>`);
  $('#redeemForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const sel = $('input[name="rw"]:checked');
    if (!sel) return;
    run(() => call(`clients/${c.phone}/moves`, { method: 'POST', body: { type: 'canje', reward: sel.value, product: $('#rd_p').value, noPromo: $('#rd_np').checked } }), 'Canje registrado 🎁', $('#rd_e'));
  });
}

function adjustForm(c) {
  openModal(`
    <h2>Ajustar puntos</h2>
    <p style="margin-bottom:14px"><b>${esc(c.name)}</b> · tiene ${num(c.balance)} puntos<br><small>Úsalo solo para corregir un error. Queda registrado en el historial.</small></p>
    <form id="adjForm" novalidate>
      <div class="field"><label for="af_p">Puntos (usa − para restar)</label><input id="af_p" inputmode="numeric" placeholder="Ej.: 10 o -10" autocomplete="off"></div>
      <div class="field"><label for="af_n">Motivo</label><input id="af_n" placeholder="Ej.: compra mal digitada" autocomplete="off"></div>
      ${errBox('af_e')}
      <div class="modal-actions"><button class="btn btn-ghost" type="button" data-close>Cancelar</button><button class="btn btn-primary" type="submit">Aplicar</button></div>
    </form>`);
  $('#adjForm').addEventListener('submit', (e) => {
    e.preventDefault();
    run(() => call(`clients/${c.phone}/moves`, { method: 'POST', body: { type: 'ajuste', points: $('#af_p').value, note: $('#af_n').value } }), 'Ajuste registrado ✅', $('#af_e'));
  });
}

function viewClient(c) {
  const lv = D.settings.levels, next = lv[c.level + 1], mv = D.moves.filter((m) => m.phone === c.phone);
  const pct = next ? Math.min(100, Math.round(((c.lifetime - lv[c.level].min) / (next.min - lv[c.level].min)) * 100)) : 100;
  openModal(`
    <h2>${esc(c.name)}</h2>
    <p>${showPhone(c.phone)} · 🎂 ${fmtBirth(c.birth)} (${age(c.birth)} años)<br><small>En el Club desde ${fmtDate(c.created_at)}</small></p>
    <p style="margin:14px 0 4px"><span class="pts-badge">${num(c.balance)} puntos</span> <span class="lvl lvl-${Math.min(c.level, 2)}">${esc(lv[c.level].name)}</span></p>
    <div class="bar" aria-hidden="true"><i style="width:${pct}%"></i></div>
    <small>${next ? `Le faltan ${num(next.min - c.lifetime)} puntos acumulados para nivel ${esc(next.name)}` : 'Nivel máximo alcanzado'}
      ${c.nextExpiry ? ` · Vencen ${num(c.nextExpiry.pts)} puntos el ${fmtDate(c.nextExpiry.date)}` : ''}${c.expired ? ` · Ya vencieron ${num(c.expired)}` : ''}</small>
    <h3 style="margin:18px 0 6px;font-size:1.2rem">Historial</h3>
    ${mv.length ? `<div style="max-height:260px;overflow:auto"><table class="hist"><thead><tr><th>Fecha</th><th>Movimiento</th><th>Puntos</th></tr></thead><tbody>
      ${mv.map((m) => `<tr><td>${fmtDate(m.date)}</td><td>${MOVE_LABEL[m.type] || m.type}${m.amount ? ` · ${money(m.amount)}` : ''}${m.note ? `<br><small>${esc(m.note)}</small>` : ''}${m.points > 0 && m.expires_at ? `<br><small>vence ${fmtDate(m.expires_at)}</small>` : ''}</td><td class="${m.points >= 0 ? 'plus' : 'minus'}">${m.points > 0 ? '+' : ''}${num(m.points)}</td></tr>`).join('')}
    </tbody></table></div>` : '<p class="fine">Aún no tiene movimientos.</p>'}
    <div class="modal-actions" style="margin-top:16px">
      <button class="btn btn-ghost btn-sm" type="button" data-act2="adjust">Ajustar puntos</button>
      <button class="btn btn-ghost btn-sm" type="button" data-act2="edit">Editar datos</button>
      <button class="btn btn-primary btn-sm" type="button" data-close>Cerrar</button>
    </div>`);
  $('[data-act2="adjust"]', modalEl).addEventListener('click', () => adjustForm(c));
  $('[data-act2="edit"]', modalEl).addEventListener('click', () => clientForm(c));
}

function exportCSV() {
  const cell = (v) => { v = String(v ?? ''); return /[;"\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
  const rows = [['Celular', 'Nombre', 'Cumpleaños', 'Puntos disponibles', 'Puntos acumulados', 'Puntos vencidos', 'Nivel', 'Última visita']];
  D.clients.forEach((c) => rows.push([c.phone, c.name, c.birth, c.balance, c.lifetime, c.expired, D.settings.levels[c.level].name, ymd(new Date(c.last || c.created_at))]));
  // BOM + «;» para que Excel en español abra las columnas directamente
  download(`grosmania_club_${ymd(new Date())}.csv`, '﻿' + rows.map((r) => r.map(cell).join(';')).join('\r\n'), 'text/csv;charset=utf-8');
  toast(`Descargados ${D.clients.length} clientes`);
}

/* ---------- PRODUCTOS ---------- */

function tabProductos() {
  const cats = [...new Set(D.products.map((p) => p.cat))];
  return `<section class="adm-panel">
    <h2>Productos y precios (${D.products.length})</h2>
    <div class="toolbar"><button class="btn btn-primary" type="button" data-act="prod-new">＋ Nuevo producto</button>
      <span class="fine" style="margin:0">Cambia el precio directamente y se guarda al salir de la casilla. «Disponible» muestra u oculta el producto en la carta.</span></div>
    ${cats.map((cat) => `<h3 style="margin:18px 0 4px;color:var(--teal)">${esc(cat)}</h3>` + D.products.filter((p) => p.cat === cat).map((p) => `
      <div class="prod-row ${p.active ? '' : 'inactive'}">
        ${p.img ? `<img class="thumb" src="${esc(p.img)}" alt="" style="object-position:${esc(p.pos)}">` : '<div class="thumb none">🍨</div>'}
        <div><b>${esc(p.name)}</b><small>${esc(p.desc)}</small></div>
        <div class="cat"><small>${[p.flavors ? `${p.flavors} ${p.flavors === 1 ? 'sabor' : 'sabores'} de helado` : '', ...p.groups.map((g) => `${g.count} ${g.name.toLowerCase()}`)].filter(Boolean).join(' · ') || 'Sin opciones a elegir'}</small></div>
        <div class="pricecell"><input class="price-in" type="text" inputmode="numeric" value="${p.price}" data-price="${esc(p.id)}" aria-label="Precio de ${esc(p.name)}"></div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <label class="switch"><input type="checkbox" data-prod-active="${esc(p.id)}" ${p.active ? 'checked' : ''}><i></i><span class="sr-only">Disponible</span></label>
          <button class="btn btn-ghost btn-sm" type="button" data-act="prod-edit" data-id="${esc(p.id)}">Editar</button>
        </div>
      </div>`).join('')).join('')}
  </section>`;
}

function productForm(p) {
  const edit = !!p, cats = [...new Set(D.products.map((x) => x.cat))];
  openModal(`
    <h2>${edit ? 'Editar producto' : 'Nuevo producto'}</h2>
    <form id="prodForm" novalidate>
      <div class="field"><label for="pf_n">Nombre</label><input id="pf_n" value="${esc(p ? p.name : '')}" maxlength="80"></div>
      <div class="two">
        <div class="field"><label for="pf_c">Categoría</label><input id="pf_c" list="catList" value="${esc(p ? p.cat : '')}" maxlength="40"><datalist id="catList">${cats.map((c) => `<option value="${esc(c)}">`).join('')}</datalist></div>
        <div class="field"><label for="pf_p">Precio (pesos)</label><input id="pf_p" inputmode="numeric" value="${p ? p.price : ''}"></div>
      </div>
      <div class="field"><label for="pf_d">Descripción</label><textarea id="pf_d" rows="3" maxlength="300">${esc(p ? p.desc : '')}</textarea></div>
      <div class="two">
        <div class="field"><label for="pf_f">Sabores de helado a elegir</label>
          <select id="pf_f">${[0, 1, 2, 3, 4, 5].map((n) => `<option value="${n}" ${p && p.flavors === n ? 'selected' : ''}>${n === 0 ? 'Ninguno' : n}</option>`).join('')}</select></div>
        <div class="field"><label for="pf_i">Foto</label>
          <select id="pf_i"><option value="">Sin foto</option>${D.photos.map((f) => `<option value="${esc(f)}" ${p && p.img === f ? 'selected' : ''}>${esc(f.replace('fotos/', '').replace('.jpg', ''))}</option>`).join('')}</select></div>
      </div>
      <div class="field"><label for="pf_g">Otras opciones que elige el cliente (opcional)</label>
        <textarea id="pf_g" rows="4" placeholder="Salsa | 1 | Chocolate, Arequipe, Mora">${esc(p ? p.groups.map((g) => `${g.name} | ${g.count} | ${g.choices.join(', ')}`).join('\n') : '')}</textarea>
        <span class="hint">Una línea por grupo: <b>Nombre | cuántas | opción1, opción2, …</b>. Ej.: «Fruta | 2 | Fresa, Mango, Piña».</span></div>
      <p class="fine">Para usar una foto nueva, súbela a la carpeta <code>fotos/</code> del proyecto y pídele a quien administra la página que la agregue a la lista.</p>
      <label class="switch" style="margin-bottom:14px"><input type="checkbox" id="pf_a" ${!p || p.active ? 'checked' : ''}><i></i><span>Disponible en la carta</span></label>
      ${errBox('pf_e')}
      <div class="modal-actions">
        ${edit ? '<button class="btn btn-danger btn-sm" type="button" id="pf_del" style="margin-right:auto">Eliminar</button>' : ''}
        <button class="btn btn-ghost" type="button" data-close>Cancelar</button><button class="btn btn-primary" type="submit">Guardar</button>
      </div>
    </form>`);
  $('#prodForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const groups = $('#pf_g').value.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
      const [name, count, list] = l.split('|').map((x) => (x || '').trim());
      return { name, count: Number(count), choices: (list || '').split(',').map((c) => c.trim()).filter(Boolean) };
    });
    const body = { name: $('#pf_n').value, cat: $('#pf_c').value, price: $('#pf_p').value, desc: $('#pf_d').value, flavors: Number($('#pf_f').value), img: $('#pf_i').value, active: $('#pf_a').checked, groups };
    if (!edit) body.pos = 'center';
    run(() => (edit ? call(`products/${p.id}`, { method: 'PUT', body }) : call('products', { method: 'POST', body })), 'Producto guardado ✅', $('#pf_e'));
  });
  const del = $('#pf_del');
  if (del) del.addEventListener('click', () => { if (confirm(`¿Eliminar «${p.name}» de la carta? Si solo quieres ocultarlo, desmarca «Disponible».`)) run(() => call(`products/${p.id}`, { method: 'DELETE' }), 'Producto eliminado'); });
}

/* ---------- SABORES ---------- */

function tabSabores() {
  return `<section class="adm-panel"><h2>Sabores de helado (${D.flavors.length})</h2>
    <p class="fine">Son los sabores que el cliente puede elegir. <b>Toca la ficha de un sabor para marcarlo como agotado</b> y vuelve a tocarla cuando haya.</p>
    <form class="add-row" id="flavorAdd"><input id="fl_new" placeholder="Nuevo sabor, ej.: Lulo" maxlength="40" aria-label="Nuevo sabor"><button class="btn btn-primary" type="submit">＋ Agregar sabor</button></form>
    <div class="flavor-grid">${D.flavors.map((f) => `<div class="flavor-tile ${f.active ? '' : 'inactive'}">
      <label class="switch big"><input type="checkbox" data-flavor-active="${esc(f.id)}" ${f.active ? 'checked' : ''}><i></i><span><b>${esc(f.name)}</b><small>${f.active ? 'Disponible' : 'Agotado'}</small></span></label>
      <div class="tile-acts"><button class="btn btn-ghost btn-sm" type="button" data-act="flavor-rename" data-id="${esc(f.id)}">Renombrar</button>
        <button class="btn btn-danger btn-sm" type="button" data-act="flavor-del" data-id="${esc(f.id)}">Eliminar</button></div></div>`).join('') || '<p class="empty">Aún no hay sabores.</p>'}</div>
  </section>`;
}

/* ---------- COMENTARIOS ---------- */

function tabComentarios() {
  const list = D.comments.filter((c) => commentFilter === 'todos' || c.status === commentFilter);
  const pub = D.comments.filter((c) => c.status === 'publicado'), avg = pub.length ? (pub.reduce((a, c) => a + c.rating, 0) / pub.length) : 0;
  const pill = { pendiente: 'wait', publicado: 'on', oculto: 'off' };
  return `<section class="adm-panel"><h2>Comentarios de los clientes</h2>
    <p class="fine">${pub.length ? `Calificación de los publicados: <b>${avg.toFixed(1).replace('.', ',')} / 5</b> (${pub.length}). ` : ''}Los comentarios nuevos llegan como <b>pendientes</b> y solo se ven en la página cuando los publicas.</p>
    <div class="toolbar"><label for="cmFilter" style="font-weight:700">Mostrar:</label>
      <select id="cmFilter" style="min-height:48px;border-radius:12px;border:2px solid #9fc3be;padding:6px 12px">
        ${[['pendiente', 'Pendientes'], ['publicado', 'Publicados'], ['oculto', 'Ocultos'], ['todos', 'Todos']].map(([v, l]) => `<option value="${v}" ${commentFilter === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    ${list.map((c) => `<div class="cm"><div class="meta"><span><span class="stars" aria-label="${c.rating} de 5">${stars(c.rating)}</span> <b style="color:var(--ink)">${esc(c.name)}</b></span><span><span class="pill ${pill[c.status]}">${c.status}</span> ${fmtDate(c.created_at)}</span></div>
      <p>${esc(c.text)}</p>
      <div class="acts">${c.status !== 'publicado' ? `<button class="btn btn-primary btn-sm" type="button" data-act="cm-publicado" data-id="${esc(c.id)}">Publicar</button>` : ''}
        ${c.status !== 'oculto' ? `<button class="btn btn-ghost btn-sm" type="button" data-act="cm-oculto" data-id="${esc(c.id)}">Ocultar</button>` : ''}
        <button class="btn btn-danger btn-sm" type="button" data-act="cm-del" data-id="${esc(c.id)}">Eliminar</button></div></div>`).join('') || '<p class="empty">No hay comentarios en esta lista.</p>'}
  </section>`;
}

/* ---------- AJUSTES ---------- */

function tabAjustes() {
  const s = D.settings;
  const edRows = (items, kind, vKey, vLabel) => items.map((it) => `<div class="ed-row" data-ed="${kind}"><input class="ed-name" value="${esc(it.name)}" aria-label="Nombre" maxlength="60"><input class="ed-val" inputmode="numeric" value="${it[vKey]}" aria-label="${vLabel}"><button class="btn btn-danger btn-sm" type="button" data-act="ed-del" aria-label="Quitar">✕</button></div>`).join('');
  return `<div class="set-grid">
    <form class="adm-panel" data-save="horario" novalidate><h2>Horario del local</h2>
      <div class="two"><div class="field"><label for="st_o">Abre</label><input id="st_o" type="time" value="${s.open_time}"></div>
        <div class="field"><label for="st_c">Cierra</label><input id="st_c" type="time" value="${s.close_time}"></div></div>
      <div class="days" role="group" aria-label="Días de atención">${DAYS.map((d, i) => `<label><input type="checkbox" name="st_d" value="${i}" ${s.open_days.includes(i) ? 'checked' : ''}>${d}</label>`).join('')}</div>
      <div class="field"><label for="st_m">Mensaje cuando esté cerrado (opcional)</label><input id="st_m" value="${esc(s.closed_message)}" maxlength="200" placeholder="Ej.: Hoy cerramos temprano"></div>
      <p class="fine">Fuera de este horario la página muestra el banner «Estamos cerrados». También puedes cerrar o abrir a mano con el botón de arriba.</p>
      ${errBox('e_horario')}<button class="btn btn-primary" type="submit">Guardar horario</button></form>

    <form class="adm-panel" data-save="domicilio" novalidate><h2>Domicilios y pagos</h2>
      <label class="switch" style="margin-bottom:14px"><input type="checkbox" id="dm_on" ${s.delivery_enabled ? 'checked' : ''}><i></i><span>Domicilios activos</span></label>
      <div class="field"><span style="font-weight:700">Valor del domicilio por tramos (metros por calle)</span>
        <div id="tierRows">${(s.delivery_tiers || []).map((t, i, a) => `<div class="tier-row" data-ed="tier"><span style="white-space:nowrap">${i ? `de ${num(a[i - 1].upTo + 1)} hasta` : 'Hasta'}</span><input class="ed-name" inputmode="numeric" value="${t.upTo}" aria-label="Hasta cuántos metros"><span>m →</span><input class="ed-val" inputmode="numeric" value="${t.fee}" aria-label="Valor del tramo"></div>`).join('')}</div>
        <button class="btn btn-ghost btn-sm" type="button" data-act="tier-add" style="align-self:flex-start">＋ Tramo</button>
        <span class="hint">Ej.: «Hasta 200 m → 3.000» significa que de 0 a 200 metros el domicilio vale $3.000. Para quitar un tramo deja la distancia en blanco.</span></div>
      <div class="field"><label for="dm_pm">Valor por metro después del último tramo (pesos)</label><input id="dm_pm" inputmode="decimal" value="${s.delivery_per_meter}">
        <span class="hint">Pasado el último tramo se cobra el valor de ese tramo más este valor por cada metro que pase (redondeado a $100). Ej.: ${(() => { const l = (s.delivery_tiers || []).slice(-1)[0] || { upTo: 0, fee: 0 }; return `a ${num(l.upTo + 600)} m = ${money(l.fee + Math.ceil((600 * s.delivery_per_meter) / 100) * 100)}`; })()}. Pon 0 para no calcular por metros.</span></div>
      <div class="field"><label for="dm_max">Distancia máxima del domicilio (metros por calle)</label><input id="dm_max" inputmode="numeric" value="${s.delivery_max_meters}"><span class="hint">Si el cliente marca una ubicación más lejos que esto, la página le avisa que está fuera de cobertura (puede pedir igual, con envío por aplicación). Pon 0 para no limitar por distancia. Ej.: ${num(s.delivery_max_meters)} m = ${money(s.delivery_max_meters * s.delivery_per_meter)} de domicilio como máximo.</span></div>
      <div class="field"><label for="dm_min">Pedido mínimo para domicilio (pesos, solo productos)</label><input id="dm_min" inputmode="numeric" value="${s.delivery_min_order}"><span class="hint">Con un pedido menor a ${money(s.delivery_min_order)} la página no deja enviar el pedido a domicilio (sí para recoger). Pon 0 para no exigir mínimo.</span></div>
      <div class="field"><span style="font-weight:700">Ubicación del local (desde aquí se miden los metros)</span>
        <div class="two"><div class="field"><label for="dm_lat">Latitud</label><input id="dm_lat" inputmode="decimal" value="${s.store_lat}"></div>
          <div class="field"><label for="dm_lng">Longitud</label><input id="dm_lng" inputmode="decimal" value="${s.store_lng}"></div></div>
        <button class="btn btn-ghost btn-sm" type="button" data-act="store-here" style="align-self:flex-start">Usar mi ubicación actual</button>
        <span class="hint">Si estás en el local, toca el botón. O pega las coordenadas de Google Maps (clic derecho en el punto del local). <a id="dm_map" href="https://www.google.com/maps?q=${s.store_lat},${s.store_lng}" target="_blank" rel="noopener">Ver este punto en el mapa</a></span></div>
      <div class="field"><label for="dm_zones">Barrios con domicilio (uno por línea)</label><textarea id="dm_zones" rows="8" maxlength="2500">${esc((s.delivery_zones || []).join('\n'))}</textarea>
        <span class="hint">El cliente elige su barrio de esta lista al pedir domicilio. Si la dejas vacía, no se pide barrio.</span></div>
      <div class="field"><label for="dm_note">Nota interna de cobertura (la ve solo quien administra)</label><textarea id="dm_note" rows="3" maxlength="300">${esc(s.delivery_note || '')}</textarea>
        <span class="hint">Se muestra bajo la lista de barrios, p. ej. hasta dónde llegan hacia arriba.</span></div>
      <div class="field"><label for="dm_far">Aviso cuando queda fuera de cobertura</label><textarea id="dm_far" rows="3" maxlength="300">${esc(s.delivery_far_note || '')}</textarea>
        <span class="hint">Lo ve el cliente cuando su ubicación pasa de ${num(s.delivery_max_meters)} m o elige «Mi barrio no está en la lista». Puede pedir igual: el pedido llega por WhatsApp marcado «FUERA DE COBERTURA» y tú coordinas el envío por una aplicación de domicilios.</span></div>
      <div class="field"><label for="dm_tr">Datos para pagar por transferencia</label><textarea id="dm_tr" rows="2" maxlength="300" placeholder="Ej.: Nequi 300 123 4567 a nombre de…">${esc(s.transfer_info)}</textarea>
        <span class="hint">Si lo dejas vacío, la página dice que los datos se envían por WhatsApp.</span></div>
      ${errBox('e_domicilio')}<button class="btn btn-primary" type="submit">Guardar</button></form>

    <form class="adm-panel" data-save="club" novalidate><h2>Club de puntos</h2>
      <div class="two"><div class="field"><label for="cl_per">Pesos por cada punto</label><input id="cl_per" inputmode="numeric" value="${s.points_per}"></div>
        <div class="field"><label for="cl_mo">Vigencia (meses)</label><input id="cl_mo" inputmode="numeric" value="${s.points_valid_months}"></div></div>
      <div class="field"><label for="cl_gift">Regalo de cumpleaños</label><input id="cl_gift" value="${esc(s.birthday_gift)}" maxlength="200"></div>
      <div class="field"><span style="font-weight:700">Premios (nombre y puntos)</span><div id="rewardRows">${edRows(s.rewards, 'reward', 'pts', 'Puntos')}</div>
        <button class="btn btn-ghost btn-sm" type="button" data-act="ed-add" data-kind="reward" style="align-self:flex-start">＋ Premio</button></div>
      <div class="field"><span style="font-weight:700">Niveles (nombre y puntos acumulados desde)</span><div id="levelRows">${edRows(s.levels, 'level', 'min', 'Puntos desde')}</div>
        <button class="btn btn-ghost btn-sm" type="button" data-act="ed-add" data-kind="level" style="align-self:flex-start">＋ Nivel</button></div>
      <p class="fine">Los cambios de vigencia aplican a las compras nuevas; los puntos ya ganados conservan su fecha de vencimiento.</p>
      ${errBox('e_club')}<button class="btn btn-primary" type="submit">Guardar Club</button></form>

    <form class="adm-panel" data-save="metas" novalidate><h2>Metas del mes</h2>
      <div class="field"><label for="mt_s">Ventas de productos (pesos)</label><input id="mt_s" inputmode="numeric" value="${s.goal_monthly_sales}"></div>
      <div class="field"><label for="mt_m">Clientes nuevos en el Club</label><input id="mt_m" inputmode="numeric" value="${s.goal_monthly_members}"></div>
      <div class="field"><label for="mt_r">Puntos canjeados</label><input id="mt_r" inputmode="numeric" value="${s.goal_monthly_redeemed}"></div>
      <p class="fine">Pon 0 para no tener meta. El avance se ve en «Resumen».</p>
      ${errBox('e_metas')}<button class="btn btn-primary" type="submit">Guardar metas</button></form>
  </div>`;
}

function readRows(kind, vKey) {
  return $$(`[data-ed="${kind}"]`).map((r) => ({ name: $('.ed-name', r).value, [vKey]: $('.ed-val', r).value })).filter((x) => x.name.trim());
}
function saveSettings(which, form) {
  const err = $(`#e_${which}`, form);
  const num0 = (id) => $(id, form).value;
  const bodies = {
    horario: () => ({ open_time: $('#st_o', form).value, close_time: $('#st_c', form).value, open_days: $$('input[name="st_d"]:checked', form).map((i) => Number(i.value)), closed_message: $('#st_m', form).value }),
    domicilio: () => ({ delivery_enabled: $('#dm_on', form).checked, delivery_tiers: $$('[data-ed="tier"]', form).map((r) => ({ upTo: $('.ed-name', r).value, fee: $('.ed-val', r).value })).filter((t) => String(t.upTo).trim()),delivery_max_meters: num0('#dm_max'), delivery_min_order: num0('#dm_min'), delivery_per_meter: num0('#dm_pm'), store_lat: num0('#dm_lat'), store_lng: num0('#dm_lng'), delivery_zones: num0('#dm_zones').split('\n'), delivery_note: num0('#dm_note'), delivery_far_note: num0('#dm_far'), transfer_info: $('#dm_tr', form).value }),
    club: () => ({ points_per: num0('#cl_per'), points_valid_months: num0('#cl_mo'), birthday_gift: num0('#cl_gift'), rewards: readRows('reward', 'pts'), levels: readRows('level', 'min') }),
    metas: () => ({ goal_monthly_sales: num0('#mt_s'), goal_monthly_members: num0('#mt_m'), goal_monthly_redeemed: num0('#mt_r') })
  };
  err.hidden = true;
  run(() => call('settings', { method: 'PUT', body: bodies[which]() }), 'Cambios guardados ✅', err);
}

/* ---------- eventos ---------- */

function setup() {
  const root = $('#adminRoot');

  root.addEventListener('submit', async (e) => {
    if (e.target.id === 'loginForm') {
      e.preventDefault();
      const btn = $('#loginBtn'); btn.disabled = true;
      try {
        const r = await api('admin/login', { method: 'POST', body: { user: $('#lu').value.trim(), password: $('#lp').value } });
        setToken(r.token); await refresh();
      } catch (err) { const el = $('#loginErr'); if (el) { el.textContent = err.message; el.hidden = false; btn.disabled = false; } }
    } else if (e.target.id === 'flavorAdd') {
      e.preventDefault();
      const name = $('#fl_new').value;
      run(() => call('flavors', { method: 'POST', body: { name } }), 'Sabor agregado 🍨');
    } else if (e.target.dataset.save) {
      e.preventDefault();
      saveSettings(e.target.dataset.save, e.target);
    }
  });

  root.addEventListener('input', (e) => {
    if (e.target.id !== 'admSearch') return;
    search = e.target.value;
    $('#clientList').innerHTML = clientRows();           // solo la lista, para no perder el cursor
  });

  root.addEventListener('change', (e) => {
    const t = e.target;
    if (t.id === 'cmFilter') { commentFilter = t.value; $('#tabBody').innerHTML = tabBody(); }
    else if (t.dataset.price) run(() => call(`products/${t.dataset.price}`, { method: 'PUT', body: { price: t.value } }), 'Precio guardado ✅').then((ok) => { if (!ok) refresh(); });
    else if (t.dataset.prodActive) run(() => call(`products/${t.dataset.prodActive}`, { method: 'PUT', body: { active: t.checked } }), t.checked ? 'Producto disponible' : 'Producto oculto de la carta');
    else if (t.dataset.flavorActive) run(() => call(`flavors/${t.dataset.flavorActive}`, { method: 'PUT', body: { active: t.checked } }), t.checked ? 'Sabor disponible' : 'Sabor marcado como agotado');
  });

  root.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('[data-tab]');
    if (tabBtn) { tab = tabBtn.dataset.tab; try { sessionStorage.setItem('gm.admin.tab', tab); } catch (_) { /* nada */ } render(); window.scrollTo(0, 0); return; }
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const c = b.dataset.phone ? byPhone(b.dataset.phone) : null, id = b.dataset.id;
    const setS = (body, msg) => run(() => call('settings', { method: 'PUT', body }), msg);
    switch (b.dataset.act) {
      case 'reload': refresh().then(() => toast('Datos actualizados')).catch((err) => toast(err.message)); break;
      case 'logout': setToken(null); D = null; render(); break;
      case 'store-closed': setS({ status_override: 'closed' }, 'El local quedó como cerrado'); break;
      case 'store-open': setS({ status_override: 'open' }, 'El local quedó como abierto'); break;
      case 'store-auto': setS({ status_override: 'auto' }, 'Se usa el horario automático'); break;
      case 'delivery-toggle':
        setS({ delivery_enabled: !D.settings.delivery_enabled }, D.settings.delivery_enabled ? 'Domicilios desactivados' : 'Domicilios activados');
        break;
      case 'store-here':
        if (!navigator.geolocation) { toast('Este navegador no permite obtener la ubicación.'); break; }
        navigator.geolocation.getCurrentPosition((pos) => {
          $('#dm_lat').value = pos.coords.latitude.toFixed(7); $('#dm_lng').value = pos.coords.longitude.toFixed(7);
          $('#dm_map').href = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
          toast('Ubicación puesta. Toca «Guardar» para confirmar.');
        }, () => toast('No se pudo obtener la ubicación. Pega las coordenadas a mano.'), { enableHighAccuracy: true, timeout: 15000 });
        break;
      case 'new': clientForm(null); break;
      case 'buy': c && purchaseForm(c); break;
      case 'redeem': c && redeemForm(c); break;
      case 'view': c && viewClient(c); break;
      case 'gift':
        if (c && confirm(`¿Entregar el regalo de cumpleaños a ${c.name}?`)) run(() => call(`clients/${c.phone}/moves`, { method: 'POST', body: { type: 'cumple' } }), 'Regalo registrado 🎁');
        break;
      case 'csv': exportCSV(); break;
      case 'prod-new': productForm(null); break;
      case 'prod-edit': productForm(D.products.find((p) => p.id === id)); break;
      case 'flavor-rename': {
        const f = D.flavors.find((x) => x.id === id), name = prompt('Nuevo nombre del sabor:', f.name);
        if (name && name.trim() !== f.name) run(() => call(`flavors/${id}`, { method: 'PUT', body: { name } }), 'Sabor renombrado');
        break;
      }
      case 'flavor-del':
        if (confirm('¿Eliminar este sabor? Si solo se acabó, mejor apágalo con el interruptor.')) run(() => call(`flavors/${id}`, { method: 'DELETE' }), 'Sabor eliminado');
        break;
      case 'cm-publicado': case 'cm-oculto':
        run(() => call(`comments/${id}`, { method: 'PUT', body: { status: b.dataset.act.slice(3) } }), b.dataset.act === 'cm-publicado' ? 'Comentario publicado 💚' : 'Comentario oculto');
        break;
      case 'cm-del':
        if (confirm('¿Eliminar este comentario para siempre?')) run(() => call(`comments/${id}`, { method: 'DELETE' }), 'Comentario eliminado');
        break;
      case 'ed-add': {
        const kind = b.dataset.kind, holder = $(kind === 'reward' ? '#rewardRows' : '#levelRows');
        holder.insertAdjacentHTML('beforeend', `<div class="ed-row" data-ed="${kind}"><input class="ed-name" aria-label="Nombre" maxlength="60"><input class="ed-val" inputmode="numeric" aria-label="Puntos"><button class="btn btn-danger btn-sm" type="button" data-act="ed-del" aria-label="Quitar">✕</button></div>`);
        $('.ed-name', holder.lastElementChild).focus();
        break;
      }
      case 'tier-add':
        $('#tierRows').insertAdjacentHTML('beforeend', '<div class="tier-row" data-ed="tier"><span>Hasta</span><input class="ed-name" inputmode="numeric" aria-label="Hasta cuántos metros"><span>m →</span><input class="ed-val" inputmode="numeric" aria-label="Valor del tramo"></div>');
        $('.ed-name', $('#tierRows').lastElementChild).focus();
        break;
      case 'ed-del': b.closest('.ed-row').remove(); break;
    }
  });

  /* La tablet se queda abierta todo el día: cada minuto, si nadie está escribiendo ni hay una ventana abierta, se traen los datos nuevos
     (comentarios pendientes, puntos) y se actualiza la barra de estado (abierto/cerrado por horario). */
  setInterval(() => {
    if (!D || !token || modalEl || document.hidden || tab === 'ajustes') return;
    const ae = document.activeElement;
    if (ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) { const sb = $('.statusbar'); if (sb) sb.outerHTML = statusBar(D.settings); return; }
    refresh().catch(() => { /* sin red: se reintenta en un minuto */ });
  }, 60000);
}

setup();
if (token) refresh().catch(() => { setToken(null); render(); }); else render();
