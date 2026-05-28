import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  const { data: updated, error } = await db
    .from("newsletters")
    .update({
      status: "failed",
      error_message: `Discarded by admin (${session.user.email})`,
    })
    .eq("id", id)
    .eq("status", "pending_approval")
    .select("id")
    .single();

  if (error || !updated) {
    return NextResponse.json(
      { error: "Newsletter not found or not in pending_approval state" },
      { status: 409 },
    );
  }

  return NextResponse.json({ success: true });
}
