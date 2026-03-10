import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Delete in order to respect FK constraints
  await db.from("trade_field_values").delete().in(
    "trade_id",
    (await db.from("trade_entries").select("id").eq("user_id", userId)).data?.map(e => e.id) ?? []
  );
  await db.from("trade_entries").delete().eq("user_id", userId);
  await db.from("strategy_rules").delete().in(
    "strategy_id",
    (await db.from("strategies").select("id").eq("user_id", userId)).data?.map(s => s.id) ?? []
  );
  await db.from("strategies").delete().eq("user_id", userId);
  await db.from("custom_fields").delete().eq("user_id", userId);
  await db.from("trades").delete().eq("user_id", userId);
  await db.from("template_fields").delete().in(
    "template_id",
    (await db.from("journal_templates").select("id").eq("user_id", userId)).data?.map(t => t.id) ?? []
  );
  await db.from("template_sections").delete().in(
    "template_id",
    (await db.from("journal_templates").select("id").eq("user_id", userId)).data?.map(t => t.id) ?? []
  );
  await db.from("journal_templates").delete().eq("user_id", userId);
  await db.from("users").delete().eq("id", userId);

  return NextResponse.json({ success: true });
}
