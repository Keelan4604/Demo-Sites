/*
  Beer Tracker client.
  One shared state object comes from /api/state and from the WebSocket at /api/ws.
  Every tap posts to /api and the server pushes the new state to every open phone.
*/

(function () {
  const PEOPLE = ['keelan', 'rein'];
  const NAMES = { keelan: 'Keelan', rein: 'Rein' };
  const TYPES = { beer: 1, carbomb: 2, shot: 1, seltzer: 1, mixed: 1.5, water: 0 };
  const LABEL = { beer: 'Beer', carbomb: 'Car bomb', shot: 'Shot', seltzer: 'Seltzer', mixed: 'Mixed drink', water: 'Water' };
  const ICON = { beer: '🍺', carbomb: '💣', shot: '🥃', seltzer: '🥫', mixed: '🍹', water: '💧' };

  const $ = (id) => document.getElementById(id);
  let state = null;
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
    if (res.status === 401) { needPin(true); throw new Error('pin'); }
    if (!res.ok) throw new Error('http ' + res.status);
    return res.json();
  }

  /* ---------- live connection ---------- */
  let ws = null, wsTimer = null, pollTimer = null, backoff = 1000;
  function setConn(status) {
    const d = $('connDot');
    d.className = 'dot ' + status;
    d.title = status === 'on' ? 'Live' : status === 'off' ? 'Offline, retrying' : 'Connecting';
  }
  function connect() {
    if (!pin && pinRequired) return;
    if (ws && (ws.readyState === 0 || ws.readyState === 1)) return;
    setConn('');
    const proto = location.protocol === 'https:' ? 'wss://' : 'ws://';
    try {
      ws = new WebSocket(proto + location.host + '/api/ws?pin=' + encodeURIComponent(pin));
    } catch (e) { scheduleReconnect(); return; }
    ws.onopen = () => { backoff = 1000; setConn('on'); stopPolling(); };
    ws.onmessage = (ev) => {
      if (ev.data === 'pong') return;
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'state') apply(msg.state);
      } catch (e) { /* ignore */ }
    };
    ws.onclose = () => { setConn('off'); scheduleReconnect(); startPolling(); };
    ws.onerror = () => { try { ws.close(); } catch (e) { /* noop */ } };
  }
  function scheduleReconnect() {
    clearTimeout(wsTimer);
    wsTimer = setTimeout(() => { backoff = Math.min(backoff * 2, 15000); connect(); }, backoff);
  }
  function startPolling() {
    if (pollTimer) return;
    pollTimer = setInterval(refresh, 6000);
  }
  function stopPolling() { clearInterval(pollTimer); pollTimer = null; }
  async function refresh() {
    try { apply(await api('/state')); } catch (e) { /* offline */ }
  }
  // keepalive so idle proxies do not drop the socket
  setInterval(() => { if (ws && ws.readyState === 1) ws.send('ping'); }, 25000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (ws && ws.readyState === 1) ws.send('state'); else { refresh(); backoff = 1000; connect(); }
  });
  window.addEventListener('online', () => { backoff = 1000; connect(); refresh(); });

  /* ---------- pin ---------- */
  let pinRequired = false;
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
      apply(await api('/state'));
      try { localStorage.setItem('bt-pin', pin); } catch (err) { /* noop */ }
      $('pinOverlay').hidden = true;
      pinRequired = false;
      backoff = 1000;
      connect();
    } catch (err) {
      $('pinErr').hidden = false;
      $('pinInput').value = '';
      $('pinInput').focus();
    }
  });

  /* ---------- actions ---------- */
  function haptic(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* noop */ } }

  async function add(who, type) {
    haptic(12);
    // optimistic: show it before the server answers
    if (state) {
      state.events.push({ id: 'tmp' + Date.now(), t: Date.now(), who, type, tmp: true });
      state.totals = totalsOf(state.events);
      render(true);
    }
    try { apply(await api('/event', { who, type })); }
    catch (e) { toast('Could not save, retrying'); refresh(); }
  }
  async function undo(who) {
    haptic(20);
    const last = state && [...state.events].reverse().find((e) => e.who === who);
    if (!last) { toast('Nothing to undo for ' + NAMES[who]); return; }
    try { apply(await api('/undo', { who })); toast('Removed ' + NAMES[who] + "'s " + LABEL[last.type].toLowerCase()); }
    catch (e) { toast('Could not undo'); refresh(); }
  }
  async function newNight() {
    const n = state ? state.events.length : 0;
    const msg = n ? 'Close out tonight and start a new one? Tonight gets saved to the record.' : 'Start a new night?';
    if (!confirm(msg)) return;
    try { apply(await api('/night/new', {})); toast('New night'); }
    catch (e) { toast('Could not start a new night'); }
  }
  async function clearNight() {
    if (!confirm('Wipe tonight without saving it to the record?')) return;
    if (!confirm('Last chance. Wipe it?')) return;
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
    const prev = state;
    state = s;
    if (!state.totals) state.totals = totalsOf(state.events);
    render(false, prev);
  }

  const fmtTime = (t) => new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const fmtDate = (t) => new Date(t).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  const std = (n) => (Math.round(n * 10) / 10).toString();

  function pace(events, who) {
    const mine = events.filter((e) => e.who === who && TYPES[e.type] > 0);
    if (!mine.length) return 0;
    const first = mine[0].t;
    const hours = Math.max((Date.now() - first) / 3600000, 0.5);
    const total = mine.reduce((a, e) => a + TYPES[e.type], 0);
    return total / hours;
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
    const pick = pool[Math.floor(Math.floor(diff * 2 + a + b) % pool.length)];
    return pick.replace('{L}', L).replace('{T}', T).replace('{n}', std(diff));
  }

  function bump(el) { el.classList.add('bump'); setTimeout(() => el.classList.remove('bump'), 160); }

  function render(optimistic, prev) {
    if (!state) return;
    const t = state.totals;
    $('nightDate').textContent = fmtDate(state.night.startedAt) + (state.events.length ? ' · since ' + fmtTime(state.events[0].t) : '');

    PEOPLE.forEach((p) => {
      const cap = p === 'keelan' ? 'Keelan' : 'Rein';
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

    // log
    const log = $('log');
    log.innerHTML = state.events.slice().reverse().map((e) => {
      return '<li class="' + e.who + (e.type === 'water' ? ' water' : '') + '"><span class="t">' + fmtTime(e.t) + '</span><span>' + ICON[e.type] + '</span><span><span class="who">' + NAMES[e.who] + '</span> <span class="what">' + LABEL[e.type].toLowerCase() + '</span></span><span class="std">' + (TYPES[e.type] ? '+' + TYPES[e.type] : '') + '</span></li>';
    }).join('');
    $('logEmpty').hidden = state.events.length > 0;

    // all time
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

  // pace drifts with time even with no taps
  setInterval(() => { if (state && document.visibilityState === 'visible') render(); }, 30000);

  /* ---------- toast ---------- */
  let toastTimer = null;
  function toast(msg) {
    const el = $('toast');
    el.textContent = msg; el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 1800);
  }

  /* ---------- boot ---------- */
  (async function boot() {
    try {
      apply(await api('/state'));
      connect();
    } catch (e) {
      if (e.message !== 'pin') { toast('Offline'); startPolling(); }
    }
  })();
})();
