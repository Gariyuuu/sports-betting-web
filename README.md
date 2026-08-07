# sports-betting-web

A password-gated Next.js app that scans for **+EV (positive expected value)** betting
opportunities: it compares de-vigged sportsbook consensus odds (from the paid
[Odds API](https://the-odds-api.com/)) against live [Kalshi](https://kalshi.com) and
[Polymarket](https://polymarket.com) prediction-market prices, for moneyline bets across
6 sports (MLB, NBA, WNBA, NFL, EPL, MLS).

**Live:** https://sports-betting-web.vercel.app (password-gated)

This is a **v1, moneyline-only subset** of a separate Python CLI bot
(`~/Projects/sports-betting-project`) — a from-scratch TypeScript reimplementation of
just the core scanning logic, not a shared codebase. Tennis/boxing, alt-line
(spread/total/BTTS) enrichment, season-record "hit rate" context, and the original bot's
chat assistant are **not** ported here.

## What it does

1. Fetches sportsbook consensus odds from The Odds API and de-vigs them into a "fair
   probability" per team.
2. Fetches live Kalshi and Polymarket prices for the same games.
3. Fuzzy-matches team names across all three sources.
4. Computes edge / EV / Kelly-stake for every match found.
5. Shows "suggested" bets (favorites in the -200 to -1000 American-odds band) as hero
   cards, plus everything else in a sortable table.

No database, no bet placement — this is a scanner/finder tool only.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Plain CSS (`app/globals.css`), 4-theme system (Stadium/Paper/Vegas/Field)
- No database — every scan is a fresh, live fetch from 3 external APIs
- Auth: single shared password → SHA-256 token → httpOnly cookie (no user accounts)
- Hosted on Vercel

## Running locally

```bash
npm install
npm run dev
```

Create a `.env.local` (gitignored) with:

```
ODDS_API_KEY=your_odds_api_key_here
SITE_PASSWORD=optional_local_password
```

- `ODDS_API_KEY` is required to exercise the scan feature — without it, `/api/scan`
  returns a graceful 501.
- If `SITE_PASSWORD` is omitted, the app runs fully open locally (convenient for local
  testing — never deploy that way).

Then visit `http://localhost:3000/`.

## Documentation

This repo carries a full documentation set for account-switch handoffs — start with
`CLAUDE.md`, then `PROJECT_STATE.md` and `TASKS.md`. See `ARCHITECTURE.md`,
`FEATURES.md`, `SECURITY.md`, `DEPLOYMENT.md`, and `HANDOFF.md` for deeper detail.
