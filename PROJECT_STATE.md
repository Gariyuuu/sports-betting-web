# PROJECT_STATE.md — sports-betting-web

**Audit timestamp:** 2026-08-06, third pass (account-switch checkpoint; first two documentation audits were earlier the same day)
**Current branch:** `main`
**Latest commit:** `26b6d83703aebb5520ea2188366ab07706a7dad9` — "Fix cross-theme color leaks: active tab and hero card stayed gold in Vegas/Field themes" (unchanged since the first audit — no application code has changed across any of the three checkpoint passes)
**Working tree:** **Not clean.** 17 untracked documentation files exist at the repo root (`API_REFERENCE.md`, `ARCHITECTURE.md`, `CHANGELOG.md`, `CLAUDE.md`, `DATABASE.md`, `DECISIONS.md`, `DEPLOYMENT.md`, `FEATURES.md`, `FILE_MAP.md`, `HANDOFF.md`, `PROJECT_STATE.md`, `ROADMAP.md`, `SECURITY.md`, `SESSION_LOG.md`, `TASKS.md`, `TESTING.md`, `UI_SYSTEM.md`) — Verified via `git status --short`. These are the permanent memory/handoff system created during the first audit and refreshed during this checkpoint; **no application source file is uncommitted.** Left uncommitted deliberately, pending the user's explicit instruction to commit.

---

## Active development objective

None. The v1 feature set (Odds-API-vs-Kalshi/Polymarket +EV scanner) is complete and deployed. The only activity since has been two documentation/checkpoint passes (this being the second), neither of which changed application behavior.

## Last completed task

**This account-switch checkpoint (third pass, C-003)** (see `TASKS.md`'s "Current task" for the full objective/completed/remaining/acceptance-criteria breakdown). Summary: re-verified git state (still `26b6d83`, still the same 17 untracked doc files), re-ran `npm run build` fresh (clean, 0 errors), specifically checked this repo for the sibling `sports-betting-project` repo's known plaintext-credential exposure (Odds API key + Anthropic key) — **not present here**, this repo's `.env.local` contains only a Vercel-managed `VERCEL_OIDC_TOKEN`, and `ODDS_API_KEY`/`SITE_PASSWORD` live only in Vercel's env store, never on local disk — and re-ran a secret-leak grep across every doc file (clean, one harmless false positive on the full git commit hash). No drift found since the second pass (C-002).

Before that (first audit, same day): `.tab.active`, `button.primary`'s box-shadow, and `.pick-card`'s background/border/glow in `app/globals.css` were using hardcoded `rgba(237,161,0,...)` (gold) instead of `var(--gold)`, so they stayed gold-tinted even in the Vegas (pink) and Field (green) themes. Fixed with `color-mix(in srgb, var(--gold) N%, transparent)`. Verified via fresh Playwright screenshots of the live deployment showing the active MLB tab correctly picking up pink in Vegas and staying gold-by-design in Field (Field's `--gold` variable is intentionally still a yellow accent — see `DECISIONS.md`).

## Current unfinished task

None in terms of application features. This checkpoint itself is the only active "task" and is complete as of this writing (see `TASKS.md`).

## Files related to the (non-existent) unfinished feature task

N/A — no feature work is pending. See `TASKS.md` for the checkpoint task's own file list (it touches only documentation files).

## What has already been attempted

Everything attempted this session succeeded and is deployed. One idea was tried and explicitly rejected: decorative "light beam" shapes on the Stadium (dark) background PNG looked bad ("flat solid triangles") and were removed before shipping — see `DECISIONS.md`.

## What currently works (Verified this session)

- `npm run build` completes cleanly (0 errors) at commit `26b6d83`.
- Live production URL (`https://sports-betting-web.vercel.app`) — `/login`, `/changelog`, `/icon.png`, all 4 `public/bg-*.png` return HTTP 200.
- `POST /api/login` with the currently-set `SITE_PASSWORD` value (Verified working this session; the value itself is intentionally **not recorded in this file** — it is a secret; retrieve it from the Vercel dashboard/CLI if needed, never write it into a committed file) returns `{"ok":true}` and sets a working cookie.
- With that cookie, `GET /` returns 200 (the Dashboard, not a redirect to `/login`).
- `GET /api/scan?sport=mlb&allDates=true` (with the cookie) returns real, live picks — spot-checked this session and produced plausible small (1–5%) edges after the Polymarket-moneyline-detection bug was fixed (see `DECISIONS.md`), which is exactly the expected signature of a working de-vig calculation against a reasonably efficient prediction market.
- All 4 themes (Stadium/Paper/Vegas/Field) render correctly and distinctly, including the active-tab and hero-card colors after the fix in the latest commit (Verified via Playwright screenshots against the live deployment).
- Theme selection persists via `localStorage` (`sbw-theme`).

## What currently fails

Nothing known. No open bugs.

## Errors currently observed

None.

## Blockers

None.

## Assumptions currently in effect

- Assuming the Vercel project `garywangsmes-8349s-projects/sports-betting-web` remains linked to the same GitHub repo/Vercel account.
- Assuming The Odds API, Kalshi, and Polymarket's public API contracts (endpoints, field names, `status` semantics) have not changed since last exercised this session. **This is a real, demonstrated risk** — this exact session found 3 real bugs caused by upstream API behavior not matching initial assumptions (see `DECISIONS.md`). Any future issue where picks stop appearing or look wrong should first re-verify these three APIs' current behavior with raw `curl` before assuming the bug is in this repo's code.
- Assuming `ODDS_API_KEY` (the reused, previously-flagged key — see `CLAUDE.md`) is still valid and has remaining credits. Not independently re-checked at the exact moment of this audit beyond the scan spot-check above succeeding.

## Temporary decisions

None currently in effect that diverge from documented architecture.

## Next three recommended actions

0. **(Needs the user's decision, not the AI's)** Decide whether to `git add` + `git commit` the 17 untracked documentation files (same situation in the sibling `hyperliquid-bot-web` repo). Complete and accurate as of this checkpoint, deliberately left uncommitted.
1. **(Optional, not blocking)** Create a real `.env.example` with `ODDS_API_KEY=` and `SITE_PASSWORD=` placeholders — none exists today, which is a minor onboarding gap for a fresh clone.
2. **(Optional, not blocking)** Set `ODDS_API_KEY` and `SITE_PASSWORD` for Vercel's Preview and Development environments too, if Preview deployments are ever going to be used — currently Production-only.
3. **(Optional, not blocking)** Consider whether to rotate `ODDS_API_KEY` away from the previously-flagged, plaintext-elsewhere key it currently reuses (see `CLAUDE.md` for the full context) — this is the user's call, not something to do unilaterally.

## Verification required before continuing any new task

- Run `git status` and `git log --oneline -5` to confirm no one has pushed additional commits since this audit's HEAD (`26b6d83`).
- Run `npm run build` to confirm the build is still clean.
- If touching anything in `lib/kalshi.ts`, `lib/polymarket.ts`, or `lib/oddsapi.ts`: re-verify the relevant upstream API's current behavior with a raw `curl` before trusting this doc's description of it — these three integrations have a proven history of surprising, undocumented-by-the-provider behavior (see `DECISIONS.md`).
- If touching `app/globals.css`: re-check all 4 themes visually before considering the change done.
