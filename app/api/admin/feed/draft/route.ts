import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkFeedAuth } from "@/lib/feed-auth";

const ALLOWED_SYMBOLS = new Set([
  "EURUSD","GBPUSD","USDJPY","USDCHF","USDCAD","AUDUSD","NZDUSD",
  "XAUUSD","XAGUSD","USOIL","BTCUSD","ETHUSD","DXY","SPX","NAS100","US30",
]);

const ALLOWED_IMPACT = new Set(["high","medium","low"]);

// Simple in-memory rate limit for n8n Bearer calls: max 60 req/min
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 60) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  if (!(await checkFeedAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit only applies to Bearer-token callers (n8n)
  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    if (!checkRateLimit(token)) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const errors: string[] = [];

  if (!body.title || typeof body.title !== "string") errors.push("title is required");
  else if (body.title.length > 120) errors.push("title max 120 characters");

  if (!body.body || typeof body.body !== "string") errors.push("body is required");

  if (!Array.isArray(body.scenarios) || body.scenarios.length < 1 || body.scenarios.length > 5) {
    errors.push("scenarios must be an array of 1-5 items");
  } else {
    for (const s of body.scenarios) {
      if (!s.if || !s.then) errors.push("each scenario needs if and then fields");
    }
  }

  if (!body.impact || !ALLOWED_IMPACT.has(body.impact as string)) {
    errors.push("impact must be high, medium, or low");
  }

  if (!Array.isArray(body.symbols) || body.symbols.length === 0) {
    errors.push("symbols must be a non-empty array");
  } else {
    const invalid = (body.symbols as string[]).filter(s => !ALLOWED_SYMBOLS.has(s));
    if (invalid.length > 0) errors.push(`invalid symbols: ${invalid.join(", ")}`);
  }

  if (!body.source || typeof body.source !== "object") {
    errors.push("source is required");
  } else {
    const src = body.source as Record<string, unknown>;
    if (!src.name) errors.push("source.name is required");
    if (!src.url) errors.push("source.url is required");
  }

  if (!body.disclaimer || typeof body.disclaimer !== "string") errors.push("disclaimer is required");
  if (!body.ai_model || typeof body.ai_model !== "string") errors.push("ai_model is required");

  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const src = body.source as { name: string; url: string };

  const { data, error } = await db
    .from("feed_posts")
    .insert({
      title: body.title as string,
      body: body.body as string,
      scenarios: body.scenarios,
      impact: body.impact as string,
      symbols: body.symbols as string[],
      source_name: src.name,
      source_url: src.url,
      disclaimer: body.disclaimer as string,
      status: "draft",
      ai_model: body.ai_model as string,
    })
    .select("id, status, created_at")
    .single();

  if (error) {
    console.error("feed_posts insert error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
