/*
  beer-tracker-do
  One Durable Object ("main") holds the shared tracker state and pushes it to
  every connected phone over WebSockets. The Pages site reaches it through a
  binding; this Worker has no public URL of its own (workers_dev is off).

  State in storage:
    night    { id, startedAt }
    events   [{ id, t, who, type }]       current night only, newest last
    history  [{ id, startedAt, endedAt, totals, std, winner }]  past nights
*/

const PEOPLE = ['keelan', 'rein'];
const TYPES = { beer: 1, carbomb: 2, shot: 1, seltzer: 1, mixed: 1.5, water: 0 };
const MAX_EVENTS = 2000;
const MAX_HISTORY = 200;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

function totalsOf(events) {
  const out = {};
  for (const p of PEOPLE) {
    out[p] = { beer: 0, carbomb: 0, shot: 0, seltzer: 0, mixed: 0, water: 0, std: 0 };
  }
  for (const e of events) {
    const t = out[e.who];
    if (!t || !(e.type in TYPES)) continue;
    t[e.type] += 1;
    t.std += TYPES[e.type];
  }
  return out;
}

export class Tracker {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }

  async load() {
    const [night, events, history] = await Promise.all([
      this.ctx.storage.get('night'),
      this.ctx.storage.get('events'),
      this.ctx.storage.get('history'),
    ]);
    const s = {
      night: night || { id: Date.now().toString(36), startedAt: Date.now() },
      events: events || [],
      history: history || [],
    };
    if (!night) await this.ctx.storage.put('night', s.night);
    return s;
  }

  async save(s) {
    await this.ctx.storage.put({ night: s.night, events: s.events, history: s.history });
  }

  snapshot(s) {
    return { night: s.night, events: s.events, history: s.history, totals: totalsOf(s.events), serverTime: Date.now() };
  }

  broadcast(s) {
    const msg = JSON.stringify({ type: 'state', state: this.snapshot(s) });
    for (const ws of this.ctx.getWebSockets()) {
      try { ws.send(msg); } catch (e) { /* closed socket, hibernation API cleans it up */ }
    }
  }

  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api/, '');

    if (path === '/ws') {
      if (request.headers.get('Upgrade') !== 'websocket') return json({ error: 'expected websocket' }, 426);
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.ctx.acceptWebSocket(server);
      const s = await this.load();
      server.send(JSON.stringify({ type: 'state', state: this.snapshot(s) }));
      return new Response(null, { status: 101, webSocket: client });
    }

    const s = await this.load();

    if (request.method === 'GET' && path === '/state') return json(this.snapshot(s));

    if (request.method === 'POST' && path === '/event') {
      const body = await request.json().catch(() => ({}));
      const who = String(body.who || '').toLowerCase();
      const type = String(body.type || '').toLowerCase();
      if (!PEOPLE.includes(who) || !(type in TYPES)) return json({ error: 'bad event' }, 400);
      s.events.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), t: Date.now(), who, type });
      if (s.events.length > MAX_EVENTS) s.events.splice(0, s.events.length - MAX_EVENTS);
      await this.save(s);
      this.broadcast(s);
      return json(this.snapshot(s));
    }

    if (request.method === 'POST' && path === '/undo') {
      const body = await request.json().catch(() => ({}));
      const who = String(body.who || '').toLowerCase();
      for (let i = s.events.length - 1; i >= 0; i--) {
        if (!who || s.events[i].who === who) { s.events.splice(i, 1); break; }
      }
      await this.save(s);
      this.broadcast(s);
      return json(this.snapshot(s));
    }

    if (request.method === 'POST' && path === '/night/new') {
      if (s.events.length) {
        const totals = totalsOf(s.events);
        const a = totals.keelan.std, b = totals.rein.std;
        s.history.push({
          id: s.night.id,
          startedAt: s.night.startedAt,
          endedAt: Date.now(),
          totals,
          winner: a === b ? 'tie' : a > b ? 'keelan' : 'rein',
        });
        if (s.history.length > MAX_HISTORY) s.history.splice(0, s.history.length - MAX_HISTORY);
      }
      s.night = { id: Date.now().toString(36), startedAt: Date.now() };
      s.events = [];
      await this.save(s);
      this.broadcast(s);
      return json(this.snapshot(s));
    }

    if (request.method === 'POST' && path === '/night/clear') {
      // wipe tonight without recording it
      s.events = [];
      s.night = { id: Date.now().toString(36), startedAt: Date.now() };
      await this.save(s);
      this.broadcast(s);
      return json(this.snapshot(s));
    }

    return json({ error: 'not found' }, 404);
  }

  async webSocketMessage(ws, message) {
    if (message === 'ping') { ws.send('pong'); return; }
    if (message === 'state') {
      const s = await this.load();
      ws.send(JSON.stringify({ type: 'state', state: this.snapshot(s) }));
    }
  }

  async webSocketClose(ws, code, reason, wasClean) {
    try { ws.close(code, reason); } catch (e) { /* already closed */ }
  }

  async webSocketError(ws) {
    try { ws.close(1011, 'error'); } catch (e) { /* already closed */ }
  }
}

export default {
  async fetch() {
    return new Response('beer-tracker-do: reached only through the Pages binding', { status: 404 });
  },
};
