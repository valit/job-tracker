// Server-only: asks Google Drive for a file's name. Reads the name and type only, never the
// contents (permission: drive.metadata.readonly), using the owner's own Google account.
// Every failure returns null so the caller can quietly keep today's look.

import { isDriveFileId } from "./drive-link";

const DAY_MS = 24 * 60 * 60 * 1000;
const MISS_MS = 10 * 60 * 1000;

let accessToken: { value: string; expires: number } | null = null;
const names = new Map<string, { name: string | null; expires: number }>();

export function driveConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN);
}

async function getAccessToken(): Promise<string | null> {
  if (accessToken && accessToken.expires > Date.now() + 60_000) return accessToken.value;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.access_token) return null;
  accessToken = { value: data.access_token, expires: Date.now() + (Number(data.expires_in) || 3600) * 1000 };
  return accessToken.value;
}

export async function driveFileName(id: string): Promise<string | null> {
  if (!isDriveFileId(id) || !driveConfigured()) return null;
  const hit = names.get(id);
  if (hit && hit.expires > Date.now()) return hit.name;
  try {
    const token = await getAccessToken();
    if (!token) return null;
    // The ID was checked above to be letters, digits, "-" and "_" only, so this address can only
    // ever point at Google's Drive service.
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?fields=name&supportsAllDrives=true`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (res.status === 401) accessToken = null;
    // No access (403) and deleted / not found (404) are remembered briefly; other failures are not.
    if (res.status === 403 || res.status === 404) {
      names.set(id, { name: null, expires: Date.now() + MISS_MS });
      return null;
    }
    if (!res.ok) return null;
    const data = await res.json();
    const name = typeof data.name === "string" && data.name.trim() ? data.name.trim() : null;
    names.set(id, { name, expires: Date.now() + (name ? DAY_MS : MISS_MS) });
    return name;
  } catch {
    return null;
  }
}
