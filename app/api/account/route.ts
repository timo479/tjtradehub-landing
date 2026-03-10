import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Get IDs for nested deletes
    const { data: templates } = await db
      .from("journal_templates")
      .select("id")
      .eq("user_id", userId);

    const { data: entries } = await db
      .from("trade_entries")
      .select("id")
      .eq("user_id", userId);

    const { data: strategies } = await db
      .from("strategies")
      .select("id")
      .eq("user_id", userId);

    const templateIds = templates?.map((t) => t.id) ?? [];
    const entryIds = entries?.map((e) => e.id) ?? [];
    const strategyIds = strategies?.map((s) => s.id) ?? [];

    // Delete nested first
    if (entryIds.length) {
      await db.from("trade_field_values").delete().in("trade_id", entryIds);
    }
    if (templateIds.length) {
      await db.from("template_fields").delete().in("template_id", templateIds);
      await db.from("template_sections").delete().in("template_id", templateIds);
    }
    if (strategyIds.length) {
      await db.from("strategy_rules").delete().in("strategy_id", strategyIds);
    }

    // Delete top-level user data
    await db.from("trade_entries").delete().eq("user_id", userId);
    await db.from("journal_templates").delete().eq("user_id", userId);
    await db.from("strategies").delete().eq("user_id", userId);
    await db.from("custom_fields").delete().eq("user_id", userId);
    await db.from("trades").delete().eq("user_id", userId);
    await db.from("journal_config").delete().eq("user_id", userId);

    // Finally delete the user
    const { error } = await db.from("users").delete().eq("id", userId);
    if (error) {
      console.error("User delete error:", error);
      return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Account delete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
