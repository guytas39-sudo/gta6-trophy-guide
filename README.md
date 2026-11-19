# Leonida Legend — GTA VI Trophy Guide & Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/guytas39-sudo/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/guytas39-sudo/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

A static, fully offline web app: a guide and progress tracker for all **55 Grand Theft Auto VI PlayStation 5 trophies** — 1 Platinum, 2 Gold, 6 Silver, 46 Bronze, 28 of them hidden.

## What's inside

- **A guide for every trophy**, in our own words, with concrete steps and a **Sources line on every entry** (PowerPyx, GTABase, Planet GTA 6's mirror of the Exophase/PSNProfiles list, Output Lag, EGamers.io, U7Buy, GTA Zone). Where a trigger is not confirmed at launch — five trophies are officially "not yet known" — the guide says so plainly and labels community beliefs as beliefs instead of inventing steps.
- **A seven-stage platinum roadmap** (setup → story → strands → 100% checklist → grinds → money → one-offs/Platinum) with time estimates explicitly labelled as estimates (~200 h total per PowerPyx/U7Buy; story 60–80 h per PowerPyx), ground rules (cheats off, keep up to 15 manual saves, no mission replay), and clickable trophy chips per stage.
- **Missable flags**: exactly one trophy is flagged at launch — **Positive Mental Attitude**, whose Chapter 1 meditation spot becomes unavailable after Chapter 1 (PowerPyx/GTABase), with the launch caveat stated in the app. Everything else is documented as free-roam-safe.
- **A real tracker**: per-trophy checkboxes persisted in `localStorage`, live progress (count, %, per-grade counts, hidden remaining), counters for the trophies PlayStation tracks (250 stunts, 42 range golds, 500 profile actions…), **export/import of progress as JSON with validation**, and reset.
- **Filters & spoiler shield**: search, grade chips, kind filter (story / strangers / activities / collectibles / robberies / world & feats / money & property / completion), earned status, missable-only — plus a **spoiler shield, on by default**, that masks the name, description and guide of all 28 hidden trophies until they are earned or peeked.

## Run it

```sh
node serve.ts            # serves app/ at http://localhost:8080
```

…or serve the `app/` folder with any static file server and open `index.html`. There is no build step and the app loads nothing over the network — it runs entirely from its own files.

## Layout

- `app/` — the guide itself: `index.html`, `style.css`, `app.js`, `data/trophies.json` (the official list + guides), `data/roadmap.json` (the roadmap)
- `main.ts` — hands the entry in: copies `app/` and `screenshots/` to the output and writes `dossier.json` via `vendor/makefun-frontend.ts` (kit library, unchanged)
- `screenshots/` — real renders of the app, taken by its maker
- `serve.ts` — the tiny local dev server above

The design is original (a neon-sunset Leonida look, hand-drawn inline SVG) — no Rockstar logos, artwork or fonts.

---

<sub>Entered on [make.fun](https://make.fun/?ref=g2zdh0s8&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
