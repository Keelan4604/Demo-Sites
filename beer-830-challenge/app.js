/*
  Beer Tracker client.
  Shared state comes from /api/state (D1 behind a Pages Function) and is polled
  every 2.5 s while the page is visible, so a tap on one phone shows on the
  other within a few seconds. If the D1 binding is missing the page runs in
  local-only mode on this phone and replays those taps to the server the first
  time it answers.
*/

(function () {
  const PEOPLE = ['keelan', 'rein'];
  const NAMES = { keelan: 'Keelan', rein: 'Rein' };
  const TYPES = { beer: 1, carbomb: 2, shot: 1, seltzer: 1, mixed: 1.5, water: 0 };
  const LABEL = { beer: 'Beer', carbomb: 'Car bomb', shot: 'Shot', seltzer: 'Seltzer', mixed: 'Mixed drink', water: 'Water' };
  const ICON = { beer: '🍺', carbomb: '💣', shot: '🥃', seltzer: '🥫', mixed: '🍹', water: '💧' };
  const POLL_MS = 2500;
  const RETRY_LOCAL_MS = 15000;

  const $ = (id) => document.getElementById(id);
  let state = null;
  let mode = 'server';          // 'server' | 'local'
  let pinRequired = false;
  let pin = '';
  try { pin = localStorage.getItem('bt-pin') || ''; } catch (e) { pin = ''; }

  /* ---------- api ---------- */
  async function api(path, body) {
    const res = await fetch('/api' + path, {
      method: body ? 'POST' : 'GET',
      headers: { 'content-type': 'application/json', 'x-pin': pin },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
    if (res.status === 401) { needPin(true); throw Object.assign(new Error('pin'), { code: 'pin' }); }
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
    return { night: { id: 'local', startedAt: Date.now() }, events: [], history: [] };
  }
  function saveLocal() {
    if (mode !== 'local' || !state) return;
    try { localStorage.setItem('bt-local', JSON.stringify({ night: state.night, events: state.events, history: state.history })); } catch (e) { /* ignore */ }
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
    if (inFlight || pinRequired) return;
    if (mode === 'local') return;
    inFlight = true;
    try {
      const s = await api('/state');
      if (!state || s.version !== state.version) apply(s);
      setConn('on');
    } catch (e) {
      if (e.code === 'nobinding') enterLocal();
      else if (e.code !== 'pin') setConn('off');
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

  /* ---------- pin ---------- */
  function needPin(wrong) {
    pinRequired = true;
    $('pinOverlay').hidden = false;
    $('pinErr').hidden = !wrong;
    if (wrong) { pin = ''; try { localStorage.removeItem('bt-pin'); } catch (e) { /* noop */ } }
    setTimeout(() => $('pinInput').focus(), 50);
  }
  $('pinForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    pin = $('pinInput').value.trim();
    try {
      const s = await api('/state');
      try { localStorage.setItem('bt-pin', pin); } catch (err) { /* noop */ }
      $('pinOverlay').hidden = true;
      pinRequired = false;
      apply(s);
      setConn('on');
    } catch (err) {
      if (err.code === 'nobinding') { $('pinOverlay').hidden = true; pinRequired = false; enterLocal(); return; }
      $('pinErr').hidden = false;
      $('pinInput').value = '';
      $('pinInput').focus();
    }
  });

  /* ---------- actions ---------- */
  function haptic(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* noop */ } }
  function localEvent(who, type) {
    state.events.push({ id: 'l' + Date.now() + Math.random().toString(36).slice(2, 5), t: Date.now(), who, type });
    state.totals = totalsOf(state.events);
    saveLocal(); render();
  }

  async function add(who, type) {
    haptic(12);
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
    PEOPLE.forEach((p) => { out[p] = { beer: 0, carbomb: 0, shot: 0, seltzer: 0, mixed: 0, water: 0, std: 0 }; });
    events.forEach((e) => { const t = out[e.who]; if (t && e.type in TYPES) { t[e.type] += 1; t.std += TYPES[e.type]; } });
    return out;
  }
  function apply(s) {
    if (!s) return;
    state = s;
    if (!state.history) state.history = [];
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

    $('log').innerHTML = state.events.slice().reverse().map((e) =>
      '<li class="' + e.who + (e.type === 'water' ? ' water' : '') + '"><span class="t">' + fmtTime(e.t) + '</span><span>' + ICON[e.type] + '</span><span><span class="who">' + NAMES[e.who] + '</span> <span class="what">' + LABEL[e.type].toLowerCase() + '</span></span><span class="std">' + (TYPES[e.type] ? '+' + TYPES[e.type] : '') + '</span></li>'
    ).join('');
    $('logEmpty').hidden = state.events.length > 0;

    const wins = { keelan: 0, rein: 0, tie: 0 };
    const all = {};
    PEOPLE.forEach((p) => { all[p] = { beer: 0, carbomb: 0, shot: 0, seltzer: 0, mixed: 0, water: 0, std: 0, nights: 0 }; });
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
      else if (e.code !== 'pin') { setConn('off'); toast('Offline'); }
    }
    startPolling();
  })();
})();
