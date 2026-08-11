# CLAUDE.md — Operating Manual for sports-betting-web

> Read this file first, every session, before touching code. It is the primary source of truth for this repository. Also read `PROJECT_STATE.md` and `TASKS.md` immediately after.

Audit performed: 2026-08-06, reconfirmed and corrected 2026-08-07 (checkpoint C-004 — see "Account-switch checkpoints" below). Application code claims below are **Verified** against the repository at commit `26b6d83` on `main` (unchanged since) unless explicitly marked **Inferred** or **Unknown**; documentation/git-state claims are current as of the C-004 pass (commit `174ff9d` plus that pass's own doc-fix commit).

---

## Project identity

- **Name:** sports-betting-web
- **One-sentence description:** A password-gated +EV (positive expected value) scanner that compares de-vigged sportsbook consensus odds against live Kalshi and Polymarket prediction-market prices, for moneyline bets on MLB/NBA/WNBA/NFL/EPL/MLS.
- **Detailed summary:** This is a from-scratch Next.js port of the moneyline-scanning core of a separate Python project's `sports_betting_bot.py` (in the sibling repo `~/Projects/sports-betting-project`, which is a CLI tool + a local `http.server` website, neither Vercel-deployable). This app re-implements: fetching sportsbook odds from The Odds API, de-vigging them into a "fair probability" per team, fetching live Kalshi and Polymarket prices for the same games, fuzzy-matching team names across all three sources, computing edge/EV/Kelly-stake for every match found, and displaying "suggested" bets (favorites in the -200 to -1000 American-odds band) as hero cards plus everything else in a sortable table. It is explicitly a **v1, narrower-than-the-original-bot subset** — tennis/boxing, alt-line (spread/total/BTTS) enrichment, season-record context, and a chat assistant from the original Python bot are NOT ported.
- **Target audience:** Solo hobbyist (repository owner), password-gated because each scan spends The Odds API credits (a metered/paid resource).
- **Main user problem solved:** "Find mispriced Kalshi/Polymarket contracts relative to sportsbook consensus, without running my Python CLI tool, and without letting random visitors burn my API credits."
- **Current development stage:** Working v1 prototype, explicitly and intentionally scoped narrower than the original tool. Polished UI, no automated tests, no real database (only two Vercel env vars as config), single-developer project. Deployed and publicly reachable, but gated behind a password specifically because it costs real money (API credits) to use.
- **Production status:** **Live** at https://sports-betting-web.vercel.app (Verified — login flow returns `{"ok":true}` with the current password and then the dashboard returns 200 as of audit). Deployed via Vercel, connected to GitHub `Gariyuuu/sports-betting-web` on `main` (Inferred from `vercel link` behavior during setup).
- **Repository type:** Single Next.js App Router application. Not a monorepo.

### Relationship to sibling project
`~/Projects/sports-betting-project` is a **separate, unrelated git repository** containing the original Python CLI (`sports-betting-bot/sports_betting_bot.py`) and a local-only website (`website/server.py`, raw `http.server`, not deployed anywhere). This app is a from-scratch reimplementation of part of that logic in TypeScript, **not** a shared codebase — there is no build dependency between the two repos. **Important, previously flagged security note (Verified — recorded in the AI's memory system and reconfirmed by direct file inspection during that prior audit):** the sibling repo has an Odds API key and an Anthropic API key sitting in plaintext in `sports-betting-bot/.env` and repeated in `.claude/settings.local.json`. Neither is committed to git, but they exist unencrypted on disk. **This repo's `ODDS_API_KEY` Vercel env var reuses that same key by the user's explicit choice** (asked directly, not assumed) rather than a freshly rotated one. If that key is ever rotated, it must be updated in **two places**: the sibling repo's `.env` and this repo's Vercel env var.

---

## Current status

- **Current stable state:** Deployed, `npm run build` clean. Push-notification infrastructure (v0.5.0) is live in production, but only partially operational — see Blockers.
- **Latest completed milestone:** v0.5.0 (2026-08-11) — real Web Push notifications for new +EV picks. `lib/pushSubscriptions.ts` (Upstash Redis-backed subscription store + cron dedup), `lib/notify.ts` (`web-push` VAPID sender), `public/sw.js` + `app/ServiceWorkerRegister.tsx`, three new routes (`/api/push/subscribe`, `/api/push/unsubscribe`, `/api/push/vapid-key`, all cookie-gated), `NotificationsToggle.tsx` in the Dashboard header, and `/api/cron/scan` (CRON_SECRET-gated, runs every 15 min per `vercel.json`, scans all 6 sports and pushes for genuinely new suggested picks). `app/api/scan/route.ts`'s pipeline was factored out into `lib/runScan.ts` so both routes share the exact same scan logic. Prior milestone (v0.4.0, 2026-08-06) unchanged: 4-theme wheel, PNG backgrounds, real icon.
- **Current active task:** None. The notification feature's code is complete, tested (`npm run build` clean, a real authenticated `curl` round-trip against `/api/cron/scan` in production), and deployed — see Blockers for the one remaining manual step.
- **Blockers:** **Upstash Redis is not yet connected.** `CRON_SECRET`/`VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`VAPID_SUBJECT` are set; `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` are not. Until the owner connects Upstash via Vercel's Storage tab (Marketplace Database Providers → Upstash → Redis → connect to this project), `/api/cron/scan` returns a graceful `501 {"error":"push storage (Upstash Redis) not configured"}` instead of running (Verified live) — it does NOT spend Odds API credits while unconfigured, and does NOT error/crash. Once connected, no further code changes should be needed; the env vars are auto-injected under the exact names `lib/pushSubscriptions.ts` already reads.
- **Highest-priority next task:** Connect Upstash Redis (see Blockers). After that, verify one real end-to-end cron run finds and pushes a genuinely new pick (can't be verified until real subscriptions + real dedup storage exist). See `TASKS.md` for optional follow-ups beyond that — team-name matching accuracy remains the same known, accepted weak spot as before.
- **Features currently under construction:** None (notification feature is complete pending the Upstash connection step above, not "in progress").

---

## Technology stack

All versions **Verified** from `package.json` / `package-lock.json` (resolved). Do not upgrade without re-checking the lockfile — these numbers will drift over time.

| Category | Technology | Version (resolved) |
|---|---|---|
| Language | TypeScript | 5.9.3 (range `^5.7.0`) |
| Framework | Next.js (App Router) | 15.5.22 (range `^15.1.0`) |
| UI library | React / React DOM | 19.2.8 (range `^19.0.0`) |
| Package manager | npm | Verified via `package-lock.json`; no other lockfile present |
| Runtime | Node.js | Built/tested under Node v26.3.0 (Inferred from dev environment; not pinned via `.nvmrc`/`engines`) |
| Styling | Plain CSS (`app/globals.css`) | — |
| Database | Upstash Redis (via `@upstash/redis`) — push subscriptions + cron dedup only, see `DATABASE.md` | Added 2026-08-11 |
| Push notifications | `web-push` (VAPID) | `^3.6.7` |
| Auth | Single shared password → SHA-256-hashed cookie token, no user accounts (see Authentication section) | Custom, no library |
| Storage provider | Upstash Redis (see above) + 8 total Vercel env vars (was 2). | — |
| Hosting | Vercel | Project `garywangsmes-8349s-projects/sports-betting-web`, Cron Jobs enabled (`vercel.json`) |
| Testing libraries | **None installed.** | N/A |
| Linting | `next lint` script exists; **no ESLint config file committed**. **Verified this session:** running `npm run lint` launches an interactive setup wizard (`next lint` is deprecated, removal planned in Next.js 16) rather than performing a simple check, and would create a new config + install a dependency if completed. Intentionally cancelled rather than completed during this audit — see `TASKS.md` T-005. | — |
| External APIs | The Odds API (keyed, paid/metered), Kalshi public markets API (no key), Polymarket Gamma public API (no key) | — |

---

## Essential commands

Single app, run everything from the repo root (`~/Projects/sports-betting-web`).

| Purpose | Command | Status |
|---|---|---|
| Install dependencies | `npm install` | Verified |
| Run dev server | `npm run dev` | Documented-only, not run this session |
| Build for production | `npm run build` | Verified — clean at commit `26b6d83`, re-confirmed clean 2026-08-07 at `174ff9d` (app code unchanged) |
| Start production server locally | `npm run start -- -p <port>` | Verified — used for local smoke tests |
| Lint | `npm run lint` | **Verified this session it does NOT run non-interactively** — see Linting row above. |
| Type-check | No standalone script; happens as part of `npm run build` | Verified indirectly |
| Tests | **None exist.** | N/A |
| Deploy | `vercel --prod --yes` | Verified — used every deploy this session |
| Set a Vercel env var | `printf '%s' 'value' \| vercel env add VAR_NAME production` | Verified — used for both `ODDS_API_KEY` and `SITE_PASSWORD` this session |
| Remove a Vercel env var (to rotate) | `vercel env rm VAR_NAME production --yes` | Verified — used once to change `SITE_PASSWORD` |
| List Vercel env vars | `vercel env ls` | Verified |

**Local dev requires `ODDS_API_KEY` set in the environment** to exercise the scan feature (see Environment setup) — without it, `/api/scan` returns a 501 with an explanatory message (this is handled gracefully, not a crash).

---

## Repository structure

```
sports-betting-web/
├── app/
│   ├── layout.tsx            Root layout + no-flash theme-init inline script + <ServiceWorkerRegister />
│   ├── page.tsx              SERVER component: auth-gate wrapper, redirects to /login if not authed
│   ├── Dashboard.tsx          CLIENT component: the actual scanner UI (rendered by page.tsx once authed)
│   ├── login/page.tsx        Password entry form (client)
│   ├── changelog/page.tsx    Static patch-notes page (public, unauthenticated)
│   ├── ThemeWheel.tsx         4-swatch theme picker (client)
│   ├── NotificationsToggle.tsx  Push on/off toggle (client) -- 2026-08-11
│   ├── ServiceWorkerRegister.tsx  Registers /sw.js (client) -- 2026-08-11
│   ├── globals.css           All styling: theme variables (4 themes), components
│   ├── icon.png               App icon — Next.js auto-detects this as favicon
│   └── api/
│       ├── login/route.ts    POST — checks password, sets auth cookie
│       ├── scan/route.ts     GET — thin wrapper around lib/runScan.ts, auth-gated
│       ├── push/
│       │   ├── subscribe/route.ts    POST — cookie-gated, stores a subscription
│       │   ├── unsubscribe/route.ts  POST — cookie-gated, removes a subscription
│       │   └── vapid-key/route.ts    GET — cookie-gated, hands out the public key
│       └── cron/scan/route.ts  GET — CRON_SECRET-gated (not cookie-gated), runs every
│                                15 min per vercel.json, pushes for new +EV picks
├── lib/                       Pure/server logic, framework-agnostic where possible
│   ├── auth.ts                Password hashing/cookie-token verification (Node `crypto`)
│   ├── sports.ts              Static config: 6 supported sports, their API keys/tags
│   ├── oddsapi.ts             The Odds API fetch + de-vig math → FairLine[]
│   ├── kalshi.ts              Kalshi market fetch + team-name matching → Pick[]
│   ├── polymarket.ts          Polymarket event fetch + moneyline-market detection → Pick[]
│   ├── match.ts               Shared fuzzy team-name matching (token-overlap, not exact aliases)
│   ├── ev.ts                  Edge/EV/Kelly-stake/American-odds math + bankroll constants
│   ├── pick.ts                Shared `makePick()` — turns a price+FairLine into a Pick, or null if not +EV
│   ├── types.ts               The one shared `Pick` interface
│   ├── runScan.ts             2026-08-11: the scan pipeline itself, factored out of
│   │                          api/scan/route.ts so api/cron/scan/route.ts can reuse it
│   ├── pushSubscriptions.ts   2026-08-11: Upstash-backed subscription store + dedup (see DATABASE.md)
│   ├── notify.ts              2026-08-11: sends Web Push via the `web-push` package
│   └── pushClient.ts          2026-08-11: browser-side VAPID key decoding helper
├── public/
│   ├── bg-dark.png            Stadium theme background (default)
│   ├── bg-light.png           Paper theme background
│   ├── bg-vegas.png           Vegas theme background
│   ├── bg-field.png           Field theme background
│   └── sw.js                  2026-08-11: push-notification service worker
├── vercel.json                 2026-08-11: cron schedule for api/cron/scan
├── package.json / package-lock.json
├── tsconfig.json              `@/*` path alias → repo root
├── next.config.ts             Empty/default
└── .env.local                 Vercel CLI metadata only — gitignored
```

**What belongs where:** Same conventions as the sibling `hyperliquid-bot-web` repo — pure logic in `lib/`, UI directly under `app/` (no `components/` subfolder convention here either), one file per API route.

**Entry points:** `app/page.tsx` (server, auth gate) → `app/Dashboard.tsx` (client, the real UI). `app/login/page.tsx` is the unauthenticated entry point. `app/api/login/route.ts` and `app/api/scan/route.ts` are the two backend entry points.

---

## Architecture summary

See `ARCHITECTURE.md` for the full diagram. Summary:

- **Frontend architecture:** `app/page.tsx` is a **server component** that reads the auth cookie and either `redirect("/login")` or renders `<Dashboard />`. `Dashboard.tsx` is the client component holding all scan-related state.
- **Backend architecture:** Two route handlers. `/api/login` (POST) checks a password against `process.env.SITE_PASSWORD` via a SHA-256 comparison and sets an httpOnly cookie. `/api/scan` (GET) is auth-gated by that same cookie, orchestrates 3 external API calls, does the matching/scoring, and returns picks.
- **Request flow (a scan):** Dashboard → `fetch('/api/scan?sport=mlb&allDates=false')` → route checks cookie → `fetchFairLines()` (Odds API) → in parallel, `scanKalshi()` and `scanPolymarket()` (each independently fetch + match against the fair lines) → merge, sort by edge, split into `suggested`/`other` → JSON response → Dashboard renders hero cards + table.
- **Rendering strategy:** `app/page.tsx` and `app/login/page.tsx`'s parent are server components; `Dashboard.tsx`, `ThemeWheel.tsx`, and `app/login/page.tsx` itself are client components.
- **Server/client boundary:** The auth check happens server-side (`app/page.tsx`, and again inside `/api/scan` itself — belt-and-suspenders). `ODDS_API_KEY` never reaches the client — it's read only inside `app/api/scan/route.ts` on the server.
- **State management:** Plain React `useState` in `Dashboard.tsx`. No persistence across reloads for scan results (they're not saved to localStorage — a fresh page load requires a fresh scan). Theme choice IS persisted (localStorage, same pattern as the sibling repo).
- **Database access pattern:** N/A — no database.
- **Authentication flow:** See Authentication and authorization below.
- **Authorization flow:** Binary — authed or not. No roles.
- **Storage flow:** `localStorage` for theme only (`sbw-theme`). No account/session data stored client-side beyond the httpOnly cookie (which client JS cannot read).
- **External integration flow:** 3 external APIs, all called server-side only: The Odds API (keyed), Kalshi (public), Polymarket (public). See `API_REFERENCE.md`.
- **Background/scheduled processing:** `/api/cron/scan` runs on Vercel Cron every 15 minutes (`vercel.json`), scanning all 6 sports and sending a Web Push notification for any genuinely new suggested pick (dedup via Upstash Redis, see `DATABASE.md`). Every manual scan (the original feature) is still triggered live by a button click, unchanged.
- **Caching:** `/api/scan` and `/api/login` are both `dynamic = "force-dynamic"` (scan route) / inherently dynamic (login is a POST). No caching anywhere in the data path — every scan is a fresh, live, credit-costing call.
- **Error handling:** Try/catch in the route handler; typed `OddsApiError` class distinguishes Odds-API-specific failures (mapped to specific status codes) from generic errors (502).
- **Logging:** None beyond default Vercel function logs.
- **Deployment architecture:** Vercel, same pattern as the sibling repo.

---

## Coding conventions

Same general conventions as `hyperliquid-bot-web` (camelCase functions, PascalCase components/types, `@/` import alias, flat `lib/` organization, try/catch at boundaries, minimal comments explaining *why* not *what*). Additional conventions specific to this repo:

- **Matching logic is deliberately isolated in `lib/match.ts`** and reused by both `lib/kalshi.ts` and `lib/polymarket.ts` — if you improve matching, do it there once, not separately in each platform file.
- **Every `Pick` is constructed through `lib/pick.ts`'s `makePick()`**, which is also where the "is this even tradeable/positive-EV" filter lives (`isTradeable(price)` and `edge <= 0 → null`). Never construct a `Pick` object by hand elsewhere — you'll bypass this filter.
- **Auth checks appear in two places by design** (`app/page.tsx` for the page, and again inside `/api/scan/route.ts` for the API) — this is intentional defense-in-depth (a page-level check alone wouldn't stop someone from calling the API directly), not duplicated-by-accident. Keep both if you touch either.
- **Sport configuration is centralized in `lib/sports.ts`** — adding a sport means adding one entry to the `SPORTS` array, not scattering sport-specific logic elsewhere.

---

## UI and design system

Full detail in `UI_SYSTEM.md`. Same theme-system architecture as the sibling `hyperliquid-bot-web` repo (4 themes via `[data-theme]` + CSS variables + a `ThemeWheel` swatch picker + real PNG backgrounds), with sport-betting-specific visual identity:
- `dark` (**Stadium**, default): gold/green glow, `bg-dark.png`
- `light` (**Paper**): near-solid white, `bg-light.png`
- `vegas` (**Vegas**): pink/purple neon, `bg-vegas.png`
- `field` (**Field**): deep green turf, `bg-field.png`

**Same hard rule as the sibling repo applies here, and was violated and fixed here too:** every themed color must be `var(--...)` or `color-mix()` against one — hardcoded gold colors in `.tab.active`, `button.primary`, and `.pick-card` stayed gold in the Vegas/Field themes until fixed in commit `26b6d83`.

---

## Environment setup

Eight environment variables exist as of 2026-08-11, all **Verified** via `vercel env ls` and direct source inspection. **Never commit real values for any of them.**

| Variable | Purpose | Required? | Used in | Client or server | Environments | Sensitive? |
|---|---|---|---|---|---|---|
| `ODDS_API_KEY` | The Odds API key, used to fetch sportsbook odds for de-vigging | Required for `/api/scan`/`/api/cron/scan` (both return a graceful error if absent, never crash) | `lib/oddsapi.ts` | Server only | Production only | **Yes** — costs real money per API call |
| `SITE_PASSWORD` | Single shared password gating the whole site | See Known issues if unset | `lib/auth.ts` | Server only | Production only | **Yes** |
| `CRON_SECRET` | Authorizes `/api/cron/scan` (Vercel auto-attaches it as a bearer token to cron-triggered requests) | Required for the cron route to ever run (401 without it) | `app/api/cron/scan/route.ts` | Server only | Production only | **Yes** |
| `VAPID_PUBLIC_KEY` | Web Push public signing key | Required for push subscribe to work | `lib/notify.ts`, `app/api/push/vapid-key/route.ts` | Server only (served to client via the route, never a `NEXT_PUBLIC_` var) | Production only | No (public by design) |
| `VAPID_PRIVATE_KEY` | Web Push private signing key | Required for push send | `lib/notify.ts` | Server only | Production only | **Yes** |
| `VAPID_SUBJECT` | `mailto:` contact required by the Web Push spec | Optional (defaults to a placeholder) | `lib/notify.ts` | Server only | Production only | No |
| `UPSTASH_REDIS_REST_URL` | Redis REST endpoint | Required for push storage/dedup (503/501 gracefully without it) | `lib/pushSubscriptions.ts` | Server only | Auto-injected once connected via Vercel Storage | No (endpoint URL) |
| `UPSTASH_REDIS_REST_TOKEN` | Redis REST auth token | Required alongside the URL above | `lib/pushSubscriptions.ts` | Server only | Auto-injected once connected via Vercel Storage | **Yes** |

**Local dev setup:** create a `.env.local` (gitignored) with `ODDS_API_KEY=...` and optionally `SITE_PASSWORD=...`; the push-notification variables are only needed if testing that feature locally. There is no `.env.example` committed in this repo — creating one (with placeholders only, matching the table above) would be a reasonable, low-risk documentation improvement (see `TASKS.md`).

**Known gap (Verified via `vercel env ls`):** all variables are set for the Production environment only, not Preview or Development on Vercel — same pre-existing gap as before, now applying to 6 more variables. Not currently a problem since no Preview deployments are in use.

---

## Database summary

**Upstash Redis, added 2026-08-11.** Two narrow purposes: push-subscription storage and cron-notification dedup. See `DATABASE.md` for the full data model — this is not a general persistence layer, and the core scan pipeline remains entirely stateless/uncached.

---

## Authentication and authorization

Full detail in `SECURITY.md`. Summary:

- **Signup:** N/A — there is exactly one password, shared, no accounts.
- **Login:** `POST /api/login` with `{ password }`. Checks against `process.env.SITE_PASSWORD` via `createHash("sha256").update("sports-betting-web:" + password)` and `timingSafeEqual` (constant-time comparison — deliberately resistant to timing attacks). On success, sets an httpOnly, `SameSite=Lax`, `Secure`, 1-year-`maxAge` cookie named `sbw_auth` containing the same SHA-256 token (not the raw password).
- **Logout:** **No logout mechanism exists.** The only way to "log out" is to clear the `sbw_auth` cookie manually (browser devtools) — there is no button/route for this. Flagged in Known issues.
- **Session handling:** Stateless — the cookie itself IS the session token (a hash of the correct password); there's no server-side session store, no expiry check beyond the cookie's own `maxAge`.
- **Password recovery:** N/A — there's one password, set via Vercel env var; "recovery" is the account owner changing the env var and redeploying.
- **OAuth providers:** None.
- **Middleware:** No `middleware.ts` exists — the auth check is done per-route (`app/page.tsx` as a server component, `app/api/scan/route.ts` inline), not via Next.js middleware. This means any *new* page or API route added in the future will be **open by default** unless someone remembers to add the same cookie check — this is a real, structural gap, not a bug in existing code (see Known issues / `SECURITY.md`).
- **Protected routes:** `/` (via `app/page.tsx`'s server-side redirect) and `/api/scan` (inline check). `/login` and `/api/login` are intentionally public. `/changelog` is also public/unauthenticated (deliberate — it's just release notes, no cost).
- **Roles/permissions:** None — binary authed/not-authed, no admin tier.
- **Ownership checks:** N/A — no user-owned data exists.
- **Security-sensitive files:** `lib/auth.ts`, `app/api/login/route.ts`, `app/api/scan/route.ts` (the auth check lines specifically), `app/page.tsx` (the redirect).

---

## API and integrations

Full detail in `API_REFERENCE.md`. Summary: 2 internal routes (`/api/login`, `/api/scan`), 3 external APIs (The Odds API — keyed/paid; Kalshi public markets API — no key; Polymarket Gamma public API — no key). No webhooks, no SDKs (all raw `fetch`).

---

## Testing and verification

See `TESTING.md`. No automated tests exist. This session's verification was manual: real login+scan round trips against live external APIs (not mocked), confirmed real picks with plausible edge percentages, confirmed 3 real bugs found and fixed during development (see `DECISIONS.md`), and Playwright screenshots across all 4 themes post-fix.

---

## Deployment

See `DEPLOYMENT.md`. Vercel, project `garywangsmes-8349s-projects/sports-betting-web`, `vercel --prod --yes` from this directory, GitHub `Gariyuuu/sports-betting-web` on `main`. Two env vars required in Production (see Environment setup) — **missing from Preview/Development**, a real gap if those environments are ever used.

---

## DO NOT CHANGE WITHOUT REVIEW

- **`lib/auth.ts`'s `timingSafeEqual` usage and the SHA-256 cookie-token scheme** — replacing this with a naive string comparison (`===`) would reintroduce a timing-attack vulnerability that was deliberately avoided.
- **The `ODDS_API_KEY` env var and any code path that logs or returns it** — this key costs real money per call; never log full request URLs that include it, never echo it back in an error message to the client. Current code does not do this (Verified — `OddsApiError` messages are built from response status/body text, not from the request URL), keep it that way.
- **The auth check duplicated in `app/page.tsx` and `app/api/scan/route.ts`** — if you refactor auth (e.g., introduce `middleware.ts`), make sure the new mechanism covers *every* current and future route, since the current per-route pattern has already been identified as fragile for future additions (see Known issues).
- **`lib/pick.ts`'s `makePick()` filter (`isTradeable`, `edge <= 0 → null`)** — this is what prevents nonsensical or already-settled markets from showing up as "opportunities." Don't bypass it when adding a new data source.
- **Any hardcoded color in `app/globals.css`** — same rule as the sibling repo, already caused a real bug here too (see `DECISIONS.md`).
- **Kalshi's `status` query parameter usage in `lib/kalshi.ts`** — do not reintroduce `status=open` as a server-side filter; it returns a *different, wrong* set of markets (see Known issues / `DECISIONS.md` for the exact, counterintuitive reason). The current code fetches unfiltered and filters client-side on `status === "active"` — this was hard-won knowledge, don't revert it.
- **`app/api/cron/scan/route.ts`'s `CRON_SECRET` check** — this route intentionally does NOT use the cookie-based auth every other route uses (a cron trigger can't log in). Do not add the cookie check here (Vercel's cron requests won't have it, breaking the schedule) and do not remove/weaken the `CRON_SECRET` check (this route spends real `ODDS_API_KEY` credits on every successful call — an unauthenticated version would let anyone burn them on a schedule of their choosing).
- **`lib/pushSubscriptions.ts`'s `markNotifiedIfNew()` / `SET ... NX`** — this is what prevents the cron job from re-notifying the same still-open pick every 15 minutes. Don't replace with a plain `SET` (loses the atomic check-and-mark) or remove the TTL (dedup keys would accumulate forever).
- **The `SUMMARY_THRESHOLD` flood guard in `app/api/cron/scan/route.ts`** — without it, the first cron run after Upstash is ever cleared/reset would fire one push per currently-open pick simultaneously. Don't remove without a different flood-prevention mechanism in place first.

---

## Known issues

See `PROJECT_STATE.md` and `TASKS.md` for the current list. As of this audit, the following are **open, accepted-as-is** (not bugs to fix immediately, but real, documented limitations):

1. **No logout mechanism.** Low severity, low priority.
2. **No `middleware.ts` — auth is per-route, not centrally enforced.** Medium severity (structural risk for future additions), not currently exploited since only 2 routes exist and both are correctly gated.
3. **Team-name matching is best-effort fuzzy (token-overlap), not exact aliases.** Known weak spot: city-collision teams (e.g., Kalshi abbreviating "Athletics" as "LA A" can token-collide with "LA Angels"/"LA Dodgers"). This is a documented, accepted v1 limitation, not a regression.
4. **`ODDS_API_KEY`/`SITE_PASSWORD` only set for Production on Vercel, not Preview/Development.**

Three bugs were found and fixed *during* development (not currently open) — see `DECISIONS.md` for the full technical explanation of each:
- Kalshi's `status=open` filter returning the wrong (further-out) set of markets.
- Kalshi's `close_time` being days after the actual game, requiring anchoring on `expected_expiration_time` instead.
- Polymarket spread/total markets being mistaken for moneyline markets (both have team names as outcomes).

---

## Account-switch checkpoints

This repository has three times been the subject of an explicit "prepare for account switch" request (2026-08-06, see `SESSION_LOG.md` — C-001, C-002, C-003). If asked again to perform a full documentation audit / account-switch checkpoint, the expected deliverable is:

1. Inspect current branch, `git status`, recent commits, uncommitted/untracked files.
2. Update `PROJECT_STATE.md` with the exact current state.
3. Update `TASKS.md`'s current task with: exact objective, what's completed, what remains, relevant files, known errors, blockers, acceptance criteria, verification steps.
4. Update `HANDOFF.md` with the exact resume point.
5. Append (never overwrite) a new dated entry to `SESSION_LOG.md`.
6. Update this file (`CLAUDE.md`) if any new architecture/workflow/restriction/convention emerged.
7. Update any other affected doc (`ARCHITECTURE.md`, `FEATURES.md`, `DECISIONS.md`, `SECURITY.md`, etc.).
8. **Search the live conversation (not just the code) for decisions, rejected ideas, requirements, and warnings that are not discoverable from the code alone** — e.g., this repo's `DECISIONS.md` D-010 (why specific badge colors were picked from a validated colorblind-safe palette) exists only because it was recorded during exactly this kind of checkpoint, not because the code itself reveals the *why*.
9. Grep for secret values before finishing — **this repo specifically has already had a real accidental secret leak caught mid-audit** (an early draft of `PROJECT_STATE.md` briefly contained the literal `SITE_PASSWORD` value — see `SESSION_LOG.md`). Take this seriously; it has actually happened, not a hypothetical.
10. Verify the "current task" statement is word-for-word consistent across `CLAUDE.md`, `PROJECT_STATE.md`, `TASKS.md`, `HANDOFF.md`.
11. Do not commit, push, deploy, reset, or change application behavior as part of a checkpoint unless explicitly told to.

## AI working instructions

Identical to the sibling `hyperliquid-bot-web` repo's list — see that repo's `CLAUDE.md` for the full 18-point list if you want it verbatim; the short version: read the docs, check git status, inspect before editing, make small reviewable changes, run `npm run build`, update docs after, never touch auth/deployment/the API-cost-bearing `ODDS_API_KEY` path casually, record uncertainty rather than guessing.

### Permanent rules — after every meaningful coding task

1. Update `PROJECT_STATE.md`.
2. Update `TASKS.md`.
3. Append to `SESSION_LOG.md`.
4. Update affected feature/architecture/API/UI/security/testing/deployment docs.
5. Remove or correct stale information you find.
6. Record meaningful architectural decisions in `DECISIONS.md`.
7. Run `npm run build` at minimum.
8. Clearly record anything not verified.
9. Keep this repository as the permanent source of project memory.

### Permanent rules — before every meaningful coding task

1. Read `CLAUDE.md`.
2. Read `PROJECT_STATE.md`.
3. Read `TASKS.md`.
4. Read the relevant technical documentation file(s).
5. Inspect `git status`.
6. Inspect the files that will be changed.
7. Confirm the requested work hasn't already been done.
8. Preserve unrelated work.
9. Identify risks before modifying anything listed under "DO NOT CHANGE WITHOUT REVIEW" — **especially auth and the Odds API key path in this repo, since real money is involved.**
