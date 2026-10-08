/*
  Beer Tracker client.
  Shared state comes from /api/state (D1 behind a Pages Function) and is polled
  every 2.5 s while the page is visible, so a tap on one phone shows on the
  other within a few seconds. If the D1 binding is missing the page runs in
  local-only mode on this phone and replays those taps to the server the first
  time it answers. No PIN by design. The chart at the bottom is hand-drawn SVG:
  cumulative standard drinks per person over tonight, redrawn on every render.
*/

(function () {
  const PEOPLE = ['keelan', 'rein'];
  const NAMES = { keelan: 'Keelan', rein: 'Rein' };
  const TYPES = { beer: 1, carbomb: 2, shot: 1, seltzer: 1, mixed: 1.5 };
  const LABEL = { beer: 'Beer', carbomb: 'Car bomb', shot: 'Shot', seltzer: 'Seltzer', mixed: 'Mixed drink' };
  const ICON = { beer: '🍺', carbomb: '💣', shot: '🥃', seltzer: '🥫', mixed: '🍹' };
  const POLL_MS = 2500;
  const OZ_PER_STD = 0.6;          // fl oz of pure alcohol in one standard drink
  const WIDMARK_R = 0.68;          // body water constant, male
  const BURN_PER_HR = 0.015;       // BAC % cleared per hour
  const DEFAULT_LB = 180;
  const RETRY_LOCAL_MS = 15000;

  const $ = (id) => document.getElementById(id);
  let state = null;
  let mode = 'server';          // 'server' | 'local'

  /* ---------- api ---------- */
  async function api(path, body) {
    const res = await fetch('/api' + path, {
      method: body ? 'POST' : 'GET',
      headers: { 'content-type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
    if (res.status === 503) throw Object.assign(new Error('nobinding'), { code: 'nobinding' });
    if (!res.ok) throw new Error('http ' + res.status);
    return res.json();
  }

  /* ---------- local-only fallback ---------- */
  function loadLocal() {
    try {
      const s = JSON.parse(localStorage.getItem('bt-local') || 'null');
      if (s && s.events) return s;
    } catch (e) { /* ignore */ }
    return { night: { id: 'local', startedAt: Date.now() }, events: [], history: [], weights: { keelan: DEFAULT_LB, rein: DEFAULT_LB } };
  }
  function saveLocal() {
    if (mode !== 'local' || !state) return;
    try { localStorage.setItem('bt-local', JSON.stringify({ night: state.night, events: state.events, history: state.history, weights: state.weights })); } catch (e) { /* ignore */ }
  }
  function enterLocal() {
    if (mode === 'local') return;
    mode = 'local';
    apply(loadLocal());
    setConn('local');
    banner('Shared sync is not set up yet. Counting on this phone only; taps will sync once it is.');
  }
  async function tryLeaveLocal() {
    try {
      let s = await api('/state');
      const pending = state ? state.events.filter((e) => TYPES[e.type] !== undefined) : [];
      if (pending.length) {
        s = await api('/import', { events: pending.map((e) => ({ t: e.t, who: e.who, type: e.type })) });
        toast('Synced ' + pending.length + ' local taps');
      }
      try { localStorage.removeItem('bt-local'); } catch (e) { /* ignore */ }
      mode = 'server';
      banner('');
      apply(s);
      setConn('on');
    } catch (e) { /* still no server */ }
  }

  /* ---------- polling ---------- */
  let pollTimer = null, retryTimer = null, inFlight = false;
  function setConn(status) {
    const d = $('connDot');
    d.className = 'dot ' + status;
    d.title = status === 'on' ? 'Live' : status === 'local' ? 'Local only' : status === 'off' ? 'Offline, retrying' : 'Connecting';
  }
  async function refresh() {
    if (inFlight) return;
    if (mode === 'local') return;
    inFlight = true;
    try {
      const s = await api('/state');
      if (!state || s.version !== state.version) apply(s);
      setConn('on');
    } catch (e) {
      if (e.code === 'nobinding') enterLocal();
      else setConn('off');
    } finally { inFlight = false; }
  }
  function startPolling() {
    clearInterval(pollTimer);
    pollTimer = setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, POLL_MS);
    clearInterval(retryTimer);
    retryTimer = setInterval(() => { if (mode === 'local' && document.visibilityState === 'visible') tryLeaveLocal(); }, RETRY_LOCAL_MS);
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { if (mode === 'local') tryLeaveLocal(); else refresh(); } });
  window.addEventListener('online', () => { if (mode === 'local') tryLeaveLocal(); else refresh(); });

  /* ---------- tap effect: Galaxy Gas canister spins, then bursts into flames ---------- */
  const CAN_SVG = '<svg viewBox="0 0 120 240" xmlns="http://www.w3.org/2000/svg">'
    + '<defs><linearGradient id="gal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1b0b3b"/><stop offset="0.45" stop-color="#5b2a9e"/><stop offset="0.7" stop-color="#1f6fd1"/><stop offset="1" stop-color="#0b1a3a"/></linearGradient>'
    + '<linearGradient id="shine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.35" stop-color="#fff" stop-opacity="0.35"/><stop offset="0.5" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>'
    + '<rect x="42" y="4" width="36" height="22" rx="6" fill="#c9ced6"/><rect x="36" y="22" width="48" height="16" rx="6" fill="#8e96a3"/>'
    + '<rect x="14" y="36" width="92" height="196" rx="18" fill="url(#gal)"/><rect x="14" y="36" width="92" height="196" rx="18" fill="url(#shine)"/>'
    + '<g fill="#fff"><circle cx="30" cy="60" r="1.6"/><circle cx="90" cy="80" r="1.2"/><circle cx="50" cy="110" r="1.8"/><circle cx="75" cy="150" r="1.3"/><circle cx="34" cy="190" r="1.5"/><circle cx="95" cy="205" r="1.1"/><circle cx="60" cy="70" r="1"/></g>'
    + '<ellipse cx="60" cy="130" rx="30" ry="12" fill="#ff5fa2" opacity="0.5" transform="rotate(-25 60 130)"/>'
    + '<rect x="22" y="100" width="76" height="62" rx="8" fill="#fff" opacity="0.92"/>'
    + '<text x="60" y="126" text-anchor="middle" font-family="Bebas Neue, Impact, sans-serif" font-size="26" fill="#2a1455">GALAXY</text>'
    + '<text x="60" y="152" text-anchor="middle" font-family="Bebas Neue, Impact, sans-serif" font-size="26" fill="#e23b57">GAS</text>'
    + '</svg>';
  function blast() {
    const fx = $('fx');
    if (!fx || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const can = document.createElement('div');
    can.className = 'fx-can';
    can.innerHTML = CAN_SVG;
    fx.appendChild(can);
    setTimeout(() => {
      const ring = document.createElement('div'); ring.className = 'fx-ring'; fx.appendChild(ring);
      const n = 16;
      for (let i = 0; i < n; i++) {
        const f = document.createElement('div');
        f.className = 'fx-flame';
        f.textContent = i % 3 === 0 ? '💥' : '🔥';
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
        const r = 110 + Math.random() * 120;
        f.style.setProperty('--dx', (Math.cos(a) * r).toFixed(0) + 'px');
        f.style.setProperty('--dy', (Math.sin(a) * r - 40).toFixed(0) + 'px');
        f.style.setProperty('--rot', (Math.random() * 360 - 180).toFixed(0) + 'deg');
        f.style.animationDelay = (Math.random() * 0.12).toFixed(2) + 's';
        fx.appendChild(f);
        setTimeout(() => f.remove(), 1200);
      }
      setTimeout(() => ring.remove(), 900);
      haptic([20, 40, 60]);
    }, 1000);
    setTimeout(() => can.remove(), 1600);
  }

  /* ---------- actions ---------- */
  function haptic(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* noop */ } }
  function localEvent(who, type) {
    state.events.push({ id: 'l' + Date.now() + Math.random().toString(36).slice(2, 5), t: Date.now(), who, type });
    state.totals = totalsOf(state.events);
    saveLocal(); render();
  }

  async function add(who, type) {
    haptic(12);
    blast();
    if (!state) return;
    if (mode === 'local') { localEvent(who, type); return; }
    // optimistic: show it before the server answers
    state.events.push({ id: 'tmp' + Date.now(), t: Date.now(), who, type, tmp: true });
    state.totals = totalsOf(state.events);
    render();
    try { apply(await api('/event', { who, type })); setConn('on'); }
    catch (e) {
      if (e.code === 'nobinding') { enterLocal(); localEvent(who, type); }
      else { toast('Could not save, retrying'); refresh(); }
    }
  }
  async function undo(who) {
    haptic(20);
    const last = state && [...state.events].reverse().find((e) => e.who === who);
    if (!last) { toast('Nothing to undo for ' + NAMES[who]); return; }
    if (mode === 'local') {
      state.events.splice(state.events.lastIndexOf(last), 1);
      state.totals = totalsOf(state.events); saveLocal(); render();
      toast('Removed ' + NAMES[who] + "'s " + LABEL[last.type].toLowerCase());
      return;
    }
    try { apply(await api('/undo', { who })); toast('Removed ' + NAMES[who] + "'s " + LABEL[last.type].toLowerCase()); }
    catch (e) { toast('Could not undo'); refresh(); }
  }
  function archiveLocal(record) {
    if (record && state.events.length) {
      const a = state.totals.keelan.std, b = state.totals.rein.std;
      state.history.push({ id: state.night.id, startedAt: state.night.startedAt, endedAt: Date.now(), totals: state.totals, winner: a === b ? 'tie' : a > b ? 'keelan' : 'rein' });
    }
    state.night = { id: 'local' + Date.now().toString(36), startedAt: Date.now() };
    state.events = []; state.totals = totalsOf([]);
    saveLocal(); render();
  }
  async function newNight() {
    const n = state ? state.events.length : 0;
    const msg = n ? 'Close out tonight and start a new one? Tonight gets saved to the record.' : 'Start a new night?';
    if (!confirm(msg)) return;
    if (mode === 'local') { archiveLocal(true); toast('New night'); return; }
    try { apply(await api('/night/new', {})); toast('New night'); }
    catch (e) { toast('Could not start a new night'); }
  }
  async function clearNight() {
    if (!confirm('Wipe tonight without saving it to the record?')) return;
    if (!confirm('Last chance. Wipe it?')) return;
    if (mode === 'local') { archiveLocal(false); toast('Wiped'); return; }
    try { apply(await api('/night/clear', {})); toast('Wiped'); }
    catch (e) { toast('Could not wipe'); }
  }

  document.querySelectorAll('.panel').forEach((panel) => {
    const who = panel.dataset.who;
    panel.querySelectorAll('.drink').forEach((btn) => {
      btn.addEventListener('click', () => {
        btn.classList.add('pressed');
        setTimeout(() => btn.classList.remove('pressed'), 120);
        add(who, btn.dataset.type);
      });
    });
    panel.querySelector('.undo').addEventListener('click', () => undo(who));
  });
  $('newNightBtn').addEventListener('click', newNight);
  $('weightsBtn').addEventListener('click', async () => {
    for (const who of PEOPLE) {
      const cur = state.weights[who];
      const v = prompt(NAMES[who] + "'s weight in lb (for the BAC estimate)", String(cur));
      if (v === null) continue;
      const lb = Math.round(Number(v));
      if (!(lb >= 80 && lb <= 400)) { toast('Weight must be 80 to 400 lb'); continue; }
      if (mode === 'local') { state.weights[who] = lb; saveLocal(); render(); continue; }
      try { apply(await api('/weight', { who, lb })); } catch (e) { toast('Could not save weight'); }
    }
  });
  $('clearBtn').addEventListener('click', clearNight);

  /* ---------- tabs ---------- */
  document.querySelectorAll('.tab-btn').forEach((b) => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((x) => x.classList.toggle('active', x === b));
      document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.id === 'tab-' + b.dataset.tab));
      window.scrollTo(0, 0);
    });
  });

  /* ---------- state + render ---------- */
  function totalsOf(events) {
    const out = {};
    PEOPLE.forEach((p) => { out[p] = { beer: 0, carbomb: 0, shot: 0, seltzer: 0, mixed: 0, std: 0 }; });
    events.forEach((e) => { const t = out[e.who]; if (t && e.type in TYPES) { t[e.type] += 1; t.std += TYPES[e.type]; } });
    return out;
  }
  function apply(s) {
    if (!s) return;
    state = s;
    if (!state.history) state.history = [];
    if (!state.weights) state.weights = { keelan: DEFAULT_LB, rein: DEFAULT_LB };
    state.totals = totalsOf(state.events);
    render();
  }

  const fmtTime = (t) => new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const fmtDate = (t) => new Date(t).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  const std = (n) => (Math.round(n * 10) / 10).toString();

  function pace(events, who) {
    const mine = events.filter((e) => e.who === who && TYPES[e.type] > 0);
    if (!mine.length) return 0;
    const hours = Math.max((Date.now() - mine[0].t) / 3600000, 0.5);
    return mine.reduce((a, e) => a + TYPES[e.type], 0) / hours;
  }

  const TAUNTS = {
    tied: ['Dead even.', 'Tied. Somebody do something.', 'Neck and neck.'],
    one: ['{L} by one. Barely.', '{L} up one. {T}, you are slipping.', 'One drink in it.'],
    few: ['{L} up {n}. {T}, drink.', '{L} is pulling away.', '{T} needs a round.'],
    many: ['{L} up {n}. This is getting ugly.', '{T} has given up.', '{L} is in a different weight class tonight.'],
  };
  function taunt(totals) {
    const a = totals.keelan.std, b = totals.rein.std;
    if (a === b && a === 0) return '';
    const diff = Math.abs(a - b);
    const L = a > b ? 'Keelan' : 'Rein', T = a > b ? 'Rein' : 'Keelan';
    const pool = diff === 0 ? TAUNTS.tied : diff <= 1 ? TAUNTS.one : diff <= 3 ? TAUNTS.few : TAUNTS.many;
    const pick = pool[Math.floor(diff * 2 + a + b) % pool.length];
    return pick.replace('{L}', L).replace('{T}', T).replace('{n}', std(diff));
  }

  function bump(el) { el.classList.add('bump'); setTimeout(() => el.classList.remove('bump'), 160); }

  function render() {
    if (!state) return;
    const t = state.totals;
    $('nightDate').textContent = fmtDate(state.night.startedAt) + (state.events.length ? ' · since ' + fmtTime(state.events[0].t) : '');

    PEOPLE.forEach((p) => {
      const cap = NAMES[p];
      const bigEl = $('score' + cap);
      const newBeer = String(t[p].beer);
      if (bigEl.textContent !== newBeer) { bigEl.textContent = newBeer; bump(bigEl); }
      $('std' + cap).textContent = std(t[p].std);
      $('pace' + cap).textContent = pace(state.events, p).toFixed(1);
      const panel = document.querySelector('.panel[data-who="' + p + '"]');
      Object.keys(TYPES).forEach((ty) => { panel.querySelector('[data-count="' + ty + '"]').textContent = t[p][ty]; });
      panel.querySelector('.undo').disabled = !state.events.some((e) => e.who === p);
    });

    const a = t.keelan.std, b = t.rein.std;
    $('leadLine').textContent = a === b ? 'Tied' : (a > b ? 'Keelan' : 'Rein') + ' +' + std(Math.abs(a - b));
    $('taunt').textContent = taunt(t);

    $('log').innerHTML = state.events.filter((e) => e.type in TYPES).slice().reverse().map((e) =>
      '<li class="' + e.who + '"><span class="t">' + fmtTime(e.t) + '</span><span>' + ICON[e.type] + '</span><span><span class="who">' + NAMES[e.who] + '</span> <span class="what">' + LABEL[e.type].toLowerCase() + '</span></span><span class="std">' + (TYPES[e.type] ? '+' + TYPES[e.type] : '') + '</span></li>'
    ).join('');
    $('logEmpty').hidden = state.events.length > 0;

    const wins = { keelan: 0, rein: 0, tie: 0 };
    const all = {};
    PEOPLE.forEach((p) => { all[p] = { beer: 0, carbomb: 0, shot: 0, seltzer: 0, mixed: 0, std: 0, nights: 0 }; });
    state.history.forEach((n) => {
      wins[n.winner] = (wins[n.winner] || 0) + 1;
      PEOPLE.forEach((p) => { Object.keys(TYPES).forEach((ty) => { all[p][ty] += n.totals[p][ty] || 0; }); all[p].std += n.totals[p].std || 0; if (n.totals[p].std > 0) all[p].nights += 1; });
    });
    PEOPLE.forEach((p) => { Object.keys(TYPES).forEach((ty) => { all[p][ty] += t[p][ty]; }); all[p].std += t[p].std; if (t[p].std > 0) all[p].nights += 1; });
    $('winsKeelan').textContent = wins.keelan; $('winsRein').textContent = wins.rein; $('winsTie').textContent = wins.tie;
    const rows = Object.keys(TYPES).map((ty) => '<tr><td>' + ICON[ty] + ' ' + LABEL[ty] + '</td><td>' + all.keelan[ty] + '</td><td>' + all.rein[ty] + '</td></tr>');
    rows.push('<tr><td>Nights out</td><td>' + all.keelan.nights + '</td><td>' + all.rein.nights + '</td></tr>');
    rows.push('<tr><td>Standard drinks</td><td>' + std(all.keelan.std) + '</td><td>' + std(all.rein.std) + '</td></tr>');
    $('allTimeBody').innerHTML = rows.join('');
    $('nights').innerHTML = state.history.slice().reverse().map((n) => {
      const w = n.winner === 'tie' ? 'Tie' : NAMES[n.winner];
      return '<li><div><div class="d">' + fmtDate(n.startedAt) + '</div><div class="s">Keelan ' + std(n.totals.keelan.std) + ' · Rein ' + std(n.totals.rein.std) + ' std</div></div><div class="w ' + n.winner + '">' + w + '</div></li>';
    }).join('');
    $('nightsEmpty').hidden = state.history.length > 0;
    chart();
  }

  /* ---------- estimated BAC (Widmark) ---------- */
  // BAC at time t = sum of each drink's contribution before t, minus burn-off since the first drink, floored at 0.
  function bacAt(evs, who, lb, t) {
    const mine = evs.filter((e) => e.who === who && e.t <= t);
    if (!mine.length) return 0;
    const grams = mine.reduce((a, e) => a + TYPES[e.type], 0) * OZ_PER_STD;
    const peak = (grams * 5.14) / (lb * WIDMARK_R);
    const hours = (t - mine[0].t) / 3600000;
    return Math.max(0, peak - BURN_PER_HR * hours);
  }
  function bacCurve(evs, who, lb, t0, now) {
    const mine = evs.filter((e) => e.who === who);
    if (!mine.length) return [];
    const times = new Set([now]);
    mine.forEach((e) => { times.add(e.t - 1); times.add(e.t); });
    for (let t = mine[0].t; t < now; t += 300000) times.add(t);
    return [...times].filter((t) => t >= t0).sort((a, b) => a - b).map((t) => [t, bacAt(evs, who, lb, t)]);
  }

  /* ---------- least-squares polynomial fit (Keelan: sloped lines, not steps) ---------- */
  // xs normalised to [0,1]; degree capped at 3 and at points-1. Returns f(x).
  function polyfit(xs, ys, degree) {
    const n = xs.length;
    const deg = Math.max(1, Math.min(degree, n - 1));
    const m = deg + 1;
    const A = Array.from({ length: m }, () => new Array(m + 1).fill(0));
    for (let r = 0; r < m; r++) {
      for (let c = 0; c < m; c++) { let sum = 0; for (let i = 0; i < n; i++) sum += Math.pow(xs[i], r + c); A[r][c] = sum; }
      let sy = 0; for (let i = 0; i < n; i++) sy += ys[i] * Math.pow(xs[i], r); A[r][m] = sy;
    }
    for (let i = 0; i < m; i++) {                       // gaussian elimination with pivoting
      let piv = i; for (let r = i + 1; r < m; r++) if (Math.abs(A[r][i]) > Math.abs(A[piv][i])) piv = r;
      [A[i], A[piv]] = [A[piv], A[i]];
      if (Math.abs(A[i][i]) < 1e-12) continue;
      for (let r = 0; r < m; r++) { if (r === i) continue; const f = A[r][i] / A[i][i]; for (let c = i; c <= m; c++) A[r][c] -= f * A[i][c]; }
    }
    const coef = A.map((row, i) => (Math.abs(row[i]) < 1e-12 ? 0 : row[m] / row[i]));
    return (x) => coef.reduce((acc, c, k) => acc + c * Math.pow(x, k), 0);
  }

  /* ---------- chart: cumulative standard drinks over tonight ---------- */
  function chart() {
    const svg = $('chart');
    if (!svg) return;
    const W = 600, H = 250, L = 30, R = 44, T = 16, B = 30;
    const ev = state.events.filter((e) => TYPES[e.type] > 0).slice().sort((a, b) => a.t - b.t);
    const now = Date.now();
    const t0 = Math.min(state.night.startedAt, ev.length ? ev[0].t : now) ;
    const span = Math.max(now - t0, 3600000);
    const t1 = t0 + span;
    const series = {};
    let ymax = 0;
    PEOPLE.forEach((p) => {
      let cum = 0;
      const raw = [[t0, 0]];                              // actual cumulative points
      ev.forEach((e) => { if (e.who !== p) return; cum += TYPES[e.type]; raw.push([e.t, cum]); });
      raw.push([now, cum]);
      // polynomial through the points, sampled every ~2 minutes, clamped at 0 and at the current total
      const xs = raw.map((pt) => (pt[0] - t0) / span), ys = raw.map((pt) => pt[1]);
      const f = polyfit(xs, ys, 3);
      const pts = [];
      const steps = 80;
      for (let i = 0; i <= steps; i++) {
        const t = t0 + ((now - t0) * i) / steps;
        const v = Math.max(0, Math.min(cum * 1.15 + 0.2, f((t - t0) / span)));
        pts.push([t, i === steps ? cum : v]);
      }
      series[p] = { pts, raw, cum };
      if (cum > ymax) ymax = cum;
    });
    ymax = Math.max(4, Math.ceil(ymax) + 1);
    const x = (t) => L + ((t - t0) / span) * (W - L - R);
    const y = (v) => T + (1 - v / ymax) * (H - T - B);
    const ns = 'http://www.w3.org/2000/svg';
    const el = (tag, attrs, text) => { const n = document.createElementNS(ns, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (text != null) n.textContent = text; return n; };
    svg.textContent = '';

    // y grid + labels
    const ystep = ymax <= 8 ? 1 : ymax <= 16 ? 2 : 5;
    for (let v = 0; v <= ymax; v += ystep) {
      svg.appendChild(el('line', { class: 'grid', x1: L, x2: W - R, y1: y(v), y2: y(v) }));
      svg.appendChild(el('text', { class: 'axis', x: L - 6, y: y(v) + 4, 'text-anchor': 'end' }, String(v)));
    }
    // x ticks on the clock: every 30 min up to 3 h, then hourly
    const stepMs = span <= 3 * 3600000 ? 1800000 : 3600000;
    const first = Math.ceil(t0 / stepMs) * stepMs;
    for (let t = first; t <= t1; t += stepMs) {
      svg.appendChild(el('line', { class: 'grid', x1: x(t), x2: x(t), y1: T, y2: H - B }));
      const d = new Date(t);
      const lbl = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(' ', '');
      svg.appendChild(el('text', { class: 'axis', x: x(t), y: H - B + 16, 'text-anchor': 'middle' }, lbl));
    }
    if (!ev.length) {
      svg.appendChild(el('text', { class: 'empty', x: (L + W - R) / 2, y: (T + H - B) / 2, 'text-anchor': 'middle' }, 'No drinks yet'));
    }
    // series: area, line, end dot + value. Rein drawn first so Keelan sits on top.
    ['rein', 'keelan'].forEach((p) => {
      const pts = series[p].pts;
      if (!ev.some((e) => e.who === p)) return;
      const d = pts.map((pt, i) => (i ? 'L' : 'M') + x(pt[0]).toFixed(1) + ' ' + y(pt[1]).toFixed(1)).join(' ');
      svg.appendChild(el('path', { class: 'area ' + p, d: d + ' L' + x(now).toFixed(1) + ' ' + y(0) + ' L' + x(t0).toFixed(1) + ' ' + y(0) + ' Z' }));
      svg.appendChild(el('path', { class: 'line ' + p, d }));
      series[p].raw.slice(1, -1).forEach((pt) => svg.appendChild(el('circle', { class: 'dot ' + p, cx: x(pt[0]), cy: y(pt[1]), r: 3, opacity: 0.7 })));
      const last = pts[pts.length - 1];
      svg.appendChild(el('circle', { class: 'dot ' + p, cx: x(last[0]), cy: y(last[1]), r: 5 }));
      const tx = Math.min(x(last[0]) + 8, W - R - 26);
      svg.appendChild(el('text', { class: 'end ' + p, x: tx, y: y(last[1]) - 8 }, std(last[1])));
    });
    // right axis: estimated BAC
    const weights = state.weights || { keelan: DEFAULT_LB, rein: DEFAULT_LB };
    const curves = {};
    let bmax = 0;
    PEOPLE.forEach((p) => { curves[p] = bacCurve(ev, p, weights[p], t0, now); curves[p].forEach((pt) => { if (pt[1] > bmax) bmax = pt[1]; }); });
    const bTop = Math.max(0.1, Math.ceil(bmax / 0.02) * 0.02 + 0.02);
    const yb = (v) => T + (1 - v / bTop) * (H - T - B);
    const bstep = bTop <= 0.12 ? 0.02 : bTop <= 0.24 ? 0.04 : 0.1;
    for (let v = 0; v <= bTop + 1e-9; v += bstep) {
      svg.appendChild(el('text', { class: 'axis right', x: W - R + 6, y: yb(v) + 4, 'text-anchor': 'start' }, v.toFixed(2).replace(/^0/, '')));
    }
    if (bTop >= 0.08) svg.appendChild(el('line', { class: 'limit', x1: L, x2: W - R, y1: yb(0.08), y2: yb(0.08) }));
    ['rein', 'keelan'].forEach((p) => {
      const c = curves[p];
      if (!c.length) return;
      const d = c.map((pt, i) => (i ? 'L' : 'M') + x(pt[0]).toFixed(1) + ' ' + yb(pt[1]).toFixed(1)).join(' ');
      svg.appendChild(el('path', { class: 'bac ' + p, d }));
    });

    $('lgKeelan').textContent = std(series.keelan.cum);
    $('lgRein').textContent = std(series.rein.cum);
    $('bacKeelan').textContent = bacAt(ev, 'keelan', weights.keelan, now).toFixed(3);
    $('bacRein').textContent = bacAt(ev, 'rein', weights.rein, now).toFixed(3);
    $('wKeelan').textContent = weights.keelan;
    $('wRein').textContent = weights.rein;
  }

  setInterval(() => { if (state && document.visibilityState === 'visible') render(); }, 30000);

  /* ---------- banner + toast ---------- */
  function banner(msg) { const el = $('banner'); el.textContent = msg; el.hidden = !msg; }
  let toastTimer = null;
  function toast(msg) {
    const el = $('toast');
    el.textContent = msg; el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 1800);
  }

  /* ---------- boot ---------- */
  (async function boot() {
    setConn('');
    try {
      apply(await api('/state'));
      setConn('on');
    } catch (e) {
      if (e.code === 'nobinding') enterLocal();
      else { setConn('off'); toast('Offline'); }
    }
    startPolling();
  })();
})();
