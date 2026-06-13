import { NextRequest, NextResponse } from "next/server";
import { notion, parseAsset } from "@/lib/notion";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const properties: Record<string, any> = {};
    if (body.label !== undefined) properties.Label = { title: [{ text: { content: body.label } }] };
    if (body.type !== undefined) properties.Type = { select: { name: body.type } };
    if (body.assetUrl !== undefined) properties["URL"] = body.assetUrl ? { url: body.assetUrl } : { url: null };
    if (body.personName !== undefined) properties["Person Name"] = { rich_text: [{ text: { content: body.personName } }] };
    if (body.personTitle !== undefined) properties["Person Title"] = body.personTitle ? { select: { name: body.personTitle } } : { select: null };
    if (body.personEmail !== undefined) properties["Person Email"] = body.personEmail ? { email: body.personEmail } : { email: null };
    if (body.personPhone !== undefined) properties["Person Phone"] = body.personPhone ? { phone_number: body.personPhone } : { phone_number: null };
    if (body.personLinkedin !== undefined) properties["Person LinkedIn"] = body.personLinkedin ? { url: body.personLinkedin } : { url: null };
    if (body.personNotes !== undefined) properties["Person Notes"] = { rich_text: [{ text: { content: body.personNotes } }] };
    if (body.companyId !== undefined) properties.Company = body.companyId ? { relation: [{ id: body.companyId }] } : { relation: [] };
    if (body.jobId !== undefined) properties.Job = body.jobId ? { relation: [{ id: body.jobId }] } : { relation: [] };
    if (body.activityId !== undefined) properties.Activity = body.activityId ? { relation: [{ id: body.activityId }] } : { relation: [] };
    const page = await notion.pages.update({ page_id: id, properties });
    return NextResponse.json(parseAsset(page));
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
