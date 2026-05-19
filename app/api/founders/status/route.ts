import { getFounderStats } from "@/lib/founders";
import { NextResponse } from "next/server";

// Public endpoint — used by /founders landing live counter (polled).
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await getFounderStats();
    return NextResponse.json(stats, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[/api/founders/status] error:", err);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
