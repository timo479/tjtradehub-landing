import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await db
    .from("feed_posts")
    .select("id,title,body,scenarios,impact,symbols,source_name,source_url,disclaimer,published_at,ai_model")
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
