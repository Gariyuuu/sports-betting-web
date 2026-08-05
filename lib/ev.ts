// Exact port of the EV / staking math in sports_betting_bot.py

export const BANKROLLS: Record<"Kalshi" | "Polymarket", number> = {
  Kalshi: 250.0,
  Polymarket: 250.0,
};

export const KELLY_FRACTION = 0.25;
export const SUGGEST_MIN_PRICE = 200 / 300; // -200 American
export const SUGGEST_MAX_PRICE = 1000 / 1100; // -1000 American
export const MIN_TRADABLE_PRICE = 0.02;
export const MAX_TRADABLE_PRICE = 0.98;

export function edgePct(fairProb: number, price: number): number {
  return fairProb - price;
}

export function evPerDollar(fairProb: number, price: number): number {
  return price > 0 ? fairProb / price - 1 : 0;
}

export function kellyStake(fairProb: number, price: number, bankroll: number): number {
  if (price >= 1 || price <= 0) return 0;
  const fullKelly = (fairProb - price) / (1 - price);
  return Math.max(0, fullKelly * KELLY_FRACTION * bankroll);
}

export function priceToAmerican(price: number): number {
  if (price >= 0.5) return -Math.round((price / (1 - price)) * 100);
  return Math.round(((1 - price) / price) * 100);
}

export function americanStr(price: number): string {
  const a = priceToAmerican(price);
  return a > 0 ? `+${a}` : `${a}`;
}

export function inSuggestBand(price: number): boolean {
  return price >= SUGGEST_MIN_PRICE && price <= SUGGEST_MAX_PRICE;
}

export function isTradeable(price: number): boolean {
  return price >= MIN_TRADABLE_PRICE && price <= MAX_TRADABLE_PRICE;
}
