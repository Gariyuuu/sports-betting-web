# HANDOFF.md — sports-betting-web

Short, high-signal onboarding for a brand-new Claude Code account with zero access to prior conversations.

## What is this project?

A password-gated Next.js app that scans for +EV (positive expected value) betting opportunities: it compares de-vigged sportsbook consensus odds (from the paid Odds API) against live Kalshi and Polymarket prediction-market prices, for moneyline bets across 6 sports (MLB, NBA, WNBA, NFL, EPL, MLS). It's a v1, deliberately-narrower-than-the-original port of a Python CLI bot (`~/Projects/sports-betting-project`). Deployed live on Vercel, gated behind a shared password because each scan spends real API credits.

## What should I read first?

In order: `CLAUDE.md` → `PROJECT_STATE.md` → `TASKS.md` → (for the data/matching logic) `ARCHITECTURE.md` and `DECISIONS.md` D-005/D-006/D-007/D-009 → (for auth) `SECURITY.md`.

## What is the current task?

**T-006 — real Web Push notifications for new +EV picks (v0.5.0).** Code complete, `npm run build` clean, deployed to production, `CRON_SECRET` auth path verified live via `curl`. **One manual, non-code step remains:** connect Upstash Redis via Vercel's Storage tab (Marketplace Database Providers → Upstash → Redis → connect to `sports-betting-web`) — until then, `/api/cron/scan` returns a graceful 501 instead of running (by design, not a bug; it does not spend Odds API credits while unconfigured). See `PROJECT_STATE.md`'s Blockers section and `TASKS.md`'s T-006 for the full detail. Once connected, no further code changes are expected — just verify one real end-to-end push arrives for a new pick.

## What was the previous agent doing?

Building the scanner from scratch (2026-08-05, found and fixed 3 real integration bugs the same day via live API testing), then UI/UX iteration in lockstep with the sibling `hyperliquid-bot-web` repo (redesign → real backgrounds + slider → password rotation → 4-theme wheel + real favicon after user feedback that light mode was ugly), then a cross-theme color bug found and fixed, then a full documentation audit (task `C-001`) with no application code changes — during which a real secret-leak near-miss was caught and corrected (see `SESSION_LOG.md`). Then a second checkpoint pass (task `C-002`) adding one previously-undocumented design decision (`DECISIONS.md` D-010). Then a third checkpoint pass (task `C-003`) re-verifying everything again and specifically confirming this repo does not share the sibling `sports-betting-project` repo's on-disk plaintext-credential exposure — that pass left the 17 doc files uncommitted pending the user's decision. **The user then committed them** (commit `174ff9d`), but no subsequent pass had updated the docs to say so until now. This entry (task `C-004`) found that exact contradiction (docs still claimed 17 untracked files at HEAD `26b6d83`), fixed it across every affected file, added the previously-missing `README.md`, and re-ran the secret scan (clean).

## What works right now?

Everything. Real login+scan round trip against live external data confirmed working this session. See `PROJECT_STATE.md`.

## What is broken?

Nothing known. Zero open bugs. There ARE documented, accepted limitations that are not bugs: v1 scope (no tennis/boxing/alt-lines/chat), fuzzy (not alias-table) team matching, no `middleware.ts` for auth, env vars only set for Production.

## What should I do next?

Nothing required — the doc-commit question from earlier checkpoints is resolved (all 17 files, including `README.md`, are committed). If given a new task, do it per `CLAUDE.md`. Optional picks if you want somewhere to start: `TASKS.md` T-003 (add `middleware.ts`) or T-004 (improve team matching) are the most valuable non-required improvements.

## Which files are most important?

`app/api/scan/route.ts` + `lib/oddsapi.ts` + `lib/kalshi.ts` + `lib/polymarket.ts` + `lib/match.ts` + `lib/pick.ts` + `lib/ev.ts` (the entire scan pipeline), `lib/auth.ts` + `app/page.tsx` (the auth gate), `app/globals.css` (all styling and theming).

## Which areas are dangerous to modify?

1. **`lib/auth.ts`'s `timingSafeEqual` usage** — don't simplify to `===`.
2. **`lib/kalshi.ts`'s deliberate absence of a `status` query param, and its use of `expected_expiration_time`** — both are hard-won fixes for real, counterintuitive API behavior (D-005/D-006). Reverting either reintroduces a real bug.
3. **`lib/polymarket.ts`'s `question === event.title` moneyline check** — removing it lets spread/total markets be miscounted as moneylines with wildly wrong computed edges (D-007).
4. **`lib/pick.ts`'s `makePick()` filter** — the gate that prevents untradeable/non-positive-EV picks from appearing.
5. **Any hardcoded color in `app/globals.css`** — already caused a real bug here (D-008), same rule as sibling repo.
6. **The `ODDS_API_KEY` env var and anything that could leak it** — it costs real money; never log full request URLs or echo it in client-facing errors (current code doesn't, keep it that way).

## Which commands should I run first?

```
cd ~/Projects/sports-betting-web
git status                 # confirm clean tree
git log --oneline -5       # confirm you're at or past this checkpoint's commit (was 174ff9d + a doc-fix commit as of 2026-08-07)
npm install                # if node_modules isn't already present
npm run build               # confirm still clean
vercel env ls               # confirm ODDS_API_KEY and SITE_PASSWORD are still set
```

## How do I verify the app still works?

Local: `npm run start -- -p 3412`, visit `http://localhost:3412/` (runs fully open if `SITE_PASSWORD` isn't set in your local env — that's expected for local dev, never deploy that way). For a real check, hit the live deployment: `POST /api/login` with the real password (retrieve from Vercel, never from a doc file — see `SESSION_LOG.md` for why that matters), then `GET /api/scan?sport=mlb&allDates=true` with the resulting cookie, and confirm real picks come back. See `TESTING.md` for the full manual smoke-test checklist.

---

## Prompt for the next Claude Code account

```
Read CLAUDE.md, PROJECT_STATE.md, TASKS.md, and HANDOFF.md in this repository in full.
Then run `git status`, `git log --oneline -10`, and `vercel env ls`, and compare against what
those files claim. Then run `npm run build` and confirm it is still clean. Summarize your
understanding of this project's current state in a few sentences before making any change. If
you find any contradiction between the docs and the actual repository state, or any documentation
that looks stale, say so explicitly before proceeding — do not silently trust or silently discard
it. This has actually happened before in this exact repo: as of the C-003 checkpoint (2026-08-06)
the docs said "17 documentation files sit uncommitted, pending the user's decision" — the user
then committed them (commit `174ff9d`), and nobody updated the docs to say so until the C-004
checkpoint (2026-08-07) caught it. Don't assume a doc claim about git/commit state is still true;
verify it against `git log`/`git status` directly every time. Do not redo any already-completed
work described in CHANGELOG.md or SESSION_LOG.md. Preserve the existing architecture (no database,
cookie-based shared-password auth, three independent external-API integrations with hard-won
quirk-handling already in place, CSS-variable-driven theming) unless there is a strong, explicitly
stated reason to change it. Never write a real secret value (ODDS_API_KEY, SITE_PASSWORD, or any
cookie token) into any file in this repository — before finishing any task, grep tracked files for
secret-shaped strings (this repo's sibling, sports-betting-project, has had a real plaintext-key
leak, so take this seriously). After completing whatever task you're given, update PROJECT_STATE.md,
TASKS.md, append to SESSION_LOG.md, and update any other documentation file your change affects,
per the permanent rules in CLAUDE.md.
```
