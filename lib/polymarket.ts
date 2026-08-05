import type { FairLine } from "./oddsapi";
import { teamAppearsIn } from "./match";
import { makePick } from "./pick";
import type { Pick } from "./types";

const BASE_URL = "https://gamma-api.polymarket.com";

interface PolyMarket {
  question: string;
  outcomes: string; // JSON-encoded string array
  outcomePrices: string; // JSON-encoded string array
}

interface PolyEvent {
  title: string;
  markets: PolyMarket[];
}

async function fetchEvents(tagSlug: string): Promise<PolyEvent[]> {
  const url = `${BASE_URL}/events?tag_slug=${tagSlug}&limit=60&order=volume24hr&ascending=false`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

function parseJsonArray(raw: string): string[] {
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

// The moneyline market for a team-vs-team matchup has exactly two outcomes
// that are the team names themselves, and its question equals the event's
// own title. Spread/total/first-5-innings markets on the same event ALSO use
// team names as outcomes (e.g. "Spread: Blue Jays (-4.5)"), so outcome shape
// alone isn't enough to identify moneyline — the question-vs-title match is
// what rules those out.
function isMoneylineMarket(
  m: PolyMarket,
  eventTitle: string
): { outcomes: [string, string]; prices: [number, number] } | null {
  if (m.question.trim().toLowerCase() !== eventTitle.trim().toLowerCase()) return null;
  const outcomes = parseJsonArray(m.outcomes);
  const prices = parseJsonArray(m.outcomePrices).map(Number);
  if (outcomes.length !== 2 || prices.length !== 2) return null;
  const generic = new Set(["yes", "no", "over", "under", "draw"]);
  if (outcomes.some((o) => generic.has(o.toLowerCase()))) return null;
  return { outcomes: [outcomes[0], outcomes[1]], prices: [prices[0], prices[1]] };
}

function findUniqueFairLine(
  fairLines: FairLine[],
  outcomeA: string,
  outcomeB: string
): { line: FairLine; sideForA: string; sideForB: string } | null {
  const matches = fairLines
    .map((line) => {
      const aIsHome = teamAppearsIn(line.homeTeam, outcomeA);
      const aIsAway = teamAppearsIn(line.awayTeam, outcomeA);
      const bIsHome = teamAppearsIn(line.homeTeam, outcomeB);
      const bIsAway = teamAppearsIn(line.awayTeam, outcomeB);
      if (aIsHome && bIsAway) return { line, sideForA: line.homeTeam, sideForB: line.awayTeam };
      if (aIsAway && bIsHome) return { line, sideForA: line.awayTeam, sideForB: line.homeTeam };
      return null;
    })
    .filter((m): m is { line: FairLine; sideForA: string; sideForB: string } => m !== null);

  return matches.length === 1 ? matches[0] : null;
}

export async function scanPolymarket(
  sportLabel: string,
  tagSlug: string,
  fairLines: FairLine[]
): Promise<Pick[]> {
  const events = await fetchEvents(tagSlug);
  const picks: Pick[] = [];

  for (const event of events) {
    for (const market of event.markets) {
      const ml = isMoneylineMarket(market, event.title);
      if (!ml) continue;
      const [outcomeA, outcomeB] = ml.outcomes;
      const [priceA, priceB] = ml.prices;

      const matched = findUniqueFairLine(fairLines, outcomeA, outcomeB);
      if (!matched) continue;

      const pickA = makePick("Polymarket", sportLabel, market.question, matched.sideForA, priceA, matched.line);
      if (pickA) picks.push(pickA);
      const pickB = makePick("Polymarket", sportLabel, market.question, matched.sideForB, priceB, matched.line);
      if (pickB) picks.push(pickB);
    }
  }

  return picks;
}
