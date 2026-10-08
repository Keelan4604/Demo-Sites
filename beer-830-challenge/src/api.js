/*
  /api/* handler, run by src/worker.js (originally a Pages Function)
  Shared state lives in a D1 database bound as DB. Tables are created on
  first use. No auth by design (Keelan, 2026-10-08). Without the DB binding
  every route answers 503 and the page falls back to local-only mode.

  Routes:
    GET  /api/state?cs=<ms>    full snapshot; cs = challenge window start, beers since then come back as `challenge`
    POST /api/event            { who, type }
    POST /api/undo             { who }
    POST /api/night/new        archive tonight, start fresh
    POST /api/night/clear      drop tonight without archiving
    POST /api/weight           { who, lb }  body weight for the BAC estimate
    POST /api/import           { events: [{t, who, type}] }  replay local-only taps
*/

const PEOPLE = ['keelan', 'rein'];
const TYPES = { beer: 1, carbomb: 2, shot: 1, seltzer: 1, mixed: 1.5 };

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

function totalsOf(events) {
  const out = {};
  for (const p of PEOPLE) out[p] = { beer: 0, carbomb: 0, shot: 0, seltzer: 0, mixed: 0, std: 0 };
  for (const e of events) {
    const t = out[e.who];
    if (!t || !(e.type in TYPES)) continue;
    t[e.type] += 1;
    t.std += TYPES[e.type];
  }
  return out;
}

async function ensureSchema(db) {
  await db.batch([
    db.prepare('CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, t INTEGER NOT NULL, who TEXT NOT NULL, type TEXT NOT NULL, night TEXT)'),
    db.prepare('CREATE TABLE IF NOT EXISTS nights (id INTEGER PRIMARY KEY AUTOINCREMENT, started_at INTEGER NOT NULL, ended_at INTEGER NOT NULL, totals TEXT NOT NULL, winner TEXT NOT NULL)'),
    db.prepare('CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)'),
  ]);
  // events used to be wiped on each new night; now they carry the night id so the 100-beer
  // challenge can see beers across nights. Older rows get the current night.
  try { await db.prepare('ALTER TABLE events ADD COLUMN night TEXT').run(); } catch (e) { /* column exists */ }
  const night = await getNight(db);
  await db.prepare('UPDATE events SET night = ? WHERE night IS NULL').bind(night.id).run();
}

async function getNight(db) {
  const row = await db.prepare("SELECT value FROM meta WHERE key = 'night'").first();
  if (row) return JSON.parse(row.value);
  const night = { id: Date.now().toString(36), startedAt: Date.now() };
  await db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('night', ?)").bind(JSON.stringify(night)).run();
  return night;
}

const DEFAULT_LB = 180;
async function getWeights(db) {
  const rows = await db.prepare("SELECT key, value FROM meta WHERE key LIKE 'weight:%'").all();
  const w = {};
  for (const p of PEOPLE) w[p] = DEFAULT_LB;
  for (const r of rows.results || []) { const p = r.key.slice(7); if (PEOPLE.includes(p)) w[p] = Number(r.value) || DEFAULT_LB; }
  return w;
}

// Every drink across every night, for the 100-drink challenge view (each tap counts one). Window start comes
// from the client so the timezone decision lives in one place (app.js).
const CHALLENGE_FALLBACK_START = Date.UTC(2026, 9, 8, 16, 0, 0);   // 2026-10-08 12:00 EDT

