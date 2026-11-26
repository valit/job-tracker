import { NextRequest, NextResponse } from "next/server";
import { isDriveFileId } from "@/lib/drive-link";
import { driveFileName } from "@/lib/drive";

// GET /api/drive-name?id=<Google Drive file ID> → { name: string | null }
// Sits behind the same password gate as every other route (middleware.ts). Takes only a file ID,
// never a web address, and answers { name: null } for anything that goes wrong.
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") || "";
  const name = isDriveFileId(id) ? await driveFileName(id) : null;
  return NextResponse.json(
    { name },
    // Found names are remembered by the browser for a day; misses are asked again next time.
    { headers: { "Cache-Control": name ? "private, max-age=86400" : "no-store" } },
  );
}
