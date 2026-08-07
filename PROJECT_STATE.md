# PROJECT_STATE.md — sports-betting-web

**Audit timestamp:** 2026-08-07, fourth pass (account-switch checkpoint C-004)
**Current branch:** `main`
**Latest commit at start of this pass:** `174ff9d` — "docs: add full handoff documentation system" (the user committed the 17-file doc set that C-003 had left uncommitted; application code is unchanged since `26b6d83`)
**Working tree:** Was clean at the start of this pass (Verified via `git status` — no untracked/modified files; the 17-file doc set is fully committed, contrary to what earlier drafts of this file and `TASKS.md`/`HANDOFF.md`/`CLAUDE.md` said). This pass adds `README.md` (previously missing — the 17th file) and corrects those stale "17 untracked files, HEAD at `26b6d83`" claims across the doc set; those changes are committed as a single new commit at the end of this pass — run `git log --oneline -3` to see its hash.

---

## Active development objective

None. The v1 feature set (Odds-API-vs-Kalshi/Polymarket +EV scanner) is complete and deployed. The only activity since has been two documentation/checkpoint passes (this being the second), neither of which changed application behavior.

## Last completed task

**This account-switch checkpoint (fourth pass, C-004)** (see `TASKS.md`'s "Current task" for the full objective/completed/remaining/acceptance-criteria breakdown). Summary: discovered the 17-file doc set (which C-003 described as untracked) had since been committed by the user as `174ff9d`, but `PROJECT_STATE.md`/`TASKS.md`/`HANDOFF.md`/`CLAUDE.md`/`SESSION_LOG.md` still claimed HEAD was `26b6d83` with 17 untracked files — a real, confirmed contradiction between the docs and actual repo state, now fixed. Created the previously-missing `README.md` (the repo had 16/17 canonical files). Re-ran `npm run build` fresh (clean, 0 errors). Re-checked this repo specifically for the sibling `sports-betting-project` repo's known plaintext-credential exposure (Odds API key + Anthropic key) — **not present here**: no tracked file contains a real secret (Verified via `git grep` across all tracked files for key/password/token patterns and 32+ char hex strings — zero real hits), and `.env.local` (gitignored, untracked) contains only a short-lived Vercel-managed `VERCEL_OIDC_TOKEN`, nothing resembling the sibling repo's keys.

Before that (third pass, C-003, 2026-08-06): re-verified git state (was still `26b6d83` at that time, still 17 untracked doc files at that time — this was accurate when written, it just was never updated after the user later committed those files), re-ran `npm run build` fresh (clean), re-ran a secret-leak grep across every doc file (clean).

Before that (first audit, same day): `.tab.active`, `button.primary`'s box-shadow, and `.pick-card`'s background/border/glow in `app/globals.css` were using hardcoded `rgba(237,161,0,...)` (gold) instead of `var(--gold)`, so they stayed gold-tinted even in the Vegas (pink) and Field (green) themes. Fixed with `color-mix(in srgb, var(--gold) N%, transparent)`. Verified via fresh Playwright screenshots of the live deployment showing the active MLB tab correctly picking up pink in Vegas and staying gold-by-design in Field (Field's `--gold` variable is intentionally still a yellow accent — see `DECISIONS.md`).

## Current unfinished task

None in terms of application features. This checkpoint itself is the only active "task" and is complete as of this writing (see `TASKS.md`).

## Files related to the (non-existent) unfinished feature task

N/A — no feature work is pending. See `TASKS.md` for the checkpoint task's own file list (it touches only documentation files).

## What has already been attempted

Everything attempted this session succeeded and is deployed. One idea was tried and explicitly rejected: decorative "light beam" shapes on the Stadium (dark) background PNG looked bad ("flat solid triangles") and were removed before shipping — see `DECISIONS.md`.

## What currently works (Verified this session)

- `npm run build` completes cleanly (0 errors), re-run fresh this pass at commit `174ff9d` (app code identical to `26b6d83`, only docs changed since).
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

1. **(Optional, not blocking)** Create a real `.env.example` with `ODDS_API_KEY=` and `SITE_PASSWORD=` placeholders — none exists today, which is a minor onboarding gap for a fresh clone.
2. **(Optional, not blocking)** Set `ODDS_API_KEY` and `SITE_PASSWORD` for Vercel's Preview and Development environments too, if Preview deployments are ever going to be used — currently Production-only.
3. **(Optional, not blocking)** Consider whether to rotate `ODDS_API_KEY` away from the previously-flagged, plaintext-elsewhere key it currently reuses (see `CLAUDE.md` for the full context) — this is the user's call, not something to do unilaterally.

## Verification required before continuing any new task

- Run `git status` and `git log --oneline -5` to confirm no one has pushed additional commits since this audit's HEAD (should be at or past this checkpoint's commit — see the top of this file for the exact hash to look for).
- Run `npm run build` to confirm the build is still clean.
- If touching anything in `lib/kalshi.ts`, `lib/polymarket.ts`, or `lib/oddsapi.ts`: re-verify the relevant upstream API's current behavior with a raw `curl` before trusting this doc's description of it — these three integrations have a proven history of surprising, undocumented-by-the-provider behavior (see `DECISIONS.md`).
- If touching `app/globals.css`: re-check all 4 themes visually before considering the change done.
