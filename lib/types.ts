export interface Pick {
  platform: "Kalshi" | "Polymarket";
  sport: string;
  marketTitle: string;
  side: string;
  price: number; // probability, 0-1
  fairProb: number;
  edgePct: number;
  evPerDollar: number;
  kellyStake: number;
  commenceTime: string;
  suggested: boolean;
}
