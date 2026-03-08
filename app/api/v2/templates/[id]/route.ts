import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { data, error } = await db
    .from("journal_templates")
    .select(`*, template_sections(*, template_fields(*))`)
    .eq("id", id)
    .eq("user_id", session.user.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Check if frozen
  const { data: existing } = await db
    .from("journal_templates")
    .select("is_frozen, version")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .single();

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, sections } = await req.json();

  if (existing.is_frozen) {
    // Create new version instead of editing
    const { data: newTemplate, error: tErr } = await db
      .from("journal_templates")
      .insert({
        user_id: session.user.id,
        name,
        version: existing.version + 1,
        is_active: true,
      })
      .select()
      .single();

    if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });

    // Deactivate old
    await db.from("journal_templates").update({ is_active: false }).eq("id", id);

    // Create sections + fields for new version
    for (let si = 0; si < sections.length; si++) {
      const sec = sections[si];
      const { data: section } = await db
        .from("template_sections")
        .insert({ template_id: newTemplate.id, name: sec.name, order_index: si })
        .select().single();

      if (section && sec.fields?.length) {
        await db.from("template_fields").insert(
          sec.fields.map((f: { label: string; field_type: string; is_required: boolean; options?: string[] }, fi: number) => ({
            template_id: newTemplate.id,
            section_id: section.id,
            label: f.label,
            field_type: f.field_type,
            is_required: f.is_required ?? false,
            options: f.options ?? null,
            order_index: fi,
          }))
        );
      }
    }

    const { data: full } = await db
      .from("journal_templates")
      .select(`*, template_sections(*, template_fields(*))`)
      .eq("id", newTemplate.id)
      .single();

    return NextResponse.json({ new_version: true, template: full });
  }

  // Not frozen – edit in place
  await db.from("journal_templates").update({ name }).eq("id", id);
  await db.from("template_sections").delete().eq("template_id", id);

  for (let si = 0; si < sections.length; si++) {
    const sec = sections[si];
    const { data: section } = await db
      .from("template_sections")
      .insert({ template_id: id, name: sec.name, order_index: si })
      .select().single();

    if (section && sec.fields?.length) {
      await db.from("template_fields").insert(
        sec.fields.map((f: { label: string; field_type: string; is_required: boolean; options?: string[] }, fi: number) => ({
          template_id: id,
          section_id: section.id,
          label: f.label,
          field_type: f.field_type,
          is_required: f.is_required ?? false,
          options: f.options ?? null,
          order_index: fi,
        }))
      );
    }
  }

  const { data: full } = await db
    .from("journal_templates")
    .select(`*, template_sections(*, template_fields(*))`)
    .eq("id", id)
    .single();

  return NextResponse.json({ new_version: false, template: full });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { error } = await db
    .from("journal_templates")
    .delete()
    .eq("id", id)
    .eq("user_id", session.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
