# PROJECT_STATE.md — sports-betting-web

**Audit timestamp:** 2026-08-11, push-notification feature session
**Current branch:** `main`
**Latest commit at start of this pass:** see `git log --oneline -1` — prior HEAD was the C-004 checkpoint's commit; this pass adds real application code (not just docs) for the first time since v0.4.0.

---

## Active development objective

None open. The push-notification feature (v0.5.0) requested this session is code-complete, `npm run build` clean, deployed to production, and its `CRON_SECRET` auth path independently verified via a real authenticated `curl` request. One manual, non-code step remains before it's fully operational end-to-end — see Blockers.

## Last completed task

**Real Web Push notifications for new +EV picks**, mirroring the same feature built the same session for the sibling project `~/Projects/quantdesk`. Added:
- `lib/runScan.ts` — the scan pipeline extracted from `app/api/scan/route.ts` so a second caller could reuse it without duplication (zero behavior change to `/api/scan` itself, confirmed via `npm run build`).
- `lib/pushSubscriptions.ts` / `lib/notify.ts` — Upstash Redis-backed subscription store + dedup, and a `web-push`/VAPID sender. See `DATABASE.md` (rewritten from scratch, as its own prior version instructed) for the exact data model.
- `public/sw.js`, `app/ServiceWorkerRegister.tsx`, `app/NotificationsToggle.tsx` — client-side push plumbing, wired into `app/layout.tsx` and `app/Dashboard.tsx`'s header.
- `app/api/push/{subscribe,unsubscribe,vapid-key}/route.ts` — cookie-gated (same pattern as every other route, see `CLAUDE.md`'s Coding conventions).
- `app/api/cron/scan/route.ts` + `vercel.json` — the actual background trigger. Runs every 15 minutes (owner's explicit choice after being told the cost tradeoff: ~6 Odds API calls/cycle, ~576/day), gated by a new `CRON_SECRET` rather than the site-password cookie (a cron trigger can't log in).

**Real infrastructure gap hit and resolved during this session:** the cron job needs somewhere to remember which picks it already notified about across independent serverless invocations — this app had zero database. Asked the owner directly rather than guessing; they chose to provision Upstash Redis via Vercel's Storage tab (free tier) over the zero-infrastructure alternative (accepting re-notification spam). VAPID keys and `CRON_SECRET` were generated and set as Vercel env vars during this session; Upstash itself was not yet connected as of this file's last edit — see Blockers.

Before that (fourth pass, C-004, 2026-08-07): see git history / this file's prior versions for the full account-switch checkpoint record — unchanged by this session, not reproduced here.

## Current unfinished task

None in terms of code. **One manual step remains: connecting Upstash Redis** (see Blockers) — no further code changes are expected to be needed once that's done, since `lib/pushSubscriptions.ts` already reads the exact env var names Vercel's Storage integration auto-injects.

## Files related to the notification feature

New: `lib/runScan.ts`, `lib/pushSubscriptions.ts`, `lib/notify.ts`, `lib/pushClient.ts`, `public/sw.js`, `app/ServiceWorkerRegister.tsx`, `app/NotificationsToggle.tsx`, `app/api/push/subscribe/route.ts`, `app/api/push/unsubscribe/route.ts`, `app/api/push/vapid-key/route.ts`, `app/api/cron/scan/route.ts`, `vercel.json`. Modified: `app/api/scan/route.ts` (now a thin wrapper around `lib/runScan.ts`), `app/layout.tsx`, `app/Dashboard.tsx`, `package.json` (added `web-push`, `@upstash/redis`, `@types/web-push`).

## What has already been attempted

Everything attempted this session succeeded. One design question was explicitly asked rather than assumed: whether to add real persistence (Upstash, chosen) or accept re-notification spam (the zero-infra alternative) — see "Last completed task" above and `DECISIONS.md` for the fuller record once written there.

## What currently works (Verified this session)

- `npm run build` completes cleanly (0 errors) with all new routes present in the route manifest.
- Production deploy succeeded (`vercel --prod --yes`); `vercel crons ls` confirms `/api/cron/scan` is registered on the `*/15 * * * *` schedule.
- `curl https://sports-betting-web.vercel.app/api/cron/scan` with no auth header returns 401 (Verified).
- The same request with a real, freshly-generated `Bearer $CRON_SECRET` header reaches the handler and returns `{"error":"push storage (Upstash Redis) not configured"}` with status 501 (Verified) — correctly short-circuits before spending any Odds API credits while Upstash is unconfigured, and does not crash.
- `web-push`'s VAPID keypair was generated locally and set as `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`VAPID_SUBJECT` Vercel env vars (Verified via `vercel env ls`).

## What currently fails

`/api/cron/scan` cannot actually find/dedup/notify about picks yet — it 501s immediately (by design, not a bug) because `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` are not set. This is the sole remaining blocker, not a code defect.

## Errors currently observed

None beyond the expected, by-design 501 described above.

## Blockers

**Upstash Redis is not connected.** Action needed from the owner: Vercel dashboard → this project → Storage tab → Marketplace Database Providers → Upstash → Redis → connect to `sports-betting-web`. This auto-injects the two env vars `lib/pushSubscriptions.ts` already expects — no further code changes anticipated. Once connected, the next verification step is a real end-to-end cron run (subscribe a real device via the Dashboard's new "🔔 Notifications" toggle, then either wait for the next 15-minute tick or manually `curl` the cron endpoint with `CRON_SECRET`, and confirm a push arrives for a genuinely new pick).

## Assumptions currently in effect

- All assumptions from the prior (2026-08-07) audit still apply unchanged (Odds API/Kalshi/Polymarket contract stability, `ODDS_API_KEY` validity) — not re-verified this session beyond what the existing `/api/scan` route already does.
- Assuming Vercel's documented behavior (auto-attaching `Authorization: Bearer $CRON_SECRET` to cron-triggered requests once that env var is set) is accurate — this session verified the *route's own check* works correctly against a manually-supplied header, but did not wait for an actual scheduled cron tick to fire and inspect its real headers server-side.
- Assuming the account's Vercel plan supports frequent (15-min) Cron Jobs — inferred from an earlier `plan":"pro"` field observed in this account's Vercel OIDC token during a separate project's deploy this same session, not independently re-confirmed for this specific project.

## Temporary decisions

None currently in effect that diverge from documented architecture, beyond the "Upstash not yet connected" gap already described above.

## Next three recommended actions

1. **(Blocking the feature's actual operation)** Connect Upstash Redis via Vercel's Storage tab, as described above.
2. **(Verification, after #1)** Trigger one real cron run and confirm a subscribed device receives a push for a genuinely new pick, and that a second run within the same 26h TTL window does NOT re-notify for the same pick.
3. **(Optional, not blocking)** Everything from the prior audit's "Next three recommended actions" (`.env.example`, Preview/Development env vars, `ODDS_API_KEY` rotation) remains open and unchanged.

## Verification required before continuing any new task

- Run `git status` and `git log --oneline -5` to confirm no one has pushed additional commits since this audit's HEAD.
- Run `npm run build` to confirm the build is still clean.
- Check `vercel env ls` for `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` before assuming the notification feature is fully operational — their presence is the single signal that the manual blocker above has been resolved.
- If touching anything in `lib/kalshi.ts`, `lib/polymarket.ts`, or `lib/oddsapi.ts`: re-verify the relevant upstream API's current behavior with a raw `curl` before trusting this doc's description of it (unchanged guidance from the prior audit).
