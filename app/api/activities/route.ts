import { NextRequest, NextResponse } from "next/server";
import { notion, ACTIVITY_DB, parseActivity } from "@/lib/notion";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");

    const queryParams: any = {
      data_source_id: ACTIVITY_DB,
      sorts: [{ property: "Date", direction: "descending" }],
    };
    if (companyId) {
      queryParams.filter = { property: "Company", relation: { contains: companyId } };
    }

    const response = await notion.dataSources.query(queryParams);
    const activities = (response as any).results.map(parseActivity);
    return NextResponse.json(activities);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const properties: Record<string, any> = {
      Summary: { title: [{ text: { content: body.summary || "" } }] },
      Notes: { rich_text: [{ text: { content: body.notes || "" } }] },
    };
    if (body.type) properties.Type = { select: { name: body.type } };
    if (body.date) properties.Date = { date: { start: body.date } };
    if (body.companyId) properties.Company = { relation: [{ id: body.companyId }] };
    if (body.contactId) properties.Contact = { relation: [{ id: body.contactId }] };

    const page = await notion.pages.create({
      parent: { data_source_id: ACTIVITY_DB } as any,
      properties,
    });
    return NextResponse.json(parseActivity(page));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
