# TESTING.md — sports-betting-web

## Test frameworks

**None installed.** No test runner in `package.json` (Verified).

## Test directory structure

None exists.

## Unit / integration / E2E tests

None exist.

## Manual testing performed this session (Verified — actually run)

1. `npm run build` — clean, 0 errors, at commit `26b6d83`.
2. `npm run start -- -p 3412` + `curl` against `/` (open, no `SITE_PASSWORD` set locally), `/changelog`, `/bg-*.png` — all expected status codes.
3. Real login round-trip against the live deployment: `POST /api/login` with the correct password → `{"ok":true}` + cookie → `GET /` with that cookie → 200 (Dashboard, not redirected).
4. Real scan round-trip against the live deployment: `GET /api/scan?sport=mlb&allDates=true` with the auth cookie → real picks with plausible small edges, confirming the full Odds-API + Kalshi + Polymarket + de-vig + matching + scoring pipeline works end-to-end against live external data (not mocked).
5. During initial development, extensive raw `curl` testing against Kalshi's and Polymarket's APIs directly (outside the app) to diagnose and confirm the 3 bugs recorded in `DECISIONS.md` D-005/D-006/D-007.
6. Playwright screenshots of all 4 themes on the live deployment, reviewed visually, confirming the theme-color fix in commit `26b6d83`.

## Test data / fixtures / mocks

None — every test this session hit real, live external APIs and the real, live deployment.

## Test environment variables

For local testing without spending real API credits unnecessarily, `ODDS_API_KEY` must still be a real, valid key (there is no sandbox/mock mode for The Odds API in this codebase) — every local scan test still costs real credits. `SITE_PASSWORD` can be left unset locally for convenience (app runs fully open) — never do this for the deployed Production environment.

## Coverage gaps (Unable to verify / not tested)

- `npm run dev` was never run this session.
- `npm run lint` was run once during the documentation audit and found to launch an interactive ESLint setup wizard (no config exists) rather than a simple check — see `CLAUDE.md`/`TASKS.md` T-005. Intentionally cancelled rather than completed. Actual lint pass/fail status remains unknown.
- The de-vig math (`lib/oddsapi.ts`), Kelly-stake formula, and American-odds conversion (`lib/ev.ts`) have no unit tests — only implicitly exercised by whatever real market data happened to appear during manual scans.
- Team-name matching accuracy (`lib/match.ts`) has not been exhaustively tested against known ambiguous cases (e.g., deliberately testing an LA Angels vs. LA Dodgers/Athletics scenario) — the known limitation (D-009) is documented but not regression-tested.
- Behavior when `SITE_PASSWORD` is unset was tested locally only, never against a real deployment (intentionally — do not test this against Production).
- Narrow-viewport/mobile rendering is unscreenshotted (no CSS breakpoint exists in this repo at all — see `UI_SYSTEM.md`).
- The 4 NBA/NFL/EPL/MLS sports were spot-checked less thoroughly than MLB/WNBA during original development (MLB and WNBA are where the 3 real bugs were found and fixed; the other 4 sports use the same code paths but weren't independently re-verified to the same depth this specific audit).

## Critical untested flows

- What happens on a genuine Odds API outage/error mid-scan (the 502 path exists in code but real-world triggering of it was not observed this session).
- Kalshi or Polymarket being unreachable (both fail silently — return empty arrays rather than throwing — per `API_REFERENCE.md`; this "graceful degradation" behavior itself has not been deliberately triggered and observed, only reasoned about from the code).

## Known flaky tests

None — no automated tests exist to be flaky. **Note:** results ARE inherently non-deterministic run-to-run in a different sense — every scan hits live, changing market data, so re-running the exact same scan can legitimately produce different picks. This is expected behavior, not flakiness.

## Manual smoke-test checklist (run this after any change)

1. `npm run build` — must complete with 0 errors.
2. `npm run start -- -p <port>` — visit `http://localhost:<port>/`. If `SITE_PASSWORD` is set locally, confirm redirect to `/login`; log in; confirm redirect back.
3. Click each sport tab — confirm the active tab's color matches the current theme (this exact check would have caught the D-008 bug).
4. Click "Scan" — confirm either real picks appear or a clear error message shows (missing API key, wrong sport, etc.) — never a silent blank state with no explanation.
5. Toggle "Today & tomorrow" / "All upcoming" — confirm the `eventsInWindow`/`eventsScanned` stats change accordingly.
6. Click each of the 4 theme swatches — confirm background, panel colors, active-tab color, and hero-card colors (if any suggested picks are showing) all change correctly.
7. Visit `/changelog` — confirm it loads without requiring login.
8. Confirm `/bg-dark.png`, `/bg-light.png`, `/bg-vegas.png`, `/bg-field.png`, `/icon.png` all return 200.

## Pre-deployment checks

Same checklist as above, run once locally and once against the live URL after `vercel --prod --yes`. Additionally: confirm `ODDS_API_KEY` and `SITE_PASSWORD` are still set correctly on Vercel (`vercel env ls`) before assuming a deploy is fully functional — a code change can be perfect and the app can still 501/be-wide-open if an env var was accidentally removed.
