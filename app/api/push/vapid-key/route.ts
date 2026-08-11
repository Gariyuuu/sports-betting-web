import { NextRequest, NextResponse } from "next/server";
import { authCookieName, isValidCookieToken } from "@/lib/auth";

// Cookie-gated like every other route in this app (see CLAUDE.md's
// "Auth checks appear in two places by design" convention -- this repo
// has no middleware.ts, so each route checks for itself). The VAPID
// public key itself isn't sensitive (it's sent to the push service on
// every subscribe() call from any client), gating it anyway just keeps
// the "every route checks the cookie" invariant simple and uniform.
export async function GET(req: NextRequest) {
  const token = req.cookies.get(authCookieName())?.value;
  if (!isValidCookieToken(token)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ publicKey: process.env.VAPID_PUBLIC_KEY || "" });
}
