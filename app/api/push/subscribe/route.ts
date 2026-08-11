import { NextRequest, NextResponse } from "next/server";
import { authCookieName, isValidCookieToken } from "@/lib/auth";
import { addSubscription, isPushConfigured } from "@/lib/pushSubscriptions";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(authCookieName())?.value;
  if (!isValidCookieToken(token)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isPushConfigured()) {
    return NextResponse.json({ error: "push storage not configured" }, { status: 503 });
  }

  const body = await req.json();
  if (!body?.endpoint || !body?.keys?.p256dh || !body?.keys?.auth) {
    return NextResponse.json({ error: "malformed subscription" }, { status: 400 });
  }

  await addSubscription({ endpoint: body.endpoint, keys: { p256dh: body.keys.p256dh, auth: body.keys.auth } });
  return NextResponse.json({ subscribed: true });
}
