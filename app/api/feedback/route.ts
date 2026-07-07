import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

const CATEGORIES = ["bug", "idea", "question", "other"] as const;
type Category = (typeof CATEGORIES)[number];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit per user: max 8 submissions per 10 minutes.
  const rl = rateLimit(session.user.id, "feedback", 8, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many submissions. Try again in ${rl.retryAfter} seconds.` },
      { status: 429 }
    );
  }

  let body: { message?: unknown; category?: unknown; page_url?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Validate message (server-side — client checks are cosmetic only).
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (message.length < 10) {
    return NextResponse.json({ error: "Message must be at least 10 characters." }, { status: 400 });
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: "Message is too long (max 2000 characters)." }, { status: 400 });
  }

  // Validate category against the allow-list.
  const category = body.category as Category;
  if (!CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  }

  // page_url comes from the client but is untrusted → cap length, keep as plain text.
  let page_url: string | null = typeof body.page_url === "string" ? body.page_url.slice(0, 500) : null;
  if (page_url === "") page_url = null;

  // user_id / user_email are taken from the SESSION, never from the request body.
  const { error } = await db.from("feedback").insert({
    user_id: session.user.id,
    user_email: session.user.email ?? "",
    message,
    category,
    page_url,
    status: "new",
  });

  if (error) {
    return NextResponse.json({ error: "Could not save feedback." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
