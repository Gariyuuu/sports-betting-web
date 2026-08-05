import { NextRequest, NextResponse } from "next/server";
import { authCookieName, checkPassword, isAuthEnabled, tokenForPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!isAuthEnabled()) {
    return NextResponse.json({ ok: true });
  }

  const body = await req.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";

  if (!checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 1000));
    return NextResponse.json({ error: "wrong password" }, { status: 403 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(authCookieName(), tokenForPassword(password), {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
