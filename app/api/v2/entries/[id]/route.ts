import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessDashboard } from "@/lib/trial";
import { NextRequest, NextResponse } from "next/server";

async function checkAccess(userId: string) {
  const { data } = await db.from("users").select("subscription_status, current_period_end, trial_ends_at").eq("id", userId).single();
  return data && canAccessDashboard(data);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await checkAccess(session.user.id)) return NextResponse.json({ error: "Subscription required" }, { status: 403 });

  const { id } = await params;
  const { trade_date, field_values } = await req.json();

  const { data: entry } = await db
    .from("trade_entries")
    .select("id")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .single();

  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.from("trade_entries").update({ trade_date }).eq("id", id);
  await db.from("trade_field_values").delete().eq("trade_id", id);

  if (field_values && Object.keys(field_values).length) {
    await db.from("trade_field_values").insert(
      Object.entries(field_values)
        .filter(([, v]) => v !== "" && v !== null && v !== undefined)
        .map(([field_id, value]) => ({
          trade_id: id,
          field_id,
          value: Array.isArray(value) ? JSON.stringify(value) : String(value),
        }))
    );
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await checkAccess(session.user.id)) return NextResponse.json({ error: "Subscription required" }, { status: 403 });

  const { id } = await params;
  const { error } = await db
    .from("trade_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", session.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
