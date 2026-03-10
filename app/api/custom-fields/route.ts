import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const customFieldSchema = z.object({
  label: z.string().min(1, "label is required").max(100),
  field_type: z.enum(["text", "number", "boolean", "select", "multiselect", "date"]),
  options: z.array(z.string().max(200)).optional().nullable(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await db
    .from("custom_fields")
    .select("*")
    .eq("user_id", session.user.id)
    .order("order_index", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const result = customFieldSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const { label, field_type, options } = result.data;

  const { data: existing } = await db
    .from("custom_fields")
    .select("order_index")
    .eq("user_id", session.user.id)
    .order("order_index", { ascending: false })
    .limit(1)
    .single();

  const order_index = (existing?.order_index ?? -1) + 1;

  const { data, error } = await db
    .from("custom_fields")
    .insert({ user_id: session.user.id, label, field_type, options, order_index })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
