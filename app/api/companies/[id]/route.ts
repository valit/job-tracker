import { NextRequest, NextResponse } from "next/server";
import { notion, parseCompany } from "@/lib/notion";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const properties: Record<string, any> = {};
    if (body.name !== undefined) properties.Company = { title: [{ text: { content: body.name } }] };
    if (body.notes !== undefined) properties.Notes = { rich_text: [{ text: { content: body.notes } }] };
    if (body.logoUrl !== undefined) properties["Logo URL"] = { url: body.logoUrl || null };
    if (body.links !== undefined) properties.Links = { rich_text: [{ text: { content: JSON.stringify(body.links) } }] };
    const page = await notion.pages.update({ page_id: id, properties });
    return NextResponse.json(parseCompany(page));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await notion.pages.update({ page_id: id, in_trash: true });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
