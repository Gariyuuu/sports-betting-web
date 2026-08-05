import { createHash, timingSafeEqual } from "crypto";

const COOKIE_NAME = "sbw_auth";

function expectedToken(): string | null {
  const password = process.env.SITE_PASSWORD;
  if (!password) return null;
  return createHash("sha256").update(`sports-betting-web:${password}`).digest("hex");
}

export function authCookieName(): string {
  return COOKIE_NAME;
}

export function isAuthEnabled(): boolean {
  return !!process.env.SITE_PASSWORD;
}

export function tokenForPassword(password: string): string {
  return createHash("sha256").update(`sports-betting-web:${password}`).digest("hex");
}

export function checkPassword(password: string): boolean {
  const expected = expectedToken();
  if (!expected) return false;
  const given = tokenForPassword(password);
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function isValidCookieToken(token: string | undefined): boolean {
  const expected = expectedToken();
  if (!expected) return true; // no password configured -> open access
  if (!token) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
