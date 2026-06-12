import { NextRequest, NextResponse } from "next/server";
import { notion, parseCompany } from "@/lib/notion";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const properties: Record<string, any> = {};
    if (body.name !== undefined) properties.Company = { title: [{ text: { content: body.name } }] };
    if (body.status !== undefined) properties.Status = { select: { name: body.status } };
    if (body.role !== undefined) properties.Role = { rich_text: [{ text: { content: body.role } }] };
    if (body.location !== undefined) properties.Location = { rich_text: [{ text: { content: body.location } }] };
    if (body.jobUrl !== undefined) properties["Job URL"] = body.jobUrl ? { url: body.jobUrl } : { url: null };
    if (body.priority !== undefined) properties.Priority = { select: { name: body.priority } };
    if (body.notes !== undefined) properties.Notes = { rich_text: [{ text: { content: body.notes } }] };
    if (body.appliedDate !== undefined) properties["Applied Date"] = body.appliedDate ? { date: { start: body.appliedDate } } : { date: null };
    if (body.lastActivity !== undefined) properties["Last Activity"] = body.lastActivity ? { date: { start: body.lastActivity } } : { date: null };

    const page = await notion.pages.update({ page_id: id, properties });
    return NextResponse.json(parseCompany(page));
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
