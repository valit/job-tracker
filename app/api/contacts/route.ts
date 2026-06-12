import { NextRequest, NextResponse } from "next/server";
import { notion, CONTACTS_DB, parseContact } from "@/lib/notion";

export async function GET() {
  try {
    const response = await notion.dataSources.query({
      data_source_id: CONTACTS_DB,
      sorts: [{ property: "Name", direction: "ascending" }],
    });
    const contacts = (response as any).results.map(parseContact);
    return NextResponse.json(contacts);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const properties: Record<string, any> = {
      Name: { title: [{ text: { content: body.name || "" } }] },
      Role: { rich_text: [{ text: { content: body.role || "" } }] },
      Notes: { rich_text: [{ text: { content: body.notes || "" } }] },
    };
    if (body.email) properties.Email = { email: body.email };
    if (body.phone) properties.Phone = { phone_number: body.phone };
    if (body.linkedin) properties.LinkedIn = { url: body.linkedin };
    if (body.relationship) properties.Relationship = { select: { name: body.relationship } };
    if (body.companyId) properties.Company = { relation: [{ id: body.companyId }] };

    const page = await notion.pages.create({
      parent: { data_source_id: CONTACTS_DB } as any,
      properties,
    });
    return NextResponse.json(parseContact(page));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
