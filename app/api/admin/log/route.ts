import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: logs } = await db
    .from("admin_activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({ logs: logs ?? [] });
}
