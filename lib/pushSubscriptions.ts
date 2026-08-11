// Push subscription storage + cron dedup, both backed by Upstash Redis
// (env vars UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN -- auto-
// injected if connected via Vercel's Storage tab). This is the first
// database this app has ever had (see DATABASE.md) -- added specifically
// because the cron scan route needs to remember which picks it already
// pushed a notification for across otherwise-stateless serverless
// invocations, and a real device needs somewhere durable to register
// its subscription. No user accounts exist (single shared password, see
// lib/auth.ts), so all subscriptions are just "every device that opted
// in," not scoped per-user.
import { Redis } from "@upstash/redis";

const SUBSCRIPTIONS_KEY = "sbw:push:subscriptions"; // Redis hash: endpoint -> JSON-encoded subscription
const NOTIFIED_PREFIX = "sbw:push:notified:"; // one key per dedup token, TTL-expired

export interface StoredSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

let _client: Redis | null = null;

function client(): Redis | null {
  if (_client) return _client;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null; // not configured -- callers treat this as "push disabled", never crash
  _client = new Redis({ url, token });
  return _client;
}

export function isPushConfigured(): boolean {
  return client() !== null;
}

export async function addSubscription(sub: StoredSubscription): Promise<void> {
  const redis = client();
  if (!redis) throw new Error("push storage not configured");
  await redis.hset(SUBSCRIPTIONS_KEY, { [sub.endpoint]: JSON.stringify(sub) });
}

export async function removeSubscription(endpoint: string): Promise<void> {
  const redis = client();
  if (!redis) throw new Error("push storage not configured");
  await redis.hdel(SUBSCRIPTIONS_KEY, endpoint);
}

export async function listSubscriptions(): Promise<StoredSubscription[]> {
  const redis = client();
  if (!redis) return [];
  const all = await redis.hgetall<Record<string, string>>(SUBSCRIPTIONS_KEY);
  if (!all) return [];
  return Object.values(all).map((v) => (typeof v === "string" ? JSON.parse(v) : v) as StoredSubscription);
}

// Atomic check-and-mark via SET NX: returns true the FIRST time a given
// dedup token is seen, false every time after (until the TTL expires).
// This is what turns "the cron job re-scans everything every 15 minutes"
// into "you only get notified once per pick" -- without it, the same
// still-open pick would re-notify every single cycle until game time.
// TTL is 26h: long enough to outlive any single game (all six sports in
// lib/sports.ts finish well under a day), short enough that the dedup
// set doesn't grow unbounded.
export async function markNotifiedIfNew(dedupToken: string): Promise<boolean> {
  const redis = client();
  if (!redis) return false;
  const result = await redis.set(NOTIFIED_PREFIX + dedupToken, "1", { nx: true, ex: 26 * 60 * 60 });
  return result === "OK";
}
