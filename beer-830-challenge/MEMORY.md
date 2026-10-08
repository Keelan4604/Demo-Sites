---
title: Beer Tracker (beer.keelanodoherty.org)
project: beer-tracker
type: hub
status: active
updated: 2026-10-08
---

# Beer Tracker

Shared live drink counter for Keelan and Rein. Built 2026-10-08 from `BRIEF.md` (Keelan's ask,
relayed by the IT chat). Replaces the old "8:30 Beer Challenge" demo that was serving the same
subdomain from localStorage only.

| | |
|---|---|
| Live | https://beer.keelanodoherty.org |
| Repo | `github.com/Keelan4604/Demo-Sites`, folder `beer-830-challenge/` (Keelan's call 2026-10-08: reuse the repo the domain already came from). Local clone `C:/Users/Keela/Documents/Websites/demo-sites/` |
| Front end | Cloudflare Pages, static files at this folder's root, no build step |
| API | `functions/api/[[path]].js`, a Pages Function that checks the PIN and forwards to the Durable Object |
| State | Durable Object `Tracker` in the Worker `beer-tracker-do` (`do/`), SQLite-backed, one instance named `main` |
| Live sync | WebSocket at `/api/ws`. Every change is pushed to every open phone. Polling every 6 s as fallback, refetch on wake |
| PIN | Pages secret `PIN`. Phones store it in localStorage after the first entry. Never in the repo |

## How it works

Two side-by-side panels, one per person. Each tap posts `{who, type}` to `/api/event`; the DO
appends it to tonight's event list, saves, and broadcasts the full state to all sockets. Undo
removes that person's last event. "New night" (the header arrow) archives tonight into
`history` with totals and a winner, then starts a fresh night. "Wipe tonight" on the All time
tab discards it without recording.

Standard-drink weights live in both `do/src/index.js` and `public/app.js` and must match:
beer 1, shot 1, seltzer 1, mixed 1.5, car bomb 2, water 0. Pace is standard drinks per hour
since that person's first non-water drink tonight, with a half-hour floor.

Tabs: Tonight (counts, taunt line, panels), Log (tonight's events with times), All time
(nights won, all-time totals by type, past nights, wipe button).

## Deploy

Two deploys, in this order, from this folder (`beer-830-challenge/`) with wrangler logged in
(`npx wrangler login`, Keelan approves in the browser):

```
cd do && npx wrangler deploy && cd ..
npx wrangler pages deploy . --project-name <pages project>
```

The Pages project must carry the DO binding from `wrangler.toml` (`TRACKER` -> `Tracker` in
`beer-tracker-do`) and the `PIN` secret (`npx wrangler pages secret put PIN --project-name <p>`).
The Worker has `workers_dev: false`, so the DO is reachable only through the Pages binding.

The custom domain `beer.keelanodoherty.org` was already attached to the old demo's Pages project.
If that project is GitHub-connected to Demo-Sites with root directory `beer-830-challenge`, a
push to `main` redeploys the static site on its own; the Worker, the DO binding and the PIN still
need the wrangler steps above. If it is a direct-upload project, `deploy.ps1` handles it. Find
the project with `npx wrangler pages project list`.

## Local dev

Two entries in `~/.claude/launch.json`: `beer-do` (wrangler dev on 8788) and `beer-web`
(wrangler pages dev on 4392 with `--do TRACKER=Tracker@beer-tracker-do`), both pointed at this
folder. Start `beer-do` first. Local state lives in `.wrangler/` and is gitignored.

## Theme

Crimson #9E1B32, white, grey #828A8F. Logo is the Alabama Crimson Tide circle mark from
Wikimedia Commons (`public/logo.svg`), personal use. Bebas Neue for the scoreboard numbers,
Inter for everything else. Keelan's buttons are crimson, Rein's are black, water is grey.
