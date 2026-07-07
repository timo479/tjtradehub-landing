import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const STATUSES = ["new", "in_progress", "closed"] as const;
type Status = (typeof STATUSES)[number];

// PATCH /api/admin/feedback/:id  — update status and/or admin_note.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let body: { status?: unknown; admin_note?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const update: { status?: Status; admin_note?: string | null } = {};

  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status as Status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    update.status = body.status as Status;
  }

  if (body.admin_note !== undefined) {
    if (body.admin_note === null || body.admin_note === "") {
      update.admin_note = null;
    } else if (typeof body.admin_note === "string") {
      update.admin_note = body.admin_note.slice(0, 5000);
    } else {
      return NextResponse.json({ error: "Invalid note." }, { status: 400 });
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { data, error } = await db
    .from("feedback")
    .update(update)
    .eq("id", id)
    .select("id, status, admin_note")
    .single();

  if (error || !data) return NextResponse.json({ error: "DB error" }, { status: 500 });

  return NextResponse.json({ ok: true, item: data });
}
