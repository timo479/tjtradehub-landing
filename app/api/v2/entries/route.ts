import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await db
    .from("trade_entries")
    .select(`
      *,
      trade_field_values ( *, template_fields ( id, label, field_type ) ),
      journal_templates ( id, name, version )
    `)
    .eq("user_id", session.user.id)
    .order("trade_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { template_id, template_version, trade_date, field_values } = await req.json();

  // Create entry
  const { data: entry, error: eErr } = await db
    .from("trade_entries")
    .insert({ user_id: session.user.id, template_id, template_version, trade_date })
    .select()
    .single();

  if (eErr) return NextResponse.json({ error: eErr.message }, { status: 500 });

  // Save field values
  if (field_values && Object.keys(field_values).length) {
    await db.from("trade_field_values").insert(
      Object.entries(field_values)
        .filter(([, v]) => v !== "" && v !== null && v !== undefined)
        .map(([field_id, value]) => ({
          trade_id: entry.id,
          field_id,
          value: Array.isArray(value) ? JSON.stringify(value) : String(value),
        }))
    );
  }

  // Freeze template after first trade
  await db
    .from("journal_templates")
    .update({ is_frozen: true })
    .eq("id", template_id)
    .eq("user_id", session.user.id);

  return NextResponse.json(entry);
}
