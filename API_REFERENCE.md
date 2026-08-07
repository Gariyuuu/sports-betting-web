# API_REFERENCE.md — sports-betting-web

Two internal endpoints, three external APIs. No webhooks, no server actions/RPC.

---

## Internal endpoints

### `POST /api/login`

- **Source file:** `app/api/login/route.ts`
- **Purpose:** Verify the shared site password and set the auth cookie.
- **Authentication required:** None (this IS the login).
- **Request body:** `{ "password": string }`
- **Response (success, 200):** `{ "ok": true }`, plus `Set-Cookie: sbw_auth=<sha256 token>; HttpOnly; SameSite=Lax; Secure; Path=/; Max-Age=31536000`.
- **Response (wrong password, 403):** `{ "error": "wrong password" }`, after an artificial 1-second delay (brute-force friction).
- **Response (SITE_PASSWORD unset):** `{ "ok": true }` immediately, cookie is NOT set in this branch (Verified — re-check `app/api/login/route.ts` lines 5-7: the early-return path never calls `res.cookies.set`). This means in fully-open mode, login always "succeeds" but no cookie is issued — harmless, since `isValidCookieToken()` also returns `true` unconditionally when no password is configured, so no cookie is needed for `app/page.tsx`'s check to pass either.
- **Side effects:** Sets a cookie on success. No database, no external call.
- **Validation:** `body.password` must be a string (falls back to `""` if the request body isn't valid JSON or lacks the field, via `.catch(() => ({}))`).
- **Example request:**
  ```
  POST /api/login
  Content-Type: application/json

  { "password": "<the configured SITE_PASSWORD value>" }
  ```
- **Known issues:** None.

### `GET /api/scan`

- **Source file:** `app/api/scan/route.ts`
- **Purpose:** The core feature — fetch odds, de-vig, match against Kalshi/Polymarket, score, return picks.
- **Authentication required:** Yes — `sbw_auth` cookie checked via `isValidCookieToken()`. 401 if invalid/absent (unless `SITE_PASSWORD` is unset, in which case this always passes).
- **Query parameters:**

  | Param | Type | Default | Notes |
  |---|---|---|---|
  | `sport` | string | (required, no default) | Must match a `key` in `lib/sports.ts`'s `SPORTS` array (`mlb`, `nba`, `wnba`, `nfl`, `epl`, `mls`). 400 if unrecognized. |
  | `allDates` | string | `"false"` (any non-`"true"` value behaves as false) | If `"true"`, skips the today/tomorrow date filter. |

- **Success response (200):**
  ```json
  {
    "sport": "MLB",
    "eventsScanned": 22,
    "eventsInWindow": 21,
    "suggested": [ /* Pick[] — favorites in the -200 to -1000 band */ ],
    "other": [ /* Pick[] — other positive-edge picks */ ],
    "ts": 1785967753673
  }
  ```
  Each `Pick` (see `lib/types.ts`):
  ```json
  {
    "platform": "Kalshi",
    "sport": "MLB",
    "marketTitle": "Washington vs Philadelphia Winner?",
    "side": "Washington Nationals",
    "price": 0.27,
    "fairProb": 0.355,
    "edgePct": 0.085,
    "evPerDollar": 0.31,
    "kellyStake": 12.5,
    "commenceTime": "2026-08-06T22:41:00Z",
    "suggested": false
  }
  ```
- **Error responses:**
  - `401 { "error": "unauthorized" }`
  - `400 { "error": "unknown sport \"<sport>\"" }`
  - `501 { "error": "ODDS_API_KEY is not configured on this deployment yet. Add it in Vercel project settings." }`
  - `502 { "error": "<message>" }` — Odds API error (unless the upstream status was 401, which is also mapped to 502 specifically to avoid confusion with this route's own 401) or any other thrown error.
- **Side effects:** None (read-only). **Cost side effect:** every successful call spends The Odds API credits — this is the entire reason the route is auth-gated.
- **Database operations:** None.
- **External calls:** Up to 3 per request — The Odds API (always, if auth+sport+key checks pass), Kalshi and Polymarket (in parallel, each conditional on the sport having a `kalshiSeries`/`polyTag` configured — both do, for all 6 current sports).
- **Rate limits:** None enforced by this route itself; whatever The Odds API/Kalshi/Polymarket enforce upstream is unhandled (no retry/backoff).
- **Example request:**
  ```
  GET /api/scan?sport=mlb&allDates=false
  Cookie: sbw_auth=<token>
  ```
- **Known issues:** None open. Historical: see `DECISIONS.md` D-005/D-006/D-007 for three real bugs found and fixed in the Kalshi/Polymarket integration paths this route depends on.

---

## External APIs called by this app

### The Odds API

- **Base URL:** `https://api.the-odds-api.com/v4` (hardcoded in `lib/oddsapi.ts`)
- **Auth:** API key as a query parameter (`apiKey=...`), read from `process.env.ODDS_API_KEY` server-side. **Never sent to the client, never included in any error message returned to the client** (Verified — `OddsApiError` messages are built from `res.status` and the response body text only, never from the request URL).
- **Cost:** Paid/metered — this is why the app is password-gated (see `DECISIONS.md` D-003).
- **Endpoint used:** `GET /sports/{sportKey}/odds?apiKey=...&regions=us&markets=h2h&oddsFormat=decimal` — moneyline (`h2h`) only, `us` region only. No alt-markets (spreads/totals/BTTS) are fetched.
- **SDK:** None — raw `fetch`.
- **Retry/backoff:** None.
- **Sandbox/test mode:** Not used/not known to exist for this API — **Unknown**.

### Kalshi public markets API

- **Base URL:** `https://api.elections.kalshi.com/trade-api/v2`
- **Auth:** None — fully public.
- **Endpoint used:** `GET /markets?series_ticker={ticker}&limit=200&cursor=...` — paginated (up to 10 pages), **deliberately without a `status` query param** (see `DECISIONS.md` D-005 for why), filtered client-side to `status === "active"`.
- **Price field used:** `yes_ask_dollars`.
- **Time-anchor field used:** `expected_expiration_time` (fallback `close_time`) — see D-006.
- **SDK:** None — raw `fetch`.
- **Retry/backoff:** None. A non-OK response simply breaks the pagination loop early (`if (!res.ok) break;`) rather than throwing — meaning a Kalshi outage silently produces zero Kalshi picks for that scan rather than an error to the user. **This is worth knowing** — it's graceful-but-silent, not loud.

### Polymarket Gamma API

- **Base URL:** `https://gamma-api.polymarket.com`
- **Auth:** None — fully public.
- **Endpoint used:** `GET /events?tag_slug={tag}&limit=60&order=volume24hr&ascending=false`.
- **Moneyline detection:** `market.question === event.title` (see D-007) — critically important, do not remove this check.
- **Field parsing:** `outcomes` and `outcomePrices` are JSON-encoded **strings** (not native arrays) in the raw API response and must be `JSON.parse`d again (`parseJsonArray()` helper) — a double-encoding quirk of this specific API.
- **SDK:** None — raw `fetch`. Same silent-failure pattern as Kalshi (`if (!res.ok) return [];`).

## Webhooks

None received or sent.

## Service accounts

None (Kalshi/Polymarket require none; The Odds API is a simple API key, not a service-account/OAuth flow).
