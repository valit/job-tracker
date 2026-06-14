import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

const COOKIE = "jobtracker_auth";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

function makeToken(password: string): string {
  return createHash("sha256").update(password + ":jobtracker").digest("hex");
}

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const expected = process.env.APP_PASSWORD;

  if (!expected || password !== expected) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, makeToken(password), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS,
  });
  return res;
}
