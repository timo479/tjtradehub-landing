import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const VALID_PHASES = ["vor", "waehrend", "nach"] as const;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { template_id, phase, text, sort_order } = body;

  if (!template_id || typeof template_id !== "string") return NextResponse.json({ error: "template_id is required" }, { status: 400 });
  if (!VALID_PHASES.includes(phase)) return NextResponse.json({ error: "invalid phase" }, { status: 400 });
  if (!text || typeof text !== "string" || !text.trim()) return NextResponse.json({ error: "text is required" }, { status: 400 });

  // Verify template belongs to user
  const { data: tmpl } = await db
    .from("checklist_templates")
    .select("id")
    .eq("id", template_id)
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (!tmpl) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  const { data, error } = await db
    .from("checklist_items")
    .insert({
      template_id,
      user_id: session.user.id,
      phase,
      text: text.trim(),
      required: false,
      sort_order: typeof sort_order === "number" ? sort_order : 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
