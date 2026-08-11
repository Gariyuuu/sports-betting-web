// The scan pipeline itself, factored out of app/api/scan/route.ts so
// app/api/cron/scan/route.ts (the new background notification trigger)
// can call the exact same fetch/match/sort logic instead of duplicating
// it -- same "isolate shared logic once" convention as lib/match.ts and
// lib/pick.ts (see CLAUDE.md's Coding conventions).
import { fetchFairLines, OddsApiError } from "./oddsapi";
import { scanKalshi } from "./kalshi";
import { scanPolymarket } from "./polymarket";
import type { SportConfig } from "./sports";
import type { Pick } from "./types";

export interface ScanResult {
  sport: string;
  eventsScanned: number;
  eventsInWindow: number;
  suggested: Pick[];
  other: Pick[];
  ts: number;
}

export function isTodayOrTomorrowOrAll(iso: string, allDates: boolean): boolean {
  if (allDates) return true;
  const now = new Date();
  const target = new Date(iso);
  const dayMs = 24 * 60 * 60 * 1000;
  const todayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const diff = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate()) - todayStart;
  return diff >= 0 && diff <= dayMs;
}

export { OddsApiError };

export async function runScan(sport: SportConfig, apiKey: string, allDates: boolean): Promise<ScanResult> {
  const fairLines = await fetchFairLines(sport.oddsKey, apiKey);
  const filteredLines = fairLines.filter((l) => isTodayOrTomorrowOrAll(l.commenceTime, allDates));

  const [kalshiPicks, polyPicks] = await Promise.all([
    sport.kalshiSeries ? scanKalshi(sport.label, sport.kalshiSeries, filteredLines) : Promise.resolve([]),
    sport.polyTag ? scanPolymarket(sport.label, sport.polyTag, filteredLines) : Promise.resolve([]),
  ]);

  const picks: Pick[] = [...kalshiPicks, ...polyPicks].sort((a, b) => b.edgePct - a.edgePct);
  const suggested = picks.filter((p) => p.suggested);
  const other = picks.filter((p) => !p.suggested);

  return {
    sport: sport.label,
    eventsScanned: fairLines.length,
    eventsInWindow: filteredLines.length,
    suggested,
    other,
    ts: Date.now(),
  };
}
