import { NextRequest, NextResponse } from "next/server";
import { notion, parseActivity } from "@/lib/notion";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const properties: Record<string, any> = {};
    if (body.notes !== undefined) properties.Notes = { rich_text: [{ text: { content: body.notes } }] };
    if (body.type !== undefined) properties.Summary = { title: [{ text: { content: body.type } }] };
    if (body.type !== undefined) properties.Type = { select: { name: body.type } };
    if (body.date !== undefined) properties.Date = body.date ? { date: { start: body.date } } : { date: null };
    if (body.jobId !== undefined) properties.Job = body.jobId ? { relation: [{ id: body.jobId }] } : { relation: [] };
    const page = await notion.pages.update({ page_id: id, properties });
    return NextResponse.json(parseActivity(page));
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
