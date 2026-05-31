import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;

  const impacts = searchParams.getAll("impact");
  const symbols = searchParams.getAll("symbol");

  let query = db
    .from("feed_posts")
    .select("id,title,body,scenarios,impact,symbols,source_name,source_url,disclaimer,published_at,ai_model", { count: "exact" })
    .eq("status", "published");

  if (impacts.length > 0) {
    query = query.in("impact", impacts);
  }
  if (symbols.length > 0) {
    query = query.overlaps("symbols", symbols);
  }

  const { data, error, count } = await query
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("feed GET error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({
    items: data ?? [],
    total: count ?? 0,
    page,
    limit,
  });
}
