# DEPLOYMENT.md — sports-betting-web

## Hosting platform

Vercel. Project: `garywangsmes-8349s-projects/sports-betting-web` (Verified via `vercel` CLI output).

## Production URL

`https://sports-betting-web.vercel.app` (Verified — login flow works, dashboard returns 200 with a valid cookie, as of this audit).

## Project configuration

No `vercel.json` — Vercel defaults for a Next.js App Router project.

## Build command

`next build` (default). Locally: `npm run build`.

## Install command

`npm install` (default, `package-lock.json` present).

## Runtime version

Not pinned in-repo. **Unknown** exact Vercel default without checking the dashboard directly.

## Output configuration

Default Next.js server output (API routes require it — not a static export).

## Environment variables

**Required for full functionality:** `ODDS_API_KEY`, `SITE_PASSWORD`. Both currently set on Vercel for **Production only** (Verified via `vercel env ls` — not Preview, not Development). See `CLAUDE.md`/`SECURITY.md` for the implications.

**Setting them:**
```
printf '%s' 'the-real-key' | vercel env add ODDS_API_KEY production
printf '%s' 'the-real-password' | vercel env add SITE_PASSWORD production
```

**Rotating `SITE_PASSWORD`** (done once this session):
```
vercel env rm SITE_PASSWORD production --yes
printf '%s' 'new-password' | vercel env add SITE_PASSWORD production
```
Then redeploy (`vercel --prod --yes`) — env var changes require a new deployment to take effect; they are baked in at build/deploy time, not read live from the Vercel dashboard by an already-running deployment.

## Domains

Only the default `*.vercel.app` domain (`sports-betting-web.vercel.app`) has been used and verified. **Unknown** whether a custom domain exists.

## Preview deployments

Would not currently have working `ODDS_API_KEY`/`SITE_PASSWORD` (Production-only env vars) — see `PROJECT_STATE.md`/`TASKS.md` T-002. Every `vercel --prod --yes` this session also produced a per-deploy preview-style URL before aliasing to production, per standard Vercel behavior.

## Database deployment / migrations

Not applicable.

## Storage setup

Not applicable.

## External service setup

- **The Odds API:** requires an account and API key, obtained outside this repo/Vercel (the key itself is reused from a sibling repo — see `SECURITY.md`). No setup steps exist in this codebase beyond setting the env var.
- **Kalshi / Polymarket:** no account/key needed (public APIs).

## Scheduled jobs / webhooks

None.

## Build failures

None encountered this session. First check for any future failure: a TypeScript error (build includes type-checking) or a missing/renamed export from `lib/`.

## Runtime limitations

Standard Vercel serverless function limits apply to `/api/scan`, which makes up to 3 sequential/parallel external calls per invocation — not observed to be a timeout concern this session, but worth knowing if The Odds API/Kalshi/Polymarket ever become slow.

## Rollback procedure

Standard Vercel rollback (`vercel rollback` or dashboard). Not exercised this session.

## Deployment checklist

1. `git status` — confirm intended changes are committed.
2. `npm run build` locally — must be clean.
3. `vercel env ls` — confirm `ODDS_API_KEY` and `SITE_PASSWORD` are still set for Production.
4. `git push` and/or `vercel --prod --yes`.
5. `curl` the production URL's public routes (`/login`, `/changelog`, icons/backgrounds) to confirm 200s.
6. Do a real login + scan round-trip against the live URL to confirm the full pipeline still works (this is the one check that can't be replaced by a simple `curl -o /dev/null`, since it requires the auth cookie flow).

## Post-deployment verification (performed this session, every deploy)

`curl` checks against public routes; real login+scan round trip; Playwright screenshots of all 4 themes after the final deploy.

## Cron Jobs (added 2026-08-11)

`vercel.json` declares one cron: `/api/cron/scan` on `*/15 * * * *`. Requires the account's Vercel plan to support sub-daily cron frequency (Hobby/free plans historically restrict Cron Jobs to once/day) — this account is inferred to be on a Pro plan (seen in an OIDC token during a separate project's deploy this same session), not independently re-confirmed for this specific project. Verify with `vercel crons ls` after any deploy that touches `vercel.json`. The cron route is gated by `CRON_SECRET` (see `SECURITY.md`), not the site-password cookie.

## Storage integration (added 2026-08-11)

Push notifications require Upstash Redis, connected via Vercel's Storage tab (Marketplace Database Providers → Upstash → Redis → connect to this project) rather than the `vercel` CLI (no `storage`/`kv` subcommand exists in the CLI version used this session). This is a one-time manual dashboard action — once connected, `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` are auto-injected and no further deploy steps are needed. See `DATABASE.md`.
