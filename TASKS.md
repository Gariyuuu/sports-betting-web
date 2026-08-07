# TASKS.md — sports-betting-web

Active execution queue. Keep in sync with `PROJECT_STATE.md` and `HANDOFF.md`.

---

## Current task

**C-004 — Account-switch checkpoint (fourth documentation pass), plus adding the missing `README.md`. Status: Complete as of this writing.**

- **Exact objective:** Re-verify the repository's actual current state against the 17-file memory/handoff system, create the previously-missing 17th canonical file (`README.md`), re-check specifically for the sibling `sports-betting-project` repo's class of secret leak, and resolve any cross-file contradiction found — including a real one discovered this pass (see below). No application feature work.
- **What has already been completed:**
  1. Ran `git status`, `git log --oneline -5`, `git fetch origin` — found the working tree clean and HEAD at `174ff9d` ("docs: add full handoff documentation system"), i.e. the 17 doc files that C-003 described as "left uncommitted deliberately, pending the user's instruction" had since been committed by the user. **The docs themselves were never updated to reflect that** — `PROJECT_STATE.md`, `TASKS.md`, `HANDOFF.md`, `CLAUDE.md`, and `SESSION_LOG.md` all still asserted HEAD was `26b6d83` with 17 untracked files. This is a genuine stale-documentation bug, now fixed across all five files.
  2. Confirmed via `ls` that `README.md` was in fact the only missing file (16/17 present) and created it: what the app does, stack, how to run locally, link to the live deploy, explicit note that it's a moneyline-only v1 subset of the Python bot.
  3. Re-ran `npm run build` fresh — clean, 0 errors (app code unchanged since `26b6d83`).
  4. Secret scan across all tracked files (`git ls-files` + `git grep` for key/password/token-shaped patterns, plus a dedicated search for 32+ character hex/alphanumeric strings in `.ts`/`.tsx`/`.json`/`.md` files) — **zero real secrets found**, only the expected documentation prose discussing `ODDS_API_KEY`/`SITE_PASSWORD` as concept names and one harmless full git-commit-hash false positive (previously already noted in C-003). Read `.env.local` in full (gitignored, untracked) — contains only a short-lived Vercel-managed `VERCEL_OIDC_TOKEN`, not the sibling repo's exposed Odds API/Anthropic keys.
  5. Cross-checked `git ls-files` (`app/`, `lib/`, `public/`) against `CLAUDE.md`'s/`FILE_MAP.md`'s documented file tree — exact match, no drift.
  6. Fixed the stale-commit/stale-untracked-files contradiction in `PROJECT_STATE.md`, `TASKS.md` (this file), `HANDOFF.md`, `CLAUDE.md`, `SESSION_LOG.md`. Refreshed the "Prompt for the next Claude Code account" section in `HANDOFF.md`.
- **What remains:** Nothing for this task itself. See "Next up" for optional, non-required follow-ups (unchanged from C-003: T-001 through T-005).
- **Relevant files:** `README.md` (new), `PROJECT_STATE.md`, `TASKS.md` (this file), `HANDOFF.md`, `CLAUDE.md`, `SESSION_LOG.md`. No application source files were touched.
- **Known errors:** None encountered. The stale-doc contradiction described above is the one real issue this pass found and fixed.
- **Blockers:** None.
- **Acceptance criteria:**
  - `README.md` exists and covers purpose/stack/run instructions/live link/v1-subset note.
  - The "current task"/HEAD-commit/working-tree-state statements read consistently across `CLAUDE.md`, `PROJECT_STATE.md`, `TASKS.md`, and `HANDOFF.md` — Verified, fixed this pass.
  - No real secret value appears in any tracked file — Verified via `git grep` this pass.
  - `npm run build` passes — Verified, re-run fresh this pass.
  - All doc changes from this pass are committed in one scoped commit; application behavior unchanged.
- **Verification steps performed:** `git status`, `git log --oneline -5`, `git fetch origin`, `ls` (confirm README.md missing, 16/17 present beforehand), `npm run build`, `git ls-files` + `git grep -niE` for key/password/secret/token patterns across all tracked files, `git grep -noE` for 32+ char hex strings, full read of `.env.local`, `find . -iname "*.env*"`.

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

- **C-004 — Account-switch checkpoint, fourth pass** (2026-08-07, documentation + one new file, committed): found and fixed a real stale-documentation contradiction (docs claimed 17 untracked files at HEAD `26b6d83`; actual state was HEAD `174ff9d` with everything committed), created the previously-missing `README.md`, re-ran `npm run build` (clean), re-ran a repo-wide secret scan across all tracked files (clean — no real `ODDS_API_KEY`/`SITE_PASSWORD` or other credential committed anywhere in this repo).
- **C-003 — Account-switch checkpoint, third pass** (2026-08-06, documentation-only, no commit at the time — later committed by the user as `174ff9d`): re-verified state (no drift since C-002), re-ran `npm run build` fresh (clean), confirmed this repo does NOT share the sibling repo's on-disk plaintext-credential exposure, re-ran secret-leak scan.
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
