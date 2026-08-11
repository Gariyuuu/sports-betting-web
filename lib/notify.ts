// Sends a real Web Push notification to every stored subscription.
// Fails open per-subscription (one expired/invalid subscription must
// never block delivery to the rest) and never throws out of
// sendPickNotification itself -- the cron scan route's job (finding and
// recording new picks) must never be taken down by a push-delivery
// failure, same "notifications are best-effort" posture as any provider
// in this pattern.
import webpush from "web-push";
import { listSubscriptions, removeSubscription, type StoredSubscription } from "./pushSubscriptions";

let _configured = false;

function ensureConfigured(): boolean {
  if (_configured) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:noreply@sports-betting-web.invalid";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  _configured = true;
  return true;
}

export async function sendPickNotification(title: string, body: string, url = "/"): Promise<{ sent: number; total: number }> {
  if (!ensureConfigured()) return { sent: 0, total: 0 };

  const subscriptions = await listSubscriptions();
  const payload = JSON.stringify({ title, body, data: { url } });
  let sent = 0;

  await Promise.all(
    subscriptions.map(async (sub: StoredSubscription) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          payload
        );
        sent += 1;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await removeSubscription(sub.endpoint).catch(() => {});
        }
        // any other failure: skip this subscription, never throw out of the batch
      }
    })
  );

  return { sent, total: subscriptions.length };
}
