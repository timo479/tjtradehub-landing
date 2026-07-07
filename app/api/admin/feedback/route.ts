import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const STATUSES = ["new", "in_progress", "closed"] as const;

// GET /api/admin/feedback?status=new|in_progress|closed|all
// Returns the feedback list (optionally filtered) + per-status counts for the tabs/badge.
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let query = db
    .from("feedback")
    .select("id, user_id, user_email, message, category, page_url, status, admin_note, created_at")
    .order("created_at", { ascending: false });

  if (status && (STATUSES as readonly string[]).includes(status)) {
    query = query.eq("status", status);
  }

  const { data: items, error } = await query;
  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });

  // Join user names for display (feedback stores email; name comes from users).
  const ids = [...new Set((items ?? []).map((i) => i.user_id))];
  const nameMap: Record<string, string> = {};
  if (ids.length) {
    const { data: users } = await db.from("users").select("id, name").in("id", ids);
    for (const u of users ?? []) nameMap[u.id] = u.name;
  }

  // Per-status counts for the filter tabs.
  const { data: allStatuses } = await db.from("feedback").select("status");
  const counts = { all: 0, new: 0, in_progress: 0, closed: 0 } as Record<string, number>;
  for (const row of allStatuses ?? []) {
    counts.all++;
    if (row.status in counts) counts[row.status]++;
  }

  const result = (items ?? []).map((i) => ({ ...i, user_name: nameMap[i.user_id] ?? null }));

  return NextResponse.json({ items: result, counts });
}
