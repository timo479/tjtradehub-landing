import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_PER_TRADE = 5;
const BUCKET = "trade-screenshots";

// GET – list screenshots for a trade entry
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verify ownership
  const { data: entry } = await db.from("trade_entries").select("id").eq("id", id).eq("user_id", session.user.id).single();
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: screenshots } = await db
    .from("trade_screenshots")
    .select("id, url, filename, created_at")
    .eq("trade_id", id)
    .order("created_at", { ascending: true });

  return NextResponse.json(screenshots ?? []);
}

// POST – upload a screenshot
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: tradeId } = await params;

  // Verify ownership
  const { data: entry } = await db.from("trade_entries").select("id").eq("id", tradeId).eq("user_id", session.user.id).single();
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check limit
  const { count } = await db.from("trade_screenshots").select("id", { count: "exact", head: true }).eq("trade_id", tradeId);
  if ((count ?? 0) >= MAX_PER_TRADE) {
    return NextResponse.json({ error: `Max ${MAX_PER_TRADE} screenshots per trade` }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Only images allowed" }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const filename = `${randomUUID()}.${ext}`;
  const path = `${session.user.id}/${tradeId}/${filename}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await db.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(path);
  const url = urlData.publicUrl;

  const { data: screenshot, error: dbError } = await db
    .from("trade_screenshots")
    .insert({ trade_id: tradeId, user_id: session.user.id, url, filename: file.name })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json(screenshot);
}

// DELETE – delete a screenshot by screenshot id (passed as query param)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: tradeId } = await params;
  const screenshotId = new URL(req.url).searchParams.get("screenshot_id");
  if (!screenshotId) return NextResponse.json({ error: "screenshot_id required" }, { status: 400 });

  const { data: screenshot } = await db
    .from("trade_screenshots")
    .select("url")
    .eq("id", screenshotId)
    .eq("trade_id", tradeId)
    .eq("user_id", session.user.id)
    .single();

  if (!screenshot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete from storage
  const url = new URL(screenshot.url);
  const path = url.pathname.split(`/object/public/${BUCKET}/`)[1];
  if (path) await db.storage.from(BUCKET).remove([path]);

  await db.from("trade_screenshots").delete().eq("id", screenshotId);

  return NextResponse.json({ success: true });
}
