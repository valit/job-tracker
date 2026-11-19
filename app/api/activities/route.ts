import { NextRequest, NextResponse } from "next/server";
import { notion, ACTIVITY_DB, parseActivity } from "@/lib/notion";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");

    const queryParams: any = { data_source_id: ACTIVITY_DB };
    if (jobId) {
      queryParams.filter = { property: "Job", relation: { contains: jobId } };
    }

    let results: any[] = [];
    let cursor: string | undefined;
    do {
      const response: any = await notion.dataSources.query(
        cursor ? { ...queryParams, start_cursor: cursor } : queryParams,
      );
      results = results.concat(response.results);
      cursor = response.has_more ? response.next_cursor : undefined;
    } while (cursor);

    return NextResponse.json(results.map(parseActivity));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const properties: Record<string, any> = {
      Summary: { title: [{ text: { content: body.type || "Activity" } }] },
      Notes: { rich_text: [{ text: { content: body.notes || "" } }] },
    };
    if (body.type) properties.Type = { select: { name: body.type } };
    if (body.date) properties.Date = { date: { start: body.date } };
    if (body.jobId) properties.Job = { relation: [{ id: body.jobId }] };
    if (body.link !== undefined) properties.URL = { url: body.link || null };
    properties.Order = { number: Date.now() };

    const page = await notion.pages.create({
      parent: { data_source_id: ACTIVITY_DB } as any,
      properties,
    });
    return NextResponse.json(parseActivity(page));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
