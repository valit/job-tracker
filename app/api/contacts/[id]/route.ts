import { NextRequest, NextResponse } from "next/server";
import { notion, parseContact } from "@/lib/notion";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const properties: Record<string, any> = {};
    if (body.name !== undefined) properties.Name = { title: [{ text: { content: body.name } }] };
    if (body.role !== undefined) properties.Role = { rich_text: [{ text: { content: body.role } }] };
    if (body.notes !== undefined) properties.Notes = { rich_text: [{ text: { content: body.notes } }] };
    if (body.email !== undefined) properties.Email = { email: body.email || null };
    if (body.phone !== undefined) properties.Phone = { phone_number: body.phone || null };
    if (body.linkedin !== undefined) properties.LinkedIn = { url: body.linkedin || null };
    if (body.relationship !== undefined) properties.Relationship = { select: { name: body.relationship } };
    if (body.companyId !== undefined) properties.Company = { relation: body.companyId ? [{ id: body.companyId }] : [] };

    const page = await notion.pages.update({ page_id: id, properties });
    return NextResponse.json(parseContact(page));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await notion.pages.update({ page_id: id, archived: true });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
