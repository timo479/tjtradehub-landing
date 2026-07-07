import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/admin/feedback/count — lightweight "new" count for the nav badge.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { count } = await db
    .from("feedback")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");

  return NextResponse.json({ new: count ?? 0 });
}
