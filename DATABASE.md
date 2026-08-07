# DATABASE.md — sports-betting-web

**Not applicable. This application has no database.**

Verified by:
- No ORM package in `package.json`
- No schema file, migration folder, or seed script anywhere in the repository
- The only persisted configuration is two Vercel environment variables (`ODDS_API_KEY`, `SITE_PASSWORD`) — not a database in any sense
- No `process.env.*DATABASE*`/`*DB*` reference exists anywhere in source

## Actual data model

There is no stored/owned data at all. Every scan result is fetched fresh from three external APIs (The Odds API, Kalshi, Polymarket) on every request and returned directly to the client — nothing is written anywhere, nothing is cached, nothing persists between scans. The only client-side persisted value is the theme choice (`localStorage`, key `sbw-theme`).

If a future task adds real persistence (e.g., a history of past scans, bet tracking, user accounts), this file must be rewritten from scratch — do not attempt to retrofit this document.
