import { NextRequest, NextResponse } from "next/server";
import { authCookieName, isValidCookieToken } from "@/lib/auth";
import { removeSubscription } from "@/lib/pushSubscriptions";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(authCookieName())?.value;
  if (!isValidCookieToken(token)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  if (!body?.endpoint) {
    return NextResponse.json({ error: "missing endpoint" }, { status: 400 });
  }

  await removeSubscription(body.endpoint);
  return NextResponse.json({ subscribed: false });
}
