# DATABASE.md — sports-betting-web

Rewritten from scratch 2026-08-11, per this file's own prior instruction ("if a future task adds real persistence, do not attempt to retrofit this document") — the app went from "no database" to "Upstash Redis, one small dataset" in this session, added specifically to support the new background-notification feature (see `FEATURES.md`).

## Why a database exists now

The scan pipeline itself is still stateless (see "Actual data model" below, unchanged) — this isn't a data-warehousing addition. The new `/api/cron/scan` route runs unattended on a 15-minute schedule (`vercel.json`) and needs to remember, across otherwise-independent serverless invocations, which +EV picks it has already sent a push notification for. Without that memory, the same still-open pick would re-notify every single 15-minute cycle until the game starts.

## Provider

**Upstash Redis**, connected via Vercel's Storage tab (Marketplace Database Providers → Upstash → Redis), which auto-injects `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` into this project's Vercel env vars. Accessed via the `@upstash/redis` npm package (REST-based, no persistent connection/pooling concerns in a serverless context). All access is isolated in `lib/pushSubscriptions.ts` — nothing else in the codebase talks to Redis directly.

## Data model

Two key shapes, both keyed under an `sbw:push:` prefix so this data is trivially distinguishable from anything else that might ever land in the same Redis instance:

1. **`sbw:push:subscriptions`** — a single Redis hash. Field = a device's push subscription `endpoint` URL, value = the JSON-encoded `{endpoint, keys: {p256dh, auth}}` blob the browser's `PushManager.subscribe()` produced. No TTL — a subscription lives until the device unsubscribes (`app/api/push/unsubscribe/route.ts`) or a push delivery attempt gets a 404/410 from the push service, at which point `lib/notify.ts` prunes it automatically.
2. **`sbw:push:notified:<dedupToken>`** — one key per pick already notified about, value `"1"`, `EX 26h` TTL. `dedupToken` is `${sportKey}:${platform}:${marketTitle}:${side}:${commenceTime}` (built in `app/api/cron/scan/route.ts`) — stable across cron runs for the same market/side, so `SET ... NX` (`markNotifiedIfNew()`) atomically answers "have I seen this exact pick before" without a race condition between overlapping runs.

No user accounts, no per-user scoping — same as the rest of this app (`lib/auth.ts` is one shared password, not real accounts), so every stored subscription gets every notification.

## What is still NOT in the database

The core scan pipeline (`lib/runScan.ts`, used by both `/api/scan` and `/api/cron/scan`) is unchanged: still zero caching, still a fresh live fetch from The Odds API/Kalshi/Polymarket on every call, still nothing about scan *results* persisted anywhere. Theme choice is still `localStorage`-only. If a future task adds real result history, bet tracking, or user accounts, THIS section is the one that needs a from-scratch rewrite next time — the push-subscription/dedup model above is narrow and purpose-built, not a general data layer.

## Environment variables

See `DEPLOYMENT.md`/`CLAUDE.md`'s Environment setup table for the full list including `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`VAPID_SUBJECT`/`CRON_SECRET`. The two that matter for this file specifically: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`. If either is unset, `lib/pushSubscriptions.ts`'s `isPushConfigured()` returns false and every push-related route degrades gracefully (503/501 with a clear message) rather than crashing — verified live via `curl` against `/api/cron/scan` before Upstash was connected.
