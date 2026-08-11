import { NextRequest, NextResponse } from "next/server";
import { sportByKey } from "@/lib/sports";
import { runScan, OddsApiError } from "@/lib/runScan";
import { authCookieName, isValidCookieToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(authCookieName())?.value;
  if (!isValidCookieToken(token)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  const sportKey = params.get("sport") ?? "";
  const allDates = params.get("allDates") === "true";

  const sport = sportByKey(sportKey);
  if (!sport) {
    return NextResponse.json({ error: `unknown sport "${sportKey}"` }, { status: 400 });
  }

  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ODDS_API_KEY is not configured on this deployment yet. Add it in Vercel project settings." },
      { status: 501 }
    );
  }

  try {
    const result = await runScan(sport, apiKey, allDates);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof OddsApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status === 401 ? 502 : err.status });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown error" },
      { status: 502 }
    );
  }
}
