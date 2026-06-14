import { NextRequest, NextResponse } from "next/server";
import { notion, ASSETS_DB, parseAsset } from "@/lib/notion";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");

    const queryParams: any = { data_source_id: ASSETS_DB };
    if (jobId) {
      queryParams.filter = { property: "Job", relation: { contains: jobId } };
    }

    const response = await notion.dataSources.query(queryParams);
    return NextResponse.json((response as any).results.map(parseAsset));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const isPerson = body.type === "Contact";
    const properties: Record<string, any> = {
      Label: { title: [{ text: { content: body.label || body.personName || "" } }] },
    };
    if (body.type) properties.Type = { select: { name: body.type } };
    if (!isPerson && body.assetUrl) properties["URL"] = { url: body.assetUrl };
    if (isPerson) {
      if (body.personName) properties["Person Name"] = { rich_text: [{ text: { content: body.personName } }] };
      if (body.personTitle) properties["Person Title"] = { select: { name: body.personTitle } };
      if (body.personEmail) properties["Person Email"] = { email: body.personEmail };
      if (body.personPhone) properties["Person Phone"] = { phone_number: body.personPhone };
      if (body.personLinkedin) properties["Person LinkedIn"] = { url: body.personLinkedin };
      if (body.personNotes) properties["Person Notes"] = { rich_text: [{ text: { content: body.personNotes } }] };
    }
    if (body.companyId) properties.Company = { relation: [{ id: body.companyId }] };
    if (body.jobId) properties.Job = { relation: [{ id: body.jobId }] };
    if (body.activityId) properties.Activity = { relation: [{ id: body.activityId }] };

    const page = await notion.pages.create({
      parent: { data_source_id: ASSETS_DB } as any,
      properties,
    });
    return NextResponse.json(parseAsset(page));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
