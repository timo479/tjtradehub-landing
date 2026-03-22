import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const { data: target } = await db.from("users").select("id, email").eq("id", id).single();
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const token = randomUUID();
  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

  await db.from("users").update({
    impersonate_token: token,
    impersonate_token_expires: expires,
  }).eq("id", id);

  // Log action
  await db.from("admin_activity_log").insert({
    admin_email: session.user.email ?? "unknown",
    target_email: target.email,
    action: "impersonate",
  });

  return NextResponse.json({ token });
}
