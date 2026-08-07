# ROADMAP.md — sports-betting-web

No time estimates exist anywhere in this repository's history, so none are invented here.

## Current milestone

**v0.4.0 — shipped.** Theme wheel, real PNG backgrounds, real app icon, cross-theme bug fix. Current live state.

## Next milestone

None defined by the user.

## MVP completion

**Already reached.** The v1 scope (moneyline scanning across 6 sports, matched against Kalshi + Polymarket, password-gated) was the explicit ask and is complete and deployed.

## Post-MVP

Candidate ideas, none committed to, none started:

| Idea | Priority | Status | Dependencies | Difficulty | Risk | Definition of done |
|---|---|---|---|---|---|---|
| `middleware.ts` for centralized auth | Medium (Inferred) | Not started | None | Low | Low | Any new route is protected by default |
| Improved team-name matching (alias table) | Medium (Inferred) | Not started | None | Medium | Low | City-collision teams (LA, NY, Chicago) match correctly |
| Tennis/boxing support | Low (matches original bot's scope, but explicitly deferred for v1) | Not started | Rotating Odds API tournament keys — more complex than the fixed sport-key model currently used | High | Medium | Tennis/boxing scan works as reliably as the current 6 sports |
| Alt-line (spread/total/BTTS) enrichment | Low | Not started | Extra Odds API calls per event (cost implication) | Medium | Medium (API cost) | Matches original bot's alt-market output |
| Season-record "hit rate" context | Low | Not started | ESPN/MLB Stats API/tennis-data.co.uk integrations (present in the original Python bot, not ported) | Medium | Low | Picks show a hit-rate column like the original |
| Chat assistant | Low | Not started | Anthropic API key + tool-calling loop (present in the original Python bot) | High | Medium (new API cost + key management) | Chat can answer questions about current picks |
| Automated tests | Medium (Inferred) | Not started | Choose a test runner | Low–Medium | Low | De-vig/EV/Kelly math and matching heuristics have unit tests |

## Long-term ideas

- Rotating the reused `ODDS_API_KEY` away from the key flagged in the sibling repo's security history (user's call, not urgent — see `CLAUDE.md`).
- Real bet placement via Kalshi/Polymarket APIs — **explicitly out of scope**, would be a fundamentally different, much higher-risk product (handling real money, real order APIs, real account credentials) than "find opportunities."

## Optional improvements

- `.env.example` (T-001 in `TASKS.md`).
- Set env vars for Preview/Development on Vercel (T-002).
- Run `npm run lint` and address findings.

## Out-of-scope features

- User accounts / multi-tenant support.
- Real money bet placement.
- Mobile native app.
- Sports/leagues beyond what's in `lib/sports.ts` unless explicitly re-verified against live APIs first.
