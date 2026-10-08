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
localStorage only. First version used a Durable Object Worker plus WebSockets; it was swapped for
D1 plus polling the same day so that a GitHub push and one dashboard binding are the entire
deploy, with no wrangler login needed on this PC.

| | |
|---|---|
| Live | https://beer.keelanodoherty.org |
| Repo | `github.com/Keelan4604/Demo-Sites`, folder `beer-830-challenge/`. Local clone `C:/Users/Keela/Documents/Websites/demo-sites/` |
| Hosting | A Cloudflare Pages project that is a direct upload, not git-connected (verified 2026-10-08: pushes to Demo-Sites main and to keelan-portfolio master both left the old demo live for 4+ minutes, despite Keelan recalling it as connected). Until he connects it in the dashboard or logs wrangler in, nothing on this PC can change the live site. Static files at the folder root, no build step |
| API | `functions/api/[[path]].js`, a Pages Function. Deploys with the push |
| State | D1 database bound to the Pages project as `DB`. Tables are created on first request. Without the binding every `/api` route answers 503 and the page runs local-only on that phone, then replays those taps when the binding appears |
| Live sync | Each phone polls `/api/state` every 2.5 s while visible and re-renders when the version string changes. D1 is strongly consistent, so a tap shows on the other phone within one poll |
| PIN | Optional env var `PIN` on the Pages project. Phones store it in localStorage after the first entry. Not in the repo |

## How it works

Two side-by-side panels, one per person. Each tap posts `{who, type}` to `/api/event`, which
inserts a row and returns the full state; every other phone picks it up on its next poll. Undo
removes that person's last event. "New night" (the header arrow) archives tonight into
`history` with totals and a winner, then starts a fresh night. "Wipe tonight" on the All time
tab discards it without recording.

Standard-drink weights live in both `functions/api/[[path]].js` and `app.js` and must match:
beer 1, shot 1, seltzer 1, mixed 1.5, car bomb 2, water 0. Pace is standard drinks per hour
since that person's first non-water drink tonight, with a half-hour floor.

Tabs: Tonight (counts, taunt line, panels), Log (tonight's events with times), All time
(nights won, all-time totals by type, past nights, wipe button).

## Deploy

Once the project is git-connected, push to `main` and that is the whole deploy for the site and the
Function. Connecting it is step 0 below.

One-time setup Keelan does in the Cloudflare dashboard (nothing on this PC can do it: wrangler is
logged out and tokens stay off C: by rule):

0. Workers & Pages > the project serving beer.keelanodoherty.org > Settings > Builds > connect
   GitHub repo `Keelan4604/Demo-Sites`, branch `main`, root directory `beer-830-challenge`, no
   build command. Save and deploy. (Alternative: `npx wrangler login` on this PC, then
   `npx wrangler pages deploy . --project-name <name>` from this folder.)
1. Workers & Pages > D1 > Create database, any name (for example `beer`).
2. The Pages project that serves beer.keelanodoherty.org > Settings > Bindings > Add > D1
   database, variable name `DB`, pick that database. Save, then redeploy (Deployments > Retry,
   or any push).
3. Optional: Settings > Environment variables > add `PIN` (production) to gate the page.

No `wrangler.toml` in this folder on purpose: when one exists, Pages ignores dashboard bindings.

## Local dev

`beer-web` in `~/.claude/launch.json`: `npx wrangler pages dev . --d1=DB` on port 4392 from this
folder, which gives the Function a local D1. State lives in `.wrangler/` and is gitignored.

## Theme

Crimson #9E1B32, white, grey #828A8F. Logo is the Alabama Crimson Tide circle mark from
Wikimedia Commons (`public/logo.svg`), personal use. Bebas Neue for the scoreboard numbers,
Inter for everything else. Keelan's buttons are crimson, Rein's are black, water is grey.
