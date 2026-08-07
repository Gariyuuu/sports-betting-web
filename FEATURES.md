# FEATURES.md — sports-betting-web

Status classifications: Verified complete / Mostly complete / Partially implemented / UI only / Backend only / Mocked / Planned / Broken / Deprecated / Unable to verify.

---

## 1. Password gate

- **Purpose:** Prevent random visitors from burning paid Odds API credits.
- **User flow:** Visit `/`, get redirected to `/login`, enter password, redirected back to `/`.
- **Status: Verified complete.** Full round trip tested this session with the real, currently-set password (value not recorded in docs — see `SECURITY.md`).
- **Frontend files:** `app/login/page.tsx`.
- **Backend files:** `app/api/login/route.ts`, `lib/auth.ts`, `app/page.tsx` (the gate itself).
- **Database dependencies:** None.
- **Environment variables:** `SITE_PASSWORD`.
- **Validation:** Password checked via constant-time SHA-256 comparison.
- **Error states:** Wrong password → 403 after a 1-second delay (basic brute-force friction), shown inline on the login form.
- **Edge cases:** If `SITE_PASSWORD` is unset entirely, the app becomes fully open (`isAuthEnabled()` returns false, `isValidCookieToken()` returns true unconditionally) — this is a deliberate convenience for local dev, not a production configuration (Production has `SITE_PASSWORD` set — Verified).
- **Known issues:** No logout button/route exists (see `CLAUDE.md` Known issues). No `middleware.ts` — any brand-new route added later needs its own explicit check or it will be unprotected (structural risk, not a current bug).

## 2. +EV scan (the core feature)

- **Purpose:** Find Kalshi/Polymarket contracts priced below sportsbook-consensus fair value.
- **User flow:** Pick a sport tab, pick a date window (Today & tomorrow / All upcoming), click Scan, see results as gold hero cards (suggested bets) + a sortable-by-edge table (other positive-edge picks).
- **Status: Verified complete for the v1-scoped feature set** (moneyline only, 6 sports, no tennis/boxing/alt-lines/season-record/chat). Confirmed working end-to-end against live data this session, including after fixing 3 real bugs (see `DECISIONS.md`).
- **Frontend files:** `app/Dashboard.tsx`.
- **Backend files:** `app/api/scan/route.ts`, `lib/oddsapi.ts`, `lib/kalshi.ts`, `lib/polymarket.ts`, `lib/match.ts`, `lib/pick.ts`, `lib/ev.ts`, `lib/sports.ts`.
- **Database dependencies:** None.
- **External integrations:** The Odds API (paid), Kalshi (public), Polymarket (public).
- **Environment variables:** `ODDS_API_KEY`.
- **Permissions:** Requires the auth cookie (checked independently in this route).
- **Validation:** `sport` param validated against the known `SPORTS` list (400 if unknown). No validation on `allDates` beyond a string-equality check (`=== "true"`) — any other value behaves as `false`, which is safe/expected, not a bug.
- **Error states:** Missing `ODDS_API_KEY` → 501 with a clear message (handled gracefully). Odds API error → mapped status or 502. Unauthenticated → 401.
- **Loading states:** `Dashboard.tsx` shows "Scanning…" on the button while the fetch is in flight.
- **Empty states:** "No picks here right now." shown per-section if a scan returns zero results for that bucket.
- **Edge cases handled:** Ambiguous Polymarket matches (more than one candidate `FairLine` fits) are dropped rather than guessed. Kalshi markets outside the ±30-hour window of any known game are skipped. Untradeable prices (outside 0.02–0.98) are filtered in `lib/ev.ts`'s `isTradeable()`.
- **Known limitation (accepted, not a bug):** Team-name matching is fuzzy/best-effort (`lib/match.ts`), not a maintained alias table. City-collision teams (e.g., "LA" abbreviations) are a known weak spot.
- **Tests:** None automated. Verified manually against live data this session.
- **Remaining work:** Tennis/boxing, alt-line (spread/total/BTTS) enrichment, season-record "hit rate" context, and a chat assistant all exist in the original Python bot and are **explicitly not ported** (v1 scope, stated in-app via the banner on `Dashboard.tsx` and in `lib/sports.ts`'s header comment).

## 3. Sport selector (6 sports)

- **Purpose:** Let the user pick which sport to scan.
- **Status: Verified complete** for the 6 configured sports (MLB, NBA, WNBA, NFL, EPL, MLS). Each sport's `oddsKey`/`kalshiSeries`/`polyTag` were verified against the live APIs during original development (not guessed) — see `DECISIONS.md`.
- **Frontend files:** `app/Dashboard.tsx` (renders tabs from `lib/sports.ts`'s `SPORTS` array).
- **Known issues:** None currently — but adding a 7th sport without re-verifying its identifiers against the live APIs risks repeating past bugs (see `DECISIONS.md`).

## 4. Date window filter (Today & tomorrow / All upcoming)

- **Purpose:** Narrow results to near-term games by default (matches the original bot's default behavior), with an escape hatch to see everything The Odds API currently has lines for.
- **Status: Verified complete.**
- **Backend files:** `app/api/scan/route.ts`'s `isTodayOrTomorrowOrAll()` (UTC calendar-day comparison).
- **Known issues:** None. Note: this is a UTC-day comparison, not the visitor's local timezone — for a solo/personal tool this is an accepted simplification, not flagged as a bug.

## 5. Theme wheel (4 themes)

- **Purpose:** Same as sibling repo — visual variety, persisted per-browser.
- **Status: Verified complete**, including after fixing the cross-theme gold-color bug this session (see `PROJECT_STATE.md`/`DECISIONS.md`).
- **Frontend files:** `app/ThemeWheel.tsx`, `app/layout.tsx`, `app/globals.css`.

## 6. Patch notes / changelog page

- **Purpose:** Same as sibling repo.
- **Status: Verified complete.** Hand-maintained static array, public/unauthenticated (deliberate — no API cost to view it).
- **Frontend files:** `app/changelog/page.tsx`.

## Features NOT present (explicitly, to prevent future re-discovery effort)

- No tennis or boxing scanning (rotating Odds API keys for tournaments — not implemented).
- No spread/total/BTTS alternate-market enrichment.
- No season-record / "hit rate" context alongside picks.
- No chat assistant (the original Python bot has an Anthropic-powered chat; this app does not).
- No logout mechanism.
- No user accounts (one shared password, no per-user anything).
- No database, no history of past scans, no bet tracking/settlement.
- No real betting/order placement on Kalshi or Polymarket — this is a scanner/finder tool only, never places a trade.
