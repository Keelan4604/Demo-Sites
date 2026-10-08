/*
  Pages Function: /api/*
  Checks the PIN, then hands the request to the Durable Object (binding TRACKER,
  class Tracker in the beer-tracker-do Worker). WebSocket upgrades pass straight
  through, so the DO's 101 response reaches the phone.
*/

const unauthorized = () =>
  new Response(JSON.stringify({ error: 'pin' }), { status: 401, headers: { 'content-type': 'application/json' } });

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const pin = request.headers.get('x-pin') || url.searchParams.get('pin') || '';

  if (env.PIN && pin !== env.PIN) return unauthorized();
  if (!env.TRACKER) return new Response(JSON.stringify({ error: 'TRACKER binding missing' }), { status: 503, headers: { 'content-type': 'application/json' } });

  const id = env.TRACKER.idFromName('main');
  const stub = env.TRACKER.get(id);
  return stub.fetch(request);
}
