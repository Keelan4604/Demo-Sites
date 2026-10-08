/*
  Pages Function: /api/*
  Shared state lives in a D1 database bound as DB (Pages project > Settings >
  Bindings > D1). Tables are created on first use. Optional PIN env var gates
  writes and reads. Without the DB binding every route answers 503 and the
  page falls back to local-only mode.

  Routes:
    GET  /api/state            full snapshot
    POST /api/event            { who, type }
    POST /api/undo             { who }
    POST /api/night/new        archive tonight, start fresh
    POST /api/night/clear      drop tonight without archiving
    POST /api/import           { events: [{t, who, type}] }  replay local-only taps
*/

const PEOPLE = ['keelan', 'rein'];
const TYPES = { beer: 1, carbomb: 2, shot: 1, seltzer: 1, mixed: 1.5, water: 0 };

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

function totalsOf(events) {
  const out = {};
  for (const p of PEOPLE) out[p] = { beer: 0, carbomb: 0, shot: 0, seltzer: 0, mixed: 0, water: 0, std: 0 };
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
    db.prepare('CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, t INTEGER NOT NULL, who TEXT NOT NULL, type TEXT NOT NULL)'),
    db.prepare('CREATE TABLE IF NOT EXISTS nights (id INTEGER PRIMARY KEY AUTOINCREMENT, started_at INTEGER NOT NULL, ended_at INTEGER NOT NULL, totals TEXT NOT NULL, winner TEXT NOT NULL)'),
    db.prepare('CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)'),
  ]);
}

async function getNight(db) {
  const row = await db.prepare("SELECT value FROM meta WHERE key = 'night'").first();
  if (row) return JSON.parse(row.value);
  const night = { id: Date.now().toString(36), startedAt: Date.now() };
  await db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('night', ?)").bind(JSON.stringify(night)).run();
  return night;
}

async function snapshot(db) {
  const [night, ev, nights] = await Promise.all([
    getNight(db),
    db.prepare('SELECT id, t, who, type FROM events ORDER BY id ASC').all(),
    db.prepare('SELECT id, started_at, ended_at, totals, winner FROM nights ORDER BY id ASC').all(),
  ]);
  const events = ev.results || [];
  const history = (nights.results || []).map((n) => ({ id: n.id, startedAt: n.started_at, endedAt: n.ended_at, totals: JSON.parse(n.totals), winner: n.winner }));
  const last = events.length ? events[events.length - 1].id : 0;
  return { night, events, history, totals: totalsOf(events), version: night.id + ':' + events.length + ':' + last + ':' + history.length, serverTime: Date.now() };
}

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, '');
  const pin = request.headers.get('x-pin') || url.searchParams.get('pin') || '';

  if (env.PIN && pin !== env.PIN) return json({ error: 'pin' }, 401);
  const db = env.DB;
  if (!db) return json({ error: 'no-binding', hint: 'Bind a D1 database as DB on the Pages project' }, 503);

  try {
    await ensureSchema(db);

    if (request.method === 'GET' && path === '/state') return json(await snapshot(db));

    if (request.method === 'POST' && path === '/event') {
      const body = await request.json().catch(() => ({}));
      const who = String(body.who || '').toLowerCase();
      const type = String(body.type || '').toLowerCase();
      if (!PEOPLE.includes(who) || !(type in TYPES)) return json({ error: 'bad event' }, 400);
      await db.prepare('INSERT INTO events (t, who, type) VALUES (?, ?, ?)').bind(Date.now(), who, type).run();
      return json(await snapshot(db));
    }

    if (request.method === 'POST' && path === '/import') {
      const body = await request.json().catch(() => ({}));
      const list = Array.isArray(body.events) ? body.events.slice(0, 500) : [];
      const stmts = [];
      for (const e of list) {
        const who = String(e.who || '').toLowerCase(), type = String(e.type || '').toLowerCase();
        if (PEOPLE.includes(who) && type in TYPES) stmts.push(db.prepare('INSERT INTO events (t, who, type) VALUES (?, ?, ?)').bind(Number(e.t) || Date.now(), who, type));
      }
      if (stmts.length) await db.batch(stmts);
      return json(await snapshot(db));
    }

    if (request.method === 'POST' && path === '/undo') {
      const body = await request.json().catch(() => ({}));
      const who = String(body.who || '').toLowerCase();
      if (PEOPLE.includes(who)) await db.prepare('DELETE FROM events WHERE id = (SELECT id FROM events WHERE who = ? ORDER BY id DESC LIMIT 1)').bind(who).run();
      else await db.prepare('DELETE FROM events WHERE id = (SELECT id FROM events ORDER BY id DESC LIMIT 1)').run();
      return json(await snapshot(db));
    }

    if (request.method === 'POST' && (path === '/night/new' || path === '/night/clear')) {
      const s = await snapshot(db);
      const stmts = [];
      if (path === '/night/new' && s.events.length) {
        const a = s.totals.keelan.std, b = s.totals.rein.std;
        const winner = a === b ? 'tie' : a > b ? 'keelan' : 'rein';
        stmts.push(db.prepare('INSERT INTO nights (started_at, ended_at, totals, winner) VALUES (?, ?, ?, ?)').bind(s.night.startedAt, Date.now(), JSON.stringify(s.totals), winner));
      }
      const night = { id: Date.now().toString(36), startedAt: Date.now() };
      stmts.push(db.prepare('DELETE FROM events'));
      stmts.push(db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('night', ?)").bind(JSON.stringify(night)));
      await db.batch(stmts);
      return json(await snapshot(db));
    }

    return json({ error: 'not found' }, 404);
  } catch (err) {
    return json({ error: 'db', detail: String(err && err.message || err) }, 500);
  }
}
