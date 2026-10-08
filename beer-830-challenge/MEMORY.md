---
title: Beer Tracker (beer.keelanodoherty.org)
project: beer-tracker
type: hub
status: active
updated: 2026-10-08
---

# Beer Tracker

Shared live drink counter for Keelan and Rein. Built 2026-10-08 from a brief relayed by the IT
chat. Replaces the old "8:30 Beer Challenge" demo that served the same subdomain from
localStorage only. First version used a Durable Object Worker plus WebSockets, then a Pages Function with D1 plus
polling; the final form (same day) is a single Worker with static assets, matching how his other
sites deploy. Keelan approved a wrangler login from his phone to make the deploy possible.

| | |
|---|---|
| Live | https://beer.keelanodoherty.org (also https://beer-tracker.keelan4604.workers.dev) |
| Repo | `github.com/Keelan4604/Demo-Sites`, folder `beer-830-challenge/`. Local clone `C:/Users/Keela/Documents/Websites/demo-sites/` |
| Hosting | Cloudflare Worker `beer-tracker` with static assets, like `personal-website` and `dashboard`. Deployed by `npx wrangler deploy` from this folder (`wrangler.jsonc`). Custom domain `beer.keelanodoherty.org` is attached to the Worker. **Nothing is git-connected**: pushing changes nothing live; run the deploy. |
| Code | `public/` static files, `src/worker.js` (routes `/api/*` to the handler, everything else to assets), `src/api.js` (the API). `public/830/` is the old 8:30 Beer Challenge game, rethemed crimson, reachable from the bottom bar |
| State | D1 database `beer-tracker` (id `c79fe986-379f-4f84-b184-7ce79a7e43cd`, region ENAM) bound as `DB`. Tables are created on first request. Without the binding every `/api` route answers 503 and the page runs local-only on that phone, then replays those taps when the server answers |
| Live sync | Each phone polls `/api/state` every 2.5 s while visible and re-renders when the version string changes. D1 is strongly consistent, so a tap shows on the other phone within one poll |
| Auth | None. Keelan removed the PIN 2026-10-08 ("remove the pin"). Anyone with the URL can tap. |

## How it works

Two side-by-side panels, one per person. Each tap posts `{who, type}` to `/api/event`, which
inserts a row and returns the full state; every other phone picks it up on its next poll. Undo
removes that person's last event. "New night" (the header arrow) archives tonight into
`history` with totals and a winner, then starts a fresh night. "Wipe tonight" on the All time
tab discards it without recording.

Standard-drink weights live in both `src/api.js` and `public/app.js` and must match:
beer 1, shot 1, seltzer 1, mixed 1.5, car bomb 2. Pace is standard drinks per hour
since that person's first non-water drink tonight, with a half-hour floor.

Tabs: Tonight (counts, taunt line, panels, chart), Log (tonight's events with times), All time
(nights won, all-time totals by type, past nights, wipe button), and a link to the 8:30 game.

Drink types: beer 1, shot 1, seltzer 1, mixed 1.5, car bomb 2 standard drinks. Water was removed
2026-10-08 at Keelan's request; old water rows, if any, are ignored by the client.

**Chart** (bottom of Tonight, `chart()` in `app.js`, hand-drawn SVG, redrawn every render): solid
lines are cumulative standard drinks per person on the left axis; dashed lines are estimated BAC
on the right axis, Widmark formula with 0.6 oz alcohol per standard drink, r = 0.68, burn-off
0.015 %/hr from each person's first drink, a dotted guide at 0.08. Body weight per person lives
in the `meta` table (`weight:keelan`, `weight:rein`, default 180 lb) and is edited from the button
under the chart (`POST /api/weight`), so both phones use the same numbers. It is an estimate for
fun, and the page says so.

**Tap effect**: every +1 spawns a spinning Galaxy Gas canister (inline SVG in `app.js`) that
bursts into flames after a second. Keelan's ask verbatim. Pure CSS keyframes, off under
prefers-reduced-motion.

## Deploy

From this folder, with wrangler logged in (the 2026-10-08 OAuth login on this PC):

```
npx wrangler deploy
```

That uploads `public/`, the Worker, the D1 binding and the custom domain in one go. Secrets
persist across deploys. The earlier Pages / Pages Function / Durable Object designs are gone;
their only trace is the git history.

## Local dev

`beer-web` in `~/.claude/launch.json`: `npx wrangler dev` on port 4392 from this folder, which
runs the Worker with a local D1. State lives in `.wrangler/` and is gitignored.

## Theme

Crimson #9E1B32, white, grey #828A8F. Logo is the Alabama Crimson Tide circle mark from
Wikimedia Commons (`public/logo.svg`), personal use. Bebas Neue for the scoreboard numbers,
Inter for everything else. Keelan's buttons are crimson, Rein's are black, water is grey.
