import { BANKROLLS, edgePct, evPerDollar, kellyStake, inSuggestBand, isTradeable } from "./ev";
import type { Pick } from "./types";
import type { FairLine } from "./oddsapi";

export function makePick(
  platform: "Kalshi" | "Polymarket",
  sportLabel: string,
  marketTitle: string,
  side: string,
  price: number,
  line: FairLine
): Pick | null {
  if (!isTradeable(price)) return null;
  const fairProb = line.fairProbs[side];
  if (fairProb === undefined) return null;

  const edge = edgePct(fairProb, price);
  if (edge <= 0) return null;

  return {
    platform,
    sport: sportLabel,
    marketTitle,
    side,
    price,
    fairProb,
    edgePct: edge,
    evPerDollar: evPerDollar(fairProb, price),
    kellyStake: kellyStake(fairProb, price, BANKROLLS[platform]),
    commenceTime: line.commenceTime,
    suggested: inSuggestBand(price),
  };
}
