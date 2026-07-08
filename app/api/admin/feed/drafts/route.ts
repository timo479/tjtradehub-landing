import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkFeedAuth } from "@/lib/feed-auth";

export async function GET(req: NextRequest) {
  if (!(await checkFeedAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "all";
  const impact = searchParams.get("impact");
  const symbol = searchParams.get("symbol");
  // Strip PostgREST filter meta-chars so a search term can't break the .or() syntax.
  const search = (searchParams.get("search") ?? "").replace(/[%,()]/g, " ").trim();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;

  let query = db.from("feed_posts").select("*", { count: "exact" });

  if (status !== "all") {
    query = query.eq("status", status);
  }
  if (impact) {
    query = query.eq("impact", impact);
  }
  if (symbol) {
    query = query.contains("symbols", [symbol]);
  }
  if (search) {
    // Full-table search across title + body (not just the current page).
    query = query.or(`title.ilike.%${search}%,body.ilike.%${search}%`);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("feed_posts select error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({
    items: data ?? [],
    total: count ?? 0,
    page,
    limit,
  });
}
