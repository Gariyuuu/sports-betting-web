import Link from "next/link";

const ENTRIES = [
  {
    version: "v0.4.0",
    date: "2026-08-05",
    items: [
      "Real favicon/app icon (target mark) instead of the blank default.",
      "Replaced the light/dark slider with a 4-way theme wheel: Stadium (dark), Paper (light), Vegas, Field.",
      "Regenerated every background: much stronger, more visible glow + dot grid in the dark themes (the old overlay was muting the PNG too much), and a near-solid, minimal Paper background instead of the washed-out cream one.",
    ],
  },
  {
    version: "v0.3.0",
    date: "2026-08-05",
    items: [
      "Real PNG background art for dark and light modes — stadium glow + scoreboard dot grid.",
      "Light/dark theme slider in the header, persisted per-browser.",
      "This patch notes page.",
    ],
  },
  {
    version: "v0.2.0",
    date: "2026-08-05",
    items: [
      "Redesigned as a sportsbook-style scanner: emoji sport-pill tabs, gold \"suggested bets\" hero cards with big edge numbers.",
      "Added a mini edge-meter bar to the results table and Kalshi/Polymarket color-coded platform badges.",
      "New site password (rotated login).",
    ],
  },
  {
    version: "v0.1.0",
    date: "2026-08-05",
    items: [
      "Initial +EV scanner, porting the moneyline-scanning core of sports_betting_bot.py to Next.js.",
      "De-vigged sportsbook consensus (The Odds API) compared against live Kalshi and Polymarket prices for MLB/NBA/WNBA/NFL/EPL/MLS.",
      "Quarter-Kelly staking against a $250 per-platform bankroll; \"suggested\" band matches the original -200 to -1000 favorite filter.",
      "Fixed three matching bugs found while testing against live data: Kalshi's status=open filter returning the wrong market set, Kalshi's close_time being days after the actual game, and Polymarket spread markets being mistaken for moneylines.",
      "Password-gated (fresh password, not the original plaintext scheme) and deployed to Vercel.",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="wrap">
      <div className="top">
        <div className="brand">
          <h1>Patch Notes</h1>
        </div>
        <Link href="/" className="nav-link">← Back to scanner</Link>
      </div>
      <div className="sub">Sports Betting +EV Scanner</div>

      <div className="panel">
        {ENTRIES.map((e) => (
          <div className="patch-entry" key={e.version}>
            <div className="patch-version">{e.version}</div>
            <div className="patch-date">{e.date}</div>
            <ul>
              {e.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
