import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkFeedAuth } from "@/lib/feed-auth";

const ALLOWED_SYMBOLS = new Set([
  "EURUSD","GBPUSD","USDJPY","USDCHF","USDCAD","AUDUSD","NZDUSD",
  "XAUUSD","XAGUSD","USOIL","BTCUSD","ETHUSD","DXY","SPX","NAS100","US30",
]);
const ALLOWED_IMPACT = new Set(["high","medium","low"]);
const ALLOWED_STATUS = new Set(["draft","published","rejected"]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkFeedAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const errors: string[] = [];
  const update: Record<string, unknown> = {};

  if (body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.length > 120) {
      errors.push("title max 120 characters");
    } else {
      update.title = body.title;
    }
  }

  if (body.body !== undefined) {
    if (typeof body.body !== "string") errors.push("body must be a string");
    else update.body = body.body;
  }

  if (body.scenarios !== undefined) {
    if (!Array.isArray(body.scenarios) || body.scenarios.length < 1 || body.scenarios.length > 5) {
      errors.push("scenarios must be an array of 1-5 items");
    } else {
      update.scenarios = body.scenarios;
    }
  }

  if (body.impact !== undefined) {
    if (!ALLOWED_IMPACT.has(body.impact as string)) errors.push("impact must be high, medium, or low");
    else update.impact = body.impact;
  }

  if (body.symbols !== undefined) {
    if (!Array.isArray(body.symbols)) {
      errors.push("symbols must be an array");
    } else {
      const invalid = (body.symbols as string[]).filter(s => !ALLOWED_SYMBOLS.has(s));
      if (invalid.length > 0) errors.push(`invalid symbols: ${invalid.join(", ")}`);
      else update.symbols = body.symbols;
    }
  }

  if (body.status !== undefined) {
    if (!ALLOWED_STATUS.has(body.status as string)) {
      errors.push("status must be draft, published, or rejected");
    } else {
      update.status = body.status;
      if (body.status === "published") {
        update.published_at = new Date().toISOString();
      }
    }
  }

  if (body.source !== undefined) {
    const src = body.source as Record<string, unknown>;
    if (src.name !== undefined) update.source_name = src.name;
    if (src.url !== undefined) update.source_url = src.url;
  }

  if (body.disclaimer !== undefined) update.disclaimer = body.disclaimer;

  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await db
    .from("feed_posts")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("feed_posts update error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkFeedAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { error } = await db.from("feed_posts").delete().eq("id", id);

  if (error) {
    console.error("feed_posts delete error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
