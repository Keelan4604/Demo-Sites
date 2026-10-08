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
  // 100 drinks combined (every tap counts one), from noon Thursday 2026-10-08 to 2 am Sunday 2026-10-11, local time
  const CHALLENGE = { start: new Date(2026, 9, 8, 12, 0, 0).getTime(), end: new Date(2026, 9, 11, 2, 0, 0).getTime(), goal: 100, sleepFrom: 2, sleepTo: 14 };
  // Sleep windows: 2 am to 2 pm local every day. awakeMs(t) = awake time between the window start and t.
  function sleepWindows() {
    const out = [];
    const d = new Date(CHALLENGE.start); d.setHours(0, 0, 0, 0);
    for (let k = 0; k < 6; k++) {
      const a = new Date(d); a.setDate(d.getDate() + k); a.setHours(CHALLENGE.sleepFrom, 0, 0, 0);
      const b = new Date(d); b.setDate(d.getDate() + k); b.setHours(CHALLENGE.sleepTo, 0, 0, 0);
      out.push([a.getTime(), b.getTime()]);
    }
    return out;
  }
  function awakeMs(t) {
    const { start } = CHALLENGE;
    let span = Math.max(0, t - start);
    sleepWindows().forEach(([a, b]) => { const lo = Math.max(a, start), hi = Math.min(b, t); if (hi > lo) span -= hi - lo; });
    return span;
  }
  const RETRY_LOCAL_MS = 15000;

  const $ = (id) => document.getElementById(id);
  let state = null;
  let mode = 'server';          // 'server' | 'local'

  /* ---------- api ---------- */
  async function api(path, body) {
    const sep = path.includes('?') ? '&' : '?';
    const res = await fetch('/api' + path + sep + 'cs=' + CHALLENGE.start, {
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

  /* ---------- tap effect: real Galaxy Gas can, violent spin, explosion with sound ---------- */
  const canImg = new Image(); canImg.src = 'galaxy-gas.webp';
  let audioCtx = null;
  function ac() {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  // rising sawtooth while the can spins up
  function whine() {
    try {
      const a = ac(), t = a.currentTime;
      const w = a.createOscillator(); w.type = 'sawtooth';
      w.frequency.setValueAtTime(120, t); w.frequency.exponentialRampToValueAtTime(2600, t + 1.3);
      const f = a.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2;
      f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(5000, t + 1.3);
      const g = a.createGain(); g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.35);
      w.connect(f).connect(g).connect(a.destination); w.start(t); w.stop(t + 1.35);
    } catch (e) { /* no audio */ }
  }
  // bass-boosted blast: noise through a falling low-pass and a waveshaper, two sub thumps, a compressor on the end
  function boom() {
    try {
      const a = ac(), t = a.currentTime;
      const comp = a.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 12; comp.attack.value = 0.002; comp.release.value = 0.25;
      const master = a.createGain(); master.gain.value = 1.0; comp.connect(master).connect(a.destination);
      const shaper = a.createWaveShaper(); const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) { const x = (i / 128) - 1; curve[i] = Math.tanh(x * 4); }
      shaper.curve = curve; shaper.connect(comp);
      const len = Math.floor(a.sampleRate * 2.0);
      const buf = a.createBuffer(1, len, a.sampleRate); const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
      const n = a.createBufferSource(); n.buffer = buf;
      const lp = a.createBiquadFilter(); lp.type = 'lowpass';
      lp.frequency.setValueAtTime(5000, t); lp.frequency.exponentialRampToValueAtTime(90, t + 1.6);
      const g = a.createGain(); g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(1.4, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.9);
      n.connect(lp).connect(g).connect(shaper); n.start(t); n.stop(t + 2.0);
      [0, 0.22].forEach((off, k) => {
        const o = a.createOscillator(); o.type = 'sine';
        o.frequency.setValueAtTime(k ? 110 : 150, t + off); o.frequency.exponentialRampToValueAtTime(28, t + off + 0.6);
        const og = a.createGain(); og.gain.setValueAtTime(0.0001, t + off);
        og.gain.exponentialRampToValueAtTime(k ? 0.8 : 1.2, t + off + 0.012); og.gain.exponentialRampToValueAtTime(0.0001, t + off + 0.75);
        o.connect(og).connect(shaper); o.start(t + off); o.stop(t + off + 0.8);
      });
    } catch (e) { /* no audio */ }
  }
  function blast() {
    const fx = $('fx');
    if (!fx || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    whine();
    const can = document.createElement('div');
    can.className = 'fx-can';
    const im = document.createElement('img'); im.src = 'galaxy-gas.webp'; im.alt = ''; can.appendChild(im);
    fx.appendChild(can);
    setTimeout(() => {
      boom();
      const shakers = [document.querySelector('.top'), document.querySelector('main')].filter(Boolean);
      shakers.forEach((el) => { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); });
      setTimeout(() => shakers.forEach((el) => el.classList.remove('shake')), 850);
      const mk = (cls, life) => { const e = document.createElement('div'); e.className = cls; fx.appendChild(e); setTimeout(() => e.remove(), life); return e; };
      mk('fx-flash', 500);
      mk('fx-inferno', 1800);
      mk('fx-ring', 750);
      mk('fx-fire', 1400); mk('fx-fire two', 1700); mk('fx-fire three', 2000); mk('fx-fire smoke', 2400);
      const throwOut = (cls, n, rMin, rMax, text, life) => {
        for (let i = 0; i < n; i++) {
          const e = document.createElement('div');
          e.className = cls; if (text) e.textContent = text(i);
          const ang = (i / n) * Math.PI * 2 + Math.random() * 0.5;
          const r = rMin + Math.random() * (rMax - rMin);
          e.style.setProperty('--dx', (Math.cos(ang) * r).toFixed(0) + 'px');
          e.style.setProperty('--dy', (Math.sin(ang) * r - 60).toFixed(0) + 'px');
          e.style.setProperty('--rot', (Math.random() * 1080 - 540).toFixed(0) + 'deg');
          e.style.animationDelay = (Math.random() * 0.1).toFixed(2) + 's';
          fx.appendChild(e); setTimeout(() => e.remove(), life);
        }
      };
      // flame tongues: spread sideways a little, rise a lot
      for (let i = 0; i < 22; i++) {
        const e = document.createElement('div'); e.className = 'fx-tongue';
        const dx = (Math.random() * 2 - 1) * 150;
        e.style.setProperty('--dx', dx.toFixed(0) + 'px');
        e.style.setProperty('--rot', ((Math.random() * 2 - 1) * 18).toFixed(0) + 'deg');
        e.style.setProperty('--dur', (1.1 + Math.random() * 0.7).toFixed(2) + 's');
        e.style.width = (50 + Math.random() * 60).toFixed(0) + 'px';
        e.style.animationDelay = (Math.random() * 0.35).toFixed(2) + 's';
        fx.appendChild(e); setTimeout(() => e.remove(), 2300);
      }
      throwOut('fx-flame', 34, 120, 340, (i) => (i % 5 === 0 ? '💥' : '🔥'), 1500);
      throwOut('fx-spark', 70, 80, 440, null, 1700);
      throwOut('fx-shard', 14, 120, 360, null, 1800);
      haptic([30, 30, 90, 30, 140]);
    }, 1330);
    setTimeout(() => can.remove(), 1450);
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
    if (!state.challenge) state.challenge = state.events.filter((e) => e.t >= CHALLENGE.start).map((e) => e.t);
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
      const drinks = String(Object.keys(TYPES).reduce((n, ty) => n + t[p][ty], 0));   // every tap counts one
      if (bigEl.textContent !== drinks) { bigEl.textContent = drinks; bump(bigEl); }
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
    hundred();
  }

  /* ---------- 100 drink challenge: mean line vs combined ---------- */
  function hundred() {
    const svg = $('hundredChart');
    if (!svg) return;
    const { start, end, goal } = CHALLENGE;
    const now = Date.now();
    const beers = (state.challenge || []).filter((t) => t >= start && t <= end).sort((a, b) => a - b);
    const count = beers.length;
    const frac = Math.min(Math.max((now - start) / (end - start), 0), 1);
    const target = goal * frac;
    const diff = count - target;
    const hoursLeft = Math.max((end - now) / 3600000, 0);
    const awakeTotal = awakeMs(end);
    // sleep line: by each 2 am you must be where the flat mean will be at 2 pm, flat until the mean
    // catches up at 2 pm, then climb to the next 2 am target; 100 at the end.
    const mean = (t) => goal * (Math.min(Math.max(t, start), end) - start) / (end - start);
    const schedPts = [[start, 0]];
    sleepWindows().forEach(([a, b]) => { if (a > start && a < end) { const v = Math.min(goal, mean(Math.min(b, end))); schedPts.push([a, v]); if (b < end) schedPts.push([b, v]); } });
    schedPts.push([end, goal]);
    const sched = (t) => {
      t = Math.min(Math.max(t, start), end);
      for (let i = 1; i < schedPts.length; i++) {
        const [t0, v0] = schedPts[i - 1], [t1, v1] = schedPts[i];
        if (t <= t1) return t1 === t0 ? v1 : v0 + (v1 - v0) * (t - t0) / (t1 - t0);
      }
      return goal;
    };
    const awakeLeft = Math.max((awakeTotal - awakeMs(Math.min(Math.max(now, start), end))) / 3600000, 0);
    const need = count >= goal ? 0 : awakeLeft > 0 ? (goal - count) / awakeLeft : Infinity;
    const sdiff = count - sched(now);

    $('hundredCount').textContent = count;
    $('hundredTarget').textContent = target.toFixed(1);
    $('hundredNeed').textContent = need === Infinity ? '--' : need.toFixed(1);
    $('hundredLeft').textContent = hoursLeft >= 24 ? Math.floor(hoursLeft / 24) + 'd ' + Math.round(hoursLeft % 24) + 'h' : hoursLeft >= 1 ? hoursLeft.toFixed(1) + 'h' : Math.round(hoursLeft * 60) + 'm';
    const fmt = (t) => new Date(t).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' });
    $('hundredWindow').textContent = fmt(start) + ' to ' + fmt(end);
    const st = $('hundredStatus');
    st.className = 'hundred-status';
    if (count >= goal) { st.textContent = 'Done. ' + count + ' drinks.'; st.classList.add('done'); }
    else if (now < start) { st.textContent = 'Starts ' + fmt(start); }
    else if (now > end) { st.textContent = 'Over. Finished at ' + count + '.'; st.classList.add('behind'); }
    else if (sdiff >= 0) { st.textContent = 'Ahead of the sleep line by ' + sdiff.toFixed(1); st.classList.add('ahead'); }
    else { st.textContent = 'Behind the sleep line by ' + (-sdiff).toFixed(1); st.classList.add('behind'); }
    $('hundredSub').textContent = now < start || now > end || count >= goal ? '' : 'Flat mean line: ' + (diff >= 0 ? 'ahead by ' : 'behind by ') + Math.abs(diff).toFixed(1);
    $('hundredTarget').textContent = sched(now).toFixed(1);

    // chart
    const W = 600, H = 300, L = 34, R = 14, T = 18, B = 34;
    const x = (t) => L + ((t - start) / (end - start)) * (W - L - R);
    const ymax = Math.max(goal, count) * 1.05;
    const y = (v) => T + (1 - v / ymax) * (H - T - B);
    const ns = 'http://www.w3.org/2000/svg';
    const el = (tag, attrs, text) => { const n = document.createElementNS(ns, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (text != null) n.textContent = text; return n; };
    svg.textContent = '';
    for (let v = 0; v <= ymax; v += 20) {
      svg.appendChild(el('line', { class: 'grid', x1: L, x2: W - R, y1: y(v), y2: y(v) }));
      svg.appendChild(el('text', { class: 'axis', x: L - 6, y: y(v) + 4, 'text-anchor': 'end' }, String(v)));
    }
    // one tick per noon and midnight
    const d0 = new Date(start); d0.setHours(0, 0, 0, 0);
    for (let t = d0.getTime(); t <= end; t += 12 * 3600000) {
      if (t < start) continue;
      svg.appendChild(el('line', { class: 'grid', x1: x(t), x2: x(t), y1: T, y2: H - B }));
      if (end - t < 4 * 3600000) continue;   // too close to the 2am label
      const d = new Date(t);
      const lbl = d.getHours() === 0 ? d.toLocaleDateString([], { weekday: 'short' }) : 'noon';
      svg.appendChild(el('text', { class: 'axis', x: x(t), y: H - B + 16, 'text-anchor': 'middle' }, lbl));
    }
    svg.appendChild(el('text', { class: 'axis', x: x(end), y: H - B + 16, 'text-anchor': 'end' }, '2am'));
    // mean line to the goal
    svg.appendChild(el('path', { class: 'mean', d: 'M' + x(start) + ' ' + y(0) + ' L' + x(end) + ' ' + y(goal) }));
    svg.appendChild(el('text', { class: 'goal', x: x(end) - 4, y: y(goal) - 6, 'text-anchor': 'end' }, 'Sat night: ' + goal));
    // sleep-adjusted line: rises while awake, flat from 2am to 2pm, hits 100 at the end. Labelled at each 2am.
    svg.appendChild(el('path', { class: 'sched', d: schedPts.map((pt, i) => (i ? 'L' : 'M') + x(pt[0]).toFixed(1) + ' ' + y(pt[1]).toFixed(1)).join(' ') }));
    sleepWindows().forEach(([a]) => {
      if (a <= start || a >= end) return;
      const v = sched(a);
      svg.appendChild(el('circle', { class: 'sched-dot', cx: x(a), cy: y(v), r: 4 }));
      const nightOf = new Date(a); nightOf.setDate(nightOf.getDate() - 1);     // 2 am Friday is Thursday night
      svg.appendChild(el('text', { class: 'sched-lbl', x: x(a) - 6, y: y(v) - 8, 'text-anchor': 'end' }, nightOf.toLocaleDateString([], { weekday: 'short' }) + ' night: ' + Math.round(v)));
    });
    // combined drinks: a step up at every tap, flat to now
    const pts = [[start, 0]];
    beers.forEach((t, i) => { pts.push([t, i]); pts.push([t, i + 1]); });
    const upTo = Math.min(Math.max(now, start), end);
    pts.push([upTo, count]);
    const d = pts.map((pt, i) => (i ? 'L' : 'M') + x(pt[0]).toFixed(1) + ' ' + y(pt[1]).toFixed(1)).join(' ');
    svg.appendChild(el('path', { class: 'combined-area', d: d + ' L' + x(upTo).toFixed(1) + ' ' + y(0) + ' Z' }));
    svg.appendChild(el('path', { class: 'combined', d }));
    svg.appendChild(el('line', { class: 'now', x1: x(upTo), x2: x(upTo), y1: T, y2: H - B }));
    svg.appendChild(el('circle', { class: 'dot', cx: x(upTo), cy: y(count), r: 6 }));
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

  /* ---------- monotone cubic spline (Fritsch-Carlson) through the cumulative points ----------
     Piecewise cubic, passes through every point, never overshoots or dips between them. */
  function monotoneSpline(xs, ys) {
    const n = xs.length;
    if (n < 2) return () => (ys[0] || 0);
    const h = [], d = [];
    for (let i = 0; i < n - 1; i++) { h.push(xs[i + 1] - xs[i]); d.push(h[i] === 0 ? 0 : (ys[i + 1] - ys[i]) / h[i]); }
    const m = new Array(n).fill(0);
    m[0] = d[0]; m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
    for (let i = 0; i < n - 1; i++) {
      if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
      const a = m[i] / d[i], b = m[i + 1] / d[i], s2 = a * a + b * b;
      if (s2 > 9) { const t = 3 / Math.sqrt(s2); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
    }
    return (x) => {
      if (x <= xs[0]) return ys[0];
      if (x >= xs[n - 1]) return ys[n - 1];
      let i = 0; while (i < n - 2 && x > xs[i + 1]) i++;
      const t = (x - xs[i]) / h[i], t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h[i] * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h[i] * m[i + 1];
    };
  }

  /* ---------- chart: cumulative standard drinks over tonight ---------- */
  function chart() {
    const svg = $('chart');
    if (!svg) return;
    const W = 600, H = 250, L = 30, R = 44, T = 16, B = 30;
    const ev = state.events.filter((e) => TYPES[e.type] > 0).slice().sort((a, b) => a.t - b.t);
    const now = Date.now();
    const t0 = Math.min(state.night.startedAt, ev.length ? ev[0].t : now) ;
    const span = Math.max(now - t0, 600000);
    const t1 = t0 + span;
    const series = {};
    let ymax = 0;
    PEOPLE.forEach((p) => {
      let cum = 0;
      const raw = [[t0, 0]];                              // actual cumulative points
      ev.forEach((e) => {
        if (e.who !== p) return;
        cum += TYPES[e.type];
        const last = raw[raw.length - 1];
        if (raw.length > 1 && e.t - last[0] < 1000) last[1] = cum;             // same-second taps share a point
        else raw.push([Math.max(e.t, last[0] + 1000), cum]);                   // never collapse the starting zero
      });
      if (now - raw[raw.length - 1][0] > 1000) raw.push([now, cum]);
      // smooth curve through every point, sampled 120 times across the elapsed time
      const f = monotoneSpline(raw.map((pt) => pt[0]), raw.map((pt) => pt[1]));
      const pts = [];
      const steps = 120;
      for (let i = 0; i <= steps; i++) { const t = t0 + ((now - t0) * i) / steps; pts.push([t, f(t)]); }
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
    const stepMs = [300000, 600000, 900000, 1800000, 3600000, 7200000].find((ms) => span / ms <= 6) || 7200000;
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
