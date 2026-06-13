import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import fs from "fs";
import path from "path";

const TOKEN_PATH = path.resolve("/Users/valerio/email-agent/gmail-token.json");
const CREDS_PATH = path.resolve("/Users/valerio/email-agent/gmail-credentials.json");

function extractThreadId(gmailUrl: string): string | null {
  const match = gmailUrl.match(/#(?:inbox|sent|all|label\/[^/]+)\/([A-Za-z0-9]+)/);
  return match ? match[1] : null;
}

async function getAuthClient() {
  const creds = JSON.parse(fs.readFileSync(CREDS_PATH, "utf8"));
  const { client_id, client_secret } = creds.installed || creds.web;
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
  const auth = new google.auth.OAuth2(client_id, client_secret, "http://localhost:8765");
  auth.setCredentials(token);
  return auth;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  const threadId = extractThreadId(url);
  if (!threadId) return NextResponse.json({ error: "Could not extract thread ID" }, { status: 400 });

  try {
    const auth = await getAuthClient();
    const gmail = google.gmail({ version: "v1", auth });
    const thread = await gmail.users.threads.get({ userId: "me", id: threadId, format: "metadata", metadataHeaders: ["Subject"] });
    const headers = thread.data.messages?.[0]?.payload?.headers ?? [];
    const subject = headers.find((h: any) => h.name === "Subject")?.value ?? "";
    return NextResponse.json({ subject });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
