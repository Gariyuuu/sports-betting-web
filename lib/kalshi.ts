import type { FairLine } from "./oddsapi";
import { resolveSide, teamAppearsIn } from "./match";
import { makePick } from "./pick";
import type { Pick } from "./types";

const BASE_URL = "https://api.elections.kalshi.com/trade-api/v2";

interface KalshiMarket {
  ticker: string;
  event_ticker: string;
  title: string;
  yes_sub_title: string;
  no_sub_title: string;
  yes_ask_dollars: string;
  close_time: string;
  expected_expiration_time: string;
  status: string;
}

// Kalshi's `status` query filter only accepts unopened/open/closed/settled —
// "open" turns out to mean "not yet tradeable" (returns far-future markets),
// while today/tomorrow's tradeable games carry status "active" internally.
// So fetch everything and filter client-side instead of relying on the param.
async function fetchAllMarkets(seriesTicker: string): Promise<KalshiMarket[]> {
  const markets: KalshiMarket[] = [];
  let cursor = "";
  for (let page = 0; page < 10; page++) {
    const url = `${BASE_URL}/markets?series_ticker=${seriesTicker}&limit=200${cursor ? `&cursor=${cursor}` : ""}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) break;
    const data = await res.json();
    markets.push(...(data.markets ?? []));
    cursor = data.cursor ?? "";
    if (!cursor) break;
  }
  return markets.filter((m) => m.status === "active");
}

// Kalshi's close_time can be days after the actual game (it stays open in
// case of postponement), so anchor the match window on expected_expiration_time
// instead — that tracks the scheduled game finish, only a few hours after
// commence_time. Only consider Odds API fair lines within that window, to
// disambiguate same-day matchups before falling back to name matching.
function candidateFairLines(lines: FairLine[], market: KalshiMarket): FairLine[] {
  const anchor = market.expected_expiration_time || market.close_time;
  const anchorMs = new Date(anchor).getTime();
  const WINDOW_MS = 30 * 60 * 60 * 1000;
  return lines.filter((l) => Math.abs(new Date(l.commenceTime).getTime() - anchorMs) <= WINDOW_MS);
}

export async function scanKalshi(
  sportLabel: string,
  seriesTicker: string,
  fairLines: FairLine[]
): Promise<Pick[]> {
  const markets = await fetchAllMarkets(seriesTicker);
  const picks: Pick[] = [];

  for (const m of markets) {
    const price = parseFloat(m.yes_ask_dollars);
    if (!Number.isFinite(price) || price <= 0) continue;

    const candidates = candidateFairLines(fairLines, m);
    for (const line of candidates) {
      const side = resolveSide(line.homeTeam, line.awayTeam, m.yes_sub_title || m.title);
      if (!side) continue;
      const otherSide = side === line.homeTeam ? line.awayTeam : line.homeTeam;
      // Sanity check: the market title should also reference the matchup's
      // other side somewhere (helps rule out same-day coincidental name hits).
      if (!teamAppearsIn(otherSide, m.title)) continue;

      const pick = makePick("Kalshi", sportLabel, m.title, side, price, line);
      if (pick) picks.push(pick);
      break;
    }
  }

  return picks;
}
