import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const patchSchema = z.object({
  newsletter_opt_in: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await db
    .from("users")
    .select("newsletter_opt_in")
    .eq("id", session.user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Failed to load account" }, { status: 500 });
  }

  return NextResponse.json({ newsletter_opt_in: data.newsletter_opt_in ?? false });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const updates = parsed.data;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { error } = await db
    .from("users")
    .update(updates)
    .eq("id", session.user.id);

  if (error) {
    console.error("Account update error:", error);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

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

    // Delete nested first – best effort (log individual errors so the user still gets deleted)
    if (entryIds.length) {
      const fvErr = (await db.from("trade_field_values").delete().in("trade_id", entryIds)).error;
      if (fvErr) console.warn("[account-delete] trade_field_values:", fvErr.message);
    }
    if (templateIds.length) {
      const tfErr = (await db.from("template_fields").delete().in("template_id", templateIds)).error;
      if (tfErr) console.warn("[account-delete] template_fields:", tfErr.message);
      const tsErr = (await db.from("template_sections").delete().in("template_id", templateIds)).error;
      if (tsErr) console.warn("[account-delete] template_sections:", tsErr.message);
    }
    if (strategyIds.length) {
      const srErr = (await db.from("strategy_rules").delete().in("strategy_id", strategyIds)).error;
      if (srErr) console.warn("[account-delete] strategy_rules:", srErr.message);
    }

    // Delete top-level user data – best effort
    const teErr = (await db.from("trade_entries").delete().eq("user_id", userId)).error;
    if (teErr) console.warn("[account-delete] trade_entries:", teErr.message);
    const jtErr = (await db.from("journal_templates").delete().eq("user_id", userId)).error;
    if (jtErr) console.warn("[account-delete] journal_templates:", jtErr.message);
    const stErr = (await db.from("strategies").delete().eq("user_id", userId)).error;
    if (stErr) console.warn("[account-delete] strategies:", stErr.message);
    const cfErr = (await db.from("custom_fields").delete().eq("user_id", userId)).error;
    if (cfErr) console.warn("[account-delete] custom_fields:", cfErr.message);
    const trErr = (await db.from("trades").delete().eq("user_id", userId)).error;
    if (trErr) console.warn("[account-delete] trades:", trErr.message);
    const jcErr = (await db.from("journal_config").delete().eq("user_id", userId)).error;
    if (jcErr) console.warn("[account-delete] journal_config:", jcErr.message);

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
