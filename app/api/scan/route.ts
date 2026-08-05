import { NextRequest, NextResponse } from "next/server";
import { sportByKey } from "@/lib/sports";
import { fetchFairLines, OddsApiError } from "@/lib/oddsapi";
import { scanKalshi } from "@/lib/kalshi";
import { scanPolymarket } from "@/lib/polymarket";
import type { Pick } from "@/lib/types";
import { authCookieName, isValidCookieToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

function isTodayOrTomorrowOrAll(iso: string, allDates: boolean): boolean {
  if (allDates) return true;
  const now = new Date();
  const target = new Date(iso);
  const dayMs = 24 * 60 * 60 * 1000;
  const todayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const diff = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate()) - todayStart;
  return diff >= 0 && diff <= dayMs;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(authCookieName())?.value;
  if (!isValidCookieToken(token)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  const sportKey = params.get("sport") ?? "";
  const allDates = params.get("allDates") === "true";

  const sport = sportByKey(sportKey);
  if (!sport) {
    return NextResponse.json({ error: `unknown sport "${sportKey}"` }, { status: 400 });
  }

  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ODDS_API_KEY is not configured on this deployment yet. Add it in Vercel project settings." },
      { status: 501 }
    );
  }

  try {
    const fairLines = await fetchFairLines(sport.oddsKey, apiKey);
    const filteredLines = fairLines.filter((l) => isTodayOrTomorrowOrAll(l.commenceTime, allDates));

    const [kalshiPicks, polyPicks] = await Promise.all([
      sport.kalshiSeries ? scanKalshi(sport.label, sport.kalshiSeries, filteredLines) : Promise.resolve([]),
      sport.polyTag ? scanPolymarket(sport.label, sport.polyTag, filteredLines) : Promise.resolve([]),
    ]);

    const picks: Pick[] = [...kalshiPicks, ...polyPicks].sort((a, b) => b.edgePct - a.edgePct);
    const suggested = picks.filter((p) => p.suggested);
    const other = picks.filter((p) => !p.suggested);

    return NextResponse.json({
      sport: sport.label,
      eventsScanned: fairLines.length,
      eventsInWindow: filteredLines.length,
      suggested,
      other,
      ts: Date.now(),
    });
  } catch (err) {
    if (err instanceof OddsApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status === 401 ? 502 : err.status });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown error" },
      { status: 502 }
    );
  }
}
