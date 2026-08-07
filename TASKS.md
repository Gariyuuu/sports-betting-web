# TASKS.md — sports-betting-web

Active execution queue. Keep in sync with `PROJECT_STATE.md` and `HANDOFF.md`.

---

## Current task

**C-003 — Account-switch checkpoint (third documentation pass). Status: Complete as of this writing.**

- **Exact objective:** Final pre-account-switch re-verification of the repository's current state against the 17-file memory/handoff system (created in C-001, refreshed in C-002, both earlier the same day) so a brand-new Claude Code account can resume correctly, plus a specific check for whether this repo shares the sibling `sports-betting-project` repo's known on-disk plaintext-credential exposure. No feature work, no application-behavior changes.
- **What has already been completed:**
  1. Re-inspected `git status`, `git log`, `git rev-parse HEAD` — confirmed no application code changed since C-002 (still at commit `26b6d83`, still the same 17 untracked doc files, nothing else untracked or modified).
  2. Read `.env.local` in full and searched the whole repo tree for any other `.env*` file — confirmed the only local env file contains a Vercel-managed `VERCEL_OIDC_TOKEN` and nothing resembling the sibling repo's exposed Odds API / Anthropic keys. `ODDS_API_KEY`/`SITE_PASSWORD` are not present anywhere on local disk in this repo.
  3. Re-ran `npm run build` fresh this pass (not skipped) — clean, 0 errors.
  4. Cross-checked `find app lib public -type f` against `CLAUDE.md`'s documented file tree — exact match, no drift.
  5. Re-ran a secret-value grep across every `.md` file (JWT/API-key-shaped patterns plus literal `ODDS_API_KEY=`/`SITE_PASSWORD=`) — clean; the one regex hit was the full git commit hash in `PROJECT_STATE.md`, a harmless false positive, not a credential.
  6. Updated `PROJECT_STATE.md`'s audit timestamp/last-completed-task and this file's current-task section to reflect the third pass; appended a new dated entry to `SESSION_LOG.md`.
- **What remains:** Nothing for this task itself. This checkpoint is fully complete; the repository reverts to having **no active task** (see "Next up" below for optional, non-required follow-ups).
- **Relevant files:** `PROJECT_STATE.md`, `TASKS.md` (this file), `SESSION_LOG.md`. `CLAUDE.md`, `HANDOFF.md`, and the rest of the doc set were read and spot-checked but needed no correction beyond the current-task cross-reference. No application source files were touched.
- **Known errors:** None encountered during this checkpoint.
- **Blockers:** None.
- **Acceptance criteria:**
  - The "current task" statement reads consistently (in substance) across `CLAUDE.md`, `PROJECT_STATE.md`, `TASKS.md`, and `HANDOFF.md`.
  - No real secret value (`ODDS_API_KEY` or `SITE_PASSWORD` value, or any cookie token) appears in any documentation file — Verified via grep this pass.
  - `npm run build` passes — Verified, re-run fresh this pass.
  - No application file was modified, committed, pushed, or deployed as part of this checkpoint.
- **Verification steps performed:** `git -C . status --short`, `git -C . log --oneline -20`, `git -C . rev-parse HEAD`, full read of `.env.local`, repo-wide `find . -iname "*.env*"`, `npm run build`, `find app lib public -type f` diffed against `CLAUDE.md`'s file tree, `grep -rnE` for secret-shaped strings across all `.md` files.

## Next up

_(Nothing required. Optional improvements below.)_

