// Fair-value line construction from The Odds API — de-vigged sportsbook
// consensus, moneyline only for v1 (spreads/totals/BTTS alt-markets from the
// original bot are not yet ported).

const BASE_URL = "https://api.the-odds-api.com/v4";

interface OddsOutcome {
  name: string;
  price: number; // decimal odds
}

interface OddsMarket {
  key: string;
  outcomes: OddsOutcome[];
}

interface OddsBookmaker {
  key: string;
  title: string;
  markets: OddsMarket[];
}

interface OddsEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsBookmaker[];
}

export interface FairLine {
  eventId: string;
  sportKey: string;
  commenceTime: string;
  homeTeam: string;
  awayTeam: string;
  fairProbs: Record<string, number>; // team name -> de-vigged fair probability
}

export class OddsApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function fetchFairLines(oddsKey: string, apiKey: string): Promise<FairLine[]> {
  const url = `${BASE_URL}/sports/${oddsKey}/odds?apiKey=${apiKey}&regions=us&markets=h2h&oddsFormat=decimal`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new OddsApiError(`Odds API ${res.status}: ${body.slice(0, 200)}`, res.status);
  }
  const events: OddsEvent[] = await res.json();
  return events.map(buildFairLine);
}

function buildFairLine(event: OddsEvent): FairLine {
  const totals: Record<string, number> = {};
  let bookCount = 0;

  for (const book of event.bookmakers) {
    const h2h = book.markets.find((m) => m.key === "h2h");
    if (!h2h || h2h.outcomes.length === 0) continue;

    const implied = h2h.outcomes.map((o) => ({ name: o.name, implied: o.price > 0 ? 1 / o.price : 0 }));
    const sum = implied.reduce((acc, o) => acc + o.implied, 0);
    if (sum <= 0) continue;

    for (const o of implied) {
      totals[o.name] = (totals[o.name] ?? 0) + o.implied / sum;
    }
    bookCount += 1;
  }

  const fairProbs: Record<string, number> = {};
  if (bookCount > 0) {
    for (const [name, total] of Object.entries(totals)) {
      fairProbs[name] = total / bookCount;
    }
  }

  return {
    eventId: event.id,
    sportKey: event.sport_key,
    commenceTime: event.commence_time,
    homeTeam: event.home_team,
    awayTeam: event.away_team,
    fairProbs,
  };
}
