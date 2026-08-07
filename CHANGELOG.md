# CHANGELOG.md — sports-betting-web

This mirrors the in-app patch notes (`app/changelog/page.tsx`) plus records this documentation handoff. Keep both in sync per `CLAUDE.md`'s permanent rules.

## [Unreleased] — Documentation handoff — 2026-08-06

**No product behavior was intentionally changed in this entry.** Documentation-only audit.

- Created a full 17-file permanent memory/handoff system: `CLAUDE.md`, `PROJECT_STATE.md`, `ARCHITECTURE.md`, `FILE_MAP.md`, `FEATURES.md`, `TASKS.md`, `ROADMAP.md`, `DECISIONS.md`, `DATABASE.md`, `API_REFERENCE.md`, `UI_SYSTEM.md`, `SECURITY.md`, `TESTING.md`, `DEPLOYMENT.md`, this `CHANGELOG.md`, `SESSION_LOG.md`, `HANDOFF.md`.
- Audit found: zero TODO/FIXME/HACK/placeholder/mock markers in the codebase; no `.env.example` exists (recorded as a task); `ODDS_API_KEY`/`SITE_PASSWORD` only configured for Vercel's Production environment, not Preview/Development (recorded as a task); no `middleware.ts` exists, meaning auth is enforced per-route rather than centrally (recorded as a structural risk in `SECURITY.md`/`TASKS.md`); one CSRF-adjacent minor gap on `/api/scan` (a GET route with a real-money-adjacent cost side effect) noted in `SECURITY.md`.
- No files were deleted, no dependencies changed, no application code was modified as part of this audit, apart from documentation files themselves.

## v0.4.0 — 2026-08-05

- Real favicon/app icon (target mark) instead of the blank default.
- Replaced the light/dark slider with a 4-way theme wheel: Stadium (dark), Paper (light), Vegas, Field.
- Regenerated every background: stronger, more visible glow + dot grid in the dark themes; near-solid, minimal Paper background.
- (Follow-up fix, same version line) Fixed cross-theme color leaks: active tab and hero card stayed gold in Vegas/Field themes.

## v0.3.0 — 2026-08-05

- Real PNG background art for dark and light modes — stadium glow + scoreboard dot grid.
- Light/dark theme slider in the header, persisted per-browser.
- New site password (rotated login).

## v0.2.0 — 2026-08-05

- Redesigned as a sportsbook-style scanner: emoji sport-pill tabs, gold "suggested bets" hero cards with big edge numbers.
- Added a mini edge-meter bar to the results table and Kalshi/Polymarket color-coded platform badges.

## v0.1.0 — 2026-08-05

- Initial +EV scanner, porting the moneyline-scanning core of sports_betting_bot.py to Next.js.
- De-vigged sportsbook consensus (The Odds API) compared against live Kalshi and Polymarket prices for MLB/NBA/WNBA/NFL/EPL/MLS.
- Quarter-Kelly staking against a $250 per-platform bankroll; "suggested" band matches the original -200 to -1000 favorite filter.
- Fixed three matching bugs found while testing against live data: Kalshi's status=open filter returning the wrong market set, Kalshi's close_time being days after the actual game, and Polymarket spread markets being mistaken for moneylines.
- Password-gated (fresh password, not the original plaintext scheme) and deployed to Vercel.
