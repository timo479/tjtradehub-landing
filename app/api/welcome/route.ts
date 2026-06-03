import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db
    .from("users")
    .update({ welcome_shown: true })
    .eq("id", session.user.id);

  return NextResponse.json({ ok: true });
}
