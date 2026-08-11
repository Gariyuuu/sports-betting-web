# SECURITY.md — sports-betting-web

Defensive review only. No penetration testing or unauthorized access was attempted.

## Authentication boundaries

Single shared password (`SITE_PASSWORD` env var) → SHA-256 token → httpOnly cookie. See `CLAUDE.md`/`ARCHITECTURE.md` for the full flow. Comparison uses Node's `timingSafeEqual` (constant-time), deliberately resistant to timing side-channel attacks — **do not replace with `===` string comparison.**

## Authorization boundaries

Binary — authed or not. No roles, no per-resource checks (nothing is owned by anyone).

## Protected routes

`/` (via `app/page.tsx`'s server-side cookie check + redirect), `/api/scan`, and the three new push routes (`/api/push/subscribe`, `/api/push/unsubscribe`, `/api/push/vapid-key`) all use the same inline cookie check (`authCookieName()`/`isValidCookieToken()` from `lib/auth.ts`). **Not centrally enforced** — there is still no `middleware.ts`. Every current protected surface is correctly gated (Verified), but any *new* route added later will be public by default unless its author remembers to add the same check. This is the single most important structural security note for this repo — see `TASKS.md` T-003. The push routes are a fresh example of exactly this risk being manually avoided rather than structurally prevented.

`/login`, `/api/login`, and `/changelog` are intentionally public.

**`/api/cron/scan` is a deliberate, different exception** — it cannot use the cookie check at all (a scheduled cron trigger can't log in). It's gated instead by `CRON_SECRET`: the route requires an `Authorization: Bearer <CRON_SECRET>` header, which Vercel automatically attaches to requests it triggers via `vercel.json`'s cron schedule once that env var is set. Verified live: `curl` without the header returns 401; a manual `curl` with the correct header (extracted from a freshly-generated secret, never round-tripped through `vercel env pull` since Vercel masks values marked Sensitive) reached the handler and returned a real response. This route is also the one place in the app that spends `ODDS_API_KEY` credits on a schedule rather than a click — see `DEPLOYMENT.md` for the cost tradeoff the owner explicitly chose (15-minute interval, ~576 Odds API calls/day from the cron alone).

## Secret handling

Six real secrets now exist, all server-side-only Vercel env vars, all **Verified** to never be read client-side (no `NEXT_PUBLIC_` prefix on any of them):

- `ODDS_API_KEY`, `SITE_PASSWORD` (pre-existing, see below for the key-reuse note).
- `CRON_SECRET` — authorizes `/api/cron/scan`. Generated via `crypto.randomBytes(32).toString('hex')`, never committed, never logged.
- `VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_SUBJECT` — Web Push signing keys (`web-push` npm package). Only the private key is sensitive; the public key is by design sent to the push service on every `subscribe()` call and served back to any authed client via `/api/push/vapid-key`.
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — auto-injected by Vercel's Storage integration, not manually set. See `DATABASE.md`.

Neither `ODDS_API_KEY` nor `SITE_PASSWORD` nor any of the new secrets are committed to this repository (Verified — `.env.local` contains only Vercel CLI metadata, gitignored).

**Important context (not this repo's fault, but relevant):** `ODDS_API_KEY` reuses a key that is known to sit in plaintext in a *different*, sibling repository (`~/Projects/sports-betting-project/sports-betting-bot/.env` and `.claude/settings.local.json`) — not committed there either, but present on disk unencrypted. This was an explicit, asked-and-confirmed user choice to reuse rather than rotate. If that key is ever rotated, update it in **both** places.

## Environment variables

See `CLAUDE.md`'s Environment setup table for the full list (8 variables as of 2026-08-11 — the original 2 plus `CRON_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — all server-only, all currently Production-only on Vercel, same known Preview/Development gap as before, see `PROJECT_STATE.md`).

## Client-exposed variables

None (`NEXT_PUBLIC_*`) exist.

## Input validation

`/api/scan`'s `sport` param is validated against an allow-list (`sportByKey()`) — good. `allDates` is a loose string-equality check (`=== "true"`) — safe by construction (any other value behaves as `false`, no injection surface). `/api/login`'s `password` field is validated only as "is it a string" — the actual comparison is what matters (constant-time hash comparison), so this is adequate.

## Output encoding

Handled by React's default JSX escaping. `dangerouslySetInnerHTML` **is used once**, in `app/layout.tsx`, for the same no-flash theme-init inline script pattern as the sibling repo — the injected string is a hardcoded constant (`THEME_SCRIPT`), never derived from user input. Not a vulnerability, but the one place in this codebase that bypasses default escaping — verified via `grep -rn dangerouslySetInnerHTML app/`.

## SQL injection risk

Not applicable — no database, no SQL.

## Cross-site scripting (XSS) risk

Low. No user-generated content is ever rendered as HTML (all `Pick` data comes from trusted external APIs and third-party sportsbook/market data, rendered as plain React children).

## CSRF protections

The state-changing route (`/api/login`) is a plain `POST` with `SameSite=Lax` cookie settings — adequate for this threat model (there's no sensitive action a CSRF'd request could trigger beyond "log in as the attacker's own knowledge of the password," which is meaningless — CSRF matters when it can act *on the victim's behalf*, and there's no victim-specific state here to act on). `/api/scan` is a `GET` with no side effects beyond spending API credits — a CSRF'd GET request from a malicious page *could* theoretically trigger a scan (spending credits) if a logged-in user visits a malicious page while authed, since `GET` requests don't get CSRF protection from `SameSite=Lax` the same way state-changing requests do. **This is a real, if minor, gap** — flagged here, not currently exploited to anyone's knowledge, low real-world likelihood given this is a personal tool with a URL that isn't public knowledge.

## File upload risks

None — no file upload feature.

## Webhook verification

Not applicable — no webhooks received.

## Rate limiting

None implemented on `/api/scan` or the push routes. `/api/scan` has no rate limit, meaning a compromised cookie or a CSRF scenario (see above) could be used to repeatedly trigger scans and burn API credits. Mitigated in practice by: the cookie being httpOnly (can't be read/exfiltrated by client-side script), and the site being obscure/personal rather than a public target. `/api/cron/scan` is implicitly rate-limited by Vercel's own cron scheduler (fires at most every 15 minutes per `vercel.json`) — the `CRON_SECRET` check means nobody else can trigger it more often than that.

## Admin access

Not applicable — no admin tier exists.

## Database policies

Upstash Redis now exists (see `DATABASE.md`) — no formal access policy beyond "the REST token is a server-only secret." No PII is stored: subscription rows are device push endpoints, not user identities (this app has no user accounts). No retention policy needed for the dedup keys (they self-expire via TTL); subscription rows persist until unsubscribe or a 404/410 prunes them.

## Logging of sensitive data

Neither `ODDS_API_KEY`, `SITE_PASSWORD`, `CRON_SECRET`, nor either VAPID key is logged anywhere in application code (Verified via source inspection). One `console.error` now exists in the codebase (`app/ServiceWorkerRegister.tsx`, logs only the browser's own service-worker registration error object) — the prior "zero console.log markers" claim in this file is now stale; corrected here. No secret or user data flows through it.

## Dependency concerns

Same as sibling repo — `npm install` reported "3 high severity vulnerabilities" in transitive dependencies (Verified, seen in output); not individually investigated this session. Recommend running `npm audit` before treating this as fully cleared.

## Production security gaps

1. No `middleware.ts` — structural risk for future routes (see Protected routes above).
2. No rate limiting on `/api/scan` (minor CSRF-adjacent risk, see CSRF protections above).
3. `ODDS_API_KEY`/`SITE_PASSWORD` not set for Preview/Development Vercel environments — low risk today since no Preview deployments are in use, but would leave a Preview deployment fully open and scan-broken if one were ever created.

## Recommended fixes

1. Add `middleware.ts` to centrally enforce the auth cookie check on all current and future protected routes (`TASKS.md` T-003).
2. Consider a basic rate limit (even an in-memory per-IP counter, given the low-traffic personal-tool context) on `/api/scan`.
3. Run `npm audit` and review findings.
4. Consider setting the two env vars for Preview/Development if those environments are ever used (`TASKS.md` T-002).
5. (User's call, not urgent) Consider rotating `ODDS_API_KEY` away from the key known to exist in plaintext in the sibling repo.
