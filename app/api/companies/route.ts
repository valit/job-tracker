import { NextRequest, NextResponse } from "next/server";
import { notion, COMPANIES_DB, parseCompany } from "@/lib/notion";

export async function GET() {
  try {
    const response = await notion.dataSources.query({
      data_source_id: COMPANIES_DB,
    });
    return NextResponse.json((response as any).results.map(parseCompany));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const page = await notion.pages.create({
      parent: { data_source_id: COMPANIES_DB } as any,
      properties: {
        // Existing Notion Companies DB uses "Company" as the title property name
        Company: { title: [{ text: { content: body.name || "" } }] },
        Notes: { rich_text: [{ text: { content: body.notes || "" } }] },
      },
    });
    return NextResponse.json(parseCompany(page));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
