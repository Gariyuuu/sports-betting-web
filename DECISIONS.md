# DECISIONS.md — sports-betting-web

Architectural decision log. Evidence trail is commit history plus direct source inspection. **Verified** = directly evidenced by commit messages/code comments/explicit constraints found in the repo. **Inferred** = reasonable reconstruction without a direct textual source. Nothing here is fabricated.

---

### D-001 — v1 scope deliberately narrower than the original Python bot

- **Status:** Accepted, foundational.
- **Context:** The original `sports_betting_bot.py` supports tennis/boxing (rotating Odds API keys), alt-line (spread/total/BTTS) enrichment, season-record "hit rate" context, and an Anthropic-powered chat assistant.
- **Decision:** This web port implements only moneyline scanning across 6 fixed-key sports (MLB, NBA, WNBA, NFL, EPL, MLS), with none of the above extras.
- **Reasoning (Verified — stated explicitly in the in-app banner text on `Dashboard.tsx` and the header comment in `lib/sports.ts`):** Get a working, verified-against-live-data core shipped first; treat the rest as optional follow-ups, not blockers.
- **Alternatives considered:** Porting everything at once (rejected — higher risk of shipping something that doesn't actually work against live APIs, given how many surprises the 3 supported integrations already produced — see D-005/D-006/D-007).
- **Consequences:** Feature parity with the original bot is intentionally incomplete. See `ROADMAP.md` "Post-MVP" for what's deferred.
- **Affected files:** `lib/sports.ts` (only 6 sports, not tennis/boxing), no alt-market/season-record/chat code exists anywhere in this repo.

---

### D-002 — Sport identifiers (Odds API key, Kalshi series ticker, Polymarket tag) verified live, not guessed

- **Status:** Accepted, foundational.
- **Context:** Getting these three identifiers wrong per sport would silently produce empty or wrong results with no error.
- **Decision:** Every `oddsKey`/`kalshiSeries`/`polyTag` in `lib/sports.ts` was checked against the real, live API (via `curl`) during development before being hardcoded, rather than guessed from naming conventions.
- **Reasoning (Verified — this was necessary specifically because naming conventions turned out to be unreliable, e.g. Kalshi's NBA series ticker (`KXNBAGAME`) returned zero markets during an off-season check, which is expected/correct, not a bug, but demonstrates why guessing without checking is risky):** A wrong ticker/tag fails silently (empty results, not an error), which is worse than a loud failure — it looks like "no picks today" instead of "this is broken."
- **Alternatives considered:** Trusting documentation/naming patterns without live verification (rejected after the pattern of surprises in D-005/D-006/D-007 became clear).
- **Consequences:** Adding a 7th sport must repeat this same live-verification step, not just copy a guessed pattern.
- **Affected files:** `lib/sports.ts`.

---

### D-003 — Password gate exists specifically because of API cost, not user-data privacy

- **Status:** Accepted, foundational.
- **Context:** Unlike a typical login wall protecting user data, this app has no user data to protect. The Odds API costs real money/credits per call.
- **Decision:** A single shared password (not per-user accounts) gates the entire app.
- **Reasoning (Verified — stated directly in `CLAUDE.md`'s project identity and consistent with the choice of a simple shared-secret scheme rather than a full auth provider):** The threat model is "a stranger finds the URL and burns my API credits," not "protect sensitive user records" — a shared password is proportionate to that threat model; a full multi-user auth system would not be.
- **Alternatives considered:** No auth at all (rejected — direct cost exposure), a full auth provider like Clerk/Auth0 (rejected as disproportionate to the actual threat model and added complexity for a solo-user tool).
- **Consequences:** No user accounts, no roles, no per-user anything — by design, not by omission.
- **Affected files:** `lib/auth.ts`, `app/api/login/route.ts`, `app/page.tsx`, `app/api/scan/route.ts`.

---

### D-004 — 4-theme wheel, real PNG backgrounds, real favicon, CSS-variable color discipline

- **Status:** Accepted, supersedes an earlier 2-theme design. **Identical decision and reasoning to the sibling `hyperliquid-bot-web` repo's D-004/D-005/D-006/D-007** — made in the same session, for the same explicit user-stated reasons (more theme choices requested; background overlay was "barely a fade... not a png"; hardcoded colors caused a real cross-theme bug). See that repo's `DECISIONS.md` for the full writeup; the sports-betting-specific instance of the color-leak bug is D-008 below.
- **Affected files here:** `app/ThemeWheel.tsx` (themes named Stadium/Paper/Vegas/Field instead of Terminal/Paper/Matrix/Midnight), `app/globals.css`, `app/layout.tsx`, `public/bg-{dark,light,vegas,field}.png`, `app/icon.png` (a gold target/bullseye glyph, distinct from the sibling repo's candlestick glyph).

---

### D-005 — Kalshi's `status` query filter does not mean what it sounds like

- **Status:** Accepted, corrective, load-bearing.
- **Context:** Initial implementation used `?status=open` on Kalshi's `/markets` endpoint, expecting it to return currently-tradeable markets.
- **Decision:** Removed the `status` query parameter entirely; fetch all markets for the series ticker (paginated), then filter **client-side** on the market object's own `status` field equal to `"active"`.
- **Reasoning (Verified — discovered by direct `curl` testing during development, recorded as a debugging finding):** `status=open` returned a *different, further-out* set of markets (further in the future) than the markets that were actually live/tradeable for near-term games — the near-term, actually-relevant markets carried the internal status value `"active"`, not `"open"`. This is a genuine quirk of Kalshi's API, not a guess or a misunderstanding that a different approach would have avoided — it was found only by comparing raw API responses side by side.
- **Alternatives considered:** None — this was found empirically after the naive approach silently returned zero matches for known, real, near-term games.
- **Consequences:** Any future Kalshi integration work must fetch unfiltered and filter client-side, not trust the `status` query param.
- **Affected files:** `lib/kalshi.ts`.

---

### D-006 — Kalshi's `close_time` is not the game time; anchor matching on `expected_expiration_time`

- **Status:** Accepted, corrective, load-bearing.
- **Context:** Matching a Kalshi market to the correct Odds API game requires a time-proximity check (since team-name matching alone is ambiguous — see D-009). The first attempt used each market's `close_time`.
- **Decision:** Anchor the time-proximity window on `expected_expiration_time` (falling back to `close_time` if absent), with a ±30-hour window.
- **Reasoning (Verified — discovered by direct inspection of real Kalshi market objects during development):** `close_time` can be **days** after the actual game (Kalshi keeps the market open in case of postponement, per the market's own `rules_secondary` text), so using it as a proxy for "when is this game" put real games outside any reasonable matching window. `expected_expiration_time` tracks the scheduled game finish, only a few hours after the actual start — a much better anchor.
- **Alternatives considered:** Widening the window around `close_time` (rejected — the gap between `close_time` and the real game could be multiple days, which would make the window too wide to usefully disambiguate same-day double-headers or nearby games).
- **Consequences:** Any future Kalshi matching-window logic must use `expected_expiration_time` as the primary anchor.
- **Affected files:** `lib/kalshi.ts` (`candidateFairLines()`).

---

### D-007 — Polymarket spread/total markets are indistinguishable from moneylines by outcome shape alone

- **Status:** Accepted, corrective, load-bearing.
- **Context:** The first attempt identified a Polymarket "moneyline market" as any market whose two outcomes were team names (not generic "Yes"/"No").
- **Decision:** A market is only treated as the true moneyline market if `market.question` exactly equals `event.title` (case-insensitive). All matching logic in `lib/polymarket.ts` was gated on this check.
- **Reasoning (Verified — discovered by direct inspection of real Polymarket event data during development, and the exact failure mode is recorded: spread markets like "Spread: Toronto Blue Jays (-4.5)" produced absurd computed edges (30%+) because their outcome *prices* are spread-cover probabilities, not moneyline win probabilities, but they were being compared against the moneyline fair-probability value):** Polymarket represents spread/total/first-5-innings markets on the *same event* using team names as outcomes too — outcome shape alone cannot distinguish a moneyline market from a spread market on that platform. The event's own `title` field, however, always matches only the true moneyline market's `question`.
- **Alternatives considered:** Filtering by some other heuristic (market description text, absence of a line/handicap number) — not pursued once the `question === event.title` check was found to work reliably.
- **Consequences:** Any future Polymarket integration work extending to alt-markets (spreads/totals) must NOT reuse the current moneyline-detection function as-is — it deliberately excludes exactly those markets.
- **Affected files:** `lib/polymarket.ts` (`isMoneylineMarket()`).

---

### D-008 — Cross-theme hardcoded-gold-color bug (sports-betting-web instance)

- **Status:** Accepted, corrective.
- **Context:** Same root cause as the sibling repo's D-005, found independently in this repo after the 4-theme wheel shipped.
- **Decision:** `.tab.active`, `button.primary`'s shadow, and `.pick-card`'s background/border/glow in `app/globals.css` were changed from hardcoded `rgba(237,161,0,...)` to `color-mix(in srgb, var(--gold) N%, transparent)`.
- **Reasoning (Verified — found via Playwright screenshots showing the active MLB tab and would-be hero cards staying gold-tinted in the Vegas (pink) and Field (green) themes):** Same lesson as the sibling repo — literal colors silently desync from the active theme.
- **Consequences:** Same rule now applies here: no literal colors in `app/globals.css` outside a `:root[data-theme=...]` block.
- **Affected files:** `app/globals.css`.

---

### D-009 — Team-name matching uses token-overlap fuzzy matching, not a maintained alias table

- **Status:** Accepted, known limitation (not a bug).
- **Context:** The original Python bot maintains a hand-curated `TEAM_ALIASES` dict for known ambiguous cases (e.g., Kalshi abbreviating "Athletics" as "LA A", colliding with "LA Angels"/"LA Dodgers"). This web port does not have that table.
- **Decision:** Use a generic token-overlap heuristic (`lib/match.ts`): normalize text, drop short/stopword tokens, and consider two names a match if they share any remaining token (with a bidirectional check via `resolveSide()` for disambiguating between two known candidates, and a cross-check that both sides of a matchup are referenced in Kalshi's title text).
- **Reasoning (Inferred — this is a scope/effort tradeoff, not documented as an explicit user decision, but consistent with D-001's "ship a working core first" philosophy):** A generic heuristic gets most sports/teams right without the maintenance burden of a hand-curated alias table, at the cost of the known city-collision edge case.
- **Alternatives considered:** Porting the original bot's `TEAM_ALIASES` table (not done — deferred, see `ROADMAP.md`).
- **Consequences:** City-collision teams are a known, accepted source of potential mismatches. Not currently observed to have caused a wrong pick in practice this session, but not exhaustively tested against every ambiguous case either.
- **Affected files:** `lib/match.ts`.

---

### D-010 — Platform badge and glow colors chosen from a validated colorblind-safe categorical palette

- **Status:** Accepted.
- **Context:** Picks must be visually attributed to their source platform (Kalshi vs. Polymarket) at a glance, including for colorblind viewers, via the `.pill.kalshi`/`.pill.polymarket` badges.
- **Decision:** `--kalshi` (`#3987e5`, blue) and `--poly` (`#199e70`, aqua/teal) in the default (Stadium) and Field themes are not arbitrary picks — they are specific slots from a pre-validated categorical color system (slot 1 and slot 3 of an 8-hue palette whose ordering was specifically chosen and tested so that any pair among its first three slots clears a colorblind-safety threshold, which is exactly the "any two of several source badges shown together" case here). The Vegas theme's equivalents (`--kalshi: #5b9dff`, `--poly: #b9a8ff`) were re-picked to stay mutually distinguishable within that theme's pink/purple palette, though only the default/Field pair is from the literally-validated source palette.
- **Reasoning (Verified — deliberate methodological choice made when building the platform badges, not discoverable from the hex values alone):** Same reasoning as the sibling `hyperliquid-bot-web` repo's D-008 (EMA chart line colors) — picking identity colors ad hoc risks an indistinguishable pair for colorblind viewers; using a pre-validated set avoids re-deriving that from scratch.
- **Alternatives considered:** Arbitrary/aesthetic color choice (rejected for this specific "identify which of several sources" case).
- **Consequences:** If a third data-source platform is ever added (beyond Kalshi/Polymarket), pick its badge color from the same source palette's next slot (slot 2 = orange) rather than guessing, to preserve the same safety property.
- **Affected files:** `app/globals.css` (`--kalshi`/`--poly` in every theme block), used via `.pill.kalshi`/`.pill.polymarket` in `app/Dashboard.tsx`.
