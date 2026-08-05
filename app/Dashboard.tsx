"use client";

import { useState } from "react";
import { SPORTS } from "@/lib/sports";
import type { Pick } from "@/lib/types";

interface ScanResult {
  sport: string;
  eventsScanned: number;
  eventsInWindow: number;
  suggested: Pick[];
  other: Pick[];
  ts: number;
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function PickTable({ picks, title }: { picks: Pick[]; title: string }) {
  return (
    <div className="panel">
      <h2>{title} ({picks.length})</h2>
      {picks.length === 0 ? (
        <div className="empty">No picks here right now.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Platform</th>
                <th>Side</th>
                <th>Price</th>
                <th>Fair</th>
                <th>Edge</th>
                <th>EV/$1</th>
                <th>Kelly stake</th>
                <th>Market</th>
              </tr>
            </thead>
            <tbody>
              {picks.map((p, i) => (
                <tr key={i}>
                  <td>{fmtWhen(p.commenceTime)}</td>
                  <td><span className={`pill ${p.platform.toLowerCase()}`}>{p.platform}</span></td>
                  <td>{p.side}</td>
                  <td>{pct(p.price)}</td>
                  <td>{pct(p.fairProb)}</td>
                  <td className="pos">+{pct(p.edgePct)}</td>
                  <td className="pos">+{pct(p.evPerDollar)}</td>
                  <td>${p.kellyStake.toFixed(2)}</td>
                  <td>{p.marketTitle}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [sport, setSport] = useState(SPORTS[0].key);
  const [allDates, setAllDates] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);

  async function scan() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/scan?sport=${sport}&allDates=${allDates}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `error ${res.status}`);
        setResult(null);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wrap">
      <div className="banner">
        <strong>v1 scope:</strong> moneyline only, on MLB/NBA/WNBA/NFL/EPL/MLS, matched against Kalshi + Polymarket
        by best-effort team-name matching. Tennis/boxing (rotating Odds API keys), alt-line/BTTS enrichment,
        season-record context, and the chat assistant from the original bot aren&apos;t ported yet.
      </div>

      <h1>Sports Betting +EV Scanner</h1>
      <div className="sub">De-vigged sportsbook consensus vs. live Kalshi &amp; Polymarket prices.</div>

      <div className="panel">
        <h2>Scan</h2>
        <div className="controls-grid">
          <div>
            <label>Sport</label>
            <select value={sport} onChange={(e) => setSport(e.target.value)}>
              {SPORTS.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Date window</label>
            <select value={allDates ? "all" : "soon"} onChange={(e) => setAllDates(e.target.value === "all")}>
              <option value="soon">Today &amp; tomorrow</option>
              <option value="all">All upcoming</option>
            </select>
          </div>
        </div>
        <div className="row">
          <button className="primary" onClick={scan} disabled={loading}>
            {loading ? "Scanning…" : "Scan"}
          </button>
          {result && (
            <span className="sub" style={{ margin: 0 }}>
              {result.eventsInWindow}/{result.eventsScanned} events in window · updated{" "}
              {new Date(result.ts).toLocaleTimeString()}
            </span>
          )}
        </div>
        {error && <p style={{ color: "var(--red)", fontSize: 13, marginTop: 10 }}>{error}</p>}
      </div>

      {result && (
        <>
          <PickTable picks={result.suggested} title="Suggested bets (favorite -200 to -1000)" />
          <PickTable picks={result.other} title="Other positive-edge picks" />
        </>
      )}

      <footer>
        Fair probability = average de-vigged sportsbook consensus (The Odds API, moneyline). Kelly stake = quarter-Kelly
        against a $250 bankroll per platform. Nothing here places real bets — it only reads public odds/market data.
      </footer>
    </div>
  );
}
