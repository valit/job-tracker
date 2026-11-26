// Pulls the Google Drive file ID out of a Google link. Pure text handling: nothing is fetched.
// Returns null for anything that is not a recognised Google Drive / Docs link.

const ID_RE = /^[A-Za-z0-9_-]{15,120}$/;
const GOOGLE_HOSTS = new Set(["drive.google.com", "docs.google.com"]);

export function isDriveFileId(id: string): boolean {
  return ID_RE.test(id);
}

export function driveFileId(link: string): string | null {
  let url: URL;
  try { url = new URL((link || "").trim()); } catch { return null; }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (!GOOGLE_HOSTS.has(url.hostname.toLowerCase())) return null;

  // Drop the optional account prefixes: /u/0/ and /a/example.com/
  const path = url.pathname.replace(/\/u\/\d+(?=\/)/g, "").replace(/\/a\/[^/]+(?=\/)/g, "");
  let id: string | null = null;

  // Published-to-web links (/d/e/…) carry a different kind of ID that Drive cannot look up.
  if (/\/d\/e\//.test(path)) return null;

  // docs.google.com/document/d/ID, /spreadsheets/d/ID, /presentation/d/ID, /forms/d/ID,
  // /drawings/d/ID, and drive.google.com/file/d/ID
  const d = path.match(/\/(?:document|spreadsheets|presentation|forms|drawings|file)\/d\/([^/]+)/);
  if (d) id = d[1];

  // drive.google.com/drive/folders/ID
  if (!id) {
    const f = path.match(/\/folders\/([^/]+)/);
    if (f) id = f[1];
  }

  // drive.google.com/open?id=ID, /uc?id=ID, /thumbnail?id=ID
  if (!id && /^\/(open|uc|thumbnail)\/?$/.test(path)) id = url.searchParams.get("id");

  return id && isDriveFileId(id) ? id : null;
}
