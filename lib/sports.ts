export interface SportConfig {
  key: string;
  label: string;
  oddsKey: string; // The Odds API sport key
  kalshiSeries?: string; // Kalshi series ticker for game-winner markets
  polyTag?: string; // Polymarket Gamma tag_slug
}

// v1 subset — moneyline only. Tennis/boxing (rotating Odds API keys) and
// season-record / alt-line enrichment from the original bot are not yet ported.
export const SPORTS: SportConfig[] = [
  { key: "mlb", label: "MLB", oddsKey: "baseball_mlb", kalshiSeries: "KXMLBGAME", polyTag: "mlb" },
  { key: "nba", label: "NBA", oddsKey: "basketball_nba", kalshiSeries: "KXNBAGAME", polyTag: "nba" },
  { key: "wnba", label: "WNBA", oddsKey: "basketball_wnba", kalshiSeries: "KXWNBAGAME", polyTag: "wnba" },
  { key: "nfl", label: "NFL", oddsKey: "americanfootball_nfl", kalshiSeries: "KXNFLGAME", polyTag: "nfl" },
  { key: "epl", label: "EPL", oddsKey: "soccer_epl", kalshiSeries: "KXEPLGAME", polyTag: "epl" },
  { key: "mls", label: "MLS", oddsKey: "soccer_usa_mls", kalshiSeries: "KXMLSGAME", polyTag: "mls" },
];

export function sportByKey(key: string): SportConfig | undefined {
  return SPORTS.find((s) => s.key === key);
}