- **T-001 — Create `.env.example`.**
  - Status: Not started
  - Priority: Low
  - Relevant files: new file `.env.example` at repo root
  - Acceptance criteria: Contains `ODDS_API_KEY=` and `SITE_PASSWORD=` with no real values, plus a one-line comment each explaining purpose (mirror `CLAUDE.md`'s Environment setup table).
  - Notes: Currently no `.env.example` exists at all (Verified) — minor onboarding gap for a fresh clone.

- **T-002 — Set `ODDS_API_KEY`/`SITE_PASSWORD` for Preview and Development Vercel environments.**
  - Status: Not started
  - Priority: Low (only matters if Preview deployments are ever used)
  - Relevant files: none (Vercel project config, not repo files)
  - Notes: Currently Production-only (Verified via `vercel env ls`).

- **T-003 — Add `middleware.ts` to centralize auth enforcement.**
  - Status: Not started
  - Priority: Medium
  - Relevant files: new file `middleware.ts` at repo root; would let you remove the duplicated inline check in `app/api/scan/route.ts` (or keep it as defense-in-depth — product decision)
  - Acceptance criteria: Any new protected route added in the future is protected by default, not opt-in.
  - Notes: Not a current bug — both existing protected surfaces (`app/page.tsx`, `app/api/scan/route.ts`) are correctly gated today. This is about reducing risk for *future* additions.

- **T-004 — Improve team-name matching accuracy.**
  - Status: Not started
  - Priority: Medium
  - Relevant files: `lib/match.ts`
  - Notes: Known, accepted v1 weak spot — city-collision teams (e.g. Kalshi's "LA A" abbreviation) can mismatch. Not a regression, a documented limitation. Would need either a maintained alias table (like the original Python bot's `TEAM_ALIASES`) or smarter disambiguation.

- **T-005 — Decide on an ESLint setup and run it.**
  - Status: Not started (investigated this session)
  - Priority: Low
  - Relevant files: whole repo; would add a new `.eslintrc.json`/`eslint.config.mjs` + a devDependency
  - Notes: `npm run lint` was run this session and found to launch an interactive setup wizard (no ESLint config exists; `next lint` is deprecated, removal planned in Next.js 16) rather than performing a simple check. Deliberately cancelled rather than completed — see identical situation and reasoning in the sibling `hyperliquid-bot-web` repo's `TASKS.md` T-002.

## Blocked

_(None.)_

## High priority

_(None open.)_

## Medium priority

- T-003, T-004 (see above)

## Low priority

- T-001, T-002 (see above)

## Bugs

_(None open. Three were found and fixed this session — see Recently completed.)_

## Technical debt

- No test suite covering de-vig math, matching heuristics, or Kelly-stake calculation.
- No `middleware.ts` (see T-003).
- No `.env.example` (see T-001).
- No ESLint config committed despite `npm run lint` being a defined script.

## Testing needed

- `npm run dev` was never run this session (only `npm run build` + `npm run start`).
- `npm run lint` was never run this session.
- Negative-edge / zero-price / other extreme numeric inputs in the pick-scoring math (`lib/ev.ts`) are not explicitly unit-tested, only implicitly exercised by whatever real market data happened to appear during manual testing.
- Behavior when `SITE_PASSWORD` is unset (fully-open mode) was exercised locally but not on a real deployment — **do not test this by unsetting it in Production.**
- Mobile/narrow-viewport rendering below the one CSS breakpoint is unscreenshotted.

## Documentation needed

_(None — this audit just created the full set.)_

## Recently completed

- **C-003 — Account-switch checkpoint, third pass** (2026-08-06, documentation-only, no commit): re-verified state (no drift since C-002), re-ran `npm run build` fresh (clean), confirmed this repo does NOT share the sibling repo's on-disk plaintext-credential exposure, re-ran secret-leak scan.
- **C-002 — Account-switch checkpoint, second pass** (2026-08-06, documentation-only, no commit): re-verified state, refreshed all 17 memory files, added `DECISIONS.md` D-010, re-ran secret-leak scan.
- **C-001 — Account-switch checkpoint, first pass / initial creation of the 17-file memory system** (2026-08-06, documentation-only, no commit): full repository audit, created all 17 memory files from scratch. Caught and corrected a real accidental secret leak mid-audit (an early `PROJECT_STATE.md` draft briefly contained the literal `SITE_PASSWORD` value) — see `SESSION_LOG.md`.
- **Fixed cross-theme color leak** (commit `26b6d83`): active sport tab and hero pick-cards stayed gold-tinted in the Vegas/Field themes due to hardcoded `rgba(237,161,0,...)` instead of `var(--gold)`. Fixed with `color-mix()`.
- **Added 4-theme wheel + real PNG backgrounds + real app icon** (commits `64efd06`, `1022035`, `f38eeb6`): Stadium/Paper/Vegas/Field themes, generated backgrounds, real favicon.
- **Fixed background-overlay-too-strong bug** (part of the above): same fix as sibling repo, `--bg-overlay` lowered from ~0.62 to ~0.22–0.35.
- **Redesigned as a sportsbook-style scanner** (commit `a6a1db6`): sport pill tabs with emoji, gold hero cards for suggested bets, edge-meter mini bars, Kalshi/Polymarket color-coded badges.
- **Fixed 3 real data-matching bugs during initial build** (commit `8ff0b52` and its debugging history — see `DECISIONS.md` for full technical explanation of each):
  1. Kalshi's `status=open` filter returning a wrong, further-out set of markets.
  2. Kalshi's `close_time` being days after the actual game; had to anchor matching on `expected_expiration_time` instead.
  3. Polymarket spread/total markets being mistaken for moneyline markets.
- **Initial build** (commit `8ff0b52`): ported the Python bot's de-vig/EV/Kelly math, built the Kalshi+Polymarket scanner, password gate, deployed to Vercel.

## Deferred

_(None explicitly deferred.)_

## Rejected ideas

- Decorative "light beam" shapes on the Stadium (dark) background PNG — tried, looked bad ("flat solid triangles, not actual light"), removed before shipping. See `DECISIONS.md`.
