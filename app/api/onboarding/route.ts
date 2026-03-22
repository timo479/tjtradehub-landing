import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { tour } = body;

  if (tour !== "dashboard" && tour !== "journal" && tour !== "charts") {
    return NextResponse.json({ error: "Invalid tour" }, { status: 400 });
  }

  const field = tour === "dashboard" ? "onboarding_completed" : tour === "journal" ? "journal_tour_completed" : "charts_tour_completed";

  await db
    .from("users")
    .update({ [field]: true })
    .eq("id", session.user.id);

  return NextResponse.json({ ok: true });
}
