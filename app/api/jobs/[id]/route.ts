import { NextRequest, NextResponse } from "next/server";
import { notion, parseJob } from "@/lib/notion";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const properties: Record<string, any> = {};
    if (body.name !== undefined) properties.Name = { title: [{ text: { content: body.name } }] };
    if (body.status !== undefined) properties.Status = { select: { name: body.status } };
    if (body.notes !== undefined) properties.Notes = { rich_text: [{ text: { content: body.notes } }] };
    if (body.location !== undefined) properties.Location = { rich_text: [{ text: { content: body.location } }] };
    if (body.archived !== undefined) properties.Archived = { checkbox: body.archived };
    if (body.companyId !== undefined) properties.Company = body.companyId ? { relation: [{ id: body.companyId }] } : { relation: [] };
    const page = await notion.pages.update({ page_id: id, properties });
    return NextResponse.json(parseJob(page));
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
