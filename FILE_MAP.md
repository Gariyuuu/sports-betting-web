# FILE_MAP.md — sports-betting-web

Every file in the repository (excluding `node_modules`, `.next`, `.vercel`, `.git`, lockfiles, generated `next-env.d.ts`) is listed. All paths **Verified** to exist at commit `26b6d83`; reconfirmed unchanged 2026-08-07 (checkpoint C-004 — app code has not changed since). This file intentionally does not list the repo's own documentation files (`README.md`, `CLAUDE.md`, etc.) at the root — see the repo root listing itself for those.

| Path | Purpose | Imports / calls | Imported / called by | Edit when | Risk |
|---|---|---|---|---|---|
| `app/layout.tsx` | Root layout + no-flash theme-init script | `./globals.css` | Next.js root layout convention | Changing default theme, adding `<head>` tags | Low, keep `valid` theme array in sync with `ThemeWheel.tsx`/`globals.css` |
| `app/page.tsx` | **Server** auth gate — redirects to `/login` or renders `Dashboard` | `next/headers` (`cookies`), `next/navigation` (`redirect`), `@/lib/auth`, `./Dashboard` | Next.js root page convention | Changing the auth mechanism | **High** — this is the entire page-level access control |
| `app/Dashboard.tsx` | The scanner UI (client) | `@/lib/sports`, `@/lib/types`, `next/link`, `./ThemeWheel` | `app/page.tsx` | Any UI change to the scanner | Medium |
| `app/login/page.tsx` | Password form (client) | `next/navigation` (`useRouter`) | Rendered by the `/login` route | Changing login UX | Low |
| `app/changelog/page.tsx` | Static patch notes (public) | `next/link` | Linked from `Dashboard.tsx` header | Adding a version entry | Low |
| `app/ThemeWheel.tsx` | 4-swatch theme picker | none (DOM + localStorage directly) | `app/Dashboard.tsx` | Adding/removing a theme | Low, keep in sync with `globals.css`/`layout.tsx` |
| `app/globals.css` | All styling, 4 theme blocks | `public/bg-*.png` | Every component | Any visual change | **High** — same hardcoded-color risk as sibling repo, already caused a real bug here |
| `app/icon.png` | Favicon source | — | Next.js App Router convention | Rebranding | Low |
| `app/api/login/route.ts` | POST — password check, sets auth cookie | `@/lib/auth` | `app/login/page.tsx` (via fetch) | Changing auth scheme | **High** |
| `app/api/scan/route.ts` | GET — the core feature | `@/lib/sports`, `@/lib/oddsapi`, `@/lib/kalshi`, `@/lib/polymarket`, `@/lib/types`, `@/lib/auth` | `app/Dashboard.tsx` (via fetch) | Adding a sport/data source, changing scoring | **High** — orchestrates the paid Odds API call and the auth check |
| `lib/auth.ts` | Password hashing + cookie-token verification | Node `crypto` | `app/api/login/route.ts`, `app/api/scan/route.ts`, `app/page.tsx` | Changing the auth scheme | **High** — timing-safe comparison is deliberate, don't simplify to `===` |
| `lib/sports.ts` | Static sport config (6 sports) | none | `app/api/scan/route.ts`, `app/Dashboard.tsx` | Adding/removing a supported sport | Medium — wrong `oddsKey`/`kalshiSeries`/`polyTag` silently returns empty results, not an error |
| `lib/oddsapi.ts` | Odds API fetch + de-vig math | none (raw fetch) | `app/api/scan/route.ts` | Changing de-vig math, adding markets beyond `h2h` | **High** — the core "fair probability" calculation everything else depends on |
| `lib/kalshi.ts` | Kalshi fetch + matching → `Pick[]` | `./match`, `./pick`, `@/lib/types` | `app/api/scan/route.ts` | Kalshi-specific matching/fetch changes | High — see `DECISIONS.md` for two hard-won gotchas already fixed here |
| `lib/polymarket.ts` | Polymarket fetch + matching → `Pick[]` | `./match`, `./pick`, `@/lib/types` | `app/api/scan/route.ts` | Polymarket-specific matching/fetch changes | High — see `DECISIONS.md` for the moneyline-vs-spread gotcha already fixed here |
| `lib/match.ts` | Shared fuzzy team-name matching | none | `lib/kalshi.ts`, `lib/polymarket.ts` | Improving match accuracy | Medium — shared by both platforms, a change here affects both |
| `lib/ev.ts` | Edge/EV/Kelly/American-odds math + bankroll constants | none | `lib/pick.ts` | Changing staking math, bankroll size, suggested-band thresholds | **High** — silent errors here are silent errors in every displayed number |
| `lib/pick.ts` | `makePick()` — the one place a `Pick` is constructed | `./ev`, `@/lib/types` | `lib/kalshi.ts`, `lib/polymarket.ts` | Changing what counts as a valid/tradeable pick | High — this is the filter gate; bypassing it elsewhere would let bad picks through |
| `lib/types.ts` | The `Pick` interface | none | Everywhere | Adding a field to a pick | Low |
| `public/bg-dark.png` | Stadium theme background | — | `app/globals.css` | Regenerating theme art | Low |
| `public/bg-light.png` | Paper theme background | — | `app/globals.css` | Same | Low |
| `public/bg-vegas.png` | Vegas theme background | — | `app/globals.css` | Same | Low |
| `public/bg-field.png` | Field theme background | — | `app/globals.css` | Same | Low |
| `package.json` / `package-lock.json` | Dependencies + scripts | — | npm/Vercel | Adding a dependency | Medium |
| `tsconfig.json` | `@/*` alias | — | Every `.ts`/`.tsx` | Rarely | Medium |
| `next.config.ts` | Empty/default | — | Next build | Rarely | Low |
| `.env.local` | Vercel CLI metadata only, gitignored | — | Not read by app | Never manually | Low |

