"use client";

import { useEffect, useState } from "react";
import { urlBase64ToUint8Array } from "@/lib/pushClient";

type Status =
  | "checking"
  | "unsupported"
  | "server-unconfigured"
  | "denied"
  | "enabled"
  | "disabled"
  | "working";

// Real Web Push -- gets you a phone notification the moment the
// background cron scan (app/api/cron/scan/route.ts, every 15 min) finds
// a new +EV pick it hasn't already notified you about. Same pattern as
// ~/Projects/quantdesk/apps/web/components/notifications-toggle.tsx.
export default function NotificationsToggle() {
  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void refreshStatus();
  }, []);

  async function refreshStatus() {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    const keyRes = await fetch("/api/push/vapid-key").catch(() => null);
    const keyData = keyRes && keyRes.ok ? await keyRes.json() : { publicKey: "" };
    if (!keyData.publicKey) {
      setStatus("server-unconfigured");
      return;
    }
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    setStatus(existing ? "enabled" : "disabled");
  }

  async function enable() {
    setStatus("working");
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }
      const keyRes = await fetch("/api/push/vapid-key");
      const { publicKey } = await keyRes.json();
      if (!publicKey) {
        setStatus("server-unconfigured");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!res.ok) throw new Error(`server rejected subscription (${res.status})`);
      setStatus("enabled");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enable notifications.");
      await refreshStatus();
    }
  }

  async function disable() {
    setStatus("working");
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setStatus("disabled");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disable notifications.");
      await refreshStatus();
    }
  }

  const labels: Record<Status, string> = {
    checking: "Notifications…",
    unsupported: "Notifications unsupported",
    "server-unconfigured": "Notifications not configured",
    denied: "Notifications blocked",
    enabled: "🔔 Notifications on",
    disabled: "🔕 Notifications off",
    working: "Notifications…",
  };

  const canToggle = status === "enabled" || status === "disabled";
  const title =
    status === "server-unconfigured"
      ? "Push isn't configured on this deployment yet"
      : status === "denied"
        ? "Blocked -- enable notifications for this site in your browser settings"
        : status === "unsupported"
          ? "This browser doesn't support push notifications"
          : "Get a phone alert when a new +EV pick appears";

  return (
    <button
      type="button"
      className="nav-link"
      title={title}
      disabled={!canToggle}
      onClick={canToggle ? (status === "enabled" ? disable : enable) : undefined}
      style={canToggle ? undefined : { opacity: 0.55, cursor: "default" }}
    >
      {labels[status]}
      {error && " ⚠"}
    </button>
  );
}
