# UI_SYSTEM.md — sports-betting-web

All file paths **Verified** at commit `26b6d83`; reconfirmed unchanged 2026-08-07 (checkpoint C-004).

## Layout system

Single-column, max-width-constrained (`.wrap { max-width: 1200px; margin: 0 auto; }` — wider than the sibling repo's 1100px, to comfortably fit the picks table). Defined in `app/globals.css`.

## Navigation

Three routes: `/` (gated), `/login` (public), `/changelog` (public). A "Patch notes" link in the Dashboard header goes to `/changelog`; a "← Back to scanner" link returns. No nav bar/menu beyond these.

## Page structure

`app/Dashboard.tsx` renders: header (brand + patch-notes link + theme wheel) → subtitle → v1-scope disclaimer banner → sport pill tabs (6, with emoji) → scan panel (date-window segmented control + Scan button + scan-stats row) → (conditionally, if `suggested.length > 0`) a "🔥 Suggested bets" heading + hero-card grid → "Other positive-edge picks" table → footer disclaimer.

`app/login/page.tsx` renders a centered, narrow (`maxWidth: 380`) password form.

`app/changelog/page.tsx` — identical structure to the sibling repo's changelog page.

## Reusable components

Two extracted components: `app/ThemeWheel.tsx`. `Dashboard.tsx` itself defines two small local (not separately-filed) components inline: `EdgeMeter` and `PickCard`, plus a `PickTable` — all defined as local functions within `Dashboard.tsx`, not separate files. This is a deliberate simplicity choice consistent with the sibling repo's pattern (no `components/` folder convention in either repo).

## Component hierarchy

```
RootLayout (app/layout.tsx)
└─ Page (app/page.tsx, server, auth gate)
   └─ Dashboard (app/Dashboard.tsx, client)
      ├─ ThemeWheel (app/ThemeWheel.tsx)
      ├─ PickCard (local to Dashboard.tsx, ×N for suggested picks)
      └─ PickTable → EdgeMeter (local to Dashboard.tsx)

RootLayout (app/layout.tsx)
└─ LoginPage (app/login/page.tsx)

RootLayout (app/layout.tsx)
└─ ChangelogPage (app/changelog/page.tsx)
```

## Themes

Same mechanism as the sibling repo (`[data-theme]` attribute, CSS variable blocks in `app/globals.css`, inline no-flash script in `layout.tsx`, `ThemeWheel.tsx` for switching). Four themes: `dark` (**Stadium**, default, gold/green), `light` (**Paper**, near-solid white), `vegas` (**Vegas**, pink/purple neon), `field` (**Field**, deep green turf). Variable catalogue includes `--gold`/`--gold-bright` (this repo's primary accent, analogous to the sibling repo's `--blue`), `--good`/`--good-bright`, `--critical`, `--kalshi`, `--poly` (platform badge colors), plus the same `--page`/`--surface*`/`--border*`/`--text*`/`--bg-image`/`--bg-overlay`/`--banner-*` set as the sibling repo.

**Same hard rule, same history of violating it:** every themed color must be `var(--...)` or `color-mix()` against one (see `DECISIONS.md` D-008 for the specific bug this caused here).

## Background system

Identical mechanism to the sibling repo — real PNGs in `public/bg-{dark,light,vegas,field}.png`, applied via `body::before`/`body::after` with a tuned `--bg-overlay` (see `DECISIONS.md` D-004).

## Colors

Platform badges: Kalshi = `var(--kalshi)` (blue, `#3987e5`-family), Polymarket = `var(--poly)` (green/teal, `#199e70`-family) — chosen to be visually distinct from the gold "suggested" accent and from each other.

## Typography

Same system font stack as sibling repo. `font-variant-numeric: tabular-nums` used throughout for prices/odds/stakes.

## Spacing / border-radius / shadows

Same ad hoc-but-consistent conventions as sibling repo (panel radius 12–16px, pill radius 999px).

## Breakpoints

None found in this repo's `app/globals.css` (**Verified** — unlike the sibling repo, no `@media` query exists here at all). The sport-tab row and hero-card grid rely on `flex-wrap`/`grid-template-columns: repeat(auto-fit, minmax(...))` for natural reflow instead of explicit breakpoints. Narrow-viewport behavior is therefore entirely dependent on those auto-fit/wrap rules — not independently screenshot-verified below ~1280px this session.

## Animations

None beyond what's inherited from shared button/swatch hover transitions (`transition: transform 0.15s` etc.) — no `@keyframes` exist in this repo's CSS (**Verified**, unlike the sibling repo's `pulse` animation).

## Icon system

Emoji used extensively and functionally (not decoratively) here: each sport tab has a real emoji (⚾🏀🏈⚽) from `lib/sports.ts`'s `emoji` field, plus 🎯 in the brand header and 🔥 above the suggested-bets section. The favicon (`app/icon.png`) is a procedurally-generated gold target/bullseye glyph.

## Image asset conventions

Same as sibling repo — flat `public/` folder, `app/icon.png` for the favicon convention.

## Modals / notifications

None. Errors shown inline as red text below the scan controls (`style={{ color: "var(--critical)" }}`, inline style rather than a class — minor inconsistency with the rest of the codebase's class-based styling convention, low-risk cosmetic note).

## Forms

Two: the login password form (`app/login/page.tsx`, uncontrolled-ish single `useState`), and the scan controls (sport tabs + segmented date-window control in `Dashboard.tsx` — these are buttons, not a `<form>`/native form elements, styled to look like tabs/segments).

## Loading states

"Scanning…" text on the Scan button while a request is in flight (`loading` state disables the button and swaps its label).

## Empty states

"No picks here right now." shown per results section (`PickTable`) if that bucket has zero picks.

## Error states

Inline red text below the scan controls (see Modals/notifications above) for any `error` state — covers auth failures, unknown sport, missing key, and Odds API errors uniformly (all surfaced as the same generic red message text from whatever `error` string the API returned).

## Accessibility

Same `ThemeWheel` ARIA pattern as sibling repo (`role="radiogroup"`/`role="radio"`/`aria-checked`). No other explicit ARIA authoring found. Not tested with assistive tech.

## Browser support

Same `color-mix()` CSS-feature dependency as sibling repo (**Inferred** modern-browser requirement, not stated in repo).

## Known visual inconsistencies

None currently open (the one found this session — hardcoded gold in non-gold themes — was fixed in commit `26b6d83`). Minor, non-blocking cosmetic note: the error-message styling uses an inline `style` prop instead of a CSS class, unlike everywhere else in the codebase.
