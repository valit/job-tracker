import { NextRequest, NextResponse } from "next/server";
import { notion, COMPANIES_DB, parseCompany } from "@/lib/notion";

export async function GET() {
  try {
    const response = await notion.dataSources.query({
      data_source_id: COMPANIES_DB,
      sorts: [{ property: "Company", direction: "ascending" }],
    });
    const companies = (response as any).results.map(parseCompany);
    return NextResponse.json(companies);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const properties: Record<string, any> = {
      Company: { title: [{ text: { content: body.name || "" } }] },
      Role: { rich_text: [{ text: { content: body.role || "" } }] },
      Location: { rich_text: [{ text: { content: body.location || "" } }] },
      Notes: { rich_text: [{ text: { content: body.notes || "" } }] },
    };
    if (body.status) properties.Status = { select: { name: body.status } };
    if (body.jobUrl) properties["Job URL"] = { url: body.jobUrl };
    if (body.priority) properties.Priority = { select: { name: body.priority } };
    if (body.appliedDate) properties["Applied Date"] = { date: { start: body.appliedDate } };

    const page = await notion.pages.create({
      parent: { data_source_id: COMPANIES_DB } as any,
      properties,
    });
    return NextResponse.json(parseCompany(page));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