## Where to make common changes

- **Add a supported sport:** add one entry to `SPORTS` in `lib/sports.ts` (`key`, `label`, `emoji`, `oddsKey`, `kalshiSeries`, `polyTag`). **Verify each of those three external identifiers against the live API first** (see `DECISIONS.md` — guessing them has caused real bugs before). No other file needs to change; `Dashboard.tsx` renders tabs from this array automatically.
- **Add a new page:** `app/<name>/page.tsx` — decide explicitly whether it needs the auth check (copy the pattern in `app/page.tsx`) or is meant to be public (copy `app/changelog/page.tsx`'s lack of one).
- **Add a new API route:** `app/api/<name>/route.ts` — **if it should be protected, you must add the cookie check yourself** (copy the 3 lines at the top of `app/api/scan/route.ts`); there is no middleware doing this for you.
- **Change the de-vig / EV / Kelly math:** `lib/oddsapi.ts` (de-vig) or `lib/ev.ts` (EV/Kelly/American-odds/bankroll/suggested-band constants).
- **Change matching accuracy/behavior:** `lib/match.ts` (shared) or the platform-specific candidate-filtering logic in `lib/kalshi.ts`/`lib/polymarket.ts`.
- **Change the auth/password scheme:** `lib/auth.ts`, and both call sites (`app/api/login/route.ts`, `app/api/scan/route.ts`, `app/page.tsx`).
- **Change themes:** same pattern as sibling repo — see that repo's `FILE_MAP.md` "Add a new theme" entry; identical mechanism here with `dark/light/vegas/field` instead of `dark/light/matrix/violet`.
- **Add an environment variable:** update `CLAUDE.md`'s Environment setup table and this file; set via `vercel env add <NAME> production` (and `preview`/`development` if those environments will be used — currently they are not configured, see `PROJECT_STATE.md`).
- **Modify global styles:** `app/globals.css` — same hardcoded-color risk noted throughout this doc set.