async function snapshot(db, challengeStart) {
  const night = await getNight(db);
  const since = Number(challengeStart) || CHALLENGE_FALLBACK_START;
  const [ev, nights, weights, beers] = await Promise.all([
    db.prepare('SELECT id, t, who, type FROM events WHERE night = ? ORDER BY id ASC').bind(night.id).all(),
    db.prepare('SELECT id, started_at, ended_at, totals, winner FROM nights ORDER BY id ASC').all(),
    getWeights(db),
    db.prepare('SELECT t FROM events WHERE t >= ? ORDER BY t ASC').bind(since).all(),
  ]);
  const events = ev.results || [];
  const history = (nights.results || []).map((n) => ({ id: n.id, startedAt: n.started_at, endedAt: n.ended_at, totals: JSON.parse(n.totals), winner: n.winner }));
  const last = events.length ? events[events.length - 1].id : 0;
  const challenge = (beers.results || []).map((r) => r.t);
  return { night, events, history, weights, challenge, totals: totalsOf(events), version: night.id + ':' + events.length + ':' + last + ':' + history.length + ':' + weights.keelan + ':' + weights.rein + ':' + challenge.length, serverTime: Date.now() };
}

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, '');
  const db = env.DB;
  if (!db) return json({ error: 'no-binding', hint: 'Bind a D1 database as DB' }, 503);
  const cs = url.searchParams.get('cs');

  try {
    await ensureSchema(db);
    const night = await getNight(db);

    if (request.method === 'GET' && path === '/state') return json(await snapshot(db, cs));

    if (request.method === 'POST' && path === '/event') {
      const body = await request.json().catch(() => ({}));
      const who = String(body.who || '').toLowerCase();
      const type = String(body.type || '').toLowerCase();
      if (!PEOPLE.includes(who) || !(type in TYPES)) return json({ error: 'bad event' }, 400);
      await db.prepare('INSERT INTO events (t, who, type, night) VALUES (?, ?, ?, ?)').bind(Date.now(), who, type, night.id).run();
      return json(await snapshot(db, cs));
    }

    if (request.method === 'POST' && path === '/weight') {
      const body = await request.json().catch(() => ({}));
      const who = String(body.who || '').toLowerCase();
      const lb = Math.round(Number(body.lb));
      if (!PEOPLE.includes(who) || !(lb >= 80 && lb <= 400)) return json({ error: 'bad weight' }, 400);
      await db.prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)').bind('weight:' + who, String(lb)).run();
      return json(await snapshot(db, cs));
    }

    if (request.method === 'POST' && path === '/import') {
      const body = await request.json().catch(() => ({}));
      const list = Array.isArray(body.events) ? body.events.slice(0, 500) : [];
      const stmts = [];
      for (const e of list) {
        const who = String(e.who || '').toLowerCase(), type = String(e.type || '').toLowerCase();
        if (PEOPLE.includes(who) && type in TYPES) stmts.push(db.prepare('INSERT INTO events (t, who, type, night) VALUES (?, ?, ?, ?)').bind(Number(e.t) || Date.now(), who, type, night.id));
      }
      if (stmts.length) await db.batch(stmts);
      return json(await snapshot(db, cs));
    }

    if (request.method === 'POST' && path === '/undo') {
      const body = await request.json().catch(() => ({}));
      const who = String(body.who || '').toLowerCase();
      if (PEOPLE.includes(who)) await db.prepare('DELETE FROM events WHERE id = (SELECT id FROM events WHERE who = ? AND night = ? ORDER BY id DESC LIMIT 1)').bind(who, night.id).run();
      else await db.prepare('DELETE FROM events WHERE id = (SELECT id FROM events WHERE night = ? ORDER BY id DESC LIMIT 1)').bind(night.id).run();
      return json(await snapshot(db, cs));
    }

    if (request.method === 'POST' && (path === '/night/new' || path === '/night/clear')) {
      const s = await snapshot(db, cs);
      const stmts = [];
      if (path === '/night/new' && s.events.length) {
        const a = s.totals.keelan.std, b = s.totals.rein.std;
        const winner = a === b ? 'tie' : a > b ? 'keelan' : 'rein';
        stmts.push(db.prepare('INSERT INTO nights (started_at, ended_at, totals, winner) VALUES (?, ?, ?, ?)').bind(s.night.startedAt, Date.now(), JSON.stringify(s.totals), winner));
      }
      if (path === '/night/clear') stmts.push(db.prepare('DELETE FROM events WHERE night = ?').bind(night.id));   // wiped nights leave the challenge too
      const fresh = { id: Date.now().toString(36), startedAt: Date.now() };
      stmts.push(db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('night', ?)").bind(JSON.stringify(fresh)));
      await db.batch(stmts);
      return json(await snapshot(db, cs));
    }

    return json({ error: 'not found' }, 404);
  } catch (err) {
    return json({ error: 'db', detail: String(err && err.message || err) }, 500);
  }
}
