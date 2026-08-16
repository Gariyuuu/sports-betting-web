"use client";

import { useState } from "react";
import Link from "next/link";
import { SPORTS } from "@/lib/sports";
import type { Pick } from "@/lib/types";
import ThemeWheel from "./ThemeWheel";
import NotificationsToggle from "./NotificationsToggle";

interface ScanResult {
  sport: string;
  eventsScanned: number;
  eventsInWindow: number;
  suggested: Pick[];
  other: Pick[];
  ts: number;
}

const MAX_EDGE_FOR_METER = 0.15;

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

function EdgeMeter({ edge }: { edge: number }) {
  const frac = Math.min(edge / MAX_EDGE_FOR_METER, 1);
  return (
    <span className="edge-meter">
      <span className="pos">+{pct(edge)}</span>
      <span className="bar"><span className="fill" style={{ width: `${frac * 100}%` }} /></span>
    </span>
  );
}

function PickCard({ pick, flashKey }: { pick: Pick; flashKey: number }) {
  return (
    <div className="pick-card">
      <div className="top-row">
        <div>
          <div className="side">{pick.side}</div>
          <div className="market">{pick.marketTitle}</div>
        </div>
        <div>
          <div className="edge-big value-flash" key={flashKey}>+{pct(pick.edgePct)}</div>
          <div className="edge-label">edge</div>
        </div>
      </div>
      <div className="stat-row">
        <span>Platform</span>
        <span className={`pill ${pick.platform.toLowerCase()}`}>{pick.platform}</span>
      </div>
      <div className="stat-row"><span>Price / Fair</span><b>{pct(pick.price)} / {pct(pick.fairProb)}</b></div>
      <div className="stat-row"><span>EV per $1</span><b className="pos">+{pct(pick.evPerDollar)}</b></div>
      <div className="stat-row"><span>Kelly stake</span><b>${pick.kellyStake.toFixed(2)}</b></div>
      <div className="stat-row"><span>When</span><b>{fmtWhen(pick.commenceTime)}</b></div>
    </div>
  );
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
                  <td><EdgeMeter edge={p.edgePct} /></td>
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

  const bestEdge = result ? [...result.suggested, ...result.other].reduce((m, p) => Math.max(m, p.edgePct), 0) : 0;

  return (
    <div className="wrap">
      <div className="top">
        <div className="brand">
          <h1>🎯 Sports Betting Scanner</h1>
        </div>
        <div className="header-actions">
          <Link href="/changelog" className="nav-link">Patch notes</Link>
          <NotificationsToggle />
          <ThemeWheel />
        </div>
      </div>
      <div className="sub">De-vigged sportsbook consensus vs. live Kalshi &amp; Polymarket prices.</div>

      <div className="banner">
        <strong>v1 scope:</strong> moneyline only, on MLB/NBA/WNBA/NFL/EPL/MLS, matched against Kalshi + Polymarket
        by best-effort team-name matching. Tennis/boxing (rotating Odds API keys), alt-line/BTTS enrichment,
        season-record context, and the chat assistant from the original bot aren&apos;t ported yet.
      </div>

      <div className="tabs">
        {SPORTS.map((s) => (
          <button key={s.key} className={`tab ${sport === s.key ? "active" : ""}`} onClick={() => setSport(s.key)}>
            <span className="emoji">{s.emoji}</span>{s.label}
          </button>
        ))}
      </div>

      <div className="panel">
        <div className="row" style={{ marginBottom: 14 }}>
          <div className="segmented">
            <button className={!allDates ? "active" : ""} onClick={() => setAllDates(false)}>Today &amp; tomorrow</button>
            <button className={allDates ? "active" : ""} onClick={() => setAllDates(true)}>All upcoming</button>
          </div>
          <span style={{ flex: 1 }} />
          <button className="primary" onClick={scan} disabled={loading}>
            {loading && <span className="scan-ring" aria-hidden="true" />}
            {loading ? "Scanning…" : "Scan"}
          </button>
        </div>
        {result && (
          <div className="scan-stats">
            <span><b>{result.eventsInWindow}</b>/{result.eventsScanned} events in window</span>
            <span><b>{result.suggested.length + result.other.length}</b> +EV picks found</span>
            {bestEdge > 0 && (
              <span>best edge <b className="pos value-flash" key={result.ts}>+{pct(bestEdge)}</b></span>
            )}
            <span>updated {new Date(result.ts).toLocaleTimeString()}</span>
          </div>
        )}
        {error && <p style={{ color: "var(--critical)", fontSize: 13, marginTop: 10 }}>{error}</p>}
      </div>

      {result && result.suggested.length > 0 && (
        <>
          <h2 style={{ fontSize: 13, color: "var(--gold-bright)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>
            🔥 Suggested bets (favorite -200 to -1000)
          </h2>
          <div className="hero-cards">
            {result.suggested.map((p, i) => <PickCard key={i} pick={p} flashKey={result.ts} />)}
          </div>
        </>
      )}

      {result && <PickTable picks={result.other} title="Other positive-edge picks" />}

      <footer>
        Fair probability = average de-vigged sportsbook consensus (The Odds API, moneyline). Kelly stake = quarter-Kelly
        against a $250 bankroll per platform. Nothing here places real bets — it only reads public odds/market data.
      </footer>
    </div>
  );
}
