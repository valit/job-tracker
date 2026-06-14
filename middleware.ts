import { NextRequest, NextResponse } from "next/server";

const COOKIE = "jobtracker_auth";

async function expectedToken(): Promise<string> {
  const password = process.env.APP_PASSWORD ?? "";
  const data = new TextEncoder().encode(password + ":jobtracker");
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow login page and login API
  if (pathname === "/login" || pathname === "/api/login") {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE)?.value;
  const expected = await expectedToken();
  const valid = token === expected;

  if (valid) return NextResponse.next();

  // API routes → 401
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Pages → redirect to /login
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt).*)",
  ],
};
