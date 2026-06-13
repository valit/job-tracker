import { NextRequest, NextResponse } from "next/server";
import { notion, JOBS_DB, parseJob } from "@/lib/notion";

export async function GET() {
  try {
    const response = await notion.dataSources.query({
      data_source_id: JOBS_DB,
    });
    return NextResponse.json((response as any).results.map(parseJob));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const properties: Record<string, any> = {
      Name: { title: [{ text: { content: body.name || "" } }] },
      Notes: { rich_text: [{ text: { content: body.notes || "" } }] },
    };
    if (body.status) properties.Status = { select: { name: body.status } };
    if (body.companyId) properties.Company = { relation: [{ id: body.companyId }] };
    if (body.location) properties.Location = { rich_text: [{ text: { content: body.location } }] };

    const page = await notion.pages.create({
      parent: { data_source_id: JOBS_DB } as any,
      properties,
    });
    return NextResponse.json(parseJob(page));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
