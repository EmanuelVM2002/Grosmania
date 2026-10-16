/* Cuentas de puntos. Funciones puras (sin base de datos): reciben los movimientos de un cliente.
   Regla: los puntos de cada compra vencen en `expires_at`; los canjes gastan primero los puntos más viejos. */

const BOGOTA_OFFSET = -5 * 3600e3;   // Colombia no tiene horario de verano

export const bogotaDay = (iso) => new Date(new Date(iso).getTime() + BOGOTA_OFFSET).toISOString().slice(0, 10);
export const bogotaMonth = (iso) => bogotaDay(iso).slice(0, 7);

export function addMonths(iso, n) {
  const d = new Date(iso);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString();
}

export function computeLedger(moves, nowIso) {
  const sorted = [...moves].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  let lots = [], expired = 0, lifetime = 0, last = null;
  const dropExpired = (t) => {
    lots = lots.filter((l) => { if (l.exp && l.exp <= t) { expired += l.pts; return false; } return true; });
  };
  for (const m of sorted) {
    const pts = Number(m.points) || 0;
    dropExpired(m.date);
    if (pts > 0) { lots.push({ pts, exp: m.expires_at || null }); lifetime += pts; }
    else if (pts < 0) {
      let need = -pts;
      for (const l of lots) { if (!need) break; const take = Math.min(l.pts, need); l.pts -= take; need -= take; }
      lots = lots.filter((l) => l.pts > 0);
    }
    last = m.date;
  }
  dropExpired(nowIso);
  const balance = lots.reduce((a, l) => a + l.pts, 0);
  const dated = lots.filter((l) => l.exp).sort((a, b) => (a.exp < b.exp ? -1 : 1));
  const nextExpiry = dated.length
    ? { date: dated[0].exp, pts: dated.filter((l) => bogotaDay(l.exp) === bogotaDay(dated[0].exp)).reduce((a, l) => a + l.pts, 0) }
    : null;
  const in30 = new Date(new Date(nowIso).getTime() + 30 * 864e5).toISOString();
  const expiring30 = lots.filter((l) => l.exp && l.exp <= in30).reduce((a, l) => a + l.pts, 0);
  return { balance, lifetime, expired, last, nextExpiry, expiring30 };
}

export function levelIndex(levels, lifetime) {
  return levels.reduce((idx, l, i) => (lifetime >= l.min ? i : idx), 0);
}
