import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await db
    .from("users")
    .select("widget_layout, widget_prefs")
    .eq("id", session.user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Failed to load layout" }, { status: 500 });
  }

  return NextResponse.json({
    widget_layout: data.widget_layout ?? null,
    widget_prefs: data.widget_prefs ?? null,
  });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if ("widget_layout" in body) updates.widget_layout = body.widget_layout;
  if ("widget_prefs" in body) updates.widget_prefs = body.widget_prefs;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { error } = await db
    .from("users")
    .update(updates)
    .eq("id", session.user.id);

  if (error) {
    console.error("Layout update error:", error);
    return NextResponse.json({ error: "Failed to save layout" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
