import { NextRequest, NextResponse } from "next/server";
import { SPORTS } from "@/lib/sports";
import { runScan } from "@/lib/runScan";
import { markNotifiedIfNew, isPushConfigured } from "@/lib/pushSubscriptions";
import { sendPickNotification } from "@/lib/notify";
import type { Pick } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 6 sequential-ish sport scans, each up to 3 external calls -- give it room

// Runs on Vercel Cron (see vercel.json, every 15 min) -- NOT cookie-
// gated like every other route in this app (a cron trigger can't log
// in), gated instead by CRON_SECRET, which Vercel automatically sends
// as `Authorization: Bearer <CRON_SECRET>` on requests it triggers once
// that env var is set. This is the one route in the app that
// legitimately runs unattended and spends ODDS_API_KEY credits on a
// schedule rather than a click -- see DEPLOYMENT.md for the real cost
// tradeoff this was built with eyes open about (owner picked the 15-min
// interval knowing it burns ~6 Odds API calls every cycle, ~576/day).
function isAuthorizedCronRequest(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // never allow an unauthenticated run
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

function dedupToken(sportKey: string, p: Pick): string {
  return `${sportKey}:${p.platform}:${p.marketTitle}:${p.side}:${p.commenceTime}`;
}

// If the dedup store is empty (first run after deploy, or Redis was ever
// cleared), every currently-open pick looks "new" at once -- send one
// summary instead of flooding a phone with a dozen individual pushes.
const SUMMARY_THRESHOLD = 5;

export async function GET(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ODDS_API_KEY not configured" }, { status: 501 });
  }
  if (!isPushConfigured()) {
    return NextResponse.json({ error: "push storage (Upstash Redis) not configured" }, { status: 501 });
  }

  const errors: { sport: string; error: string }[] = [];
  const newPicks: { sportLabel: string; pick: Pick }[] = [];

  for (const sport of SPORTS) {
    try {
      const result = await runScan(sport, apiKey, false);
      for (const pick of result.suggested) {
        const isNew = await markNotifiedIfNew(dedupToken(sport.key, pick));
        if (isNew) newPicks.push({ sportLabel: result.sport, pick });
      }
    } catch (err) {
      errors.push({ sport: sport.key, error: err instanceof Error ? err.message : "unknown error" });
    }
  }

  let notified = 0;
  if (newPicks.length > 0 && newPicks.length <= SUMMARY_THRESHOLD) {
    for (const { sportLabel, pick } of newPicks) {
      const pct = (pick.edgePct * 100).toFixed(1);
      await sendPickNotification(
        `${sportLabel}: +${pct}% edge`,
        `${pick.side} on ${pick.platform} -- ${pick.marketTitle}`,
        "/"
      );
      notified += 1;
    }
  } else if (newPicks.length > SUMMARY_THRESHOLD) {
    await sendPickNotification(
      `${newPicks.length} new +EV picks found`,
      newPicks
        .slice(0, 3)
        .map((n) => `${n.pick.side} (${n.sportLabel})`)
        .join(", ") + (newPicks.length > 3 ? `, +${newPicks.length - 3} more` : ""),
      "/"
    );
    notified = 1;
  }

  return NextResponse.json({
    ranAt: new Date().toISOString(),
    sportsScanned: SPORTS.length,
    newPicksFound: newPicks.length,
    notificationsSent: notified,
    errors,
  });
}
