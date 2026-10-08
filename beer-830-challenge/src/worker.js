/*
  beer-tracker Worker: static assets from ./public plus the /api routes.
  Same handler the Pages Function used; onRequest takes { request, env }.
*/
import { onRequest } from './api.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) return onRequest({ request, env, ctx });
    return env.ASSETS.fetch(request);
  },
};
