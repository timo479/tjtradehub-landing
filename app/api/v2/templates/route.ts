import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const fieldSchema = z.object({
  label: z.string().min(1).max(200),
  field_type: z.string().max(50),
  is_required: z.boolean().optional(),
  options: z.array(z.string().max(200)).optional().nullable(),
});

const sectionSchema = z.object({
  name: z.string().min(1).max(200),
  fields: z.array(fieldSchema).optional(),
});

const templateSchema = z.object({
  name: z.string().min(1, "name is required").max(200),
  sections: z.array(sectionSchema).min(1, "At least one section is required"),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await db
    .from("journal_templates")
    .select(`
      *,
      template_sections (
        *,
        template_fields ( * )
      )
    `)
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const result = templateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const { name, sections } = result.data;

  // Create template
  const { data: template, error: tErr } = await db
    .from("journal_templates")
    .insert({ user_id: session.user.id, name })
    .select()
    .single();

  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });

  // Create sections + fields
  for (let si = 0; si < sections.length; si++) {
    const sec = sections[si];
    const { data: section, error: sErr } = await db
      .from("template_sections")
      .insert({ template_id: template.id, name: sec.name, order_index: si })
      .select()
      .single();

    if (sErr) continue;

    if (sec.fields?.length) {
      await db.from("template_fields").insert(
        sec.fields.map((f, fi) => ({
          template_id: template.id,
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

  // Return full template
  const { data: full } = await db
    .from("journal_templates")
    .select(`*, template_sections(*, template_fields(*))`)
    .eq("id", template.id)
    .single();

  return NextResponse.json(full);
}
