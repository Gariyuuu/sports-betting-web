// Best-effort fuzzy team-name matching between The Odds API team names and
// Kalshi/Polymarket market text. This is a simplified stand-in for the
// original bot's TEAM_ALIASES + strict/loose matching — good enough for
// distinctly-named teams, but ambiguous shorthands (e.g. Kalshi abbreviating
// "Athletics" as "LA A") can still mismatch. Flagged as a known v1 gap.

const STOPWORDS = new Set([
  "the", "of", "fc", "cf", "sc", "afc", "vs", "v", "winner", "game",
  "pro", "professional", "womens", "women", "mens", "men", "will", "win",
  "baseball", "basketball", "football", "hockey", "soccer",
]);
const COMBINING_MARK_MIN = 0x0300;
const COMBINING_MARK_MAX = 0x036f;
const MIN_TOKEN_LEN = 3;

function stripDiacritics(s: string): string {
  return Array.from(s.normalize("NFD"))
    .filter((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      return code < COMBINING_MARK_MIN || code > COMBINING_MARK_MAX;
    })
    .join("");
}

export function normalize(s: string): string {
  return stripDiacritics(s.toLowerCase())
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Only tokens long enough to be distinguishing (drops "a", "la", "st", "vs"...).
function distinguishingTokens(s: string): Set<string> {
  return new Set(
    normalize(s)
      .split(" ")
      .filter((t) => t.length >= MIN_TOKEN_LEN && !STOPWORDS.has(t))
  );
}

export function teamAppearsIn(teamName: string, text: string): boolean {
  const teamTokens = distinguishingTokens(teamName);
  if (teamTokens.size === 0) return false;
  const textTokens = distinguishingTokens(text);
  for (const t of teamTokens) {
    if (textTokens.has(t)) return true;
  }
  return false;
}

// Given two team names for an event and a block of market text, returns
// which team name is referenced (or null if neither/both match ambiguously).
export function resolveSide(
  teamA: string,
  teamB: string,
  text: string
): string | null {
  const aMatch = teamAppearsIn(teamA, text);
  const bMatch = teamAppearsIn(teamB, text);
  if (aMatch && !bMatch) return teamA;
  if (bMatch && !aMatch) return teamB;
  return null;
}
